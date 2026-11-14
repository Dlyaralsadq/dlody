import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TextInput, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { getDoctorPatients } from "@/api/doctor";
import { Avatar } from "@/components/ui";

export default function DoctorPatientsScreen() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["doctor-patients", debouncedSearch],
    queryFn:  () => getDoctorPatients({ search: debouncedSearch }),
    staleTime: 60_000,
  });

  const patients = data?.patients ?? [];

  function handleSearchChange(text: string) {
    setSearch(text);
    // Debounce
    clearTimeout((handleSearchChange as unknown as { _t: ReturnType<typeof setTimeout> })._t);
    const timer = setTimeout(() => setDebouncedSearch(text), 400);
    (handleSearchChange as unknown as { _t: ReturnType<typeof setTimeout> })._t = timer;
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>المرضى</Text>
        <Text style={styles.count}>{data?.total ?? 0} مريض</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث بالاسم أو الهاتف..."
          placeholderTextColor={Colors.text3}
          value={search}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
          textAlign="right"
        />
      </View>

      <FlatList
        data={patients}
        keyExtractor={(p) => p.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.indigo} />
        }
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? "جارٍ التحميل..." : "لا توجد مرضى"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar uri={null} name={item.name} size={44} />
            <View style={styles.cardInfo}>
              <Text style={styles.patName}>{item.name}</Text>
              <Text style={styles.patNum}>#{item.patientNumber}</Text>
              {item.phone && <Text style={styles.patPhone}>📱 {item.phone}</Text>}
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.apptCount}>{item.appointmentCount ?? 0}</Text>
              <Text style={styles.apptLabel}>موعد</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bgRoot },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title:  { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1 },
  count:  { color: Colors.text3, fontSize: Typography.sizes.sm },

  searchRow: {
    marginHorizontal: Spacing.md, marginVertical: 8,
    backgroundColor: Colors.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    height: 44, fontSize: Typography.sizes.base, color: Colors.text1,
  },

  empty:     { padding: Spacing.xl, alignItems: "center" },
  emptyText: { color: Colors.text3, fontSize: Typography.sizes.base },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 14,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
  },
  cardInfo: { flex: 1, alignItems: "flex-end" },
  patName:  { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1 },
  patNum:   { fontSize: Typography.sizes.xs, color: Colors.indigo, marginTop: 2 },
  patPhone: { fontSize: Typography.sizes.xs, color: Colors.text3, marginTop: 2 },
  cardRight:{ alignItems: "center", minWidth: 40 },
  apptCount:{ fontSize: Typography.sizes.xl, fontWeight: "900", color: Colors.text1 },
  apptLabel:{ fontSize: Typography.sizes.xs, color: Colors.text3 },
});

