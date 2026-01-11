import { Message } from "@/constants/types";
import { useAuth } from "@/hooks/useAuth";
import { fetchAPI } from "@/services/api";
import { getSocket } from "@/services/socket";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeInUp } from "react-native-reanimated";

export default function AdminChatScreen() {
    const { user } = useAuth();
    const socket = getSocket();

    // Estados principais
    const [chats, setChats] = useState<any[]>([]); // Lista de contatos
    const [selectedUser, setSelectedUser] = useState<any | null>(null); // Usuário focado
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const scrollViewRef = useRef<ScrollView>(null);

    // 1. Carregar lista de conversas ativas
    useEffect(() => {
        loadChatList();

        socket.on('new_message', (msg: Message) => {
            // Se a mensagem for do usuário que estou conversando agora, atualiza o chat
            if (selectedUser && msg.user_email === selectedUser.email) {
                setMessages(prev => [...prev, msg]);
            }
            loadChatList(); // Atualiza a lista lateral/resumo
        });

        // Admin needs to join a general admin room to receive read receipts from users
        if (socket && !socket.connected) {
            socket.connect();
        }
        socket.emit('join_room', 'admin_room'); // Admin joins a general room

        socket.on('message_read_receipt', (data: { readerEmail: string; readByUserEmail: string; actor: string; timestamp: string }) => {
            console.log("message_read_receipt received in admin:", data);
            // Update the UI to reflect messages being read
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    (msg.user_email === data.readByUserEmail && msg.sender === 'admin' && data.actor === 'user')
                        ? { ...msg, is_read_by_recipient: true }
                        : msg
                )
            );
            setChats(prevChats =>
                prevChats.map(chat =>
                    (chat.email === data.readerEmail && data.actor === 'user')
                        ? { ...chat, unread: false } // Mark as read in chat list
                        : chat
                )
            );
        });

        return () => {
            socket.off('new_message');
            socket.off('message_read_receipt');
        };
    }, [selectedUser]);

    const loadChatList = async () => {
        try {
            const data = await fetchAPI('/chat/admin/list'); // Rota que retorna lista de quem mandou msg
            setChats(data);
        } catch (e) { console.error(e); }
    };

    const openChat = async (contact: any) => {
        setSelectedUser(contact);
        try {
            const data = await fetchAPI(`/chat/${contact.email}`);
            setMessages(data);
            socket.emit('join_room', contact.email); // Entra na sala do cliente
            socket.emit('mark_read', { userEmail: contact.email, actor: 'admin' }); // Mark messages from user as read
        } catch (e) { console.error(e); }
    };

    const handleSend = () => {
        if (!inputText.trim() || !user?.email) return;

        const tempId = Date.now();
        const content = inputText.trim();

        // 1. Emitir via Socket (Real-time)
        socket.emit('send_message', {
            email: selectedUser.email,
            content: content,
            sender: 'admin'
        });

        // 2. Update Otimista na UI
        const tempMessage: Message = {
            id: tempId,
            user_email: selectedUser.email,
            sender: 'admin',
            content: content,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, tempMessage]);
        setInputText("");

        // Scroll
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    };

    // --- RENDERIZAÇÃO DA LISTA DE CONVERSAS ---
    if (!selectedUser) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <View style={styles.adminHeader}>
                    <LinearGradient colors={['#1A1A1A', '#333']} style={StyleSheet.absoluteFill} />
                    <Text style={styles.adminHeaderLabel}>CENTRAL DE MENSAGENS</Text>
                    <Text style={styles.adminHeaderTitle}>Conversas Ativas</Text>
                </View>

                <FlatList
                    data={chats}
                    keyExtractor={(item) => item.email}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInRight.delay(index * 100)}>
                            <TouchableOpacity style={styles.chatListItem} onPress={() => openChat(item)}>
                                <View style={styles.chatAvatar}>
                                    <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
                                    {item.unread && <View style={styles.unreadBadge} />}
                                </View>
                                <View style={styles.chatInfo}>
                                    <Text style={styles.chatName}>{item.name}</Text>
                                    <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMessage}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#D4AF37" />
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                />
            </SafeAreaView>
        );
    }

    // --- RENDERIZAÇÃO DO CHAT ABERTO ---
    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.chatHeader}>
                <TouchableOpacity onPress={() => setSelectedUser(null)}>
                    <Ionicons name="chevron-back" size={24} color="#D4AF37" />
                </TouchableOpacity>
                <View style={styles.headerUserInfo}>
                    <Text style={styles.headerUserName}>{selectedUser.name}</Text>
                    <Text style={styles.headerUserStatus}>respondendo cliente...</Text>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg, i) => (
                    <View key={i} style={[styles.bubble, msg.sender === 'admin' ? styles.bubbleAdmin : styles.bubbleUser]}>
                        <Text style={[styles.msgText, msg.sender === 'admin' ? styles.textWhite : styles.textBlack]}>
                            {msg.content}
                        </Text>
                        <View style={styles.messageStatus}>
                            <Text style={styles.timeText}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            {msg.sender === 'admin' && msg.is_read_by_recipient && (
                                <Ionicons name="checkmark-done" size={14} color="#D4AF37" style={styles.readIcon} />
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                style={styles.inputArea}
            >
                <TextInput
                    style={styles.input}
                    placeholder="Escreva para a cliente..."
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                    <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    // Estilos Lista Admin
    adminHeader: { padding: 25, paddingTop: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' },
    adminHeaderLabel: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    adminHeaderTitle: { color: 'white', fontSize: 26, fontWeight: '200', marginTop: 5 },
    chatListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    chatAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FDFCF0', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D4AF37' },
    avatarText: { color: '#D4AF37', fontWeight: 'bold' },
    unreadBadge: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'white' },
    chatInfo: { flex: 1, marginLeft: 15 },
    chatName: { fontWeight: '700', fontSize: 15, color: '#1A1A1A' },
    lastMsg: { color: '#94A3B8', fontSize: 12, marginTop: 2 },

    // Estilos Janela de Chat
    chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerUserInfo: { marginLeft: 15 },
    headerUserName: { fontWeight: '700', fontSize: 16 },
    headerUserStatus: { fontSize: 10, color: '#10B981' },
    messagesContent: { padding: 20 },
    bubble: { maxWidth: '80%', padding: 15, borderRadius: 20, marginBottom: 10 },
    bubbleAdmin: { alignSelf: 'flex-end', backgroundColor: '#1A1A1A', borderBottomRightRadius: 4 },
    bubbleUser: { alignSelf: 'flex-start', backgroundColor: '#E2E8F0', borderBottomLeftRadius: 4 },
    textWhite: { color: 'white' },
    textBlack: { color: '#1A1A1A' },
    msgText: { fontSize: 14, lineHeight: 20 },
    timeText: { fontSize: 8, color: '#999', marginTop: 5, alignSelf: 'flex-end' },
    inputArea: { flexDirection: 'row', padding: 15, backgroundColor: 'white', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    input: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, maxHeight: 100 },
    sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
    messageStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 5,
    },
    readIcon: {
        marginLeft: 5,
    }
});