import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getMyCompanies } from "@/api/campaigns";
import type { Campaign, Company } from "@/api/types";
import { api } from "@/api/client";
import { Colors, Spacing } from "@/constants/theme";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const pct = Math.min(
    100,
    Math.round((campaign.redeemed_count / campaign.max_redemptions) * 100)
  );
  return (
    <View style={styles.campaignRow}>
      <View style={styles.campaignHeader}>
        <Text style={styles.campaignTitle} numberOfLines={1}>
          {campaign.title}
        </Text>
        <Text style={[styles.badge, campaign.reward_type === "pet" ? styles.badgePet : styles.badgeDiscount]}>
          {campaign.reward_type === "pet" ? "Mascota 3D" : "Descuento"}
        </Text>
      </View>
      <Text style={styles.campaignCode}>{campaign.code}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.campaignMeta}>
        {campaign.redeemed_count} / {campaign.max_redemptions} canjes
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Company | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getMyCompanies();
      setCompanies(c);
      if (c.length > 0) {
        const current = c[0];
        setSelected(current);
        const camps: Campaign[] = await api.get(`/companies/${current.id}/campaigns`);
        setCampaigns(camps);
      }
    } catch {
      // silent — empty state shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalCanjes = campaigns.reduce((s, c) => s + c.redeemed_count, 0);
  const activeCampaigns = campaigns.filter(
    (c) => !c.ends_at || new Date(c.ends_at) >= new Date()
  ).length;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />
      }
    >
      {selected && (
        <View style={styles.companyHeader}>
          <View style={styles.companyIcon}>
            <Text style={styles.companyInitial}>
              {selected.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.companyName}>{selected.name}</Text>
            <Text style={styles.companySlug}>{selected.slug}</Text>
          </View>
        </View>
      )}

      <View style={styles.statsRow}>
        <StatCard label="Campanas" value={campaigns.length} />
        <StatCard label="Activas" value={activeCampaigns} />
        <StatCard label="Canjes totales" value={totalCanjes} />
      </View>

      <Text style={styles.sectionTitle}>Campanas QR</Text>

      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : campaigns.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="qr-code-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>
            No tienes campanas aun.{"\n"}Crea tu primer QR desde la pestana "Nuevo QR".
          </Text>
        </View>
      ) : (
        campaigns.map((c) => <CampaignRow key={c.id} campaign={c} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
    paddingTop: 56,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  companyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  companyInitial: { color: Colors.primary, fontSize: 24, fontWeight: "800" },
  companyName: { color: Colors.textPrimary, fontSize: 18, fontWeight: "700" },
  companySlug: { color: Colors.textMuted, fontSize: 12 },
  statsRow: { flexDirection: "row", gap: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: { color: Colors.primary, fontSize: 22, fontWeight: "800" },
  statLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: Spacing.sm,
  },
  campaignRow: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  campaignHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  campaignTitle: {
    color: Colors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
    marginRight: Spacing.sm,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeDiscount: { backgroundColor: Colors.primaryDark, color: Colors.primary },
  badgePet: { backgroundColor: "#2A1560", color: "#B673FF" },
  campaignCode: { color: Colors.textMuted, fontSize: 12, fontFamily: "monospace" as any },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
    marginVertical: 2,
  },
  progressFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 2 },
  campaignMeta: { color: Colors.textMuted, fontSize: 12 },
  emptyState: { alignItems: "center", padding: Spacing.xl, gap: Spacing.md },
  emptyText: {
    color: Colors.textMuted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
  },
});
