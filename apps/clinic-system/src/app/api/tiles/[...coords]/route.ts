import { NextRequest, NextResponse } from "next/server";

// Proxy OSM tiles through our own domain so WebView / Electron never makes
// cross-origin image requests (which are blocked in some WebView configs).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ coords: string[] }> }
) {
  const { coords } = await params;

  if (coords.length < 3) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const [z, x, yPng] = coords;
  const y = yPng?.replace(/\.png$/i, "");

  // Validate numeric values to prevent SSRF
  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const zoom = parseInt(z, 10);
  if (zoom < 0 || zoom > 21) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const sub = ["a", "b", "c"][Math.abs(parseInt(x) + parseInt(y)) % 3];
  const url = `https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "tabibee.com map proxy (+https://tabibee.com)",
        "Referer": "https://tabibee.com/",
      },
      next: { revalidate: 86400 }, // cache tile for 24h
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
