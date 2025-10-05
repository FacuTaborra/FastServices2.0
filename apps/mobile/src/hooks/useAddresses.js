/**
 * useAddresses Hook - Manejo de direcciones con React Query
 * Provee hooks para operaciones CRUD de direcciones
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as addressService from '../services/addresses.service';

// Query Keys
export const addressKeys = {
  all: ['addresses'],
  myAddresses: (includeInactive = false) => ['addresses', 'my', { includeInactive }],
  defaultAddress: ['addresses', 'default'],
  address: (id) => ['addresses', id],
};

/**
 * Hook para obtener todas las direcciones del usuario
 */
export function useMyAddresses(includeInactive = false) {
  return useQuery({
    queryKey: addressKeys.myAddresses(includeInactive),
    queryFn: () => addressService.getMyAddresses(includeInactive),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener la dirección por defecto
 */
export function useDefaultAddress() {
  return useQuery({
    queryKey: addressKeys.defaultAddress,
    queryFn: addressService.getDefaultAddress,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error) => {
      // No reintentar si no hay dirección por defecto (404)
      if (error?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook para crear una nueva dirección
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressService.createAddress,
    onSuccess: (newAddress) => {
      console.log('✅ Dirección creada exitosamente');

      // Invalidar la lista de direcciones para refrescar
      queryClient.invalidateQueries({ queryKey: addressKeys.all });

      // Si es la primera dirección, podría convertirse en la por defecto
      if (newAddress.is_default) {
        queryClient.setQueryData(addressKeys.defaultAddress, newAddress);
      }
    },
    onError: (error) => {
      console.error('❌ Error creando dirección:', error.message);
    },
  });
}

/**
 * Hook para actualizar una dirección
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ addressId, addressData }) =>
      addressService.updateAddress(addressId, addressData),
    onSuccess: (updatedAddress, { addressId }) => {
      console.log('✅ Dirección actualizada exitosamente');

      // Actualizar la dirección específica en la caché
      queryClient.setQueryData(addressKeys.address(addressId), updatedAddress);

      // Invalidar la lista de direcciones
      queryClient.invalidateQueries({ queryKey: addressKeys.all });

      // Si se actualizó la dirección por defecto
      if (updatedAddress.is_default) {
        queryClient.setQueryData(addressKeys.defaultAddress, updatedAddress);
      }
    },
    onError: (error) => {
      console.error('❌ Error actualizando dirección:', error.message);
    },
  });
}

/**
 * Hook para establecer una dirección como por defecto
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressService.setDefaultAddress,
    onSuccess: (updatedAddress) => {
      console.log('✅ Dirección por defecto establecida');

      // Actualizar la dirección por defecto en la caché
      queryClient.setQueryData(addressKeys.defaultAddress, updatedAddress);

      // Invalidar todas las direcciones para reflejar el cambio
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
    onError: (error) => {
      console.error('❌ Error estableciendo dirección por defecto:', error.message);
    },
  });
}

/**
 * Hook para eliminar una dirección
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressService.deleteAddress,
    onSuccess: (_, addressId) => {
      console.log('✅ Dirección eliminada exitosamente');

      // Remover la dirección de la caché
      queryClient.removeQueries({ queryKey: addressKeys.address(addressId) });

      // Invalidar la lista de direcciones
      queryClient.invalidateQueries({ queryKey: addressKeys.all });

      // Si era la dirección por defecto, invalidar esa query también
      queryClient.invalidateQueries({ queryKey: addressKeys.defaultAddress });
    },
    onError: (error) => {
      console.error('❌ Error eliminando dirección:', error.message);
    },
  });
}

/**
 * Hook combinado para manejo completo de direcciones
 */
export function useAddresses(includeInactive = false) {
  const myAddressesQuery = useMyAddresses(includeInactive);
  const defaultAddressQuery = useDefaultAddress();
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const setDefaultMutation = useSetDefaultAddress();
  const deleteMutation = useDeleteAddress();

  return {
    // Estado de las direcciones
    addresses: myAddressesQuery.data || [],
    defaultAddress: defaultAddressQuery.data,
    isLoading: myAddressesQuery.isLoading || defaultAddressQuery.isLoading,
    isError: myAddressesQuery.isError || defaultAddressQuery.isError,
    error: myAddressesQuery.error || defaultAddressQuery.error,

    // Acciones
    createAddress: createMutation.mutate,
    updateAddress: updateMutation.mutate,
    setDefaultAddress: setDefaultMutation.mutate,
    deleteAddress: deleteMutation.mutate,

    // Estados de las mutaciones
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSettingDefault: setDefaultMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Errores de las mutaciones
    createError: createMutation.error,
    updateError: updateMutation.error,
    setDefaultError: setDefaultMutation.error,
    deleteError: deleteMutation.error,

    // Éxito de las mutaciones
    isCreated: createMutation.isSuccess,
    isUpdated: updateMutation.isSuccess,
    isDefaultSet: setDefaultMutation.isSuccess,
    isDeleted: deleteMutation.isSuccess,

    // Refetch manual
    refetch: () => {
      myAddressesQuery.refetch();
      defaultAddressQuery.refetch();
    },

    // Reset de estados de mutaciones
    resetCreate: createMutation.reset,
    resetUpdate: updateMutation.reset,
    resetSetDefault: setDefaultMutation.reset,
    resetDelete: deleteMutation.reset,
  };
}
