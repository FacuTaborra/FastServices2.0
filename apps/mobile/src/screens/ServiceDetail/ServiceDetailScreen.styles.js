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
        paddingTop: 20,
        paddingBottom: 24,
    },
    summaryCard: {
        marginTop: 20,
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
    statusBadge_onRoute: {
        backgroundColor: '#bfdbfe',
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 16,
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
    timelineCard: {
        marginTop: 24,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#0f172a',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    timelineSection: {
        marginTop: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingBottom: 24,
    },
    timelineItemLast: {
        paddingBottom: 0,
    },
    timelineMarkerWrapper: {
        width: 28,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    timelineConnector: {
        width: 2,
        flex: 1,
        borderRadius: 1,
        backgroundColor: '#dbeafe',
    },
    timelineBullet: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#cbd5f5',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineBulletInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2563eb',
    },
    timelineContent: {
        flex: 1,
        marginLeft: 16,
    },
    timelineLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
    },
    timelineTimestamp: {
        marginTop: 4,
        fontSize: 12,
        color: '#64748b',
    },
    timelineDescription: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
        color: '#1f2937',
    },
    timelineEmptyText: {
        fontSize: 13,
        color: '#64748b',
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: '#ffffff',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 999,
        backgroundColor: '#2563eb',
    },
    primaryButtonIcon: {
        marginRight: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
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
    ratingThankYou: {
        fontSize: 14,
        color: '#0f172a',
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
    providerCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#0f172a',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    providerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    providerAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e2e8f0',
    },
    providerInfoColumn: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    providerNameLarge: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    providerStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        marginLeft: 4,
    },
    reviewsText: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 6,
    },
    buttonSpinner: {
        marginRight: 6,
    },
    buttonIcon: {
        marginRight: 6,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rehireButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 999,
        backgroundColor: '#4F46E5',
        minHeight: 52,
    },
    rehireButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 8,
    },
    completedActionsContainer: {
        gap: 12,
    },
    completedMessage: {
        fontSize: 14,
        color: '#0f172a',
        textAlign: 'center',
    },
});

export default styles;
