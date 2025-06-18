import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import styles from './NewRequestCard.styles';

export default function NewRequestCard({ item, onAccept, onReject }) {

  const navigation = useNavigation();

  const onPress = () => {
    // Abrir detalles de la solicitud
    navigation.navigate('RequestDetail', { Animation: 'fade' });

  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {item.fast && (
        <View style={styles.fastBadge}>
          <Ionicons name="flash" size={10} color="#fff" style={styles.fastIcon} />
          <Text style={styles.fastText}>FAST</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>{item.date}</Text>
        <Text style={styles.address}>{item.address}</Text>
        <Text style={styles.budget}>{item.budget ? `Precio estimado: $${item.budget}` : 'Sin presupuesto'}</Text>
      </View>
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.buttonText}>Presupuestar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={onReject}>
          <Ionicons name="close" size={16} color="#fff" />
          <Text style={styles.buttonText}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}