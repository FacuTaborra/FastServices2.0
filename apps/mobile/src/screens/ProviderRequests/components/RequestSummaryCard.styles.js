import { StyleSheet } from 'react-native';
import { PALETTE } from '../../HomePage/HomePage.styles';

export default StyleSheet.create({
    card: {
        backgroundColor: PALETTE.cardLight,
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: PALETTE.borderSubtle,
        shadowColor: '#00000020',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    headerLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: PALETTE.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PALETTE.primary,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginRight: 12,
    },
    typeBadgeText: {
        color: PALETTE.white,
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: PALETTE.textPrimary,
    },
    meta: {
        fontSize: 13,
        color: PALETTE.textSecondary,
        marginTop: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    statusText: {
        marginLeft: 8,
        color: PALETTE.textPrimary,
        fontSize: 14,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: PALETTE.borderSubtle,
        marginVertical: 16,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    detailRowLast: {
        marginBottom: 0,
    },
    detailIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    detailColumn: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: PALETTE.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    detailValue: {
        fontSize: 15,
        color: PALETTE.textPrimary,
        fontWeight: '500',
    },
    detailHint: {
        fontSize: 13,
        color: PALETTE.textSecondary,
        marginTop: 4,
    },
});
