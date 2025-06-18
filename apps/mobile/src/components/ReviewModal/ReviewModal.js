import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './ReviewModal.styles';

const ReviewModal = ({ visible, onClose, item }) => {
  if (!item) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} accessible accessibilityViewIsModal>
        <View style={styles.container}>
          <TouchableOpacity
            accessibilityLabel="Cerrar"
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Reseña del cliente</Text>
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map((n) => (
              <Ionicons
                key={n}
                name={n <= (item.rating || 0) ? 'star' : 'star-outline'}
                size={24}
                color="#fbbf24"
              />
            ))}
          </View>
          {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

export default ReviewModal;