import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useInventory } from "@/hooks/useInventory";
import DiscountCard from "@/components/DiscountCard";
import PetCard from "@/components/PetCard";
import { Colors, Spacing } from "@/constants/theme";

type Tab = "mascotas" | "descuentos";

export default function InventoryScreen() {
  const { inventory, loading, error, refresh } = useInventory();
  const [activeTab, setActiveTab] = useState<Tab>("mascotas");

  const isEmpty =
    activeTab === "mascotas"
      ? inventory.pets.length === 0
      : inventory.discounts.length === 0;

  const listData = activeTab === "mascotas" ? inventory.pets : inventory.discounts;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi inventario</Text>

      {/* Tab bar */}
      <View style={styles.tabRow}>
        {(["mascotas", "descuentos"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "mascotas" ? ` (${inventory.pets.length})` : ` (${inventory.discounts.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={refresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={listData}
          key={activeTab}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item }) =>
            activeTab === "mascotas" ? (
              <PetCard pet={item as (typeof inventory.pets)[number]} />
            ) : (
              <DiscountCard discount={item as (typeof inventory.discounts)[number]} />
            )
          }
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            isEmpty ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {activeTab === "mascotas"
                    ? "No tienes mascotas todavia.\nEscanea un QR para conseguir la primera."
                    : "No tienes descuentos activos.\nEscanea un QR de descuento para obtener uno."}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 56 },
  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    padding: Spacing.sm + 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
  },
  tabActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDark },
  tabText: { color: Colors.textMuted, fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: Colors.primary },
  loader: { flex: 1, marginTop: Spacing.xl },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: { color: Colors.danger, textAlign: "center", marginBottom: Spacing.md },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryText: { color: Colors.primary },
});
