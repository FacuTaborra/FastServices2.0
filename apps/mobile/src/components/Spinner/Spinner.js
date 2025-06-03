// FastServices/apps/mobile/src/components/Spinner/Spinner.js
import React from 'react';
import { ActivityIndicator } from 'react-native';
import { View } from 'react-native';
import styles from './Spinner.styles';

export default function Spinner() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}