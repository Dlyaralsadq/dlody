/** Shared Leaflet loader + tile CDN hints for faster map startup. */

import { getMapPreconnectHosts } from "@/lib/leafletTiles";

let leafletPromise: Promise<typeof import("leaflet")> | null = null;

export function preloadLeaflet(): Promise<typeof import("leaflet")> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("leaflet is client-only"));
  }
  if (!leafletPromise) {
    // leaflet/dist/leaflet.css is imported statically in globals.css
    leafletPromise = import("leaflet").then((L) => L);
  }
  return leafletPromise;
}

const PRECONNECTED = new Set<string>();

export function preloadMapTileHosts(locale = "ar"): void {
  if (typeof document === "undefined") return;

  const hosts = getMapPreconnectHosts(locale);

  for (const href of hosts) {
    if (PRECONNECTED.has(href)) continue;
    PRECONNECTED.add(href);

    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = href;
    preconnect.crossOrigin = "anonymous";
    document.head.appendChild(preconnect);
  }
}

export async function loadLeafletMap() {
  return preloadLeaflet();
}
