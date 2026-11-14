"use client";

import { useState } from "react";
import { getSpecialtyIcon } from "@/lib/iraq";

interface DoctorAvatarProps {
  logoUrl?: string | null;
  specialtyId?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Fully circular avatar (for stories strip). */
  round?: boolean;
  /** Draw a colored gradient ring around the avatar (doctor has an active story). */
  hasStory?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-11 w-11 text-lg",
  lg: "h-16 w-16 text-2xl",
  xl: "h-20 w-20 text-3xl",
};

const radiusClasses = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-2xl",
};

export default function DoctorAvatar({
  logoUrl,
  specialtyId,
  name,
  size = "md",
  round = false,
  hasStory = false,
  className = "",
}: DoctorAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const fallback = specialtyId
    ? getSpecialtyIcon(specialtyId)
    : name?.[0]?.toUpperCase() ?? "🩺";
  const src = logoUrl?.trim() || null;
  const showImage = src && !imgFailed;

  const avatar = (
    <div
      className={`shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600/80 to-violet-700/80 border border-white/5 ${sizeClasses[size]} ${round ? "rounded-full" : radiusClasses[size]} ${hasStory ? "" : className}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="leading-none select-none">{fallback}</span>
      )}
    </div>
  );

  if (!hasStory) return avatar;

  return (
    <div className={`shrink-0 rounded-full p-[2.5px] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 ${className}`}>
      <div className="rounded-full p-[2px] bg-[#060912]">{avatar}</div>
    </div>
  );
}
