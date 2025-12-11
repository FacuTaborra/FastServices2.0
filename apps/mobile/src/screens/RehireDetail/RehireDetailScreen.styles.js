import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  // Header
  header: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#7c3aed',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
  },

  // Provider Card
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  providerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e2e8f0',
  },
  providerAvatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  providerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  providerRatingText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
  },

  // Section
  section: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  requestDescription: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
  },
  requestMetaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestMetaText: {
    flex: 1,
    fontSize: 13,
    color: '#0369a1',
    marginLeft: 8,
  },

  // Waiting State
  waitingContainer: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  waitingIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },

  // Proposal
  proposalContainer: {
    marginTop: 24,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  proposalHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 8,
  },
  proposalCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  proposalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  proposalRowContent: {
    flex: 1,
    marginLeft: 12,
  },
  proposalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  proposalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  proposalNotesBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  proposalNotesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  proposalNotesText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },

  // Cancelled State
  cancelledContainer: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelledIconWrapper: {
    marginBottom: 12,
  },
  cancelledTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dc2626',
    textAlign: 'center',
  },
  cancelledSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },

  // Actions
  actionsContainer: {
    marginTop: 24,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f766e',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5f5',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ef4444',
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#b91c1c',
  },
  cancelButtonTextDisabled: {
    color: '#fca5a5',
  },

  // Service Confirmed
  serviceConfirmedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  serviceConfirmedText: {
    flex: 1,
    fontSize: 14,
    color: '#0f766e',
    marginLeft: 10,
    lineHeight: 20,
  },
});
