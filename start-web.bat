@echo off
rem FileTools — start the web UI (Windows)
call "%~dp0scripts\env-common.cmd"
pnpm --filter @filetools/web dev