import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    Image,
    ActivityIndicator,
    ScrollView,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import styles from './RehireRequestScreen.styles';
import { useCreateRehireRequest } from '../../hooks/useServiceRequests';
import { uploadServiceRequestImage } from '../../services/images.service';
import Spinner from '../../components/Spinner/Spinner';

const MAX_ATTACHMENTS = 6;
const MIN_DESCRIPTION_LENGTH = 20;

const RehireRequestScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const {
        serviceId,
        providerName,
        providerImage,
        providerRating,
        providerReviews,
    } = route.params ?? {};

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]);

    const createRehireMutation = useCreateRehireRequest();
    const isSubmitting = createRehireMutation.isPending;

    const hasPendingUploads = useMemo(
        () => attachments.some((a) => a.uploading),
        [attachments]
    );
    const hasUploadErrors = useMemo(
        () => attachments.some((a) => a.uploadError),
        [attachments]
    );

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const ensureMediaLibraryPermission = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                'Permiso requerido',
                'Necesitamos acceder a tu galería para adjuntar imágenes.'
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
            `rehire-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

        return {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            localUri: normalizedUri,
            fileName,
            mimeType,
            uploading: true,
            uploadError: null,
            s3_key: null,
            public_url: null,
        };
    };

    const startUploadForAttachment = async (attachmentMeta) => {
        setAttachments((prev) =>
            prev.map((a) =>
                a.id === attachmentMeta.id
                    ? { ...a, uploading: true, uploadError: null, s3_key: null, public_url: null }
                    : a
            )
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
                prev.map((a) =>
                    a.id === attachmentMeta.id
                        ? {
                            ...a,
                            uploading: false,
                            uploadError: null,
                            s3_key: uploadResult.s3_key,
                            public_url: uploadResult.public_url,
                        }
                        : a
                )
            );
        } catch (error) {
            const message = error?.message || 'No pudimos subir la imagen. Intentá nuevamente.';
            setAttachments((prev) =>
                prev.map((a) =>
                    a.id === attachmentMeta.id
                        ? { ...a, uploading: false, uploadError: message }
                        : a
                )
            );
        }
    };

    const handlePickImage = async () => {
        if (attachments.length >= MAX_ATTACHMENTS) {
            Alert.alert('Límite alcanzado', `Solo se permiten ${MAX_ATTACHMENTS} imágenes.`);
            return;
        }

        const hasPermission = await ensureMediaLibraryPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: false,
            allowsEditing: true,
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];
        const attachmentMeta = prepareAttachmentMeta(asset);

        setAttachments((prev) => [...prev, attachmentMeta]);
        startUploadForAttachment(attachmentMeta);
    };

    const handleRemoveAttachment = useCallback((attachmentId) => {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    }, []);

    const handleRetryAttachment = useCallback((attachmentId) => {
        const attachment = attachments.find((a) => a.id === attachmentId);
        if (attachment) {
            startUploadForAttachment(attachment);
        }
    }, [attachments]);

    const handleSubmit = useCallback(() => {
        const trimmedTitle = title.trim();
        const trimmedDescription = description.trim();

        if (trimmedTitle.length < 3) {
            Alert.alert(
                'Título requerido',
                'Ingresá un título para tu solicitud (mínimo 3 caracteres).'
            );
            return;
        }

        if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
            Alert.alert(
                'Descripción muy corta',
                `La descripción debe tener al menos ${MIN_DESCRIPTION_LENGTH} caracteres.`
            );
            return;
        }

        if (hasPendingUploads) {
            Alert.alert('Imágenes en proceso', 'Esperá a que terminen de subirse las imágenes.');
            return;
        }

        if (hasUploadErrors) {
            Alert.alert(
                'Error en imágenes',
                'Revisá las imágenes con error o eliminá las que fallaron.'
            );
            return;
        }

        const sanitizedAttachments = attachments
            .filter((a) => a.s3_key)
            .map((a, index) => ({
                s3_key: a.s3_key,
                public_url: a.public_url || undefined,
                sort_order: index,
            }));

        const payload = {
            service_id: serviceId,
            title: trimmedTitle,
            description: trimmedDescription,
            attachments: sanitizedAttachments,
        };

        createRehireMutation.mutate(payload, {
            onSuccess: () => {
                Alert.alert(
                    '¡Solicitud enviada!',
                    'Tu solicitud de recontratación fue enviada al profesional. Te notificaremos cuando responda.',
                    [
                        {
                            text: 'Aceptar',
                        },
                    ],
                    { cancelable: false }
                );
                // Navegar a Mis Solicitudes
                navigation.navigate('Main', { screen: 'MyRequests' });
            },
            onError: (error) => {
                const status = error?.status ?? error?.response?.status;
                const detail =
                    error?.message ||
                    error?.data?.detail ||
                    error?.response?.data?.detail ||
                    'No pudimos crear la solicitud. Intentalo nuevamente.';
                Alert.alert('Error', `${detail}${status ? ` (HTTP ${status})` : ''}`);
            },
        });
    }, [
        title,
        description,
        attachments,
        serviceId,
        hasPendingUploads,
        hasUploadErrors,
        createRehireMutation,
        navigation,
    ]);

    const titleLength = title.trim().length;
    const descriptionLength = description.trim().length;
    const canSubmit =
        titleLength >= 3 &&
        descriptionLength >= MIN_DESCRIPTION_LENGTH &&
        !hasPendingUploads &&
        !hasUploadErrors &&
        !isSubmitting;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Recontratar profesional</Text>
                    <View style={styles.iconButtonPlaceholder} />
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.providerCard}>
                        <Text style={styles.providerCardLabel}>Profesional</Text>
                        <View style={styles.providerContent}>
                            <Image
                                source={{
                                    uri:
                                        providerImage ||
                                        'https://dthezntil550i.cloudfront.net/f4/latest/f41908291942413280009640715/1280_960/1b2d9510-d66d-43a2-971a-cfcbb600e7fe.png',
                                }}
                                style={styles.providerAvatar}
                            />
                            <View style={styles.providerInfoColumn}>
                                <Text style={styles.providerName}>
                                    {providerName || 'Profesional'}
                                </Text>
                                <View style={styles.providerStatsRow}>
                                    <Ionicons name="star" size={14} color="#F59E0B" />
                                    <Text style={styles.ratingText}>
                                        {providerRating > 0
                                            ? Number(providerRating).toFixed(1)
                                            : 'Nuevo'}
                                    </Text>
                                    {providerReviews > 0 && (
                                        <Text style={styles.reviewsText}>
                                            ({providerReviews} reseñas)
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.rehireBadge}>
                                    <Text style={styles.rehireBadgeText}>RECONTRATACIÓN</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Título *</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ej: Reparación de cañería en baño"
                            placeholderTextColor="#9CA3AF"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={150}
                        />
                        <Text style={styles.helperText}>
                            Escribí un título claro que resuma lo que necesitás.
                        </Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Descripción</Text>
                        <TextInput
                            style={[styles.textInput, styles.multilineInput]}
                            placeholder="Describí el trabajo que necesitás. Incluí detalles, materiales, urgencia, etc."
                            placeholderTextColor="#9CA3AF"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                        <Text style={styles.charCount}>
                            {descriptionLength} / {MIN_DESCRIPTION_LENGTH} mín.
                        </Text>
                        <Text style={styles.helperText}>
                            Mínimo {MIN_DESCRIPTION_LENGTH} caracteres. Cuanta más información brindes,
                            mejor podrá responder el profesional.
                        </Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Fotos (opcional)</Text>
                        {attachments.length === 0 ? (
                            <View style={styles.attachmentEmptyBox}>
                                <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                                <Text style={styles.attachmentEmptyText}>
                                    Agregá fotos para mostrar mejor lo que necesitás
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.attachmentsGrid}>
                                {attachments.map((attachment) => (
                                    <View key={attachment.id} style={styles.attachmentCard}>
                                        <Image
                                            source={{ uri: attachment.localUri }}
                                            style={styles.attachmentPreview}
                                        />
                                        {attachment.uploading && (
                                            <View style={styles.attachmentOverlay}>
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                                <Text style={styles.attachmentOverlayText}>
                                                    Subiendo...
                                                </Text>
                                            </View>
                                        )}
                                        {!attachment.uploading && !attachment.uploadError && attachment.s3_key && (
                                            <View style={styles.attachmentStatusIcon}>
                                                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                            </View>
                                        )}
                                        {attachment.uploadError && (
                                            <TouchableOpacity
                                                style={styles.attachmentErrorIcon}
                                                onPress={() => handleRetryAttachment(attachment.id)}
                                            >
                                                <Ionicons name="refresh" size={14} color="#FFFFFF" />
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => handleRemoveAttachment(attachment.id)}
                                        >
                                            <Ionicons name="close" size={16} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {attachments.length < MAX_ATTACHMENTS && (
                            <TouchableOpacity
                                style={styles.addAttachmentButton}
                                onPress={handlePickImage}
                            >
                                <Ionicons name="images-outline" size={20} color="#4F46E5" />
                                <Text style={styles.addAttachmentButtonText}>
                                    Agregar desde galería
                                </Text>
                            </TouchableOpacity>
                        )}
                        <Text style={styles.helperText}>
                            Máximo {MAX_ATTACHMENTS} imágenes.
                        </Text>
                    </View>

                    <View style={styles.infoBanner}>
                        <Ionicons name="information-circle" size={20} color="#92400E" />
                        <Text style={styles.infoBannerText}>
                            Tu solicitud será enviada directamente al profesional. Cuando responda
                            con un presupuesto, podrás aceptarlo o rechazarlo como siempre.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            !canSubmit && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                    >
                        <Text style={styles.submitButtonText}>
                            {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                <Modal visible={isSubmitting} transparent animationType="fade">
                    <Spinner />
                </Modal>
            </View>
        </SafeAreaView>
    );
};

export default RehireRequestScreen;


