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

// Importar handlers compartidos
import { profileImageHandler } from '../Profile/handlers/ProfileImageHandler';
import { addressHandler } from '../Profile/handlers/AddressHandler';

export default function ProviderProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  // Estado para imagen de perfil
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    fullName: '',
    rating_avg: 0,
    total_reviews: 0,
    licenses: [],
    created_at: '',
    // Campos de imagen de perfil
    profile_image_url: null,
    profile_image_s3_key: null
  });
  const [addresses, setAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [showAddressList, setShowAddressList] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState(addressHandler.createEmptyForm());

  useEffect(() => {
    initializeHandlers();

    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadProviderProfile({ manageLoading: false }),
          addressHandler.loadUserAddresses()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      profileImageHandler.setCallbacks({
        onImageUpdate: undefined,
        onUploadStart: undefined,
        onUploadEnd: undefined,
        onImageUploadSuccess: undefined
      });
      addressHandler.setCallbacks({ onAddressesUpdate: undefined });
    };
  }, []);

  // Configurar callbacks de handlers compartidos
  const initializeHandlers = () => {
    profileImageHandler.setCallbacks({
      onImageUpdate: setProfileImage,
      onUploadStart: () => setUploadingImage(true),
      onUploadEnd: () => setUploadingImage(false),
      onImageUploadSuccess: () => {
        // Recargar perfil completo después de subir imagen exitosamente
        console.log('🔄 Recargando perfil de proveedor después de actualizar imagen...');
        loadProviderProfile();
      }
    });

    addressHandler.setCallbacks({
      onAddressesUpdate: (userAddresses, defaultAddr) => {
        setAddresses(userAddresses);
        setDefaultAddress(defaultAddr);
        setShowAddressList(false);
      }
    });
  };

  const loadProviderProfile = async ({ manageLoading = true } = {}) => {
    try {
      if (manageLoading) {
        setLoading(true);
      }
      console.log('🔍 Cargando perfil del proveedor...');

      const response = await apiService.get('/providers/me');
      const providerData = response?.data ?? {};
      console.log('✅ Perfil del proveedor cargado:', providerData);

      const providerProfile = providerData.provider_profile ?? {};

      setProfile(prevProfile => ({
        ...prevProfile,
        first_name: providerData.first_name || '',
        last_name: providerData.last_name || '',
        email: providerData.email || '',
        phone: providerData.phone || '',
        bio: providerProfile.bio || '',
        rating_avg:
          providerProfile.rating_avg !== undefined && providerProfile.rating_avg !== null
            ? parseFloat(providerProfile.rating_avg)
            : 0,
        total_reviews: providerProfile.total_reviews || 0,
        licenses: providerProfile.licenses || [],
        created_at: providerData.created_at || '',
        fullName: `${providerData.first_name || ''} ${providerData.last_name || ''}`.trim(),
        // Campos de imagen de perfil
        profile_image_url: providerData.profile_image_url || null,
        profile_image_s3_key: providerData.profile_image_s3_key || null
      }));

      // Actualizar imagen de perfil desde el backend
      setProfileImage(providerData.profile_image_url);

    } catch (error) {
      console.error('❌ Error cargando perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil del proveedor');
    } finally {
      if (manageLoading) {
        setLoading(false);
      }
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    const success = await addressHandler.setDefaultAddress(addressId, addresses);
    if (success) {
      setShowAddressList(false);
    }
  };

  const openAddAddressModal = () => {
    setEditingAddress(null);
    setAddressForm(addressHandler.createEmptyForm());
    setShowAddressList(false);
    setAddModalVisible(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm(addressHandler.createFormFromAddress(address));
    setShowAddressList(false);
    setAddModalVisible(true);
  };

  const handleSaveAddress = async () => {
    const success = await addressHandler.saveAddress(addressForm, editingAddress);
    if (success) {
      setAddModalVisible(false);
      setEditingAddress(null);
      setAddressForm(addressHandler.createEmptyForm());
      setShowAddressList(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const success = await addressHandler.deleteAddress(addressId, addresses);
    if (success) {
      setAddModalVisible(false);
      setEditingAddress(null);
      setAddressForm(addressHandler.createEmptyForm());
      setShowAddressList(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      console.log('🔄 Actualizando perfil del proveedor...');

      const updateData = {
        bio: profile.bio
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
        </View>

        <View style={styles.avatarContainer}>
          {uploadingImage ? (
            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
              <Spinner />
            </View>
          ) : (
            <Image
              source={{
                uri: profileImage || 'https://dthezntil550i.cloudfront.net/f4/latest/f41908291942413280009640715/1280_960/1b2d9510-d66d-43a2-971a-cfcbb600e7fe.png'
              }}
              style={styles.avatar}
            />
          )}
          <TouchableOpacity
            style={styles.editIconWrapper}
            onPress={() => profileImageHandler.showImagePickerOptionsWithDelete(
              !!profile.profile_image_url,
              profile.profile_image_s3_key
            )}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <Ionicons name="hourglass" size={14} color="#FFFFFF" />
            ) : (
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            )}
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
            <Text style={styles.statNumber}>{profile.licenses?.length || 0}</Text>
            <Text style={styles.statLabel}>Licencias</Text>
            <Ionicons name="briefcase" size={16} color="#10B981" />
          </View>
        </View>

        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Direcciones</Text>
          <Text style={styles.addressDescription}>
            La dirección que elijas por defecto será la ciudad donde vas a poder hacer match con esos servicios.
          </Text>

          {(!addresses || addresses.length === 0) ? (
            <View style={styles.emptyAddressContainer}>
              <Ionicons name="location-outline" size={40} color="#9CA3AF" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyAddressText}>Aún no hay direcciones registradas.</Text>
              <TouchableOpacity style={styles.quickAddButton} onPress={openAddAddressModal}>
                <Ionicons name="add" size={24} color="#4A90E2" style={{ marginBottom: 4 }} />
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
                  <Text style={[styles.dropdownText, { fontSize: 12, color: '#6B7280' }]}>Dirección por defecto</Text>
                  <Text style={[styles.dropdownText, { fontWeight: '600', color: '#1F2937' }]}>
                    {defaultAddress ? defaultAddress.full_address : 'Sin dirección por defecto'}
                  </Text>
                </View>
                <Ionicons
                  name={showAddressList ? 'chevron-up' : 'chevron-down'}
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
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 4,
                          }}
                        >
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
                    onPress={openAddAddressModal}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.addAddressButtonText}>Agregar nueva dirección</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Licencias Profesionales</Text>
        {!profile.licenses || profile.licenses.length === 0 ? (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Aun no hay licencias registradas.</Text>
          </View>
        ) : (
          profile.licenses.map((license) => (
            <View key={license.id} style={styles.licenseItem}>
              <Text style={styles.licenseNumber}>{license.license_number}</Text>
              {license.license_type ? (
                <Text style={styles.licenseMeta}>{license.license_type}</Text>
              ) : null}
              {license.issued_by ? (
                <Text style={styles.licenseMetaSecondary}>Emitida por {license.issued_by}</Text>
              ) : null}
              {(license.issued_at || license.expires_at) ? (
                <View style={styles.licenseDatesRow}>
                  {license.issued_at ? (
                    <Text style={styles.licenseMetaSecondary}>Desde {formatDate(license.issued_at)}</Text>
                  ) : null}
                  {license.expires_at ? (
                    <Text style={styles.licenseMetaSecondary}>Vence {formatDate(license.expires_at)}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))
        )}

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
          style={styles.buttonDanger}
          onPress={handleLogout}
        >
          <Text style={styles.buttonDangerText}>Cerrar Sesión</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.addressModalBox}>
            <View style={styles.modalHeaderRow}>
              <Ionicons
                name={editingAddress ? 'pencil' : 'add-circle'}
                size={24}
                color="#4A90E2"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalTitle}>
                {editingAddress ? 'Editar dirección' : 'Nueva dirección'}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.modalInput}
                placeholder="Título (ej: Casa, Trabajo)"
                placeholderTextColor="#9CA3AF"
                value={addressForm.title}
                onChangeText={(text) =>
                  setAddressForm((prev) => ({ ...prev, title: text }))
                }
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Calle y número *"
                placeholderTextColor="#9CA3AF"
                value={addressForm.street}
                onChangeText={(text) =>
                  setAddressForm((prev) => ({ ...prev, street: text }))
                }
              />

              <View style={styles.modalRow}>
                <TextInput
                  style={[styles.modalInput, { flex: 2 }]}
                  placeholder="Ciudad *"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.city}
                  onChangeText={(text) =>
                    setAddressForm((prev) => ({ ...prev, city: text }))
                  }
                />
                <TextInput
                  style={[styles.modalInput, { flex: 1, marginLeft: 8 }]}
                  placeholder="CP"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.postal_code}
                  onChangeText={(text) =>
                    setAddressForm((prev) => ({ ...prev, postal_code: text }))
                  }
                  keyboardType="numeric"
                />
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Provincia/Estado *"
                placeholderTextColor="#9CA3AF"
                value={addressForm.state}
                onChangeText={(text) =>
                  setAddressForm((prev) => ({ ...prev, state: text }))
                }
              />

              <TextInput
                style={styles.modalInput}
                placeholder="País"
                placeholderTextColor="#9CA3AF"
                value={addressForm.country}
                onChangeText={(text) =>
                  setAddressForm((prev) => ({ ...prev, country: text }))
                }
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={() => {
                  setAddModalVisible(false);
                  setEditingAddress(null);
                  setAddressForm(addressHandler.createEmptyForm());
                }}
              >
                <Text style={styles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleSaveAddress}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  {editingAddress ? 'Actualizar' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>

            {editingAddress && (
              <TouchableOpacity
                style={[styles.buttonDanger, styles.modalDangerButton]}
                onPress={() => handleDeleteAddress(editingAddress.id)}
              >
                <Ionicons name="trash" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.buttonDangerText}>Eliminar dirección</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={updating} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Spinner />
          </View>
        </View>
      </Modal>
    </View>
  );
}
