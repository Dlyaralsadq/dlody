/**
 * Build ClinicPro debug APK (install on phone via USB / file transfer).
 * Requires JDK 17+ (Android Studio includes JBR).
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const root = path.join(__dirname, "..");
const mobile = path.join(root, "apps", "mobile");
const android = path.join(mobile, "android");
const apkOut = path.join(android, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const deliver = path.join(root, "ClinicPro-preview.apk");

function findJavaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(path.join(process.env.JAVA_HOME, "bin", "java.exe"))) {
    return process.env.JAVA_HOME;
  }
  const candidates = [
    path.join(process.env["ProgramFiles"] || "", "Android", "Android Studio", "jbr"),
    path.join(process.env["ProgramFiles(x86)"] || "", "Android", "Android Studio", "jbr"),
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Android", "Android Studio", "jbr"),
    path.join(process.env["ProgramFiles"] || "", "Java", "jdk-17"),
    path.join(process.env["ProgramFiles"] || "", "Microsoft", "jdk-17.0.13.11-hotspot"),
    path.join(process.env["ProgramFiles"] || "", "Eclipse Adoptium", "jdk-17.0.13.11-hotspot"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "bin", "java.exe"))) return c;
  }
  return null;
}

function run(cmd, cwd, env = {}) {
  console.log(`\n▶ ${cmd}\n`);
  execSync(cmd, {
    cwd,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
}

console.log(`
  📦  ClinicPro — بناء APK للمعاينة
  ═══════════════════════════════════════
`);

const javaHome = findJavaHome();
if (!javaHome) {
  console.error(`
  ❌  لم يُعثر على Java (JDK 17).

  ثبّت أحد الخيارات:
  • Android Studio: https://developer.android.com/studio
  • أو JDK 17: winget install Microsoft.OpenJDK.17

  ثم أعد تشغيل: build-apk.bat
`);
  process.exit(1);
}

console.log(`Using JAVA_HOME: ${javaHome}`);

run("npm run config:lan -w @iraq-clinic/mobile", root);
run("npm run cap:sync -w @iraq-clinic/mobile", root);

const gradle = path.join(android, process.platform === "win32" ? "gradlew.bat" : "gradlew");
if (!fs.existsSync(gradle)) {
  console.error("Android project missing. Run: npm run mobile:setup");
  process.exit(1);
}

run(process.platform === "win32" ? "gradlew.bat assembleDebug" : "./gradlew assembleDebug", android, {
  JAVA_HOME: javaHome,
});

if (!fs.existsSync(apkOut)) {
  console.error("Build finished but APK not found at:", apkOut);
  process.exit(1);
}

fs.copyFileSync(apkOut, deliver);
console.log(`
  ✅  APK جاهز للتثبيت
  ───────────────────────────────────────
  📁  ${deliver}

  قبل فتح التطبيق على الهاتف:
  1) شغّل clinic.cmd على الكمبيوتر (نفس Wi‑Fi)
  2) تأكد أن IP في التطبيق يطابق شبكتك (راجع apps/mobile/capacitor.config.ts)

  التثبيت:
  • انقل ClinicPro-preview.apk للهاتف وافتحه
  • أو: Settings → allow install from files / unknown sources
`);
