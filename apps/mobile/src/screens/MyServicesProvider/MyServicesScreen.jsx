import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import styles, { SERVICE_STATUS_COLORS } from './MyServices.styles';
import { PALETTE, STATUS_CARD_COLORS as HOME_STATUS_COLORS } from '../HomePage/HomePage.styles';
import { useProviderServices } from '../../hooks/useProviderServices';

const brandIcon = require('../../../assets/icon.png');

const STATUS_LABELS = {
  CONFIRMED: 'Confirmado',
  ON_ROUTE: 'En camino',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado',
  CANCELED: 'Cancelado',
};

const DEFAULT_STATUS_COLORS = {
  background: '#F8FAFC',
  pill: '#CBD5F5',
  text: '#334155',
};

const SERVICE_TITLE_FALLBACK = 'Servicio sin título';
const CLIENT_FALLBACK = 'Cliente reservado';

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
    return parsed.toISOString();
  }
}

function formatRelativeUpdate(timestamp) {
  if (!timestamp) {
    return 'Actualizado recientemente';
  }

  const diff = Date.now() - timestamp;
  if (!Number.isFinite(diff) || diff < 0) {
    return 'Actualizado recientemente';
  }

  const minute = 60000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return 'Hace instantes';
  }
  if (diff < hour) {
    const minutes = Math.round(diff / minute);
    return minutes === 1 ? 'Hace 1 minuto' : `Hace ${minutes} minutos`;
  }
  if (diff < day) {
    const hours = Math.round(diff / hour);
    return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`;
  }

  const days = Math.round(diff / day);
  return days === 1 ? 'Hace 1 día' : `Hace ${days} días`;
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

function formatPriceLabel(service) {
  const amount = service?.total_price ?? service?.quoted_price;
  if (amount === null || amount === undefined) {
    return null;
  }

  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: service?.currency || 'ARS',
      minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
      maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    }).format(numeric);
  } catch (error) {
    return `${service?.currency || 'ARS'} ${numeric.toFixed(2)}`;
  }
}

function getStatusColors(status) {
  return SERVICE_STATUS_COLORS[status] || DEFAULT_STATUS_COLORS;
}

function getServiceTitle(service) {
  return service?.request?.title?.trim() || SERVICE_TITLE_FALLBACK;
}

function getClientName(service) {
  return service?.client_name || CLIENT_FALLBACK;
}

function getClientAvatarUrl(service) {
  const direct = typeof service?.client_avatar_url === 'string' ? service.client_avatar_url.trim() : '';
  if (direct) {
    return direct;
  }

  const nested = typeof service?.client?.profile_image_url === 'string'
    ? service.client.profile_image_url.trim()
    : '';
  return nested || null;
}

function getCityLabel(service) {
  return (
    service?.request?.city_snapshot ||
    service?.address_snapshot?.city ||
    'Ubicación a coordinar'
  );
}

function getStatusIconName(status) {
  if (status === 'IN_PROGRESS') {
    return 'flash-outline';
  }
  if (status === 'ON_ROUTE') {
    return 'walk-outline';
  }
  if (status === 'CONFIRMED') {
    return 'calendar-outline';
  }
  return 'briefcase-outline';
}

function getOrderTimestamp(service) {
  const priority = {
    IN_PROGRESS: 0,
    ON_ROUTE: 0,
    CONFIRMED: 1,
    COMPLETED: 2,
    CANCELED: 3,
  };

  const statusWeight = priority[service?.status] ?? 99;
  const scheduled = parseDate(service?.scheduled_start_at) || parseDate(service?.request?.preferred_start_at);
  const fallback = parseDate(service?.created_at) || new Date(8640000000000000);
  const timestamp = scheduled ? scheduled.getTime() : fallback.getTime();

  return { statusWeight, timestamp };
}

function getLatestHistoryTimestamp(service) {
  if (!service) {
    return 0;
  }

  let latest = 0;

  const historyItems = Array.isArray(service.status_history) ? service.status_history : [];
  historyItems.forEach((item) => {
    const parsed = parseDate(item?.changed_at);
    if (parsed) {
      const time = parsed.getTime();
      if (Number.isFinite(time) && time > latest) {
        latest = time;
      }
    }
  });

  const fallbackCandidates = [
    service.status_changed_at,
    service.updated_at,
    service.completed_at,
    service.created_at,
    service.request?.updated_at,
    service.request?.preferred_start_at,
  ];

  fallbackCandidates.forEach((value) => {
    const parsed = parseDate(value);
    if (parsed) {
      const time = parsed.getTime();
      if (Number.isFinite(time) && time > latest) {
        latest = time;
      }
    }
  });

  return latest;
}

function normalizePhone(raw) {
  if (!raw) {
    return null;
  }

  const cleaned = String(raw).replace(/\s+/g, '');
  return cleaned.length ? cleaned : null;
}

function resolveCompletedLabel(service) {
  const timestamp = service?.completed_at || service?.updated_at || service?.status_changed_at;
  return formatDateTime(timestamp);
}
function getClientReview(service) {
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

  if (service.client_id !== undefined && service.client_id !== null) {
    const match = reviews.find((review) => review?.rater_user_id === service.client_id);
    if (match) {
      return match;
    }
  }

  return reviews[0] || null;
}

export default function MyServicesScreen() {
  const navigation = useNavigation();
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useProviderServices();

  const [showCompleted, setShowCompleted] = useState(false);

  const services = Array.isArray(data) ? data : [];

  const orderedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      const recentA = getLatestHistoryTimestamp(a);
      const recentB = getLatestHistoryTimestamp(b);

      if (recentA !== recentB) {
        return recentB - recentA;
      }

      const orderA = getOrderTimestamp(a);
      const orderB = getOrderTimestamp(b);

      if (orderA.statusWeight !== orderB.statusWeight) {
        return orderA.statusWeight - orderB.statusWeight;
      }

      return orderA.timestamp - orderB.timestamp;
    });
  }, [services]);

  const activeServices = useMemo(
    () => orderedServices.filter((service) => ['IN_PROGRESS', 'ON_ROUTE', 'CONFIRMED'].includes(service?.status)),
    [orderedServices],
  );

  const completedServices = useMemo(
    () => orderedServices.filter((service) => service?.status === 'COMPLETED'),
    [orderedServices],
  );

  const handleOpenServiceDetail = useCallback((service) => {
    if (!service) {
      return;
    }

    navigation.navigate('ProviderServiceDetail', {
      serviceId: service.id,
      requestId: service.request?.id ?? service.request_id,
      serviceSnapshot: service,
    });
  }, [navigation]);

  const handleCallClient = useCallback((service) => {
    const phone = normalizePhone(service?.client_phone);
    if (!phone) {
      Alert.alert('Sin teléfono disponible', 'Pedile al cliente que actualice sus datos de contacto.');
      return;
    }

    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('No se pudo iniciar la llamada', 'Intentá llamar de forma manual.');
    });
  }, []);

  const renderActiveServiceCard = useCallback((service) => {
    if (!service) {
      return null;
    }

    const colors = getStatusColors(service.status);
    const statusLabel = STATUS_LABELS[service.status] || service.status || 'Sin estado';
    const priceLabel = formatPriceLabel(service);
    const clientAvatarUrl = getClientAvatarUrl(service);
    const clientAvatarSource = clientAvatarUrl ? { uri: clientAvatarUrl } : brandIcon;
    const latestTimestamp = getLatestHistoryTimestamp(service);
    const updateLabel = formatRelativeUpdate(latestTimestamp);

    return (
      <View key={service.id} style={[styles.activeCard, { borderColor: colors.pill }]}>
        <View style={styles.activeHeaderRow}>
          <View style={[styles.statusChip, { backgroundColor: colors.pill }]}>
            <Ionicons name={getStatusIconName(service.status)} size={14} style={[styles.statusChipIcon, { color: colors.text }]} />
            <Text style={[styles.statusChipText, { color: colors.text }]}>{statusLabel}</Text>
          </View>
          <Text style={styles.updateLabel}>{updateLabel}</Text>
        </View>

        <Text style={styles.activeTitle} numberOfLines={2}>
          {getServiceTitle(service)}
        </Text>

        <View style={styles.clientRow}>
          <Image source={clientAvatarSource} style={styles.clientAvatar} />
          <View style={styles.clientInfo}>
            <Text style={styles.clientLabel}>Cliente</Text>
            <Text style={styles.clientName} numberOfLines={1}>
              {getClientName(service)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} style={styles.metaIcon} />
          <Text style={styles.metaText} numberOfLines={2}>
            {formatScheduleRange(service)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={16} style={styles.metaIcon} />
          <Text style={styles.metaText} numberOfLines={1}>
            {getCityLabel(service)}
          </Text>
        </View>

        {priceLabel ? (
          <View style={styles.metaRow}>
            <Ionicons name="cash-outline" size={16} style={styles.metaIcon} />
            <Text style={styles.metaText} numberOfLines={1}>
              {priceLabel}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionPrimary]}
            onPress={() => handleOpenServiceDetail(service)}
            activeOpacity={0.9}
          >
            <Ionicons name="eye-outline" size={16} style={styles.actionIcon} />
            <Text style={styles.actionLabel}>Ver detalle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonLast, styles.actionSecondary, !service?.client_phone && styles.actionDisabled]}
            onPress={() => handleCallClient(service)}
            activeOpacity={service?.client_phone ? 0.9 : 1}
            disabled={!service?.client_phone}
          >
            <Ionicons name="call-outline" size={16} style={styles.actionIcon} />
            <Text style={styles.actionLabel}>{service?.client_phone ? 'Llamar' : 'Sin teléfono'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleCallClient, handleOpenServiceDetail]);

  const renderCompletedService = useCallback((service) => {
    if (!service) {
      return null;
    }

    const priceLabel = formatPriceLabel(service);
    const review = getClientReview(service);
    const ratingValue = Number.isFinite(Number(review?.rating)) ? Math.max(0, Math.min(5, Number(review.rating))) : null;

    return (
      <TouchableOpacity
        key={service.id}
        style={styles.completedCard}
        activeOpacity={0.88}
        onPress={() => handleOpenServiceDetail(service)}
      >
        <View style={styles.completedTitleRow}>
          <Text style={styles.completedTitle} numberOfLines={1}>
            {getServiceTitle(service)}
          </Text>
          <Ionicons name="chevron-forward" size={16} style={styles.completedChevron} />
        </View>
        <Text style={styles.completedMeta}>{resolveCompletedLabel(service)}</Text>
        {priceLabel ? <Text style={styles.completedMeta}>{priceLabel}</Text> : null}
        {ratingValue ? (
          <View style={styles.completedReviewSection}>
            <View style={styles.ratingRow}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Ionicons
                  key={`completed-review-${service.id}-${index}`}
                  name={index < ratingValue ? 'star' : 'star-outline'}
                  size={14}
                  style={styles.ratingStar}
                  color="#F59E0B"
                />
              ))}
              <Text style={styles.ratingLabel}>{`${ratingValue}/5`}</Text>
            </View>
            {review?.comment ? (
              <Text style={styles.ratingComment} numberOfLines={2}>
                {review.comment}
              </Text>
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }, [handleOpenServiceDetail]);

  const toggleCompleted = useCallback(() => {
    setShowCompleted((prev) => !prev);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
          <Text style={styles.loadingText}>Cargando servicios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={(
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={PALETTE.primary}
            colors={[PALETTE.primary]}
          />
        )}
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image source={brandIcon} style={styles.brandIcon} />
              <View>
                <Text style={styles.brandTitle}>Fast Services</Text>
                <Text style={styles.brandSubtitle}>Mis servicios</Text>
              </View>
            </View>
          </View>
        </View>

        {isError ? (
          <Text style={styles.errorText}>
            No pudimos cargar los servicios. Deslizá hacia abajo para reintentar.
          </Text>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Servicios en progreso</Text>
          {activeServices.length ? (
            <View style={styles.sectionCounter}>
              <Text style={styles.sectionCounterText}>{activeServices.length}</Text>
            </View>
          ) : null}
        </View>

        {activeServices.length ? (
          <View style={styles.activeList}>
            {activeServices.map((service) => renderActiveServiceCard(service))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={28} color={PALETTE.textSecondary} />
            <Text style={styles.emptyStateText}>Todavía no tenés servicios en curso.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.completedToggle} onPress={toggleCompleted} activeOpacity={0.85}>
          <View style={styles.completedToggleLeft}>
            <View style={[styles.completedBadge, { backgroundColor: HOME_STATUS_COLORS.completed.pill }]}>
              <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.completedToggleText}>Servicios completados</Text>
          </View>
          <View style={styles.completedToggleRight}>
            <Text style={styles.completedCount}>{completedServices.length}</Text>
            <Ionicons
              name={showCompleted ? 'chevron-up' : 'chevron-down'}
              size={18}
              style={styles.completedChevron}
            />
          </View>
        </TouchableOpacity>

        {showCompleted ? (
          completedServices.length ? (
            <View style={styles.completedList}>
              {completedServices.map((service) => renderCompletedService(service))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-outline" size={26} color={PALETTE.textSecondary} />
              <Text style={styles.emptyStateText}>Todavía no registraste servicios completados.</Text>
            </View>
          )
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}