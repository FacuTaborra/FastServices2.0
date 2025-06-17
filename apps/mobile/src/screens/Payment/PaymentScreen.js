import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './PaymentScreen.styles';

export default function PaymentScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Métodos de Pago</Text>
      </View>
    </SafeAreaView>
  );
}
