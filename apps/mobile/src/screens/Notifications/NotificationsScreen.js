import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useNotifications, sendTestNotification } from '../../hooks/useNotifications';
import styles from './NotificationsScreen.styles';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { expoPushToken, notification } = useNotifications();
  const [isEnabled, setIsEnabled] = useState(true);

  const handleTestNotification = async () => {
    if (!expoPushToken) {
      Alert.alert('Aviso', 'No se pueden enviar notificaciones en este momento. Verifica tu conexión.');
      return;
    }
    try {
      await sendTestNotification(expoPushToken);
      Alert.alert('¡Listo!', 'Te hemos enviado una notificación de prueba.');
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al enviar la notificación.');
    }
  };

  const handleLocalNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "¡Hola! 👋",
        body: 'Así se verán las notificaciones de FastServices.',
        data: { data: 'test' },
      },
      trigger: { seconds: 1 },
    });
  };

  const toggleSwitch = () => {
    if (isEnabled) {
      Alert.alert(
        'Desactivar Notificaciones',
        'Para desactivar las notificaciones, debes ir a la configuración de tu dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Configuración', onPress: () => Alert.alert('Instrucción', 'Ve a Ajustes > Aplicaciones > FastServices > Notificaciones') }
        ]
      );
    } else {
      setIsEnabled(true);
    }
  };

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
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.optionRow}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Recibir Notificaciones</Text>
                <Text style={styles.optionDescription}>
                  Mantente informado sobre tus servicios y mensajes
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: "#4CAF50" }}
                thumbColor={isEnabled ? "#f4f3f4" : "#f4f3f4"}
                onValueChange={toggleSwitch}
                value={isEnabled}
              />
            </View>
          </View>

          <Text style={styles.sectionHeader}>Pruebas</Text>

          <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
            <Ionicons name="paper-plane-outline" size={24} color="#2196F3" />
            <Text style={styles.testButtonText}>Enviar notificación de prueba</Text>
          </TouchableOpacity>

          {/* Debug info oculto para usuarios normales, visible solo si hay notificacion activa para debugging */}
          {notification && __DEV__ && (
            <View style={styles.debugBox}>
              <Text style={styles.debugTitle}>Debug Info (Solo Dev)</Text>
              <Text style={styles.debugText}>{notification.request.content.title}</Text>
              <Text style={styles.debugText}>{notification.request.content.body}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
