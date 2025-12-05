import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getProviderServices,
    markProviderServiceOnRoute,
    markProviderServiceInProgress,
    markProviderServiceCompleted,
} from '../services/providers.service';

export const providerServicesKeys = {
    active: ['provider', 'services', 'active'],
    completed: (date) => ['provider', 'services', 'completed', date],
    all: ['provider', 'services'],
};

// Hook para servicios activos (CONFIRMED, ON_ROUTE, IN_PROGRESS)
export function useProviderActiveServices(options = {}) {
    return useQuery({
        queryKey: providerServicesKeys.active,
        queryFn: () => getProviderServices({ filterType: 'active' }),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        ...options,
    });
}

// Hook para servicios completados (filtrados por fecha)
export function useProviderCompletedServices(completedDate, options = {}) {
    return useQuery({
        queryKey: providerServicesKeys.completed(completedDate),
        queryFn: () => getProviderServices({ filterType: 'completed', completedDate }),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        ...options,
    });
}

// Hook legacy para compatibilidad (trae todos)
export function useProviderServices(completedDate = null, options = {}) {
    const queryKey = completedDate
        ? ['provider', 'services', 'all', completedDate]
        : providerServicesKeys.all;

    return useQuery({
        queryKey,
        queryFn: () => getProviderServices({ filterType: 'all', completedDate }),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        ...options,
    });
}

export function useMarkProviderServiceOnRoute(options = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...mutationOptions } = options;

    return useMutation({
        mutationFn: ({ serviceId }) => markProviderServiceOnRoute(serviceId),
        onSuccess: (data, variables, context) => {
            // Invalidar todas las queries de servicios del proveedor
            queryClient.invalidateQueries({ queryKey: ['provider', 'services'] });
            if (typeof onSuccess === 'function') {
                onSuccess(data, variables, context);
            }
        },
        ...mutationOptions,
    });
}

export function useMarkProviderServiceInProgress(options = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...mutationOptions } = options;

    return useMutation({
        mutationFn: ({ serviceId }) => markProviderServiceInProgress(serviceId),
        onSuccess: (data, variables, context) => {
            // Invalidar todas las queries de servicios del proveedor
            queryClient.invalidateQueries({ queryKey: ['provider', 'services'] });
            if (typeof onSuccess === 'function') {
                onSuccess(data, variables, context);
            }
        },
        ...mutationOptions,
    });
}

export function useMarkProviderServiceCompleted(options = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, ...mutationOptions } = options;

    return useMutation({
        mutationFn: ({ serviceId }) => markProviderServiceCompleted(serviceId),
        onSuccess: (data, variables, context) => {
            // Invalidar todas las queries de servicios del proveedor
            queryClient.invalidateQueries({ queryKey: ['provider', 'services'] });
            if (typeof onSuccess === 'function') {
                onSuccess(data, variables, context);
            }
        },
        ...mutationOptions,
    });
}
