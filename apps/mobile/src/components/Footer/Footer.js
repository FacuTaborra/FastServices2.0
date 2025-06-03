// Footer.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './Footer.styles';

/**
 * Componente Footer envuelto en SafeAreaView
 * para que quede correctamente posicionado en pantallas con home indicator.
 */
const Footer = () => (
  <SafeAreaView style={styles.footerSafeArea}>
    <View style={styles.footerContainer}>
      {/* Botón Home (activo) */}
      <TouchableOpacity style={styles.footerButton}>
        <Ionicons name="home-outline" size={24} color="#4776a6" />
        <Text style={[styles.footerText, { color: '#4776a6' }]}>Home</Text>
      </TouchableOpacity>

      {/* Botón Solicitudes */}
      <TouchableOpacity style={styles.footerButton}>
        <Ionicons name="list-outline" size={24} color="#6B7280" />
        <Text style={styles.footerText}>Solicitudes</Text>
      </TouchableOpacity>

      {/* Botón Perfil */}
      <TouchableOpacity style={styles.footerButton}>
        <Ionicons name="person-outline" size={24} color="#6B7280" />
        <Text style={styles.footerText}>Perfil</Text>
      </TouchableOpacity>

      {/* Botón Configuración */}
      <TouchableOpacity style={styles.footerButton}>
        <Ionicons name="settings-outline" size={24} color="#6B7280" />
        <Text style={styles.footerText}>Configuración</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

export default Footer;
