import { Alert } from 'react-native';
import apiService from '../../../auth/apiService_auth';

export class ProfileHandler {
    constructor() {
        this.onProfileUpdate = null;
    }

    // Configurar callback para comunicarse con el componente
    setCallbacks({ onProfileUpdate }) {
        this.onProfileUpdate = onProfileUpdate;
    }

    // Cargar perfil del usuario
    async loadUserProfile() {
        try {
            console.log('🔍 Cargando perfil del usuario...');

            const userData = await apiService.getCurrentUser();
            console.log('✅ Perfil del usuario cargado:', userData);
            console.log('📅 Fecha de nacimiento del backend:', userData.date_of_birth);

            const profileData = {
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                email: userData.email || '',
                phone: userData.phone || '',
                date_of_birth: userData.date_of_birth || '',
                created_at: userData.created_at || '',
                fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
                password: '••••••••', // Placeholder para la contraseña
                // Campos de imagen de perfil
                profile_image_url: userData.profile_image_url || null,
                profile_image_s3_key: userData.profile_image_s3_key || null
            };

            // Formatear fecha de nacimiento para mostrar
            const formattedDateOfBirth = this.formatDateForDisplay(userData.date_of_birth);

            // Notificar al componente
            if (this.onProfileUpdate) {
                this.onProfileUpdate(profileData, formattedDateOfBirth);
            }

            return { profileData, formattedDateOfBirth };

        } catch (error) {
            console.error('❌ Error cargando perfil:', error);
            Alert.alert('Error', 'No se pudo cargar el perfil del usuario');
            throw error;
        }
    }

    // Formatear fecha del backend (YYYY-MM-DD) a formato de visualización (DD/MM/YYYY)
    formatDateForDisplay(dateString) {
        if (!dateString) {
            console.log('📅 No hay fecha de nacimiento en el perfil');
            return '';
        }

        console.log('📅 Procesando fecha:', dateString);
        const date = new Date(dateString);
        console.log('📅 Objeto Date creado:', date);

        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        console.log('📅 Fecha formateada:', formattedDate);

        return formattedDate;
    }

    // Convertir fecha de visualización (DD/MM/YYYY) a formato backend (YYYY-MM-DD)
    convertDateToBackendFormat(dateOfBirth) {
        if (!dateOfBirth) return null;

        const [day, month, year] = dateOfBirth.split('/');
        if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
            return `${year}-${month}-${day}`;
        }

        return null;
    }

    // Validar edad del usuario (debe ser mayor de 18 años)
    validateAge(dateOfBirth) {
        if (!dateOfBirth) return true; // Si no hay fecha, no validar

        const [day, month, year] = dateOfBirth.split('/');
        if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) {
            return true; // Si el formato no es válido, permitir (se validará en backend)
        }

        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            Alert.alert('Error', 'Debes ser mayor de 18 años para usar esta aplicación');
            return false;
        }

        return true;
    }

    // Procesar nombre completo y separarlo en nombre y apellido
    processFullName(fullName) {
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return { firstName, lastName };
    }

    // Actualizar perfil del usuario
    async updateUserProfile(fullName, dateOfBirth) {
        try {
            console.log('🔄 Actualizando perfil del usuario...');

            // Validar edad
            if (!this.validateAge(dateOfBirth)) {
                return false;
            }

            // Procesar nombre completo
            const { firstName, lastName } = this.processFullName(fullName);

            // Convertir fecha al formato del backend
            const backendDateOfBirth = this.convertDateToBackendFormat(dateOfBirth);

            const updateData = {
                first_name: firstName,
                last_name: lastName,
                date_of_birth: backendDateOfBirth
            };

            console.log('📤 Datos a enviar:', updateData);
            console.log('📅 Fecha original:', dateOfBirth);
            console.log('📅 Fecha convertida:', backendDateOfBirth);

            await apiService.updateUserProfile(updateData);
            console.log('✅ Perfil actualizado exitosamente');

            Alert.alert('Éxito', 'Perfil actualizado correctamente');
            return true;

        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
            Alert.alert('Error', 'No se pudo actualizar el perfil');
            return false;
        }
    }

    // Formatear fecha para mostrar información de "Miembro desde"
    formatDateForInfo(dateString) {
        if (!dateString) return 'No disponible';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Fecha inválida';
        }
    }

    // Manejar logout del usuario
    async handleLogout(navigation) {
        return new Promise((resolve) => {
            Alert.alert(
                'Cerrar Sesión',
                '¿Estás seguro que quieres cerrar sesión?',
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                        onPress: () => resolve(false)
                    },
                    {
                        text: 'Cerrar Sesión',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                console.log('🚪 Cerrando sesión...');
                                await apiService.logout();
                                console.log('✅ Sesión cerrada');

                                // Navegar al login y resetear el stack
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                });

                                resolve(true);
                            } catch (error) {
                                console.error('❌ Error cerrando sesión:', error);
                                Alert.alert('Error', 'No se pudo cerrar la sesión');
                                resolve(false);
                            }
                        }
                    }
                ]
            );
        });
    }
}

// Exportar instancia singleton
export const profileHandler = new ProfileHandler();