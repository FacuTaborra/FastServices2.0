import React, { useEffect } from 'react';
import { View, Image, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import fastservicesLogo from '../../../assets/iconFastServices2.png';
import Spinner from '../../components/Spinner/Spinner';
import * as authService from '../../services/auth.service';

export default function SplashScreen() {
    const navigation = useNavigation();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            console.log('🔍 Verificando estado de autenticación...');

            // Dar un pequeño delay para mostrar el splash
            await new Promise(resolve => setTimeout(resolve, 1500));

            const { isAuthenticated, user } = await authService.checkAuthAndGetUser();

            if (isAuthenticated && user) {
                console.log('✅ Usuario autenticado:', user.first_name, 'rol:', user.role);

                // Navegar según el rol del usuario
                if (user.role === 'provider') {
                    navigation.replace('ProviderMain', {
                        screen: 'ProviderRequests',
                        animation: 'fade'
                    });
                } else {
                    navigation.replace('Main', {
                        screen: 'HomePage',
                        animation: 'fade'
                    });
                }
            } else {
                console.log('❌ Usuario no autenticado, redirigiendo al login');
                navigation.replace('Login', { animation: 'fade' });
            }

        } catch (error) {
            console.error('❌ Error verificando autenticación:', error);
            // En caso de error, ir al login
            navigation.replace('Login', { animation: 'fade' });
        }
    };

    return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fff'
        }}>
            <Image
                source={fastservicesLogo}
                style={{
                    width: 240,
                    height: 240,
                    marginBottom: 30
                }}
                resizeMode="contain"
            />
            <Spinner />
        </View>
    );
}