"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert } from "lucide-react";

/**
 * Small "!" icon that reveals a setting's explanation only when clicked,
 * instead of showing a permanent helper line under every field. Keeps
 * settings screens compact while still documenting what each option does.
 */
export default function InfoTooltip({
  text,
  locale = "en",
  align = "start",
}: {
  text: string;
  locale?: string;
  align?: "start" | "end";
}) {
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <span className="relative inline-flex items-center" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={ar ? "توضيح" : "Explain"}
        className="flex h-4 w-4 items-center justify-center rounded-full transition-colors"
        style={{ color: open ? "var(--indigo-l, #6366f1)" : "var(--text-3)" }}
      >
        <CircleAlert className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          role="tooltip"
          dir={ar ? "rtl" : "ltr"}
          className={`absolute top-full z-50 mt-1.5 w-56 rounded-xl p-2.5 text-[11px] leading-relaxed shadow-2xl animate-fade-up ${
            align === "end" ? "end-0" : "start-0"
          }`}
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
