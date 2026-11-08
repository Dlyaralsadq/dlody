import { NextResponse } from "next/server";
import { localBoundary, osmRelationId } from "@/lib/iraqBoundaries";

type GeoJson = { type: string };
type NomHit = {
  display_name?: string;
  class?: string;
  type?: string;
  geojson?: GeoJson;
};

const cache = new Map<string, { geojson: GeoJson | null; exp: number }>();
let lastNominatimAt = 0;

function normalize(value: string): string {
  return value
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىی]/g, "ي")
    .replace(/[کك]/g, "ك")
    .replace(/[ً-ْ]/g, "")
    .replace(/^(محافظة|قضاء|ناحية|حي|بلدية|district|governorate|province|city)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function primaryName(displayName: string): string {
  return displayName.split(",")[0] ?? displayName;
}

function matchesArea(displayName: string, tokens: string[]): boolean {
  const primary = normalize(primaryName(displayName));
  if (!primary) return false;
  const words = new Set(primary.split(" ").filter(Boolean));
  return tokens.some((token) => {
    const name = normalize(token);
    if (name.length < 2) return false;
    if (primary === name || primary.includes(name)) return true;
    const nameWords = name.split(" ").filter((word) => word.length >= 2);
    return nameWords.length > 0 && nameWords.every((word) => words.has(word));
  });
}

function isAdminPolygon(hit: NomHit): hit is NomHit & { geojson: GeoJson } {
  const kind = hit.geojson?.type;
  return (
    hit.class === "boundary" &&
    hit.type === "administrative" &&
    (kind === "Polygon" || kind === "MultiPolygon")
  );
}

async function waitForNominatimSlot() {
  const wait = lastNominatimAt + 1100 - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastNominatimAt = Date.now();
}

async function searchNominatim(query: string): Promise<NomHit[]> {
  await waitForNominatimSlot();
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("polygon_geojson", "1");
  url.searchParams.set("polygon_threshold", "0");
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycodes", "iq");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "ClinicPlatform/1.0 (administrative area boundaries)",
      "Accept-Language": "ar,en",
    },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as NomHit[];
  return Array.isArray(data) ? data : [];
}

async function lookupOsmRelation(osmId: string): Promise<GeoJson | null> {
  await waitForNominatimSlot();
  const url = new URL("https://nominatim.openstreetmap.org/lookup");
  url.searchParams.set("osm_ids", osmId);
  url.searchParams.set("format", "json");
  url.searchParams.set("polygon_geojson", "1");
  url.searchParams.set("polygon_threshold", "0");
  const res = await fetch(url, {
    headers: {
      "User-Agent": "ClinicPlatform/1.0 (administrative area boundaries)",
      "Accept-Language": "ar,en",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as NomHit[];
  const hit = Array.isArray(data) ? data.find(isAdminPolygon) : undefined;
  return hit?.geojson ?? null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { queries?: unknown; match?: unknown; govId?: unknown; districtId?: unknown }
    | null;
  const govId = typeof body?.govId === "string" ? body.govId : "";
  const districtId = typeof body?.districtId === "string" ? body.districtId : "";
  const queries = Array.isArray(body?.queries)
    ? body.queries.filter((q): q is string => typeof q === "string" && q.trim().length > 0).slice(0, 4)
    : [];
  const match = Array.isArray(body?.match)
    ? body.match.filter((q): q is string => typeof q === "string" && q.trim().length > 0).slice(0, 6)
    : [];

  if (govId) {
    const local = localBoundary(govId, districtId || undefined);
    if (local) return NextResponse.json({ geojson: local });

    const osmId = osmRelationId(govId, districtId || undefined);
    if (osmId) {
      const key = `osm:${osmId}`;
      const cached = cache.get(key);
      if (cached && cached.exp > Date.now()) {
        return NextResponse.json({ geojson: cached.geojson });
      }
      try {
        const geojson = await lookupOsmRelation(osmId);
        if (geojson) {
          cache.set(key, { geojson, exp: Date.now() + 24 * 60 * 60 * 1000 });
          return NextResponse.json({ geojson });
        }
      } catch {
        // Fall through to a name search.
      }
    }
  }

  if (queries.length === 0 || match.length === 0) {
    return NextResponse.json({ geojson: null });
  }

  const key = `${match.join("|")}::${queries.join("|")}`;
  const cached = cache.get(key);
  if (cached && cached.exp > Date.now()) {
    return NextResponse.json({ geojson: cached.geojson });
  }

  for (const query of queries) {
    try {
      const hits = await searchNominatim(query);
      const hit = hits.find((item) => isAdminPolygon(item) && matchesArea(item.display_name ?? "", match));
      if (hit?.geojson) {
        cache.set(key, { geojson: hit.geojson, exp: Date.now() + 24 * 60 * 60 * 1000 });
        return NextResponse.json({ geojson: hit.geojson });
      }
    } catch {
      // Try the next wording of the same area.
    }
  }

  cache.set(key, { geojson: null, exp: Date.now() + 10 * 60 * 1000 });
  return NextResponse.json({ geojson: null });
}
