import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './NewRequestCard.styles';

export default function NewRequestCard({ item, onAccept, onReject, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {item.urgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>¡Urgente!</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>{item.date}</Text>
        <Text style={styles.address}>{item.address}</Text>
        <Text style={styles.budget}>{item.budget ? `$${item.budget}` : 'Sin presupuesto'}</Text>
      </View>
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.buttonText}>Aceptar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={onReject}>
          <Ionicons name="close" size={16} color="#fff" />
          <Text style={styles.buttonText}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}