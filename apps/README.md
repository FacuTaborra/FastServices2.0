# Guía Paso a Paso para Diseñar una Página en React Native (JS)
> Incluye estructura de archivos, lógica de componentes, navegación, carga y animaciones.

---

## 📁 Estructura del Monorepo

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
├── README.md
└── .gitignore
```
## 0. Revisión en Trello

- Revisa el tablero de Trello y asegúrate de que la tarjeta de la tarea esté asignada.
- Mueve la tarjeta a "En progreso" antes de comenzar.


## 1. Crear una nueva rama en el repositorio

1. Desde la raíz del repositorio `FastServices/`, abre la terminal y verifica que estás en la rama principal (`main` o `develop`).
    ```bash
    cd FastServices
    git checkout main            # O la rama base que utilice tu equipo
    git pull origin main         # Asegúrate de tener la última versión
    ```
2. Crea una rama con nombre descriptivo siguiendo Conventional Commits:
    ```bash
    git checkout -b feature/[nombre-pagina]
    ```
   - Ejemplo: `feature/home-page` o `feature/login-screen`

3. Verifica que la rama fue creada correctamente:
    ```bash
    git branch
    ```

---

## 2. Definir la estructura de carpetas de la nueva pantalla

Dentro de `FastServices/apps/mobile/src/`, la estructura estándar debe verse así:
```
src/
├── components/              # Componentes reutilizables (botones, spinners, cards)
│   ├── Spinner/             # Carpeta del spinner de carga genérico
│   │   ├── Spinner.js       # Lógica del componente Spinner
│   │   └── Spinner.styles.js # Estilos del Spinner
│   └── ...                  # Otros componentes
├── navigation/              # Configuración de React Navigation
│   └── index.js             # Pila (Stack) y contenedor de navegación
├── screens/                 # Pantallas de la aplicación
│   └── HomePage/            # Carpeta de la pantalla HomePage
│       ├── HomePage.js      # Lógica de la pantalla
│       └── HomePage.styles.js  # Estilos de la pantalla
└── utils/                   # Funciones, constantes o helpers (opcional)
```
---

1. Crea la carpeta `screens/HomePage/` (se utiliza HomePage como ejemplo):
    ```bash
    cd FastServices/apps/mobile/src
    mkdir -p screens/HomePage
    ```
2. Crea la carpeta `components/Spinner/`:
    ```bash
    mkdir -p components/Spinner
    ```
3. (Opcional) Crea la carpeta `utils/` para helpers:
    ```bash
    mkdir -p utils
    ```

---

## 3. Crear el archivo de la nueva pantalla (Screen)

1. Dentro de `src/screens/HomePage/`, crea `HomePage.js` y `HomePage.styles.js`:
    ```bash
    cd FastServices/apps/mobile/src/screens/HomePage
    touch HomePage.js HomePage.styles.js
    ```
2. Abre `HomePage.js` y coloca un esqueleto básico importando estilos:

    ```javascript
    // FastServices/apps/mobile/src/screens/HomePage/HomePage.js
    import React, { useState, useEffect } from 'react';
    import { View, Text, Button, ActivityIndicator } from 'react-native';
    import Spinner from '../../components/Spinner/Spinner';
    import styles from './HomePage.styles';

    export default function HomePage({ navigation }) {
      // Ejemplo de estado para manejo de carga
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        // Simula carga de datos (puede ser petición a API via Axios)
        const timer = setTimeout(() => {
          setLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
      }, []);

      if (loading) {
        return <Spinner />;  // Componente reutilizable
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>¡Bienvenido a HomePage!</Text>
          {/* Ejemplo de botón para navegar a otra pantalla */}
          <View style={styles.buttonContainer}>
            <Button
              title="Ir a Detalles"
              onPress={() => navigation.navigate('Details')}
            />
          </View>
        </View>
      );
    }
    ```

3. Abre `HomePage.styles.js` y define los estilos separados:

    ```javascript
    // FastServices/apps/mobile/src/screens/HomePage/HomePage.styles.js
    import { StyleSheet } from 'react-native';

    export default StyleSheet.create({
      container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
      },
      title: {
        fontSize: 24,
        marginBottom: 12,
        fontWeight: 'bold',
      },
      buttonContainer: {
        marginTop: 12,
        width: '60%',
      },
    });
    ```

> **Explicación:**
> - Ahora los estilos están en `HomePage.styles.js`, lo que mejora la legibilidad.
> - `HomePage.js` importa `styles` desde el archivo separado.

---

## 4. Crear componentes reutilizables (Spinner de carga)

Para no repetir el `<ActivityIndicator />` en todas las pantallas, abstraemos en un componente genérico.

1. Dentro de `src/components/Spinner/`, crea `Spinner.js` y `Spinner.styles.js`:
    ```bash
    cd FastServices/apps/mobile/src/components/Spinner
    touch Spinner.js Spinner.styles.js
    ```
2. En `Spinner.js`, define la lógica del componente importando estilos:

    ```javascript
    // FastServices/apps/mobile/src/components/Spinner/Spinner.js
    import React from 'react';
    import { ActivityIndicator } from 'react-native';
    import { View } from 'react-native';
    import styles from './Spinner.styles';

    export default function Spinner() {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    ```

3. En `Spinner.styles.js`, define los estilos:

    ```javascript
    // FastServices/apps/mobile/src/components/Spinner/Spinner.styles.js
    import { StyleSheet } from 'react-native';

    export default StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      },
    });
    ```

> **Buena práctica:** centralizar componentes reutilizables y mantener sus estilos en archivos dedicados.

---

## 5. Configurar la navegación entre pantallas

1. Abre o crea `src/navigation/index.js` (sigue usando estilos en archivos separados):
    ```bash
    cd FastServices/apps/mobile/src/navigation
    touch index.js
    ```
2. Instala React Navigation si aún no lo hiciste:

    ```bash
    cd FastServices/apps/mobile
    npx expo install @react-navigation/native react-native-screens react-native-safe-area-context
    npm install @react-navigation/native-stack
    ```

3. En `src/navigation/index.js`, define el Stack Navigator:

    ```javascript
    // FastServices/apps/mobile/src/navigation/index.js
    import React from 'react';
    import { NavigationContainer } from '@react-navigation/native';
    import { createNativeStackNavigator } from '@react-navigation/native-stack';

    // Pantallas a importar
    import HomePage from '../screens/HomePage/HomePage';
    import DetailsScreen from '../screens/DetailsScreen'; // Suponiendo que DetailsScreen también tenga su propio styles file

    const Stack = createNativeStackNavigator();

    export default function AppNavigator() {
      return (
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="HomePage"
            screenOptions={{
              headerShown: true,
              headerTitleAlign: 'center',
              // Ejemplo de animación de transición (slide)
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen
              name="HomePage"
              component={HomePage}
              options={{ title: 'Inicio' }}
            />
            <Stack.Screen
              name="Details"
              component={DetailsScreen}
              options={{ title: 'Detalles' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      );
    }
    ```

> **Puntos clave sobre navegación:**
> - `initialRouteName` define la primera pantalla.
> - `screenOptions.animation` permite definir el estilo de transición.
> - `headerShown: true` muestra la barra superior nativa.

4. En `App.js`, reemplaza el contenido por el `AppNavigator`:

    ```javascript
    // FastServices/apps/mobile/App.js
    import React from 'react';
    import AppNavigator from './src/navigation';

    export default function App() {
      return <AppNavigator />;
    }
    ```

---

## 6. Añadir animaciones básicas (opcional)

Para animaciones más complejas, usa la API `Animated` de React Native o librerías como `react-native-reanimated`. Ejemplo con `Animated` en `HomePage`:

1. Modifica `HomePage.js` para incluir animación:

    ```javascript
    // FastServices/apps/mobile/src/screens/HomePage/HomePage.js
    import React, { useState, useEffect, useRef } from 'react';
    import { View, Text, Button, ActivityIndicator, Animated } from 'react-native';
    import Spinner from '../../components/Spinner/Spinner';
    import styles from './HomePage.styles';

    export default function HomePage({ navigation }) {
      const [loading, setLoading] = useState(true);
      const fadeAnim = useRef(new Animated.Value(0)).current; // valor inicial de opacidad

      useEffect(() => {
        // Simula carga de datos
        const timer = setTimeout(() => {
          setLoading(false);
          // Inicia animación de aparición
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }, 1500);
        return () => clearTimeout(timer);
      }, []);

      if (loading) {
        return <Spinner />;
      }

      return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>  
          <Text style={styles.title}>¡Bienvenido a HomePage!</Text>
          <View style={styles.buttonContainer}>
            <Button
              title="Ir a Detalles"
              onPress={() => navigation.navigate('Details')}
            />
          </View>
        </Animated.View>
      );
    }
    ```

> **Explicación:**
> - `fadeAnim` es un `Animated.Value` que controla la opacidad.
> - Se aplica a través de `<Animated.View>` y se inicia cuando termina la carga.

---

## 7. Hacer commit y push de la nueva rama

1. Verifica los archivos modificados:
    ```bash
    cd FastServices/apps/mobile
    git status
    ```
2. Agrega los archivos nuevos/modificados:
    ```bash
    git add \
      src/screens/HomePage/HomePage.js \
      src/screens/HomePage/HomePage.styles.js \
      src/components/Spinner/Spinner.js \
      src/components/Spinner/Spinner.styles.js \
      src/navigation/index.js \
      App.js
    ```

3. Haz un commit siguiendo Conventional Commits:
    ```bash
    git commit -m "feat(HomePage): mover estilos a archivos separados y agregar lógica de pantalla"
    ```

4. Sube la rama al remote:
    ```bash
    git push -u origin feature/home-page
    ```

5. Abre un Pull Request (PR) en GitHub solicitando revisión de código y actualiza la tarjeta correspondiente en Trello (mover a "Review").

---

## 8. Validaciones finales y pruebas

1. Asegúrate de que la app compile sin errores:
    ```bash
    npm run start
    npm run android   # o npm run ios
    ```
2. Verifica la navegación:
   - La pantalla `HomePage` debe mostrarse primero.
   - Al presionar “Ir a Detalles”, se debe navegar a `DetailsScreen`.
   - El spinner de carga y la animación de aparición deben mostrarse correctamente.

3. Revisa la consola de Metro Bundler y logs de dispositivo para errores de importaciones o sintaxis.

4. Comparte la rama con tu equipo para pruebas en sus dispositivos/emuladores.

---

### Buenas Prácticas en este flujo

- **Separación de estilos:** cada componente o pantalla tiene su propio archivo `.styles.js`.
- **Ramas descriptivas:** usa convención `feature/[nombre]`, `fix/[bug]`, `chore/[tarea]`.
- **Commits claros:** sigue Conventional Commits (`feat:`, `fix:`, `docs:`).
- **Componentización:** abstrae componentes reutilizables (e.g., `Spinner`, `Header`, `Card`) en `src/components/`.
- **Separación de responsabilidades:** una pantalla (`/screens`) solo contiene lógica y referencias a estilos.
- **Pruebas locales:** ejecuta y navega manualmente antes de mergear.
- **Documentación:** agrega comentarios breves y claros en funciones o animaciones.

