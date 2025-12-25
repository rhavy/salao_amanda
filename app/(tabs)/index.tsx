import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { auth, db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore"; // Adicionado doc e getDoc
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category?: string;
}

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
};

const formatPrice = (price: number) => {
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export default function ServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGender, setUserGender] = useState<string>("Feminino"); // Estado para o gênero

  const userDisplayName = auth.currentUser?.displayName || "Cliente";
  const firstName = userDisplayName.split(" ")[0];

  useEffect(() => {
    // 1. Buscar Gênero do Usuário para a saudação
    const fetchUserGender = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            setUserGender(userDoc.data().gender || "Feminino");
          }
        } catch (error) {
          console.error("Erro ao buscar gênero:", error);
        }
      }
    };

    fetchUserGender();

    // 2. Buscar Serviços
    const q = query(collection(db, "services"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const servicesArray: Service[] = [];
      querySnapshot.forEach((doc) => {
        servicesArray.push({
          id: doc.id,
          ...doc.data(),
        } as Service);
      });

      setServices(servicesArray);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar serviços: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderItem: ListRenderItem<Service> = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(600).springify()}
      className="mx-4 mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm android:elevation-2"
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1 pr-4">
          <ThemedText type="subtitle" className="text-gray-800 text-lg">
            {item.name}
          </ThemedText>
          <ThemedText className="mt-1 text-gray-500 text-sm">
            ⏱ {formatDuration(item.duration)}
          </ThemedText>
          <ThemedText type="defaultSemiBold" className="mt-2 text-lg text-pink-600">
            {formatPrice(item.price)}
          </ThemedText>
        </View>

        <TouchableOpacity
          className="rounded-full bg-pink-500 px-6 py-3 active:bg-pink-600 shadow-sm"
          onPress={() =>
            router.push({
              pathname: "/schedule",
              params: { serviceId: item.id }
            })
          }
        >
          <Text className="font-bold text-white text-sm">Agendar</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <ThemedView className="flex-1 bg-gray-50">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ec4899" />
          <Text className="mt-2 text-gray-400">Carregando serviços...</Text>
        </View>
      ) : (
        <FlashList<Service>
          data={services}
          renderItem={renderItem}
          keyExtractor={(item: Service) => item.id}
          estimatedItemSize={120}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <Ionicons name="cut-outline" size={64} color="#d1d5db" />
              <Text className="text-gray-400 mt-4 text-center px-10">
                Nenhum serviço encontrado.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/admin-setup")}
                className="mt-6 bg-pink-100 px-6 py-3 rounded-full"
              >
                <Text className="text-pink-600 font-bold">Configurar Banco de Dados</Text>
              </TouchableOpacity>
            </View>
          }
          ListHeaderComponent={
            <Animated.View
              entering={FadeInDown.duration(800).springify()}
              className="bg-pink-500 p-6 pt-12 rounded-b-3xl shadow-md mb-6"
            >
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-white opacity-80 mb-1 font-medium">
                    {/* ✅ Ajuste dinâmico de gênero aplicado aqui */}
                    Bem-vind{userGender === "Masculino" ? "o" : "a"}, {firstName}! ✨
                  </Text>
                  <Text className="text-3xl font-bold text-white">Nossos Serviços</Text>
                </View>

                <TouchableOpacity
                  onPress={() => router.push("/admin-setup")}
                  className="bg-white/20 p-2 rounded-full"
                >
                  <Ionicons name="settings-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center mt-3">
                <View className="bg-white/20 px-3 py-1 rounded-full mr-3">
                  <Text className="text-white font-semibold">
                    {services.length} opções disponíveis
                  </Text>
                </View>
                <View className="bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white font-semibold">Qualidade Premium</Text>
                </View>
              </View>
            </Animated.View>
          }
        />
      )}
    </ThemedView>
  );
}