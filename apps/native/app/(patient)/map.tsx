/**
 * Patient Map screen – interactive Leaflet.js map via WebView
 * Shows doctor pins on Iraq map with dark CartoDB tiles
 */
import { useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  Pressable, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Colors, Typography, Spacing } from "@/theme";
import { getMapPins } from "@/api/patient";
import type { MapPin } from "@/api/patient";
import { Avatar } from "@/components/ui";

/** Build the full Leaflet HTML page (injected into WebView) */
function buildLeafletHTML(pins: MapPin[]): string {
  const pinsJson = JSON.stringify(
    pins.map((p) => ({
      id:          p.id,
      nameAr:      p.nameAr,
      specialtyAr: p.specialtyAr ?? "",
      address:     p.clinicAddress ?? "",
      lat:         p.lat ?? p.govLat,
      lng:         p.lng ?? p.govLng,
      logoUrl:     p.logoUrl ?? "",
      rating:      p.ratingAverage ?? 0,
    }))
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body,#map { width:100%; height:100%; background:#060912; }
    .custom-pin {
      width:40px; height:40px;
      border-radius:50%;
      border:2.5px solid #6366f1;
      overflow:hidden;
      background:#0d1127;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 0 10px rgba(99,102,241,0.6);
    }
    .custom-pin img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
    .custom-pin-fallback {
      font-size:16px; color:#a0abc8; font-weight:bold;
      font-family:Arial,sans-serif;
    }
    .leaflet-popup-content-wrapper {
      background:#0d1127; color:#f0f4ff;
      border:1px solid rgba(99,102,241,0.35);
      border-radius:12px; padding:0;
    }
    .leaflet-popup-tip { background:#0d1127; }
    .popup-inner { padding:12px 14px; min-width:160px; }
    .popup-name { font-weight:800; font-size:14px; margin-bottom:4px; }
    .popup-spec { font-size:12px; color:#818cf8; margin-bottom:4px; }
    .popup-addr { font-size:11px; color:#5a6584; }
    .popup-btn {
      margin-top:8px; display:block; width:100%;
      background:#6366f1; color:#fff;
      border:none; border-radius:8px;
      padding:7px 0; font-size:13px; font-weight:700;
      cursor:pointer; text-align:center;
    }
    .popup-btn:active { background:#4f46e5; }
  </style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var pins = ${pinsJson};

var map = L.map('map', {
  center: [33.3, 44.4],
  zoom: 6,
  zoomControl: true,
  attributionControl: false,
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  subdomains: 'abcd',
}).addTo(map);

pins.forEach(function(pin) {
  if (!pin.lat || !pin.lng) return;

  var iconHtml = pin.logoUrl
    ? '<div class="custom-pin"><img src="' + pin.logoUrl + '" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<span class=&quot;custom-pin-fallback&quot;>د</span>\'" /></div>'
    : '<div class="custom-pin"><span class="custom-pin-fallback">د</span></div>';

  var icon = L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  });

  var popupHtml = '<div class="popup-inner">' +
    '<div class="popup-name">' + pin.nameAr + '</div>' +
    (pin.specialtyAr ? '<div class="popup-spec">' + pin.specialtyAr + '</div>' : '') +
    (pin.address ? '<div class="popup-addr">📍 ' + pin.address + '</div>' : '') +
    '<button class="popup-btn" onclick="selectDoctor(\'' + pin.id + '\')">عرض الملف ←</button>' +
    '</div>';

  L.marker([pin.lat, pin.lng], { icon: icon })
    .bindPopup(popupHtml)
    .addTo(map);
});

function selectDoctor(id) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selectDoctor', id: id }));
  }
}
</script>
</body>
</html>`;
}

export default function MapScreen() {
  const [search,       setSearch]      = useState("");
  const [selectedPin,  setSelectedPin] = useState<MapPin | null>(null);
  const webviewRef = useRef<InstanceType<typeof WebView>>(null);

  const { data: pins = [], isLoading } = useQuery({
    queryKey: ["map-pins"],
    queryFn:  () => getMapPins(),
    staleTime: 60_000,
  });

  const filtered = pins.filter((p) =>
    !search ||
    p.nameAr?.includes(search) ||
    p.specialtyAr?.includes(search) ||
    p.clinicAddress?.includes(search)
  );

  const mapHtml = buildLeafletHTML(filtered);

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "selectDoctor" && msg.id) {
        router.push({ pathname: "/(patient)/doctor/[id]", params: { id: msg.id } });
      }
    } catch {}
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Search Bar */}
      <View style={styles.header}>
        <Text style={styles.title}>خريطة الأطباء</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن طبيب، تخصص، محافظة..."
            placeholderTextColor={Colors.text3}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {isLoading && <ActivityIndicator color={Colors.indigo} style={{ marginLeft: 8 }} />}
        </View>
      </View>

      {/* Interactive Map */}
      <View style={styles.mapContainer}>
        {isLoading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator color={Colors.indigo} size="large" />
            <Text style={styles.mapLoadingText}>جارٍ تحميل الخريطة...</Text>
          </View>
        ) : (
          <WebView
            ref={webviewRef}
            source={{ html: mapHtml }}
            style={styles.map}
            originWhitelist={["*"]}
            javaScriptEnabled
            onMessage={handleMessage}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />
        )}
        <View style={styles.mapCountBadge}>
          <Text style={styles.mapCountText}>{filtered.length} طبيب</Text>
        </View>
      </View>

      {/* Horizontal doctor cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cardsRow}
        contentContainerStyle={styles.cardsContent}
      >
        {filtered.slice(0, 20).map((pin) => (
          <Pressable
            key={pin.id}
            style={[styles.pinCard, selectedPin?.id === pin.id && styles.pinCardActive]}
            onPress={() => {
              setSelectedPin(pin);
              router.push({ pathname: "/(patient)/doctor/[id]", params: { id: pin.id } });
            }}
          >
            <Avatar uri={pin.logoUrl} name={pin.nameAr} size={42} />
            <View style={styles.pinCardInfo}>
              <Text style={styles.pinCardName} numberOfLines={1}>{pin.nameAr}</Text>
              <Text style={styles.pinCardSpec} numberOfLines={1}>{pin.specialtyAr}</Text>
              {pin.ratingAverage > 0 && (
                <Text style={styles.pinCardRating}>⭐ {pin.ratingAverage.toFixed(1)}</Text>
              )}
            </View>
          </Pressable>
        ))}
        {!isLoading && filtered.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>لا يوجد أطباء يطابقون البحث</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bgRoot },
  header: { padding: Spacing.md, paddingBottom: Spacing.sm },
  title:  {
    fontSize: Typography.sizes["2xl"], fontWeight: "800",
    color: Colors.text1, textAlign: "right", marginBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection:     "row",
    alignItems:        "center",
    backgroundColor:   Colors.bgSurface,
    borderRadius:      14,
    borderWidth:       1,
    borderColor:       Colors.border,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex:      1,
    height:    48,
    fontSize:  Typography.sizes.base,
    color:     Colors.text1,
    textAlign: "right",
  },

  mapContainer: {
    flex:            1,
    backgroundColor: Colors.bgSurface,
    borderTopWidth:  1,
    borderBottomWidth: 1,
    borderColor:     Colors.border,
    position:        "relative",
  },
  map: { flex: 1, backgroundColor: "#060912" },
  mapLoading: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 12,
  },
  mapLoadingText: { color: Colors.text2, fontSize: Typography.sizes.sm },
  mapCountBadge: {
    position:         "absolute",
    top:              8,
    left:             8,
    backgroundColor:  "rgba(13,17,39,0.9)",
    borderRadius:     20,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderWidth:       1,
    borderColor:       Colors.border,
  },
  mapCountText: { color: Colors.text2, fontSize: Typography.sizes.xs, fontWeight: "600" },

  cardsRow:    { maxHeight: 100, backgroundColor: Colors.bgSurface },
  cardsContent:{ padding: Spacing.sm, gap: Spacing.sm },
  pinCard: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: Colors.bgCard,
    borderRadius:    12,
    padding:         Spacing.sm,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             10,
    minWidth:        160,
    maxWidth:        200,
  },
  pinCardActive: { borderColor: Colors.indigo },
  pinCardInfo:   { flex: 1 },
  pinCardName:   { fontSize: Typography.sizes.sm, fontWeight: "700", color: Colors.text1 },
  pinCardSpec:   { fontSize: Typography.sizes.xs, color: Colors.indigo, marginTop: 2 },
  pinCardRating: { fontSize: Typography.sizes.xs, color: Colors.text3, marginTop: 2 },

  noResults:     { flex: 1, padding: Spacing.lg, alignItems: "center", justifyContent: "center" },
  noResultsText: { color: Colors.text3, fontSize: Typography.sizes.sm },
});
