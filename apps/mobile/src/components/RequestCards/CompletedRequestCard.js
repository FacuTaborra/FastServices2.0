import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './CompletedRequestCard.styles';

const CompletedRequestCard = ({ item }) => (
  <View style={styles.card}>
    <Text style={styles.title}>{item.titulo}</Text>
    <Text style={styles.date}>{item.fecha}</Text>
    <Text style={styles.status}>{item.estado}</Text>
    {item.calificado ? (
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Ionicons
            key={n}
            name={n <= (item.estrellas || 0) ? 'star' : 'star-outline'}
            size={16}
            color="#fbbf24"
          />
        ))}
      </View>
    ) : (
      <TouchableOpacity style={styles.rateButton}>
        <Text style={styles.rateButtonText}>Calificar</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default CompletedRequestCard;