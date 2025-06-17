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
  Switch,
  ScrollView,
  Modal,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import styles from './Register.styles';
import fastservicesLogo from '../../../assets/iconFastServices2.png';
import Spinner from '../../components/Spinner/Spinner';

export default function Register() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isProvider, setIsProvider] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (isProvider) {
        navigation.navigate('ProviderMain', { screen: 'ProviderRequests', animation: 'fade' });
      } else {
        navigation.navigate('Main', { screen: 'Main', animation: 'fade' });
      }
    }, 2000);
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
            placeholder="Nombre completo"
            value={name}
            onChangeText={setName}
          />
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
          <TextInput
            style={styles.input}
            placeholder="Confirmar contraseña"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Registrarme</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login', { animation: 'slide_from_left' })}>
            <Text style={styles.link}>¿Ya tenés cuenta? Iniciar sesión</Text>
          </TouchableOpacity>

          <View style={styles.providerContainer}>
            <Text style={styles.providerText}>Quiero ser proveedor de servicios</Text>
            <Switch
              value={isProvider}
              onValueChange={setIsProvider}
              thumbColor={isProvider ? '#4776a6' : undefined}
              trackColor={{ true: '#a7c0d9', false: '#b0b0b0' }}
            />
          </View>
          <Modal visible={loading} transparent animationType="fade">
            <Spinner />
          </Modal>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
}