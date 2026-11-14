@echo off

chcp 65001 >nul

title ClinicPro - رابط للمشاركة

cd /d "%~dp0"



if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"



echo.

echo   ClinicPro - رابط للصديق

echo   =======================

echo.

echo   يعمل خارج Cursor - انقر مرتين من مستكشف الملفات

echo   سيظهر رابط HTTPS ارسله لصديقك (اي مكان في العالم)

echo   اترك هذه النافذة مفتوحة

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



call npm run share

pause

