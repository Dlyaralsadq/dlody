import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/translate
 * Body: { text: string, from?: string, to?: string }
 * Uses Google Translate unofficial endpoint — no API key required.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, from = "ar", to = "en" } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ translated: "" });
    }

    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", from);
    url.searchParams.set("tl", to);
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", text.trim());

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "translation_failed" }, { status: 502 });
    }

    const data = await res.json();

    // Google returns [[["translated","original",...],...],...]
    const translated: string = data[0]
      ?.map((chunk: [string]) => chunk[0])
      .join("") ?? "";

    return NextResponse.json({ translated: translated.trim() });
  } catch {
    return NextResponse.json({ error: "translation_failed" }, { status: 500 });
  }
}
