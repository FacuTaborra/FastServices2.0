import React, { useMemo } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from './PaymentScreen.styles';
import { useConfirmServicePayment } from '../../hooks/useServiceRequests';

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    requestTitle = 'Servicio contratado',
    providerName = 'Prestador seleccionado',
    priceLabel = '$0,00 ARS',
    proposal = {},
    providerImageUrl: providerImageUrlParam,
  } = route.params ?? {};

  const providerImageUrl =
    providerImageUrlParam
    || proposal?.provider_image_url
    || proposal?.provider?.profile_image_url
    || proposal?.provider?.image_url;

  const confirmPaymentMutation = useConfirmServicePayment();

  const ratingLabel = useMemo(() => {
    const rating = Number(proposal?.provider_rating_avg ?? 0);
    if (!rating) {
      return 'Sin calificaciones';
    }
    return `${rating.toFixed(1).replace('.', ',')} / 5`;
  }, [proposal?.provider_rating_avg]);

  const reviewsLabel = useMemo(() => {
    const reviews = Number(proposal?.provider_total_reviews ?? 0);
    if (!reviews) {
      return null;
    }
    return reviews === 1 ? '1 reseña' : `${reviews} reseñas`;
  }, [proposal?.provider_total_reviews]);

  const scheduleLabel = useMemo(() => {
    if (!proposal?.proposed_start_at) {
      return 'A coordinar con el prestador';
    }

    const parsed = new Date(proposal.proposed_start_at);
    if (Number.isNaN(parsed.getTime())) {
      return 'A coordinar con el prestador';
    }

    const formatted = parsed.toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    });

    return `Inicio estimado: ${formatted}`;
  }, [proposal?.proposed_start_at]);

  const validUntilLabel = useMemo(() => {
    if (!proposal?.valid_until) {
      return null;
    }

    const parsed = new Date(proposal.valid_until);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const formatted = parsed.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
    });

    return `Oferta válida hasta ${formatted}`;
  }, [proposal?.valid_until]);

  const notes = proposal?.notes?.trim();

  const handlePay = () => {
    if (!proposal?.id || !route.params?.requestId) {
      Alert.alert('Pago no disponible', 'No se pudo identificar la propuesta seleccionada.');
      return;
    }

    confirmPaymentMutation.mutate(
      {
        requestId: route.params.requestId,
        proposalId: proposal.id,
        paymentReference: null,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Pago confirmado',
            'El prestador fue notificado y el servicio quedó confirmado.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ],
          );
        },
        onError: (error) => {
          const message = error?.response?.data?.detail || error?.message || 'No pudimos confirmar el pago. Intentá nuevamente.';
          Alert.alert('Error al confirmar el pago', message);
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmá el pago</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Servicio</Text>
          <Text style={styles.requestTitle}>{requestTitle}</Text>

          <View style={styles.providerRow}>
            {providerImageUrl ? (
              <Image
                source={{ uri: providerImageUrl }}
                style={styles.providerAvatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.providerAvatarFallback}>
                <Ionicons name="briefcase-outline" size={28} color="#2563eb" />
              </View>
            )}
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{providerName}</Text>
              <View style={styles.providerReputationRow}>
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text style={styles.providerReputationText}>{ratingLabel}</Text>
                {reviewsLabel ? (
                  <Text style={styles.providerReviewsText}>{` · ${reviewsLabel}`}</Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Ionicons name="cash-outline" size={20} color="#0f172a" />
            <Text style={styles.priceText}>{priceLabel}</Text>
          </View>

          <View style={styles.scheduleRow}>
            <Ionicons name="calendar-outline" size={18} color="#0f172a" />
            <Text style={styles.scheduleText}>{scheduleLabel}</Text>
          </View>

          {validUntilLabel ? (
            <View style={styles.scheduleRow}>
              <Ionicons name="alert-circle-outline" size={18} color="#0f172a" />
              <Text style={styles.scheduleText}>{validUntilLabel}</Text>
            </View>
          ) : null}

          {notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Detalle de la propuesta</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.payActionButton,
            confirmPaymentMutation.isPending && styles.payActionButtonDisabled,
          ]}
          activeOpacity={confirmPaymentMutation.isPending ? 1 : 0.9}
          onPress={handlePay}
          disabled={confirmPaymentMutation.isPending}
        >
          <Ionicons name="shield-checkmark-outline" size={22} color="#ecfeff" style={styles.payActionIcon} />
          <Text style={styles.payActionText}>
            {confirmPaymentMutation.isPending ? 'Procesando pago...' : `Pagar ${priceLabel}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
