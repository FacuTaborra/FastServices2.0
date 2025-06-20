// Footer.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './ClientFooter.styles';


const Footer = ({ state, navigation }) => {
  const current = state.routeNames[state.index];

  const colorFor = (name) => (current === name ? '#4776a6' : '#6B7280');
  return (
    <SafeAreaView style={styles.footerSafeArea}>
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate('HomePage', { screen: 'HomePage', animation: 'shift ' })}
        >
          <Ionicons name="home-outline" size={24} color={colorFor('HomePage')} />
          <Text style={[styles.footerText, { color: colorFor('HomePage') }]}>Inicio</Text>
        </TouchableOpacity>

        {/* Botón Solicitudes */}
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate('MyRequests', { screen: 'MyRequests', animation: 'shift ' })}
        >
          <Ionicons name="list-outline" size={24} color={colorFor('MyRequests')} />
          <Text style={[styles.footerText, { color: colorFor('MyRequests') }]}>Solicitudes</Text>
        </TouchableOpacity>

        {/* Botón Perfil */}
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate('Profile', { screen: 'Profile', animation: 'shift ' })}
        >
          <Ionicons name="person-outline" size={24} color={colorFor('Profile')} />
          <Text style={[styles.footerText, { color: colorFor('Profile') }]}>Perfil</Text>
        </TouchableOpacity>

        {/* Botón Configuración */}
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate('Settings', { screen: 'Settings', animation: 'shift ' })}
        >
          <Ionicons name="settings-outline" size={24} color={colorFor('Settings')} />
          <Text style={[styles.footerText, { color: colorFor('Settings') }]}>Configuración</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Footer;
