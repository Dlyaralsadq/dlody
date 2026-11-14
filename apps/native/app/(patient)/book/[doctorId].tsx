/**
 * Booking screen — patient books an appointment with a doctor
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { getDoctorPublic, bookAppointment } from "@/api/patient";
import { useAuthStore } from "@/stores/auth";

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getNext7Days() {
  const days: { label: string; value: string }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label: i === 0 ? "اليوم" : DAYS[d.getDay()],
      value: d.toISOString().split("T")[0],
    });
  }
  return days;
}

export default function BookAppointmentScreen() {
  const { doctorId, date: initDate, time: initTime } = useLocalSearchParams<{
    doctorId: string;
    date?: string;
    time?: string;
  }>();

  const user = useAuthStore((s) => s.user);

  const [selectedDate, setSelectedDate] = useState<string>(
    initDate ?? new Date().toISOString().split("T")[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>(initTime ?? "");
  const [reason,       setReason]       = useState("");

  const days = getNext7Days();

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-profile", doctorId, selectedDate],
    queryFn:  () => getDoctorPublic(doctorId!, selectedDate, user?.id),
    enabled:  !!doctorId,
    staleTime: 60_000,
  });

  const { mutate: book, isPending } = useMutation({
    mutationFn: () =>
      bookAppointment({
        doctorId: doctorId!,
        date:     selectedDate,
        time:     selectedTime,
        reason:   reason.trim() || undefined,
      }),
    onSuccess: () => {
      Alert.alert("تم الحجز ✅", "تم حجز موعدك بنجاح", [
        { text: "حسناً", onPress: () => router.replace("/(patient)/appointments") },
      ]);
    },
    onError: (err: Error) => {
      Alert.alert("فشل الحجز", err.message ?? "حدث خطأ");
    },
  });

  function handleBook() {
    if (!user) {
      Alert.alert("يجب تسجيل الدخول", "يرجى تسجيل الدخول أولاً", [
        { text: "تسجيل الدخول", onPress: () => router.push("/(auth)/patient-login") },
        { text: "إلغاء", style: "cancel" },
      ]);
      return;
    }
    if (!selectedDate || !selectedTime) {
      Alert.alert("خطأ", "يرجى اختيار التاريخ والوقت");
      return;
    }
    book();
  }

  const availableSlots = data?.slots?.slots.filter((s) => s.available) ?? [];
  const doctor = data?.doctor;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.md }} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>→ العودة</Text>
          </Pressable>

          <Text style={styles.title}>حجز موعد</Text>
          {doctor && (
            <Text style={styles.subtitle}>مع د. {doctor.nameAr}</Text>
          )}

          {/* Date picker */}
          <Text style={styles.label}>اختر التاريخ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
            {days.map((d) => (
              <Pressable
                key={d.value}
                style={[styles.dayChip, selectedDate === d.value && styles.dayChipActive]}
                onPress={() => { setSelectedDate(d.value); setSelectedTime(""); }}
              >
                <Text style={[styles.dayLabel, selectedDate === d.value && styles.dayLabelActive]}>
                  {d.label}
                </Text>
                <Text style={[styles.dayDate, selectedDate === d.value && styles.dayLabelActive]}>
                  {new Date(d.value).getDate()}/{new Date(d.value).getMonth() + 1}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Time slots */}
          <Text style={styles.label}>اختر الوقت</Text>
          {isLoading ? (
            <ActivityIndicator color={Colors.indigo} style={{ marginVertical: 20 }} />
          ) : availableSlots.length === 0 ? (
            <Text style={styles.noSlots}>لا توجد مواعيد متاحة في هذا اليوم</Text>
          ) : (
            <View style={styles.slotsGrid}>
              {availableSlots.map((s) => (
                <Pressable
                  key={s.time}
                  style={[styles.slot, selectedTime === s.time && styles.slotActive]}
                  onPress={() => setSelectedTime(s.time)}
                >
                  <Text style={[styles.slotText, selectedTime === s.time && styles.slotTextActive]}>
                    {s.time}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Reason */}
          <Text style={styles.label}>سبب الزيارة (اختياري)</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="اكتب سبب الزيارة..."
            placeholderTextColor={Colors.text3}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlign="right"
          />

          {/* Summary */}
          {selectedDate && selectedTime && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>ملخص الحجز</Text>
              <Text style={styles.summaryRow}>📅 {selectedDate}</Text>
              <Text style={styles.summaryRow}>🕐 {selectedTime}</Text>
              {doctor?.consultationFee && doctor.showConsultationFee && (
                <Text style={styles.summaryRow}>💰 {doctor.consultationFee.toLocaleString()} د.ع</Text>
              )}
            </View>
          )}

          {/* Book button */}
          <Pressable
            style={[styles.bookBtn, (!selectedDate || !selectedTime) && styles.bookBtnDisabled]}
            onPress={handleBook}
            disabled={isPending || !selectedDate || !selectedTime}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookBtnText}>تأكيد الحجز</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Colors.bgRoot },
  backBtn:  { marginBottom: Spacing.md },
  backText: { color: Colors.indigo, fontSize: Typography.sizes.sm, fontWeight: "600" },
  title:    { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1, textAlign: "right" },
  subtitle: { fontSize: Typography.sizes.base, color: Colors.indigo, textAlign: "right", marginBottom: Spacing.lg },
  label:    { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text2, textAlign: "right", marginBottom: 8 },

  dayChip: {
    backgroundColor: Colors.bgCard, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    marginRight: 8, borderWidth: 1, borderColor: Colors.border, alignItems: "center",
  },
  dayChipActive: { backgroundColor: Colors.indigo, borderColor: Colors.indigo },
  dayLabel:      { color: Colors.text2, fontSize: Typography.sizes.xs, fontWeight: "700" },
  dayDate:       { color: Colors.text3, fontSize: Typography.sizes.xs, marginTop: 2 },
  dayLabelActive:{ color: "#fff" },

  noSlots: { color: Colors.text3, textAlign: "center", padding: Spacing.md },
  slotsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: Spacing.lg,
  },
  slot: {
    backgroundColor: Colors.bgCard, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  slotActive: { backgroundColor: Colors.indigo, borderColor: Colors.indigo },
  slotText:   { color: Colors.text2, fontWeight: "700", fontSize: Typography.sizes.sm },
  slotTextActive: { color: "#fff" },

  reasonInput: {
    backgroundColor: Colors.bgCard, borderRadius: 12, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text1, fontSize: Typography.sizes.base, minHeight: 80,
    marginBottom: Spacing.lg, textAlignVertical: "top",
  },

  summaryCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg,
  },
  summaryTitle: { fontSize: Typography.sizes.base, fontWeight: "800", color: Colors.text1, textAlign: "right", marginBottom: 8 },
  summaryRow:   { color: Colors.text2, fontSize: Typography.sizes.sm, textAlign: "right", marginBottom: 4 },

  bookBtn: {
    backgroundColor: Colors.indigo, borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginBottom: 40,
    shadowColor: Colors.indigo, shadowOpacity: 0.5, shadowRadius: 15, elevation: 8,
  },
  bookBtnDisabled: { opacity: 0.5 },
  bookBtnText: { color: "#fff", fontWeight: "800", fontSize: Typography.sizes.base },
});
