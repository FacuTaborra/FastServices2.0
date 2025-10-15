import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './ProgressRequestCard.styles';


// Mapeo explícito de statusVariant a estilos visuales por estado real
const VARIANT_STYLES = {
  progress: {
    container: styles.statusProgress, // En progreso (IN_PROGRESS)
    text: styles.statusTextProgress,
  },
  confirmed: {
    container: styles.statusActive, // Confirmado (CONFIRMED)
    text: styles.statusTextActive,
  },
  completed: {
    container: styles.statusCompleted, // Completado
    text: styles.statusTextCompleted,
  },
  cancelled: {
    container: styles.statusCancelled, // Cancelado
    text: styles.statusTextCancelled,
  },
};

const ProgressRequestCard = ({ item, onPress }) => {
  const title = item?.title ?? item?.titulo ?? 'Servicio en curso';
  const statusLabel = item?.statusLabel ?? item?.estado ?? 'En progreso';
  const dateLabel = item?.dateLabel ?? item?.fecha ?? '';
  const priceLabel = item?.priceLabel ?? item?.precio ?? '';
  const description = item?.description ?? item?.descriptionSnippet ?? item?.descripcion ?? '';
  const locationLabel = item?.locationLabel ?? item?.direccion ?? null;

  // Determinar el color del tag según el estado real del servicio
  let variant = item?.statusVariant ?? 'progress';
  // Si hay un estado de servicio explícito, usarlo para el color
  const serviceStatus = item?.serviceStatus || item?.raw?.serviceStatus || item?.raw?.service?.status;
  if (serviceStatus) {
    if (serviceStatus === 'CONFIRMED') variant = 'confirmed';
    else if (serviceStatus === 'IN_PROGRESS') variant = 'progress';
    else if (serviceStatus === 'COMPLETED') variant = 'completed';
    else if (serviceStatus === 'CANCELED' || serviceStatus === 'CANCELLED') variant = 'cancelled';
  }

  const statusContainerStyles = [styles.status];
  const statusTextStyles = [styles.statusText];
  if (VARIANT_STYLES[variant]) {
    statusContainerStyles.push(VARIANT_STYLES[variant].container);
    statusTextStyles.push(VARIANT_STYLES[variant].text);
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={statusContainerStyles}>
          <Text style={statusTextStyles}>{statusLabel}</Text>
        </View>
      </View>
      {description ? <Text style={styles.description} numberOfLines={3}>{description}</Text> : null}
      <View style={styles.footerRow}>
        {locationLabel ? (
          <View style={styles.rowItem}>
            <Ionicons name="location-outline" size={18} color="#0f172a" style={styles.icon} />
            <Text style={styles.rowText} numberOfLines={1}>{locationLabel}</Text>
          </View>
        ) : null}
        {dateLabel ? (
          <View style={[styles.rowItem, styles.alignRight]}>
            <Ionicons name="today-outline" size={18} color="#0f172a" style={styles.icon} />
            <Text style={styles.rowText}>{dateLabel}</Text>
          </View>
        ) : null}
      </View>
      {priceLabel ? (
        <View style={styles.pricePill}>
          <Ionicons name="cash-outline" size={16} color="#166534" />
          <Text style={styles.priceText}>{priceLabel}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

export default ProgressRequestCard;