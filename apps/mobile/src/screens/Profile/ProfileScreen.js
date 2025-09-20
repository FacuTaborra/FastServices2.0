import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import styles from './ProfileScreen.styles';
import apiService from '../../auth/apiService_auth';
import Spinner from '../../components/Spinner/Spinner';

const initialAddresses = [
  'Av. Libertador 1001',
  'Calle San Martín 234',
  'Boulevard Mitre 456',
  'Pasaje Los Pinos 789',
  'Ruta Nacional 8 Km 12',
  'Calle Belgrano 321',
  'Av. Rivadavia 654',
  'Calle Sarmiento 987',
  'Camino Real 159',
  'Calle Moreno 753',
  'Av. Corrientes 852',
  'Calle Independencia 369',
];

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    created_at: '',
    fullName: '',
    address: '',
    birthday: '',
    password: ''
  });
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showAddressList, setShowAddressList] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando perfil del usuario...');

      const userData = await apiService.getCurrentUser();
      console.log('✅ Perfil del usuario cargado:', userData);

      setProfile(prevProfile => ({
        ...prevProfile,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        created_at: userData.created_at || '',
        fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        address: initialAddresses[0], // Por ahora usamos la primera dirección
        birthday: '', // Campo que el backend no maneja aún
        password: '••••••••' // Placeholder para la contraseña
      }));

    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      console.log('🔄 Actualizando perfil del usuario...');

      // Separar el nombre completo en nombre y apellido
      const nameParts = profile.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const updateData = {
        first_name: firstName,
        last_name: lastName
      };

      await apiService.put('/users/me', updateData);
      console.log('✅ Perfil actualizado exitosamente');

      // Actualizar el estado local
      setProfile(prev => ({
        ...prev,
        first_name: firstName,
        last_name: lastName
      }));

      Alert.alert('Éxito', 'Perfil actualizado correctamente');

    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setUpdating(false);
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
        nestedScrollEnabled
      >
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://dthezntil550i.cloudfront.net/f4/latest/f41908291942413280009640715/1280_960/1b2d9510-d66d-43a2-971a-cfcbb600e7fe.png' }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editIconWrapper}>
            <Ionicons name="pencil" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Nombre Completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre Completo"
          placeholderTextColor="#5A5A5A"
          value={profile.fullName}
          onChangeText={(text) => setProfile({ ...profile, fullName: text })}
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          placeholderTextColor="#5A5A5A"
          value={profile.phone}
          onChangeText={(text) => setProfile({ ...profile, phone: text })}
          editable={false}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#5A5A5A"
          value={profile.email}
          onChangeText={(text) => setProfile({ ...profile, email: text })}
          editable={false}
        />

        <Text style={styles.label}>Direcciones</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowAddressList(!showAddressList)}
        >
          <Text style={styles.dropdownText}>
            {profile.address || 'Select options'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#5A5A5A" />
        </TouchableOpacity>
        {showAddressList && (
          <ScrollView style={styles.addressList} nestedScrollEnabled>
            {addresses.map((addr) => (
              <TouchableOpacity
                key={addr}
                style={styles.addressItem}
                onPress={() => {
                  setProfile({ ...profile, address: addr });
                  setShowAddressList(false);
                }}
              >
                <Text style={styles.addressItemText}>{addr}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => {
                setShowAddressList(false);
                setAddModalVisible(true);
              }}
            >
              <Text style={styles.addAddressButtonText}>Agregar dirección</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        <Text style={styles.label}>Fecha Nacimiento</Text>
        <TextInput
          style={styles.input}
          placeholder="Set birthday"
          placeholderTextColor="#5A5A5A"
          value={profile.birthday}
          onChangeText={(text) => setProfile({ ...profile, birthday: text })}
        />

        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            placeholder="Contraseña"
            placeholderTextColor="#5A5A5A"
            value={profile.password}
            onChangeText={(text) => setProfile({ ...profile, password: text })}
            editable={false}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye' : 'eye-off'}
              size={20}
              color="#5A5A5A"
            />
          </TouchableOpacity>
        </View>

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
            {updating ? 'Guardando...' : 'Guardar cambios'}
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

      <Modal visible={addModalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <TextInput
              style={styles.modalInput}
              placeholder="Nueva dirección"
              placeholderTextColor="#5A5A5A"
              value={newAddress}
              onChangeText={setNewAddress}
            />
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={() => {
                if (newAddress.trim()) {
                  setAddresses([...addresses, newAddress]);
                  setProfile({ ...profile, address: newAddress });
                  setNewAddress('');
                }
                setAddModalVisible(false);
              }}
            >
              <Text style={styles.buttonPrimaryText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}