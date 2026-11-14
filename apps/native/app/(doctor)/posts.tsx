import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, Alert, RefreshControl, Modal, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { getDoctorPosts, createPost, deletePost } from "@/api/doctor";
import { Button } from "@/components/ui";

export default function DoctorPostsScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["doctor-posts"],
    queryFn:  getDoctorPosts,
    staleTime: 60_000,
  });

  const { mutate: removePost } = useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["doctor-posts"] }),
    onError:    () => Alert.alert("خطأ", "فشل حذف المنشور"),
  });

  const posts = data?.posts ?? [];

  function confirmDelete(id: string) {
    Alert.alert("حذف المنشور", "هل أنت متأكد؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => removePost(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>منشوراتي</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.addBtnText}>+ منشور جديد</Text>
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.indigo} />
        }
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>
              {isLoading ? "جارٍ التحميل..." : "لا توجد منشورات بعد"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleDateString("ar-IQ")}
              </Text>
              <Pressable onPress={() => confirmDelete(item.id)}>
                <Text style={styles.deleteBtn}>🗑️</Text>
              </Pressable>
            </View>
            <Text style={styles.content} numberOfLines={4}>{item.content}</Text>
            {item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.statsRow}>
              <Text style={styles.stat}>❤️ {item.likeCount}</Text>
              <Text style={styles.stat}>💬 {item.commentCount}</Text>
            </View>
          </View>
        )}
      />

      <CreatePostModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false);
          qc.invalidateQueries({ queryKey: ["doctor-posts"] });
        }}
      />
    </SafeAreaView>
  );
}

function CreatePostModal({
  visible, onClose, onSuccess,
}: {
  visible: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [content,  setContent]  = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () => createPost({ content, imageUrl: imageUrl.trim() || undefined }),
    onSuccess:  onSuccess,
    onError:    () => Alert.alert("خطأ", "فشل نشر المنشور"),
  });

  function handle() {
    if (!content.trim()) {
      Alert.alert("خطأ", "يرجى كتابة المحتوى");
      return;
    }
    mutate();
  }

  function handleClose() {
    setContent("");
    setImageUrl("");
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <SafeAreaView style={styles.modal} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={handleClose}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
            <Text style={styles.modalTitle}>منشور جديد</Text>
            <View style={{ width: 40 }} />
          </View>

          <TextInput
            style={styles.textArea}
            placeholder="اكتب منشورك الطبي هنا..."
            placeholderTextColor={Colors.text3}
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
            textAlign="right"
          />

          {/* Image URL input */}
          <View style={styles.imageUrlRow}>
            <TextInput
              style={styles.imageUrlInput}
              placeholder="رابط الصورة (اختياري)..."
              placeholderTextColor={Colors.text3}
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              textAlign="right"
            />
            <Text style={styles.imageUrlIcon}>🖼️</Text>
          </View>

          <View style={styles.modalFooter}>
            <Text style={styles.charCount}>{content.length} حرف</Text>
            <Button label={isPending ? "جارٍ النشر..." : "نشر"} onPress={handle} style={{ flex: 1 }} />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bgRoot },
  header: {
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: Spacing.sm,
  },
  title:     { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1 },
  addBtn:    { backgroundColor: Colors.indigo, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText:{ color: "#fff", fontWeight: "700", fontSize: Typography.sizes.sm },

  empty:      { padding: 48, alignItems: "center" },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { color: Colors.text3, marginTop: 12, fontSize: Typography.sizes.base },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  cardTop:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  time:      { color: Colors.text3, fontSize: Typography.sizes.xs },
  deleteBtn: { fontSize: 18 },
  content:   { color: Colors.text1, fontSize: Typography.sizes.sm, lineHeight: 22, textAlign: "right" },
  statsRow:  { flexDirection: "row", gap: Spacing.md, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  stat:      { color: Colors.text3, fontSize: Typography.sizes.sm },

  postImage: { width: "100%", height: 180, borderRadius: 10, marginTop: Spacing.sm },

  modal:       { flex: 1, backgroundColor: Colors.bgRoot },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: Typography.sizes.base, fontWeight: "800", color: Colors.text1 },
  modalClose: { color: Colors.text2, fontSize: 20, padding: 4 },
  textArea:   {
    flex: 1, margin: Spacing.md,
    fontSize: Typography.sizes.base, color: Colors.text1, lineHeight: 26,
    textAlignVertical: "top",
  },
  imageUrlRow: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
  },
  imageUrlInput: {
    flex: 1, height: 44,
    fontSize: Typography.sizes.sm, color: Colors.text1,
  },
  imageUrlIcon: { fontSize: 18, marginLeft: 4 },
  modalFooter: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  charCount: { color: Colors.text3, fontSize: Typography.sizes.xs, minWidth: 60 },
});

