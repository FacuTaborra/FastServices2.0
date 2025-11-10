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

const DEFAULT_ADDRESS_LABEL = 'Ubicación a coordinar';

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

    const cityLabel = useMemo(() => {
        if (typeof resolvedRequest?.city_snapshot !== 'string') {
            return DEFAULT_ADDRESS_LABEL;
        }

        const [firstSegment] = resolvedRequest.city_snapshot.split(',');
        const normalized = firstSegment ? firstSegment.trim() : null;
        return normalized || DEFAULT_ADDRESS_LABEL;
    }, [resolvedRequest]);

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

    const isRequestConfirmed = useMemo(() => {
        const status = typeof resolvedRequest?.status === 'string'
            ? resolvedRequest.status.toUpperCase()
            : null;

        if (!status) {
            return false;
        }

        return status === 'MATCHED'
            || status === 'IN_PROGRESS'
            || status === 'COMPLETED'
            || status === 'CANCELED'
            || status === 'CANCELLED';
    }, [resolvedRequest]);

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleCreateProposal = () => {
        if (!proposalSummary || proposalParam || isRequestConfirmed) {
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
                        {proposalParam ? 'Detalle de presupuesto' : 'Detalle de la solicitud'}
                    </Text>
                    <View style={styles.headerButtonPlaceholder} />
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.section}>
                        <Text style={styles.requestTitle}>
                            {resolvedRequest.title ?? 'Solicitud sin título'}
                        </Text>
                        <View style={styles.requestLocationRow}>
                            <Ionicons name="location-outline" size={18} color={PALETTE.textSecondary} style={styles.requestLocationIcon} />
                            <Text style={styles.requestLocationLabel}>{cityLabel}</Text>
                        </View>
                    </View>

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

                {!proposalParam && !isRequestConfirmed ? (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.ctaButton, (!proposalSummary || isRequestConfirmed) && styles.ctaButtonDisabled]}
                            onPress={handleCreateProposal}
                            disabled={!proposalSummary || isRequestConfirmed}
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
