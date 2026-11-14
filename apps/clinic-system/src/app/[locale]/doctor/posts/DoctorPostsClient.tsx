"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, Check, Camera, Film, Loader2, Star, Settings } from "lucide-react";
import {
  createDoctorPost,
  updateDoctorPost,
  deleteDoctorPost,
  uploadDoctorPostMedia,
} from "@/app/actions/doctorPosts";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import PostMedia from "@/components/ui/PostMedia";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import { DoctorRatingBadge } from "@/components/ui/DoctorRatingDisplay";
import type { DoctorRatingStats } from "@/app/actions/doctorRatings";
import MediaEditor from "@/components/media/MediaEditor";

interface PostRow {
  id: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  mediaType: string | null;
  createdAt: Date | string;
  _count: { likes: number; comments: number; savedBy: number };
}

type DoctorProfile = {
  name: string;
  nameAr: string;
  bio: string | null;
  bioAr: string | null;
  logoUrl: string | null;
  specialtyId: string;
  specialtyAr: string;
  specialtyEn: string;
  experienceYears: number | null;
};

type MediaState = {
  imageUrl: string;
  videoUrl: string;
  mediaType: "image" | "video" | null;
  previewName: string;
};

const emptyMedia = (): MediaState => ({
  imageUrl: "",
  videoUrl: "",
  mediaType: null,
  previewName: "",
});

export interface DoctorPostsClientHandle {
  openNewPost: () => void;
}

const DoctorPostsClient = forwardRef<
  DoctorPostsClientHandle,
  {
    locale: string;
    posts: PostRow[];
    doctor: DoctorProfile;
    followerCount: number;
    ratingStats: DoctorRatingStats;
    hideTrigger?: boolean;
  }
