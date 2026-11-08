import { requirePatient } from "@/lib/requirePatient";
import { getPatientHomeFeed } from "@/app/actions/patientSocial";
import { getPatientStoryStrip } from "@/app/actions/doctorStories";
import PostCard from "../components/PostCard";
import DoctorStoriesRow from "../components/DoctorStoriesRow";
import Link from "next/link";
import { Sparkles, Users } from "lucide-react";

export default async function PatientUpdatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requirePatient(locale);
  const ar = locale === "ar";

  const [feed, storyDoctors] = await Promise.all([
    getPatientHomeFeed(session.userId),
    getPatientStoryStrip(session.userId),
  ]);

  const hasFollowing = feed.followingPosts.length > 0;
  const hasSuggested = feed.suggestedPosts.length > 0;
  const isEmpty = !hasFollowing && !hasSuggested;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-root)" }} dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 backdrop-blur-xl"
        style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg-root) 92%, transparent)" }}>
        <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--text-1)" }}>{ar ? "طبيبي" : "Tabibee"}</h1>
      </header>

      <DoctorStoriesRow doctors={storyDoctors} locale={locale} />

      <div className="mx-auto max-w-lg">
        {isEmpty ? (
          <div className="px-4 py-20 text-center">
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              {ar ? "لا منشورات بعد" : "No posts yet"}
            </p>
            <Link
              href={`/${locale}/patient/explore`}
              className="inline-block mt-4 text-sm font-semibold text-indigo-400"
            >
              {ar ? "استكشف المنشورات" : "Explore posts"}
            </Link>
          </div>
        ) : (
          <>
            {hasFollowing && (
              <>
                {/* subtle section label */}
                <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                  <Users size={12} className="text-emerald-400/70 shrink-0" />
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>
                    {ar ? "من الأطباء الذين تتابعهم" : "From doctors you follow"}
                  </span>
                </div>
                {feed.followingPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    locale={locale}
                    patientId={session.userId}
                    showFollowButton={false}
                  />
                ))}
              </>
            )}

            {feed.showSuggestedSection && hasSuggested && (
              <>
                <div className="flex items-center gap-2 px-4 pt-5 pb-2">
                  <Sparkles size={12} className="text-indigo-400/70 shrink-0" />
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>
                    {ar ? "قد يعجبك أيضاً" : "You might also like"}
                  </span>
                </div>
                {feed.suggestedPosts.map((post) => (
                  <PostCard
                    key={`s-${post.id}`}
                    post={post}
                    locale={locale}
                    patientId={session.userId}
                    showFollowButton={!post.isFollowingDoctor}
                  />
                ))}
              </>
            )}

            {feed.showSuggestedOnly && (
              <>
                {hasSuggested && (
                  <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                    <Sparkles size={12} className="text-indigo-400/70 shrink-0" />
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-3)" }}>
                      {ar ? "مقترحة لك" : "Suggested for you"}
                    </span>
                  </div>
                )}
                {feed.suggestedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    locale={locale}
                    patientId={session.userId}
                    showFollowButton={!post.isFollowingDoctor}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
