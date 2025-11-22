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
import { parseISO, differenceInSeconds, format, isValid, isAfter, isBefore, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import styles, { STATUS_CARD_COLORS, PALETTE } from './HomePage.styles';
import { useActiveServiceRequests, useAllServiceRequests } from '../../hooks/useServiceRequests';

const heroIcon = require('../../../assets/icon.png');
const FAST_WINDOW_SECONDS = 5 * 60;

const ICON_BY_STATUS = {
  Confirmado: 'checkmark-done-outline',
  Progreso: 'time-outline',
  Cancelado: 'close-circle-outline',
};

const DEFAULT_STATUS_CARD = {
  title: 'Sin información disponible',
  description: 'Creá una nueva solicitud para comenzar.',
};

const pickFirst = (items, predicate = () => true) =>
  items.find(predicate) ?? null;

const parseIsoDate = (isoDate) => {
  if (!isoDate) return null;
  if (isoDate instanceof Date) return isValid(isoDate) ? isoDate : null;
  if (typeof isoDate !== 'string') return null;

  const parsed = parseISO(isoDate);
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


// Helpers para filtrar servicios con date-fns
const isWithinNextDay = (dateString) => {
  if (!dateString) return false;
  const date = parseIsoDate(dateString);
  if (!date) return false;

  const now = new Date();
  const tomorrow = addDays(now, 1);
  return isAfter(date, now) && isBefore(date, tomorrow);
};

const isWithinLastDay = (dateString) => {
  if (!dateString) return false;
  const date = parseIsoDate(dateString);
  if (!date) return false;

  const now = new Date();
  const yesterday = subDays(now, 1);
  return isBefore(date, now) && isAfter(date, yesterday);
};

const buildSecondaryCards = (allRequests, navigation) => {
  // allRequests: array de requests con .service
  let inProgress = null;
  let upcoming = null;
  let completed = null;

  if (Array.isArray(allRequests)) {
    // En Proceso: status IN_PROGRESS
    inProgress = allRequests.find(
      (req) => req?.service?.status === 'IN_PROGRESS'
    );
    // Próximo: status CONFIRMED y scheduled_start_at en menos de 1 día
    upcoming = allRequests.find(
      (req) => req?.service?.status === 'CONFIRMED' && isWithinNextDay(req?.service?.scheduled_start_at)
    );
    // Completado: status COMPLETED y scheduled_end_at hace menos de 1 día
    completed = allRequests.find(
      (req) => req?.service?.status === 'COMPLETED' && isWithinLastDay(req?.service?.scheduled_end_at)
    );
  }

  return [
    {
      id: inProgress?.id || 'in-progress',
      category: 'En Proceso',
      palette: STATUS_CARD_COLORS.inProgress,
      icon: 'time-outline',
      title: inProgress?.title || 'Sin información disponible',
      description: inProgress?.service?.scheduled_start_at
        ? `Inició: ${formatPublishedDate(inProgress.service.scheduled_start_at)}`
        : 'Sin fecha de inicio',
      onPress: inProgress?.id
        ? () => navigation.navigate('ServiceDetail', { requestId: inProgress.id })
        : null,
    },
    {
      id: upcoming?.id || 'upcoming',
      category: 'Próximo',
      palette: STATUS_CARD_COLORS.upcoming,
      icon: 'calendar-outline',
      title: upcoming?.title || 'Sin información disponible',
      description: upcoming?.service?.scheduled_start_at
        ? `Empieza: ${formatPublishedDate(upcoming.service.scheduled_start_at)}`
        : 'Sin fecha programada',
      onPress: upcoming?.id
        ? () => navigation.navigate('ServiceDetail', { requestId: upcoming.id })
        : null,
    },
    {
      id: completed?.id || 'completed',
      category: 'Completado',
      palette: STATUS_CARD_COLORS.completed,
      icon: 'construct-outline',
      title: completed?.title || 'Sin información disponible',
      description: completed?.service?.scheduled_end_at
        ? `Finalizó: ${formatPublishedDate(completed.service.scheduled_end_at)}`
        : 'Sin fecha de finalización',
      onPress: completed?.id
        ? () => navigation.navigate('ServiceDetail', { requestId: completed.id })
        : null,
    },
  ];
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

  const secondaryCards = React.useMemo(
    () => buildSecondaryCards(allRequests, navigation),
    [allRequests, navigation]
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

    // Actualizar inmediatamente al montar
    setNowMs(Date.now());

    const updateTimer = () => {
      setNowMs(Date.now());
    };

    // Iniciar el intervalo - mantenerlo corriendo siempre
    intervalRef.current = setInterval(updateTimer, 1000);

    // Manejar cambios de AppState (background/foreground)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Cuando la app vuelve a primer plano, actualizar el tiempo inmediatamente
        // para corregir cualquier desfase que pueda haber ocurrido
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


  const statusCards = secondaryCards;

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchActive}
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

        <View style={styles.statusList}>
          {statusCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.statusCard}
              onPress={card.onPress}
              activeOpacity={card.onPress ? 0.92 : 1}
              disabled={!card.onPress}
            >
              <View style={[styles.statusPill, { backgroundColor: card.palette.pill }]}>
                <Text style={styles.statusPillText}>{card.category}</Text>
              </View>
              <View style={[styles.statusBody, { backgroundColor: card.palette.background }]}>
                <View style={styles.statusTextBlock}>
                  <Text style={styles.statusTitle}>{card.title}</Text>
                  <Text style={styles.statusDescription}>{card.description}</Text>
                </View>
                <View style={styles.statusIconBubble}>
                  <Ionicons
                    name={card.icon}
                    size={24}
                    style={[styles.statusIcon, { color: card.palette.icon }]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;
