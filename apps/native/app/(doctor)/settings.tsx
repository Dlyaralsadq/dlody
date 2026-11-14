import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Colors, Typography, Spacing } from "@/theme";
import { getDoctorSettings } from "@/api/doctor";
import { Avatar } from "@/components/ui";
import { Badge } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";

export default function DoctorSettingsScreen() {
  const logout = useAuthStore((s) => s.logout);

  const { data: doctor, isLoading } = useQuery({
    queryKey: ["doctor-settings"],
    queryFn:  getDoctorSettings,
    staleTime: 60_000,
  });

  async function handleLogout() {
    Alert.alert("تسجيل الخروج", "هل تريد الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/role-select");
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}>
        <Text style={styles.title}>الإعدادات</Text>

        {/* Profile card */}
        {doctor && (
          <View style={styles.profileCard}>
            <Avatar uri={doctor.logoUrl} name={doctor.nameAr} size={72} />
            <View style={styles.profileInfo}>
              <Text style={styles.docName}>{doctor.nameAr}</Text>
              <Text style={styles.docSpec}>{doctor.specialty?.nameAr}</Text>
              {doctor.clinicAddress && (
                <Text style={styles.docAddr}>📍 {doctor.clinicAddress}</Text>
              )}
            </View>
          </View>
        )}

        {/* Working hours */}
        {doctor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ساعات العمل</Text>
            <InfoRow label="من" value={doctor.workingHoursStart ?? "—"} />
            <InfoRow label="إلى" value={doctor.workingHoursEnd ?? "—"} />
            <InfoRow label="رسوم الكشف" value={doctor.consultationFee ? `${doctor.consultationFee.toLocaleString()} د.ع` : "—"} />
          </View>
        )}

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الحساب</Text>
          <MenuRow icon="🔔" label="الإشعارات" onPress={() => {}} />
          <MenuRow icon="💬" label="الدعم الفني" onPress={() => {}} />
          <MenuRow icon="📱" label="تغيير كلمة المرور" onPress={() => {}} />
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </Pressable>

        <Text style={styles.version}>طبيبي v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
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

function MenuRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }]} onPress={onPress}>
      <Text style={styles.menuArrow}>‹</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuIcon}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.bgRoot },
  title: { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1, textAlign: "right", marginBottom: Spacing.lg },

  profileCard: {
    backgroundColor: Colors.bgCard, borderRadius: 20,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  profileInfo:{ flex: 1, alignItems: "flex-end" },
  docName:    { fontSize: Typography.sizes.xl, fontWeight: "800", color: Colors.text1 },
  docSpec:    { fontSize: Typography.sizes.sm, color: Colors.indigo, marginTop: 2 },
  docAddr:    { fontSize: Typography.sizes.xs, color: Colors.text3, marginTop: 4, textAlign: "right" },

  section:      { backgroundColor: Colors.bgCard, borderRadius: 16, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: "800", color: Colors.text1, textAlign: "right", marginBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 },

  infoRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  infoLabel: { color: Colors.text3, fontSize: Typography.sizes.sm },
  infoValue: { color: Colors.text1, fontSize: Typography.sizes.sm, fontWeight: "700" },

  menuRow:  { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { fontSize: 22, marginLeft: 10 },
  menuLabel:{ flex: 1, textAlign: "right", fontSize: Typography.sizes.base, color: Colors.text1, fontWeight: "600" },
  menuArrow:{ color: Colors.text3, fontSize: 20 },

  logoutBtn:  { borderWidth: 1, borderColor: "rgba(239,68,68,0.5)", borderRadius: 12, padding: 16, alignItems: "center", marginTop: Spacing.md },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: Typography.sizes.base },
  version:    { textAlign: "center", color: Colors.text3, fontSize: Typography.sizes.xs, marginTop: Spacing.xl },
});

