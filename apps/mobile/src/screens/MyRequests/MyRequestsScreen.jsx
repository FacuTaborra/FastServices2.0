import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import TodoRequestCard from '../../components/RequestCards/TodoRequestCard';
import ProgressRequestCard from '../../components/RequestCards/ProgressRequestCard';
import CompletedRequestCard from '../../components/RequestCards/CompletedRequestCard';
import RatingModal from '../../components/RatingModal/RatingModal';
import { useAllServiceRequests } from '../../hooks/useServiceRequests';
import styles from './MyRequestsScreen.styles';

const brandLogo = require('../../../assets/icon.png');

const TODO_REQUEST_STATUSES = new Set(['DRAFT', 'PUBLISHED', 'CANCELLED']);
const PROGRESS_SERVICE_STATUSES = new Set(['CONFIRMED', 'IN_PROGRESS', 'CANCELED']);
const COMPLETED_SERVICE_STATUSES = new Set(['COMPLETED']);

const SERVICE_STATUS_MAP = {
  CONFIRMED: { label: 'Servicio confirmado', variant: 'progress' },
  IN_PROGRESS: { label: 'En ejecución', variant: 'progress' },
  COMPLETED: { label: 'Servicio completado', variant: 'completed' },
  CANCELED: { label: 'Servicio cancelado', variant: 'cancelled' },
};

const REQUEST_STATUS_MAP = {
  PUBLISHED: { label: 'Solicitud publicada', variant: 'active' },
  CLOSED: { label: 'Solicitud cerrada', variant: 'progress' },
  CANCELLED: { label: 'Solicitud cancelada', variant: 'cancelled' },
  DRAFT: { label: 'Borrador', variant: 'active' },
};

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatCurrency = (rawValue) => {
  if (rawValue === null || rawValue === undefined) return null;
  const value = Number(rawValue);
  if (Number.isNaN(value)) return null;
  try {
    return value.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    });
  } catch (error) {
    return `$ ${value.toFixed(0)}`;
  }
};

const normalizeSnapshotLabel = (snapshot) => {
  if (!snapshot) {
    return null;
  }
  if (typeof snapshot === 'string') {
    return snapshot;
  }
  if (typeof snapshot === 'object') {
    const { street, neighborhood, city } = snapshot;
    const parts = [street, neighborhood, city].filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }
  return null;
};

const buildDescriptionSnippet = (description) => {
  if (!description) return null;
  const normalized = description.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 140) {
    return normalized;
  }
  return `${normalized.slice(0, 137)}...`;
};

const MyRequestsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('todos');
  const [searchText, setSearchText] = useState('');
  const [ratingVisible, setRatingVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [ratings, setRatings] = useState({});

  const {
    data: historyData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAllServiceRequests();

  const resolveStatusInfo = useCallback((request) => {
    const serviceStatus = request?.service?.status;
    if (serviceStatus && SERVICE_STATUS_MAP[serviceStatus]) {
      return SERVICE_STATUS_MAP[serviceStatus];
    }
    const requestStatus = request?.status;
    if (requestStatus && REQUEST_STATUS_MAP[requestStatus]) {
      return REQUEST_STATUS_MAP[requestStatus];
    }
    return { label: 'Estado desconocido', variant: 'active' };
  }, []);

  const buildDateLabel = useCallback((request) => {
    const serviceStart = request?.service?.scheduled_start_at;
    if (serviceStart) {
      const formatted = formatDate(serviceStart);
      return formatted ? `Inicio: ${formatted}` : null;
    }
    const preferredStart = request?.preferred_start_at;
    if (preferredStart) {
      const formatted = formatDate(preferredStart);
      return formatted ? `Preferencia: ${formatted}` : null;
    }
    const createdAt = request?.created_at;
    const formatted = formatDate(createdAt);
    return formatted ? `Creada: ${formatted}` : null;
  }, []);

  const mapRequestToCardData = useCallback(
    (request) => {
      const statusInfo = resolveStatusInfo(request);
      const ratingInfo = ratings?.[request.id];
      const title = request?.title?.trim() || 'Solicitud sin título';
      const isLicitacion = request?.request_type === 'LICITACION';
      const requestTypeLabel = isLicitacion ? 'LICITACIÓN' : 'FAST';
      const descriptionSnippet = buildDescriptionSnippet(request?.description);
      const locationLabel =
        normalizeSnapshotLabel(request?.service?.address_snapshot) ||
        request?.city_snapshot ||
        null;
      const priceLabel = formatCurrency(request?.service?.total_price);
      const attachmentsCount = Array.isArray(request?.attachments)
        ? request.attachments.length
        : 0;
      const serviceStatus = request?.service?.status ?? null;
      const requestStatus = request?.status ?? null;

      return {
        id: request.id,
        title,
        descriptionSnippet,
        statusLabel: statusInfo.label,
        statusVariant: statusInfo.variant,
        dateLabel: buildDateLabel(request),
        locationLabel,
        priceLabel,
        requestTypeLabel,
        typeAccent: isLicitacion ? 'licitacion' : 'fast',
        attachmentsCount,
        ratingInfo,
        requestStatus,
        serviceStatus,
        raw: request,
      };
    },
    [resolveStatusInfo, buildDateLabel, ratings]
  );

  const rawRequests = useMemo(
    () => (Array.isArray(historyData) ? historyData : []),
    [historyData]
  );

  const formattedRequests = useMemo(
    () => rawRequests.map((request) => mapRequestToCardData(request)),
    [rawRequests, mapRequestToCardData]
  );

  const normalizedSearch = searchText.trim().toLowerCase();

  const filteredRequests = useMemo(() => {
    if (!normalizedSearch) {
      return formattedRequests;
    }
    return formattedRequests.filter((request) => {
      const haystack = [
        request.title,
        request.statusLabel,
        request.descriptionSnippet,
        request.locationLabel,
        request.requestTypeLabel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [formattedRequests, normalizedSearch]);

  const categorizeRequest = useCallback((requestSummary) => {
    const serviceStatus = requestSummary?.serviceStatus ?? null;
    const requestStatus = requestSummary?.requestStatus ?? null;

    if (serviceStatus) {
      if (COMPLETED_SERVICE_STATUSES.has(serviceStatus)) {
        return 'completados';
      }
      if (PROGRESS_SERVICE_STATUSES.has(serviceStatus)) {
        return 'progreso';
      }
      return 'progreso';
    }

    if (requestStatus && TODO_REQUEST_STATUSES.has(requestStatus)) {
      return 'todos';
    }

    return 'todos';
  }, []);

  const progressRequestsAll = useMemo(
    () =>
      formattedRequests.filter(
        (request) => categorizeRequest(request) === 'progreso'
      ),
    [formattedRequests, categorizeRequest]
  );

  const completedRequestsAll = useMemo(
    () =>
      formattedRequests.filter(
        (request) => categorizeRequest(request) === 'completados'
      ),
    [formattedRequests, categorizeRequest]
  );

  const progressRequestsFiltered = useMemo(
    () =>
      filteredRequests.filter(
        (request) => categorizeRequest(request) === 'progreso'
      ),
    [filteredRequests, categorizeRequest]
  );

  const completedRequestsFiltered = useMemo(
    () =>
      filteredRequests.filter(
        (request) => categorizeRequest(request) === 'completados'
      ),
    [filteredRequests, categorizeRequest]
  );

  const todoRequestsFiltered = useMemo(
    () =>
      filteredRequests.filter(
        (request) => categorizeRequest(request) === 'todos'
      ),
    [filteredRequests, categorizeRequest]
  );

  const tabDataMap = useMemo(
    () => ({
      todos: todoRequestsFiltered,
      progreso: progressRequestsFiltered,
      completados: completedRequestsFiltered,
    }),
    [todoRequestsFiltered, progressRequestsFiltered, completedRequestsFiltered]
  );

  const dataForTab = tabDataMap[activeTab] ?? todoRequestsFiltered;

  const renderTodo = useCallback(
    ({ item }) => (
      <TodoRequestCard
        item={item}
        onPress={() => navigation.navigate('Requests', { requestId: item.id })}
      />
    ),
    [navigation]
  );

  const renderProgress = useCallback(
    ({ item }) => (
      <ProgressRequestCard
        item={item}
        onPress={() => navigation.navigate('Requests', { requestId: item.id })}
      />
    ),
    [navigation]
  );

  const openModal = useCallback((requestId) => {
    setSelectedRequestId(requestId);
    setRatingVisible(true);
  }, []);

  const renderCompleted = useCallback(
    ({ item }) => (
      <CompletedRequestCard item={item} onRate={() => openModal(item.id)} />
    ),
    [openModal]
  );

  const renderItemByTab = useMemo(
    () => ({
      todos: renderTodo,
      progreso: renderProgress,
      completados: renderCompleted,
    }),
    [renderTodo, renderProgress, renderCompleted]
  );

  const handleSubmitRating = useCallback(
    (rating, comment) => {
      if (!selectedRequestId) return;
      setRatings((prev) => ({
        ...prev,
        [selectedRequestId]: { rating, comment },
      }));
    },
    [selectedRequestId]
  );

  const handleCloseModal = useCallback(() => {
    setRatingVisible(false);
    setSelectedRequestId(null);
  }, []);

  const totalCount = formattedRequests.length;
  const progressCount = progressRequestsAll.length;
  const completedCount = completedRequestsAll.length;
  const isRefreshing = isFetching && !isLoading;
  const searchActive = normalizedSearch.length > 0;

  const renderEmpty = useCallback(() => {
    const tabMessages = {
      todos: {
        title: searchActive ? 'Sin coincidencias' : 'No hay solicitudes',
        subtitle: searchActive
          ? 'Ajustá el término de búsqueda o limpiá el filtro.'
          : 'Creá una nueva solicitud desde la pantalla principal para comenzar.',
      },
      progreso: {
        title: searchActive ? 'No hay resultados' : 'Nada en progreso',
        subtitle: searchActive
          ? 'Proba con otro estado o palabra clave.'
          : 'Las solicitudes activas aparecerán aquí cuando avancen.',
      },
      completados: {
        title: searchActive ? 'Sin finalizados' : 'Aún no finalizaste servicios',
        subtitle: searchActive
          ? 'No encontramos servicios finalizados con ese criterio.'
          : 'Una vez finalizados los servicios se mostrarán en esta sección.',
      },
    };

    const { title, subtitle } = tabMessages[activeTab] || tabMessages.todos;

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrapper}>
          <Ionicons name="document-text-outline" size={32} color="#94a3b8" />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
        {activeTab === 'completados' && !searchActive ? (
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={() => navigation.navigate('HomePage')}
          >
            <Text style={styles.emptyActionText}>Explorar servicios</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }, [activeTab, navigation, searchActive]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image source={brandLogo} style={styles.brandIcon} resizeMode="contain" />
              <View>
                <Text style={styles.brandTitle}>Mis solicitudes</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityRole="button"
              accessibilityLabel="Ver notificaciones"
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                style={styles.notificationIcon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Tu historial</Text>
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>{totalCount}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>{progressCount}</Text>
                <Text style={styles.statLabel}>Activas</Text>
              </View>
              <View style={[styles.statPill, styles.statPillLast]}>
                <Text style={styles.statValue}>{completedCount}</Text>
                <Text style={styles.statLabel}>Finalizadas</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por título, estado o localidad"
              placeholderTextColor="#94a3b8"
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchActive ? (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                style={styles.clearSearchButton}
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda"
              >
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.tabRow}>
            {['todos', 'progreso', 'completados'].map((tabKey) => (
              <TouchableOpacity
                key={tabKey}
                style={[
                  styles.tabButton,
                  activeTab === tabKey && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab(tabKey)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tabKey && styles.tabTextActive,
                  ]}
                >
                  {tabKey === 'todos'
                    ? 'Todos'
                    : tabKey === 'progreso'
                      ? 'En progreso'
                      : 'Completados'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={24} color="#b91c1c" />
              <Text style={styles.errorText}>
                No pudimos cargar tus solicitudes. Intentalo nuevamente.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={dataForTab}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItemByTab[activeTab] || renderTodo}
              contentContainerStyle={[
                styles.listContent,
                dataForTab.length === 0 && styles.emptyListContent,
              ]}
              showsVerticalScrollIndicator={false}
              refreshing={isRefreshing}
              onRefresh={refetch}
              ListEmptyComponent={renderEmpty}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : null}

        <RatingModal
          visible={ratingVisible}
          onClose={handleCloseModal}
          onSubmit={handleSubmitRating}
        />
      </View>
    </SafeAreaView>
  );
};

export default MyRequestsScreen;