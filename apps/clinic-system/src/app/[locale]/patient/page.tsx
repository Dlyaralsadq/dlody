import Link from "next/link";
import { Home } from "lucide-react";
import { requirePatient } from "@/lib/requirePatient";
import { getPublicSpecialties, getListedDoctors } from "@/lib/publicDoctors";
import { IRAQ_GOVERNORATES, getGovernorate, getDistrict, getSpecialtyIcon, inferGovFromAddress } from "@/lib/iraq";
import MapWrapper from "./MapWrapper";
import FilterBar from "./FilterBar";
import PatientNavLinks from "./PatientNavLinks";
import type { DoctorPin, FocusArea } from "./PatientMapView";

export default async function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ specialty?: string; gov?: string; district?: string; q?: string }>;
}) {
  const { locale } = await params;
  await requirePatient(locale);
  const { specialty, gov, district, q } = await searchParams;
  const ar = locale === "ar";
  const otherLocale = ar ? "en" : "ar";

  const [specialties, rawDoctors] = await Promise.all([
    getPublicSpecialties(),
    getListedDoctors({ specialtyId: specialty, governorate: gov, district, query: q }),
  ]);

  // Build doctor pins
  const doctors: DoctorPin[] = rawDoctors.map((doc) => {
    const govInfo = inferGovFromAddress(doc.clinicAddress ?? "");
    return {
      id: doc.id,
      nameAr: doc.nameAr,
      name: doc.name,
      specialtyId: doc.specialtyId,
      specialtyAr: doc.specialty.nameAr,
      specialtyEn: doc.specialty.name,
      lat: doc.clinicLat ?? null,
      lng: doc.clinicLng ?? null,
      govLat: govInfo?.lat ?? 33.2,
      govLng: govInfo?.lng ?? 44.0,
      clinicAddress: doc.clinicAddress,
      phone: doc.phone,
      consultationFee: doc.consultationFee,
      workingHoursStart: doc.workingHoursStart,
      workingHoursEnd: doc.workingHoursEnd,
      specialtyIcon: getSpecialtyIcon(doc.specialtyId),
    };
  });

  // Compute focusArea: district > governorate > Iraq center
  let focusArea: FocusArea | null = null;
  if (district && gov) {
    const d = getDistrict(gov, district);
    if (d) {
      focusArea = {
        lat: d.lat, lng: d.lng,
        zoom: 12,
        radiusKm: d.radiusKm,
        label: ar ? d.ar : d.en,
      };
    }
  } else if (gov) {
    const g = getGovernorate(gov);
    if (g) {
      focusArea = { lat: g.lat, lng: g.lng, zoom: 10, radiusKm: 40, label: ar ? g.ar : g.en };
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#060912] overflow-hidden" dir={ar ? "rtl" : "ltr"}>

      {/* ── Top nav ── */}
      <nav className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#060912]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-base shadow-lg shadow-indigo-950/60">
            🏥
          </div>
          <span className="font-black text-white text-base">ClinicPro</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${otherLocale}/patient`}
            className="text-xs px-2.5 py-1.5 rounded-full border border-white/10 text-white/40 hover:text-white/70 transition">
            {ar ? "EN" : "AR"}
          </Link>
          <PatientNavLinks locale={locale} />
          <Link href={`/${locale}`}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/8 transition">
            <Home size={13} />
            {ar ? "الرئيسية" : "Home"}
          </Link>
        </div>
      </nav>

      {/* ── Cascading filter bar (client component) ── */}
      <FilterBar
        specialties={specialties}
        locale={locale}
        initial={{ specialty: specialty ?? "", gov: gov ?? "", district: district ?? "", q: q ?? "" }}
      />

      {/* ── Map ── */}
      <div className="flex-1 relative min-h-0">
        <MapWrapper doctors={doctors} locale={locale} focusArea={focusArea} />
      </div>
    </div>
  );
}
