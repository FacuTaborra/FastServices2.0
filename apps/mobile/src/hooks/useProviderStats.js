import { useQuery } from '@tanstack/react-query';
import { getProviderOverviewStats, getProviderRevenueStats } from '../services/providers.service';

export const providerStatsKeys = {
    overview: ['provider', 'stats', 'overview'],
    revenue: (months) => ['provider', 'stats', 'revenue', months],
};

export function useProviderOverviewStats(options = {}) {
    return useQuery({
        queryKey: providerStatsKeys.overview,
        queryFn: getProviderOverviewStats,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        ...options,
    });
}

export function useProviderRevenueStats(months = 6, options = {}) {
    return useQuery({
        queryKey: providerStatsKeys.revenue(months),
        queryFn: () => getProviderRevenueStats(months),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        keepPreviousData: true,
        ...options,
    });
}
