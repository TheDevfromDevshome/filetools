# FileTools Starter — Windows
# Starts the API, web UI and all workers in background services.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\start.ps1
param()

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$logDir = Join-Path $Root "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Write-Host "Starting FileTools..." -ForegroundColor Cyan
Write-Host "  logs -> $logDir"

$stale = @()
$dists = @(
  "apps\api", "packages\types", "packages\config", "packages\database", "packages\shared",
  "workers\image-worker", "workers\pdf-worker", "workers\media-worker", "workers\archive-worker", "workers\document-worker"
)
foreach ($d in $dists) {
  $entry = Join-Path $Root "$d\dist\index.js"
  if (-not (Test-Path $entry)) {
    $stale += "$d (no dist\index.js)"
  } else {
    $latest = Get-ChildItem -Recurse -File (Join-Path $Root "$d\src") -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latest -and $latest.LastWriteTime -gt (Get-Item $entry).LastWriteTime) {
      $stale += "$d (sources newer than dist)"
    }
  }
}
if ($stale.Count -gt 0) {
  Write-Host "" -ForegroundColor DarkYellow
  Write-Host "  Build is OUTDATED:" -ForegroundColor DarkYellow
  foreach ($s in $stale) { Write-Host "    $s" -ForegroundColor DarkYellow }
  Write-Host "  Run 'pnpm build' first (or re-run .\scripts\install.ps1), then start again." -ForegroundColor DarkYellow
  exit 1
}

function Start-Proc([string]$Name, [string]$Filter, [scriptblock]$Cmd) {
  $existing = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like "*$Filter*" }
  if ($existing) {
    Write-Host "  $Name already running (PID $($existing.ProcessId -join ', '))" -ForegroundColor Yellow
    return $existing.ProcessId
  }
  $p = Start-Process powershell -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-Command",$Cmd.ToString() -WindowStyle Hidden -PassThru
  Start-Sleep -Seconds 1
  Write-Host "  $Name started (PID $($p.Id))" -ForegroundColor Green
  return $p.Id
}

$env:DATABASE_URL = "postgresql://filetools:filetools@127.0.0.1:5432/filetools"
$env:REDIS_URL     = "redis://127.0.0.1:6379"
$env:STORAGE_PATH  = Join-Path $Root "data"

Start-Proc "api"         "@filetools/api"       { pnpm --filter @filetools/api start }
Start-Proc "web"         "@filetools/web"       { pnpm --filter @filetools/web start }
Start-Proc "image-worker" "@filetools/image-worker"  { pnpm --filter @filetools/image-worker start }
Start-Proc "pdf-worker"  "@filetools/pdf-worker" { pnpm --filter @filetools/pdf-worker start }
Start-Proc "media-worker" "@filetools/media-worker" { pnpm --filter @filetools/media-worker start }
Start-Proc "archive-worker" "@filetools/archive-worker" { pnpm --filter @filetools/archive-worker start }
Start-Proc "document-worker" "@filetools/document-worker" { pnpm --filter @filetools/document-worker start }

Write-Host ""
Write-Host "FileTools is up!" -ForegroundColor Cyan
Write-Host "  Open:  http://localhost:3000"
Write-Host "  API:   http://localhost:3001/docs"
Write-Host "  Stop:  .\scripts\stop.ps1"
Write-Host ""
Write-Host "Reachable from this machine/network at:" -ForegroundColor Cyan
node "$Root\scripts\print-urls.mjs" 2>$null
Write-Host ""