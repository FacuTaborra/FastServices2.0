/**
 * Token Store - Manejo seguro de tokens fuera de componentes
 * Utiliza AsyncStorage para persistencia en React Native
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class TokenStore {
    constructor() {
        this._accessToken = null;
        this._refreshToken = null;
        this._tokenType = null;
        this._isInitialized = false;
        this._cachedAuthHeader = null; // ✅ Cache del header para evitar reconstruir
        this._lastCacheTime = 0;
        this._userType = null; // 'client' | 'provider'
    }

    /**
     * Inicializar el token store cargando desde AsyncStorage
     */
    async init() {
        if (this._isInitialized) return;

        try {
            const [access, refresh, tokenType, userType] = await Promise.all([
                AsyncStorage.getItem('access_token'),
                AsyncStorage.getItem('refresh_token'),
                AsyncStorage.getItem('token_type'),
                AsyncStorage.getItem('user_type'),
            ]);

            this._accessToken = access;
            this._refreshToken = refresh;
            this._tokenType = tokenType || 'Bearer';
            this._userType = userType;
            this._isInitialized = true;
        } catch (error) {
            console.error('Error inicializando token store:', error);
            this._isInitialized = true; // Marcar como inicializado aunque falle
        }
    }

    async getUserType() {
        await this.init();
        return this._userType;
    }

    async setUserType(userType) {
        this._userType = userType;
        try {
            if (userType) {
                await AsyncStorage.setItem('user_type', userType);
            } else {
                await AsyncStorage.removeItem('user_type');
            }
        } catch (e) {
            // Silencioso
        }
    }

    /**
     * Obtener el access token
     */
    async getAccess() {
        await this.init();
        return this._accessToken;
    }

    /**
     * Obtener el refresh token
     */
    async getRefresh() {
        await this.init();
        return this._refreshToken;
    }

    /**
     * Obtener el tipo de token (Bearer por defecto)
     */
    async getTokenType() {
        await this.init();
        return this._tokenType || 'Bearer';
    }

    /**
     * Obtener el token formateado para el header Authorization
     * OPTIMIZADO: Cache del header para evitar recalcular constantemente
     */
    async getAuthHeader() {
        await this.init(); // Una sola inicialización

        // ✅ Si no hay token, return null directamente
        if (!this._accessToken) {
            return null;
        }

        // ✅ Cache del header por 5 minutos para evitar reconstrucción constante
        const now = Date.now();
        if (this._cachedAuthHeader && (now - this._lastCacheTime) < 300000) {
            return this._cachedAuthHeader;
        }

        // Reconstruir y cachear
        const tokenType = this._tokenType || 'Bearer';
        this._cachedAuthHeader = `${tokenType} ${this._accessToken}`;
        this._lastCacheTime = now;

        return this._cachedAuthHeader;
    }

    /**
     * Establecer los tokens
     */
    async setTokens(accessToken, refreshToken = null, tokenType = 'Bearer') {
        try {
            this._accessToken = accessToken || null;
            this._refreshToken = refreshToken || this._refreshToken; // Mantener refresh si no se proporciona uno nuevo
            this._tokenType = tokenType || 'Bearer';

            // ✅ Invalidar cache cuando se actualizan tokens
            this._cachedAuthHeader = null;
            this._lastCacheTime = 0;

            // Persistir en AsyncStorage
            const promises = [
                AsyncStorage.setItem('token_type', this._tokenType),
            ];

            if (this._accessToken) {
                promises.push(AsyncStorage.setItem('access_token', this._accessToken));
            } else {
                promises.push(AsyncStorage.removeItem('access_token'));
            }

            if (this._refreshToken) {
                promises.push(AsyncStorage.setItem('refresh_token', this._refreshToken));
            } else {
                promises.push(AsyncStorage.removeItem('refresh_token'));
            }

            await Promise.all(promises);
        } catch (error) {
            console.error('Error guardando tokens:', error);
            throw error;
        }
    }

    /**
     * Limpiar todos los tokens
     */
    async clear() {
        try {
            this._accessToken = null;
            this._refreshToken = null;
            this._tokenType = null;

            // ✅ Limpiar cache también
            this._cachedAuthHeader = null;
            this._lastCacheTime = 0;

            await Promise.all([
                AsyncStorage.removeItem('access_token'),
                AsyncStorage.removeItem('refresh_token'),
                AsyncStorage.removeItem('token_type'),
                AsyncStorage.removeItem('user_data'), // Limpiar datos del usuario también
                AsyncStorage.removeItem('user_type'),
            ]);
        } catch (error) {
            console.error('Error limpiando tokens:', error);
        }
    }

    /**
     * Verificar si hay tokens válidos
     */
    async hasValidTokens() {
        const access = await this.getAccess();
        return !!access;
    }

    /**
     * Verificar si el token está próximo a expirar (si tenemos esa información)
     */
    async isTokenExpiringSoon() {
        // Por ahora retornamos false ya que no decodificamos el JWT
        // En el futuro se podría implementar decodificación del token para verificar exp
        return false;
    }
}

// Exportar instancia singleton
export const tokenStore = new TokenStore();

// Exportar también la clase por si se necesita
export { TokenStore };
