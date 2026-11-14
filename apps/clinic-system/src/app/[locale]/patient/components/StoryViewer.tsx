"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import PostMedia from "@/components/ui/PostMedia";
import {
  getDoctorStoriesForViewer,
  type StoryFeedDoctor,
  type DoctorStoryItem,
} from "@/app/actions/doctorStories";

const IMAGE_SLIDE_MS = 6000;

export default function StoryViewer({
  doctor,
  locale,
  onClose,
}: {
  doctor: StoryFeedDoctor;
  locale: string;
  onClose: () => void;
}) {
  const ar = locale === "ar";
  const [stories, setStories] = useState<DoctorStoryItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getDoctorStoriesForViewer(doctor.id);
      if (cancelled) return;
      if (res.success && res.stories?.length) {
        setStories(res.stories);
      } else {
        onClose();
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [doctor.id, onClose]);

  const goNext = useCallback(() => {
    setProgress(0);
    setIndex((i) => {
      if (i >= stories.length - 1) {
        onClose();
        return i;
      }
      return i + 1;
    });
  }, [stories.length, onClose]);

  const goPrev = useCallback(() => {
    setProgress(0);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    setProgress(0);
  }, [index]);

  const current = stories[index];
  const isVideo = current?.mediaType === "video";

  // Image slides advance on a fixed timer; video slides advance when the video ends.
  useEffect(() => {
    if (loading || stories.length === 0 || isVideo) return;
    const tick = 50;
    const id = window.setInterval(() => {
      setProgress((p) => {
        const next = p + (tick / IMAGE_SLIDE_MS) * 100;
        if (next >= 100) {
          window.setTimeout(goNext, 0);
          return 100;
        }
        return next;
      });
    }, tick);
    return () => window.clearInterval(id);
  }, [loading, stories.length, index, goNext, isVideo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") (ar ? goPrev : goNext)();
      if (e.key === "ArrowLeft") (ar ? goNext : goPrev)();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev, ar]);

  function handleVideoTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }

  return (
    <div
      className="theme-fixed-dark fixed inset-0 z-[10000] flex flex-col bg-black/95"
      dir={ar ? "rtl" : "ltr"}
      role="dialog"
      aria-modal
    >
      <div className="absolute top-0 inset-x-0 z-20 flex gap-1 px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        {stories.map((s, i) => (
          <div key={s.id} className="h-0.5 flex-1 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white transition-[width] duration-75 ease-linear"
              style={{
                width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-3 pt-10 pb-2 z-20">
        <Link
          href={`/${locale}/patient/doctor/${doctor.id}`}
          className="flex items-center gap-2 min-w-0"
          onClick={onClose}
        >
          <DoctorAvatar
            logoUrl={doctor.logoUrl}
            specialtyId={doctor.specialtyId}
            size="sm"
            round
          />
          <span className="text-sm font-semibold text-white truncate">
            {ar ? doctor.nameAr : doctor.name}
          </span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {isVideo && (
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label={ar ? (muted ? "تشغيل الصوت" : "كتم الصوت") : muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label={ar ? "إغلاق" : "Close"}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center min-h-0">
        {loading || !current ? (
          <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <>
            <button
              type="button"
              className="absolute inset-y-0 start-0 w-1/3 z-10"
              onClick={goPrev}
              aria-label={ar ? "السابق" : "Previous"}
            />
            <button
              type="button"
              className="absolute inset-y-0 end-0 w-1/3 z-10"
              onClick={goNext}
              aria-label={ar ? "التالي" : "Next"}
            />

            <div className="w-full max-w-lg h-full max-h-[75dvh] flex flex-col px-2">
              {isVideo ? (
                <video
                  key={current.id}
                  ref={videoRef}
                  src={current.mediaUrl}
                  className="flex-1 w-full rounded-2xl object-contain bg-black"
                  autoPlay
                  muted={muted}
                  playsInline
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={goNext}
                />
              ) : (
                <PostMedia
                  imageUrl={current.mediaUrl}
                  mediaType="image"
                  locale={locale}
                  className="flex-1 w-full rounded-2xl object-contain bg-black"
                />
              )}
              {current.caption && (
                <p className="mt-3 px-2 text-sm text-white/90 text-center leading-relaxed">
                  {current.caption}
                </p>
              )}
            </div>

            <div className="absolute bottom-6 inset-x-0 flex justify-center gap-6 pointer-events-none text-white/40">
              <ChevronLeft size={20} className={ar ? "rotate-180" : ""} />
              <ChevronRight size={20} className={ar ? "rotate-180" : ""} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
