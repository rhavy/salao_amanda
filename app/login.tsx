import { useAuth } from "@/hooks/useAuth";
import { fetchAPI } from "@/services/api"; // Importa o fetchAPI
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
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

      // A API não está retornando um token, então salvamos o usuário e um token nulo.
      // Isso permitirá que o app continue, mas as rotas protegidas por token falharão.
      if (response.user) {
        await saveUser({ user: response.user, token: null }); // Token é null
        toast.success(`Bem-vinda de volta, ${response.user.name || 'Cliente'}!`);
        router.replace("/(tabs)");
      } else {
        throw new Error("Resposta da API de login inválida: 'user' não encontrado.");
      }

    } catch (error: any) {
      toast.error(error.message || "Não foi possível entrar. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Detalhe Decorativo de Fundo */}
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
        </Animated.View>

        <View style={styles.formCard}>
          <Animated.View entering={FadeInDown.delay(400).duration(800)}>
            <Text style={styles.label}>Bem-vinda de volta</Text>

            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Senha"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
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

            <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push("/forgot-password")}>
              <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>ENTRAR</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInDown.delay(600).duration(800)}
          style={styles.footer}
        >
          <Text style={styles.footerText}>Ainda não tem conta?</Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.signUpText}> Criar conta agora</Text>
            </TouchableOpacity>
          </Link>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Fundo levemente cinza/off-white
  },
  circleDecorator: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FDF2F8', // Rosa claríssimo
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  brandName: {
    fontSize: 42,
    fontWeight: '300', // Fonte fina para ser chique
    letterSpacing: 8,
    color: '#333',
  },
  divider: {
    height: 1,
    width: 40,
    backgroundColor: '#DB2777',
    marginVertical: 10,
  },
  brandSubtitle: {
    fontSize: 12,
    letterSpacing: 4,
    color: '#DB2777',
    fontWeight: '600',
  },
  formCard: {
    width: '100%',
  },
  label: {
    fontSize: 20,
    color: '#444',
    marginBottom: 25,
    fontWeight: '500',
    textAlign: 'center'
  },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 5,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 5,
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    right: 5,
    top: 15,
  },
  forgotBtn: {
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  forgotText: {
    color: '#999',
    fontSize: 13,
  },
  mainButton: {
    height: 55,
    backgroundColor: '#1A1A1A', // Preto para contraste premium
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#666',
  },
  signUpText: {
    color: '#DB2777',
    fontWeight: 'bold',
  },
});