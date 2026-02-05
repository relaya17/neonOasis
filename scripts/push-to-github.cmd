@echo off
cd /d "%~dp0"
echo ========================================
echo   NEON OASIS - Push to GitHub
echo ========================================
echo.
echo If a LOGIN WINDOW or BROWSER opens - complete it. This window will wait.
echo.

echo Step 1: Staging files...
git add .
if errorlevel 1 goto :error

echo Step 2: Creating commit...
git commit -m "fix: LoginView and Netlify build - push fixes to deploy"
if errorlevel 1 (
  echo No changes to commit - OK. Continuing...
)

echo Step 3: Checking remote...
git remote get-url origin 2>nul || (
  git remote add origin https://github.com/relaya17/neonOasis.git
)

echo Step 4: Pushing to GitHub...
git branch -M main 2>nul
git push -u origin main
if errorlevel 1 goto :pusherror

echo.
echo Done! https://github.com/relaya17/neonOasis
pause
goto :eof

:pusherror
echo.
echo Push failed. Try:
echo   1. Sign in: GitHub -^> Settings -^> Developer -^> Personal access token
echo   2. Or run: git push -u origin main --force
echo.
pause
goto :eof

:error
echo Error during git add.
pause
exit /b 1
