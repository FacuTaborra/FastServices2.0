import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    Alert,
    AppState,
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
import { parseISO, differenceInMilliseconds, differenceInCalendarDays, format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './LicitacionScreen.styles';
import {
    useActiveServiceRequests,
    useUpdateServiceRequest,
    useCancelServiceRequest,
} from '../../hooks/useServiceRequests';

const TIMER_TICK_INTERVAL_MS = 60 * 1000;
const LICITACION_WINDOW_MS = 72 * 60 * 60 * 1000; // 72 horas en milisegundos

// Calcular tiempo restante igual que FastMatch: created_at + ventana de tiempo
const computeRemainingMs = (createdAtIso, nowMs) => {
    if (!createdAtIso) {
        return LICITACION_WINDOW_MS;
    }

    const createdAt = parseISO(createdAtIso);
    if (!isValid(createdAt)) {
        return LICITACION_WINDOW_MS;
    }

    // Cuánto tiempo pasó desde que se creó
    const elapsedMs = differenceInMilliseconds(nowMs, createdAt);
    const safeElapsed = Math.max(0, elapsedMs);

    // Tiempo restante = 72 horas - tiempo transcurrido
    return Math.max(0, LICITACION_WINDOW_MS - safeElapsed);
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

const getProposalIdentifier = (proposal) => {
    if (!proposal) {
        return null;
    }

    return (
        proposal.id
        ?? proposal.proposal_id
        ?? proposal.provider_id
        ?? null
    );
};

const parseIsoDate = (isoDate) => {
    if (!isoDate) return null;
    if (isoDate instanceof Date) return isValid(isoDate) ? isoDate : null;
    if (typeof isoDate !== 'string') return null;

    const stringToParse = isoDate.trim();
    if (!stringToParse) return null;

    // parseISO maneja correctamente ISO strings sin zona horaria (usa local)
    // o con zona horaria. Es más robusto que new Date().
    // El backend guarda en hora Argentina naive.
    const parsed = parseISO(stringToParse);
    return isValid(parsed) ? parsed : null;
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

const sortProposals = (proposals, criterion = 'price') => {
    if (!Array.isArray(proposals)) {
        return [];
    }

    return [...proposals].sort((a, b) => {
        if (criterion === 'rating') {
            const ratingA = Number(a?.provider_rating_avg ?? 0);
            const ratingB = Number(b?.provider_rating_avg ?? 0);
            if (ratingA !== ratingB) {
                return ratingB - ratingA;
            }

            const reviewsA = Number(a?.provider_total_reviews ?? 0);
            const reviewsB = Number(b?.provider_total_reviews ?? 0);
            if (reviewsA !== reviewsB) {
                return reviewsB - reviewsA;
            }

            const priceA = Number(a?.quoted_price ?? 0);
            const priceB = Number(b?.quoted_price ?? 0);
            if (priceA !== priceB) {
                return priceA - priceB;
            }

            return Number(a?.id ?? 0) - Number(b?.id ?? 0);
        }

        const priceA = Number(a?.quoted_price ?? 0);
        const priceB = Number(b?.quoted_price ?? 0);
        if (priceA === priceB) {
            const ratingA = Number(a?.provider_rating_avg ?? 0);
            const ratingB = Number(b?.provider_rating_avg ?? 0);
            if (ratingA !== ratingB) {
                return ratingB - ratingA;
            }

            return Number(a?.id ?? 0) - Number(b?.id ?? 0);
        }
        return priceA - priceB;
    });
};

const ProposalCard = ({
    proposal,
    isWinner,
    isSelected,
    isClosed,
    onShowDetails,
    onSelectForPayment,
    scheduleLabel,
    reputationLabel,
}) => {
    const providerName = proposal?.provider_display_name || 'Proveedor';
    const priceLabel = formatCurrencyLabel(
        proposal?.quoted_price,
        proposal?.currency,
    );
    const notesPreview = (proposal?.notes || '').trim();

    return (
        <View
            style={[
                styles.proposalCard,
                isWinner && styles.proposalCardWinner,
                isSelected && styles.proposalCardSelected,
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => onShowDetails(proposal)}
            >
                <View style={styles.proposalHeader}>
                    <Text style={styles.proposalProvider}>{providerName}</Text>
                    <Text style={styles.proposalPrice}>{priceLabel}</Text>
                </View>
                <View style={styles.proposalMetaRow}>
                    <Ionicons name="star" size={16} color="#f59e0b" />
                    <Text style={styles.proposalMetaText}>{reputationLabel}</Text>
                </View>
                {notesPreview ? (
                    <Text style={styles.proposalNotes} numberOfLines={2}>
                        {notesPreview}
                    </Text>
                ) : null}
                <View style={styles.proposalMetaRow}>
                    <Ionicons name="calendar-outline" size={16} color="#0369a1" />
                    <Text style={styles.proposalMetaText}>{scheduleLabel}</Text>
                </View>
            </TouchableOpacity>

            {isClosed ? (
                <View style={styles.proposalFooterRow}>
                    <TouchableOpacity
                        style={[
                            styles.proposalSelectButton,
                            isSelected && styles.proposalSelectButtonActive,
                        ]}
                        onPress={() => onSelectForPayment(proposal)}
                        activeOpacity={0.85}
                    >
                        <Ionicons
                            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={18}
                            color={isSelected ? '#0f766e' : '#64748b'}
                        />
                        <Text
                            style={[
                                styles.proposalSelectButtonLabel,
                                isSelected && styles.proposalSelectButtonLabelActive,
                            ]}
                        >
                            {isSelected ? 'Seleccionado para pagar' : 'Elegir para pagar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
};

export default function LicitacionScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const requestId = route.params?.requestId;
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [selectedPayProposalId, setSelectedPayProposalId] = useState(null);
    const [sortCriterion, setSortCriterion] = useState('price');
    const [requestData, setRequestData] = useState(
        route.params?.requestSummary ?? {},
    );
    const [nowMs, setNowMs] = useState(Date.now());
    const [hasAutoClosed, setHasAutoClosed] = useState(false);
    const updateRequestMutation = useUpdateServiceRequest();
    const cancelRequestMutation = useCancelServiceRequest();

    const serviceCreated = Boolean(requestData?.service);
    const requestTitle = requestData?.title ?? 'Solicitud de presupuesto';
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
    const baseProposals = useMemo(
        () => (Array.isArray(requestData?.proposals) ? [...requestData.proposals] : []),
        [requestData?.proposals],
    );
    const sortedProposals = useMemo(
        () => sortProposals(baseProposals, sortCriterion),
        [baseProposals, sortCriterion],
    );
    const handleSortChange = useCallback((criterion) => {
        setSortCriterion((prev) => (prev === criterion ? prev : criterion));
    }, []);
    const proposalCount = requestData?.proposal_count ?? baseProposals.length;
    const isUpdating = updateRequestMutation.isPending || cancelRequestMutation.isPending;

    useEffect(() => {
        // Actualizar inmediatamente al montar
        setNowMs(Date.now());

        const intervalId = setInterval(() => {
            setNowMs(Date.now());
        }, TIMER_TICK_INTERVAL_MS);

        // Manejar cambios de AppState (background/foreground)
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                // Cuando la app vuelve a primer plano, actualizar el tiempo inmediatamente
                setNowMs(Date.now());
            }
        });

        return () => {
            clearInterval(intervalId);
            subscription?.remove();
        };
    }, []);

    const remainingMs = useMemo(
        () => computeRemainingMs(requestCreatedAt, nowMs),
        [requestCreatedAt, nowMs],
    );

    const isClosed = useMemo(
        () => currentStatus === 'CLOSED',
        [currentStatus],
    );

    const isCancelled = useMemo(
        () => currentStatus === 'CANCELLED',
        [currentStatus],
    );

    const canCloseManually = !isClosed && !isCancelled;

    const formattedRemaining = useMemo(() => {
        if (isCancelled) {
            return 'Cancelada';
        }
        return formatRemainingTime(remainingMs, isClosed);
    }, [remainingMs, isClosed, isCancelled]);

    const winnerProposal = useMemo(
        () => (baseProposals.length > 0 ? sortProposals(baseProposals, 'price')[0] : null),
        [baseProposals],
    );

    const winnerProposalId = useMemo(
        () => getProposalIdentifier(winnerProposal),
        [winnerProposal],
    );

    useEffect(() => {
        if (!isClosed) {
            setSelectedPayProposalId(null);
            return;
        }

        if (!sortedProposals.length) {
            setSelectedPayProposalId(null);
            return;
        }

        setSelectedPayProposalId((prev) => {
            if (prev && sortedProposals.some((proposal) => getProposalIdentifier(proposal) === prev)) {
                return prev;
            }

            const firstSortable = sortedProposals[0];
            return getProposalIdentifier(firstSortable) ?? null;
        });
    }, [isClosed, sortedProposals]);

    const selectedPayProposal = useMemo(() => {
        if (!isClosed || !selectedPayProposalId) {
            return null;
        }

        return (
            sortedProposals.find((proposal) => getProposalIdentifier(proposal) === selectedPayProposalId)
            || baseProposals.find((proposal) => getProposalIdentifier(proposal) === selectedPayProposalId)
            || null
        );
    }, [isClosed, selectedPayProposalId, sortedProposals, baseProposals]);

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

    const requestCreatedDate = useMemo(
        () => parseIsoDate(requestCreatedAt),
        [requestCreatedAt],
    );
    const biddingDeadlineDate = useMemo(
        () => parseIsoDate(biddingDeadlineIso),
        [biddingDeadlineIso],
    );

    const statusLabel = useMemo(() => {
        if (isCancelled) {
            return 'Cancelada';
        }
        if (isClosed) {
            return 'Finalizada';
        }
        return 'Activa';
    }, [isCancelled, isClosed]);

    const statusMessage = useMemo(() => {
        if (isCancelled) {
            return 'Cancelaste la solicitud. No se recibirán nuevas ofertas.';
        }
        if (isClosed) {
            return 'Cerraste la solicitud. Revisá las propuestas y confirmá al prestador.';
        }
        return 'Los prestadores están enviando propuestas. Podés cerrar cuando quieras elegir uno.';
    }, [isCancelled, isClosed]);

    const statusHint = useMemo(() => {
        if (isCancelled) {
            return 'Recordá crear una nueva solicitud si cambiaron tus necesidades.';
        }
        if (isClosed) {
            return 'La solicitud ya no acepta nuevas ofertas.';
        }
        return 'Cuando tengas las propuestas que necesitás, podés cerrar la solicitud.';
    }, [isCancelled, isClosed]);

    const getProposalScheduleLabel = useCallback(
        (proposal) => {
            const startDate = parseIsoDate(proposal?.proposed_start_at);
            if (!startDate) {
                return 'Fecha a coordinar';
            }

            const calendarLabel = formatLongDate(startDate);
            const relativeLabel = describeDaysUntil(startDate, nowMs);

            if (calendarLabel && relativeLabel) {
                return `${calendarLabel} · ${relativeLabel}`;
            }

            return calendarLabel || relativeLabel || 'Fecha a coordinar';
        },
        [nowMs],
    );

    const getProposalReputation = useCallback((proposal) => {
        const rating = Number(proposal?.provider_rating_avg ?? 0);
        const reviews = Number(proposal?.provider_total_reviews ?? 0);

        if (rating > 0) {
            const formattedRating = rating.toFixed(1).replace('.', ',');
            const reviewsLabel = reviews === 1 ? '1 reseña' : `${reviews} reseñas`;
            return `${formattedRating} · ${reviewsLabel}`;
        }

        if (reviews > 0) {
            return reviews === 1 ? '1 reseña' : `${reviews} reseñas`;
        }

        return 'Sin calificaciones';
    }, []);

    const closeDetailModal = useCallback(() => {
        setIsDetailModalVisible(false);
        setSelectedProposal(null);
    }, []);

    const handleProposalPress = useCallback((proposal) => {
        if (!proposal) {
            return;
        }
        setSelectedProposal(proposal);
        setIsDetailModalVisible(true);
    }, []);
    const handleSelectProposalForPayment = useCallback(
        (proposal) => {
            if (!proposal || !isClosed) {
                return;
            }

            const proposalId = getProposalIdentifier(proposal);
            if (!proposalId || proposalId === selectedPayProposalId) {
                return;
            }

            setSelectedPayProposalId(proposalId);
        },
        [isClosed, selectedPayProposalId],
    );

    const { proposalsContent, hasScrollableProposals } = useMemo(() => {
        if (isCancelled) {
            return {
                proposalsContent: (
                    <View style={styles.emptyOffersBox}>
                        <Ionicons name="pause-outline" size={28} color="#ef4444" />
                        <Text style={styles.emptyOffersText}>
                            La solicitud fue cancelada. No se mostrarán propuestas.
                        </Text>
                    </View>
                ),
                hasScrollableProposals: false,
            };
        }

        if (!sortedProposals.length) {
            return {
                proposalsContent: (
                    <View style={styles.emptyOffersBox}>
                        <Ionicons name="mail-open-outline" size={28} color="#64748b" />
                        <Text style={styles.emptyOffersText}>
                            Aún no recibiste propuestas. Te avisaremos cuando lleguen nuevas ofertas.
                        </Text>
                    </View>
                ),
                hasScrollableProposals: false,
            };
        }

        const cards = sortedProposals.map((proposal) => {
            const proposalIdentifier = getProposalIdentifier(proposal);
            const proposalKey = proposalIdentifier
                ?? `${proposal?.provider_display_name || 'proveedor'}-${proposal?.quoted_price ?? 0}`;
            const scheduleLabel = getProposalScheduleLabel(proposal);
            const reputationLabel = getProposalReputation(proposal);
            const isWinner = Boolean(
                isClosed && winnerProposalId && proposalIdentifier === winnerProposalId,
            );
            const isSelected = Boolean(
                isClosed && selectedPayProposalId && proposalIdentifier === selectedPayProposalId,
            );

            return (
                <ProposalCard
                    key={proposalKey}
                    proposal={proposal}
                    isWinner={isWinner}
                    isClosed={isClosed}
                    isSelected={isSelected}
                    onShowDetails={handleProposalPress}
                    onSelectForPayment={handleSelectProposalForPayment}
                    scheduleLabel={scheduleLabel}
                    reputationLabel={reputationLabel}
                />
            );
        });

        return {
            proposalsContent: (
                <View style={styles.proposalsCardsWrapper}>
                    {cards}
                </View>
            ),
            hasScrollableProposals: sortedProposals.length > 4,
        };
    }, [
        isCancelled,
        sortedProposals,
        isClosed,
        winnerProposalId,
        selectedPayProposalId,
        getProposalScheduleLabel,
        getProposalReputation,
        handleProposalPress,
        handleSelectProposalForPayment,
    ]);

    const selectedProposalMeta = useMemo(() => {
        if (!selectedProposal) {
            return null;
        }

        const endDate = parseIsoDate(selectedProposal?.proposed_end_at);
        const validUntilDate = parseIsoDate(selectedProposal?.valid_until);

        return {
            priceLabel: formatCurrencyLabel(
                selectedProposal?.quoted_price,
                selectedProposal?.currency,
            ),
            reputationLabel: getProposalReputation(selectedProposal),
            scheduleLabel: getProposalScheduleLabel(selectedProposal),
            endLabel: endDate ? formatLongDate(endDate) : null,
            validUntilLabel: validUntilDate ? formatLongDate(validUntilDate) : null,
            notes: (selectedProposal?.notes || '').trim(),
        };
    }, [selectedProposal, getProposalReputation, getProposalScheduleLabel]);

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
                        closeDetailModal();
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
                                'Solicitud finalizada',
                                'La solicitud se cerró automáticamente al cumplirse el plazo de 72 horas.',
                                [
                                    {
                                        text: 'Entendido',
                                    },
                                ],
                            );
                        } else {
                            Alert.alert(
                                'Solicitud cerrada',
                                'Revisá las ofertas y elegí al prestador que mejor se adapte a tu necesidad.',
                            );
                        }
                    },
                    onError: (error) => {
                        const message = resolveErrorMessage(
                            error,
                            'No pudimos cerrar la solicitud. Intentá nuevamente.',
                        );
                        Alert.alert('Error al cerrar la solicitud', message);
                        setHasAutoClosed(false);
                    },
                },
            );
        },
        [requestId, updateLocalRequest, updateRequestMutation, closeDetailModal],
    );

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

    const handleCloseRequestPress = () => {
        if (!canCloseManually || isUpdating) {
            return;
        }

        Alert.alert(
            'Cerrar solicitud',
            'Vas a finalizar la solicitud y revelar las ofertas recibidas. ¿Querés continuar?',
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
            'Cancelar solicitud',
            'Si cancelás esta solicitud dejarás de recibir propuestas. ¿Querés continuar?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: () => {
                        cancelRequestMutation.mutate(
                            { requestId },
                            {
                                onSuccess: (updatedRequest) => {
                                    closeDetailModal();
                                    if (updatedRequest) {
                                        updateLocalRequest(updatedRequest);
                                    } else {
                                        updateLocalRequest({ status: 'CANCELLED' });
                                    }
                                    Alert.alert(
                                        'Solicitud cancelada',
                                        'La solicitud se canceló correctamente.',
                                        [
                                            {
                                                text: 'OK',
                                                onPress: () =>
                                                    navigation.navigate('Main', {
                                                        screen: 'HomePage',
                                                        params: {
                                                            animation: 'slide_from_left',
                                                        },
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

    const handleGoToPay = () => {
        if (!selectedPayProposal) {
            Alert.alert(
                'Seleccioná una propuesta',
                'Elegí cuál oferta querés pagar antes de continuar.',
            );
            return;
        }

        if (serviceCreated) {
            Alert.alert(
                'Servicio confirmado',
                'Ya registraste un pago para esta solicitud.',
            );
            return;
        }

        navigation.navigate('Payment', {
            requestId,
            requestTitle,
            providerName: selectedPayProposal.provider_display_name,
            priceLabel: formatCurrencyLabel(
                selectedPayProposal.quoted_price,
                selectedPayProposal.currency,
            ),
            proposal: selectedPayProposal,
            providerImageUrl: selectedPayProposal.provider_image_url,
        });
    };

    const modalContainerStyle = {
        marginTop: insets.top + 12,
        paddingBottom: Math.max(insets.bottom, 24),
    };

    const actionsContainerStyle = useMemo(
        () => [
            styles.actionsContainer,
            { paddingBottom: Math.max(insets.bottom + 24, 48) },
        ],
        [insets.bottom],
    );

    const payButtonVisible = !isCancelled && isClosed && sortedProposals.length > 0;
    const isPayButtonDisabled = serviceCreated || !selectedPayProposal;
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

    const deadlineLabel = useMemo(
        () => (biddingDeadlineDate ? formatLongDate(biddingDeadlineDate) : null),
        [biddingDeadlineDate],
    );

    const createdLabel = useMemo(
        () => (requestCreatedDate ? formatLongDate(requestCreatedDate) : null),
        [requestCreatedDate],
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <View style={styles.headerTitleWrapper}>
                    <Text style={styles.headerTitle}>PRESUPUESTADO</Text>
                    <Text style={styles.headerSubtitle} numberOfLines={2}>
                        {requestTitle}
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={(
                    <RefreshControl
                        refreshing={Boolean(isActiveRefetching)}
                        onRefresh={handleManualRefresh}
                        tintColor="#0f172a"
                    />
                )}
            >
                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <View
                            style={[
                                styles.statusBadge,
                                isCancelled
                                    ? styles.statusBadgeCancelled
                                    : isClosed
                                        ? styles.statusBadgeClosed
                                        : styles.statusBadgeActive,
                            ]}
                        >
                            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                        </View>
                        <Text
                            style={[
                                styles.statusCountdown,
                                (isClosed || isCancelled) && styles.statusCountdownMuted,
                            ]}
                        >
                            {formattedRemaining}
                        </Text>
                    </View>
                    <Text style={styles.statusDescription}>{statusMessage}</Text>
                    <Text style={styles.statusHint}>{statusHint}</Text>
                    {deadlineLabel ? (
                        <View style={styles.statusFooterRow}>
                            <Ionicons name="calendar-outline" size={16} color="#0f172a" />
                            <Text style={styles.statusFooterText}>
                                {isClosed || isCancelled
                                    ? `Cerró ${deadlineLabel}`
                                    : `Cierra ${deadlineLabel}`}
                            </Text>
                        </View>
                    ) : null}
                    {createdLabel ? (
                        <View style={styles.statusFooterRow}>
                            <Ionicons name="time-outline" size={16} color="#0f172a" />
                            <Text style={styles.statusFooterText}>{`Creada ${createdLabel}`}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalle de la solicitud</Text>
                    <Text style={styles.requestName}>{requestTitle}</Text>
                    <Text style={styles.requestDescription}>{requestDescription}</Text>
                    {requestAddress ? (
                        <View style={styles.requestMetaRow}>
                            <Ionicons
                                name="location-outline"
                                size={16}
                                color="#0369a1"
                                style={styles.requestMetaIcon}
                            />
                            <Text style={styles.requestMetaText}>{requestAddress}</Text>
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

                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Ofertas recibidas</Text>
                        <View style={styles.sectionBadge}>
                            <Text style={styles.sectionBadgeText}>{proposalCount}</Text>
                        </View>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                        {isClosed
                            ? 'Estas fueron las propuestas que recibiste.'
                            : 'Se muestran las propuestas a medida que llegan.'}
                    </Text>
                    {!isCancelled && sortedProposals.length > 1 ? (
                        <View style={styles.proposalsControlsRow}>
                            <Text style={styles.proposalsControlsLabel}>Ordenar por</Text>
                            <View style={styles.proposalsFiltersRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.proposalsFilterChip,
                                        sortCriterion === 'price' && styles.proposalsFilterChipActive,
                                    ]}
                                    onPress={() => handleSortChange('price')}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons
                                        name="pricetag-outline"
                                        size={16}
                                        color={sortCriterion === 'price' ? '#0f172a' : '#475569'}
                                    />
                                    <Text
                                        style={[
                                            styles.proposalsFilterChipText,
                                            sortCriterion === 'price' && styles.proposalsFilterChipTextActive,
                                        ]}
                                    >
                                        Precio
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.proposalsFilterChip,
                                        sortCriterion === 'rating' && styles.proposalsFilterChipActive,
                                    ]}
                                    onPress={() => handleSortChange('rating')}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons
                                        name="star-outline"
                                        size={16}
                                        color={sortCriterion === 'rating' ? '#0f172a' : '#475569'}
                                    />
                                    <Text
                                        style={[
                                            styles.proposalsFilterChipText,
                                            sortCriterion === 'rating' && styles.proposalsFilterChipTextActive,
                                        ]}
                                    >
                                        Reputación
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : null}
                    <View style={styles.proposalsList}>
                        {hasScrollableProposals ? (
                            <ScrollView
                                style={styles.proposalScrollContainer}
                                contentContainerStyle={styles.proposalScrollContent}
                                showsVerticalScrollIndicator={false}
                                nestedScrollEnabled
                            >
                                {proposalsContent}
                            </ScrollView>
                        ) : (
                            proposalsContent
                        )}
                    </View>
                </View>

                {isClosed && winnerProposal ? (
                    <View style={styles.section}>
                        <View style={styles.winnerHeader}>
                            <Ionicons name="trophy" size={22} color="#f59e0b" />
                            <Text style={styles.winnerHeaderText}>
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
                        <View style={styles.winnerDetailCard}>
                            <View style={styles.detailRow}>
                                <Ionicons name="pricetag-outline" size={18} color="#0f172a" />
                                <Text style={styles.detailValue}>{winnerPriceLabel}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons name="calendar-outline" size={18} color="#0f172a" />
                                <Text style={styles.detailValue}>{winnerScheduleLabel}</Text>
                            </View>
                            {winnerEndLabel ? (
                                <View style={styles.detailRow}>
                                    <Ionicons name="time-outline" size={18} color="#0f172a" />
                                    <Text style={styles.detailValue}>{winnerEndLabel}</Text>
                                </View>
                            ) : null}
                            {winnerValidUntilLabel ? (
                                <View style={styles.detailRow}>
                                    <Ionicons name="alert-circle-outline" size={18} color="#b45309" />
                                    <Text style={styles.detailValue}>{winnerValidUntilLabel}</Text>
                                </View>
                            ) : null}
                            {winnerNotes ? (
                                <View style={styles.detailNotesBox}>
                                    <Text style={styles.detailNotesTitle}>Detalle del prestador</Text>
                                    <Text style={styles.detailNotesText}>{winnerNotes}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                ) : null}

                <View style={actionsContainerStyle}>
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
                                Terminar tiempo y ver ofertas
                            </Text>
                            <Text style={styles.closeHelperText}>
                                {canCloseManually
                                    ? 'Vas a poder elegir entre las ofertas recibidas.'
                                    : 'No se puede cerrar la licitación en este momento.'}
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                    {payButtonVisible ? (
                        <TouchableOpacity
                            style={[
                                styles.payButton,
                                isPayButtonDisabled && styles.payButtonDisabled,
                            ]}
                            activeOpacity={isPayButtonDisabled ? 1 : 0.9}
                            onPress={handleGoToPay}
                            disabled={isPayButtonDisabled}
                        >
                            <Ionicons
                                name={
                                    serviceCreated
                                        ? 'shield-checkmark-outline'
                                        : isPayButtonDisabled
                                            ? 'ellipse-outline'
                                            : 'card-outline'
                                }
                                size={20}
                                color={
                                    serviceCreated
                                        ? '#0f766e'
                                        : isPayButtonDisabled
                                            ? '#94a3b8'
                                            : '#ecfeff'
                                }
                                style={styles.payButtonIcon}
                            />
                            <Text
                                style={[
                                    styles.payButtonText,
                                    isPayButtonDisabled && styles.payButtonTextDisabled,
                                ]}
                            >
                                {serviceCreated
                                    ? 'Pago registrado'
                                    : isPayButtonDisabled
                                        ? 'Elegí una propuesta'
                                        : 'Ir a pagar'}
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                    {payButtonVisible && !serviceCreated ? (
                        selectedPayProposal ? (
                            <Text style={styles.selectedProposalCaption}>
                                {`Vas a pagar a ${selectedPayProposal.provider_display_name || 'el prestador elegido'}.`}
                            </Text>
                        ) : (
                            <Text style={styles.selectedProposalHelper}>
                                Seleccioná una propuesta de la lista para continuar con el pago.
                            </Text>
                        )
                    ) : null}

                    {serviceCreated ? (
                        <View style={styles.serviceConfirmedNote}>
                            <Ionicons name="shield-checkmark" size={16} color="#0f766e" style={styles.serviceConfirmedNoteIcon} />
                            <Text style={styles.serviceConfirmedNoteText}>
                                Ya confirmaste este servicio. Podés revisar los detalles desde la sección Mis solicitudes.
                            </Text>
                        </View>
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
                            Cancelar solicitud
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.helperCaption}>
                        Las solicitudes presupuestadas permanecen abiertas por 72 horas. Podés cancelarla si ya no necesitás el servicio.
                    </Text>
                </View>
            </ScrollView>

            <Modal
                visible={isDetailModalVisible}
                animationType="slide"
                transparent
                onRequestClose={closeDetailModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, modalContainerStyle]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detalle de la propuesta</Text>
                            <TouchableOpacity
                                onPress={closeDetailModal}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons name="close" size={20} color="#111" />
                            </TouchableOpacity>
                        </View>
                        {selectedProposal && selectedProposalMeta ? (
                            <ScrollView contentContainerStyle={styles.modalContent}>
                                <View style={styles.modalProviderRow}>
                                    {selectedProposal.provider_image_url ? (
                                        <Image
                                            source={{ uri: selectedProposal.provider_image_url }}
                                            style={styles.modalProviderAvatar}
                                        />
                                    ) : (
                                        <View style={styles.modalProviderAvatarFallback}>
                                            <Ionicons name="person-circle-outline" size={42} color="#0f172a" />
                                        </View>
                                    )}
                                    <View style={styles.modalProviderInfo}>
                                        <Text style={styles.modalProviderName}>
                                            {selectedProposal.provider_display_name || 'Prestador'}
                                        </Text>
                                        <View style={styles.modalProviderMetaRow}>
                                            <Ionicons name="star" size={16} color="#f59e0b" />
                                            <Text style={styles.modalProviderMetaText}>
                                                {selectedProposalMeta.reputationLabel}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalLabel}>Precio cotizado</Text>
                                    <Text style={styles.modalValue}>{selectedProposalMeta.priceLabel}</Text>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalLabel}>Inicio estimado</Text>
                                    <Text style={styles.modalValue}>{selectedProposalMeta.scheduleLabel}</Text>
                                </View>

                                {selectedProposalMeta.endLabel ? (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalLabel}>Finalización</Text>
                                        <Text style={styles.modalValue}>{selectedProposalMeta.endLabel}</Text>
                                    </View>
                                ) : null}

                                {selectedProposalMeta.validUntilLabel ? (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalLabel}>Vigencia</Text>
                                        <Text style={styles.modalValue}>{selectedProposalMeta.validUntilLabel}</Text>
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
                                <Ionicons name="information-circle-outline" size={32} color="#64748b" />
                                <Text style={styles.modalEmptyStateText}>
                                    Seleccioná una propuesta para ver los detalles.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
