import { StyleSheet } from 'react-native';

export const PALETTE = {
  primary: '#3B82F6',
  backgroundLight: '#F7F8FA',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  cardLight: '#FFFFFF',
  borderSubtle: '#E5E7EB',
  white: '#FFFFFF',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  infoSoft: '#DBEAFE',
  success: '#10B981',
  successSoft: '#D1FAE5',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  dangerText: '#B91C1C',
};

export const STATUS_CARD_COLORS = {
  active: {
    pill: '#F87171',
    background: '#FFF1F2',
    icon: '#B91C1C',
  },
  inProgress: {
    pill: '#FBBF24',
    background: '#FFFBEB',
    icon: '#D97706', // Darker amber for icon
  },
  upcoming: {
    pill: '#60A5FA',
    background: '#EFF6FF',
    icon: '#2563EB', // Darker blue for icon
  },
  completed: {
    pill: '#34D399',
    background: '#ECFDF5',
    icon: '#059669', // Darker green for icon
  },
};

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.backgroundLight,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 62,
    height: 62,
    resizeMode: 'contain',
    marginRight: 10,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.cardLight,
  },
  notificationIcon: {
    color: PALETTE.textSecondary,
  },
  heroCard: {
    backgroundColor: PALETTE.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  heroBadgeText: {
    color: '#E0E7FF',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  heroBadgeIcon: {
    color: '#FACC15',
  },
  heroTitle: {
    color: PALETTE.white,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 32,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  heroButton: {
    backgroundColor: PALETTE.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: PALETTE.primary,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 10,
  },
  sectionTitleStandalone: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginTop: 4,
    marginBottom: 16,
  },
  activeSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  activeList: {
    marginTop: 4,
  },
  activeCard: {
    backgroundColor: STATUS_CARD_COLORS.active.background,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 14,
  },
  fastActiveCard: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  licitationActiveCard: {
    borderColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
  },
  rehireActiveCard: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STATUS_CARD_COLORS.active.pill,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeBadgeIcon: {
    color: PALETTE.white,
    marginRight: 6,
  },
  activeBadgeText: {
    color: PALETTE.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  fastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCA5A5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  fastBadgeIcon: {
    color: '#FFFFFF',
    marginRight: 4,
  },
  fastBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  licitationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  licitationBadgeIcon: {
    color: '#FFFFFF',
    marginRight: 4,
  },
  licitationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  rehireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rehireBadgeIcon: {
    color: '#FFFFFF',
    marginRight: 4,
  },
  rehireBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  activeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginBottom: 6,
  },
  activeCardMeta: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginBottom: 6,
  },
  activeCardDescription: {
    fontSize: 14,
    color: PALETTE.dangerText,
    lineHeight: 20,
  },
  fastCountdownBlock: {
    marginTop: 16,
  },
  fastCountdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fastCountdownValue: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginLeft: 6,
    marginRight: 10,
  },
  fastCountdownLabel: {
    fontSize: 13,
    color: PALETTE.textSecondary,
  },
  fastProgressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    overflow: 'hidden',
  },
  fastProgressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  activeLoading: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLoadingText: {
    marginTop: 8,
    color: PALETTE.textSecondary,
    fontSize: 13,
  },
  activeErrorBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    marginBottom: 14,
  },
  activeErrorText: {
    color: '#B91C1C',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  activeRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeRetryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeEmptyBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.borderSubtle,
    backgroundColor: PALETTE.cardLight,
    alignItems: 'center',
    marginBottom: 14,
  },
  activeEmptyIcon: {
    marginBottom: 10,
    color: PALETTE.textSecondary,
  },
  activeEmptyText: {
    color: PALETTE.textSecondary,
    textAlign: 'center',
    fontSize: 13,
  },
  
  // --- New Services Section Styles ---
  servicesContainer: {
    marginTop: 8,
  },
  serviceGroup: {
    marginBottom: 20,
  },
  serviceSectionTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: PALETTE.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  serviceCardLeftStrip: {
    width: 6,
    height: '100%',
  },
  serviceCardContent: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  serviceCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceCardDate: {
    fontSize: 13,
    color: PALETTE.textSecondary,
  },
  serviceCardAddress: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    flex: 1,
  },
});


