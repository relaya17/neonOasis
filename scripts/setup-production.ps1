# Setup Production — Complete Setup Script
# Runs everything needed for production deployment

Write-Host "🚀 NEON OASIS — Production Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env created. Please edit it with your settings." -ForegroundColor Green
        Write-Host ""
        Write-Host "❗ STOP! Edit .env now and set:" -ForegroundColor Red
        Write-Host "   - DATABASE_URL=postgresql://..." -ForegroundColor White
        Write-Host "   - REDIS_URL=redis://... (optional)" -ForegroundColor White
        Write-Host ""
        Write-Host "Press Enter when done..." -ForegroundColor Yellow
        Read-Host
    }
}

# Function to run command
function Run-Step {
    param($Command, $Description, $StopOnError = $true)
    Write-Host "⏳ $Description..." -ForegroundColor Yellow
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0 -and $StopOnError) {
        Write-Host "❌ Failed: $Description" -ForegroundColor Red
        Write-Host "   Run manually: $Command" -ForegroundColor Gray
        exit 1
    }
    Write-Host "✅ $Description" -ForegroundColor Green
    Write-Host ""
}

# Step 1: Install all dependencies
Write-Host "📦 Step 1/5: Installing dependencies..." -ForegroundColor Cyan
Set-Location "packages\shared"
Run-Step "pnpm install" "Shared package dependencies"
Set-Location "..\..\"

Set-Location "apps\api"
Run-Step "pnpm install" "API dependencies"
Set-Location "..\..\"

Set-Location "apps\web"
Run-Step "pnpm install" "Web dependencies"
Set-Location "..\..\"

Run-Step "pnpm install" "Root dependencies"

# Step 2: Build shared package
Write-Host "🔨 Step 2/5: Building shared package..." -ForegroundColor Cyan
Run-Step "pnpm run build:shared" "Build @neon-oasis/shared"

# Step 3: Build API
Write-Host "🔨 Step 3/5: Building API..." -ForegroundColor Cyan
Run-Step "pnpm run build:api" "Build API server"

# Step 4: Build Web
Write-Host "🔨 Step 4/5: Building Web..." -ForegroundColor Cyan
Run-Step "pnpm run build:web" "Build Web app"

# Step 5: Run migrations (if DATABASE_URL exists)
Write-Host "🗄️  Step 5/5: Database migrations..." -ForegroundColor Cyan
if ($env:DATABASE_URL) {
    Run-Step "pnpm run db:run-sql" "Run database migrations" $false
} else {
    Write-Host "⚠️  DATABASE_URL not set. Skipping migrations." -ForegroundColor Yellow
    Write-Host "   Set DATABASE_URL in .env and run: pnpm run db:run-sql" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "🎉 Production setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the servers:" -ForegroundColor Cyan
Write-Host "  pnpm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use the automated script:" -ForegroundColor Cyan
Write-Host "  .\run-dev.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Web:  http://localhost:5273" -ForegroundColor Green
Write-Host "API:  http://localhost:4000" -ForegroundColor Green
Write-Host ""
