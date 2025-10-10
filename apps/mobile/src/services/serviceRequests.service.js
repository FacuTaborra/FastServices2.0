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

export default {
    createServiceRequest,
    getActiveServiceRequests,
};
