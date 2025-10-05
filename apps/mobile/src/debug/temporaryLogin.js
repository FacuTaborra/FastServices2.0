/**
 * Solución temporal: Usar solo el endpoint que funciona
 */

import { api } from '../api/http';
import { tokenStore } from '../auth/tokenStore';

/**
 * Login temporal usando solo el endpoint de proveedores que sabemos funciona
 */
export async function temporaryLogin(email, password) {
    try {
        console.log('🔄 TEMPORAL LOGIN - Solo usando endpoint de proveedores...');

        const loginData = {
            email: email.trim(),
            password: password
        };

        // Solo intentar con el endpoint que funciona
        console.log('🔗 POST a:', api.defaults.baseURL + '/providers/login');
        const response = await api.post('/providers/login', loginData);

        console.log('✅ Login exitoso como proveedor');

        // Guardar tokens
        console.log('💾 Guardando tokens...');
        await tokenStore.setTokens(
            response.access_token,
            response.refresh_token || null,
            response.token_type || 'Bearer'
        );

        console.log('✅ Login completado exitosamente');

        return {
            ...response,
            user_type: 'provider'
        };

    } catch (error) {
        console.error('❌ Temporal login falló:', {
            message: error.message,
            status: error.status,
            data: error.data
        });

        // Mensajes de error más específicos
        if (error.status === 403) {
            throw new Error('Tu cuenta debe ser de tipo proveedor para poder acceder');
        } else if (error.status === 401) {
            throw new Error('Email o contraseña incorrectos');
        } else if (error.message.includes('Network')) {
            throw new Error('No se puede conectar al servidor. Verifica tu conexión.');
        } else {
            throw new Error(`Error de login: ${error.message}`);
        }
    }
}

/**
 * Para usar en tu componente temporalmente:
 * 
 * import { temporaryLogin } from '../debug/temporaryLogin';
 * 
 * // En tu handleLogin:
 * try {
 *   const result = await temporaryLogin(email, password);
 *   // Login exitoso
 * } catch (error) {
 *   // Mostrar error al usuario
 * }
 */