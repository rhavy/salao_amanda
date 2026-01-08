import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert("Atenção", "Por favor, digite seu e-mail.");
            return;
        }
        setLoading(true);
        // Simulação de envio
        setTimeout(() => {
            setLoading(false);
            Alert.alert("Sucesso", "Link de recuperação enviado para o seu e-mail!");
            router.back();
        }, 2000);
    };

    return (
        <View style={styles.container}>
            {/* Detalhe Decorativo de Fundo */}
            <View style={styles.circleDecorator} />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Botão Voltar Minimalista */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </TouchableOpacity>

                    {/* Cabeçalho Sophisticated */}
                    <Animated.View
                        entering={FadeInUp.duration(1000).springify()}
                        style={styles.header}
                    >
                        <Text style={styles.brandName}>AMANDA</Text>
                        <View style={styles.divider} />
                        <Text style={styles.brandSubtitle}>RECUPERAR SENHA</Text>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(200).duration(800)}
                        style={styles.content}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="mail-open-outline" size={40} color="#DB2777" />
                        </View>

                        <Text style={styles.description}>
                            Digite seu e-mail abaixo. Enviaremos as instruções para você criar uma nova senha com segurança.
                        </Text>

                        {/* Input Minimalista */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>E-MAIL DE CADASTRO</Text>
                            <TextInput
                                placeholder="exemplo@email.com"
                                placeholderTextColor="#A0A0A0"
                                style={styles.input}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        {/* Botão de Ação Premium */}
                        <TouchableOpacity
                            onPress={handleResetPassword}
                            disabled={loading}
                            style={[styles.mainButton, loading && { opacity: 0.8 }]}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>ENVIAR LINK</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.footerLink}
                        >
                            <Text style={styles.footerText}>
                                Lembrou a senha? <Text style={styles.linkBold}>Voltar</Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    circleDecorator: {
        position: 'absolute',
        bottom: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#FDF2F8',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        marginBottom: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    brandName: {
        fontSize: 32,
        fontWeight: '300',
        letterSpacing: 10,
        color: '#333',
    },
    divider: {
        height: 1,
        width: 30,
        backgroundColor: '#DB2777',
        marginVertical: 8,
    },
    brandSubtitle: {
        fontSize: 10,
        letterSpacing: 3,
        color: '#DB2777',
        fontWeight: '700',
    },
    content: {
        flex: 1,
        width: '100%',
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    description: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
        paddingHorizontal: 10,
    },
    inputWrapper: {
        marginBottom: 40,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        color: '#999',
        marginBottom: 10,
    },
    input: {
        height: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        fontSize: 16,
        color: '#333',
        paddingHorizontal: 5,
    },
    mainButton: {
        height: 55,
        backgroundColor: '#1A1A1A',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    footerLink: {
        marginTop: 30,
        alignItems: 'center',
        marginBottom: 40,
    },
    footerText: {
        color: '#999',
        fontSize: 14,
    },
    linkBold: {
        color: '#DB2777',
        fontWeight: 'bold',
    },
});