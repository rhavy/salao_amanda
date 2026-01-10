import useAuth from "@/hooks/useAuth";
import { fetchAPI } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { SlideInUp } from "react-native-reanimated";
import { toast } from 'sonner-native';

interface ScheduleModalProps {
    visible: boolean;
    onClose: () => void;
    serviceName?: string;
    servicePrice?: number;
}

export default function ScheduleModal({ visible, onClose, serviceName, servicePrice }: ScheduleModalProps) {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableDays, setAvailableDays] = useState<string[]>([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

    useEffect(() => {
        if (visible) {
            loadConfig();
        } else {
            // Limpar seleções ao fechar
            setSelectedDate(null);
            setSelectedTime(null);
        }
    }, [visible]);

    const loadConfig = async () => {
        try {
            const data = await fetchAPI('/config/info');
            setAvailableDays(data.DAYS || []);
            setAvailableTimeSlots(data.TIME_SLOTS || []);
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
        }
    };

    const nextDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
    });

    const handleConfirm = async () => {
        if (selectedDate === null || !selectedTime) {
            toast.warning("Por favor, escolha o dia e o horário.");
            return;
        }

        const chosenDate = nextDays[selectedDate];
        const formattedDate = chosenDate.toISOString().split('T')[0]; // YYYY-MM-DD

        try {
            if (!user?.email) {
                toast.warning("Erro: Você precisa estar logado(a) para agendar.");
                return;
            }
            const userEmail = user.email;
            const appointmentId = `${Date.now()}`; // ID temporário

            await fetchAPI('/appointments', {
                method: 'POST',
                body: JSON.stringify({
                    id: appointmentId,
                    user_email: userEmail,
                    serviceName: serviceName || "Serviço",
                    date: formattedDate,
                    time: selectedTime,
                    status: "pendente",
                    price: servicePrice || 0,
                }),
            });

            toast.success("Agendamento realizado com sucesso!");
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Falha ao agendar");
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Animated.View
                    entering={SlideInUp.springify().damping(15)}
                    style={styles.modalContent}
                >
                    {/* Indicador de Arraste (Visual) */}
                    <View style={styles.dragIndicator} />

                    <View style={styles.headerRow}>
                        <View style={styles.headerText}>
                            <Text style={styles.welcomeText}>AGENDAMENTO</Text>
                            <Text style={styles.title}>{serviceName || "Escolha o Horário"}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#999" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Seleção de Data */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>PRÓXIMOS DIAS</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
                                {nextDays.map((date, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setSelectedDate(index)}
                                        style={[styles.dateCard, selectedDate === index && styles.dateCardActive]}
                                    >
                                        <Text style={[styles.dayText, selectedDate === index && styles.whiteText]}>
                                            {availableDays[date.getDay()] || "Dia"}
                                        </Text>
                                        <Text style={[styles.dateNumber, selectedDate === index && styles.whiteText]}>
                                            {date.getDate()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Seleção de Horário */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>HORÁRIOS DISPONÍVEIS</Text>
                            <View style={styles.timeGrid}>
                                {availableTimeSlots.map((time) => (
                                    <TouchableOpacity
                                        key={time}
                                        onPress={() => setSelectedTime(time)}
                                        style={[styles.timeChip, selectedTime === time && styles.timeChipActive]}
                                    >
                                        <Text style={[styles.timeText, selectedTime === time && styles.whiteText]}>
                                            {time}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Botão Final */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                                <Text style={styles.confirmButtonText}>CONFIRMAR AGENDAMENTO</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FAFAFA',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 25,
        paddingBottom: 40,
        maxHeight: Dimensions.get('window').height * 0.85,
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    headerText: { flex: 1 },
    welcomeText: { fontSize: 10, letterSpacing: 3, color: '#DB2777', fontWeight: '700', marginBottom: 4 },
    title: { fontSize: 22, fontWeight: '300', color: '#333' },
    closeButton: {
        padding: 5,
    },
    section: { marginBottom: 30 },
    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: '#BBB', marginBottom: 15 },
    dateList: { flexDirection: 'row' },
    dateCard: {
        width: 60,
        height: 80,
        backgroundColor: '#FFF',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    dateCardActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
    dayText: { fontSize: 11, color: '#999', marginBottom: 4 },
    dateNumber: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    timeChip: {
        paddingVertical: 12,
        flex: 1,
        minWidth: '28%',
        backgroundColor: '#FFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'center'
    },
    timeChipActive: { backgroundColor: '#DB2777', borderColor: '#DB2777' },
    timeText: { fontSize: 13, fontWeight: '600', color: '#666' },
    whiteText: { color: '#FFF' },
    footer: { marginTop: 10 },
    confirmButton: {
        height: 55,
        backgroundColor: '#1A1A1A',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', letterSpacing: 2 }
});