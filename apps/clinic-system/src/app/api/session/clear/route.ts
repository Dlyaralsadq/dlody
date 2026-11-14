import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/ar/login";
  return raw;
}

/** Clears a stale session outside of page render, where cookies() cannot be deleted. */
export function GET(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL(safeNext(url.searchParams.get("next")), url.origin));
  response.cookies.set(SESSION_COOKIE_NAME(), "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  });
  return response;
}
