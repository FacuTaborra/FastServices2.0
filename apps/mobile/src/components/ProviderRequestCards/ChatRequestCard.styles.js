import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  client: {
    fontSize: 14,
    color: '#374151',
  },
  address: {
    fontSize: 12,
    color: '#6B7280',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  finishText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});