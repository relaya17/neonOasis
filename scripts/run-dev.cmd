@echo off
cd /d "%~dp0"
echo ========================================
echo   NEON OASIS - הפעלה ממקום אחד
echo ========================================
echo.
echo שלב 1/3: התקנת תלויות (install)...
call pnpm install
if errorlevel 1 (
  echo שגיאה בהתקנה. יוצא.
  pause
  exit /b 1
)
echo.
echo שלב 2/3: בנייה (build)...
call pnpm run build
if errorlevel 1 (
  echo שגיאה בבנייה. יוצא.
  pause
  exit /b 1
)
echo.
echo שלב 3/3: הפעלת שרתים (dev)...
echo   Web:  http://localhost:5273
echo   API:  http://localhost:4000
echo.
call pnpm run dev
pause
