import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    ActivityIndicator,
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
import { useServiceRequest, useUpdateServiceRequest } from '../../hooks/useServiceRequests';

const MATCH_WINDOW_SECONDS = 5 * 60;

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

const formatPriceLabel = (price, currency = 'ARS') => {
    const numeric = Number(price);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return 'Precio a coordinar';
    }

    try {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numeric);
    } catch (error) {
        const formatted = numeric.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `$${formatted} ${currency}`.trim();
    }
};

const formatRatingLabel = (rating) => {
    const numeric = Number(rating);
    if (!numeric) {
        return null;
    }
    return numeric.toFixed(1).replace('.', ',');
};

export default function FastMatchScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const requestId = route.params?.requestId;
    const [nowMs, setNowMs] = useState(Date.now());
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const updateRequestMutation = useUpdateServiceRequest();
    const requestSummaryParam = route.params?.requestSummary ?? null;

    const {
        data: requestDetail,
        isLoading: isDetailLoading,
        isFetching: isDetailFetching,
        isRefetching: isDetailRefetching,
        isError: isDetailError,
        refetch: refetchDetail,
    } = useServiceRequest(requestId, {
        enabled: Boolean(requestId),
    });

    const requestData = requestDetail ?? requestSummaryParam;
    const serviceCreated = Boolean(requestData?.service);
    const requestTitle = requestData?.title ?? 'Solicitud FAST';
    const requestDescription = requestData?.description ?? 'Descripción no disponible.';
    const requestAddress = requestData?.address ?? 'Dirección pendiente.';
    const requestCreatedAt = requestData?.created_at ?? null;

    const createdAtIso = requestData?.created_at ?? null;

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

    const offers = useMemo(() => {
        if (!requestData) {
            return [];
        }

        if (!Array.isArray(requestData.proposals)) {
            return [];
        }

        return requestData.proposals;
    }, [requestData]);

    const isUpdating = updateRequestMutation.isPending;

    const handleAcceptOffer = useCallback(
        (proposal) => {
            if (!proposal || !requestId) {
                return;
            }

            if (serviceCreated) {
                Alert.alert(
                    'Servicio confirmado',
                    'Ya registraste un pago para esta solicitud.',
                );
                return;
            }

            const priceLabel = formatPriceLabel(
                proposal.quoted_price,
                proposal.currency,
            );

            navigation.navigate('Payment', {
                requestId,
                requestTitle,
                providerName:
                    proposal.provider_display_name || 'Prestador seleccionado',
                priceLabel,
                proposal,
                providerImageUrl: proposal.provider_image_url,
            });
        },
        [navigation, requestId, requestTitle, serviceCreated],
    );

    const renderOffer = useCallback(
        ({ item }) => {
            if (!item) {
                return null;
            }

            const avatarUri = item.provider_image_url;
            const ratingLabel = formatRatingLabel(item.provider_rating_avg);
            const reviewsCount = Number(item.provider_total_reviews ?? 0);
            const reviewsLabel = reviewsCount
                ? `${reviewsCount} ${reviewsCount === 1 ? 'reseña' : 'reseñas'}`
                : null;
            const priceLabel = formatPriceLabel(
                item.quoted_price,
                item.currency,
            );
            const notes = item.notes?.trim();
            const isDisabled = serviceCreated;

            return (
                <View style={styles.offerCard}>
                    {avatarUri ? (
                        <Image
                            source={{ uri: avatarUri }}
                            style={styles.offerAvatar}
                        />
                    ) : (
                        <View style={styles.offerAvatarFallback}>
                            <Ionicons name="briefcase-outline" size={22} color="#1f2937" />
                        </View>
                    )}
                    <View style={styles.offerContent}>
                        <Text style={styles.offerName} numberOfLines={1}>
                            {item.provider_display_name || 'Prestador FastServices'}
                        </Text>
                        <Text style={styles.offerTagline} numberOfLines={2}>
                            {notes || 'Oferta enviada hace instantes.'}
                        </Text>
                        <View style={styles.offerMetaRow}>
                            <Text style={styles.offerPrice}>{priceLabel}</Text>
                            {ratingLabel ? (
                                <View style={styles.offerRating}>
                                    <Ionicons name="star" size={16} color="#f4b331" />
                                    <Text style={styles.offerRatingText}>{ratingLabel}</Text>
                                    {reviewsLabel ? (
                                        <Text style={styles.offerRatingReviews}>{` · ${reviewsLabel}`}</Text>
                                    ) : null}
                                </View>
                            ) : (
                                <Text style={styles.offerNoRating}>Sin calificaciones</Text>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.acceptButton,
                            isDisabled && styles.acceptButtonDisabled,
                        ]}
                        activeOpacity={isDisabled ? 1 : 0.9}
                        onPress={() => handleAcceptOffer(item)}
                        disabled={isDisabled}
                    >
                        <Text
                            style={[
                                styles.acceptButtonText,
                                isDisabled && styles.acceptButtonTextDisabled,
                            ]}
                        >
                            {isDisabled ? 'Pago registrado' : 'Aceptar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        },
        [handleAcceptOffer, serviceCreated],
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

    const requestAttachments = Array.isArray(requestData?.attachments)
        ? requestData.attachments.filter(
            (item) => !!item?.public_url || !!item?.thumbnail_url,
        )
        : [];

    const listContentStyle = useMemo(
        () => [styles.listContent, !offers.length && styles.listContentEmpty],
        [offers.length],
    );

    const renderEmptyComponent = useMemo(() => {
        if (serviceCreated) {
            return (
                <View style={styles.emptyOffersWrapper}>
                    <Ionicons name="shield-checkmark-outline" size={28} color="#0f766e" />
                    <Text style={styles.emptyOffersText}>
                        Este servicio ya fue confirmado. No necesitás aceptar nuevas ofertas.
                    </Text>
                </View>
            );
        }

        if (isDetailLoading || isDetailFetching) {
            return (
                <View style={styles.emptyOffersWrapper}>
                    <ActivityIndicator size="small" color="#0f172a" />
                    <Text style={styles.emptyOffersText}>Cargando ofertas...</Text>
                </View>
            );
        }

        if (isDetailError) {
            return (
                <View style={styles.emptyOffersWrapper}>
                    <Ionicons name="warning-outline" size={26} color="#fb923c" />
                    <Text style={styles.emptyOffersText}>
                        No pudimos obtener las ofertas. Deslizá hacia abajo para reintentar.
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.emptyOffersWrapper}>
                <Ionicons name="flash-outline" size={26} color="#64748b" />
                <Text style={styles.emptyOffersText}>
                    Todavía no llegaron ofertas. Actualizá para ver nuevas propuestas.
                </Text>
            </View>
        );
    }, [isDetailError, isDetailFetching, isDetailLoading, serviceCreated]);

    const listFooter = useMemo(
        () => (
            <View style={styles.listFooterHint}>
                <Text style={styles.refreshHint}>
                    {serviceCreated
                        ? 'El servicio quedó confirmado. Guardamos esta pantalla por si necesitás revisar las ofertas.'
                        : 'Deslizá hacia abajo para actualizar las ofertas'}
                </Text>
            </View>
        ),
        [serviceCreated],
    );

    const handleRefresh = useCallback(() => {
        if (typeof refetchDetail === 'function') {
            refetchDetail();
        }
    }, [refetchDetail]);

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

            {serviceCreated ? (
                <View style={styles.serviceConfirmedBanner}>
                    <Ionicons name="shield-checkmark" size={18} color="#0f766e" style={styles.serviceConfirmedIcon} />
                    <Text style={styles.serviceConfirmedText}>
                        Ya confirmaste este servicio. Podés revisar las ofertas restantes si lo necesitás.
                    </Text>
                </View>
            ) : null}

            <FlatList
                data={offers}
                keyExtractor={(item, index) => (item?.id ? String(item.id) : `fast-offer-${index}`)}
                renderItem={renderOffer}
                contentContainerStyle={listContentStyle}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyComponent}
                ListFooterComponent={offers.length ? listFooter : null}
                refreshing={isDetailRefetching}
                onRefresh={handleRefresh}
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
