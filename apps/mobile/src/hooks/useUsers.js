/**
 * useUsers Hook - Manejo de usuarios con React Query
 * Provee hooks para operaciones CRUD de usuarios y perfiles
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as userService from '../services/users.service';
import { authKeys } from './useAuth';

// Query Keys
export const userKeys = {
  profile: ['users', 'profile'],
  me: authKeys.currentUser, // Reutilizar la misma key que auth
};

/**
 * Hook para obtener el perfil del usuario actual
 * (Alias de useCurrentUser de useAuth)
 */
export function useUserProfile() {
  return useQuery({
    queryKey: userKeys.profile,
    queryFn: userService.getCurrentUser,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para actualizar el perfil del usuario
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updateUserProfile,
    onSuccess: (updatedUser) => {
      console.log('✅ Perfil actualizado exitosamente');

      // Actualizar la caché con los nuevos datos
      queryClient.setQueryData(userKeys.me, updatedUser);
      queryClient.setQueryData(userKeys.profile, updatedUser);

      // Invalidar queries relacionadas para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('❌ Error actualizando perfil:', error.message);
    },
  });
}

/**
 * Hook para actualizar imagen de perfil
 */
export function useUpdateProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updateProfileImage,
    onSuccess: (updatedUser) => {
      console.log('✅ Imagen de perfil actualizada exitosamente');

      // Actualizar la caché con los nuevos datos
      queryClient.setQueryData(userKeys.me, updatedUser);
      queryClient.setQueryData(userKeys.profile, updatedUser);

      // Invalidar queries de imágenes también
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error) => {
      console.error('❌ Error actualizando imagen de perfil:', error.message);
    },
  });
}

/**
 * Hook para eliminar imagen de perfil
 */
export function useDeleteProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.deleteCompleteProfileImage,
    onSuccess: (updatedUser) => {
      console.log('✅ Imagen de perfil eliminada exitosamente');

      // Actualizar la caché con los nuevos datos
      queryClient.setQueryData(userKeys.me, updatedUser);
      queryClient.setQueryData(userKeys.profile, updatedUser);

      // Invalidar queries de imágenes también
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error) => {
      console.error('❌ Error eliminando imagen de perfil:', error.message);
    },
  });
}

/**
 * Hook combinado para manejo completo del usuario
 */
export function useUsers() {
  const profileQuery = useUserProfile();
  const updateProfileMutation = useUpdateUserProfile();
  const updateImageMutation = useUpdateProfileImage();
  const deleteImageMutation = useDeleteProfileImage();

  return {
    // Estado del perfil
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,

    // Acciones
    updateProfile: updateProfileMutation.mutate,
    updateProfileImage: updateImageMutation.mutate,
    deleteProfileImage: deleteImageMutation.mutate,

    // Estados de las mutaciones
    isUpdatingProfile: updateProfileMutation.isPending,
    isUpdatingImage: updateImageMutation.isPending,
    isDeletingImage: deleteImageMutation.isPending,

    // Errores de las mutaciones
    updateProfileError: updateProfileMutation.error,
    updateImageError: updateImageMutation.error,
    deleteImageError: deleteImageMutation.error,

    // Éxito de las mutaciones
    isProfileUpdated: updateProfileMutation.isSuccess,
    isImageUpdated: updateImageMutation.isSuccess,
    isImageDeleted: deleteImageMutation.isSuccess,

    // Refetch manual
    refetch: profileQuery.refetch,

    // Reset de estados de mutaciones
    resetUpdateProfile: updateProfileMutation.reset,
    resetUpdateImage: updateImageMutation.reset,
    resetDeleteImage: deleteImageMutation.reset,
  };
}
