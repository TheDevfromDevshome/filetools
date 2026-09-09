# FileTools Installer — Windows
# Runs prerequisite checks and installs the native tools FileTools needs.
# Source: powershell -ExecutionPolicy Bypass -File scripts/install.ps1

$ErrorActionPreference = "Stop"
Write-Host "=== FileTools Installer (Windows) ===" -ForegroundColor Cyan

function Test-Cmd($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Install-Winget($id, $name) {
  if (Test-Cmd "winget") {
    Write-Host "  Installing $name via winget..." -ForegroundColor Yellow
    winget install --id $id --accept-package-agreements --accept-source-agreements --silent 2>$null
  } else {
    Write-Host "  [skip] winget not available — install '$name' manually." -ForegroundColor DarkYellow
  }
}

# --- Node.js + pnpm -------------------------------------------------------
Write-Host "`n[1/6] Node.js & pnpm" -ForegroundColor Green
if (Test-Cmd "node") {
  Write-Host "  node found: $((node --version))"
} else {
  Install-Winget "OpenJS.NodeJS.LTS" "Node.js LTS"
}
if (Test-Cmd "pnpm") {
  Write-Host "  pnpm found: $((pnpm --version))"
} else {
  Write-Host "  Installing pnpm via corepack..." -ForegroundColor Yellow
  if (Test-Cmd "corepack") { corepack enable; corepack prepare pnpm@9.15.0 --activate }
  else { Write-Host "  [skip] install pnpm manually: npm install -g pnpm" -ForegroundColor DarkYellow }
}

# --- PostgreSQL + Redis ----------------------------------------------------
Write-Host "`n[2/6] PostgreSQL & Redis" -ForegroundColor Green
if (Test-Cmd "psql") {
  Write-Host "  psql found"
} else {
  Install-Winget "PostgreSQL.PostgreSQL.16" "PostgreSQL 16"
  Write-Host "  Remember to set DATABASE_URL after setup (default: postgresql://filetools:filetools@localhost:5432/filetools)" -ForegroundColor DarkYellow
}
if (Test-Cmd "redis-server") {
  Write-Host "  redis found"
} else {
  Install-Winget "Redis.Redis" "Redis"
}

# --- Native conversion tools ------------------------------------------------
Write-Host "`n[3/6] ffmpeg (audio/video)" -ForegroundColor Green
if (Test-Cmd "ffmpeg") { Write-Host "  ffmpeg found: $((ffmpeg -version 2>$null | Select-Object -First 1))" }
else { Install-Winget "Gyan.FFmpeg" "ffmpeg" }

Write-Host "`n[4/6] qpdf (PDF)" -ForegroundColor Green
if (Test-Cmd "qpdf") { Write-Host "  qpdf found" }
else { Install-Winget "qpdf.qpdf" "qpdf" }

Write-Host "`n[5/6] Ghostscript (PDF/images)" -ForegroundColor Green
if (Test-Cmd "gswin64c") { Write-Host "  ghostscript found" }
else { Install-Winget "ArtifexSoftware.GhostScript" "Ghostscript" }

Write-Host "`n[6/6] 7-Zip (archives), Poppler (PDF text), LibreOffice (documents)" -ForegroundColor Green
if (Test-Cmd "7z") { Write-Host "  7z found" } else { Install-Winget "7zip.7zip" "7-Zip" }
if (Test-Cmd "pdftotext") { Write-Host "  poppler found" } else { Install-Winget "oschwartz10612.Poppler" "Poppler" }
$soffice = Test-Cmd "soffice"
if (-not $soffice) {
  $candidates = @("C:\Program Files\LibreOffice\program\soffice.exe", "C:\Program Files (x86)\LibreOffice\program\soffice.exe")
  $soffice = [bool]($candidates | Where-Object { Test-Path $_ })
}
if ($soffice) { Write-Host "  LibreOffice found" } else {
  Install-Winget "TheDocumentFoundation.LibreOffice" "LibreOffice"
}

# --- Project setup -----------------------------------------------------------
Write-Host "`nInstalling dependencies & building..." -ForegroundColor Green
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "  Created .env from .env.example — adjust if needed." -ForegroundColor Yellow
}
pnpm install
pnpm build

Write-Host "`n=== Done! ===" -ForegroundColor Cyan
Write-Host "  1. Also check the worker .env settings (path to qpdf/poppler/soffice)."
Write-Host "  2. Start everything with:  .\scripts\start.ps1"
Write-Host "  3. Open http://localhost:3000 — complete the first-run wizard."