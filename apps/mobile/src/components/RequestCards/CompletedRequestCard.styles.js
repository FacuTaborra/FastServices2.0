import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 16,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: '#6366f1',
    marginBottom: 4,
  },
  typeLabelFast: {
    color: '#dc2626',
  },
  typeLabelLicitacion: {
    color: '#2563eb',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22,
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
  statusCompleted: {
    backgroundColor: '#dcfce7',
  },
  statusTextCompleted: {
    color: '#15803d',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusTextCancelled: {
    color: '#b91c1c',
  },
  date: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 6,
  },
  location: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    marginBottom: 12,
  },
  priceText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
  },
  ratingContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  comment: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
  },
  rateButton: {
    marginTop: 4,
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#312e81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  rateIcon: {
    marginRight: 8,
  },
  rateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});