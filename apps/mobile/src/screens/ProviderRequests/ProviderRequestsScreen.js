import React from 'react';
import { View, Text } from 'react-native';
import styles from './ProviderRequestsScreen.styles';

export default function ProviderRequestsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Solicitudes del prestador</Text>
    </View>
  );
}