import { NextRequest, NextResponse } from "next/server";

/**
 * Universal tile proxy — serves OSM, ESRI Imagery, ESRI Topo, and CartoDB labels
 * through the same origin so WebView / Electron never makes cross-origin image requests.
 *
 * URL patterns:
 *   /api/tiles/{z}/{x}/{y}.png            → OpenStreetMap (default)
 *   /api/tiles/{z}/{x}/{y}.png?s=satellite → ESRI World Imagery
 *   /api/tiles/{z}/{x}/{y}.png?s=terrain   → ESRI World Topo
 *   /api/tiles/{z}/{x}/{y}.png?s=labels    → CartoDB light labels (hybrid overlay)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ coords: string[] }> }
) {
  const { coords } = await params;

  if (coords.length < 3) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const [z, x, yPng] = coords;
  const y = yPng?.replace(/\.png$/i, "");
  const style = req.nextUrl.searchParams.get("s") ?? "auto";

  // Validate numeric values to prevent SSRF
  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const zoom = parseInt(z, 10);
  if (zoom < 0 || zoom > 21) {
    return new NextResponse("Bad request", { status: 400 });
  }

  let upstreamUrl: string;
  let upstreamHeaders: Record<string, string>;

  if (style === "satellite") {
    // ESRI World Imagery — tile URL uses {z}/{y}/{x} order (not {z}/{x}/{y})
    upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    upstreamHeaders = {
      "User-Agent": "Mozilla/5.0 tabibee.com tile proxy",
      "Referer": "https://tabibee.com/",
    };
  } else if (style === "terrain") {
    // ESRI World Topo Map — also {z}/{y}/{x} order
    upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`;
    upstreamHeaders = {
      "User-Agent": "Mozilla/5.0 tabibee.com tile proxy",
      "Referer": "https://tabibee.com/",
    };
  } else if (style === "labels") {
    // CartoDB light_only_labels — for hybrid overlay
    const sub = ["a", "b", "c", "d"][Math.abs(parseInt(x) + parseInt(y)) % 4];
    upstreamUrl = `https://${sub}.basemaps.cartocdn.com/light_only_labels/${z}/${x}/${y}.png`;
    upstreamHeaders = {
      "User-Agent": "Mozilla/5.0 tabibee.com tile proxy",
      "Referer": "https://tabibee.com/",
    };
  } else {
    // Default: OpenStreetMap
    const sub = ["a", "b", "c"][Math.abs(parseInt(x) + parseInt(y)) % 3];
    upstreamUrl = `https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
    upstreamHeaders = {
      "User-Agent": "tabibee.com map proxy (+https://tabibee.com)",
      "Referer": "https://tabibee.com/",
    };
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: upstreamHeaders,
      next: { revalidate: 86400 }, // cache tile for 24 h
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();

    // Detect content type — ESRI tiles may return JPEG
    const ct = upstream.headers.get("content-type") ?? "image/png";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
