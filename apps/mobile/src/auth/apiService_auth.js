import AsyncStorage from '@react-native-async-storage/async-storage';
import { URL_SERVER } from '../../settings';

class ApiService {
    constructor() {
        this.baseURL = URL_SERVER;
    }

    // Obtener el token del AsyncStorage
    async getAuthToken() {
        try {
            const token = await AsyncStorage.getItem('access_token');
            const tokenType = await AsyncStorage.getItem('token_type');
            return token ? `${tokenType || 'Bearer'} ${token}` : null;
        } catch (error) {
            console.error('Error obteniendo token:', error);
            return null;
        }
    }

    // Headers base para requests
    async getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const authToken = await this.getAuthToken();
            if (authToken) {
                headers['Authorization'] = authToken;
            }
        }

        return headers;
    }

    // Método GET con autenticación
    async get(endpoint, requiresAuth = true) {
        try {
            const headers = await this.getHeaders(requiresAuth);

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    }

    // Método POST con autenticación
    async post(endpoint, data, requiresAuth = true) {
        try {
            const headers = await this.getHeaders(requiresAuth);

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    }

    // Método PUT con autenticación
    async put(endpoint, data, requiresAuth = true) {
        try {
            const headers = await this.getHeaders(requiresAuth);

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    }

    // Método DELETE con autenticación
    async delete(endpoint, requiresAuth = true) {
        try {
            const headers = await this.getHeaders(requiresAuth);

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }

    // Limpiar tokens (para logout)
    async clearTokens() {
        try {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('token_type');
        } catch (error) {
            console.error('Error limpiando tokens:', error);
        }
    }
}

// Exportar una instancia singleton
const apiService = new ApiService();
export default apiService;
