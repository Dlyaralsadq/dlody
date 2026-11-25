import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  Pressable, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Colors, Typography, Spacing } from "@/theme";
import { getMyAppointments, cancelAppointment } from "@/api/patient";
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

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("ar-IQ", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return dateStr; }
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString("ar-IQ", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch { return ""; }
}

export default function AppointmentsScreen() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-appointments", user?.id],
    queryFn:  getMyAppointments,
    enabled:  !!user,
    staleTime: 30_000,
  });

  const { mutate: doCancel } = useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
      Alert.alert("تم الإلغاء", "تم إلغاء الموعد بنجاح");
    },
    onError: () => Alert.alert("خطأ", "فشل إلغاء الموعد، حاول مرة أخرى"),
  });

  function handleCancel(id: string) {
    Alert.alert("إلغاء الموعد", "هل تريد إلغاء هذا الموعد؟", [
      { text: "لا", style: "cancel" },
      { text: "نعم، ألغِ الموعد", style: "destructive", onPress: () => doCancel(id) },
    ]);
  }

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

      {/* Loading indicator */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.indigo} size="large" />
          <Text style={styles.loadingText}>جارٍ التحميل...</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.indigo} />
          }
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyText}>لا توجد مواعيد</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* RTL: doctor name right, badge left */}
              <View style={styles.cardTop}>
                <Badge
                  label={STATUS_LABELS[item.status] ?? item.status}
                  variant={STATUS_VARIANTS[item.status] ?? "default"}
                />
                <Text style={styles.docName}>{item.doctor?.nameAr}</Text>
              </View>
              <Text style={styles.spec}>{item.doctor?.specialty?.nameAr}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>
                  📅 {formatDate(item.date)}
                </Text>
                <Text style={styles.infoText}>
                  🕐 {formatTime(item.date)}
                </Text>
              </View>
              {item.doctor?.clinicAddress && (
                <Text style={styles.addr}>📍 {item.doctor.clinicAddress}</Text>
              )}
              {/* Cancel button — only for upcoming scheduled */}
              {tab === "upcoming" && item.status === "scheduled" && (
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => handleCancel(item.id)}
                >
                  <Text style={styles.cancelBtnText}>إلغاء الموعد</Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}

      {/* FAB — book new appointment */}
      <Pressable style={styles.fab} onPress={() => router.push("/(patient)/map")}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.bgRoot },
  header:      { padding: Spacing.md },
  headerTitle: { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1, textAlign: "right" },

  tabs:         { flexDirection: "row", paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm },
  tab:          { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  tabActive:    { backgroundColor: Colors.indigo, borderColor: Colors.indigo },
  tabText:      { color: Colors.text2, fontWeight: "600", fontSize: Typography.sizes.sm },
  tabTextActive:{ color: "#fff" },

  loadingBox: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.sm,
  },
  loadingText: { color: Colors.text3, fontSize: Typography.sizes.base },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  cardTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  docName: { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1 },
  spec:    { fontSize: Typography.sizes.xs, color: Colors.indigo, textAlign: "right", marginTop: 2 },
  infoRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm, flexWrap: "wrap" },
  infoText:{ color: Colors.text2, fontSize: Typography.sizes.sm },
  addr:    { fontSize: Typography.sizes.xs, color: Colors.text3, textAlign: "right", marginTop: 4 },

  cancelBtn: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.5)",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  cancelBtnText: { color: "#ef4444", fontWeight: "700", fontSize: Typography.sizes.sm },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { color: Colors.text3, marginTop: Spacing.md, fontSize: Typography.sizes.base },

  fab: {
    position:        "absolute",
    bottom:          24,
    right:           24,
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: Colors.indigo,
    alignItems:      "center",
    justifyContent:  "center",
    elevation:       8,
    shadowColor:     Colors.indigo,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.5,
    shadowRadius:    12,
  },
  fabText: { color: "#fff", fontSize: 32, lineHeight: 36, fontWeight: "300" },
});
