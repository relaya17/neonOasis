# Create empty placeholder sound files
$soundsDir = "C:\Users\User\Desktop\neonOasis-main\apps\web\public\sounds"

$sounds = @(
    "click.mp3",
    "neon_click.mp3", 
    "dice_roll.mp3",
    "dice_land.mp3",
    "win.mp3",
    "lose.mp3",
    "coin.mp3",
    "notification.mp3",
    "card_flip.mp3",
    "chip_stack.mp3"
)

Write-Host "Creating placeholder sound files..." -ForegroundColor Cyan

foreach ($sound in $sounds) {
    $path = Join-Path $soundsDir $sound
    # Create empty file (TTS fallback will work)
    New-Item -Path $path -ItemType File -Force | Out-Null
    Write-Host "✓ Created: $sound" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done! Files created in: $soundsDir" -ForegroundColor Green
Write-Host "TTS fallback will work until you add real MP3 files" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
