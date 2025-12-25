import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { auth, db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { toast } from "sonner-native";

interface Appointment {
    id: string;
    serviceName: string;
    date: Date;
    price: number;
    status: 'confirmed' | 'pending' | 'finished';
    professional: string;
    userId: string;
}

const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).toUpperCase();
};

const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const getStatusTheme = (appointmentDate: Date, status: string) => {
    if (status === 'finished') return { border: "border-l-gray-300", bg: "bg-white" };

    const now = new Date();
    const diffHours = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) return { border: "border-l-red-400", bg: "bg-red-50/30" };
    if (diffHours <= 2) return { border: "border-l-yellow-400", bg: "bg-yellow-50/50" };
    return { border: "border-l-green-400", bg: "bg-white" };
};

export default function AppointmentsScreen() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) { setLoading(false); return; }

        const q = query(
            collection(db, "appointments"),
            where("userId", "==", user.uid),
            orderBy("date", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: (doc.data().date as Timestamp).toDate(),
            })) as Appointment[];
            setAppointments(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCancel = (id: string) => {
        Alert.alert("Cancelar", "Deseja remover este agendamento?", [
            { text: "Voltar", style: "cancel" },
            {
                text: "Remover", style: "destructive", onPress: async () => {
                    try {
                        await deleteDoc(doc(db, "appointments", id));
                        toast.success("Removido com sucesso.");
                    } catch (e) { toast.error("Erro ao remover."); }
                }
            },
        ]);
    };

    const renderItem: ListRenderItem<Appointment> = ({ item, index }) => {
        const theme = getStatusTheme(item.date, item.status);

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50).duration(500)}
                exiting={FadeOut}
                className={`mx-4 mb-4 rounded-xl bg-white shadow-sm border-l-4 ${theme.border} ${theme.bg} flex-row items-center p-4`}
            >
                <View className="items-center justify-center rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 mr-4">
                    <Text className="text-[10px] font-bold text-gray-400">{formatDate(item.date).split(" ")[1]}</Text>
                    <Text className="text-xl font-bold text-gray-700">{item.date.getDate()}</Text>
                </View>

                <View className="flex-1">
                    <View className="flex-row justify-between items-center">
                        <ThemedText type="defaultSemiBold" className="text-gray-800">{item.serviceName}</ThemedText>
                        <View className={`px-2 py-0.5 rounded-full ${item.status === 'confirmed' ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Text className={`text-[9px] font-black ${item.status === 'confirmed' ? 'text-green-700' : 'text-gray-500'}`}>
                                {item.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <Text className="text-gray-500 text-xs mt-1">
                        <Ionicons name="time-outline" size={12} /> {formatTime(item.date)} • {item.professional}
                    </Text>
                </View>

                {item.status !== 'finished' && (
                    <TouchableOpacity onPress={() => handleCancel(item.id)} className="ml-2 p-2 bg-red-50 rounded-full">
                        <Ionicons name="trash" size={18} color="#f87171" />
                    </TouchableOpacity>
                )}
            </Animated.View>
        );
    };

    return (
        <ThemedView className="flex-1 bg-gray-50">
            {loading ? (
                <View className="flex-1 justify-center items-center"><ActivityIndicator color="#ec4899" /></View>
            ) : (
                <FlashList
                    data={appointments}
                    renderItem={renderItem}
                    estimatedItemSize={90}
                    ListHeaderComponent={
                        <Animated.View entering={FadeInDown} className="bg-pink-500 p-6 pt-16 rounded-b-[40px] mb-6 shadow-lg">
                            <Text className="text-white/80 font-medium">Sua Agenda</Text>
                            <Text className="text-3xl font-bold text-white mb-4">Meus Horários</Text>

                            {/* ✅ Legenda de Cores integrada no Header */}
                            <View className="bg-white/10 p-4 rounded-2xl border border-white/20 mb-2">
                                <Text className="text-white text-[10px] font-bold mb-3 uppercase tracking-widest">Legenda de Status</Text>

                                <View className="flex-row items-center mb-2">
                                    <View className="h-2.5 w-2.5 rounded-full bg-green-300 mr-3" />
                                    <Text className="text-white text-xs opacity-90">Mais de 2h para o início</Text>
                                </View>

                                <View className="flex-row items-center mb-2">
                                    <View className="h-2.5 w-2.5 rounded-full bg-yellow-300 mr-3" />
                                    <Text className="text-white text-xs opacity-90">Próximo (menos de 2h)</Text>
                                </View>

                                <View className="flex-row items-center">
                                    <View className="h-2.5 w-2.5 rounded-full bg-red-300 mr-3" />
                                    <Text className="text-white text-xs opacity-90">Horário já passou</Text>
                                </View>
                            </View>

                            <View className="flex-row mt-4">
                                <View className="bg-white/20 px-4 py-1.5 rounded-full">
                                    <Text className="text-white text-[10px] font-bold">
                                        {appointments.filter(a => a.status !== 'finished').length} Agendamentos Ativos
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center mt-20 opacity-30">
                            <Ionicons name="calendar" size={80} color="#9ca3af" />
                            <Text className="mt-4 font-bold">Nenhum horário marcado</Text>
                        </View>
                    }
                />
            )}
        </ThemedView>
    );
}