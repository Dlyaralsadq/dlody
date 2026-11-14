"use client";

import { useState } from "react";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import StoryViewer from "./StoryViewer";
import type { StoryFeedDoctor } from "@/app/actions/doctorStories";

export default function DoctorStoriesRow({
  doctors,
  locale,
}: {
  doctors: StoryFeedDoctor[];
  locale: string;
}) {
  const ar = locale === "ar";
  const [viewerDoctor, setViewerDoctor] = useState<StoryFeedDoctor | null>(null);

  if (doctors.length === 0) return null;

  return (
    <>
      <div className="border-b border-white/5 px-3 py-3 overflow-x-auto overscroll-x-contain">
        <div className="flex gap-4 min-w-min">
          {doctors.map((doc) => {
            const label = (ar ? doc.nameAr : doc.name).split(" ").slice(-1)[0];
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setViewerDoctor(doc)}
                className="flex flex-col items-center gap-1.5 w-[68px] shrink-0"
              >
                <DoctorAvatar
                  logoUrl={doc.logoUrl}
                  specialtyId={doc.specialtyId}
                  size="md"
                  round
                  hasStory
                />
                <span className="text-[10px] text-white/60 text-center line-clamp-2 leading-tight w-full">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {viewerDoctor && (
        <StoryViewer
          doctor={viewerDoctor}
          locale={locale}
          onClose={() => setViewerDoctor(null)}
        />
      )}
    </>
  );
}
