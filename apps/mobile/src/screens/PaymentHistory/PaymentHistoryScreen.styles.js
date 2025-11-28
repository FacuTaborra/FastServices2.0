import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceInfo: {
      flex: 1,
      paddingRight: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountContainer: {
      alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusCompleted: {
      backgroundColor: '#DCFCE7',
  },
  statusRefunded: {
      backgroundColor: '#FEE2E2',
  },
  statusText: {
      fontSize: 12,
      fontWeight: '500',
  },
  statusTextCompleted: {
      color: '#166534',
  },
  statusTextRefunded: {
      color: '#991B1B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  date: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  receiptButton: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  receiptButtonText: {
      fontSize: 13,
      color: '#2563EB',
      fontWeight: '500',
      marginRight: 4,
  },
  emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 40,
  },
  emptyText: {
      marginTop: 12,
      color: '#6B7280',
      fontSize: 16,
  }
});

