"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Plus, Trash2, Camera, Film, Loader2, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import PostMedia from "@/components/ui/PostMedia";
import MediaEditor from "@/components/media/MediaEditor";
import {
  createDoctorStory,
  deleteDoctorStory,
  uploadDoctorStoryMedia,
  type DoctorStoryItem,
} from "@/app/actions/doctorStories";

export interface DoctorStoryManagerHandle {
  openNewStory: () => void;
}

const DoctorStoryManager = forwardRef<
  DoctorStoryManagerHandle,
  {
    locale: string;
    initialStories: DoctorStoryItem[];
    hideTrigger?: boolean;
  }
>(function DoctorStoryManager({ locale, initialStories, hideTrigger }, ref) {
  const ar = locale === "ar";
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stories, setStories] = useState(initialStories);
  const [showForm, setShowForm] = useState(false);
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editorFile, setEditorFile] = useState<File | null>(null);

  useImperativeHandle(ref, () => ({
    openNewStory: () => setShowForm(true),
  }));

  useEffect(() => {
    setStories(initialStories);
  }, [initialStories]);

  function resetForm() {
    setShowForm(false);
    setCaption("");
    setMediaUrl("");
    setMediaType(null);
    setPreviewName("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    if (isImage) {
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
      const data = await uploadDoctorStoryMedia(formData);

      if (!data.success) {
        const errMap: Record<string, string> = {
          file_too_large: ar ? "الملف كبير جداً" : "File too large",
          invalid_type: ar ? "نوع الملف غير مدعوم" : "Unsupported file type",
          unauthorized: ar ? "غير مصرّح" : "Unauthorized",
          upload_failed: ar ? "فشل الرفع" : "Upload failed",
        };
        setError(errMap[data.error ?? ""] ?? (ar ? "فشل الرفع" : "Upload failed"));
        setUploading(false);
        return;
      }

      setMediaUrl(data.url!);
      setMediaType(data.mediaType!);
      setPreviewName(file.name);
    } catch {
      setError(ar ? "فشل رفع الملف" : "Upload failed");
    }
    setUploading(false);
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaUrl || !mediaType) {
      setError(ar ? "أرفق صورة أو فيديو" : "Attach a photo or video");
      return;
    }

    setBusy(true);
    setError("");
    const r = await createDoctorStory({ mediaUrl, mediaType, caption });
    if (r.success) {
      resetForm();
      router.refresh();
    } else {
      setError(ar ? "فشل نشر القصة" : "Failed to publish story");
    }
    setBusy(false);
  }

  async function handleDelete(id: string) {
    if (!confirm(ar ? "حذف هذه القصة؟" : "Delete this story?")) return;
    setBusy(true);
    const r = await deleteDoctorStory(id);
    if (r.success) {
      setStories((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">{ar ? "القصص" : "Stories"}</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {ar ? "تظهر لمدة 24 ساعة في صفحة المرضى" : "Visible to patients for 24 hours"}
          </p>
        </div>
        {!showForm && !hideTrigger && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition shrink-0"
          >
            <Plus size={16} />
            {ar ? "قصة جديدة" : "New story"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handlePublish} className="rounded-xl border border-white/10 bg-white/2 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{ar ? "إضافة قصة" : "Add story"}</p>
            <button type="button" onClick={resetForm} className="text-white/40 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-violet-600/20 border border-violet-500/30 px-4 py-2.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/25 transition disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {uploading
              ? (ar ? "جاري الرفع..." : "Uploading...")
              : (ar ? "اختر صورة / فيديو" : "Choose photo / video")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleFileChange}
          />

          {mediaType && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] text-white/50">
                {mediaType === "video" ? <Film size={12} /> : <Camera size={12} />}
                {previewName}
              </p>
              <PostMedia
                imageUrl={mediaType === "image" ? mediaUrl : null}
                videoUrl={mediaType === "video" ? mediaUrl : null}
                mediaType={mediaType}
                locale={locale}
                className="w-full max-h-40 rounded-xl border border-white/10 object-cover"
              />
            </div>
          )}

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={ar ? "تعليق اختياري..." : "Optional caption..."}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/50"
          />

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl px-4 py-2 text-sm text-white/50 hover:text-white"
            >
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={busy || uploading || !mediaUrl}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              <Check size={15} />
              {ar ? "نشر" : "Publish"}
            </button>
          </div>
        </form>
      )}

      {stories.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {stories.map((story) => (
            <div key={story.id} className="relative shrink-0 w-24">
              <PostMedia
                imageUrl={story.mediaType === "image" ? story.mediaUrl : null}
                videoUrl={story.mediaType === "video" ? story.mediaUrl : null}
                mediaType={story.mediaType as "image" | "video"}
                locale={locale}
                className="w-24 h-32 rounded-xl object-cover border border-white/10"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDelete(story.id)}
                className="absolute top-1 end-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-rose-400 hover:bg-black/80"
                aria-label={ar ? "حذف" : "Delete"}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="text-xs text-white/30 text-center py-4">
            {ar ? "لا قصص نشطة — أضف قصة لتظهر للمرضى" : "No active stories — add one for patients to see"}
          </p>
        )
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

export default DoctorStoryManager;
