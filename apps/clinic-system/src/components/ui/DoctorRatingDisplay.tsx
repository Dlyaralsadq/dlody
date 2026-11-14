"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function DoctorRatingStars({
  average,
  size = "md",
  className,
}: {
  average: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const iconSize = size === "sm" ? 12 : size === "lg" ? 18 : 14;

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = average >= i;
        const half = !filled && average >= i - 0.5;
        return (
          <Star
            key={i}
            size={iconSize}
            className={cn(
              filled || half ? "text-amber-400" : "text-white/15",
              half && "opacity-60"
            )}
            fill={filled ? "currentColor" : half ? "currentColor" : "none"}
          />
        );
      })}
    </div>
  );
}

export function DoctorRatingBadge({
  average,
  count,
  locale = "ar",
  size = "md",
  className,
}: {
  average: number;
  count: number;
  locale?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const ar = locale === "ar";

  if (count === 0) {
    return (
      <p className={cn("text-xs text-white/35", className)}>
        {ar ? "لا تقييمات بعد" : "No ratings yet"}
      </p>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DoctorRatingStars average={average} size={size} />
      <span className={cn("font-bold text-amber-400", size === "sm" ? "text-xs" : "text-sm")}>
        {average.toFixed(1)}
      </span>
      <span className={cn("text-white/40", size === "sm" ? "text-[10px]" : "text-xs")}>
        ({count} {ar ? "تقييم" : count === 1 ? "rating" : "ratings"})
      </span>
    </div>
  );
}
