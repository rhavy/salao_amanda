import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function StartPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Usando a cor padrão do Salão Amanda */}
        <ActivityIndicator size="small" color="#DB2777" />
      </View>
    );
  }

  // Se não houver usuário, vai para o Login
  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === 'admin') {
    // Redireciona para a aba index, mas o TabLayout cuidará de mostrar o Dashboard
    return <Redirect href="/(tabs)" />;
  }

  // Cliente padrão
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA" // Mesma cor de fundo das outras telas
  }
});