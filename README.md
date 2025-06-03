# FastServices – Aplicación Móvil (Expo / React Native)

Este repositorio contiene la aplicación móvil de FastServices, desarrollada con **Expo (React Native)**. El objetivo es que cada integrante del equipo pueda clonar el proyecto, instalar las dependencias y correr la app en su máquina de forma sencilla, manteniendo un flujo de trabajo uniforme.

---

## 📁 Estructura del Proyecto

```
FastServices/            ← Raíz del monorepo
├── apps/
│   └── mobile/          ← Carpeta de la app Expo / React Native
│       ├── assets/      ← Recursos estáticos (imágenes, fuentes, etc.)
│       ├── src/         ← Código fuente (screens, components, contexts, etc.)
│       ├── App.js       ← Archivo principal de la aplicación
│       ├── package.json
│       └── package-lock.json
├── services/            ← (En desuso por ahora, backend FastAPI)
│   └── api/
│       └── …
├── README.md            ← Este archivo
└── .gitignore
```

---

## 🔧 Prerrequisitos

Antes de comenzar, cada integrante debe tener instalado en su máquina:

### 1. Git
- Versión recomendada: `>=2.20.0`
- [Descargar Git](https://git-scm.com/download)

### 2. Node.js y npm
- Versión LTS recomendada: `>=18.x`
- Verificar:
```bash
node --version
npm --version
```

### 3. Expo CLI (local via npx)
- No instalar `expo-cli` global.
- Para remover instalaciones previas (opcional):
```bash
npm uninstall --global expo-cli
```

### 4. Android Studio
- [Descargar Android Studio](https://developer.android.com/studio)
- Crear un AVD con Android 11+
- Verificar que `adb` funcione:
```bash
adb --version
```

---

## 🚀 Primeros Pasos (Setup inicial)

### 1. Clonar el repositorio
```bash
git clone git@github.com:<usuario>/FastServices.git
cd FastServices
```

### 2. Instalar dependencias
```bash
cd apps/mobile
npm install
```

### 3. Ejecutar la aplicación
```bash
npx expo start
# en otra terminal (con emulador Android activo)
npx expo run:android
```

---

## 🔀 Flujo de Trabajo

### Crear rama
```bash
git checkout -b feat/nueva-funcion
```

### Commits claros
```bash
git add .
git commit -m "feat(mobile): descripción corta"
```

### Push y PR
```bash
git push -u origin feat/nueva-funcion
```

---

## 📦 Scripts útiles

Desde la raíz (`FastServices/`):
```bash
npm run mobile
npm run mobile:android
```

---

## 📝 Recursos Adicionales

- **Documentación Expo**: [docs.expo.dev](https://docs.expo.dev)
- **React Navigation**: [reactnavigation.org](https://reactnavigation.org/docs/getting-started)
- **Axios**: [axios-http.com](https://axios-http.com/docs/intro)
- **Socket.IO**: [socket.io](https://socket.io/docs/v4/client-api/)

---

¡Éxitos 🚀!
