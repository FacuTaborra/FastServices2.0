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

export async function getProviderProposals() {
    try {
        const response = await api.get('/providers/me/proposals');
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo presupuestos del proveedor:', error.message || error);
        throw error;
    }
}

export async function getProviderServices() {
    try {
        const response = await api.get('/providers/me/services');
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo servicios del proveedor:', error.message || error);
        throw error;
    }
}

export async function getProviderOverviewStats() {
    try {
        const response = await api.get('/providers/me/stats/overview');
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo KPIs del proveedor:', error.message || error);
        throw error;
    }
}

export async function getProviderRevenueStats(months = 6) {
    try {
        const response = await api.get('/providers/me/stats/revenue', {
            params: { months },
        });
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo ingresos del proveedor:', error.message || error);
        throw error;
    }
}

export async function getProviderRatingDistribution(months = 6) {
    try {
        const response = await api.get('/providers/me/stats/ratings', {
            params: { months },
        });
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo distribución de calificaciones:', error.message || error);
        throw error;
    }
}

export async function markProviderServiceOnRoute(serviceId) {
    try {
        console.log('🚗 Marcando servicio en camino...', { serviceId });
        const response = await api.post(`/providers/me/services/${serviceId}/mark-on-route`);
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error actualizando servicio a ON_ROUTE:', { status, message });
        throw error;
    }
}

export async function markProviderServiceInProgress(serviceId) {
    try {
        console.log('🛠️ Marcando servicio en progreso...', { serviceId });
        const response = await api.post(`/providers/me/services/${serviceId}/mark-in-progress`);
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error actualizando servicio a IN_PROGRESS:', { status, message });
        throw error;
    }
}

export async function markProviderServiceCompleted(serviceId) {
    try {
        console.log('✅ Marcando servicio completado...', { serviceId });
        const response = await api.post(`/providers/me/services/${serviceId}/mark-completed`);
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error actualizando servicio a COMPLETED:', { status, message });
        throw error;
    }
}

export async function createProviderProposal(payload) {
    try {
        const response = await api.post('/providers/me/proposals', payload);
        return response.data;
    } catch (error) {
        console.error('❌ Error creando presupuesto:', error.message || error);
        throw error;
    }
}

export async function getProviderCurrencies() {
    try {
        const response = await api.get('/providers/currencies');
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo monedas disponibles:', error.message || error);
        throw error;
    }
}
