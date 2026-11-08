"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Banknote,
  Phone,
  Calendar,
  Navigation,
  Star,
  Grid3X3,
  Info,
} from "lucide-react";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import FollowButton from "./FollowButton";
import PostCard from "../../components/PostCard";
import DoctorMapWrapper from "./DoctorMapWrapper";
import DoctorRatingForm from "@/components/ui/DoctorRatingForm";
import { DoctorRatingBadge } from "@/components/ui/DoctorRatingDisplay";
import StoryViewer from "../../components/StoryViewer";
import type { FeedPost } from "@/app/actions/patientSocial";
import type { DoctorRatingStats } from "@/app/actions/doctorRatings";

type DoctorInfo = {
  id: string;
  name: string;
  nameAr: string;
  specialtyAr: string;
  specialtyEn: string;
  specialtyId: string;
  logoUrl: string | null;
  hasActiveStory?: boolean;
  experienceYears: number | null;
  bio: string | null;
  bioAr: string | null;
  services: string | null;
  announcement: string | null;
  clinicAddress: string | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  workingDays: string | null;
  workingDaysLabel: string | null;
  consultationFee: number | null;
  showConsultationFee: boolean;
  phone: string | null;
  secretaryName: string | null;
  displayLat: number;
  displayLng: number;
  displayZoom: number;
  hasExactLocation: boolean;
  googleMapsUrl: string;
};

