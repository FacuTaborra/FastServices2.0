import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Switch, StyleSheet, Linking, Platform, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import { useNotifications, sendTestNotification } from '../../hooks/useNotifications';
import styles from './NotificationsScreen.styles';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { expoPushToken, notification, registerToken } = useNotifications();
  const [isEnabled, setIsEnabled] = useState(false);
  const appState = useRef(AppState.currentState);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setIsEnabled(status === 'granted');
  };

  // Chequear permisos al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      checkPermissions();
    }, [])
  );

  // Chequear permisos al volver de background (ej. volver de Configuración)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkPermissions();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleTestNotification = async () => {
    if (!isEnabled) {
      Alert.alert('Permisos requeridos', 'Debes activar las notificaciones para realizar pruebas.');
      return;
    }
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

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      // Intentar abrir directamente la configuración de notificaciones de la app
      if (Platform.Version >= 26) {
        IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS, {
          "android.provider.extra.APP_PACKAGE": "com.facutaborra.fastservices", // Asegúrate que coincida con tu package
        }).catch(() => Linking.openSettings());
      } else {
        Linking.openSettings();
      }
    }
  };

  const toggleSwitch = async () => {
    if (isEnabled) {
      // Usuario quiere desactivar
      Alert.alert(
        'Desactivar Notificaciones',
        'Para desactivar las notificaciones, debes ir a la configuración de tu dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Configuración', onPress: openSettings }
        ]
      );
    } else {
      // Usuario quiere activar
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          setIsEnabled(true);
          await registerToken();
          Alert.alert('Activado', 'Notificaciones activadas correctamente.');
        } else {
          Alert.alert(
            'Permisos denegados',
            'Has denegado los permisos anteriormente. Debes activarlos manualmente en Configuración.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Ir a Configuración', onPress: openSettings }
            ]
          );
        }
      } catch (e) {
        console.log(e);
      }
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
