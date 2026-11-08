import { requirePatient } from "@/lib/requirePatient";
import { getExploreFeed } from "@/app/actions/patientSocial";
import ExploreClient from "./ExploreClient";

export default async function PatientExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requirePatient(locale);
  const ar = locale === "ar";

  const { suggested, recent } = await getExploreFeed(session.userId);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-root)" }} dir={ar ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-10 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-root)" }}>
        <h1 className="text-lg font-black" style={{ color: "var(--text-1)" }}>
          {ar ? "استكشاف" : "Explore"}
        </h1>
      </header>

      <ExploreClient
        locale={locale}
        patientId={session.userId}
        suggested={suggested}
        recent={recent}
      />
    </div>
  );
}
