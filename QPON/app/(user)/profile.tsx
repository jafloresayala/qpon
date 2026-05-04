import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { showConfirm } from "@/utils/alert";
import { Colors, Spacing } from "@/constants/theme";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  function confirmLogout() {
    showConfirm("Cerrar sesion", "¿Seguro que quieres salir?", logout, "Salir");
  }

  if (!user) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarInitial}>
          {user.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.role}>
        {user.role === "company" ? "Cuenta empresa" : "Usuario"}
      </Text>

      <View style={styles.card}>
        <InfoRow label="Correo" value={user.email} />
        <InfoRow label="ID" value={String(user.id)} />
        <InfoRow
          label="Miembro desde"
          value={new Date(user.created_at).toLocaleDateString("es")}
        />
      </View>

      <Pressable style={styles.logoutButton} onPress={confirmLogout}>
        <Text style={styles.logoutText}>Cerrar sesion</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    paddingTop: 64,
    paddingBottom: 40,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: Colors.primary, fontSize: 36, fontWeight: "800" },
  name: { color: Colors.textPrimary, fontSize: 22, fontWeight: "700" },
  role: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: { color: Colors.textMuted, fontSize: 14 },
  infoValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: "600" },
  logoutButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  logoutText: { color: Colors.danger, fontWeight: "700", fontSize: 15 },
});
