"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { preloadLeaflet, preloadMapTileHosts } from "@/lib/leafletLoader";
import type { DoctorPin, FocusArea } from "./PatientMapView";

if (typeof window !== "undefined") {
  preloadMapTileHosts("ar");
  void preloadLeaflet();
}

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
  useEffect(() => {
    preloadMapTileHosts(locale);
    void preloadLeaflet();
  }, [locale]);

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
