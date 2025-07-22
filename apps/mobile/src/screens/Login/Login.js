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
import UserService from '../../auth/userService';


export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    console.log('🚀 Login iniciado con email:', email);

    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      const data = await UserService.login(email, password);
      console.log('📄 Response data:', data);

      if (data.access_token) {
        // Login exitoso - guardar token
        console.log('✅ Login exitoso, guardando token...');
        await AsyncStorage.setItem('access_token', data.access_token);
        await AsyncStorage.setItem('token_type', data.token_type);

        setLoading(false);
        navigation.navigate('Main', { screen: 'Main', animation: 'fade' });
      } else {
        // Login fallido
        console.log('❌ Login fallido:', data.detail);
        setLoading(false);
        Alert.alert(
          'Error de autenticación',
          data.detail || 'Email o contraseña incorrectos'
        );
      }
    } catch (error) {
      console.error('🔥 Error en login:', error);
      setLoading(false);
      Alert.alert(
        'Error de conexión',
        'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      );
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
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Ingresar</Text>
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