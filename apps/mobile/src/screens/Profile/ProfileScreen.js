import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import styles from './ProfileScreen.styles';
import Spinner from '../../components/Spinner/Spinner';

// Importar handlers
import { profileImageHandler } from './handlers/ProfileImageHandler';
import { addressHandler } from './handlers/AddressHandler';
import { profileHandler } from './handlers/ProfileHandler';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estado para imagen de perfil
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  useEffect(() => {
    initializeHandlers();
    loadUserProfile();
  }, []);

  // Configurar callbacks de los handlers
  const initializeHandlers = () => {
    // Configurar handler de imagen de perfil
    profileImageHandler.setCallbacks({
      onImageUpdate: setProfileImage,
      onUploadStart: () => setUploadingImage(true),
      onUploadEnd: () => setUploadingImage(false),
      onImageUploadSuccess: () => {
        // Recargar perfil completo después de subir imagen exitosamente
        console.log('🔄 Recargando perfil después de actualizar imagen...');
        profileHandler.loadUserProfile();
      }
    });

    // Configurar handler de direcciones
    addressHandler.setCallbacks({
      onAddressesUpdate: (userAddresses, defaultAddr) => {
        setAddresses(userAddresses);
        setDefaultAddress(defaultAddr);
      }
    });

    // Configurar handler de perfil
    profileHandler.setCallbacks({
      onProfileUpdate: (profileData, formattedDateOfBirth) => {
        setProfile(profileData);
        setDateOfBirth(formattedDateOfBirth);
        // Actualizar la imagen de perfil desde el backend
        setProfileImage(profileData.profile_image_url);
      }
    });
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Cargar perfil del usuario
      await profileHandler.loadUserProfile();

      // Cargar direcciones del usuario
      await addressHandler.loadUserAddresses();

    } catch (error) {
      // Error ya manejado en el handler
    } finally {
      setLoading(false);
    }
  };

  // Funciones de manejo de direcciones usando AddressHandler
  const handleSetDefaultAddress = async (addressId) => {
    await addressHandler.setDefaultAddress(addressId, addresses);
    setShowAddressList(false);
  };

  const handleEditAddress = (address) => {
    console.log('✏️ Editando dirección:', address.title);
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
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const success = await addressHandler.deleteAddress(addressId, addresses);
    if (success) {
      setAddModalVisible(false);
    }
  };

  // Función de actualización de perfil usando ProfileHandler
  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const success = await profileHandler.updateUserProfile(profile.fullName, dateOfBirth);

      if (success) {
        // Refrescar los datos del perfil desde el servidor
        await loadUserProfile();
      }
    } finally {
      setUpdating(false);
    }
  };

  // Función de logout usando ProfileHandler
  const handleLogout = async () => {
    await profileHandler.handleLogout(navigation);
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
                  setAddressForm(addressHandler.createEmptyForm());
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
                      setAddressForm(addressHandler.createEmptyForm());
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
          <Text style={styles.infoText}>{profileHandler.formatDateForInfo(profile.created_at)}</Text>
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