import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: 'green',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  ratingRow: {
    flexDirection: 'row',
  },
  rateButton: {
    marginTop: 4,
    backgroundColor: '#4776a6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});