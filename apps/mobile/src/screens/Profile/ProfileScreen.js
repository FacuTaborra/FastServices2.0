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
    date_of_birth: '',
    created_at: '',
    fullName: '',
    password: ''
  });

  const [dateOfBirth, setDateOfBirth] = useState('');

  // Estados para direcciones
  const [addresses, setAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [showAddressList, setShowAddressList] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Estados para formulario de dirección
  const [addressForm, setAddressForm] = useState({
    title: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Argentina'
  });
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
      console.log('📅 Fecha de nacimiento del backend:', userData.date_of_birth);

      setProfile(prevProfile => ({
        ...prevProfile,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        date_of_birth: userData.date_of_birth || '',
        created_at: userData.created_at || '',
        fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        password: '••••••••' // Placeholder para la contraseña
      }));

      // Cargar la fecha de nacimiento en formato DD/MM/YYYY si existe
      if (userData.date_of_birth) {
        console.log('📅 Procesando fecha:', userData.date_of_birth);
        const date = new Date(userData.date_of_birth);
        console.log('📅 Objeto Date creado:', date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        console.log('📅 Fecha formateada:', formattedDate);
        setDateOfBirth(formattedDate);
      } else {
        console.log('📅 No hay fecha de nacimiento en el perfil');
        setDateOfBirth('');
      }

      // Cargar direcciones del usuario
      await loadUserAddresses();

    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil del usuario');
    } finally {
      setLoading(false);
    }
  };

  const loadUserAddresses = async () => {
    try {
      console.log('📍 Cargando direcciones del usuario...');

      const userAddresses = await apiService.getMyAddresses();
      setAddresses(userAddresses);

      // Buscar la dirección por defecto
      const defaultAddr = userAddresses.find(addr => addr.is_default);
      setDefaultAddress(defaultAddr);

      console.log('✅ Direcciones cargadas:', userAddresses.length);
    } catch (error) {
      console.error('❌ Error cargando direcciones:', error);
      // No mostramos alerta para no interrumpir la carga del perfil
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      console.log('🏠 Estableciendo dirección por defecto:', addressId);
      await apiService.setDefaultAddress(addressId);
      await loadUserAddresses(); // Recargar direcciones
      setShowAddressList(false);

      // Feedback visual más suave
      const selectedAddress = addresses.find(addr => addr.id === addressId);
      Alert.alert(
        '✅ Dirección actualizada',
        `"${selectedAddress?.title}" es ahora tu dirección por defecto`
      );
    } catch (error) {
      console.error('❌ Error setting default address:', error);
      Alert.alert('Error', 'No se pudo establecer la dirección por defecto');
    }
  };

  const handleEditAddress = (address) => {
    console.log('✏️ Editando dirección:', address.title);
    setEditingAddress(address);
    setAddressForm({
      title: address.title,
      street: address.street,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code || '',
      country: address.country
    });
    setShowAddressList(false);
    setAddModalVisible(true);
  };

  const handleSaveAddress = async () => {
    try {
      // Validaciones mejoradas
      const requiredFields = ['title', 'street', 'city', 'state'];
      const missingFields = requiredFields.filter(field => !addressForm[field].trim());

      if (missingFields.length > 0) {
        const fieldNames = {
          title: 'Título',
          street: 'Calle',
          city: 'Ciudad',
          state: 'Provincia/Estado'
        };
        const missingNames = missingFields.map(field => fieldNames[field]).join(', ');
        Alert.alert('Campos requeridos', `Por favor completa: ${missingNames}`);
        return;
      }

      console.log('💾 Guardando dirección:', addressForm.title);

      if (editingAddress) {
        // Actualizar dirección existente
        await apiService.updateAddress(editingAddress.id, addressForm);
        Alert.alert('✅ Dirección actualizada', 'Los cambios se guardaron correctamente');
      } else {
        // Crear nueva dirección
        await apiService.createAddress(addressForm);
        Alert.alert('✅ Dirección creada', 'La nueva dirección se agregó correctamente');
      }

      await loadUserAddresses(); // Recargar direcciones
      setAddModalVisible(false);
      setEditingAddress(null);

    } catch (error) {
      console.error('❌ Error saving address:', error);
      const action = editingAddress ? 'actualizar' : 'crear';
      Alert.alert('Error', `No se pudo ${action} la dirección. Inténtalo de nuevo.`);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const addressToDelete = addresses.find(addr => addr.id === addressId);

    Alert.alert(
      '🗑️ Eliminar dirección',
      `¿Estás seguro de que quieres eliminar "${addressToDelete?.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Eliminando dirección:', addressId);
              await apiService.deleteAddress(addressId);
              await loadUserAddresses();
              Alert.alert('✅ Dirección eliminada', 'La dirección se eliminó correctamente');
            } catch (error) {
              console.error('❌ Error deleting address:', error);
              Alert.alert('Error', 'No se pudo eliminar la dirección');
            }
          }
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      console.log('🔄 Actualizando perfil del usuario...');

      // Separar el nombre completo en nombre y apellido
      const nameParts = profile.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD para el backend
      let backendDateOfBirth = null;
      if (dateOfBirth) {
        const [day, month, year] = dateOfBirth.split('/');
        if (day && month && year && day.length === 2 && month.length === 2 && year.length === 4) {
          // Validar que el usuario sea mayor de 18 años
          const birthDate = new Date(year, month - 1, day);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }

          if (age < 18) {
            Alert.alert('Error', 'Debes ser mayor de 18 años para usar esta aplicación');
            setUpdating(false);
            return;
          }

          backendDateOfBirth = `${year}-${month}-${day}`;
        }
      }

      const updateData = {
        first_name: firstName,
        last_name: lastName,
        date_of_birth: backendDateOfBirth
      };

      console.log('📤 Datos a enviar:', updateData);
      console.log('📅 Fecha original:', dateOfBirth);
      console.log('📅 Fecha convertida:', backendDateOfBirth);

      await apiService.updateUserProfile(updateData);
      console.log('✅ Perfil actualizado exitosamente');

      // Refrescar los datos del perfil desde el servidor
      await loadUserProfile();

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

        <Text style={styles.label}>Fecha de nacimiento</Text>
        <TextInput
          style={styles.input}
          placeholder="Fecha de nacimiento (DD/MM/YYYY)"
          placeholderTextColor="#5A5A5A"
          value={dateOfBirth}
          onChangeText={(text) => {
            // Formatear la entrada como DD/MM/YYYY
            let formatted = text.replace(/\D/g, ''); // Solo números
            if (formatted.length >= 2) {
              formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
            }
            if (formatted.length >= 5) {
              formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
            }
            setDateOfBirth(formatted);
          }}
          keyboardType="numeric"
          maxLength={10}
          editable={!updating}
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

        <View style={styles.addressSection}>
          <Text style={styles.label}>Direcciones</Text>

          {addresses.length === 0 ? (
            <View style={styles.emptyAddressContainer}>
              <Ionicons name="location-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyAddressText}>
                No tienes direcciones guardadas
              </Text>
              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => {
                  setEditingAddress(null);
                  setAddressForm({
                    title: '',
                    street: '',
                    city: '',
                    state: '',
                    postal_code: '',
                    country: 'Argentina'
                  });
                  setAddModalVisible(true);
                }}
              >
                <Ionicons name="add" size={24} color="#3B82F6" />
                <Text style={styles.quickAddButtonText}>Agregar primera dirección</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowAddressList(!showAddressList)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dropdownText, { fontSize: 12, color: '#6B7280' }]}>
                    Dirección por defecto
                  </Text>
                  <Text style={[styles.dropdownText, { fontWeight: '600', color: '#1F2937' }]}>
                    {defaultAddress ? defaultAddress.full_address : 'Sin dirección por defecto'}
                  </Text>
                </View>
                <Ionicons
                  name={showAddressList ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>

              {showAddressList && (
                <View style={styles.addressList}>
                  {addresses.map((addr, index) => (
                    <TouchableOpacity
                      key={addr.id}
                      style={[
                        styles.addressItem,
                        addr.is_default && styles.defaultAddressItem,
                        index === addresses.length - 1 && { borderBottomWidth: 0 }
                      ]}
                      onPress={() => !addr.is_default && handleSetDefaultAddress(addr.id)}
                      disabled={addr.is_default}
                    >
                      <View style={styles.addressItemContent}>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 4
                        }}>
                          <Text style={styles.addressItemTitle}>{addr.title}</Text>
                          {addr.is_default && <Text style={styles.defaultLabel}>Por defecto</Text>}
                        </View>
                        <Text style={styles.addressItemText}>{addr.full_address}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {!addr.is_default && (
                          <TouchableOpacity
                            style={styles.setDefaultButton}
                            onPress={() => handleSetDefaultAddress(addr.id)}
                          >
                            <Text style={styles.setDefaultButtonText}>Usar</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.editAddressButton}
                          onPress={() => handleEditAddress(addr)}
                        >
                          <Ionicons name="pencil" size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={styles.addAddressButton}
                    onPress={() => {
                      setShowAddressList(false);
                      setEditingAddress(null);
                      setAddressForm({
                        title: '',
                        street: '',
                        city: '',
                        state: '',
                        postal_code: '',
                        country: 'Argentina'
                      });
                      setAddModalVisible(true);
                    }}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.addAddressButtonText}>Agregar nueva dirección</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

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

      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <Ionicons
                name={editingAddress ? "pencil" : "add-circle"}
                size={24}
                color="#4776a6"
              />
              <Text style={[styles.modalTitle, { marginBottom: 0, marginLeft: 8 }]}>
                {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.modalInput}
                placeholder="Título (ej: Casa, Trabajo)"
                placeholderTextColor="#9CA3AF"
                value={addressForm.title}
                onChangeText={(text) => setAddressForm({ ...addressForm, title: text })}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Calle y número *"
                placeholderTextColor="#9CA3AF"
                value={addressForm.street}
                onChangeText={(text) => setAddressForm({ ...addressForm, street: text })}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.modalInput, { flex: 2 }]}
                  placeholder="Ciudad *"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.city}
                  onChangeText={(text) => setAddressForm({ ...addressForm, city: text })}
                />

                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="CP"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.postal_code}
                  onChangeText={(text) => setAddressForm({ ...addressForm, postal_code: text })}
                  keyboardType="numeric"
                />
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Provincia/Estado *"
                placeholderTextColor="#9CA3AF"
                value={addressForm.state}
                onChangeText={(text) => setAddressForm({ ...addressForm, state: text })}
              />

              <TextInput
                style={styles.modalInput}
                placeholder="País"
                placeholderTextColor="#9CA3AF"
                value={addressForm.country}
                onChangeText={(text) => setAddressForm({ ...addressForm, country: text })}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={() => {
                  setAddModalVisible(false);
                  setEditingAddress(null);
                }}
              >
                <Text style={styles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={handleSaveAddress}
              >
                <Text style={styles.buttonPrimaryText}>
                  {editingAddress ? 'Actualizar' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>

            {editingAddress && (
              <TouchableOpacity
                style={[styles.buttonDanger, { marginTop: 8 }]}
                onPress={() => {
                  setAddModalVisible(false);
                  handleDeleteAddress(editingAddress.id);
                }}
              >
                <Ionicons name="trash" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.buttonDangerText}>Eliminar dirección</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}