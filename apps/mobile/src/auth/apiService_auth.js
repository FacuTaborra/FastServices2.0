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
    async getHeaders(includeAuth = true, isFormData = false) {
        const headers = {};

        // Solo agregar Content-Type para JSON, no para FormData
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

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

            // Para status 204 No Content, no hay cuerpo que parsear
            if (response.status === 204) {
                return {};
            }

            // Solo intentar parsear JSON si hay contenido
            const contentLength = response.headers.get('content-length');
            if (contentLength === '0') {
                return {};
            }

            return await response.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }

    // Método PATCH con autenticación
    async patch(endpoint, data = null, requiresAuth = true) {
        try {
            const headers = await this.getHeaders(requiresAuth);

            const requestOptions = {
                method: 'PATCH',
                headers,
            };

            if (data) {
                requestOptions.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.baseURL}${this.apiPrefix}${endpoint}`, requestOptions);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API PATCH Error:', error);
            throw error;
        }
    }

    // ========== MÉTODOS DE AUTENTICACIÓN ==========

    // Login de usuario (clientes y proveedores)
    async login(email, password) {
        try {
            console.log('🔐 Intentando login con email:', email);

            const loginData = {
                email: email.trim(),
                password: password
            };

            // Primero intentar login como cliente
            try {
                const response = await this.post('/users/login', loginData, false);
                console.log('✅ Login exitoso como cliente, guardando tokens...');

                // Guardar tokens en AsyncStorage
                await AsyncStorage.setItem('access_token', response.access_token);
                await AsyncStorage.setItem('token_type', response.token_type);

                return response;
            } catch (clientError) {
                console.log('❌ Login como cliente falló, intentando como proveedor...');

                // Si falla como cliente, intentar como proveedor
                try {
                    const response = await this.post('/providers/login', loginData, false);
                    console.log('✅ Login exitoso como proveedor, guardando tokens...');

                    // Guardar tokens en AsyncStorage
                    await AsyncStorage.setItem('access_token', response.access_token);
                    await AsyncStorage.setItem('token_type', response.token_type);

                    return response;
                } catch (providerError) {
                    console.error('❌ Login falló en ambos endpoints');
                    throw new Error('Email o contraseña incorrectos');
                }
            }
        } catch (error) {
            console.error('❌ Error en login:', error.message);
            throw error;
        }
    }

    // Registro de cliente
    async registerClient(userData) {
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

            const response = await this.post('/users/register', registerData, false);

            console.log('✅ Cliente registrado exitosamente');

            return response;
        } catch (error) {
            console.error('❌ Error en registro:', error.message);
            throw error;
        }
    }

    // Registro de proveedor
    async registerProvider(userData) {
        try {
            console.log('📝 Registrando proveedor:', userData.email);

            const registerData = {
                first_name: userData.firstName,
                last_name: userData.lastName,
                email: userData.email.trim(),
                phone: userData.phone,
                date_of_birth: userData.dateOfBirth || null,
                password: userData.password,
                bio: userData.bio || '',
                service_radius_km: userData.service_radius_km || 10
            };

            const response = await this.post('/providers/register', registerData, false);

            console.log('✅ Proveedor registrado exitosamente');

            return response;
        } catch (error) {
            console.error('❌ Error en registro de proveedor:', error.message);
            throw error;
        }
    }

    // Obtener información del usuario actual
    async getCurrentUser() {
        try {
            console.log('👤 Obteniendo información del usuario actual...');

            // Primero intentar con el endpoint de usuarios
            let response;
            try {
                response = await this.get('/users/me', true);
                console.log('✅ Información del usuario obtenida (cliente)');
                return response;
            } catch (userError) {
                // Si falla, intentar con el endpoint de proveedores
                console.log('🔄 Intentando con endpoint de proveedores...');
                try {
                    response = await this.get('/providers/me', true);
                    console.log('✅ Información del proveedor obtenida');
                    return response;
                } catch (providerError) {
                    console.error('❌ Error obteniendo usuario/proveedor:', providerError.message);
                    throw providerError;
                }
            }
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

    // Verificar autenticación y obtener información del usuario
    async checkAuthAndGetUser() {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                return { isAuthenticated: false, user: null };
            }

            // Intentar obtener información del usuario para verificar que el token es válido
            const userData = await this.getCurrentUser();
            return { isAuthenticated: true, user: userData };
        } catch (error) {
            console.log('❌ Token inválido, limpiando...');
            await this.clearTokens();
            return { isAuthenticated: false, user: null };
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

    // ===== DIRECCIONES =====

    /**
     * Crear una nueva dirección
     * @param {Object} addressData - Datos de la dirección
     * @returns {Promise<Object>} - Dirección creada
     */
    async createAddress(addressData) {
        return await this.post('/addresses/', addressData);
    }

    /**
     * Obtener todas las direcciones del usuario
     * @param {boolean} includeInactive - Incluir direcciones inactivas
     * @returns {Promise<Array>} - Lista de direcciones
     */
    async getMyAddresses(includeInactive = false) {
        return await this.get(`/addresses/?include_inactive=${includeInactive}`);
    }

    /**
     * Obtener la dirección por defecto
     * @returns {Promise<Object>} - Dirección por defecto
     */
    async getDefaultAddress() {
        try {
            return await this.get('/addresses/default');
        } catch (error) {
            if (error.message.includes('404')) {
                return null; // No hay dirección por defecto
            }
            throw error;
        }
    }

    /**
     * Actualizar una dirección
     * @param {number} addressId - ID de la dirección
     * @param {Object} addressData - Datos actualizados
     * @returns {Promise<Object>} - Dirección actualizada
     */
    async updateAddress(addressId, addressData) {
        return await this.put(`/addresses/${addressId}`, addressData);
    }

    /**
     * Establecer como dirección por defecto
     * @param {number} addressId - ID de la dirección
     * @returns {Promise<Object>} - Dirección actualizada
     */
    async setDefaultAddress(addressId) {
        return await this.patch(`/addresses/${addressId}/set-default`);
    }

    /**
     * Eliminar una dirección
     * @param {number} addressId - ID de la dirección
     * @returns {Promise<void>}
     */
    async deleteAddress(addressId) {
        return await this.delete(`/addresses/${addressId}`);
    }

    /**
     * Actualizar perfil de usuario
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object>} - Usuario actualizado
     */
    async updateUserProfile(updateData) {
        try {
            console.log('✏️ Actualizando perfil de usuario...');

            // Intentar actualizar usando el endpoint de usuarios (clientes)
            try {
                const response = await this.put('/users/me', updateData);
                console.log('✅ Perfil de cliente actualizado');
                return response;
            } catch (userError) {
                // Si falla, el usuario podría ser un proveedor
                // Los proveedores usan el mismo endpoint /users/me ahora
                console.error('❌ Error actualizando perfil:', userError.message);
                throw userError;
            }
        } catch (error) {
            console.error('❌ Error actualizando perfil de usuario:', error.message);
            throw error;
        }
    }

    /**
     * Subir imagen de perfil a S3
     * @param {FormData} formData - FormData con la imagen
     * @returns {Promise<Object>} - Respuesta del servidor con s3_key y public_url
     */
    async uploadProfileImage(formData) {
        try {
            console.log('📤 Subiendo imagen de perfil a S3...');
            console.log('📋 FormData keys:', Array.from(formData.keys()));

            const headers = await this.getHeaders(true, true); // isFormData = true

            // Para React Native con FormData, eliminar headers que pueden causar problemas
            delete headers['Content-Length'];
            delete headers['Content-Type']; // Dejar que React Native lo maneje automáticamente

            console.log('🔧 Headers finales:', headers);
            console.log('🌐 URL:', `${this.baseURL}${this.apiPrefix}/images/upload-profile`);

            const response = await fetch(`${this.baseURL}${this.apiPrefix}/images/upload-profile`, {
                method: 'POST',
                headers,
                body: formData,
            });

            console.log('📡 Respuesta recibida:', response.status, response.statusText); if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Imagen de perfil subida a S3 exitosamente:', result.s3_key);
            return result;

        } catch (error) {
            console.error('❌ Error subiendo imagen de perfil:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar perfil de usuario con imagen
     * @param {Object} imageData - Datos de la imagen (s3_key, public_url)
     * @returns {Promise<Object>} - Usuario actualizado
     */
    async updateProfileImage(imageData) {
        try {
            console.log('🔄 Actualizando perfil con imagen...', imageData.s3_key);

            const response = await this.put('/users/update-profile-image', imageData);
            console.log('✅ Perfil actualizado con imagen exitosamente');
            return response;

        } catch (error) {
            console.error('❌ Error actualizando perfil con imagen:', error.message);
            throw error;
        }
    }

    /**
     * Eliminar imagen de perfil
     * @param {string} s3Key - Clave S3 de la imagen
     * @returns {Promise<Object>} - Respuesta del servidor
     */
    async deleteProfileImage(s3Key) {
        try {
            console.log('🗑️ Eliminando imagen de perfil:', s3Key);

            const headers = await this.getHeaders(true);

            const response = await fetch(`${this.baseURL}${this.apiPrefix}/images/${encodeURIComponent(s3Key)}`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Imagen eliminada exitosamente');
            return result;

        } catch (error) {
            console.error('❌ Error eliminando imagen:', error.message);
            throw error;
        }
    }

    // Eliminar completamente la imagen de perfil (S3 + Base de datos)
    async deleteCompleteProfileImage() {
        try {
            console.log('🗑️ Eliminando imagen de perfil completamente...');

            const headers = await this.getHeaders();

            const response = await fetch(`${this.baseURL}${this.apiPrefix}/users/delete-profile-image`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Imagen de perfil eliminada completamente');
            return result;

        } catch (error) {
            console.error('❌ Error eliminando imagen de perfil:', error.message);
            throw error;
        }
    }
}

// Exportar una instancia singleton
const apiService = new ApiService();
export default apiService;
