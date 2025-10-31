import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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
    });
  } catch (error) {
    return parsed.toISOString();
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

function getCityLabel(service) {
  return (
    service?.request?.city_snapshot ||
    service?.address_snapshot?.city ||
    'Ubicación a coordinar'
  );
}

function getPrimaryBadgeText(status) {
  if (status === 'IN_PROGRESS') {
    return 'Servicio en curso';
  }
  if (status === 'CONFIRMED') {
    return 'Próximo servicio';
  }
  return 'Servicio asignado';
}

function getOrderTimestamp(service) {
  const priority = {
    IN_PROGRESS: 0,
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

export default function MyServicesScreen() {
  const navigation = useNavigation();
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useProviderServices();

  const services = Array.isArray(data) ? data : [];

  const orderedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      const orderA = getOrderTimestamp(a);
      const orderB = getOrderTimestamp(b);

      if (orderA.statusWeight !== orderB.statusWeight) {
        return orderA.statusWeight - orderB.statusWeight;
      }

      return orderA.timestamp - orderB.timestamp;
    });
  }, [services]);

  const inProgressServices = useMemo(
    () => orderedServices.filter((service) => service?.status === 'IN_PROGRESS'),
    [orderedServices],
  );

  const confirmedServices = useMemo(
    () => orderedServices.filter((service) => service?.status === 'CONFIRMED'),
    [orderedServices],
  );

  const nextConfirmed = useMemo(() => {
    if (!confirmedServices.length) {
      return null;
    }

    const now = Date.now();
    const upcoming = [...confirmedServices].sort((a, b) => {
      const timeA = parseDate(a?.scheduled_start_at)?.getTime() ?? parseDate(a?.request?.preferred_start_at)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const timeB = parseDate(b?.scheduled_start_at)?.getTime() ?? parseDate(b?.request?.preferred_start_at)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    });

    const firstInFuture = upcoming.find((service) => {
      const start = parseDate(service?.scheduled_start_at) || parseDate(service?.request?.preferred_start_at);
      if (!start) {
        return false;
      }
      return start.getTime() >= now;
    });

    return firstInFuture || upcoming[0];
  }, [confirmedServices]);

  const primaryService = inProgressServices[0] || nextConfirmed || null;
  const primaryServiceId = primaryService?.id ?? null;

  const upcomingServices = useMemo(() => {
    const remainingInProgress = inProgressServices.filter((service) => service.id !== primaryServiceId);
    const remainingConfirmed = confirmedServices.filter((service) => service.id !== primaryServiceId);
    return [...remainingInProgress, ...remainingConfirmed];
  }, [confirmedServices, inProgressServices, primaryServiceId]);

  const completedServices = useMemo(
    () => orderedServices.filter((service) => service?.status === 'COMPLETED'),
    [orderedServices],
  );

  const handleOpenServiceDetail = (service) => {
    if (!service) {
      return;
    }

    navigation.navigate('ServiceDetail', {
      requestId: service.request?.id ?? service.request_id,
      serviceId: service.id,
    });
  };

  const renderServiceCard = (service) => {
    if (!service) {
      return null;
    }

    const colors = getStatusColors(service.status);
    const statusLabel = STATUS_LABELS[service.status] || service.status || 'Sin estado';
    const priceLabel = formatPriceLabel(service);

    return (
      <TouchableOpacity
        key={service.id}
        style={[
          styles.serviceCard,
          { backgroundColor: colors.background, borderColor: colors.pill },
        ]}
        activeOpacity={0.92}
        onPress={() => handleOpenServiceDetail(service)}
      >
        <View style={styles.serviceCardHeader}>
          <Text style={styles.serviceTitle} numberOfLines={2}>
            {getServiceTitle(service)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: colors.pill },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: colors.text },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.serviceMetaRow}>
          <Ionicons name="calendar-outline" size={16} style={styles.serviceMetaIcon} />
          <Text style={styles.serviceMetaText} numberOfLines={2}>
            {formatScheduleRange(service)}
          </Text>
        </View>
        <View style={styles.serviceMetaRow}>
          <Ionicons name="location-outline" size={16} style={styles.serviceMetaIcon} />
          <Text style={styles.serviceMetaText} numberOfLines={1}>
            {getCityLabel(service)}
          </Text>
        </View>
        <View style={styles.serviceMetaRow}>
          <Ionicons name="person-outline" size={16} style={styles.serviceMetaIcon} />
          <Text style={styles.serviceMetaText} numberOfLines={1}>
            {getClientName(service)}
          </Text>
        </View>
        {service.client_phone ? (
          <View style={styles.serviceMetaRow}>
            <Ionicons name="call-outline" size={16} style={styles.serviceMetaIcon} />
            <Text style={styles.serviceMetaText} numberOfLines={1}>
              {service.client_phone}
            </Text>
          </View>
        ) : null}
        {priceLabel ? (
          <View style={styles.serviceMetaRow}>
            <Ionicons name="cash-outline" size={16} style={styles.serviceMetaIcon} />
            <Text style={styles.serviceMetaText} numberOfLines={1}>
              {priceLabel}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderServiceGroup = ({
    title,
    icon,
    palette,
    services: groupServices = [],
    emptyIcon,
    emptyMessage,
  }) => (
    <View style={styles.sectionCard}>
      <View style={[styles.sectionPill, { backgroundColor: palette.pill }]}>
        <Ionicons name={icon} size={16} style={styles.sectionPillIcon} />
        <Text style={styles.sectionPillText}>{title}</Text>
        <View style={styles.sectionCounterBubble}>
          <Text style={styles.sectionCounterText}>{groupServices.length}</Text>
        </View>
      </View>
      <View
        style={[styles.sectionBody, {
          backgroundColor: palette.background,
          borderColor: palette.pill,
        }]}
      >
        {groupServices.length ? (
          <View style={styles.sectionBodyContent}>
            {groupServices.map((service) => renderServiceCard(service))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name={emptyIcon} size={28} color={PALETTE.textSecondary} />
            <Text style={styles.emptyStateText}>{emptyMessage}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
          <Text style={styles.primaryMetaText}>Cargando servicios...</Text>
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
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Image source={brandIcon} style={styles.brandIcon} />
            <View>
              <Text style={styles.brandTitle}>Fast Services</Text>
              <Text style={styles.brandSubtitle}>Mis servicios</Text>
            </View>
          </View>
        </View>

        {isError ? (
          <Text style={styles.errorText}>
            No pudimos cargar los servicios. Deslizá hacia abajo para reintentar.
          </Text>
        ) : null}

        <View style={styles.primarySection}>
          <View style={styles.primaryCard}>
            {primaryService ? (
              <>
                <View style={styles.primaryBadge}>
                  <Ionicons
                    name={primaryService.status === 'IN_PROGRESS' ? 'flash-outline' : 'calendar-outline'}
                    size={16}
                    style={styles.primaryBadgeIcon}
                  />
                  <Text style={styles.primaryBadgeText}>
                    {getPrimaryBadgeText(primaryService.status)}
                  </Text>
                </View>
                <Text style={styles.primaryTitle} numberOfLines={2}>
                  {getServiceTitle(primaryService)}
                </Text>
                <View style={styles.primaryMetaRow}>
                  <Ionicons name="location-outline" size={18} style={styles.primaryMetaIcon} />
                  <Text style={styles.primaryMetaText} numberOfLines={1}>
                    {getCityLabel(primaryService)}
                  </Text>
                </View>
                <View style={styles.primaryMetaRow}>
                  <Ionicons name="calendar-outline" size={18} style={styles.primaryMetaIcon} />
                  <Text style={styles.primaryMetaText} numberOfLines={2}>
                    {formatScheduleRange(primaryService)}
                  </Text>
                </View>
                {primaryService.client_phone ? (
                  <View style={styles.primaryMetaRow}>
                    <Ionicons name="call-outline" size={18} style={styles.primaryMetaIcon} />
                    <Text style={styles.primaryMetaText} numberOfLines={1}>
                      {primaryService.client_phone}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.primaryDivider} />

                <View style={styles.primaryActionRow}>
                  <View style={styles.primaryClientBlock}>
                    <Text style={styles.primaryClientLabel}>Cliente</Text>
                    <Text style={styles.primaryClientValue} numberOfLines={1}>
                      {getClientName(primaryService)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    activeOpacity={0.9}
                    onPress={() => handleOpenServiceDetail(primaryService)}
                  >
                    <Ionicons name="chevron-forward" size={18} color={PALETTE.white} />
                    <Text style={styles.secondaryButtonText}>Ver detalle</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.primaryBadge}>
                  <Ionicons name="briefcase-outline" size={16} style={styles.primaryBadgeIcon} />
                  <Text style={styles.primaryBadgeText}>Sin servicios asignados</Text>
                </View>
                <Text style={styles.primaryTitle}>
                  Aún no tenés servicios activos
                </Text>
                <Text style={styles.primaryMetaText}>
                  Cuando aceptes un presupuesto y el cliente confirme, vas a ver el siguiente servicio en este espacio.
                </Text>
              </>
            )}
          </View>
        </View>

        {renderServiceGroup({
          title: 'Próximos servicios',
          icon: 'calendar-outline',
          palette: HOME_STATUS_COLORS.upcoming,
          services: upcomingServices,
          emptyIcon: 'calendar-clear-outline',
          emptyMessage: 'Cuando tengas servicios confirmados los vas a ver acá.',
        })}

        {renderServiceGroup({
          title: 'Servicios completados',
          icon: 'checkmark-done-outline',
          palette: HOME_STATUS_COLORS.completed,
          services: completedServices,
          emptyIcon: 'checkmark-done-outline',
          emptyMessage: 'Todavía no registraste servicios completados.',
        })}
      </ScrollView>
    </SafeAreaView>
  );
}