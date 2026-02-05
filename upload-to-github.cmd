@echo off
echo.
echo ========================================
echo    Uploading to GitHub
echo ========================================
echo.

cd /d "C:\Users\User\Desktop\neonOasis-main"

echo [1/6] Initializing Git...
"C:\Program Files\Git\bin\git.exe" init

echo [2/6] Configuring Git...
"C:\Program Files\Git\bin\git.exe" config user.name "relaya17"
"C:\Program Files\Git\bin\git.exe" config user.email "relaya17@users.noreply.github.com"

echo [3/6] Adding all files...
"C:\Program Files\Git\bin\git.exe" add .

echo [4/6] Creating commit...
"C:\Program Files\Git\bin\git.exe" commit -m "feat: complete neon oasis platform - turborepo, responsive, card games"

echo [5/6] Adding GitHub remote...
"C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/relaya17/neonOasis.git 2>nul

echo [6/6] Pushing to GitHub...
"C:\Program Files\Git\bin\git.exe" push -u origin main --force

echo.
echo ========================================
echo    SUCCESS!
echo ========================================
echo.
echo Check: https://github.com/relaya17/neonOasis
echo.
echo Next: Deploy to Vercel and Render
echo.
pause
