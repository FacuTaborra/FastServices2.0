/**
 * useServiceRequests Hook - Manejo de solicitudes de servicio con React Query
 * Expone mutaciones y consultas relacionadas con service requests.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as serviceRequestService from '../services/serviceRequests.service';

// Query keys reutilizables para futuras consultas
export const serviceRequestKeys = {
    all: ['service-requests'],
    detail: (id) => ['service-requests', id],
    active: ['service-requests', 'active'],
};

/**
 * Hook para crear una solicitud de servicio
 */
export function useCreateServiceRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: serviceRequestService.createServiceRequest,
        onSuccess: (createdRequest) => {
            console.log('✅ useCreateServiceRequest éxito:', createdRequest?.id);
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.all });
        },
        onError: (error) => {
            console.error('❌ useCreateServiceRequest error:', error?.message);
        },
    });
}

export function useActiveServiceRequests(options = {}) {
    return useQuery({
        queryKey: serviceRequestKeys.active,
        queryFn: serviceRequestService.getActiveServiceRequests,
        staleTime: 1000 * 30,
        refetchOnWindowFocus: false,
        ...options,
    });
}

export function useUpdateServiceRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, data }) =>
            serviceRequestService.updateServiceRequest(requestId, data),
        onSuccess: (updatedRequest) => {
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.active });
            if (updatedRequest?.id) {
                queryClient.invalidateQueries({
                    queryKey: serviceRequestKeys.detail(updatedRequest.id),
                });
            }
        },
    });
}

export default {
    useCreateServiceRequest,
    useActiveServiceRequests,
    useUpdateServiceRequest,
};
