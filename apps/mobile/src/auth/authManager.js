/**
 * Utilidades de autenticación para la aplicación móvil
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './apiService_auth';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authListeners = [];
    }

    // Verificar si el usuario está autenticado
    async isAuthenticated() {
        try {
            return await apiService.isAuthenticated();
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return false;
        }
    }

    // Obtener el usuario actual desde AsyncStorage
    async getCurrentUser() {
        try {
            if (this.currentUser) {
                return this.currentUser;
            }

            const userData = await AsyncStorage.getItem('user_data');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                return this.currentUser;
            }

            // Si no hay datos guardados, intentar obtener del servidor
            if (await this.isAuthenticated()) {
                const user = await apiService.getCurrentUser();
                await AsyncStorage.setItem('user_data', JSON.stringify(user));
                this.currentUser = user;
                return user;
            }

            return null;
        } catch (error) {
            console.error('Error obteniendo usuario actual:', error);
            return null;
        }
    }

    // Login del usuario
    async login(email, password) {
        try {
            const loginResponse = await apiService.login(email, password);
            const userData = await apiService.getCurrentUser();

            await AsyncStorage.setItem('user_data', JSON.stringify(userData));
            this.currentUser = userData;

            // Notificar a los listeners
            this.notifyAuthListeners('login', userData);

            return { loginResponse, userData };
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    // Registro de cliente
    async registerClient(userData) {
        try {
            const registerResponse = await apiService.registerClient(userData);

            // Hacer login automático después del registro
            const loginResult = await this.login(userData.email, userData.password);

            return { registerResponse, ...loginResult };
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    }

    // Logout del usuario
    async logout() {
        try {
            await apiService.logout();
            this.currentUser = null;

            // Notificar a los listeners
            this.notifyAuthListeners('logout', null);

            console.log('✅ Logout completado');
        } catch (error) {
            console.error('Error en logout:', error);
            throw error;
        }
    }

    // Agregar listener para cambios de autenticación
    addAuthListener(listener) {
        this.authListeners.push(listener);
    }

    // Remover listener
    removeAuthListener(listener) {
        this.authListeners = this.authListeners.filter(l => l !== listener);
    }

    // Notificar a todos los listeners
    notifyAuthListeners(event, userData) {
        this.authListeners.forEach(listener => {
            try {
                listener(event, userData);
            } catch (error) {
                console.error('Error en auth listener:', error);
            }
        });
    }

    // Verificar si el usuario es cliente
    isClient(user = null) {
        const currentUser = user || this.currentUser;
        return currentUser?.role === 'client';
    }

    // Verificar si el usuario es proveedor
    isProvider(user = null) {
        const currentUser = user || this.currentUser;
        return currentUser?.role === 'provider';
    }

    // Verificar si el usuario es admin
    isAdmin(user = null) {
        const currentUser = user || this.currentUser;
        return currentUser?.role === 'admin';
    }

    // Obtener nombre completo del usuario
    getUserFullName(user = null) {
        const currentUser = user || this.currentUser;
        if (!currentUser) return '';
        return `${currentUser.first_name} ${currentUser.last_name}`.trim();
    }

    // Limpiar caché del usuario
    clearUserCache() {
        this.currentUser = null;
    }
}

// Exportar instancia singleton
const authManager = new AuthManager();
export default authManager;

// También exportar funciones individuales para conveniencia
export const {
    isAuthenticated,
    getCurrentUser,
    login,
    registerClient,
    logout,
    addAuthListener,
    removeAuthListener,
    isClient,
    isProvider,
    isAdmin,
    getUserFullName,
    clearUserCache
} = authManager;