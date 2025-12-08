import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useProviderOverviewStats,
  useProviderRevenueStats,
  useProviderRatingDistribution,
  useProviderCurrencies,
} from '../../hooks/useProviderStats';
import styles from './StatsScreen.styles';

const toNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const RANGE_MONTH_OPTIONS = [3, 6, 12];
const EVOLUTION_TABS = [
  { key: 'revenue', label: 'Ingresos' },
  { key: 'satisfaction', label: 'Satisfacción' },
];
const RATING_COLORS = {
  5: '#15803d',
  4: '#22c55e',
  3: '#facc15',
  2: '#f97316',
  1: '#ef4444',
};
const brandIcon = require('../../../assets/icon.png');

export default function StatsScreen() {
  const { data: currenciesData } = useProviderCurrencies();
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedRange, setSelectedRange] = useState(6);
  const [evolutionTab, setEvolutionTab] = useState('revenue');

  useEffect(() => {
    if (currenciesData?.length > 0 && !selectedCurrency) {
      const hasArs = currenciesData.find((c) => c.code === 'ARS');
      setSelectedCurrency(hasArs ? 'ARS' : currenciesData[0].code);
    }
  }, [currenciesData]);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useProviderOverviewStats(selectedCurrency);

  const {
    data: revenueData,
    isLoading: revenueLoading,
    isFetching: revenueFetching,
    error: revenueError,
    refetch: refetchRevenue,
  } = useProviderRevenueStats(selectedRange, selectedCurrency);

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

  // Debug: Log del mes actual del servidor
  useEffect(() => {
    if (revenueData?.server_current_month) {
      console.log('📊 Stats Debug - Mes actual del servidor:', revenueData.server_current_month);
      console.log('📊 Stats Debug - Meses disponibles:', revenueData.points?.map((p) => p.month));
    }
  }, [revenueData]);

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

      // Mapear códigos de moneda no estándar a códigos ISO válidos
      const currencyMap = {
        ARG: 'ARS', // Peso Argentino
      };
      const isoCurrency = currencyMap[currency] || currency;

      try {
        return numeric.toLocaleString('es-AR', {
          style: 'currency',
          currency: isoCurrency,
          minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2,
        });
      } catch (formatError) {
        // Fallback con símbolo manual
        const symbols = { USD: 'US$', ARS: '$', ARG: '$' };
        const symbol = symbols[currency] || currency;
        const formatted = numeric.toLocaleString('es-AR', {
          minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2,
        });
        return `${symbol} ${formatted}`;
      }
    },
    [currency],
  );

  // Parsear fecha YYYY-MM-01 evitando problemas de timezone
  const parseMonthKey = useCallback((value) => {
    if (!value) return null;
    // Parsear manualmente para evitar problemas de timezone
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-indexed
    return new Date(year, month, 1, 12, 0, 0); // Usar mediodía para evitar issues de DST
  }, []);

  const formatMonthLabel = useCallback((value) => {
    if (!value) {
      return '—';
    }
    const parsed = parseMonthKey(value);
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString('es-AR', {
      month: 'short',
      year: 'numeric',
    });
  }, [parseMonthKey]);

  // Mes actual según el servidor (más confiable) o fallback al dispositivo
  const serverCurrentMonth = revenueData?.server_current_month;

  const currentMonthKey = useMemo(() => {
    // Usar el mes del servidor si está disponible
    if (serverCurrentMonth) {
      return serverCurrentMonth;
    }
    // Fallback: usar la fecha del dispositivo
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  }, [serverCurrentMonth]);

  // Nombre del mes actual para mostrar en la UI
  const currentMonthName = useMemo(() => {
    // Si tenemos el mes del servidor, usarlo para el nombre
    if (currentMonthKey) {
      const parsed = parseMonthKey(currentMonthKey);
      if (parsed && !Number.isNaN(parsed.getTime())) {
        const monthName = parsed.toLocaleDateString('es-AR', { month: 'long' });
        const year = parsed.getFullYear();
        return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
      }
    }
    // Fallback
    const now = new Date();
    const monthName = now.toLocaleDateString('es-AR', { month: 'long' });
    const year = now.getFullYear();
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  }, [currentMonthKey, parseMonthKey]);

  // Puntos ordenados de más reciente a más antiguo (descendente)
  const revenuePoints = useMemo(() => {
    const points = Array.isArray(revenueData?.points) ? revenueData.points : [];
    return [...points].reverse();
  }, [revenueData]);

  const ratingPoints = useMemo(() => {
    const points = Array.isArray(ratingData?.points) ? ratingData.points : [];
    return [...points].reverse();
  }, [ratingData]);

  // Función para verificar si un punto es del mes actual (usa el mes del servidor)
  const isCurrentMonth = useCallback((monthKey) => {
    if (!monthKey || !currentMonthKey) return false;
    return monthKey === currentMonthKey;
  }, [currentMonthKey]);

  // Datos del mes actual - el primer punto (más reciente) después del reverse
  const currentMonthData = useMemo(() => {
    if (revenuePoints.length === 0) return null;
    // El mes actual debería ser el primero (más reciente) después del reverse
    return revenuePoints[0];
  }, [revenuePoints]);

  // Datos del mes anterior - el segundo punto después del reverse
  const previousMonthData = useMemo(() => {
    if (revenuePoints.length < 2) return null;
    return revenuePoints[1];
  }, [revenuePoints, currentMonthKey]);

  // Calcular variación mensual
  const monthlyChange = useMemo(() => {
    const currentRevenue = toNumber(currentMonthData?.total_revenue) ?? 0;
    const previousRevenue = toNumber(previousMonthData?.total_revenue) ?? 0;
    if (previousRevenue === 0) return null;
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  }, [currentMonthData, previousMonthData]);

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

  // Datos históricos del overview
  const totalServices = toNumber(data?.total_services) ?? 0;
  const completedServices = toNumber(data?.completed_services) ?? 0;
  const totalProposals = toNumber(data?.total_proposals) ?? 0;
  const acceptedProposals = toNumber(data?.accepted_proposals) ?? 0;
  const acceptanceRate = toNumber(data?.acceptance_rate);
  const averageRating = toNumber(data?.average_rating);
  const totalReviews = toNumber(data?.total_reviews) ?? 0;
  const totalRevenueHistoric = toNumber(data?.total_revenue) ?? 0;

  // Datos del mes actual
  const currentMonthRevenue = toNumber(currentMonthData?.total_revenue) ?? 0;
  const currentMonthServices = Number(currentMonthData?.completed_services) || 0;
  const currentMonthAvgTicket = toNumber(currentMonthData?.avg_ticket);

  // Formateo de displays
  const historicRevenueDisplay = formatCurrency(totalRevenueHistoric);
  const currentMonthRevenueDisplay = formatCurrency(currentMonthRevenue);
  const previousMonthRevenueDisplay = previousMonthData
    ? formatCurrency(toNumber(previousMonthData?.total_revenue) ?? 0)
    : null;

  const acceptanceDisplay = acceptanceRate !== null
    ? `${acceptanceRate.toFixed(1)}%`
    : 'Sin datos';
  const proposalsBreakdown = totalProposals > 0
    ? `${acceptedProposals} aceptadas de ${totalProposals}`
    : 'Aún sin propuestas';
  const ratingDisplay = averageRating !== null
    ? averageRating.toFixed(2)
    : '—';
  const reviewsSubtitle = totalReviews === 0
    ? 'Sin reseñas'
    : totalReviews === 1
      ? '1 reseña'
      : `${totalReviews} reseñas`;

  const monthlyChangeLabel = monthlyChange !== null
    ? `${monthlyChange > 0 ? '+' : ''}${monthlyChange.toFixed(1)}%`
    : null;
  const monthlyChangeStyle = monthlyChange === null
    ? styles.trendNeutral
    : monthlyChange >= 0
      ? styles.trendPositive
      : styles.trendNegative;

  const renderRevenueEvolution = () => {
    if (revenueLoading && !revenueData) {
      return (
        <View style={styles.evolutionLoading}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.evolutionLoadingLabel}>Cargando ingresos...</Text>
        </View>
      );
    }

    if (revenueError) {
      return (
        <View style={styles.evolutionError}>
          <Text style={styles.evolutionErrorText}>
            No pudimos cargar los ingresos para este período.
          </Text>
          <TouchableOpacity style={styles.retryButtonSecondary} onPress={refetchRevenue}>
            <Text style={styles.retryButtonSecondaryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (revenuePoints.length === 0) {
      return (
        <View style={styles.evolutionEmpty}>
          <Text style={styles.evolutionEmptyText}>
            Aún no registramos servicios completados en este rango.
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.evolutionSummary}>
          <View style={styles.evolutionSummaryItem}>
            <Text style={styles.evolutionSummaryLabel}>Total del período</Text>
            <Text style={styles.evolutionSummaryValue}>{formatCurrency(totalRevenueWindow)}</Text>
          </View>
          <View style={styles.evolutionSummaryDivider} />
          <View style={styles.evolutionSummaryItem}>
            <Text style={styles.evolutionSummaryLabel}>Ticket promedio</Text>
            <Text style={styles.evolutionSummaryValue}>
              {aggregatedAvgTicket !== null ? formatCurrency(aggregatedAvgTicket) : '—'}
            </Text>
          </View>
          <View style={styles.evolutionSummaryDivider} />
          <View style={styles.evolutionSummaryItem}>
            <Text style={styles.evolutionSummaryLabel}>Servicios</Text>
            <Text style={styles.evolutionSummaryValue}>{totalServicesWindow}</Text>
          </View>
        </View>

        <View style={styles.evolutionDivider} />

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
          const isCurrent = isCurrentMonth(point.month);

          return (
            <View
              key={point.month}
              style={[styles.revenueItem, isCurrent && styles.revenueItemCurrent]}
            >
              <View style={styles.revenueItemHeader}>
                <View style={styles.revenueMonthContainer}>
                  <Text style={styles.revenueMonth}>{formatMonthLabel(point.month)}</Text>
                  {isCurrent && (
                    <View style={styles.currentMonthBadge}>
                      <Text style={styles.currentMonthBadgeText}>Actual</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.revenueAmount}>{formatCurrency(safeRevenueValue)}</Text>
              </View>
              <View style={styles.revenueBarTrack}>
                <View style={[styles.revenueBarFill, { width: `${Math.min(barWidth, 100)}%` }]} />
              </View>
              <Text style={styles.revenueTicket}>
                {avgTicketValue !== null
                  ? `Ticket: ${formatCurrency(avgTicketValue)}`
                  : 'Sin ticket'} · {servicesCount}{' '}
                {servicesCount === 1 ? 'servicio' : 'servicios'}
              </Text>
            </View>
          );
        })}
      </>
    );
  };

  const renderSatisfactionEvolution = () => {
    if (ratingLoading && !ratingData) {
      return (
        <View style={styles.evolutionLoading}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.evolutionLoadingLabel}>Cargando calificaciones...</Text>
        </View>
      );
    }

    if (ratingError) {
      return (
        <View style={styles.evolutionError}>
          <Text style={styles.evolutionErrorText}>
            No pudimos cargar la distribución de reseñas para este período.
          </Text>
          <TouchableOpacity style={styles.retryButtonSecondary} onPress={refetchRatings}>
            <Text style={styles.retryButtonSecondaryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!hasRatingActivity) {
      return (
        <View style={styles.evolutionEmpty}>
          <Text style={styles.evolutionEmptyText}>
            Aún no registramos reseñas en este rango.
          </Text>
        </View>
      );
    }

    return ratingPoints.map((point, index) => {
      const pointTotalReviews = Number(point?.total_reviews) || 0;
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
      const isCurrent = isCurrentMonth(point.month);
      const isLast = index === ratingPoints.length - 1;

      return (
        <View
          key={point.month}
          style={[
            styles.ratingItem,
            isLast ? styles.ratingItemLast : null,
          ]}
        >
          <View style={styles.ratingItemHeader}>
            <View>
              <View style={styles.ratingMonthContainer}>
                <Text style={styles.ratingMonth}>{formatMonthLabel(point.month)}</Text>
                {isCurrent && (
                  <View style={styles.currentMonthBadge}>
                    <Text style={styles.currentMonthBadgeText}>Actual</Text>
                  </View>
                )}
              </View>
              <Text style={styles.ratingTotal}>
                {pointTotalReviews === 1 ? '1 reseña' : `${pointTotalReviews} reseñas`}
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

          {pointTotalReviews === 0 ? (
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
                        {`${bucket.rating}★: ${bucket.count}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>
      );
    });
  };

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
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════════════ */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image source={brandIcon} style={styles.brandIcon} />
              <View>
                <Text style={styles.brandTitle}>Tus Estadísticas</Text>
                <Text style={styles.brandSubtitle}>Fast Services</Text>
              </View>
            </View>
          </View>

          {currenciesData?.length > 1 && (
            <View style={styles.currencySelector}>
              {currenciesData.map((curr) => {
                const isActive = selectedCurrency === curr.code;
                return (
                  <TouchableOpacity
                    key={curr.code}
                    style={[
                      styles.currencyButton,
                      isActive && styles.currencyButtonActive,
                    ]}
                    onPress={() => setSelectedCurrency(curr.code)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={[
                        styles.currencyButtonText,
                        isActive && styles.currencyButtonTextActive,
                      ]}
                    >
                      {curr.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            SECCIÓN 1: RESUMEN HISTÓRICO
        ═══════════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tu historial</Text>
          <Text style={styles.sectionSubtitle}>Acumulado total</Text>
        </View>

        <View style={styles.historicCard}>
          <View style={styles.historicMainMetric}>
            <Text style={styles.historicMainLabel}>Total facturado</Text>
            <Text style={styles.historicMainValue}>{historicRevenueDisplay}</Text>
            <Text style={styles.historicMainHelper}>Desde que comenzaste en Fast Services</Text>
          </View>

          <View style={styles.historicDivider} />

          <View style={styles.historicMetricsGrid}>
            <View style={styles.historicMetricItem}>
              <Text style={styles.historicMetricValue}>{completedServices}</Text>
              <Text style={styles.historicMetricLabel}>Servicios completados</Text>
              <Text style={styles.historicMetricHelper}>{totalServices} totales</Text>
            </View>

            <View style={styles.historicMetricDivider} />

            <View style={styles.historicMetricItem}>
              <View style={styles.ratingValueContainer}>
                <Text style={styles.historicMetricValue}>{ratingDisplay}</Text>
                <Text style={styles.ratingMaxValue}>/5</Text>
              </View>
              <Text style={styles.historicMetricLabel}>Calificación promedio</Text>
              <Text style={styles.historicMetricHelper}>{reviewsSubtitle}</Text>
            </View>

            <View style={styles.historicMetricDivider} />

            <View style={styles.historicMetricItem}>
              <Text style={styles.historicMetricValue}>{acceptanceDisplay}</Text>
              <Text style={styles.historicMetricLabel}>Tasa de aceptación</Text>
              <Text style={styles.historicMetricHelper}>{proposalsBreakdown}</Text>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            SECCIÓN 2: ESTE MES
        ═══════════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Este mes</Text>
          <Text style={styles.sectionSubtitle}>{currentMonthName}</Text>
        </View>

        <View style={styles.currentMonthCard}>
          {revenueLoading && !currentMonthData ? (
            <View style={styles.currentMonthLoading}>
              <ActivityIndicator size="small" color="#6366f1" />
            </View>
          ) : (
            <>
              <View style={styles.currentMonthMain}>
                <View style={styles.currentMonthRevenueContainer}>
                  <Text style={styles.currentMonthLabel}>Facturación</Text>
                  <Text style={styles.currentMonthValue}>{currentMonthRevenueDisplay}</Text>
                </View>
                {monthlyChangeLabel && (
                  <View style={[styles.currentMonthTrendBadge, monthlyChangeStyle]}>
                    <Text style={[styles.currentMonthTrendText, monthlyChangeStyle]}>
                      {monthlyChangeLabel}
                    </Text>
                    <Text style={styles.currentMonthTrendHelper}>vs. mes anterior</Text>
                  </View>
                )}
              </View>

              <View style={styles.currentMonthDetails}>
                <View style={styles.currentMonthDetailItem}>
                  <Text style={styles.currentMonthDetailValue}>{currentMonthServices}</Text>
                  <Text style={styles.currentMonthDetailLabel}>
                    {currentMonthServices === 1 ? 'servicio' : 'servicios'}
                  </Text>
                </View>
                <View style={styles.currentMonthDetailDivider} />
                <View style={styles.currentMonthDetailItem}>
                  <Text style={styles.currentMonthDetailValue}>
                    {currentMonthAvgTicket !== null
                      ? formatCurrency(currentMonthAvgTicket)
                      : '—'}
                  </Text>
                  <Text style={styles.currentMonthDetailLabel}>ticket promedio</Text>
                </View>
              </View>

              {previousMonthRevenueDisplay && (
                <Text style={styles.currentMonthPrevious}>
                  Mes anterior: {previousMonthRevenueDisplay}
                </Text>
              )}
            </>
          )}
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            SECCIÓN 3: EVOLUCIÓN
        ═══════════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Evolución</Text>
          {(revenueFetching || ratingFetching) && (
            <ActivityIndicator size="small" color="#6366f1" />
          )}
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

        <View style={styles.evolutionTabsContainer}>
          {EVOLUTION_TABS.map((tab) => {
            const isActive = evolutionTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.evolutionTab, isActive && styles.evolutionTabActive]}
                onPress={() => setEvolutionTab(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.evolutionTabText, isActive && styles.evolutionTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.evolutionCard}>
          {evolutionTab === 'revenue'
            ? renderRevenueEvolution()
            : renderSatisfactionEvolution()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
