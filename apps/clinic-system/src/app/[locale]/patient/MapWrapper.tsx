"use client";

import dynamic from "next/dynamic";
import type { DoctorPin, FocusArea } from "./PatientMapView";

/** Lazily load the GL map so maplibre-gl only ships to browsers that need it */
const PatientMapView = dynamic(() => import("./PatientMapView"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#0c1121] animate-pulse" aria-hidden />
  ),
});

export default function MapWrapper({
  doctors,
  locale,
  focusArea,
  mapFilters,
  hasFilter,
}: {
  doctors: DoctorPin[];
  locale: string;
  focusArea?: FocusArea | null;
  mapFilters?: { specialty?: string; gov?: string; district?: string; q?: string };
  hasFilter?: boolean;
}) {
  return (
    <PatientMapView
      doctors={doctors}
      locale={locale}
      focusArea={focusArea}
      mapFilters={mapFilters}
      hasFilter={hasFilter}
    />
  );
}
