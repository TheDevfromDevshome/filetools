@echo off
rem FileTools — start the image worker (Windows)
call "%~dp0scripts\env-common.cmd"
pnpm --filter @filetools/image-worker dev