import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import styles from './ProviderRequestDetailScreen.styles';
import { PALETTE } from '../HomePage/HomePage.styles';
import { useServiceRequest } from '../../hooks/useServiceRequests';
import RequestSummaryCard from './components/RequestSummaryCard';

const DEFAULT_ADDRESS_LABEL = 'Ubicación a coordinar';
const DEFAULT_DATETIME_LABEL = 'Fecha a coordinar';

function formatDateTime(value) {
    if (!value) {
        return DEFAULT_DATETIME_LABEL;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return DEFAULT_DATETIME_LABEL;
    }

    try {
        return parsed.toLocaleString('es-AR', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch (error) {
        const day = `${parsed.getDate()}`.padStart(2, '0');
        const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
        const year = parsed.getFullYear();
        const hours = `${parsed.getHours()}`.padStart(2, '0');
        const minutes = `${parsed.getMinutes()}`.padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes} hs`;
    }
}

function resolveAttachmentUri(attachment) {
    if (!attachment) {
        return null;
    }

    return (
        attachment.public_url ||
        attachment.url ||
        attachment.image_url ||
        attachment.temp_url ||
        attachment.signed_url ||
        null
    );
}

function formatCurrencyValue(value, currencyCode = 'ARS') {
    if (value === null || value === undefined) {
        return null;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
        return null;
    }

    try {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
            maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
        }).format(numeric);
    } catch (error) {
        const fallback = numeric.toLocaleString('es-AR', {
            minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
            maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
        });
        return `${currencyCode} ${fallback}`;
    }
}

const STATUS_LABELS = {
    PUBLISHED: 'Publicada',
    MATCHED: 'Asignada',
    IN_PROGRESS: 'En progreso',
    COMPLETED: 'Completada',
    CANCELED: 'Cancelada',
    CANCELLED: 'Cancelada',
    PENDING: 'Pendiente',
};

const TYPE_LABELS = {
    FAST: 'FAST ⚡',
    FAST_MATCH: 'FAST ⚡',
    LICITACION: 'Licitación ⏰',
    BUDGET: 'Licitación ⏰',
};

const PROPOSAL_STATUS_LABELS = {
    pending: 'Pendiente',
    accepted: 'Aceptado',
    rejected: 'Rechazado',
    withdrawn: 'Retirado',
    expired: 'Expirado',
};

export default function ProviderRequestDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    const {
        request: requestParam,
        requestId: requestIdParam,
        proposal: proposalParam,
        requestPreview,
    } = route.params ?? {};

    const fallbackId =
        requestParam?.id ??
        requestIdParam ??
        proposalParam?.request_id ??
        requestPreview?.id ??
        null;

    const serviceRequestQuery = useServiceRequest(fallbackId, {
        enabled: !requestParam && !requestPreview && Boolean(fallbackId),
        refetchOnWindowFocus: false,
    });

    const [previewAttachment, setPreviewAttachment] = useState(null);

    const queryData = useMemo(() => serviceRequestQuery.data ?? null, [serviceRequestQuery.data]);

    const resolvedRequest = useMemo(
        () => requestParam ?? queryData ?? requestPreview ?? null,
        [requestParam, queryData, requestPreview],
    );

    const loading = !requestParam && !queryData && !requestPreview && serviceRequestQuery.isLoading;
    const fetchError = serviceRequestQuery.isError ? serviceRequestQuery.error : null;

    const attachments = useMemo(
        () => (Array.isArray(resolvedRequest?.attachments) ? resolvedRequest.attachments : []),
        [resolvedRequest],
    );

    const normalizedRequestType = typeof resolvedRequest?.request_type === 'string'
        ? resolvedRequest.request_type.toUpperCase()
        : null;

    const isFastRequest = normalizedRequestType === 'FAST' || normalizedRequestType === 'FAST_MATCH';

    const preferredStartLabel = isFastRequest
        ? 'El servicio comienza cuando el cliente acepta tu presupuesto.'
        : formatDateTime(resolvedRequest?.preferred_start_at);
    const preferredEndLabel = formatDateTime(resolvedRequest?.preferred_end_at);
    const publishedAtLabel = formatDateTime(resolvedRequest?.created_at);

    const addressLabel = resolvedRequest?.city_snapshot || DEFAULT_ADDRESS_LABEL;
    const statusLabel = STATUS_LABELS[resolvedRequest?.status] || resolvedRequest?.status || 'Sin estado';
    const typeLabel = TYPE_LABELS[normalizedRequestType] || 'Solicitud';

    const proposalSummary = useMemo(() => {
        if (!resolvedRequest) {
            return null;
        }

        return {
            id: resolvedRequest.id ?? null,
            title: resolvedRequest.title ?? 'Solicitud sin título',
            address: resolvedRequest.city_snapshot ?? DEFAULT_ADDRESS_LABEL,
            request_type: resolvedRequest.request_type ?? null,
            preferred_start_at: resolvedRequest.preferred_start_at ?? null,
            preferred_end_at: resolvedRequest.preferred_end_at ?? null,
        };
    }, [resolvedRequest]);

    const summaryDetails = useMemo(() => {
        if (!resolvedRequest) {
            return [];
        }

        return [
            {
                icon: 'location-outline',
                label: 'Ubicación',
                value: addressLabel,
            },
            {
                icon: 'calendar-outline',
                label: 'Disponibilidad',
                value: preferredStartLabel,
                hint: !isFastRequest ? `Fin estimado: ${preferredEndLabel}` : null,
            },
        ];
    }, [resolvedRequest, addressLabel, preferredStartLabel, preferredEndLabel, isFastRequest]);

    const proposalDetails = useMemo(() => {
        if (!proposalParam) {
            return null;
        }

        const normalizedStatus = typeof proposalParam.status === 'string'
            ? proposalParam.status.toLowerCase()
            : null;

        const statusLabelForProposal = normalizedStatus
            ? PROPOSAL_STATUS_LABELS[normalizedStatus] || proposalParam.status
            : 'Sin estado';

        return {
            status: normalizedStatus,
            statusLabel: statusLabelForProposal,
            amountLabel: formatCurrencyValue(proposalParam.quoted_price, proposalParam.currency || 'ARS'),
            createdAtLabel: formatDateTime(proposalParam.created_at),
            validUntilLabel: proposalParam.valid_until ? formatDateTime(proposalParam.valid_until) : null,
            notes: proposalParam.notes,
        };
    }, [proposalParam]);

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleCreateProposal = () => {
        if (!proposalSummary || proposalParam) {
            return;
        }

        navigation.navigate('CreateProposal', { requestSummary: proposalSummary });
    };

    const handleOpenPreview = (uri, caption) => {
        if (!uri) {
            return;
        }
        setPreviewAttachment({ uri, caption: caption || null });
    };

    const handleClosePreview = () => {
        setPreviewAttachment(null);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, styles.centerContent]}>
                    <ActivityIndicator color={PALETTE.primary} size="large" />
                    <Text style={styles.loadingText}>Cargando solicitud...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!resolvedRequest) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, styles.centerContent]}>
                    <Ionicons name="alert-circle" size={40} color={PALETTE.danger} />
                    <Text style={styles.errorTitle}>No encontramos la solicitud</Text>
                    <Text style={styles.errorSubtitle}>
                        {fetchError?.message || 'Intentá volver atrás y seleccionar la solicitud nuevamente.'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleGoBack}>
                        <Ionicons name="chevron-back" size={22} color={PALETTE.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {proposalParam ? 'Detalle de presupuesto' : 'Detalle de solicitud'}
                    </Text>
                    <View style={styles.headerButtonPlaceholder} />
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <RequestSummaryCard
                        typeLabel={typeLabel}
                        typeIcon={isFastRequest ? 'flash' : 'hammer'}
                        title={resolvedRequest.title ?? 'Solicitud sin título'}
                        metaLabel={`Creada: ${publishedAtLabel}`}
                        statusLabel={statusLabel}
                        details={summaryDetails}
                    />

                    {proposalDetails ? (
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Tu presupuesto</Text>
                                <View
                                    style={[
                                        styles.proposalStatusBadge,
                                        proposalDetails.status === 'accepted' && styles.proposalStatusBadgeAccepted,
                                        proposalDetails.status === 'pending' && styles.proposalStatusBadgePending,
                                        proposalDetails.status === 'rejected' && styles.proposalStatusBadgeRejected,
                                        (proposalDetails.status === 'withdrawn' || proposalDetails.status === 'expired') && styles.proposalStatusBadgeMuted,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.proposalStatusText,
                                            proposalDetails.status === 'accepted' && styles.proposalStatusTextAccepted,
                                            proposalDetails.status === 'pending' && styles.proposalStatusTextPending,
                                            proposalDetails.status === 'rejected' && styles.proposalStatusTextRejected,
                                            (proposalDetails.status === 'withdrawn' || proposalDetails.status === 'expired') && styles.proposalStatusTextMuted,
                                        ]}
                                    >
                                        {proposalDetails.statusLabel}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.proposalAmount}>
                                {proposalDetails.amountLabel || 'Sin monto declarado'}
                            </Text>

                            <Text style={styles.proposalMetaLabel}>
                                Enviada: {proposalDetails.createdAtLabel}
                            </Text>

                            {proposalDetails.validUntilLabel ? (
                                <Text style={styles.proposalMetaLabel}>
                                    Válida hasta: {proposalDetails.validUntilLabel}
                                </Text>
                            ) : null}

                            {proposalDetails.notes ? (
                                <View style={styles.proposalNotesBlock}>
                                    <Text style={styles.proposalNotesTitle}>Notas</Text>
                                    <Text style={styles.proposalNotesText}>{proposalDetails.notes}</Text>
                                </View>
                            ) : null}
                        </View>
                    ) : null}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Descripción</Text>
                        <Text style={styles.sectionBody}>
                            {resolvedRequest.description || 'No pudimos mostrar la descripción de la solicitud.'}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Adjuntos</Text>
                            <Text style={styles.sectionMeta}>
                                {attachments.length > 0 ? `${attachments.length} archivos` : 'Sin adjuntos'}
                            </Text>
                        </View>
                        {attachments.length > 0 ? (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.attachmentList}
                            >
                                {attachments.map((attachment, index) => {
                                    const attachmentUri = resolveAttachmentUri(attachment);
                                    const attachmentKey =
                                        attachment?.id || attachment?.s3_key || attachmentUri || `attachment-${index}`;
                                    return (
                                        <View key={attachmentKey} style={styles.attachmentItem}>
                                            {attachmentUri ? (
                                                <TouchableOpacity
                                                    activeOpacity={0.9}
                                                    onPress={() => handleOpenPreview(attachmentUri, attachment?.caption)}
                                                >
                                                    <Image source={{ uri: attachmentUri }} style={styles.attachmentImage} />
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={styles.attachmentPlaceholder}>
                                                    <Ionicons name="image" size={28} color={PALETTE.textSecondary} />
                                                    <Text style={styles.attachmentPlaceholderText}>Sin vista previa</Text>
                                                </View>
                                            )}
                                            {attachment?.caption ? (
                                                <Text style={styles.attachmentCaption}>{attachment.caption}</Text>
                                            ) : null}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <View style={styles.attachmentEmpty}>
                                <Ionicons name="images-outline" size={26} color={PALETTE.textSecondary} />
                                <Text style={styles.attachmentEmptyText}>
                                    El cliente no adjuntó imágenes para esta solicitud.
                                </Text>
                            </View>
                        )}
                    </View>

                    {fetchError && !queryData ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Información limitada</Text>
                            <Text style={styles.sectionBody}>
                                No pudimos sincronizar la solicitud completa desde el servidor. Te mostramos la
                                información disponible del presupuesto.
                            </Text>
                        </View>
                    ) : null}
                </ScrollView>

                {!proposalParam ? (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.ctaButton, !proposalSummary && styles.ctaButtonDisabled]}
                            onPress={handleCreateProposal}
                            disabled={!proposalSummary}
                        >
                            <Ionicons name="document-text" size={18} color={PALETTE.white} style={styles.ctaIcon} />
                            <Text style={styles.ctaText}>Crear presupuesto</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <Modal
                    visible={Boolean(previewAttachment)}
                    transparent
                    animationType="fade"
                    onRequestClose={handleClosePreview}
                >
                    <View style={styles.previewOverlay}>
                        <TouchableOpacity style={styles.previewBackdrop} activeOpacity={1} onPress={handleClosePreview} />
                        <View style={styles.previewContent}>
                            <TouchableOpacity
                                style={styles.previewCloseButton}
                                onPress={handleClosePreview}
                                accessibilityRole="button"
                                accessibilityLabel="Cerrar vista de imagen"
                            >
                                <Ionicons name="close" size={22} color={PALETTE.textPrimary} />
                            </TouchableOpacity>
                            {previewAttachment?.uri ? (
                                <Image
                                    source={{ uri: previewAttachment.uri }}
                                    style={styles.previewImage}
                                    resizeMode="contain"
                                />
                            ) : null}
                            {previewAttachment?.caption ? (
                                <Text style={styles.previewCaption}>{previewAttachment.caption}</Text>
                            ) : null}
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}
