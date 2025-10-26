/**
 * FACADE DE COMPATIBILIDAD - apiService_auth.js
 * 
 * Este archivo mantiene 100% de compatibilidad con el código existente
 * mientras delega internamente a los nuevos servicios modulares.
 * 
 * @deprecated Use los nuevos servicios y hooks en su lugar:
 * - import * as Auth from '../services/auth.service';
 * - import { useAuth } from '../hooks/useAuth';
 * - import { useUsers } from '../hooks/useUsers';
 * - import { useAddresses } from '../hooks/useAddresses';
 * - import { useImages } from '../hooks/useImages';
 */

// Importar los nuevos servicios modulares
import * as Auth from '../services/auth.service';
import * as Users from '../services/users.service';
import * as Addresses from '../services/addresses.service';
import * as Images from '../services/images.service';
import * as Providers from '../services/providers.service';
import { tokenStore } from '../auth/tokenStore';
import { api } from '../api/http';

class ApiService {
    constructor() {
        console.warn('⚠️ ApiService es deprecated. Use los nuevos servicios modulares y hooks de React Query.');
        // Importar URL del archivo de configuración existente para compatibilidad
        const { URL_SERVER } = require('../../settings');
        this.baseURL = URL_SERVER;
        this.apiPrefix = '/api';
    }

    // ========== MÉTODOS DE COMPATIBILIDAD HTTP ==========

    /** @deprecated Use tokenStore.getAuthHeader() */
    async getAuthToken() {
        return await tokenStore.getAuthHeader();
    }

