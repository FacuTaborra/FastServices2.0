import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    backButtonPlaceholder: {
        width: 40,
        height: 40,
    },
    statusWrapper: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        alignItems: 'center',
    },
    brandLogo: {
        width: 96,
        height: 96,
        marginBottom: 12,
    },
    statusTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    countdown: {
        fontSize: 54,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: 4,
    },
    statusSubtitle: {
        marginTop: 12,
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: 18,
        paddingBottom: 24,
    },
    offerCard: {
        backgroundColor: '#f0f5f2',
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    offerAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginRight: 16,
    },
    offerContent: {
        flex: 1,
    },
    offerName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
    },
    offerTagline: {
        marginTop: 4,
        fontSize: 14,
        color: '#6b7280',
    },
    offerMetaRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    offerPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    offerRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    offerRatingText: {
        marginLeft: 6,
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
    },
    acceptButton: {
        marginLeft: 16,
        backgroundColor: '#e57355',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 18,
    },
    acceptButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    footerWrapper: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    switchButton: {
        backgroundColor: '#0f766e',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    switchButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    switchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    switchButtonTextDisabled: {
        color: '#e2e8f0',
    },
    switchHelperText: {
        marginTop: 6,
        fontSize: 13,
        color: '#e2e8f0',
    },
});

export default styles;
