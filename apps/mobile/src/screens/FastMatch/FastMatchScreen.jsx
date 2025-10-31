import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    ActivityIndicator,
    Image,
    Modal,
    RefreshControl,
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

const parseIsoDate = (isoDate) => {
    if (!isoDate) {
        return null;
    }

    if (isoDate instanceof Date) {
        return Number.isNaN(isoDate.getTime()) ? null : isoDate;
    }

    if (typeof isoDate !== 'string') {
        return null;
    }

    const trimmed = isoDate.trim();
    if (!trimmed) {
        return null;
    }

    const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed);
    const normalized = hasTimezone ? trimmed : `${trimmed}Z`;
    const parsed = new Date(normalized);

    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }

    const fallback = new Date(trimmed);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const formatLongDate = (date) => {
    if (!date) {
        return null;
    }

    return date.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
    });
};

const describeDaysUntil = (targetDate, nowMs) => {
    if (!targetDate) {
        return null;
    }

    const diffMs = targetDate.getTime() - nowMs;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
        return null;
    }

    if (diffDays === 1) {
        return 'En 1 día';
    }

    return `En ${diffDays} días`;
};

export default function FastMatchScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const requestId = route.params?.requestId;
    const [nowMs, setNowMs] = useState(Date.now());
    const [isProposalModalVisible, setIsProposalModalVisible] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState(null);
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
    const requestAttachments = Array.isArray(requestData?.attachments)
        ? requestData.attachments.filter(
            (item) => item?.public_url || item?.thumbnail_url,
        )
        : [];

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

    const isCountdownExpired = remainingSeconds <= 0;
    const countdownCaption = isCountdownExpired ? 'FAST finalizado' : 'FAST activo';

    const statusCopy = useMemo(() => {
        if (serviceCreated) {
            return {
                title: 'Servicio confirmado',
                message:
                    'Registraste un pago para esta solicitud. Guardamos las ofertas por si necesitás consultarlas.',
                hint: 'Recordá que siempre podés revisar el historial desde la pantalla de Solicitudes.',
            };
        }

        const hint =
            remainingSeconds > 0
                ? 'Mientras esté activo el Fast Match los prestadores tienen prioridad para cotizar.'
                : 'Podés pasar a licitación para seguir recibiendo propuestas hasta 72 horas.';

        return {
            title: 'Buscando prestadores...',
            message: 'Te mostramos las primeras propuestas que llegan en tiempo real.',
            hint,
        };
    }, [serviceCreated, remainingSeconds]);

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

    const handleShowProposalDetails = useCallback((proposal) => {
        if (!proposal) {
            return;
        }
        setSelectedProposal(proposal);
        setIsProposalModalVisible(true);
    }, []);

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

    const renderOfferCard = useCallback(
        (offer) => {
            if (!offer) {
                return null;
            }

            const ratingLabel = formatRatingLabel(offer.provider_rating_avg);
            const reviewsCount = Number(offer.provider_total_reviews ?? 0);
            const reviewsLabel = reviewsCount
                ? `${reviewsCount} ${reviewsCount === 1 ? 'reseña' : 'reseñas'}`
                : null;
            const priceLabel = formatPriceLabel(offer.quoted_price, offer.currency);
            const notes = offer.notes?.trim();
            const hasReputation = Boolean(ratingLabel || reviewsLabel);
            const reputationText = (() => {
                if (ratingLabel) {
                    return reviewsLabel ? `${ratingLabel} • ${reviewsLabel}` : ratingLabel;
                }
                if (reviewsLabel) {
                    return reviewsLabel;
                }
                return 'Sin calificaciones';
            })();
            const scheduleStart = parseIsoDate(offer.proposed_start_at);
            const scheduleLabel = formatLongDate(scheduleStart);
            const scheduleRelative = describeDaysUntil(scheduleStart, nowMs);
            const timingLabel = scheduleLabel
                ? scheduleRelative
                    ? `${scheduleLabel} · ${scheduleRelative}`
                    : scheduleLabel
                : scheduleRelative || 'Coordiná la fecha con el prestador';
            const isDisabled = serviceCreated;

            return (
                <View
                    style={[
                        styles.proposalCard,
                        isDisabled && styles.proposalCardDisabled,
                    ]}
                >
                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => handleShowProposalDetails(offer)}
                    >
                        <View style={styles.proposalHeader}>
                            <Text style={styles.proposalProvider} numberOfLines={1}>
                                {offer.provider_display_name || 'Prestador FastServices'}
                            </Text>
                            <Text style={styles.proposalPrice}>{priceLabel}</Text>
                        </View>
                        <View style={styles.proposalMetaRow}>
                            <Ionicons
                                name={ratingLabel ? 'star' : 'star-outline'}
                                size={16}
                                color={ratingLabel ? '#f59e0b' : '#94a3b8'}
                                style={styles.proposalMetaIcon}
                            />
                            <Text
                                style={[
                                    styles.proposalMetaText,
                                    !hasReputation && styles.proposalMetaTextMuted,
                                ]}
                                numberOfLines={1}
                            >
                                {reputationText}
                            </Text>
                        </View>
                        {notes ? (
                            <Text style={styles.proposalNotes} numberOfLines={2}>
                                {notes}
                            </Text>
                        ) : null}
                        <View style={styles.proposalMetaRow}>
                            <Ionicons
                                name="time-outline"
                                size={16}
                                color="#0369a1"
                                style={styles.proposalMetaIcon}
                            />
                            <Text style={styles.proposalMetaText} numberOfLines={1}>
                                {timingLabel}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.proposalFooterRow}>
                        <TouchableOpacity
                            style={[
                                styles.proposalPrimaryButton,
                                isDisabled && styles.proposalPrimaryButtonDisabled,
                            ]}
                            activeOpacity={isDisabled ? 1 : 0.9}
                            onPress={() => handleAcceptOffer(offer)}
                            disabled={isDisabled}
                        >
                            <Ionicons
                                name={isDisabled ? 'shield-checkmark-outline' : 'flash-outline'}
                                size={18}
                                color={isDisabled ? '#0f766e' : '#ecfeff'}
                                style={styles.proposalPrimaryIcon}
                            />
                            <Text
                                style={[
                                    styles.proposalPrimaryButtonText,
                                    isDisabled && styles.proposalPrimaryButtonTextDisabled,
                                ]}
                            >
                                {isDisabled ? 'Pago registrado' : 'Aceptar propuesta'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        },
        [handleAcceptOffer, handleShowProposalDetails, nowMs, serviceCreated],
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
                                    Alert.alert(
                                        'Solicitud cancelada',
                                        'La solicitud fue cancelada exitosamente.',
                                        [
                                            {
                                                text: 'OK',
                                                onPress: () =>
                                                    navigation.navigate('Main', {
                                                        screen: 'HomePage',
                                                        params: { animation: 'slide_from_right' }
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
        if (!requestId || serviceCreated || remainingSeconds > 0 || isUpdating) {
            return;
        }

        updateRequestMutation.mutate(
            { requestId, data: { request_type: 'LICITACION' } },
            {
                onSuccess: () => {
                    Alert.alert(
                        'Solicitud actualizada',
                        'Ahora recibirás ofertas durante las próximas 72 horas.',
                        [
                            {
                                text: 'OK',
                                onPress: () =>
                                    navigation.navigate('Main', {
                                        screen: 'HomePage',
                                        params: { animation: 'slide_from_right' }
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

    const closeProposalModal = useCallback(() => {
        setIsProposalModalVisible(false);
        setSelectedProposal(null);
    }, []);

    const selectedProposalMeta = useMemo(() => {
        if (!selectedProposal) {
            return null;
        }

        const scheduleStart = parseIsoDate(selectedProposal.proposed_start_at);
        const scheduleEnd = parseIsoDate(selectedProposal.proposed_end_at);
        const validUntil = parseIsoDate(selectedProposal.valid_until);

        const scheduleLabel = formatLongDate(scheduleStart);
        const scheduleRelative = describeDaysUntil(scheduleStart, nowMs);

        return {
            providerName:
                selectedProposal.provider_display_name || 'Prestador FastServices',
            priceLabel: formatPriceLabel(
                selectedProposal.quoted_price,
                selectedProposal.currency,
            ),
            ratingLabel: formatRatingLabel(selectedProposal.provider_rating_avg),
            reviewsLabel: (() => {
                const reviewsCount = Number(selectedProposal.provider_total_reviews ?? 0);
                if (!reviewsCount) {
                    return null;
                }
                return `${reviewsCount} ${reviewsCount === 1 ? 'reseña' : 'reseñas'}`;
            })(),
            scheduleLabel,
            scheduleRelative,
            scheduleEnd: formatLongDate(scheduleEnd),
            validUntil: formatLongDate(validUntil),
            notes: selectedProposal.notes?.trim() || null,
            avatar: selectedProposal.provider_image_url || null,
        };
    }, [nowMs, selectedProposal]);

    const offersFallback = useMemo(() => {
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

    const offersCount = offers.length;

    const offersList = useMemo(() => {
        if (!offersCount) {
            return offersFallback;
        }

        return offers.map((offer, index) => {
            const key = offer?.id ? String(offer.id) : `fast-offer-${index}`;
            const card = renderOfferCard(offer);
            if (!card) {
                return null;
            }
            return (
                <View key={key} style={styles.offerItemWrapper}>
                    {card}
                </View>
            );
        });
    }, [offers, offersCount, offersFallback, renderOfferCard]);

    const offersFooter = useMemo(() => {
        if (!offersCount) {
            return null;
        }

        return (
            <View style={styles.offersFooterHint}>
                <Text style={styles.refreshHint}>
                    {serviceCreated
                        ? 'El servicio quedó confirmado. Guardamos esta pantalla por si necesitás revisar las ofertas.'
                        : 'Deslizá hacia abajo para actualizar las ofertas'}
                </Text>
            </View>
        );
    }, [offersCount, serviceCreated]);

    const handleRefresh = useCallback(() => {
        if (typeof refetchDetail === 'function') {
            refetchDetail();
        }
    }, [refetchDetail]);

    const isSwitchDisabled = serviceCreated || remainingSeconds > 0 || isUpdating;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={(
                    <RefreshControl
                        refreshing={isDetailRefetching}
                        onRefresh={handleRefresh}
                        tintColor="#0f172a"
                        colors={["#0f172a"]}
                    />
                )}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={22} color="#111" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrapper}>
                        <Text style={styles.headerTitle}>FAST MATCH</Text>
                        <Text style={styles.headerSubtitle} numberOfLines={2}>
                            {requestTitle}
                        </Text>
                    </View>
                </View>

                <View style={styles.statusCard}>
                    <View style={styles.statusTopRow}>
                        <View style={styles.statusBadge}>
                            <Ionicons
                                name="flash-outline"
                                size={16}
                                color="#0369a1"
                                style={styles.statusBadgeIcon}
                            />
                            <Text style={styles.statusBadgeText}>Fast Match</Text>
                        </View>
                        <View style={styles.countdownWrapper}>
                            <Text
                                style={[
                                    styles.countdownValue,
                                    isCountdownExpired && styles.countdownValueExpired,
                                ]}
                            >
                                {formattedTime}
                            </Text>
                            <Text style={styles.countdownCaption}>{countdownCaption}</Text>
                        </View>
                    </View>
                    <View style={styles.statusBodyRow}>
                        <Image
                            source={require('../../../assets/icon.png')}
                            style={styles.brandMark}
                            resizeMode="contain"
                        />
                        <View style={styles.statusHeaderCopy}>
                            <Text style={styles.statusTitle}>{statusCopy.title}</Text>
                            <Text style={styles.statusDescription}>{statusCopy.message}</Text>
                        </View>
                    </View>
                    <Text style={styles.statusHint}>{statusCopy.hint}</Text>
                </View>

                <View style={styles.requestInfoCard}>
                    <View style={styles.requestInfoHeader}>
                        <Text style={styles.requestInfoTitle}>Detalle de la solicitud</Text>
                    </View>
                    <Text style={styles.requestName} numberOfLines={2}>
                        {requestTitle}
                    </Text>
                    <Text style={styles.requestInfoDescription}>{requestDescription}</Text>
                    {requestAddress ? (
                        <View style={styles.requestInfoMetaRow}>
                            <Ionicons
                                name="location-outline"
                                size={16}
                                color="#0369a1"
                                style={styles.requestInfoMetaIcon}
                            />
                            <Text style={styles.requestInfoMetaText}>{requestAddress}</Text>
                        </View>
                    ) : null}
                    {requestAttachments.length ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.attachmentsScroll}
                        >
                            {requestAttachments.map((attachment, index) => {
                                const imageUri = attachment.thumbnail_url || attachment.public_url;
                                if (!imageUri) {
                                    return null;
                                }

                                return (
                                    <Image
                                        key={`${attachment.s3_key || imageUri || index}`}
                                        source={{ uri: imageUri }}
                                        style={styles.attachmentImage}
                                    />
                                );
                            })}
                        </ScrollView>
                    ) : null}
                </View>

                {serviceCreated ? (
                    <View style={styles.serviceConfirmedBanner}>
                        <Ionicons name="shield-checkmark" size={18} color="#0f766e" style={styles.serviceConfirmedIcon} />
                        <Text style={styles.serviceConfirmedText}>
                            Ya confirmaste este servicio. Podés revisar las ofertas restantes si lo necesitás.
                        </Text>
                    </View>
                ) : null}

                <View style={styles.offersSection}>
                    <View style={styles.offersHeaderRow}>
                        <View style={styles.offersHeaderCopy}>
                            <Text style={styles.offersTitle}>Ofertas recibidas</Text>
                            <Text style={styles.offersSubtitle}>
                                Elegí y confirmá al instante mientras el FAST está activo.
                            </Text>
                        </View>
                        <View style={styles.offersBadge}>
                            <Ionicons name="sparkles-outline" size={16} color="#0369a1" />
                            <Text style={styles.offersBadgeText}>{offersCount}</Text>
                        </View>
                    </View>
                    <View style={styles.offersList}>{offersList}</View>
                </View>

                {offersFooter}

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
                            isSwitchDisabled && styles.switchButtonDisabled,
                            isSwitchDisabled && styles.buttonDisabled,
                        ]}
                        activeOpacity={isSwitchDisabled ? 1 : 0.9}
                        disabled={isSwitchDisabled}
                        onPress={handleSwitchToLicitacion}
                    >
                        <Text
                            style={[
                                styles.switchButtonText,
                                isSwitchDisabled && styles.switchButtonTextDisabled,
                            ]}
                        >
                            Pasar a licitación
                        </Text>
                        {serviceCreated ? (
                            <Text style={styles.switchHelperText}>
                                El servicio FAST ya está confirmado
                            </Text>
                        ) : remainingSeconds > 0 ? (
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
            </ScrollView>

            <Modal
                visible={isProposalModalVisible}
                animationType="slide"
                transparent
                onRequestClose={closeProposalModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, modalContainerStyle]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detalle de la propuesta</Text>
                            <TouchableOpacity
                                onPress={closeProposalModal}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={20} color="#111" />
                            </TouchableOpacity>
                        </View>
                        {selectedProposal && selectedProposalMeta ? (
                            <ScrollView contentContainerStyle={styles.modalContent}>
                                <View style={styles.modalProviderRow}>
                                    {selectedProposalMeta.avatar ? (
                                        <Image
                                            source={{ uri: selectedProposalMeta.avatar }}
                                            style={styles.modalProviderAvatar}
                                        />
                                    ) : (
                                        <View style={styles.modalProviderAvatarFallback}>
                                            <Ionicons name="person-circle-outline" size={44} color="#0f172a" />
                                        </View>
                                    )}
                                    <View style={styles.modalProviderInfo}>
                                        <Text style={styles.modalProviderName} numberOfLines={2}>
                                            {selectedProposalMeta.providerName}
                                        </Text>
                                        <View style={styles.modalProviderMetaRow}>
                                            {selectedProposalMeta.ratingLabel ? (
                                                <View style={styles.modalChip}>
                                                    <Ionicons name="star" size={14} color="#f59e0b" />
                                                    <Text style={styles.modalChipText}>{selectedProposalMeta.ratingLabel}</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.modalChipMuted}>
                                                    <Ionicons name="star-outline" size={14} color="#94a3b8" />
                                                    <Text style={styles.modalChipMutedText}>Sin calificaciones</Text>
                                                </View>
                                            )}
                                            {selectedProposalMeta.reviewsLabel ? (
                                                <View style={styles.modalChipSecondary}>
                                                    <Ionicons name="chatbubble-ellipses-outline" size={14} color="#0f172a" />
                                                    <Text style={styles.modalChipSecondaryText}>{selectedProposalMeta.reviewsLabel}</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalLabel}>Precio cotizado</Text>
                                    <Text style={styles.modalValue}>{selectedProposalMeta.priceLabel}</Text>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalLabel}>Fecha estimada</Text>
                                    <Text style={styles.modalValue}>
                                        {selectedProposalMeta.scheduleLabel || 'A coordinar'}
                                    </Text>
                                    {selectedProposalMeta.scheduleRelative ? (
                                        <Text style={styles.modalHelper}>{selectedProposalMeta.scheduleRelative}</Text>
                                    ) : null}
                                </View>

                                {selectedProposalMeta.scheduleEnd ? (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalLabel}>Fin estimado</Text>
                                        <Text style={styles.modalValue}>{selectedProposalMeta.scheduleEnd}</Text>
                                    </View>
                                ) : null}

                                {selectedProposalMeta.validUntil ? (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalLabel}>Vigencia</Text>
                                        <Text style={styles.modalValue}>{selectedProposalMeta.validUntil}</Text>
                                    </View>
                                ) : null}

                                {selectedProposalMeta.notes ? (
                                    <View style={styles.modalNotesBox}>
                                        <Text style={styles.modalNotesLabel}>Detalle adicional</Text>
                                        <Text style={styles.modalNotesText}>{selectedProposalMeta.notes}</Text>
                                    </View>
                                ) : null}
                            </ScrollView>
                        ) : (
                            <View style={styles.modalEmptyState}>
                                <Ionicons name="information-circle-outline" size={36} color="#64748b" />
                                <Text style={styles.modalEmptyStateText}>
                                    Seleccioná una propuesta para ver los detalles completos.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
