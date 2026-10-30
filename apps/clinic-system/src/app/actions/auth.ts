"use server";

import { cookies } from "next/headers";
import { login, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const result = await login(username, password);

  if (result.success && result.session) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME(), result.session, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, role: result.role };
  }

  return { success: false, error: result.error };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME());
}
