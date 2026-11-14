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
import { registerPatient } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";

export default function RegisterScreen() {
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [phone,     setPhone]     = useState("");
  const [loading,   setLoading]   = useState(false);

  const setAuth = useAuthStore((s) => s.login);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("خطأ", "يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (password.length < 6) {
      Alert.alert("خطأ", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (password !== password2) {
      Alert.alert("خطأ", "كلمتا المرور غير متطابقتين");
      return;
    }
    setLoading(true);
    try {
      const result = await registerPatient({
        name:     name.trim(),
        email:    email.trim().toLowerCase(),
        password,
        phone:    phone.trim() || undefined,
      });
      await setAuth(result.token, result.user);
      router.replace("/(patient)/map");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ في التسجيل";
      Alert.alert("فشل التسجيل", translateError(msg));
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
              <Text style={styles.icon}>✨</Text>
              <Text style={styles.title}>إنشاء حساب جديد</Text>
              <Text style={styles.subtitle}>انضم إلى مجتمع طبيبي</Text>
            </View>

            <View style={styles.form}>
              <Input label="الاسم الكامل *" placeholder="محمد علي" value={name} onChangeText={setName} />
              <Input
                label="البريد الإلكتروني *"
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Input label="رقم الهاتف (اختياري)" placeholder="+964..." value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Input label="كلمة المرور *" placeholder="6 أحرف على الأقل" value={password} onChangeText={setPassword} secureTextEntry />
              <Input label="تأكيد كلمة المرور *" placeholder="••••••••" value={password2} onChangeText={setPassword2} secureTextEntry />

              <Button
                label="إنشاء الحساب"
                variant="patient"
                onPress={handleRegister}
                loading={loading}
                style={{ marginTop: Spacing.md }}
              />

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>لديك حساب بالفعل؟ </Text>
                <Pressable onPress={() => router.replace("/(auth)/patient-login")}>
                  <Text style={styles.loginLink}>سجّل الدخول</Text>
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
  if (e.includes("email_taken"))       return "البريد الإلكتروني مستخدم بالفعل";
  if (e.includes("password_too_short")) return "كلمة المرور قصيرة جداً (6 أحرف على الأقل)";
  return e;
}

const styles = StyleSheet.create({
  scroll:   { flexGrow: 1, padding: Spacing.lg },
  back:     { marginBottom: Spacing.lg },
  backText: { color: Colors.indigoLight, fontSize: Typography.sizes.base, fontWeight: "600" },
  header:   { alignItems: "center", marginBottom: Spacing.xl },
  icon:     { fontSize: 56, marginBottom: Spacing.sm },
  title:    { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1 },
  subtitle: { fontSize: Typography.sizes.base, color: Colors.text2, marginTop: 4 },
  form:     { gap: Spacing.md },
  loginRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: Spacing.sm },
  loginText:{ color: Colors.text2, fontSize: Typography.sizes.base },
  loginLink:{ color: Colors.indigoLight, fontSize: Typography.sizes.base, fontWeight: "700" },
});

