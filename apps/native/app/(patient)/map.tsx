/**
 * Patient map. Pins come from the live API. The map itself is a WebView
 * using the same Google tiles as the website, with an OpenStreetMap fallback.
 * A doctor list stays on screen even if the map tiles fail to load.
 */
import { useCallback, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  Pressable, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Colors, Typography, Spacing } from "@/theme";
import { getMapPins, getSpecialties } from "@/api/patient";
import type { MapPin } from "@/api/patient";
import { Avatar } from "@/components/ui";

const GOVS = [
  { id: "baghdad", ar: "بغداد" },
  { id: "basra", ar: "البصرة" },
  { id: "nineveh", ar: "نينوى" },
  { id: "erbil", ar: "أربيل" },
  { id: "sulaymaniyah", ar: "السليمانية" },
  { id: "duhok", ar: "دهوك" },
  { id: "kirkuk", ar: "كركوك" },
  { id: "anbar", ar: "الأنبار" },
  { id: "diyala", ar: "ديالى" },
  { id: "saladin", ar: "صلاح الدين" },
  { id: "wasit", ar: "واسط" },
  { id: "babil", ar: "بابل" },
  { id: "karbala", ar: "كربلاء" },
  { id: "najaf", ar: "النجف" },
  { id: "qadisiyah", ar: "القادسية" },
  { id: "muthanna", ar: "المثنى" },
  { id: "thi_qar", ar: "ذي قار" },
  { id: "maysan", ar: "ميسان" },
];

