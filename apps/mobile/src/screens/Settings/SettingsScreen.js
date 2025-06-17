import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import styles from './SettingsScreen.styles';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const Option = ({ icon, label, onPress }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        pressed && styles.optionCardPressed,
      ]}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={24} color="#444" />
      </View>
      <Text style={styles.optionText}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} style={styles.arrow} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.statusBar}>
          <Text style={styles.timeText}>9:41</Text>
          <View style={styles.statusIcons}>
            <Ionicons name="cellular" size={20} color="#000" style={styles.statusIcon} />
            <Ionicons name="wifi" size={20} color="#000" style={styles.statusIcon} />
            <Ionicons name="battery-full" size={20} color="#000" style={styles.statusIcon} />
          </View>
        </View>

        <Text style={styles.header}>Configuración</Text>

        <Option
          icon="notifications-outline"
          label="Notification"
          onPress={() => navigation.navigate('Notifications')}
        />
        <Option
          icon="card-outline"
          label="Payment"
          onPress={() => navigation.navigate('Payment')}
        />
        <Option
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() => navigation.navigate('HelpSupport')}
        />
      </View>
    </SafeAreaView>
  );
}
