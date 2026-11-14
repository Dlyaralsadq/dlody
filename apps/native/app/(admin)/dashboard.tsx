import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Typography, Spacing } from "@/theme";
import { useAuthStore } from "@/stores/auth";

export default function AdminDashboard() {
  const logout = useAuthStore((s) => s.logout);
  const user   = useAuthStore((s) => s.user);

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
    <LinearGradient colors={["#060912", "#0d1127"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
          <View style={styles.headerRow}>
            <Pressable onPress={handleLogout}>
              <Text style={styles.logoutLink}>خروج</Text>
            </Pressable>
            <Text style={styles.title}>لوحة الإدارة</Text>
          </View>

          <Text style={styles.welcome}>مرحباً، {user?.name}</Text>

          <View style={styles.grid}>
            <AdminCard icon="👨‍⚕️" label="إدارة الأطباء"   onPress={() => router.push("/(admin)/doctors")} />
            <AdminCard icon="👥"  label="إدارة المرضى"   onPress={() => router.push("/(admin)/patients")} />
            <AdminCard icon="🏷️"  label="التخصصات"       onPress={() => {}} />
            <AdminCard icon="📊"  label="الإحصائيات"     onPress={() => {}} />
            <AdminCard icon="💬"  label="الرسائل"        onPress={() => {}} />
            <AdminCard icon="⚙️"  label="الإعدادات"      onPress={() => {}} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function AdminCard({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  title:     { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1 },
  logoutLink:{ color: "#ef4444", fontWeight: "700", fontSize: Typography.sizes.sm },
  welcome:   { fontSize: Typography.sizes.base, color: Colors.text2, textAlign: "right", marginBottom: Spacing.xl },
  grid:      { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  card:      {
    width: "47%", backgroundColor: Colors.bgCard, borderRadius: 16,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", gap: Spacing.sm,
  },
  cardIcon:  { fontSize: 36 },
  cardLabel: { fontSize: Typography.sizes.sm, fontWeight: "700", color: Colors.text1, textAlign: "center" },
});
