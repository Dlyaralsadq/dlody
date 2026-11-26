import { NextRequest, NextResponse } from "next/server";

/**
 * Universal tile proxy — routes all map tile requests through tabibee.com
 * so WebView / Electron never makes cross-origin image requests.
 *
 * URL patterns (all use standard Leaflet {z}/{x}/{y} order):
 *   /api/tiles/{z}/{x}/{y}.png            → CartoDB Voyager  (default, modern road map)
 *   /api/tiles/{z}/{x}/{y}.png?s=dark     → CartoDB Dark Matter
 *   /api/tiles/{z}/{x}/{y}.png?s=satellite → ESRI World Imagery (satellite)
 *   /api/tiles/{z}/{x}/{y}.png?s=terrain   → ESRI World Topo Map
 *   /api/tiles/{z}/{x}/{y}.png?s=labels    → CartoDB labels overlay (for hybrid)
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

  // Validate numeric to prevent SSRF
  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return new NextResponse("Bad request", { status: 400 });
  }
  const zoom = parseInt(z, 10);
  if (zoom < 0 || zoom > 21) {
    return new NextResponse("Bad request", { status: 400 });
  }

  let upstreamUrl: string;
  const baseHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Accept": "image/webp,image/png,image/*,*/*",
    "Referer": "https://tabibee.com/",
  };

  if (style === "satellite") {
    // ESRI World Imagery — tile URL uses {z}/{y}/{x} (row/col reversed vs Leaflet)
    upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  } else if (style === "terrain") {
    // ESRI World Topo Map — also {z}/{y}/{x}
    upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`;
  } else if (style === "labels") {
    // CartoDB light_only_labels for hybrid overlay
    const sub = ["a", "b", "c", "d"][Math.abs(parseInt(x) + parseInt(y)) % 4];
    upstreamUrl = `https://${sub}.basemaps.cartocdn.com/light_only_labels/${z}/${x}/${y}.png`;
  } else if (style === "dark") {
    // CartoDB Dark Matter — dark map matching app theme
    const sub = ["a", "b", "c", "d"][Math.abs(parseInt(x) + parseInt(y)) % 4];
    upstreamUrl = `https://${sub}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;
  } else {
    // Default: CartoDB Voyager — modern, clean, colorful road map
    const sub = ["a", "b", "c", "d"][Math.abs(parseInt(x) + parseInt(y)) % 4];
    upstreamUrl = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: baseHeaders,
      next: { revalidate: 86400 }, // cache tile 24 h on Railway CDN
    });

    if (!upstream.ok) {
      // If ESRI fails, fall back to CartoDB Voyager
      if (style === "satellite" || style === "terrain") {
        const sub = ["a", "b", "c", "d"][Math.abs(parseInt(x) + parseInt(y)) % 4];
        const fallback = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
        const fb = await fetch(fallback, { headers: baseHeaders });
        if (fb.ok) {
          const buf = await fb.arrayBuffer();
          return new NextResponse(buf, {
            status: 200,
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=3600",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      }
      return new NextResponse(null, { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();
    // ESRI returns JPEG; CartoDB returns PNG
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
