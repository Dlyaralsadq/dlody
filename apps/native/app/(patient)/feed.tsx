/**
 * Home Feed Screen — shows stories + posts from followed doctors + suggestions
 */
import { useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  Pressable, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Colors, Typography, Spacing } from "@/theme";
import {
  getHomeFeed, getStories,
  likePost, savePost, followDoctor,
} from "@/api/patient";
import { Avatar } from "@/components/ui";
import PostCard from "@/components/PostCard";
import type { FeedPost, StoryGroup } from "@/api/patient";

// ── Stories strip ─────────────────────────────────────────────────────────────
function StoriesStrip({ stories }: { stories: StoryGroup[] }) {
  if (!stories.length) return null;
  return (
    <View style={styles.storiesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesScroll}
      >
        {stories.map((group) => (
          <Pressable
            key={group.doctorId}
            style={styles.storyItem}
            onPress={() =>
              router.push({ pathname: "/(patient)/doctor/[id]", params: { id: group.doctorId } })
            }
          >
            <View style={styles.storyRing}>
              <Avatar uri={group.doctor.logoUrl} name={group.doctor.nameAr} size={52} />
            </View>
            <Text style={styles.storyName} numberOfLines={1}>
              {group.doctor.nameAr}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function FeedScreen() {
  const qc = useQueryClient();

  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed, isRefetching } = useQuery({
    queryKey: ["home-feed"],
    queryFn:  getHomeFeed,
    staleTime: 30_000,
  });

  const { data: storiesData } = useQuery({
    queryKey: ["stories"],
    queryFn:  getStories,
    staleTime: 60_000,
  });

  const { mutate: doLike } = useMutation({
    mutationFn: (postId: string) => likePost(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-feed"] }),
  });

  const { mutate: doSave } = useMutation({
    mutationFn: (postId: string) => savePost(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-feed"] }),
  });

  const { mutate: doFollow } = useMutation({
    mutationFn: (doctorId: string) => followDoctor(doctorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-feed"] }),
  });

  const handleDoctorPress = useCallback((doctorId: string) => {
    router.push({ pathname: "/(patient)/doctor/[id]", params: { id: doctorId } });
  }, []);

  const following  = feedData?.following  ?? [];
  const suggested  = feedData?.suggested  ?? [];
  const stories    = storiesData?.stories ?? [];

  type ListItem =
    | { type: "stories" }
    | { type: "section"; title: string }
    | { type: "post"; data: FeedPost }
    | { type: "empty"; msg: string };

  const listData: ListItem[] = [
    { type: "stories" },
    { type: "section", title: "منشورات المتابَعين" },
    ...(following.length > 0
      ? following.map((p): ListItem => ({ type: "post", data: p }))
      : [{ type: "empty", msg: "تابع بعض الأطباء لرؤية منشوراتهم" } as ListItem]),
    { type: "section", title: "مقترح لك" },
    ...(suggested.length > 0
      ? suggested.map((p): ListItem => ({ type: "post", data: p }))
      : [{ type: "empty", msg: "لا توجد مقترحات حالياً" } as ListItem]),
  ];

  if (feedLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={Colors.indigo} size="large" />
        <Text style={styles.loadingText}>جارٍ التحميل...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>الرئيسية</Text>
        <Text style={styles.pageSub}>طبيبي</Text>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item.type === "post" ? item.data.id : `${item.type}-${i}`
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchFeed}
            tintColor={Colors.indigo}
          />
        }
        renderItem={({ item }) => {
          if (item.type === "stories") {
            return <StoriesStrip stories={stories} />;
          }
          if (item.type === "section") {
            return <SectionHeader title={item.title} />;
          }
          if (item.type === "empty") {
            return (
              <View style={styles.emptyItem}>
                <Text style={styles.emptyText}>{item.msg}</Text>
              </View>
            );
          }
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
  root:          { flex: 1, backgroundColor: Colors.bgRoot },
  loadingScreen: { flex: 1, backgroundColor: Colors.bgRoot, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:   { color: Colors.text2 },

  pageHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop:        Spacing.sm,
    paddingBottom:     Spacing.sm,
    flexDirection:     "row",
    alignItems:        "baseline",
    justifyContent:    "space-between",
  },
  pageTitle: { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1 },
  pageSub:   { fontSize: Typography.sizes.sm, color: Colors.indigo, fontWeight: "700" },

  // Stories
  storiesContainer: {
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  storiesScroll:   { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.md },
  storyItem:       { alignItems: "center", width: 68 },
  storyRing: {
    borderRadius: 32,
    borderWidth:  2.5,
    borderColor:  Colors.indigo,
    padding:      2,
    marginBottom: 4,
  },
  storyName: {
    fontSize:  Typography.sizes.xs,
    color:     Colors.text2,
    textAlign: "center",
    width:     68,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  sectionTitle: {
    fontSize:   Typography.sizes.base,
    fontWeight: "800",
    color:      Colors.text1,
    textAlign:  "right",
  },

  postWrapper: { paddingHorizontal: Spacing.md },

  emptyItem: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg, alignItems: "center" },
  emptyText: { color: Colors.text3, fontSize: Typography.sizes.sm, textAlign: "center" },
});
