import { useEffect } from "react";
import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  // While restoring session, render nothing (splash is still visible)
  if (loading) return null;

  const inAuth = segments[0] === "(auth)";

  if (!user && !inAuth) {
    return <Redirect href="/" />;
  }
  if (user && inAuth) {
    return (
      <Redirect
        href={user.role === "company" ? "/(company)/dashboard" : "/(user)/scan"}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#071013" } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(user)" />
      <Stack.Screen name="(company)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#071013" />
      <RootNavigator />
    </AuthProvider>
  );
}
