import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    Alert,
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
import styles from './LicitacionScreen.styles';
import { useActiveServiceRequests, useUpdateServiceRequest } from '../../hooks/useServiceRequests';

const TIMER_TICK_INTERVAL_MS = 60 * 1000;

const computeRemainingMs = (deadlineIso, nowMs) => {
    if (!deadlineIso) {
        return 0;
    }

    const deadlineDate = new Date(deadlineIso);
    const deadlineMs = deadlineDate.getTime();
    if (Number.isNaN(deadlineMs)) {
        return 0;
    }

    return Math.max(0, deadlineMs - nowMs);
};

const formatRemainingTime = (remainingMs, isClosed) => {
    if (isClosed || remainingMs <= 0) {
        return 'Finalizada';
    }

    const totalMinutes = Math.floor(remainingMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) {
        return `${minutes} min`;
    }

    return `${hours} h ${minutes.toString().padStart(2, '0')} m`;
};

const formatCurrencyLabel = (amount, currency) => {
    const numericValue = Number(amount ?? 0) || 0;
    try {
        const formatted = numericValue.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `$${formatted} ${currency || 'ARS'}`;
    } catch (error) {
        return `$${numericValue.toFixed(2)} ${currency || 'ARS'}`;
    }
};

const parseIsoDate = (isoDate) => {
    if (!isoDate) {
        return null;
    }

    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
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
        return 'Programado para hoy';
    }

    if (diffDays === 1) {
        return 'Falta 1 día';
    }

    return `Faltan ${diffDays} días`;
};

const sortProposals = (proposals) => {
    if (!Array.isArray(proposals)) {
        return [];
    }

    return [...proposals].sort((a, b) => {
        const priceA = Number(a?.quoted_price ?? 0);
        const priceB = Number(b?.quoted_price ?? 0);
        if (priceA === priceB) {
            return Number(a?.id ?? 0) - Number(b?.id ?? 0);
        }
        return priceA - priceB;
    });
};

