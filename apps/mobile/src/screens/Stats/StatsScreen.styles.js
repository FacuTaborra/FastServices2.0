import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
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
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  overviewRow: {
    marginHorizontal: -20,
    paddingLeft: 20,
    marginBottom: 16,
  },
  overviewCarouselContent: {
    paddingRight: 20,
  },
  overviewCardWrapper: {
    height: '100%',
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 24,
    padding: 4,
  },
  rangeToggleButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 8,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    marginBottom: 16,
  },
  kpiCardCompact: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 0,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 112,
  },
  kpiLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  kpiValueCompact: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  kpiHelper: {
    fontSize: 13,
    color: '#64748b',
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendPositive: {
    color: '#16a34a',
  },
  trendNegative: {
    color: '#dc2626',
  },
  trendNeutral: {
    color: '#64748b',
  },
  revenueCard: {
    paddingBottom: 12,
  },
  revenueDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  revenueLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  revenueLoadingLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
  },
  revenueEmpty: {
    paddingVertical: 16,
  },
  revenueEmptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  revenueError: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  revenueErrorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
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
  revenueItem: {
    marginBottom: 14,
  },
  revenueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueMonth: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  revenueAmount: {
    fontSize: 15,
    fontWeight: '600',
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
  ratingCard: {
    paddingBottom: 12,
  },
  ratingLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  ratingLoadingLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
  },
  ratingError: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  ratingErrorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  ratingEmpty: {
    paddingVertical: 16,
  },
  ratingEmptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  ratingItem: {
    marginBottom: 18,
  },
  ratingItemLast: {
    marginBottom: 0,
  },
  ratingItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
});