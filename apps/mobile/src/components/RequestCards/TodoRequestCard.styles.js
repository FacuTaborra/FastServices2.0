import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  tag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  address: {
    fontSize: 14,
    color: '#374151',
  },
});