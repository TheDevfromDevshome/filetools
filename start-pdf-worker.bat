@echo off
rem FileTools — start the PDF worker (Windows)
call "%~dp0scripts\env-common.cmd"
pnpm --filter @filetools/pdf-worker dev