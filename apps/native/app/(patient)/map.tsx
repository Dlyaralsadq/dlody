/**
 * Patient Map screen – shows all listed doctors on a map
 * NOTE: MapView temporarily replaced with WebView-based map for initial build
 */
import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  Pressable, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Colors, Typography, Spacing } from "@/theme";
import { getMapPins } from "@/api/patient";
import type { MapPin } from "@/api/patient";

export default function MapScreen() {
  const [search,      setSearch]      = useState("");
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);

  const { data: pins = [], isLoading } = useQuery({
    queryKey: ["map-pins", search],
    queryFn:  () => getMapPins({ q: search }),
    staleTime: 60_000,
  });

  const filtered = pins.filter((p) =>
    !search ||
    p.nameAr?.includes(search) ||
    p.specialtyAr?.includes(search) ||
    p.governorate?.includes(search)
  );

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
          {isLoading && <ActivityIndicator color={Colors.indigo} />}
        </View>
      </View>

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapText}>العراق</Text>
        <Text style={styles.mapSub}>{filtered.length} طبيب في المنطقة</Text>
      </View>

      {/* Doctors list */}
      <ScrollView style={styles.list} contentContainerStyle={{ padding: Spacing.md }}>
        {filtered.map((pin) => (
          <Pressable
            key={pin.id}
            style={styles.card}
            onPress={() =>
              router.push({ pathname: "/(patient)/doctor/[id]", params: { id: pin.id } })
            }
          >
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{pin.nameAr}</Text>
              <Text style={styles.cardSpec}>{pin.specialtyAr}</Text>
              {pin.clinicAddress && (
                <Text style={styles.cardAddr}>📍 {pin.clinicAddress}</Text>
              )}
            </View>
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
        ))}
        {!isLoading && filtered.length === 0 && (
          <Text style={styles.empty}>لا يوجد أطباء يطابقون البحث</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bgRoot },
  header: { padding: Spacing.md, paddingTop: Spacing.sm },
  title:  { fontSize: Typography.sizes["2xl"], fontWeight: "800", color: Colors.text1, textAlign: "right", marginBottom: Spacing.sm },
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

  mapPlaceholder: {
    height:          180,
    backgroundColor: "#0d1127",
    alignItems:      "center",
    justifyContent:  "center",
    borderTopWidth:  1,
    borderBottomWidth: 1,
    borderColor:     Colors.border,
  },
  mapIcon: { fontSize: 48 },
  mapText: { fontSize: Typography.sizes.xl, fontWeight: "700", color: Colors.text1, marginTop: 8 },
  mapSub:  { fontSize: Typography.sizes.sm, color: Colors.text3, marginTop: 4 },

  list: { flex: 1 },
  card: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: Colors.bgCard,
    borderRadius:    16,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  cardInfo:  { flex: 1 },
  cardName:  { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1, textAlign: "right" },
  cardSpec:  { fontSize: Typography.sizes.sm, color: Colors.indigo, textAlign: "right", marginTop: 2 },
  cardAddr:  { fontSize: Typography.sizes.xs, color: Colors.text3, textAlign: "right", marginTop: 2 },
  arrow:     { color: Colors.text3, fontSize: 24, transform: [{ scaleX: -1 }] },
  empty:     { textAlign: "center", color: Colors.text3, marginTop: Spacing.xl },
});
