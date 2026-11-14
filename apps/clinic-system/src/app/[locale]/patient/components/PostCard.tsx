"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import {
  Heart,
  MessageCircle,
  Bookmark,
  UserPlus,
  UserCheck,
  Pencil,
  Trash2,
  Send,
  MoreHorizontal,
} from "lucide-react";
import type { FeedPost } from "@/app/actions/patientSocial";
import {
  toggleLikePost,
  toggleSavePost,
  toggleFollowDoctor,
  addComment,
  updateComment,
  deleteComment,
} from "@/app/actions/patientSocial";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import PostMedia from "@/components/ui/PostMedia";

interface PostCardProps {
  post: FeedPost;
  locale: string;
  patientId: string;
  showFollowButton?: boolean;
  isFollowingDoctor?: boolean;
}

export default function PostCard({
  post: initial,
  locale,
  patientId,
  showFollowButton,
  isFollowingDoctor: initialFollowing,
}: PostCardProps) {
  const ar = locale === "ar";
  const router = useRouter();
  const [post, setPost] = useState(initial);
  const [following, setFollowing] = useState(
    initialFollowing ?? initial.isFollowingDoctor ?? false
  );
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const doctorName = ar ? post.doctor.nameAr : post.doctor.name;
  const specialty = ar ? post.doctor.specialty.nameAr : post.doctor.specialty.name;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ar ? arLocale : enUS,
  });

  async function handleLike() {
    setBusy("like");
    const r = await toggleLikePost(post.id);
    if (r.success) {
      setPost((p) => ({ ...p, isLiked: r.liked, likeCount: r.likeCount }));
    }
    setBusy(null);
  }

  async function handleSave() {
    setBusy("save");
    const r = await toggleSavePost(post.id);
    if (r.success) setPost((p) => ({ ...p, isSaved: r.saved }));
    setBusy(null);
  }

  async function handleFollow() {
    setBusy("follow");
    const r = await toggleFollowDoctor(post.doctor.id);
    if (r.success) setFollowing(r.following);
    setBusy(null);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setBusy("comment");
    const text = commentText.trim();
    const r = await addComment(post.id, text);
    if (r.success) {
      setPost((p) => ({
        ...p,
        commentCount: p.commentCount + 1,
        comments: [
          ...p.comments,
          {
            id: `temp-${Date.now()}`,
            content: text,
            createdAt: new Date(),
            patientId,
            patientName: ar ? "أنت" : "You",
          },
        ],
      }));
      setCommentText("");
      router.refresh();
    }
    setBusy(null);
  }

  async function handleUpdateComment(commentId: string) {
    const text = editText.trim();
    if (!text) return;
    setBusy(`edit-${commentId}`);
    const r = await updateComment(commentId, text);
    if (r.success) {
      setPost((p) => ({
        ...p,
        comments: p.comments.map((c) => (c.id === commentId ? { ...c, content: text } : c)),
      }));
      setEditingId(null);
      router.refresh();
    }
    setBusy(null);
  }

  async function handleDeleteComment(commentId: string) {
    setOpenMenuId(null);
    if (!confirm(ar ? "حذف هذا التعليق؟" : "Delete this comment?")) return;
    setBusy(`del-${commentId}`);
    const r = await deleteComment(commentId);
    if (r.success) {
      setPost((p) => ({
        ...p,
        commentCount: Math.max(0, p.commentCount - 1),
        comments: p.comments.filter((c) => c.id !== commentId),
      }));
      router.refresh();
    }
    setBusy(null);
  }

  return (
    <article style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="group overflow-hidden" style={{ background: "var(--bg-card)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <Link href={`/${locale}/patient/doctor/${post.doctor.id}`} className="shrink-0">
            <DoctorAvatar
              logoUrl={post.doctor.logoUrl}
              specialtyId={post.doctor.specialtyId}
              size="md"
              round
              hasStory={post.doctor.hasActiveStory}
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/${locale}/patient/doctor/${post.doctor.id}`}
              className="text-[15px] font-semibold hover:text-indigo-400 transition truncate block leading-tight"
              style={{ color: "var(--text-1)" }}
            >
              {doctorName}
            </Link>
            <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--text-3)" }}>{specialty}</p>
          </div>
          {showFollowButton !== false && !following && (
            <button
              onClick={handleFollow}
              disabled={busy === "follow"}
              className="shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition"
              style={{ border: "1px solid var(--border-hover)", color: "var(--indigo-l)", background: "rgba(99,102,241,.08)" }}
            >
              <UserPlus size={12} />
              {ar ? "متابعة" : "Follow"}
            </button>
          )}
          {following && showFollowButton !== false && (
            <span className="shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <UserCheck size={11} />
              {ar ? "متابَع" : "Following"}
            </span>
          )}
        </div>

        {(post.imageUrl || post.videoUrl) && (
          <div className="relative px-0">
            <PostMedia
              imageUrl={post.imageUrl}
              videoUrl={post.videoUrl}
              mediaType={post.mediaType}
              locale={locale}
              className="w-full aspect-[4/5] max-h-[560px] object-cover bg-black/20"
            />
          </div>
        )}

        {/* Content */}
        {post.content && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[14.5px] leading-[1.7] whitespace-pre-wrap" style={{ color: "var(--text-1)" }}>{post.content}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-3 py-1 mt-1">
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleLike}
              disabled={busy === "like"}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition active:scale-90 ${
                post.isLiked ? "text-rose-400" : "hover:text-rose-400"
              }`}
              style={post.isLiked ? undefined : { color: "var(--text-3)" }}
            >
              <Heart size={18} className={post.isLiked ? "fill-current" : ""} strokeWidth={post.isLiked ? 0 : 1.8} />
              {post.likeCount > 0 && <span>{post.likeCount}</span>}
            </button>
            <button
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition active:scale-90 hover:text-sky-400"
              style={{ color: "var(--text-3)" }}
            >
              <MessageCircle size={18} strokeWidth={1.8} />
              {post.commentCount > 0 && <span>{post.commentCount}</span>}
            </button>
            <button
              onClick={handleSave}
              disabled={busy === "save"}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition active:scale-90 ${
                post.isSaved ? "text-amber-400" : "hover:text-amber-400"
              }`}
              style={post.isSaved ? undefined : { color: "var(--text-3)" }}
            >
              <Bookmark size={18} className={post.isSaved ? "fill-current" : ""} strokeWidth={post.isSaved ? 0 : 1.8} />
            </button>
          </div>
          <span className="text-[11px] pe-2 font-medium" style={{ color: "var(--text-3)" }}>{timeAgo}</span>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="px-4 py-3 space-y-2.5" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-input)" }}>
            {post.comments.length === 0 ? (
              <p className="text-xs text-center py-2" style={{ color: "var(--text-3)" }}>
                {ar ? "لا تعليقات بعد" : "No comments yet"}
              </p>
            ) : (
              post.comments.map((c) => {
                const isOwn = c.patientId === patientId;
                return (
                  <div key={c.id} className="relative rounded-xl px-3 py-2.5" style={{ background: "var(--bg-hover)" }}>
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>{c.patientName}</span>
                      {isOwn && editingId !== c.id && (
                        <button
                          type="button"
                          onClick={() => setOpenMenuId((id) => (id === c.id ? null : c.id))}
                          className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white/10"
                          style={{ color: "var(--text-3)" }}
                          aria-label={ar ? "خيارات" : "Options"}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      )}
                    </div>
                    {editingId === c.id ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="form-input flex-1 text-xs py-1.5"
                        />
                        <button
                          onClick={() => handleUpdateComment(c.id)}
                          disabled={busy === `edit-${c.id}`}
                          className="text-xs font-semibold text-indigo-400 px-2"
                        >
                          {ar ? "حفظ" : "Save"}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>{c.content}</p>
                    )}

                    {openMenuId === c.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div
                          className="absolute end-2 top-7 z-20 w-32 overflow-hidden rounded-xl shadow-xl"
                          style={{ border: "1px solid var(--border)", background: "var(--bg-card-raised)" }}
                        >
                          <button
                            type="button"
                            onClick={() => { setEditingId(c.id); setEditText(c.content); setOpenMenuId(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-white/5"
                            style={{ color: "var(--text-2)" }}
                          >
                            <Pencil size={12} />
                            {ar ? "تعديل" : "Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            disabled={busy === `del-${c.id}`}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 size={12} />
                            {ar ? "حذف" : "Delete"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}

            <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={ar ? "أضف تعليقاً..." : "Add a comment..."}
                className="form-input flex-1 text-sm py-2"
              />
              <button
                type="submit"
                disabled={busy === "comment" || !commentText.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
