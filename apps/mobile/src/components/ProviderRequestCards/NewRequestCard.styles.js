import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fastBadge: {
    position: 'absolute',
    top: 8,
    right: 5,
    backgroundColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fastText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fastIcon: {
    marginRight: 2,
  },
  info: {
    marginBottom: 8,
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
  },
  address: {
    fontSize: 12,
    color: '#374151',
  },
  budgetLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  budget: {
    marginTop: 4,
    fontSize: 14,
    color: '#111827',
    fontWeight: 'bold',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#E53935',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
});