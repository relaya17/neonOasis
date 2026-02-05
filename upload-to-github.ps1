# Upload to GitHub Script
# Run this in a NEW PowerShell window

Write-Host "🚀 Uploading Neon Oasis to GitHub..." -ForegroundColor Cyan

# Navigate to project
Set-Location "C:\Users\User\Desktop\neonOasis-main"

# Initialize git (if not already)
& "C:\Program Files\Git\bin\git.exe" init

# Configure git
& "C:\Program Files\Git\bin\git.exe" config user.name "relaya17"
& "C:\Program Files\Git\bin\git.exe" config user.email "relaya17@users.noreply.github.com"

# Add all files
Write-Host "📦 Adding all files..." -ForegroundColor Yellow
& "C:\Program Files\Git\bin\git.exe" add .

# Commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow  
& "C:\Program Files\Git\bin\git.exe" commit -m "feat: complete neon oasis platform - turborepo, responsive, card games"

# Add remote
Write-Host "🔗 Adding GitHub remote..." -ForegroundColor Yellow
& "C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/relaya17/neonOasis.git 2>$null

# Push
Write-Host "⬆️  Pushing to GitHub..." -ForegroundColor Yellow
& "C:\Program Files\Git\bin\git.exe" push -u origin main --force

Write-Host "✅ Done! Check: https://github.com/relaya17/neonOasis" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy to Vercel: https://vercel.com/new" -ForegroundColor White
Write-Host "2. Deploy to Render: https://dashboard.render.com" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
