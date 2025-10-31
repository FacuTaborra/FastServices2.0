import { StyleSheet } from 'react-native';
import { PALETTE } from '../../screens/HomePage/HomePage.styles';

export default StyleSheet.create({
    card: {
        backgroundColor: PALETTE.cardLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 2,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    typeBadgeFast: {
        backgroundColor: '#A4161A',
    },
    typeBadgeLicitacion: {
        backgroundColor: '#B1A7A6',
    },
    typeBadgeIcon: {
        marginRight: 4,
    },
    typeBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(148, 163, 184, 0.2)',
    },
    statusBadgePending: {
        backgroundColor: 'rgba(59, 130, 246, 0.18)',
    },
    statusBadgeAccepted: {
        backgroundColor: 'rgba(16, 185, 129, 0.18)',
    },
    statusBadgeRejected: {
        backgroundColor: 'rgba(239, 68, 68, 0.18)',
    },
    statusBadgeMuted: {
        backgroundColor: 'rgba(148, 163, 184, 0.18)',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: PALETTE.textSecondary,
        textTransform: 'uppercase',
    },
    statusBadgeTextPending: {
        color: PALETTE.primary,
    },
    statusBadgeTextAccepted: {
        color: '#059669',
    },
    statusBadgeTextRejected: {
        color: '#DC2626',
    },
    statusBadgeTextMuted: {
        color: '#475569',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: PALETTE.textPrimary,
        marginBottom: 4,
    },
    client: {
        fontSize: 14,
        color: PALETTE.textSecondary,
        marginBottom: 10,
    },
    amount: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: '600',
        color: PALETTE.textPrimary,
    },
});
