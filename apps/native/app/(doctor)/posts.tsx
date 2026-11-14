/**
 * Doctor Posts Screen — manage posts with FAB to create
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable, Image,
  RefreshControl, Alert, Modal, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { getPosts, createPost, deletePost } from "@/api/doctor";
import type { Post } from "@/api/doctor";

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} س`;
  return `${Math.floor(hrs / 24)} ي`;
}

function CreatePostModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [content,  setContent]  = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [preview,  setPreview]  = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createPost({
        content:  content.trim(),
        imageUrl: imageUrl.trim() || undefined,
      }),
    onSuccess: () => {
      setContent(""); setImageUrl(""); setPreview(false);
      onCreated();
      onClose();
    },
    onError: (err: Error) => Alert.alert("خطأ", err.message),
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ width: "100%" }}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>منشور جديد</Text>
              <Pressable onPress={onClose}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.contentInput}
              placeholder="اكتب منشورك هنا..."
              placeholderTextColor={Colors.text3}
              value={content}
              onChangeText={setContent}
              multiline
              textAlign="right"
              textAlignVertical="top"
            />

            <TextInput
              style={styles.urlInput}
              placeholder="رابط الصورة (اختياري)"
              placeholderTextColor={Colors.text3}
              value={imageUrl}
              onChangeText={(t) => { setImageUrl(t); setPreview(false); }}
              textAlign="right"
              returnKeyType="done"
            />

            {imageUrl.trim() !== "" && (
              <View>
                {preview ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.previewImage}
                    resizeMode="cover"
                    onError={() => { setPreview(false); Alert.alert("خطأ", "لا يمكن تحميل الصورة"); }}
                  />
                ) : (
                  <Pressable style={styles.previewBtn} onPress={() => setPreview(true)}>
                    <Text style={styles.previewBtnText}>معاينة الصورة</Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.modalBtns}>
              <Pressable
                style={[styles.publishBtn, (isPending || !content.trim()) && { opacity: 0.5 }]}
                onPress={() => mutate()}
                disabled={isPending || !content.trim()}
              >
                {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishBtnText}>نشر</Text>}
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function PostItem({ post, onDelete }: { post: Post; onDelete: (id: string) => void }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <View style={styles.postCard}>
      {/* Post meta */}
      <View style={styles.postMeta}>
        <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
        <View style={styles.postStats}>
          <Text style={styles.postStat}>❤️ {post.likeCount}</Text>
          <Text style={styles.postStat}>💬 {post.commentCount}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.postContent} numberOfLines={4}>{post.content}</Text>

      {/* Image */}
      {post.imageUrl && !imgFailed && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
          onError={() => setImgFailed(true)}
        />
      )}

      {/* Actions */}
      <Pressable
        style={styles.deleteBtn}
        onPress={() => {
          Alert.alert("حذف المنشور", "هل تريد حذف هذا المنشور؟", [
            { text: "إلغاء", style: "cancel" },
            { text: "حذف", style: "destructive", onPress: () => onDelete(post.id) },
          ]);
        }}
      >
        <Text style={styles.deleteBtnText}>🗑️ حذف</Text>
      </Pressable>
    </View>
  );
}

