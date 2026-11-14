import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getDoctorByUserId } from "@/app/actions/doctorPortal";
import { hasActiveSubscription } from "@/lib/publicDoctors";
import { getDoctorPosts } from "@/app/actions/doctorPosts";
import { getDoctorFollowerCount } from "@/app/actions/patientSocial";
import { getDoctorRatingStats } from "@/app/actions/doctorRatings";
import { getDoctorOwnStories } from "@/app/actions/doctorStories";
import DoctorPublishHub from "./DoctorPublishHub";

export default async function DoctorPostsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale === "ar";
  const session = await requireAuth(locale);
  if (session.role !== "doctor") redirect(`/${locale}/login`);

  const doctor = await getDoctorByUserId(session.userId);
  if (!doctor) redirect(`/${locale}/login`);

  const subscribed = await hasActiveSubscription(doctor.id);
  if (!subscribed) redirect(`/${locale}/subscribe`);

  const [posts, followerCount, ratingStats, stories] = await Promise.all([
    getDoctorPosts(doctor.id),
    getDoctorFollowerCount(doctor.id),
    getDoctorRatingStats(doctor.id),
    getDoctorOwnStories(),
  ]);

  return (
    <DashboardLayout locale={locale} role="doctor" doctorSpecialty={doctor.specialty.name} doctorLogoUrl={doctor.logoUrl} recurringPatientsEnabled={doctor.recurringPatientsEnabled ?? true}>
      <div className="p-4 lg:p-6 max-w-2xl space-y-5">
        <DoctorPublishHub
          locale={locale}
          posts={posts}
          doctor={{
            name: doctor.name,
            nameAr: doctor.nameAr,
            bio: doctor.bio,
            bioAr: doctor.bioAr,
            logoUrl: doctor.logoUrl,
            specialtyId: doctor.specialtyId,
            specialtyAr: doctor.specialty.nameAr,
            specialtyEn: doctor.specialty.name,
            experienceYears: doctor.experienceYears,
          }}
          followerCount={followerCount}
          ratingStats={ratingStats}
          stories={stories}
        />
      </div>
    </DashboardLayout>
  );
}
