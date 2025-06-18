import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import TodoRequestCard from '../../components/RequestCards/TodoRequestCard';
import ProgressRequestCard from '../../components/RequestCards/ProgressRequestCard';
import CompletedRequestCard from '../../components/RequestCards/CompletedRequestCard';
import RatingModal from '../../components/RatingModal/RatingModal';
import styles from './MyRequestsScreen.styles';

import exampleData from '../../data/myRequests';

const MyRequestsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('todos');
  const [searchText, setSearchText] = useState('');
  const [completedRequests, setCompletedRequests] = useState(exampleData.completados);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const renderTodo = ({ item }) => (
    <TodoRequestCard item={item} onPress={() => navigation.navigate('Requests')} />
  );
  const renderProgress = ({ item }) => <ProgressRequestCard item={item} />;
  const renderCompleted = ({ item, index }) => (
    <CompletedRequestCard item={item} onRate={() => openModal(index)} />
  );

  const dataByTab = () => {
    switch (activeTab) {
      case 'progreso':
        return { data: exampleData.progreso, render: renderProgress };
      case 'completados':
        return { data: completedRequests, render: renderCompleted };
      default:
        return { data: exampleData.todos, render: renderTodo };
    }
  };

  const { data, render } = dataByTab();

  const openModal = (index) => {
    setSelectedIndex(index);
    setRatingVisible(true);
  };

  const handleSubmitRating = (rating, comment) => {
    setCompletedRequests((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = {
        ...updated[selectedIndex],
        calificado: true,
        estrellas: rating,
        comentario: comment,
      };
      return updated;
    });
    setRatingVisible(false);
    setSelectedIndex(null);
    // TODO: llamar a la API del backend para persistir la calificación
  };

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
        <RatingModal
          visible={ratingVisible}
          onClose={() => {
            setRatingVisible(false);
            setSelectedIndex(null);
          }}
          onSubmit={handleSubmitRating}
        />
      </View>
    </View>
  );
};

export default MyRequestsScreen;