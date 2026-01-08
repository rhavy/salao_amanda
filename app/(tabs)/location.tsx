import { fetchAPI } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openMap = () => {
    if (!config) return;
    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${config.CONTACT_INFO.address}`,
      android: `geo:0,0?q=${config.CONTACT_INFO.address}`,
    });
    Linking.openURL(mapUrl!);
  };

  const openWhatsApp = () => {
    if (!config) return;
    Linking.openURL(`https://wa.me/${config.CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(config.CONTACT_INFO.whatsappMessage)}`);
  };

  if (loading || !config) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#DB2777" />
      </View>
    );
  }

  const { CONTACT_INFO, BUSINESS_HOURS } = config;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Seção 1: Endereço */}
        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="location-outline" size={20} color="#DB2777" />
            </View>
            <Text style={styles.cardLabel}>LOCALIZAÇÃO</Text>
          </View>

          <Text style={styles.addressText}>{CONTACT_INFO.address}</Text>

          <TouchableOpacity onPress={openMap} style={styles.outlineButton}>
            <Ionicons name="map-outline" size={16} color="#333" />
            <Text style={styles.outlineButtonText}>ABRIR NO MAPA</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Seção 2: Horários */}
        <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="time-outline" size={20} color="#DB2777" />
            </View>
            <Text style={styles.cardLabel}>HORÁRIOS</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.dayText}>Segunda a Sexta</Text>
            <Text style={styles.timeText}>{BUSINESS_HOURS.weekdays.open} — {BUSINESS_HOURS.weekdays.close}</Text>
          </View>
          <View style={[styles.row, styles.borderTop]}>
            <Text style={styles.dayText}>Sábado</Text>
            <Text style={styles.timeText}>{BUSINESS_HOURS.saturday.open} — {BUSINESS_HOURS.saturday.close}</Text>
          </View>
          <View style={[styles.row, styles.borderTop]}>
            <Text style={styles.dayText}>Domingo</Text>
            <Text style={styles.closedText}>{BUSINESS_HOURS.sunday.open ? `${BUSINESS_HOURS.sunday.open} — ${BUSINESS_HOURS.sunday.close}` : "FECHADO"}</Text>
          </View>
        </Animated.View>

        {/* Seção 3: Contato */}
        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <Ionicons name="logo-whatsapp" size={20} color="#10B981" />
            </View>
            <Text style={styles.cardLabel}>CONTATO DIRETO</Text>
          </View>

          <Text style={styles.descriptionText}>
            Dúvidas sobre procedimentos ou horários especiais? Nossa equipe está pronta para te atender.
          </Text>

          <TouchableOpacity onPress={openWhatsApp} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>INICIAR CONVERSA</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: {
    padding: 25,
    paddingTop: 10,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
    color: '#999',
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '300',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  dayText: {
    fontSize: 14,
    color: '#666',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F87171',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  outlineButtonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#1A1A1A',
  },
  primaryButton: {
    backgroundColor: '#1A1A1A',
    height: 50,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});