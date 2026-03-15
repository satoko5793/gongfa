@echo off
setlocal
cd /d %~dp0

echo Starting gongfa local server on http://127.0.0.1:8090
echo.
echo Notes:
echo - Local file store mode is enabled via .env
echo - Fixed admin account: 584967604 / 159321
echo - Frontend and API are served from the same origin
echo.

cd backend
node src\server.js
