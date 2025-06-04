import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  iconButton: {
    padding: 4,
  },
  proposalCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  proposalText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  proposalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  rejectButton: {
    backgroundColor: '#dc2626',
  },
  acceptButton: {
    backgroundColor: '#16a34a',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
  },
  messageProvider: {
    backgroundColor: '#E9D5FF',
    alignSelf: 'flex-start',
  },
  messageClient: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 14,
    color: '#111827',
  },
  messageTime: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  iconInputButton: {
    padding: 7  ,
  },
  textInput: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});