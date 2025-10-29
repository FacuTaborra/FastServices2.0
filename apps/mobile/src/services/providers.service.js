import { api } from '../api/http';

/**
 * Provider Service - Gestión de perfiles de proveedores y licencias
 */

export async function getMyProviderProfile() {
    try {
        const response = await api.get('/providers/me');
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo perfil de proveedor:', error.message || error);
        throw error;
    }
}

export async function createProviderLicenses(licenses) {
    try {
        const payload = { licenses };
        const response = await api.post('/providers/me/licenses', payload);
        return response.data;
    } catch (error) {
        console.error('❌ Error creando licencias de proveedor:', error.message || error);
        throw error;
    }
}

export async function getMatchingServiceRequests() {
    try {
        const response = await api.get('/providers/me/matching-requests');
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo solicitudes compatibles:', error.message || error);
        throw error;
    }
}
