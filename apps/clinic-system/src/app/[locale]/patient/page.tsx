import Link from "next/link";
import { requirePatient } from "@/lib/requirePatient";
import { getPublicSpecialties } from "@/lib/publicDoctors";
import { IRAQ_GOVERNORATES, getGovernorate, getDistrict } from "@/lib/iraq";
import MapWrapper from "./MapWrapper";
import FilterBar from "./FilterBar";
import { fetchMapDoctorPins } from "@/app/actions/patientMap";
import type { FocusArea } from "./PatientMapView";
import { PATIENT_NAV_INSET } from "@/lib/patientUi";

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

  // Only fetch doctor pins when at least one filter is active.
  // When nothing is selected the map stays empty (clean / not cluttered).
  const hasFilter = !!(specialty || gov || district || q);

  const [specialties, doctors] = await Promise.all([
    getPublicSpecialties(),
    hasFilter
      ? fetchMapDoctorPins({ specialty, gov, district, q })
      : Promise.resolve([]),
  ]);

  // Compute focusArea: district > governorate > Iraq center
  // Zoom is calculated from radiusKm so small districts aren't over-zoomed out
  // and large districts aren't under-zoomed in.
  function zoomFromRadius(km: number): number {
    if (km <= 5)  return 14;
    if (km <= 8)  return 13;
    if (km <= 15) return 12;
    if (km <= 25) return 11;
    if (km <= 40) return 10;
    return 9;
  }

  const unique = (items: Array<string | undefined>) =>
    [...new Set(items.filter((item): item is string => !!item))];

  let focusArea: FocusArea | null = null;
  if (district && gov) {
    const d = getDistrict(gov, district);
    const g = getGovernorate(gov);
    if (d && g) {
      focusArea = {
        lat: d.lat, lng: d.lng,
        zoom: zoomFromRadius(d.radiusKm),
        radiusKm: d.radiusKm,
        label: ar ? d.ar : d.en,
        govId: gov,
        districtId: district,
        matchNames: [d.ar, d.en],
        searchQueries: unique([
          d.nominatimAr,
          d.nominatimEn,
          `قضاء ${d.ar}، محافظة ${g.ar}، العراق`,
          `ناحية ${d.ar}، محافظة ${g.ar}، العراق`,
          `حي ${d.ar}، ${g.ar}، العراق`,
          `${d.en} District, ${g.en} Governorate, Iraq`,
          `${d.en}, ${g.en}, Iraq`,
        ]),
      };
    }
  } else if (gov) {
    const g = getGovernorate(gov);
    if (g) {
      focusArea = {
        lat: g.lat, lng: g.lng,
        zoom: 9,
        radiusKm: 50,
        label: ar ? g.ar : g.en,
        govId: gov,
        matchNames: [g.ar, g.en],
        searchQueries: unique([
          `محافظة ${g.ar}، العراق`,
          `${g.en} Governorate, Iraq`,
          `${g.ar}، العراق`,
          `${g.en}, Iraq`,
        ]),
      };
    }
  }

  return (
    <div className="map-page-root flex flex-col overflow-hidden" style={{ background: "var(--bg-root)" }} dir={ar ? "rtl" : "ltr"}>

      {/* ── Top nav ── */}
      <nav className="shrink-0 flex items-center justify-between px-4 py-3 backdrop-blur-md z-10" style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg-root) 90%, transparent)" }}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-base shadow-lg shadow-indigo-950/60">
            🏥
          </div>
          <span className="font-black text-white text-base">{ar ? "الخريطة" : "Map"}</span>
        </div>
        <Link href={`/${otherLocale}/patient`}
          className="text-xs px-2.5 py-1.5 rounded-full border border-white/10 text-white/40 hover:text-white/70 transition">
          {ar ? "EN" : "AR"}
        </Link>
      </nav>

      {/* ── Cascading filter bar (client component) ── */}
      <FilterBar
        specialties={specialties}
        locale={locale}
        initial={{ specialty: specialty ?? "", gov: gov ?? "", district: district ?? "", q: q ?? "" }}
      />

      {/* ── Map — leave room for bottom nav (64px) ── */}
      <div className={`flex-1 relative min-h-0 ${PATIENT_NAV_INSET}`}>
        <MapWrapper
          doctors={doctors}
          locale={locale}
          focusArea={focusArea}
          mapFilters={{ specialty, gov, district, q }}
          hasFilter={hasFilter}
        />
      </div>
    </div>
  );
}
