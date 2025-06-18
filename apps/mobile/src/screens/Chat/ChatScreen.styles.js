import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    backgroundColor: '#F5F3F4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 35,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#111827',
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
    backgroundColor: '#B1A7A6',
  },
  editButton: {
    backgroundColor: '#003049',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
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
    backgroundColor: '#D3D3D3',
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
    marginBottom: 12,
  },
  iconInputButton: {
    padding: 7,
  },
  textInput: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    width: '100%',
  },
  modalTextarea: {
    height: 80,
    textAlignVertical: 'top',
  },
});