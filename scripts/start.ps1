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