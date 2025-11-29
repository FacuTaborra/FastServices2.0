import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para el proveedor
  const [isProvider, setIsProvider] = useState(false);
  const [bio, setBio] = useState('');

  // Estados para dirección
  const [addressTitle, setAddressTitle] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Argentina');

  // Estado para términos y condiciones
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const validateForm = () => {
    // Validar términos y condiciones
    if (!acceptedTerms) {
      Alert.alert('Error', 'Debes aceptar los Términos y Condiciones para registrarte');
      return false;
    }
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

    // Validación opcional de fecha de nacimiento
    if (dateOfBirth && dateOfBirth.length > 0) {
      if (dateOfBirth.length !== 10) {
        Alert.alert('Error', 'Por favor ingresa una fecha de nacimiento válida (DD/MM/YYYY)');
        return false;
      }

      const [day, month, year] = dateOfBirth.split('/');
      const parsedDay = parseInt(day);
      const parsedMonth = parseInt(month);
      const parsedYear = parseInt(year);

      if (parsedDay < 1 || parsedDay > 31 || parsedMonth < 1 || parsedMonth > 12 || parsedYear < 1900 || parsedYear > new Date().getFullYear()) {
        Alert.alert('Error', 'Por favor ingresa una fecha de nacimiento válida');
        return false;
      }

      // Validar que el usuario sea mayor de 18 años
      const birthDate = new Date(parsedYear, parsedMonth - 1, parsedDay);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        Alert.alert('Error', 'Debes ser mayor de 18 años para registrarte en esta aplicación');
        return false;
      }
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
    }

    // Validaciones para dirección
    if (!street.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu dirección');
      return false;
    }

    if (!city.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu ciudad');
      return false;
    }

    if (!state.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu provincia/estado');
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

      // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD para el backend
      let formattedDateOfBirth = null;
      if (dateOfBirth && dateOfBirth.length === 10) {
        const [day, month, year] = dateOfBirth.split('/');
        if (day && month && year && year.length === 4) {
          formattedDateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      // Preparar datos para el registro
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dateOfBirth: formattedDateOfBirth,
        password: password
      };

      let registerResponse;

      if (isProvider) {
        // Agregar datos específicos del proveedor
        userData.bio = bio.trim();

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

      // Crear dirección después del registro exitoso
      try {
        console.log('📍 Creando dirección para el usuario...');

        const addressData = {
          title: addressTitle.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postal_code: postalCode.trim() || null,
          country: country.trim(),
          is_default: true // Primera dirección siempre es por defecto
        };

        await apiService.createAddress(addressData);
        console.log('✅ Dirección creada exitosamente');
      } catch (addressError) {
        console.error('⚠️ Error creando dirección (no crítico):', addressError);
        // No bloqueamos el registro por errores de dirección
      }

      // Navegar según el rol del usuario directamente sin alerta
      if (userInfo.role === 'provider') {
        navigation.navigate('ProviderLicensesSetup', {
          animation: 'slide_from_right',
          fromRegister: true
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
      extraHeight={120}
      extraScrollHeight={120}
      enableAutomaticScroll
      showsVerticalScrollIndicator={false}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.formContainer}>
          <Image source={fastservicesLogo} style={styles.logo} />
          <Text style={styles.title}>Crear cuenta</Text>

          <TextInput
            style={styles.input}
            placeholderTextColor="#6B7280"
            placeholder="Nombre"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholderTextColor="#6B7280"
            placeholder="Apellido"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholderTextColor="#6B7280"
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
            placeholderTextColor="#6B7280"
            placeholder="Teléfono (ej: +541234567890)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholderTextColor="#6B7280"
            placeholder="Fecha de nacimiento (DD/MM/YYYY)"
            value={dateOfBirth}
            onChangeText={(text) => {
              // Formatear la entrada como DD/MM/YYYY
              let formatted = text.replace(/\D/g, ''); // Solo números
              if (formatted.length >= 2) {
                formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
              }
              if (formatted.length >= 5) {
                formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
              }
              setDateOfBirth(formatted);
            }}
            keyboardType="numeric"
            maxLength={10}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholderTextColor="#6B7280"
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholderTextColor="#6B7280"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          {/* Campos de dirección */}
          <View style={styles.addressFields}>
            <Text style={styles.sectionTitle}>Tu Dirección</Text>

            <TextInput
              style={styles.input}
              placeholderTextColor="#6B7280"
              placeholder="Título (ej: Casa, Trabajo)"
              value={addressTitle}
              onChangeText={setAddressTitle}
              autoCapitalize="words"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholderTextColor="#6B7280"
              placeholder="Calle y número"
              value={street}
              onChangeText={setStreet}
              autoCapitalize="words"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholderTextColor="#6B7280"
              placeholder="Ciudad"
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholderTextColor="#6B7280"
              placeholder="Provincia/Estado"
              value={state}
              onChangeText={setState}
              autoCapitalize="words"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholderTextColor="#6B7280"
              placeholder="Código postal (opcional)"
              value={postalCode}
              onChangeText={setPostalCode}
              keyboardType="numeric"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholderTextColor="#6B7280"
              placeholder="País"
              value={country}
              onChangeText={setCountry}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          {/* Switch para seleccionar si es proveedor - MOVIDO DESPUÉS DE DIRECCIÓN */}
          <View style={styles.providerContainer}>
            <Text style={styles.providerText}>
              Quiero ofrecer servicios como proveedor
            </Text>
            <TouchableOpacity
              style={[styles.switch, isProvider && styles.switchActive]}
              onPress={() => setIsProvider(!isProvider)}
              disabled={loading}
            >
              <View style={[styles.switchThumb, isProvider && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          {/* Campos adicionales para proveedores */}
          {isProvider && (
            <View style={styles.providerFields}>
              <Text style={styles.sectionTitle}>Información de Proveedor</Text>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholderTextColor="#6B7280"
                placeholder="Describe los servicios que ofreces"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />

            </View>
          )}

          {/* Checkbox de Términos y Condiciones */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              disabled={loading}
            >
              {acceptedTerms && <Ionicons name="checkmark" size={18} color="#4776a6" />}
            </TouchableOpacity>
            <View style={styles.termsTextContainer}>
              <Text style={styles.termsText}>Acepto los </Text>
              <TouchableOpacity onPress={() => navigation.navigate('TermsAndConditions')}>
                <Text style={styles.termsLink}>Términos y Condiciones</Text>
              </TouchableOpacity>
            </View>
          </View>

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
            style={styles.linkContainer}
          >
            <Text style={styles.link}>¿Ya tenés cuenta? Iniciar sesión</Text>
          </TouchableOpacity>

          <Modal visible={loading} transparent animationType="fade">
            <Spinner />
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
}
