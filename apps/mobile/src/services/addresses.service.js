/**
 * Addresses Service - Manejo de direcciones
 * Incluye CRUD completo de direcciones del usuario
 */

import { api } from '../api/http';

/**
 * Crear una nueva dirección
 */
export async function createAddress(addressData) {
    try {
        console.log('🏠 Creando nueva dirección...');
        const response = await api.post('/addresses/', addressData);
        console.log('✅ Dirección creada exitosamente');
        return response.data;
    } catch (error) {
        console.error('❌ Error creando dirección:', error.message);
        throw error;
    }
}

/**
 * Obtener todas las direcciones del usuario
 */
export async function getMyAddresses(includeInactive = false) {
    try {
        console.log('📍 Obteniendo direcciones del usuario...');
        const response = await api.get(`/addresses/?include_inactive=${includeInactive}`);
        console.log(`✅ ${response.data.length || 0} direcciones obtenidas`);
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo direcciones:', error.message);
        throw error;
    }
}

/**
 * Obtener la dirección por defecto
 */
export async function getDefaultAddress() {
    try {
        console.log('🏡 Obteniendo dirección por defecto...');
        const response = await api.get('/addresses/default');
        console.log('✅ Dirección por defecto obtenida');
        return response.data;
    } catch (error) {
        if (error.status === 404) {
            console.log('ℹ️ No hay dirección por defecto configurada');
            return null;
        }
        console.error('❌ Error obteniendo dirección por defecto:', error.message);
        throw error;
    }
}

/**
 * Actualizar una dirección
 */
export async function updateAddress(addressId, addressData) {
    try {
        console.log(`✏️ Actualizando dirección ${addressId}...`);
        const response = await api.put(`/addresses/${addressId}`, addressData);
        console.log('✅ Dirección actualizada exitosamente');
        return response.data;
    } catch (error) {
        console.error('❌ Error actualizando dirección:', error.message);
        throw error;
    }
}

/**
 * Establecer como dirección por defecto
 */
export async function setDefaultAddress(addressId) {
    try {
        console.log(`🏡 Estableciendo dirección ${addressId} como por defecto...`);
        const response = await api.patch(`/addresses/${addressId}/set-default`);
        console.log('✅ Dirección por defecto establecida');
        return response.data;
    } catch (error) {
        console.error('❌ Error estableciendo dirección por defecto:', error.message);
        throw error;
    }
}

/**
 * Eliminar una dirección
 */
export async function deleteAddress(addressId) {
    try {
        console.log(`🗑️ Eliminando dirección ${addressId}...`);
        await api.delete(`/addresses/${addressId}`);
        console.log('✅ Dirección eliminada exitosamente');
    } catch (error) {
        console.error('❌ Error eliminando dirección:', error.message);
        throw error;
    }
}
