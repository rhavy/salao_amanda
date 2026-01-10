import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  SafeAreaView
} from "react-native";
import MaskInput, { Masks } from "react-native-mask-input";
import Animated, { FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";
import { toast } from "sonner-native";
import { getConfig, updateConfig } from "@/services/api";

interface BusinessHour {
  day: string;
  open: string;
  close: string;
}

const DAYS_OF_WEEK = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo", "Feriados"];
const TIME_MASK = [/\d/, /\d/, ':', /\d/, /\d/];

export default function AdminLocationScreen() {
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [whatsapp, setWhatsapp] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await getConfig();
      // console.log("Configuração recebida:", config); // Log para depuração

      if (config) {
        setWhatsapp(String(config.contact_whatsapp || ""));

        if (typeof config.contact_address === 'string' && config.contact_address) {
          const addressParts = config.contact_address.split(', ');
          if (addressParts.length >= 3) { // Tornando a validação mais flexível
            setStreet(addressParts[0] || "");
            setNumber(addressParts[1] || "");
            setNeighborhood(addressParts[2] || "");
            setCity(addressParts[3] || ""); // Pode ser undefined, mas não vai quebrar
          } else {
            console.warn("Formato de endereço inesperado:", config.contact_address);
          }
        }

        if (config.business_hours) {
          try {
            const hours = typeof config.business_hours === 'string'
              ? JSON.parse(config.business_hours)
              : config.business_hours;

            if (Array.isArray(hours)) {
              setBusinessHours(hours);
            }
          } catch (e) {
            console.error("Erro ao fazer parse do JSON de business_hours:", e);
            setBusinessHours([]); // Define como vazio em caso de erro
          }
        } else {
          setBusinessHours([]); // Define como vazio se não vier da API
        }
      }
    } catch (error) {
      console.error("Erro detalhado ao carregar configurações:", error); // Log de erro detalhado
      toast.error("Erro ao carregar as configurações.");
    } finally {
      setLoading(false);
    }
  };

  const addHourRow = () => {
    if (businessHours.length >= DAYS_OF_WEEK.length) return;
    setBusinessHours([...businessHours, { day: "Segunda", open: "09:00", close: "18:00" }]);
  };

  const updateHourRow = (index: number, field: keyof BusinessHour, value: string) => {
    const newHours = [...businessHours];
    newHours[index][field] = value;
    setBusinessHours(newHours);
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja encerrar a sessão administrativa?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => { } }
    ]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const configToSave = {
        whatsapp,
        street,
        number,
        neighborhood,
        city,
        businessHours,
      };
      await updateConfig(configToSave);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar as configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color="#D4AF37" size="large" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header Admin Boutique */}
          <View style={styles.header}>
            <LinearGradient colors={['#1A1A1A', '#333']} style={StyleSheet.absoluteFill} />
            <SafeAreaView />
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerLabel}>GESTÃO DE UNIDADE</Text>
                <Text style={styles.headerTitle}>Dados do Salão</Text>
              </View>
              {/* <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={22} color="#D4AF37" />
              </TouchableOpacity> */}
            </View>
          </View>

          <View style={styles.content}>

            {/* Seção Endereço */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="location-sharp" size={14} color="#D4AF37" />
                </View>
                <Text style={styles.cardTitle}>LOCALIZAÇÃO E ENDEREÇO</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>RUA / AVENIDA</Text>
                <TextInput
                  placeholder="Ex: Rua das Flores"
                  placeholderTextColor="#BBB"
                  style={styles.input}
                  value={street}
                  onChangeText={setStreet}
                />
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.label}>NÚMERO</Text>
                  <TextInput
                    placeholder="123"
                    placeholderTextColor="#BBB"
                    keyboardType="numeric"
                    style={styles.input}
                    value={number}
                    onChangeText={setNumber}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.label}>BAIRRO</Text>
                  <TextInput
                    placeholder="Ex: Centro"
                    placeholderTextColor="#BBB"
                    style={styles.input}
                    value={neighborhood}
                    onChangeText={setNeighborhood}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CIDADE - UF</Text>
                <TextInput
                  placeholder="Ex: São Paulo - SP"
                  placeholderTextColor="#BBB"
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </Animated.View>

            {/* Seção Comunicação */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="logo-whatsapp" size={14} color="#D4AF37" />
                </View>
                <Text style={styles.cardTitle}>WHATSAPP DE ATENDIMENTO</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NÚMERO COM DDD</Text>
                <MaskInput
                  value={whatsapp}
                  onChangeText={(masked) => setWhatsapp(masked)}
                  mask={Masks.BRL_PHONE}
                  keyboardType="phone-pad"
                  style={styles.input}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#BBB"
                />
              </View>
            </Animated.View>

            {/* Seção Horários */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="time" size={14} color="#D4AF37" />
                  </View>
                  <Text style={styles.cardTitle}>HORÁRIOS DE FUNCIONamento</Text>
                </View>
                <TouchableOpacity onPress={addHourRow} style={styles.addDayBtn}>
                  <Text style={styles.addDayBtnText}>+ ADICIONAR</Text>
                </TouchableOpacity>
              </View>

              {businessHours.map((item, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown}
                  exiting={FadeOut}
                  layout={LinearTransition}
                  style={styles.hourRowContainer}
                >
                  <View style={styles.hourRowHeader}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                      {DAYS_OF_WEEK.map(d => (
                        <TouchableOpacity
                          key={d}
                          onPress={() => updateHourRow(index, 'day', d)}
                          style={[styles.dayTab, item.day === d && styles.dayTabActive]}
                        >
                          <Text style={[styles.dayTabText, item.day === d && styles.dayTabTextActive]}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity
                      onPress={() => setBusinessHours(businessHours.filter((_, i) => i !== index))}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.timePickerContainer}>
                    <View style={styles.timeBox}>
                      <Text style={styles.timeLabel}>ABERTURA</Text>
                      <MaskInput
                        value={item.open}
                        mask={TIME_MASK}
                        onChangeText={(val) => updateHourRow(index, 'open', val)}
                        keyboardType="numeric"
                        style={styles.timeInput}
                      />
                    </View>
                    <View style={styles.timeDivider} />
                    <View style={styles.timeBox}>
                      <Text style={styles.timeLabel}>FECHAMENTO</Text>
                      <MaskInput
                        value={item.close}
                        mask={TIME_MASK}
                        onChangeText={(val) => updateHourRow(index, 'close', val)}
                        keyboardType="numeric"
                        style={styles.timeInput}
                      />
                    </View>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.publishBtn, isSaving && { opacity: 0.7 }]}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.publishBtnText}>PUBLICAR ALTERAÇÕES</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 60 },
  header: {
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  headerLabel: { color: '#D4AF37', fontSize: 10, fontWeight: '800', letterSpacing: 2.5 },
  headerTitle: { color: 'white', fontSize: 30, fontWeight: '200', marginTop: 2 },
  logoutBtn: {
    width: 46, height: 46, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)'
  },
  content: { padding: 25, marginTop: -25 },
  card: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 32,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 22, gap: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  iconCircle: {
    width: 28, height: 28, borderRadius: 10,
    backgroundColor: '#FDFCF0',
    alignItems: 'center', justifyContent: 'center'
  },
  cardTitle: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.2 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 8, fontWeight: '900', color: '#CBD5E1', marginBottom: 8, marginLeft: 4, letterSpacing: 1 },
  input: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 14
  },
  row: { flexDirection: 'row', marginBottom: 0 },
  addDayBtn: {
    backgroundColor: '#FDFCF0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1, borderColor: '#FEF9C3'
  },
  addDayBtnText: { color: '#B45309', fontSize: 9, fontWeight: '900' },
  hourRowContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  hourRowHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  dayTab: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, marginRight: 8,
    backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0'
  },
  dayTabActive: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  dayTabText: { fontSize: 9, fontWeight: '800', color: '#94A3B8' },
  dayTabTextActive: { color: '#D4AF37' },
  removeBtn: { marginLeft: 12 },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  timeBox: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  timeDivider: { width: 10, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 10 },
  timeLabel: { fontSize: 7, fontWeight: '900', color: '#94A3B8', marginBottom: 4 },
  timeInput: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  publishBtn: {
    backgroundColor: '#1E293B',
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6
  },
  publishBtnText: { color: 'white', fontSize: 13, fontWeight: '900', letterSpacing: 2.5 },
});