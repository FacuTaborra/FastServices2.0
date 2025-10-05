import { Alert, ActionSheetIOS, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import apiService from '../../../auth/apiService_auth';

export class ProfileImageHandler {
    constructor() {
        this.onImageUpdate = null;
        this.onUploadStart = null;
        this.onUploadEnd = null;
        this.onImageUploadSuccess = null;
    }

    // Configurar callbacks para comunicarse con el componente
    setCallbacks({ onImageUpdate, onUploadStart, onUploadEnd, onImageUploadSuccess }) {
        this.onImageUpdate = onImageUpdate;
        this.onUploadStart = onUploadStart;
        this.onUploadEnd = onUploadEnd;
        this.onImageUploadSuccess = onImageUploadSuccess;
    }

    // Solicitar permisos para acceder a la galería
    async requestImagePickerPermissions() {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permisos requeridos',
                'Necesitamos permisos para acceder a tu galería de fotos'
            );
            return false;
        }
        return true;
    }

    // Solicitar permisos para acceder a la cámara
    async requestCameraPermissions() {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permisos requeridos',
                'Necesitamos permisos para acceder a tu cámara'
            );
            return false;
        }
        return true;
    }

    // Mostrar opciones para seleccionar imagen (cámara o galería)
    showImagePickerOptions() {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancelar', 'Tomar foto', 'Elegir de galería'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        this.openCamera();
                    } else if (buttonIndex === 2) {
                        this.openImagePicker();
                    }
                }
            );
        } else {
            Alert.alert(
                'Seleccionar imagen',
                'Elige una opción',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Tomar foto', onPress: () => this.openCamera() },
                    { text: 'Elegir de galería', onPress: () => this.openImagePicker() },
                ]
            );
        }
    }

    // Abrir cámara para tomar foto
    async openCamera() {
        console.log('📷 Intentando abrir cámara...');
        const hasPermission = await this.requestCameraPermissions();
        if (!hasPermission) {
            console.log('❌ Sin permisos de cámara');
            return;
        }
        console.log('✅ Permisos de cámara obtenidos');

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'images', // Compatibilidad con versiones
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                await this.processSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('❌ Error al abrir cámara:', error);
            Alert.alert('Error', 'No se pudo abrir la cámara');
        }
    }

    // Abrir galería para seleccionar imagen
    async openImagePicker() {
        console.log('🖼️ Intentando abrir galería...');
        const hasPermission = await this.requestImagePickerPermissions();
        if (!hasPermission) {
            console.log('❌ Sin permisos de galería');
            return;
        }
        console.log('✅ Permisos de galería obtenidos');

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'images', // Compatibilidad con versiones
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                await this.processSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('❌ Error al abrir galería:', error);
            Alert.alert('Error', 'No se pudo abrir la galería');
        }
    }

    // Procesar imagen seleccionada (redimensionar y comprimir)
    async processSelectedImage(imageUri) {
        try {
            if (this.onUploadStart) this.onUploadStart();
            console.log('🖼️ Procesando imagen seleccionada:', imageUri);

            // Redimensionar y comprimir la imagen
            const manipulatedImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [
                    { resize: { width: 400, height: 400 } }, // Redimensionar a 400x400
                ],
                {
                    compress: 0.7, // Comprimir al 70% para archivos más pequeños
                    format: ImageManipulator.SaveFormat.JPEG,
                }
            );

            console.log('✅ Imagen procesada:', manipulatedImage.uri);
            console.log('📏 Tamaño de imagen procesada:', manipulatedImage.width, 'x', manipulatedImage.height);

            // Actualizar el estado con la imagen local
            if (this.onImageUpdate) this.onImageUpdate(manipulatedImage.uri);

            // Subir imagen al servidor
            await this.uploadProfileImage(manipulatedImage.uri);

        } catch (error) {
            console.error('❌ Error procesando imagen:', error);
            Alert.alert('Error', 'No se pudo procesar la imagen');
            // Revertir la imagen en caso de error
            if (this.onImageUpdate) this.onImageUpdate(null);
        } finally {
            if (this.onUploadEnd) this.onUploadEnd();
        }
    }

    // Subir imagen de perfil al servidor
    async uploadProfileImage(imageUri) {
        try {
            console.log('📤 Subiendo imagen de perfil...');
            console.log('📁 URI de imagen:', imageUri);

            // Crear FormData con configuración específica para React Native
            const formData = new FormData();

            // Obtener información del archivo
            const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
            const fileName = `profile_${Date.now()}.${fileExtension}`;

            console.log('📋 Detalles del archivo:', { fileName, mimeType, fileExtension });

            // Agregar archivo al FormData con configuración explícita
            formData.append('file', {
                uri: imageUri,
                type: mimeType,
                name: fileName,
            });

            console.log('📦 FormData preparado, iniciando upload...');

            // 1. Subir imagen a S3
            const uploadResult = await apiService.uploadProfileImage(formData);
            console.log('📁 Imagen subida a S3:', uploadResult);

            // 2. Actualizar perfil del usuario con la imagen
            const profileResult = await apiService.updateProfileImage({
                s3_key: uploadResult.s3_key,
                public_url: uploadResult.public_url
            });

            console.log('👤 Perfil actualizado:', profileResult);

            // 3. Actualizar imagen en la UI con la URL pública
            if (this.onImageUpdate) {
                this.onImageUpdate(uploadResult.public_url);
            }

            // 4. Notificar éxito para recargar perfil completo
            if (this.onImageUploadSuccess) {
                this.onImageUploadSuccess();
            }

            Alert.alert('Éxito', 'Imagen de perfil actualizada correctamente');
            return uploadResult;

        } catch (error) {
            console.error('❌ Error subiendo imagen:', error);
            Alert.alert(
                'Error',
                error.message || 'No se pudo subir la imagen de perfil'
            );
            throw error; // Re-throw para que processSelectedImage pueda manejar el error
        }
    }

    // Eliminar imagen de perfil actual
    async deleteCurrentProfileImage(s3Key) {
        try {
            if (!s3Key) {
                console.log('⚠️ No hay imagen de perfil para eliminar');
                return;
            }

            console.log('🗑️ Eliminando imagen de perfil actual...');

            if (this.onUploadStart) this.onUploadStart();

            // Usar el nuevo endpoint que elimina de S3 y actualiza la BD automáticamente
            await apiService.deleteCompleteProfileImage();
            console.log('✅ Imagen de perfil eliminada completamente');

            // Limpiar imagen en la UI
            if (this.onImageUpdate) {
                this.onImageUpdate(null);
            }

            // Notificar éxito para recargar perfil completo
            if (this.onImageUploadSuccess) {
                this.onImageUploadSuccess();
            }

            Alert.alert('Éxito', 'Imagen de perfil eliminada correctamente');

        } catch (error) {
            console.error('❌ Error eliminando imagen:', error);
            Alert.alert('Error', 'No se pudo eliminar la imagen de perfil');
        } finally {
            if (this.onUploadEnd) this.onUploadEnd();
        }
    }

    // Mostrar opciones avanzadas (incluye eliminar si tiene imagen)
    showImagePickerOptionsWithDelete(hasCurrentImage = false, currentS3Key = null) {
        console.log('🎛️ Mostrando opciones de imagen:', { hasCurrentImage, currentS3Key });
        const options = ['Cancelar', 'Tomar foto', 'Elegir de galería'];
        const actions = [
            null, // Cancelar
            () => {
                console.log('🎬 Usuario seleccionó: Tomar foto');
                this.openCamera();
            },
            () => {
                console.log('🖼️ Usuario seleccionó: Elegir de galería');
                this.openImagePicker();
            }
        ];

        if (hasCurrentImage) {
            options.push('Eliminar imagen actual');
            actions.push(() => {
                console.log('🗑️ Usuario seleccionó: Eliminar imagen actual');
                this.deleteCurrentProfileImage(currentS3Key);
            });
        }

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: 0,
                    destructiveButtonIndex: hasCurrentImage ? options.length - 1 : undefined,
                },
                (buttonIndex) => {
                    if (buttonIndex > 0 && actions[buttonIndex]) {
                        actions[buttonIndex]();
                    }
                }
            );
        } else {
            const alertOptions = [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Tomar foto', onPress: actions[1] },
                { text: 'Elegir de galería', onPress: actions[2] },
            ];

            if (hasCurrentImage) {
                alertOptions.push({
                    text: 'Eliminar imagen actual',
                    style: 'destructive',
                    onPress: actions[3]
                });
            }

            Alert.alert('Imagen de perfil', 'Elige una opción', alertOptions);
        }
    }
}

// Exportar instancia singleton
export const profileImageHandler = new ProfileImageHandler();