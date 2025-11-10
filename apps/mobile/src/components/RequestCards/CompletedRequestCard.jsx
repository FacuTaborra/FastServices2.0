import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './CompletedRequestCard.styles';

const VARIANT_STYLES = {
  completed: {
    container: styles.statusCompleted,
    text: styles.statusTextCompleted,
  },
  cancelled: {
    container: styles.statusCancelled,
    text: styles.statusTextCancelled,
  },
};

const CompletedRequestCard = ({ item, onRate, onPress }) => {
  const title = item?.title ?? item?.titulo ?? 'Servicio finalizado';
  const statusLabel = item?.statusLabel ?? item?.estado ?? 'Completado';
  const dateLabel = item?.dateLabel ?? item?.fecha ?? '';
  const priceLabel = item?.priceLabel ?? item?.precio ?? '';
  const locationLabel = item?.locationLabel ?? item?.direccion ?? null;
  const typeLabel = item?.requestTypeLabel ?? null;
  const typeAccent = item?.typeAccent ?? null;
  const ratingInfo = item?.ratingInfo ?? {};
  const ratingValue = ratingInfo?.rating ?? item?.estrellas ?? 0;
  const ratingComment = ratingInfo?.comment ?? item?.comentario ?? '';
  const isRated = Boolean(ratingValue);
  const variant = item?.statusVariant ?? 'completed';

  const statusContainerStyles = [styles.status];
  const statusTextStyles = [styles.statusText];
  if (VARIANT_STYLES[variant]) {
    statusContainerStyles.push(VARIANT_STYLES[variant].container);
    statusTextStyles.push(VARIANT_STYLES[variant].text);
  }

  const typeStyles = [styles.typeLabel];
  if (typeAccent === 'fast') {
    typeStyles.push(styles.typeLabelFast);
  } else if (typeAccent === 'licitacion') {
    typeStyles.push(styles.typeLabelLicitacion);
  }

  const cardBody = (
    <>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          {typeLabel ? <Text style={typeStyles}>{typeLabel}</Text> : null}
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
        </View>
        <View style={statusContainerStyles}>
          <Text style={statusTextStyles}>{statusLabel}</Text>
        </View>
      </View>
      {dateLabel ? <Text style={styles.date}>{dateLabel}</Text> : null}
      {locationLabel ? (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#0f172a" style={styles.locationIcon} />
          <Text style={styles.location} numberOfLines={1}>{locationLabel}</Text>
        </View>
      ) : null}
      {priceLabel ? (
        <View style={styles.priceRow}>
          <Ionicons name="cash-outline" size={16} color="#166534" />
          <Text style={styles.priceText}>{priceLabel}</Text>
        </View>
      ) : null}
      {isRated ? (
        <View style={styles.ratingContainer}>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Ionicons
                key={n}
                name={n <= ratingValue ? 'star' : 'star-outline'}
                size={18}
                color="#f59e0b"
              />
            ))}
          </View>
          {ratingComment ? <Text style={styles.comment} numberOfLines={2}>{ratingComment}</Text> : null}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.rateButton}
          onPress={onRate}
          activeOpacity={0.9}
          disabled={!onRate}
        >
          <Ionicons name="star" size={16} color="#ffffff" style={styles.rateIcon} />
          <Text style={styles.rateButtonText}>Calificar</Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
      >
        {cardBody}
      </TouchableOpacity>
    );
  }

  return <View style={styles.card}>{cardBody}</View>;
};

export default CompletedRequestCard;