/**
 * Patient map — the same Google/Leaflet map as the website,
 * served from tabibee.com so tiles and filters work inside the app.
 */
import { useCallback, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { router } from "expo-router";
import { API_BASE } from "@/api/client";
import { Colors } from "@/theme";

const MAP_URL = `${API_BASE}/api/mobile/map-page`;

export default function MapScreen() {
  const webRef = useRef<WebView>(null);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        id?: string;
        phone?: string;
      };
      if (msg.type === "openDoctor" && msg.id) {
        router.push({ pathname: "/(patient)/doctor/[id]", params: { id: msg.id } });
      } else if (msg.type === "bookDoctor" && msg.id) {
        router.push({ pathname: "/(patient)/book/[doctorId]", params: { doctorId: msg.id } });
      } else if (msg.type === "call" && msg.phone) {
        Linking.openURL(`tel:${msg.phone}`);
      }
    } catch {
      /* ignore malformed bridge messages */
    }
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <WebView
        ref={webRef}
        source={{ uri: MAP_URL }}
        style={styles.map}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        mixedContentMode="always"
        originWhitelist={["*"]}
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        startInLoadingState
        cacheEnabled
        userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.indigo} size="large" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f2efe9" },
  map: { flex: 1, backgroundColor: "#f2efe9" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2efe9",
  },
});
