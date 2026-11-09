import type { Metadata } from "next";
import PatientLayoutContent from "./components/PatientLayoutContent";
import { getSession } from "@/lib/auth";
import { recordPlatformVisit } from "@/lib/visits";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ar = locale === "ar";
  return {
    title: ar ? "طبيبي — المريض" : "Tabibee — Patient",
    description: ar
      ? "تابع أطباءك، اكتشف منشورات طبية، واحجز موعدك"
      : "Follow doctors, discover medical posts, and book appointments",
  };
}

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.role === "patient") {
    await recordPlatformVisit(session.userId);
  }
  return <PatientLayoutContent>{children}</PatientLayoutContent>;
}