"use server";

import { redirect } from "next/navigation";
import {
  login,
  setSessionCookie,
  clearSession,
  decodeSessionToken,
  getAuthenticatedRedirectPath,
} from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const username = (formData.get("username") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const locale = ((formData.get("locale") as string) || "ar").trim();

  const result = await login(username, password);

  if (!result.success || !result.session) {
    return { success: false as const, error: result.error ?? "invalid_credentials" };
  }

  const session = decodeSessionToken(result.session);
  if (!session) {
    return { success: false as const, error: "invalid_credentials" };
  }

  if (!session.isActive && session.role !== "admin") {
    return { success: false as const, error: "suspended" };
  }

  const dest = await getAuthenticatedRedirectPath(session, locale);
  if (!dest) {
    await clearSession();
    return { success: false as const, error: "account_incomplete" };
  }

  await setSessionCookie(result.session);
  redirect(dest);
}

export async function logoutAction() {
  await clearSession();
}
