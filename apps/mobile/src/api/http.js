/**
 * HTTP Wrapper con Axios
 * Incluye interceptores para autenticación automática y refresh de tokens
 */

import axios from 'axios';
import { API_URL, API_PREFIX, REQUEST_TIMEOUT } from '../config/env';
import { tokenStore } from '../auth/tokenStore';

// Crear instancia de axios
export const api = axios.create({
    baseURL: `${API_URL}${API_PREFIX}`,
    timeout: REQUEST_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Debug logging
if (__DEV__) {
    console.log('🌐 API Configuration:', {
        baseURL: `${API_URL}${API_PREFIX}`,
        timeout: REQUEST_TIMEOUT
    });
}

// Variable para controlar el proceso de refresh
let isRefreshing = false;
let refreshPromise = null;

// Interceptor de request - agregar token automáticamente
api.interceptors.request.use(
    async (config) => {
        // ✅ Reducir logging para mejor rendimiento

        // Para FormData, remover Content-Type para que React Native lo maneje
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        // Agregar token de autorización si existe (solo si no es login)
        const isLoginRequest = config.url?.includes('/login');
        if (!isLoginRequest) {
            const authHeader = await tokenStore.getAuthHeader();
            if (authHeader) {
                config.headers.Authorization = authHeader;
                // ✅ Removido log para mejor rendimiento
            }
        }

        return config;
    },
    (error) => {
        if (__DEV__) {
            console.error('❌ Request interceptor error:', error);
        }
        return Promise.reject(error);
    }
);

// Interceptor de response - manejo automático de errores y refresh de tokens
api.interceptors.response.use(
    (response) => {
        // ✅ Solo log en desarrollo y solo para errores importantes
        if (__DEV__ && response.status >= 400) {
            console.log(`⚠️ HTTP ${response.status} ${response.config?.method?.toUpperCase()} ${response.config?.url}`);
        }
        // Retornar la respuesta completa para que se pueda acceder a response.data
        return response;
    },
    async (error) => {
        // ✅ Solo mostrar errores realmente importantes
        if (__DEV__ && error.response?.status !== 401) {
            console.error(`❌ HTTP Error ${error.response?.status}:`, error.config?.url);
        }
        const originalRequest = error.config;
        const status = error.response?.status;

        // Si es error 401 y no es un retry, intentar refresh
        if (status === 401 && !originalRequest.__isRetry) {
            originalRequest.__isRetry = true;

            // Si ya se está haciendo refresh, esperar
            if (isRefreshing && refreshPromise) {
                try {
                    const newToken = await refreshPromise;
                    if (newToken) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    return Promise.reject(normalizeError(error));
                }
            }

            // Iniciar proceso de refresh
            if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = refreshToken();

                try {
                    const newToken = await refreshPromise;
                    if (newToken) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    } else {
                        return Promise.reject(normalizeError(error));
                    }
                } catch (refreshError) {
                    return Promise.reject(normalizeError(error));
                } finally {
                    isRefreshing = false;
                    refreshPromise = null;
                }
            }
        }

        return Promise.reject(normalizeError(error));
    }
);

/**
 * Función para refrescar el token
 */
async function refreshToken() {
    try {
        const refreshTokenValue = await tokenStore.getRefresh();
        if (!refreshTokenValue) {
            await tokenStore.clear();
            return null;
        }

        // Intentar refresh con el endpoint (si existe)
        try {
            const response = await axios.post(`${API_URL}${API_PREFIX}/auth/refresh`, {
                refresh_token: refreshTokenValue,
            });

            const { access_token, refresh_token, token_type } = response.data;
            await tokenStore.setTokens(access_token, refresh_token, token_type);
            return access_token;
        } catch (refreshError) {
            // Si no hay endpoint de refresh, limpiar tokens
            await tokenStore.clear();
            return null;
        }
    } catch (error) {
        console.error('Error en refresh token:', error);
        await tokenStore.clear();
        return null;
    }
}

/**
 * Normalizar errores para formato consistente
 */
function normalizeError(error) {
    const normalizedError = {
        message: error?.response?.data?.detail ||
            error?.response?.data?.message ||
            error?.message ||
            'Error de conexión',
        status: error?.response?.status,
        code: error?.code,
        data: error?.response?.data,
    };

    return normalizedError;
}

/**
 * Métodos de conveniencia para diferentes tipos de request
 */
export const httpMethods = {
    /**
     * GET request
     */
    get: async (url, config = {}) => {
        try {
            const response = await api.get(url, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * POST request
     */
    post: async (url, data = null, config = {}) => {
        try {
            const response = await api.post(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * PUT request
     */
    put: async (url, data = null, config = {}) => {
        try {
            const response = await api.put(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * PATCH request
     */
    patch: async (url, data = null, config = {}) => {
        try {
            const response = await api.patch(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * DELETE request
     */
    delete: async (url, config = {}) => {
        try {
            const response = await api.delete(url, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

// Exportar también los métodos individuales por compatibilidad
export const { get, post, put, patch, delete: del } = httpMethods;

export default api;
