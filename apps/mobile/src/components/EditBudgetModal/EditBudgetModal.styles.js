import { StyleSheet } from 'react-native';

export default StyleSheet.create({
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
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    padding: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    width: '100%',
    color: '#111827',
  },
  modalTextarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#003049',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
