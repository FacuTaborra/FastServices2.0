/**
 * useAuth Hook - Manejo de autenticación con React Query
 * Provee hooks para login, logout, registro y estado de autenticación
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authService from '../services/auth.service';
import * as userService from '../services/users.service';

// Query Keys
export const authKeys = {
  currentUser: ['auth', 'currentUser'],
  isAuthenticated: ['auth', 'isAuthenticated'],
};

/**
 * Hook para obtener el usuario actual
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: userService.getCurrentUser,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: (failureCount, error) => {
      // No reintentar si no está autenticado
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook para verificar si está autenticado
 */
export function useIsAuthenticated() {
  return useQuery({
    queryKey: authKeys.isAuthenticated,
    queryFn: authService.isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para login
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
    onSuccess: (data) => {
      console.log('✅ Login exitoso, actualizando caché...');

      // Invalidar queries relacionadas con autenticación
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      queryClient.invalidateQueries({ queryKey: authKeys.isAuthenticated });

      // Precargar datos del usuario
      queryClient.prefetchQuery({
        queryKey: authKeys.currentUser,
        queryFn: userService.getCurrentUser,
      });
    },
    onError: (error) => {
      console.error('❌ Error en login:', error.message);

      // Limpiar datos de autenticación en caso de error
      queryClient.setQueryData(authKeys.isAuthenticated, false);
      queryClient.removeQueries({ queryKey: authKeys.currentUser });
    },
  });
}

/**
 * Hook para logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      console.log('✅ Logout exitoso, limpiando caché...');

      // Limpiar todas las queries
      queryClient.clear();

      // Establecer estado de autenticación como false
      queryClient.setQueryData(authKeys.isAuthenticated, false);
    },
    onError: (error) => {
      console.error('❌ Error en logout:', error.message);

      // Limpiar caché aunque haya error
      queryClient.clear();
      queryClient.setQueryData(authKeys.isAuthenticated, false);
    },
  });
}

/**
 * Hook para registro de cliente
 */
export function useRegisterClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.registerClient,
    onSuccess: (data) => {
      console.log('✅ Registro de cliente exitoso');

      // Opcional: auto-login después del registro
      // queryClient.invalidateQueries({ queryKey: authKeys.isAuthenticated });
    },
    onError: (error) => {
      console.error('❌ Error en registro de cliente:', error.message);
    },
  });
}

/**
 * Hook para registro de proveedor
 */
export function useRegisterProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.registerProvider,
    onSuccess: (data) => {
      console.log('✅ Registro de proveedor exitoso');

      // Opcional: auto-login después del registro
      // queryClient.invalidateQueries({ queryKey: authKeys.isAuthenticated });
    },
    onError: (error) => {
      console.error('❌ Error en registro de proveedor:', error.message);
    },
  });
}

/**
 * Hook para verificar autenticación y obtener datos del usuario
 */
export function useAuthCheck() {
  return useQuery({
    queryKey: ['auth', 'check'],
    queryFn: authService.checkAuthAndGetUser,
    staleTime: 30 * 1000, // 30 segundos
    retry: false, // No reintentar
  });
}

/**
 * Hook combinado para estado de autenticación completo
 */
export function useAuth() {
  const currentUserQuery = useCurrentUser();
  const isAuthenticatedQuery = useIsAuthenticated();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  return {
    // Estado
    user: currentUserQuery.data,
    isAuthenticated: isAuthenticatedQuery.data ?? false,
    isLoading: currentUserQuery.isLoading || isAuthenticatedQuery.isLoading,
    isError: currentUserQuery.isError || isAuthenticatedQuery.isError,
    error: currentUserQuery.error || isAuthenticatedQuery.error,

    // Acciones
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,

    // Estados de las mutaciones
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,

    // Refetch manual
    refetch: () => {
      currentUserQuery.refetch();
      isAuthenticatedQuery.refetch();
    },
  };
}
