import { StyleSheet, Text, View } from "react-native";
import type { InventoryDiscount } from "@/api/types";
import { Colors, Spacing } from "@/constants/theme";

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status: string): { label: string; color: string } {
  if (status === "used") return { label: "Usado", color: Colors.textMuted };
  if (status === "expired") return { label: "Expirado", color: Colors.danger };
  return { label: "Activo", color: Colors.primary };
}

export default function DiscountCard({ discount }: { discount: InventoryDiscount }) {
  const statusStyle = getStatusStyle(discount.status);
  const expiry = formatDate(discount.expires_at);
  const isUsed = discount.status === "used";

  return (
    <View style={[styles.card, isUsed && styles.cardUsed]}>
      <View style={styles.percentBadge}>
        <Text style={styles.percentText}>{discount.discount_percentage}%</Text>
        <Text style={styles.percentLabel}>OFF</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {discount.title}
        </Text>
        {expiry && (
          <Text style={styles.expiry}>
            Expira: {expiry}
          </Text>
        )}
        {!expiry && !isUsed && (
          <Text style={styles.expiry}>Sin fecha de vencimiento</Text>
        )}
        {isUsed && <Text style={styles.expiry}>Descuento usado</Text>}
      </View>
      <View style={[styles.statusPill, { borderColor: statusStyle.color }]}>
        <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  cardUsed: { opacity: 0.55 },
  percentBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  percentText: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22,
  },
  percentLabel: { color: Colors.primary, fontSize: 10, fontWeight: "700" },
  info: { flex: 1 },
  title: { color: Colors.textPrimary, fontWeight: "700", fontSize: 14 },
  expiry: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  statusPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
});
