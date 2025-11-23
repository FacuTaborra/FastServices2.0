// HomePage.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  parseISO,
  differenceInSeconds,
  format,
  isValid,
  isAfter,
  isBefore,
  subDays,
  addDays,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import styles, { STATUS_CARD_COLORS, PALETTE } from './HomePage.styles';
import { useActiveServiceRequests, useAllServiceRequests } from '../../hooks/useServiceRequests';

const heroIcon = require('../../../assets/icon.png');
const FAST_WINDOW_SECONDS = 5 * 60;

const DEFAULT_STATUS_CARD = {
  title: 'Sin información disponible',
  description: 'Creá una nueva solicitud para comenzar.',
};

const parseIsoDate = (isoDate) => {
  if (!isoDate) return null;
  if (isoDate instanceof Date) return isValid(isoDate) ? isoDate : null;
  if (typeof isoDate !== 'string') return null;

  const stringToParse = isoDate.trim();
  // Asumir local si no hay TZ (backend envía hora ARG)
  const parsed = parseISO(stringToParse);
  return isValid(parsed) ? parsed : null;
};

const formatPublishedDate = (isoString) => {
  if (!isoString) {
    return null;
  }

  try {
    const date = parseIsoDate(isoString);
    if (!date) {
      return null;
    }

    // 'dd MMM HH:mm' -> 22 nov 14:30
    return format(date, "dd MMM HH:mm", { locale: es });
  } catch (error) {
    return null;
  }
};

const describeActiveRequest = (request) => {
  if (!request) {
    return DEFAULT_STATUS_CARD.description;
  }

  const parts = [];

  if (request.request_type === 'FAST') {
    parts.push('FAST ⚡');
  } else if (request.request_type === 'LICITACION') {
    parts.push('Licitación');
    if (Number.isFinite(request.proposal_count) && request.proposal_count > 0) {
      const label = request.proposal_count === 1
        ? '1 oferta'
        : `${request.proposal_count} ofertas`;
      parts.push(label);
    }
  }

  if (request.city_snapshot) {
    parts.push(request.city_snapshot);
  }

  const publishedAt = formatPublishedDate(request.created_at);
  if (publishedAt) {
    parts.push(`Publicada ${publishedAt}`);
  }

  return parts.join(' · ') || DEFAULT_STATUS_CARD.description;
};

