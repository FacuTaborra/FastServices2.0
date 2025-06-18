import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, BackHandler, DateInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './EditBudgetModal.styles';

const EditBudgetModal = ({ visible, onClose, onSave }) => {
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const descRef = useRef(null);

  const handleClose = () => {
    setPrice('');
    setDescription('');
    setDate('');
    setTime('');
    onClose && onClose();
  };

  const handleSave = () => {
    onSave && onSave({ price, description, date, time });
    handleClose();
    // TODO: conectar con API para guardar el presupuesto
  };

  useEffect(() => {
    const backAction = () => {
      if (visible) {
        handleClose();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => sub.remove();
  }, [visible]);

  useEffect(() => {
    if (visible && descRef.current) {
      descRef.current.focus();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay} accessible accessibilityViewIsModal>
        <View style={styles.modalContainer}>
          <TouchableOpacity accessibilityLabel="Cerrar" style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Editar presupuesto</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Precio"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            ref={descRef}
            style={[styles.modalInput, styles.modalTextarea]}
            placeholder="Descripción"
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Fecha y Hora"
            value={date}
            onChangeText={setDate}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default EditBudgetModal;
