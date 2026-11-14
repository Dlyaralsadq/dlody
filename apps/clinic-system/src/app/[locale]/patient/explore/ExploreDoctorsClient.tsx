"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import type { BrowseDoctor } from "@/app/actions/patientSocial";

export default function ExploreDoctorsClient({
  doctors,
  locale,
}: {
  doctors: BrowseDoctor[];
  locale: string;
}) {
  const ar = locale === "ar";
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.nameAr.includes(q) ||
        d.specialtyAr.includes(q) ||
        d.specialtyEn.toLowerCase().includes(q)
    );
  }, [doctors, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ar ? "ابحث عن طبيب أو تخصص..." : "Search doctor or specialty..."}
          className="w-full rounded-2xl bg-white/5 border border-white/10 ps-10 pe-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-indigo-500/40"
        />
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-white/30 py-12">
            {ar ? "لا نتائج" : "No results"}
          </p>
        ) : (
          filtered.map((doc) => (
            <Link
              key={doc.id}
              href={`/${locale}/patient/doctor/${doc.id}`}
              className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/3 p-3 hover:bg-white/5 transition active:scale-[0.99]"
            >
              <DoctorAvatar logoUrl={doc.logoUrl} specialtyId={doc.specialtyId} size="lg" round hasStory={doc.hasActiveStory} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                  <span className="truncate">{ar ? doc.nameAr : doc.name}</span>
                  {doc.priority && (
                    <span className="shrink-0 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-300">{ar ? "مميّز" : "Featured"}</span>
                  )}
                </p>
                <p className="text-xs text-indigo-400/90 truncate">
                  {ar ? doc.specialtyAr : doc.specialtyEn}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-white/35">
                  {doc.experienceYears != null && doc.experienceYears > 0 && (
                    <span>{doc.experienceYears} {ar ? "سنة" : "yrs"}</span>
                  )}
                  <span>{doc.postCount} {ar ? "منشور" : "posts"}</span>
                  {doc.isFollowing && (
                    <span className="text-emerald-400">{ar ? "متابَع" : "Following"}</span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
