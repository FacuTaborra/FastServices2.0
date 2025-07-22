// Configuración de variables de entorno
import Constants from 'expo-constants';

// Obtener variables de entorno desde expo constants o usar fallbacks
const getEnvVar = (key, fallback) => {
    return Constants.expoConfig?.extra?.[key] || fallback;
};

const ENV = {
    development: {
        URL_SERVER: getEnvVar('URL_SERVER', 'http://localhost:8000'),
        API_VERSION: getEnvVar('API_VERSION', 'v1')
    },
    production: {
        URL_SERVER: getEnvVar('URL_SERVER', 'https://api.fastservices.com'),
        API_VERSION: getEnvVar('API_VERSION', 'v1')
    }
};

// Detectar entorno (desarrollo vs producción)
const currentEnv = __DEV__ ? 'development' : 'production';

// Exportar configuración según el entorno
export const URL_SERVER = ENV[currentEnv].URL_SERVER;
export const API_VERSION = ENV[currentEnv].API_VERSION;

// También puedes exportar toda la configuración si la necesitas
export const CONFIG = ENV[currentEnv];

// Para debugging (solo en desarrollo)
if (__DEV__) {
    console.log('🔧 Configuración actual:', {
        entorno: currentEnv,
        URL_SERVER,
        API_VERSION,
        'Variables de .env': Constants.expoConfig?.extra
    });
}