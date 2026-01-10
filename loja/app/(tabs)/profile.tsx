import { UserProfile } from "@/constants/types"; // Importar tipo centralizado
import useAuth from "@/hooks/useAuth";
import { fetchAPI, uploadAvatar, BASE_URL, changePassword } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { toast } from "sonner-native";
import MaskInput, { Masks } from "react-native-mask-input";

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();

    // Tipagem correta para o perfil
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Estado para Edição
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");

    // Estados para Modais de Configurações
    const [notifModalVisible, setNotifModalVisible] = useState(false);
    const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
    // Estados para o Modal de Mudança de Senha
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    // Estados para visibilidade das senhas
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    
    // Estados dos Toggles (Iniciados com valores padrão, atualizados no loadProfile)
    const [settings, setSettings] = useState({
        notifications_reminders: true,
        notifications_marketing: false,
        privacy_use_photos: false
    });

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const handleChangePassword = async () => {
        if (!user?.email) {
            Alert.alert("Erro", "Usuário não identificado.");
            return;
        }

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            toast.error("Por favor, preencha todos os campos de senha.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            toast.error("A nova senha e a confirmação não coincidem.");
            return;
        }
        if (newPassword.length < 6) { // Exemplo de validação de força
            toast.error("A nova senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setIsChangingPassword(true);
        try {
            await changePassword(user.email, currentPassword, newPassword);
            toast.success("Senha alterada com sucesso!");
            setPasswordModalVisible(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (error: any) {
            console.error("Erro ao alterar senha:", error);
            toast.error(error.message || "Erro ao alterar a senha.");
        } finally {
            setIsChangingPassword(false);
        }
    };

    const loadProfile = async () => {
        if (!user?.email) {
            Alert.alert("Erro", "Nenhum usuário logado para carregar o perfil.");
            return;
        }

        try {
            setLoading(true);
            const data = await fetchAPI(`/user/profile/${user.email}`);
            setProfileData(data);

            // Atualizar settings com dados do banco (agora tipados)
            if (data) {
                setSettings({
                    notifications_reminders: !!data.notifications_reminders,
                    notifications_marketing: !!data.notifications_marketing,
                    privacy_use_photos: !!data.privacy_use_photos
                });
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = () => {
        if (profileData) {
            setEditName(profileData.name || "");
            setEditPhone(profileData.phone || "");
            setEditModalVisible(true);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setUploading(true);
            await fetchAPI('/user/', {
                method: 'PUT',
                body: JSON.stringify({
                    email: user!.email,
                    name: editName,
                    phone: editPhone
                })
            });
            Alert.alert("Sucesso", "Perfil atualizado!");
            setEditModalVisible(false);
            loadProfile();
        } catch (error: any) {
            Alert.alert("Erro", error.message || "Falha ao atualizar");
        } finally {
            setUploading(false);
        }
    };

    const handleToggle = async (key: string, value: boolean) => {
        // Atualiza UI otimistamente
        setSettings(prev => ({ ...prev, [key]: value }));

        try {
            await fetchAPI('/user/', {
                method: 'PUT',
                body: JSON.stringify({
                    email: user!.email,
                    [key]: value
                })
            });
        } catch (error) {
            console.error("Erro ao salvar config", error);
            // Reverte em caso de erro (opcional, mas recomendado)
            setSettings(prev => ({ ...prev, [key]: !value }));
            Alert.alert("Erro", "Falha ao salvar configuração.");
        }
    };

    const handlePickImage = async () => {
        if (!user?.email) {
            Alert.alert("Erro", "Usuário não identificado para o upload.");
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permissão negada", "Precisamos de acesso às suas fotos para mudar o avatar.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setUploading(true);
            const asset = result.assets[0];
            const formData = new FormData();

            // O 'uri' no React Native é o caminho local do arquivo.
            // O nome do arquivo pode ser extraído do URI.
            const uriParts = asset.uri.split('/');
            const fileName = uriParts[uriParts.length - 1];
            
            // Adiciona a imagem ao FormData
            formData.append('avatar', {
                uri: asset.uri,
                name: fileName,
                type: asset.type || 'image/jpeg', // O tipo pode ser inferido ou padrão
            } as any);
            
            // Adiciona o email do usuário
            formData.append('email', user.email);

            try {
                const data = await uploadAvatar(formData);
                // Atualiza o avatar no estado local com a URL completa do servidor
                setProfileData(prev => prev ? { ...prev, avatar: `${BASE_URL}${data.avatarUrl}` } : null);
                toast.success("Avatar atualizado com sucesso!");
            } catch (error: any) {
                Alert.alert("Erro de Upload", error.message || "Não foi possível enviar a imagem.");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleLogout = () => {
        Alert.alert("Sair", "Deseja realmente sair da sua conta?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Sair",
                style: "destructive",
                onPress: async () => {
                    await logout();
                    router.replace("/login");
                }
            },
        ]);
    };

    const MenuItem = ({ icon, title, subtitle, onPress, isDestructive = false }: any) => (
        <TouchableOpacity onPress={onPress} style={styles.menuItem}>
            <View style={[styles.menuIconWrapper, isDestructive && styles.menuIconDestructive]}>
                <Ionicons name={icon} size={20} color={isDestructive ? "#EF4444" : "#ec4899"} />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, isDestructive && styles.destructiveText]}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#DB2777" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header de Perfil */}
                <Animated.View entering={FadeInDown.duration(800)} style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.imageWrapper}>
                            {uploading ? (
                                <ActivityIndicator color="#DB2777" />
                            ) : (
                                profileData?.avatar ? (
                                    <Image source={{ uri: profileData.avatar }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Ionicons name="person" size={40} color="#E5E7EB" />
                                    </View>
                                )
                            )}
                        </View>
                        <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
                            <Ionicons name="camera" size={14} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.userName}>{profileData?.name}</Text>
                    <Text style={styles.userEmail}>{profileData?.email}</Text>

                    {/* Stats Bar */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{profileData?.appointmentsCount}</Text>
                            <Text style={styles.statLabel}>VISITAS</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {profileData?.memberSince
                                    ? new Date(profileData.memberSince).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase().replace('.', '')
                                    : '-'}
                            </Text>
                            <Text style={styles.statLabel}>MEMBRO DESDE</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Menu de Opções */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>CONFIGURAÇÕES</Text>

                    <MenuItem
                        icon="person-outline"
                        title="Dados Pessoais"
                        subtitle="Editar nome e contato"
                        onPress={handleOpenEdit}
                    />
                    <MenuItem
                        icon="notifications-outline"
                        title="Notificações"
                        subtitle="Lembretes de horário"
                        onPress={() => setNotifModalVisible(true)}
                    />
                    <MenuItem
                        icon="shield-checkmark-outline"
                        title="Privacidade"
                        onPress={() => setPrivacyModalVisible(true)}
                    />
                    <MenuItem
                        icon="lock-closed-outline"
                        title="Mudar Senha"
                        onPress={() => setPasswordModalVisible(true)}
                    />
                    <MenuItem
                        icon="log-out-outline"
                        title="Sair da Conta"
                        isDestructive={true}
                        onPress={handleLogout}
                    />
                </View>


                <Text style={styles.versionText}>Versão 1.0.4 • Salão Amanda</Text>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Editar Perfil</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>NOME COMPLETO</Text>
                            <TextInput
                                style={styles.input}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Seu nome"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>TELEFONE / WHATSAPP</Text>
                            <MaskInput
                                style={styles.input}
                                value={editPhone}
                                onChangeText={setEditPhone}
                                placeholder="(XX) XXXXX-XXXX"
                                keyboardType="phone-pad"
                                mask={Masks.BRL_PHONE}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSaveProfile}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>SALVAR ALTERAÇÕES</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal Notificações */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={notifModalVisible}
                onRequestClose={() => setNotifModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Configurar Notificações</Text>
                            <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.toggleRow}>
                            <View style={styles.toggleText}>
                                <Text style={styles.toggleLabel}>Lembretes de Agendamento</Text>
                                <Text style={styles.toggleDesc}>Receba avisos antes do seu horário.</Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#E5E7EB", true: "#DB2777" }}
                                thumbColor={"#FFF"}
                                onValueChange={(val) => handleToggle('notifications_reminders', val)}
                                value={settings.notifications_reminders}
                            />
                        </View>

                        <View style={[styles.toggleRow, styles.borderTop]}>
                            <View style={styles.toggleText}>
                                <Text style={styles.toggleLabel}>Promoções e Novidades</Text>
                                <Text style={styles.toggleDesc}>Fique por dentro de ofertas exclusivas.</Text>
                            </Text>
                            <Switch
                                trackColor={{ false: "#E5E7EB", true: "#DB2777" }}
                                thumbColor={"#FFF"}
                                onValueChange={(val) => handleToggle('notifications_marketing', val)}
                                value={settings.notifications_marketing}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Privacidade */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={privacyModalVisible}
                onRequestClose={() => setPrivacyModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Privacidade</Text>
                            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.toggleRow}>
                            <View style={styles.toggleText}>
                                <Text style={styles.toggleLabel}>Uso de Fotos no Portfólio</Text>
                                <Text style={styles.toggleDesc}>Permitir que o salão use fotos do 'depois' nas redes sociais.</Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#E5E7EB", true: "#DB2777" }}
                                thumbColor={"#FFF"}
                                onValueChange={(val) => handleToggle('privacy_use_photos', val)}
                                value={settings.privacy_use_photos}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de Mudança de Senha */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={passwordModalVisible}
                onRequestClose={() => setPasswordModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Mudar Senha</Text>
                            <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>SENHA ATUAL</Text>
                            <View style={styles.passwordInputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="******"
                                    secureTextEntry={!showCurrentPassword}
                                />
                                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.passwordToggleBtn}>
                                    <Ionicons name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>NOVA SENHA</Text>
                            <View style={styles.passwordInputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="******"
                                    secureTextEntry={!showNewPassword}
                                />
                                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.passwordToggleBtn}>
                                    <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>CONFIRMAR NOVA SENHA</Text>
                            <View style={styles.passwordInputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={confirmNewPassword}
                                    onChangeText={setConfirmNewPassword}
                                    placeholder="******"
                                    secureTextEntry={!showConfirmNewPassword}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)} style={styles.passwordToggleBtn}>
                                    <Ionicons name={showConfirmNewPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleChangePassword}
                            disabled={isChangingPassword}
                        >
                            {isChangingPassword ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>SALVAR NOVA SENHA</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 25,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        color: '#999',
        marginBottom: 8,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        color: '#1A1A1A',
        flex: 1, // Permite que o TextInput ocupe o espaço restante
        paddingRight: 50, // Espaço para o botão do toggle
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
    },
    passwordToggleBtn: {
        position: 'absolute',
        right: 15,
        padding: 5,
    },
    saveButton: {
        backgroundColor: '#DB2777',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
    },
    toggleText: { flex: 1, paddingRight: 10 },
    toggleLabel: { fontSize: 16, color: '#333', fontWeight: '500' },
    toggleDesc: { fontSize: 12, color: '#999', marginTop: 2 },
    borderTop: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40 },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    avatarImage: { width: '100%', height: '100%' },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#1A1A1A',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF'
    },
    userName: { fontSize: 22, fontWeight: '300', color: '#1A1A1A', letterSpacing: 0.5 },
    userEmail: { fontSize: 14, color: '#999', marginTop: 4 },
    statsContainer: {
        flexDirection: 'row',
        marginTop: 30,
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        paddingVertical: 15,
        paddingHorizontal: 30,
        width: '85%',
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
    statLabel: { fontSize: 9, letterSpacing: 1, color: '#999', marginTop: 4 },
    statDivider: { width: 1, backgroundColor: '#EEE', height: '100%', marginHorizontal: 20 },
    menuSection: { padding: 25 },
    sectionTitle: { fontSize: 10, letterSpacing: 2, fontWeight: '800', color: '#BBB', marginBottom: 20 },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    menuIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    menuIconDestructive: { backgroundColor: '#FEF2F2' },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: '500', color: '#333' },
    menuSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
    destructiveText: { color: '#EF4444' },
    versionText: { textAlign: 'center', color: '#CCC', fontSize: 11, letterSpacing: 1, marginTop: 10 }
});