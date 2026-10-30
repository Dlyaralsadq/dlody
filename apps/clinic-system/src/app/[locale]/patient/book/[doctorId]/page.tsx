import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublicDoctorById } from "@/lib/publicDoctors";
import { getSpecialtyIcon } from "@/lib/iraq";
import { requirePatient } from "@/lib/requirePatient";
import { getPatientProfile, calcAge } from "@/app/actions/patientAuth";
import BookingForm from "./BookingForm";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string; doctorId: string }>;
}) {
  const { locale, doctorId } = await params;
  const ar = locale === "ar";
  const session = await requirePatient(locale);
  const doctor = await getPublicDoctorById(doctorId);
  if (!doctor) notFound();

  const user = await getPatientProfile(session.userId);
  const profile = {
    name: user?.name ?? session.name,
    phone: user?.username ?? session.username,
    gender: user?.gender ?? null,
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
    bloodType: user?.bloodType ?? null,
    age: calcAge(user?.dateOfBirth),
  };

  const icon = getSpecialtyIcon(doctor.specialtyId ?? "");

  return (
    <div className="min-h-screen bg-[#060912]" dir={ar ? "rtl" : "ltr"}>
      <nav className="relative z-10 flex items-center justify-between px-4 py-4 border-b border-white/5 sticky top-0 bg-[#060912]/80 backdrop-blur-md">
        <Link href={`/${locale}/patient/doctor/${doctorId}`} className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80">
          <ArrowRight size={16} className={ar ? "" : "rotate-180"} />
          {ar ? "العودة" : "Back"}
        </Link>
      </nav>

      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-7 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600/80 to-violet-700/80 text-3xl mb-4">{icon}</div>
          <h1 className="text-xl font-black text-white">{ar ? "حجز موعد" : "Book appointment"}</h1>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <BookingForm
            doctorId={doctorId}
            doctorName={doctor.name}
            doctorNameAr={doctor.nameAr}
            specialtyAr={doctor.specialty.nameAr}
            specialtyEn={doctor.specialty.name}
            locale={locale}
            profile={profile}
          />
        </div>
      </div>
    </div>
  );
}
