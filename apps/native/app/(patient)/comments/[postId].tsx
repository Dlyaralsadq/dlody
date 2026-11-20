import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { addComment, getPostComments } from "@/api/patient";

export default function CommentsScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getPostComments(postId!),
    enabled: !!postId,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => addComment(postId!, text.trim()),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const comments = data?.comments ?? [];

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>رجوع</Text>
          </Pressable>
          <Text style={styles.title}>التعليقات</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.indigo} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: Spacing.md, gap: 10 }}
            ListEmptyComponent={<Text style={styles.empty}>لا توجد تعليقات بعد</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>{item.patient?.name || item.author?.name || "مستخدم"}</Text>
                <Text style={styles.body}>{item.content}</Text>
              </View>
            )}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="اكتب تعليقاً..."
            placeholderTextColor={Colors.text3}
            textAlign="right"
          />
          <Pressable
            style={[styles.send, (!text.trim() || isPending) && { opacity: 0.5 }]}
            disabled={!text.trim() || isPending}
            onPress={() => mutate()}
          >
            <Text style={styles.sendText}>إرسال</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgRoot },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  back: { color: Colors.indigoLight, fontWeight: "700" },
  title: { color: Colors.text1, fontSize: Typography.sizes.lg, fontWeight: "800" },
  empty: { color: Colors.text3, textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  name: { color: Colors.text1, fontWeight: "700", textAlign: "right" },
  body: { color: Colors.text2, marginTop: 4, textAlign: "right", lineHeight: 22 },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text1,
    paddingHorizontal: 12,
    height: 46,
  },
  send: {
    backgroundColor: Colors.indigo,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontWeight: "700" },
});
