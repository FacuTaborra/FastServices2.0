// HomePage.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header/Header';
import styles from './HomePage.styles';

import serviciosRecurrentes from '../../data/recurringServices';

const HomePage = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');

  const renderServicio = ({ item }) => (
    <TouchableOpacity style={styles.serviceItem}>
      <View style={styles.serviceLeft}>
        <Ionicons
          name={item.icon}
          size={22}
          color="#4776a6"
          style={styles.serviceIcon}
        />
        <Text style={styles.serviceLabel}>{item.label}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color="#6B7280" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header con SafeAreaView dentro */}
      <Header />

      {/* Contenido principal */}
      <View style={styles.content}>
        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#4776a6" />
          <TextInput
            style={styles.searchInput}
            placeholder="Se me rompió la canilla"
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#4776a6" />
          </TouchableOpacity>
        </View>

        {/* Botón Generar Solicitud */}
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => navigation.navigate('RequestDetail', { showButton: true })}
        >
          <Text style={styles.generateButtonText}>Generar Solicitud</Text>
        </TouchableOpacity>

        {/* Título de sección */}
        <Text style={styles.sectionTitle}>Servicios Fast Recurrentes</Text>

        {/* Lista de servicios */}
        <FlatList
          data={serviciosRecurrentes}
          keyExtractor={(item) => item.id}
          renderItem={renderServicio}
          contentContainerStyle={styles.servicesList}
          showsVerticalScrollIndicator={false}
        />
      </View>

    </View>
  );
};

export default HomePage;
