import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    paddingRight: 12,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  alignRight: {
    justifyContent: 'flex-end',
  },
  icon: {
    marginRight: 8,
  },
  rowText: {
    fontSize: 14,
    color: '#1f2937',
    maxWidth: 160,
  },
  status: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusProgress: {
    backgroundColor: '#f3e8ff',
  },
  statusTextProgress: {
    color: '#7c3aed',
  },
  statusActive: {
    backgroundColor: '#dbeafe',
  },
  statusTextActive: {
    color: '#1d4ed8',
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
  },
  statusTextCompleted: {
    color: '#166534',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusTextCancelled: {
    color: '#b91c1c',
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 6,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
    marginLeft: 6,
  },
});