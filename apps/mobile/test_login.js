/**
 * Test simple para verificar la configuración del login
 * Ejecutar desde la raíz del proyecto mobile: node test_login.js
 */

// Simular entorno React Native para testing
global.__DEV__ = true;

// Mock de AsyncStorage para testing
const AsyncStorageMock = {
    _storage: {},
    setItem: async (key, value) => {
        AsyncStorageMock._storage[key] = value;
        console.log(`📝 AsyncStorage SET: ${key} = ${value?.substring(0, 20)}...`);
    },
    getItem: async (key) => {
        const value = AsyncStorageMock._storage[key] || null;
        console.log(`📖 AsyncStorage GET: ${key} = ${value ? 'Present' : 'null'}`);
        return value;
    },
    removeItem: async (key) => {
        delete AsyncStorageMock._storage[key];
        console.log(`🗑️ AsyncStorage REMOVE: ${key}`);
    },
};

// Mock de React Native AsyncStorage
jest.doMock('@react-native-async-storage/async-storage', () => AsyncStorageMock);

// Mock de settings
jest.doMock('../settings', () => ({
    URL_SERVER: 'http://localhost:8000'
}));

async function testLoginConfig() {
    console.log('🧪 Testing Login Configuration...\n');

    try {
        // Import services
        const { login } = require('./src/services/auth.service');
        const { api } = require('./src/api/http');

        console.log('✅ Services imported successfully');
        console.log('🌐 API Base URL:', api.defaults.baseURL);
        console.log('⏰ API Timeout:', api.defaults.timeout);

        // Test con credenciales de prueba
        console.log('\n🔐 Testing login with test credentials...');

        // Esta llamada debería fallar pero nos dará información sobre la configuración
        try {
            await login('test@example.com', 'testpassword');
        } catch (error) {
            console.log('ℹ️ Expected error (no server running):', error.message);
        }

        console.log('\n✅ Configuration test completed');

    } catch (error) {
        console.error('❌ Configuration error:', error.message);
        console.error(error.stack);
    }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
    testLoginConfig();
}

module.exports = { testLoginConfig };