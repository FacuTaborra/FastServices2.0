/**
 * Service Requests Service - Manejo de solicitudes de servicio
 * Permite crear nuevas solicitudes consumiendo el endpoint REST del backend.
 */

import { api } from '../api/http';

/**
 * Crear una nueva solicitud de servicio para el cliente autenticado.
 * @param {Object} requestData - Payload con los datos de la solicitud.
 * @returns {Promise<Object>} - Solicitud creada regresada por la API.
 */
export async function createServiceRequest(requestData) {
    try {
        console.log('🛠️ Creando solicitud de servicio...', {
            request_type: requestData?.request_type,
            address_id: requestData?.address_id,
            attachments: requestData?.attachments?.length ?? 0,
        });

        const response = await api.post('/service-requests', requestData);

        console.log('✅ Solicitud de servicio creada con ID:', response.data?.id);
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error creando solicitud de servicio:', { status, message });
        throw error;
    }
}

export async function getActiveServiceRequests() {
    try {
        console.log('📄 Obteniendo solicitudes activas del cliente...');
        const response = await api.get('/service-requests/active');
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error listando solicitudes activas:', { status, message });
        throw error;
    }
}

export async function getAllServiceRequests() {
    try {
        console.log('📚 Obteniendo historial de solicitudes del cliente...');
        const response = await api.get('/service-requests');
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error listando historial de solicitudes:', { status, message });
        throw error;
    }
}

export async function getServiceRequest(requestId) {
    if (!requestId) {
        throw new Error('getServiceRequest requiere un ID de solicitud válido.');
    }

    try {
        console.log('🔍 Obteniendo detalle de la solicitud...', { requestId });
        const response = await api.get(`/service-requests/${requestId}`);
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error obteniendo detalle de la solicitud:', {
            status,
            message,
            requestId,
        });
        throw error;
    }
}

export async function updateServiceRequest(requestId, payload) {
    try {
        console.log('✏️ Actualizando solicitud de servicio...', {
            requestId,
            payload,
        });

        const response = await api.put(`/service-requests/${requestId}`, payload);
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error actualizando solicitud de servicio:', { status, message });
        throw error;
    }
}

export async function cancelRequest(requestId) {
    try {
        console.log('🛑 Cancelando licitación...', { requestId });
        const response = await api.post(`/service-requests/${requestId}/cancel`);
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error cancelando la licitación:', { status, message });
        throw error;
    }
}

export async function confirmPayment(requestId, payload) {
    try {
        console.log('💳 Confirmando pago...', { requestId, payload });
        const response = await api.post(
            `/service-requests/${requestId}/confirm-payment`,
            payload,
        );
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error confirmando pago:', { status, message });
        throw error;
    }
}

export async function cancelService(requestId, payload) {
    try {
        console.log('🛑 Cancelando servicio confirmado...', { requestId, payload });
        const response = await api.post(
            `/service-requests/${requestId}/service/cancel`,
            payload || {},
        );
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error cancelando el servicio:', { status, message });
        throw error;
    }
}

export async function markServiceInProgress(requestId) {
    try {
        console.log('🚀 Marcando servicio en progreso...', { requestId });
        const response = await api.post(
            `/service-requests/${requestId}/service/mark-in-progress`,
        );
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error actualizando servicio a IN_PROGRESS:', { status, message });
        throw error;
    }
}

export async function submitServiceReview(requestId, payload) {
    if (!requestId) {
        throw new Error('submitServiceReview requiere un ID de solicitud válido.');
    }

    try {
        console.log('⭐ Enviando calificación del servicio...', { requestId });
        const response = await api.post(
            `/service-requests/${requestId}/service/review`,
            payload,
        );
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error enviando calificación del servicio:', { status, message });
        throw error;
    }
}

export async function getPaymentHistory() {
    try {
        console.log('💸 Obteniendo historial de pagos del cliente...');
        const response = await api.get('/service-requests/payments/history');
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error obteniendo historial de pagos:', { status, message });
        throw error;
    }
}

/**
 * Reescribir título y descripción usando AI para hacerlos más claros.
 * @param {Object} data - { title, description }
 * @returns {Promise<Object>} - { title, description } reescritos
 */
export async function rewriteWithAI(data) {
    try {
        console.log('✨ Reescribiendo con AI...', {
            titleLength: data?.title?.length ?? 0,
            descriptionLength: data?.description?.length ?? 0,
        });

        const response = await api.post('/service-requests/rewrite', data);

        console.log('✅ Reescritura completada');
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error reescribiendo con AI:', { status, message });
        throw error;
    }
}

/**
 * Crear una solicitud de recontratación para un servicio completado.
 * @param {Object} data - { service_id, description, attachments[] }
 * @returns {Promise<Object>} - Solicitud de recontratación creada
 */
export async function createRehireRequest(data) {
    try {
        console.log('🔄 Creando solicitud de recontratación...', {
            service_id: data?.service_id,
            descriptionLength: data?.description?.length ?? 0,
            attachments: data?.attachments?.length ?? 0,
        });

        const response = await api.post('/service-requests/rehire', data);

        console.log('✅ Solicitud de recontratación creada con ID:', response.data?.id);
        return response.data;
    } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const message = error?.message ?? error?.response?.data?.detail;
        console.error('❌ Error creando solicitud de recontratación:', { status, message });
        throw error;
    }
}

export default {
    createServiceRequest,
    getActiveServiceRequests,
    getAllServiceRequests,
    getServiceRequest,
    updateServiceRequest,
    cancelRequest,
    confirmPayment,
    cancelService,
    markServiceInProgress,
    submitServiceReview,
    getPaymentHistory,
    rewriteWithAI,
    createRehireRequest,
};
