/**
 * Doctor Settings Screen — full clinic management settings
 */
import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Switch, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Colors, Typography, Spacing } from "@/theme";
import { getSettings, updateSettings } from "@/api/doctor";
import type { DoctorSettings } from "@/api/doctor";
import { useAuthStore } from "@/stores/auth";

const DAYS_CONFIG = [
  { key: "saturday",  label: "السبت" },
  { key: "sunday",    label: "الأحد" },
  { key: "monday",    label: "الاثنين" },
  { key: "tuesday",   label: "الثلاثاء" },
  { key: "wednesday", label: "الأربعاء" },
  { key: "thursday",  label: "الخميس" },
];

function parseDays(str: string | null): string[] {
  if (!str) return [];
  return str.split(",").map((d) => d.trim().toLowerCase());
}
function formatDays(days: string[]): string {
  return days.join(",");
}

export default function DoctorSettingsScreen() {
  const qc     = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-settings"],
    queryFn:  getSettings,
    staleTime: 60_000,
  });

  // Form state
  const [nameAr,            setNameAr]            = useState("");
  const [bio,               setBio]               = useState("");
  const [qualification,     setQualification]     = useState("");
  const [experienceYears,   setExperienceYears]   = useState("");
  const [consultationFee,   setConsultationFee]   = useState("");
  const [showConsultFee,    setShowConsultFee]     = useState(false);
  const [workingDays,       setWorkingDays]        = useState<string[]>([]);
  const [hoursStart,        setHoursStart]         = useState("");
  const [hoursEnd,          setHoursEnd]           = useState("");
  const [apptDuration,      setApptDuration]       = useState("");
  const [clinicAddress,     setClinicAddress]      = useState("");
  const [phone,             setPhone]              = useState("");
  const [announcement,      setAnnouncement]       = useState("");
  const [showAnnouncement,  setShowAnnouncement]   = useState(false);

  useEffect(() => {
    if (!data) return;
    setNameAr(data.nameAr ?? "");
    setBio(data.bioAr ?? data.bio ?? "");
    setQualification(data.qualification ?? "");
    setExperienceYears(data.experienceYears != null ? String(data.experienceYears) : "");
    setConsultationFee(data.consultationFee != null ? String(data.consultationFee) : "");
    setShowConsultFee(data.showConsultationFee ?? false);
    setWorkingDays(parseDays(data.workingDays));
    setHoursStart(data.workingHoursStart ?? "");
    setHoursEnd(data.workingHoursEnd ?? "");
    setApptDuration(data.appointmentDuration != null ? String(data.appointmentDuration) : "");
    setClinicAddress(data.clinicAddress ?? "");
    setPhone(data.phone ?? "");
    setAnnouncement(data.announcement ?? "");
    setShowAnnouncement(!!data.announcement);
  }, [data]);

  const { mutate: doSave, isPending: saving } = useMutation({
    mutationFn: () =>
      updateSettings({
        nameAr:               nameAr.trim() || undefined,
        bioAr:                bio.trim() || undefined,
        qualification:        qualification.trim() || undefined,
        experienceYears:      experienceYears ? Number(experienceYears) : undefined,
        consultationFee:      consultationFee ? Number(consultationFee) : undefined,
        showConsultationFee:  showConsultFee,
        workingDays:          formatDays(workingDays),
        workingHoursStart:    hoursStart.trim() || undefined,
        workingHoursEnd:      hoursEnd.trim() || undefined,
        appointmentDuration:  apptDuration ? Number(apptDuration) : undefined,
        clinicAddress:        clinicAddress.trim() || undefined,
        phone:                phone.trim() || undefined,
        announcement:         showAnnouncement && announcement.trim() ? announcement.trim() : null,
      } as Partial<DoctorSettings>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor-settings"] });
      Alert.alert("تم", "تم حفظ الإعدادات بنجاح");
    },
    onError: (err: Error) => Alert.alert("خطأ", err.message),
  });

  function toggleDay(day: string) {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleLogout() {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "تسجيل الخروج",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/role-select");
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.indigo} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>الإعدادات</Text>
          </View>

          {/* ── الملف الشخصي ─────────────────────────────────── */}
          <Section title="الملف الشخصي">
            <FieldLabel label="الاسم بالعربية" />
            <FieldInput value={nameAr} onChangeText={setNameAr} placeholder="د. اسم الطبيب" />

            <FieldLabel label="نبذة عن الطبيب" />
            <FieldInput value={bio} onChangeText={setBio} placeholder="أضف نبذة..." multiline />

            <FieldLabel label="المؤهل العلمي" />
            <FieldInput value={qualification} onChangeText={setQualification} placeholder="MBBS, MD, etc." />

            <FieldLabel label="سنوات الخبرة" />
            <FieldInput value={experienceYears} onChangeText={setExperienceYears} placeholder="10" keyboardType="numeric" />

            <FieldLabel label="أتعاب الكشف (د.ع)" />
            <FieldInput value={consultationFee} onChangeText={setConsultationFee} placeholder="25000" keyboardType="numeric" />

            <View style={styles.switchRow}>
              <Switch
                value={showConsultFee}
                onValueChange={setShowConsultFee}
                trackColor={{ true: Colors.indigo, false: Colors.bgSurface }}
                thumbColor="#fff"
              />
              <Text style={styles.switchLabel}>إظهار الأتعاب للمرضى</Text>
            </View>
          </Section>

          {/* ── ساعات العمل ─────────────────────────────────── */}
          <Section title="ساعات العمل">
            <FieldLabel label="أيام العمل" />
            <View style={styles.daysGrid}>
              {DAYS_CONFIG.map((d) => (
                <Pressable
                  key={d.key}
                  style={[styles.dayBtn, workingDays.includes(d.key) && styles.dayBtnActive]}
                  onPress={() => toggleDay(d.key)}
                >
                  <Text style={[styles.dayBtnText, workingDays.includes(d.key) && styles.dayBtnTextActive]}>
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <FieldLabel label="من" />
                <FieldInput value={hoursStart} onChangeText={setHoursStart} placeholder="08:00" />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel label="إلى" />
                <FieldInput value={hoursEnd} onChangeText={setHoursEnd} placeholder="17:00" />
              </View>
            </View>

            <FieldLabel label="مدة الموعد (دقيقة)" />
            <FieldInput value={apptDuration} onChangeText={setApptDuration} placeholder="30" keyboardType="numeric" />
          </Section>

          {/* ── العيادة ─────────────────────────────────── */}
          <Section title="العيادة">
            <FieldLabel label="عنوان العيادة" />
            <FieldInput value={clinicAddress} onChangeText={setClinicAddress} placeholder="المدينة، الحي..." />

            <FieldLabel label="رقم الهاتف" />
            <FieldInput value={phone} onChangeText={setPhone} placeholder="+964 7XX XXX XXXX" keyboardType="phone-pad" />
          </Section>

          {/* ── الإعلان ─────────────────────────────────── */}
          <Section title="الإعلان">
            <View style={styles.switchRow}>
              <Switch
                value={showAnnouncement}
                onValueChange={setShowAnnouncement}
                trackColor={{ true: Colors.indigo, false: Colors.bgSurface }}
                thumbColor="#fff"
              />
              <Text style={styles.switchLabel}>إظهار الإعلان</Text>
            </View>
            {showAnnouncement && (
              <>
                <FieldLabel label="نص الإعلان" />
                <FieldInput
                  value={announcement}
                  onChangeText={setAnnouncement}
                  placeholder="أضف إعلاناً..."
                  multiline
                />
              </>
            )}
          </Section>

          {/* Save button */}
          <View style={styles.saveArea}>
            <Pressable
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={() => doSave()}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>حفظ الإعدادات</Text>}
            </Pressable>
          </View>

          {/* Logout */}
          <View style={styles.logoutArea}>
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>🚪 تسجيل الخروج</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function FieldInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "phone-pad";
}) {
  return (
    <TextInput
      style={[styles.fieldInput, multiline && { minHeight: 80, textAlignVertical: "top" }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.text3}
      multiline={multiline}
      keyboardType={keyboardType ?? "default"}
      textAlign="right"
    />
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bgRoot },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  title: {
    fontSize:   Typography.sizes["2xl"],
    fontWeight: "900",
    color:      Colors.text1,
    textAlign:  "right",
  },

  section: {
    backgroundColor:  Colors.bgCard,
    borderRadius:     16,
    padding:          Spacing.md,
    borderWidth:      1,
    borderColor:      Colors.border,
    marginHorizontal: Spacing.md,
    marginBottom:     Spacing.md,
  },
  sectionTitle: {
    fontSize:         Typography.sizes.base,
    fontWeight:       "800",
    color:            Colors.text1,
    textAlign:        "right",
    marginBottom:     Spacing.sm,
    paddingBottom:    Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  fieldLabel: {
    fontSize:  Typography.sizes.sm,
    color:     Colors.text2,
    textAlign: "right",
    marginBottom: 4,
    marginTop:   Spacing.sm,
  },
  fieldInput: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    10,
    padding:         12,
    borderWidth:     1,
    borderColor:     Colors.border,
    color:           Colors.text1,
    fontSize:        Typography.sizes.base,
  },

  switchRow: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "flex-end",
    gap:            Spacing.sm,
    marginTop:      Spacing.sm,
  },
  switchLabel: { fontSize: Typography.sizes.sm, color: Colors.text1 },

  daysGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: Spacing.sm },
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      10,
    borderWidth:       1,
    borderColor:       Colors.border,
    backgroundColor:   Colors.bgSurface,
  },
  dayBtnActive:    { backgroundColor: Colors.indigo, borderColor: Colors.indigo },
  dayBtnText:      { color: Colors.text3, fontSize: Typography.sizes.sm, fontWeight: "600" },
  dayBtnTextActive:{ color: "#fff" },

  timeRow: { flexDirection: "row", gap: Spacing.sm },

  saveArea: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  saveBtn: {
    backgroundColor: Colors.indigo, borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: Typography.sizes.base },

  logoutArea: { paddingHorizontal: Spacing.md },
  logoutBtn: {
    borderWidth: 1, borderColor: "rgba(239,68,68,0.5)",
    borderRadius: 12, padding: 16, alignItems: "center",
  },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: Typography.sizes.base },
});
