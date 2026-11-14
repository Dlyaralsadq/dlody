import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { getMyAppointments } from "@/api/patient";
import { useAuthStore } from "@/stores/auth";
import { Badge } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  scheduled:  "محدد",
  completed:  "مكتمل",
  cancelled:  "ملغى",
  no_show:    "لم يحضر",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  scheduled:  "info",
  completed:  "success",
  cancelled:  "danger",
  no_show:    "warning",
};

export default function AppointmentsScreen() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-appointments", user?.id],
    queryFn:  getMyAppointments,
    enabled:  !!user,
    staleTime: 30_000,
  });

  const list = tab === "upcoming" ? (data?.upcoming ?? []) : (data?.past ?? []);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مواعيدي</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["upcoming", "past"] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "upcoming" ? "القادمة" : "السابقة"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.indigo} />
        }
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>
              {isLoading ? "جارٍ التحميل..." : "لا توجد مواعيد"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.docName}>{item.doctor?.nameAr}</Text>
              <Badge
                label={STATUS_LABELS[item.status] ?? item.status}
                variant={STATUS_VARIANTS[item.status] ?? "default"}
              />
            </View>
            <Text style={styles.spec}>{item.doctor?.specialty?.nameAr}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoText}>
                📅 {new Date(item.date).toLocaleDateString("ar-IQ")}
              </Text>
              <Text style={styles.infoText}>
                🕐 {new Date(item.date).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
            {item.doctor?.clinicAddress && (
              <Text style={styles.addr}>📍 {item.doctor.clinicAddress}</Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// Need to import useState
import { useState } from "react";

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.bgRoot },
  header:      { padding: Spacing.md },
  headerTitle: { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1, textAlign: "right" },

  tabs:         { flexDirection: "row", paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm },
  tab:          { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  tabActive:    { backgroundColor: Colors.indigo, borderColor: Colors.indigo },
  tabText:      { color: Colors.text2, fontWeight: "600", fontSize: Typography.sizes.sm },
  tabTextActive:{ color: "#fff" },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  docName: { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1 },
  spec:    { fontSize: Typography.sizes.xs, color: Colors.indigo, textAlign: "right", marginTop: 2 },
  infoRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  infoText:{ color: Colors.text2, fontSize: Typography.sizes.sm },
  addr:    { fontSize: Typography.sizes.xs, color: Colors.text3, textAlign: "right", marginTop: 4 },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { color: Colors.text3, marginTop: Spacing.md, fontSize: Typography.sizes.base },
});

