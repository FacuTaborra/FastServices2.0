import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scroll: {
        flex: 1,
    },
    content: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    existingLicenseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    existingLicenseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    existingLicenseTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    existingLicenseNumber: {
        fontSize: 12,
        color: '#2563EB',
        fontWeight: '600',
    },
    existingLicenseMeta: {
        fontSize: 12,
        color: '#6B7280',
    },
    licenseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    removeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
    },
    input: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    inlineRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inlineInput: {
        flex: 1,
    },
    inlineInputSpacing: {
        marginLeft: 12,
    },
    textArea: {
        minHeight: 90,
        includeFontPadding: false,
        textAlignVertical: 'top',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
    },
    addButtonText: {
        marginLeft: 8,
        color: '#2563EB',
        fontWeight: '600',
    },
    footer: {
        marginTop: 12,
    },
    primaryButton: {
        backgroundColor: '#2563EB',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#4B5563',
        fontSize: 14,
        fontWeight: '500',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    savingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#6B7280',
    },
});

export default styles;
