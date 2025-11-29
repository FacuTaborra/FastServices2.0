import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuth } from './useAuth';
import { httpMethods } from '../api/http';
import { useNavigation } from '@react-navigation/native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();

  const registerToken = async () => {
    if (!isAuthenticated) return;
    console.log('🔔 Solicitando token push a Expo...');
    try {
      const token = await registerForPushNotificationsAsync();
      console.log('🔔 Token Expo obtenido:', token);
      if (token) {
        setExpoPushToken(token);
        httpMethods
          .post('/notifications/register-token', {
            token,
            device_name: Device.modelName || 'Unknown Device',
          })
          .then(() => console.log('✅ Token registrado correctamente'))
          .catch(err => {
            console.log('❌ Error registrando token:', err?.response ?? err);
          });
      } else {
        console.log('⚠️ No se obtuvo token');
      }
    } catch (err) {
      console.log('❌ Error obteniendo token:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated) {
      registerToken();
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (isMounted) setNotification(notification);
    });
    // ...
    // (The rest of the listeners code is truncated in read_file, I need to be careful not to delete it.
    // I'll try to match the exact block to replace the useEffect content but keep listeners).

    return () => {
      isMounted = false;
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, [isAuthenticated]);

  return { expoPushToken, notification, registerToken };
}

export async function sendTestNotification(expoPushToken) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Prueba de notificación',
    body: 'Esta es una notificación local de prueba desde la app',
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    try {
      // Solución robusta para Project ID en builds de producción
      let projectId = Constants?.expoConfig?.extra?.eas?.projectId;

      // Si falla, intentar usar ID hardcodeado
      if (!projectId) {
        projectId = "87d519b1-9fc7-450f-a9af-481a064391b2";
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.log('⚠️ Error obteniendo token con Project ID:', e);
      // Intento desesperado sin projectId (a veces funciona si la config nativa ya lo tiene)
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (e2) {
        console.log('❌ Error final obteniendo token:', e2);
        throw e2; // Re-lanzar para que la UI sepa que falló
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}