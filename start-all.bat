@echo off
rem FileTools — start EVERYTHING (API, web, all workers) in separate windows
rem Usage: start-all.bat
call "%~dp0scripts\env-common.cmd" 2>nul

echo Starting FileTools...
echo   API            http://localhost:3001/docs
echo   Web            http://localhost:3000
echo   (first visit = setup wizard: language + domain)
echo.

rem ---- Print reachable URLs (LAN IPs) ----
node "scripts\print-urls.mjs" 2>nul || echo   (run: node scripts\print-urls.mjs to see all addresses)
echo.

set WORKER_CONCURRENCY=2

start "FileTools API"       cmd /c "call ""%~dp0scripts\env-common.cmd" && pnpm --filter @filetools/api dev"
start "FileTools Web"       cmd /c "call ""%~dp0scripts\env-common.cmd" && pnpm --filter @filetools/web dev"
start "FileTools Image"     cmd /c "call ""%~dp0scripts\env-common.cmd" && pnpm --filter @filetools/image-worker dev"
start "FileTools PDF"       cmd /c "call ""%~dp0scripts\env-common.cmd" && pnpm --filter @filetools/pdf-worker dev"
start "FileTools Media"     cmd /c "call ""%~dp0scripts\env-common.cmd" && pnpm --filter @filetools/media-worker dev"
start "FileTools Archive"   cmd /c "call ""%~dp0scripts\env-common.cmd" && pnpm --filter @filetools/archive-worker dev"
start "FileTools Document"  cmd /c "call ""%~dp0scripts\env-common.cmd" && pnpm --filter @filetools/document-worker dev"

echo All windows opened. Close them to stop. You can also use scripts\stop.ps1.