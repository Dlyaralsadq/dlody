"use client";

import { useState } from "react";
import { Map, Satellite, Mountain, Layers, ChevronDown } from "lucide-react";
import type { MapDisplayStyle } from "@/lib/leafletTiles";
import { getMapStyleLabel } from "@/lib/leafletTiles";
import { cn } from "@/lib/utils";

const STYLES: { id: MapDisplayStyle; icon: typeof Map }[] = [
  { id: "auto",      icon: Map       },
  { id: "satellite", icon: Satellite },
  { id: "hybrid",    icon: Layers    },
  { id: "terrain",   icon: Mountain  },
];

const ICON_MAP: Record<MapDisplayStyle, typeof Map> = {
  auto:      Map,
  satellite: Satellite,
  hybrid:    Layers,
  terrain:   Mountain,
};

export default function MapStyleSwitcher({
  value,
  onChange,
  locale,
  className,
}: {
  value: MapDisplayStyle;
  onChange: (style: MapDisplayStyle) => void;
  locale: string;
  className?: string;
  /** @deprecated – ignored, kept for backward compat */
  compact?: boolean;
}) {
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const ActiveIcon = ICON_MAP[value];

  return (
    <div className={cn("relative", className)}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl backdrop-blur-md px-2.5 py-2 text-xs font-semibold shadow-lg transition hover:border-indigo-500/40"
        style={{
          border: "1px solid var(--border)",
          background: "color-mix(in srgb, var(--bg-root) 92%, transparent)",
          color: "var(--text-1)",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ar ? "نمط الخريطة" : "Map style"}
      >
        <ActiveIcon size={15} className="text-indigo-400 shrink-0" />
        <span className="text-[11px] hidden xs:inline">{getMapStyleLabel(value, ar)}</span>
        <ChevronDown
          size={12}
          className={cn(
            "text-white/40 transition-transform duration-200 shrink-0",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Backdrop — close on outside click */}
      {open && (
        <div
          className="fixed inset-0 z-[1001]"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Dropdown menu */}
      {open && (
        <div
          role="listbox"
          aria-label={ar ? "نمط الخريطة" : "Map style"}
          className="absolute top-full mt-1.5 start-0 z-[1002] min-w-[9.5rem] rounded-xl border border-white/10 p-1 shadow-2xl"
          style={{
            background: "rgba(6,9,18,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {STYLES.map(({ id, icon: Icon }) => {
            const active = value === id;
            return (
              <button
                key={id}
                role="option"
                aria-selected={active}
                type="button"
                onClick={() => { onChange(id); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 text-start",
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                    : "text-white/55 hover:bg-white/8 hover:text-white"
                )}
              >
                <Icon size={14} className="shrink-0" />
                {getMapStyleLabel(id, ar)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
