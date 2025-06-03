// Header.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './Header.styles';

/**
 * Componente Header envuelto en SafeAreaView
 * para que el fondo azul cubra el área de estado
 * en todos los dispositivos (iOS notch, Android, etc.).
 */
const Header = () => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.headerContainer}>
      {/* Sección izquierda: ícono + título */}
      <View style={styles.headerLeft}>
        <Ionicons
          name="briefcase-outline"
          size={24}
          color="#fff"
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>Fast Services</Text>
      </View>

      {/* Sección derecha: ícono de notificaciones */}
      <TouchableOpacity style={styles.headerRight}>
        <Ionicons name="notifications-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

export default Header;
