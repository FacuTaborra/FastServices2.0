import { Alert } from 'react-native';
import apiService from '../../../auth/apiService_auth';

export class AddressHandler {
    constructor() {
        this.onAddressesUpdate = null;
    }

    // Configurar callback para comunicarse con el componente
    setCallbacks({ onAddressesUpdate }) {
        this.onAddressesUpdate = onAddressesUpdate;
    }

    // Cargar direcciones del usuario
    async loadUserAddresses() {
        try {
            console.log('📍 Cargando direcciones del usuario...');

            const userAddresses = await apiService.getMyAddresses();

            // Buscar la dirección por defecto
            const defaultAddr = userAddresses.find(addr => addr.is_default);

            console.log('✅ Direcciones cargadas:', userAddresses.length);

            // Notificar al componente sobre la actualización
            if (this.onAddressesUpdate) {
                this.onAddressesUpdate(userAddresses, defaultAddr);
            }

            return { addresses: userAddresses, defaultAddress: defaultAddr };
        } catch (error) {
            console.error('❌ Error cargando direcciones:', error);
            // No mostramos alerta para no interrumpir la carga del perfil
            return { addresses: [], defaultAddress: null };
        }
    }

    // Establecer dirección por defecto
    async setDefaultAddress(addressId, addresses) {
        try {
            console.log('🏠 Estableciendo dirección por defecto:', addressId);
            await apiService.setDefaultAddress(addressId);

            // Recargar direcciones
            await this.loadUserAddresses();

            // Feedback visual
            const selectedAddress = addresses.find(addr => addr.id === addressId);
            Alert.alert(
                '✅ Dirección actualizada',
                `"${selectedAddress?.title}" es ahora tu dirección por defecto`
            );

            return true;
        } catch (error) {
            console.error('❌ Error setting default address:', error);
            Alert.alert('Error', 'No se pudo establecer la dirección por defecto');
            return false;
        }
    }

    // Validar datos del formulario de dirección
    validateAddressForm(addressForm) {
        const requiredFields = ['title', 'street', 'city', 'state'];
        const missingFields = requiredFields.filter(field => !addressForm[field].trim());

        if (missingFields.length > 0) {
            const fieldNames = {
                title: 'Título',
                street: 'Calle',
                city: 'Ciudad',
                state: 'Provincia/Estado'
            };
            const missingNames = missingFields.map(field => fieldNames[field]).join(', ');
            Alert.alert('Campos requeridos', `Por favor completa: ${missingNames}`);
            return false;
        }

        return true;
    }

    // Guardar dirección (crear nueva o actualizar existente)
    async saveAddress(addressForm, editingAddress = null) {
        try {
            // Validar formulario
            if (!this.validateAddressForm(addressForm)) {
                return false;
            }

            console.log('💾 Guardando dirección:', addressForm.title);

            if (editingAddress) {
                // Actualizar dirección existente
                await apiService.updateAddress(editingAddress.id, addressForm);
                Alert.alert('✅ Dirección actualizada', 'Los cambios se guardaron correctamente');
            } else {
                // Crear nueva dirección
                await apiService.createAddress(addressForm);
                Alert.alert('✅ Dirección creada', 'La nueva dirección se agregó correctamente');
            }

            // Recargar direcciones
            await this.loadUserAddresses();
            return true;

        } catch (error) {
            console.error('❌ Error saving address:', error);
            const action = editingAddress ? 'actualizar' : 'crear';
            Alert.alert('Error', `No se pudo ${action} la dirección. Inténtalo de nuevo.`);
            return false;
        }
    }

    // Eliminar dirección
    async deleteAddress(addressId, addresses) {
        return new Promise((resolve) => {
            const addressToDelete = addresses.find(addr => addr.id === addressId);

            Alert.alert(
                '🗑️ Eliminar dirección',
                `¿Estás seguro de que quieres eliminar "${addressToDelete?.title}"?`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                        onPress: () => resolve(false)
                    },
                    {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                console.log('🗑️ Eliminando dirección:', addressId);
                                await apiService.deleteAddress(addressId);
                                await this.loadUserAddresses();
                                Alert.alert('✅ Dirección eliminada', 'La dirección se eliminó correctamente');
                                resolve(true);
                            } catch (error) {
                                console.error('❌ Error deleting address:', error);
                                Alert.alert('Error', 'No se pudo eliminar la dirección');
                                resolve(false);
                            }
                        }
                    }
                ]
            );
        });
    }

    // Crear formulario vacío para nueva dirección
    createEmptyForm() {
        return {
            title: '',
            street: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'Argentina'
        };
    }

    // Crear formulario desde dirección existente para edición
    createFormFromAddress(address) {
        return {
            title: address.title,
            street: address.street,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code || '',
            country: address.country
        };
    }
}

// Exportar instancia singleton
export const addressHandler = new AddressHandler();