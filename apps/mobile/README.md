# طبيبي Mobile (Capacitor)

غلاف Android/iOS يعرض **نفس موقع طبيبي** (tabibee.com) داخل WebView (للمعاينة والمتاجر لاحقاً).

## المتطلبات (معاينة على Windows)

1. [Android Studio](https://developer.android.com/studio) + SDK + محاكي أو هاتف USB
2. JDK 17+
3. الموقع يعمل: `clinic.cmd` من جذر الم monorepo

## أول مرة

```bash
cd clinic-platform
npm install
npm run mobile:setup
```

(إذا لم يُنشأ مجلد `android` بعد: من `apps/mobile` نفّذ `npx cap add android` ثم `npm run mobile:sync` من الجذر.)

## معاينة سريعة

1. نافذة 1: `clinic.cmd`
2. نافذة 2: `mobile-preview.bat` أو `npm run mobile:preview`
3. في Android Studio: **Run ▶** على محاكي أو جهاز

## عنوان الخادم

- **هاتف على نفس Wi‑Fi:** `npm run config:lan -w @iraq-clinic/mobile` ثم `npm run mobile:sync`
- **محاكي Android:** `npm run config:emulator -w @iraq-clinic/mobile` ثم `npm run mobile:sync`
- **يدوي:** `set CAP_SERVER_URL=http://192.168.x.x:3000/ar/patient` ثم `config:lan`

## iOS

يتطلب Mac + Xcode: `npx cap add ios` من هذا المجلد.
