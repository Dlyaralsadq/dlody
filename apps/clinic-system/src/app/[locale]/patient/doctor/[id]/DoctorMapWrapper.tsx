"use client";

import dynamic from "next/dynamic";

const DoctorLocationMap = dynamic(() => import("./DoctorLocationMap"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center"
      style={{ height: 240 }}
    >
      <span className="text-white/30 text-sm">جاري تحميل الخريطة...</span>
    </div>
  ),
});

export default function DoctorMapWrapper({
  lat,
  lng,
  name,
  locale,
}: {
  lat: number;
  lng: number;
  name: string;
  locale: string;
}) {
  return <DoctorLocationMap lat={lat} lng={lng} name={name} locale={locale} />;
}
