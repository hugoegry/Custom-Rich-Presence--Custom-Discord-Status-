$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "==> Build front React"
Set-Location frontend
npm install
npm run build
Set-Location ..

Write-Host "==> Install deps Python (packaging)"
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pip install pyinstaller

if (-not (Test-Path "frontend\dist\index.html")) {
  throw "frontend/dist manquant apres build"
}

Write-Host "==> PyInstaller"
.\.venv\Scripts\pyinstaller.exe --noconfirm he-custom-rich-presence.spec

Write-Host ""
Write-Host "Build OK (dist\he-custom-rich-presence\he-custom-rich-presence.exe)"