    /** @deprecated Use api.defaults.headers directamente */
    async getHeaders(includeAuth = true, isFormData = false) {
        const headers = {};

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

    /** @deprecated Use api.get() directamente */
    async get(endpoint, requiresAuth = true) {
        try {
            const response = await api.get(endpoint);
            return response;
        } catch (error) {
            throw this._normalizeError(error);
        }
    }

    /** @deprecated Use api.post() directamente */
    async post(endpoint, data, requiresAuth = true) {
        try {
            const response = await api.post(endpoint, data);
            return response;
        } catch (error) {
            throw this._normalizeError(error);
        }
    }

    /** @deprecated Use api.put() directamente */
    async put(endpoint, data, requiresAuth = true) {
        try {
            const response = await api.put(endpoint, data);
            return response;
        } catch (error) {
            throw this._normalizeError(error);
        }
    }

    /** @deprecated Use api.delete() directamente */
    async delete(endpoint, requiresAuth = true) {
        try {
            const response = await api.delete(endpoint);
            return response || {};
        } catch (error) {
            throw this._normalizeError(error);
        }
    }

    /** @deprecated Use api.patch() directamente */
    async patch(endpoint, data = null, requiresAuth = true) {
        try {
            const response = await api.patch(endpoint, data);
            return response;
        } catch (error) {
            throw this._normalizeError(error);
        }
    }

    // Normalizar errores para mantener compatibilidad
    _normalizeError(error) {
        // Crear error compatible con el formato original
        const originalError = new Error(error.message);
        originalError.response = {
            status: error.status,
            data: error.data,
        };
        return originalError;
    }

    // ========== MÉTODOS DE AUTENTICACIÓN ==========

    /** @deprecated Use Auth.login() o useLogin() hook */
    async login(email, password) {
        return await Auth.login(email, password);
    }

    /** @deprecated Use Auth.registerClient() o useRegisterClient() hook */
    async registerClient(userData) {
        return await Auth.registerClient(userData);
    }

    /** @deprecated Use Auth.registerProvider() o useRegisterProvider() hook */
    async registerProvider(userData) {
        return await Auth.registerProvider(userData);
    }

    /** @deprecated Use Users.getCurrentUser() o useCurrentUser() hook */
    async getCurrentUser() {
        return await Users.getCurrentUser();
    }

    async getProviderProfile() {
        return await Providers.getMyProviderProfile();
    }

    async createProviderLicenses(licenses) {
        return await Providers.createProviderLicenses(licenses);
    }

    /** @deprecated Use Auth.isAuthenticated() o useIsAuthenticated() hook */
    async isAuthenticated() {
        return await Auth.isAuthenticated();
    }

    /** @deprecated Use Auth.checkAuthAndGetUser() o useAuthCheck() hook */
    async checkAuthAndGetUser() {
        return await Auth.checkAuthAndGetUser();
    }

    /** @deprecated Use Auth.logout() o useLogout() hook */
    async logout() {
        return await Auth.logout();
    }

    /** @deprecated Use tokenStore.clear() */
    async clearTokens() {
        return await Auth.clearTokens();
    }

    // ========== MÉTODOS DE DIRECCIONES ==========

    /** @deprecated Use Addresses.createAddress() o useCreateAddress() hook */
    async createAddress(addressData) {
        return await Addresses.createAddress(addressData);
    }

    /** @deprecated Use Addresses.getMyAddresses() o useMyAddresses() hook */
    async getMyAddresses(includeInactive = false) {
        return await Addresses.getMyAddresses(includeInactive);
    }

    /** @deprecated Use Addresses.getDefaultAddress() o useDefaultAddress() hook */
    async getDefaultAddress() {
        return await Addresses.getDefaultAddress();
    }

    /** @deprecated Use Addresses.updateAddress() o useUpdateAddress() hook */
    async updateAddress(addressId, addressData) {
        return await Addresses.updateAddress(addressId, addressData);
    }

    /** @deprecated Use Addresses.setDefaultAddress() o useSetDefaultAddress() hook */
    async setDefaultAddress(addressId) {
        return await Addresses.setDefaultAddress(addressId);
    }

    /** @deprecated Use Addresses.deleteAddress() o useDeleteAddress() hook */
    async deleteAddress(addressId) {
        return await Addresses.deleteAddress(addressId);
    }

    // ========== MÉTODOS DE USUARIOS ==========

    /** @deprecated Use Users.updateUserProfile() o useUpdateUserProfile() hook */
    async updateUserProfile(updateData) {
        return await Users.updateUserProfile(updateData);
    }

    /** @deprecated Use Users.updateProfileImage() o useUpdateProfileImage() hook */
    async updateProfileImage(imageData) {
        return await Users.updateProfileImage(imageData);
    }

    // ========== MÉTODOS DE IMÁGENES ==========

    /** @deprecated Use Images.uploadProfileImage() o useUploadProfileImage() hook */
    async uploadProfileImage(formData) {
        return await Images.uploadProfileImage(formData);
    }

    /** @deprecated Use Images.deleteProfileImage() o useDeleteProfileImage() hook */
    async deleteProfileImage(s3Key) {
        return await Images.deleteProfileImage(s3Key);
    }

    /** @deprecated Use Images.deleteCompleteProfileImage() o useDeleteCompleteProfileImage() hook */
    async deleteCompleteProfileImage() {
        return await Images.deleteCompleteProfileImage();
    }
}

// ========== INSTANCIA SINGLETON PARA COMPATIBILIDAD ==========

/**
 * @deprecated Esta instancia singleton se mantiene solo para compatibilidad.
 * Use los nuevos servicios modulares y hooks de React Query:
 * 
 * // Autenticación
 * import { useAuth, useLogin, useLogout } from '../hooks/useAuth';
 * 
 * // Usuarios
 * import { useUsers, useCurrentUser } from '../hooks/useUsers';
 * 
 * // Direcciones  
 * import { useAddresses, useMyAddresses } from '../hooks/useAddresses';
 * 
 * // Imágenes
 * import { useImages, useUploadProfileImage } from '../hooks/useImages';
 * 
 * // O servicios directos si necesario:
 * import * as Auth from '../services/auth.service';
 * import * as Users from '../services/users.service';
 * import * as Addresses from '../services/addresses.service';
 * import * as Images from '../services/images.service';
 */
const apiService = new ApiService();

// Exportar instancia singleton (compatibilidad)
export default apiService;

// También exportar funciones directas para migración gradual
export {
    // Servicios modulares
    Auth,
    Users,
    Addresses,
    Images,
    Providers,

    // Token store
    tokenStore,

    // HTTP client
    api,
};
