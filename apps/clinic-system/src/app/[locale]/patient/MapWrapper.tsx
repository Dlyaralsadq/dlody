"use client";

import dynamic from "next/dynamic";
import type { DoctorPin, FocusArea } from "./PatientMapView";

const PatientMapView = dynamic(() => import("./PatientMapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#060912]">
      <div className="flex flex-col items-center gap-3">
        <span className="h-10 w-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-white/40 text-sm">جاري تحميل الخريطة...</p>
      </div>
    </div>
  ),
});

export default function MapWrapper({
  doctors,
  locale,
  focusArea,
}: {
  doctors: DoctorPin[];
  locale: string;
  focusArea?: FocusArea | null;
}) {
  return <PatientMapView doctors={doctors} locale={locale} focusArea={focusArea} />;
}
