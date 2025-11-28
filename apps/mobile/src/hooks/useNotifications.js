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

  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated) {
      console.log('🔔 Solicitando token push a Expo...');
      registerForPushNotificationsAsync()
        .then(token => {
          console.log('🔔 Token Expo obtenido:', token);
          if (isMounted && token) {
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
            console.log(
              '⚠️ No se registró token (isMounted:',
              isMounted,
              'token:',
              token,
              ')',
            );
          }
        })
        .catch(err => {
          console.log('❌ Error obteniendo token Expo:', err);
        });
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (isMounted) setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      // Navigate based on data
      if (data?.requestId) {
        // Check if it is a proposal or something else to navigate specifically
        // For now, generic navigation to request detail could work if we had the route name
        // navigation.navigate('RequestDetail', { requestId: data.requestId });
        console.log("Notification Data:", data);
      }
    });

    return () => {
      isMounted = false;
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, [isAuthenticated]);

  return { expoPushToken, notification };
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
      // Try to get projectId from config
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      // Fallback
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}