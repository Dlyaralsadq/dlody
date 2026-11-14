import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Colors, Typography, Spacing } from "@/theme";
import { apiFetch } from "@/api/client";
import { Avatar } from "@/components/ui";
import { Badge } from "@/components/ui";

interface AdminDoctor {
  id: string;
  name: string;
  nameAr: string;
  logoUrl?: string | null;
  isActive: boolean;
  isListed: boolean;
  specialty?: { nameAr: string };
  _count?: { patients: number; appointments: number };
}

export default function AdminDoctorsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn:  () => apiFetch<{ doctors: AdminDoctor[] }>("/api/mobile/admin/doctors"),
    staleTime: 60_000,
  });

  const doctors = data?.doctors ?? [];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>الأطباء</Text>
        <Text style={styles.count}>{doctors.length} طبيب</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.indigo} style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Avatar uri={item.logoUrl} name={item.nameAr} size={44} />
              <View style={styles.cardInfo}>
                <Text style={styles.docName}>{item.nameAr}</Text>
                <Text style={styles.docSpec}>{item.specialty?.nameAr}</Text>
              </View>
              <View style={styles.badges}>
                <Badge label={item.isActive ? "نشط" : "موقوف"} variant={item.isActive ? "success" : "danger"} />
                {item.isListed && <Badge label="مدرج" variant="info" />}
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
  cardInfo: { flex: 1, alignItems: "flex-end" },
  docName:  { fontSize: Typography.sizes.base, fontWeight: "700", color: Colors.text1 },
  docSpec:  { fontSize: Typography.sizes.xs, color: Colors.indigo, marginTop: 2 },
  badges:   { gap: 4 },
});

