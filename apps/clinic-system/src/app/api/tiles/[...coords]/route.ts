import { NextRequest, NextResponse } from "next/server";

/**
 * Universal tile proxy — routes all map requests through tabibee.com.
 * Works in WebView, Electron, and browser with no CORS issues.
 * Mapbox token stays server-side (never exposed to client).
 *
 * Styles:
 *   (default)   → Mapbox Streets v12   — world-class road map with full POIs & buildings
 *   satellite   → Mapbox Satellite v9  — pure satellite imagery
 *   hybrid      → Mapbox Satellite Streets v12 — best hybrid (satellite + labels + POIs)
 *   terrain     → Mapbox Outdoors v12  — terrain / topographic style
 *   osm         → OpenStreetMap        — fallback if Mapbox token missing
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

  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return new NextResponse("Bad request", { status: 400 });
  }
  const zoom = parseInt(z, 10);
  if (zoom < 0 || zoom > 22) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

  // If no Mapbox token → fall back to OSM for road map / ESRI for others
  if (!MAPBOX_TOKEN) {
    return serveFallback(style, z, x, y);
  }

  // Mapbox style → style ID mapping
  const mapboxStyleId: Record<string, string> = {
    auto:      "mapbox/streets-v12",
    satellite: "mapbox/satellite-v9",
    hybrid:    "mapbox/satellite-streets-v12",
    terrain:   "mapbox/outdoors-v12",
  };

  const styleId = mapboxStyleId[style] ?? mapboxStyleId.auto;

  // Mapbox raster tile URL — 256px tiles work with Leaflet
  // High-DPI (@2x) tiles look sharper on retina screens
  const upstreamUrl =
    `https://api.mapbox.com/styles/v1/${styleId}/tiles/256/${z}/${x}/${y}` +
    `?access_token=${MAPBOX_TOKEN}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; tabibee.com map proxy)",
        "Accept": "image/webp,image/png,image/jpeg,image/*",
        "Referer": "https://tabibee.com/",
      },
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      // Mapbox returned an error — fall back gracefully
      return serveFallback(style, z, x, y);
    }

    const buffer = await upstream.arrayBuffer();
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
    return serveFallback(style, z, x, y);
  }
}

/** Fallback tiles when Mapbox token is missing or request fails */
async function serveFallback(
  style: string,
  z: string,
  x: string,
  y: string
): Promise<NextResponse> {
  let upstreamUrl: string;
  let headers: Record<string, string> = {
    "User-Agent": "tabibee.com map proxy (+https://tabibee.com)",
    "Accept": "image/png,image/*",
  };

  if (style === "satellite") {
    upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "image/webp,image/png,image/jpeg,image/*",
      "Referer": "https://www.arcgis.com/",
    };
  } else if (style === "terrain") {
    upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`;
    headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "image/webp,image/png,image/jpeg,image/*",
      "Referer": "https://www.arcgis.com/",
    };
  } else {
    // Default / hybrid → OSM
    const sub = ["a", "b", "c"][Math.abs(parseInt(x) + parseInt(y)) % 3];
    upstreamUrl = `https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }

  try {
    const res = await fetch(upstreamUrl, { headers });
    if (!res.ok) return new NextResponse(null, { status: res.status });
    const buf = await res.arrayBuffer();
    const ct = res.headers.get("content-type") ?? "image/png";
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
