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
import { showAlert } from "@/utils/alert";

type Role = "user" | "company";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRegister() {
    setErrorMsg(null);
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg("Completa todos los campos obligatorios");
      return;
    }
    if (role === "company" && !companyName.trim()) {
      setErrorMsg("Escribe el nombre de tu empresa");
      return;
    }
    setLoading(true);
    try {
      const createdUser = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        ...(role === "company" ? { company_name: companyName.trim() } : {}),
      });
      showAlert("Registro exitoso", "Tu cuenta fue creada correctamente.");
      router.replace(
        createdUser.role === "company" ? "/(company)/dashboard" : "/(user)/scan"
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
        <Text style={styles.subtitle}>Crea tu cuenta</Text>

        {/* Role selector */}
        <View style={styles.roleRow}>
          {(["user", "company"] as Role[]).map((r) => (
            <Pressable
              key={r}
              style={[styles.roleButton, role === r && styles.roleButtonActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                {r === "user" ? "Usuario" : "Empresa"}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
          returnKeyType="next"
        />
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
          placeholder="Contrasena (min. 8 caracteres)"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="next"
        />
        {role === "company" && (
          <TextInput
            style={styles.input}
            placeholder="Nombre de la empresa"
            placeholderTextColor={Colors.textMuted}
            value={companyName}
            onChangeText={setCompanyName}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
        )}

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.bg} />
          ) : (
            <Text style={styles.buttonText}>Crear cuenta</Text>
          )}
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.linkRow}>
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta?{" "}
              <Text style={styles.linkAccent}>Inicia sesion</Text>
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
  roleRow: { flexDirection: "row", gap: Spacing.sm },
  roleButton: {
    flex: 1,
    padding: Spacing.sm + 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  roleButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDark,
  },
  roleText: { color: Colors.textMuted, fontWeight: "600" },
  roleTextActive: { color: Colors.primary },
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
