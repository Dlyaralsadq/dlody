import { Tabs } from "expo-router";
import { Text, StyleSheet } from "react-native";
import { Colors, Typography } from "@/theme";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>
      {emoji}
    </Text>
  );
}

export default function DoctorLayout() {
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
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "المواعيد",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "المرضى",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: "المنشورات",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📝" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "الإعدادات",
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
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
    fontSize:         Typography.sizes.xs,
    fontWeight:       "600",
    writingDirection: "rtl",
  },
  tabEmoji:        { fontSize: 22 },
  tabEmojiFocused: { transform: [{ scale: 1.1 }] },
});
