import React from 'react';
import { View, Text, TouchableOpacity, Button } from 'react-native';
import styles from './ChatRequestCard.styles';
import { Ionicons } from '@expo/vector-icons';


export default function ChatRequestCard({ item, onPress, detail }) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.client}>{item.client}</Text>
        <Text style={styles.address}>{item.address}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.detailsButton} onPress={detail}>
          <Text style={styles.detailsText}>ver detalles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatButton} onPress={onPress}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}