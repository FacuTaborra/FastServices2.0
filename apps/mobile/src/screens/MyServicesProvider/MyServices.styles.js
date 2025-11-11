import { StyleSheet } from 'react-native';
import { PALETTE } from '../HomePage/HomePage.styles';

export const SERVICE_STATUS_COLORS = {
  CONFIRMED: {
    background: '#F1F5F9',
    pill: '#38BDF8',
    text: '#0369A1',
  },
  ON_ROUTE: {
    background: '#DBEAFE',
    pill: '#60A5FA',
    text: '#1D4ED8',
  },
  IN_PROGRESS: {
    background: '#FEF3C7',
    pill: '#FBBF24',
    text: '#B45309',
  },
  COMPLETED: {
    background: '#ECFDF5',
    pill: '#34D399',
    text: '#047857',
  },
  CANCELED: {
    background: '#FEE2E2',
    pill: '#F87171',
    text: '#B91C1C',
  },
};

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.backgroundLight,
  },
  container: {
    flex: 1,
    backgroundColor: PALETTE.backgroundLight,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
    marginRight: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  brandSubtitle: {
    fontSize: 14,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  sectionCounter: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: PALETTE.primary,
  },
  sectionCounterText: {
    color: PALETTE.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  activeList: {
    marginBottom: 28,
  },
  activeCard: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.borderSubtle,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  statusChipIcon: {
    marginRight: 6,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  updateLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginBottom: 14,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  clientInfo: {
    flex: 1,
  },
  clientLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientName: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaIcon: {
    marginRight: 8,
    color: PALETTE.textSecondary,
  },
  metaText: {
    flex: 1,
    color: PALETTE.textSecondary,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 12,
  },
  actionButtonLast: {
    marginRight: 0,
  },
  actionPrimary: {
    backgroundColor: PALETTE.primary,
  },
  actionSecondary: {
    backgroundColor: '#0EA5E9',
  },
  actionDisabled: {
    backgroundColor: '#CBD5F5',
  },
  actionIcon: {
    marginRight: 6,
    color: '#FFFFFF',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: PALETTE.borderSubtle,
    marginTop: 12,
  },
  completedToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedToggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginLeft: 12,
  },
  completedToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedCount: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginRight: 8,
  },
  completedChevron: {
    color: PALETTE.textSecondary,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedList: {
    marginTop: 16,
  },
  completedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: PALETTE.borderSubtle,
    marginBottom: 12,
  },
  completedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  completedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  completedMeta: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  completedReviewSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderSubtle,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    marginRight: 3,
  },
  ratingLabel: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  ratingComment: {
    marginTop: 6,
    fontSize: 12,
    color: PALETTE.textSecondary,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    backgroundColor: 'transparent',
  },
  emptyStateText: {
    color: PALETTE.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: PALETTE.textSecondary,
  },
  errorText: {
    color: PALETTE.danger,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
});