/**
 * QueryProvider - Configuración de React Query
 * Provee el contexto de React Query para toda la aplicación
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configuración del cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos" (no se vuelven a solicitar)
      staleTime: 5 * 60 * 1000, // 5 minutos

      // Tiempo que los datos permanecen en caché después de que no se usan
      gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)

      // Reintentar en caso de error
      retry: (failureCount, error) => {
        // No reintentar si es error de autenticación
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Reintentar hasta 3 veces para otros errores
        return failureCount < 3;
      },

      // Delay entre reintentos (exponencial backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch en focus de la ventana (útil en desarrollo)
      refetchOnWindowFocus: false,

      // Refetch al reconectarse a internet
      refetchOnReconnect: true,

      // Refetch automático al montar componente
      refetchOnMount: true,
    },
    mutations: {
      // Reintentar mutaciones fallidas
      retry: (failureCount, error) => {
        // No reintentar si es error de validación o autenticación
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Reintentar hasta 2 veces para errores de servidor
        return failureCount < 2;
      },

      // Delay entre reintentos para mutaciones
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

/**
 * Provider que envuelve la aplicación con React Query
 */
export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Exportar también el cliente para uso avanzado si se necesita
export { queryClient };

export default QueryProvider;