import React from 'react';
import { View, Text } from 'react-native';
import styles from './StatsScreen.styles';

export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Estadísticas del prestador</Text>
    </View>
  );
}