# Install Everything — Neon Oasis
# Installs all dependencies for production readiness

Write-Host "🚀 Installing all dependencies for Neon Oasis..." -ForegroundColor Cyan
Write-Host ""

# Function to run command and check exit code
function Run-Command {
    param($Command, $Description)
    Write-Host "⏳ $Description..." -ForegroundColor Yellow
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed: $Description" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Success: $Description" -ForegroundColor Green
    Write-Host ""
}

# Step 1: Root dependencies
Run-Command "pnpm install" "Installing root dependencies"

# Step 2: Shared package
Set-Location "packages\shared"
Run-Command "pnpm install" "Installing shared package dependencies"
Set-Location "..\..\"

# Step 3: API dependencies
Set-Location "apps\api"
Run-Command "pnpm install" "Installing API dependencies"
Run-Command "pnpm add ioredis" "Installing Redis client"
Run-Command "pnpm add speakeasy qrcode" "Installing 2FA libraries"
Run-Command "pnpm add -D @types/speakeasy @types/qrcode" "Installing 2FA TypeScript types"
Set-Location "..\..\"

# Step 4: Web dependencies
Set-Location "apps\web"
Run-Command "pnpm install" "Installing Web dependencies"
Run-Command "pnpm add howler" "Installing Howler.js for audio"
Run-Command "pnpm add -D @types/howler" "Installing Howler.js types"
Set-Location "..\..\"

# Step 5: Dev dependencies
Run-Command "pnpm add -D artillery" "Installing Artillery for load testing"

Write-Host ""
Write-Host "🎉 All dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. pnpm run build" -ForegroundColor White
Write-Host "2. pnpm run db:run-sql (if DATABASE_URL is set)" -ForegroundColor White
Write-Host "3. pnpm run dev" -ForegroundColor White
Write-Host ""
