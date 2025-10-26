import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './ProviderLicensesScreen.styles';
import Spinner from '../../components/Spinner/Spinner';
import apiService from '../../auth/apiService_auth';

const createEmptyLicense = () => ({
    title: '',
    license_number: '',
    description: '',
    issued_by: '',
    issued_at: '',
    expires_at: '',
});

export default function ProviderLicensesScreen({ navigation, route }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [existingLicenses, setExistingLicenses] = useState([]);
    const [licenses, setLicenses] = useState([createEmptyLicense()]);

    const fromRegister = route?.params?.fromRegister ?? false;

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const providerData = await apiService.getProviderProfile();
                const loadedLicenses = providerData?.provider_profile?.licenses ?? [];
                setExistingLicenses(loadedLicenses);
                if (loadedLicenses?.length) {
                    setLicenses([createEmptyLicense()]);
                }
            } catch (error) {
                console.error('❌ Error cargando perfil de proveedor:', error.message || error);
                Alert.alert(
                    'Error',
                    'No pudimos obtener la información del proveedor. Intenta nuevamente.',
                );
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const canAddMore = useMemo(() => licenses.length < 10, [licenses.length]);

    const handleLicenseChange = (index, field, value) => {
        setLicenses((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleAddLicense = () => {
        if (!canAddMore) {
            Alert.alert('Aviso', 'Puedes registrar hasta 10 licencias por ahora.');
            return;
        }
        setLicenses((prev) => [...prev, createEmptyLicense()]);
    };

    const handleRemoveLicense = (index) => {
        setLicenses((prev) => {
            if (prev.length === 1) {
                return [createEmptyLicense()];
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const navigateToProviderHome = () => {
        navigation.reset({
            index: 0,
            routes: [
                {
                    name: 'ProviderMain',
                    params: {
                        screen: 'ProviderRequests',
                        animation: fromRegister ? 'fade' : undefined,
                    },
                },
            ],
        });
    };

    const handleSubmit = async () => {
        const normalize = (value) => {
            const trimmed = value?.trim?.();
            return trimmed && trimmed.length > 0 ? trimmed : null;
        };

        const prepared = [];
        for (let index = 0; index < licenses.length; index += 1) {
            const raw = licenses[index];
            const normalizedTitle = normalize(raw.title);
            const normalizedNumber = normalize(raw.license_number);
            const normalizedDescription = normalize(raw.description);
            const normalizedIssuedBy = normalize(raw.issued_by);
            const normalizedIssuedAt = normalize(raw.issued_at);
            const normalizedExpiresAt = normalize(raw.expires_at);

            const isEmpty =
                !normalizedTitle &&
                !normalizedNumber &&
                !normalizedDescription &&
                !normalizedIssuedBy &&
                !normalizedIssuedAt &&
                !normalizedExpiresAt;

            if (isEmpty) {
                continue;
            }

            if (!normalizedTitle) {
                Alert.alert('Datos incompletos', `Completa el título en la licencia #${index + 1}.`);
                return;
            }

            if (!normalizedNumber && !normalizedDescription) {
                Alert.alert(
                    'Información requerida',
                    `En la licencia #${index + 1} ingresa un número de licencia o describe tu certificado de idoneidad.`,
                );
                return;
            }

            const isValidDate = (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
            if (!isValidDate(normalizedIssuedAt) || !isValidDate(normalizedExpiresAt)) {
                Alert.alert(
                    'Fecha inválida',
                    `Usá el formato YYYY-MM-DD para las fechas de la licencia #${index + 1}.`,
                );
                return;
            }

            prepared.push({
                title: normalizedTitle,
                license_number: normalizedNumber,
                description: normalizedDescription,
                issued_by: normalizedIssuedBy,
                issued_at: normalizedIssuedAt,
                expires_at: normalizedExpiresAt,
            });
        }

        if (!prepared.length) {
            Alert.alert(
                'Sin información',
                'Agrega al menos una licencia o certificado, o selecciona "Cargar más tarde".',
            );
            return;
        }

        setSaving(true);
        try {
            await apiService.createProviderLicenses(prepared);
            Alert.alert('Licencias guardadas', 'Tus licencias fueron registradas correctamente.', [
                {
                    text: 'Continuar',
                    onPress: navigateToProviderHome,
                },
            ]);
        } catch (error) {
            console.error('❌ Error guardando licencias:', error.message || error);
            const message =
                error?.data?.detail ||
                error?.message ||
                'No pudimos guardar las licencias. Verifica los datos e intenta nuevamente.';
            Alert.alert('Error', message);
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        if (!fromRegister) {
            navigateToProviderHome();
            return;
        }

        Alert.alert(
            'Omitir licencias',
            'Podrás registrar licencias más adelante desde tu perfil. ¿Quieres continuar sin cargarlas ahora?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Continuar', style: 'destructive', onPress: navigateToProviderHome },
            ],
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Spinner />
                <Text style={styles.loadingText}>Preparando formulario...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Licencias y Certificados de Idoneidad</Text>
                    <Text style={styles.subtitle}>
                        Registra tus licencias habilitantes o describe el certificado que avala tu idoneidad para brindar el servicio.
                    </Text>
                </View>

                {existingLicenses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Licencias registradas</Text>
                        {existingLicenses.map((license) => (
                            <View key={license.id} style={styles.existingLicenseCard}>
                                <View style={styles.existingLicenseHeader}>
                                    <Text style={styles.existingLicenseTitle}>{license.title}</Text>
                                    <Text style={styles.existingLicenseNumber}>
                                        {license.license_number ? `#${license.license_number}` : 'Certificado'}
                                    </Text>
                                </View>
                                {license.issued_by ? (
                                    <Text style={styles.existingLicenseMeta}>Emitida por {license.issued_by}</Text>
                                ) : null}
                                {license.description ? (
                                    <Text style={styles.existingLicenseMeta}>{license.description}</Text>
                                ) : null}
                                {license.expires_at ? (
                                    <Text style={styles.existingLicenseMeta}>Vence {license.expires_at}</Text>
                                ) : null}
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Agregar nuevas licencias o certificados</Text>
                    {licenses.map((license, index) => (
                        <View key={`license-${index}`} style={styles.licenseCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Licencia #{index + 1}</Text>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleRemoveLicense(index)}
                                >
                                    <Ionicons name="trash" size={18} color="#B91C1C" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Título de la licencia o certificado *"
                                value={license.title}
                                onChangeText={(text) => handleLicenseChange(index, 'title', text)}
                                autoCapitalize="sentences"
                            />

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe lo mas claro posible tu licencia o certificado de idoneidad *"
                                value={license.description}
                                onChangeText={(text) => handleLicenseChange(index, 'description', text)}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Número de licencia (opcional)"
                                value={license.license_number}
                                onChangeText={(text) => handleLicenseChange(index, 'license_number', text)}
                                autoCapitalize="characters"
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Entidad emisora (opcional)"
                                value={license.issued_by}
                                onChangeText={(text) => handleLicenseChange(index, 'issued_by', text)}
                            />

                            <View style={styles.inlineRow}>
                                <TextInput
                                    style={[styles.input, styles.inlineInput]}
                                    placeholder="Emitida (YYYY-MM-DD)"
                                    value={license.issued_at}
                                    onChangeText={(text) => handleLicenseChange(index, 'issued_at', text)}
                                />
                                <TextInput
                                    style={[styles.input, styles.inlineInput, styles.inlineInputSpacing]}
                                    placeholder="Vence (YYYY-MM-DD)"
                                    value={license.expires_at}
                                    onChangeText={(text) => handleLicenseChange(index, 'expires_at', text)}
                                />
                            </View>

                        </View>
                    ))}

                    <TouchableOpacity style={styles.addButton} onPress={handleAddLicense}>
                        <Ionicons name="add" size={20} color="#2563EB" />
                        <Text style={styles.addButtonText}>Agregar otra licencia</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.primaryButton, saving && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={saving}
                    >
                        <Text style={styles.primaryButtonText}>
                            {saving ? 'Guardando...' : 'Guardar licencias'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
                        <Text style={styles.secondaryButtonText}>Cargar más tarde</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {saving && (
                <View style={styles.savingOverlay}>
                    <Spinner />
                </View>
            )}
        </KeyboardAvoidingView>
    );
}
