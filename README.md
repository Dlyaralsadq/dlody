# Iraq Clinic Platform — ClinicPro

منصة موحّدة لإدارة العيادات الطبية في العراق.  
تطبيق واحد يخدم ثلاثة أطراف: **المريض · الطبيب · مدير المنصة**

---

## الروابط بعد النشر

| الرابط | الوظيفة |
|--------|---------|
| `/ar` | الصفحة الرئيسية — اختر طبيب أم مريض |
| `/ar/patient` | تطبيق المريض: بحث + حجز |
| `/ar/patient/doctor/:id` | تفاصيل الطبيب + حجز أونلاين |
| `/ar/login` | دخول الطبيب / السكرتير |
| `/ar/doctor` | لوحة الطبيب |
| `/ar/secretary` | لوحة السكرتير |
| `/ar/admin` | لوحتك — إدارة الأطباء والاشتراكات |

---

## 🚀 نشر على Railway (رابط دائم مجاني)

### الخطوة 1 — إنشاء حساب Railway

1. افتح [railway.app](https://railway.app)
2. اضغط **Start a New Project**
3. سجّل دخول بـ **GitHub**

---

### الخطوة 2 — ربط المستودع

1. اضغط **New Project**
2. اختر **Deploy from GitHub repo**
3. ابحث عن مستودعك **`-`** واختره
4. اختر الفرع: **`cursor/monorepo-platform-430e`**
5. اضغط **Deploy Now** — سيبدأ البناء تلقائياً

> ⚠️ البناء سيفشل في البداية لأن قاعدة البيانات غير موجودة. هذا طبيعي، تابع الخطوة 3.

---

### الخطوة 3 — إضافة قاعدة بيانات PostgreSQL

1. من لوحة مشروعك في Railway اضغط **+ New**
2. اختر **Database → Add PostgreSQL**
3. انتظر 30 ثانية حتى تُنشأ قاعدة البيانات

---

### الخطوة 4 — ربط قاعدة البيانات بالتطبيق

1. اضغط على خدمة **التطبيق** (ليس PostgreSQL)
2. اذهب لتبويب **Variables**
3. اضغط **+ New Variable**
4. اكتب في اسم المتغير: `DATABASE_URL`
5. اضغط على **Add Reference** → اختر **PostgreSQL** → اختر **DATABASE_URL**
6. هكذا يتصل التطبيق بقاعدة البيانات تلقائياً

---

### الخطوة 5 — إعادة النشر

1. اذهب لتبويب **Deployments**
2. اضغط على آخر deployment → **Redeploy**
3. انتظر 2-3 دقائق حتى يكتمل البناء

---

### الخطوة 6 — الحصول على الرابط الدائم

1. اذهب لتبويب **Settings**
2. تحت **Networking** اضغط **Generate Domain**
3. ستحصل على رابط مثل: `https://your-app.up.railway.app`

**هذا هو رابطك الدائم ✅**

---

### الخطوة 7 — تسجيل الدخول للمرة الأولى

افتح الرابط ثم:

| الدور | المستخدم | كلمة المرور |
|-------|----------|-------------|
| مدير المنصة (أنت) | `admin` | `admin123` |
| طبيب تجريبي | `dr.ahmad` | `admin123` |

> ⚠️ **غيّر كلمة المرور فوراً** من لوحة الأدمن بعد أول دخول!

---

## 🔧 تشغيل محلي (للتطوير)

```bash
git clone https://github.com/Dlyaralsadq/-..git
cd -.
npm install
npm run db:migrate
npm run db:seed
npm run dev         # http://localhost:3000
```

---

## بيانات الدخول التجريبية (محلي)

| الدور | المستخدم | كلمة المرور |
|-------|----------|-------------|
| مدير المنصة | `admin` | `admin123` |
| طبيب | `dr.ahmad` | `admin123` |

---

## أوامر قاعدة البيانات

```bash
npm run db:migrate   # تشغيل migrations (SQLite محلي)
npm run db:seed      # إضافة بيانات تجريبية
npm run db:studio    # فتح Prisma Studio
npm run db:reset     # إعادة تعيين كاملة
```

---

## هيكل المشروع

```
apps/
  clinic-system/     التطبيق الموحّد (مريض + طبيب + أدمن)
packages/
  database/          Prisma schema + migrations
  config/            TypeScript base config
scripts/
  deploy-start.js    سكريبت إقلاع الإنتاج
```

---

## المتغيرات البيئية المطلوبة في Railway

| المتغير | القيمة |
|---------|--------|
| `DATABASE_URL` | رابط PostgreSQL (من Railway تلقائياً) |
| `NEXTAUTH_SECRET` | نص عشوائي طويل |
| `NEXT_OUTPUT` | `standalone` |
