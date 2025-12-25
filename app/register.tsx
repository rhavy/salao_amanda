import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { auth, db } from "@/config/firebase";
import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import MaskInput, { Masks } from 'react-native-mask-input';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { toast } from 'sonner-native';

export default function RegisterScreen() {
  const router = useRouter();

  // Estados do Formulário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"Feminino" | "Masculino" | "Outro" | "">(""); // Novo estado para Sexo
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validação incluindo o gênero
    if (!name || !email || !phone || !cpf || !birthDate || !password || !gender) {
      toast.error("Campos incompletos", { description: "Por favor, preencha todas as informações, incluindo o sexo." });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Salvando no Firestore com o novo campo 'gender'
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email.toLowerCase().trim(),
        phone: phone,
        cpf: cpf,
        birthDate: birthDate,
        gender: gender, // Salvo aqui
        avatar: "",
        appointmentsCount: 0,
        totalSpent: 0,
        memberSince: new Date().toISOString(),
        role: "client",
        active: true
      });

      toast.success("Bem-vinda(o)!", { description: "Sua conta foi criada com sucesso!" });
      router.replace("/(tabs)");

    } catch (error: any) {
      let msg = "Erro ao cadastrar.";
      if (error.code === 'auth/email-already-in-use') msg = "E-mail já cadastrado.";
      toast.error("Erro", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const InputLabel = ({ label }: { label: string }) => (
    <Text className="text-gray-400 font-bold mb-2 ml-1 uppercase text-[10px] tracking-widest">{label}</Text>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView className="flex-1 bg-white">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>

            <Animated.View entering={FadeInDown.duration(1000).springify()} className="mb-10">
              <ThemedText type="title" className="text-4xl font-bold text-pink-600">Criar Conta</ThemedText>
              <ThemedText className="text-gray-400 mt-2 text-lg">Seja bem-vinda ao Salão Amanda</ThemedText>
            </Animated.View>

            <View className="space-y-4">
              {/* Bloco 1: Identificação */}
              <Animated.View entering={FadeInRight.delay(300)}>
                <InputLabel label="Dados Pessoais" />
                <MaskInput
                  className="h-14 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 mb-4 text-base text-gray-800"
                  placeholder="Nome Completo"
                  value={name}
                  onChangeText={setName}
                />
                <MaskInput
                  className="h-14 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 mb-4 text-base text-gray-800"
                  placeholder="CPF"
                  keyboardType="numeric"
                  value={cpf}
                  onChangeText={setCpf}
                  mask={Masks.BRL_CPF}
                />
                <MaskInput
                  className="h-14 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 mb-4 text-base text-gray-800"
                  placeholder="Data de Nascimento (DD/MM/AAAA)"
                  keyboardType="numeric"
                  value={birthDate}
                  onChangeText={setBirthDate}
                  mask={Masks.DATE_DDMMYYYY}
                />

                {/* --- SELETOR DE SEXO --- */}
                <InputLabel label="Sexo" />
                <View className="flex-row justify-between mb-4">
                  {["Feminino", "Masculino", "Outro"].map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setGender(option as any)}
                      className={`flex-1 h-12 items-center justify-center rounded-xl mx-1 border ${gender === option
                          ? "bg-pink-500 border-pink-500"
                          : "bg-gray-50 border-gray-100"
                        }`}
                    >
                      <Text className={`font-bold ${gender === option ? "text-white" : "text-gray-400"}`}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>

              {/* Bloco 2: Contato e Segurança */}
              <Animated.View entering={FadeInRight.delay(500)}>
                <InputLabel label="Contato e Segurança" />
                <MaskInput
                  className="h-14 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 mb-4 text-base text-gray-800"
                  placeholder="WhatsApp"
                  keyboardType="numeric"
                  value={phone}
                  onChangeText={setPhone}
                  mask={Masks.BRL_PHONE}
                />
                <MaskInput
                  className="h-14 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 mb-4 text-base text-gray-800"
                  placeholder="Seu melhor E-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <MaskInput
                  className="h-14 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 mb-8 text-base text-gray-800"
                  placeholder="Crie uma senha forte"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </Animated.View>

              {/* Botão Final */}
              <Animated.View entering={FadeInDown.delay(700)}>
                <TouchableOpacity
                  className="h-16 w-full items-center justify-center rounded-2xl bg-pink-500 shadow-lg shadow-pink-200 active:bg-pink-600"
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Finalizar Cadastro</Text>}
                </TouchableOpacity>

                <View className="flex-row items-center justify-center mt-8 mb-10">
                  <ThemedText className="text-gray-400">Já possui conta? </ThemedText>
                  <Link href="/login" asChild>
                    <TouchableOpacity><Text className="font-bold text-pink-500">Acessar Login</Text></TouchableOpacity>
                  </Link>
                </View>
              </Animated.View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}