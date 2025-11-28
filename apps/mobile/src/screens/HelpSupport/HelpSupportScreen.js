import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import styles from './HelpSupportScreen.styles';

export default function HelpSupportScreen() {
  const navigation = useNavigation();

  const handleAction = (actionName) => {
    Alert.alert('Acción', `Has seleccionado: ${actionName}`);
  };

  const renderOption = (icon, title, subtitle, onPress) => (
    <TouchableOpacity style={styles.optionButton} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color="#4B5563" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Main', {
              screen: 'Settings',
              animation: 'slide_from_left',
            })
          }
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reportes y Denuncias</Text>
          {renderOption('warning-outline', 'Denunciar Prestador', 'Reportar mal comportamiento o estafa', () => handleAction('Denunciar Prestador'))}
          {renderOption('alert-circle-outline', 'Reportar Problema Técnico', 'Algo no funciona correctamente', () => handleAction('Reportar Problema Técnico'))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
          {renderOption('help-circle-outline', '¿Cómo funciona FastServices?', 'Guía rápida para usuarios', () => handleAction('Guía rápida'))}
          {renderOption('card-outline', 'Pagos y Facturación', 'Dudas sobre cobros y métodos de pago', () => handleAction('Pagos'))}
          {renderOption('shield-checkmark-outline', 'Seguridad y Confianza', 'Consejos para contratar seguro', () => handleAction('Seguridad'))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          {renderOption('chatbubbles-outline', 'Chat con Soporte', 'Habla con un agente en tiempo real', () => handleAction('Chat Soporte'))}
          {renderOption('mail-outline', 'Enviar Correo', 'soporte@fastservices.com', () => handleAction('Enviar Correo'))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Versión 1.0.3</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
