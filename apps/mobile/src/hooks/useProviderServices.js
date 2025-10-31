import { useQuery } from '@tanstack/react-query';
import { getProviderServices } from '../services/providers.service';

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
