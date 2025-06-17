import React from 'react';
import { View, Text } from 'react-native';
import styles from './MoreScreen.styles';

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Más opciones</Text>
    </View>
  );
}