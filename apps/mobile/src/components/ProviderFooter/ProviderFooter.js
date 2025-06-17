import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './ProviderFooter.styles';

export default function ProviderFooter({ state, descriptors, navigation }) {
  const current = state.routeNames[state.index];

  const requestsBadge = descriptors[state.routes[0].key].options.tabBarBadge;

  const colorFor = (name) => (current === name ? '#4776a6' : '#6B7280');

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={() => navigation.navigate('ProviderRequests')}
        >
          <View style={styles.button}>
            <Ionicons name="briefcase-outline" size={24} color={colorFor('ProviderRequests')} />
            <Text style={[styles.label, { color: colorFor('ProviderRequests') }]}>Solicitudes</Text>
            {requestsBadge !== undefined && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{requestsBadge}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={() => navigation.navigate('Statistics')}
        >
          <View style={styles.button}>
            <Ionicons name="bar-chart-outline" size={24} color={colorFor('Statistics')} />
            <Text style={[styles.label, { color: colorFor('Statistics') }]}>Estadísticas</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={() => navigation.navigate('ProviderProfile')}
        >
          <View style={styles.button}>
            <Ionicons name="person-circle-outline" size={24} color={colorFor('ProviderProfile')} />
            <Text style={[styles.label, { color: colorFor('ProviderProfile') }]}>Perfil</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={() => navigation.navigate('More')}
        >
          <View style={styles.button}>
            <Ionicons name="settings-outline" size={24} color={colorFor('More')} />
            <Text style={[styles.label, { color: colorFor('More') }]}>Más</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}