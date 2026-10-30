#!/usr/bin/env node
/**
 * Local-only startup: SQLite DB + Next.js on 127.0.0.1 + open system default browser.
 */
const { execSync, spawn } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const APP_URL = "http://127.0.0.1:3000/ar";

function run(cmd) {
  console.log(`▶ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", shell: true });
}

function stopPort3000() {
  try {
    if (process.platform === "win32") {
      const out = execSync('netstat -ano | findstr :3000 | findstr LISTENING', {
        encoding: "utf8",
        shell: true,
      });
      const pids = new Set();
      for (const line of out.split("\n")) {
        const pid = line.trim().split(/\s+/).pop();
        if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      }
      for (const pid of pids) {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore", shell: true });
      }
    } else {
      execSync("lsof -ti:3000 | xargs kill -9 2>/dev/null || true", {
        shell: true,
        stdio: "ignore",
      });
    }
  } catch {
    // Port already free
  }
}

function openBrowser(url) {
  console.log(`  🌐  فتح المتصفح: ${url}`);
  if (process.platform === "win32") {
    execSync(`start "" "${url}"`, { stdio: "ignore", shell: true });
  } else if (process.platform === "darwin") {
    execSync(`open "${url}"`, { stdio: "ignore" });
  } else {
    execSync(`xdg-open "${url}"`, { stdio: "ignore", shell: true });
  }
}

async function waitForServer(url, maxSeconds = 120) {
  for (let i = 0; i < maxSeconds; i++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.status === 200) return true;
    } catch {
      // Server still starting
    }
    await new Promise((r) => setTimeout(r, 1000));
    if (i > 0 && i % 5 === 0) {
      console.log(`  ⏳  انتظر... (${i}s)`);
    }
  }
  return false;
}

async function main() {
  console.log("");
  console.log("  🏥  ClinicPro — تشغيل محلي على جهازك");
  console.log("  ═══════════════════════════════════════");
  console.log("");

  stopPort3000();
  run("npm run db:generate");
  run("npm run db:deploy");
  run("npm run db:seed-check");

  console.log("");
  console.log("  🚀  تشغيل الخادم...");
  console.log("  📌  الرابط: " + APP_URL);
  console.log("  👤  مدير المنصة: admin / admin123");
  console.log("  👤  طبيب:         dr.ahmad / admin123");
  console.log("  ⏹  للإيقاف:      Ctrl+C");
  console.log("");

  const server = spawn("npm run dev:local", {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });

  const ready = await waitForServer(APP_URL);
  if (ready) {
    openBrowser(APP_URL);
    console.log("");
    console.log("  ✅  النظام يعمل — Chrome أو Edge أو Firefox");
    console.log("  💡  اترك نافذة CMD مفتوحة طوال فترة الاستخدام");
    console.log("");
  } else {
    console.log("");
    console.log("  ⚠️  لم يستجب الخادم — افتح يدوياً: " + APP_URL);
    console.log("");
  }

  server.on("exit", (code) => process.exit(code ?? 0));

  process.on("SIGINT", () => {
    server.kill();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
