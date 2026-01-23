@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo npm not found. Install Node.js from https://nodejs.org and try again.
  pause
  exit /b 1
)
echo Installing dependencies (if needed)...
call npm install
if errorlevel 1 (
  echo npm install failed.
  pause
  exit /b 1
)
echo Starting dev server on port 3001...
call npm run dev -- --port 3001
endlocal
