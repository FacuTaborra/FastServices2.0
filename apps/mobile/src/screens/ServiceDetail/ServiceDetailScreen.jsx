import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, RefreshControl, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from './ServiceDetailScreen.styles';
import {
    useServiceRequest,
    useCancelService,
    useMarkServiceInProgress,
    useSubmitServiceReview,
} from '../../hooks/useServiceRequests';
import RatingModal from '../../components/RatingModal/RatingModal';

const STATUS_BADGE_MAP = {
    CONFIRMED: { label: 'Confirmado', styleKey: 'confirmed' },
    ON_ROUTE: { label: 'En camino', styleKey: 'onRoute' },
    IN_PROGRESS: { label: 'En progreso', styleKey: 'inProgress' },
    COMPLETED: { label: 'Completado', styleKey: 'completed' },
    CANCELED: { label: 'Cancelado', styleKey: 'canceled' },
};

const STATUS_DESCRIPTIONS = {
    CONFIRMED: 'Servicio confirmado con el prestador. Podés coordinar cualquier detalle pendiente.',
    CONFIRMED_WARRANTY: 'Garantía solicitada. El prestador coordinará la visita sin costo adicional.',
    ON_ROUTE: 'El prestador está en camino hacia tu domicilio.',
    IN_PROGRESS: 'El servicio está en ejecución.',
    COMPLETED: 'El servicio finalizó. Recordá calificar al prestador.',
    CANCELED: 'El servicio fue cancelado. Si necesitás asistencia contanos desde Ayuda y soporte.',
};

const TIMELINE_COLORS = {
    done: '#0f766e',
    active: '#2563eb',
    pending: '#cbd5f5',
    canceled: '#ef4444',
    review: '#f59e0b',
};

const BASE_STATUS_FLOW = ['CONFIRMED', 'ON_ROUTE', 'IN_PROGRESS', 'COMPLETED'];

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
        hour12: false,
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

const buildTimelineEntries = (service, pendingReview = null) => {
    if (!service) {
        return [];
    }

    const historyItems = Array.isArray(service.status_history) ? [...service.status_history] : [];
    
    // Ordenar historial por fecha
    const sortedHistory = [...historyItems].sort((a, b) => {
        const timeA = a?.changed_at ? new Date(a.changed_at).getTime() : 0;
        const timeB = b?.changed_at ? new Date(b.changed_at).getTime() : 0;
        return timeA - timeB;
    });

    // Detectar si hay una transición de garantía (COMPLETED → CONFIRMED)
    const warrantyTransitions = sortedHistory.filter(
        (item) => item?.from_status === 'COMPLETED' && item?.to_status === 'CONFIRMED'
    );
    const hasWarrantyFlow = warrantyTransitions.length > 0;

    // Si hay garantía, construimos el timeline de forma secuencial basado en el historial real
    if (hasWarrantyFlow) {
        return buildWarrantyTimeline(service, sortedHistory, pendingReview);
    }

    // Flujo normal sin garantía
    const historyByStatus = new Map();
    historyItems.forEach((item) => {
        const status = item?.to_status;
        if (!status) {
            return;
        }
        const timestamp = item?.changed_at ? new Date(item.changed_at).getTime() : null;
        const existing = historyByStatus.get(status);
        if (!existing || (timestamp !== null && timestamp < existing.timestamp)) {
            historyByStatus.set(status, {
                timestamp,
                changed_at: item.changed_at,
            });
        }
    });

    const finalStatus = typeof service.status === 'string'
        ? service.status
        : String(service.status || '');

    const flow = [...BASE_STATUS_FLOW];
    if (finalStatus === 'CANCELED') {
        flow.push('CANCELED');
    }
    if (finalStatus && !flow.includes(finalStatus)) {
        flow.push(finalStatus);
    }

    const uniqueFlow = flow.filter((status, index, array) => array.indexOf(status) === index);
    const currentIndex = Math.max(uniqueFlow.indexOf(finalStatus), 0);

    const completedReached = finalStatus === 'COMPLETED';

    const entries = uniqueFlow.map((status, index) => {
        const record = historyByStatus.get(status);
        let timestampLabel = null;
        if (record?.changed_at) {
            timestampLabel = formatDateTime(record.changed_at);
        } else if (status === 'CONFIRMED') {
            timestampLabel = formatDateTime(service.created_at);
        } else if (status === finalStatus) {
            timestampLabel = formatDateTime(service.updated_at);
        }

        const badge = resolveStatusBadge(status);
        const description = STATUS_DESCRIPTIONS[status] || null;

        const isCurrent = status === finalStatus;

        let paletteKey;
        if (status === 'CANCELED') {
            paletteKey = 'canceled';
        } else if (status === 'COMPLETED' && completedReached) {
            paletteKey = 'done';
        } else if (index < currentIndex) {
            paletteKey = 'done';
        } else if (isCurrent) {
            paletteKey = 'active';
        } else {
            paletteKey = 'pending';
        }

        const paletteColor = TIMELINE_COLORS[paletteKey] || TIMELINE_COLORS.pending;
        const connectorColor = paletteKey === 'pending'
            ? '#dbeafe'
            : paletteColor;

        return {
            key: `timeline-${status}-${index}`,
            status,
            label: badge.label,
            timestamp: timestampLabel,
            description,
            paletteColor,
            connectorColor,
            isFirst: index === 0,
            isLast: index === uniqueFlow.length - 1,
            isActive: isCurrent,
            isDone: (index < currentIndex || (status === 'COMPLETED' && completedReached)) && status !== 'CANCELED',
        };
    });
    
    // Agregar review si existe
    appendReviewEntry(entries, service, pendingReview);

    return entries.map((entry, index) => ({
        ...entry,
        isFirst: index === 0,
        isLast: index === entries.length - 1,
    }));
};

