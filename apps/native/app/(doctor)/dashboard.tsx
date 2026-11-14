import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Typography, Spacing } from "@/theme";
import { getDashboard } from "@/api/doctor";
import { Avatar } from "@/components/ui";
import { Badge } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";

export default function DoctorDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["doctor-dashboard"],
    queryFn:  getDashboard,
    staleTime: 30_000,
  });

  const stats   = data?.stats;
  const doctor  = data?.doctor;
  const queue   = data?.queue ?? [];
  const sub     = data?.subscription;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.indigo} />
        }
      >
        {/* Hero */}
        <LinearGradient colors={["#0d1127", Colors.bgRoot]} style={styles.hero}>
          <View style={styles.heroRow}>
            <Avatar uri={doctor?.logoUrl} name={doctor?.nameAr ?? user?.name ?? ""} size={56} />
            <View style={styles.heroInfo}>
              <Text style={styles.greeting}>مرحباً، د.</Text>
              <Text style={styles.docName}>{doctor?.nameAr ?? user?.name}</Text>
              <Text style={styles.docSpec}>{doctor?.specialty?.nameAr}</Text>
            </View>
          </View>

          {/* Sub status */}
          {sub && (
            <View style={styles.subRow}>
              {sub.active ? (
                <Badge label="اشتراك نشط ✓" variant="success" />
              ) : (
                <Pressable onPress={() => {}}>
                  <Badge label="اشتراك منتهٍ — جدّد الآن" variant="warning" />
                </Pressable>
              )}
            </View>
          )}
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="مواعيد اليوم" value={stats?.todayTotal ?? "—"} icon="📅" />
          <StatCard label="مكتملة"       value={stats?.todayCompleted ?? "—"} icon="✅" color="#22c55e" />
          <StatCard label="في الانتظار"  value={stats?.todayWaiting ?? "—"} icon="⏳" color="#f59e0b" />
          <StatCard label="رسائل جديدة" value={stats?.unreadMessages ?? 0} icon="💬" color="#8b5cf6" />
        </View>

        {/* Queue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>قائمة الانتظار</Text>
          {queue.length === 0 ? (
            <Text style={styles.empty}>لا توجد مواعيد اليوم</Text>
          ) : (
            queue.slice(0, 5).map((item: Record<string, unknown>, idx: number) => (
              <View key={String(item.id)} style={styles.queueItem}>
                <Text style={styles.queueNum}>#{String(item.queueNumber ?? idx + 1)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.queueName}>{String(item.patientName ?? "")}</Text>
                  <Text style={styles.queueTime}>{String(item.time ?? "")}</Text>
                </View>
                <Badge
                  label={item.status === "arrived" ? "حضر" : "لم يصل"}
                  variant={item.status === "arrived" ? "success" : "default"}
                />
              </View>
            ))
          )}

          <Pressable style={styles.viewAllBtn} onPress={() => router.push("/(doctor)/appointments")}>
            <Text style={styles.viewAllText}>عرض جميع المواعيد ←</Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label, value, icon, color,
}: {
  label: string; value: number | string; icon: string; color?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgRoot },

  hero:     { padding: Spacing.lg, paddingBottom: Spacing.md },
  heroRow:  { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  heroInfo: { flex: 1, alignItems: "flex-end" },
  greeting: { fontSize: Typography.sizes.sm, color: Colors.text3 },
  docName:  { fontSize: Typography.sizes.xl, fontWeight: "900", color: Colors.text1 },
  docSpec:  { fontSize: Typography.sizes.sm, color: Colors.indigo },
  subRow:   { marginTop: Spacing.sm, alignItems: "flex-end" },

  statsRow: {
    flexDirection: "row", padding: Spacing.md,
    gap: Spacing.sm, flexWrap: "wrap",
  },
  statCard: {
    flex: 1, minWidth: "22%",
    backgroundColor: Colors.bgCard, borderRadius: 14,
    padding: Spacing.sm, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  statIcon:  { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1 },
  statLabel: { fontSize: Typography.sizes.xs, color: Colors.text3, textAlign: "center", marginTop: 2 },

  section:      { margin: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: 16, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: "800", color: Colors.text1, textAlign: "right", marginBottom: Spacing.sm },
  empty:        { color: Colors.text3, textAlign: "center", padding: Spacing.md },

  queueItem: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  queueNum:  { fontSize: Typography.sizes.sm, color: Colors.indigo, fontWeight: "700", width: 32, textAlign: "center" },
  queueName: { fontSize: Typography.sizes.sm, fontWeight: "700", color: Colors.text1, textAlign: "right" },
  queueTime: { fontSize: Typography.sizes.xs, color: Colors.text3 },

  viewAllBtn:  { marginTop: Spacing.md, alignItems: "center" },
  viewAllText: { color: Colors.indigo, fontWeight: "700", fontSize: Typography.sizes.sm },
});

