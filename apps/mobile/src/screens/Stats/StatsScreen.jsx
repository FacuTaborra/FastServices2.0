import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProviderOverviewStats, useProviderRevenueStats, useProviderRatingDistribution } from '../../hooks/useProviderStats';
import styles from './StatsScreen.styles';

const toNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const RANGE_MONTH_OPTIONS = [3, 6, 12];
const RATING_COLORS = {
  5: '#15803d',
  4: '#22c55e',
  3: '#facc15',
  2: '#f97316',
  1: '#ef4444',
};
const brandIcon = require('../../../assets/icon.png');

const WINDOW_WIDTH = Dimensions.get('window').width;
const OVERVIEW_CARD_WIDTH = Math.max(240, WINDOW_WIDTH - 80);
const OVERVIEW_CARD_GAP = 12;

export default function StatsScreen() {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useProviderOverviewStats();

  const [selectedRange, setSelectedRange] = useState(6);

  const {
    data: revenueData,
    isLoading: revenueLoading,
    isFetching: revenueFetching,
    error: revenueError,
    refetch: refetchRevenue,
  } = useProviderRevenueStats(selectedRange);

  const {
    data: ratingData,
    isLoading: ratingLoading,
    isFetching: ratingFetching,
    error: ratingError,
    refetch: refetchRatings,
  } = useProviderRatingDistribution(selectedRange);

  const handleRefresh = useCallback(() => {
    refetch();
    refetchRevenue();
    refetchRatings();
  }, [refetch, refetchRatings, refetchRevenue]);

  const isRefreshing =
    (isFetching && !isLoading)
    || (revenueFetching && !revenueLoading)
    || (ratingFetching && !ratingLoading);

  const overviewCurrency = typeof data?.currency === 'string' && data.currency
    ? data.currency
    : null;
  const revenueCurrency = typeof revenueData?.currency === 'string' && revenueData.currency
    ? revenueData.currency
    : null;
  const currency = overviewCurrency || revenueCurrency || 'ARS';

  const formatCurrency = useCallback(
    (amount) => {
      const numeric = typeof amount === 'number' ? amount : Number(amount || 0);
      if (!Number.isFinite(numeric)) {
        return `${currency} 0`;
      }
      try {
        return numeric.toLocaleString('es-AR', {
          style: 'currency',
          currency,
          minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2,
        });
      } catch (formatError) {
        return `${currency} ${numeric.toFixed(2)}`;
      }
    },
    [currency],
  );

  const formatMonthLabel = useCallback((value) => {
    if (!value) {
      return '—';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString('es-AR', {
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const revenuePoints = useMemo(
    () => (Array.isArray(revenueData?.points) ? revenueData.points : []),
    [revenueData],
  );

  const ratingPoints = useMemo(
    () => (Array.isArray(ratingData?.points) ? ratingData.points : []),
    [ratingData],
  );

  const hasRatingActivity = useMemo(
    () => ratingPoints.some((point) => Number(point?.total_reviews) > 0),
    [ratingPoints],
  );

  const totalRevenueWindow = useMemo(
    () => revenuePoints.reduce((acc, point) => {
      const value = toNumber(point?.total_revenue);
      return acc + (value !== null ? value : 0);
    }, 0),
    [revenuePoints],
  );

  const totalServicesWindow = useMemo(
    () => revenuePoints.reduce((acc, point) => {
      const count = Number(point?.completed_services) || 0;
      return acc + count;
    }, 0),
    [revenuePoints],
  );

  const maxRevenue = useMemo(
    () => revenuePoints.reduce((highest, point) => {
      const value = toNumber(point?.total_revenue);
      if (value !== null && value > highest) {
        return value;
      }
      return highest;
    }, 0),
    [revenuePoints],
  );

  const aggregatedAvgTicket = totalServicesWindow > 0
    ? totalRevenueWindow / totalServicesWindow
    : null;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingLabel}>Cargando estadísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No pudimos cargar las estadísticas</Text>
          <Text style={styles.errorMessage}>
            Verificá tu conexión e intentá nuevamente.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalServices = toNumber(data?.total_services) ?? 0;
  const completedServices = toNumber(data?.completed_services) ?? 0;
  const totalProposals = toNumber(data?.total_proposals) ?? 0;
  const acceptedProposals = toNumber(data?.accepted_proposals) ?? 0;
  const acceptanceRate = toNumber(data?.acceptance_rate);
  const averageRating = toNumber(data?.average_rating);
  const totalReviews = toNumber(data?.total_reviews) ?? 0;
  const totalRevenue = toNumber(data?.total_revenue) ?? 0;
  const previousRevenue = toNumber(data?.revenue_previous_month) ?? 0;
  const revenueChange = toNumber(data?.revenue_change_percentage);

  const revenueDisplay = formatCurrency(totalRevenue);
  const previousRevenueDisplay = formatCurrency(previousRevenue);
  const acceptanceDisplay = acceptanceRate !== null
    ? `${acceptanceRate.toFixed(1)}%`
    : 'Sin datos';
  const proposalsBreakdown = totalProposals > 0
    ? `${acceptedProposals} de ${totalProposals} propuestas`
    : 'Aún sin propuestas';
  const ratingDisplay = averageRating !== null
    ? `${averageRating.toFixed(2)} / 5`
    : 'Sin calificaciones';
  const reviewsSubtitle = totalReviews === 0
    ? 'Sin reseñas registradas'
    : totalReviews === 1
      ? '1 reseña'
      : `${totalReviews} reseñas`;
  const revenueTrendLabel = revenueChange !== null
    ? `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%`
    : 'Sin datos';
  const revenueTrendStyle = revenueChange === null
    ? styles.trendNeutral
    : revenueChange >= 0
      ? styles.trendPositive
      : styles.trendNegative;

  const overviewMetrics = [
    {
      key: 'services',
      label: 'Servicios atendidos',
      value: totalServices,
      helper: `${completedServices} completados`,
    },
    {
      key: 'acceptance',
      label: 'Tasa de aceptación',
      value: acceptanceDisplay,
      helper: proposalsBreakdown,
    },
    {
      key: 'rating',
      label: 'Calificación promedio',
      value: ratingDisplay,
      helper: reviewsSubtitle,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#6366f1']}
          />
        )}
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image source={brandIcon} style={styles.brandIcon} />
              <View>
                <Text style={styles.brandTitle}>Fast Services</Text>
                <Text style={styles.brandSubtitle}>Estadísticas</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Panorama general</Text>
          {isFetching ? <ActivityIndicator size="small" color="#6366f1" /> : null}
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Facturación acumulada</Text>
          <Text style={styles.kpiValue}>{revenueDisplay}</Text>
          <Text style={[styles.trendText, revenueTrendStyle]}>
            Variación vs. mes anterior: {revenueTrendLabel}
          </Text>
          <Text style={styles.kpiHelper}>Mes anterior: {previousRevenueDisplay}</Text>
        </View>

        <View style={styles.overviewRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={OVERVIEW_CARD_WIDTH + OVERVIEW_CARD_GAP}
            decelerationRate="fast"
            snapToAlignment="start"
            contentContainerStyle={styles.overviewCarouselContent}
          >
            {overviewMetrics.map((metric, index) => (
              <View
                key={metric.key}
                style={[
                  styles.overviewCardWrapper,
                  {
                    width: OVERVIEW_CARD_WIDTH,
                    marginRight:
                      index === overviewMetrics.length - 1 ? 0 : OVERVIEW_CARD_GAP,
                  },
                ]}
              >
                <View style={[styles.kpiCard, styles.kpiCardCompact]}>
                  <Text style={styles.kpiLabel}>{metric.label}</Text>
                  <Text style={styles.kpiValueCompact}>{metric.value}</Text>
                  <Text style={styles.kpiHelper}>{metric.helper}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ingresos y ticket promedio</Text>
          {revenueFetching ? <ActivityIndicator size="small" color="#6366f1" /> : null}
        </View>

        <View style={styles.rangeToggleRow}>
          {RANGE_MONTH_OPTIONS.map((option) => {
            const isActive = option === selectedRange;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.rangeToggleButton,
                  isActive && styles.rangeToggleButtonActive,
                ]}
                onPress={() => setSelectedRange(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.rangeToggleText,
                    isActive && styles.rangeToggleTextActive,
                  ]}
                >
                  {option} meses
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.kpiCard, styles.revenueCard]}>
          {revenueLoading && !revenueData ? (
            <View style={styles.revenueLoading}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.revenueLoadingLabel}>Cargando ingresos...</Text>
            </View>
          ) : revenueError ? (
            <View style={styles.revenueError}>
              <Text style={styles.revenueErrorText}>
                No pudimos cargar los ingresos para este período.
              </Text>
              <TouchableOpacity
                style={styles.retryButtonSecondary}
                onPress={refetchRevenue}
              >
                <Text style={styles.retryButtonSecondaryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : revenuePoints.length === 0 ? (
            <View style={styles.revenueEmpty}>
              <Text style={styles.revenueEmptyText}>
                Aún no registramos servicios completados en este rango.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.kpiLabel}>Total periodo seleccionado</Text>
              <Text style={styles.kpiValue}>{formatCurrency(totalRevenueWindow)}</Text>
              <Text style={styles.kpiHelper}>
                Ticket promedio: {aggregatedAvgTicket !== null
                  ? formatCurrency(aggregatedAvgTicket)
                  : 'Sin datos'} · {totalServicesWindow}{' '}
                {totalServicesWindow === 1 ? 'servicio completado' : 'servicios completados'}
              </Text>
              <View style={styles.revenueDivider} />
              {revenuePoints.map((point) => {
                const revenueValue = toNumber(point?.total_revenue);
                const safeRevenueValue = revenueValue !== null ? revenueValue : 0;
                const avgTicketValue = toNumber(point?.avg_ticket);
                const servicesCount = Number(point?.completed_services) || 0;
                const rawWidth = maxRevenue > 0
                  ? (safeRevenueValue / maxRevenue) * 100
                  : 0;
                const barWidth = safeRevenueValue > 0
                  ? Math.max(12, rawWidth)
                  : 0;

                return (
                  <View key={point.month} style={styles.revenueItem}>
                    <View style={styles.revenueItemHeader}>
                      <Text style={styles.revenueMonth}>{formatMonthLabel(point.month)}</Text>
                      <Text style={styles.revenueAmount}>{formatCurrency(safeRevenueValue)}</Text>
                    </View>
                    <View style={styles.revenueBarTrack}>
                      <View style={[styles.revenueBarFill, { width: `${Math.min(barWidth, 100)}%` }]} />
                    </View>
                    <Text style={styles.revenueTicket}>
                      Ticket promedio: {avgTicketValue !== null
                        ? formatCurrency(avgTicketValue)
                        : 'Sin datos'} · {servicesCount}{' '}
                      {servicesCount === 1 ? 'servicio' : 'servicios'}
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Satisfacción de clientes</Text>
          {ratingFetching ? <ActivityIndicator size="small" color="#6366f1" /> : null}
        </View>

        <View style={[styles.kpiCard, styles.ratingCard]}>
          {ratingLoading && !ratingData ? (
            <View style={styles.ratingLoading}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.ratingLoadingLabel}>Cargando calificaciones...</Text>
            </View>
          ) : ratingError ? (
            <View style={styles.ratingError}>
              <Text style={styles.ratingErrorText}>
                No pudimos cargar la distribución de reseñas para este período.
              </Text>
              <TouchableOpacity
                style={styles.retryButtonSecondary}
                onPress={refetchRatings}
              >
                <Text style={styles.retryButtonSecondaryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : !hasRatingActivity ? (
            <View style={styles.ratingEmpty}>
              <Text style={styles.ratingEmptyText}>
                Aún no registramos reseñas en este rango.
              </Text>
            </View>
          ) : (
            ratingPoints.map((point, index) => {
              const totalReviews = Number(point?.total_reviews) || 0;
              const averageRatingValue = toNumber(point?.average_rating);
              const buckets = Array.isArray(point?.buckets) ? point.buckets : [];
              const orderedBuckets = [5, 4, 3, 2, 1].map((rating) => {
                const match = buckets.find((bucket) => Number(bucket.rating) === rating);
                return {
                  rating,
                  count: match ? Number(match.count) || 0 : 0,
                };
              });
              const segments = orderedBuckets.filter((bucket) => bucket.count > 0);

              return (
                <View
                  key={point.month}
                  style={[
                    styles.ratingItem,
                    index === ratingPoints.length - 1 ? styles.ratingItemLast : null,
                  ]}
                >
                  <View style={styles.ratingItemHeader}>
                    <View>
                      <Text style={styles.ratingMonth}>{formatMonthLabel(point.month)}</Text>
                      <Text style={styles.ratingTotal}>
                        {totalReviews === 1 ? '1 reseña' : `${totalReviews} reseñas`}
                      </Text>
                    </View>
                    <View style={styles.ratingAverageBadge}>
                      <Text style={styles.ratingAverageBadgeText}>
                        {averageRatingValue !== null
                          ? `${averageRatingValue.toFixed(2)} / 5`
                          : 'Sin datos'}
                      </Text>
                    </View>
                  </View>

                  {totalReviews === 0 ? (
                    <Text style={styles.ratingEmptyMonth}>Sin reseñas en este mes.</Text>
                  ) : (
                    <>
                      <View style={styles.ratingBarTrack}>
                        {segments.map((bucket) => (
                          <View
                            key={`${point.month}-${bucket.rating}`}
                            style={[
                              styles.ratingBarSegment,
                              {
                                flex: bucket.count,
                                backgroundColor: RATING_COLORS[bucket.rating] || '#94a3b8',
                              },
                            ]}
                          />
                        ))}
                      </View>

                      <View style={styles.ratingLegendRow}>
                        {orderedBuckets.map((bucket) => {
                          if (!bucket.count) {
                            return null;
                          }

                          return (
                            <View
                              key={`legend-${point.month}-${bucket.rating}`}
                              style={styles.ratingLegendItem}
                            >
                              <View
                                style={[
                                  styles.ratingLegendSwatch,
                                  { backgroundColor: RATING_COLORS[bucket.rating] || '#94a3b8' },
                                ]}
                              />
                              <Text style={styles.ratingLegendLabel}>
                                {`${bucket.rating} estrellas: ${bucket.count}`}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}