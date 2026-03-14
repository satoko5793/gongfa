@echo off
setlocal
cd /d %~dp0

echo Starting xyzw_web_helper on http://127.0.0.1:3000
echo.

cd xyzw_web_helper
pnpm.cmd dev -- --host 127.0.0.1
