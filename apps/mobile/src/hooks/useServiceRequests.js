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
    history: ['service-requests', 'history'],
    payments: ['service-requests', 'payments'],
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

export function useAllServiceRequests(options = {}) {
    return useQuery({
        queryKey: serviceRequestKeys.history,
        queryFn: serviceRequestService.getAllServiceRequests,
        staleTime: 1000 * 30,
        refetchOnWindowFocus: false,
        ...options,
    });
}

export function useServiceRequest(requestId, options = {}) {
    return useQuery({
        queryKey: serviceRequestKeys.detail(requestId),
        queryFn: () => serviceRequestService.getServiceRequest(requestId),
        enabled: Boolean(requestId),
        staleTime: 1000 * 15,
        refetchOnWindowFocus: false,
        refetchInterval: 1000 * 15,
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
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.history });
            if (updatedRequest?.id) {
                queryClient.invalidateQueries({
                    queryKey: serviceRequestKeys.detail(updatedRequest.id),
                });
            }
        },
    });
}

export function useCancelServiceRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId }) =>
            serviceRequestService.cancelRequest(requestId),
        onSuccess: (updatedRequest) => {
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.active });
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.history });
            if (updatedRequest?.id) {
                queryClient.invalidateQueries({
                    queryKey: serviceRequestKeys.detail(updatedRequest.id),
                });
            }
        },
    });
}

export function useConfirmServicePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, proposalId, paymentReference }) =>
            serviceRequestService.confirmPayment(requestId, {
                proposal_id: proposalId,
                payment_reference: paymentReference,
            }),
        onSuccess: (updatedRequest) => {
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.active });
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.history });
            if (updatedRequest?.id) {
                queryClient.invalidateQueries({
                    queryKey: serviceRequestKeys.detail(updatedRequest.id),
                });
            }
        },
    });
}

export function useCancelService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, reason }) =>
            serviceRequestService.cancelService(requestId, reason ? { reason } : {}),
        onSuccess: (updatedRequest) => {
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.active });
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.history });
            if (updatedRequest?.id) {
                queryClient.invalidateQueries({
                    queryKey: serviceRequestKeys.detail(updatedRequest.id),
                });
            }
        },
    });
}

export function useMarkServiceInProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId }) =>
            serviceRequestService.markServiceInProgress(requestId),
        onSuccess: (updatedRequest) => {
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.active });
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.history });
            if (updatedRequest?.id) {
                queryClient.invalidateQueries({
                    queryKey: serviceRequestKeys.detail(updatedRequest.id),
                });
            }
        },
    });
}

export function useSubmitServiceReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, rating, comment }) =>
            serviceRequestService.submitServiceReview(requestId, {
                rating,
                comment,
            }),
        onSuccess: (updatedRequest) => {
            if (updatedRequest?.id) {
                queryClient.setQueryData(
                    serviceRequestKeys.detail(updatedRequest.id),
                    updatedRequest,
                );
            }
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.history });
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.active });
        },
    });
}

export function usePaymentHistory(options = {}) {
    return useQuery({
        queryKey: serviceRequestKeys.payments,
        queryFn: serviceRequestService.getPaymentHistory,
        staleTime: 1000 * 60 * 5, // 5 minutos
        refetchOnWindowFocus: false,
        ...options,
    });
}

/**
 * Hook para crear una solicitud de recontratación
 */
export function useCreateRehireRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: serviceRequestService.createRehireRequest,
        onSuccess: (createdRequest) => {
            console.log('✅ useCreateRehireRequest éxito:', createdRequest?.id);
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.all });
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.active });
            queryClient.invalidateQueries({ queryKey: serviceRequestKeys.history });
        },
        onError: (error) => {
            console.error('❌ useCreateRehireRequest error:', error?.message);
        },
    });
}

export default {
    useCreateServiceRequest,
    useActiveServiceRequests,
    useServiceRequest,
    useUpdateServiceRequest,
    useCancelServiceRequest,
    useAllServiceRequests,
    useConfirmServicePayment,
    useCancelService,
    useMarkServiceInProgress,
    useSubmitServiceReview,
    usePaymentHistory,
    useCreateRehireRequest,
};
