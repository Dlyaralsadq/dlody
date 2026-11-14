import { useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Image, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Colors, Typography, Spacing } from "@/theme";
import { getExploreFeed } from "@/api/patient";
import { useAuthStore } from "@/stores/auth";
import { Avatar } from "@/components/ui";

export default function ExploreScreen() {
  const user = useAuthStore((s) => s.user);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["explore-feed", user?.id],
    queryFn:  () => getExploreFeed(user!.id),
    enabled:  !!user?.id,
    staleTime: 30_000,
  });

  const posts = data?.feed ?? [];

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>جارٍ التحميل...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>استكشاف</Text>
        <Text style={styles.headerSub}>آخر منشورات الأطباء</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.indigo}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>لا توجد منشورات حتى الآن</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({ pathname: "/(patient)/doctor/[id]", params: { id: item.doctor?.id } })
            }
          >
            {/* Doctor info */}
            <View style={styles.docRow}>
              <Avatar
                uri={item.doctor?.logoUrl}
                name={item.doctor?.nameAr ?? ""}
                size={40}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.docName}>{item.doctor?.nameAr}</Text>
                <Text style={styles.docSpec}>{item.doctor?.specialty?.nameAr}</Text>
              </View>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>

            {/* Content */}
            <Text style={styles.content} numberOfLines={4}>{item.content}</Text>

            {/* Image */}
            {item.imageUrl && !failedImages.has(item.id) && (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.postImage}
                resizeMode="cover"
                onError={() => setFailedImages((prev) => new Set([...prev, item.id]))}
              />
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Text style={styles.actionText}>❤️ {item.likeCount ?? 0}</Text>
              <Text style={styles.actionText}>💬 {item.commentCount ?? 0}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}س`;
  return `${Math.floor(hrs / 24)}ي`;
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.bgRoot },
  loading:     { flex: 1, backgroundColor: Colors.bgRoot, alignItems: "center", justifyContent: "center" },
  loadingText: { color: Colors.text2 },
  header:      { padding: Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1, textAlign: "right" },
  headerSub:   { fontSize: Typography.sizes.sm, color: Colors.text3, textAlign: "right" },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius:    16,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  docRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm },
  docName: { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1, textAlign: "right" },
  docSpec: { fontSize: Typography.sizes.xs, color: Colors.indigo },
  time:    { fontSize: Typography.sizes.xs, color: Colors.text3 },
  content: { fontSize: Typography.sizes.sm, color: Colors.text2, lineHeight: 22, textAlign: "right" },
  postImage: { width: "100%", height: 200, borderRadius: 10, marginTop: Spacing.sm },
  actions: {
    flexDirection: "row", gap: Spacing.md,
    marginTop: Spacing.sm, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  actionText: { color: Colors.text3, fontSize: Typography.sizes.sm },

  empty:     { padding: Spacing.xl, alignItems: "center" },
  emptyText: { color: Colors.text3, fontSize: Typography.sizes.base },
});

