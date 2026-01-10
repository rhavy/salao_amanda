import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    SafeAreaView as RNSafeAreaView
} from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { getAppointments, updateAppointmentStatus, deleteAppointment } from "@/services/api";

type FilterType = 'all' | 'pending' | 'today' | 'confirmed' | 'finished' | 'canceled' | 'apagado';

export default function AdminPanelScreen() {
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Função utilitária para normalizar datas do banco (evita erro de Invalid Date no iOS)
    const parseDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        return new Date(dateStr.replace(/-/g, '\/'));
    };

    const fetchAppointments = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const data = await getAppointments();
            setAppointments(data);
        } catch (error) {
            toast.error("Falha ao buscar agendamentos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchAppointments(true);
        setIsRefreshing(false);
    }, [fetchAppointments]);

    const stats = useMemo(() => {
        const todayStr = new Date().toDateString();
        const attended = appointments.filter(a => a.status === 'finished');

        return {
            total: attended.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0),
            pendingCount: appointments.filter(a => a.status === 'pending').length,
            confirmedCount: appointments.filter(a => a.status === 'confirmed').length,
            finishedCount: appointments.filter(a => a.status === 'finished').length,
            canceledCount: appointments.filter(a => a.status === 'canceled').length,
            apagadoCount: appointments.filter(a => a.status === 'apagado').length,
            todayCount: appointments.filter(a => parseDate(a.date).toDateString() === todayStr).length,
            allCount: appointments.length
        };
    }, [appointments]);

    const filteredAppointments = useMemo(() => {
        const todayStr = new Date().toDateString();
        return appointments.filter(a => {
            const matchesStatus = () => {
                if (filterStatus === 'all') return true;
                if (filterStatus === 'today') return parseDate(a.date).toDateString() === todayStr;
                return a.status === filterStatus;
            };
            const name = a.userName?.toLowerCase() || "";
            const service = a.serviceName?.toLowerCase() || "";
            return matchesStatus() && (name.includes(searchQuery.toLowerCase()) || service.includes(searchQuery.toLowerCase()));
        });
    }, [appointments, filterStatus, searchQuery]);

    const handleUpdateStatus = async (item: any, newStatus: string) => {
        try {
            await updateAppointmentStatus(item.id, newStatus);
            toast.success(`Status atualizado para ${newStatus.toUpperCase()}`);
            fetchAppointments(true); // Atualiza em background
        } catch (error) {
            toast.error("Falha ao atualizar status.");
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert("Excluir Agendamento", "Deseja remover permanentemente?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Excluir", style: "destructive", onPress: async () => {
                    try {
                        await deleteAppointment(id);
                        toast.success("Agendamento removido.");
                        fetchAppointments(true);
                    } catch (error) {
                        toast.error("Erro ao excluir.");
                    }
                }
            }
        ]);
    };

    const renderAppointment = ({ item, index }: { item: any, index: number }) => {
        const statusTheme = {
            pending: { color: "#F59E0B", bg: "#FFFBEB", label: "PENDENTE" },
            confirmed: { color: "#3B82F6", bg: "#EFF6FF", label: "CONFIRMADO" },
            finished: { color: "#10B981", bg: "#F0FDF4", label: "CONCLUÍDO" },
            canceled: { color: "#EF4444", bg: "#FEE2E2", label: "CANCELADO" },
            apagado: { color: "#9CA3AF", bg: "#F3F4F6", label: "APAGADO" },
        };
        const theme = statusTheme[item.status as keyof typeof statusTheme] || statusTheme.pending;

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50)}
                layout={LinearTransition}
                style={[
                    styles.appointmentCard,
                    item.status === 'finished' && { opacity: 0.7 },
                    item.status === 'apagado' && { opacity: 0.5 }
                ]}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.clientInfo}>
                        <View style={[styles.statusDot, { backgroundColor: theme.color }]} />
                        <Text style={styles.clientName}>{item.userName?.toUpperCase() || 'CLIENTE'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
                        <Text style={[styles.statusLabel, { color: theme.color }]}>{theme.label}</Text>
                    </View>
                </View>

                <Text style={styles.serviceTitle}>{item.serviceName}</Text>

                <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={14} color="#999" />
                    <Text style={styles.timeText}>
                        {item.date ? parseDate(item.date).toLocaleDateString('pt-BR') : '--/--'} às {item.time || '--:--'}
                    </Text>
                    <Text style={styles.cardPrice}>R$ {Number(item.price || 0).toFixed(2)}</Text>
                </View>

                <View style={styles.cardActions}>
                    <View style={styles.statusButtons}>
                        <TouchableOpacity
                            onPress={() => handleUpdateStatus(item, 'pending')}
                            style={[styles.actionBtn, styles.inactiveBtn, item.status === 'pending' || item.status === 'apagado' ? styles.activePending : styles.inactiveBtn]}
                        >
                            <Ionicons name="time" size={16} color={item.status === 'pending' ? "white" : "#A0A0A0"} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleUpdateStatus(item, 'confirmed')}
                            style={[styles.actionBtn, styles.inactiveBtn, item.status === 'confirmed' && styles.activeConfirmed]}
                            disabled={item.status === 'apagado'}
                        >
                            <Ionicons name="checkmark-circle" size={16} color={item.status === 'confirmed' ? "white" : "#A0A0A0"} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleUpdateStatus(item, 'finished')}
                            style={[styles.actionBtn, styles.inactiveBtn, item.status === 'finished' && styles.activeFinished]}
                            disabled={item.status === 'apagado'}
                        >
                            <Ionicons name="cash" size={16} color={item.status === 'finished' ? "white" : "#A0A0A0"} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleUpdateStatus(item, 'canceled')}
                            style={[styles.actionBtn, styles.inactiveBtn, item.status === 'canceled' && styles.activeCanceled]}
                            disabled={item.status === 'apagado'}
                        >
                            <Ionicons name="close-circle" size={16} color={item.status === 'canceled' ? "white" : "#A0A0A0"} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}
                        disabled={item.status === 'apagado'}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <LinearGradient colors={['#1A1A1A', '#333']} style={StyleSheet.absoluteFill} />
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.headerLabel}>GESTÃO DE </Text>
                            <Text style={styles.headerTitle}>Agendamentos</Text>
                        </View>
                        <View style={styles.headerStats}>
                            <Text style={styles.totalValue}>R$ {stats.total.toFixed(0)}</Text>
                            <Text style={styles.totalLabel}>RECEBIDO</Text>
                        </View>
                    </View>

                    <View style={styles.searchWrapper}>
                        <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar cliente ou serviço..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </SafeAreaView>
            </View>

            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <FilterTab active={filterStatus === 'all'} label="Todos" count={stats.allCount} onPress={() => setFilterStatus('all')} />
                    <FilterTab active={filterStatus === 'today'} label="Hoje" count={stats.todayCount} onPress={() => setFilterStatus('today')} />
                    <FilterTab active={filterStatus === 'pending'} label="Pendentes" count={stats.pendingCount} onPress={() => setFilterStatus('pending')} />
                    <FilterTab active={filterStatus === 'confirmed'} label="Confirmados" count={stats.confirmedCount} onPress={() => setFilterStatus('confirmed')} />
                    <FilterTab active={filterStatus === 'finished'} label="Concluídos" count={stats.finishedCount} onPress={() => setFilterStatus('finished')} />
                    <FilterTab active={filterStatus === 'canceled'} label="Cancelados" count={stats.canceledCount} onPress={() => setFilterStatus('canceled')} />
                    <FilterTab active={filterStatus === 'apagado'} label="Apagados" count={stats.apagadoCount} onPress={() => setFilterStatus('apagado')} />
                </ScrollView>
            </View>

            <FlashList
                data={filteredAppointments}
                renderItem={renderAppointment}
                // estimatedItemSize={180}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={48} color="#DDD" />
                            <Text style={styles.emptyText}>Nenhum agendamento encontrado.</Text>
                        </View>
                    ) : null
                }
                ListHeaderComponent={loading && !isRefreshing ? <ActivityIndicator size="small" color="#D4AF37" style={{ marginTop: 20 }} /> : null}
            />
        </View>
    );
}

