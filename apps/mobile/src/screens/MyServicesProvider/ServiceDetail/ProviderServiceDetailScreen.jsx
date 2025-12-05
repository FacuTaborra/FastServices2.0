import React, { useMemo, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Linking,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import styles, { TIMELINE_COLORS } from './ProviderServiceDetailScreen.styles';
import { PALETTE } from '../../HomePage/HomePage.styles';

const brandIcon = require('../../../../assets/icon.png');
import {
    useProviderServices,
    useMarkProviderServiceOnRoute,
    useMarkProviderServiceInProgress,
    useMarkProviderServiceCompleted,
} from '../../../hooks/useProviderServices';

const STATUS_LABELS = {
    CONFIRMED: 'Confirmado',
    ON_ROUTE: 'En camino',
    IN_PROGRESS: 'En progreso',
    COMPLETED: 'Completado',
    CANCELED: 'Cancelado',
};

const STATUS_DESCRIPTIONS = {
    CONFIRMED: 'El servicio quedó confirmado con el cliente y puede reprogramarse si es necesario.',
    ON_ROUTE: 'Saliste hacia el domicilio del cliente. Avisá cualquier demora al cliente.',
    IN_PROGRESS: 'El servicio se encuentra en ejecución. Asegurate de registrar avances con el cliente.',
    COMPLETED: 'Marcaste el servicio como completado. Recordá solicitar la valoración del cliente.',
    CANCELED: 'El servicio fue cancelado por el cliente o por el equipo de soporte.',
};

const STATUS_BADGE_THEME = {
    CONFIRMED: {
        background: '#e0f2fe',
        text: '#1d4ed8',
    },
    ON_ROUTE: {
        background: '#dbeafe',
        text: '#1d4ed8',
    },
    IN_PROGRESS: {
        background: '#ecfdf5',
        text: '#047857',
    },
    COMPLETED: {
        background: '#dcfce7',
        text: '#166534',
    },
    CANCELED: {
        background: '#fee2e2',
        text: '#b91c1c',
    },
};

const REQUEST_TYPE_LABELS = {
    FAST: 'Fast',
    FAST_MATCH: 'Fast',
    LICITACION: 'Licitación',
    BUDGET: 'Licitación',
};

function parseDate(value) {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
    const parsed = parseDate(value);
    if (!parsed) {
        return 'A coordinar';
    }

    try {
        return parsed.toLocaleString('es-AR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
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

function formatScheduleRange(service) {
    const start = service?.scheduled_start_at || service?.request?.preferred_start_at;
    const end = service?.scheduled_end_at || service?.request?.preferred_end_at;

    const startLabel = formatDateTime(start);
    if (!end) {
        return startLabel;
    }

    const endLabel = formatDateTime(end);
    return `${startLabel} · ${endLabel}`;
}

function formatCurrency(value, currencyCode = 'ARS') {
    if (value === null || value === undefined) {
        return null;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
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
        return `${currencyCode} ${numeric.toFixed(2)}`;
    }
}

function normalizePhone(rawPhone) {
    if (!rawPhone) {
        return null;
    }

    return String(rawPhone).replace(/\s+/g, '');
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

function collectAddressParts(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
        return [];
    }

    const streetName =
        snapshot.street ??
        snapshot.street_name ??
        snapshot.streetName ??
        snapshot.street_address ??
        snapshot.streetAddress ??
        snapshot.street_line ??
        snapshot.streetLine ??
        snapshot.route ??
        null;

    const streetNumber =
        snapshot.street_number ??
        snapshot.streetNumber ??
        snapshot.number ??
        snapshot.house_number ??
        snapshot.houseNumber ??
        null;

    const composedStreet = streetName
        ? `${streetName}${streetNumber ? ` ${streetNumber}` : ''}`
        : null;

    const rawParts = [
        composedStreet,
        snapshot.line1,
        snapshot.line2,
        snapshot.floor,
        snapshot.apartment,
        snapshot.reference,
        snapshot.neighborhood,
        snapshot.district,
        snapshot.locality,
        snapshot.city,
        snapshot.city_snapshot,
        snapshot.province,
        snapshot.region,
        snapshot.state,
        snapshot.postal_code,
        snapshot.zip_code,
        snapshot.country,
    ];

    if (!composedStreet && streetName) {
        rawParts.unshift(streetName);
    }

    if (!composedStreet && streetNumber) {
        rawParts.splice(1, 0, streetNumber);
    }

    if (snapshot.address && typeof snapshot.address === 'string') {
        rawParts.push(snapshot.address);
    }

    const seen = new Set();
    const parts = [];

    rawParts.forEach((value) => {
        if (value === null || value === undefined) {
            return;
        }

        const stringValue = String(value).trim();
        if (!stringValue.length) {
            return;
        }

        const normalized = stringValue.toLowerCase();
        if (seen.has(normalized)) {
            return;
        }

        seen.add(normalized);
        parts.push(stringValue);
    });

    return parts;
}

function resolveAddress(service) {
    const candidates = [
        service?.address_snapshot,
        service?.request?.address_snapshot,
    ];

    for (const snapshot of candidates) {
        const parts = collectAddressParts(snapshot);
        if (parts.length) {
            return parts.join(', ');
        }
    }

    const fallbacks = [service?.request?.address, service?.request?.city_snapshot]
        .filter((value) => typeof value === 'string' && value.trim().length);

    if (fallbacks.length) {
        return fallbacks.join(', ');
    }

    return 'Ubicación a coordinar';
}

function extractCoordinates(service) {
    const sources = [
        service?.address_snapshot,
        service?.request?.address_snapshot,
        service?.request,
    ];

    for (const source of sources) {
        if (!source || typeof source !== 'object') {
            continue;
        }

        const latCandidate =
            source.latitude ??
            source.lat ??
            source.lat_snapshot ??
            source.latSnapshot ??
            source.latitud ??
            source.coordinates?.lat ??
            source.coordinates?.latitude ??
            null;

        const lonCandidate =
            source.longitude ??
            source.lon ??
            source.lng ??
            source.lon_snapshot ??
            source.lng_snapshot ??
            source.lonSnapshot ??
            source.longitud ??
            source.coordinates?.lng ??
            source.coordinates?.longitude ??
            null;

        const lat = latCandidate !== null && latCandidate !== undefined ? Number(latCandidate) : null;
        const lon = lonCandidate !== null && lonCandidate !== undefined ? Number(lonCandidate) : null;

        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return { lat, lon };
        }
    }

    return null;
}

function buildMapsUrl(service, addressLabel) {
    const coordinates = extractCoordinates(service);
    if (coordinates) {
        const lat = coordinates.lat.toFixed(6);
        const lon = coordinates.lon.toFixed(6);
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }

    if (addressLabel && addressLabel !== 'Ubicación a coordinar') {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLabel)}`;
    }

    return null;
}

function getRequestTypeLabel(service) {
    const rawType = service?.request?.request_type || service?.request_type;
    if (!rawType) {
        return 'Servicio';
    }

    const normalized = String(rawType).toUpperCase();
    if (REQUEST_TYPE_LABELS[normalized]) {
        return REQUEST_TYPE_LABELS[normalized];
    }

    return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function getStatusBadgeTheme(status) {
    return STATUS_BADGE_THEME[status] || {
        background: '#e2e8f0',
        text: '#334155',
    };
}

function getClientAvatarUrl(service) {
    if (!service) {
        return null;
    }

    const candidates = [
        service.client_avatar_url,
        service.client?.profile_image_url,
        service.client?.avatar_url,
        service.client?.photo_url,
        service.client?.image_url,
        service.request?.client?.profile_image_url,
        service.request?.client?.avatar_url,
    ];

    for (const candidate of candidates) {
        if (typeof candidate !== 'string') {
            continue;
        }

        const trimmed = candidate.trim();
        if (trimmed.length) {
            return trimmed;
        }
    }

    return null;
}

const BASE_STATUS_FLOW = ['CONFIRMED', 'ON_ROUTE', 'IN_PROGRESS', 'COMPLETED'];

function extractClientReview(service) {
    if (!service) {
        return null;
    }

    if (service.client_review) {
        return service.client_review;
    }

    const reviews = Array.isArray(service.reviews) ? service.reviews : [];
    if (!reviews.length) {
        return null;
    }

    const match = reviews.find((review) => review?.rater_user_id === service.client_id);
    return match || null;
}

function buildTimelineEntries(service) {
    if (!service) {
        return [];
    }

    const historyItems = Array.isArray(service.status_history) ? [...service.status_history] : [];
    const historyByStatus = new Map();
    historyItems.forEach((item) => {
        const status = item?.to_status;
        if (!status) {
            return;
        }

        const timestamp = parseDate(item.changed_at)?.getTime() ?? null;
        const existing = historyByStatus.get(status);
        if (!existing || (timestamp !== null && timestamp < existing.timestamp)) {
            historyByStatus.set(status, {
                timestamp,
                changed_at: item.changed_at,
                raw: item,
            });
        }
    });

    const finalStatus = service.status;
    const normalizedFinalStatus = typeof finalStatus === 'string' ? finalStatus : String(finalStatus);
    const completedReached = historyByStatus.has('COMPLETED') || normalizedFinalStatus === 'COMPLETED';

    const flow = [...BASE_STATUS_FLOW];
    if (normalizedFinalStatus === 'CANCELED') {
        flow.push('CANCELED');
    }
    if (!flow.includes(normalizedFinalStatus)) {
        flow.push(normalizedFinalStatus);
    }

    const uniqueFlow = flow.filter((status, index, array) => array.indexOf(status) === index);
    const currentIndex = Math.max(uniqueFlow.indexOf(normalizedFinalStatus), 0);

    const entries = uniqueFlow.map((status, index) => {
        const record = historyByStatus.get(status);
        let timestampLabel = null;
        if (record?.changed_at) {
            timestampLabel = formatDateTime(record.changed_at);
        } else if (status === 'CONFIRMED') {
            timestampLabel = formatDateTime(service.created_at);
        } else if (status === normalizedFinalStatus) {
            timestampLabel = formatDateTime(service.updated_at);
        }

        const label = STATUS_LABELS[status] || status;
        const description = STATUS_DESCRIPTIONS[status] || null;

        let paletteKey;
        if (status === 'CANCELED') {
            paletteKey = 'canceled';
        } else if (status === 'COMPLETED' && completedReached) {
            paletteKey = 'done';
        } else if (index < currentIndex) {
            paletteKey = 'done';
        } else if (status === normalizedFinalStatus) {
            paletteKey = 'active';
        } else {
            paletteKey = 'pending';
        }
        const paletteColor = TIMELINE_COLORS[paletteKey] || TIMELINE_COLORS.pending;
        const isCanceled = status === 'CANCELED';
        const isCurrent = status === normalizedFinalStatus;
        const isPast = index < currentIndex && !isCanceled;
        const connectorColor = isCanceled
            ? TIMELINE_COLORS.canceled
            : isPast || isCurrent
                ? paletteColor
                : '#dbeafe';

        return {
            key: `timeline-${status}-${index}`,
            status,
            label,
            timestamp: timestampLabel,
            description,
            paletteColor,
            connectorColor,
            isFirst: index === 0,
            isLast: index === uniqueFlow.length - 1,
            isActive: status === normalizedFinalStatus,
            isDone: (index < currentIndex || (status === 'COMPLETED' && completedReached)) && status !== 'CANCELED',
        };
    });

    const review = extractClientReview(service);
    if (review) {
        const sanitizedComment = typeof review.comment === 'string' ? review.comment.trim() : null;
        const numericRating = Number(review.rating);
        const safeRating = Number.isFinite(numericRating)
            ? Math.min(5, Math.max(0, Math.round(numericRating)))
            : 0;
        entries.push({
            key: 'timeline-review',
            status: 'CLIENT_REVIEW',
            label: 'Calificación del cliente',
            timestamp: formatDateTime(review.created_at),
            description: sanitizedComment && sanitizedComment.length ? sanitizedComment : null,
            paletteColor: TIMELINE_COLORS.review,
            connectorColor: TIMELINE_COLORS.review,
            isFirst: entries.length === 0,
            isLast: true,
            isActive: false,
            isDone: true,
            isReview: true,
            rating: safeRating,
        });
    }

    return entries.map((entry, index) => ({
        ...entry,
        isFirst: index === 0,
        isLast: index === entries.length - 1,
    }));
}

export default function ProviderServiceDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    const {
        serviceId,
        requestId,
        serviceSnapshot,
    } = route.params ?? {};

    const {
        data,
        isFetching,
        isLoading,
        isError,
        refetch,
    } = useProviderServices(null, {
        enabled: true,
        refetchOnWindowFocus: false,
    });

    const markOnRouteMutation = useMarkProviderServiceOnRoute();
    const markInProgressMutation = useMarkProviderServiceInProgress();
    const markCompletedMutation = useMarkProviderServiceCompleted();

    const services = Array.isArray(data) ? data : [];
    const resolvedFromQuery = useMemo(
        () => services.find((item) => item.id === serviceId),
        [services, serviceId],
    );

    const service = useMemo(() => {
        if (resolvedFromQuery) {
            return {
                ...serviceSnapshot,
                ...resolvedFromQuery,
                request: resolvedFromQuery.request || serviceSnapshot?.request || null,
                status_history: Array.isArray(resolvedFromQuery.status_history)
                    ? resolvedFromQuery.status_history
                    : serviceSnapshot?.status_history || [],
            };
        }

        return serviceSnapshot || null;
    }, [resolvedFromQuery, serviceSnapshot]);

    const requestPreview = service?.request ?? null;
    const statusTheme = getStatusBadgeTheme(service?.status);
    const priceLabel = formatCurrency(
        service?.total_price ?? service?.quoted_price,
        service?.currency || 'ARS',
    );

    const timelineEntries = useMemo(
        () => buildTimelineEntries(service),
        [service],
    );

    const attachments = useMemo(
        () => (Array.isArray(requestPreview?.attachments) ? requestPreview.attachments : []),
        [requestPreview],
    );

    const addressLabel = useMemo(
        () => resolveAddress(service),
        [service],
    );

    const hasConcreteAddress = Boolean(addressLabel && addressLabel !== 'Ubicación a coordinar');

    const requestTypeLabel = useMemo(
        () => getRequestTypeLabel(service),
        [service],
    );

    const clientName = service?.client_name || 'Reservado';
    const clientAvatarUrl = useMemo(
        () => getClientAvatarUrl(service),
        [service],
    );
    const clientAvatarSource = clientAvatarUrl ? { uri: clientAvatarUrl } : brandIcon;

    const mapsUrl = useMemo(
        () => (service ? buildMapsUrl(service, hasConcreteAddress ? addressLabel : null) : null),
        [service, addressLabel, hasConcreteAddress],
    );

    const canOpenMap = Boolean(mapsUrl);

    // Validar si es momento permitido para "En camino" (ej. 2 horas antes del inicio)
    const scheduledStart = service?.scheduled_start_at ? new Date(service.scheduled_start_at) : null;
    const now = new Date();
    const isTooEarly = scheduledStart && (scheduledStart.getTime() - now.getTime()) > (2 * 60 * 60 * 1000);

    const canMarkOnRoute = service?.status === 'CONFIRMED' && Boolean(serviceId) && !isTooEarly;
    const canMarkInProgress = service?.status === 'ON_ROUTE' && Boolean(serviceId);
    const canMarkCompleted = service?.status === 'IN_PROGRESS' && Boolean(serviceId);
    const isMarkingOnRoute = markOnRouteMutation.isPending;
    const isMarkingInProgress = markInProgressMutation.isPending;
    const isMarkingCompleted = markCompletedMutation.isPending;

    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleOpenRequest = useCallback(() => {
        if (!requestId && !service?.request_id) {
            return;
        }

        navigation.navigate('ProviderRequestDetail', {
            requestId: requestId || service?.request_id,
            requestPreview,
        });
    }, [navigation, requestId, requestPreview, service?.request_id]);

    const handleCallClient = useCallback(() => {
        const phone = normalizePhone(service?.client_phone);
        if (!phone) {
            return;
        }

        Linking.openURL(`tel:${phone}`).catch(() => {
            Alert.alert('No se pudo iniciar la llamada', 'Intentá comunicarte de forma manual.');
        });
    }, [service?.client_phone]);

    const handleOpenMap = useCallback(() => {
        if (!mapsUrl) {
            return;
        }

        Linking.openURL(mapsUrl).catch(() => {
            Alert.alert('No se pudo abrir el mapa', 'Intentá abrir la ubicación de forma manual.');
        });
    }, [mapsUrl]);

    const handleMarkOnRoute = useCallback(() => {
        if (!serviceId) {
            return;
        }

        markOnRouteMutation.mutate(
            { serviceId },
            {
                onSuccess: () => {
                    refetch();
                    Alert.alert('Servicio en camino', 'Le avisamos al cliente que ya estás en camino.');
                },
                onError: (error) => {
                    const message = error?.response?.data?.detail || error?.message || 'No pudimos actualizar el servicio.';
                    Alert.alert('Error', message);
                },
            },
        );
    }, [markOnRouteMutation, refetch, serviceId]);

    const handleMarkInProgress = useCallback(() => {
        if (!serviceId) {
            return;
        }

        markInProgressMutation.mutate(
            { serviceId },
            {
                onSuccess: () => {
                    refetch();
                    Alert.alert('Servicio en progreso', 'Marcamos el servicio como iniciado.');
                },
                onError: (error) => {
                    const message = error?.response?.data?.detail || error?.message || 'No pudimos actualizar el servicio.';
                    Alert.alert('Error', message);
                },
            },
        );
    }, [markInProgressMutation, refetch, serviceId]);

    const handleMarkCompleted = useCallback(() => {
        if (!serviceId) {
            return;
        }

        markCompletedMutation.mutate(
            { serviceId },
            {
                onSuccess: () => {
                    refetch();
                    Alert.alert('Servicio finalizado', 'Marcaste el servicio como completado.');
                },
                onError: (error) => {
                    const message = error?.response?.data?.detail || error?.message || 'No pudimos actualizar el servicio.';
                    Alert.alert('Error', message);
                },
            },
        );
    }, [markCompletedMutation, refetch, serviceId]);

    const isEmpty = !service && !isLoading && !isFetching;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={20} color={PALETTE.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        Detalle del servicio
                    </Text>
                    <View style={styles.headerPlaceholder} />
                </View>

                {isLoading && !serviceSnapshot ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color={PALETTE.primary} />
                        <Text style={styles.emptyStateText}>Cargando detalle...</Text>
                    </View>
                ) : null}

                {isError && !service ? (
                    <View style={styles.alertBanner}>
                        <Ionicons name="warning-outline" size={18} style={styles.alertIcon} />
                        <Text style={styles.alertText}>
                            No pudimos cargar este servicio. Deslizá hacia abajo para reintentar.
                        </Text>
                    </View>
                ) : null}

                {service ? (
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={(
                            <RefreshControl
                                refreshing={Boolean(isFetching)}
                                onRefresh={handleRefresh}
                                tintColor={PALETTE.primary}
                                colors={[PALETTE.primary]}
                            />
                        )}
                    >
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryHeader}>
                                <View style={styles.summaryHeaderLeft}>
                                    <View style={styles.summaryIcon}>
                                        <Ionicons name="briefcase-outline" size={22} color={PALETTE.primary} />
                                    </View>
                                    <View style={styles.summaryTextBlock}>
                                        <Text style={styles.summaryTitle} numberOfLines={1}>
                                            {requestTypeLabel}
                                        </Text>
                                    </View>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: statusTheme.background },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusBadgeText,
                                            { color: statusTheme.text },
                                        ]}
                                    >
                                        {STATUS_LABELS[service?.status] || service?.status || 'Sin estado'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.summaryClientRow}>
                                <Image source={clientAvatarSource} style={styles.summaryClientAvatar} />
                                <View style={styles.summaryClientInfo}>
                                    <Text style={styles.summaryClientLabel}>Cliente</Text>
                                    <Text style={styles.summaryClientName} numberOfLines={1}>
                                        {clientName}
                                    </Text>
                                    {service?.client_phone ? (
                                        <Text style={styles.summaryClientPhone} numberOfLines={1}>
                                            {service.client_phone}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>

                            <View style={styles.summaryDetails}>
                                <View style={styles.summaryDetailRow}>
                                    <View style={styles.summaryDetailIcon}>
                                        <Ionicons name="calendar-outline" size={18} color={PALETTE.primary} />
                                    </View>
                                    <View style={styles.summaryDetailText}>
                                        <Text style={styles.summaryDetailLabel}>Agenda</Text>
                                        <Text style={styles.summaryDetailValue} numberOfLines={2}>
                                            {formatScheduleRange(service)}
                                        </Text>
                                    </View>
                                </View>
                                {priceLabel ? (
                                    <View style={styles.summaryDetailRow}>
                                        <View style={styles.summaryDetailIcon}>
                                            <Ionicons name="pricetag-outline" size={18} color={PALETTE.primary} />
                                        </View>
                                        <View style={styles.summaryDetailText}>
                                            <Text style={styles.summaryDetailLabel}>Total</Text>
                                            <Text style={styles.summaryDetailValue} numberOfLines={1}>
                                                {priceLabel}
                                            </Text>
                                        </View>
                                    </View>
                                ) : null}
                            </View>

                            <View style={styles.summaryLocationCard}>
                                <View style={styles.summaryLocationRow}>
                                    <View style={styles.summaryLocationIcon}>
                                        <Ionicons name="location-outline" size={18} color={PALETTE.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.summarySectionLabel}>Dirección</Text>
                                        <Text style={styles.summaryLocationValue}>
                                            {addressLabel}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.summaryHint}>
                                    Generá recordatorios al cliente para evitar reprogramaciones de último momento.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Detalle del pedido</Text>

                            {service?.request?.title ? (
                                <View style={styles.infoRow}>
                                    <Ionicons name="bookmark-outline" size={18} style={styles.infoIcon} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>Título</Text>
                                        <Text style={styles.infoValue}>{service.request.title}</Text>
                                    </View>
                                </View>
                            ) : null}

                            <View style={styles.infoRow}>
                                <Ionicons name="document-text-outline" size={18} style={styles.infoIcon} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.infoLabel}>Descripción</Text>
                                    <Text style={styles.infoValue}>
                                        {requestPreview?.description || 'Sin descripción disponible.'}
                                    </Text>
                                </View>
                            </View>

                            {hasConcreteAddress ? (
                                <View style={styles.infoRow}>
                                    <Ionicons name="location-outline" size={18} style={styles.infoIcon} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>Dirección completa</Text>
                                        <Text style={styles.infoValue}>{addressLabel}</Text>
                                    </View>
                                </View>
                            ) : null}

                            <View style={styles.infoRow}>
                                <Ionicons name="person-outline" size={18} style={styles.infoIcon} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.infoLabel}>Contacto</Text>
                                    <Text style={styles.infoValue}>
                                        {clientName}
                                    </Text>
                                    {service?.client_phone ? (
                                        <Text style={styles.infoHint}>Teléfono: {service.client_phone}</Text>
                                    ) : null}
                                </View>
                            </View>

                            {attachments.length ? (
                                <View>
                                    <Text style={styles.infoLabel}>Adjuntos del cliente</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.attachmentList}
                                    >
                                        {attachments.map((attachment) => {
                                            const uri = resolveAttachmentUri(attachment);
                                            if (!uri) {
                                                return null;
                                            }

                                            return (
                                                <Image
                                                    key={attachment.id || uri}
                                                    source={{ uri }}
                                                    style={styles.attachmentImage}
                                                />
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            ) : null}
                        </View>

                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Historial del servicio</Text>
                            <View style={styles.timelineSection}>
                                {timelineEntries.length ? (
                                    timelineEntries.map((entry) => (
                                        <View
                                            style={[styles.timelineItem, entry.isLast && styles.timelineItemLast]}
                                            key={entry.key}
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
                                                {entry.isReview ? (
                                                    <>
                                                        <View style={styles.reviewStarsRow}>
                                                            {Array.from({ length: 5 }).map((_, starIndex) => (
                                                                <Ionicons
                                                                    key={`review-star-${starIndex}`}
                                                                    name={starIndex < entry.rating ? 'star' : 'star-outline'}
                                                                    size={16}
                                                                    style={styles.reviewStar}
                                                                    color={TIMELINE_COLORS.review}
                                                                />
                                                            ))}
                                                            {entry.rating > 0 ? (
                                                                <Text style={styles.reviewScore}>{`${entry.rating}/5`}</Text>
                                                            ) : null}
                                                        </View>
                                                        {entry.description ? (
                                                            <Text style={styles.reviewComment}>{entry.description}</Text>
                                                        ) : null}
                                                    </>
                                                ) : entry.description ? (
                                                    <Text style={styles.timelineDescription}>{entry.description}</Text>
                                                ) : null}

                                                {entry.status === 'CONFIRMED' && service?.status === 'CONFIRMED' ? (
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.timelineActionButton,
                                                            (isMarkingOnRoute || isTooEarly) && styles.timelineActionButtonDisabled,
                                                        ]}
                                                        activeOpacity={isMarkingOnRoute || isTooEarly ? 1 : 0.9}
                                                        onPress={
                                                            isTooEarly
                                                                ? () => Alert.alert('Aún es temprano', 'Podrás marcar "En camino" 2 horas antes del inicio programado.')
                                                                : (isMarkingOnRoute ? undefined : handleMarkOnRoute)
                                                        }
                                                        disabled={isMarkingOnRoute}
                                                    >
                                                        {isMarkingOnRoute ? (
                                                            <ActivityIndicator
                                                                size="small"
                                                                color="#FFFFFF"
                                                                style={styles.timelineActionSpinner}
                                                            />
                                                        ) : (
                                                            <Ionicons
                                                                name="walk-outline"
                                                                size={16}
                                                                style={styles.timelineActionIcon}
                                                            />
                                                        )}
                                                        <Text style={styles.timelineActionLabel}>
                                                            {isTooEarly ? 'Pendiente horario' : 'Estoy en camino'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ) : null}

                                                {entry.status === 'ON_ROUTE' && canMarkInProgress ? (
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.timelineActionButton,
                                                            styles.timelineActionButtonSecondary,
                                                            isMarkingInProgress && styles.timelineActionButtonDisabled,
                                                        ]}
                                                        activeOpacity={isMarkingInProgress ? 1 : 0.9}
                                                        onPress={isMarkingInProgress ? undefined : handleMarkInProgress}
                                                        disabled={isMarkingInProgress}
                                                    >
                                                        {isMarkingInProgress ? (
                                                            <ActivityIndicator
                                                                size="small"
                                                                color="#FFFFFF"
                                                                style={styles.timelineActionSpinner}
                                                            />
                                                        ) : (
                                                            <Ionicons
                                                                name="play-outline"
                                                                size={16}
                                                                style={styles.timelineActionIcon}
                                                            />
                                                        )}
                                                        <Text style={styles.timelineActionLabel}>Iniciar servicio</Text>
                                                    </TouchableOpacity>
                                                ) : null}

                                                {entry.status === 'IN_PROGRESS' && canMarkCompleted ? (
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.timelineActionButton,
                                                            styles.timelineActionButtonTertiary,
                                                            isMarkingCompleted && styles.timelineActionButtonDisabled,
                                                        ]}
                                                        activeOpacity={isMarkingCompleted ? 1 : 0.9}
                                                        onPress={isMarkingCompleted ? undefined : handleMarkCompleted}
                                                        disabled={isMarkingCompleted}
                                                    >
                                                        {isMarkingCompleted ? (
                                                            <ActivityIndicator
                                                                size="small"
                                                                color="#FFFFFF"
                                                                style={styles.timelineActionSpinner}
                                                            />
                                                        ) : (
                                                            <Ionicons
                                                                name="checkmark-done-outline"
                                                                size={16}
                                                                style={styles.timelineActionIcon}
                                                            />
                                                        )}
                                                        <Text style={styles.timelineActionLabel}>Finalizar servicio</Text>
                                                    </TouchableOpacity>
                                                ) : null}
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="time-outline" size={24} color={PALETTE.textSecondary} />
                                        <Text style={styles.emptyStateText}>
                                            Todavía no hay eventos registrados para este servicio.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Acciones rápidas</Text>

                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    activeOpacity={0.9}
                                    onPress={handleOpenRequest}
                                >
                                    <Ionicons name="documents-outline" size={18} style={styles.actionIcon} />
                                    <Text style={styles.actionLabel}>Ver solicitud</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        styles.actionButtonTertiary,
                                        !canOpenMap && styles.actionButtonDisabled,
                                    ]}
                                    activeOpacity={canOpenMap ? 0.9 : 1}
                                    onPress={canOpenMap ? handleOpenMap : undefined}
                                    disabled={!canOpenMap}
                                >
                                    <Ionicons name="map-outline" size={18} style={styles.actionIcon} />
                                    <Text style={styles.actionLabel}>Ver ubicación</Text>
                                    {!canOpenMap ? (
                                        <Ionicons
                                            name="alert-circle-outline"
                                            size={16}
                                            color="white"
                                            style={styles.refreshIndicator}
                                        />
                                    ) : null}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        styles.actionButtonSecondary,
                                        !service?.client_phone && styles.actionButtonDisabled,
                                    ]}
                                    activeOpacity={service?.client_phone ? 0.9 : 1}
                                    onPress={service?.client_phone ? handleCallClient : undefined}
                                    disabled={!service?.client_phone}
                                >
                                    <Ionicons name="call-outline" size={18} style={styles.actionIcon} />
                                    <Text style={styles.actionLabel}>Llamar cliente</Text>
                                    {!service?.client_phone ? (
                                        <Ionicons
                                            name="alert-circle-outline"
                                            size={16}
                                            color="white"
                                            style={styles.refreshIndicator}
                                        />
                                    ) : null}
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.helperText}>
                                Pronto vas a poder actualizar el estado del servicio y cargar comprobantes desde esta pantalla.
                            </Text>
                        </View>
                    </ScrollView>
                ) : null}

                {isEmpty ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="alert-circle-outline" size={26} color={PALETTE.textSecondary} />
                        <Text style={styles.emptyStateText}>
                            No encontramos información para este servicio.
                        </Text>
                    </View>
                ) : null}
            </View>
        </SafeAreaView>
    );
}