export default function DoctorProfileClient({
  locale,
  doctor,
  posts,
  following,
  followerCount,
  patientId,
  ratingStats,
  initialTab = "posts",
}: {
  locale: string;
  doctor: DoctorInfo;
  posts: FeedPost[];
  following: boolean;
  followerCount: number;
  patientId: string;
  ratingStats: DoctorRatingStats;
  initialTab?: "posts" | "info";
}) {
  const ar = locale === "ar";
  const [tab, setTab] = useState<"posts" | "info">(initialTab);
  const [showStory, setShowStory] = useState(false);

  const hours =
    doctor.workingHoursStart && doctor.workingHoursEnd
      ? `${doctor.workingHoursStart} – ${doctor.workingHoursEnd}`
      : null;

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ background: "var(--bg-root)" }}>
      {/* Profile header — social style */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-5">
          {doctor.hasActiveStory ? (
            <button
              type="button"
              onClick={() => setShowStory(true)}
              aria-label={ar ? "عرض القصة" : "View story"}
            >
              <DoctorAvatar
                logoUrl={doctor.logoUrl}
                specialtyId={doctor.specialtyId}
                size="xl"
                round
                hasStory
              />
            </button>
          ) : (
            <DoctorAvatar logoUrl={doctor.logoUrl} specialtyId={doctor.specialtyId} size="xl" round />
          )}
          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-black text-white">{posts.length}</p>
              <p className="text-[10px] text-white/40">{ar ? "منشور" : "Posts"}</p>
            </div>
            <div>
              <p className="text-lg font-black text-white">{followerCount}</p>
              <p className="text-[10px] text-white/40">{ar ? "متابِع" : "Followers"}</p>
            </div>
            <div>
              <p className="text-lg font-black text-white">
                {ratingStats.count > 0 ? ratingStats.average.toFixed(1) : "—"}
              </p>
              <p className="text-[10px] text-white/40">{ar ? "تقييم" : "Rating"}</p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          {doctor.announcement && (
            <p className="mb-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
              {doctor.announcement}
            </p>
          )}
          <h1 className="font-bold text-white text-sm">{ar ? doctor.nameAr : doctor.name}</h1>
          <p className="text-xs text-indigo-400 mt-0.5">{ar ? doctor.specialtyAr : doctor.specialtyEn}</p>
          {doctor.experienceYears != null && doctor.experienceYears > 0 && (
            <p className="flex items-center gap-1 text-[11px] text-white/45 mt-1">
              <Star size={10} className="text-amber-400" />
              {doctor.experienceYears} {ar ? "سنة خبرة" : "years experience"}
            </p>
          )}
          <DoctorRatingBadge
            average={ratingStats.average}
            count={ratingStats.count}
            locale={locale}
            size="sm"
            className="mt-2"
          />
        </div>

        <div className="mt-3 space-y-3">
          <FollowButton
            doctorId={doctor.id}
            locale={locale}
            initialFollowing={following}
            followerCount={followerCount}
          />
          <DoctorRatingForm
            doctorId={doctor.id}
            locale={locale}
            initialStats={ratingStats}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setTab("posts")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold border-b-2 transition ${
            tab === "posts"
              ? "border-white text-white"
              : "border-transparent text-white/35"
          }`}
        >
          <Grid3X3 size={16} />
          {ar ? "المنشورات" : "Posts"}
        </button>
        <button
          onClick={() => setTab("info")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold border-b-2 transition ${
            tab === "info"
              ? "border-white text-white"
              : "border-transparent text-white/35"
          }`}
        >
          <Info size={16} />
          {ar ? "معلومات العيادة" : "Clinic info"}
        </button>
      </div>

      {tab === "posts" ? (
        <div className="divide-y divide-white/5">
          {posts.length === 0 ? (
            <p className="text-center text-sm text-white/30 py-16">
              {ar ? "لا منشورات بعد" : "No posts yet"}
            </p>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                locale={locale}
                patientId={patientId}
                showFollowButton={false}
              />
            ))
          )}
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
          {doctor.services && (
            <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-4">
              <p className="text-[11px] text-white/30 mb-2">{ar ? "الخدمات" : "Services"}</p>
              <ul className="space-y-1">
                {doctor.services.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => (
                  <li key={line} className="text-sm text-white/70">{line}</li>
                ))}
              </ul>
            </div>
          )}

          {(doctor.bio || doctor.bioAr) && (
            <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-4">
              <p className="text-[11px] text-white/30 mb-2">{ar ? "نبذة تعريفية" : "About"}</p>
              <p className="text-sm text-white/70 leading-relaxed">
                {ar ? (doctor.bioAr ?? doctor.bio) : (doctor.bio ?? doctor.bioAr)}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-white/50 mb-2">
              {ar ? "موقع العيادة" : "Clinic location"}
            </p>
            <DoctorMapWrapper
              lat={doctor.displayLat}
              lng={doctor.displayLng}
              name={ar ? doctor.nameAr : doctor.name}
              locale={locale}
            />
            <a
              href={doctor.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 bg-white/4 py-2.5 text-xs font-semibold text-white/70 hover:text-white transition"
            >
              <Navigation size={13} />
              {ar ? "فتح في خرائط Google" : "Open in Google Maps"}
            </a>
          </div>

          <div className="grid gap-3">
            {doctor.clinicAddress && (
              <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-4">
                <MapPin size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-white/30">{ar ? "العنوان" : "Address"}</p>
                  <p className="text-sm text-white mt-0.5">{doctor.clinicAddress}</p>
                </div>
              </div>
            )}
            {(hours || doctor.workingDaysLabel) && (
              <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-4">
                <Clock size={16} className="text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-white/30">{ar ? "ساعات العمل" : "Working hours"}</p>
                  {doctor.workingDaysLabel && (
                    <p className="text-sm text-white mt-0.5">{doctor.workingDaysLabel}</p>
                  )}
                  {hours && <p className="text-xs text-white/50">{hours}</p>}
                </div>
              </div>
            )}
            {doctor.showConsultationFee && doctor.consultationFee != null && (
              <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-4">
                <Banknote size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-white/30">{ar ? "سعر الكشفية" : "Fee"}</p>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">
                    {doctor.consultationFee.toLocaleString()}{" "}
                    <span className="text-sm font-normal">{ar ? "د.ع" : "IQD"}</span>
                  </p>
                </div>
              </div>
            )}
            {doctor.phone && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-4">
                <p className="text-[11px] text-cyan-400/70">
                  {doctor.secretaryName
                    ? (ar ? `السكرتير — ${doctor.secretaryName}` : `Secretary — ${doctor.secretaryName}`)
                    : (ar ? "هاتف العيادة" : "Clinic phone")}
                </p>
                <p className="text-sm font-bold text-white mt-1">{doctor.phone}</p>
                <a
                  href={`tel:${doctor.phone}`}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Phone size={12} />
                  {ar ? "اتصل" : "Call"}
                </a>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {doctor.phone && (
              <a
                href={`tel:${doctor.phone}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 min-h-[3.25rem] text-sm font-bold text-cyan-300 hover:bg-cyan-500/15 transition"
              >
                <Phone size={15} />
                {ar ? "حجز بالهاتف" : "Call to book"}
              </a>
            )}
            <Link
              href={`/${locale}/patient/book/${doctor.id}`}
              className={`flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 min-h-[3.25rem] text-sm font-bold text-white hover:opacity-95 transition ${
                doctor.phone ? "" : "col-span-2"
              }`}
            >
              <Calendar size={15} />
              {ar ? "حجز أونلاين" : "Book online"}
            </Link>
          </div>
        </div>
      )}

      {showStory && (
        <StoryViewer
          doctor={{
            id: doctor.id,
            name: doctor.name,
            nameAr: doctor.nameAr,
            logoUrl: doctor.logoUrl,
            specialtyId: doctor.specialtyId,
            hasActiveStory: true,
          }}
          locale={locale}
          onClose={() => setShowStory(false)}
        />
      )}
    </div>
  );
}
