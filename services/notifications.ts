import * as Notifications from 'expo-notifications';

// Configuração do Handler (como a notificação aparece quando o app está aberto)
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

// Interface para agendamento (compatível com a do appointments.tsx)
interface Appointment {
    id: string;
    serviceName: string;
    date: string;
    time: string;
    status: 'confirmado' | 'pendente' | 'concluido';
}

export async function formatDateForNotification(date: string, time: string): Promise<Date | null> {
    try {
        // Formato esperado: date="YYYY-MM-DD", time="HH:mm"
        const [year, month, day] = date.split('-').map(Number);
        const [hour, minute] = time.split(':').map(Number);

        const appointmentDate = new Date(year, month - 1, day, hour, minute);

        // Se data inválida
        if (isNaN(appointmentDate.getTime())) return null;

        return appointmentDate;
    } catch (e) {
        return null;
    }
}

export async function scheduleReminders(appointments: Appointment[]) {
    // 1. Cancelar todas as notificações agendadas para evitar duplicidade
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();

    // 2. Filtrar e agendar para cada compromisso futuro
    for (const appt of appointments) {
        if (appt.status === 'concluido') continue;

        const dateObj = await formatDateForNotification(appt.date, appt.time);

        if (!dateObj || dateObj < now) continue; // Pula datas passadas ou inválidas

        // Lembrete: 1 hora antes (ou na hora se já estiver em cima)
        // Vamos definir para 30 minutos antes
        const triggerDate = new Date(dateObj.getTime() - 30 * 60000);

        // Se 30min antes já passou, mas o evento é futuro, agenda para "agora" ou ignora? 
        // Vamos agendar apenas se triggerDate for futuro.
        if (triggerDate > now) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Lembrete de Agendamento 💅",
                    body: `Seu horário de ${appt.serviceName} é hoje às ${appt.time}!`,
                    sound: true,
                    data: { appointmentId: appt.id },
                },
                trigger: {
                    seconds: Math.max(1, Math.floor((triggerDate.getTime() - now.getTime()) / 1000)),
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    repeats: false
                },
            });
        }
    }
}

export async function requestNotificationPermission() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}
