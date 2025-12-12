import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
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
    iconButtonPlaceholder: {
        width: 40,
    },
    scrollContent: {
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: 40,
    },

    // Provider Card
    providerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
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
    providerCardLabel: {
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
        width: 56,
        height: 56,
        borderRadius: 28,
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
    rehireBadge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    rehireBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1D4ED8',
    },

    // Form
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    helperText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 6,
    },
    textInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
    },
    multilineInput: {
        minHeight: 140,
        textAlignVertical: 'top',
        paddingTop: 14,
    },
    charCount: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4,
    },

    // Attachments
    attachmentSection: {
        marginTop: 8,
    },
    attachmentEmptyBox: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    attachmentEmptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
    },
    attachmentsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    attachmentCard: {
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    attachmentPreview: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    attachmentOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    attachmentOverlayText: {
        color: '#FFFFFF',
        fontSize: 11,
        marginTop: 4,
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(220, 38, 38, 0.9)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachmentStatusIcon: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#16A34A',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachmentErrorIcon: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#DC2626',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addAttachmentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 12,
        gap: 8,
    },
    addAttachmentButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },

    // Submit
    submitButton: {
        backgroundColor: '#4F46E5',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#4F46E5',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    submitButtonDisabled: {
        backgroundColor: '#A5B4FC',
        ...Platform.select({
            ios: {
                shadowOpacity: 0,
            },
            android: {
                elevation: 0,
            },
        }),
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    // Info Banner
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        gap: 10,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        color: '#92400E',
        lineHeight: 18,
    },
});