function buildMapHtml(pins: MapPin[]): string {
  const pinsJson = JSON.stringify(pins).replace(/</g, "\\u003c");
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<style>
  html,body,#map{height:100%;margin:0;background:#e7e2d8}
  .pin{width:16px;height:16px;border-radius:50%;background:#6366f1;border:2px solid #fff;box-shadow:0 0 0 2px rgba(99,102,241,.35)}
  .pin.gov{background:#64748b;box-shadow:none}
  .leaflet-popup-content-wrapper{border-radius:12px}
  .nm{font-weight:700;direction:rtl}
  .sp{color:#4f46e5;font-size:12px;direction:rtl}
</style>
</head><body>
<div id="map"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
function boot(){
  if(typeof L==="undefined"){ document.body.innerHTML='<p style="padding:16px">تعذر تحميل الخريطة</p>'; return; }
  var pins=${pinsJson};
  var map=L.map('map',{zoomControl:true,attributionControl:false}).setView([33.3,44.4],6);
  var google=L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=ar&gl=IQ&x={x}&y={y}&z={z}',{subdomains:'0123',maxZoom:20});
  google.addTo(map);
  var fails=0;
  google.on('tileerror',function(){
    fails++;
    if(fails===5 && !map._osm){
      map._osm=true;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    }
  });
  var bounds=[];
  pins.forEach(function(pin){
    var lat=pin.lat||pin.govLat, lng=pin.lng||pin.govLng;
    if(!lat||!lng) return;
    var exact=!!(pin.lat&&pin.lng);
    var icon=L.divIcon({className:'',html:'<div class="pin'+(exact?'':' gov')+'"></div>',iconSize:[16,16],iconAnchor:[8,8]});
    var marker=L.marker([lat,lng],{icon:icon}).addTo(map);
    var html='<div class="nm">'+(pin.nameAr||pin.name||'')+'</div>';
    if(pin.specialtyAr) html+='<div class="sp">'+pin.specialtyAr+'</div>';
    marker.bindPopup(html);
    marker.on('click',function(){
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'openDoctor',id:pin.id}));
      }
    });
    bounds.push([lat,lng]);
  });
  if(bounds.length){
    try{ map.fitBounds(bounds,{padding:[24,24],maxZoom:12}); }catch(e){}
  }
  setTimeout(function(){ map.invalidateSize(); }, 300);
}
window.addEventListener('load', boot);
</script></body></html>`;
}

export default function MapScreen() {
  const [search, setSearch] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [govId, setGovId] = useState("");

  const { data: pins = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["map-pins", specialtyId, govId],
    queryFn: () => getMapPins({
      specialty: specialtyId || undefined,
      gov: govId || undefined,
    }),
    staleTime: 60_000,
  });

  const { data: specialties = [] } = useQuery({
    queryKey: ["specialties"],
    queryFn: getSpecialties,
    staleTime: 300_000,
  });

  const filtered = useMemo(() => pins.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim();
    return (p.nameAr || "").includes(q)
      || (p.specialtyAr || "").includes(q)
      || (p.clinicAddress || "").includes(q);
  }), [pins, search]);

  const html = useMemo(() => buildMapHtml(filtered), [filtered]);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string };
      if (msg.type === "openDoctor" && msg.id) {
        router.push({ pathname: "/(patient)/doctor/[id]", params: { id: msg.id } });
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>خريطة الأطباء</Text>
        <TextInput
          style={styles.search}
          placeholder="ابحث عن طبيب أو عنوان"
          placeholderTextColor={Colors.text3}
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="الكل" active={!specialtyId && !govId} onPress={() => { setSpecialtyId(""); setGovId(""); }} />
          {specialties.slice(0, 12).map((s) => (
            <Chip key={s.id} label={s.nameAr} active={specialtyId === s.id} onPress={() => setSpecialtyId(s.id)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {GOVS.map((g) => (
            <Chip key={g.id} label={g.ar} active={govId === g.id} onPress={() => setGovId(govId === g.id ? "" : g.id)} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.mapWrap}>
        {isLoading ? (
          <View style={styles.center}><ActivityIndicator color={Colors.indigo} size="large" /></View>
        ) : (
          <WebView
            key={`${specialtyId}-${govId}-${filtered.length}`}
            source={{ html, baseUrl: "https://tabibee.com" }}
            style={styles.map}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            originWhitelist={["*"]}
            setSupportMultipleWindows={false}
            androidLayerType="hardware"
            startInLoadingState
          />
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{isError ? "تعذر التحميل" : `${filtered.length} طبيب`}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
        {filtered.slice(0, 30).map((pin) => (
          <Pressable
            key={pin.id}
            style={styles.card}
            onPress={() => router.push({ pathname: "/(patient)/doctor/[id]", params: { id: pin.id } })}
          >
            <Avatar uri={pin.logoUrl} name={pin.nameAr} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName} numberOfLines={1}>{pin.nameAr}</Text>
              <Text style={styles.cardSpec} numberOfLines={1}>{pin.specialtyAr}</Text>
            </View>
          </Pressable>
        ))}
        {!isLoading && filtered.length === 0 && (
          <Pressable onPress={() => refetch()} style={styles.empty}>
            <Text style={styles.emptyText}>{isError ? "اضغط لإعادة المحاولة" : "لا يوجد أطباء بهذا البحث"}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgRoot },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  title: { color: Colors.text1, fontSize: Typography.sizes.xl, fontWeight: "800", textAlign: "right" },
  search: {
    marginTop: 8, height: 42, borderRadius: 12, paddingHorizontal: 12,
    backgroundColor: Colors.bgCard, color: Colors.text1, textAlign: "right",
    borderWidth: 1, borderColor: Colors.border,
  },
  chips: { gap: 6, paddingVertical: 8 },
  chip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  chipOn: { backgroundColor: Colors.indigo, borderColor: Colors.indigo },
  chipText: { color: Colors.text2, fontSize: 12 },
  chipTextOn: { color: "#fff", fontWeight: "700" },
  mapWrap: { flex: 1, backgroundColor: "#e7e2d8" },
  map: { flex: 1, backgroundColor: "#e7e2d8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 8, left: 8, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: "#334155", fontSize: 12, fontWeight: "700" },
  cards: { padding: 8, gap: 8, backgroundColor: Colors.bgSurface },
  card: { width: 190, flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: Colors.bgCard, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: Colors.border },
  cardName: { color: Colors.text1, fontWeight: "700", textAlign: "right" },
  cardSpec: { color: Colors.indigo, fontSize: 12, textAlign: "right" },
  empty: { padding: 16 },
  emptyText: { color: Colors.text3 },
});
