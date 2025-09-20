import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import styles from './ProviderProfileScreen.styles';
import apiService from '../../auth/apiService_auth';
import Spinner from '../../components/Spinner/Spinner';

export default function ProviderProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    service_radius_km: '',
    rating_avg: 0,
    total_reviews: 0,
    is_online: false,
    created_at: ''
  });

  useEffect(() => {
    loadProviderProfile();
  }, []);

  const loadProviderProfile = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando perfil del proveedor...');

      const providerData = await apiService.get('/providers/me');
      console.log('✅ Perfil del proveedor cargado:', providerData);

      setProfile(prevProfile => ({
        ...prevProfile,
        first_name: providerData.first_name || '',
        last_name: providerData.last_name || '',
        email: providerData.email || '',
        phone: providerData.phone || '',
        bio: providerData.provider_profile?.bio || '',
        service_radius_km: providerData.provider_profile?.service_radius_km?.toString() || '10',
        rating_avg: parseFloat(providerData.provider_profile?.rating_avg) || 0,
        total_reviews: providerData.provider_profile?.total_reviews || 0,
        is_online: providerData.provider_profile?.is_online || false,
        created_at: providerData.created_at || ''
      }));

    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil del proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      console.log('🔄 Actualizando perfil del proveedor...');

      const updateData = {
        bio: profile.bio,
        service_radius_km: parseInt(profile.service_radius_km) || 10
      };

      await apiService.put('/providers/me/profile', updateData);
      console.log('✅ Perfil actualizado exitosamente');

      Alert.alert('Éxito', 'Perfil actualizado correctamente');

    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleOnlineStatus = async () => {
    try {
      console.log('🔄 Cambiando estado en línea...');

      const response = await apiService.post('/providers/me/toggle-online');
      console.log('✅ Estado cambiado:', response);

      setProfile(prev => ({
        ...prev,
        is_online: response.is_online
      }));

      Alert.alert('Estado Actualizado', response.message);

    } catch (error) {
      console.error('❌ Error cambiando estado:', error);
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Cerrando sesión...');
              await apiService.logout();
              console.log('✅ Sesión cerrada');

              // Navegar al login y resetear el stack
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('❌ Error cerrando sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Spinner />
        <Text style={{ marginTop: 10, color: '#666' }}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Perfil del Proveedor</Text>
          <TouchableOpacity
            style={styles.onlineStatusButton}
            onPress={handleToggleOnlineStatus}
          >
            <View style={[
              styles.onlineIndicator,
              { backgroundColor: profile.is_online ? '#10B981' : '#EF4444' }
            ]} />
            <Text style={styles.onlineStatusText}>
              {profile.is_online ? 'En línea' : 'Fuera de línea'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: 'https://dthezntil550i.cloudfront.net/f4/latest/f41908291942413280009640715/1280_960/1b2d9510-d66d-43a2-971a-cfcbb600e7fe.png'
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editIconWrapper}>
            <Ionicons name="pencil" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Estadísticas del proveedor */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{(profile.rating_avg || 0).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Calificación</Text>
            <Ionicons name="star" size={16} color="#F59E0B" />
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.total_reviews || 0}</Text>
            <Text style={styles.statLabel}>Reseñas</Text>
            <Ionicons name="chatbubble" size={16} color="#4A90E2" />
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.service_radius_km || '10'}km</Text>
            <Text style={styles.statLabel}>Radio</Text>
            <Ionicons name="location" size={16} color="#10B981" />
          </View>
        </View>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          placeholderTextColor="#5A5A5A"
          value={profile.first_name}
          onChangeText={(text) => setProfile({ ...profile, first_name: text })}
          editable={false}
        />

        <Text style={styles.label}>Apellido</Text>
        <TextInput
          style={styles.input}
          placeholder="Apellido"
          placeholderTextColor="#5A5A5A"
          value={profile.last_name}
          onChangeText={(text) => setProfile({ ...profile, last_name: text })}
          editable={false}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#5A5A5A"
          value={profile.email}
          editable={false}
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          placeholderTextColor="#5A5A5A"
          value={profile.phone}
          editable={false}
        />

        <Text style={styles.label}>Descripción de Servicios</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe los servicios que ofreces..."
          placeholderTextColor="#5A5A5A"
          value={profile.bio}
          onChangeText={(text) => setProfile({ ...profile, bio: text })}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Radio de Servicio (km)</Text>
        <TextInput
          style={styles.input}
          placeholder="Radio en kilómetros"
          placeholderTextColor="#5A5A5A"
          value={profile.service_radius_km}
          onChangeText={(text) => setProfile({ ...profile, service_radius_km: text })}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Miembro desde</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{formatDate(profile.created_at)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.buttonPrimary, updating && styles.buttonDisabled]}
          onPress={handleUpdateProfile}
          disabled={updating}
        >
          <Text style={styles.buttonPrimaryText}>
            {updating ? 'Guardando...' : 'Guardar Cambios'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={handleToggleOnlineStatus}
        >
          <Text style={styles.buttonSecondaryText}>
            {profile.is_online ? 'Salir de línea' : 'Entrar en línea'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonDanger}
          onPress={handleLogout}
        >
          <Text style={styles.buttonDangerText}>Cerrar Sesión</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal visible={updating} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Spinner />
            <Text style={styles.modalText}>Actualizando perfil...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}