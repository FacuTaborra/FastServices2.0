import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import styles from './Login.styles';
import fastservicesLogo from '../../../assets/iconFastServices2.png';
import Spinner from '../../components/Spinner/Spinner';
import apiService from '../../auth/apiService_auth';

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu contraseña');
      return false;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Login iniciado con email:', email);

      // Llamar al servicio de login
      const response = await apiService.login(email, password);

      // Obtener información del usuario después del login
      const userData = await apiService.getCurrentUser();

      // Guardar algunos datos del usuario para uso posterior
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));

      console.log('✅ Login completado, usuario:', userData.first_name, 'rol:', userData.role);

      Alert.alert(
        'Bienvenido',
        `¡Hola ${userData.first_name}! Has iniciado sesión correctamente.`,
        [
          {
            text: 'Continuar',
            onPress: () => {
              // Navegar según el rol del usuario
              if (userData.role === 'provider') {
                // Navegar al flujo de proveedores
                navigation.navigate('ProviderMain', {
                  screen: 'ProviderRequests',
                  animation: 'fade'
                });
              } else {
                // Navegar al flujo de clientes
                navigation.navigate('Main', {
                  screen: 'HomePage',
                  animation: 'fade'
                });
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error en login:', error);

      let errorMessage = 'Ocurrió un error al iniciar sesión';

      if (error.message.includes('401')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.message.includes('400')) {
        errorMessage = 'Datos inválidos. Por favor verifica tu información.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      }

      Alert.alert('Error de Login', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
    >
      <Image source={fastservicesLogo} style={styles.logo} />
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Iniciando sesión...' : 'Ingresar'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Crear cuenta</Text>
      </TouchableOpacity>
      <Modal visible={loading} transparent animationType="fade">
        <Spinner />
      </Modal>
    </KeyboardAwareScrollView>
  );
}