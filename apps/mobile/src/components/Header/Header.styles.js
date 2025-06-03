// Header.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  /**
   * SafeAreaView: su fondo azul cubrirá
   * el área de estatus/notch en cualquier dispositivo.
   */
  safeArea: {
    backgroundColor: '#4776a6',
  },

  /**
   * Contenedor principal del Header:
   * flexDirection en fila, alineado verticalmente al centro,
   * espacio entre elementos (izq y der), padding horizontal y vertical.
   * El backgroundColor lo quitamos aquí para que quede solo en safeArea.
   */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    // Nota: el fondo ya lo da safeArea con '#2979FF'
  },

  /**
   * Agrupa ícono izquierdo y texto en fila:
   * aplicado dentro de headerContainer.
   */
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /**
   * Margen derecho para que el ícono no pegue con el texto.
   */
  headerIcon: {
    marginRight: 8,
  },

  /**
   * Estilo del título "Fast Services":
   * color blanco, tamaño de fuente y peso negrita.
   */
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  /**
   * Pequeño padding para la zona tocable del ícono derecho.
   */
  headerRight: {
    padding: 4,
  },
});
