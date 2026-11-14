/**
 * Saved Posts Screen — patient's bookmarked posts
 */
import { useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Colors, Typography, Spacing } from "@/theme";
import { getSavedPosts, savePost, likePost, followDoctor } from "@/api/patient";
import PostCard from "@/components/PostCard";

export default function SavedScreen() {
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["saved-posts"],
    queryFn:  getSavedPosts,
    staleTime: 30_000,
  });

  const { mutate: doSave } = useMutation({
    mutationFn: (postId: string) => savePost(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-posts"] }),
  });

  const { mutate: doLike } = useMutation({
    mutationFn: (postId: string) => likePost(postId),
  });

  const { mutate: doFollow } = useMutation({
    mutationFn: (doctorId: string) => followDoctor(doctorId),
  });

  const handleDoctorPress = useCallback((doctorId: string) => {
    router.push({ pathname: "/(patient)/doctor/[id]", params: { id: doctorId } });
  }, []);

  const posts = data?.posts ?? [];

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.indigo} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>محفوظاتي</Text>
        <Text style={styles.headerSub}>{posts.length} منشور محفوظ</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          { paddingHorizontal: Spacing.md, paddingBottom: 20 },
          posts.length === 0 && styles.emptyContainer,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.indigo}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyTitle}>لا توجد منشورات محفوظة</Text>
            <Text style={styles.emptyDesc}>
              احفظ منشورات الأطباء لتجدها هنا لاحقاً
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={doLike}
            onSave={doSave}
            onFollow={doFollow}
            onDoctorPress={handleDoctorPress}
            onComment={(id) =>
              router.push({ pathname: "/(patient)/doctor/[id]", params: { id: item.doctor.id } })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bgRoot },
  loading: { flex: 1, backgroundColor: Colors.bgRoot, alignItems: "center", justifyContent: "center" },

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
  headerSub: {
    fontSize:  Typography.sizes.sm,
    color:     Colors.text3,
    textAlign: "right",
  },

  emptyContainer: { flex: 1, justifyContent: "center" },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 60,
    gap: Spacing.sm,
  },
  emptyIcon:  { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: Typography.sizes.lg, fontWeight: "700", color: Colors.text1 },
  emptyDesc:  { fontSize: Typography.sizes.sm, color: Colors.text3, textAlign: "center", maxWidth: 260 },
});