const FilterTab = ({ active, label, count, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={[styles.filterTab, active && styles.filterTabActive]}>
        <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{label.toUpperCase()}</Text>
        {count > 0 && (
            <View style={[styles.countBadge, active && styles.countBadgeActive]}>
                <Text style={[styles.countText, active && styles.countTextActive]}>{count}</Text>
            </View>
        )}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        paddingHorizontal: 25,
        paddingBottom: 30,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        overflow: 'hidden'
    },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 25, marginTop: 10 },
    headerLabel: { color: '#D4AF37', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
    headerTitle: { color: 'white', fontSize: 28, fontWeight: '200' },
    headerStats: { alignItems: 'flex-end' },
    totalValue: { color: 'white', fontSize: 22, fontWeight: '700' },
    totalLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '700' },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    searchInput: { flex: 1, marginLeft: 10, color: 'white', fontSize: 14 },
    filterSection: { marginVertical: 20 },
    filterScroll: { paddingHorizontal: 25, gap: 10 },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#EEE'
    },
    filterTabActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
    filterTabText: { fontSize: 10, fontWeight: '800', color: '#999', letterSpacing: 0.5 },
    filterTabTextActive: { color: '#D4AF37' },
    countBadge: { marginLeft: 8, backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    countBadgeActive: { backgroundColor: 'rgba(212, 175, 55, 0.2)' },
    countText: { fontSize: 9, fontWeight: '800', color: '#BBB' },
    countTextActive: { color: '#D4AF37' },
    appointmentCard: {
        backgroundColor: 'white',
        marginHorizontal: 25,
        marginBottom: 15,
        padding: 20,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F9FAFB'
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    clientInfo: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
    clientName: { fontSize: 9, fontWeight: '800', color: '#BBB', letterSpacing: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusLabel: { fontSize: 8, fontWeight: '900' },
    serviceTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    timeText: { fontSize: 12, color: '#999', flex: 1 },
    cardPrice: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F9FAFB'
    },
    statusButtons: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    inactiveBtn: { backgroundColor: '#F0F0F0', borderColor: '#E0E0E0' },
    activePending: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
    activeConfirmed: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    activeFinished: { backgroundColor: '#10B981', borderColor: '#10B981' },
    activeCanceled: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
    deleteBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
    emptyText: { marginTop: 15, color: '#999', fontSize: 14, fontWeight: '500' }
});