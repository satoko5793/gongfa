@echo off
setlocal
cd /d %~dp0

if exist backend\dev-data.json (
  del /f /q backend\dev-data.json
  echo Local dev data reset.
) else (
  echo No backend\dev-data.json found.
)
