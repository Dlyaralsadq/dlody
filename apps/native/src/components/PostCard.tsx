/**
 * Shared PostCard component — used in explore, feed, saved, and doctor profile screens
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import { Colors, Typography, Spacing } from "@/theme";
import { Avatar } from "@/components/ui";
import type { FeedPost } from "@/api/patient";
import { mediaUrl } from "@/api/client";

export type PostCardProps = {
  post: FeedPost;
  onLike?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onFollow?: (doctorId: string) => void;
  onComment?: (postId: string) => void;
  onDoctorPress?: (doctorId: string) => void;
  showFollowButton?: boolean;
};

export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "الآن";
  if (mins < 60) return `${mins} د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} س`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days} ي`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} أ`;
  return `${Math.floor(days / 30)} ش`;
}

export default function PostCard({
  post,
  onLike,
  onSave,
  onFollow,
  onComment,
  onDoctorPress,
  showFollowButton = true,
}: PostCardProps) {
  const [expanded, setExpanded]       = useState(false);
  const [imgFailed, setImgFailed]     = useState(false);
  const [localLiked, setLocalLiked]   = useState(post.isLiked);
  const [localSaved, setLocalSaved]   = useState(post.isSaved);
  const [likeCount,  setLikeCount]    = useState(post.likeCount ?? 0);

  const isLong = post.content.length > 200;

  function handleLike() {
    setLocalLiked((v) => !v);
    setLikeCount((c) => (localLiked ? c - 1 : c + 1));
    onLike?.(post.id);
  }

  function handleSave() {
    setLocalSaved((v) => !v);
    onSave?.(post.id);
  }

  return (
    <View style={styles.card}>
      {/* Doctor header row */}
      <View style={styles.headerRow}>
        <Pressable
          style={styles.doctorInfo}
          onPress={() => onDoctorPress?.(post.doctor?.id)}
        >
          <Avatar uri={post.doctor?.logoUrl} name={post.doctor?.nameAr ?? ""} size={42} />
          <View style={styles.doctorText}>
            <Text style={styles.doctorName}>{post.doctor?.nameAr}</Text>
            <Text style={styles.doctorSpec}>{post.doctor?.specialty?.nameAr}</Text>
          </View>
        </Pressable>

        <View style={styles.headerRight}>
          <Text style={styles.timeText}>{timeAgo(post.createdAt)}</Text>
          {showFollowButton && onFollow && (
            <Pressable
              style={styles.followBtn}
              onPress={() => onFollow(post.doctor?.id)}
            >
              <Text style={styles.followBtnText}>متابعة</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      <Text
        style={styles.content}
        numberOfLines={expanded || !isLong ? undefined : 4}
      >
        {post.content}
      </Text>
      {isLong && (
        <Pressable onPress={() => setExpanded((v) => !v)}>
          <Text style={styles.expandText}>
            {expanded ? "عرض أقل" : "عرض المزيد"}
          </Text>
        </Pressable>
      )}

      {/* Image */}
      {post.imageUrl && !imgFailed && mediaUrl(post.imageUrl) && (
        <Image
          source={{ uri: mediaUrl(post.imageUrl)! }}
          style={styles.postImage}
          resizeMode="cover"
          onError={() => setImgFailed(true)}
        />
      )}

      {/* Action row */}
      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={handleLike}>
          <Text style={[styles.actionIcon, localLiked && styles.actionIconActive]}>
            {localLiked ? "❤️" : "🤍"}
          </Text>
          <Text style={[styles.actionCount, localLiked && { color: Colors.rose }]}>
            {likeCount}
          </Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={() => onComment?.(post.id)}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.commentCount ?? 0}</Text>
        </Pressable>

        <Pressable style={[styles.actionBtn, { marginLeft: "auto" }]} onPress={handleSave}>
          <Text style={[styles.actionIcon, localSaved && styles.actionIconActive]}>
            {localSaved ? "🔖" : "🔖"}
          </Text>
          <Text style={[styles.actionCount, localSaved && { color: Colors.indigo }]}>
            {localSaved ? "محفوظ" : "حفظ"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius:    16,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginBottom:    Spacing.sm,
  },

  headerRow: {
    flexDirection:  "row",
    alignItems:     "center",
    marginBottom:   Spacing.sm,
    gap:            Spacing.sm,
  },
  doctorInfo: {
    flex:           1,
    flexDirection:  "row",
    alignItems:     "center",
    gap:            Spacing.sm,
  },
  doctorText: { flex: 1 },
  doctorName: {
    fontSize:   Typography.sizes.base,
    fontWeight: "700",
    color:      Colors.text1,
    textAlign:  "right",
  },
  doctorSpec: {
    fontSize:  Typography.sizes.xs,
    color:     Colors.indigo,
    textAlign: "right",
  },
  headerRight: {
    alignItems: "flex-end",
    gap:        4,
  },
  timeText: {
    fontSize: Typography.sizes.xs,
    color:    Colors.text3,
  },
  followBtn: {
    backgroundColor: "rgba(99,102,241,0.12)",
    borderRadius:    8,
    paddingHorizontal: 10,
    paddingVertical:  4,
    borderWidth:      1,
    borderColor:      "rgba(99,102,241,0.25)",
  },
  followBtnText: {
    fontSize:   Typography.sizes.xs,
    color:      Colors.indigoLight,
    fontWeight: "600",
  },

  content: {
    fontSize:   Typography.sizes.sm,
    color:      Colors.text2,
    lineHeight: 22,
    textAlign:  "right",
    marginBottom: 4,
  },
  expandText: {
    fontSize:    Typography.sizes.xs,
    color:       Colors.indigo,
    fontWeight:  "600",
    textAlign:   "right",
    marginBottom: Spacing.sm,
  },

  postImage: {
    width:        "100%",
    height:       200,
    borderRadius: 10,
    marginTop:    Spacing.sm,
    marginBottom: Spacing.sm,
  },

  actions: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             Spacing.md,
    marginTop:       Spacing.sm,
    paddingTop:      Spacing.sm,
    borderTopWidth:  1,
    borderTopColor:  Colors.border,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           4,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionIconActive: {
    // tint handled per emoji
  },
  actionCount: {
    fontSize:  Typography.sizes.sm,
    color:     Colors.text3,
    fontWeight: "600",
  },
});
