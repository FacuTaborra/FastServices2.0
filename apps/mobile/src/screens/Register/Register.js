import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Image,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import styles from './Register.styles';
import fastservicesLogo from '../../../assets/iconFastServices2.png';
import Spinner from '../../components/Spinner/Spinner';
import apiService from '../../auth/apiService_auth';

export default function Register() {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    // Validar campos requeridos
    if (!firstName.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu apellido');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return false;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu teléfono');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Por favor ingresa una contraseña');
      return false;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Error', 'Por favor confirma tu contraseña');
      return false;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return false;
    }

    // Validación de teléfono (formato básico)
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/;
    if (!phoneRegex.test(phone.trim())) {
      Alert.alert('Error', 'Por favor ingresa un teléfono válido (ej: +541234567890)');
      return false;
    }

    // Validación de contraseña
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    // Confirmación de contraseña
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Iniciando registro para:', email);

      // Preparar datos para el registro
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password
      };

      // Registrar usuario
      const registerResponse = await apiService.registerClient(userData);
      console.log('✅ Usuario registrado:', registerResponse);

      // Después del registro exitoso, hacer login automáticamente
      const loginResponse = await apiService.login(email, password);

      // Obtener información del usuario
      const userInfo = await apiService.getCurrentUser();

      console.log('✅ Login automático completado para:', userInfo.first_name);

      Alert.alert(
        'Registro Exitoso',
        `¡Bienvenido ${userInfo.first_name}! Tu cuenta ha sido creada correctamente.`,
        [
          {
            text: 'Continuar',
            onPress: () => {
              // Navegar al flujo principal para clientes
              navigation.navigate('Main', {
                screen: 'HomePage',
                animation: 'fade'
              });
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error en registro:', error);

      let errorMessage = 'Ocurrió un error al crear tu cuenta';

      if (error.message.includes('email')) {
        errorMessage = 'Este email ya está registrado';
      } else if (error.message.includes('phone')) {
        errorMessage = 'Este número de teléfono ya está registrado';
      } else if (error.message.includes('400')) {
        errorMessage = 'Datos inválidos. Por favor verifica tu información.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      }

      Alert.alert('Error de Registro', errorMessage);
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image source={fastservicesLogo} style={styles.logo} />
          <Text style={styles.title}>Crear cuenta</Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Apellido"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            editable={!loading}
          />

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
            placeholder="Teléfono (ej: +541234567890)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
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

          <TextInput
            style={styles.input}
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creando cuenta...' : 'Registrarme'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login', { animation: 'slide_from_left' })}
            disabled={loading}
          >
            <Text style={styles.link}>¿Ya tenés cuenta? Iniciar sesión</Text>
          </TouchableOpacity>

          <Modal visible={loading} transparent animationType="fade">
            <Spinner />
          </Modal>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
}