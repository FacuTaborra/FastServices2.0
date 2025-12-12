import React, { useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from './RehireDetailScreen.styles';
import { useServiceRequest } from '../../hooks/useServiceRequests';

const STATUS_LABELS = {
    PUBLISHED: 'Esperando respuesta',
    CLOSED: 'Cerrada',
    CANCELLED: 'Cancelada',
};

const RehireDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { requestId, requestSummary } = route.params ?? {};

    const {
        data: detailData,
        isLoading,
        isError,
        error,
    } = useServiceRequest(requestId);

    // Combinar datos del summary con los del detalle
    const request = useMemo(() => {
        if (detailData) return detailData;
        if (requestSummary) return requestSummary;
        return null;
    }, [detailData, requestSummary]);

    const targetProvider = useMemo(() => {
        if (!request) return null;
        return request.target_provider || null;
    }, [request]);

    const attachments = useMemo(() => {
        if (!request) return [];
        return Array.isArray(request.attachments) ? request.attachments : [];
    }, [request]);

    const proposals = useMemo(() => {
        if (!request) return [];
        return Array.isArray(request.proposals) ? request.proposals : [];
    }, [request]);

    const statusKey = request?.status?.toLowerCase() || 'published';

    const formatDate = useCallback((dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, []);

    const handleAcceptProposal = useCallback((proposal) => {
        const price = Number(proposal.quoted_price || 0);
        const currency = (proposal.currency || 'ARS').toUpperCase();
        const priceFormatted = price.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        Alert.alert(
            'Aceptar propuesta',
            `¿Querés aceptar la propuesta de $${price.toLocaleString('es-AR')}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aceptar',
                    onPress: () => {
                        navigation.navigate('Payment', {
                            requestId: requestId,
                            requestTitle: request?.title || 'Servicio contratado',
                            providerName: targetProvider?.name || 'Profesional',
                            providerImageUrl: targetProvider?.profile_picture || null,
                            priceLabel: `$${priceFormatted} ${currency}`,
                            proposal: {
                                id: proposal.id,
                                quoted_price: proposal.quoted_price,
                                currency: proposal.currency || 'ARS',
                                provider_rating_avg: targetProvider?.average_rating,
                                provider_total_reviews: targetProvider?.total_reviews,
                                provider_image_url: targetProvider?.profile_picture,
                                proposed_start_at: proposal.proposed_start_at,
                                proposed_end_at: proposal.proposed_end_at,
                                valid_until: proposal.valid_until,
                                notes: proposal.notes,
                            },
                        });
                    },
                },
            ]
        );
    }, [navigation, requestId, request, targetProvider]);

    if (isLoading && !request) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.iconButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Recontratación</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Cargando solicitud...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (isError || !request) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.iconButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Recontratación</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>
                        {error?.message || 'No pudimos cargar la solicitud'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const hasProposal = proposals.length > 0;
    const pendingProposal = proposals.find(
        (p) => p.status?.toUpperCase() === 'PENDING'
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.iconButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Recontratación</Text>
                </View>

                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Request Card - Info de la solicitud con imágenes */}
                    <View style={styles.requestCard}>
                        <View style={styles.rehireBadge}>
                            <Text style={styles.rehireBadgeText}>RECONTRATACIÓN</Text>
                        </View>
                        <Text style={styles.requestTitle}>{request.title}</Text>
                        <Text style={styles.requestDescription}>{request.description}</Text>
                        <View style={styles.requestMeta}>
                            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                            <Text style={styles.requestMetaText}>
                                Creada el {formatDate(request.created_at)}
                            </Text>
                        </View>

                        {/* Imágenes dentro del card de solicitud */}
                        {attachments.length > 0 && (
                            <View style={styles.attachmentsSection}>
                                <Text style={styles.attachmentsLabel}>Imágenes adjuntas</Text>
                                <View style={styles.attachmentsGrid}>
                                    {attachments.map((attachment, index) => (
                                        <Image
                                            key={attachment.id || index}
                                            source={{ uri: attachment.public_url }}
                                            style={styles.attachmentImage}
                                            resizeMode="cover"
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Provider Card - Info del profesional */}
                    <View style={styles.providerCard}>
                        <Text style={styles.sectionLabel}>Profesional</Text>
                        {targetProvider ? (
                            <View style={styles.providerContent}>
                                <Image
                                    source={{
                                        uri:
                                            targetProvider.profile_picture ||
                                            'https://dthezntil550i.cloudfront.net/f4/latest/f41908291942413280009640715/1280_960/1b2d9510-d66d-43a2-971a-cfcbb600e7fe.png',
                                    }}
                                    style={styles.providerAvatar}
                                />
                                <View style={styles.providerInfoColumn}>
                                    <Text style={styles.providerName}>
                                        {targetProvider.name || 'Profesional'}
                                    </Text>
                                    <View style={styles.providerStatsRow}>
                                        <Ionicons name="star" size={14} color="#F59E0B" />
                                        <Text style={styles.ratingText}>
                                            {targetProvider.average_rating > 0
                                                ? Number(targetProvider.average_rating).toFixed(1)
                                                : 'Nuevo'}
                                        </Text>
                                        {targetProvider.total_reviews > 0 && (
                                            <Text style={styles.reviewsText}>
                                                ({targetProvider.total_reviews} reseñas)
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <Text style={styles.noProviderText}>
                                No se encontró información del profesional
                            </Text>
                        )}

                        {/* Propuesta del profesional (si existe) */}
                        {hasProposal ? (
                            <View style={styles.proposalSection}>
                                {proposals.map((proposal) => (
                                    <View key={proposal.id} style={styles.proposalItem}>
                                        <View style={styles.proposalHeader}>
                                            <Text style={styles.proposalLabel}>Presupuesto</Text>
                                            <Text style={styles.proposalPrice}>
                                                ${Number(proposal.quoted_price || 0).toLocaleString('es-AR')}
                                            </Text>
                                        </View>
                                        {proposal.notes && (
                                            <Text style={styles.proposalNotes}>
                                                {proposal.notes}
                                            </Text>
                                        )}
                                        <Text style={styles.proposalDate}>
                                            Enviado el {formatDate(proposal.created_at)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.waitingSection}>
                                <View style={styles.waitingBadge}>
                                    <Ionicons name="time-outline" size={14} color="#92400E" />
                                    <Text style={styles.waitingBadgeText}>
                                        Esperando presupuesto
                                    </Text>
                                </View>
                                <Text style={styles.waitingHint}>
                                    El profesional recibirá tu solicitud y te enviará su presupuesto
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Info Banner */}
                    <View style={styles.infoBanner}>
                        <Ionicons name="information-circle" size={20} color="#4F46E5" />
                        <Text style={styles.infoBannerText}>
                            Esta solicitud fue enviada específicamente a este profesional porque
                            ya trabajaste con él anteriormente.
                        </Text>
                    </View>
                </ScrollView>

                {/* Footer con botón de aceptar (si hay propuesta pendiente) */}
                {pendingProposal && (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={() => handleAcceptProposal(pendingProposal)}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            <Text style={styles.acceptButtonText}>
                                Aceptar y pagar ${Number(pendingProposal.quoted_price || 0).toLocaleString('es-AR')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

export default RehireDetailScreen;
