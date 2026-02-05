# NEON OASIS - הפעלה ממקום אחד (PowerShell)
Set-Location $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NEON OASIS - Install, Build, Run" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1/3: Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Step 2/3: Building (shared -> api -> web)..." -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Step 3/3: Starting dev servers..." -ForegroundColor Green
Write-Host "  Web:  http://localhost:5273" -ForegroundColor Gray
Write-Host "  API:  http://localhost:4000" -ForegroundColor Gray
Write-Host ""
pnpm run dev
