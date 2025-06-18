import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './ProjectRequestCard.styles';

export default function ProjectRequestCard({ item, onPressChat }) {
  return (
    <View style={[styles.card, item.status === 'calificada' && styles.ratedCard]}>
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>{item.dateText}</Text>
        <Text style={styles.status}>{item.status}</Text>
        {item.status === 'calificada' && (
          <View style={styles.ratingRow}>
            {[1,2,3,4,5].map((n)=> (
              <Text key={n} style={styles.star}>{n <= item.rating ? '⭐' : '☆'}</Text>
            ))}
            <Text style={styles.comment}>{item.comment}</Text>
          </View>
        )}
      </View>
      {item.status !== 'terminada' && (
        <TouchableOpacity onPress={onPressChat} style={styles.chatButton}>
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}