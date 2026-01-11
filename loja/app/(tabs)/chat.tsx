import { Message } from "@/constants/types"; // Importar tipo centralizado
import useAuth from "@/hooks/useAuth";
import { fetchAPI } from "@/services/api";
import { getSocket } from "@/services/socket"; // Importar socket
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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


export default function ChatScreen() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const socket = getSocket(); // Obter instância do socket

    // Configurar Socket ao entrar na tela
    useEffect(() => {
        if (user?.email) {
            // Conectar
            if (!socket.connected) socket.connect();

            // Entrar na sala do usuário
            socket.emit('join_room', user.email);

            // Ouvir novas mensagens (em tempo real)
            socket.on('new_message', (newMessage: Message) => {
                setMessages((prev) => {
                    const isDuplicate = prev.some(m => m.id === newMessage.id);
                    if (!isDuplicate) {
                        // Mark as read if the current user is the recipient and the message is from the admin
                        if (newMessage.sender === 'admin') {
                            socket.emit('mark_read', { userEmail: user.email, actor: 'user' });
                        }
                        return [...prev, newMessage];
                    }
                    return prev;
                });
                // Scroll para baixo ao receber
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            });

            socket.on('message_read_receipt', (data: { readerEmail: string; readByUserEmail: string; actor: string; timestamp: string }) => {
                console.log("message_read_receipt received in user:", data);
                // Update the UI to reflect messages being read
                setMessages(prevMessages => 
                    prevMessages.map(msg => 
                        (msg.user_email === data.readByUserEmail && msg.sender === 'user' && data.actor === 'admin')
                            ? { ...msg, is_read_by_recipient: true }
                            : msg
                    )
                );
            });

            return () => {
                socket.off('new_message');
                socket.off('message_read_receipt');
            };
        }
    }, [user, socket]);

    // Carregar histórico inicial (apenas uma vez ao focar)
    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadMessages();
            }
        }, [user])
    );

    const loadMessages = async () => {
        if (!user?.email) return;
        try {
            const data = await fetchAPI(`/chat/${user.email}`);
            setMessages(data);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 200);
            // Emite mark_read event after loading messages
            socket.emit('mark_read', { userEmail: user.email, actor: 'user' });
        } catch (error) {
            console.error("Erro ao carregar chat", error);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !user?.email) return;

        const tempId = Date.now();
        const content = inputText.trim();

        // 1. Emitir via Socket (Real-time)
        socket.emit('send_message', {
            email: user.email,
            content: content,
            sender: 'user'
        });

        // 2. Update Otimista na UI
        const tempMessage: Message = {
            id: tempId,
            user_email: user.email,
            sender: 'user',
            content: content,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, tempMessage]);
        setInputText("");

        // Scroll
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Fale Conosco</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                    <Text style={styles.headerSubtitle}>Online (WebSocket)</Text>
                </View>
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
                                    <View style={styles.messageStatus}>
                                        <Text style={[styles.timeText, isUser ? styles.timeTextUser : styles.timeTextAdmin]}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        {isUser && msg.is_read_by_recipient && (
                                            <Ionicons name="checkmark-done" size={14} color="#FFF" style={styles.readIcon} />
                                        )}
                                    </View>
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
                    disabled={!inputText.trim()}
                >
                    <Ionicons name="send" size={20} color="#FFF" />
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
    timeTextUser: { color: 'rgba(255,255,255,0.7)' },
    timeTextAdmin: { color: '#9CA3AF' },
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
    },
    messageStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    readIcon: {
        marginLeft: 5,
        color: 'rgba(255,255,255,0.7)', // Cor do checkmark para mensagens do usuário
    }
});
