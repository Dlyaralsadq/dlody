/**
 * Root entry point.
 * Waits for auth initialization, then redirects to the right tab group.
 */
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuthInitialized, useIsLoggedIn, useRole } from "@/stores/auth";
import { Colors } from "@/theme";

export default function IndexScreen() {
  const initialized = useAuthInitialized();
  const loggedIn    = useIsLoggedIn();
  const role        = useRole();

  useEffect(() => {
    if (!initialized) return;

    if (!loggedIn) {
      router.replace("/(auth)/role-select");
      return;
    }

    switch (role) {
      case "admin":
        router.replace("/(admin)/dashboard");
        break;
      case "doctor":
      case "secretary":
        router.replace("/(doctor)/dashboard");
        break;
      case "patient":
      default:
        router.replace("/(patient)/map");
        break;
    }
  }, [initialized, loggedIn, role]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgRoot, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={Colors.indigo} size="large" />
    </View>
  );
}
