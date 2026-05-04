import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { createCampaign, getMyCompanies } from "@/api/campaigns";
import type { Company, RewardType } from "@/api/types";
import { Colors, Spacing } from "@/constants/theme";

export default function CreateCampaignScreen() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [rewardType, setRewardType] = useState<RewardType>("discount");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("100");
  const [endsAt, setEndsAt] = useState("");
  // Discount fields
  const [discountPct, setDiscountPct] = useState("10");
  // Pet fields
  const [petName, setPetName] = useState("");
  const [petSlug, setPetSlug] = useState("");
  const [petRarity, setPetRarity] = useState("common");
  const [petAttack, setPetAttack] = useState("20");
  const [petDefense, setPetDefense] = useState("15");
  const [petPermanent, setPetPermanent] = useState(false);
  const [petDays, setPetDays] = useState("30");
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const c = await getMyCompanies();
        setCompanies(c);
        if (c.length > 0) setCompanyId(c[0].id);
      } finally {
        setLoadingCompanies(false);
      }
    })();
  }, []);

  const handleCreate = useCallback(async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!title.trim()) {
      setErrorMsg("El titulo es obligatorio");
      return;
    }
    if (!companyId) {
      setErrorMsg("No se encontro empresa asociada");
      return;
    }

    setLoading(true);
    try {
      const payload =
        rewardType === "discount"
          ? {
              title: title.trim(),
              description: description.trim() || undefined,
              reward_type: "discount" as const,
              max_redemptions: parseInt(maxRedemptions, 10) || 100,
              ends_at: endsAt || undefined,
              discount_percentage: parseInt(discountPct, 10) || 10,
            }
          : {
              title: title.trim(),
              description: description.trim() || undefined,
              reward_type: "pet" as const,
              max_redemptions: parseInt(maxRedemptions, 10) || 100,
              ends_at: endsAt || undefined,
              pet_name: petName.trim(),
              pet_slug: petSlug.trim().toLowerCase().replace(/\s+/g, "-"),
              pet_rarity: petRarity,
              pet_base_attack: parseInt(petAttack, 10) || 20,
              pet_base_defense: parseInt(petDefense, 10) || 15,
              pet_is_permanent: petPermanent,
              pet_duration_days: petPermanent ? undefined : parseInt(petDays, 10) || 30,
            };

      await createCampaign(companyId, payload);
      resetForm();
      setSuccessMsg("\u00a1Campana creada! Ya puedes compartir el QR.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [
    title, description, companyId, rewardType, maxRedemptions, endsAt,
    discountPct, petName, petSlug, petRarity, petAttack, petDefense, petPermanent, petDays,
  ]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setMaxRedemptions("100");
    setEndsAt("");
    setDiscountPct("10");
    setPetName("");
    setPetSlug("");
    setPetRarity("common");
    setPetAttack("20");
    setPetDefense("15");
    setPetPermanent(false);
    setPetDays("30");
  }

  if (loadingCompanies) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Nueva campana QR</Text>

        {errorMsg && <Text style={styles.errorMsg}>{errorMsg}</Text>}
        {successMsg && <Text style={styles.successMsg}>{successMsg}</Text>}

        {/* Reward type */}
        <Text style={styles.label}>Tipo de recompensa</Text>
        <View style={styles.typeRow}>
          {(["discount", "pet"] as RewardType[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.typeButton, rewardType === t && styles.typeButtonActive]}
              onPress={() => setRewardType(t)}
            >
              <Text style={[styles.typeText, rewardType === t && styles.typeTextActive]}>
                {t === "discount" ? "Descuento" : "Mascota 3D"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Titulo de la campana *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="ej. Promo de verano" placeholderTextColor={Colors.textMuted} />

        <Text style={styles.label}>Descripcion (opcional)</Text>
        <TextInput style={[styles.input, styles.inputMultiline]} value={description} onChangeText={setDescription} placeholder="Describe la recompensa..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={3} />

        <Text style={styles.label}>Canjes maximos</Text>
        <TextInput style={styles.input} value={maxRedemptions} onChangeText={setMaxRedemptions} keyboardType="number-pad" placeholder="100" placeholderTextColor={Colors.textMuted} />

        <Text style={styles.label}>Fecha de vencimiento (ISO, opcional)</Text>
        <TextInput style={styles.input} value={endsAt} onChangeText={setEndsAt} placeholder="2026-12-31T23:59:59" placeholderTextColor={Colors.textMuted} autoCapitalize="none" />

        {rewardType === "discount" ? (
          <>
            <Text style={styles.label}>Porcentaje de descuento (%)</Text>
            <TextInput style={styles.input} value={discountPct} onChangeText={setDiscountPct} keyboardType="number-pad" placeholder="10" placeholderTextColor={Colors.textMuted} />
          </>
        ) : (
          <>
            <Text style={styles.label}>Nombre de la mascota *</Text>
            <TextInput style={styles.input} value={petName} onChangeText={setPetName} placeholder="ej. Ignis" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.label}>Slug unico *</Text>
            <TextInput style={styles.input} value={petSlug} onChangeText={setPetSlug} placeholder="ej. ignis-fuego" placeholderTextColor={Colors.textMuted} autoCapitalize="none" />

            <Text style={styles.label}>Rareza</Text>
            <View style={styles.rarityRow}>
              {["common", "rare", "epic", "legendary"].map((r) => (
                <Pressable
                  key={r}
                  style={[styles.rarityButton, petRarity === r && styles.rarityButtonActive]}
                  onPress={() => setPetRarity(r)}
                >
                  <Text style={[styles.rarityText, { color: (Colors.rarity as Record<string, string>)[r] }]}>{r}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Ataque base</Text>
                <TextInput style={styles.input} value={petAttack} onChangeText={setPetAttack} keyboardType="number-pad" placeholder="20" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Defensa base</Text>
                <TextInput style={styles.input} value={petDefense} onChangeText={setPetDefense} keyboardType="number-pad" placeholder="15" placeholderTextColor={Colors.textMuted} />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Permanente</Text>
              <Switch
                value={petPermanent}
                onValueChange={setPetPermanent}
                trackColor={{ true: Colors.primary }}
                thumbColor={Colors.textPrimary}
              />
            </View>

            {!petPermanent && (
              <>
                <Text style={styles.label}>Duracion (dias)</Text>
                <TextInput style={styles.input} value={petDays} onChangeText={setPetDays} keyboardType="number-pad" placeholder="30" placeholderTextColor={Colors.textMuted} />
              </>
            )}
          </>
        )}

        <Pressable
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.bg} />
          ) : (
            <Text style={styles.submitText}>Crear campana</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.bg },
  container: { padding: Spacing.lg, paddingTop: 56, gap: Spacing.sm },
  heading: { color: Colors.textPrimary, fontSize: 22, fontWeight: "800", marginBottom: Spacing.sm },
  label: { color: Colors.textMuted, fontSize: 12, fontWeight: "600", marginTop: Spacing.sm },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", gap: Spacing.sm },
  typeButton: {
    flex: 1,
    padding: Spacing.sm + 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
  },
  typeButtonActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDark },
  typeText: { color: Colors.textMuted, fontWeight: "600" },
  typeTextActive: { color: Colors.primary },
  rarityRow: { flexDirection: "row", gap: Spacing.xs, flexWrap: "wrap" },
  rarityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  rarityButtonActive: { borderColor: Colors.primary },
  rarityText: { fontSize: 12, fontWeight: "700" },
  row: { flexDirection: "row", gap: Spacing.sm },
  half: { flex: 1 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  buttonDisabled: { opacity: 0.6 },
  submitText: { color: Colors.bg, fontWeight: "700", fontSize: 16 },
  errorMsg: {
    color: Colors.danger,
    fontSize: 13,
    backgroundColor: "#2A0D0D",
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  successMsg: {
    color: Colors.primary,
    fontSize: 13,
    backgroundColor: Colors.primaryDark,
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
});
