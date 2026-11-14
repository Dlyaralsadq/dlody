/**
 * Doctor Appointments Archive — with tabs (today/week/all) and expandable cards
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  RefreshControl, Alert, ActivityIndicator, TextInput, Modal,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { getAppointments, updateAppointment } from "@/api/doctor";
import type { Appointment } from "@/api/doctor";

type TabKey = "today" | "week" | "all";

function todayStr()    { return new Date().toISOString().split("T")[0]; }
function weekStart()   {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function statusColor(status: string): string {
  switch (status) {
    case "completed":   return "#22c55e";
    case "arrived":     return "#06b6d4";
    case "in_progress": return "#8b5cf6";
    case "cancelled":   return "#475569";
    case "no_show":     return "#ef4444";
    default:            return "#f59e0b";
  }
}
function statusLabel(status: string): string {
  const map: Record<string, string> = {
    scheduled: "مجدول", confirmed: "مؤكد", arrived: "وصل",
    in_progress: "جاري", completed: "مكتمل", cancelled: "ملغى", no_show: "غياب",
  };
  return map[status] ?? status;
}

function AppointmentCard({
  item,
  onUpdated,
}: {
  item: Appointment;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes,    setNotes]    = useState(item.notes    ?? "");
  const [diagnosis,setDiagnosis] = useState(item.diagnosis ?? "");
  const [prescription, setPrescription] = useState(item.prescription ?? "");

  const { mutate: doUpdate, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof updateAppointment>[1]) => updateAppointment(item.id, data),
    onSuccess: onUpdated,
    onError: (err: Error) => Alert.alert("خطأ", err.message),
  });

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setExpanded((v) => !v)} style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{item.patient?.name}</Text>
          <Text style={styles.patientPhone}>📱 {item.patient?.phone}</Text>
          <Text style={styles.apptDate}>📅 {item.date}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: `${statusColor(item.status)}22`, borderColor: `${statusColor(item.status)}55` }
        ]}>
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
            {statusLabel(item.status)}
          </Text>
        </View>
      </Pressable>

      {/* Expanded details */}
      {expanded && (
        <View style={styles.cardExpanded}>
          {/* Status update buttons */}
          {item.status !== "completed" && item.status !== "cancelled" && (
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, { borderColor: "#06b6d4" }]}
                onPress={() => doUpdate({ arrivalStatus: "arrived" })}
                disabled={isPending}
              >
                <Text style={[styles.actionBtnText, { color: "#06b6d4" }]}>وصل</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { borderColor: "#22c55e" }]}
                onPress={() => doUpdate({ status: "completed" })}
                disabled={isPending}
              >
                <Text style={[styles.actionBtnText, { color: "#22c55e" }]}>مكتمل</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { borderColor: "#f43f5e" }]}
                onPress={() => {
                  Alert.alert("إلغاء الموعد", "هل تريد إلغاء هذا الموعد؟", [
                    { text: "لا", style: "cancel" },
                    { text: "نعم", style: "destructive", onPress: () => doUpdate({ status: "cancelled" }) },
                  ]);
                }}
                disabled={isPending}
              >
                <Text style={[styles.actionBtnText, { color: "#f43f5e" }]}>إلغاء</Text>
              </Pressable>
            </View>
          )}

          {/* Notes / diagnosis / prescription */}
          <Text style={styles.fieldLabel}>الملاحظات</Text>
          <TextInput
            style={styles.fieldInput}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="أضف ملاحظات..."
            placeholderTextColor={Colors.text3}
            textAlign="right"
            textAlignVertical="top"
          />
          <Text style={styles.fieldLabel}>التشخيص</Text>
          <TextInput
            style={styles.fieldInput}
            value={diagnosis}
            onChangeText={setDiagnosis}
            multiline
            placeholder="التشخيص..."
            placeholderTextColor={Colors.text3}
            textAlign="right"
            textAlignVertical="top"
          />
          <Text style={styles.fieldLabel}>الوصفة الطبية</Text>
          <TextInput
            style={styles.fieldInput}
            value={prescription}
            onChangeText={setPrescription}
            multiline
            placeholder="الوصفة الطبية..."
            placeholderTextColor={Colors.text3}
            textAlign="right"
            textAlignVertical="top"
          />
          <Pressable
            style={[styles.saveNotesBtn, isPending && { opacity: 0.6 }]}
            onPress={() => doUpdate({ notes, diagnosis, prescription })}
            disabled={isPending}
          >
            {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveNotesBtnText}>حفظ</Text>}
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function DoctorAppointmentsScreen() {
  const qc  = useQueryClient();
  const [tab,        setTab]        = useState<TabKey>("today");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  function getDateParam() {
    if (dateFilter) return dateFilter;
    if (tab === "today") return todayStr();
    if (tab === "week")  return weekStart();
    return undefined;
  }

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["doctor-appointments", tab, dateFilter, statusFilter],
    queryFn:  () => getAppointments({ date: getDateParam(), status: statusFilter || undefined }),
    staleTime: 15_000,
  });

  const appointments = data?.appointments ?? [];
  const total        = data?.total ?? 0;

  const TABS: { key: TabKey; label: string }[] = [
    { key: "today", label: "اليوم" },
    { key: "week",  label: "هذا الأسبوع" },
    { key: "all",   label: "الكل" },
  ];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>المواعيد</Text>
        <Text style={styles.subtitle}>{total} موعد</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => { setTab(t.key); setDateFilter(""); }}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Date filter */}
      <View style={styles.filterRow}>
        <TextInput
          style={styles.dateFilter}
          placeholder="تصفية بالتاريخ (YYYY-MM-DD)"
          placeholderTextColor={Colors.text3}
          value={dateFilter}
          onChangeText={setDateFilter}
          textAlign="right"
        />
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.indigo} size="large" />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.md }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.indigo} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>لا توجد مواعيد</Text>
            </View>
          }
          renderItem={({ item }) => (
            <AppointmentCard
              item={item}
              onUpdated={() => qc.invalidateQueries({ queryKey: ["doctor-appointments"] })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Colors.bgRoot },
  loading:  { flex: 1, alignItems: "center", justifyContent: "center" },
  header:   { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 4 },
  title:    { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1, textAlign: "right" },
  subtitle: { fontSize: Typography.sizes.sm, color: Colors.text3, textAlign: "right" },

  tabs: {
    flexDirection: "row", borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  tabBtn:      { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive:{ borderBottomColor: Colors.indigo },
  tabText:     { fontSize: Typography.sizes.sm, fontWeight: "600", color: Colors.text3 },
  tabTextActive:{ color: Colors.indigo },

  filterRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  dateFilter: {
    backgroundColor: Colors.bgCard, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border, color: Colors.text1, fontSize: Typography.sizes.sm,
  },

  empty:     { padding: Spacing.xl, alignItems: "center" },
  emptyText: { color: Colors.text3, fontSize: Typography.sizes.base },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 14, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  patientName:  { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1, textAlign: "right" },
  patientPhone: { fontSize: Typography.sizes.xs, color: Colors.text3, textAlign: "right" },
  apptDate:     { fontSize: Typography.sizes.xs, color: Colors.text2, textAlign: "right" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  statusText:  { fontSize: Typography.sizes.xs, fontWeight: "700" },

  cardExpanded: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  actionRow: { flexDirection: "row", gap: 8, marginBottom: Spacing.sm, justifyContent: "flex-end" },
  actionBtn: {
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  actionBtnText: { fontSize: Typography.sizes.xs, fontWeight: "700" },

  fieldLabel: { fontSize: Typography.sizes.sm, color: Colors.text2, textAlign: "right", marginBottom: 4, marginTop: 8 },
  fieldInput: {
    backgroundColor: Colors.bgSurface, borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text1, fontSize: Typography.sizes.sm, minHeight: 60,
  },
  saveNotesBtn: {
    backgroundColor: Colors.indigo, borderRadius: 10, paddingVertical: 10,
    alignItems: "center", marginTop: Spacing.sm,
  },
  saveNotesBtnText: { color: "#fff", fontWeight: "700" },
});
