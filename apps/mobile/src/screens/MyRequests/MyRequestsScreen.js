import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Footer from '../../components/Footer/Footer';
import TodoRequestCard from '../../components/RequestCards/TodoRequestCard';
import ProgressRequestCard from '../../components/RequestCards/ProgressRequestCard';
import CompletedRequestCard from '../../components/RequestCards/CompletedRequestCard';
import styles from './MyRequestsScreen.styles';

const exampleData = {
  todos: [
    { titulo: 'Gasista', fecha: 'Domingo 16/23', direccion: 'Damaso 1432', estado: 'FAST' },
    { titulo: 'Carpintero', fecha: 'Domingo 16/23', direccion: 'Calle Falsa 123', estado: 'LICITACIÓN' },
    { titulo: 'Arquitecto', fecha: 'Domingo 16/23', direccion: 'Urquiza 450', estado: 'LICITACIÓN' },
    { titulo: 'Plomero', fecha: 'Domingo 16/23', direccion: 'Sarmiento 222', estado: 'FAST' },
  ],
  progreso: [
    { titulo: 'Plomero Pedrito', fecha: 'Hoy a las 13hs', estado: 'Confirmado' },
    { titulo: 'Arquitecto Juan', fecha: 'Hoy a las 13hs', estado: 'Progreso' },
    { titulo: 'Arquitecto Juan', fecha: 'Hoy a las 13hs', estado: 'Cancelado' },
  ],
  completados: [
    { titulo: 'Plomero Pedrito', fecha: 'Domingo 16/23', estado: 'Completado', calificado: false },
    { titulo: 'Arquitecto Juan', fecha: 'Domingo 16/23', estado: 'Completado', calificado: true, estrellas: 5 },
  ],
};

const MyRequestsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('todos');
  const [searchText, setSearchText] = useState('');

  const renderTodo = ({ item }) => (
    <TodoRequestCard item={item} onPress={() => navigation.navigate('RequestDetail')} />
  );
  const renderProgress = ({ item }) => <ProgressRequestCard item={item} />;
  const renderCompleted = ({ item }) => <CompletedRequestCard item={item} />;

  const dataByTab = () => {
    switch (activeTab) {
      case 'progreso':
        return { data: exampleData.progreso, render: renderProgress };
      case 'completados':
        return { data: exampleData.completados, render: renderCompleted };
      default:
        return { data: exampleData.todos, render: renderTodo };
    }
  };

  const { data, render } = dataByTab();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Solicitudes</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#4776a6" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar"
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'todos' && styles.tabButtonActive]}
          onPress={() => setActiveTab('todos')}
        >
          <Text style={[styles.tabText, activeTab === 'todos' && styles.tabTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'progreso' && styles.tabButtonActive]}
          onPress={() => setActiveTab('progreso')}
        >
          <Text style={[styles.tabText, activeTab === 'progreso' && styles.tabTextActive]}>Progreso</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'completados' && styles.tabButtonActive]}
          onPress={() => setActiveTab('completados')}
        >
          <Text style={[styles.tabText, activeTab === 'completados' && styles.tabTextActive]}>Completados</Text>
        </TouchableOpacity>
      </View>

        <FlatList
          data={data}
          keyExtractor={(_, index) => index.toString()}
          renderItem={render}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <Footer />
    </View>
  );
};

export default MyRequestsScreen;