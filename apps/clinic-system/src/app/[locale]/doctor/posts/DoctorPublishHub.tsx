"use client";

import { useRef } from "react";
import DoctorPostsClient, { type DoctorPostsClientHandle } from "./DoctorPostsClient";
import DoctorStoryManager, { type DoctorStoryManagerHandle } from "@/components/doctor/DoctorStoryManager";
import PublishMenu from "./PublishMenu";
import type { DoctorRatingStats } from "@/app/actions/doctorRatings";
import type { DoctorStoryItem } from "@/app/actions/doctorStories";

interface PostRow {
  id: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  mediaType: string | null;
  createdAt: Date | string;
  _count: { likes: number; comments: number; savedBy: number };
}

type DoctorProfile = {
  name: string;
  nameAr: string;
  bio: string | null;
  bioAr: string | null;
  logoUrl: string | null;
  specialtyId: string;
  specialtyAr: string;
  specialtyEn: string;
  experienceYears: number | null;
};

export default function DoctorPublishHub({
  locale,
  posts,
  doctor,
  followerCount,
  ratingStats,
  stories,
}: {
  locale: string;
  posts: PostRow[];
  doctor: DoctorProfile;
  followerCount: number;
  ratingStats: DoctorRatingStats;
  stories: DoctorStoryItem[];
}) {
  const ar = locale === "ar";
  const postsRef = useRef<DoctorPostsClientHandle>(null);
  const storyRef = useRef<DoctorStoryManagerHandle>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white">{ar ? "المحتوى" : "Content"}</h1>
          <p className="text-xs text-white/40 mt-0.5">
            {ar ? "شارك منشوراً أو قصة مع مرضاك" : "Share a post or story with your patients"}
          </p>
        </div>
        <PublishMenu locale={locale} postsRef={postsRef} storyRef={storyRef} />
      </div>

      <DoctorStoryManager ref={storyRef} locale={locale} initialStories={stories} hideTrigger />
      <DoctorPostsClient
        ref={postsRef}
        locale={locale}
        posts={posts}
        doctor={doctor}
        followerCount={followerCount}
        ratingStats={ratingStats}
        hideTrigger
      />
    </div>
  );
}
