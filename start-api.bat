@echo off
rem FileTools — start the API server (Windows)
call "%~dp0scripts\env-common.cmd"
pnpm --filter @filetools/api dev