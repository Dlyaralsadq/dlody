"use client";

import { useState, useTransition } from "react";
import { Star, Loader2 } from "lucide-react";
import { rateDoctor, type DoctorRatingStats } from "@/app/actions/doctorRatings";
import { DoctorRatingBadge } from "@/components/ui/DoctorRatingDisplay";
import { cn } from "@/lib/utils";

export default function DoctorRatingForm({
  doctorId,
  locale,
  initialStats,
}: {
  doctorId: string;
  locale: string;
  initialStats: DoctorRatingStats;
}) {
  const ar = locale === "ar";
  const [stats, setStats] = useState(initialStats);
  const [hover, setHover] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const activeScore = hover || stats.patientScore || 0;

  function submit(score: number) {
    setError("");
    startTransition(async () => {
      const r = await rateDoctor(doctorId, score);
      if (r.success && r.stats) {
        setStats(r.stats);
      } else {
        const errMap: Record<string, string> = {
          unauthorized: ar ? "يجب تسجيل الدخول كمريض" : "Patient login required",
          invalid_score: ar ? "تقييم غير صالح" : "Invalid rating",
          not_found: ar ? "الطبيب غير موجود" : "Doctor not found",
          not_ready: ar ? "نظام التقييم غير جاهز — أعد تشغيل الخادم" : "Ratings not ready — restart the server",
        };
        setError(errMap[r.error ?? ""] ?? (ar ? "فشل التقييم" : "Rating failed"));
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-semibold text-white/50">
          {ar ? "تقييم الطبيب" : "Doctor rating"}
        </p>
        <DoctorRatingBadge average={stats.average} count={stats.count} locale={locale} size="sm" />
      </div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            disabled={pending}
            onMouseEnter={() => setHover(score)}
            onMouseLeave={() => setHover(0)}
            onClick={() => submit(score)}
            className="p-1 rounded-lg hover:bg-white/5 transition disabled:opacity-50"
            aria-label={`${score} ${ar ? "نجوم" : "stars"}`}
          >
            <Star
              size={28}
              className={cn(
                "transition-colors",
                score <= activeScore ? "text-amber-400" : "text-white/20"
              )}
              fill={score <= activeScore ? "currentColor" : "none"}
            />
          </button>
        ))}
        {pending && <Loader2 size={16} className="text-white/40 animate-spin ms-2" />}
      </div>

      <p className="text-[11px] text-white/35">
        {stats.patientScore
          ? ar
            ? `تقييمك: ${stats.patientScore}/5 — اضغط لتغييره`
            : `Your rating: ${stats.patientScore}/5 — tap to change`
          : ar
          ? "اضغط على النجوم لتقييم هذا الطبيب"
          : "Tap stars to rate this doctor"}
      </p>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
