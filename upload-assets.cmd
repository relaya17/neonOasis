@echo off
echo.
echo ========================================
echo    Uploading Assets to GitHub
echo ========================================
echo.

cd /d "C:\Users\User\Desktop\neonOasis-main"

echo [1/3] Adding new files...
& "C:\Program Files\Git\bin\git.exe" add apps/web/public/sounds/ apps/web/public/images/ apps/web/public/*.png

echo [2/3] Committing...
& "C:\Program Files\Git\bin\git.exe" commit -m "feat: add sound files and images"

echo [3/3] Pushing to GitHub...
& "C:\Program Files\Git\bin\git.exe" push origin main

echo.
echo ========================================
echo    SUCCESS!
echo ========================================
echo.
echo GitHub updated!
echo Netlify will auto-deploy in ~2 minutes
echo.
pause
