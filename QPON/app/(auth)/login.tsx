import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing } from "@/constants/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin() {
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg("Completa todos los campos");
      return;
    }
    setLoading(true);
    try {
      const signedUser = await login({ email: email.trim().toLowerCase(), password });
      router.replace(
        signedUser.role === "company" ? "/(company)/dashboard" : "/(user)/scan"
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>QPON</Text>
        <Text style={styles.subtitle}>Tu plataforma de recompensas QR</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electronico"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="Contrasena"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.bg} />
          ) : (
            <Text style={styles.buttonText}>Iniciar sesion</Text>
          )}
        </Pressable>

        <Link href="/(auth)/register" asChild>
          <Pressable style={styles.linkRow}>
            <Text style={styles.linkText}>
              ¿No tienes cuenta?{" "}
              <Text style={styles.linkAccent}>Registrate</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  logo: {
    fontSize: 48,
    fontWeight: "900",
    color: Colors.primary,
    textAlign: "center",
    letterSpacing: 6,
  },
  subtitle: {
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.lg,
    fontSize: 14,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.bg, fontWeight: "700", fontSize: 16 },
  linkRow: { alignItems: "center", marginTop: Spacing.sm },
  linkText: { color: Colors.textMuted, fontSize: 14 },
  linkAccent: { color: Colors.primary, fontWeight: "700" },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    textAlign: "center",
    backgroundColor: "#2A0D0D",
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
});
