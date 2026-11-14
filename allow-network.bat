@echo off

chcp 65001 >nul

title ClinicPro - السماح بالشبكة (Firewall)

cd /d "%~dp0"



echo.

echo   ClinicPro — فتح المنفذ 3000 في جدار حماية Windows

echo   ==================================================

echo.

echo   يسمح للأجهزة الأخرى على نفس الشبكة بالاتصال بالنظام.

echo   يتطلب تشغيل CMD كمسؤول (Run as administrator).

echo.



netsh advfirewall firewall show rule name="ClinicPro Dev 3000" >nul 2>&1

if errorlevel 1 (

  netsh advfirewall firewall add rule name="ClinicPro Dev 3000" dir=in action=allow protocol=TCP localport=3000

  if errorlevel 1 (

    echo   [خطأ] فشل — شغّل هذا الملف كمسؤول: Run as administrator

    pause

    exit /b 1

  )

  echo   [تم] تمت إضافة قاعدة جدار الحماية للمنفذ 3000

) else (

  echo   [موجود] القاعدة موجودة مسبقاً

)



echo.

pause

