/**
 * Doctor Dashboard — full clinic management
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, Alert, Modal, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Typography, Spacing } from "@/theme";
import {
  getDashboard, getTodayQueue, updateAppointment, createAppointment,
} from "@/api/doctor";
import type { QueueAppointment } from "@/api/doctor";
import { Avatar, Badge } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";

const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
function getNext7Days() {
  const days: { label: string; value: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({ label: i === 0 ? "اليوم" : DAYS_AR[d.getDay()], value: d.toISOString().split("T")[0] });
  }
  return days;
}

function statusColor(status: string): string {
  switch (status) {
    case "completed":    return "#22c55e";
    case "arrived":      return "#06b6d4";
    case "in_progress":  return "#8b5cf6";
    case "cancelled":    return "#475569";
    default:             return "#f59e0b";
  }
}
function statusLabel(status: string): string {
  switch (status) {
    case "scheduled":   return "مجدول";
    case "confirmed":   return "مؤكد";
    case "arrived":     return "وصل";
    case "in_progress": return "جاري";
    case "completed":   return "مكتمل";
    case "cancelled":   return "ملغى";
    case "no_show":     return "غياب";
    default:            return status;
  }
}

type CreateModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
};

function CreateAppointmentModal({ visible, onClose, onCreated }: CreateModalProps) {
  const [patientName,  setPatientName]  = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [date,         setDate]         = useState(new Date().toISOString().split("T")[0]);
  const [time,         setTime]         = useState("");
  const [reason,       setReason]       = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => createAppointment({ patientName, patientPhone, date, time, reason: reason || undefined }),
    onSuccess: (res) => {
      Alert.alert("تم", `تم إنشاء الموعد رقم ${res.appointmentNumber}`);
      setPatientName(""); setPatientPhone(""); setTime(""); setReason("");
      onCreated();
      onClose();
    },
    onError: (err: Error) => Alert.alert("خطأ", err.message),
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>إضافة موعد جديد</Text>
            <TextInput style={styles.modalInput} placeholder="اسم المريض" placeholderTextColor={Colors.text3} value={patientName} onChangeText={setPatientName} textAlign="right" />
            <TextInput style={styles.modalInput} placeholder="رقم الهاتف" placeholderTextColor={Colors.text3} value={patientPhone} onChangeText={setPatientPhone} keyboardType="phone-pad" textAlign="right" />
            <TextInput style={styles.modalInput} placeholder="التاريخ (YYYY-MM-DD)" placeholderTextColor={Colors.text3} value={date} onChangeText={setDate} textAlign="right" />
            <TextInput style={styles.modalInput} placeholder="الوقت (HH:MM)" placeholderTextColor={Colors.text3} value={time} onChangeText={setTime} textAlign="right" />
            <TextInput style={[styles.modalInput, { minHeight: 60 }]} placeholder="السبب (اختياري)" placeholderTextColor={Colors.text3} value={reason} onChangeText={setReason} multiline textAlign="right" textAlignVertical="top" />
            <View style={styles.modalBtns}>
              <Pressable style={[styles.modalSaveBtn, isPending && { opacity: 0.6 }]} onPress={() => mutate()} disabled={isPending || !patientName || !patientPhone || !time}>
                {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveBtnText}>إضافة</Text>}
              </Pressable>
              <Pressable style={styles.modalCancelBtn} onPress={onClose}>
                <Text style={styles.modalCancelBtnText}>إلغاء</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function QueueCard({ item, onRefresh }: { item: QueueAppointment; onRefresh: () => void }) {
  const { mutate: doUpdate, isPending } = useMutation({
    mutationFn: (data: { status?: string; arrivalStatus?: string }) => updateAppointment(item.id, data),
    onSuccess: onRefresh,
    onError: (err: Error) => Alert.alert("خطأ", err.message),
  });

  return (
    <View style={styles.queueCard}>
      <View style={styles.queueCardTop}>
        <View style={styles.queueNum}>
          <Text style={styles.queueNumText}>#{item.queueNumber ?? "—"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.queuePatientName}>{item.patient?.name}</Text>
          <Text style={styles.queuePatientPhone}>📱 {item.patient?.phone}</Text>
          {item.reason && <Text style={styles.queueReason}>{item.reason}</Text>}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor(item.status)}22`, borderColor: `${statusColor(item.status)}44` }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor(item.status) }]}>
            {statusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      {item.status !== "completed" && item.status !== "cancelled" && (
        <View style={styles.queueActions}>
          {item.arrivalStatus !== "arrived" && (
            <Pressable style={[styles.queueActionBtn, { borderColor: "#06b6d4" }]} onPress={() => doUpdate({ arrivalStatus: "arrived" })} disabled={isPending}>
              <Text style={[styles.queueActionText, { color: "#06b6d4" }]}>وصل ✓</Text>
            </Pressable>
          )}
          <Pressable style={[styles.queueActionBtn, { borderColor: Colors.success }]} onPress={() => doUpdate({ status: "completed" })} disabled={isPending}>
            <Text style={[styles.queueActionText, { color: Colors.success }]}>أكمل ✓</Text>
          </Pressable>
          <Pressable style={[styles.queueActionBtn, { borderColor: Colors.rose }]} onPress={() => {
            Alert.alert("تأكيد الإلغاء", "هل تريد إلغاء هذا الموعد؟", [
              { text: "لا", style: "cancel" },
              { text: "نعم", style: "destructive", onPress: () => doUpdate({ status: "cancelled" }) },
            ]);
          }} disabled={isPending}>
            <Text style={[styles.queueActionText, { color: Colors.rose }]}>إلغاء ✗</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function DoctorDashboard() {
  const user = useAuthStore((s) => s.user);
  const qc   = useQueryClient();
  const [createModal, setCreateModal] = useState(false);

  const { data, isLoading, refetch: refetchDash, isRefetching: isRefetchingDash } = useQuery({
    queryKey: ["doctor-dashboard"],
    queryFn:  getDashboard,
    staleTime: 30_000,
  });

  const { data: queueData, refetch: refetchQueue, isRefetching: isRefetchingQueue } = useQuery({
    queryKey: ["doctor-queue"],
    queryFn:  getTodayQueue,
    staleTime: 15_000,
  });

  const isRefreshing = isRefetchingDash || isRefetchingQueue;

  function handleRefresh() {
    refetchDash();
    refetchQueue();
  }

  const stats  = data?.stats;
  const doctor = data?.doctor;
  const sub    = data?.subscription;
  const queue  = queueData?.queue ?? [];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.indigo} />
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
          <Text style={styles.dateToday}>
            {new Date().toLocaleDateString("ar-IQ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </Text>

          {/* Subscription warning */}
          {sub && !sub.active && (
            <View style={styles.subWarning}>
              <Text style={styles.subWarningText}>⚠️ اشتراكك منتهٍ — يرجى التجديد للاستمرار</Text>
            </View>
          )}
        </LinearGradient>

        {/* Stats cards */}
        <View style={styles.statsRow}>
          <StatCard label="مواعيد اليوم" value={stats?.todayTotal ?? "—"} icon="📅" />
          <StatCard label="مكتملة"       value={stats?.todayCompleted ?? "—"} icon="✅" color={Colors.success} />
          <StatCard label="في الانتظار"  value={stats?.todayWaiting ?? "—"} icon="⏳" color={Colors.amber} />
          <StatCard label="المرضى"        value={stats?.totalPatients ?? "—"} icon="👥" color={Colors.violet} />
        </View>

        {/* Queue section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>قائمة الانتظار اليوم</Text>
            <Pressable style={styles.addBtn} onPress={() => setCreateModal(true)}>
              <Text style={styles.addBtnText}>+ إضافة موعد</Text>
            </Pressable>
          </View>

          {queue.length === 0 ? (
            <Text style={styles.empty}>لا توجد مواعيد اليوم</Text>
          ) : (
            queue.map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                onRefresh={() => {
                  qc.invalidateQueries({ queryKey: ["doctor-queue"] });
                  qc.invalidateQueries({ queryKey: ["doctor-dashboard"] });
                }}
              />
            ))
          )}

          <Pressable style={styles.viewAllBtn} onPress={() => router.push("/(doctor)/appointments")}>
            <Text style={styles.viewAllText}>عرض جميع المواعيد ←</Text>
          </Pressable>
        </View>

        {/* Quick nav */}
        <View style={styles.quickNav}>
          <QuickNavBtn icon="👥" label="المرضى"    onPress={() => router.push("/(doctor)/patients")} />
          <QuickNavBtn icon="📝" label="المنشورات" onPress={() => router.push("/(doctor)/posts")} />
          <QuickNavBtn icon="⚙️" label="الإعدادات" onPress={() => router.push("/(doctor)/settings")} />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <CreateAppointmentModal
        visible={createModal}
        onClose={() => setCreateModal(false)}
        onCreated={() => qc.invalidateQueries({ queryKey: ["doctor-queue"] })}
      />
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickNavBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickNavBtn} onPress={onPress}>
      <Text style={styles.quickNavIcon}>{icon}</Text>
      <Text style={styles.quickNavLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgRoot },

  hero:     { padding: Spacing.lg, paddingBottom: Spacing.md },
  heroRow:  { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.sm },
  heroInfo: { flex: 1, alignItems: "flex-end" },
  greeting: { fontSize: Typography.sizes.sm, color: Colors.text3 },
  docName:  { fontSize: Typography.sizes.xl, fontWeight: "900", color: Colors.text1 },
  docSpec:  { fontSize: Typography.sizes.sm, color: Colors.indigo },
  dateToday:{ fontSize: Typography.sizes.sm, color: Colors.text3, textAlign: "right" },
  subWarning: {
    backgroundColor: "rgba(245,158,11,0.15)", borderRadius: 10,
    padding: Spacing.sm, borderWidth: 1, borderColor: "rgba(245,158,11,0.3)",
    marginTop: Spacing.sm,
  },
  subWarningText: { color: Colors.amber, fontSize: Typography.sizes.sm, textAlign: "right" },

  statsRow: { flexDirection: "row", padding: Spacing.md, gap: Spacing.sm, flexWrap: "wrap" },
  statCard: {
    flex: 1, minWidth: "22%", backgroundColor: Colors.bgCard, borderRadius: 14,
    padding: Spacing.sm, alignItems: "center", borderWidth: 1, borderColor: Colors.border,
  },
  statIcon:  { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1 },
  statLabel: { fontSize: Typography.sizes.xs, color: Colors.text3, textAlign: "center", marginTop: 2 },

  section: {
    margin: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: 16,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  sectionHeaderRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: "800", color: Colors.text1 },
  empty:        { color: Colors.text3, textAlign: "center", padding: Spacing.md },
  addBtn: {
    backgroundColor: Colors.indigo, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnText:   { color: "#fff", fontSize: Typography.sizes.xs, fontWeight: "700" },
  viewAllBtn:   { marginTop: Spacing.md, alignItems: "center" },
  viewAllText:  { color: Colors.indigo, fontWeight: "700", fontSize: Typography.sizes.sm },

  // Queue card
  queueCard: {
    backgroundColor: Colors.bgSurface, borderRadius: 12,
    padding: Spacing.sm, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  queueCardTop: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  queueNum: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(99,102,241,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  queueNumText:      { color: Colors.indigo, fontWeight: "800", fontSize: Typography.sizes.sm },
  queuePatientName:  { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1, textAlign: "right" },
  queuePatientPhone: { fontSize: Typography.sizes.xs, color: Colors.text3, textAlign: "right" },
  queueReason:       { fontSize: Typography.sizes.xs, color: Colors.text2, textAlign: "right", marginTop: 2 },
  statusBadge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: Typography.sizes.xs, fontWeight: "700" },

  queueActions: {
    flexDirection: "row", gap: 6, marginTop: Spacing.sm,
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
    justifyContent: "flex-end",
  },
  queueActionBtn: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  queueActionText: { fontSize: Typography.sizes.xs, fontWeight: "700" },

  quickNav: { flexDirection: "row", paddingHorizontal: Spacing.md, gap: Spacing.sm },
  quickNavBtn: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14,
    padding: Spacing.md, alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickNavIcon:  { fontSize: 24 },
  quickNavLabel: { fontSize: Typography.sizes.xs, color: Colors.text2, fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, gap: Spacing.sm,
  },
  modalTitle:        { fontSize: Typography.sizes.lg, fontWeight: "800", color: Colors.text1, textAlign: "right", marginBottom: Spacing.sm },
  modalInput: {
    backgroundColor: Colors.bgSurface, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text1, fontSize: Typography.sizes.base,
  },
  modalBtns:         { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  modalSaveBtn:      { flex: 1, backgroundColor: Colors.indigo, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  modalSaveBtnText:  { color: "#fff", fontWeight: "700" },
  modalCancelBtn:    { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  modalCancelBtnText:{ color: Colors.text2 },
});
