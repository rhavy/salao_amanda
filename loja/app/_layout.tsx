import { Redirect, Stack } from "expo-router";
import { Toaster } from "sonner-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useAuth from "@/hooks/useAuth"; // Use the default import for loja/hooks/useAuth
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const { user, token, loading } = useAuth();

  // Show a loading indicator while authentication status is being determined from AsyncStorage.
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {token && user ? (
        // If authenticated, render the main app stack.
        <Stack screenOptions={{ headerShown: false }}>
          {/* This is the main authenticated tab navigation. */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Prevent authenticated users from directly accessing the login page. */}
          <Stack.Screen name="login" redirect={true} />
          {/* The register screen should also be inaccessible if authenticated */}
          <Stack.Screen name="register" redirect={true} />
          <Stack.Screen name="forgot-password" redirect={true} />
        </Stack>
      ) : (
        // If not authenticated, render only the login, register, and forgot-password screens.
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          {/* Redirect any attempts to access other routes (like /(tabs)) back to login. */}
          <Redirect href="/login" />
        </Stack>
      )}
      <Toaster />
    </GestureHandlerRootView>
  );
}
