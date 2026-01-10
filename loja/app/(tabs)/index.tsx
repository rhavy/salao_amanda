import { fetchAPI, getServices, getCategories, Service, Category } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "@/hooks/useAuth";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import ScheduleModal from "@/components/schedule";
import { useFocusEffect } from "expo-router"; // Importante para o tempo real

export default function ServicesScreen() {
  const { user } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Função principal de busca (pode ser chamada silenciosamente ou com loading)
  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);

    try {
      // Executa as duas buscas em paralelo para maior performance
      const [servicesData, categoriesData] = await Promise.all([
        getServices(),
        getCategories()
      ]);

      setServices(Array.isArray(servicesData) ? servicesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

    } catch (error) {
      console.error("Erro na sincronização real-time:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // EFEITO TEMPO REAL 1: Sempre que o usuário focar na aba
  useFocusEffect(
    useCallback(() => {
      fetchAllData(true); // Busca silenciosa para não travar a UI
    }, [fetchAllData])
  );

  // EFEITO TEMPO REAL 2: Polling de 10 segundos (opcional, excelente para admin)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [fetchAllData]);

  const filteredServices = useMemo(() => {
    if (selectedCategoryId === null) return services;
    return services.filter(s => s.category_id === selectedCategoryId);
  }, [selectedCategoryId, services]);

  const handleOpenSchedule = (service: Service) => {
    setSelectedService(service);
    setModalVisible(true);
  };

  const renderItem: ListRenderItem<Service> = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(400)}
      style={styles.card}
    >
      <View style={styles.cardContent}>
        <View style={styles.infoContainer}>
          <Text style={styles.categoryBadge}>{item.category_name?.toUpperCase() || 'SERVIÇO'}</Text>
          <Text style={styles.serviceName}>{item.name}</Text>
          <View style={styles.detailsRow}>
            <Ionicons name="time-outline" size={14} color="#999" />
            <Text style={styles.durationText}>{item.duration} min</Text>
          </View>
          <Text style={styles.priceText}>
            {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => handleOpenSchedule(item)}
        >
          <Text style={styles.bookButtonText}>AGENDAR</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#DB2777" />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.filterWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              <TouchableOpacity
                onPress={() => setSelectedCategoryId(null)}
                style={[
                  styles.filterTab,
                  selectedCategoryId === null && styles.filterTabActive
                ]}
              >
                <Text style={[
                  styles.filterTabText,
                  selectedCategoryId === null && styles.filterTabTextActive
                ]}>
                  TODOS
                </Text>
              </TouchableOpacity>

              {categories.map((cat, index) => (
                <Animated.View key={cat.id} entering={FadeInRight.delay(index * 50)}>
                  <TouchableOpacity
                    onPress={() => setSelectedCategoryId(cat.id)}
                    style={[
                      styles.filterTab,
                      selectedCategoryId === cat.id && styles.filterTabActive
                    ]}
                  >
                    <Text style={[
                      styles.filterTabText,
                      selectedCategoryId === cat.id && styles.filterTabTextActive
                    ]}>
                      {cat.name.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          <FlashList
            data={filteredServices}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            // estimatedItemSize={120}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchAllData(false)}
                tintColor="#DB2777"
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum serviço disponível no momento.</Text>
            }
          />

          <ScheduleModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            serviceName={selectedService?.name}
            servicePrice={selectedService?.price}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterWrapper: { marginTop: 20, marginBottom: 10 },
  filterScroll: { paddingHorizontal: 25, gap: 10 },
  filterTab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE' },
  filterTabActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  filterTabText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#999' },
  filterTabTextActive: { color: '#FFF' },
  listPadding: { paddingBottom: 40, paddingHorizontal: 20 },
  card: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 12, padding: 18, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 2 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoContainer: { flex: 1 },
  categoryBadge: { fontSize: 8, letterSpacing: 1.5, color: '#DB2777', fontWeight: '800', marginBottom: 4 },
  serviceName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  durationText: { fontSize: 12, color: '#999' },
  priceText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  bookButton: { backgroundColor: '#1A1A1A', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8 },
  bookButtonText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#BBB', fontSize: 14 }
});