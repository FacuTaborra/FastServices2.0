import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import styles from './Login.styles';
import fastservicesLogo from '../../../assets/iconFastServices2.png';
import Spinner from '../../components/Spinner/Spinner';


export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Main', { screen: 'Main', animation: 'fade' });
    }, 500);
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