/**
 * Patient Map screen – interactive Leaflet.js map via WebView
 * Shows doctor pins on Iraq map with dark CartoDB tiles
 */
import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  Pressable, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Colors, Typography, Spacing } from "@/theme";
import { getMapPins, getSpecialties } from "@/api/patient";
import type { MapPin } from "@/api/patient";
import { Avatar } from "@/components/ui";

/** Build the full Leaflet HTML page (injected into WebView) — exact working pattern */
function buildMapHtml(pins: MapPin[]): string {
  const pinsJson = JSON.stringify(
    pins.map((p) => ({
      id:          p.id,
      nameAr:      p.nameAr ?? "",
      name:        p.name ?? "",
      specialtyAr: p.specialtyAr ?? "",
      clinicAddress: p.clinicAddress ?? "",
      lat:         p.lat,
      lng:         p.lng,
      govLat:      p.govLat,
      govLng:      p.govLng,
    }))
  );

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<style>
  html, body, #map { width:100%; height:100%; margin:0; padding:0; background:#1a1a2e; }
  .custom-pin { background:transparent; border:none; }
  .pin-dot { width:16px; height:16px; border-radius:50%; background:#6366f1; border:2px solid #fff; box-shadow:0 0 8px rgba(99,102,241,0.9); }
  .pin-dot.gov { background:#94a3b8; }
  .leaflet-popup-content-wrapper { background:#111827; border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:#f1f5f9; }
  .leaflet-popup-tip { background:#111827; }
  .leaflet-popup-content { margin:12px; }
  .pop-name { font-size:15px; font-weight:700; margin-bottom:4px; direction:rtl; }
  .pop-spec { font-size:12px; color:#818cf8; margin-bottom:6px; direction:rtl; }
  .pop-addr { font-size:11px; color:#94a3b8; margin-bottom:8px; direction:rtl; }
  .pop-btn { background:#6366f1; color:#fff; border:none; padding:8px 16px; border-radius:8px; font-size:13px; width:100%; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
function boot() {
  if (typeof L === 'undefined') {
    document.getElementById('map').innerHTML = '<p style="color:#fff;padding:20px;text-align:center">تعذر تحميل الخريطة</p>';
    return;
  }
  var pins = ${pinsJson};
  var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([33.3, 44.4], 6);
  var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
  var dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18, subdomains: 'abcd' });
  dark.addTo(map);
  dark.on('tileerror', function() { if (!map.hasLayer(osm)) osm.addTo(map); });
  pins.forEach(function(pin) {
    var lat = pin.lat || pin.govLat;
    var lng = pin.lng || pin.govLng;
    if (!lat || !lng) return;
    var isExact = !!(pin.lat && pin.lng);
    var icon = L.divIcon({
      className: 'custom-pin',
      html: '<div class="pin-dot' + (isExact ? '' : ' gov') + '"></div>',
      iconSize: [16, 16], iconAnchor: [8, 8]
    });
    var marker = L.marker([lat, lng], { icon: icon }).addTo(map);
    var popup = '<div class="pop-name">' + (pin.nameAr || pin.name || '') + '</div>';
    if (pin.specialtyAr) popup += '<div class="pop-spec">' + pin.specialtyAr + '</div>';
    if (pin.clinicAddress) popup += '<div class="pop-addr">📍 ' + pin.clinicAddress + '</div>';
    popup += '<button class="pop-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'selectDoctor\\',id:\\'' + pin.id + '\\'}))">عرض الملف</button>';
    marker.bindPopup(popup, { maxWidth: 240 });
  });
  setTimeout(function() { map.invalidateSize(); }, 250);
}
if (document.readyState === 'complete') boot();
else window.addEventListener('load', boot);
</script>
</body>
</html>`;
}

export default function MapScreen() {
  const [search,       setSearch]       = useState("");
  const [specialtyId,  setSpecialtyId]  = useState<string>("");
  const [selectedPin,  setSelectedPin]  = useState<MapPin | null>(null);

  const { data: pins = [], isLoading } = useQuery({
    queryKey: ["map-pins", specialtyId],
    queryFn:  () => getMapPins({ specialty: specialtyId || undefined }),
    staleTime: 60_000,
  });

  const { data: specialties = [] } = useQuery({
    queryKey: ["specialties"],
    queryFn:  getSpecialties,
    staleTime: 300_000,
  });

  const filtered = pins.filter((p) =>
    !search ||
    p.nameAr?.includes(search) ||
    p.specialtyAr?.includes(search) ||
    p.clinicAddress?.includes(search)
  );

  const mapHtml = buildMapHtml(filtered);

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>خريطة الأطباء</Text>

        {/* Search bar */}
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

        {/* Specialty filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ gap: 6 }}
        >
          <Pressable
            style={[styles.filterChip, !specialtyId && styles.filterChipActive]}
            onPress={() => setSpecialtyId("")}
          >
            <Text style={[styles.filterChipText, !specialtyId && styles.filterChipTextActive]}>
              الكل
            </Text>
          </Pressable>
          {specialties.map((sp) => (
            <Pressable
              key={sp.id}
              style={[styles.filterChip, specialtyId === sp.id && styles.filterChipActive]}
              onPress={() => setSpecialtyId(sp.id)}
            >
              <Text style={[styles.filterChipText, specialtyId === sp.id && styles.filterChipTextActive]}>
                {sp.nameAr}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
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
            source={{ html: mapHtml }}
            style={styles.map}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            originWhitelist={["*"]}
            setSupportMultipleWindows={false}
            androidLayerType="hardware"
            nestedScrollEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.mapLoading}>
                <ActivityIndicator color={Colors.indigo} size="large" />
              </View>
            )}
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
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 4 },
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
    marginBottom:      Spacing.sm,
  },
  searchInput: {
    flex:      1,
    height:    44,
    fontSize:  Typography.sizes.base,
    color:     Colors.text1,
    textAlign: "right",
  },
  filterRow:   { marginBottom: Spacing.sm },
  filterChip: {
    backgroundColor: Colors.bgCard,
    borderRadius:    20,
    paddingHorizontal: 14,
    paddingVertical:  6,
    borderWidth:      1,
    borderColor:      Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.indigo, borderColor: Colors.indigo },
  filterChipText:   { color: Colors.text3, fontSize: Typography.sizes.xs, fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },

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
