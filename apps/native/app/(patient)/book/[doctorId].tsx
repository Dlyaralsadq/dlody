/**
 * Booking screen — full appointment booking flow
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
import { Avatar } from "@/components/ui";

const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_SHORT = ["أحد", "إثن", "ثلا", "أرب", "خمس", "جمع", "سبت"];

function getNext14Days() {
  const days: { label: string; dateLabel: string; value: string }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label:     i === 0 ? "اليوم" : DAYS_SHORT[d.getDay()],
      dateLabel: `${d.getDate()}/${d.getMonth() + 1}`,
      value:     d.toISOString().split("T")[0],
    });
  }
  return days;
}

type BookFor = "self" | "other";

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
  const [bookFor,      setBookFor]      = useState<BookFor>("self");
  const [otherName,    setOtherName]    = useState("");
  const [otherPhone,   setOtherPhone]   = useState("");
  const [reason,       setReason]       = useState("");
  const [booked,       setBooked]       = useState(false);
  const [appointmentNum, setAppointmentNum] = useState("");

  const days = getNext14Days();

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-booking", doctorId, selectedDate],
    queryFn:  () => getDoctorPublic(doctorId!, selectedDate),
    enabled:  !!doctorId,
    staleTime: 60_000,
  });

  const { mutate: book, isPending } = useMutation({
    mutationFn: () =>
      bookAppointment({
        doctorId:    doctorId!,
        date:        selectedDate,
        time:        selectedTime,
        reason:      reason.trim() || undefined,
        ...(bookFor === "other"
          ? { patientName: otherName, patientPhone: otherPhone }
          : {}),
      } as Parameters<typeof bookAppointment>[0]),
    onSuccess: (res) => {
      setBooked(true);
      setAppointmentNum(res.appointmentId ?? "");
    },
    onError: (err: Error) => {
      Alert.alert("فشل الحجز", err.message ?? "حدث خطأ، يرجى المحاولة لاحقاً");
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
    if (bookFor === "other" && (!otherName.trim() || !otherPhone.trim())) {
      Alert.alert("خطأ", "يرجى إدخال اسم ورقم هاتف المريض");
      return;
    }
    book();
  }

  const doctor     = data?.doctor;
  const allSlots   = data?.slots?.slots ?? [];
  const avail      = allSlots.filter((s) => s.available);
  const unavail    = allSlots.filter((s) => !s.available);

  // ── Success screen ──────────────────────────────────────────────────────────
  if (booked) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.successScreen}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>تم الحجز بنجاح!</Text>
          <Text style={styles.successSub}>موعدك مع د. {doctor?.nameAr}</Text>
          <View style={styles.successCard}>
            <Text style={styles.successRow}>📅 {selectedDate}</Text>
            <Text style={styles.successRow}>🕐 {selectedTime}</Text>
            {appointmentNum && (
              <Text style={styles.successRow}>🔢 رقم الموعد: {appointmentNum}</Text>
            )}
          </View>
          <Pressable
            style={styles.successBtn}
            onPress={() => router.replace("/(patient)/appointments")}
          >
            <Text style={styles.successBtnText}>عرض مواعيدي</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.md }} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← العودة</Text>
          </Pressable>

          <Text style={styles.title}>حجز موعد</Text>

          {/* Doctor card */}
          {doctor && (
            <View style={styles.doctorCard}>
              <Avatar uri={doctor.logoUrl} name={doctor.nameAr} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorName}>د. {doctor.nameAr}</Text>
                <Text style={styles.doctorSpec}>{doctor.specialty?.nameAr}</Text>
                {doctor.consultationFee && doctor.showConsultationFee && (
                  <Text style={styles.doctorFee}>💰 {doctor.consultationFee.toLocaleString()} د.ع</Text>
                )}
              </View>
            </View>
          )}

          {/* Date selector */}
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
                  {d.dateLabel}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Time slots */}
          <Text style={styles.label}>اختر الوقت</Text>
          {isLoading ? (
            <ActivityIndicator color={Colors.indigo} style={{ marginVertical: 20 }} />
          ) : allSlots.length === 0 ? (
            <Text style={styles.noSlots}>لا توجد مواعيد متاحة في هذا اليوم</Text>
          ) : (
            <View style={styles.slotsGrid}>
              {avail.map((s) => (
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
              {unavail.map((s) => (
                <View key={s.time} style={[styles.slot, styles.slotUnavail]}>
                  <Text style={styles.slotTextUnavail}>{s.time}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Book for self/other toggle */}
          <Text style={styles.label}>الحجز لـ</Text>
          <View style={styles.bookForRow}>
            <Pressable
              style={[styles.bookForBtn, bookFor === "self" && styles.bookForBtnActive]}
              onPress={() => setBookFor("self")}
            >
              <Text style={[styles.bookForText, bookFor === "self" && styles.bookForTextActive]}>
                أحجز لنفسي
              </Text>
            </Pressable>
            <Pressable
              style={[styles.bookForBtn, bookFor === "other" && styles.bookForBtnActive]}
              onPress={() => setBookFor("other")}
            >
              <Text style={[styles.bookForText, bookFor === "other" && styles.bookForTextActive]}>
                أحجز لشخص آخر
              </Text>
            </Pressable>
          </View>

          {/* Self info */}
          {bookFor === "self" && user && (
            <View style={styles.selfCard}>
              <Text style={styles.selfName}>{user.name}</Text>
              {user.phone && <Text style={styles.selfPhone}>📱 {user.phone}</Text>}
            </View>
          )}

          {/* Other person form */}
          {bookFor === "other" && (
            <View style={styles.otherForm}>
              <TextInput
                style={styles.textInput}
                placeholder="اسم المريض"
                placeholderTextColor={Colors.text3}
                value={otherName}
                onChangeText={setOtherName}
                textAlign="right"
              />
              <TextInput
                style={styles.textInput}
                placeholder="رقم هاتف المريض"
                placeholderTextColor={Colors.text3}
                value={otherPhone}
                onChangeText={setOtherPhone}
                keyboardType="phone-pad"
                textAlign="right"
              />
            </View>
          )}

          {/* Reason */}
          <Text style={styles.label}>سبب الزيارة (اختياري)</Text>
          <TextInput
            style={[styles.textInput, styles.reasonInput]}
            placeholder="اكتب سبب الزيارة..."
            placeholderTextColor={Colors.text3}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlign="right"
            textAlignVertical="top"
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
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Colors.bgRoot },
  backBtn:  { marginBottom: Spacing.md },
  backText: { color: Colors.indigo, fontSize: Typography.sizes.sm, fontWeight: "600" },
  title:    { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1, textAlign: "right", marginBottom: Spacing.md },

  doctorCard: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: Colors.bgCard,
    borderRadius:    16,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             Spacing.md,
    marginBottom:    Spacing.lg,
  },
  doctorName: { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1, textAlign: "right" },
  doctorSpec: { fontSize: Typography.sizes.sm, color: Colors.indigo, textAlign: "right" },
  doctorFee:  { fontSize: Typography.sizes.sm, color: Colors.text3, textAlign: "right", marginTop: 2 },

  label: { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text2, textAlign: "right", marginBottom: 8 },

  // Date
  dayChip: {
    backgroundColor: Colors.bgCard, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    marginRight: 8, borderWidth: 1, borderColor: Colors.border, alignItems: "center",
  },
  dayChipActive: { backgroundColor: Colors.indigo, borderColor: Colors.indigo },
  dayLabel:      { color: Colors.text2, fontSize: Typography.sizes.xs, fontWeight: "700" },
  dayDate:       { color: Colors.text3, fontSize: Typography.sizes.xs, marginTop: 2 },
  dayLabelActive:{ color: "#fff" },

  // Slots
  noSlots: { color: Colors.text3, textAlign: "center", padding: Spacing.md, marginBottom: Spacing.md },
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: Spacing.lg },
  slot: {
    backgroundColor: Colors.bgCard, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.indigo,
  },
  slotActive:       { backgroundColor: Colors.indigo },
  slotUnavail:      { borderColor: Colors.border, opacity: 0.4 },
  slotText:         { color: Colors.indigo, fontWeight: "700", fontSize: Typography.sizes.sm },
  slotTextActive:   { color: "#fff" },
  slotTextUnavail:  { color: Colors.text3, fontSize: Typography.sizes.sm },

  // Book for
  bookForRow:       { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md },
  bookForBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard, alignItems: "center",
  },
  bookForBtnActive:  { backgroundColor: Colors.indigo, borderColor: Colors.indigo },
  bookForText:       { color: Colors.text2, fontWeight: "600", fontSize: Typography.sizes.sm },
  bookForTextActive: { color: "#fff" },

  // Self info
  selfCard: {
    backgroundColor: Colors.bgCard, borderRadius: 12, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
    alignItems: "flex-end",
  },
  selfName:  { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1 },
  selfPhone: { fontSize: Typography.sizes.sm, color: Colors.text2, marginTop: 4 },

  // Other form
  otherForm: { gap: Spacing.sm, marginBottom: Spacing.md },
  textInput: {
    backgroundColor: Colors.bgCard, borderRadius: 12, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text1, fontSize: Typography.sizes.base,
  },
  reasonInput: { minHeight: 80, marginBottom: Spacing.md },

  // Summary
  summaryCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg,
  },
  summaryTitle: { fontSize: Typography.sizes.base, fontWeight: "800", color: Colors.text1, textAlign: "right", marginBottom: 8 },
  summaryRow:   { color: Colors.text2, fontSize: Typography.sizes.sm, textAlign: "right", marginBottom: 4 },

  // Book button
  bookBtn: {
    backgroundColor: Colors.indigo, borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginBottom: 16,
  },
  bookBtnDisabled: { opacity: 0.5 },
  bookBtnText: { color: "#fff", fontWeight: "800", fontSize: Typography.sizes.base },

  // Success
  successScreen: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: Spacing.xl, gap: Spacing.md,
  },
  successIcon:  { fontSize: 64, marginBottom: Spacing.sm },
  successTitle: { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1 },
  successSub:   { fontSize: Typography.sizes.base, color: Colors.text2 },
  successCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, alignSelf: "stretch",
    gap: 8, alignItems: "flex-end",
  },
  successRow: { color: Colors.text2, fontSize: Typography.sizes.sm },
  successBtn: {
    backgroundColor: Colors.indigo, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14,
    marginTop: Spacing.md,
  },
  successBtnText: { color: "#fff", fontWeight: "800", fontSize: Typography.sizes.base },
});
