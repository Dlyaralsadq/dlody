import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography } from "@/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export default function DoctorLayout() {
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
        name="dashboard"
        options={{
          title: "لوحتي",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={(focused ? "grid" : "grid-outline") as IoniconName}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "المواعيد",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={(focused ? "calendar" : "calendar-outline") as IoniconName}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "مرضاي",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={(focused ? "people" : "people-outline") as IoniconName}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: "منشوراتي",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={(focused ? "newspaper" : "newspaper-outline") as IoniconName}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "إعداداتي",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={(focused ? "settings" : "settings-outline") as IoniconName}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:  "#0d1127",
    borderTopColor:   "rgba(99,102,241,0.2)",
    borderTopWidth:   1,
    height:           60,
    paddingBottom:    8,
  },
  tabLabel: {
    fontSize:  Typography.sizes.xs,
    fontWeight: "600",
  },
});
