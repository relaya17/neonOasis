# Quick build verification - saves output to build-output.txt
$ErrorActionPreference = "Continue"
$out = "build-output.txt"
"=== BUILD VERIFY $(Get-Date) ===" | Tee-Object $out
pnpm run build 2>&1 | Tee-Object $out -Append
$LASTEXITCODE
