import 'dotenv/config';

export default {
    expo: {
        name: "FastServices",
        slug: "fastservices",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/iconFastServices2.png",
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
            adaptiveIcon: {
                foregroundImage: "./assets/iconFastServices2.png",
                backgroundColor: "#FFFFFF"
            }
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            URL_SERVER: process.env.URL_SERVER || 'http://localhost:8000',
            API_VERSION: process.env.API_VERSION || 'v1',
        },
    },
};
