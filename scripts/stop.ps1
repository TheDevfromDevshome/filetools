# FileTools Stopper — Windows
# Stops all FileTools node processes.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\stop.ps1
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "Stopping FileTools..." -ForegroundColor Cyan

$patterns = @(
  "@filetools/api",
  "@filetools/web",
  "@filetools/image-worker",
  "@filetools/pdf-worker",
  "@filetools/media-worker",
  "@filetools/archive-worker",
  "@filetools/document-worker"
)

$killed = 0
foreach ($pat in $patterns) {
  $procs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*$pat*" }
  foreach ($p in $procs) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    $killed++
    Write-Host "  killed node PID $($p.ProcessId) ($pat)" -ForegroundColor DarkYellow
  }
}

Write-Host "  $killed process(es) stopped."
Write-Host "Done." -ForegroundColor Cyan