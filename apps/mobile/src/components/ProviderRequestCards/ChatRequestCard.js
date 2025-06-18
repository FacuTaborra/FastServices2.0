import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './ChatRequestCard.styles';

export default function ChatRequestCard({ item, onPress, onFinish }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.client}>{item.client}</Text>
        <Text style={styles.address}>{item.address}</Text>
      </View>
      {item.status === 'Trabajando' && (
        <TouchableOpacity style={styles.finishButton} onPress={onFinish}>
          <Text style={styles.finishText}>Marcar finalizada</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}