import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './ProviderProposalCard.styles';

export default function ProviderProposalCard({ item, onPress }) {
    if (!item) {
        return null;
    }

    const requestType = (item.requestType || '').toUpperCase();
    const isFast = requestType === 'FAST' || requestType === 'FAST_MATCH';

    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onPress}>
            <View style={styles.topRow}>
                <View style={[styles.typeBadge, isFast ? styles.typeBadgeFast : styles.typeBadgeLicitacion]}>
                    <Ionicons
                        name={isFast ? 'flash' : 'hammer'}
                        size={11}
                        color="#fff"
                        style={styles.typeBadgeIcon}
                    />
                    <Text style={styles.typeBadgeText}>{isFast ? 'FAST' : 'Presupuesto'}</Text>
                </View>
                <View
                    style={[styles.statusBadge,
                    item.status === 'accepted' && styles.statusBadgeAccepted,
                    item.status === 'pending' && styles.statusBadgePending,
                    item.status === 'rejected' && styles.statusBadgeRejected,
                    (item.status === 'withdrawn' || item.status === 'expired') && styles.statusBadgeMuted,
                    ]}
                >
                    <Text style={[styles.statusBadgeText,
                    item.status === 'accepted' && styles.statusBadgeTextAccepted,
                    item.status === 'pending' && styles.statusBadgeTextPending,
                    item.status === 'rejected' && styles.statusBadgeTextRejected,
                    (item.status === 'withdrawn' || item.status === 'expired') && styles.statusBadgeTextMuted,
                    ]}
                    >
                        {item.statusLabel}
                    </Text>
                </View>
            </View>

            <Text style={styles.title} numberOfLines={2}>
                {item.title}
            </Text>
            <Text style={styles.client} numberOfLines={1}>
                {item.clientName || 'Cliente reservado'}
            </Text>
            <Text style={styles.amount} numberOfLines={1}>
                {item.amountLabel || 'Sin monto declarado'}
            </Text>
        </TouchableOpacity>
    );
}
