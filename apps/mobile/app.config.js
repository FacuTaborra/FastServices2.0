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
            supportsTablet: true
        },
        android: {
            package: "com.facutaborra.fastservices",
            adaptiveIcon: {
                foregroundImage: "./assets/icon_adaptive.png",
                backgroundColor: "#FFFFFF"
            }
        },
        newArchEnabled: true,
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            URL_SERVER: process.env.URL_SERVER || 'http://localhost:8000',
            API_VERSION: process.env.API_VERSION || 'v1',
            eas: {
                projectId: "87d519b1-9fc7-450f-a9af-481a064391b2"
            }
        },
    },
};
