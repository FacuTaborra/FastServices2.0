import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './ProjectRequestCard.styles';

const getStatusStyle = (status) => {
  switch (status) {
    case 'aceptada':
      return { backgroundColor: '#d1fae5', color: '#065f46' };
    case 'progreso':
      return { backgroundColor: '#fef3c7', color: '#92400e' };
    case 'calificada':
      return { backgroundColor: '#dbeafe', color: '#1e40af' };
    default:
      return { backgroundColor: '#e5e7eb', color: '#374151' };
  }
};


export default function ProjectRequestCard({ item, onPress, onPressChat, detail }) {
  const Wrapper = item.status === 'calificada' ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.card, item.status === 'calificada' && styles.ratedCard]}
      onPress={item.status === 'calificada' ? onPress : undefined}
    >
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>{item.dateText}</Text>
        <Text style={[styles.status, getStatusStyle(item.status)]}>{item.status}</Text>
        {item.status === 'calificada' && (
          <>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Ionicons
                  key={n}
                  name={n <= (item.rating || 0) ? 'star' : 'star-outline'}
                  size={16}
                  color="#fbbf24"
                />
              ))}
            </View>
            {item.comment ? (
              <Text style={styles.comment}>{item.comment}</Text>
            ) : null}
          </>
        )}
      </View>
      {item.status !== 'calificada' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.detailsButton} onPress={detail}>
            <Text style={styles.detailsText}>ver detalles</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} onPress={onPressChat}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </Wrapper>
  );
}