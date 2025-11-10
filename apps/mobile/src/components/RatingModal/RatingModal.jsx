import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, BackHandler, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './RatingModal.styles';

const RatingModal = ({ visible, onClose, onSubmit, submitting = false }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const inputRef = useRef(null);

  const handleClose = useCallback(() => {
    if (submitting) {
      return;
    }
    setRating(0);
    setComment('');
    onClose && onClose();
  }, [onClose, submitting]);

  const handleSubmit = () => {
    if (rating < 1 || submitting) {
      return;
    }
    onSubmit && onSubmit(rating, comment);
  };

  useEffect(() => {
    const backAction = () => {
      if (visible && !submitting) {
        handleClose();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [visible, submitting, handleClose]);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setRating(0);
      setComment('');
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
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, submitting && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                (rating < 1 || submitting) && styles.buttonDisabled,
              ]}
              disabled={rating < 1 || submitting}
              onPress={handleSubmit}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fef9c3" />
              ) : (
                <Text style={styles.buttonText}>Enviar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RatingModal;