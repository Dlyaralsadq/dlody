# نشر طبيبي على tabibee.com

النطاق لا يشغّل الموقع. يلزم مضيف (Vercel) وقاعدة Postgres (Neon)، ثم ربط DNS.

في Vercel اجعل Root Directory = `apps/clinic-system`.

متغيرات البيئة:

- `DATABASE_URL` رابط Neon الذي يبدأ بـ `postgresql://`
- `SESSION_SECRET` 32 حرفاً على الأقل
- `NEXT_PUBLIC_APP_URL` = `https://tabibee.com`
- `RESEND_API_KEY` و `RESET_EMAIL_FROM` = `Tabibee <noreply@tabibee.com>` عند تفعيل البريد

بعد إنشاء Neon، من جهازك مرة واحدة:

```powershell
$env:DATABASE_URL="postgresql://..."
npm run db:push
npm run db:seed
```

ثم في Vercel أضف النطاق `tabibee.com` وانسخ سجلات DNS التي يعرضها إلى لوحة شراء النطاق.

على قاعدة Postgres لا يضيف `db:seed` أطباء أو مرضى تجريبيين. حساب المدير الحالي لا يُستبدل.
ملفات المرضى والمنشورات والقصص والصور تُحفظ داخل قاعدة البيانات وتبقى بعد نشر نسخة جديدة.
