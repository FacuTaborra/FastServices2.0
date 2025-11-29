import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './ForgotPasswordScreen.styles';
import fastservicesLogo from '../../../assets/iconFastServices2.png';
import Spinner from '../../components/Spinner/Spinner';

export default function ForgotPasswordScreen() {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendEmail = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Por favor ingresa tu email');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Error', 'Por favor ingresa un email válido');
            return;
        }

        setLoading(true);

        // Simulación de llamada a la API
        setTimeout(() => {
            setLoading(false);
            Alert.alert(
                'Email enviado',
                'Si el email existe en nuestra base de datos, recibirás instrucciones para restablecer tu contraseña.',
                [
                    {
                        text: 'Volver al Login',
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );
        }, 1500);
    };

    return (
        <KeyboardAwareScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid
        >
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>

            <Image source={fastservicesLogo} style={styles.logo} />

            <Text style={styles.title}>Recuperar Contraseña</Text>

            <Text style={styles.description}>
                Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.
            </Text>

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

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendEmail}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Enviando...' : 'Enviar instrucciones'}
                </Text>
            </TouchableOpacity>

            <Modal visible={loading} transparent animationType="fade">
                <Spinner />
            </Modal>
        </KeyboardAwareScrollView>
    );
}

