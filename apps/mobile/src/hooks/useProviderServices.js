import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getProviderServices,
    markProviderServiceOnRoute,
    markProviderServiceInProgress,
    markProviderServiceCompleted,
} from '../services/providers.service';

export const providerServicesKeys = {
    all: ['provider', 'services'],
};

export function useProviderServices(options = {}) {
    return useQuery({
        queryKey: providerServicesKeys.all,
        queryFn: getProviderServices,
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
            queryClient.invalidateQueries({ queryKey: providerServicesKeys.all });
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
            queryClient.invalidateQueries({ queryKey: providerServicesKeys.all });
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
            queryClient.invalidateQueries({ queryKey: providerServicesKeys.all });
            if (typeof onSuccess === 'function') {
                onSuccess(data, variables, context);
            }
        },
        ...mutationOptions,
    });
}
