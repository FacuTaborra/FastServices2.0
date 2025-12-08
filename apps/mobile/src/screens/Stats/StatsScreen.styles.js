import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  // ═══════════════════════════════════════════════════════════════════
  // BASE & LAYOUT
  // ═══════════════════════════════════════════════════════════════════
  safeArea: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ═══════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════
  headerContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 56,
    height: 56,
    marginRight: 12,
    resizeMode: 'contain',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 24,
    padding: 4,
    alignSelf: 'flex-start',
  },
  currencyButton: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  currencyButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  currencyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  currencyButtonTextActive: {
    color: '#2563eb',
  },

  // ═══════════════════════════════════════════════════════════════════
  // SECTION HEADERS
  // ═══════════════════════════════════════════════════════════════════
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },

  // ═══════════════════════════════════════════════════════════════════
  // HISTORIC CARD (Tu historial)
  // ═══════════════════════════════════════════════════════════════════
  historicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    marginBottom: 24,
  },
  historicMainMetric: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  historicMainLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 4,
  },
  historicMainValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -1,
  },
  historicMainHelper: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  historicDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  historicMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historicMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  historicMetricDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  historicMetricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  historicMetricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  historicMetricHelper: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
  ratingValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingMaxValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    marginLeft: 2,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CURRENT MONTH CARD (Este mes)
  // ═══════════════════════════════════════════════════════════════════
  currentMonthCard: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginBottom: 24,
  },
  currentMonthLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  currentMonthMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  currentMonthRevenueContainer: {
    flex: 1,
  },
  currentMonthLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  currentMonthValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  currentMonthTrendBadge: {
    alignItems: 'flex-end',
    paddingLeft: 12,
  },
  currentMonthTrendText: {
    fontSize: 18,
    fontWeight: '700',
  },
  currentMonthTrendHelper: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  currentMonthDetails: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  currentMonthDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  currentMonthDetailDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
  currentMonthDetailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  currentMonthDetailLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  currentMonthPrevious: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },

  // ═══════════════════════════════════════════════════════════════════
  // TREND STYLES
  // ═══════════════════════════════════════════════════════════════════
  trendPositive: {
    color: '#86efac',
  },
  trendNegative: {
    color: '#fca5a5',
  },
  trendNeutral: {
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // ═══════════════════════════════════════════════════════════════════
  // RANGE TOGGLE
  // ═══════════════════════════════════════════════════════════════════
  rangeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 24,
    padding: 4,
    marginBottom: 12,
  },
  rangeToggleButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rangeToggleButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rangeToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  rangeToggleTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },

  // ═══════════════════════════════════════════════════════════════════
  // EVOLUTION TABS
  // ═══════════════════════════════════════════════════════════════════
  evolutionTabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  evolutionTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  evolutionTabActive: {
    borderBottomColor: '#6366f1',
  },
  evolutionTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b',
  },
  evolutionTabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },

  // ═══════════════════════════════════════════════════════════════════
  // EVOLUTION CARD
  // ═══════════════════════════════════════════════════════════════════
  evolutionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    marginBottom: 16,
  },
  evolutionLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  evolutionLoadingLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
  },
  evolutionEmpty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  evolutionEmptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  evolutionError: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  evolutionErrorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  evolutionSummary: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  evolutionSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  evolutionSummaryDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  evolutionSummaryLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  evolutionSummaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  evolutionDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },

  // ═══════════════════════════════════════════════════════════════════
  // REVENUE ITEMS
  // ═══════════════════════════════════════════════════════════════════
  revenueItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  revenueItemCurrent: {
    backgroundColor: '#f0fdf4',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingTop: 12,
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  revenueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueMonthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueMonth: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  revenueAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  revenueBarTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: '#e0e7ff',
    overflow: 'hidden',
  },
  revenueBarFill: {
    height: 8,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  revenueTicket: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748b',
  },
  currentMonthBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  currentMonthBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },

  // ═══════════════════════════════════════════════════════════════════
  // RATING ITEMS
  // ═══════════════════════════════════════════════════════════════════
  ratingItem: {
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  ratingItemLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  ratingItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ratingMonthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingMonth: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  ratingTotal: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  ratingAverageBadge: {
    backgroundColor: '#e0e7ff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ratingAverageBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  ratingBarTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  ratingBarSegment: {
    height: '100%',
  },
  ratingLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  ratingLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 6,
  },
  ratingLegendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  ratingLegendLabel: {
    fontSize: 12,
    color: '#475569',
  },
  ratingEmptyMonth: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },

  // ═══════════════════════════════════════════════════════════════════
  // LOADING & ERROR STATES
  // ═══════════════════════════════════════════════════════════════════
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8faff',
    paddingHorizontal: 24,
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 15,
    color: '#475569',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8faff',
    paddingHorizontal: 28,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  retryButtonSecondary: {
    marginTop: 10,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#2563eb',
  },
  retryButtonSecondaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