export default function LicitacionScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const requestId = route.params?.requestId;
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const [isOffersModalVisible, setIsOffersModalVisible] = useState(false);
    const [requestData, setRequestData] = useState(
        route.params?.requestSummary ?? {},
    );
    const [nowMs, setNowMs] = useState(Date.now());
    const [hasAutoClosed, setHasAutoClosed] = useState(false);
    const updateRequestMutation = useUpdateServiceRequest();

    const requestTitle = requestData?.title ?? 'Solicitud en licitación';
    const requestDescription = requestData?.description ?? 'Descripción no disponible.';
    const requestAddress = requestData?.address ?? 'Dirección pendiente.';
    const requestCreatedAt = requestData?.created_at ?? null;
    const biddingDeadlineIso = requestData?.bidding_deadline ?? null;
    const currentStatus = requestData?.status ?? 'PUBLISHED';
    const shouldSyncActive = currentStatus !== 'CLOSED' && currentStatus !== 'CANCELLED';
    const {
        data: activeRequestsData,
        refetch: refetchActiveRequests,
        isRefetching: isActiveRefetching,
    } = useActiveServiceRequests({ enabled: shouldSyncActive });
    const proposals = useMemo(() => sortProposals(requestData?.proposals), [requestData?.proposals]);
    const proposalCount = requestData?.proposal_count ?? proposals.length;
    const isUpdating = updateRequestMutation.isPending;

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNowMs(Date.now());
        }, TIMER_TICK_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, []);

    const remainingMs = useMemo(
        () => computeRemainingMs(biddingDeadlineIso, nowMs),
        [biddingDeadlineIso, nowMs],
    );

    const isClosed = useMemo(
        () => currentStatus === 'CLOSED',
        [currentStatus],
    );

    const isCancelled = useMemo(
        () => currentStatus === 'CANCELLED',
        [currentStatus],
    );

    const canCloseManually = !isClosed && !isCancelled && proposalCount >= 3;

    const formattedRemaining = useMemo(() => {
        if (isCancelled) {
            return 'Cancelada';
        }
        return formatRemainingTime(remainingMs, isClosed);
    }, [remainingMs, isClosed, isCancelled]);

    const winnerProposal = useMemo(
        () => (proposals.length > 0 ? proposals[0] : null),
        [proposals],
    );

    const winnerPriceLabel = useMemo(() => {
        if (!winnerProposal) {
            return null;
        }
        return formatCurrencyLabel(winnerProposal.quoted_price, winnerProposal.currency);
    }, [winnerProposal]);

    const winnerScheduleLabel = useMemo(() => {
        if (!winnerProposal) {
            return 'Fecha a coordinar con el prestador.';
        }

        const startDate = parseIsoDate(winnerProposal.proposed_start_at);
        const baseLabel = formatLongDate(startDate);
        const relative = describeDaysUntil(startDate, nowMs);

        if (baseLabel && relative) {
            return `${baseLabel} · ${relative}`;
        }

        return baseLabel || relative || 'Fecha a coordinar con el prestador.';
    }, [winnerProposal, nowMs]);

    const winnerValidUntilLabel = useMemo(() => {
        if (!winnerProposal?.valid_until) {
            return null;
        }

        const date = parseIsoDate(winnerProposal.valid_until);
        const formatted = formatLongDate(date);
        if (!formatted) {
            return null;
        }

        return `Oferta válida hasta ${formatted}`;
    }, [winnerProposal?.valid_until]);

    const winnerEndLabel = useMemo(() => {
        if (!winnerProposal?.proposed_end_at) {
            return null;
        }

        const endDate = parseIsoDate(winnerProposal.proposed_end_at);
        const formatted = formatLongDate(endDate);
        if (!formatted) {
            return null;
        }

        return `Duración estimada hasta ${formatted}`;
    }, [winnerProposal?.proposed_end_at]);

    const winnerReputation = useMemo(() => {
        const rating = Number(winnerProposal?.provider_rating_avg ?? 0);
        const reviews = Number(winnerProposal?.provider_total_reviews ?? 0);

        if (rating > 0) {
            const formattedRating = rating.toFixed(1).replace('.', ',');
            const reviewsLabel = reviews === 1 ? '1 reseña' : `${reviews} reseñas`;
            return {
                ratingLabel: `${formattedRating} / 5`,
                reviewsLabel,
            };
        }

        return {
            ratingLabel: 'Sin calificaciones',
            reviewsLabel: null,
        };
    }, [winnerProposal?.provider_rating_avg, winnerProposal?.provider_total_reviews]);

    const winnerNotes = winnerProposal?.notes?.trim();

    useEffect(() => {
        if (isClosed || isCancelled || remainingMs > 0 || hasAutoClosed) {
            return;
        }

        if (!requestId) {
            return;
        }

        setHasAutoClosed(true);
        performCloseLicitacion({ isAuto: true });
    }, [isClosed, isCancelled, remainingMs, hasAutoClosed, requestId, performCloseLicitacion]);

    const resolveErrorMessage = (error, fallbackMessage) => {
        const detail =
            error?.response?.data?.detail || error?.data?.detail || error?.message;
        return detail || fallbackMessage;
    };

    const updateLocalRequest = useCallback((updatedPayload) => {
        if (!updatedPayload) {
            return;
        }

        setRequestData((prev) => ({
            ...prev,
            ...updatedPayload,
        }));
    }, []);

    const performCloseLicitacion = useCallback(
        ({ isAuto = false } = {}) => {
            if (!requestId) {
                return;
            }

            updateRequestMutation.mutate(
                { requestId, data: { status: 'CLOSED' } },
                {
                    onSuccess: (updatedRequest) => {
                        setIsInfoModalVisible(false);
                        updateLocalRequest({
                            ...updatedRequest,
                            status: updatedRequest?.status ?? 'CLOSED',
                            proposal_count: updatedRequest?.proposal_count ?? 0,
                            proposals: Array.isArray(updatedRequest?.proposals)
                                ? updatedRequest.proposals
                                : [],
                        });

                        if (isAuto) {
                            Alert.alert(
                                'Licitación finalizada',
                                'La licitación se cerró automáticamente al cumplirse el plazo de 72 horas.',
                                [
                                    {
                                        text: 'Entendido',
                                    },
                                ],
                            );
                        } else {
                            Alert.alert(
                                'Licitación cerrada',
                                'Revisá las ofertas y elegí al prestador que mejor se adapte a tu necesidad.',
                            );
                        }
                    },
                    onError: (error) => {
                        const message = resolveErrorMessage(
                            error,
                            'No pudimos cerrar la licitación. Intentá nuevamente.',
                        );
                        Alert.alert('Error al cerrar la licitación', message);
                        setHasAutoClosed(false);
                    },
                },
            );
        },
        [requestId, updateLocalRequest, updateRequestMutation],
    );

    const handleCloseRequestPress = () => {
        if (!canCloseManually || isUpdating) {
            return;
        }

        Alert.alert(
            'Cerrar licitación',
            'Vas a finalizar la licitación y revelar las ofertas recibidas. ¿Querés continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sí, cerrar',
                    style: 'default',
                    onPress: () => performCloseLicitacion({ isAuto: false }),
                },
            ],
        );
    };

    const handleCancelRequest = () => {
        if (!requestId || isUpdating || isCancelled) {
            return;
        }

        Alert.alert(
            'Cancelar licitación',
            'Si cancelás esta licitación dejarás de recibir propuestas. ¿Querés continuar?',
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
                                    updateLocalRequest({ status: 'CANCELLED' });
                                    Alert.alert(
                                        'Solicitud cancelada',
                                        'La licitación se canceló correctamente.',
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
                                        'No pudimos cancelar la licitación',
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

    const handleGoToPay = () => {
        if (!winnerProposal) {
            return;
        }

        navigation.navigate('Payment', {
            requestId,
            requestTitle,
            providerName: winnerProposal.provider_display_name,
            priceLabel: winnerPriceLabel,
            proposal: winnerProposal,
            providerImageUrl: winnerProposal.provider_image_url,
        });
    };

    const modalContainerStyle = {
        marginTop: insets.top + 12,
        paddingBottom: Math.max(insets.bottom, 24),
    };

    const footerWrapperStyle = useMemo(
        () => [
            styles.footerWrapper,
            { paddingBottom: Math.max(insets.bottom + 24, 48) },
        ],
        [insets.bottom],
    );

    const payButtonVisible = !isCancelled && isClosed && !!winnerProposal;
    const showCloseButton = !isClosed && !isCancelled;

    const requestAttachments = Array.isArray(requestData?.attachments)
        ? requestData.attachments.filter((item) => !!item?.public_url || !!item?.thumbnail_url)
        : [];

    useEffect(() => {
        if (!requestId || !Array.isArray(activeRequestsData) || !activeRequestsData.length) {
            return;
        }

        const updatedFromQuery = activeRequestsData.find((item) => item?.id === requestId);
        if (updatedFromQuery) {
            setRequestData((prev) => ({
                ...prev,
                ...updatedFromQuery,
            }));
        }
    }, [activeRequestsData, requestId]);

    const handleManualRefresh = useCallback(() => {
        if (typeof refetchActiveRequests === 'function') {
            refetchActiveRequests();
        }
    }, [refetchActiveRequests]);

    const offersContent = useMemo(() => {
        if (isCancelled) {
            return (
                <View style={styles.emptyOffersBox}>
                    <Ionicons name="pause-outline" size={28} color="#ef4444" />
                    <Text style={styles.emptyOffersText}>
                        La licitación fue cancelada. No se mostrarán propuestas.
                    </Text>
                </View>
            );
        }

        if (!proposals.length) {
            return (
                <View style={styles.emptyOffersBox}>
                    <Ionicons name="mail-open-outline" size={28} color="#64748b" />
                    <Text style={styles.emptyOffersText}>
                        Aún no recibiste propuestas. Te avisaremos cuando lleguen nuevas ofertas.
                    </Text>
                </View>
            );
        }

        return proposals.map((proposal, index) => {
            const providerName = proposal.provider_display_name || 'Proveedor';
            const priceNumber = Number(proposal.quoted_price ?? 0) || 0;
            const priceLabel = `$${priceNumber.toLocaleString('es-AR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })} ${proposal.currency ?? 'ARS'}`;
            const isWinner = isClosed && index === 0;

            return (
                <View
                    key={proposal.id}
                    style={[styles.offerCard, isWinner && styles.winnerOfferCard]}
                >
                    <View style={styles.offerAvatarPlaceholder}>
                        <Ionicons name="briefcase-outline" size={24} color="#2563eb" />
                    </View>
                    <View style={styles.offerContent}>
                        <View style={styles.offerHeaderRow}>
                            <Text style={styles.offerName}>{providerName}</Text>
                            {isClosed ? (
                                <View style={styles.offerRankPill}>
                                    <Text style={styles.offerRankText}>
                                        {index === 0 ? 'Ganadora' : `#${index + 1}`}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                        <Text style={styles.offerTagline}>
                            {isClosed
                                ? 'Presupuesto enviado'
                                : 'Oferta recibida · precio oculto hasta cerrar'}
                        </Text>
                        {isClosed ? (
                            <Text style={styles.offerPrice}>{priceLabel}</Text>
                        ) : (
                            <Text style={styles.offerPriceHidden}>Precio disponible tras cierre</Text>
                        )}
                    </View>
                </View>
            );
        });
    }, [proposals, isClosed, isCancelled]);

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

            <ScrollView
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
                refreshControl={(
                    <RefreshControl
                        refreshing={Boolean(isActiveRefetching)}
                        onRefresh={handleManualRefresh}
                        tintColor="#0f172a"
                    />
                )}
            >
                <View style={styles.statusWrapper}>
                    <Image
                        source={require('../../../assets/icon.png')}
                        style={styles.brandLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.statusTitle}>
                        {isCancelled
                            ? 'Licitación cancelada'
                            : isClosed
                                ? 'Licitación finalizada'
                                : 'Licitación activa'}
                    </Text>
                    <Text style={styles.timerLabel}>
                        {isClosed || isCancelled ? 'Estado' : 'Tiempo restante'}
                    </Text>
                    <Text
                        style={[
                            styles.timerValue,
                            (isClosed || isCancelled) && styles.timerValueClosed,
                        ]}
                    >
                        {formattedRemaining}
                    </Text>
                    <Text style={styles.statusSubtitle}>
                        {isCancelled
                            ? 'Cancelaste la licitación. No se recibirán nuevas ofertas.'
                            : isClosed
                                ? 'Revisá las ofertas recibidas y elegí a la ganadora.'
                                : 'Los prestadores están enviando propuestas. Revisalas con calma antes de elegir.'}
                    </Text>
                    <View style={styles.infoPill}>
                        <Text style={styles.infoPillText}>
                            {isCancelled
                                ? 'La licitación terminó de forma anticipada.'
                                : isClosed
                                    ? 'La licitación ya no acepta nuevas ofertas.'
                                    : 'Podés cerrar la licitación cuando tengas suficientes propuestas.'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.offerBadge}
                        activeOpacity={0.85}
                        onPress={() => setIsOffersModalVisible(true)}
                    >
                        <Ionicons name="people-outline" size={16} color="#0369a1" />
                        <Text style={styles.offerBadgeText}>
                            {proposalCount === 1
                                ? '1 oferta recibida'
                                : `${proposalCount} ofertas recibidas`}
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#0369a1"
                            style={styles.offerBadgeArrow}
                        />
                    </TouchableOpacity>
                </View>

                {isClosed && winnerProposal ? (
                    <View style={styles.summaryWrapper}>
                        <View style={styles.closedBanner}>
                            <Ionicons name="trophy" size={22} color="#facc15" />
                            <Text style={styles.closedBannerText}>
                                {`Oferta ganadora: ${winnerProposal.provider_display_name}`}
                            </Text>
                        </View>

                        <View style={styles.winnerCard}>
                            {winnerProposal.provider_image_url ? (
                                <Image
                                    source={{ uri: winnerProposal.provider_image_url }}
                                    style={styles.winnerAvatar}
                                />
                            ) : (
                                <View style={styles.winnerAvatarFallback}>
                                    <Ionicons name="person-circle-outline" size={42} color="#0f172a" />
                                </View>
                            )}
                            <View style={styles.winnerInfo}>
                                <Text style={styles.winnerName}>{winnerProposal.provider_display_name}</Text>
                                <View style={styles.winnerReputationRow}>
                                    <Ionicons name="star" size={16} color="#f59e0b" />
                                    <Text style={styles.winnerReputationText}>{winnerReputation.ratingLabel}</Text>
                                    {winnerReputation.reviewsLabel ? (
                                        <Text style={styles.winnerReviewsText}>{` · ${winnerReputation.reviewsLabel}`}</Text>
                                    ) : null}
                                </View>
                            </View>
                        </View>

                        <View style={styles.winnerOfferCard}>
                            <View style={styles.winnerOfferHeader}>
                                <Text style={styles.winnerOfferTitle}>Propuesta seleccionada</Text>
                                <Text style={styles.winnerOfferPrice}>{winnerPriceLabel}</Text>
                            </View>

                            <View style={styles.winnerOfferMetaRow}>
                                <Ionicons name="calendar-outline" size={18} color="#0f172a" />
                                <Text style={styles.winnerOfferMetaText}>{winnerScheduleLabel}</Text>
                            </View>

                            {winnerEndLabel ? (
                                <View style={styles.winnerOfferMetaRow}>
                                    <Ionicons name="time-outline" size={18} color="#0f172a" />
                                    <Text style={styles.winnerOfferMetaText}>{winnerEndLabel}</Text>
                                </View>
                            ) : null}

                            {winnerValidUntilLabel ? (
                                <View style={styles.winnerOfferMetaRow}>
                                    <Ionicons name="alert-circle-outline" size={18} color="#0f172a" />
                                    <Text style={styles.winnerOfferMetaText}>{winnerValidUntilLabel}</Text>
                                </View>
                            ) : null}

                            {winnerNotes ? (
                                <View style={styles.winnerNotesBox}>
                                    <Text style={styles.winnerNotesLabel}>Detalle del prestador</Text>
                                    <Text style={styles.winnerNotesText}>{winnerNotes}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                ) : null}

                <View style={footerWrapperStyle}>
                    {showCloseButton ? (
                        <TouchableOpacity
                            style={[
                                styles.closeButton,
                                (!canCloseManually || isUpdating) && styles.closeButtonDisabled,
                            ]}
                            activeOpacity={canCloseManually && !isUpdating ? 0.9 : 1}
                            onPress={handleCloseRequestPress}
                            disabled={!canCloseManually || isUpdating}
                        >
                            <Text
                                style={[
                                    styles.closeButtonText,
                                    (!canCloseManually || isUpdating)
                                    && styles.closeButtonTextDisabled,
                                ]}
                            >
                                Cerrar licitación y ver ofertas
                            </Text>
                            <Text style={styles.closeHelperText}>
                                {canCloseManually
                                    ? 'Disponés de suficientes propuestas para elegir.'
                                    : 'Necesitás al menos 3 ofertas para cerrar la licitación.'}
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                    {payButtonVisible ? (
                        <TouchableOpacity
                            style={styles.payButton}
                            activeOpacity={0.9}
                            onPress={handleGoToPay}
                        >
                            <Ionicons name="card-outline" size={20} color="#ecfeff" style={styles.payButtonIcon} />
                            <Text style={styles.payButtonText}>Ir a pagar</Text>
                        </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                        style={[
                            styles.cancelButton,
                            (isUpdating || isCancelled) && styles.buttonDisabled,
                        ]}
                        activeOpacity={isUpdating || isCancelled ? 1 : 0.9}
                        onPress={handleCancelRequest}
                        disabled={isUpdating || isCancelled}
                    >
                        <Text
                            style={[
                                styles.cancelButtonText,
                                (isUpdating || isCancelled)
                                && styles.cancelButtonTextDisabled,
                            ]}
                        >
                            Cancelar licitación
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.helperCaption}>
                        Las licitaciones permanecen abiertas por 72 horas. Podés cancelarla si ya no necesitás el servicio.
                    </Text>
                </View>
            </ScrollView>

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

            <Modal
                visible={isOffersModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setIsOffersModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, modalContainerStyle]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Ofertas recibidas</Text>
                            <TouchableOpacity
                                onPress={() => setIsOffersModalVisible(false)}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={20} color="#111" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.listContent}>
                            {offersContent}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
