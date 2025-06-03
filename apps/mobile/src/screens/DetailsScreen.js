import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function DetailsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Detalles</Text>
      <Text style={styles.text}>
        Aquí puedes mostrar información adicional o funcionalidades.
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Volver al Home"
          onPress={() => navigation.navigate('Home')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '60%',
  },
});
