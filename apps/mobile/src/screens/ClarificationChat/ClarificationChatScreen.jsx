import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateServiceRequestWithClarification } from '../../hooks/useServiceRequests';
import styles from './ClarificationChatScreen.styles';

const ClarificationChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Datos iniciales de la navegación
  const {
    initialQuestion,
    initialOptions,
    pendingData,
    initialClarificationCount,
    addressList,
    onSuccess,
  } = route.params || {};

  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'agent',
      text: initialQuestion || '¿Podrías darnos más detalles sobre tu solicitud?',
      options: initialOptions || [],
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [currentPendingData, setCurrentPendingData] = useState(pendingData);
  const [clarificationCount, setClarificationCount] = useState(initialClarificationCount || 1);
  const [isComplete, setIsComplete] = useState(false);

  const createWithClarificationMutation = useCreateServiceRequestWithClarification();
  const isSubmitting = createWithClarificationMutation.isPending;

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Scroll cuando se abre el teclado
  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      keyboardDidShow.remove();
    };
  }, []);

  // Cuando el input recibe foco, scroll al final
  const handleInputFocus = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const handleOptionSelect = (option) => {
    if (isSubmitting || isComplete) return;
    setInputText(option);
  };

  const handleSend = () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isSubmitting || isComplete) return;

    // Agregar mensaje del usuario
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: trimmedText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Enviar clarificación al backend
    sendClarification(trimmedText);
  };

  const sendClarification = (answer) => {
    const payload = {
      original_title: currentPendingData?.original_title || '',
      original_description: currentPendingData?.original_description || '',
      clarification_answer: answer,
      clarification_count: clarificationCount,
      request_type: currentPendingData?.request_type || 'FAST',
      address_id: currentPendingData?.address_id,
      preferred_start_at: currentPendingData?.preferred_start_at || null,
      preferred_end_at: currentPendingData?.preferred_end_at || null,
      bidding_deadline: currentPendingData?.bidding_deadline || null,
      tag_ids: currentPendingData?.tag_ids || [],
      attachments: currentPendingData?.attachments || [],
    };

    // Agregar mensaje de "pensando..."
    const thinkingMessage = {
      id: `thinking-${Date.now()}`,
      type: 'thinking',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, thinkingMessage]);

    createWithClarificationMutation.mutate(payload, {
      onSuccess: (result) => {
        // Quitar mensaje de "pensando"
        setMessages((prev) => prev.filter((msg) => msg.type !== 'thinking'));

        if (result?.status === 'needs_clarification') {
          // Otra pregunta
          const newCount = result.clarification_count || clarificationCount + 1;
          setClarificationCount(newCount);
          setCurrentPendingData(result.pending_request_data);

          const agentMessage = {
            id: `agent-${Date.now()}`,
            type: 'agent',
            text: result.clarification_question || '¿Podrías darnos más detalles?',
            options: result.suggested_options || [],
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, agentMessage]);
        } else if (result?.status === 'completed' && result?.service_request) {
          // Éxito - mostrar mensaje y navegar
          setIsComplete(true);
          const successMessage = {
            id: `success-${Date.now()}`,
            type: 'success',
            text: '¡Perfecto! Tu solicitud fue creada exitosamente.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, successMessage]);

          // Navegar después de un momento
          setTimeout(() => {
            handleSuccess(result.service_request);
          }, 1500);
        }
      },
      onError: (error) => {
        // Quitar mensaje de "pensando"
        setMessages((prev) => prev.filter((msg) => msg.type !== 'thinking'));

        const detail =
          error?.message ||
          error?.data?.detail ||
          error?.response?.data?.detail ||
          'Ocurrió un error. Intentá de nuevo.';

        const errorMessage = {
          id: `error-${Date.now()}`,
          type: 'error',
          text: detail,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      },
    });
  };

  const handleSuccess = (serviceRequest) => {
    const createdType = serviceRequest?.request_type || 'FAST';

    if (createdType === 'FAST') {
      navigation.replace('FastMatch', {
        requestId: serviceRequest?.id,
        animation: 'slide_from_right',
      });
    } else if (createdType === 'LICITACION') {
      const selectedAddress = addressList?.find(
        (addr) => addr.id === serviceRequest?.address_id
      );
      const licitacionSummary = {
        id: serviceRequest?.id,
        title: serviceRequest?.title,
        description: serviceRequest?.description,
        address:
          serviceRequest?.city_snapshot ||
          selectedAddress?.full_address ||
          'Dirección pendiente.',
        created_at: serviceRequest?.created_at || new Date().toISOString(),
        bidding_deadline: serviceRequest?.bidding_deadline || null,
        status: serviceRequest?.status || 'PUBLISHED',
        proposal_count: serviceRequest?.proposal_count || 0,
        proposals: serviceRequest?.proposals || [],
        attachments: serviceRequest?.attachments || [],
      };

      navigation.replace('Licitacion', {
        requestId: serviceRequest?.id,
        requestSummary: licitacionSummary,
        animation: 'slide_from_right',
      });
    } else {
      Alert.alert('Solicitud creada', 'Tu solicitud fue publicada exitosamente.', [
        {
          text: 'Ver mis solicitudes',
          onPress: () => navigation.replace('Main', { screen: 'MyRequests' }),
        },
      ]);
    }
  };

  const handleBack = () => {
    Alert.alert(
      'Cancelar solicitud',
      '¿Estás seguro? Se perderá el progreso de esta solicitud.',
      [
        { text: 'Continuar aquí', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const renderMessage = ({ item }) => {
    if (item.type === 'thinking') {
      return (
        <View style={styles.thinkingContainer}>
          <ActivityIndicator size="small" color="#6366F1" />
          <Text style={styles.thinkingText}>Analizando tu respuesta...</Text>
        </View>
      );
    }

    if (item.type === 'success') {
      return (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.successText}>{item.text}</Text>
        </View>
      );
    }

    if (item.type === 'error') {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{item.text}</Text>
        </View>
      );
    }

    if (item.type === 'agent') {
      return (
        <View style={styles.agentMessageContainer}>
          <View style={styles.agentAvatar}>
            <Ionicons name="sparkles" size={16} color="#6366F1" />
          </View>
          <View style={styles.agentBubble}>
            <Text style={styles.agentText}>{item.text}</Text>
            {item.options && item.options.length > 0 && (
              <View style={styles.optionsContainer}>
                {item.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      inputText === option && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleOptionSelect(option)}
                    disabled={isSubmitting || isComplete}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        inputText === option && styles.optionButtonTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      );
    }

    // Mensaje del usuario
    return (
      <View style={styles.userMessageContainer}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Detallá tu solicitud</Text>
          <Text style={styles.headerSubtitle}>
            Pregunta {clarificationCount} de 3
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={18} color="#6366F1" />
        <Text style={styles.infoBannerText}>
          Respondé las preguntas para que podamos encontrar al profesional correcto.
        </Text>
      </View>

      {/* Chat messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input area */}
      {!isComplete && (
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Escribí tu respuesta..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onFocus={handleInputFocus}
            multiline
            maxLength={500}
            editable={!isSubmitting}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSubmitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default ClarificationChatScreen;

