import type { Metadata } from "next";
import PatientLayoutContent from "./components/PatientLayoutContent";
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

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <PatientLayoutContent>{children}</PatientLayoutContent>;
}