import { StyleSheet } from 'react-native';
import { PALETTE } from '../HomePage/HomePage.styles';

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.backgroundLight,
  },
  container: {
    flex: 1,
    backgroundColor: PALETTE.backgroundLight,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContainer: {
    marginTop: 16,
    marginBottom: 20,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.cardLight,
  },
  actionButtonSpacing: {
    marginLeft: 12,
  },
  actionIcon: {
    color: PALETTE.textPrimary,
  },
  searchContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardLight,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: PALETTE.borderSubtle,
  },
  searchIcon: {
    color: PALETTE.textSecondary,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: PALETTE.textPrimary,
  },
  placeholderColor: {
    color: PALETTE.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardLight,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: PALETTE.borderSubtle,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: PALETTE.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  tabTextActive: {
    color: PALETTE.white,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  badgeActive: {
    backgroundColor: PALETTE.white,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 28,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
    backgroundColor: PALETTE.cardLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.borderSubtle,
    marginTop: 24,
  },
  emptyIcon: {
    color: PALETTE.textSecondary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: PALETTE.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: PALETTE.cardLight,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderSubtle,
  },
  modalOptionLast: {
    borderBottomWidth: 0,
  },
  modalOptionText: {
    fontSize: 16,
    color: PALETTE.textPrimary,
  },
  refreshColor: {
    color: PALETTE.primary,
  },
});