import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    iconButton: {
        height: 40,
        width: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e2e8f0',
    },
    iconButtonPlaceholder: {
        width: 40,
        height: 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0f172a',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    summaryCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#0f172a',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryHeaderText: {
        flex: 1,
        marginLeft: 12,
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    providerName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#475569',
    },
    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    statusBadge_default: {
        backgroundColor: '#e2e8f0',
    },
    statusBadge_confirmed: {
        backgroundColor: '#dbeafe',
    },
    statusBadge_inProgress: {
        backgroundColor: '#c7d2fe',
    },
    statusBadge_completed: {
        backgroundColor: '#dcfce7',
    },
    statusBadge_canceled: {
        backgroundColor: '#fee2e2',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0f172a',
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    detailIcon: {
        marginTop: 2,
        marginRight: 12,
    },
    detailColumn: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 15,
        color: '#0f172a',
    },
    detailHint: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
    },
    infoBanner: {
        flexDirection: 'row',
        padding: 16,
        marginTop: 16,
        borderRadius: 12,
        backgroundColor: '#e0f2fe',
    },
    infoBannerText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#0f172a',
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: '#ffffff',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 999,
        backgroundColor: '#ef4444',
    },
    cancelButtonDisabled: {
        backgroundColor: '#fca5a5',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fef2f2',
    },
    cancelHelper: {
        marginTop: 8,
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    loadingText: {
        fontSize: 15,
        color: '#475569',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ef4444',
        marginTop: 12,
    },
    errorSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 4,
    },
    buttonSpinner: {
        marginRight: 6,
    },
    buttonIcon: {
        marginRight: 6,
    },
});

export default styles;
