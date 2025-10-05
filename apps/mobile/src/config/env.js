/**
 * Configuración de entorno para la aplicación
 * Centraliza las variables de entorno y configuración base
 */

// Importar URL del archivo de configuración existente
import { URL_SERVER } from '../../settings';

export const API_URL = URL_SERVER; // Usar la URL del archivo settings.js existente
export const API_PREFIX = "/api";

// Configuración de timeouts
export const REQUEST_TIMEOUT = 15000;
export const RETRY_ATTEMPTS = 3;

// Configuración de tokens
export const TOKEN_REFRESH_THRESHOLD = 60000; // 1 minuto antes de expirar

export default {
  API_URL,
  API_PREFIX,
  REQUEST_TIMEOUT,
  RETRY_ATTEMPTS,
  TOKEN_REFRESH_THRESHOLD,
};
