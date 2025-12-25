import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, Platform, ScrollView, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function LocationScreen() {
  const address = "Rua das Flores, 123, Bairro Jardim, Belo Horizonte - MG";
  const mapUrl = Platform.select({
    ios: `maps:0,0?q=${address}`,
    android: `geo:0,0?q=${address}`,
  });

  const whatsappNumber = "5531999999999"; // Exemplo

  const openMap = () => {
    Linking.openURL(mapUrl!);
  };

  const openWhatsApp = () => {
    Linking.openURL(`https://wa.me/${whatsappNumber}?text=Olá, gostaria de saber mais sobre o Salão.`);
  };

  return (
    <ThemedView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* 👇 Cabeçalho Animado (Igual às outras telas) */}
        <Animated.View
          entering={FadeInDown.duration(800).springify()}
          className="bg-pink-500 p-6 pt-12 rounded-b-3xl shadow-md mb-6"
        >
          <ThemedText className="text-white opacity-80 mb-1 font-medium">Venha nos visitar</ThemedText>
          <ThemedText className="text-3xl font-bold text-white">Onde Estamos</ThemedText>
          <ThemedText className="text-pink-100 mt-2">Um ambiente pensado para você</ThemedText>
        </Animated.View>

        <View className="px-4">

          {/* 👇 Card de Endereço (Clicável) */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(800)}
            className="mb-4 rounded-2xl bg-white p-5 shadow-sm border border-gray-100"
          >
            <View className="flex-row items-center mb-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-pink-100 mr-3">
                <Ionicons name="location" size={20} color="#ec4899" />
              </View>
              <ThemedText type="subtitle">Endereço</ThemedText>
            </View>

            <ThemedText className="text-gray-600 text-base leading-6 mb-4">
              {address}
            </ThemedText>

            <TouchableOpacity
              onPress={openMap}
              className="flex-row items-center justify-center rounded-xl bg-gray-50 py-3 border border-gray-200 active:bg-gray-100"
            >
              <Ionicons name="map-outline" size={18} color="#ec4899" style={{ marginRight: 8 }} />
              <ThemedText type="defaultSemiBold" className="text-pink-600">Abrir no Mapa</ThemedText>
            </TouchableOpacity>
          </Animated.View>

          {/* 👇 Card de Horários */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(800)}
            className="mb-4 rounded-2xl bg-white p-5 shadow-sm border border-gray-100"
          >
            <View className="flex-row items-center mb-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-pink-100 mr-3">
                <Ionicons name="time" size={20} color="#ec4899" />
              </View>
              <ThemedText type="subtitle">Horário de Funcionamento</ThemedText>
            </View>

            {/* Lista visual de horários */}
            <View className="space-y-3">
              <View className="flex-row justify-between border-b border-gray-50 pb-2">
                <ThemedText className="text-gray-500">Segunda a Sexta</ThemedText>
                <ThemedText type="defaultSemiBold">09:00 - 20:00</ThemedText>
              </View>
              <View className="flex-row justify-between border-b border-gray-50 pb-2">
                <ThemedText className="text-gray-500">Sábado</ThemedText>
                <ThemedText type="defaultSemiBold">09:00 - 18:00</ThemedText>
              </View>
              <View className="flex-row justify-between">
                <ThemedText className="text-gray-500">Domingo</ThemedText>
                <ThemedText className="text-red-400">Fechado</ThemedText>
              </View>
            </View>
          </Animated.View>

          {/* 👇 Card de Contato (WhatsApp) */}
          <Animated.View
            entering={FadeInDown.delay(600).duration(800)}
            className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100"
          >
            <View className="flex-row items-center mb-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100 mr-3">
                <Ionicons name="logo-whatsapp" size={20} color="#16a34a" />
              </View>
              <ThemedText type="subtitle">Fale Conosco</ThemedText>
            </View>

            <ThemedText className="text-gray-500 mb-4">
              Tem alguma dúvida ou preferência especial? Mande uma mensagem!
            </ThemedText>

            <TouchableOpacity
              onPress={openWhatsApp}
              className="flex-row items-center justify-center rounded-xl bg-green-500 py-3 shadow-sm active:bg-green-600"
            >
              <ThemedText type="defaultSemiBold" className="text-white">Chamar no WhatsApp</ThemedText>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </ScrollView>
    </ThemedView>
  );
}