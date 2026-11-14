"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toggleFollowDoctor } from "@/app/actions/patientSocial";

export default function FollowButton({
  doctorId,
  locale,
  initialFollowing,
  followerCount,
}: {
  doctorId: string;
  locale: string;
  initialFollowing: boolean;
  followerCount: number;
}) {
  const ar = locale === "ar";
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(followerCount);
  const [busy, setBusy] = useState(false);

  async function handleToggle() {
    setBusy(true);
    const r = await toggleFollowDoctor(doctorId);
    if (r.success) {
      setFollowing(r.following);
      setCount((c) => (r.following ? c + 1 : Math.max(0, c - 1)));
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={busy}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
          following
            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-950/40 hover:opacity-90"
        }`}
      >
        {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
        {following ? (ar ? "إلغاء المتابعة" : "Unfollow") : ar ? "متابعة" : "Follow"}
      </button>
      <span className="text-xs text-white/40">
        {count} {ar ? "متابِع" : "followers"}
      </span>
    </div>
  );
}
