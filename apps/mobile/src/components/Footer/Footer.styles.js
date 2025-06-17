// Footer.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  /**
   * SafeAreaView inferior: fondo blanco para que no se vea
   * espacio negro o blanco indeseado en gestos de Android/iOS.
   */
  footerSafeArea: {
    backgroundColor: '#FFFFFF',
     
  },

  /**
   * Contenedor principal del Footer:
   * flexDirection en fila, espacio parejo (space-around),
   * padding vertical y borde superior tenue.
   */
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // Gris claro para separación
  },

  /**
   * Cada botón del Footer:
   * alineado al centro para ícono + texto.
   */
  footerButton: {
    flex: 1,
    alignItems: 'center',
  },

  /**
   * Texto bajo el ícono en el Footer:
   * tamaño de fuente pequeño, color gris por defecto y margen superior.
   */
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
