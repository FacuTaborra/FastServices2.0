/**
 * Users Service - Manejo de usuarios y perfiles
 * Incluye operaciones CRUD de usuarios y gestión de perfiles
 */

import { api } from '../api/http';
import { tokenStore } from '../auth/tokenStore';

// Cache simple en memoria de los datos del usuario para evitar múltiples /me consecutivos
let _cachedUser = null;
let _cachedUserTimestamp = 0; // ms epoch
const USER_CACHE_TTL = 30 * 1000; // 30 segundos

/** Invalidar cache manualmente */
export function invalidateUserCache() {
    _cachedUser = null;
    _cachedUserTimestamp = 0;
}

/** Agregar parámetro de bust a la URL de imagen para forzar refresco en componentes <Image> */
function withImageCacheBust(user) {
    if (!user) return user;
    if (user.profile_image_url) {
        const sep = user.profile_image_url.includes('?') ? '&' : '?';
        const bust = `v=${Date.now()}`;
        return { ...user, profile_image_url: `${user.profile_image_url}${sep}${bust}` };
    }
    return user;
}

/**
 * Obtener información del usuario actual
 * Utiliza el endpoint unificado de usuarios
 */
export async function getCurrentUser({ forceRefresh = false } = {}) {
    try {
        // Retornar cache si válido y no forceRefresh
        if (!forceRefresh && _cachedUser && (Date.now() - _cachedUserTimestamp) < USER_CACHE_TTL) {
            return _cachedUser;
        }

        const response = await api.get('/users/me');
        const data = response.data;
        _cachedUser = withImageCacheBust(data);
        _cachedUserTimestamp = Date.now();

        const normalizedRole = typeof data?.role === 'string'
            ? data.role.toLowerCase()
            : null;

        try {
            await tokenStore.setUserType?.(normalizedRole);
        } catch { }

        return data;
    } catch (error) {
        console.error('❌ Error obteniendo usuario actual:', error.message);
        throw error;
    }
}

/**
 * Actualizar perfil de usuario
 */
export async function updateUserProfile(updateData) {
    try {
        console.log('✏️ Actualizando perfil de usuario...');

        const response = await api.put('/users/me', updateData);
        console.log('✅ Perfil actualizado exitosamente');
        return response.data;
    } catch (error) {
        console.error('❌ Error actualizando perfil:', error.message);
        throw error;
    }
}

/**
 * Actualizar perfil con datos de imagen
 */
export async function updateProfileImage(imageData) {
    try {
        console.log('🔄 Actualizando perfil con imagen...', imageData.s3_key);

        const response = await api.put('/users/update-profile-image', imageData);
        console.log('✅ Perfil actualizado con imagen exitosamente');
        invalidateUserCache();
        const updated = withImageCacheBust(response.data);
        _cachedUser = updated;
        _cachedUserTimestamp = Date.now();
        return updated;
    } catch (error) {
        console.error('❌ Error actualizando perfil con imagen:', error.message);
        throw error;
    }
}

/**
 * Eliminar imagen de perfil completamente
 */
export async function deleteCompleteProfileImage() {
    try {
        console.log('🗑️ Eliminando imagen de perfil completamente...');

        const response = await api.delete('/users/delete-profile-image');
        console.log('✅ Imagen de perfil eliminada completamente');
        invalidateUserCache();
        const updated = withImageCacheBust(response.data);
        _cachedUser = updated;
        _cachedUserTimestamp = Date.now();
        return updated;
    } catch (error) {
        console.error('❌ Error eliminando imagen de perfil:', error.message);
        throw error;
    }
}
