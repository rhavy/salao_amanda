import { fetchAPI, getServices, getCategories, Service, Category } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "@/hooks/useAuth"; // Added back useAuth import
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { RefreshControl } from "react-native-gesture-handler";
import ScheduleModal from "@/components/schedule";

export default function ServicesScreen() {
  const { user } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null); // For category filtering
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // New state for RefreshControl

  const firstName = user?.name.split(' ')[0] || "Cliente";
  const userGender = user ? (user.name.endsWith('o') ? "Masculino" : "Feminino") : "Feminino";

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true); // Set refreshing true when data fetching starts
    try {
      const servicesData = await getServices();
      setServices(Array.isArray(servicesData) ? servicesData : []);

      const categoriesData = await getCategories();
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      if (categoriesData.length > 0 && selectedCategoryId === undefined) {
        setSelectedCategoryId(null); // 'Todos' option
      }

    } catch (error) {
      console.error("Erro ao buscar dados (serviços ou categorias).", error);
      Alert.alert("Erro", "Não foi possível carregar os serviços ou categorias.");
    } finally {
      setLoading(false); // Ensure loading is false after refresh
      setIsRefreshing(false); // Set refreshing false when data fetching ends
    }
  }, [selectedCategoryId]); // Depend on selectedCategoryId if you want to re-fetch on category change

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]); // Now useEffect depends on fetchAllData

  const filteredServices = useMemo(() => {
    if (selectedCategoryId === null) return services; // 'Todos' option
    return services.filter(s => s.category_id === selectedCategoryId);
  }, [selectedCategoryId, services]);

  const handleOpenSchedule = (service: Service) => {
    setSelectedService(service);
    setModalVisible(true);
  };

  const renderItem: ListRenderItem<Service> = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(500)}
      style={styles.card}
    >
      <View style={styles.cardContent}>
        <View style={styles.infoContainer}>
          <Text style={styles.categoryBadge}>{item.category_name.toUpperCase()}</Text>
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
          <View style={styles.header}>
            {/* <Text style={styles.title}>Nossos Serviços</Text> */}
            {/* <View style={styles.titleDivider} /> */}
          </View>

          <View style={styles.filterWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              <Animated.View key="todos" entering={FadeInRight.delay(0)}>
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
              </Animated.View>
              {categories.map((cat, index) => (
                <Animated.View key={cat.id} entering={FadeInRight.delay((index + 1) * 100)}>
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
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listPadding}
            refreshControl={ // Added RefreshControl
              <RefreshControl refreshing={isRefreshing} onRefresh={fetchAllData} tintColor="#DB2777" />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum serviço nesta categoria.</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center' },
  header: { paddingHorizontal: 25, paddingTop: 30, marginBottom: 20 },
  welcomeText: { fontSize: 10, letterSpacing: 3, color: '#DB2777', fontWeight: '700', marginBottom: 5 },
  title: { fontSize: 28, fontWeight: '300', color: '#333' },
  titleDivider: { height: 1, width: 40, backgroundColor: '#DB2777', marginTop: 10 },
  filterWrapper: { marginBottom: 20 },
  filterScroll: { paddingHorizontal: 25, gap: 10 },
  filterTab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE' },
  filterTabActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  filterTabText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#999' },
  filterTabTextActive: { color: '#FFF' },
  listPadding: { paddingBottom: 40, paddingHorizontal: 20 },
  card: { backgroundColor: '#FFF', marginBottom: 12, padding: 18, borderRadius: 2, borderLeftWidth: 2, borderLeftColor: '#DB2777', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 2 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoContainer: { flex: 1 },
  categoryBadge: { fontSize: 8, letterSpacing: 1.5, color: '#DB2777', fontWeight: '800', marginBottom: 4 },
  serviceName: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 4 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  durationText: { fontSize: 12, color: '#999' },
  priceText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  bookButton: { backgroundColor: '#1A1A1A', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 2 },
  bookButtonText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#BBB', fontSize: 14 }
});