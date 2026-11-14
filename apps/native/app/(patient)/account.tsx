/**
 * Patient Account Screen — full profile management
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, Pressable, Alert, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { useAuthStore, useUser } from "@/stores/auth";
import { getMyProfile, updateMyProfile } from "@/api/patient";
import { Avatar, Badge } from "@/components/ui";

export default function AccountScreen() {
  const authUser = useUser();
  const logout   = useAuthStore((s) => s.logout);
  const qc       = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn:  getMyProfile,
    enabled:  !!authUser,
    staleTime: 60_000,
  });

  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");

  function startEdit() {
    setName(profile?.name  ?? authUser?.name  ?? "");
    setPhone(profile?.phone ?? authUser?.phone ?? "");
    setEditing(true);
  }

  const { mutate: doUpdate, isPending: updating } = useMutation({
    mutationFn: () => updateMyProfile({ name: name.trim(), phone: phone.trim() }),
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      Alert.alert("تم", "تم تحديث الملف الشخصي بنجاح");
    },
    onError: (err: Error) => Alert.alert("خطأ", err.message),
  });

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

  if (!authUser) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.guestScreen}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestMsg}>يرجى تسجيل الدخول أولاً</Text>
          <Pressable
            style={styles.loginBtn}
            onPress={() => router.push("/(auth)/patient-login")}
          >
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const displayProfile = profile ?? authUser;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>حسابي</Text>
          </View>

          {/* Profile card */}
          <View style={styles.profileCard}>
            <Avatar uri={(displayProfile as any).avatarUrl} name={displayProfile.name} size={72} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayProfile.name}</Text>
              {authUser.email && (
                <Text style={styles.profileEmail}>{authUser.email}</Text>
              )}
              {displayProfile.phone && (
                <Text style={styles.profilePhone}>📱 {displayProfile.phone}</Text>
              )}
              <View style={{ marginTop: 6 }}>
                <Badge label="مريض" variant="default" />
              </View>
            </View>
          </View>

          {/* Edit profile section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>تعديل الملف الشخصي</Text>
              {!editing && (
                <Pressable onPress={startEdit}>
                  <Text style={styles.editLink}>تعديل</Text>
                </Pressable>
              )}
            </View>

            {isLoading ? (
              <ActivityIndicator color={Colors.indigo} />
            ) : editing ? (
              <View style={styles.editForm}>
                <Text style={styles.inputLabel}>الاسم</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="الاسم الكامل"
                  placeholderTextColor={Colors.text3}
                  textAlign="right"
                />
                <Text style={styles.inputLabel}>رقم الهاتف</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+964 7XX XXX XXXX"
                  placeholderTextColor={Colors.text3}
                  keyboardType="phone-pad"
                  textAlign="right"
                />
                <View style={styles.editBtns}>
                  <Pressable
                    style={[styles.saveBtn, updating && { opacity: 0.6 }]}
                    onPress={() => doUpdate()}
                    disabled={updating}
                  >
                    {updating
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
                    }
                  </Pressable>
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => setEditing(false)}
                  >
                    <Text style={styles.cancelBtnText}>إلغاء</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.profileDetails}>
                <InfoRow label="الاسم"    value={profile?.name   ?? authUser.name} />
                <InfoRow label="البريد"   value={profile?.email  ?? authUser.email ?? "—"} />
                <InfoRow label="الهاتف"   value={profile?.phone  ?? "—"} />
                {profile?.gender && (
                  <InfoRow label="الجنس" value={profile.gender === "male" ? "ذكر" : "أنثى"} />
                )}
                {profile?.bloodType && (
                  <InfoRow label="فصيلة الدم" value={profile.bloodType} />
                )}
              </View>
            )}
          </View>

          {/* Quick links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>روابط سريعة</Text>
            <View style={{ gap: 4 }}>
              <MenuRow icon="📅" label="مواعيدي"     onPress={() => router.push("/(patient)/appointments")} />
              <MenuRow icon="🔖" label="محفوظاتي"    onPress={() => router.push("/(patient)/saved")} />
              <MenuRow icon="🗺️" label="خريطة الأطباء" onPress={() => router.push("/(patient)/map")} />
              <MenuRow icon="💬" label="الدعم الفني" onPress={() => {}} />
            </View>
          </View>

          {/* Logout */}
          <View style={{ paddingHorizontal: Spacing.md }}>
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>🚪 تسجيل الخروج</Text>
            </Pressable>
          </View>

          <Text style={styles.version}>طبيبي v1.0.0 • Iraq Medical Platform</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value ?? "—"}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <Text style={styles.menuArrow}>‹</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuIcon}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgRoot },

  guestScreen: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.md,
    padding: Spacing.xl,
  },
  guestIcon: { fontSize: 56 },
  guestMsg:  { color: Colors.text2, fontSize: Typography.sizes.base },
  loginBtn:  { backgroundColor: Colors.indigo, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  loginBtnText: { color: "#fff", fontWeight: "700", fontSize: Typography.sizes.base },

  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  headerTitle: {
    fontSize:   Typography.sizes["2xl"],
    fontWeight: "900",
    color:      Colors.text1,
    textAlign:  "right",
  },

  profileCard: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: Colors.bgCard,
    borderRadius:    20,
    padding:         Spacing.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginHorizontal: Spacing.md,
    marginBottom:    Spacing.md,
    gap:             Spacing.md,
  },
  profileInfo:   { flex: 1, alignItems: "flex-end" },
  profileName:   { fontSize: Typography.sizes.xl, fontWeight: "800", color: Colors.text1 },
  profileEmail:  { fontSize: Typography.sizes.sm, color: Colors.text2, marginTop: 2 },
  profilePhone:  { fontSize: Typography.sizes.sm, color: Colors.text3, marginTop: 2 },

  section: {
    backgroundColor:  Colors.bgCard,
    borderRadius:     16,
    padding:          Spacing.md,
    borderWidth:      1,
    borderColor:      Colors.border,
    marginHorizontal: Spacing.md,
    marginBottom:     Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection:   "row",
    justifyContent:  "space-between",
    alignItems:      "center",
    marginBottom:    Spacing.sm,
  },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: "800", color: Colors.text1 },
  editLink:     { color: Colors.indigo, fontSize: Typography.sizes.sm, fontWeight: "600" },

  profileDetails: { gap: 8 },
  infoRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: Typography.sizes.sm, color: Colors.text3 },
  infoValue: { fontSize: Typography.sizes.sm, color: Colors.text1, fontWeight: "600" },

  editForm:   { gap: Spacing.sm },
  inputLabel: { fontSize: Typography.sizes.sm, color: Colors.text2, textAlign: "right" },
  input: {
    backgroundColor: Colors.bgSurface, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text1, fontSize: Typography.sizes.base,
  },
  editBtns: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  saveBtn: {
    flex: 1, backgroundColor: Colors.indigo, borderRadius: 10,
    paddingVertical: 12, alignItems: "center",
  },
  saveBtnText:   { color: "#fff", fontWeight: "700" },
  cancelBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  cancelBtnText: { color: Colors.text2, fontWeight: "600" },

  menuRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.bgSurface, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  menuIcon:  { fontSize: 20, marginLeft: Spacing.sm },
  menuLabel: { flex: 1, textAlign: "right", fontSize: Typography.sizes.base, color: Colors.text1, fontWeight: "600" },
  menuArrow: { color: Colors.text3, fontSize: 20 },

  logoutBtn: {
    borderWidth: 1, borderColor: "rgba(239,68,68,0.5)",
    borderRadius: 12, padding: 16, alignItems: "center",
    marginBottom: Spacing.sm,
  },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: Typography.sizes.base },
  version:    { textAlign: "center", color: Colors.text3, fontSize: Typography.sizes.xs, marginTop: Spacing.sm },
});