>(function DoctorPostsClient({ locale, posts: initial, doctor, followerCount, ratingStats, hideTrigger }, ref) {
  const ar = locale === "ar";
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaState>(emptyMedia());
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [editorFile, setEditorFile] = useState<File | null>(null);

  useImperativeHandle(ref, () => ({
    openNewPost: () => setShowForm(true),
  }));

  const bioText = ar ? (doctor.bioAr ?? doctor.bio) : (doctor.bio ?? doctor.bioAr);

  function resetForm() {
    setContent("");
    setMedia(emptyMedia());
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(post: PostRow) {
    setEditingId(post.id);
    setContent(post.content);
    setMedia({
      imageUrl: post.mediaType === "video" ? "" : (post.imageUrl ?? ""),
      videoUrl: post.videoUrl ?? "",
      mediaType: (post.mediaType as "image" | "video" | null) ?? (post.videoUrl ? "video" : post.imageUrl ? "image" : null),
      previewName: post.mediaType === "video" ? (ar ? "فيديو مرفق" : "Attached video") : post.imageUrl ? (ar ? "صورة مرفقة" : "Attached image") : "",
    });
    setShowForm(true);
  }

  function clearMedia() {
    setMedia(emptyMedia());
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
    const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name);

    if (!isVideo && !isImage) {
      setError(ar ? "نوع الملف غير مدعوم" : "Unsupported file type");
      return;
    }

    if (isImage) {
      // Open the editor before uploading; user can also skip straight to upload.
      setEditorFile(file);
      return;
    }

    await uploadFile(file);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await uploadDoctorPostMedia(formData);

      if (!data.success) {
        const errMap: Record<string, string> = {
          file_too_large: ar ? "الملف كبير جداً (صورة 5MB / فيديو 25MB)" : "File too large (image 5MB / video 25MB)",
          invalid_type: ar ? "نوع الملف غير مدعوم" : "Unsupported file type",
          unauthorized: ar ? "غير مصرّح" : "Unauthorized",
          upload_failed: ar ? "فشل رفع الملف — حاول مجدداً" : "Upload failed — try again",
          no_file: ar ? "لم يُحدَّد ملف" : "No file selected",
        };
        setError(errMap[data.error ?? ""] ?? (ar ? "فشل الرفع" : "Upload failed"));
        setUploading(false);
        return;
      }

      if (data.mediaType === "video") {
        setMedia({
          imageUrl: "",
          videoUrl: data.url!,
          mediaType: "video",
          previewName: file.name,
        });
      } else {
        setMedia({
          imageUrl: data.url!,
          videoUrl: "",
          mediaType: "image",
          previewName: file.name,
        });
      }
    } catch {
      setError(ar ? "فشل رفع الملف" : "File upload failed");
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const payload = {
      content,
      imageUrl: media.mediaType === "image" ? media.imageUrl : undefined,
      videoUrl: media.mediaType === "video" ? media.videoUrl : undefined,
      mediaType: media.mediaType,
    };

    const r = editingId
      ? await updateDoctorPost(editingId, payload)
      : await createDoctorPost(payload);

    if (r.success) {
      resetForm();
      router.refresh();
    } else {
      const errMap: Record<string, string> = {
        image_too_large: ar ? "الصورة كبيرة جداً" : "Image too large",
        invalid_video: ar ? "فيديو غير صالح" : "Invalid video",
        invalid_image: ar ? "صورة غير صالحة" : "Invalid image",
      };
      setError(errMap[r.error ?? ""] ?? (ar ? "فشل الحفظ" : "Save failed"));
    }
    setBusy(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(ar ? "حذف هذا المنشور؟" : "Delete this post?")) return;
    setBusy(true);
    const r = await deleteDoctorPost(id);
    if (r.success) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
        <div className="flex items-start gap-4">
          <DoctorAvatar logoUrl={doctor.logoUrl} specialtyId={doctor.specialtyId} size="xl" round />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-white truncate">
              {ar ? doctor.nameAr : doctor.name}
            </h1>
            <p className="text-xs text-indigo-400 mt-0.5">
              {ar ? doctor.specialtyAr : doctor.specialtyEn}
            </p>
            {doctor.experienceYears != null && doctor.experienceYears > 0 && (
              <p className="flex items-center gap-1 text-[11px] text-white/45 mt-1">
                <Star size={10} className="text-amber-400" />
                {doctor.experienceYears} {ar ? "سنة خبرة" : "years experience"}
              </p>
            )}
          </div>
          <Link
            href={`/${locale}/doctor/settings`}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition"
            title={ar ? "تعديل الملف" : "Edit profile"}
          >
            <Settings size={16} />
          </Link>
        </div>

        {bioText && (
          <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{bioText}</p>
        )}

        <DoctorRatingBadge
          average={ratingStats.average}
          count={ratingStats.count}
          locale={locale}
          className="pt-1"
        />

        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-white/5">
          <div>
            <p className="text-lg font-black text-white">{posts.length}</p>
            <p className="text-[10px] text-white/40">{ar ? "منشور" : "Posts"}</p>
          </div>
          <div>
            <p className="text-lg font-black text-white">{followerCount}</p>
            <p className="text-[10px] text-white/40">{ar ? "متابِع" : "Followers"}</p>
          </div>
          <div>
            <p className="text-lg font-black text-white">
              {ratingStats.count > 0 ? ratingStats.average.toFixed(1) : "—"}
            </p>
            <p className="text-[10px] text-white/40">
              {ar ? "تقييم" : "Rating"} ({ratingStats.count})
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">
            {ar ? "المنشورات" : "Posts"}
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            {ar ? "شارك نصائح وتحديثات مع مرضاك" : "Share tips and updates with your patients"}
          </p>
        </div>
        {!showForm && !hideTrigger && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            <Plus size={16} />
            {ar ? "منشور جديد" : "New post"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              {editingId ? (ar ? "تعديل المنشور" : "Edit post") : ar ? "منشور جديد" : "New post"}
            </h2>
            <button type="button" onClick={resetForm} className="text-white/40 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder={ar ? "اكتب محتوى المنشور..." : "Write your post..."}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-indigo-500/50 resize-none"
            required
          />

          {/* Media upload */}
          <div className="rounded-xl border border-dashed border-white/15 bg-white/2 p-4 space-y-3">
            <p className="text-xs text-white/40">
              {ar ? "أرفق صورة أو فيديو (اختياري)" : "Attach a photo or video (optional)"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 transition disabled:opacity-50"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                {uploading
                  ? (ar ? "جاري الرفع..." : "Uploading...")
                  : (ar ? "اختر صورة / فيديو" : "Choose photo / video")}
              </button>
              {media.mediaType && (
                <button
                  type="button"
                  onClick={clearMedia}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-400 hover:bg-rose-500/20 transition"
                >
                  <X size={12} />
                  {ar ? "إزالة المرفق" : "Remove attachment"}
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleFileChange}
            />
            {media.mediaType && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[11px] text-white/50">
                  {media.mediaType === "video" ? <Film size={12} /> : <Camera size={12} />}
                  {media.previewName}
                </p>
                <PostMedia
                  imageUrl={media.mediaType === "image" ? media.imageUrl : null}
                  videoUrl={media.mediaType === "video" ? media.videoUrl : null}
                  mediaType={media.mediaType}
                  locale={locale}
                  className="w-full max-h-48 rounded-xl border border-white/10 object-cover"
                />
              </div>
            )}
            <p className="text-[10px] text-white/25">
              {ar ? "صور: JPG, PNG, WebP, GIF — فيديو: MP4, WebM (حتى 25MB)" : "Images: JPG, PNG, WebP, GIF — Video: MP4, WebM (up to 25MB)"}
            </p>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl px-4 py-2 text-sm text-white/50 hover:text-white transition"
            >
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={busy || uploading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              <Check size={15} />
              {ar ? "نشر" : "Publish"}
            </button>
          </div>
        </form>
      )}

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-sm text-white/30">
            {ar ? "لا منشورات بعد — أنشئ أول منشور" : "No posts yet — create your first one"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const dateStr = format(new Date(post.createdAt), "d MMM yyyy HH:mm", {
              locale: ar ? arLocale : undefined,
            });
            return (
              <div key={post.id} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                <PostMedia
                  imageUrl={post.imageUrl}
                  videoUrl={post.videoUrl}
                  mediaType={post.mediaType}
                  locale={locale}
                  className="mt-3 w-full max-h-48 rounded-xl object-cover border border-white/5"
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <div className="flex gap-4 text-xs text-white/40">
                    <span>{post._count.likes} {ar ? "إعجاب" : "likes"}</span>
                    <span>{post._count.comments} {ar ? "تعليق" : "comments"}</span>
                    <span>{post._count.savedBy} {ar ? "حفظ" : "saves"}</span>
                    <span className="text-white/25">{dateStr}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(post)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-white/50 hover:text-indigo-400 hover:bg-white/5 transition"
                    >
                      <Pencil size={12} />
                      {ar ? "تعديل" : "Edit"}
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={busy}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-white/50 hover:text-rose-400 hover:bg-white/5 transition"
                    >
                      <Trash2 size={12} />
                      {ar ? "حذف" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editorFile && (
        <MediaEditor
          file={editorFile}
          locale={locale}
          onCancel={() => {
            setEditorFile(null);
            if (fileRef.current) fileRef.current.value = "";
          }}
          onSkip={(original) => {
            setEditorFile(null);
            uploadFile(original);
          }}
          onApply={(edited) => {
            setEditorFile(null);
            uploadFile(edited);
          }}
        />
      )}
    </div>
  );
});

export default DoctorPostsClient;
