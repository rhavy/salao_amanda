import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

let Notifications: any = null;

const loadNotifications = () => {
    if (Notifications) return Notifications;

    // Evitar crash no Expo Go (Android) SDK 53+ que removeu suporte a notificações remotas
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo && Platform.OS === 'android') {
        console.warn("Notificações desativadas no Expo Go (Android) para evitar crash.");
        return null;
    }

    try {
        Notifications = require('expo-notifications');

        // Tenta configurar apenas se carregar com sucesso
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            }),
        });
        return Notifications;
    } catch (error) {
        console.warn("Expo Notifications não suportado neste ambiente.", error);
        return null;
    }
};

interface Appointment {
    id: string;
    serviceName: string;
    date: string;
    time: string;
    status: 'confirmado' | 'pendente' | 'concluido';
}

export async function formatDateForNotification(date: string, time: string): Promise<Date | null> {
    try {
        const [year, month, day] = date.split('-').map(Number);
        const [hour, minute] = time.split(':').map(Number);
        const appointmentDate = new Date(year, month - 1, day, hour, minute);
        if (isNaN(appointmentDate.getTime())) return null;
        return appointmentDate;
    } catch (e) {
        return null;
    }
}

export async function scheduleReminders(appointments: Appointment[]) {
    const Notif = loadNotifications();
    if (!Notif) return;

    try {
        await Notif.cancelAllScheduledNotificationsAsync();
        const now = new Date();

        for (const appt of appointments) {
            if (appt.status === 'concluido') continue;
            const dateObj = await formatDateForNotification(appt.date, appt.time);
            if (!dateObj || dateObj < now) continue;

            // 30 minutos antes
            const triggerDate = new Date(dateObj.getTime() - 30 * 60000);

            if (triggerDate > now) {
                const diffSeconds = Math.max(1, Math.floor((triggerDate.getTime() - now.getTime()) / 1000));

                await Notif.scheduleNotificationAsync({
                    content: {
                        title: "Lembrete de Agendamento 💅",
                        body: `Seu horário de ${appt.serviceName} é hoje às ${appt.time}!`,
                        sound: true,
                        data: { appointmentId: appt.id },
                    },
                    trigger: {
                        seconds: diffSeconds,
                        type: Notif.SchedulableTriggerInputTypes.TIME_INTERVAL,
                        repeats: false
                    },
                });
            }
        }
    } catch (error) {
        console.log("Erro ao agendar notificações:", error);
    }
}

export async function requestNotificationPermission() {
    const Notif = loadNotifications();
    if (!Notif) return false;

    try {
        const { status: existingStatus } = await Notif.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notif.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    } catch (error) {
        console.log("Erro ao pedir permissão de notificação:", error);
        return false;
    }
}
