import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    container: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    iconButton: {
        padding: 8,
        borderRadius: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
        marginRight: 40,
    },
    scrollContent: {
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
    },

    // Request Card
    requestCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    rehireBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
    },
    rehireBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4F46E5',
        letterSpacing: 0.5,
    },
    requestTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    requestDescription: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
    },
    requestMeta: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    requestMetaText: {
        fontSize: 13,
        color: '#6B7280',
    },

    // Attachments dentro del request card
    attachmentsSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    attachmentsLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    attachmentsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    attachmentImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },

    // Provider Card
    providerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    providerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    providerAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E5E7EB',
        marginRight: 14,
    },
    providerInfoColumn: {
        flex: 1,
    },
    providerName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    providerStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginLeft: 4,
    },
    reviewsText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 2,
    },
    noProviderText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },

    // Waiting Section (sin propuesta aún)
    waitingSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        alignItems: 'center',
    },
    waitingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    waitingBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400E',
    },
    waitingHint: {
        marginTop: 8,
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
    },

    // Proposal Section (cuando hay propuesta)
    proposalSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    proposalItem: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    proposalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    proposalLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    proposalPrice: {
        fontSize: 22,
        fontWeight: '700',
        color: '#059669',
    },
    proposalNotes: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginTop: 8,
    },
    proposalDate: {
        marginTop: 8,
        fontSize: 12,
        color: '#9CA3AF',
    },

    // Info Banner
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        gap: 10,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        color: '#3730A3',
        lineHeight: 18,
    },

    // Footer con botón
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    acceptButton: {
        flexDirection: 'row',
        backgroundColor: '#059669',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    acceptButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
