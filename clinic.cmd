@echo off
chcp 65001 >nul
title ClinicPro
cd /d "%~dp0"

if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"

where node >nul 2>&1
if errorlevel 1 (
  echo [خطأ] Node.js غير مثبت. حمّله من https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo تثبيت المكتبات لأول مرة...
  call npm install || exit /b 1
)

call npm run local
