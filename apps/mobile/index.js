import { registerRootComponent } from 'expo';
import * as Updates from 'expo-updates';

import App from './App';

// Verificar actualizaciones antes de registrar el componente
// (Solo en producción, no en desarrollo)
if (!__DEV__) {
    Updates.checkForUpdateAsync()
        .then((update) => {
            if (update.isAvailable) {
                return Updates.fetchUpdateAsync();
            }
        })
        .then((result) => {
            if (result?.isNew) {
                // Hay una nueva actualización, reiniciar la app
                Updates.reloadAsync();
            }
        })
        .catch((error) => {
            console.log(`Error verificando actualizaciones: ${error}`);
        });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
