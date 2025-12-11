import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { parseISO, isValid } from 'date-fns';
import styles from './RehireDetailScreen.styles';
import {
  useActiveServiceRequests,
  useCancelServiceRequest,
} from '../../hooks/useServiceRequests';

const formatCurrencyLabel = (amount, currency) => {
  const numericValue = Number(amount ?? 0) || 0;
  try {
    const formatted = numericValue.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `$${formatted} ${currency || 'ARS'}`;
  } catch (error) {
    return `$${numericValue.toFixed(2)} ${currency || 'ARS'}`;
  }
};

const parseIsoDate = (isoDate) => {
  if (!isoDate) return null;
  if (isoDate instanceof Date) return isValid(isoDate) ? isoDate : null;
  if (typeof isoDate !== 'string') return null;

  const stringToParse = isoDate.trim();
  if (!stringToParse) return null;

  const parsed = parseISO(stringToParse);
  return isValid(parsed) ? parsed : null;
};

const formatLongDate = (date) => {
  if (!date) return null;
  return date.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
};

export default function RehireDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const requestId = route.params?.requestId;
  const [requestData, setRequestData] = useState(route.params?.requestSummary ?? {});
  const cancelRequestMutation = useCancelServiceRequest();

  const currentStatus = requestData?.status ?? 'PUBLISHED';
  const shouldSyncActive = currentStatus !== 'CLOSED' && currentStatus !== 'CANCELLED';

  const {
    data: activeRequestsData,
    refetch: refetchActiveRequests,
    isRefetching: isActiveRefetching,
  } = useActiveServiceRequests({ enabled: shouldSyncActive });

  // Sincronizar con datos del servidor
  useEffect(() => {
    if (!requestId || !Array.isArray(activeRequestsData) || !activeRequestsData.length) {
      return;
    }

    const updatedFromQuery = activeRequestsData.find((item) => item?.id === requestId);
    if (updatedFromQuery) {
      setRequestData((prev) => ({
        ...prev,
        ...updatedFromQuery,
      }));
    }
  }, [activeRequestsData, requestId]);

  const handleManualRefresh = useCallback(() => {
    if (typeof refetchActiveRequests === 'function') {
      refetchActiveRequests();
    }
  }, [refetchActiveRequests]);

  const requestTitle = requestData?.title ?? 'Solicitud de recontratación';
  const requestDescription = requestData?.description ?? '';
  const requestAddress = requestData?.address ?? requestData?.city_snapshot ?? '';

  const isCancelled = currentStatus === 'CANCELLED';
  const isClosed = currentStatus === 'CLOSED';
  const isUpdating = cancelRequestMutation.isPending;

  // Obtener la propuesta del proveedor (solo debería haber una)
  const proposal = useMemo(() => {
    const proposals = requestData?.proposals;
    if (!Array.isArray(proposals) || proposals.length === 0) {
      return null;
    }
    return proposals[0];
  }, [requestData?.proposals]);

  const hasProposal = Boolean(proposal);
  const serviceCreated = Boolean(requestData?.service);

  // Info del proveedor target
  const targetProviderName = proposal?.provider_display_name
    ?? requestData?.target_provider_name
    ?? 'el prestador';
  const targetProviderImage = proposal?.provider_image_url
    ?? requestData?.target_provider_image
    ?? null;
  const targetProviderRating = proposal?.provider_rating_avg
    ?? requestData?.target_provider_rating
    ?? null;
  const targetProviderReviews = proposal?.provider_total_reviews
    ?? requestData?.target_provider_reviews
    ?? 0;

  const proposalPrice = proposal?.quoted_price;
  const proposalCurrency = proposal?.currency;
  const proposalNotes = proposal?.notes?.trim();
  const proposalStartDate = parseIsoDate(proposal?.proposed_start_at);
  const proposalEndDate = parseIsoDate(proposal?.proposed_end_at);
  const proposalValidUntil = parseIsoDate(proposal?.valid_until);

  const priceLabel = proposalPrice ? formatCurrencyLabel(proposalPrice, proposalCurrency) : null;
  const startDateLabel = proposalStartDate ? formatLongDate(proposalStartDate) : null;
  const endDateLabel = proposalEndDate ? formatLongDate(proposalEndDate) : null;
  const validUntilLabel = proposalValidUntil ? formatLongDate(proposalValidUntil) : null;

  const ratingLabel = useMemo(() => {
    if (!targetProviderRating || targetProviderRating <= 0) {
      return 'Sin calificaciones';
    }
    const formatted = Number(targetProviderRating).toFixed(1).replace('.', ',');
    const reviewsText = targetProviderReviews === 1 ? '1 reseña' : `${targetProviderReviews} reseñas`;
    return `${formatted} · ${reviewsText}`;
  }, [targetProviderRating, targetProviderReviews]);

  const handleCancelRequest = () => {
    if (!requestId || isUpdating || isCancelled) {
      return;
    }

    Alert.alert(
      'Cancelar solicitud',
      '¿Estás seguro de que querés cancelar esta solicitud de recontratación?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => {
            cancelRequestMutation.mutate(
              { requestId },
              {
                onSuccess: (updatedRequest) => {
                  if (updatedRequest) {
                    setRequestData((prev) => ({ ...prev, ...updatedRequest }));
                  } else {
                    setRequestData((prev) => ({ ...prev, status: 'CANCELLED' }));
                  }
                  Alert.alert(
                    'Solicitud cancelada',
                    'La solicitud se canceló correctamente.',
                    [
                      {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                      },
                    ],
                  );
                },
                onError: (error) => {
                  const message = error?.response?.data?.detail
                    ?? error?.message
                    ?? 'No pudimos cancelar la solicitud. Intentá de nuevo.';
                  Alert.alert('Error', message);
                },
              },
            );
          },
        },
      ],
    );
  };

  const handleGoToPay = () => {
    if (!proposal) {
      Alert.alert('Sin propuesta', 'Todavía no recibiste el presupuesto del prestador.');
      return;
    }

    if (serviceCreated) {
      Alert.alert('Servicio confirmado', 'Ya registraste un pago para esta solicitud.');
      return;
    }

    navigation.navigate('Payment', {
      requestId,
      requestTitle,
      providerName: targetProviderName,
      priceLabel: formatCurrencyLabel(proposal.quoted_price, proposal.currency),
      proposal,
      providerImageUrl: targetProviderImage,
    });
  };

  const renderWaitingState = () => (
    <View style={styles.waitingContainer}>
      <View style={styles.waitingIconWrapper}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
      <Text style={styles.waitingTitle}>Esperando presupuesto</Text>
      <Text style={styles.waitingSubtitle}>
        {`${targetProviderName} está preparando tu presupuesto. Te notificaremos cuando lo envíe.`}
      </Text>
    </View>
  );

  const renderProposal = () => (
    <View style={styles.proposalContainer}>
      <View style={styles.proposalHeader}>
        <Ionicons name="checkmark-circle" size={22} color="#10b981" />
        <Text style={styles.proposalHeaderText}>¡Recibiste el presupuesto!</Text>
      </View>

      <View style={styles.proposalCard}>
        {priceLabel ? (
          <View style={styles.proposalRow}>
            <Ionicons name="pricetag" size={20} color="#059669" />
            <View style={styles.proposalRowContent}>
              <Text style={styles.proposalLabel}>Precio cotizado</Text>
              <Text style={styles.proposalValue}>{priceLabel}</Text>
            </View>
          </View>
        ) : null}

        {startDateLabel ? (
          <View style={styles.proposalRow}>
            <Ionicons name="calendar" size={20} color="#059669" />
            <View style={styles.proposalRowContent}>
              <Text style={styles.proposalLabel}>Fecha de inicio</Text>
              <Text style={styles.proposalValue}>{startDateLabel}</Text>
            </View>
          </View>
        ) : null}

        {endDateLabel ? (
          <View style={styles.proposalRow}>
            <Ionicons name="time-outline" size={20} color="#059669" />
            <View style={styles.proposalRowContent}>
              <Text style={styles.proposalLabel}>Fin estimado</Text>
              <Text style={styles.proposalValue}>{endDateLabel}</Text>
            </View>
          </View>
        ) : null}

        {validUntilLabel ? (
          <View style={styles.proposalRow}>
            <Ionicons name="alert-circle-outline" size={20} color="#b45309" />
            <View style={styles.proposalRowContent}>
              <Text style={styles.proposalLabel}>Oferta válida hasta</Text>
              <Text style={styles.proposalValue}>{validUntilLabel}</Text>
            </View>
          </View>
        ) : null}

        {proposalNotes ? (
          <View style={styles.proposalNotesBox}>
            <Text style={styles.proposalNotesLabel}>Mensaje del prestador</Text>
            <Text style={styles.proposalNotesText}>{proposalNotes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderCancelledState = () => (
    <View style={styles.cancelledContainer}>
      <View style={styles.cancelledIconWrapper}>
        <Ionicons name="close-circle" size={48} color="#dc2626" />
      </View>
      <Text style={styles.cancelledTitle}>Solicitud cancelada</Text>
      <Text style={styles.cancelledSubtitle}>
        Esta solicitud de recontratación fue cancelada.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>RECONTRATACIÓN</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {requestTitle}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(isActiveRefetching)}
            onRefresh={handleManualRefresh}
            tintColor="#0f172a"
          />
        }
      >
        {/* Info del proveedor */}
        <View style={styles.providerCard}>
          {targetProviderImage ? (
            <Image
              source={{ uri: targetProviderImage }}
              style={styles.providerAvatar}
            />
          ) : (
            <View style={styles.providerAvatarFallback}>
              <Ionicons name="person-circle-outline" size={48} color="#0f172a" />
            </View>
          )}
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{targetProviderName}</Text>
            <View style={styles.providerRatingRow}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.providerRatingText}>{ratingLabel}</Text>
            </View>
          </View>
        </View>

        {/* Detalle de la solicitud */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de la solicitud</Text>
          {requestDescription ? (
            <Text style={styles.requestDescription}>{requestDescription}</Text>
          ) : null}
          {requestAddress ? (
            <View style={styles.requestMetaRow}>
              <Ionicons name="location-outline" size={16} color="#0369a1" />
              <Text style={styles.requestMetaText}>{requestAddress}</Text>
            </View>
          ) : null}
        </View>

        {/* Estado según la situación */}
        {isCancelled ? (
          renderCancelledState()
        ) : hasProposal ? (
          renderProposal()
        ) : (
          renderWaitingState()
        )}

        {/* Acciones */}
        {!isCancelled && !serviceCreated ? (
          <View style={styles.actionsContainer}>
            {hasProposal ? (
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleGoToPay}
                activeOpacity={0.9}
              >
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.acceptButtonText}>Aceptar y pagar</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[
                styles.cancelButton,
                isUpdating && styles.cancelButtonDisabled,
              ]}
              onPress={handleCancelRequest}
              disabled={isUpdating}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  isUpdating && styles.cancelButtonTextDisabled,
                ]}
              >
                Cancelar solicitud
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {serviceCreated ? (
          <View style={styles.serviceConfirmedNote}>
            <Ionicons name="shield-checkmark" size={20} color="#0f766e" />
            <Text style={styles.serviceConfirmedText}>
              Ya confirmaste este servicio. Podés ver los detalles en Mis solicitudes.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

