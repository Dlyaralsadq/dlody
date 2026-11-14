"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";
import { IRAQ_GOVERNORATES, getSpecialtyIcon } from "@/lib/iraq";

interface Specialty { id: string; name: string; nameAr: string; }

export default function FilterBar({
  specialties,
  locale,
  initial,
}: {
  specialties: Specialty[];
  locale: string;
  initial: { specialty: string; gov: string; district: string; q: string };
}) {
  const ar = locale === "ar";
  const router = useRouter();

  const [specialty, setSpecialty] = useState(initial.specialty);
  const [gov, setGov] = useState(initial.gov);
  const [district, setDistrict] = useState(initial.district);
  const [q, setQ] = useState(initial.q);

  const selectedGov = IRAQ_GOVERNORATES.find((g) => g.id === gov);
  const districts = selectedGov?.districts ?? [];

  // Reset district when governorate changes
  useEffect(() => { setDistrict(""); }, [gov]);

  function buildUrl(overrides: Partial<typeof initial> = {}) {
    const params = new URLSearchParams();
    const s = overrides.specialty  ?? specialty;
    const g = overrides.gov        ?? gov;
    const d = overrides.district   ?? district;
    const qs= overrides.q          ?? q;
    if (s) params.set("specialty", s);
    if (g) params.set("gov", g);
    if (d) params.set("district", d);
    if (qs) params.set("q", qs);
    return `/${locale}/patient?${params.toString()}`;
  }

  function applySpecialty(v: string) { setSpecialty(v); router.push(buildUrl({ specialty: v, district: "" })); }
  function applyGov(v: string)       { setGov(v); setDistrict(""); router.push(buildUrl({ gov: v, district: "" })); }
  function applyDistrict(v: string)  { setDistrict(v); router.push(buildUrl({ district: v })); }
  function applySearch(v: string)    { setQ(v); }
  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ q }));
  }
  function clearAll() {
    setSpecialty(""); setGov(""); setDistrict(""); setQ("");
    router.push(`/${locale}/patient`);
  }

  const hasFilter = !!(specialty || gov || district || q);

  // Highlight an empty select to guide the user
  const emptySelectCls = "h-9 appearance-none rounded-xl ps-3 pe-7 text-xs focus:outline-none max-w-[155px]";
  const filledSelectCls = "border border-indigo-500/40 bg-indigo-500/8 text-indigo-200 focus:border-indigo-500/70";
  const emptyGuideCls   = "border border-amber-400/40 bg-amber-400/8 text-amber-200/80 focus:border-amber-400/60 animate-pulse-gentle";
  const normalCls       = "border border-white/10 bg-white/5 text-white focus:border-indigo-500/60";

  return (
    <div className="shrink-0 backdrop-blur-md z-10" style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg-root) 92%, transparent)" }}>
      {/* Hint bar — only shown when no filter selected */}
      {!hasFilter && (
        <div className="flex items-center gap-1.5 px-3 py-1.5"
          style={{ borderBottom: "1px solid rgba(245,158,11,.15)", background: "rgba(245,158,11,.04)" }}>
          <span className="text-[10px] text-amber-300/80">
            {ar ? "▲ اختر المحافظة والتخصص لعرض الأطباء على الخريطة" : "▲ Select a governorate & specialty to see doctors on the map"}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto">

        {/* Specialty */}
        <div className="relative shrink-0">
          <select
            value={specialty}
            onChange={(e) => applySpecialty(e.target.value)}
            className={`${emptySelectCls} ${specialty ? filledSelectCls : (!hasFilter ? emptyGuideCls : normalCls)}`}
          >
            <option value="">{ar ? "التخصص" : "Specialty"}</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {getSpecialtyIcon(s.id)} {ar ? s.nameAr : s.name}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className={`pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 ${specialty ? "text-indigo-400" : "text-white/30"}`} />
        </div>

        {/* Governorate */}
        <div className="relative shrink-0">
          <select
            value={gov}
            onChange={(e) => applyGov(e.target.value)}
            className={`h-9 appearance-none rounded-xl ps-3 pe-7 text-xs focus:outline-none max-w-[130px] ${gov ? filledSelectCls : (!hasFilter ? emptyGuideCls : normalCls)}`}
          >
            <option value="">{ar ? "المحافظة" : "Governorate"}</option>
            {IRAQ_GOVERNORATES.map((g) => (
              <option key={g.id} value={g.id}>{ar ? g.ar : g.en}</option>
            ))}
          </select>
          <ChevronDown size={12} className={`pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 ${gov ? "text-indigo-400" : "text-white/30"}`} />
        </div>

        {/* District — only show when governorate selected */}
        {gov && districts.length > 0 && (
          <div className="relative shrink-0">
            <select
              value={district}
              onChange={(e) => applyDistrict(e.target.value)}
              className="h-9 appearance-none rounded-xl border border-indigo-500/30 bg-indigo-500/8 ps-3 pe-7 text-xs text-indigo-200 focus:outline-none focus:border-indigo-500/60 max-w-[140px]"
            >
              <option value="">{ar ? "كل الأقضية" : "All districts"}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{ar ? d.ar : d.en}</option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-indigo-400" />
          </div>
        )}

        {/* Search */}
        <form onSubmit={submitSearch} className="flex-1 min-w-[90px] flex gap-1.5">
          <input
            value={q}
            onChange={(e) => applySearch(e.target.value)}
            placeholder={ar ? "اسم الطبيب..." : "Doctor name..."}
            className="h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/60"
          />
        </form>

        {/* Clear all */}
        {hasFilter && (
          <button
            onClick={clearAll}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
            title={ar ? "مسح" : "Clear"}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
