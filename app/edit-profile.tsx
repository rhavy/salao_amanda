import { ThemedView } from "@/components/themed-view";
import { auth, db } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
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
import MaskInput, { Masks } from "react-native-mask-input";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { toast } from "sonner-native";

export default function EditProfileScreen() {
    const router = useRouter();

    // Estados dos Campos
    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState<"Feminino" | "Masculino" | "Outro" | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 1. Carregar dados do Firestore
    useEffect(() => {
        async function loadUserData() {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    setName(data.name || "");
                    setCpf(data.cpf || "");
                    setBirthDate(data.birthDate || "");
                    setPhone(data.phone || "");
                    setGender(data.gender || null);
                }
            } catch (error) {
                console.error(error);
                toast.error("Erro ao carregar dados");
            } finally {
                setLoading(false);
            }
        }
        loadUserData();
    }, []);

    // 2. Salvar Alterações
    const handleSave = async () => {
        const user = auth.currentUser;
        if (!user) return;

        if (!name || !phone || !gender) {
            toast.error("Campos obrigatórios", { description: "Preencha nome, telefone e gênero." });
            return;
        }

        setSaving(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                name,
                cpf,
                birthDate,
                phone,
                gender,
            });

            toast.success("Perfil atualizado!");
            router.back();
        } catch (error) {
            toast.error("Erro ao salvar");
        } finally {
            setSaving(false);
        }
    };

    const InputLabel = ({ label }: { label: string }) => (
        <Text className="text-gray-400 font-bold mb-2 ml-1 uppercase text-[10px] tracking-widest">{label}</Text>
    );

    if (loading) {
        return (
            <ThemedView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#ec4899" />
            </ThemedView>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ThemedView className="flex-1 bg-gray-50">
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                    <ScrollView showsVerticalScrollIndicator={false}>

                        {/* Header */}
                        <Animated.View entering={FadeInDown.duration(800).springify()} className="bg-pink-500 p-6 pt-12 rounded-b-[40px] shadow-md">
                            <TouchableOpacity onPress={() => router.back()} className="mb-4 w-10">
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                            <Text className="text-white opacity-80 mb-1 font-medium">Configurações</Text>
                            <Text className="text-3xl font-bold text-white">Editar Perfil</Text>
                        </Animated.View>

                        <View className="p-6">
                            <Animated.View entering={FadeInRight.delay(200)}>
                                <InputLabel label="Dados de Identificação" />

                                <MaskInput
                                    className="h-14 w-full rounded-2xl border border-gray-100 bg-white px-4 mb-4 text-base text-gray-800 shadow-sm"
                                    placeholder="Nome Completo"
                                    value={name}
                                    onChangeText={setName}
                                />

                                <MaskInput
                                    className="h-14 w-full rounded-2xl border border-gray-100 bg-white px-4 mb-4 text-base text-gray-800 shadow-sm"
                                    placeholder="CPF"
                                    keyboardType="numeric"
                                    value={cpf}
                                    onChangeText={setCpf}
                                    mask={Masks.BRL_CPF}
                                />

                                <MaskInput
                                    className="h-14 w-full rounded-2xl border border-gray-100 bg-white px-4 mb-6 text-base text-gray-800 shadow-sm"
                                    placeholder="Nascimento"
                                    keyboardType="numeric"
                                    value={birthDate}
                                    onChangeText={setBirthDate}
                                    mask={Masks.DATE_DDMMYYYY}
                                />

                                {/* Seletor de Sexo/Gênero */}
                                <InputLabel label="Gênero" />
                                <View className="flex-row justify-between mb-8">
                                    {["Feminino", "Masculino", "Outro"].map((item: any) => (
                                        <TouchableOpacity
                                            key={item}
                                            onPress={() => setGender(item)}
                                            className={`w-[31%] h-12 rounded-xl items-center justify-center border ${gender === item ? "bg-pink-500 border-pink-500" : "bg-white border-gray-100 shadow-sm"
                                                }`}
                                        >
                                            <Text className={`font-bold ${gender === item ? "text-white" : "text-gray-500"}`}>{item}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <InputLabel label="Contato" />
                                <MaskInput
                                    className="h-14 w-full rounded-2xl border border-gray-100 bg-white px-4 mb-4 text-base text-gray-800 shadow-sm"
                                    placeholder="WhatsApp"
                                    keyboardType="numeric"
                                    value={phone}
                                    onChangeText={setPhone}
                                    mask={Masks.BRL_PHONE}
                                />

                                {/* Botão de Ação */}
                                <TouchableOpacity
                                    className={`h-16 w-full items-center justify-center rounded-2xl shadow-lg ${saving ? "bg-pink-300" : "bg-pink-500 active:bg-pink-600"
                                        }`}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white font-bold text-lg">Atualizar Dados</Text>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </ThemedView>
        </TouchableWithoutFeedback>
    );
}