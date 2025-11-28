import 'dotenv/config';

export default {
    expo: {
        name: "FastServices",
        slug: "fastservices",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon_adaptive.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        assetBundlePatterns: ["**/*"],
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.facutaborra.fastservices"
        },
        android: {
            package: "com.facutaborra.fastservices",
            adaptiveIcon: {
                foregroundImage: "./assets/icon_adaptive.png",
                backgroundColor: "#FFFFFF"
            }
        },
        // NOTA: La nueva arquitectura puede causar problemas en producción
        // Si experimentas problemas con timers, labels o renderizado,
        // considera cambiar a: newArchEnabled: false
        newArchEnabled: true,
        web: {
            favicon: "./assets/favicon.png"
        },
        updates: {
            url: "https://u.expo.dev/87d519b1-9fc7-450f-a9af-481a064391b2"
        },
        runtimeVersion: {
            policy: "appVersion"
        },
        extra: {
            URL_SERVER: process.env.URL_SERVER || 'http://fastservicesapi.taborra.dev',
            API_VERSION: process.env.API_VERSION || 'v1',
            URL_SERVER_PRODUCTION: process.env.URL_SERVER_PRODUCTION || 'http://fastservicesapi.taborra.dev',
            eas: {
                projectId: "87d519b1-9fc7-450f-a9af-481a064391b2"
            }
        },
    },
};
