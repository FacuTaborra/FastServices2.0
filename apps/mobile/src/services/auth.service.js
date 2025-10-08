/**
 * Auth Service - Manejo de autenticación
 * Incluye login, logout, registro y verificación de estado
 */

import { api } from '../api/http';
import { tokenStore } from '../auth/tokenStore';
import * as userService from './users.service'; // ✅ Import estático para mejor rendimiento

/**
 * Login de usuario (intenta cliente primero, luego proveedor)
 */
export async function login(email, password) {
    try {
        console.log('🔐 === INICIANDO PROCESO DE LOGIN ===');
        console.log('📧 Email:', email);
        console.log('🌐 API Base URL:', api.defaults.baseURL);
        console.log('⏰ Timeout configurado:', api.defaults.timeout);

        const loginData = {
            email: email.trim(),
            password: password
        };

        console.log('📋 Login data prepared:', {
            email: loginData.email,
            passwordLength: password?.length || 0
        });

        let response;
        let userType = 'client';

        // Intentar login - detectar automáticamente el tipo de endpoint disponible
        let clientEndpointExists = true;
        let providerEndpointExists = true;

        // Primero intentar login como cliente
        try {
            console.log('🔗 Intentando POST a:', api.defaults.baseURL + '/users/login');
            response = await api.post('/users/login', loginData);
            console.log('✅ Login exitoso como cliente');
        } catch (clientError) {
            console.log('❌ Login como cliente falló:', {
                message: clientError.message,
                status: clientError.status,
                data: clientError.data
            });

            // Si es Network Error, el endpoint no existe
            if (clientError.message === 'Network Error' || clientError.status === 404) {
                console.log('ℹ️ Endpoint /users/login no disponible');
                clientEndpointExists = false;
            }

            console.log('🔄 Intentando como proveedor...');

            // Si falla como cliente, intentar como proveedor
            try {
                console.log('🔗 Intentando POST a:', api.defaults.baseURL + '/providers/login');
                response = await api.post('/providers/login', loginData);
                userType = 'provider';
                console.log('✅ Login exitoso como proveedor');
            } catch (providerError) {
                console.error('❌ Login falló en ambos endpoints:', {
                    clientError: {
                        message: clientError.message,
                        status: clientError.status,
                        endpointExists: clientEndpointExists
                    },
                    providerError: {
                        message: providerError.message,
                        status: providerError.status
                    }
                });

                // Si es Network Error en ambos, es problema de conectividad
                if (clientError.message === 'Network Error' && providerError.message.includes('Network Error')) {
                    throw new Error('No se puede conectar al servidor. Verifica tu conexión a internet.');
                }

                // Si el cliente endpoint no existe pero el proveedor sí, es problema de credenciales
                if (!clientEndpointExists && (providerError.status === 401 || providerError.status === 403)) {
                    throw new Error('Email o contraseña incorrectos');
                }

                // Si ambos endpoints existen pero fallan, es problema de credenciales
                if (clientError.status === 401 && providerError.status === 401) {
                    throw new Error('Email o contraseña incorrectos');
                }

                // Error genérico
                const mainError = providerError.status === 401 || clientError.status === 401
                    ? 'Email o contraseña incorrectos'
                    : `Error de conexión: ${providerError.message || clientError.message}`;

                throw new Error(mainError);
            }
        }

        // Guardar tokens (axios devuelve response.data)
        const tokenData = response.data || response;
        console.log('💾 Guardando tokens:', {
            access_token: tokenData.access_token ? '✅ Present' : '❌ Missing',
            token_type: tokenData.token_type || 'Bearer',
            refresh_token: tokenData.refresh_token ? '✅ Present' : 'ℹ️ Not provided'
        });

        await tokenStore.setTokens(
            tokenData.access_token,
            tokenData.refresh_token || null,
            tokenData.token_type || 'Bearer'
        );

        // Persistir user type para futuras llamadas optimizadas
        try { await tokenStore.setUserType(userType); } catch { }

        console.log('✅ Tokens guardados exitosamente');

        return {
            ...tokenData,
            user_type: userType
        };
    } catch (error) {
        console.error('❌ Error en login:', error.message);
        throw error;
    }
}

/**
 * Logout del usuario
 */
export async function logout() {
    try {
        console.log('🚪 Cerrando sesión...');

        // Intentar notificar al servidor (opcional)
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.warn('⚠️ No se pudo notificar logout al servidor:', error.message);
            // No fallar el logout por esto
        }

        // Limpiar tokens localmente
        await tokenStore.clear();
        console.log('✅ Sesión cerrada exitosamente');
    } catch (error) {
        console.error('❌ Error en logout:', error);
        throw error;
    }
}

/**
 * Registro de cliente
 */
export async function registerClient(userData) {
    try {
        console.log('📝 Registrando cliente:', userData.email);

        const registerData = {
            role: 'client',
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email.trim(),
            phone: userData.phone,
            date_of_birth: userData.dateOfBirth || null,
            password: userData.password
        };

        const response = await api.post('/users/register', registerData);
        console.log('✅ Cliente registrado exitosamente');
        return response.data;
    } catch (error) {
        console.error('❌ Error en registro de cliente:', error.message);
        throw error;
    }
}

/**
 * Registro de proveedor
 */
export async function registerProvider(userData) {
    try {
        console.log('📝 Registrando proveedor:', userData.email);

        const registerData = {
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email.trim(),
            phone: userData.phone,
            date_of_birth: userData.dateOfBirth || null,
            password: userData.password,
            bio: userData.bio || ''
        };

        const response = await api.post('/providers/register', registerData);
        console.log('✅ Proveedor registrado exitosamente');
        return response.data;
    } catch (error) {
        console.error('❌ Error en registro de proveedor:', error.message);
        throw error;
    }
}

/**
 * Verificar si el usuario está autenticado
 */
export async function isAuthenticated() {
    try {
        const hasTokens = await tokenStore.hasValidTokens();
        if (!hasTokens) {
            return false;
        }

        // Intentar obtener información del usuario para verificar que el token es válido
        await userService.getCurrentUser();
        return true;
    } catch (error) {
        console.log('❌ Token inválido, limpiando...');
        await tokenStore.clear();
        return false;
    }
}

/**
 * Verificar autenticación y obtener datos del usuario
 */
export async function checkAuthAndGetUser() {
    try {
        const hasTokens = await tokenStore.hasValidTokens();
        if (!hasTokens) {
            return { isAuthenticated: false, user: null };
        }

        // Intentar obtener información del usuario
        const userData = await userService.getCurrentUser();
        return { isAuthenticated: true, user: userData };
    } catch (error) {
        console.log('❌ Token inválido, limpiando...');
        await tokenStore.clear();
        return { isAuthenticated: false, user: null };
    }
}

/**
 * Limpiar tokens manualmente
 */
export async function clearTokens() {
    await tokenStore.clear();
}
