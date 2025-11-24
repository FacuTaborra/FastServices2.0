import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import Spinner from '../../components/Spinner/Spinner';
import styles from './RequestDetailScreen.styles';
import { useMyAddresses } from '../../hooks/useAddresses';
import { useCreateServiceRequest } from '../../hooks/useServiceRequests';
import { uploadServiceRequestImage } from '../../services/images.service';

const MAX_ATTACHMENTS = 6;
const MAX_BIDDING_WINDOW_MS = 72 * 60 * 60 * 1000;

const RequestDetailScreen = () => {
  const navigation = useNavigation();
  const addressesQuery = useMyAddresses();
  const addressList = addressesQuery.data ?? [];

  const [requestType, setRequestType] = useState('FAST');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const createRequestMutation = useCreateServiceRequest();

  useEffect(() => {
    if (!addressesQuery.isLoading && addressList.length > 0 && !selectedAddressId) {
      const defaultAddress = addressList.find((addr) => addr.is_default);
      setSelectedAddressId((defaultAddress ?? addressList[0]).id);
    }
  }, [addressesQuery.isLoading, addressList, selectedAddressId]);

  const hasPendingUploads = attachments.some((attachment) => attachment.uploading);
  const hasUploadErrors = attachments.some((attachment) => attachment.uploadError);

  const handleBack = () => {
    navigation.goBack();
  };

  const ensureMediaLibraryPermission = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceder a tu galería para adjuntar imágenes.',
      );
      return false;
    }
    return true;
  };

  const prepareAttachmentMeta = (asset) => {
    const normalizedUri = asset.uri ?? '';
    let extension = normalizedUri.split('.').pop()?.toLowerCase() ?? '';
    if (!extension || extension.length > 5) {
      const mimeSubtype = asset.mimeType?.split('/')[1];
      extension = mimeSubtype ? mimeSubtype.toLowerCase() : 'jpg';
    }
    if (extension === 'jpeg') {
      extension = 'jpg';
    }

    const mimeType = asset.mimeType ?? `image/${extension === 'jpg' ? 'jpeg' : extension}`;
    const fileName =
      asset.fileName ??
      `service-request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      localUri: normalizedUri,
      fileName,
      mimeType,
      uploading: true,
      uploadError: null,
      s3_key: null,
      public_url: null,
      caption: '',
    };
  };

  const startUploadForAttachment = async (attachmentMeta) => {
    setAttachments((prev) =>
      prev.map((attachment) =>
        attachment.id === attachmentMeta.id
          ? {
            ...attachment,
            uploading: true,
            uploadError: null,
            s3_key: null,
            public_url: null,
          }
          : attachment,
      ),
    );

    const formData = new FormData();
    formData.append('file', {
      uri: attachmentMeta.localUri,
      name: attachmentMeta.fileName,
      type: attachmentMeta.mimeType,
    });

    try {
      const uploadResult = await uploadServiceRequestImage(formData, { maxWidth: 1600 });

      setAttachments((prev) =>
        prev.map((attachment) =>
          attachment.id === attachmentMeta.id
            ? {
              ...attachment,
              uploading: false,
              uploadError: null,
              s3_key: uploadResult.s3_key,
              public_url: uploadResult.public_url,
            }
            : attachment,
        ),
      );
    } catch (error) {
      const message = error?.message || 'No pudimos subir la imagen. Intentá nuevamente.';
      setAttachments((prev) =>
        prev.map((attachment) =>
          attachment.id === attachmentMeta.id
            ? {
              ...attachment,
              uploading: false,
              uploadError: message,
            }
            : attachment,
        ),
      );
    }
  };

  const handlePickImage = async () => {
    if (attachments.length >= MAX_ATTACHMENTS) {
      Alert.alert('Límite alcanzado', `Solo se permiten ${MAX_ATTACHMENTS} imágenes por solicitud.`);
      return;
    }

    const hasPermission = await ensureMediaLibraryPermission();
    if (!hasPermission) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const attachmentMeta = prepareAttachmentMeta(asset);

    setAttachments((prev) => [...prev, attachmentMeta]);
    startUploadForAttachment(attachmentMeta);
  };

  const handleRemoveAttachment = (attachmentId) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId));
  };

  const handleRetryAttachment = (attachmentId) => {
    const attachment = attachments.find((item) => item.id === attachmentId);
    if (!attachment) {
      return;
    }
    startUploadForAttachment(attachment);
  };

  const handleCaptionChange = (attachmentId, value) => {
    setAttachments((prev) =>
      prev.map((attachment) =>
        attachment.id === attachmentId
          ? {
            ...attachment,
            caption: value,
          }
          : attachment,
      ),
    );
  };

  const handleRewriteDescription = () => { };

  const buildPayload = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Título requerido', 'Ingresá un título claro para tu solicitud.');
      return null;
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length < 20) {
      Alert.alert(
        'Descripción demasiado corta',
        'La descripción debe tener al menos 20 caracteres.',
      );
      return null;
    }

    if (hasPendingUploads) {
      Alert.alert('Imágenes en proceso', 'Esperá a que terminen de subirse las imágenes.');
      return null;
    }

    if (hasUploadErrors) {
      Alert.alert(
        'Error en imágenes',
        'Revisá las imágenes con error o eliminá las que fallaron antes de continuar.',
      );
      return null;
    }

    if (!selectedAddressId) {
      Alert.alert('Dirección requerida', 'Seleccioná una dirección para publicar la solicitud.');
      return null;
    }

    const addressIdNumber = Number(selectedAddressId);
    if (!Number.isFinite(addressIdNumber)) {
      Alert.alert('Dirección inválida', 'La dirección seleccionada no es válida.');
      return null;
    }

    let biddingDeadlineIso = null;
    if (requestType === 'LICITACION') {
      const deadlineDate = new Date(Date.now() + MAX_BIDDING_WINDOW_MS);
      deadlineDate.setMinutes(0, 0, 0);
      biddingDeadlineIso = deadlineDate.toISOString();
    }

    const sanitizedAttachments = attachments
      .filter((attachment) => attachment.s3_key)
      .map((attachment, index) => ({
        s3_key: attachment.s3_key,
        caption: attachment.caption?.trim() || undefined,
        public_url: attachment.public_url || undefined,
        sort_order: index,
      }));

    if (sanitizedAttachments.length > MAX_ATTACHMENTS) {
      Alert.alert(
        'Demasiados adjuntos',
        `Solo se permiten ${MAX_ATTACHMENTS} imágenes por solicitud.`,
      );
      return null;
    }

    return {
      title: trimmedTitle,
      description: trimmedDescription,
      request_type: requestType,
      address_id: addressIdNumber,
      bidding_deadline: requestType === 'LICITACION' ? biddingDeadlineIso : null,
      attachments: sanitizedAttachments,
    };
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRequestType('FAST');
    setAttachments([]);
  };

  const handleSubmit = () => {
    const payload = buildPayload();
    if (!payload) {
      return;
    }

    createRequestMutation.mutate(payload, {
      onSuccess: (createdRequest) => {
        const createdType = createdRequest?.request_type ?? requestType;
        resetForm();

        if (createdType === 'FAST') {
          navigation.navigate('FastMatch', {
            requestId: createdRequest?.id,
            animation: 'slide_from_right',
          });
          return;
        }

        if (createdType === 'LICITACION') {
          const createdAddressId = createdRequest?.address_id ?? payload.address_id;
          const selectedAddress = addressList.find((addr) => addr.id === createdAddressId);
          const licitacionSummary = {
            id: createdRequest?.id,
            title: createdRequest?.title ?? payload.title,
            description: createdRequest?.description ?? payload.description,
            address:
              createdRequest?.city_snapshot ??
              selectedAddress?.full_address ??
              'Dirección pendiente.',
            created_at: createdRequest?.created_at ?? new Date().toISOString(),
            bidding_deadline:
              createdRequest?.bidding_deadline ?? payload.bidding_deadline ?? null,
            status: createdRequest?.status ?? 'PUBLISHED',
            proposal_count: createdRequest?.proposal_count ?? 0,
            proposals: Array.isArray(createdRequest?.proposals)
              ? createdRequest.proposals
              : [],
            attachments: Array.isArray(createdRequest?.attachments)
              ? createdRequest.attachments
              : payload.attachments ?? [],
          };

          navigation.navigate('Licitacion', {
            requestId: createdRequest?.id,
            requestSummary: licitacionSummary,
            animation: 'slide_from_right',
          });
          return;
        }

        Alert.alert(
          'Solicitud creada',
          'Tu solicitud fue publicada exitosamente.',
          [
            {
              text: 'Crear otra',
              onPress: () => {
                setRequestType(createdType);
                setSelectedAddressId(
                  createdRequest?.address_id ?? selectedAddressId,
                );
              },
            },
            {
              text: 'Ver mis solicitudes',
              onPress: () => navigation.navigate('Requests', { animation: 'fade' }),
            },
          ],
          { cancelable: false },
        );
      },
      onError: (error) => {
        const status = error?.status ?? error?.response?.status;
        const detail =
          error?.message ||
          error?.data?.detail ||
          error?.response?.data?.detail ||
          'No pudimos crear la solicitud. Intentalo nuevamente.';
        Alert.alert('Error al crear la solicitud', `${detail}${status ? ` (HTTP ${status})` : ''}`);
      },
    });
  };

  const isSubmitting = createRequestMutation.isPending;

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={120}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        <Text style={styles.screenTitle}>Nueva solicitud de servicio</Text>
        <Text style={styles.helperText}>
          Completá los datos para publicar tu necesidad. Los proveedores recibirán la información que cargues a continuación.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tipo de solicitud</Text>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                styles.toggleButtonSpacing,
                requestType === 'FAST' && styles.toggleButtonActive,
              ]}
              onPress={() => setRequestType('FAST')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  requestType === 'FAST' && styles.toggleButtonTextActive,
                ]}
              >
                Fast ⚡
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, requestType === 'LICITACION' && styles.toggleButtonActive]}
              onPress={() => setRequestType('LICITACION')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  requestType === 'LICITACION' && styles.toggleButtonTextActive,
                ]}
              >
                Presupuesto ⏰
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.requestTypeHelper}>
            <Text style={styles.requestTypeHelperText}>
              FAST ⚡: Publicá y recibí ayuda lo antes posible.
            </Text>
            <Text style={styles.requestTypeHelperText}>
              PRESUPUESTO ⏰: Permití que varios prestadores te envíen propuestas antes de decidir.
            </Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Título*</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: Instalación de lámpara en comedor"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            maxLength={150}
          />
          <Text style={styles.helperText}>
            Escribí un título breve y claro que resuma lo que necesitás.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, styles.labelNoSpacing]}>Descripción*</Text>
            <TouchableOpacity
              style={styles.rewriteButton}
              activeOpacity={0.85}
              onPress={handleRewriteDescription}
              accessibilityRole="button"
              accessibilityLabel="Reescribir descripción"
            >
              <FontAwesome6 name="pen" size={16} color="black" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            placeholder="Contanos qué necesitás. Incluí detalles, urgencia, materiales, etc."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.helperText}>Debe tener al menos 20 caracteres.</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Dirección*</Text>
          {addressesQuery.isLoading ? (
            <View style={styles.inlineSpinner}>
              <Spinner />
            </View>
          ) : addressesQuery.isError ? (
            <View style={styles.addressErrorBox}>
              <Text style={styles.errorText}>No pudimos cargar tus direcciones.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={addressesQuery.refetch}>
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : addressList.length === 0 ? (
            <View style={styles.addressEmptyBox}>
              <Ionicons name="location-outline" size={32} color="#6B7280" />
              <Text style={styles.addressEmptyText}>
                Necesitás al menos una dirección para crear una solicitud.
              </Text>
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => navigation.navigate('Profile')}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addAddressButtonText}>Agregar dirección</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addressList}>
              {addressList.map((address) => {
                const isSelected = selectedAddressId === address.id;
                return (
                  <TouchableOpacity
                    key={address.id}
                    style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                    onPress={() => setSelectedAddressId(address.id)}
                  >
                    <View style={styles.addressCardHeader}>
                      <Text style={styles.addressTitle}>{address.title}</Text>
                      {address.is_default && <Text style={styles.addressBadge}>Default</Text>}
                    </View>
                    <Text style={styles.addressSubtitle}>{address.full_address}</Text>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
                        <Text style={styles.selectedBadgeText}>Seleccionada</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {requestType === 'LICITACION' && (
          <View style={styles.noticeBox}>
            <Ionicons name="time" size={18} color="#2563EB" style={styles.noticeIcon} />
            <Text style={styles.noticeText}>
              Recibirás propuestas durante las próximas 72 horas o hasta que aceptes un presupuesto.
            </Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Adjuntos (opcional)</Text>
          {attachments.length === 0 && (
            <View style={styles.attachmentEmptyBox}>
              <Ionicons name="image" size={28} color="#6B7280" />
              <Text style={styles.attachmentEmptyText}>
                Seleccioná imágenes desde tu galería para darle más contexto a tu solicitud.
              </Text>
            </View>
          )}

          {attachments.map((attachment, index) => (
            <View key={attachment.id} style={styles.attachmentCard}>
              <View style={styles.attachmentHeader}>
                <Text style={styles.attachmentTitle}>Imagen {index + 1}</Text>
                <TouchableOpacity onPress={() => handleRemoveAttachment(attachment.id)}>
                  <Ionicons name="trash" size={18} color="#B91C1C" />
                </TouchableOpacity>
              </View>
              <View style={styles.attachmentContent}>
                <View style={styles.attachmentPreviewWrapper}>
                  <Image source={{ uri: attachment.localUri }} style={styles.attachmentPreview} />
                  {attachment.uploading && (
                    <View style={styles.attachmentOverlay}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.attachmentOverlayText}>Subiendo...</Text>
                    </View>
                  )}
                </View>
                {attachment.uploadError && (
                  <View style={styles.attachmentErrorBox}>
                    <Ionicons name="warning" size={16} color="#B91C1C" />
                    <Text style={styles.attachmentErrorText}>{attachment.uploadError}</Text>
                    <TouchableOpacity
                      style={styles.retryButtonInline}
                      onPress={() => handleRetryAttachment(attachment.id)}
                    >
                      <Ionicons name="refresh" size={14} color="#FFFFFF" />
                      <Text style={styles.retryButtonInlineText}>Reintentar</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {attachment.s3_key && !attachment.uploadError && !attachment.uploading && (
                  <View style={styles.attachmentStatusRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                    <Text style={styles.attachmentStatusText}>Imagen lista</Text>
                  </View>
                )}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Descripción breve (opcional)"
                placeholderTextColor="#9CA3AF"
                value={attachment.caption}
                onChangeText={(value) => handleCaptionChange(attachment.id, value)}
              />
            </View>
          ))}

          {attachments.length < MAX_ATTACHMENTS && (
            <TouchableOpacity style={styles.addAttachmentButton} onPress={handlePickImage}>
              <Ionicons name="images" size={20} color="#2563EB" />
              <Text style={styles.addAttachmentButtonText}>Agregar desde galería</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.helperText}>Máximo {MAX_ATTACHMENTS} imágenes por solicitud.</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (isSubmitting || hasPendingUploads) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || addressList.length === 0 || hasPendingUploads}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Publicando solicitud...' : 'Publicar solicitud'}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <Modal visible={isSubmitting} transparent animationType="fade">
        <Spinner />
      </Modal>
    </View>
  );
};

export default RequestDetailScreen;