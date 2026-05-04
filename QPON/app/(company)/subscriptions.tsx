import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { activateSubscriptionMock, getMyCompanies, getProducts } from "@/api/campaigns";
import type { Company, SubscriptionProduct } from "@/api/types";
import { showAlert, showConfirm } from "@/utils/alert";
import { Colors, Spacing } from "@/constants/theme";

function PlanCard({
  product,
  onActivate,
}: {
  product: SubscriptionProduct;
  onActivate: () => void;
}) {
  const icon = product.code === "pet_3d" ? "paw-outline" : "pricetag-outline";
  return (
    <View style={styles.planCard}>
      <View style={styles.planIconWrap}>
        <Ionicons name={icon as any} size={28} color={Colors.primary} />
      </View>
      <View style={styles.planInfo}>
        <Text style={styles.planName}>{product.name}</Text>
        <Text style={styles.planDescription}>{product.description}</Text>
        <Text style={styles.planPrice}>${product.monthly_price_usd} USD / mes</Text>
      </View>
      <Pressable style={styles.activateButton} onPress={onActivate}>
        <Text style={styles.activateText}>Activar</Text>
      </Pressable>
    </View>
  );
}

export default function SubscriptionsScreen() {
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, comps] = await Promise.all([getProducts(), getMyCompanies()]);
      setProducts(prods);
      setCompanies(comps);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleActivate(product: SubscriptionProduct) {
    if (companies.length === 0) {
      showAlert("Sin empresa", "Necesitas una cuenta de empresa.");
      return;
    }
    showConfirm(
      "Activar plan (demo)",
      `Esto activara "${product.name}" por 30 dias sin cobro real.\nEn produccion esto redirigira a Stripe.`,
      async () => {
        try {
          await activateSubscriptionMock(companies[0].id, {
            product_code: product.code,
            days: 30,
          });
          showAlert("Activado", `"${product.name}" activado por 30 dias.`);
        } catch (err) {
          showAlert("Error", err instanceof Error ? err.message : "Error desconocido");
        }
      },
      "Activar demo"
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Planes disponibles</Text>
      <Text style={styles.subtitle}>
        Activa el plan que necesitas para crear campanas QR.{"\n"}
        Los cobros reales se integran con Stripe.
      </Text>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : (
        products.map((p) => (
          <PlanCard key={p.code} product={p} onActivate={() => handleActivate(p)} />
        ))
      )}

      <View style={styles.stripeNotice}>
        <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />
        <Text style={styles.stripeText}>
          Los pagos reales se procesaran de forma segura a traves de Stripe.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
    padding: Spacing.lg,
    paddingTop: 56,
    gap: Spacing.md,
  },
  heading: { color: Colors.textPrimary, fontSize: 22, fontWeight: "800" },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  loader: { marginTop: Spacing.xl },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  planIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  planInfo: { flex: 1 },
  planName: { color: Colors.textPrimary, fontWeight: "700", fontSize: 15 },
  planDescription: { color: Colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  planPrice: { color: Colors.primary, fontWeight: "700", fontSize: 14, marginTop: 4 },
  activateButton: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activateText: { color: Colors.primary, fontWeight: "700", fontSize: 13 },
  stripeNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  stripeText: { color: Colors.textMuted, fontSize: 12, flex: 1, lineHeight: 18 },
});
