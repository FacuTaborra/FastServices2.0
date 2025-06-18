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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsButton: {
    backgroundColor: '#003049',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  detailsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  chatButton: {
    backgroundColor: '#B1A7A6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});