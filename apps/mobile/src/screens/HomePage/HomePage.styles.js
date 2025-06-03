// HomePage.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  /** Contenedor principal de la página */
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /** Contenedor del contenido (entre Header y Footer) */
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  /** Estilos para el buscador */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 60,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
  },
  filterButton: {
    padding: 4,
  },

  /** Estilos para el botón "Generar Solicitud" */
  generateButton: {
    backgroundColor: '#4776a6',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /** Título de sección “Servicios Fast Recurrentes” */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },

  /** Contenedor de la lista de servicios */
  servicesList: {
    paddingBottom: 20,
  },

  /** Cada elemento de servicio en la lista */
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    marginRight: 10,
  },
  serviceLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
});
