import { StyleSheet } from 'react-native';
import { PALETTE } from '../HomePage/HomePage.styles';

export default StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: PALETTE.backgroundLight,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: PALETTE.cardLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: PALETTE.borderSubtle,
    },
    backIcon: {
        color: PALETTE.textPrimary,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: PALETTE.textPrimary,
    },
    card: {
        backgroundColor: PALETTE.cardLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: PALETTE.borderSubtle,
        shadowColor: '#00000020',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    summaryCard: {
        marginTop: 0,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: PALETTE.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sectionLabelNoSpacing: {
        marginBottom: 0,
    },
    rewriteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#EEF2FF',
        gap: 6,
    },
    rewriteButtonDisabled: {
        opacity: 0.7,
    },
    rewriteButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6366F1',
    },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: PALETTE.borderSubtle,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: PALETTE.textPrimary,
        backgroundColor: PALETTE.white,
    },
    notesInput: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    helperText: {
        marginTop: 6,
        fontSize: 12,
        color: PALETTE.textSecondary,
    },
    errorText: {
        marginTop: 8,
        fontSize: 12,
        color: PALETTE.danger,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: PALETTE.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: PALETTE.borderSubtle,
        marginBottom: 8,
    },
    dateButtonDisabled: {
        opacity: 0.5,
    },
    dateIcon: {
        color: PALETTE.textSecondary,
        marginRight: 10,
    },
    dateText: {
        fontSize: 15,
        color: PALETTE.textPrimary,
    },
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: PALETTE.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: PALETTE.borderSubtle,
    },
    selectorIcon: {
        color: PALETTE.textSecondary,
        marginRight: 12,
    },
    selectorInfo: {
        flex: 1,
    },
    selectorCode: {
        fontSize: 16,
        fontWeight: '600',
        color: PALETTE.textPrimary,
    },
    selectorName: {
        fontSize: 13,
        color: PALETTE.textSecondary,
        marginTop: 2,
    },
    selectorChevron: {
        color: PALETTE.textSecondary,
        marginLeft: 12,
    },
    submitButton: {
        marginTop: 4,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: PALETTE.primary,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: PALETTE.white,
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: '#00000055',
        justifyContent: 'flex-end',
    },
    pickerSheet: {
        backgroundColor: PALETTE.cardLight,
        paddingBottom: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderColor: PALETTE.borderSubtle,
    },
    currencySheet: {
        backgroundColor: PALETTE.cardLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: PALETTE.borderSubtle,
        paddingHorizontal: 20,
        paddingBottom: 28,
        paddingTop: 20,
        maxHeight: '65%',
    },
    currencyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    currencyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: PALETTE.textPrimary,
    },
    currencyClose: {
        padding: 6,
    },
    currencyCloseIcon: {
        color: PALETTE.textSecondary,
    },
    currencyList: {
        paddingBottom: 12,
    },
    currencyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: PALETTE.borderSubtle,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 10,
        backgroundColor: PALETTE.cardLight,
    },
    currencyItemSelected: {
        backgroundColor: PALETTE.infoSoft,
        borderColor: PALETTE.primary,
    },
    currencyItemInfo: {
        flex: 1,
        marginRight: 12,
    },
    currencyItemCode: {
        fontSize: 16,
        fontWeight: '700',
        color: PALETTE.textPrimary,
    },
    currencyItemName: {
        fontSize: 13,
        color: PALETTE.textSecondary,
        marginTop: 2,
    },
    currencyItemCheck: {
        color: PALETTE.primary,
    },
    currencyLoading: {
        paddingVertical: 20,
    },
    currencyLoadingText: {
        textAlign: 'center',
        color: PALETTE.textSecondary,
    },
    pickerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 12,
    },
    pickerAction: {
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    pickerActionText: {
        fontSize: 16,
        fontWeight: '500',
        color: PALETTE.textSecondary,
    },
    pickerActionPrimary: {
        color: PALETTE.primary,
        fontWeight: '700',
    },
});
