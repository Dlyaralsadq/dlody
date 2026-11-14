@echo off
cd /d "%~dp0"
node scripts/build-mobile-apk.js
pause
