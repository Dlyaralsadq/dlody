import { Tabs } from "expo-router";
import { Text, StyleSheet } from "react-native";
import { Colors, Typography } from "@/theme";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:          false,
        tabBarStyle:          styles.tabBar,
        tabBarActiveTintColor:  Colors.indigo,
        tabBarInactiveTintColor: Colors.text3,
        tabBarLabelStyle:     styles.tabLabel,
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "الرئيسية",    tabBarIcon: () => <Text style={styles.icon}>🏠</Text> }} />
      <Tabs.Screen name="doctors"   options={{ title: "الأطباء",     tabBarIcon: () => <Text style={styles.icon}>👨‍⚕️</Text> }} />
      <Tabs.Screen name="patients"  options={{ title: "المرضى",      tabBarIcon: () => <Text style={styles.icon}>👥</Text> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0d1127",
    borderTopColor:  "rgba(99,102,241,0.2)",
    borderTopWidth:  1,
    height: 60,
    paddingBottom: 8,
  },
  tabLabel: { fontSize: Typography.sizes.xs, fontWeight: "600" },
  icon:     { fontSize: 22 },
});
