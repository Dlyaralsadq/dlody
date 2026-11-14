import { useState } from "react";
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Pressable, Alert,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input, Button } from "@/components/ui";
import { Colors, Typography, Spacing } from "@/theme";
import { loginPatient } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";

export default function PatientLoginScreen() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const setAuth = useAuthStore((s) => s.login);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("خطأ", "يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const result = await loginPatient(email.trim(), password);
      await setAuth(result.token, result.user);
      router.replace("/(patient)/map");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ في تسجيل الدخول";
      Alert.alert("فشل تسجيل الدخول", translateError(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#060912", "#0d1127"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => router.back()} style={styles.back}>
              <Text style={styles.backText}>→ العودة</Text>
            </Pressable>

            <View style={styles.header}>
              <Text style={styles.icon}>🏥</Text>
              <Text style={styles.title}>تسجيل دخول المريض</Text>
              <Text style={styles.subtitle}>ابحث عن طبيبك بسهولة</Text>
            </View>

            <View style={styles.form}>
              <Input
                label="البريد الإلكتروني"
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Input
                label="كلمة المرور"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Button
                label="تسجيل الدخول"
                variant="patient"
                onPress={handleLogin}
                loading={loading}
                style={{ marginTop: Spacing.md }}
              />

              <View style={styles.registerRow}>
                <Text style={styles.registerText}>ليس لديك حساب؟ </Text>
                <Pressable onPress={() => router.push("/(auth)/register")}>
                  <Text style={styles.registerLink}>سجّل الآن</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function translateError(e: string): string {
  if (e.includes("invalid_credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
  if (e.includes("suspended"))           return "هذا الحساب موقوف";
  return e;
}

const styles = StyleSheet.create({
  scroll:       { flexGrow: 1, padding: Spacing.lg },
  back:         { marginBottom: Spacing.lg },
  backText:     { color: Colors.indigoLight, fontSize: Typography.sizes.base, fontWeight: "600" },
  header:       { alignItems: "center", marginBottom: Spacing.xl },
  icon:         { fontSize: 56, marginBottom: Spacing.sm },
  title:        { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1 },
  subtitle:     { fontSize: Typography.sizes.base, color: Colors.text2, marginTop: 4 },
  form:         { gap: Spacing.md },
  registerRow:  { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: Spacing.sm },
  registerText: { color: Colors.text2, fontSize: Typography.sizes.base },
  registerLink: { color: Colors.indigoLight, fontSize: Typography.sizes.base, fontWeight: "700" },
});

