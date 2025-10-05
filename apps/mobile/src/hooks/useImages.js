/**
 * useImages Hook - Manejo de imágenes con React Query
 * Provee hooks para subida y gestión de imágenes
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as imageService from '../services/images.service';
import * as userService from '../services/users.service';
import { authKeys } from './useAuth';

// Query Keys
export const imageKeys = {
  all: ['images'],
  profile: ['images', 'profile'],
  upload: ['images', 'upload'],
};

/**
 * Hook para subir imagen de perfil
 */
export function useUploadProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: imageService.uploadProfileImage,
    onSuccess: (uploadResult) => {
      console.log('✅ Imagen subida a S3 exitosamente:', uploadResult.s3_key);

      // Invalidar queries de imágenes
      queryClient.invalidateQueries({ queryKey: imageKeys.all });

      // La imagen está subida pero aún no actualizada en el perfil
      // El componente deberá llamar a updateProfileImage después

      return uploadResult;
    },
    onError: (error) => {
      console.error('❌ Error subiendo imagen:', error.message);
    },
  });
}

/**
 * Hook para actualizar perfil con imagen (después de subirla)
 */
export function useUpdateProfileImageData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updateProfileImage,
    onSuccess: (updatedUser) => {
      console.log('✅ Perfil actualizado con imagen');

      // Actualizar datos del usuario en la caché
      queryClient.setQueryData(authKeys.currentUser, updatedUser);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: imageKeys.all });
    },
    onError: (error) => {
      console.error('❌ Error actualizando perfil con imagen:', error.message);
    },
  });
}

/**
 * Hook para eliminar imagen de perfil (solo de S3)
 */
export function useDeleteProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: imageService.deleteProfileImage,
    onSuccess: () => {
      console.log('✅ Imagen eliminada de S3');

      // Invalidar queries de imágenes
      queryClient.invalidateQueries({ queryKey: imageKeys.all });
    },
    onError: (error) => {
      console.error('❌ Error eliminando imagen de S3:', error.message);
    },
  });
}

/**
 * Hook para eliminar completamente la imagen de perfil (S3 + BD)
 */
export function useDeleteCompleteProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: imageService.deleteCompleteProfileImage,
    onSuccess: (updatedUser) => {
      console.log('✅ Imagen de perfil eliminada completamente');

      // Actualizar datos del usuario en la caché
      queryClient.setQueryData(authKeys.currentUser, updatedUser);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: imageKeys.all });
    },
    onError: (error) => {
      console.error('❌ Error eliminando imagen completamente:', error.message);
    },
  });
}

/**
 * Hook para subida completa de imagen (subir + actualizar perfil en un solo paso)
 */
export function useCompleteImageUpload() {
  const queryClient = useQueryClient();
  const uploadMutation = useUploadProfileImage();
  const updateMutation = useUpdateProfileImageData();

  return useMutation({
    mutationFn: async (formData) => {
      try {
        // 1. Subir imagen a S3
        console.log('📤 Paso 1: Subiendo imagen a S3...');
        const uploadResult = await imageService.uploadProfileImage(formData);

        // 2. Actualizar perfil con datos de la imagen
        console.log('🔄 Paso 2: Actualizando perfil con datos de imagen...');
        const updatedUser = await userService.updateProfileImage({
          s3_key: uploadResult.s3_key,
          public_url: uploadResult.public_url,
        });

        console.log('✅ Proceso completo de imagen exitoso');
        return updatedUser;
      } catch (error) {
        console.error('❌ Error en proceso completo de imagen:', error.message);
        throw error;
      }
    },
    onSuccess: (updatedUser) => {
      // Actualizar datos del usuario en la caché
      queryClient.setQueryData(authKeys.currentUser, updatedUser);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: imageKeys.all });
    },
    onError: (error) => {
      console.error('❌ Error en subida completa de imagen:', error.message);
    },
  });
}

/**
 * Hook combinado para manejo completo de imágenes
 */
export function useImages() {
  const uploadMutation = useUploadProfileImage();
  const updateImageDataMutation = useUpdateProfileImageData();
  const deleteImageMutation = useDeleteProfileImage();
  const deleteCompleteMutation = useDeleteCompleteProfileImage();
  const completeUploadMutation = useCompleteImageUpload();

  return {
    // Acciones básicas
    uploadToS3: uploadMutation.mutate,
    updateProfileImageData: updateImageDataMutation.mutate,
    deleteFromS3: deleteImageMutation.mutate,
    deleteCompletely: deleteCompleteMutation.mutate,

    // Acción completa (recomendada)
    uploadComplete: completeUploadMutation.mutate,

    // Estados de las mutaciones
    isUploading: uploadMutation.isPending,
    isUpdatingImageData: updateImageDataMutation.isPending,
    isDeletingFromS3: deleteImageMutation.isPending,
    isDeletingCompletely: deleteCompleteMutation.isPending,
    isUploadingComplete: completeUploadMutation.isPending,

    // Errores
    uploadError: uploadMutation.error,
    updateImageDataError: updateImageDataMutation.error,
    deleteImageError: deleteImageMutation.error,
    deleteCompleteError: deleteCompleteMutation.error,
    completeUploadError: completeUploadMutation.error,

    // Éxito
    isUploaded: uploadMutation.isSuccess,
    isImageDataUpdated: updateImageDataMutation.isSuccess,
    isDeletedFromS3: deleteImageMutation.isSuccess,
    isDeletedCompletely: deleteCompleteMutation.isSuccess,
    isUploadedCompletely: completeUploadMutation.isSuccess,

    // Reset de estados
    resetUpload: uploadMutation.reset,
    resetUpdateImageData: updateImageDataMutation.reset,
    resetDeleteImage: deleteImageMutation.reset,
    resetDeleteComplete: deleteCompleteMutation.reset,
    resetCompleteUpload: completeUploadMutation.reset,
  };
}
