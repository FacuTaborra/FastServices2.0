import React, { useEffect, useMemo, useState } from 'react';
import {
    Image,
    SafeAreaView,
    FlatList,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import styles from './FastMatchScreen.styles';

const MATCH_WINDOW_SECONDS = 5 * 60;

const MOCK_OFFERS = [
    {
        id: 'offer-1',
        name: 'Provider Name A',
        tagline: 'Always ready to help!',
        price: 35,
        rating: 4.8,
        avatar: 'https://i.pravatar.cc/150?img=12',
    },
    {
        id: 'offer-2',
        name: 'Provider Name B',
        tagline: 'Your friendly local expert.',
        price: 30,
        rating: 4.5,
        avatar: 'https://i.pravatar.cc/150?img=32',
    },
    {
        id: 'offer-3',
        name: 'Provider Name C',
        tagline: 'Connecting communities.',
        price: 42,
        rating: 4.9,
        avatar: 'https://i.pravatar.cc/150?img=57',
    },
    {
        id: 'offer-4',
        name: 'Provider Name C',
        tagline: 'Connecting communities.',
        price: 42,
        rating: 4.9,
        avatar: 'https://i.pravatar.cc/150?img=57',
    },

];

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0');
    const remainder = Math.floor(seconds % 60)
        .toString()
        .padStart(2, '0');
    return `${minutes}:${remainder}`;
};

export default function FastMatchScreen() {
    const navigation = useNavigation();
    const [remainingSeconds, setRemainingSeconds] = useState(MATCH_WINDOW_SECONDS);

    useEffect(() => {
        const interval = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formattedTime = useMemo(
        () => formatTime(remainingSeconds),
        [remainingSeconds],
    );

    const renderOffer = ({ item }) => (
        <View style={styles.offerCard}>
            <Image source={{ uri: item.avatar }} style={styles.offerAvatar} />
            <View style={styles.offerContent}>
                <Text style={styles.offerName}>{item.name}</Text>
                <Text style={styles.offerTagline}>{item.tagline}</Text>
                <View style={styles.offerMetaRow}>
                    <Text style={styles.offerPrice}>{`€${item.price.toFixed(2)}`}</Text>
                    <View style={styles.offerRating}>
                        <Ionicons name="star" size={16} color="#f4b331" />
                        <Text style={styles.offerRatingText}>{item.rating.toFixed(1)}</Text>
                    </View>
                </View>
            </View>
            <TouchableOpacity style={styles.acceptButton} activeOpacity={0.9}>
                <Text style={styles.acceptButtonText}>Aceptar</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <View style={styles.backButtonPlaceholder} />
            </View>

            <View style={styles.statusWrapper}>
                <Image
                    source={require('../../../assets/icon.png')}
                    style={styles.brandLogo}
                    resizeMode="contain"
                />
                <Text style={styles.statusTitle}>Buscando prestadores...</Text>
                <Text style={styles.countdown}>{formattedTime}</Text>
                <Text style={styles.statusSubtitle}>
                    Te mostramos las primeras ofertas que van llegando.
                </Text>
            </View>

            <FlatList
                data={MOCK_OFFERS}
                keyExtractor={(item) => item.id}
                renderItem={renderOffer}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <View style={styles.footerWrapper}>
                <TouchableOpacity
                    style={[styles.switchButton, remainingSeconds > 0 && styles.switchButtonDisabled]}
                    activeOpacity={remainingSeconds > 0 ? 1 : 0.9}
                    disabled={remainingSeconds > 0}
                >
                    <Text style={[styles.switchButtonText, remainingSeconds > 0 && styles.switchButtonTextDisabled]}>
                        Pasar a licitación
                    </Text>
                    {remainingSeconds > 0 && (
                        <Text style={styles.switchHelperText}>
                            Disponible cuando termine la búsqueda rápida
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
