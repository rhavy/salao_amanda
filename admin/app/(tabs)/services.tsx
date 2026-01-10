import { Ionicons } from "@expo/vector-icons";
import { FlashList, ListRenderItem } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar
} from "react-native";
import MaskInput, { createNumberMask } from "react-native-mask-input";
import Animated, { FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";
import { toast } from "sonner-native";
import { getServices, addService, updateService, deleteService, Category, getCategories } from "@/services/api";
import { Picker } from "@react-native-picker/picker"; // Import Picker

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category_id: number; // New: Foreign key to categories table
  category_name: string; // New: The name of the category from the JOIN
}

const brlMask = createNumberMask({
  prefix: ["R", "$", " "],
  delimiter: ".",
  separator: ",",
  precision: 2,
});

export default function AdminServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [categories, setCategories] = useState<Category[]>([]); // New state for categories
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null | undefined>(undefined); // To store selected category in modal

  useEffect(() => {
    const fetchAllData = async () => {
        setLoading(true);
        try {
            const servicesData = await getServices();
            setServices(Array.isArray(servicesData) ? servicesData : []);

            const categoriesData = await getCategories();
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            if (categoriesData.length > 0 && selectedCategoryId === undefined) {
                // Set default to first category if none is selected yet
                setSelectedCategoryId(categoriesData[0].id);
            }
        } catch (error) {
            toast.error("Erro ao buscar dados (serviços ou categorias).");
        } finally {
            setLoading(false);
        }
    };
    fetchAllData();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [services, searchQuery]);

  const stats = useMemo(() => {
    const total = services.length;
    const avgPrice = total > 0 ? services.reduce((acc, s) => acc + Number(s.price || 0), 0) / total : 0;
    return { total, avgPrice };
  }, [services]);

  const openModal = (service?: Service) => {
    if (service) {
      setEditingId(service.id);
      setName(service.name);
      setPrice((service.price * 100).toString());
      setDuration(service.duration.toString());
      // Ensure selectedCategoryId is a number, default to first category if service.category_id is invalid
      setSelectedCategoryId(service.category_id !== undefined && service.category_id !== null ? service.category_id : (categories.length > 0 ? categories[0].id : undefined));
    } else {
      setEditingId(null);
      setName("");
      setPrice("");
      setDuration("");
      // Set default to first category if available for new service
      setSelectedCategoryId(categories.length > 0 ? categories[0].id : undefined);
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Parse price
      const parsedPrice = parseFloat(price.replace("R$", "").replace(/\./g, "").replace(",", "."));
      // Parse duration
      const parsedDuration = parseInt(duration);

      if (!name || selectedCategoryId === undefined || selectedCategoryId === null || isNaN(parsedPrice) || isNaN(parsedDuration) || parsedDuration <= 0) {
        toast.error("Por favor, preencha todos os campos corretamente (Nome, Categoria, Valor, Duração).");
        return;
      }

      if (editingId) {
        await updateService(editingId, name, parsedDuration, parsedPrice, selectedCategoryId); // Pass selectedCategoryId
        toast.success("Serviço atualizado!");
      } else {
        await addService(name, parsedDuration, parsedPrice, selectedCategoryId); // Pass selectedCategoryId
        toast.success("Serviço adicionado!");
      }
      
      const servicesData = await getServices();
      setServices(servicesData);
      const categoriesData = await getCategories(); // Re-fetch categories as well, if any changes were made (though not directly for now)
      setCategories(categoriesData);

      setModalVisible(false);
    } catch (error: any) {
      toast.error(`Falha ao salvar serviço: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem: ListRenderItem<Service> = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50)}
      exiting={FadeOut}
      layout={LinearTransition}
      style={styles.serviceCard}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        {/* Display category name */}
        <Text style={styles.serviceCategory}>{String(item.category_name || '')}</Text>
        <View style={styles.detailsRow}>
          <View style={[styles.durationBadge, { backgroundColor: item.duration > 60 ? '#FFF7ED' : '#EFF6FF' }]}>
            <Text style={[styles.durationText, { color: item.duration > 60 ? '#C2410C' : '#1D4ED8' }]}>
              ⏱ {item.duration} MIN
            </Text>
          </View>
          <View style={styles.dotSeparator} />
          <Text style={styles.priceText}>R$ {Number(item.price || 0).toFixed(2).replace('.', ',')}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity onPress={() => openModal(item)} style={styles.editBtn}>
          <Ionicons name="pencil-outline" size={18} color="#D4AF37" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          Alert.alert("Excluir Serviço", `Deseja remover o serviço "${item.name}" permanentemente?`, [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Excluir", style: "destructive", onPress: async () => {
                try {
                  await deleteService(item.id);
                  toast.success("Serviço removido.");
                  const data = await getServices();
                  setServices(data);
                } catch (error: any) {
                  toast.error(`Erro ao excluir serviço: ${error.message}`);
                }
              }
            }
          ]);
        }} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Admin Boutique */}
      <View style={styles.header}>
        <LinearGradient colors={['#1A1A1A', '#333']} style={StyleSheet.absoluteFill} />
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>GESTÃO DE CATÁLOGO</Text>
            <Text style={styles.headerTitle}>Serviços</Text>
          </View>
          <View style={styles.iconCircle}>
            <Ionicons name="options-outline" size={20} color="#D4AF37" />
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>CADASTRADOS</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>VALOR MÉDIO</Text>
            <Text style={styles.statValue}>R$ {stats.avgPrice.toFixed(0)}</Text>
          </View>
        </View>

        {/* Busca Premium */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#999" />
          <TextInput
            placeholder="Buscar serviço..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="small" color="#D4AF37" style={{ marginTop: 40 }} />
        ) : (
          <FlashList
            data={filteredServices}
            renderItem={renderItem}
            // estimatedItemSize={100}
            contentContainerStyle={{ paddingHorizontal: 25, paddingTop: 20, paddingBottom: 120 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="cut-outline" size={48} color="#DDD" />
                <Text style={styles.emptyText}>Nenhum serviço disponível.</Text>
              </View>
            }
          />
        )}
      </View>

      <TouchableOpacity onPress={() => openModal()} style={styles.fab}>
        <LinearGradient colors={['#D4AF37', '#B8860B']} style={styles.fabGradient}>
          <Ionicons name="add" size={32} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal de Cadastro/Edição */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalSheet}>
              <View style={styles.modalDragIndicator} />
              <Text style={styles.modalTitle}>{editingId ? "Editar Serviço" : "Novo Registro"}</Text>

              <Text style={styles.inputLabel}>NOME DO SERVIÇO</Text>
              <TextInput
                style={styles.modalInput}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Botox Capilar"
                placeholderTextColor="#BBB"
              />

              <Text style={styles.inputLabel}>CATEGORIA</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedCategoryId === undefined ? null : selectedCategoryId} // Handle undefined
                  onValueChange={(itemValue) => setSelectedCategoryId(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {categories.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalRow}>
                <View style={{ flex: 1, marginRight: 15 }}>
                  <Text style={styles.inputLabel}>VALOR</Text>
                  <MaskInput
                    style={styles.modalInput}
                    value={price}
                    onChangeText={setPrice}
                    mask={brlMask}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ width: 120 }}>
                  <Text style={styles.inputLabel}>DURAÇÃO</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                    placeholder="60"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                style={styles.saveBtn}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveBtnText}>SALVAR ALTERAÇÕES</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Voltar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 35,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerSubtitle: { color: '#D4AF37', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  headerTitle: { color: 'white', fontSize: 32, fontWeight: '200' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  statValue: { color: 'white', fontSize: 18, fontWeight: '700', marginTop: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', height: 55, borderRadius: 18, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333' },
  serviceCard: { backgroundColor: 'white', padding: 20, borderRadius: 28, marginBottom: 15, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1, borderWidth: 1, borderColor: '#F9FAFB' },
  cardInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  serviceCategory: { fontSize: 12, color: '#999', marginBottom: 4 }, // New style for category
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  durationBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  durationText: { fontSize: 9, fontWeight: '900' },
  dotSeparator: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#DDD', marginHorizontal: 10 },
  priceText: { fontSize: 14, fontWeight: '200', color: '#1A1A1A' },
  actionContainer: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: '#FDFCF0', padding: 12, borderRadius: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, elevation: 8, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15 },
  fabGradient: { flex: 1, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', marginTop: 80, opacity: 0.3 },
  emptyText: { marginTop: 10, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: 'white', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
  modalDragIndicator: { width: 40, height: 5, backgroundColor: '#EEE', borderRadius: 3, alignSelf: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 25 },
  inputLabel: { fontSize: 9, fontWeight: '900', color: '#BBB', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
  modalInput: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F3F4F6', padding: 18, borderRadius: 18, fontSize: 16, color: '#1A1A1A', marginBottom: 20 },
  pickerContainer: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 18, marginBottom: 20 },
  picker: { width: '100%', height: 60, color: '#1A1A1A' },
  pickerItem: { fontSize: 16 },
  modalRow: { flexDirection: 'row' },
  saveBtn: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'white', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  cancelBtn: { marginTop: 20, alignItems: 'center' },
  cancelBtnText: { color: '#999', fontWeight: '600' }
});