#!/usr/bin/env node
/**
 * Share mode: local server + Cloudflare quick tunnel (public HTTPS link for friends).
 * Works outside Cursor — run via start-share.bat from File Explorer.
 */
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.join(__dirname, "..");
const PORT = 3000;
const LOCAL_URL = `http://127.0.0.1:${PORT}/ar`;
const toolsDir = path.join(root, "tools");
const cloudflaredPath = path.join(
  toolsDir,
  process.platform === "win32" ? "cloudflared.exe" : "cloudflared"
);

const TUNNEL_URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/gi;

function run(cmd) {
  console.log(`▶ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", shell: true });
}

function stopProcesses() {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING`, {
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
      execSync("taskkill /F /IM cloudflared.exe 2>nul", { stdio: "ignore", shell: true });
    } else {
      execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, { shell: true, stdio: "ignore" });
      execSync("pkill -f cloudflared 2>/dev/null || true", { shell: true, stdio: "ignore" });
    }
  } catch {
    // already stopped
  }
}

function openBrowser(url) {
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
      // still starting
    }
    await new Promise((r) => setTimeout(r, 1000));
    if (i > 0 && i % 5 === 0) console.log(`  ⏳  انتظر الخادم... (${i}s)`);
  }
  return false;
}

async function ensureCloudflared() {
  if (fs.existsSync(cloudflaredPath)) return cloudflaredPath;

  fs.mkdirSync(toolsDir, { recursive: true });
  const asset =
    process.platform === "win32"
      ? "cloudflared-windows-amd64.exe"
      : process.platform === "darwin"
        ? os.arch() === "arm64"
          ? "cloudflared-darwin-arm64"
          : "cloudflared-darwin-amd64"
        : "cloudflared-linux-amd64";

  const url = `https://github.com/cloudflare/cloudflared/releases/latest/download/${asset}`;
  console.log("  ⬇️  تحميل cloudflared (مرة واحدة)...");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`فشل تحميل cloudflared (${res.status})`);
  fs.writeFileSync(cloudflaredPath, Buffer.from(await res.arrayBuffer()));
  if (process.platform !== "win32") fs.chmodSync(cloudflaredPath, 0o755);
  return cloudflaredPath;
}

function startTunnel(bin) {
  return new Promise((resolve, reject) => {
    let publicUrl = null;
    const proc = spawn(bin, ["tunnel", "--url", `http://127.0.0.1:${PORT}`], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const scan = (chunk) => {
      const matches = chunk.toString().match(TUNNEL_URL_RE);
      if (matches?.length) publicUrl = matches[matches.length - 1];
    };

    proc.stdout.on("data", scan);
    proc.stderr.on("data", scan);

    const deadline = Date.now() + 45_000;
    const poll = setInterval(() => {
      if (publicUrl) {
        clearInterval(poll);
        resolve({ proc, publicUrl });
      } else if (Date.now() > deadline) {
        clearInterval(poll);
        proc.kill();
        reject(new Error("انتهت مهلة إنشاء الرابط الخارجي"));
      }
    }, 500);

    proc.on("error", (err) => {
      clearInterval(poll);
      reject(err);
    });
  });
}

function printShareBanner(publicUrl) {
  const shareUrl = `${publicUrl}/ar`;
  console.log("");
  console.log("  ═══════════════════════════════════════════════════");
  console.log("  ✅  النظام يعمل — أرسل هذا الرابط لصديقك:");
  console.log("");
  console.log(`  🔗  ${shareUrl}`);
  console.log("");
  console.log("  💻  على حاسوبك: " + LOCAL_URL);
  console.log("  ═══════════════════════════════════════════════════");
  console.log("");
  console.log("  👤  admin / admin123  |  dr.ahmad / admin123");
  console.log("  ⏹  Ctrl+C لإيقاف الخادم والرابط");
  console.log("");
  console.log("  ⚠️  الرابط مؤقت — يتوقف عند إغلاق CMD");
  console.log("");
}

async function main() {
  console.log("");
  console.log("  🏥  ClinicPro — رابط للمشاركة مع أي شخص");
  console.log("  ═══════════════════════════════════════");
  console.log("  (يعمل خارج Cursor — من مستكشف الملفات)");
  console.log("");

  stopProcesses();
  run("npm run db:generate");
  run("npm run db:deploy");
  run("npm run db:seed-check");

  console.log("");
  console.log("  🚀  تشغيل الخادم...");
  const server = spawn("npm run dev", { cwd: root, shell: true, stdio: "inherit" });

  const ready = await waitForServer(LOCAL_URL);
  if (!ready) {
    console.error("  ❌  لم يبدأ الخادم — تحقق من الأخطاء أعلاه");
    server.kill();
    process.exit(1);
  }

  console.log("  🌐  إنشاء رابط HTTPS خارجي...");
  const bin = await ensureCloudflared();
  const { proc: tunnel, publicUrl } = await startTunnel(bin);

  printShareBanner(publicUrl);
  openBrowser(`${publicUrl}/ar`);

  const cleanup = () => {
    console.log("\n  ⏹  إيقاف...");
    tunnel.kill();
    server.kill();
    if (process.platform === "win32") {
      try {
        execSync('taskkill /F /IM cloudflared.exe 2>nul', { stdio: "ignore", shell: true });
      } catch {}
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  server.on("exit", () => {
    tunnel.kill();
    process.exit(0);
  });
  tunnel.on("exit", () => {
    console.log("\n  ⚠️  انقطع الرابط الخارجي");
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
