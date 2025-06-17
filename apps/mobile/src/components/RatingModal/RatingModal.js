import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './RatingModal.styles';

const RatingModal = ({ visible, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const inputRef = useRef(null);

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose && onClose();
  };

  const handleSubmit = () => {
    onSubmit && onSubmit(rating, comment);
    handleClose();
    // TODO: llamar a la API del backend para persistir la calificación
  };

  useEffect(() => {
    const backAction = () => {
      if (visible) {
        handleClose();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [visible]);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackground} accessible accessibilityViewIsModal>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            accessibilityLabel="Cerrar"
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Calificar servicio</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setRating(n)}
                accessible
                accessibilityLabel={`${n} estrella${n > 1 ? 's' : ''}`}
              >
                <Ionicons
                  name={n <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={n <= rating ? '#FFD700' : '#CCCCCC'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            ref={inputRef}
            style={styles.commentInput}
            placeholder="Escribe un comentario (opcional)"
            placeholderTextColor="#5A5A5A"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose}>
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                rating < 1 && styles.buttonDisabled,
              ]}
              disabled={rating < 1}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RatingModal;