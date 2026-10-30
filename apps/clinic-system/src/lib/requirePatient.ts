import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requirePatient(locale: string) {
  const session = await getSession();
  if (!session || session.role !== "patient") {
    redirect(`/${locale}/patient/login`);
  }
  return session;
}

export function calcAge(dateOfBirth: Date | string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
