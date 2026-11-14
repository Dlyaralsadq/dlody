@echo off
chcp 65001 >nul
title ClinicPro - تشغيل محلي
cd /d "%~dp0"

if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"

echo.
echo   ClinicPro
echo   ========
echo.
echo   يعمل خارج Cursor - انقر مرتين من مستكشف الملفات
echo.
echo   سيفتح المتصفح بعد جاهزية الخادم
echo   على هذا الجهاز: http://127.0.0.1:3000/ar
echo   من جهاز آخر (نفس Wi-Fi): http://IP-الجهاز:3000/ar
echo.
echo   لارسال الرابط لصديق (اي مكان): شغّل start-share.bat
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo   [خطأ] Node.js غير مثبت — https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo   تثبيت المكتبات...
  call npm install
  if errorlevel 1 pause & exit /b 1
)

call npm run local
pause
