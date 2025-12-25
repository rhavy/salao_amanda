import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { auth } from "@/config/firebase"; // Importar a instância de autenticação
import { Link, useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth"; // Importar a função de login
import { useState } from "react";
import {
  ActivityIndicator, // Importar ActivityIndicator para feedback de carregamento
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import Animated, { FadeInDown } from 'react-native-reanimated';
import { toast } from 'sonner-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Estado de carregamento

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Ops!", {
        description: "Por favor, preencha todos os campos."
      });
      return;
    }

    setLoading(true); // Inicia o carregamento
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Seja bem-vindo(a) ao Salão Amanda", {
        description: "Login realizado com sucesso."
      });
      router.replace("/(tabs)"); // Redireciona para a tela principal (tabs)
    } catch (error: any) {
      console.error("Erro ao fazer login:", error.code, error.message);
      let errorMessage = "Ocorreu um erro ao tentar fazer login. Tente novamente.";
      if (error.code === 'auth/invalid-email') {
        errorMessage = "E-mail inválido.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "Esta conta foi desativada.";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "E-mail ou senha incorretos.";
      }
      toast.error("Erro no Login", {
        description: errorMessage
      });
    } finally {
      setLoading(false); // Finaliza o carregamento
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView className="flex-1 bg-white p-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center items-center"
        >

          {/* Animação 1: Título e Subtítulo */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(1000).springify()}
            className="w-full items-center"
          >
            <ThemedText type="title" className="mb-2 text-3xl font-bold text-pink-600">
              Salão Amanda
            </ThemedText>
            <ThemedText className="mb-8 text-gray-500">
              Realce sua beleza conosco
            </ThemedText>
          </Animated.View>

          <View className="w-full">
            {/* Animação 2: Inputs e Esqueci Senha */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(1000).springify()}
            >
              <TextInput
                className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 mb-4 text-base"
                placeholder="E-mail"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base"
                placeholder="Senha"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {/* Botão Esqueci Senha alinhado à direita */}
              <TouchableOpacity
                onPress={() => router.push("/forgot-password")}
                className="items-end mt-2 mb-6"
              >
                <Text className="text-pink-600 font-medium">Esqueceu a senha?</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Animação 3: Botão de Entrar e Cadastro */}
            <Animated.View
              entering={FadeInDown.delay(600).duration(1000).springify()}
            >
              <TouchableOpacity
                className="h-14 w-full items-center justify-center rounded-xl bg-pink-500 shadow-sm active:bg-pink-600"
                onPress={handleLogin}
                disabled={loading} // Desabilita o botão durante o carregamento
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-lg font-bold text-white">Entrar</Text>
                )}
              </TouchableOpacity>

              <View className="flex-row items-center justify-center mt-8">
                <ThemedText className="text-gray-600">Não tem uma conta? </ThemedText>
                <Link href="/register" asChild>
                  <TouchableOpacity>
                    <Text className="font-bold text-pink-500">Cadastre-se</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>

          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}