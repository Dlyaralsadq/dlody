import { requirePatient } from "@/lib/requirePatient";
import { getSavedPosts } from "@/app/actions/patientSocial";
import PostCard from "../components/PostCard";

export default async function PatientSavedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requirePatient(locale);
  const ar = locale === "ar";

  const posts = await getSavedPosts(session.userId);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-root)" }} dir={ar ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-10 backdrop-blur-md px-4 py-3" style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg-root) 92%, transparent)" }}>
        <h1 className="text-lg font-black" style={{ color: "var(--text-1)" }}>{ar ? "المحفوظات" : "Saved"}</h1>
      </header>

      <div className="mx-auto max-w-lg divide-y" style={{ borderColor: "var(--border)" }}>
        {posts.length === 0 ? (
          <p className="text-center text-sm text-white/30 py-20 px-4">
            {ar ? "لا منشورات محفوظة بعد" : "No saved posts yet"}
          </p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              locale={locale}
              patientId={session.userId}
              showFollowButton={false}
            />
          ))
        )}
      </div>
    </div>
  );
}
