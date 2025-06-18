import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import styles from './ChatScreen.styles';

import messages from '../../data/chatMessages';

export default function ChatScreen() {
  const navigation = useNavigation();

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.autor === 'cliente' ? styles.messageClient : styles.messageProvider,
      ]}
    >
      <Text style={styles.messageText}>{item.texto}</Text>
      <Text style={styles.messageTime}>{item.timestamp}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      <View style={styles.proposalCard}>
        <Text style={styles.proposalTitle}>Propuesta</Text>
        <Text style={styles.proposalText}>Precio: $15000</Text>
        <Text style={styles.proposalText}>Tiempo: Hoy a las 13hs</Text>
        <View style={styles.proposalActions}>
          <TouchableOpacity style={[styles.actionButton, styles.rejectButton]}>
            <Text style={styles.actionText}>Rechazar Propuesta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.acceptButton]}>
            <Text style={styles.actionText}>Aceptar Propuesta</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.iconInputButton}>
          <Ionicons name="attach" size={24} color="#6B7280" />
        </TouchableOpacity>
        <TextInput style={styles.textInput} placeholder="Escribe un mensaje" />
        <TouchableOpacity style={styles.iconInputButton}>
          <Ionicons name="send" size={24} color="#4776a6" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}