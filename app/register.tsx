import { fetchAPI } from "@/services/api";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import MaskInput, { Masks } from 'react-native-mask-input';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

export default function RegisterScreen() {
  const router = useRouter();

  // Estados do Formulário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"Feminino" | "Masculino" | "Outro" | "">("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      alert("Por favor, preencha pelo menos nome, e-mail e senha.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, gender, phone, cpf, birthDate }),
      });

      alert(response.message || "Conta criada com sucesso!");
      router.replace("/login");
    } catch (error: any) {
      alert(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Detalhe Decorativo */}
        <View style={styles.circleDecorator} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Cabeçalho Minimalista */}
            <Animated.View entering={FadeInDown.duration(1000).springify()} style={styles.header}>
              <Text style={styles.brandName}>AMANDA</Text>
              <View style={styles.divider} />
              <Text style={styles.brandSubtitle}>CRIAR CONTA</Text>
            </Animated.View>

            <View style={styles.form}>
              {/* Seção 1 */}
              <Animated.View entering={FadeInRight.delay(300)} style={styles.section}>
                <Text style={styles.sectionLabel}>DADOS PESSOAIS</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Nome Completo"
                  placeholderTextColor="#A0A0A0"
                  value={name}
                  onChangeText={setName}
                />

                <MaskInput
                  style={styles.input}
                  placeholder="CPF"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  value={cpf}
                  onChangeText={setCpf}
                  mask={Masks.BRL_CPF}
                />

                <MaskInput
                  style={styles.input}
                  placeholder="Data de Nascimento"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  value={birthDate}
                  onChangeText={setBirthDate}
                  mask={Masks.DATE_DDMMYYYY}
                />

                {/* Seletor de Sexo Estilizado */}
                <Text style={styles.innerLabel}>SEXO</Text>
                <View style={styles.genderContainer}>
                  {["Feminino", "Masculino", "Outro"].map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setGender(option as any)}
                      style={[
                        styles.genderButton,
                        gender === option && styles.genderButtonActive
                      ]}
                    >
                      <Text style={[
                        styles.genderButtonText,
                        gender === option && styles.genderButtonTextActive
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>

              {/* Seção 2 */}
              <Animated.View entering={FadeInRight.delay(500)} style={styles.section}>
                <Text style={styles.sectionLabel}>CONTATO E SEGURANÇA</Text>

                <MaskInput
                  style={styles.input}
                  placeholder="WhatsApp"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="numeric"
                  value={phone}
                  onChangeText={setPhone}
                  mask={Masks.BRL_PHONE}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Seu melhor E-mail"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Crie uma senha forte"
                  placeholderTextColor="#A0A0A0"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </Animated.View>

              {/* Botão de Ação */}
              <Animated.View entering={FadeInDown.delay(700)}>
                <TouchableOpacity
                  style={[styles.mainButton, loading && { opacity: 0.7 }]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>FINALIZAR CADASTRO</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Já possui conta? </Text>
                  <Link href="/login" asChild>
                    <TouchableOpacity>
                      <Text style={styles.linkText}>Fazer Login</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  circleDecorator: {
    position: 'absolute',
    top: -50,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#FDF2F8',
  },
  scrollContent: {
    padding: 30,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 10,
    color: '#333',
  },
  divider: {
    height: 1,
    width: 30,
    backgroundColor: '#DB2777',
    marginVertical: 8,
  },
  brandSubtitle: {
    fontSize: 10,
    letterSpacing: 3,
    color: '#DB2777',
    fontWeight: '700',
  },
  form: {
    width: '100%',
  },
  section: {
    marginBottom: 30,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#999',
    marginBottom: 20,
  },
  innerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#BBB',
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    marginBottom: 15,
    fontSize: 15,
    color: '#333',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  genderButtonActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  genderButtonText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#FFF',
  },
  mainButton: {
    height: 55,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  footerText: {
    color: '#999',
    fontSize: 14,
  },
  linkText: {
    color: '#DB2777',
    fontWeight: 'bold',
    fontSize: 14,
  },
});