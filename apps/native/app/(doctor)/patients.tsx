/**
 * Doctor Patients Screen — search, list, tap to view details
 */
import { useState, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  RefreshControl, ActivityIndicator, Modal, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { getPatients, getPatient } from "@/api/doctor";
import type { Patient, Appointment } from "@/api/doctor";
import { Avatar } from "@/components/ui";

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    scheduled: "مجدول", confirmed: "مؤكد", arrived: "وصل",
    in_progress: "جاري", completed: "مكتمل", cancelled: "ملغى", no_show: "غياب",
  };
  return map[status] ?? status;
}

function PatientDetailModal({
  patientId,
  onClose,
}: {
  patientId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["patient-detail", patientId],
    queryFn:  () => getPatient(patientId!),
    enabled:  !!patientId,
    staleTime: 60_000,
  });

  if (!patientId) return null;

  return (
    <Modal visible={!!patientId} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ملف المريض</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <ActivityIndicator color={Colors.indigo} style={{ margin: 24 }} />
          ) : !data ? (
            <Text style={styles.empty}>فشل تحميل البيانات</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Basic info */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>المعلومات الأساسية</Text>
                <InfoRow label="الاسم"          value={data.name} />
                <InfoRow label="رقم المريض"     value={data.patientNumber} />
                <InfoRow label="الهاتف"          value={data.phone} />
                <InfoRow label="الجنس"           value={data.gender === "male" ? "ذكر" : "أنثى"} />
                {data.dateOfBirth && (
                  <InfoRow label="تاريخ الميلاد" value={data.dateOfBirth} />
                )}
                {data.bloodType && (
                  <InfoRow label="فصيلة الدم"    value={data.bloodType} />
                )}
                <InfoRow label="عدد المواعيد"    value={String(data.appointmentCount)} />
              </View>

              {/* Appointment history */}
              {data.appointments && data.appointments.length > 0 && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>آخر المواعيد</Text>
                  {data.appointments.slice(0, 10).map((appt: Appointment) => (
                    <View key={appt.id} style={styles.apptRow}>
                      <Text style={styles.apptDate}>{appt.date}</Text>
                      <Text style={styles.apptStatus}>{statusLabel(appt.status)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Clinical notes */}
              {data.clinicalNotes && data.clinicalNotes.length > 0 && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>الملاحظات السريرية</Text>
                  {data.clinicalNotes.map((note: { id: string; body: string; createdAt: string }) => (
                    <View key={note.id} style={styles.noteItem}>
                      <Text style={styles.noteDate}>{note.createdAt.split("T")[0]}</Text>
                      <Text style={styles.noteBody}>{note.body}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

export default function DoctorPatientsScreen() {
  const [search,           setSearch]           = useState("");
  const [debouncedSearch,  setDebouncedSearch]  = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  function handleSearch(text: string) {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(text.trim()), 400);
  }

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["doctor-patients", debouncedSearch],
    queryFn:  () => getPatients({ search: debouncedSearch || undefined }),
    staleTime: 30_000,
  });

  const patients = data?.patients ?? [];
  const total    = data?.total ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>المرضى</Text>
        <Text style={styles.subtitle}>{total} مريض</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث بالاسم أو الهاتف..."
          placeholderTextColor={Colors.text3}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.indigo} size="large" />
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.md }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.indigo} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>لا يوجد مرضى</Text>
            </View>
          }
          renderItem={({ item }: { item: Patient }) => (
            <Pressable style={styles.patientCard} onPress={() => setSelectedPatientId(item.id)}>
              <Avatar uri={null} name={item.name} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{item.name}</Text>
                <Text style={styles.patientPhone}>📱 {item.phone}</Text>
                {item.createdAt && (
                  <Text style={styles.patientMeta}>
                    آخر زيارة: {item.createdAt.split("T")[0]}
                  </Text>
                )}
              </View>
              <View style={styles.apptCountBadge}>
                <Text style={styles.apptCountText}>{item.appointmentCount}</Text>
                <Text style={styles.apptCountLabel}>موعد</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <PatientDetailModal
        patientId={selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bgRoot },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  header:  { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 4 },
  title:   { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1, textAlign: "right" },
  subtitle:{ fontSize: Typography.sizes.sm, color: Colors.text3, textAlign: "right" },

  searchRow: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Colors.bgCard, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text1, fontSize: Typography.sizes.base, textAlign: "right",
  },

  empty:     { padding: Spacing.xl, alignItems: "center" },
  emptyText: { color: Colors.text3, fontSize: Typography.sizes.base },

  patientCard: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: Colors.bgCard,
    borderRadius:    14,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginBottom:    Spacing.sm,
    gap:             Spacing.sm,
  },
  patientName:  { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1, textAlign: "right" },
  patientPhone: { fontSize: Typography.sizes.xs, color: Colors.text3, textAlign: "right" },
  patientMeta:  { fontSize: Typography.sizes.xs, color: Colors.text2, textAlign: "right" },
  apptCountBadge: {
    backgroundColor: "rgba(99,102,241,0.12)", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6, alignItems: "center",
  },
  apptCountText:  { fontSize: Typography.sizes.base, fontWeight: "800", color: Colors.indigo },
  apptCountLabel: { fontSize: Typography.sizes.xs, color: Colors.text3 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalBox: {
    backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, maxHeight: "85%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  modalTitle:  { fontSize: Typography.sizes.lg, fontWeight: "800", color: Colors.text1 },
  modalClose:  { color: Colors.text3, fontSize: 20, padding: 4 },

  infoCard: {
    backgroundColor: Colors.bgSurface, borderRadius: 12,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  infoCardTitle: { fontSize: Typography.sizes.base, fontWeight: "800", color: Colors.text1, textAlign: "right", marginBottom: Spacing.sm },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: Typography.sizes.sm, color: Colors.text3 },
  infoValue: { fontSize: Typography.sizes.sm, color: Colors.text1, fontWeight: "600" },

  apptRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  apptDate:   { fontSize: Typography.sizes.sm, color: Colors.text2 },
  apptStatus: { fontSize: Typography.sizes.sm, color: Colors.indigo, fontWeight: "600" },

  noteItem: {
    backgroundColor: Colors.bgCard, borderRadius: 8, padding: Spacing.sm,
    marginBottom: 8,
  },
  noteDate: { fontSize: Typography.sizes.xs, color: Colors.text3, textAlign: "right", marginBottom: 4 },
  noteBody: { fontSize: Typography.sizes.sm, color: Colors.text2, lineHeight: 20, textAlign: "right" },
});
