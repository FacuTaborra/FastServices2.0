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
    paddingBottom: 24,
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
  activeSection: {
    marginBottom: 32,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  activeCounter: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: PALETTE.primary,
  },
  activeCounterText: {
    color: PALETTE.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  activeCarousel: {
    paddingBottom: 4,
    paddingRight: 8,
  },
  activeCard: {
    width: 260,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginRight: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  activeCardLast: {
    marginRight: 0,
  },
  activeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeStatusIcon: {
    marginRight: 6,
  },
  activeStatusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  activeChevron: {
    color: PALETTE.textSecondary,
  },
  activeCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginBottom: 10,
  },
  activeCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeCardMetaIcon: {
    color: PALETTE.textSecondary,
    marginRight: 6,
  },
  activeCardMetaText: {
    color: PALETTE.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  sectionCard: {
    marginBottom: 32,
  },
  sectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
  },
  sectionPillIcon: {
    color: '#FFFFFF',
    marginRight: 6,
  },
  sectionPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionCounterBubble: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sectionCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBody: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  sectionBodyContent: {
    marginTop: 4,
  },
  serviceCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: PALETTE.cardLight,
    borderWidth: 1,
    borderColor: PALETTE.borderSubtle,
    marginBottom: 12,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceMetaIcon: {
    color: PALETTE.textSecondary,
    marginRight: 8,
  },
  serviceMetaText: {
    color: PALETTE.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
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
  },
});