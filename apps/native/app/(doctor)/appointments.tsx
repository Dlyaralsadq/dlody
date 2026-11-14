import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList,
  Pressable, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { getDoctorAppointments, updateStatus } from "@/api/doctor";
import { Badge } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  scheduled:  "محدد",
  completed:  "مكتمل",
  cancelled:  "ملغى",
  no_show:    "لم يحضر",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  scheduled: "info",
  completed: "success",
  cancelled: "danger",
  no_show:   "warning",
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function DoctorAppointmentsScreen() {
  const [date, setDate] = useState(todayStr());
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["doctor-appointments", date],
    queryFn:  () => getDoctorAppointments({ date }),
    staleTime: 30_000,
  });

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateStatus(id, status),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["doctor-appointments"] }),
    onError:    () => Alert.alert("خطأ", "فشل تغيير الحالة"),
  });

  function confirmStatus(id: string, label: string, status: string) {
    Alert.alert("تغيير الحالة", `هل تريد تغيير الحالة إلى "${label}"؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "تأكيد", onPress: () => changeStatus({ id, status }) },
    ]);
  }

  const appointments = data?.appointments ?? [];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>المواعيد</Text>
        {/* Simple date navigation */}
        <View style={styles.dateNav}>
          <Pressable onPress={() => {
            const d = new Date(date); d.setDate(d.getDate() - 1);
            setDate(d.toISOString().split("T")[0]);
          }}>
            <Text style={styles.dateArrow}>→</Text>
          </Pressable>
          <Text style={styles.dateText}>
            {new Date(date).toLocaleDateString("ar-IQ", { weekday: "long", day: "numeric", month: "long" })}
          </Text>
          <Pressable onPress={() => {
            const d = new Date(date); d.setDate(d.getDate() + 1);
            setDate(d.toISOString().split("T")[0]);
          }}>
            <Text style={styles.dateArrow}>←</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(a) => a.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.indigo} />
        }
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? "جارٍ التحميل..." : "لا توجد مواعيد"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.queueNum}>#{item.queueNumber ?? "—"}</Text>
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={styles.patName}>{item.patient?.name}</Text>
                <Text style={styles.patPhone}>{item.patient?.phone}</Text>
              </View>
              <Badge
                label={STATUS_LABELS[item.status] ?? item.status}
                variant={STATUS_VARIANTS[item.status] ?? "default"}
              />
            </View>

            <Text style={styles.time}>
              🕐 {new Date(item.date).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}
            </Text>

            {/* Quick actions */}
            {item.status === "scheduled" && (
              <View style={styles.btnRow}>
                <Pressable
                  style={[styles.btn, { backgroundColor: "#22c55e20", borderColor: "#22c55e" }]}
                  onPress={() => confirmStatus(item.id, "مكتمل", "completed")}
                >
                  <Text style={[styles.btnText, { color: "#22c55e" }]}>✓ مكتمل</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, { backgroundColor: "#ef444420", borderColor: "#ef4444" }]}
                  onPress={() => confirmStatus(item.id, "ملغى", "cancelled")}
                >
                  <Text style={[styles.btnText, { color: "#ef4444" }]}>✕ ملغى</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Colors.bgRoot },
  header:   { padding: Spacing.md },
  title:    { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1, textAlign: "right" },
  dateNav:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  dateText: { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1 },
  dateArrow:{ fontSize: 22, color: Colors.indigo, padding: 4 },

  empty:     { padding: Spacing.xl, alignItems: "center" },
  emptyText: { color: Colors.text3, fontSize: Typography.sizes.base },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  queueNum:{ color: Colors.indigo, fontWeight: "900", fontSize: Typography.sizes.lg, width: 32 },
  patName: { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1, textAlign: "right" },
  patPhone:{ fontSize: Typography.sizes.xs, color: Colors.text3, textAlign: "right" },
  time:    { color: Colors.text2, fontSize: Typography.sizes.sm, marginBottom: 8 },
  btnRow:  { flexDirection: "row", gap: 8 },
  btn:     { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center", borderWidth: 1 },
  btnText: { fontWeight: "700", fontSize: Typography.sizes.sm },
});

