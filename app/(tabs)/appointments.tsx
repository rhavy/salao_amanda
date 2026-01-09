import { Appointment } from "@/constants/types"; // Importar tipo centralizado
import { useAuth } from "@/hooks/useAuth"; // Importa o hook de autenticação
import { fetchAPI } from "@/services/api";
import { requestNotificationPermission, scheduleReminders } from "@/services/notifications"; // Importar serviço
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect } from "expo-router"; // Importar useFocusEffect
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl, // Importar RefreshControl
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { toast } from 'sonner-native';


export default function AppointmentsScreen() {
    const { user } = useAuth(); // Obtém o usuário para garantir que a busca só ocorra se logado
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // Estado para pull-to-refresh
    const [filter, setFilter] = useState<'proximos' | 'passados'>('proximos');

    // Substituir useEffect por useFocusEffect para recarregar ao focar
    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadAppointments();
            }
        }, [user])
    );

    const loadAppointments = async () => {
        if (!user?.email) return;

        try {
            // setLoading(true); // Removido para evitar piscar tela toda vez que foca

            // 1. Busca Agendamentos
            const data = await fetchAPI(`/appointments/${user.email}`);
            setAppointments(data);

            // 2. Busca Configurações do Usuário para saber se agenda lembretes
            // Idealmente isso viria de um contexto global, mas vamos buscar aqui para garantir
            try {
                const profile = await fetchAPI(`/user/profile/${user.email}`);
                if (profile && (profile as any).notifications_reminders) {
                    const hasPermission = await requestNotificationPermission();
                    if (hasPermission) {
                        await scheduleReminders(data);
                        // console.log("Lembretes agendados!");
                    }
                }
            } catch (err) {
                console.log("Erro ao configurar notificações", err);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadAppointments();
    };

    const handleCancel = async (id: string) => {
        Alert.alert("Cancelar", "Tem certeza que deseja cancelar este agendamento?", [
            { text: "Não", style: "cancel" },
            {
                text: "Sim", style: "destructive", onPress: async () => {
                    try {
                        await fetchAPI(`/appointments/${id}`, { method: 'DELETE' });
                        toast.success("Agendamento cancelado."); // Usar toast para sucesso
                        loadAppointments(); // Recarrega a lista
                    } catch (error) {
                        toast.error("Não foi possível cancelar."); // Usar toast para erro
                    }
                }
            }
        ]);
    };

    const filteredData = useMemo(() => {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; // Comparação por string YYYY-MM-DD evita fuso

        return appointments.filter(item => {
            // item.date já vem como YYYY-MM-DD do backend
            if (filter === 'proximos') {
                return item.date >= todayString;
            } else {
                return item.date < todayString;
            }
        });
    }, [filter, appointments]);

    const StatusBadge = ({ status }: { status: string }) => {
        const colors = {
            confirmado: { bg: '#ECFDF5', text: '#10B981' },
            pendente: { bg: '#FFFBEB', text: '#F59E0B' },
            concluido: { bg: '#F3F4F6', text: '#6B7280' },
        };
        const current = colors[status as keyof typeof colors];

        return (
            <View style={[styles.badge, { backgroundColor: current.bg }]}>
                <Text style={[styles.badgeText, { color: current.text }]}>{status.toUpperCase()}</Text>
            </View>
        );
    };

    const renderItem = ({ item, index }: { item: Appointment, index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100)}
            style={styles.appointmentCard}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.dateLabel}>{new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</Text>
                <StatusBadge status={item.status} />
            </View>

            <Text style={styles.serviceTitle}>{item.serviceName}</Text>

            <View style={styles.cardFooter}>
                <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color="#999" />
                    <Text style={styles.infoText}>{item.time}</Text>
                </View>
                <Text style={styles.priceText}>R$ {Number(item.price || 0).toFixed(2)}</Text>
            </View>

            {/* Botão Cancelar apenas para agendamentos futuros não concluídos */}
            {filter === 'proximos' && item.status !== 'concluido' && (
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancel(item.id)}
                >
                    <Text style={styles.cancelButtonText}>CANCELAR</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'proximos' && styles.filterTabActive]}
                    onPress={() => setFilter('proximos')}
                >
                    <Text style={[styles.filterTabText, filter === 'proximos' && styles.filterTabTextActive]}>PRÓXIMOS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'passados' && styles.filterTabActive]}
                    onPress={() => setFilter('passados')}
                >
                    <Text style={[styles.filterTabText, filter === 'passados' && styles.filterTabTextActive]}>HISTÓRICO</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 50 }} color="#DB2777" />
            ) : (
                <FlashList
                    data={filteredData}
                    renderItem={renderItem}
                    // estimatedItemSize={150}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#DB2777" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={48} color="#DDD" />
                            <Text style={styles.emptyText}>Nenhum agendamento encontrado.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        justifyContent: 'center',
        gap: 20
    },
    filterTab: { paddingVertical: 8, paddingHorizontal: 15 },
    filterTabActive: { borderBottomWidth: 2, borderBottomColor: '#DB2777' },
    filterTabText: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1 },
    filterTabTextActive: { color: '#1A1A1A' },
    listContent: { padding: 20 },
    appointmentCard: {
        backgroundColor: '#FFF',
        borderRadius: 4,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dateLabel: { fontSize: 10, fontWeight: '800', color: '#DB2777', letterSpacing: 1.5 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    badgeText: { fontSize: 9, fontWeight: '800' },
    serviceTitle: { fontSize: 17, fontWeight: '500', color: '#1A1A1A', marginBottom: 15 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: 14, color: '#666' },
    priceText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
    cancelButton: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F9FAFB', alignItems: 'center' },
    cancelButtonText: { fontSize: 10, fontWeight: '700', color: '#999', letterSpacing: 1 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#BBB', fontSize: 14 }
});