import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './apiService_auth';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authListeners = [];
    }

    async isAuthenticated() {
        try {
            return await apiService.isAuthenticated();
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return false;
        }
    }

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

    async login(email, password) {
        try {
            const loginResponse = await apiService.login(email, password);
            const userData = await apiService.getCurrentUser();

            await AsyncStorage.setItem('user_data', JSON.stringify(userData));
            this.currentUser = userData;

            this.notifyAuthListeners('login', userData);

            return { loginResponse, userData };
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    async registerClient(userData) {
        try {
            const registerResponse = await apiService.registerClient(userData);

            const loginResult = await this.login(userData.email, userData.password);

            return { registerResponse, ...loginResult };
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await apiService.logout();
            this.currentUser = null;

            this.notifyAuthListeners('logout', null);

            console.log('✅ Logout completado');
        } catch (error) {
            console.error('Error en logout:', error);
            throw error;
        }
    }

    addAuthListener(listener) {
        this.authListeners.push(listener);
    }

    removeAuthListener(listener) {
        this.authListeners = this.authListeners.filter(l => l !== listener);
    }

    notifyAuthListeners(event, userData) {
        this.authListeners.forEach(listener => {
            try {
                listener(event, userData);
            } catch (error) {
                console.error('Error en auth listener:', error);
            }
        });
    }

    isClient(user = null) {
        const currentUser = user || this.currentUser;
        return currentUser?.role === 'client';
    }

    isProvider(user = null) {
        const currentUser = user || this.currentUser;
        return currentUser?.role === 'provider';
    }

    isAdmin(user = null) {
        const currentUser = user || this.currentUser;
        return currentUser?.role === 'admin';
    }


    getUserFullName(user = null) {
        const currentUser = user || this.currentUser;
        if (!currentUser) return '';
        return `${currentUser.first_name} ${currentUser.last_name}`.trim();
    }

    clearUserCache() {
        this.currentUser = null;
    }
}

const authManager = new AuthManager();
export default authManager;

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