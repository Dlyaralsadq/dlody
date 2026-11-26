import { NextRequest, NextResponse } from "next/server";

/**
 * Universal tile proxy — routes ALL map requests through tabibee.com.
 *
 * Works in every environment: browser, Android WebView, desktop PWA.
 * No cross-origin tile requests → no CORS blocking → no white screen.
 *
 * Google Maps lyrs codes (pass as ?s=):
 *   m  → roadmap with POIs, street names (supports &hl=ar / &hl=en)
 *   s  → satellite imagery
 *   y  → hybrid (satellite + labels)
 *   p  → terrain / topographic
 *   h  → labels-only overlay
 *
 * Legacy ESRI codes still accepted as fallback (?s=auto, satellite, terrain).
 */

const GOOGLE_LYRS = new Set(["m", "s", "y", "p", "h", "t"]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ coords: string[] }> }
) {
  const { coords } = await params;
  if (coords.length < 3) return new NextResponse("Bad request", { status: 400 });

  const [z, x, yPng] = coords;
  const y = yPng?.replace(/\.png$/i, "");
  const style = req.nextUrl.searchParams.get("s") ?? "m";
  const hl    = req.nextUrl.searchParams.get("hl") ?? "ar";

  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y))
    return new NextResponse("Bad request", { status: 400 });
  const zoom = parseInt(z, 10);
  if (zoom < 0 || zoom > 22) return new NextResponse("Bad request", { status: 400 });

  // ── Google Maps tiles ─────────────────────────────────────────────────────
  if (GOOGLE_LYRS.has(style)) {
    const sub = (parseInt(x) + parseInt(y)) % 4;
    const upstreamUrl =
      `https://mt${sub}.google.com/vt/lyrs=${style}&hl=${hl}&gl=IQ` +
      `&x=${x}&y=${y}&z=${z}&scale=1`;

    try {
      const res = await fetch(upstreamUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept": "image/webp,image/png,image/jpeg,image/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://www.google.com/maps/",
          "Origin": "https://www.google.com",
        },
        next: { revalidate: 86400 },
      });

      if (res.ok) {
        const buf = await res.arrayBuffer();
        const ct  = res.headers.get("content-type") ?? "image/png";
        return new NextResponse(buf, {
          status: 200,
          headers: {
            "Content-Type": ct,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch { /* fall through to ESRI fallback */ }

    // Google failed → ESRI World Street Map as fallback
    return serveEsri("auto", z, x, y);
  }

  // ── ESRI / OSM fallback styles ────────────────────────────────────────────
  if (style === "satellite") return serveEsri("satellite", z, x, y);
  if (style === "terrain")   return serveEsri("terrain",   z, x, y);
  if (style === "osm")       return serveOsm(x, y, z);

  // default (auto / unknown) → try Google roadmap first
  const sub = (parseInt(x) + parseInt(y)) % 4;
  try {
    const res = await fetch(
      `https://mt${sub}.google.com/vt/lyrs=m&hl=${hl}&gl=IQ&x=${x}&y=${y}&z=${z}&scale=1`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept": "image/webp,image/png,image/jpeg,image/*",
          "Referer": "https://www.google.com/maps/",
          "Origin": "https://www.google.com",
        },
        next: { revalidate: 86400 },
      }
    );
    if (res.ok) {
      const buf = await res.arrayBuffer();
      const ct  = res.headers.get("content-type") ?? "image/png";
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": ct,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  } catch { /* fall through */ }

  return serveEsri("auto", z, x, y);
}

// ── ESRI helper ───────────────────────────────────────────────────────────────

async function serveEsri(
  style: "auto" | "satellite" | "terrain",
  z: string, x: string, y: string
): Promise<NextResponse> {
  const urlMap = {
    auto:      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`,
    satellite: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    terrain:   `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`,
  };
  try {
    const res = await fetch(urlMap[style], {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "image/webp,image/png,image/jpeg,image/*",
        "Referer": "https://www.arcgis.com/",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return serveOsm(x, y, z);
    const buf = await res.arrayBuffer();
    const ct  = res.headers.get("content-type") ?? "image/png";
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return serveOsm(x, y, z);
  }
}

// ── OSM last-resort fallback ──────────────────────────────────────────────────

async function serveOsm(x: string, y: string, z: string): Promise<NextResponse> {
  const sub = ["a", "b", "c"][Math.abs(parseInt(x) + parseInt(y)) % 3];
  try {
    const res = await fetch(`https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`, {
      headers: { "User-Agent": "tabibee.com map proxy (+https://tabibee.com)" },
    });
    if (!res.ok) return new NextResponse(null, { status: res.status });
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