export default function DoctorPostsScreen() {
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);

  const { data: posts = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["doctor-posts"],
    queryFn:  getPosts,
    staleTime: 30_000,
  });

  const { mutate: doDelete } = useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor-posts"] }),
    onError: (err: Error) => Alert.alert("خطأ", err.message),
  });

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>منشوراتي</Text>
        <Text style={styles.subtitle}>{posts.length} منشور</Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.indigo} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.indigo} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>لا توجد منشورات بعد</Text>
              <Text style={styles.emptyDesc}>شارك أفكارك ومعلوماتك الطبية مع مرضاك</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PostItem post={item} onDelete={doDelete} />
          )}
        />
      )}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setCreateModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <CreatePostModal
        visible={createModal}
        onClose={() => setCreateModal(false)}
        onCreated={() => qc.invalidateQueries({ queryKey: ["doctor-posts"] })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bgRoot },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },

  header:   { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 4 },
  title:    { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1, textAlign: "right" },
  subtitle: { fontSize: Typography.sizes.sm, color: Colors.text3, textAlign: "right" },

  emptyBox:  { paddingVertical: 60, alignItems: "center", gap: Spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle:{ fontSize: Typography.sizes.lg, fontWeight: "700", color: Colors.text1 },
  emptyDesc: { fontSize: Typography.sizes.sm, color: Colors.text3, textAlign: "center", maxWidth: 260 },

  postCard: {
    backgroundColor: Colors.bgCard,
    borderRadius:    16,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginBottom:    Spacing.sm,
  },
  postMeta: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   Spacing.sm,
  },
  postTime:    { fontSize: Typography.sizes.xs, color: Colors.text3 },
  postStats:   { flexDirection: "row", gap: Spacing.sm },
  postStat:    { fontSize: Typography.sizes.sm, color: Colors.text2 },
  postContent: { fontSize: Typography.sizes.sm, color: Colors.text1, lineHeight: 22, textAlign: "right", marginBottom: Spacing.sm },
  postImage: {
    width: "100%", height: 180, borderRadius: 10, marginBottom: Spacing.sm,
  },
  deleteBtn: {
    alignSelf:        "flex-end",
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderRadius:      8,
    borderWidth:       1,
    borderColor:       "rgba(244,63,94,0.3)",
  },
  deleteBtnText: { color: Colors.rose, fontSize: Typography.sizes.xs, fontWeight: "600" },

  // FAB
  fab: {
    position:         "absolute",
    bottom:           24,
    right:            24,
    width:            56,
    height:           56,
    borderRadius:     28,
    backgroundColor:  Colors.indigo,
    alignItems:       "center",
    justifyContent:   "center",
    elevation:        8,
    shadowColor:      Colors.indigo,
    shadowOffset:     { width: 0, height: 4 },
    shadowOpacity:    0.5,
    shadowRadius:     12,
  },
  fabText: { color: "#fff", fontSize: 32, lineHeight: 36, fontWeight: "300" },

  // Modal
  modalOverlay: {
    flex:            1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent:  "flex-end",
    alignItems:      "stretch",
  },
  modalBox: {
    backgroundColor:    Colors.bgCard,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    padding:              Spacing.lg,
    gap:                  Spacing.sm,
  },
  modalHeader: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   Spacing.sm,
  },
  modalTitle: { fontSize: Typography.sizes.lg, fontWeight: "800", color: Colors.text1 },
  modalClose: { color: Colors.text3, fontSize: 20, padding: 4 },

  contentInput: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    12,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    color:           Colors.text1,
    fontSize:        Typography.sizes.base,
    minHeight:       120,
  },
  urlInput: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    10,
    padding:         12,
    borderWidth:     1,
    borderColor:     Colors.border,
    color:           Colors.text1,
    fontSize:        Typography.sizes.sm,
  },
  previewBtn: {
    backgroundColor: "rgba(99,102,241,0.12)", borderRadius: 8,
    paddingVertical: 8, alignItems: "center", borderWidth: 1, borderColor: Colors.border,
  },
  previewBtnText: { color: Colors.indigo, fontWeight: "600", fontSize: Typography.sizes.sm },
  previewImage: { width: "100%", height: 160, borderRadius: 10 },

  modalBtns: { flexDirection: "row", gap: Spacing.sm },
  publishBtn: {
    flex: 1, backgroundColor: Colors.indigo, borderRadius: 10,
    paddingVertical: 12, alignItems: "center",
  },
  publishBtnText: { color: "#fff", fontWeight: "700" },
  cancelBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 12,
    alignItems: "center", borderWidth: 1, borderColor: Colors.border,
  },
  cancelBtnText: { color: Colors.text2 },
});
