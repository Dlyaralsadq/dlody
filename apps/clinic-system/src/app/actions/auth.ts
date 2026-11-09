"use server";

import { redirect } from "next/navigation";
import {
  login,
  setSessionCookie,
  clearSession,
  decodeSessionToken,
  getAuthenticatedRedirectPath,
} from "@/lib/auth";
import { allowRateLimit, clearRateLimit, clientIp, loginKeys } from "@/lib/loginGuard";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function loginAction(formData: FormData) {
  const username = (formData.get("username") as string) ?? "";
  const password = (formData.get("password") as string) ?? "";
  const locale = ((formData.get("locale") as string) || "ar").trim();

  const keys = loginKeys(await clientIp(), username);
  const open =
    (await allowRateLimit(keys.ipKey, 20, LOGIN_WINDOW_MS, false)) &&
    (await allowRateLimit(keys.accountKey, 8, LOGIN_WINDOW_MS, false));
  if (!open) return { success: false as const, error: "rate_limited" };

  const result = await login(username, password);

  if (!result.success || !result.session) {
    await allowRateLimit(keys.ipKey, 20, LOGIN_WINDOW_MS, true);
    await allowRateLimit(keys.accountKey, 8, LOGIN_WINDOW_MS, true);
    return { success: false as const, error: result.error ?? "invalid_credentials" };
  }

  await clearRateLimit(keys.accountKey);

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
