import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function TermsAndConditionsScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Términos y Condiciones</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>1. Introducción</Text>
                <Text style={styles.paragraph}>
                    Bienvenido a FastServices. Al utilizar nuestra aplicación, aceptas cumplir con estos términos y condiciones.
                    Nuestra plataforma conecta a proveedores de servicios con clientes que requieren asistencia en diversas tareas.
                </Text>

                <Text style={styles.sectionTitle}>2. Uso de Inteligencia Artificial</Text>
                <Text style={styles.paragraph}>
                    FastServices utiliza tecnologías avanzadas de Inteligencia Artificial (IA) para mejorar la experiencia del usuario, incluyendo pero no limitado a:
                    {'\n'}• Recomendación inteligente de proveedores.
                    {'\n'}• Análisis de descripciones de tareas para mejorar el emparejamiento.
                    {'\n'}• Moderación de contenido y seguridad.
                    {'\n'}• Asistencia automatizada en el soporte al cliente.
                </Text>
                <Text style={styles.paragraph}>
                    Al aceptar estos términos, reconoces y aceptas que parte de tus interacciones y datos pueden ser procesados por sistemas de IA para estos fines.
                </Text>

                <Text style={styles.sectionTitle}>3. Privacidad y Datos</Text>
                <Text style={styles.paragraph}>
                    Nos comprometemos a proteger tu privacidad. Recopilamos información personal necesaria para el funcionamiento del servicio,
                    como nombre, ubicación e historial de servicios. No compartimos tus datos con terceros sin tu consentimiento, salvo lo requerido por ley.
                </Text>

                <Text style={styles.sectionTitle}>4. Responsabilidades del Usuario</Text>
                <Text style={styles.paragraph}>
                    Te comprometes a utilizar la plataforma de manera ética y legal. No toleramos comportamientos abusivos, discriminatorios o fraudulentos.
                    Nos reservamos el derecho de suspender o eliminar cuentas que violen estas normas.
                </Text>

                <Text style={styles.sectionTitle}>5. Modificaciones</Text>
                <Text style={styles.paragraph}>
                    FastServices se reserva el derecho de modificar estos términos en cualquier momento. Te notificaremos sobre cambios significativos a través de la aplicación.
                </Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: 16,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
        marginBottom: 16,
    },
});

