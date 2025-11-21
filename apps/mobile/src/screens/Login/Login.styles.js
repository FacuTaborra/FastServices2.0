import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 240,
    height: 240,
    aspectRatio: 1 / 1,
    alignSelf: 'center',
    objectFit: 'contain',
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#9CA3AF', // Gris más oscuro
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F3F4F6', // Fondo gris claro
    color: '#111827', // Texto casi negro
  },
  button: {
    backgroundColor: '#4776a6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 12,
    color: '#4776a6',
    textAlign: 'center',
  },
});