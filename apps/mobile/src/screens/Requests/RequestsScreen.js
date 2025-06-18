import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import styles from './RequestsScreen.styles';

// Ejemplos hardcodeados (se eliminarán luego)
import { providersExample, chatsExample } from '../../data/requestsScreenData';

export default function RequestsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('nuevos');
  const [searchText, setSearchText] = useState('');

  const renderProvider = ({ item }) => (
    <View style={styles.providerItem}>
      <Ionicons
        name="person-circle-outline"
        size={40}
        color="#9CA3AF"
        style={styles.providerAvatar}
      />
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>{item.name}</Text>
        <View style={styles.tagContainer}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Ionicons
              key={n}
              name={n <= item.rating ? 'star' : 'star-outline'}
              size={16}
              color="#fbbf24"
            />
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.sendButton}>
        <Text style={styles.sendButtonText}>Enviar solicitud</Text>
      </TouchableOpacity>
    </View>
  );

  const renderChat = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('Chat')}
    >
      <Ionicons
        name="person-circle-outline"
        size={40}
        color="#9CA3AF"
        style={styles.chatAvatar}
      />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <Text style={styles.chatMessage}>{item.lastMessage}</Text>
      </View>
    </TouchableOpacity>
  );

  const filteredChats = chatsExample.filter(
    (c) =>
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'MyRequests', animation: 'slide_from_left' })}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('RequestDetail', { showButton: false, animation: 'slide_from_right' })}
        >
          <Ionicons name="information-circle-outline" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'nuevos' && styles.tabButtonActive]}
          onPress={() => setActiveTab('nuevos')}
        >
          <Text style={[styles.tabText, activeTab === 'nuevos' && styles.tabTextActive]}>Nuevos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'enviados' && styles.tabButtonActive]}
          onPress={() => setActiveTab('enviados')}
        >
          <Text style={[styles.tabText, activeTab === 'enviados' && styles.tabTextActive]}>Enviados</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'nuevos' ? (
        <FlatList
          data={providersExample}
          keyExtractor={(item) => item.id}
          renderItem={renderProvider}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            renderItem={renderChat}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
    </View>
  );
}