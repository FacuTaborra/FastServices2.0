import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  buttonWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  }
});