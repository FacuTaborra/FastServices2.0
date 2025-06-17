import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './HelpSupportScreen.styles';

export default function HelpSupportScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Ayuda y Soporte</Text>
      </View>
    </SafeAreaView>
  );
}
