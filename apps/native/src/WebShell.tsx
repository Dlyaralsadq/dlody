import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";

const SITE_URL = "https://tabibee.com/ar";
const SITE_HOST = "tabibee.com";

const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 TabibeeApp/1.2.0";

const INJECTED = `
(function () {
  try { localStorage.setItem("pwa-install-dismissed", "1"); } catch (e) {}
  document.documentElement.classList.add("tabibee-native-app");

  // Ensure correct viewport on small phones
  (function fixViewport() {
    var vp = document.querySelector('meta[name="viewport"]');
    var content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    if (vp) { vp.setAttribute('content', content); }
    else {
      var m = document.createElement('meta');
      m.name = 'viewport'; m.content = content;
      document.head.appendChild(m);
    }
  })();

  // Tiles now go through /api/tiles proxy by default — no patching needed.
  // Safety net: if any direct google.com tile URLs remain, replace them too.
  function patchGoogleTiles() {
    if (!window.L) return false;
    var patched = false;
    document.querySelectorAll('.leaflet-container').forEach(function(el) {
      var map = el._leaflet_map || el._leafletMap;
      if (!map) return;
      var toRemove = [];
      map.eachLayer(function(layer) {
        if (layer._url && layer._url.indexOf('google.com') !== -1) toRemove.push(layer);
      });
      if (toRemove.length > 0) {
        toRemove.forEach(function(l) { map.removeLayer(l); });
        window.L.tileLayer('/api/tiles/{z}/{x}/{y}.png?s=m&hl=ar', {
          maxZoom: 21, minZoom: 3,
          updateWhenIdle: true, updateWhenZooming: false,
          keepBuffer: 2, crossOrigin: false
        }).addTo(map);
        patched = true;
      }
    });
    return patched;
  }

  var tries = 0;
  var iv = setInterval(function() {
    if (patchGoogleTiles() || ++tries > 10) clearInterval(iv);
  }, 500);

  true;
})();
`;

function isAppHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === SITE_HOST || host.endsWith(`.${SITE_HOST}`);
  } catch {
    return false;
  }
}

function isExternalScheme(url: string): boolean {
  return /^(tel:|mailto:|sms:|whatsapp:|geo:|intent:|maps:|market:|tg:)/i.test(url);
}

export default function WebShell() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uri, setUri] = useState(SITE_URL);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]).catch(() => {});
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const handleNav = useCallback((nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
  }, []);

  const handleShouldStart = useCallback((req: { url: string }) => {
    const url = req.url;
    if (!url || url === "about:blank") return true;
    if (isExternalScheme(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  }, []);

  function retry() {
    setError(null);
    setLoading(true);
    setUri(`${SITE_URL}?r=${Date.now()}`);
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {loading && !error && (
        <View style={styles.progressTrack} pointerEvents="none">
          <View style={[styles.progressBar, { width: `${Math.max(progress * 100, 8)}%` }]} />
        </View>
      )}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>تعذر فتح المنصة</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={retry}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          ref={webRef}
          source={{ uri }}
          style={styles.web}
          userAgent={USER_AGENT}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          geolocationEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          setSupportMultipleWindows
          mixedContentMode="always"
          originWhitelist={["*"]}
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          nestedScrollEnabled
          startInLoadingState={false}
          injectedJavaScript={INJECTED}
          // منح صلاحية الموقع تلقائياً لفتح الخريطة
          onGeolocationPermissionsShowPrompt={({ origin, callback }) => {
            callback(origin, true, true);
          }}
          onLoadStart={() => {
            setLoading(true);
            setError(null);
          }}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          onLoadEnd={() => {
            setLoading(false);
            setProgress(1);
          }}
          onNavigationStateChange={handleNav}
          onShouldStartLoadWithRequest={handleShouldStart}
          onOpenWindow={(e) => {
            const target = e.nativeEvent.targetUrl;
            if (!target) return;
            if (isAppHost(target)) {
              webRef.current?.injectJavaScript(
                `window.location.href = ${JSON.stringify(target)}; true;`
              );
            } else {
              Linking.openURL(target).catch(() => {});
            }
          }}
          onError={({ nativeEvent }) => {
            setLoading(false);
            setError(nativeEvent.description || "لا يوجد اتصال بالإنترنت");
          }}
          onHttpError={({ nativeEvent }) => {
            if (nativeEvent.statusCode >= 500) {
              setLoading(false);
              setError("الخادم غير متاح حالياً، حاول بعد قليل");
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#060912" },
  web: { flex: 1, backgroundColor: "#060912" },
  progressTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 20,
    backgroundColor: "transparent",
  },
  progressBar: { height: 2, backgroundColor: "#818cf8" },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  errorTitle: { color: "#f1f5f9", fontSize: 20, fontWeight: "800" },
  errorBody: { color: "#94a3b8", fontSize: 14, textAlign: "center" },
  retryBtn: {
    marginTop: 8,
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
