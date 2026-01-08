import { useAuth } from "@/hooks/useAuth";
import { fetchAPI } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

interface Message {
    id: number;
    user_email: string;
    sender: 'user' | 'admin';
    content: string;
    created_at: string;
}

export default function ChatScreen() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Carregar mensagens periodicamente a cada 5 segundos
    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadMessages();
                const interval = setInterval(loadMessages, 5000);
                return () => clearInterval(interval);
            }
        }, [user])
    );

    const loadMessages = async () => {
        if (!user?.email) return;
        try {
            const data = await fetchAPI(`/chat/${user.email}`);
            // Verificar se houve mudança para evitar re-render desnecessário (opcional)
            setMessages(data);
        } catch (error) {
            console.error("Erro ao carregar chat", error);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !user?.email) return;

        const tempMessage: Message = {
            id: Date.now(), // ID temporário
            user_email: user.email,
            sender: 'user',
            content: inputText,
            created_at: new Date().toISOString()
        };

        // UI Optimistic Update
        setMessages(prev => [...prev, tempMessage]);
        setInputText("");
        setSending(true);

        // Scroll para baixo
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            await fetchAPI('/chat', {
                method: 'POST',
                body: JSON.stringify({
                    email: user.email,
                    content: tempMessage.content,
                    sender: 'user'
                })
            });
            // Recarrega para pegar o ID real e garantir sincronia
            loadMessages();
        } catch (error) {
            console.error(error);
            // Opção: mostrar erro na mensagem
        } finally {
            setSending(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Fale Conosco</Text>
                <Text style={styles.headerSubtitle}>Respondemos em instantes</Text>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={48} color="#DDD" />
                        <Text style={styles.emptyText}>Envie uma mensagem para iniciar o atendimento.</Text>
                    </View>
                ) : (
                    messages.map((msg, index) => {
                        const isUser = msg.sender === 'user';
                        return (
                            <View key={index} style={[styles.messageRow, isUser ? styles.rowUser : styles.rowAdmin]}>
                                {!isUser && (
                                    <View style={styles.adminAvatar}>
                                        <Text style={styles.adminInitials}>SA</Text>
                                    </View>
                                )}
                                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAdmin]}>
                                    <Text style={[styles.messageText, isUser ? styles.textUser : styles.textAdmin]}>{msg.content}</Text>
                                    <Text style={[styles.timeText, isUser ? styles.timeUser : styles.timeAdmin]}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={styles.inputContainer}
            >
                <TextInput
                    style={styles.input}
                    placeholder="Digite sua mensagem..."
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Ionicons name="send" size={20} color="#FFF" />
                    )}
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        alignItems: 'center'
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
    headerSubtitle: { fontSize: 12, color: '#10B981', marginTop: 2, fontWeight: '600' },
    messagesContainer: { flex: 1 },
    messagesContent: { padding: 15, paddingBottom: 20 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#9CA3AF', marginTop: 10 },
    messageRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
    rowUser: { justifyContent: 'flex-end' },
    rowAdmin: { justifyContent: 'flex-start' },
    adminAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#DB2777',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8
    },
    adminInitials: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    bubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
    },
    bubbleUser: {
        backgroundColor: '#DB2777',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 4,
    },
    bubbleAdmin: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    messageText: { fontSize: 15, lineHeight: 20 },
    textUser: { color: '#FFF' },
    textAdmin: { color: '#1F2937' },
    timeText: { fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
    timeUser: { color: 'rgba(255,255,255,0.7)' },
    timeAdmin: { color: '#9CA3AF' },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#FFF',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    input: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#DB2777',
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendButtonDisabled: {
        backgroundColor: '#FBCFE8'
    }
});
