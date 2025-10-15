import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './TodoRequestCard.styles';

const VARIANT_MAP = {
  active: {
    container: styles.tagActive,
    text: styles.tagActiveText,
  },
  progress: {
    container: styles.tagProgress,
    text: styles.tagProgressText,
  },
  completed: {
    container: styles.tagCompleted,
    text: styles.tagCompletedText,
  },
  cancelled: {
    container: styles.tagCancelled,
    text: styles.tagCancelledText,
  },
};

const TodoRequestCard = ({ item, onPress }) => {
  const title = item?.title ?? item?.titulo ?? 'Solicitud sin título';
  const statusLabel = item?.statusLabel ?? item?.estado ?? 'Sin estado';
  const dateLabel = item?.dateLabel ?? item?.fecha ?? '';
  const locationLabel = item?.locationLabel ?? item?.direccion ?? 'Dirección no disponible';
  const typeLabel = item?.requestTypeLabel ?? null;
  const variant = item?.statusVariant ?? 'active';
  const description = item?.descriptionSnippet ?? item?.descripcion ?? null;
  const attachmentsCount = Number(item?.attachmentsCount) || 0;
  const typeAccent = item?.typeAccent ?? null;

  const tagStyles = [styles.tag];
  const tagTextStyles = [styles.tagText];
  if (VARIANT_MAP[variant]) {
    tagStyles.push(VARIANT_MAP[variant].container);
    tagTextStyles.push(VARIANT_MAP[variant].text);
  }

  const typeStyles = [styles.typeLabel];
  if (typeAccent === 'fast') {
    typeStyles.push(styles.typeLabelFast);
  } else if (typeAccent === 'licitacion') {
    typeStyles.push(styles.typeLabelLicitacion);
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          {typeLabel ? <Text style={typeStyles}>{typeLabel}</Text> : null}
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
        </View>
        <View style={tagStyles}>
          <Text style={tagTextStyles}>{statusLabel}</Text>
        </View>
      </View>
      {dateLabel ? <Text style={styles.date}>{dateLabel}</Text> : null}
      {description ? (
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      ) : null}
      <View style={styles.footerRow}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#0f172a" style={styles.locationIcon} />
          <Text style={styles.address} numberOfLines={1}>{locationLabel}</Text>
        </View>
        <View style={styles.footerActions}>
          {attachmentsCount > 0 ? (
            <View style={styles.attachmentBadge}>
              <Ionicons name="attach-outline" size={16} color="#475569" />
              <Text style={styles.attachmentText}>{attachmentsCount}</Text>
            </View>
          ) : null}
          <Ionicons
            name="chevron-forward"
            size={18}
            color="#94a3b8"
            style={styles.chevronIcon}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TodoRequestCard;