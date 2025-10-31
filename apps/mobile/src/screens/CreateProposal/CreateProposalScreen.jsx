import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Modal,
    Keyboard,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Spinner from '../../components/Spinner/Spinner';
import styles from './CreateProposalScreen.styles';
import { PALETTE } from '../HomePage/HomePage.styles';
import { createProviderProposal, getProviderCurrencies } from '../../services/providers.service';
import RequestSummaryCard from '../ProviderRequests/components/RequestSummaryCard';

const DEFAULT_CURRENCY = 'ARS';
const REQUEST_TYPE_LABELS = {
    FAST: 'FAST ⚡',
    FAST_MATCH: 'FAST ⚡',
    LICITACION: 'Licitación ⏰',
    BUDGET: 'Licitación ⏰',
};
const REQUEST_TYPE_ICONS = {
    FAST: 'flash',
    FAST_MATCH: 'flash',
    LICITACION: 'hammer',
    BUDGET: 'hammer',
};

function formatCurrencyPreview(value, currencyCode = DEFAULT_CURRENCY) {
    if (value === '' || value === null || value === undefined) {
        return '';
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
        return '';
    }
    const code = (currencyCode || DEFAULT_CURRENCY).toUpperCase();
    try {
        return numeric.toLocaleString('es-AR', {
            style: 'currency',
            currency: code,
            minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
        });
    } catch (error) {
        return `${numeric.toFixed(2)} ${code}`;
    }
}

function isValidPositiveNumber(value) {
    if (value === '' || value === null || value === undefined) {
        return false;
    }
    const numeric = Number(value);
    return !Number.isNaN(numeric) && numeric > 0;
}

function normalizeDecimal(value) {
    if (value === '' || value === null || value === undefined) {
        return null;
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) ? null : numeric;
}

function normalizeDate(dateInstance) {
    if (!dateInstance) {
        return null;
    }
    return dateInstance.toISOString();
}

function formatRequestDateLabel(value) {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    try {
        return parsed.toLocaleString('es-AR');
    } catch (error) {
        return parsed.toISOString();
    }
}

function useInitialData(routeParams) {
    return useMemo(() => {
        const { requestSummary } = routeParams ?? {};
        if (!requestSummary) {
            return {
                requestId: null,
                title: 'Solicitud sin título',
                city: null,
                preferredStartAt: null,
                preferredEndAt: null,
                type: null,
            };
        }
        return {
            requestId: requestSummary.id ?? null,
            title: requestSummary.title ?? 'Solicitud sin título',
            city: requestSummary.address ?? null,
            preferredStartAt: requestSummary.preferred_start_at ?? null,
            preferredEndAt: requestSummary.preferred_end_at ?? null,
            type: requestSummary.request_type ?? null,
        };
    }, [routeParams]);
}

function validateDateRange(startDate, endDate) {
    if (startDate && endDate && endDate < startDate) {
        return false;
    }
    return true;
}

