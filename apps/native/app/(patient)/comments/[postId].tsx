import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  ActivityIndicator, KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { addComment, getPostComments } from "@/api/patient";
import { Avatar } from "@/components/ui";

function timeAgo(isoDate: string): string {
  if (!isoDate) return "";
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `منذ ${hrs} ساعة`;
  return `منذ ${Math.floor(hrs / 24)} يوم`;
}

const MAX_LENGTH = 500;

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
  const charsLeft = MAX_LENGTH - text.length;

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={80}
      >
        {/* Header: title on LEFT, back on RIGHT (RTL) */}
        <View style={styles.header}>
          <Text style={styles.title}>التعليقات</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.back}>رجوع ›</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.indigo} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: Spacing.md, gap: 10 }}
            ListEmptyComponent={
              <View style={{ paddingTop: 60, alignItems: "center" }}>
                <Text style={styles.empty}>لا توجد تعليقات بعد. كن أول من يعلّق!</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardMeta}>
                    <Text style={styles.name}>{item.patient?.name || item.author?.name || "مستخدم"}</Text>
                    {item.createdAt && (
                      <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                    )}
                  </View>
                  <Avatar
                    uri={item.patient?.avatarUrl || item.author?.avatarUrl}
                    name={item.patient?.name || item.author?.name || "م"}
                    size={34}
                  />
                </View>
                <Text style={styles.body}>{item.content}</Text>
              </View>
            )}
          />
        )}

        <View style={styles.composer}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="اكتب تعليقاً..."
              placeholderTextColor={Colors.text3}
              textAlign="right"
              maxLength={MAX_LENGTH}
              multiline
            />
            <Text style={[styles.charCounter, charsLeft < 50 && styles.charCounterWarn]}>
              {charsLeft}
            </Text>
          </View>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title:   { color: Colors.text1, fontSize: Typography.sizes.lg, fontWeight: "800" },
  backBtn: { padding: 4 },
  back:    { color: Colors.indigoLight, fontWeight: "700", fontSize: Typography.sizes.base },
  empty:   { color: Colors.text3, textAlign: "center" },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 6,
  },
  cardMeta: { alignItems: "flex-end" },
  name:    { color: Colors.text1, fontWeight: "700" },
  time:    { color: Colors.text3, fontSize: Typography.sizes.xs, marginTop: 2 },
  body:    { color: Colors.text2, textAlign: "right", lineHeight: 22 },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: "flex-end",
  },
  inputWrap: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    color: Colors.text1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    fontSize: Typography.sizes.base,
    minHeight: 46,
    maxHeight: 120,
  },
  charCounter: {
    color: Colors.text3,
    fontSize: 10,
    textAlign: "right",
    paddingRight: 8,
    paddingBottom: 4,
  },
  charCounterWarn: { color: Colors.rose },
  send: {
    backgroundColor: Colors.indigo,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontWeight: "700" },
});
