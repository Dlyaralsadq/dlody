import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { apiFetch } from "@/api/client";
import { Avatar } from "@/components/ui";

interface AdminPatient {
  id: string;
  name: string;
  patientNumber: string;
  phone?: string;
  doctor?: { nameAr: string };
}

export default function AdminPatientsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-patients"],
    queryFn:  () => apiFetch<{ patients: AdminPatient[] }>("/api/mobile/admin/patients"),
    staleTime: 60_000,
  });

  const patients = data?.patients ?? [];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>المرضى</Text>
        <Text style={styles.count}>{data?.patients?.length ?? 0}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.indigo} style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Avatar uri={null} name={item.name} size={40} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>#{item.patientNumber} · {item.doctor?.nameAr}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bgRoot },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title:  { fontSize: Typography.sizes["2xl"], fontWeight: "900", color: Colors.text1 },
  count:  { color: Colors.text3, fontSize: Typography.sizes.sm },
  card:   {
    backgroundColor: Colors.bgCard, borderRadius: 14,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
  },
  info:   { flex: 1, alignItems: "flex-end" },
  name:   { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1 },
  sub:    { fontSize: Typography.sizes.xs, color: Colors.text3, marginTop: 2 },
});