export default function CreateProposalScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const initialData = useInitialData(route.params);
    const isFastRequest = initialData.type === 'FAST' || initialData.type === 'FAST_MATCH';
    const shouldRenderScheduling = !isFastRequest;
    const shouldRenderValidity = !isFastRequest;
    const requestTypeLabel = useMemo(
        () => REQUEST_TYPE_LABELS[initialData.type] ?? null,
        [initialData.type],
    );
    const requestTypeIcon = useMemo(
        () => REQUEST_TYPE_ICONS[initialData.type] ?? 'hammer',
        [initialData.type],
    );
    const requestSummaryDetails = useMemo(() => {
        const details = [];

        if (initialData.city) {
            details.push({
                icon: 'location-outline',
                label: 'Ubicación',
                value: initialData.city,
            });
        }

        const startLabel = formatRequestDateLabel(initialData.preferredStartAt);
        const endLabel = formatRequestDateLabel(initialData.preferredEndAt);

        if (startLabel) {
            details.push({
                icon: 'calendar-outline',
                label: 'Inicio sugerido',
                value: startLabel,
                hint: endLabel ? `Hasta: ${endLabel}` : null,
            });
        }

        return details;
    }, [initialData.city, initialData.preferredStartAt, initialData.preferredEndAt]);

    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [currencies, setCurrencies] = useState([]);
    const [loadingCurrencies, setLoadingCurrencies] = useState(true);
    const [currencyError, setCurrencyError] = useState(null);
    const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
    const [notes, setNotes] = useState('');
    const [validUntil, setValidUntil] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [iosPickerMode, setIosPickerMode] = useState(null);
    const [iosPickerTempDate, setIosPickerTempDate] = useState(new Date());
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        let mounted = true;

        const fetchCurrencies = async () => {
            try {
                setLoadingCurrencies(true);
                setCurrencyError(null);
                const response = await getProviderCurrencies();
                if (!mounted) {
                    return;
                }

                const normalized = (response || []).map((item) => ({
                    code: (item?.code || '').toUpperCase(),
                    name: item?.name ?? item?.code ?? '',
                }));

                setCurrencies(normalized);

                if (normalized.length > 0) {
                    setCurrency((current) => {
                        if (current && normalized.some((item) => item.code === current)) {
                            return current;
                        }
                        const fallback =
                            normalized.find((item) => item.code === DEFAULT_CURRENCY) ||
                            normalized[0];
                        return fallback ? fallback.code : current || DEFAULT_CURRENCY;
                    });
                }
            } catch (error) {
                if (!mounted) {
                    return;
                }
                let message = 'No pudimos cargar las monedas disponibles.';
                const responseData = error?.response?.data;

                if (typeof responseData === 'string' && responseData.trim()) {
                    message = responseData.trim();
                } else if (Array.isArray(responseData)) {
                    const aggregated = responseData
                        .map((item) => item?.msg)
                        .filter(Boolean)
                        .join('. ');
                    if (aggregated) {
                        message = aggregated;
                    }
                } else if (typeof error?.message === 'string' && error.message.trim()) {
                    message = error.message.trim();
                }

                setCurrencyError(message);
            } finally {
                if (mounted) {
                    setLoadingCurrencies(false);
                }
            }
        };

        fetchCurrencies();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const handleShow = (event) => {
            setKeyboardHeight(event?.endCoordinates?.height ?? 0);
        };

        const handleHide = () => {
            setKeyboardHeight(0);
        };

        const showSubscription = Keyboard.addListener(showEvent, handleShow);
        const hideSubscription = Keyboard.addListener(hideEvent, handleHide);

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const priceError = useMemo(() => {
        if (!price) {
            return 'Ingresá un monto estimado';
        }
        if (!isValidPositiveNumber(price)) {
            return 'Ingresá un número válido y mayor a cero';
        }
        return null;
    }, [price]);

    const dateError = useMemo(() => {
        if (!shouldRenderScheduling) {
            return null;
        }
        if (!validateDateRange(startDate, endDate)) {
            return 'La fecha de fin no puede ser anterior al inicio';
        }
        return null;
    }, [shouldRenderScheduling, startDate, endDate]);

    const selectedCurrency = useMemo(
        () => currencies.find((item) => item.code === currency) || null,
        [currencies, currency]
    );

    const currencyPreview = useMemo(
        () => formatCurrencyPreview(price, currency),
        [price, currency]
    );

    const handleSubmit = async () => {
        if (!initialData.requestId) {
            Alert.alert('Error', 'No se pudo identificar la solicitud a presupuestar.');
            return;
        }

        if (priceError) {
            Alert.alert('Error', priceError);
            return;
        }

        if (!isFastRequest && dateError) {
            Alert.alert('Error', dateError);
            return;
        }

        if (!currency) {
            Alert.alert('Error', 'Seleccioná una moneda.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                request_id: initialData.requestId,
                quoted_price: normalizeDecimal(price),
                currency: (currency || DEFAULT_CURRENCY).toUpperCase(),
            };

            if (notes && notes.trim()) {
                payload.notes = notes.trim();
            }

            if (!isFastRequest) {
                payload.proposed_start_at = normalizeDate(startDate);
                payload.proposed_end_at = normalizeDate(endDate);
                payload.valid_until = normalizeDate(validUntil);
            }

            await createProviderProposal(payload);

            Alert.alert('¡Listo!', 'Enviamos tu presupuesto al cliente.', [
                {
                    text: 'Ok',
                    onPress: () => {
                        navigation.goBack();
                    },
                },
            ]);
        } catch (error) {
            const message = error?.message || 'No pudimos enviar el presupuesto.';
            Alert.alert('Error', message);
        } finally {
            setSubmitting(false);
        }
    };

    const openAndroidPicker = useCallback(
        (mode) => {
            if (isFastRequest) {
                return false;
            }
            if (Platform.OS !== 'android') {
                return false;
            }

            const now = new Date();
            now.setSeconds(0, 0);

            let value = now;
            let minimumDate = now;
            let applySelection = (selectedDate) => selectedDate;

            if (mode === 'start') {
                value = startDate ? new Date(startDate) : now;
                minimumDate = now;
                applySelection = (selectedDate) => {
                    setStartDate(selectedDate);
                    if (endDate && selectedDate && endDate < selectedDate) {
                        setEndDate(null);
                    }
                };
            } else if (mode === 'end') {
                value = endDate ? new Date(endDate) : startDate ? new Date(startDate) : now;
                minimumDate = startDate ? new Date(startDate) : now;
                applySelection = (selectedDate) => {
                    setEndDate(selectedDate);
                };
            } else {
                value = validUntil ? new Date(validUntil) : now;
                minimumDate = now;
                applySelection = (selectedDate) => {
                    setValidUntil(selectedDate);
                };
            }

            const minimumTimestamp = minimumDate.getTime();

            const ensureNotBeforeMinimum = (candidate) => {
                if (candidate.getTime() < minimumTimestamp) {
                    Alert.alert('Fecha inválida', 'Seleccioná un horario posterior.');
                    return false;
                }
                return true;
            };

            const openTimePicker = (baseDate) => {
                DateTimePickerAndroid.open({
                    value: baseDate,
                    mode: 'time',
                    is24Hour: true,
                    onChange: (timeEvent, timeDate) => {
                        if (timeEvent.type !== 'set' || !timeDate) {
                            return;
                        }
                        const finalDate = new Date(baseDate);
                        finalDate.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
                        if (!ensureNotBeforeMinimum(finalDate)) {
                            return;
                        }
                        applySelection(finalDate);
                    },
                });
            };

            DateTimePickerAndroid.open({
                value,
                mode: 'date',
                minimumDate,
                onChange: (event, selectedDate) => {
                    if (event.type !== 'set' || !selectedDate) {
                        return;
                    }

                    const datePart = new Date(selectedDate);
                    datePart.setHours(value.getHours(), value.getMinutes(), 0, 0);

                    openTimePicker(datePart);
                },
            });

            return true;
        },
        [isFastRequest, startDate, endDate, validUntil]
    );

    const handleSelectCurrency = useCallback((code) => {
        setCurrency((code || DEFAULT_CURRENCY).toUpperCase());
        setCurrencyModalVisible(false);
    }, []);

    const currencyKeyExtractor = useCallback((item) => item.code, []);

    const handleOpenPicker = useCallback((mode) => {
        if (isFastRequest) {
            return;
        }

        if (openAndroidPicker(mode)) {
            return;
        }

        let baseDate = new Date();
        if (mode === 'start') {
            baseDate = startDate || new Date();
        } else if (mode === 'end') {
            baseDate = endDate || startDate || new Date();
        } else {
            baseDate = validUntil || new Date();
        }

        setIosPickerTempDate(baseDate);
        setIosPickerMode(mode);
    }, [isFastRequest, openAndroidPicker, startDate, endDate, validUntil]);

    const iosPickerVisible = iosPickerMode !== null;

    const iosMinimumDate = useMemo(() => {
        const now = new Date();
        now.setSeconds(0, 0);
        if (iosPickerMode === 'end' && startDate) {
            return new Date(startDate);
        }
        return now;
    }, [iosPickerMode, startDate]);

    const applyIosPicker = useCallback(() => {
        if (!iosPickerMode) {
            return;
        }

        if (iosPickerMode === 'start') {
            setStartDate(iosPickerTempDate);
            if (endDate && iosPickerTempDate && endDate < iosPickerTempDate) {
                setEndDate(null);
            }
        } else if (iosPickerMode === 'end') {
            if (startDate && iosPickerTempDate < startDate) {
                Alert.alert('Fecha inválida', 'La fecha de fin debe ser posterior al inicio.');
                return;
            }
            setEndDate(iosPickerTempDate);
        } else {
            setValidUntil(iosPickerTempDate);
        }

        setIosPickerMode(null);
    }, [iosPickerMode, iosPickerTempDate, endDate]);

    const dismissIosPicker = useCallback(() => {
        setIosPickerMode(null);
    }, []);

    if (submitting) {
        return <Spinner />;
    }

    return (
        <KeyboardAvoidingView
            style={styles.safeArea}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: 40 + keyboardHeight }]}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={22} style={styles.backIcon} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nuevo presupuesto</Text>
                </View>

                <RequestSummaryCard
                    headerLabel="Solicitud"
                    typeLabel={requestTypeLabel}
                    typeIcon={requestTypeIcon}
                    title={initialData.title}
                    details={requestSummaryDetails}
                    containerStyle={styles.summaryCard}
                />

                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Monto estimado</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: 15000"
                        keyboardType="numeric"
                        value={price}
                        onChangeText={setPrice}
                    />
                    {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
                    <Text style={styles.helperText}>
                        {currencyPreview
                            ? `Vista previa: ${currencyPreview}`
                            : `Ingresá el total estimado en ${currency || DEFAULT_CURRENCY}`}
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Moneda</Text>
                    <TouchableOpacity
                        style={styles.selectorButton}
                        onPress={() => setCurrencyModalVisible(true)}
                    >
                        <Ionicons name="cash-outline" size={20} style={styles.selectorIcon} />
                        <View style={styles.selectorInfo}>
                            <Text style={styles.selectorCode}>{currency || '--'}</Text>
                            <Text style={styles.selectorName}>
                                {selectedCurrency?.name ||
                                    (loadingCurrencies
                                        ? 'Cargando monedas...'
                                        : 'Seleccioná una moneda')}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={18} style={styles.selectorChevron} />
                    </TouchableOpacity>
                    {currencyError ? <Text style={styles.errorText}>{currencyError}</Text> : null}
                    {!currencyError ? (
                        <Text style={styles.helperText}>
                            {loadingCurrencies
                                ? 'Cargando catálogo de monedas...'
                                : 'Elegí con qué moneda querés enviar tu presupuesto.'}
                        </Text>
                    ) : null}
                </View>

                {shouldRenderScheduling ? (
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>Fechas propuestas</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => handleOpenPicker('start')}
                        >
                            <Ionicons name="calendar-outline" size={18} style={styles.dateIcon} />
                            <Text style={styles.dateText}>
                                {startDate ? startDate.toLocaleString('es-AR') : 'Fecha de inicio'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.dateButton, !startDate && styles.dateButtonDisabled]}
                            onPress={() => handleOpenPicker('end')}
                            disabled={!startDate}
                        >
                            <Ionicons name="calendar-clear-outline" size={18} style={styles.dateIcon} />
                            <Text style={styles.dateText}>
                                {endDate ? endDate.toLocaleString('es-AR') : 'Fecha de fin'}
                            </Text>
                        </TouchableOpacity>
                        {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
                    </View>
                ) : null}

                {shouldRenderValidity ? (
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>Vigencia de la oferta</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => handleOpenPicker('valid')}
                        >
                            <Ionicons name="time-outline" size={18} style={styles.dateIcon} />
                            <Text style={styles.dateText}>
                                {validUntil ? validUntil.toLocaleString('es-AR') : 'Fecha límite'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Notas para el cliente</Text>
                    <TextInput
                        style={[styles.input, styles.notesInput]}
                        placeholder="Detalles adicionales, condiciones o aclaraciones"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        maxLength={500}
                    />
                    <Text style={styles.helperText}>{notes.length}/500</Text>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, priceError && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!!priceError || submitting}
                >
                    <Text style={styles.submitButtonText}>Enviar presupuesto</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={currencyModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCurrencyModalVisible(false)}
            >
                <View style={styles.pickerOverlay}>
                    <View style={styles.currencySheet}>
                        <View style={styles.currencyHeader}>
                            <Text style={styles.currencyTitle}>Seleccionar moneda</Text>
                            <TouchableOpacity
                                onPress={() => setCurrencyModalVisible(false)}
                                style={styles.currencyClose}
                            >
                                <Ionicons name="close" size={22} style={styles.currencyCloseIcon} />
                            </TouchableOpacity>
                        </View>
                        {currencyError ? (
                            <View style={styles.currencyLoading}>
                                <Text style={styles.currencyLoadingText}>{currencyError}</Text>
                            </View>
                        ) : loadingCurrencies ? (
                            <View style={styles.currencyLoading}>
                                <ActivityIndicator color={PALETTE.primary} />
                                <Text style={styles.currencyLoadingText}>Cargando monedas...</Text>
                            </View>
                        ) : currencies.length ? (
                            <FlatList
                                data={currencies}
                                renderItem={({ item }) => {
                                    const isSelected = item.code === currency;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.currencyItem,
                                                isSelected && styles.currencyItemSelected,
                                            ]}
                                            onPress={() => handleSelectCurrency(item.code)}
                                        >
                                            <View style={styles.currencyItemInfo}>
                                                <Text style={styles.currencyItemCode}>{item.code}</Text>
                                                <Text style={styles.currencyItemName}>{item.name}</Text>
                                            </View>
                                            {isSelected ? (
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={22}
                                                    style={styles.currencyItemCheck}
                                                />
                                            ) : null}
                                        </TouchableOpacity>
                                    );
                                }}
                                keyExtractor={currencyKeyExtractor}
                                style={styles.currencyList}
                                keyboardShouldPersistTaps="handled"
                            />
                        ) : (
                            <View style={styles.currencyLoading}>
                                <Text style={styles.currencyLoadingText}>
                                    No encontramos monedas disponibles.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal
                visible={iosPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={dismissIosPicker}
            >
                <View style={styles.pickerOverlay}>
                    <View style={styles.pickerSheet}>
                        <DateTimePicker
                            value={iosPickerTempDate}
                            mode="datetime"
                            display="spinner"
                            minimumDate={iosMinimumDate}
                            minuteInterval={5}
                            onChange={(event, selectedDate) => {
                                if (selectedDate) {
                                    setIosPickerTempDate(selectedDate);
                                }
                            }}
                        />
                        <View style={styles.pickerActions}>
                            <TouchableOpacity style={styles.pickerAction} onPress={dismissIosPicker}>
                                <Text style={styles.pickerActionText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.pickerAction} onPress={applyIosPicker}>
                                <Text style={[styles.pickerActionText, styles.pickerActionPrimary]}>Aceptar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}
