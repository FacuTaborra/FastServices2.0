const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración específica para iOS y Android
config.server = {
    enhanceMiddleware: (middleware) => {
        return (req, res, next) => {
            // Headers para iOS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            res.setHeader('Access-Control-Allow-Credentials', 'true');

            // Para iOS development
            res.setHeader('X-Content-Type-Options', 'nosniff');

            return middleware(req, res, next);
        };
    },
};

// Configuración específica por plataforma
config.resolver = {
    ...config.resolver,
    platforms: ['ios', 'android', 'native', 'web'],
};

module.exports = config;