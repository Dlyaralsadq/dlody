import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getPublicDoctorById } from "@/lib/publicDoctors";
import { inferGovFromAddress } from "@/lib/iraq";
import { WORKING_DAYS_LABELS } from "@/lib/doctorDisplay";
import { requirePatient } from "@/lib/requirePatient";
import { prisma } from "@/lib/prisma";
import {
  getDoctorProfilePosts,
  isFollowingDoctor,
  getDoctorFollowerCount,
} from "@/app/actions/patientSocial";
import DoctorProfileClient from "./DoctorProfileClient";
import { getDoctorRatingStats } from "@/app/actions/doctorRatings";
import { getActiveStoryDoctorIds } from "@/app/actions/doctorStories";
import { PATIENT_NAV_SCROLL_PADDING, SCROLL_CONTAINER } from "@/lib/scrollUi";
import ScrollSpacer from "@/components/ui/ScrollSpacer";

export default async function PatientDoctorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, id } = await params;
  const { tab } = await searchParams;
  const session = await requirePatient(locale);
  const ar = locale === "ar";
  const doctor = await getPublicDoctorById(id);
  if (!doctor) notFound();

  const [secretary, posts, following, followerCount, ratingStats, activeStoryIds] = await Promise.all([
    prisma.user.findFirst({
      where: { linkedDoctorId: doctor.id, role: "secretary", isActive: true },
      select: { name: true },
    }),
    getDoctorProfilePosts(doctor.id, session.userId),
    isFollowingDoctor(doctor.id, session.userId),
    getDoctorFollowerCount(doctor.id),
    getDoctorRatingStats(doctor.id, session.userId),
    getActiveStoryDoctorIds([doctor.id]),
  ]);

  const govInfo = inferGovFromAddress(doctor.clinicAddress ?? "");
  const displayLat = doctor.clinicLat ?? govInfo?.lat ?? 33.2;
  const displayLng = doctor.clinicLng ?? govInfo?.lng ?? 44.0;
  const hasExactLocation = doctor.clinicLat !== null && doctor.clinicLng !== null;
  const displayZoom = hasExactLocation ? 16 : 10;
  const days = doctor.workingDays ? WORKING_DAYS_LABELS[doctor.workingDays] : null;

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden" style={{ background: "var(--bg-root)" }} dir={ar ? "rtl" : "ltr"}>
      <nav className="shrink-0 z-20 flex items-center gap-3 px-4 py-3 backdrop-blur-md" style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg-root) 90%, transparent)" }}>
        <Link
          href={`/${locale}/patient/explore`}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/8 transition"
        >
          <ArrowRight size={18} className={`text-white/70 ${ar ? "" : "rotate-180"}`} />
        </Link>
        <span className="text-sm font-bold text-white truncate">
          {ar ? doctor.nameAr : doctor.name}
        </span>
      </nav>

      <div className={`flex-1 min-h-0 ${SCROLL_CONTAINER} ${PATIENT_NAV_SCROLL_PADDING}`}>
        <DoctorProfileClient
        locale={locale}
        patientId={session.userId}
        following={following}
        followerCount={followerCount}
        ratingStats={ratingStats}
        posts={posts}
        initialTab={tab === "info" ? "info" : "posts"}
        doctor={{
          id: doctor.id,
          name: doctor.name,
          nameAr: doctor.nameAr,
          specialtyAr: doctor.specialty.nameAr,
          specialtyEn: doctor.specialty.name,
          specialtyId: doctor.specialtyId,
          logoUrl: doctor.logoUrl,
          hasActiveStory: activeStoryIds.has(doctor.id),
          experienceYears: doctor.experienceYears,
          bio: doctor.bio,
          bioAr: doctor.bioAr,
          services: doctor.services,
          announcement: doctor.announcement,
          clinicAddress: doctor.clinicAddress,
          workingHoursStart: doctor.workingHoursStart,
          workingHoursEnd: doctor.workingHoursEnd,
          workingDays: doctor.workingDays,
          workingDaysLabel: days ? (ar ? days.ar : days.en) : null,
          consultationFee: doctor.consultationFee,
          showConsultationFee: doctor.showConsultationFee !== false,
          phone: doctor.phone,
          secretaryName: secretary?.name ?? null,
          displayLat,
          displayLng,
          displayZoom,
          hasExactLocation,
          googleMapsUrl: `https://www.google.com/maps?q=${displayLat},${displayLng}&z=${displayZoom}`,
        }}
        />
        <ScrollSpacer variant="patientProfile" />
      </div>
    </div>
  );
}
