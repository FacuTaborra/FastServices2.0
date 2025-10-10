/**
 * Images Service - Manejo de imágenes y archivos
 * Incluye subida a S3 y gestión de imágenes de perfil
 */

import { api } from '../api/http';
import { tokenStore } from '../auth/tokenStore';

// Pequeño util de espera (para evitar condición de carrera tras delete en S3/CDN)
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function uploadImageToEndpoint(
    endpoint,
    formData,
    {
        optimize = true,
        maxWidth = 800,
        waitAfterDeleteMs = 0,
        settleDelayMs = 60,
        preflight = true,
        retries = 2,
        backoffBaseMs = 150,
    } = {}
) {
    if (waitAfterDeleteMs > 0) await delay(waitAfterDeleteMs);

    if (!(formData instanceof FormData)) throw new Error('formData inválido');
    if (![...formData.keys()].includes('file')) throw new Error("FormData debe incluir 'file'");

    try {
        const fileEntry = formData.get('file');
        if (fileEntry && typeof fileEntry === 'object') {
            if (fileEntry.name && fileEntry.name.includes('..')) {
                const cleaned = fileEntry.name.replace(/\.\.+/g, '.');
                fileEntry.name = cleaned;
            }
        }
    } catch { }

    if (preflight) {
        try { await api.get('/users/me'); } catch { /* ignore */ }
    }

    if (settleDelayMs > 0) await delay(settleDelayMs);

    const authHeader = await tokenStore.getAuthHeader();
    const fullUrl = `${api.defaults.baseURL}/images/${endpoint}?optimize=${optimize}&max_width=${maxWidth}`;

    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const resp = await fetch(fullUrl, {
                method: 'POST',
                headers: authHeader ? { Authorization: authHeader } : {},
                body: formData,
            });

            if (!resp.ok) {
                const txt = await resp.text().catch(() => '');
                throw new Error(`Upload fallo ${resp.status}: ${txt}`);
            }
            return await resp.json();
        } catch (err) {
            lastErr = err;
            const msg = err?.message || '';
            const transient =
                msg.includes('Network') || msg.includes('timeout') || err?.name === 'TypeError';
            if (attempt < retries && transient) {
                const backoff = backoffBaseMs * Math.pow(2, attempt);
                await delay(backoff);
                continue;
            }
            break;
        }
    }
    throw lastErr || new Error('Fallo desconocido subiendo imagen');
}

/**
 * Subir imagen de perfil a S3
 */
export async function uploadProfileImage(formData, options = {}) {
    return uploadImageToEndpoint('upload-profile', formData, options);
}

/**
 * Subir imagen para solicitudes de servicio a S3
 */
export async function uploadServiceRequestImage(
    formData,
    options = {}
) {
    const { maxWidth = 1200, ...rest } = options;
    return uploadImageToEndpoint('upload-service-request', formData, {
        maxWidth,
        ...rest,
    });
}

/**
 * Eliminar imagen de perfil de S3
 */
export async function deleteProfileImage(s3Key) {
    try {
        console.log('🗑️ Eliminando imagen de perfil:', s3Key);

        const response = await api.delete(`/images/${encodeURIComponent(s3Key)}`);
        console.log('✅ Imagen eliminada exitosamente');
        return response.data;
    } catch (error) {
        console.error('❌ Error eliminando imagen:', error.message);
        throw error;
    }
}

/**
 * Eliminar completamente la imagen de perfil (S3 + Base de datos)
 */
export async function deleteCompleteProfileImage() {
    try {
        console.log('🗑️ Eliminando imagen de perfil completamente...');

        const response = await api.delete('/users/delete-profile-image');
        console.log('✅ Imagen de perfil eliminada completamente');
        return response.data;
    } catch (error) {
        console.error('❌ Error eliminando imagen de perfil:', error.message);
        throw error;
    }
}

/**
 * Obtener URL presignada para subida directa (si se implementa en el futuro)
 */
export async function getUploadUrl(fileName, fileType) {
    try {
        console.log('🔗 Obteniendo URL presignada para subida...');

        const response = await api.post('/images/get-upload-url', {
            file_name: fileName,
            file_type: fileType
        });

        console.log('✅ URL presignada obtenida');
        return response.data;
    } catch (error) {
        console.error('❌ Error obteniendo URL presignada:', error.message);
        throw error;
    }
}

/**
 * Subir archivo directamente a S3 usando URL presignada (si se implementa)
 */
export async function uploadToS3Direct(presignedUrl, file, progressCallback = null) {
    try {
        console.log('📤 Subiendo archivo directamente a S3...');

        const config = {
            headers: {
                'Content-Type': file.type || 'application/octet-stream',
            },
        };

        if (progressCallback) {
            config.onUploadProgress = (progressEvent) => {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                progressCallback(percentCompleted);
            };
        }

        await api.put(presignedUrl, file, config);
        console.log('✅ Archivo subido directamente a S3');
    } catch (error) {
        console.error('❌ Error subiendo a S3:', error.message);
        throw error;
    }
}

/**
 * Ping protegido para diagnosticar si el endpoint de imágenes responde
 */
export async function pingImagesEndpoint() {
    try {
        const res = await api.get('/images/upload-profile');
        return { reachable: true, status: res.status };
    } catch (e) {
        const status = e?.status || e?.response?.status;
        return { reachable: false, status, message: e.message };
    }
}
