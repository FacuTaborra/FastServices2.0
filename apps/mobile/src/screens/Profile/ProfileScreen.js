import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './ProfileScreen.styles';

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

const mockProfile = {
  fullName: 'James Harrid',
  phone: '123-456-7890',
  email: 'example@email.com',
  address: initialAddresses[0],
  birthday: '',
  password: 'password123',
};

export default function ProfileScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState(mockProfile);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showAddressList, setShowAddressList] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState('');

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
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#5A5A5A"
          value={profile.email}
          onChangeText={(text) => setProfile({ ...profile, email: text })}
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
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye' : 'eye-off'}
              size={20}
              color="#5A5A5A"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.buttonPrimary}>
          <Text style={styles.buttonPrimaryText}>Guardar cambios</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary}>
          <Text style={styles.buttonSecondaryText}>Quiero ser prestador</Text>
        </TouchableOpacity>
      </ScrollView>
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