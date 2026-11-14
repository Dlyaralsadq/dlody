import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Typography, Spacing } from "@/theme";
import { useAuthStore, useUser } from "@/stores/auth";
import { Avatar } from "@/components/ui";

export default function AccountScreen() {
  const user    = useUser();
  const logout  = useAuthStore((s) => s.logout);

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

  if (!user) {
    return (
      <LinearGradient colors={["#060912", "#0d1127"]} style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.guestMsg}>يرجى تسجيل الدخول أولاً</Text>
          <Pressable style={styles.loginBtn} onPress={() => router.push("/(auth)/patient-login")}>
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </Pressable>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#060912", "#0d1127"]} style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
          {/* Profile header */}
          <View style={styles.profileCard}>
            <Avatar uri={user.avatarUrl} name={user.name} size={72} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
              {user.phone && <Text style={styles.phone}>📱 {user.phone}</Text>}
            </View>
          </View>

          {/* Menu items */}
          <View style={styles.menu}>
            <MenuRow icon="📅" label="مواعيدي" onPress={() => router.push("/(patient)/appointments")} />
            <MenuRow icon="🔔" label="الإشعارات" onPress={() => {}} />
            <MenuRow icon="⚙️" label="الإعدادات" onPress={() => {}} />
            <MenuRow icon="💬" label="الدعم الفني" onPress={() => {}} />
          </View>

          {/* Logout */}
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
          </Pressable>

          {/* Version */}
          <Text style={styles.version}>طبيبي v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
  root: { flex: 1 },
  safe: { flex: 1, padding: Spacing.lg, alignItems: "center", justifyContent: "center" },
  guestMsg:    { color: Colors.text2, fontSize: Typography.sizes.base, marginBottom: Spacing.lg },
  loginBtn:    { backgroundColor: Colors.indigo, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  loginBtnText:{ color: "#fff", fontWeight: "700", fontSize: Typography.sizes.base },

  profileCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 20, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.xl, gap: Spacing.md,
  },
  profileInfo: { flex: 1, alignItems: "flex-end" },
  name:   { fontSize: Typography.sizes.xl, fontWeight: "800", color: Colors.text1 },
  email:  { fontSize: Typography.sizes.sm, color: Colors.text2, marginTop: 2 },
  phone:  { fontSize: Typography.sizes.sm, color: Colors.text3, marginTop: 2 },

  menu:    { gap: 2, marginBottom: Spacing.xl },
  menuRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 12, paddingHorizontal: Spacing.md, paddingVertical: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 4,
  },
  menuIcon:  { fontSize: 22, marginLeft: Spacing.sm },
  menuLabel: { flex: 1, textAlign: "right", fontSize: Typography.sizes.base, color: Colors.text1, fontWeight: "600" },
  menuArrow: { color: Colors.text3, fontSize: 20 },

  logoutBtn:  {
    borderWidth: 1, borderColor: "rgba(239,68,68,0.5)",
    borderRadius: 12, padding: 16, alignItems: "center",
  },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: Typography.sizes.base },
  version:    { textAlign: "center", color: Colors.text3, fontSize: Typography.sizes.xs, marginTop: Spacing.xl },
});