// Construye el timeline cuando hay garantía, mostrando el flujo completo secuencial
const buildWarrantyTimeline = (service, sortedHistory, pendingReview) => {
    const entries = [];
    const finalStatus = typeof service.status === 'string' ? service.status : String(service.status || '');
    const hasReview = Boolean(service.client_review || pendingReview);
    
    let warrantyPhase = 0; // 0 = servicio original, 1+ = garantía

    // Recorrer el historial y construir entries secuenciales
    sortedHistory.forEach((historyItem, historyIndex) => {
        const toStatus = historyItem?.to_status;
        const fromStatus = historyItem?.from_status;
        const changedAt = historyItem?.changed_at;

        if (!toStatus) return;

        // Detectar transición de garantía
        const isWarrantyTransition = fromStatus === 'COMPLETED' && toStatus === 'CONFIRMED';
        
        if (isWarrantyTransition) {
            warrantyPhase += 1;
            // Agregar entrada especial de "Garantía solicitada"
            entries.push({
                key: `timeline-warranty-${warrantyPhase}`,
                status: 'WARRANTY_CLAIMED',
                label: '🛡️ Garantía solicitada',
                timestamp: formatDateTime(changedAt),
                description: service.warranty_claim_description || 'El cliente solicitó atención por garantía.',
                paletteColor: '#D97706', // Amber
                connectorColor: '#D97706',
                isFirst: false,
                isLast: false,
                isActive: false,
                isDone: true,
                isWarranty: true,
            });
            return; // No agregamos el CONFIRMED redundante
        }

        // Determinar si este estado ya pasó o es el actual
        const isLastHistoryItem = historyIndex === sortedHistory.length - 1;
        // Si es COMPLETED y hay review, no es "current" porque la review viene después
        const isCurrent = isLastHistoryItem && toStatus === finalStatus && !(toStatus === 'COMPLETED' && hasReview);
        const isDone = !isCurrent;

        // Labels especiales para fase de garantía
        let label = resolveStatusBadge(toStatus).label;
        if (warrantyPhase > 0) {
            // En fase de garantía, agregar sufijo excepto para COMPLETED final
            if (toStatus === 'CONFIRMED') {
                label = 'Confirmado (garantía)';
            } else if (toStatus === 'IN_PROGRESS') {
                label = 'En progreso (garantía)';
            } else if (toStatus === 'ON_ROUTE') {
                label = 'En camino (garantía)';
            } else if (toStatus === 'COMPLETED') {
                label = 'Garantía completada';
            }
        }

        let description = STATUS_DESCRIPTIONS[toStatus] || null;
        if (warrantyPhase > 0) {
            if (toStatus === 'CONFIRMED') {
                description = 'El profesional coordinará la visita de garantía sin costo adicional.';
            } else if (toStatus === 'COMPLETED') {
                description = 'El trabajo de garantía fue completado exitosamente.';
            }
        }

        let paletteKey = 'done';
        if (isCurrent) {
            paletteKey = 'active';
        } else if (toStatus === 'CANCELED') {
            paletteKey = 'canceled';
        }

        // En fase de garantía, todo usa amber (incluyendo COMPLETED de garantía)
        const paletteColor = warrantyPhase > 0
            ? '#D97706' // Amber para toda la fase de garantía
            : (TIMELINE_COLORS[paletteKey] || TIMELINE_COLORS.done);

        entries.push({
            key: `timeline-${toStatus}-${historyIndex}`,
            status: toStatus,
            label,
            timestamp: formatDateTime(changedAt),
            description,
            paletteColor,
            connectorColor: paletteColor,
            isFirst: entries.length === 0,
            isLast: false,
            isActive: isCurrent,
            isDone,
            isWarranty: warrantyPhase > 0,
        });
    });

    // Si el servicio está en un estado que no salió del historial (ej: recién creado)
    if (entries.length === 0) {
        entries.push({
            key: 'timeline-CONFIRMED-initial',
            status: 'CONFIRMED',
            label: 'Confirmado',
            timestamp: formatDateTime(service.created_at),
            description: STATUS_DESCRIPTIONS.CONFIRMED,
            paletteColor: finalStatus === 'CONFIRMED' ? TIMELINE_COLORS.active : TIMELINE_COLORS.done,
            connectorColor: TIMELINE_COLORS.done,
            isFirst: true,
            isLast: finalStatus === 'CONFIRMED',
            isActive: finalStatus === 'CONFIRMED',
            isDone: finalStatus !== 'CONFIRMED',
        });
    }

    // Agregar review si existe
    appendReviewEntry(entries, service, pendingReview);

    return entries.map((entry, index) => ({
        ...entry,
        isFirst: index === 0,
        isLast: index === entries.length - 1,
    }));
};

