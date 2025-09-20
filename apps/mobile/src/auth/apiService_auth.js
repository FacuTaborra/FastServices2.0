import AsyncStorage from '@react-native-async-storage/async-storage';
import { URL_SERVER } from '../../settings';

class ApiService {
    constructor() {
        this.baseURL = URL_SERVER;
        this.apiPrefix = '/api';
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

            const response = await fetch(`${this.baseURL}${this.apiPrefix}${endpoint}`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
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

            const response = await fetch(`${this.baseURL}${this.apiPrefix}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
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

            const response = await fetch(`${this.baseURL}${this.apiPrefix}${endpoint}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
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

            const response = await fetch(`${this.baseURL}${this.apiPrefix}${endpoint}`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }

    // ========== MÉTODOS DE AUTENTICACIÓN ==========

    // Login de usuario
    async login(email, password) {
        try {
            console.log('🔐 Intentando login con email:', email);

            const loginData = {
                email: email.trim(),
                password: password
            };

            const response = await this.post('/users/login', loginData, false);

            console.log('✅ Login exitoso, guardando tokens...');

            // Guardar tokens en AsyncStorage
            await AsyncStorage.setItem('access_token', response.access_token);
            await AsyncStorage.setItem('token_type', response.token_type);

            return response;
        } catch (error) {
            console.error('❌ Error en login:', error.message);
            throw error;
        }
    }

    // Registro de cliente (solo clientes por ahora)
    async registerClient(userData) {
        try {
            console.log('📝 Registrando cliente:', userData.email);

            const registerData = {
                role: 'client',
                first_name: userData.firstName,
                last_name: userData.lastName,
                email: userData.email.trim(),
                phone: userData.phone,
                password: userData.password
            };

            const response = await this.post('/users/register', registerData, false);

            console.log('✅ Cliente registrado exitosamente');

            return response;
        } catch (error) {
            console.error('❌ Error en registro:', error.message);
            throw error;
        }
    }

    // Obtener información del usuario actual
    async getCurrentUser() {
        try {
            console.log('👤 Obteniendo información del usuario actual...');

            const response = await this.get('/users/me', true);

            console.log('✅ Información del usuario obtenida');

            return response;
        } catch (error) {
            console.error('❌ Error obteniendo usuario actual:', error.message);
            throw error;
        }
    }

    // Verificar si el usuario está autenticado
    async isAuthenticated() {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                return false;
            }

            // Intentar obtener información del usuario para verificar que el token es válido
            await this.getCurrentUser();
            return true;
        } catch (error) {
            console.log('❌ Token inválido, limpiando...');
            await this.clearTokens();
            return false;
        }
    }

    // Logout - limpiar tokens
    async logout() {
        try {
            console.log('🚪 Cerrando sesión...');
            await this.clearTokens();
            console.log('✅ Sesión cerrada');
        } catch (error) {
            console.error('❌ Error en logout:', error);
            throw error;
        }
    }

    // Limpiar tokens (para logout)
    async clearTokens() {
        try {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('token_type');
            await AsyncStorage.removeItem('user_data'); // Por si guardamos datos del usuario
        } catch (error) {
            console.error('Error limpiando tokens:', error);
        }
    }
}

// Exportar una instancia singleton
const apiService = new ApiService();
export default apiService;
