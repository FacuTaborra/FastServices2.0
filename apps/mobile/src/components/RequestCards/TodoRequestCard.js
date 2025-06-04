import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './TodoRequestCard.styles';

const TodoRequestCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.headerRow}>
      <Text style={styles.title}>{item.titulo}</Text>
      <View style={styles.tag}>
        <Text style={styles.tagText}>{item.estado}</Text>
      </View>
    </View>
    <Text style={styles.date}>{item.fecha}</Text>
    <View style={styles.footerRow}>
      <Text style={styles.address}>{item.direccion}</Text>
      <Ionicons name="attach-outline" size={20} color="#4776a6" />
    </View>
  </TouchableOpacity>
);

export default TodoRequestCard;