#!/usr/bin/env bash
# ═══════════════════════════════════════════════════
#  ClinicPro — سكريبت التشغيل السريع
#  الاستخدام:  bash start.sh
# ═══════════════════════════════════════════════════
set -e
cd "$(dirname "$0")"

BLUE='\033[0;34m'; CYAN='\033[0;36m'; GREEN='\033[0;32m'
YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'

echo ""
echo -e "${CYAN}${BOLD}  🏥  ClinicPro — تشغيل التطبيق${NC}"
echo -e "${CYAN}  ═══════════════════════════════${NC}"
echo ""

# ── 1. إيقاف أي خادم سابق ──────────────────────────────────────────
echo -e "${YELLOW}  ⏹  إيقاف الخادم القديم...${NC}"
pkill -f "next dev" 2>/dev/null || true
pkill -f "cloudflared" 2>/dev/null || true
pkill -f "localtunnel" 2>/dev/null || true
sleep 1

# ── 2. توليد Prisma Client ─────────────────────────────────────────
echo -e "${BLUE}  🔧  تجهيز قاعدة البيانات...${NC}"
npm run db:generate -w @iraq-clinic/database --silent 2>/dev/null || true

# ── 3. تشغيل الخادم ────────────────────────────────────────────────
echo -e "${BLUE}  🚀  تشغيل الخادم...${NC}"
npm run dev -w @iraq-clinic/clinic-system > /tmp/next.log 2>&1 &
NEXT_PID=$!

# انتظر حتى يصبح الخادم جاهزاً
for i in {1..30}; do
  sleep 1
  if curl -s -o /dev/null http://localhost:3000/ar 2>/dev/null; then
    break
  fi
done

# ── 4. تشغيل النفق (رابط خارجي) ──────────────────────────────────
echo -e "${BLUE}  🌐  إنشاء رابط خارجي...${NC}"

# تحميل cloudflared إذا لم يكن موجوداً
if [ ! -f /tmp/cloudflared ]; then
  curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
    -o /tmp/cloudflared 2>/dev/null && chmod +x /tmp/cloudflared
fi

/tmp/cloudflared tunnel --url http://localhost:3000 > /tmp/tunnel.log 2>&1 &
TUNNEL_PID=$!

# انتظر حتى يظهر الرابط
for i in {1..20}; do
  sleep 1
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/tunnel.log 2>/dev/null | tail -1)
  if [ -n "$URL" ]; then break; fi
done

# ── 5. عرض النتائج ────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}  ✅  التطبيق يعمل!${NC}"
echo ""
echo -e "${CYAN}  ════════════════════════════════════════════${NC}"
echo ""

if [ -n "$URL" ]; then
  echo -e "${GREEN}${BOLD}  🔗  الرابط الخارجي (افتحه من أي متصفح):${NC}"
  echo -e "${BOLD}      ${URL}/ar${NC}"
  echo ""
fi

echo -e "${BLUE}  💻  الرابط المحلي (داخل Cursor Desktop):${NC}"
echo -e "      http://localhost:3000/ar"
echo ""
echo -e "${CYAN}  ════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}  👤  بيانات الدخول:${NC}"
echo -e "      مدير المنصة:  admin  /  admin123"
echo -e "      طبيب:         dr.ahmad  /  admin123"
echo ""
echo -e "${CYAN}  📱  صفحات التطبيق:${NC}"
echo -e "      الرئيسية:     ${URL}/ar"
echo -e "      بحث أطباء:    ${URL}/ar/patient"
echo -e "      لوحة الأدمن:  ${URL}/ar/admin"
echo -e "      دخول الطبيب:  ${URL}/ar/login"
echo ""
echo -e "${RED}  ⏹  لإيقاف التطبيق اضغط:  Ctrl+C${NC}"
echo ""

# ── احتفظ بالسكريبت حياً حتى Ctrl+C ──────────────────────────────
trap "echo ''; echo -e '${RED}  ⏹  جاري الإيقاف...${NC}'; kill $NEXT_PID $TUNNEL_PID 2>/dev/null; exit 0" INT TERM

# حفظ الرابط لاستخدامه لاحقاً
echo "$URL" > /tmp/clinic_url.txt

wait
