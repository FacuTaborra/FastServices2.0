import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Spinner from '../../components/Spinner/Spinner';
import styles from './RequestDetailScreen.styles';

const requestData = {
  title: 'Plomero',
  serviceType: 'Plomero',
  estimatedTime: '15 min',
  address: 'Dorrego 1423',
  price: '$100',
  description:
    'Se me rompió la canilla del baño, está perdiendo agua en la parte de abajo de la canilla',
  badgeText: 'FAST ⚡',
  images: [null, null, null],
};

const RequestDetailScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleSolicitar = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Requests');
    }, 2000);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{requestData.title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{requestData.badgeText}</Text>
        </View>
      </View>

      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Tipo de Servicio</Text>
        <Text style={styles.infoValue}>{requestData.serviceType}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Tiempo Estimado</Text>
        <Text style={styles.infoValue}>{requestData.estimatedTime}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Dirección</Text>
        <Text style={styles.infoValue}>{requestData.address}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Precio Estimado</Text>
        <Text style={styles.infoValue}>{requestData.price}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>Descripción</Text>
        <Text style={styles.infoValue}>{requestData.description}</Text>
      </View>

      <View style={styles.gallery}>
        {[0, 1, 2].map((_, index) => (
          <View key={index} style={styles.imagePlaceholder}>
            <Ionicons name="image" size={36} color="#9CA3AF" />
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.requestButton} onPress={handleSolicitar}>
        <Text style={styles.requestButtonText}>Solicitar</Text>
      </TouchableOpacity>
      </ScrollView>
      <Modal visible={loading} transparent animationType="fade">
        <Spinner />
      </Modal>
    </View>
  );
};

export default RequestDetailScreen;