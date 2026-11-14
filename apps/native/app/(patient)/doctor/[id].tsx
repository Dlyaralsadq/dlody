/**
 * Public doctor profile — viewed by patients
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Linking, Alert, Image, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Typography, Spacing } from "@/theme";
import { getDoctorPublic } from "@/api/patient";
import { Avatar, Badge } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-profile", id, selectedDate],
    queryFn:  () => getDoctorPublic(id!, selectedDate, user?.id),
    enabled:  !!id,
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  const { doctor, posts, rating, slots } = data;

  async function handleCall() {
    if (doctor.phone) await Linking.openURL(`tel:${doctor.phone}`);
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: Colors.bgRoot }} />

      <ScrollView style={styles.scroll}>
        {/* Header */}
        <LinearGradient colors={["#0d1127", Colors.bgRoot]} style={styles.hero}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>→ العودة</Text>
          </Pressable>

          <Avatar
            uri={doctor.logoUrl}
            name={doctor.nameAr}
            size={88}
            style={{ alignSelf: "center" }}
          />
          <Text style={styles.name}>{doctor.nameAr}</Text>
          {doctor.name && doctor.name !== doctor.nameAr && (
            <Text style={styles.nameEn}>{doctor.name}</Text>
          )}
          <Text style={styles.spec}>{doctor.specialty?.nameAr}</Text>

          {rating.count > 0 && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStars}>⭐ {rating.avg.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({rating.count})</Text>
            </View>
          )}
        </LinearGradient>

        {/* Quick actions */}
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={handleCall}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionLabel}>اتصال</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() =>
              router.push({ pathname: "/(patient)/book/[doctorId]", params: { doctorId: id! } })
            }
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={[styles.actionLabel, { color: "#fff" }]}>حجز موعد</Text>
          </Pressable>
        </View>

        {/* Info section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات العيادة</Text>
          {doctor.clinicAddress && (
            <InfoRow icon="📍" label={doctor.clinicAddress} />
          )}
          {doctor.workingHoursStart && (
            <InfoRow
              icon="🕐"
              label={`${doctor.workingHoursStart} - ${doctor.workingHoursEnd}`}
            />
          )}
          {doctor.consultationFee && doctor.showConsultationFee && (
            <InfoRow icon="💰" label={`${doctor.consultationFee.toLocaleString()} د.ع`} />
          )}
          {doctor.experienceYears && (
            <InfoRow icon="🎓" label={`${doctor.experienceYears} سنة خبرة`} />
          )}
        </View>

        {/* Bio */}
        {doctor.bioAr && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>نبذة</Text>
            <Text style={styles.bio}>{doctor.bioAr}</Text>
          </View>
        )}

        {/* Available slots */}
        {slots && slots.slots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المواعيد المتاحة اليوم</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {slots.slots
                .filter((s) => s.available)
                .slice(0, 10)
                .map((s) => (
                  <Pressable
                    key={s.time}
                    style={styles.slot}
                    onPress={() =>
                      router.push({
                        pathname: "/(patient)/book/[doctorId]",
                        params: { doctorId: id!, date: selectedDate, time: s.time },
                      })
                    }
                  >
                    <Text style={styles.slotText}>{s.time}</Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Posts */}
        {posts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>منشورات الطبيب</Text>
            {posts.slice(0, 3).map((post) => (
              <View key={post.id} style={styles.postCard}>
                <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>
                {post.imageUrl && (
                  <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bgRoot },
  loading: { flex: 1, backgroundColor: Colors.bgRoot, alignItems: "center", justifyContent: "center" },
  scroll:  { flex: 1 },

  hero:     { padding: Spacing.lg, paddingTop: Spacing.sm, alignItems: "center" },
  backBtn:  { alignSelf: "flex-end", marginBottom: Spacing.sm },
  backText: { color: Colors.indigo, fontSize: Typography.sizes.sm, fontWeight: "600" },
  name:     { fontSize: Typography.sizes.xl, fontWeight: "900", color: Colors.text1, marginTop: Spacing.sm, textAlign: "center" },
  nameEn:   { fontSize: Typography.sizes.sm, color: Colors.text2, textAlign: "center" },
  spec:     { fontSize: Typography.sizes.base, color: Colors.indigo, marginTop: 4, textAlign: "center" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  ratingStars: { fontSize: Typography.sizes.base, color: Colors.text1 },
  ratingCount: { fontSize: Typography.sizes.sm, color: Colors.text3 },

  actions: {
    flexDirection: "row", paddingHorizontal: Spacing.md,
    gap: Spacing.sm, marginTop: Spacing.sm, marginBottom: Spacing.md,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  actionBtnPrimary: { backgroundColor: Colors.indigo, borderColor: Colors.indigo },
  actionIcon: { fontSize: 18 },
  actionLabel: { color: Colors.text1, fontWeight: "700", fontSize: Typography.sizes.sm },

  section: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.lg,
    backgroundColor: Colors.bgCard, borderRadius: 16,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base, fontWeight: "800", color: Colors.text1,
    textAlign: "right", marginBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.sm,
  },

  infoRow:  { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: 8, justifyContent: "flex-end" },
  infoIcon: { fontSize: 16 },
  infoText: { flex: 1, color: Colors.text2, fontSize: Typography.sizes.sm, textAlign: "right" },

  bio: { color: Colors.text2, fontSize: Typography.sizes.sm, lineHeight: 24, textAlign: "right" },

  slot: {
    backgroundColor: Colors.bgSurface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    marginRight: 8, borderWidth: 1, borderColor: Colors.indigo,
  },
  slotText: { color: Colors.indigo, fontWeight: "700", fontSize: Typography.sizes.sm },

  postCard: {
    backgroundColor: Colors.bgSurface, borderRadius: 10, padding: Spacing.sm,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  postContent: { color: Colors.text2, fontSize: Typography.sizes.sm, lineHeight: 20, textAlign: "right" },
  postImage:   { width: "100%", height: 150, borderRadius: 8, marginTop: 8 },
});