// Helper para agregar entrada de review
const appendReviewEntry = (entries, service, pendingReview) => {
    const review = service.client_review || pendingReview;
    if (review) {
        const lastIndex = entries.length - 1;
        if (lastIndex >= 0) {
            entries[lastIndex] = {
                ...entries[lastIndex],
                isLast: false,
            };
        }

        const ratingLabel = review.rating === 1
            ? '1 estrella'
            : `${review.rating} estrellas`;
        const descriptionParts = [`Calificaste al prestador con ${ratingLabel}.`];
        if (review.comment) {
            descriptionParts.push(`Comentario: "${review.comment}".`);
        }

        entries.push({
            key: 'timeline-review',
            status: 'REVIEW',
            label: 'Servicio calificado',
            timestamp: formatDateTime(review.created_at),
            description: descriptionParts.join(' '),
            paletteColor: TIMELINE_COLORS.review,
            connectorColor: TIMELINE_COLORS.review,
            isFirst: entries.length === 0,
            isLast: true,
            isActive: false,
            isDone: true,
        });
    }
};

const ServiceDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { requestId, autoOpenRating = false } = route.params ?? {};

    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [optimisticReview, setOptimisticReview] = useState(null);
    const [actionsModalVisible, setActionsModalVisible] = useState(false);

    const serviceRequestQuery = useServiceRequest(requestId, {
        enabled: Boolean(requestId),
    });
    const { refetch, isFetching } = serviceRequestQuery;
    const cancelServiceMutation = useCancelService();
    const markInProgressMutation = useMarkServiceInProgress();
    const submitReviewMutation = useSubmitServiceReview();
    const isSubmittingReview = submitReviewMutation.isPending;
    const hasReviewMutationSucceeded = submitReviewMutation.isSuccess;
    const { reset: resetReviewMutation } = submitReviewMutation;

    const requestData = serviceRequestQuery.data;
    const serviceData = requestData?.service ?? null;
    const hasPersistedReview = Boolean(serviceData?.client_review);

    const providerInfo = useMemo(() => {
        // Intentamos buscar la propuesta ganadora para sacar más datos (foto, rating, etc)
        const proposal = Array.isArray(requestData?.proposals)
            ? requestData.proposals.find((item) => item.id === serviceData?.proposal_id)
            : null;

        // Nombre: Prioridad serviceData -> proposal -> fallback
        const name = serviceData?.provider_display_name || proposal?.provider_display_name || 'Prestador asignado';

        // ID del perfil
        const id = serviceData?.provider_profile_id || proposal?.provider_profile_id;

        // Datos extra que solo suelen venir en la propuesta (si existe)
        const image = proposal?.provider_image_url || null;
        const rating = proposal?.provider_rating_avg ? Number(proposal.provider_rating_avg) : 0;
        const reviews = proposal?.provider_total_reviews || 0;

        return { name, id, image, rating, reviews };
    }, [requestData?.proposals, serviceData]);

    // Detectar si el servicio está en proceso de garantía (reabierto)
    const isWarrantyInProgress = useMemo(() => {
        if (!serviceData) return false;
        // Si tiene warranty_claim_description y no está completado, está en proceso de garantía
        return Boolean(serviceData.warranty_claim_description) && serviceData.status !== 'COMPLETED';
    }, [serviceData]);

    const statusBadge = resolveStatusBadge(serviceData?.status);
    const statusBadgeStyle = styles[`statusBadge_${statusBadge.styleKey}`] || styles.statusBadge_default;
    const startLabel = formatDateTime(serviceData?.scheduled_start_at);
    const endLabel = formatDateTime(serviceData?.scheduled_end_at);
    const addressLabel = extractAddressLabel(serviceData?.address_snapshot) || requestData?.city_snapshot;
    const priceLabel = formatCurrency(serviceData?.total_price, serviceData?.currency);
    const timelineEntries = useMemo(
        () => buildTimelineEntries(serviceData, optimisticReview),
        [serviceData, optimisticReview],
    );
    const isServiceCompleted = serviceData?.status === 'COMPLETED';

    // Calcular si está dentro del período de garantía (30 días)
    const warrantyInfo = useMemo(() => {
        if (!serviceData || serviceData.status !== 'COMPLETED') {
            return { isValid: false, expiresAt: null, daysRemaining: 0 };
        }

        // Usar warranty_expires_at si existe, o calcular desde updated_at
        let expiresAt = serviceData.warranty_expires_at
            ? new Date(serviceData.warranty_expires_at)
            : null;

        if (!expiresAt && serviceData.updated_at) {
            const completedAt = new Date(serviceData.updated_at);
            expiresAt = new Date(completedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        if (!expiresAt) {
            return { isValid: false, expiresAt: null, daysRemaining: 0 };
        }

        const now = new Date();
        const isValid = now < expiresAt;
        const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));

        return { isValid, expiresAt, daysRemaining };
    }, [serviceData]);

    useEffect(() => {
        setOptimisticReview(null);
        setRatingSubmitted(false);
        resetReviewMutation();
    }, [requestId, resetReviewMutation]);

    useEffect(() => {
        if (hasPersistedReview) {
            setRatingSubmitted(true);
            if (optimisticReview) {
                setOptimisticReview(null);
            }
            return;
        }
        if (hasReviewMutationSucceeded) {
            return;
        }
        if (!isSubmittingReview && !ratingModalVisible) {
            setRatingSubmitted(false);
        }
    }, [
        hasPersistedReview,
        hasReviewMutationSucceeded,
        isSubmittingReview,
        ratingModalVisible,
        optimisticReview,
    ]);

    const cancelDisabledReason = useMemo(() => {
        if (!serviceData) {
            return 'Sin servicio';
        }
        if (serviceData.status !== 'CONFIRMED') {
            return 'Solo servicios confirmados';
        }
        // Si está CONFIRMED, siempre se puede cancelar (hasta que pase a ON_ROUTE)
        return null;
    }, [serviceData]);

    const isLoading = serviceRequestQuery.isLoading || isFetching;
    const isMutating = cancelServiceMutation.isPending || markInProgressMutation.isPending;
    const showCancelButton = serviceData?.status === 'CONFIRMED';

    useEffect(() => {
        if (!autoOpenRating) {
            return;
        }
        if (!serviceData) {
            return;
        }
        if (!isServiceCompleted || ratingSubmitted) {
            navigation.setParams({ autoOpenRating: false });
            return;
        }
        setRatingModalVisible(true);
        navigation.setParams({ autoOpenRating: false });
    }, [autoOpenRating, serviceData, isServiceCompleted, ratingSubmitted, navigation]);

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

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleOpenRatingModal = useCallback(() => {
        if (ratingSubmitted || isSubmittingReview) {
            return;
        }
        setRatingModalVisible(true);
    }, [ratingSubmitted, isSubmittingReview]);

    const handleRehire = useCallback(() => {
        if (!serviceData || !providerInfo) {
            return;
        }
        navigation.navigate('RehireRequest', {
            serviceId: serviceData.id,
            providerName: providerInfo.name,
            providerImage: providerInfo.image,
            providerRating: providerInfo.rating,
            providerReviews: providerInfo.reviews,
        });
    }, [navigation, serviceData, providerInfo]);

    const handleWarrantyClaim = useCallback(() => {
        if (!serviceData || !providerInfo || !warrantyInfo.isValid) {
            return;
        }
        navigation.navigate('WarrantyClaim', {
            serviceId: serviceData.id,
            serviceTitle: requestData?.title,
            providerName: providerInfo.name,
            providerImage: providerInfo.image,
            providerRating: providerInfo.rating,
            providerReviews: providerInfo.reviews,
            warrantyExpiresAt: warrantyInfo.expiresAt?.toISOString(),
        });
    }, [navigation, serviceData, requestData, providerInfo, warrantyInfo]);

    const handleCloseRatingModal = useCallback(() => {
        if (isSubmittingReview) {
            return;
        }
        setRatingModalVisible(false);
    }, [isSubmittingReview]);

    const handleSubmitRating = useCallback(
        (ratingValue, comment) => {
            if (!requestId) {
                return;
            }
            submitReviewMutation.mutate(
                { requestId, rating: ratingValue, comment },
                {
                    onSuccess: (updatedRequest) => {
                        setRatingModalVisible(false);
                        const persistedReview = Boolean(
                            updatedRequest?.service?.client_review,
                        );
                        const fallbackReview =
                            updatedRequest?.service?.client_review ?? {
                                rating: ratingValue,
                                comment,
                                created_at: new Date().toISOString(),
                            };
                        setOptimisticReview(fallbackReview);
                        setRatingSubmitted(persistedReview || ratingValue > 0);
                        Alert.alert(
                            'Calificación enviada',
                            'Gracias por calificar este servicio.',
                        );
                    },
                    onError: (error) => {
                        const message =
                            error?.response?.data?.detail ||
                            error?.message ||
                            'No pudimos registrar tu calificación.';
                        Alert.alert('Error', message);
                    },
                },
            );
        },
        [requestId, submitReviewMutation],
    );

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
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching}
                            onRefresh={handleRefresh}
                            tintColor="#6366f1"
                            colors={['#6366f1']}
                        />
                    }
                >
                    <View style={styles.providerCard}>
                        <Text style={styles.sectionTitle}>Profesional a cargo</Text>
                        <View style={styles.providerContent}>
                            <Image
                                source={{
                                    uri: providerInfo.image || 'https://dthezntil550i.cloudfront.net/f4/latest/f41908291942413280009640715/1280_960/1b2d9510-d66d-43a2-971a-cfcbb600e7fe.png'
                                }}
                                style={styles.providerAvatar}
                            />
                            <View style={styles.providerInfoColumn}>
                                <Text style={styles.providerNameLarge}>{providerInfo.name}</Text>
                                <View style={styles.providerStatsRow}>
                                    <Ionicons name="star" size={16} color="#F59E0B" />
                                    <Text style={styles.ratingText}>
                                        {providerInfo.rating > 0 ? providerInfo.rating.toFixed(1) : 'Nuevo'}
                                    </Text>
                                    {providerInfo.reviews > 0 && (
                                        <Text style={styles.reviewsText}>
                                            ({providerInfo.reviews} reseñas)
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <Ionicons name="briefcase-outline" size={26} color="#2563eb" />
                            <View style={styles.summaryHeaderText}>
                                <Text style={styles.serviceTitle} numberOfLines={2}>
                                    {requestData?.title ?? 'Servicio confirmado'}
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

                        {serviceData.warranty_claim_description ? (
                            <View style={styles.detailRow}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#92400E" style={styles.detailIcon} />
                                <View style={styles.detailColumn}>
                                    <Text style={[styles.detailLabel, { color: '#92400E' }]}>Reclamo de garantía</Text>
                                    <Text style={styles.detailValue}>{serviceData.warranty_claim_description}</Text>
                                </View>
                            </View>
                        ) : null}
                    </View>

                    <View style={[styles.timelineCard]}>
                        <Text style={styles.sectionTitle}>Historial del servicio</Text>
                        <View style={styles.timelineSection}>
                            {timelineEntries.length ? (
                                timelineEntries.map((entry) => (
                                    <View
                                        key={entry.key}
                                        style={[styles.timelineItem, entry.isLast && styles.timelineItemLast]}
                                    >
                                        <View style={styles.timelineMarkerWrapper}>
                                            {!entry.isFirst ? (
                                                <View
                                                    style={[
                                                        styles.timelineConnector,
                                                        { backgroundColor: entry.connectorColor },
                                                    ]}
                                                />
                                            ) : null}
                                            <View
                                                style={[
                                                    styles.timelineBullet,
                                                    {
                                                        borderColor: entry.paletteColor,
                                                        backgroundColor: entry.isDone ? entry.paletteColor : '#FFFFFF',
                                                    },
                                                ]}
                                            >
                                                <View
                                                    style={[
                                                        styles.timelineBulletInner,
                                                        { backgroundColor: entry.paletteColor },
                                                    ]}
                                                />
                                            </View>
                                            {!entry.isLast ? (
                                                <View
                                                    style={[
                                                        styles.timelineConnector,
                                                        { backgroundColor: entry.connectorColor },
                                                    ]}
                                                />
                                            ) : null}
                                        </View>

                                        <View style={styles.timelineContent}>
                                            <Text style={styles.timelineLabel}>{entry.label}</Text>
                                            {entry.timestamp ? (
                                                <Text style={styles.timelineTimestamp}>{entry.timestamp}</Text>
                                            ) : null}
                                            {entry.description ? (
                                                <Text style={styles.timelineDescription}>{entry.description}</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.timelineEmptyText}>Todavía no registramos movimientos para este servicio.</Text>
                            )}
                        </View>
                    </View>

                    {isWarrantyInProgress ? (
                        <View style={[styles.infoBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                            <Ionicons name="shield-checkmark" size={20} color="#92400E" />
                            <Text style={[styles.infoBannerText, { color: '#92400E' }]}>
                                Garantía en proceso. El profesional coordinará una visita sin costo para resolver el problema.
                            </Text>
                        </View>
                    ) : serviceData.status === 'CONFIRMED' ? (
                        <View style={styles.infoBanner}>
                            <Ionicons name="information-circle-outline" size={20} color="#0f172a" />
                            <Text style={styles.infoBannerText}>
                                Podés cancelar sin cargo hasta el comienzo del servicio. Te devolveremos el pago en los próximos días hábiles.
                            </Text>
                        </View>
                    ) : null}

                </ScrollView>


                {/* Footer con FAB para servicios completados */}
                {isServiceCompleted ? (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.fab}
                            onPress={() => setActionsModalVisible(true)}
                        >
                            <Ionicons name="apps" size={20} color="#FFFFFF" />
                            <Text style={styles.fabText}>Ver opciones</Text>
                        </TouchableOpacity>
                    </View>
                ) : showCancelButton ? (
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
                ) : null}

                {/* Bottom Sheet Modal de Acciones */}
                <Modal
                    visible={actionsModalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setActionsModalVisible(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setActionsModalVisible(false)}
                    >
                        <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
                            <View style={styles.bottomSheetHandle} />
                            <Text style={styles.bottomSheetTitle}>¿Qué querés hacer?</Text>
                            <Text style={styles.bottomSheetSubtitle}>
                                Seleccioná una opción para continuar
                            </Text>

                            <View style={styles.bottomSheetActions}>
                                {/* Calificar servicio */}
                                {!ratingSubmitted && (
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => {
                                            setActionsModalVisible(false);
                                            setTimeout(() => handleOpenRatingModal(), 300);
                                        }}
                                        disabled={isSubmittingReview}
                                    >
                                        <View style={[styles.actionButtonIconWrapper, { backgroundColor: '#FEF3C7' }]}>
                                            <Ionicons name="star" size={22} color="#D97706" />
                                        </View>
                                        <View style={styles.actionButtonContent}>
                                            <Text style={styles.actionButtonTitle}>Calificar servicio</Text>
                                            <Text style={styles.actionButtonSubtitle}>
                                                Dejá tu opinión sobre el trabajo
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#94a3b8" style={styles.actionButtonChevron} />
                                    </TouchableOpacity>
                                )}

                                {/* Solicitar garantía */}
                                {warrantyInfo.isValid && (
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => {
                                            setActionsModalVisible(false);
                                            setTimeout(() => handleWarrantyClaim(), 300);
                                        }}
                                    >
                                        <View style={[styles.actionButtonIconWrapper, { backgroundColor: '#FFEDD5' }]}>
                                            <Ionicons name="shield-checkmark" size={22} color="#EA580C" />
                                        </View>
                                        <View style={styles.actionButtonContent}>
                                            <Text style={styles.actionButtonTitle}>Solicitar garantía</Text>
                                            <Text style={styles.actionButtonSubtitle}>
                                                {warrantyInfo.daysRemaining} días restantes
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#94a3b8" style={styles.actionButtonChevron} />
                                    </TouchableOpacity>
                                )}

                                {/* Recontratar */}
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => {
                                        setActionsModalVisible(false);
                                        setTimeout(() => handleRehire(), 300);
                                    }}
                                >
                                    <View style={[styles.actionButtonIconWrapper, { backgroundColor: '#E0E7FF' }]}>
                                        <Ionicons name="refresh" size={22} color="#4F46E5" />
                                    </View>
                                    <View style={styles.actionButtonContent}>
                                        <Text style={styles.actionButtonTitle}>Recontratar profesional</Text>
                                        <Text style={styles.actionButtonSubtitle}>
                                            Solicitá un nuevo servicio
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" style={styles.actionButtonChevron} />
                                </TouchableOpacity>

                                {/* Mensaje si ya calificó */}
                                {ratingSubmitted && (
                                    <View style={[styles.actionButton, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                                        <View style={[styles.actionButtonIconWrapper, { backgroundColor: '#DCFCE7' }]}>
                                            <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                                        </View>
                                        <View style={styles.actionButtonContent}>
                                            <Text style={[styles.actionButtonTitle, { color: '#16A34A' }]}>
                                                Servicio calificado
                                            </Text>
                                            <Text style={styles.actionButtonSubtitle}>
                                                Gracias por tu opinión
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setActionsModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>Cerrar</Text>
                            </TouchableOpacity>
                        </Pressable>
                    </Pressable>
                </Modal>
                <RatingModal
                    visible={ratingModalVisible}
                    onClose={handleCloseRatingModal}
                    onSubmit={handleSubmitRating}
                    submitting={isSubmittingReview}
                />
            </View>
        </SafeAreaView>
    );
};

export default ServiceDetailScreen;

