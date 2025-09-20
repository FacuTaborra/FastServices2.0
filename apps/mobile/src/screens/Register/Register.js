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
import { Ionicons } from '@expo/vector-icons';
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

  // Estados para el proveedor
  const [isProvider, setIsProvider] = useState(false);
  const [bio, setBio] = useState('');
  const [serviceRadius, setServiceRadius] = useState('10');

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

    // Validaciones adicionales para proveedor
    if (isProvider) {
      if (!bio.trim()) {
        Alert.alert('Error', 'Por favor describe tus servicios');
        return false;
      }

      const radius = parseInt(serviceRadius);
      if (isNaN(radius) || radius < 1 || radius > 100) {
        Alert.alert('Error', 'El radio de servicio debe ser entre 1 y 100 km');
        return false;
      }
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

      let registerResponse;

      if (isProvider) {
        // Agregar datos específicos del proveedor
        userData.bio = bio.trim();
        userData.service_radius_km = parseInt(serviceRadius);

        // Registrar proveedor
        registerResponse = await apiService.registerProvider(userData);
        console.log('✅ Proveedor registrado:', registerResponse);
      } else {
        // Registrar cliente
        registerResponse = await apiService.registerClient(userData);
        console.log('✅ Cliente registrado:', registerResponse);
      }

      // Después del registro exitoso, hacer login automáticamente
      const loginResponse = await apiService.login(email, password);

      // Obtener información del usuario
      const userInfo = await apiService.getCurrentUser();

      console.log('✅ Login automático completado para:', userInfo.first_name);

      // Navegar según el rol del usuario directamente sin alerta
      if (userInfo.role === 'provider') {
        // Navegar al flujo de proveedores
        navigation.navigate('ProviderMain', {
          screen: 'ProviderRequests',
          animation: 'fade'
        });
      } else {
        // Navegar al flujo principal para clientes
        navigation.navigate('Main', {
          screen: 'HomePage',
          animation: 'fade'
        });
      }

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

          {/* Checkbox para seleccionar si es proveedor */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsProvider(!isProvider)}
            disabled={loading}
          >
            <View style={styles.checkbox}>
              {isProvider && (
                <Ionicons name="checkmark" size={18} color="#4A90E2" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Quiero ofrecer servicios como proveedor
            </Text>
          </TouchableOpacity>

          {/* Campos adicionales para proveedores */}
          {isProvider && (
            <View style={styles.providerFields}>
              <Text style={styles.sectionTitle}>Información de Proveedor</Text>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe los servicios que ofreces"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Radio de servicio (km)"
                value={serviceRadius}
                onChangeText={setServiceRadius}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creando cuenta...' : `Registrarme${isProvider ? ' como Proveedor' : ''}`}
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