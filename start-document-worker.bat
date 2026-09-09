@echo off
rem FileTools — start the document worker (Windows)
call "%~dp0scripts\env-common.cmd"
pnpm --filter @filetools/document-worker dev