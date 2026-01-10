import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import useAuth from "@/hooks/useAuth"; // Importa o hook de autenticação
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from "expo-router";
import React from "react"; // Removido useEffect, useState
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

const CustomHeader = ({ title, user, loading }: { title: string; user: ReturnType<typeof useAuth>['user']; loading: boolean }) => {
  if (loading) return null; // Não renderiza até carregar o usuário

  const firstName = user?.name.split(' ')[0].toUpperCase() || "CONVIDADA";
  const avatar = user?.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"; // Fallback para avatar

  const getGreetingPronoun = (name: string, gender?: 'Masculino' | 'Feminino' | 'Outro') => {
    if (gender === 'Masculino') return "BEM-VINDO";
    if (gender === 'Feminino') return "BEM-VINDA";

    // Heurística baseada na última letra do nome se o gênero não estiver disponível
    if (name) {
      const lastChar = name.toLowerCase().slice(-1);
      if (lastChar === 'a') return "BEM-VINDA";
      if (lastChar === 'o') return "BEM-VINDO";
    }
    return "BEM-VINDA"; // Default para outros casos ou nome vazio
  };

  const greetingPronoun = getGreetingPronoun(user?.name || '', user?.gender);

  return (
    <View style={styles.headerWrapper}>
      <LinearGradient
        colors={['#FFF1F6', '#F472B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView>
        <View style={styles.headerContainer}>
          <View style={styles.textContainer}>
            <View style={styles.greetingRow}>
              <Text style={styles.headerGreeting}>{greetingPronoun}, {firstName}</Text>
              <View style={styles.dot} />
            </View>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.avatarWrapper}>
            <LinearGradient
              colors={['#DB2777', '#F472B6']}
              style={styles.avatarRing}
            />
            <View style={styles.avatarWhiteBorder}>
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            </View>
            <View style={styles.statusIndicator} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default function TabLayout() {
  const { user, loading } = useAuth(); // Obtém user e loading do useAuth

  const AMANDA_PINK = "#DB2777";
  const AMANDA_GRAY = "#A1A1AA";

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: AMANDA_PINK,
          tabBarInactiveTintColor: AMANDA_GRAY,
          headerShown: true,
          header: ({ options }) => <CustomHeader title={options.title || ""} user={user} loading={loading} />,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Serviços",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
                <TabBarIcon name={focused ? "cut" : "cut-outline"} color={color} size={20} />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="appointments"
          options={{
            title: "Agenda",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
                <TabBarIcon name={focused ? "calendar" : "calendar-outline"} color={color} size={20} />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="location"
          options={{
            title: "Salão",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
                <TabBarIcon name={focused ? "location" : "location-outline"} color={color} size={20} />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
                <TabBarIcon name={focused ? "chatbubble" : "chatbubble-outline"} color={color} size={20} />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
                <TabBarIcon name={focused ? "person" : "person-outline"} color={color} size={20} />
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
    borderBottomColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  textContainer: {
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerGreeting: {
    fontSize: 10,
    letterSpacing: 2.5,
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
    fontSize: 28,
    fontWeight: '200', // Fonte bem fina para ar de elegância
    color: '#111827',
    letterSpacing: -0.5,
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    opacity: 0.8,
  },
  avatarWhiteBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 95 : 75,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 20,
  },
  tabBarItem: {
    paddingVertical: 5,
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconBoxActive: {
    backgroundColor: '#FFF1F6',
  },
  tabBarLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});