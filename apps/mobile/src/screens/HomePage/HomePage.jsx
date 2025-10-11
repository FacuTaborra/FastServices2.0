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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles, { STATUS_CARD_COLORS, PALETTE } from './HomePage.styles';
import myRequestsData from '../../data/myRequests';
import { useActiveServiceRequests } from '../../hooks/useServiceRequests';

const heroIcon = require('../../../assets/icon.png');

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

const formatPublishedDate = (isoString) => {
  if (!isoString) {
    return null;
  }

  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.warn('No se pudo formatear la fecha', error);
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

const buildSecondaryCards = () => {
  const progreso = myRequestsData.progreso ?? [];
  const todos = myRequestsData.todos ?? [];
  const completados = myRequestsData.completados ?? [];

  const inProgress = pickFirst(
    progreso,
    (item) => (item.estado || '').toLowerCase() === 'progreso',
  ) || pickFirst(progreso);

  const upcoming = pickFirst(todos);
  const completed = pickFirst(
    completados,
    (item) => (item.estado || '').toLowerCase() === 'completado',
  );

  return [
    {
      id: 'in-progress',
      category: 'En Proceso',
      palette: STATUS_CARD_COLORS.inProgress,
      icon: ICON_BY_STATUS[inProgress?.estado] ?? 'time-outline',
      ...(inProgress
        ? {
          title: inProgress.titulo,
          description: `${inProgress.fecha} · ${inProgress.estado}`,
        }
        : DEFAULT_STATUS_CARD),
    },
    {
      id: 'upcoming',
      category: 'Próximo',
      palette: STATUS_CARD_COLORS.upcoming,
      icon: 'calendar-outline',
      ...(upcoming
        ? {
          title: upcoming.titulo,
          description: `${upcoming.fecha} · ${upcoming.direccion}`,
        }
        : DEFAULT_STATUS_CARD),
    },
    {
      id: 'completed',
      category: 'Completado',
      palette: STATUS_CARD_COLORS.completed,
      icon: 'construct-outline',
      ...(completed
        ? {
          title: completed.titulo,
          description: `${completed.fecha} · ${completed.estado}`,
        }
        : DEFAULT_STATUS_CARD),
    },
  ];
};

const HomePage = () => {
  const navigation = useNavigation();
  const secondaryCards = React.useMemo(() => buildSecondaryCards(), []);
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

  const statusCards = React.useMemo(
    () => secondaryCards,
    [secondaryCards],
  );

  const handleCreateRequest = () => {
    navigation.navigate('RequestDetail', { showButton: true });
  };

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
            <Text style={styles.brandText}>FastServices</Text>
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

              return (
                <View key={request.id} style={styles.activeCard}>
                  <View style={styles.activeCardHeader}>
                    <View style={styles.activeBadge}>
                      <Ionicons name="flash-outline" size={14} style={styles.activeBadgeIcon} />
                      <Text style={styles.activeBadgeText}>Activa</Text>
                    </View>
                  </View>
                  <Text style={styles.activeCardTitle}>{title}</Text>
                  <Text style={styles.activeCardMeta}>{meta}</Text>
                  {snippet ? <Text style={styles.activeCardDescription}>{snippet}</Text> : null}
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitleStandalone}>Mis Servicios</Text>

        <View style={styles.statusList}>
          {statusCards.map((card) => (
            <View key={card.id} style={styles.statusCard}>
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
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;
