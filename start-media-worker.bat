@echo off
rem FileTools — start the media (audio/video) worker (Windows)
call "%~dp0scripts\env-common.cmd"
pnpm --filter @filetools/media-worker dev