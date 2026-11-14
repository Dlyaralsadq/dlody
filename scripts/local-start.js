#!/usr/bin/env node

/**

 * Local startup: SQLite DB + Next.js on all interfaces (LAN) + open browser on this PC.

 */

const { execSync, spawn } = require("child_process");

const os = require("os");

const path = require("path");



const root = path.join(__dirname, "..");

const PORT = 3000;

const LOCAL_URL = `http://127.0.0.1:${PORT}/ar`;



function getLanAddresses() {

  const nets = os.networkInterfaces();

  const addrs = [];

  for (const name of Object.keys(nets)) {

    for (const net of nets[name] ?? []) {

      const isV4 = net.family === "IPv4" || net.family === 4;

      if (isV4 && !net.internal) {

        addrs.push({ name, address: net.address });

      }

    }

  }

  return addrs;

}



function run(cmd) {

  console.log(`▶ ${cmd}`);

  execSync(cmd, { cwd: root, stdio: "inherit", shell: true });

}



function stopPort3000() {

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

    } else {

      execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, {

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



function printNetworkUrls(lanAddrs) {

  console.log("  ───────────────────────────────────────");

  console.log("  💻  على هذا الجهاز:");

  console.log("      " + LOCAL_URL);

  console.log("");

  if (lanAddrs.length === 0) {

    console.log("  📱  لم يُعثر على عنوان شبكة محلية (Wi‑Fi/Ethernet)");

  } else {

    console.log("  📱  من هاتف أو جهاز آخر (نفس شبكة Wi‑Fi):");

    for (const { name, address } of lanAddrs) {

      console.log(`      http://${address}:${PORT}/ar   (${name})`);

    }

    console.log("");

    console.log("  💡  تأكد أن الجهازين على نفس الشبكة");

    console.log("  💡  إذا لم يفتح: اسمح لـ Node.js في جدار حماية Windows");

  }

  console.log("  ───────────────────────────────────────");

}



async function main() {

  const lanAddrs = getLanAddresses();



  console.log("");

  console.log("  🏥  ClinicPro — تشغيل محلي + الشبكة");

  console.log("  ═══════════════════════════════════════");

  console.log("");



  stopPort3000();

  run("npm run db:generate");

  run("npm run db:deploy");

  run("npm run db:seed-check");



  console.log("");

  console.log("  🚀  تشغيل الخادم (متاح على الشبكة المحلية)...");

  printNetworkUrls(lanAddrs);

  console.log("  👤  مدير المنصة: admin / admin123");

  console.log("  👤  طبيب:         dr.ahmad / admin123");

  console.log("  ⏹  للإيقاف:      Ctrl+C");

  console.log("");



  const server = spawn("npm run dev", {

    cwd: root,

    stdio: "inherit",

    shell: true,

  });



  const ready = await waitForServer(LOCAL_URL);

  if (ready) {

    openBrowser(LOCAL_URL);

    console.log("");

    console.log("  ✅  النظام يعمل");

    printNetworkUrls(lanAddrs);

    console.log("  💡  اترك نافذة CMD مفتوحة طوال فترة الاستخدام");

    console.log("");

  } else {

    console.log("");

    console.log("  ⚠️  لم يستجب الخادم — افتح يدوياً: " + LOCAL_URL);

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

