// Footer.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './Footer.styles';


const Footer = ({ state, navigation }) => {
  const current = state.routeNames[state.index];

  const colorFor = (name) => (current === name ? '#4776a6' : '#6B7280');
  return (
    <SafeAreaView style={styles.footerSafeArea}>
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate('HomePage')}
        >
          <Ionicons name="home-outline" size={24} color={colorFor('HomePage')} />
          <Text style={[styles.footerText, { color: colorFor('HomePage') }]}>Home</Text>
        </TouchableOpacity>

        {/* Botón Solicitudes */}
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate('MyRequests')}
        >
          <Ionicons name="list-outline" size={24} color={colorFor('MyRequests')} />
          <Text style={[styles.footerText, { color: colorFor('MyRequests') }]}>Solicitudes</Text>
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
};

export default Footer;
