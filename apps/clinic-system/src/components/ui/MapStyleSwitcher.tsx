"use client";

import { Map, Satellite, Mountain, Layers } from "lucide-react";
import type { MapDisplayStyle } from "@/lib/leafletTiles";
import { getMapStyleLabel } from "@/lib/leafletTiles";
import { cn } from "@/lib/utils";

const STYLES: { id: MapDisplayStyle; icon: typeof Map }[] = [
  { id: "auto", icon: Map },
  { id: "satellite", icon: Satellite },
  { id: "hybrid", icon: Layers },
  { id: "terrain", icon: Mountain },
];

export default function MapStyleSwitcher({
  value,
  onChange,
  locale,
  className,
  compact,
}: {
  value: MapDisplayStyle;
  onChange: (style: MapDisplayStyle) => void;
  locale: string;
  className?: string;
  compact?: boolean;
}) {
  const ar = locale === "ar";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl border border-white/10 bg-[#060912]/92 backdrop-blur-md p-1 shadow-lg",
        className
      )}
      role="group"
      aria-label={ar ? "نمط الخريطة" : "Map style"}
    >
      {STYLES.map(({ id, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            title={getMapStyleLabel(id, ar)}
            className={cn(
              "flex items-center gap-2 rounded-xl transition text-start",
              compact ? "px-2.5 py-2" : "px-3 py-2 min-w-[7.5rem]",
              active
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                : "text-white/55 hover:bg-white/8 hover:text-white"
            )}
          >
            <Icon size={compact ? 15 : 16} className="shrink-0" />
            {!compact && (
              <span className="text-[11px] font-semibold">{getMapStyleLabel(id, ar)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
