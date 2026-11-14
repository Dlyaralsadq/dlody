/**
 * Explore Screen — search doctors + posts, with post feed
 */
import { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  RefreshControl, ActivityIndicator, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Colors, Typography, Spacing } from "@/theme";
import { getExploreFeed, searchExplore, likePost, savePost, followDoctor } from "@/api/patient";
import { Avatar } from "@/components/ui";
import PostCard from "@/components/PostCard";
import type { DoctorPublic, FeedPost } from "@/api/patient";

// ── Doctor result card ────────────────────────────────────────────────────────
function DoctorResultCard({ doctor }: { doctor: DoctorPublic }) {
  return (
    <Pressable
      style={styles.doctorCard}
      onPress={() =>
        router.push({ pathname: "/(patient)/doctor/[id]", params: { id: doctor.id } })
      }
    >
      <Avatar uri={doctor.logoUrl} name={doctor.nameAr} size={48} />
      <View style={styles.doctorCardInfo}>
        <Text style={styles.doctorCardName}>{doctor.nameAr}</Text>
        <Text style={styles.doctorCardSpec}>{doctor.specialty?.nameAr}</Text>
        {doctor.clinicAddress && (
          <Text style={styles.doctorCardAddr} numberOfLines={1}>📍 {doctor.clinicAddress}</Text>
        )}
      </View>
      {doctor.ratingAverage > 0 && (
        <Text style={styles.doctorRating}>⭐ {doctor.ratingAverage.toFixed(1)}</Text>
      )}
    </Pressable>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const qc = useQueryClient();
  const [query,    setQuery]    = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  function handleSearch(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(text.trim()), 400);
  }

  // Regular explore feed
  const { data: exploreData, isLoading: feedLoading, refetch, isRefetching } = useQuery({
    queryKey: ["explore-feed"],
    queryFn:  () => getExploreFeed(),
    staleTime: 30_000,
    enabled:   !debouncedQ,
  });

  // Search results
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["explore-search", debouncedQ],
    queryFn:  () => searchExplore(debouncedQ),
    staleTime: 15_000,
    enabled:   !!debouncedQ,
  });

  const { mutate: doLike } = useMutation({
    mutationFn: (postId: string) => likePost(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["explore-feed"] }),
  });

  const { mutate: doSave } = useMutation({
    mutationFn: (postId: string) => savePost(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-posts"] }),
  });

  const { mutate: doFollow } = useMutation({
    mutationFn: (doctorId: string) => followDoctor(doctorId),
  });

  const handleDoctorPress = useCallback((doctorId: string) => {
    router.push({ pathname: "/(patient)/doctor/[id]", params: { id: doctorId } });
  }, []);

  const isSearching  = !!debouncedQ;
  const isLoading    = isSearching ? searchLoading : feedLoading;
  const feedPosts    = exploreData?.feed ?? [];
  const searchPosts  = searchData?.posts ?? [];
  const searchDoctors = searchData?.doctors ?? [];

  type ListItem =
    | { type: "doctorsSection" }
    | { type: "doctor"; data: DoctorPublic }
    | { type: "postsSection" }
    | { type: "post"; data: FeedPost }
    | { type: "empty"; msg: string };

  const listData: ListItem[] = isSearching
    ? [
        { type: "doctorsSection" },
        ...(searchDoctors.length > 0
          ? searchDoctors.map((d): ListItem => ({ type: "doctor", data: d }))
          : [{ type: "empty", msg: "لا يوجد أطباء مطابقون" } as ListItem]),
        { type: "postsSection" },
        ...(searchPosts.length > 0
          ? searchPosts.map((p): ListItem => ({ type: "post", data: p }))
          : [{ type: "empty", msg: "لا توجد منشورات مطابقة" } as ListItem]),
      ]
    : feedPosts.map((p): ListItem => ({ type: "post", data: p }));

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header + Search */}
      <View style={styles.header}>
        <Text style={styles.title}>استكشاف</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن طبيب أو منشور..."
            placeholderTextColor={Colors.text3}
            value={query}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {isLoading && <ActivityIndicator color={Colors.indigo} style={{ marginRight: 8 }} />}
        </View>
      </View>

      {/* Feed */}
      <FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item.type === "post"   ? item.data.id :
          item.type === "doctor" ? item.data.id :
          `${item.type}-${i}`
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          !isSearching ? (
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.indigo}
            />
          ) : undefined
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>لا توجد منشورات حتى الآن</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.type === "doctorsSection") {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>الأطباء</Text>
              </View>
            );
          }
          if (item.type === "postsSection") {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>المنشورات</Text>
              </View>
            );
          }
          if (item.type === "doctor") {
            return (
              <View style={styles.postWrapper}>
                <DoctorResultCard doctor={item.data} />
              </View>
            );
          }
          if (item.type === "empty") {
            return (
              <View style={styles.emptyItem}>
                <Text style={styles.emptyText}>{item.msg}</Text>
              </View>
            );
          }
          // post
          return (
            <View style={styles.postWrapper}>
              <PostCard
                post={item.data}
                onLike={doLike}
                onSave={doSave}
                onFollow={doFollow}
                onDoctorPress={handleDoctorPress}
                onComment={(id) =>
                  router.push({ pathname: "/(patient)/doctor/[id]", params: { id: item.data.doctor.id } })
                }
              />
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bgRoot },

  header: {
    paddingHorizontal: Spacing.md,
    paddingTop:        Spacing.sm,
    paddingBottom:     Spacing.sm,
  },
  title:  {
    fontSize:   Typography.sizes["2xl"],
    fontWeight: "900",
    color:      Colors.text1,
    textAlign:  "right",
    marginBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection:     "row",
    alignItems:        "center",
    backgroundColor:   Colors.bgSurface,
    borderRadius:      14,
    borderWidth:       1,
    borderColor:       Colors.border,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex:      1,
    height:    46,
    fontSize:  Typography.sizes.base,
    color:     Colors.text1,
    textAlign: "right",
  },

  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  sectionTitle: {
    fontSize:   Typography.sizes.base,
    fontWeight: "800",
    color:      Colors.text1,
    textAlign:  "right",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },

  postWrapper: { paddingHorizontal: Spacing.md },

  doctorCard: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: Colors.bgCard,
    borderRadius:    12,
    padding:         Spacing.sm,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             Spacing.sm,
    marginBottom:    Spacing.sm,
  },
  doctorCardInfo:   { flex: 1 },
  doctorCardName:   { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1, textAlign: "right" },
  doctorCardSpec:   { fontSize: Typography.sizes.xs, color: Colors.indigo, textAlign: "right" },
  doctorCardAddr:   { fontSize: Typography.sizes.xs, color: Colors.text3, textAlign: "right", marginTop: 2 },
  doctorRating:     { fontSize: Typography.sizes.sm, color: Colors.text2 },

  empty:     { padding: Spacing.xl, alignItems: "center" },
  emptyText: { color: Colors.text3, fontSize: Typography.sizes.base },
  emptyItem: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, alignItems: "center" },
});
