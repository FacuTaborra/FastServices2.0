import { useQuery } from '@tanstack/react-query';
import { getProviderOverviewStats, getProviderRevenueStats, getProviderRatingDistribution, getProviderCurrencies } from '../services/providers.service';

export const providerStatsKeys = {
    overview: (currency) => ['provider', 'stats', 'overview', currency],
    revenue: (months, currency) => ['provider', 'stats', 'revenue', months, currency],
    rating: (months) => ['provider', 'stats', 'ratings', months],
    currencies: ['provider', 'currencies'],
};

export function useProviderOverviewStats(currency, options = {}) {
    return useQuery({
        queryKey: providerStatsKeys.overview(currency),
        queryFn: () => getProviderOverviewStats(currency),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        ...options,
    });
}

export function useProviderRevenueStats(months = 6, currency, options = {}) {
    return useQuery({
        queryKey: providerStatsKeys.revenue(months, currency),
        queryFn: () => getProviderRevenueStats(months, currency),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        keepPreviousData: true,
        ...options,
    });
}

export function useProviderRatingDistribution(months = 6, options = {}) {
    return useQuery({
        queryKey: providerStatsKeys.rating(months),
        queryFn: () => getProviderRatingDistribution(months),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        keepPreviousData: true,
        ...options,
    });
}

export function useProviderCurrencies(options = {}) {
    return useQuery({
        queryKey: providerStatsKeys.currencies,
        queryFn: getProviderCurrencies,
        staleTime: 24 * 60 * 60 * 1000, // Monedas no cambian seguido
        ...options,
    });
}
