import Link from "next/link";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import type { DoctorPin } from "./PatientMapView";

export default function PatientDoctorsStrip({
  doctors,
  locale,
}: {
  doctors: DoctorPin[];
  locale: string;
}) {
  const ar = locale === "ar";

  if (doctors.length === 0) return null;

  return (
    <div className="shrink-0 backdrop-blur-md z-10" style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg-root) 95%, transparent)" }}>
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <p className="text-xs font-semibold text-white/50">
          {ar ? "تصفّح الأطباء — الملف الشخصي والمنشورات" : "Browse doctors — profiles & posts"}
        </p>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide">
        {doctors.map((doc) => (
          <Link
            key={doc.id}
            href={`/${locale}/patient/doctor/${doc.id}`}
            className="shrink-0 flex flex-col items-center gap-1.5 w-[72px] group"
          >
            <DoctorAvatar
              logoUrl={doc.logoUrl}
              specialtyId={doc.specialtyId}
              size="md"
              round
              hasStory={doc.hasActiveStory}
              className="group-hover:ring-2 group-hover:ring-indigo-500/50 transition"
            />
            <span className="text-[10px] text-white/60 text-center line-clamp-2 leading-tight group-hover:text-white transition">
              {ar ? doc.nameAr : doc.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
