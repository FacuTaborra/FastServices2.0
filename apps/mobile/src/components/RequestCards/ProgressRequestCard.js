import React from 'react';
import { View, Text } from 'react-native';
import styles from './ProgressRequestCard.styles';

const ProgressRequestCard = ({ item }) => {
  const statusStyle =
    item.estado === 'Confirmado'
      ? styles.statusConfirmed
      : item.estado === 'Progreso'
      ? styles.statusInProgress
      : styles.statusCancelled;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.titulo}</Text>
      <Text style={styles.date}>{item.fecha}</Text>
      <Text style={[styles.status, statusStyle]}>{item.estado}</Text>
    </View>
  );
};

export default ProgressRequestCard;