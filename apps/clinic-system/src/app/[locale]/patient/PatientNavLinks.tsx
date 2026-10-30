import Link from "next/link";
import { getSession } from "@/lib/auth";
import { User, LogIn } from "lucide-react";

export default async function PatientNavLinks({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const session = await getSession();

  if (session?.role === "patient") {
    return (
      <Link
        href={`/${locale}/patient/account`}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition"
      >
        <User size={13} />
        {ar ? "حسابي" : "My account"}
      </Link>
    );
  }

  return (
    <Link
      href={`/${locale}/patient/login`}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition"
    >
      <LogIn size={13} />
      {ar ? "دخول" : "Sign in"}
    </Link>
  );
}
