@echo off
cd /d "%~dp0"
echo Installing dependencies if needed...
call pnpm install
echo.
echo Starting Web only (Vite) - open http://localhost:5273
call pnpm run dev:web
pause
