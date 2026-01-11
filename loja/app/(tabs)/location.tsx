import { fetchAPI } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function LocationScreen() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/config/info');
      setConfig(data);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setLoading(false);
    }
  };

  // Memoizamos a formatação para evitar re-processamento desnecessário
  const businessHours = useMemo(() => {
    if (!config?.business_hours || !Array.isArray(config.business_hours)) {
      return {
        weekdays: { open: 'Fechado', close: '' },
        saturday: { open: 'Fechado', close: '' },
        sunday: { open: 'Fechado', close: '' },
      };
    }

    const formatted: any = {
      weekdays: { open: 'Fechado', close: '' },
      saturday: { open: 'Fechado', close: '' },
      sunday: { open: 'Fechado', close: '' },
    };

    config.business_hours.forEach((dayHour: any) => {
      const { day, open, close } = dayHour;
      const dayName = day.toLowerCase();

      // Agrupa segunda a sexta para exibição limpa
      if (['segunda', 'terça', 'quarta', 'quinta', 'sexta'].includes(dayName)) {
        formatted.weekdays.open = open;
        formatted.weekdays.close = close;
      } else if (dayName === 'sábado') {
        formatted.saturday.open = open;
        formatted.saturday.close = close;
      } else if (dayName === 'domingo') {
        formatted.sunday.open = open;
        formatted.sunday.close = close;
      }
    });

    return formatted;
  }, [config]);

  const openMap = () => {
    const address = config?.contact_address;
    if (!address) return;
    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });
    Linking.openURL(mapUrl!);
  };

  const openWhatsApp = () => {
    const phone = config?.contact_whatsapp;
    if (!phone) return;
    const msg = encodeURIComponent("Olá! Gostaria de mais informações sobre os serviços.");
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#DB2777" />
      </View>
    );
  }

  if (!config) return null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* CARD 1: LOCALIZAÇÃO */}
        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="location-outline" size={20} color="#DB2777" />
            </View>
            <Text style={styles.cardLabel}>LOCALIZAÇÃO</Text>
          </View>

          <Text style={styles.addressText}>{config.contact_address || 'Endereço não informado'}</Text>

          <TouchableOpacity onPress={openMap} style={styles.outlineButton} activeOpacity={0.7}>
            <Ionicons name="map-outline" size={16} color="#1A1A1A" />
            <Text style={styles.outlineButtonText}>ABRIR NO MAPA</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* CARD 2: HORÁRIOS */}
        <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="time-outline" size={20} color="#DB2777" />
            </View>
            <Text style={styles.cardLabel}>HORÁRIOS</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.dayText}>Segunda a Sexta</Text>
            <Text style={styles.timeText}>
              {businessHours.weekdays.open} {businessHours.weekdays.close && `— ${businessHours.weekdays.close}`}
            </Text>
          </View>

          <View style={[styles.row, styles.borderTop]}>
            <Text style={styles.dayText}>Sábado</Text>
            <Text style={styles.timeText}>
              {businessHours.saturday.open} {businessHours.saturday.close && `— ${businessHours.saturday.close}`}
            </Text>
          </View>

          <View style={[styles.row, styles.borderTop]}>
            <Text style={styles.dayText}>Domingo</Text>
            {businessHours.sunday.open === 'Fechado' ? (
              <Text style={styles.closedText}>FECHADO</Text>
            ) : (
              <Text style={styles.timeText}>{businessHours.sunday.open} — {businessHours.sunday.close}</Text>
            )}
          </View>
        </Animated.View>

        {/* CARD 3: CONTATO */}
        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="logo-whatsapp" size={20} color="#10B981" />
            </View>
            <Text style={styles.cardLabel}>CONTATO DIRETO</Text>
          </View>

          <Text style={styles.descriptionText}>
            Dúvidas sobre procedimentos ou horários especiais? Nossa equipe está pronta para te atender via WhatsApp.
          </Text>

          <TouchableOpacity onPress={openWhatsApp} style={styles.primaryButton} activeOpacity={0.8}>
            <Ionicons name="logo-whatsapp" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>INICIAR CONVERSA</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 25, paddingTop: 10, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // Mais arredondado para o estilo Boutique
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '800', color: '#A1A1AA' },
  addressText: { fontSize: 16, color: '#1A1A1A', lineHeight: 24, marginBottom: 20, fontWeight: '400' },
  descriptionText: { fontSize: 14, color: '#71717A', lineHeight: 22, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  borderTop: { borderTopWidth: 1, borderTopColor: '#F4F4F5' },
  dayText: { fontSize: 14, color: '#52525B' },
  timeText: { fontSize: 14, fontWeight: '600', color: '#18181B' },
  closedText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    gap: 8,
  },
  outlineButtonText: { fontSize: 12, fontWeight: '700', color: '#18181B' },
  primaryButton: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
});