import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ratedCard: {
    backgroundColor: '#e8f5e9',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  status: {
    fontSize: 12,
    color: '#374151',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  comment: {
    marginLeft: 4,
    fontSize: 12,
    color: '#374151',
  },
  chatButton: {
    backgroundColor: '#4776a6',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});