/**
 * Auth Service - Manejo de autenticación
 * Incluye login, logout, registro y verificación de estado
 */

import { api } from '../api/http';
import { tokenStore } from '../auth/tokenStore';
import * as userService from './users.service'; // ✅ Import estático para mejor rendimiento

/**
 * Login de usuario unificado contra /auth/login
 */
export async function login(email, password) {
    try {
        console.log('🔐 Iniciando login unificado...');

        const payload = {
            email: email.trim(),
            password,
        };

        const response = await api.post('/auth/login', payload);
        const tokenData = response.data || response;
        const normalizedRole = typeof tokenData.role === 'string'
            ? tokenData.role.toLowerCase()
            : null;

        await tokenStore.setTokens(
            tokenData.access_token,
            tokenData.refresh_token || null,
            tokenData.token_type || 'Bearer',
        );

        userService.invalidateUserCache?.();

        try {
            await tokenStore.setUserType(normalizedRole);
        } catch (storeError) {
            console.warn('⚠️ No se pudo guardar el rol del usuario:', storeError?.message);
        }

        console.log('✅ Login exitoso');

        return {
            ...tokenData,
            user_type: normalizedRole,
        };
    } catch (error) {
        const status = error?.response?.status ?? error?.status;
        const message = error?.response?.data?.detail || error?.message || 'No pudimos iniciar sesión.';

        if (status === 401 || status === 403) {
            throw new Error('Email o contraseña incorrectos');
        }

        if (message === 'Network Error') {
            throw new Error('No se pudo conectar al servidor. Verificá tu conexión.');
        }

        throw new Error(message);
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
    userService.invalidateUserCache?.();
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