const formatFastCountdown = (secondsRemaining) => {
  const safeSeconds = Number.isFinite(secondsRemaining)
    ? Math.max(0, secondsRemaining)
    : 0;
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const computeFastMetrics = (request, nowMs) => {
  if (!request?.created_at) {
    return null;
  }

  const createdAt = parseIsoDate(request.created_at);
  if (!createdAt) {
    return null;
  }

  const elapsedSeconds = differenceInSeconds(nowMs, createdAt);
  const safeElapsed = Math.max(0, elapsedSeconds);

  const remainingSeconds = Math.max(0, FAST_WINDOW_SECONDS - safeElapsed);
  const progressElapsed = Math.min(Math.max(safeElapsed / FAST_WINDOW_SECONDS, 0), 1);
  const progressRemaining = 1 - progressElapsed;

  return {
    remainingSeconds,
    formattedCountdown: formatFastCountdown(remainingSeconds),
    progressElapsed,
    progressRemaining,
    isExpired: remainingSeconds === 0,
  };
};

const buildActiveDescriptionSnippet = (description) => {
  if (!description) {
    return null;
  }

  const trimmed = description.trim();
  if (!trimmed) {
    return null;
  }

  const maxLength = 140;
  return trimmed.length > maxLength
    ? `${trimmed.slice(0, maxLength - 1)}…`
    : trimmed;
};

// --- NUEVA LÓGICA DE FILTRADO ---

const groupServiceRequests = (allRequests) => {
  const result = {
    inProgress: [],
    upcoming: [],
    completed: [],
  };

  if (!Array.isArray(allRequests)) {
    return result;
  }

  const now = new Date();
  const startOfYesterday = startOfDay(subDays(now, 1));
  const endOfToday = endOfDay(now);
  const threeDaysFromNow = endOfDay(addDays(now, 3));

  allRequests.forEach((req) => {
    const status = req?.service?.status;

    // 1. En Progreso: status IN_PROGRESS (Todos)
    if (status === 'IN_PROGRESS') {
      result.inProgress.push(req);
      return;
    }

    // 2. Próximos: status CONFIRMED y fecha inicio en [ahora, ahora + 3 días]
    if (status === 'CONFIRMED') {
      const startDate = parseIsoDate(req?.service?.scheduled_start_at);
      if (startDate && isAfter(startDate, now) && isBefore(startDate, threeDaysFromNow)) {
        result.upcoming.push(req);
      }
      return;
    }

    // 3. Completados: status COMPLETED y fecha fin en [ayer inicio, hoy fin]
    if (status === 'COMPLETED') {
      const endDate = parseIsoDate(req?.service?.scheduled_end_at);
      if (endDate && isAfter(endDate, startOfYesterday) && isBefore(endDate, endOfToday)) {
        result.completed.push(req);
      }
    }
  });

  // Ordenar por fecha (opcional, pero recomendado)
  // Upcoming: más cercano primero
  result.upcoming.sort((a, b) => {
    const dateA = parseIsoDate(a.service?.scheduled_start_at) || 0;
    const dateB = parseIsoDate(b.service?.scheduled_start_at) || 0;
    return dateA - dateB;
  });

  // Completed: más reciente primero
  result.completed.sort((a, b) => {
    const dateA = parseIsoDate(a.service?.scheduled_end_at) || 0;
    const dateB = parseIsoDate(b.service?.scheduled_end_at) || 0;
    return dateB - dateA;
  });

  return result;
};

const ServiceCard = ({ request, category, color, icon, navigation }) => {
  const title = request.title?.trim() || 'Servicio sin título';

  let dateLabel = '';
  let dateValue = null;

  if (category === 'inProgress') {
    dateLabel = 'Inició';
    dateValue = request.service?.scheduled_start_at;
  } else if (category === 'upcoming') {
    dateLabel = 'Programado';
    dateValue = request.service?.scheduled_start_at;
  } else {
    dateLabel = 'Finalizó';
    dateValue = request.service?.scheduled_end_at;
  }

  const formattedDate = dateValue ? formatPublishedDate(dateValue) : 'Sin fecha';

  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => navigation.navigate('ServiceDetail', { requestId: request.id })}
      activeOpacity={0.9}
    >
      <View style={[styles.serviceCardLeftStrip, { backgroundColor: color }]} />
      <View style={styles.serviceCardContent}>
        <View style={styles.serviceCardHeader}>
          <Text style={styles.serviceCardTitle} numberOfLines={1}>{title}</Text>
          <Ionicons name={icon} size={20} color={color} />
        </View>

        <View style={styles.serviceCardRow}>
          <Ionicons name="calendar-outline" size={14} color={PALETTE.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.serviceCardDate}>
            {dateLabel}: <Text style={{ fontWeight: '600' }}>{formattedDate}</Text>
          </Text>
        </View>

        {request.city_snapshot ? (
          <View style={styles.serviceCardRow}>
            <Ionicons name="location-outline" size={14} color={PALETTE.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.serviceCardAddress} numberOfLines={1}>{request.city_snapshot}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const HomePage = () => {
  const navigation = useNavigation();
  const {
    data: allRequests,
    isLoading: allLoading,
    isError: allError,
    refetch: refetchAll,
    isRefetching: isRefetchingAll,
  } = useAllServiceRequests();

  const groupedServices = React.useMemo(
    () => groupServiceRequests(allRequests),
    [allRequests]
  );

  const [nowMs, setNowMs] = React.useState(Date.now());
  const intervalRef = React.useRef(null);
  const {
    data: activeRequests,
    isLoading: activeLoading,
    isError: activeError,
    refetch: refetchActive,
    isRefetching,
  } = useActiveServiceRequests();

  const activeRequestsSafe = Array.isArray(activeRequests) ? activeRequests : [];
  const showLoading = activeLoading && !activeRequestsSafe.length && !isRefetching;
  const showError = activeError && !activeRequestsSafe.length;
  const showEmpty = !activeRequestsSafe.length && !showLoading && !showError;

  const hasFastRequests = React.useMemo(
    () => activeRequestsSafe.some((request) => request?.request_type === 'FAST'),
    [activeRequestsSafe],
  );

  React.useEffect(() => {
    if (!hasFastRequests) {
      return undefined;
    }

    setNowMs(Date.now());
    const updateTimer = () => {
      setNowMs(Date.now());
    };

    intervalRef.current = setInterval(updateTimer, 1000);
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        setNowMs(Date.now());
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      subscription?.remove();
    };
  }, [hasFastRequests]);

  const handleCreateRequest = () => {
    navigation.navigate('RequestDetail', { showButton: true });
  };

  const buildRequestSummary = React.useCallback((request) => ({
    id: request.id,
    title: request.title?.trim() || 'Solicitud sin título',
    description: request.description ?? '',
    address: request.city_snapshot || 'Dirección pendiente.',
    created_at: request.created_at,
    bidding_deadline: request.bidding_deadline,
    status: request.status,
    proposal_count: request.proposal_count ?? 0,
    proposals: Array.isArray(request.proposals) ? request.proposals : [],
    attachments: Array.isArray(request.attachments)
      ? request.attachments
      : [],
  }), []);

  const handleActiveRequestPress = React.useCallback((request) => {
    const summary = buildRequestSummary(request);

    if (request.request_type === 'FAST') {
      navigation.navigate('FastMatch', {
        requestId: request.id,
        requestSummary: summary,
      });
      return;
    }

    if (request.request_type === 'LICITACION') {
      navigation.navigate('Licitacion', {
        requestId: request.id,
        requestSummary: summary,
      });
    }
  }, [buildRequestSummary, navigation]);

  const hasAnyService =
    groupedServices.inProgress.length > 0 ||
    groupedServices.upcoming.length > 0 ||
    groupedServices.completed.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isRefetching || isRefetchingAll}
            onRefresh={() => {
              refetchActive();
              refetchAll();
            }}
            colors={['#0B3C82']}
            tintColor="#0B3C82"
          />
        )}
      >
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Image source={heroIcon} style={styles.brandIcon} />
            <Text style={styles.brandText}>Fast Services</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons
              name="notifications-outline"
              size={22}
              style={styles.notificationIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="flash-outline" size={14} style={styles.heroBadgeIcon} />
            <Text style={styles.heroBadgeText}>Servicio rápido y confiable</Text>
          </View>
          <Text style={styles.heroTitle}>¿Necesitás ayuda con algo?</Text>
          <Text style={styles.heroSubtitle}>
            No busques más. Encontrá especialistas que responden en minutos y trabajan con
            total confianza.
          </Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={handleCreateRequest}
          >
            <Text style={styles.heroButtonText}>Solicitar un servicio</Text>
            <Ionicons name="arrow-forward" size={18} color={PALETTE.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.activeSection}>
          <Text style={styles.sectionTitleStandalone}>Solicitudes activas</Text>

          {showLoading ? (
            <View style={styles.activeLoading}>
              <ActivityIndicator size="small" color={PALETTE.primary} />
              <Text style={styles.activeLoadingText}>Cargando solicitudes...</Text>
            </View>
          ) : null}

          {showError ? (
            <View style={styles.activeErrorBox}>
              <Text style={styles.activeErrorText}>
                No pudimos cargar tus solicitudes activas. Verificá tu conexión e intentá nuevamente.
              </Text>
              <TouchableOpacity style={styles.activeRetryButton} onPress={refetchActive}>
                <Ionicons name="refresh" size={14} color="#FFFFFF" />
                <Text style={styles.activeRetryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {showEmpty ? (
            <View style={styles.activeEmptyBox}>
              <Ionicons name="leaf-outline" size={22} style={styles.activeEmptyIcon} />
              <Text style={styles.activeEmptyText}>
                Aún no tenés solicitudes activas. Creá una nueva solicitud para recibir ayuda.
              </Text>
            </View>
          ) : null}

          <View style={styles.activeList}>
            {activeRequestsSafe.map((request) => {
              const title = request.title?.trim() || 'Solicitud sin título';
              const meta = describeActiveRequest(request);
              const snippet = buildActiveDescriptionSnippet(request.description);
              const isFastRequest = request.request_type === 'FAST';
              const isLicitacionRequest = request.request_type === 'LICITACION';
              const fastMetrics = isFastRequest ? computeFastMetrics(request, nowMs) : null;
              const isPressable = isFastRequest || isLicitacionRequest;

              return (
                <TouchableOpacity
                  key={request.id}
                  style={[
                    styles.activeCard,
                    isFastRequest && styles.fastActiveCard,
                    isLicitacionRequest && styles.licitationActiveCard,
                  ]}
                  onPress={() => handleActiveRequestPress(request)}
                  activeOpacity={isPressable ? 0.92 : 1}
                  disabled={!isPressable}
                >
                  <View style={styles.activeCardHeader}>
                    <View style={styles.activeBadge}>
                      <Ionicons name="flash-outline" size={14} style={styles.activeBadgeIcon} />
                      <Text style={styles.activeBadgeText}>Activa</Text>
                    </View>
                    {isFastRequest ? (
                      <View style={styles.fastBadge}>
                        <Ionicons name="flash" size={12} style={styles.fastBadgeIcon} />
                        <Text style={styles.fastBadgeText}>FAST</Text>
                      </View>
                    ) : null}
                    {isLicitacionRequest ? (
                      <View style={styles.licitationBadge}>
                        <Ionicons name="time-outline" size={12} style={styles.licitationBadgeIcon} />
                        <Text style={styles.licitationBadgeText}>LICITACIÓN</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.activeCardTitle}>{title}</Text>
                  <Text style={styles.activeCardMeta}>{meta}</Text>
                  {snippet ? <Text style={styles.activeCardDescription}>{snippet}</Text> : null}
                  {fastMetrics ? (
                    <View style={styles.fastCountdownBlock}>
                      <View style={styles.fastCountdownRow}>
                        <Ionicons name="time-outline" size={16} color={PALETTE.textPrimary} />
                        <Text style={styles.fastCountdownValue}>{fastMetrics.formattedCountdown}</Text>
                        <Text style={styles.fastCountdownLabel}>
                          {fastMetrics.isExpired ? 'Tiempo finalizado' : 'Tiempo restante'}
                        </Text>
                      </View>
                      <View style={styles.fastProgressTrack}>
                        <View
                          style={[
                            styles.fastProgressFill,
                            { width: `${Math.max(0, Math.min(fastMetrics.progressRemaining, 1)) * 100}%` },
                          ]}
                        />
                      </View>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitleStandalone}>Mis Servicios</Text>

        {!hasAnyService && !allLoading && (
          <View style={styles.activeEmptyBox}>
            <Ionicons name="calendar-clear-outline" size={22} style={styles.activeEmptyIcon} />
            <Text style={styles.activeEmptyText}>
              No tenés servicios programados ni recientes.
            </Text>
          </View>
        )}

        <View style={styles.servicesContainer}>
          {/* En Proceso */}
          {groupedServices.inProgress.length > 0 && (
            <View style={styles.serviceGroup}>
              <Text style={styles.serviceSectionTitle}>En curso</Text>
              {groupedServices.inProgress.map((req) => (
                <ServiceCard
                  key={req.id}
                  request={req}
                  category="inProgress"
                  color={STATUS_CARD_COLORS.inProgress.icon}
                  icon="time"
                  navigation={navigation}
                />
              ))}
            </View>
          )}

          {/* Próximos */}
          {groupedServices.upcoming.length > 0 && (
            <View style={styles.serviceGroup}>
              <Text style={styles.serviceSectionTitle}>Próximos (3 días)</Text>
              {groupedServices.upcoming.map((req) => (
                <ServiceCard
                  key={req.id}
                  request={req}
                  category="upcoming"
                  color={STATUS_CARD_COLORS.upcoming.icon}
                  icon="calendar"
                  navigation={navigation}
                />
              ))}
            </View>
          )}

          {/* Completados */}
          {groupedServices.completed.length > 0 && (
            <View style={styles.serviceGroup}>
              <Text style={styles.serviceSectionTitle}>Recientes</Text>
              {groupedServices.completed.map((req) => (
                <ServiceCard
                  key={req.id}
                  request={req}
                  category="completed"
                  color={STATUS_CARD_COLORS.completed.icon}
                  icon="checkmark-circle"
                  navigation={navigation}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;
