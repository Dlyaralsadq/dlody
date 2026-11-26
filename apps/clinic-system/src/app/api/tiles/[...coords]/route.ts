import { NextRequest, NextResponse } from "next/server";

/**
 * Universal tile proxy — all requests through tabibee.com (same-origin).
 * Works in WebView, Electron, and browser without CORS issues.
 *
 * Styles (?s= param):
 *   (default / auto) → OpenStreetMap  — richest dataset: buildings, POIs, Arabic names
 *   satellite        → ESRI World Imagery
 *   terrain          → ESRI World Topo Map
 *   labels           → ESRI Reference Overlay (for hybrid)
 *   esri             → ESRI World Street Map (alternative road map)
 *
 * OSM tile URL:  {z}/{x}/{y}  (standard Leaflet order)
 * ESRI tile URL: {z}/{y}/{x}  (row/col reversed — handled in switch below)
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
  let fetchHeaders: Record<string, string>;

  switch (style) {
    case "satellite":
      // ESRI World Imagery — high-res satellite photography
      // Note: ESRI uses {z}/{y}/{x} (row/col reversed)
      upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
      fetchHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "image/webp,image/png,image/jpeg,image/*",
        "Referer": "https://www.arcgis.com/",
      };
      break;

    case "terrain":
      // ESRI World Topo Map — topographic with hillshading
      upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`;
      fetchHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/webp,image/png,image/jpeg,image/*",
        "Referer": "https://www.arcgis.com/",
      };
      break;

    case "labels":
      // ESRI World Reference Overlay — transparent labels for hybrid mode
      upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/${z}/${y}/${x}`;
      fetchHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/webp,image/png,image/*",
        "Referer": "https://www.arcgis.com/",
      };
      break;

    case "esri":
      // ESRI World Street Map — alternative if OSM is unavailable
      upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`;
      fetchHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/webp,image/png,image/jpeg,image/*",
        "Referer": "https://www.arcgis.com/",
      };
      break;

    default: {
      // OpenStreetMap — DEFAULT — the world's most complete open map.
      // ✓ Building footprints at zoom 15+
      // ✓ Points of interest: pharmacies, hospitals, hotels, restaurants,
      //   banks, mosques, schools, shops, parks — at zoom 16+
      // ✓ Arabic street names and place labels
      // ✓ House / plot numbers
      // ✓ Used by Apple Maps (data), Meta/Facebook, Microsoft Bing, Snap, Grab, etc.
      // ✓ Free, no API key, zoom up to 19
      const sub = ["a", "b", "c"][Math.abs(parseInt(x) + parseInt(y)) % 3];
      upstreamUrl = `https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
      fetchHeaders = {
        "User-Agent": "tabibee.com map proxy (+https://tabibee.com)",
        "Accept": "image/png,image/*",
        "Referer": "https://tabibee.com/",
      };
      break;
    }
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: fetchHeaders,
      next: { revalidate: 86400 }, // cache tile 24 h
    });

    if (!upstream.ok) {
      // Fallback: OSM if any other provider fails
      if (style !== "auto") {
        const sub = ["a", "b", "c"][Math.abs(parseInt(x) + parseInt(y)) % 3];
        const osmUrl = `https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
        const fb = await fetch(osmUrl, {
          headers: { "User-Agent": "tabibee.com map proxy (+https://tabibee.com)" },
        });
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
