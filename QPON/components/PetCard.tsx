import { lazy, Suspense, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { InventoryPet } from "@/api/types";
import { Colors, Spacing } from "@/constants/theme";

const PetViewer3D = lazy(() => import("./PetViewer3D"));

const RARITY_LABELS: Record<string, string> = {
  common: "Comun",
  rare: "Raro",
  epic: "Epico",
  legendary: "Legendario",
};

export default function PetCard({ pet }: { pet: InventoryPet }) {
  const [showViewer, setShowViewer] = useState(false);
  const rarityColor = (Colors.rarity as Record<string, string>)[pet.rarity] ?? Colors.textMuted;

  const isExpired =
    pet.expires_at ? new Date(pet.expires_at) < new Date() : false;

  return (
    <>
      <View style={[styles.card, isExpired && styles.cardExpired]}>
        <View style={styles.topRow}>
          <View style={[styles.rarityBadge, { borderColor: rarityColor }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {RARITY_LABELS[pet.rarity] ?? pet.rarity}
            </Text>
          </View>
          {pet.is_permanent ? (
            <View style={styles.pill}>
              <Ionicons name="infinite-outline" size={12} color={Colors.primary} />
              <Text style={styles.pillText}>Permanente</Text>
            </View>
          ) : pet.expires_at ? (
            <View style={[styles.pill, isExpired && styles.pillExpired]}>
              <Ionicons
                name="time-outline"
                size={12}
                color={isExpired ? Colors.danger : Colors.textMuted}
              />
              <Text style={[styles.pillText, isExpired && styles.pillTextExpired]}>
                {isExpired
                  ? "Expirado"
                  : `Expira ${new Date(pet.expires_at).toLocaleDateString("es")}`}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.petName}>{pet.pet_name}</Text>
        <Text style={styles.petSlug}>{pet.pet_slug}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="flash-outline" size={14} color="#F4B942" />
            <Text style={styles.statText}>{pet.base_attack}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="shield-outline" size={14} color="#4A9EFF" />
            <Text style={styles.statText}>{pet.base_defense}</Text>
          </View>
        </View>

        <Pressable
          style={[styles.viewButton, isExpired && styles.viewButtonDisabled]}
          onPress={() => !isExpired && setShowViewer(true)}
          disabled={isExpired}
        >
          <Ionicons name="cube-outline" size={16} color={isExpired ? Colors.textMuted : Colors.bg} />
          <Text style={[styles.viewButtonText, isExpired && styles.viewButtonTextDisabled]}>
            Ver en 3D
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={showViewer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowViewer(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{pet.pet_name}</Text>
            <Pressable onPress={() => setShowViewer(false)} hitSlop={12}>
              <Ionicons name="close" size={26} color={Colors.textPrimary} />
            </Pressable>
          </View>
          <Suspense
            fallback={
              <View style={styles.viewerFallback}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            }
          >
            <PetViewer3D
              assetUrl={pet.asset_url}
              rarity={pet.rarity}
              petName={pet.pet_name}
            />
          </Suspense>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardExpired: { opacity: 0.5 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rarityBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rarityText: { fontSize: 11, fontWeight: "800" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillExpired: { borderColor: Colors.danger },
  pillText: { color: Colors.textMuted, fontSize: 11 },
  pillTextExpired: { color: Colors.danger },
  petName: { color: Colors.textPrimary, fontSize: 18, fontWeight: "800" },
  petSlug: { color: Colors.textMuted, fontSize: 12 },
  statsRow: { flexDirection: "row", gap: Spacing.lg },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: Colors.textPrimary, fontWeight: "700", fontSize: 13 },
  viewButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.xs,
  },
  viewButtonDisabled: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  viewButtonText: { color: Colors.bg, fontWeight: "700", fontSize: 14 },
  viewButtonTextDisabled: { color: Colors.textMuted },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  viewerFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: "700" },
});
