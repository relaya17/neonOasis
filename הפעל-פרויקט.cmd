@echo off
cd /d "%~dp0"
echo ========================================
echo   NEON OASIS - הפעלת פרויקט
echo ========================================
echo.

echo שלב 1/2: התקנת תלויות (פעם ראשונה עשוי לקחת כמה דקות)...
set CI=true
call pnpm install
if errorlevel 1 (
  echo שגיאה בהתקנה.
  pause
  exit /b 1
)

echo.
echo שלב 2/2: הפעלת שרתי פיתוח...
echo   Web:  http://localhost:5273
echo   API:  http://localhost:4000
echo.
call pnpm run dev

pause
