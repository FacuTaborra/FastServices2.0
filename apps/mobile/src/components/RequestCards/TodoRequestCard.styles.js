import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
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
    color: '#2563eb',
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
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  tagActive: {
    backgroundColor: '#e0f2fe',
  },
  tagActiveText: {
    color: '#0284c7',
  },
  tagProgress: {
    backgroundColor: '#fbcfe8',
  },
  tagProgressText: {
    color: '#be185d',
  },
  tagCompleted: {
    backgroundColor: '#dcfce7',
  },
  tagCompletedText: {
    color: '#15803d',
  },
  tagCancelled: {
    backgroundColor: '#fee2e2',
  },
  tagCancelledText: {
    color: '#b91c1c',
  },
  date: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
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
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  locationIcon: {
    marginRight: 6,
  },
  address: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    marginRight: 6,
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 4,
  },
  chevronIcon: {
    marginLeft: 4,
  },
});

export default styles;