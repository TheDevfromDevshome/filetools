@echo off
rem FileTools — start the archive worker (Windows)
call "%~dp0scripts\env-common.cmd"
pnpm --filter @filetools/archive-worker dev