# NEON OASIS - העלאה ל-GitHub
# הרץ את הסקריפט מתוך תיקיית הפרויקט (neonOasis)

$ErrorActionPreference = "Stop"
$repoUrl = "https://github.com/relaya17/neonOasis.git"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NEON OASIS - Push to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# בדיקה שאנחנו בתיקיית הפרויקט
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Run this script from the neonOasis project folder." -ForegroundColor Red
    Write-Host "Example: cd C:\Users\...\neonOasis" -ForegroundColor Gray
    exit 1
}

# 1. הוספת כל הקבצים
Write-Host "Step 1: Staging files (git add)..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) { exit 1 }

# 2. Commit
Write-Host "Step 2: Creating commit..." -ForegroundColor Yellow
$commitMsg = "fix: LoginView.tsx and Netlify build - push fixes to deploy"
git commit -m $commitMsg 2>$null
if ($LASTEXITCODE -ne 0) {
    # אולי אין שינויים
    $status = git status --short
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Host "Nothing to commit (already up to date)." -ForegroundColor Gray
    } else {
        Write-Host "Commit failed. Check git status." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Commit created." -ForegroundColor Green
}

# 3. בדיקת remote
Write-Host "Step 3: Checking remote..." -ForegroundColor Yellow
$remotes = git remote
if ($remotes -notcontains "origin") {
    Write-Host "Adding remote: origin = $repoUrl" -ForegroundColor Gray
    git remote add origin $repoUrl
} else {
    $currentUrl = git remote get-url origin 2>$null
    if ($currentUrl -ne $repoUrl) {
        Write-Host "Setting origin URL to: $repoUrl" -ForegroundColor Gray
        git remote set-url origin $repoUrl
    }
}

# 4. Push (main או master)
$branch = git branch --show-current
Write-Host "Step 4: Pushing to origin/$branch..." -ForegroundColor Yellow
Write-Host ""
Write-Host "If prompted, sign in to GitHub (browser or token)." -ForegroundColor Gray
Write-Host ""

git push -u origin $branch

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Push failed. Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. If repo on GitHub has different default branch (e.g. main):" -ForegroundColor Gray
    Write-Host "     git branch -M main" -ForegroundColor Gray
    Write-Host "     git push -u origin main" -ForegroundColor Gray
    Write-Host "  2. If you need to force (overwrite GitHub):" -ForegroundColor Gray
    Write-Host "     git push -u origin $branch --force" -ForegroundColor Gray
    Write-Host "  3. Authenticate: GitHub -> Settings -> Developer -> Personal access token" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Done! Project is at: https://github.com/relaya17/neonOasis" -ForegroundColor Green
Write-Host ""
