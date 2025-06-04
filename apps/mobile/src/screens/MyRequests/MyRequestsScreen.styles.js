import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',

  },
  headerRow: {
    backgroundColor: '#4776a6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    color: '#111827',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#4776a6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#4776a6',
  },
  listContent: {
    paddingBottom: 20,
  },
});