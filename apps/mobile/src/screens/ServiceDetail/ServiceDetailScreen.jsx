import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from './ServiceDetailScreen.styles';
import {
    useServiceRequest,
    useCancelService,
    useMarkServiceInProgress,
} from '../../hooks/useServiceRequests';

const STATUS_BADGE_MAP = {
    CONFIRMED: { label: 'Confirmado', styleKey: 'confirmed' },
    IN_PROGRESS: { label: 'En progreso', styleKey: 'inProgress' },
    COMPLETED: { label: 'Completado', styleKey: 'completed' },
    CANCELED: { label: 'Cancelado', styleKey: 'canceled' },
};

const resolveStatusBadge = (status) => STATUS_BADGE_MAP[status] || { label: status, styleKey: 'default' };

const formatDateTime = (value) => {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    const dateOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
    };
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
    };

    const datePart = parsed.toLocaleDateString('es-AR', dateOptions);
    const timePart = parsed.toLocaleTimeString('es-AR', timeOptions);
    return `${datePart} · ${timePart}`;
};

const formatCurrency = (rawValue, currencyFallback = 'ARS') => {
    if (rawValue === null || rawValue === undefined) {
        return null;
    }

    const value = Number(rawValue);
    if (Number.isNaN(value)) {
        return null;
    }

    try {
        return value.toLocaleString('es-AR', {
            style: 'currency',
            currency: currencyFallback || 'ARS',
            minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        });
    } catch (error) {
        return `$ ${value.toFixed(0)}`;
    }
};

const extractAddressLabel = (addressSnapshot) => {
    if (!addressSnapshot || typeof addressSnapshot !== 'object') {
        return null;
    }
    const { street, title, city, state } = addressSnapshot;
    const parts = [title, street, city, state].filter(Boolean);
    if (parts.length === 0) {
        return null;
    }
    return parts.join(', ');
};

const shouldAutoMarkInProgress = (service) => {
    if (!service) {
        return false;
    }
    if (service.status !== 'CONFIRMED') {
        return false;
    }
    if (!service.scheduled_start_at) {
        return false;
    }
    const now = Date.now();
    const start = new Date(service.scheduled_start_at).getTime();
    if (Number.isNaN(start)) {
        return false;
    }
    return start <= now;
};

const ServiceDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { requestId } = route.params ?? {};

    const [autoMarkAttempted, setAutoMarkAttempted] = useState(false);

    const serviceRequestQuery = useServiceRequest(requestId, {
        enabled: Boolean(requestId),
    });
    const cancelServiceMutation = useCancelService();
    const markInProgressMutation = useMarkServiceInProgress();

    const requestData = serviceRequestQuery.data;
    const serviceData = requestData?.service ?? null;

    const providerName = useMemo(() => {
        if (!serviceData?.provider_display_name) {
            const proposal = Array.isArray(requestData?.proposals)
                ? requestData.proposals.find((item) => item.id === serviceData?.proposal_id)
                : null;
            const fallbackName = proposal?.provider_display_name ?? null;
            return fallbackName ?? 'Prestador asignado';
        }
        return serviceData.provider_display_name;
    }, [requestData?.proposals, serviceData?.provider_display_name, serviceData?.proposal_id]);

    const statusBadge = resolveStatusBadge(serviceData?.status);
    const statusBadgeStyle = styles[`statusBadge_${statusBadge.styleKey}`] || styles.statusBadge_default;
    const startLabel = formatDateTime(serviceData?.scheduled_start_at);
    const endLabel = formatDateTime(serviceData?.scheduled_end_at);
    const addressLabel = extractAddressLabel(serviceData?.address_snapshot) || requestData?.city_snapshot;
    const priceLabel = formatCurrency(serviceData?.total_price, serviceData?.currency);

    const cancelDisabledReason = useMemo(() => {
        if (!serviceData) {
            return 'Sin servicio';
        }
        if (serviceData.status !== 'CONFIRMED') {
            return 'Solo servicios confirmados';
        }
        if (!serviceData.scheduled_start_at) {
            return null;
        }
        const startMs = new Date(serviceData.scheduled_start_at).getTime();
        if (Number.isNaN(startMs)) {
            return null;
        }
        return startMs <= Date.now() ? 'El servicio ya comenzó' : null;
    }, [serviceData]);

    const isLoading = serviceRequestQuery.isLoading || serviceRequestQuery.isFetching;
    const isMutating = cancelServiceMutation.isPending || markInProgressMutation.isPending;

    useEffect(() => {
        if (!autoMarkAttempted && shouldAutoMarkInProgress(serviceData)) {
            setAutoMarkAttempted(true);
            markInProgressMutation.mutate(
                { requestId },
                {
                    onError: (error) => {
                        const message = error?.response?.data?.detail || error?.message;
                        if (message) {
                            console.warn('No se pudo marcar el servicio en progreso automáticamente:', message);
                        }
                    },
                },
            );
        }
    }, [autoMarkAttempted, markInProgressMutation, requestId, serviceData]);

    const handleCancelService = useCallback(() => {
        if (!requestId || !serviceData) {
            return;
        }

        Alert.alert(
            'Cancelar servicio',
            '¿Querés cancelar este servicio y solicitar el reembolso? Esta acción no se puede deshacer.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: () => {
                        cancelServiceMutation.mutate(
                            { requestId, reason: null },
                            {
                                onSuccess: () => {
                                    Alert.alert('Servicio cancelado', 'Procesamos tu solicitud de reembolso.');
                                },
                                onError: (error) => {
                                    const message = error?.response?.data?.detail || error?.message || 'No pudimos cancelar el servicio.';
                                    Alert.alert('Error', message);
                                },
                            },
                        );
                    },
                },
            ],
        );
    }, [cancelServiceMutation, requestId, serviceData]);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    if (!requestId) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <Text style={styles.errorText}>No encontramos el servicio solicitado.</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (isLoading && !requestData) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, styles.centerContent]}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Cargando servicio...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!serviceData) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, styles.centerContent]}>
                    <Ionicons name="alert-circle" size={36} color="#ef4444" />
                    <Text style={styles.errorTitle}>Sin servicio asociado</Text>
                    <Text style={styles.errorSubtitle}>
                        Todavía no se generó un servicio para esta solicitud.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detalle del servicio</Text>
                    <View style={styles.iconButtonPlaceholder} />
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <Ionicons name="briefcase-outline" size={26} color="#2563eb" />
                            <View style={styles.summaryHeaderText}>
                                <Text style={styles.serviceTitle} numberOfLines={2}>
                                    {requestData?.title ?? 'Servicio confirmado'}
                                </Text>
                                <Text style={styles.providerName} numberOfLines={1}>
                                    {providerName}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, statusBadgeStyle]}>
                                <Text style={styles.statusBadgeText}>{statusBadge.label}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={20} color="#1f2937" style={styles.detailIcon} />
                            <View style={styles.detailColumn}>
                                <Text style={styles.detailLabel}>Inicio programado</Text>
                                <Text style={styles.detailValue}>{startLabel ?? 'A coordinar'}</Text>
                                {endLabel ? (
                                    <Text style={styles.detailHint}>{`Finalización estimada: ${endLabel}`}</Text>
                                ) : null}
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="location-outline" size={20} color="#1f2937" style={styles.detailIcon} />
                            <View style={styles.detailColumn}>
                                <Text style={styles.detailLabel}>Lugar del servicio</Text>
                                <Text style={styles.detailValue}>{addressLabel ?? 'A coordinar con el prestador'}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="cash-outline" size={20} color="#1f2937" style={styles.detailIcon} />
                            <View style={styles.detailColumn}>
                                <Text style={styles.detailLabel}>Total acordado</Text>
                                <Text style={styles.detailValue}>{priceLabel ?? 'A definir'}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="document-text-outline" size={20} color="#1f2937" style={styles.detailIcon} />
                            <View style={styles.detailColumn}>
                                <Text style={styles.detailLabel}>Solicitud original</Text>
                                <Text style={styles.detailValue}>{requestData?.description}</Text>
                            </View>
                        </View>
                    </View>

                    {serviceData.status === 'CONFIRMED' ? (
                        <View style={styles.infoBanner}>
                            <Ionicons name="information-circle-outline" size={20} color="#0f172a" />
                            <Text style={styles.infoBannerText}>
                                Podés cancelar sin cargo hasta el comienzo del servicio. Te devolveremos el pago en los próximos días hábiles.
                            </Text>
                        </View>
                    ) : null}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.cancelButton,
                            (cancelDisabledReason || isMutating) && styles.cancelButtonDisabled,
                        ]}
                        onPress={handleCancelService}
                        disabled={Boolean(cancelDisabledReason) || isMutating}
                    >
                        {isMutating ? (
                            <ActivityIndicator size="small" color="#fef2f2" style={styles.buttonSpinner} />
                        ) : (
                            <Ionicons name="close-circle" size={20} color="#fee2e2" style={styles.buttonIcon} />
                        )}
                        <Text style={styles.cancelButtonText}>Cancelar servicio</Text>
                    </TouchableOpacity>
                    {cancelDisabledReason ? (
                        <Text style={styles.cancelHelper}>{cancelDisabledReason}</Text>
                    ) : null}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ServiceDetailScreen;
