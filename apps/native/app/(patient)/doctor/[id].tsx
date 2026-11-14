/**
 * Public Doctor Profile — Patient view — with two tabs: Posts & Clinic Info
 */
import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Linking, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Typography, Spacing } from "@/theme";
import { getDoctorPublic, followDoctor, rateDoctor, likePost, savePost } from "@/api/patient";
import { Avatar, Badge } from "@/components/ui";
import PostCard from "@/components/PostCard";
import { useAuthStore } from "@/stores/auth";

type Tab = "posts" | "info";

function buildClinicMapHtml(lat: number, lng: number, nameAr: string): string {
  return `
<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>* { margin:0; padding:0; box-sizing:border-box; } html,body,#map { width:100%; height:100%; }</style>
</head><body><div id="map"></div>
<script>
var map = L.map('map',{zoomControl:false,attributionControl:false}).setView([${lat},${lng}],15);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:18,subdomains:'abcd'}).addTo(map);
var icon = L.divIcon({className:'',html:'<div style="width:14px;height:14px;border-radius:50%;background:#6366f1;border:2px solid #fff;box-shadow:0 0 8px rgba(99,102,241,0.9);"></div>',iconSize:[14,14],iconAnchor:[7,7]});
L.marker([${lat},${lng}],{icon:icon}).bindPopup('<b style="direction:rtl">${nameAr.replace(/'/g, "\\'")}</b>').addTo(map).openPopup();
</script></body></html>`;
}

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user    = useAuthStore((s) => s.user);
  const qc      = useQueryClient();
  const [tab,          setTab]         = useState<Tab>("posts");
  const [ratingScore,  setRatingScore] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-profile", id],
    queryFn:  () => getDoctorPublic(id!),
    enabled:  !!id,
    staleTime: 60_000,
  });

  const { mutate: doFollow, isPending: followPending } = useMutation({
    mutationFn: () => followDoctor(id!),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["doctor-profile", id] }),
  });

  const { mutate: doRate, isPending: ratePending } = useMutation({
    mutationFn: (score: number) => rateDoctor(id!, score),
    onSuccess:  () => {
      setRatingSubmitted(true);
      qc.invalidateQueries({ queryKey: ["doctor-profile", id] });
    },
  });

  const { mutate: doLike } = useMutation({
    mutationFn: (postId: string) => likePost(postId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["doctor-profile", id] }),
  });

  const { mutate: doSave } = useMutation({
    mutationFn: (postId: string) => savePost(postId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["saved-posts"] }),
  });

  const handleDoctorPress = useCallback(() => {}, []);

  if (isLoading || !data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  const { doctor, posts, rating } = data;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: Colors.bgSurface }} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero header */}
        <LinearGradient colors={["#0d1127", Colors.bgRoot]} style={styles.hero}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← العودة</Text>
          </Pressable>

          {/* Announcement banner */}
          {doctor.announcement && (
            <View style={styles.announcementBanner}>
              <Text style={styles.announcementText}>📢 {doctor.announcement}</Text>
            </View>
          )}

          <Avatar uri={doctor.logoUrl} name={doctor.nameAr} size={80} style={{ alignSelf: "center" }} />
          <Text style={styles.name}>{doctor.nameAr}</Text>
          <Text style={styles.spec}>{doctor.specialty?.nameAr}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatBubble label="منشور" value={posts.length} />
            <StatBubble label="متابع" value={doctor.followerCount} />
            <StatBubble label="تقييم" value={rating.avg > 0 ? rating.avg.toFixed(1) : "—"} icon="⭐" />
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.followBtn, doctor.isFollowing && styles.followBtnActive]}
              onPress={() => doFollow()}
              disabled={followPending}
            >
              <Text style={[styles.followBtnText, doctor.isFollowing && styles.followBtnTextActive]}>
                {doctor.isFollowing ? "✓ تتابعه" : "+ متابعة"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.bookBtn}
              onPress={() =>
                router.push({ pathname: "/(patient)/book/[doctorId]", params: { doctorId: id! } })
              }
            >
              <Text style={styles.bookBtnText}>📅 احجز موعد</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tabBtn, tab === "posts" && styles.tabBtnActive]}
            onPress={() => setTab("posts")}
          >
            <Text style={[styles.tabText, tab === "posts" && styles.tabTextActive]}>المنشورات</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, tab === "info" && styles.tabBtnActive]}
            onPress={() => setTab("info")}
          >
            <Text style={[styles.tabText, tab === "info" && styles.tabTextActive]}>معلومات العيادة</Text>
          </Pressable>
        </View>

        {/* TAB 1: Posts */}
        {tab === "posts" && (
          <View style={styles.tabContent}>
            {posts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>لا توجد منشورات بعد</Text>
              </View>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={doLike}
                  onSave={doSave}
                  showFollowButton={false}
                  onDoctorPress={handleDoctorPress}
                />
              ))
            )}

            {/* Rating section */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingSectionTitle}>قيّم هذا الطبيب</Text>
              {rating.count > 0 && (
                <Text style={styles.ratingCurrent}>
                  المعدل الحالي: ⭐ {rating.avg.toFixed(1)} ({rating.count} تقييم)
                </Text>
              )}
              {!ratingSubmitted ? (
                <>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable key={star} onPress={() => setRatingScore(star)}>
                        <Text style={[styles.star, ratingScore >= star && styles.starFilled]}>
                          ★
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable
                    style={[styles.rateSubmitBtn, (!ratingScore || ratePending) && { opacity: 0.5 }]}
                    onPress={() => ratingScore && doRate(ratingScore)}
                    disabled={!ratingScore || ratePending}
                  >
                    <Text style={styles.rateSubmitText}>
                      {ratePending ? "جارٍ الإرسال..." : "إرسال التقييم"}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.ratingThanks}>✓ شكراً على تقييمك!</Text>
              )}
            </View>
          </View>
        )}

        {/* TAB 2: Clinic Info */}
        {tab === "info" && (
          <View style={styles.tabContent}>
            {/* Bio */}
            {(doctor.bioAr || doctor.bio) && (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>نبذة</Text>
                <Text style={styles.infoCardText}>{doctor.bioAr ?? doctor.bio}</Text>
              </View>
            )}

            {/* Services */}
            {doctor.services && (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>الخدمات</Text>
                {doctor.services.split("\n").filter(Boolean).map((s, i) => (
                  <Text key={i} style={styles.serviceItem}>• {s.trim()}</Text>
                ))}
              </View>
            )}

            {/* Working hours & days */}
            {(doctor.workingHoursStart || doctor.workingDays) && (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>أوقات العمل</Text>
                {doctor.workingHoursStart && (
                  <InfoRow icon="🕐" text={`${doctor.workingHoursStart} – ${doctor.workingHoursEnd ?? ""}`} />
                )}
                {doctor.workingDays && (
                  <InfoRow icon="📅" text={doctor.workingDays} />
                )}
              </View>
            )}

            {/* Consultation fee */}
            {doctor.consultationFee && doctor.showConsultationFee && (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>أتعاب الكشف</Text>
                <InfoRow icon="💰" text={`${doctor.consultationFee.toLocaleString()} د.ع`} />
              </View>
            )}

            {/* Contact */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>التواصل</Text>
              {doctor.clinicAddress && (
                <InfoRow icon="📍" text={doctor.clinicAddress} />
              )}
              {doctor.phone && (
                <Pressable onPress={() => Linking.openURL(`tel:${doctor.phone}`)}>
                  <InfoRow icon="📞" text={doctor.phone} pressable />
                </Pressable>
              )}
            </View>

            {/* Mini map */}
            {doctor.clinicLat && doctor.clinicLng && (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>موقع العيادة</Text>
                <View style={styles.miniMapContainer}>
                  <WebView
                    source={{
                      html: buildClinicMapHtml(doctor.clinicLat, doctor.clinicLng, doctor.nameAr),
                      baseUrl: "https://tabibee.com",
                    }}
                    style={styles.miniMap}
                    javaScriptEnabled
                    domStorageEnabled
                    mixedContentMode="always"
                    originWhitelist={["*"]}
                    scrollEnabled={false}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function StatBubble({ label, value, icon }: { label: string; value: number | string; icon?: string }) {
  return (
    <View style={styles.statBubble}>
      <Text style={styles.statValue}>{icon ? `${icon} ` : ""}{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, text, pressable }: { icon: string; text: string; pressable?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoRowIcon}>{icon}</Text>
      <Text style={[styles.infoRowText, pressable && { color: Colors.indigo }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bgRoot },
  loading: { flex: 1, backgroundColor: Colors.bgRoot, alignItems: "center", justifyContent: "center" },
  scroll:  { flex: 1 },

  // Hero
  hero:     { padding: Spacing.md, paddingTop: Spacing.sm },
  backBtn:  { marginBottom: Spacing.sm },
  backText: { color: Colors.indigo, fontSize: Typography.sizes.sm, fontWeight: "600" },

  announcementBanner: {
    backgroundColor: "rgba(245,158,11,0.15)",
    borderWidth:     1,
    borderColor:     "rgba(245,158,11,0.4)",
    borderRadius:    10,
    padding:         Spacing.sm,
    marginBottom:    Spacing.sm,
  },
  announcementText: { color: Colors.amber, fontSize: Typography.sizes.sm, textAlign: "right" },

  name: {
    fontSize: Typography.sizes.xl, fontWeight: "900",
    color: Colors.text1, textAlign: "center", marginTop: Spacing.sm,
  },
  spec: { fontSize: Typography.sizes.base, color: Colors.indigo, textAlign: "center", marginBottom: Spacing.sm },

  statsRow: {
    flexDirection: "row", justifyContent: "center",
    gap: Spacing.xl, marginVertical: Spacing.sm,
  },
  statBubble: { alignItems: "center" },
  statValue:  { fontSize: Typography.sizes.base, fontWeight: "800", color: Colors.text1 },
  statLabel:  { fontSize: Typography.sizes.xs, color: Colors.text3 },

  actionRow: {
    flexDirection: "row", gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  followBtn: {
    flex:            1,
    paddingVertical: 12,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     Colors.border,
    backgroundColor: Colors.bgCard,
    alignItems:      "center",
  },
  followBtnActive:    { backgroundColor: "rgba(99,102,241,0.15)", borderColor: Colors.indigo },
  followBtnText:      { color: Colors.text2, fontWeight: "700", fontSize: Typography.sizes.sm },
  followBtnTextActive:{ color: Colors.indigoLight },
  bookBtn: {
    flex:            1,
    paddingVertical: 12,
    borderRadius:    12,
    backgroundColor: Colors.indigo,
    alignItems:      "center",
  },
  bookBtnText: { color: "#fff", fontWeight: "700", fontSize: Typography.sizes.sm },

  // Tabs
  tabs: {
    flexDirection:   "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor:   Colors.bgSurface,
  },
  tabBtn: {
    flex:            1,
    paddingVertical: 14,
    alignItems:      "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive:  { borderBottomColor: Colors.indigo },
  tabText:       { fontSize: Typography.sizes.sm, fontWeight: "600", color: Colors.text3 },
  tabTextActive: { color: Colors.indigo },

  tabContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  emptyBox:  { padding: Spacing.xl, alignItems: "center" },
  emptyText: { color: Colors.text3, fontSize: Typography.sizes.base },

  // Rating
  ratingSection: {
    backgroundColor: Colors.bgCard,
    borderRadius:    16,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginBottom:    Spacing.md,
    alignItems:      "center",
    gap:             Spacing.sm,
  },
  ratingSectionTitle: { fontSize: Typography.sizes.base, fontWeight: "800", color: Colors.text1 },
  ratingCurrent:      { fontSize: Typography.sizes.sm, color: Colors.text2 },
  starsRow:           { flexDirection: "row", gap: 8 },
  star:               { fontSize: 36, color: Colors.text3 },
  starFilled:         { color: Colors.amber },
  rateSubmitBtn: {
    backgroundColor: Colors.indigo, borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  rateSubmitText: { color: "#fff", fontWeight: "700" },
  ratingThanks:   { color: Colors.success, fontWeight: "700" },

  // Info cards
  infoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius:    16,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginBottom:    Spacing.md,
  },
  infoCardTitle: {
    fontSize:         Typography.sizes.base,
    fontWeight:       "800",
    color:            Colors.text1,
    textAlign:        "right",
    marginBottom:     Spacing.sm,
    paddingBottom:    Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoCardText: {
    fontSize:  Typography.sizes.sm,
    color:     Colors.text2,
    lineHeight: 22,
    textAlign: "right",
  },
  serviceItem: {
    fontSize:  Typography.sizes.sm,
    color:     Colors.text2,
    textAlign: "right",
    marginBottom: 4,
    lineHeight:   20,
  },
  infoRow: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            Spacing.sm,
    marginBottom:   8,
    justifyContent: "flex-end",
  },
  infoRowIcon: { fontSize: 16 },
  infoRowText: { fontSize: Typography.sizes.sm, color: Colors.text2, flex: 1, textAlign: "right" },

  miniMapContainer: {
    height:         200,
    borderRadius:   10,
    overflow:       "hidden",
    marginTop:      Spacing.sm,
    borderWidth:    1,
    borderColor:    Colors.border,
  },
  miniMap: { flex: 1 },
});
