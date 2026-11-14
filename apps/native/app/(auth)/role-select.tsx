import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing } from "@/theme";

export default function RoleSelectScreen() {
  return (
    <LinearGradient colors={["#060912", "#0d1127"]} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <LinearGradient
            colors={[Colors.indigo, Colors.violet]}
            style={styles.logoGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoText}>ط</Text>
          </LinearGradient>
          <Text style={styles.brandAr}>طبيبي</Text>
          <Text style={styles.brandEn}>Tabibee</Text>
          <Text style={styles.tagline}>منصة صحية متكاملة</Text>
        </View>

        {/* Role cards */}
        <View style={styles.cards}>
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push("/(auth)/patient-login")}
          >
            <LinearGradient
              colors={["#1a2440", "#111827"]}
              style={styles.cardGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.cardEmoji}>🏥</Text>
              <Text style={styles.cardTitle}>مريض</Text>
              <Text style={styles.cardSub}>ابحث عن طبيب، احجز موعد</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push("/(auth)/login")}
          >
            <LinearGradient
              colors={["#1a2440", "#111827"]}
              style={styles.cardGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.cardEmoji}>👨‍⚕️</Text>
              <Text style={styles.cardTitle}>طبيب</Text>
              <Text style={styles.cardSub}>إدارة عيادتك وجدولك</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Register link */}
        <View style={styles.registerWrap}>
          <Text style={styles.registerText}>مريض جديد؟ </Text>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.registerLink}>سجّل الآن</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.lg, justifyContent: "center" },

  logoWrap: { alignItems: "center", marginBottom: Spacing.xl * 2 },
  logoGrad: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    marginBottom: Spacing.sm,
    shadowColor: Colors.indigo, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  logoText:  { fontSize: 40, color: "#fff", fontWeight: "900" },
  brandAr:   { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1, writingDirection: "rtl" },
  brandEn:   { fontSize: Typography.sizes.base, color: Colors.text2, fontWeight: "600", letterSpacing: 2 },
  tagline:   { fontSize: Typography.sizes.sm, color: Colors.text3, marginTop: 4, writingDirection: "rtl" },

  cards: { gap: Spacing.md },
  card: { borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  cardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  cardGrad: { padding: Spacing.lg, flexDirection: "row", alignItems: "center", gap: Spacing.md },
  cardEmoji: { fontSize: 36 },
  cardTitle: { fontSize: Typography.sizes.xl, fontWeight: "800", color: Colors.text1 },
  cardSub:   { fontSize: Typography.sizes.sm, color: Colors.text2 },

  registerWrap: {
    flexDirection: "row", justifyContent: "center",
    marginTop: Spacing.xl, alignItems: "center",
  },
  registerText: { color: Colors.text2, fontSize: Typography.sizes.base },
  registerLink: { color: Colors.indigo, fontSize: Typography.sizes.base, fontWeight: "700" },
});
