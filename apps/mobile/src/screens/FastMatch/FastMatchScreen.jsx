import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Image,
    FlatList,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import styles from './FastMatchScreen.styles';
import { useUpdateServiceRequest } from '../../hooks/useServiceRequests';

const MATCH_WINDOW_SECONDS = 5 * 60;

const MOCK_OFFERS = [];

const formatCountdown = (secondsRemaining) => {
    const safeSeconds = Number.isFinite(secondsRemaining)
        ? Math.max(0, secondsRemaining)
        : 0;
    const minutes = Math.floor(safeSeconds / 60)
        .toString()
        .padStart(2, '0');
    const seconds = Math.floor(safeSeconds % 60)
        .toString()
        .padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const computeRemainingSeconds = (createdAtIso, nowMs) => {
    if (!createdAtIso) {
        return MATCH_WINDOW_SECONDS;
    }

    const createdAt = new Date(createdAtIso);
    const createdAtMs = createdAt.getTime();
    if (Number.isNaN(createdAtMs)) {
        return MATCH_WINDOW_SECONDS;
    }

    const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000));
    return Math.max(0, MATCH_WINDOW_SECONDS - elapsedSeconds);
};

export default function FastMatchScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const requestId = route.params?.requestId;
    const [nowMs, setNowMs] = useState(Date.now());
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const updateRequestMutation = useUpdateServiceRequest();

    const requestSummary = route.params?.requestSummary ?? null;
    const requestTitle = requestSummary?.title ?? 'Solicitud FAST';
    const requestDescription = requestSummary?.description ?? 'Descripción no disponible.';
    const requestAddress = requestSummary?.address ?? 'Dirección pendiente.';
    const requestCreatedAt = requestSummary?.created_at ?? null;

    const createdAtIso = requestSummary?.created_at ?? null;

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNowMs(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, [createdAtIso]);

    const remainingSeconds = useMemo(
        () => computeRemainingSeconds(createdAtIso, nowMs),
        [createdAtIso, nowMs],
    );

    const formattedTime = useMemo(
        () => formatCountdown(remainingSeconds),
        [remainingSeconds],
    );

    const offers = Array.isArray(route.params?.offers) && route.params.offers.length
        ? route.params.offers
        : MOCK_OFFERS;

    const isUpdating = updateRequestMutation.isPending;

    const renderOffer = ({ item }) => (
        <View style={styles.offerCard}>
            <Image source={{ uri: item.avatar }} style={styles.offerAvatar} />
            <View style={styles.offerContent}>
                <Text style={styles.offerName}>{item.name}</Text>
                <Text style={styles.offerTagline}>{item.tagline}</Text>
                <View style={styles.offerMetaRow}>
                    <Text style={styles.offerPrice}>{`€${item.price.toFixed(2)}`}</Text>
                    <View style={styles.offerRating}>
                        <Ionicons name="star" size={16} color="#f4b331" />
                        <Text style={styles.offerRatingText}>{item.rating.toFixed(1)}</Text>
                    </View>
                </View>
            </View>
            <TouchableOpacity style={styles.acceptButton} activeOpacity={0.9}>
                <Text style={styles.acceptButtonText}>Aceptar</Text>
            </TouchableOpacity>
        </View>
    );

    const resolveErrorMessage = (error, fallbackMessage) => {
        const detail =
            error?.response?.data?.detail || error?.data?.detail || error?.message;
        return detail || fallbackMessage;
    };

    const handleCancelRequest = () => {
        if (!requestId || isUpdating) {
            return;
        }

        Alert.alert(
            'Cancelar solicitud',
            'Si cancelás la búsqueda rápida, la solicitud quedará cerrada. ¿Querés continuar?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: () => {
                        updateRequestMutation.mutate(
                            { requestId, data: { status: 'CANCELLED' } },
                            {
                                onSuccess: () => {
                                    setIsInfoModalVisible(false);
                                    Alert.alert(
                                        'Solicitud cancelada',
                                        'La solicitud fue cancelada exitosamente.',
                                        [
                                            {
                                                text: 'OK',
                                                onPress: () =>
                                                    navigation.navigate('Requests', {
                                                        animation: 'slide_from_left',
                                                    }),
                                            },
                                        ],
                                    );
                                },
                                onError: (error) => {
                                    Alert.alert(
                                        'No pudimos cancelar la solicitud',
                                        resolveErrorMessage(
                                            error,
                                            'Intentalo nuevamente en unos segundos.',
                                        ),
                                    );
                                },
                            },
                        );
                    },
                },
            ],
        );
    };

    const handleSwitchToLicitacion = () => {
        if (!requestId || remainingSeconds > 0 || isUpdating) {
            return;
        }

        updateRequestMutation.mutate(
            { requestId, data: { request_type: 'LICITACION' } },
            {
                onSuccess: () => {
                    setIsInfoModalVisible(false);
                    Alert.alert(
                        'Solicitud actualizada',
                        'Ahora recibirás ofertas durante las próximas 72 horas.',
                        [
                            {
                                text: 'OK',
                                onPress: () =>
                                    navigation.navigate('Requests', {
                                        animation: 'slide_from_left',
                                    }),
                            },
                        ],
                    );
                },
                onError: (error) => {
                    Alert.alert(
                        'No pudimos actualizar la solicitud',
                        resolveErrorMessage(
                            error,
                            'Intentalo nuevamente en unos segundos.',
                        ),
                    );
                },
            },
        );
    };

    const modalContainerStyle = {
        marginTop: insets.top + 12,
        paddingBottom: Math.max(insets.bottom, 24),
    };

    const requestAttachments = Array.isArray(requestSummary?.attachments)
        ? requestSummary.attachments.filter((item) => !!item?.public_url || !!item?.thumbnail_url)
        : [];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => setIsInfoModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="information-circle-outline" size={24} color="#1f2937" />
                    <Text style={styles.infoButtonText}>Ver solicitud</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statusWrapper}>
                <Image
                    source={require('../../../assets/icon.png')}
                    style={styles.brandLogo}
                    resizeMode="contain"
                />
                <Text style={styles.statusTitle}>Buscando prestadores...</Text>
                <Text style={styles.countdown}>{formattedTime}</Text>
                <Text style={styles.statusSubtitle}>
                    Te mostramos las primeras ofertas que van llegando.
                </Text>
            </View>

            <FlatList
                data={offers}
                keyExtractor={(item) => item.id}
                renderItem={renderOffer}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
            <View style={styles.footerWrapper}>
                <TouchableOpacity
                    style={[styles.cancelButton, isUpdating && styles.buttonDisabled]}
                    activeOpacity={isUpdating ? 1 : 0.9}
                    onPress={handleCancelRequest}
                    disabled={isUpdating}
                >
                    <Text
                        style={[styles.cancelButtonText, isUpdating && styles.cancelButtonTextDisabled]}
                    >
                        Cancelar solicitud
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.switchButton,
                        (remainingSeconds > 0 || isUpdating) && styles.switchButtonDisabled,
                        (remainingSeconds > 0 || isUpdating) && styles.buttonDisabled,
                    ]}
                    activeOpacity={remainingSeconds > 0 || isUpdating ? 1 : 0.9}
                    disabled={remainingSeconds > 0 || isUpdating}
                    onPress={handleSwitchToLicitacion}
                >
                    <Text
                        style={[
                            styles.switchButtonText,
                            (remainingSeconds > 0 || isUpdating) && styles.switchButtonTextDisabled,
                        ]}
                    >
                        Pasar a licitación
                    </Text>
                    {remainingSeconds > 0 ? (
                        <Text style={styles.switchHelperText}>
                            Disponible cuando termine la búsqueda rápida
                        </Text>
                    ) : (
                        <Text
                            style={[
                                styles.switchHelperText,
                                !isUpdating && styles.switchHelperTextReady,
                            ]}
                        >
                            Ahora podés ampliar la licitación
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <Modal
                visible={isInfoModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setIsInfoModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, modalContainerStyle]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detalle de la solicitud</Text>
                            <TouchableOpacity
                                onPress={() => setIsInfoModalVisible(false)}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={20} color="#111" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.modalContent}>
                            <View style={styles.modalSection}>
                                <Text style={styles.modalLabel}>Título</Text>
                                <Text style={styles.modalValue}>{requestTitle}</Text>
                            </View>
                            <View style={styles.modalSection}>
                                <Text style={styles.modalLabel}>Descripción</Text>
                                <Text style={styles.modalValue}>{requestDescription}</Text>
                            </View>
                            <View style={styles.modalSection}>
                                <Text style={styles.modalLabel}>Dirección</Text>
                                <Text style={styles.modalValue}>{requestAddress}</Text>
                            </View>
                            {requestCreatedAt && (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalLabel}>Creada</Text>
                                    <Text style={styles.modalValue}>{requestCreatedAt}</Text>
                                </View>
                            )}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalLabel}>Adjuntos</Text>
                                {requestAttachments.length > 0 ? (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.attachmentScroller}
                                    >
                                        {requestAttachments.map((attachment, index) => {
                                            const imageUri = attachment.thumbnail_url || attachment.public_url;
                                            return (
                                                <Image
                                                    key={`${attachment.s3_key || imageUri || index}`}
                                                    source={{ uri: imageUri }}
                                                    style={styles.modalAttachment}
                                                />
                                            );
                                        })}
                                    </ScrollView>
                                ) : (
                                    <Text style={styles.modalEmptyValue}>Sin imágenes adjuntas</Text>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
