"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Plus, Image as ImageIcon, Sparkles } from "lucide-react";
import type { DoctorPostsClientHandle } from "./DoctorPostsClient";
import type { DoctorStoryManagerHandle } from "@/components/doctor/DoctorStoryManager";

export default function PublishMenu({
  locale,
  postsRef,
  storyRef,
}: {
  locale: string;
  postsRef: RefObject<DoctorPostsClientHandle | null>;
  storyRef: RefObject<DoctorStoryManagerHandle | null>;
}) {
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:opacity-95 transition shadow-lg shadow-indigo-950/40"
      >
        <Plus size={16} />
        {ar ? "نشر" : "Publish"}
      </button>

      {open && (
        <div className="absolute end-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#10131e] shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              postsRef.current?.openNewPost();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-start text-sm text-white/85 hover:bg-white/5 transition"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
              <ImageIcon size={16} />
            </span>
            <span>
              <span className="block font-semibold">{ar ? "منشور جديد" : "New post"}</span>
              <span className="block text-[11px] text-white/35">
                {ar ? "يظهر في ملفك الشخصي" : "Shows on your profile"}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              storyRef.current?.openNewStory();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-start text-sm text-white/85 hover:bg-white/5 transition border-t border-white/5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <Sparkles size={16} />
            </span>
            <span>
              <span className="block font-semibold">{ar ? "قصة جديدة" : "New story"}</span>
              <span className="block text-[11px] text-white/35">
                {ar ? "تختفي بعد 24 ساعة" : "Disappears after 24 hours"}
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
