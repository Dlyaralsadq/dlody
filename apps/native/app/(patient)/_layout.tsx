import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography } from "@/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarStyle:             styles.tabBar,
        tabBarActiveTintColor:   Colors.indigo,
        tabBarInactiveTintColor: Colors.text3,
        tabBarLabelStyle:        styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: "خريطة",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={(focused ? "map" : "map-outline") as IoniconName}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={(focused ? "home" : "home-outline") as IoniconName}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "استكشاف",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={(focused ? "compass" : "compass-outline") as IoniconName}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "مواعيدي",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={(focused ? "calendar" : "calendar-outline") as IoniconName}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "محفوظاتي",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={(focused ? "bookmark" : "bookmark-outline") as IoniconName}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "حسابي",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={(focused ? "person-circle" : "person-circle-outline") as IoniconName}
              size={22}
              color={color}
            />
          ),
        }}
      />
      {/* Nested screens — not tabs */}
      <Tabs.Screen name="book/[doctorId]" options={{ href: null }} />
      <Tabs.Screen name="doctor/[id]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:  "#0d1127",
    borderTopColor:   "rgba(99,102,241,0.2)",
    borderTopWidth:   1,
    height:           62,
    paddingBottom:    8,
    paddingTop:       4,
  },
  tabLabel: {
    fontSize:   Typography.sizes.xs,
    fontWeight: "600",
  },
});
