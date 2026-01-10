import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useAuth } from "@/hooks/useAuth";
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// Importamos as telas para decidir qual renderizar
// Se você usa o roteamento baseado em arquivos do Expo Router, 
// o controle de "manter na página" é feito aqui nas opções da aba.

const CustomHeader = ({ title, user, loading }: { title: string; user: any; loading: boolean }) => {
  if (loading) return <View style={[styles.headerWrapper, { height: 120 }]} />;

  const firstName = user?.name?.split(' ')[0].toUpperCase() || "CONVIDADA";
  const avatar = user?.avatar || "https://ui-avatars.com/api/?name=" + firstName + "&background=DB2777&color=fff";
  const isAdmin = user?.role === 'admin';
  const getGreetingPronoun = (name: string, gender?: 'Masculino' | 'Feminino' | 'Outro') => {
    if (gender === 'Masculino') return "BEM-VINDO GESTOR, " + firstName;
    if (gender === 'Feminino') return "BEM-VINDA GESTORA, " + firstName;

    // Heurística baseada na última letra do nome se o gênero não estiver disponível
    if (name) {
      const lastChar = name.toLowerCase().slice(-1);
      if (lastChar === 'a') return "BEM-VINDA GESTORA, " + firstName;
      if (lastChar === 'o') return "BEM-VINDO GESTOR, " + firstName;
    }
    return "BEM-VINDA GESTORA, " + firstName; // Default para outros casos ou nome vazio
  };

  const greetingPronoun = getGreetingPronoun(user?.name || '', user?.gender);
  return (
    <View style={styles.headerWrapper}>
      <LinearGradient
        colors={isAdmin ? ['#1A1A1A', '#262626'] : ['#FFF5F8', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView>
        <View style={styles.headerContainer}>
          <View style={styles.textContainer}>
            <View style={styles.greetingRow}>
              <Text style={[styles.headerGreeting, isAdmin && { color: '#D4AF37' }]}>
                {greetingPronoun}
              </Text>
              <View style={[styles.dot, isAdmin && { backgroundColor: '#D4AF37' }]} />
            </View>
            <Text style={[styles.headerTitle, isAdmin && { color: '#FFF' }]}>{title}</Text>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.avatarWrapper}>
            <LinearGradient
              colors={isAdmin ? ['#D4AF37', '#B8860B'] : ['#DB2777', '#F472B6']}
              style={styles.avatarRing}
            />
            <View style={styles.avatarWhiteBorder}>
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            </View>
            <View style={[styles.statusIndicator, isAdmin && { backgroundColor: '#D4AF37' }]} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default function TabLayout() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Cores dinâmicas para manter a identidade visual de cada área
  const ACTIVE_COLOR = isAdmin ? "#D4AF37" : "#DB2777";
  const INACTIVE_COLOR = isAdmin ? "#525252" : "#A1A1AA";

  return (
    <>
      <StatusBar barStyle={isAdmin ? "light-content" : "dark-content"} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarInactiveTintColor: INACTIVE_COLOR,
          headerShown: true,
          header: ({ options }) => (
            <CustomHeader title={options.title || ""} user={user} loading={loading} />
          ),
          tabBarStyle: [
            styles.tabBar,
            isAdmin && { backgroundColor: '#1A1A1A', borderTopColor: '#262626' }
          ],
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            // Se for admin, a primeira página do index será o Financeiro/Dashboard
            title: "Financeiro",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconBox, focused && { backgroundColor: isAdmin ? '#262626' : '#FFF1F6' }]}>
                <TabBarIcon
                  name={focused ? (isAdmin ? "stats-chart" : "cut") : (isAdmin ? "stats-chart-outline" : "cut-outline")}
                  color={color}
                  size={20}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="appointments"
          options={{
            // Se for admin, ele vê a agenda de todos os clientes aqui
            title: isAdmin ? "Gestão Agenda" : "Minha Agenda",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconBox, focused && { backgroundColor: isAdmin ? '#262626' : '#FFF1F6' }]}>
                <TabBarIcon name={focused ? "calendar" : "calendar-outline"} color={color} size={20} />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="services"
          options={{
            title: "Serviços",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconBox, focused && { backgroundColor: isAdmin ? '#262626' : '#FFF1F6' }]}>
                <TabBarIcon name={focused ? "cut" : "cut-outline"} color={color} size={20} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="location"
          options={{
            title: "Localização",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconBox, focused && { backgroundColor: isAdmin ? '#262626' : '#FFF1F6' }]}>
                <TabBarIcon name={focused ? "map" : "map-outline"} color={color} size={20} />
              </View>
            ),
          }}
        />


        <Tabs.Screen
          name="profile"
          options={{
            title: "Configurações",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconBox, focused && { backgroundColor: isAdmin ? '#262626' : '#FFF1F6' }]}>
                <TabBarIcon name={focused ? "settings" : "person-outline"} color={color} size={20} />
              </View>
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  textContainer: { justifyContent: 'center' },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerGreeting: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#DB2777',
    fontWeight: '900',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DB2777',
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '200',
    color: '#111827',
    letterSpacing: -0.5,
  },
  avatarWrapper: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 29,
    opacity: 0.9,
  },
  avatarWhiteBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6'
  },
  avatarImage: { width: '100%', height: '100%' },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    height: Platform.OS === 'ios' ? 95 : 75,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  tabBarLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});