#!/usr/bin/env bash
# ClinicPro Auto-Startup Script
# Runs on VM start: restores DB, starts server, opens tunnel

set -e
cd "$(dirname "$0")"

echo "🏥 ClinicPro Startup..."

# 1. Install dependencies if missing
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/next" ]; then
  echo "📦 Installing dependencies..."
  git fetch origin && git checkout cursor/clinic-saas-mvp-a943
  npm install
fi

# 2. Generate Prisma & migrate
echo "🗄️  Setting up database..."
npx prisma generate --config prisma.config.ts 2>/dev/null || true
npx prisma migrate deploy 2>/dev/null || true

# 3. Seed if DB is empty
USER_COUNT=$(npx tsx -e "
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: 'file:./dev.db' }) });
p.user.count().then(n => { console.log(n); p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "🌱 Seeding database..."
  npx tsx prisma/seed.ts
  # Add secretary + extra specialties
  npx tsx -e "
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: 'file:./dev.db' }) });
async function run() {
  const hashed = await bcrypt.hash('admin123', 12);
  const drUser = await prisma.user.findUnique({ where: { username: 'dr.ahmad' } });
  const doctor = await prisma.doctor.findUnique({ where: { userId: drUser.id } });
  await prisma.user.upsert({ where: { username: 'secretary1' }, update: {}, create: { username: 'secretary1', password: hashed, name: 'سكرتيرة العيادة', role: 'secretary', linkedDoctorId: doctor.id } });
  const specs = [
    { id: 'dentistry', name: 'Dentistry', nameAr: 'طب الأسنان' },
    { id: 'ent', name: 'ENT', nameAr: 'أنف وأذن وحنجرة' },
    { id: 'pulmonology', name: 'Pulmonology', nameAr: 'أمراض الصدر والجهاز التنفسي' },
    { id: 'endocrinology', name: 'Endocrinology', nameAr: 'الغدد الصماء والسكري' },
    { id: 'rheumatology', name: 'Rheumatology', nameAr: 'الروماتيزم' },
    { id: 'urology', name: 'Urology', nameAr: 'المسالك البولية' },
    { id: 'psychiatry', name: 'Psychiatry', nameAr: 'الطب النفسي' },
    { id: 'oncology', name: 'Oncology', nameAr: 'أورام' },
    { id: 'obstetrics', name: 'Obstetrics & Gynecology', nameAr: 'النساء والولادة' },
    { id: 'nephrology', name: 'Nephrology', nameAr: 'كلى' },
    { id: 'hematology', name: 'Hematology', nameAr: 'أمراض الدم' },
    { id: 'surgery', name: 'General Surgery', nameAr: 'الجراحة العامة' },
    { id: 'emergency', name: 'Emergency Medicine', nameAr: 'الطوارئ' },
    { id: 'radiology', name: 'Radiology', nameAr: 'الأشعة' },
  ];
  for (const s of specs) await prisma.specialty.upsert({ where: { id: s.id }, update: {}, create: s });
  console.log('✅ Setup complete');
  await prisma.\$disconnect();
}
run().catch(console.error);
  "
fi

# 4. Build if .next doesn't exist
if [ ! -d ".next" ]; then
  echo "🔨 Building production..."
  npm run build
fi

# 5. Start server with pm2
echo "🚀 Starting server..."
node_modules/.bin/pm2 describe clinicpro > /dev/null 2>&1 \
  && node_modules/.bin/pm2 restart clinicpro \
  || node_modules/.bin/pm2 start ecosystem.config.js

sleep 3

# 6. Download cloudflared if missing
if [ ! -f "/tmp/cloudflared" ]; then
  curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
  chmod +x /tmp/cloudflared
fi

# 7. Start tunnel in background
echo "🌐 Starting tunnel..."
nohup /tmp/cloudflared tunnel --url http://localhost:3000 > /tmp/tunnel.log 2>&1 &

sleep 8
URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel.log | tail -1)

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ ClinicPro is running!"
echo "  📍 Local:    http://localhost:3000"
echo "  🌐 Public:   $URL"
echo "  👤 Admin:    admin / admin123"
echo "  🩺 Doctor:   dr.ahmad / admin123"
echo "  📋 Secretary: secretary1 / admin123"
echo "═══════════════════════════════════════════"
