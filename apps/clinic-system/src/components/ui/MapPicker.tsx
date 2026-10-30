"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search } from "lucide-react";

interface MapPickerProps {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  onChange: (lat: number, lng: number, address: string) => void;
  locale?: string;
  autoLocate?: boolean;
}

export default function MapPicker({
  lat,
  lng,
  address,
  onChange,
  locale = "ar",
  autoLocate = false,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const [searchQuery, setSearchQuery] = useState(address ?? "");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(address ?? "");
  const ar = locale === "ar";

  const defaultLat = lat ?? 33.3152;
  const defaultLng = lng ?? 44.3661;

  onChangeRef.current = onChange;

  const emitChange = useCallback((newLat: number, newLng: number, addr: string) => {
    setCurrentAddress(addr);
    onChangeRef.current(newLat, newLng, addr);
  }, []);

  const reverseGeocode = useCallback(
    async (geoLat: number, geoLng: number): Promise<string> => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${geoLat}&lon=${geoLng}&format=json&accept-language=${locale}`
        );
        const data = await res.json();
        return data.display_name ?? `${geoLat.toFixed(5)}, ${geoLng.toFixed(5)}`;
      } catch {
        return `${geoLat.toFixed(5)}, ${geoLng.toFixed(5)}`;
      }
    },
    [locale]
  );

  const syncMarker = useCallback(
    async (newLat: number, newLng: number) => {
      mapInstance.current?.setView([newLat, newLng], mapInstance.current.getZoom() ?? 14);
      markerRef.current?.setLatLng([newLat, newLng]);
      const addr = await reverseGeocode(newLat, newLng);
      emitChange(newLat, newLng, addr);
    },
    [emitChange, reverseGeocode]
  );

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || mapInstance.current) return;
      if ((mapRef.current as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView([defaultLat, defaultLng], lat && lng ? 16 : 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

      if (cancelled) {
        map.remove();
        return;
      }

      markerRef.current = marker;
      mapInstance.current = map;

      const applyPosition = async (pLat: number, pLng: number) => {
        const addr = await reverseGeocode(pLat, pLng);
        if (cancelled) return;
        emitChange(pLat, pLng, addr);
      };

      if (lat != null && lng != null) {
        applyPosition(lat, lng);
      } else if (autoLocate && navigator.geolocation) {
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            marker.setLatLng([latitude, longitude]);
            map.setView([latitude, longitude], 16);
            applyPosition(latitude, longitude);
            setLocating(false);
          },
          () => setLocating(false),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }

      marker.on("dragend", async () => {
        const pos = marker.getLatLng();
        await applyPosition(pos.lat, pos.lng);
      });

      map.on("click", async (e: any) => {
        marker.setLatLng(e.latlng);
        await applyPosition(e.latlng.lat, e.latlng.lng);
      });
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await syncMarker(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&accept-language=${locale}`
      );
      const data = await res.json();
      if (data[0]) {
        const latNum = parseFloat(data[0].lat);
        const lngNum = parseFloat(data[0].lon);
        await syncMarker(latNum, lngNum);
        setSearchQuery(data[0].display_name);
      }
    } catch {
      /* ignore */
    }
    setSearching(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 start-3 my-auto h-4 w-4 text-white/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            dir="auto"
            placeholder={ar ? "ابحث عن موقع العيادة..." : "Search clinic location..."}
            className="form-input ps-9 pe-4 text-sm w-full"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-4 py-2 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors disabled:opacity-50"
        >
          {searching ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          {ar ? "بحث" : "Search"}
        </button>
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          className="flex items-center gap-1 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
          title={ar ? "استخدم موقعي الحالي" : "Use my current location"}
        >
          {locating ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            "📍"
          )}
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-white/8" style={{ height: "260px" }}>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
        <div className="absolute bottom-2 start-2 z-[1000] flex items-center gap-1.5 rounded-lg bg-[#0f1629]/90 backdrop-blur-sm border border-white/10 px-2.5 py-1.5">
          <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
          <p className="text-xs text-white/50 max-w-48 truncate">
            {currentAddress || (ar ? "اضغط على الخريطة لتحديد الموقع" : "Click map to set location")}
          </p>
        </div>
      </div>

      {currentAddress && (
        <p className="text-xs text-emerald-400/80 flex items-start gap-1.5">
          <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{ar ? "الموقع المحدد: " : "Selected: "}{currentAddress}</span>
        </p>
      )}
    </div>
  );
}
