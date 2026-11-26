import { NextRequest, NextResponse } from "next/server";

/**
 * Universal tile proxy — all requests go through tabibee.com so WebView / Electron
 * never makes cross-origin image requests.
 *
 * All ESRI services are free-to-use for public display (ArcGIS Living Atlas ToS).
 * ESRI tile URLs use {z}/{y}/{x} order (row/column reversed vs Leaflet standard).
 *
 * Leaflet sends:  /api/tiles/{z}/{x}/{y}.png[?s=style]
 * Proxy extracts: z=zoom, x=col, y=row
 * ESRI needs:     tile/{z}/{row}/{col}  =  tile/{z}/{y}/{x}
 *
 * Styles:
 *   (none / ?s=auto)   → ESRI World Street Map  (modern, Google-Maps-like)
 *   ?s=satellite       → ESRI World Imagery      (satellite photography)
 *   ?s=terrain         → ESRI World Topo Map     (topographic + hillshading)
 *   ?s=labels          → ESRI Reference Overlay  (road/city labels for hybrid)
 *   ?s=osm             → OpenStreetMap            (fallback road map)
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

  const esriHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "image/webp,image/png,image/jpeg,image/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.arcgis.com/",
  };

  let upstreamUrl: string;

  switch (style) {
    case "satellite":
      // ESRI World Imagery — highest quality free satellite tiles
      upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
      break;

    case "terrain":
      // ESRI World Topo Map — topographic with hillshading
      upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`;
      break;

    case "labels":
      // ESRI World Reference Overlay — transparent labels for hybrid mode
      upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/${z}/${y}/${x}`;
      break;

    case "osm": {
      // OpenStreetMap — classic, always available fallback
      const sub = ["a", "b", "c"][Math.abs(parseInt(x) + parseInt(y)) % 3];
      upstreamUrl = `https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
      break;
    }

    default:
      // ESRI World Street Map — modern road map, Google-Maps quality, free
      upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`;
      break;
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: esriHeaders,
      next: { revalidate: 86400 }, // cache tile 24 h
    });

    if (!upstream.ok) {
      // If ESRI fails, fall back to OSM (always available)
      const sub = ["a", "b", "c"][Math.abs(parseInt(x) + parseInt(y)) % 3];
      const osmUrl = `https://${sub}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
      const osmFallback = await fetch(osmUrl, {
        headers: { "User-Agent": "tabibee.com map proxy (+https://tabibee.com)" },
      });
      if (osmFallback.ok) {
        const buf = await osmFallback.arrayBuffer();
        return new NextResponse(buf, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      return new NextResponse(null, { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();
    // ESRI returns JPEG for imagery/street; PNG for topo/overlay
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
