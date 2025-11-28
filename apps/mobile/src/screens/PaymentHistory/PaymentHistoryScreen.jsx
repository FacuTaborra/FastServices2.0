import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import styles from './PaymentHistoryScreen.styles';
import { getPaymentHistory } from '../../services/payments.service';

export default function PaymentHistoryScreen() {
    const navigation = useNavigation();

    const { data: payments, isLoading, refetch } = useQuery({
        queryKey: ['paymentHistory'],
        queryFn: getPaymentHistory,
        onError: () => {
            Alert.alert("Error", "No se pudo cargar el historial de pagos.");
        }
    });

    const formatCurrency = (amount, currency) => {
        try {
            const numericValue = Number(amount);
            if (Number.isNaN(numericValue)) return amount;

            return new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: currency || 'ARS',
                minimumFractionDigits: 2
            }).format(numericValue);
        } catch (e) {
            return `$${amount}`;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const renderItem = ({ item }) => {
        const isRefunded = item.status === 'CANCELED';
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceTitle}>{item.service_title}</Text>
                        <Text style={styles.providerName}>{item.provider_name}</Text>
                    </View>
                    <View style={styles.amountContainer}>
                        <Text style={styles.amount}>{formatCurrency(item.amount, item.currency)}</Text>
                        <View style={[styles.statusBadge, isRefunded ? styles.statusRefunded : styles.statusCompleted]}>
                            <Text style={[styles.statusText, isRefunded ? styles.statusTextRefunded : styles.statusTextCompleted]}>
                                {isRefunded ? 'Reembolsado' : 'Pagado'}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={styles.cardFooter}>
                    <Text style={styles.date}>{formatDate(item.date)}</Text>
                    <TouchableOpacity style={styles.receiptButton}>
                        <Text style={styles.receiptButtonText}>Ver Recibo</Text>
                        <Ionicons name="document-text-outline" size={14} color="#2563EB" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historial de Pagos</Text>
            </View>

            {isLoading ? (
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={payments}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={isLoading}
                    onRefresh={refetch}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                            <Text style={styles.emptyText}>No tienes pagos registrados</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
