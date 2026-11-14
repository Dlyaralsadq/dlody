/**
 * Prepare Android Capacitor preview: LAN URL → sync → open Android Studio.
 * Prerequisites: Node, Android Studio (SDK), JDK 17+, clinic server running on :3000
 */
const { execSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const mobile = path.join(root, "apps", "mobile");

function run(cmd, cwd = root) {
  console.log(`\n▶ ${cmd}\n`);
  execSync(cmd, { cwd, stdio: "inherit", shell: true });
}

console.log(`
  📱  ClinicPro — معاينة التطبيق (Capacitor / Android)
  ═══════════════════════════════════════════════════════
  1) شغّل الموقع في نافذة أخرى: clinic.cmd  (أو npm run dev)
  2) هذه الأداة تفتح Android Studio — Run ▶ على جهاز أو محاكي
`);

run("npm run config:lan -w @iraq-clinic/mobile", root);
run("npm run cap:sync -w @iraq-clinic/mobile", root);
run("npm run cap:open:android -w @iraq-clinic/mobile", root);

console.log(`
  ✅  Android Studio
  ───────────────────────────────────────
  • محاكي: npm run config:emulator -w @iraq-clinic/mobile ثم cap sync
  • هاتف: USB debugging + نفس Wi‑Fi + npm run config:lan
  • Run ▶  من Android Studio
`);
