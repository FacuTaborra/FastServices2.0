import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import styles from './PaymentScreen.styles';

export default function PaymentScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Main', {
              screen: 'Settings',
              animation: 'slide_from_left',
            })
          }
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>Métodos de Pago</Text>
      </View>
    </SafeAreaView>
  );
}
