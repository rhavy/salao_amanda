import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import * as Notifications from 'expo-notifications'; // Import expo-notifications
import { auth, db } from "@/config/firebase"; // Import auth and db
import { onAuthStateChanged } from "firebase/auth"; // Import onAuthStateChanged
import { collection, query, where, getDocs, doc, onSnapshot, Timestamp } from "firebase/firestore"; // Import Firestore methods

// Configurações para lidar com notificações em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  // 1. Gerenciar o estado de autenticação do usuário
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. Solicitar permissões de notificação e escutar preferências de lembrete
  useEffect(() => {
    const setupNotifications = async () => {
      if (!currentUser) {
        setRemindersEnabled(false);
        await Notifications.cancelAllScheduledNotificationsAsync(); // Cancela notificações se deslogado
        return;
      }

      // Solicitar permissões de notificação
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Permissão de notificação não concedida!');
        // Opcional: Mostrar um alerta ou instruir o usuário a ativar manualmente
        return;
      }

      // Escutar a preferência de lembretes do usuário no Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const enabled = data?.notifications?.reminders || false;
          setRemindersEnabled(enabled);
        } else {
          setRemindersEnabled(false);
        }
      });

      return () => unsubscribeFirestore(); // Limpa o listener do Firestore
    };

    setupNotifications();
  }, [currentUser]); // Executa quando o currentUser muda

  // 3. Agendar notificações com base nas preferências e agendamentos
  useEffect(() => {
    const scheduleAppointmentReminders = async () => {
      if (!currentUser || !remindersEnabled) {
        await Notifications.cancelAllScheduledNotificationsAsync(); // Cancela se desabilitado ou deslogado
        return;
      }

      console.log("Reminders are enabled. Scheduling notifications...");
      await Notifications.cancelAllScheduledNotificationsAsync(); // Limpa todas as notificações antigas

      const now = Timestamp.now();
      const oneHourFromNow = Timestamp.fromMillis(now.toMillis() + 60 * 60 * 1000);
      const futureAppointmentsQuery = query(
        collection(db, "appointments"),
        where("userId", "==", currentUser.uid),
        where("appointmentTime", ">", now) // Busca agendamentos futuros
        // Opcional: Adicionar limite ou ordenação se houver muitos agendamentos
      );

      const querySnapshot = await getDocs(futureAppointmentsQuery);
      querySnapshot.forEach(async (doc) => {
        const appointment = doc.data();
        const appointmentTime = (appointment.appointmentTime as Timestamp).toDate(); // Converter Timestamp para Date
        const notificationTime = new Date(appointmentTime.getTime() - 60 * 60 * 1000); // 1 hora antes

        // Apenas agenda se a notificação for no futuro e não for muito no passado (ex: app ficou offline)
        if (notificationTime.getTime() > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Lembrete de Agendamento!",
              body: `Seu agendamento para ${appointmentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} está se aproximando.`,
              data: { appointmentId: doc.id },
            },
            trigger: {
              date: notificationTime,
            },
            identifier: `appointment-${doc.id}`, // ID único para cada notificação
          });
          console.log(`Notificação agendada para o agendamento ${doc.id} às ${notificationTime.toLocaleTimeString()}`);
        }
      });
    };

    // Atrasar um pouco para garantir que o estado de autenticação e preferências estejam estáveis
    const timeoutId = setTimeout(scheduleAppointmentReminders, 1000);

    return () => clearTimeout(timeoutId); // Limpa o timeout se o componente for desmontado
  }, [currentUser, remindersEnabled]); // Re-agenda quando currentUser ou remindersEnabled mudam

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
        tabBarStyle: {
          backgroundColor: Colors[theme].background,
          borderTopWidth: 0,
          elevation: 5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarInactiveTintColor: Colors[theme].tabIconDefault,
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      {/* 1. Tela Inicial (Serviços) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Serviços",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "cut" : "cut-outline"} color={color} />
          ),
        }}
      />

      {/* 2. Tela de Agendamentos (NOVA) */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Minha Agenda", // Nome que aparece na barra
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "calendar" : "calendar-outline"} color={color} />
          ),
        }}
      />

      {/* 3. Tela de Localização */}
      <Tabs.Screen
        name="location"
        options={{
          title: "Endereço",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "location" : "location-outline"} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "person" : "person-outline"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}