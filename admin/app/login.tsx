import { useAuth } from "@/hooks/useAuth";
import { fetchAPI } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { toast } from 'sonner-native';

export default function LoginScreen() {
  const router = useRouter();
  const { saveUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.warning("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.user) {
        // Salvamos o usuário completo (que agora contém o campo 'role')
        await saveUser({ user: response.user, token: response.token || null });

        // Lógica de Redirecionamento Baseada em Role
        if (response.user.role === 'admin') {
          toast.success(`Acesso Administrativo: Olá, ${response.user.name}!`);
          router.replace("/admin/dashboard" as any); // Redireciona para área admin
        } else {
          toast.success(`Bem-vinda de volta, ${response.user.name.split(' ')[0]}!`);
          router.replace("/(tabs)"); // Redireciona para área cliente
        }
      } else {
        throw new Error("Usuário não encontrado.");
      }

    } catch (error: any) {
      toast.error(error.message || "Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleDecorator} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <Animated.View
          entering={FadeInUp.delay(200).duration(1000)}
          style={styles.header}
        >
          <Text style={styles.brandName}>AMANDA</Text>
          <View style={styles.divider} />
          <Text style={styles.brandSubtitle}>BEAUTY & CARE</Text>

          {/* Badge de Área Restrita */}
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark-outline" size={10} color="#DB2777" />
            <Text style={styles.adminBadgeText}>ACESSO RESTRITO</Text>
          </View>
        </Animated.View>

        <View style={styles.formCard}>
          <Animated.View entering={FadeInDown.delay(400).duration(800)}>
            <Text style={styles.label}>Identificação Profissional</Text>

            <TextInput
              style={styles.input}
              placeholder="E-mail funcional"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}           // Desativa correção (evita lag no emulador)
              spellCheck={false}            // Desativa verificação ortográfica
              importantForAutofill="no"      // Evita que o sistema de preenchimento cause crash
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Senha de acesso"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                autoCorrect={false}           // Desativa correção (evita lag no emulador)
                spellCheck={false}            // Desativa verificação ortográfica
                importantForAutofill="no"      // Evita que o sistema de preenchimento cause crash
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.mainButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>AUTENTICAR</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInDown.delay(600).duration(800)}
          style={styles.footer}
        >
          <Text style={styles.footerText}>Problemas com acesso? </Text>
          <TouchableOpacity onPress={() => toast.info("Contate o suporte técnico.")}>
            <Text style={styles.signUpText}>Suporte</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  circleDecorator: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FFF1F2',
  },
  content: { flex: 1, paddingHorizontal: 35, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 50 },
  brandName: { fontSize: 40, fontWeight: '300', letterSpacing: 10, color: '#1A1A1A' },
  divider: { height: 1, width: 40, backgroundColor: '#DB2777', marginVertical: 12 },
  brandSubtitle: { fontSize: 11, letterSpacing: 5, color: '#DB2777', fontWeight: '700' },

  // Estilo do Badge Admin
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 5,
  },
  adminBadgeText: { fontSize: 8, fontWeight: '800', color: '#DB2777', letterSpacing: 1 },

  formCard: { width: '100%' },
  label: { fontSize: 18, color: '#444', marginBottom: 30, fontWeight: '400', textAlign: 'center', letterSpacing: 0.5 },
  input: { height: 55, borderBottomWidth: 1.5, borderBottomColor: '#F3F4F6', marginBottom: 25, fontSize: 16, color: '#1A1A1A' },
  passwordContainer: { position: 'relative', marginBottom: 40 },
  passwordInput: { height: 55, borderBottomWidth: 1.5, borderBottomColor: '#F3F4F6', fontSize: 16, color: '#1A1A1A', paddingRight: 40 },
  eyeButton: { position: 'absolute', right: 5, top: 18 },
  mainButton: {
    height: 60,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  buttonText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 3 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 50 },
  footerText: { color: '#999', fontSize: 13 },
  signUpText: { color: '#DB2777', fontWeight: '700', fontSize: 13 },
});