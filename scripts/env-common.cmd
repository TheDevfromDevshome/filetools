@echo off
rem FileTools common environment (Windows) — auto-detects tool locations.
rem Set your own overrides BEFORE calling %~f0 if a detection below is wrong.

set "ROOT_DIR=%~dp0.."
set "DATABASE_URL=postgresql://filetools:filetools@127.0.0.1:5432/filetools"
set "REDIS_URL=redis://127.0.0.1:6379"
set "STORAGE_PATH=%ROOT_DIR%\data"
set "WORKER_CONCURRENCY=2"

rem ---- Where.exe helper: matches tool in PATH, upgrades to full path ----
if exist "%ROOT_DIR%\.env" (
  for /f "usebackq delims=" %%E in ("%ROOT_DIR%\.env") do (
    if not "%%E"=="" if not "%%E"=="!" set "%%E" 2>nul
  )
)

rem ---- ffmpeg ----
if defined FFMPEG_BIN goto :ffmpeg_ok
for /f "delims=" %%F in ('where ffmpeg 2^>nul') do (set "FFMPEG_BIN=%%F" & goto :ffmpeg_ok)
if not defined FFMPEG_BIN echo [warn] ffmpeg not found on PATH & set "FFMPEG_BIN=ffmpeg"
:ffmpeg_ok

rem ---- soffice (LibreOffice) ----
if defined SOFFICE_BIN goto :soffice_ok
for /f "delims=" %%F in ('where soffice 2^>nul') do (set "SOFFICE_BIN=%%F" & goto :soffice_ok)
if exist "C:\Program Files\LibreOffice\program\soffice.exe" set "SOFFICE_BIN=C:\Program Files\LibreOffice\program\soffice.exe" & goto :soffice_ok
if exist "C:\Program Files (x86)\LibreOffice\program\soffice.exe" set "SOFFICE_BIN=C:\Program Files (x86)\LibreOffice\program\soffice.exe" & goto :soffice_ok
echo [warn] LibreOffice (soffice) not found
:soffice_ok

rem ---- qpdf ----
if defined QPDF_BIN goto :qpdf_ok
for /f "delims=" %%F in ('where qpdf 2^>nul') do (set "QPDF_BIN=%%F" & goto :qpdf_ok)
for /d %%D in ("C:\Program Files\qpdf*") do if exist "%%D\bin\qpdf.exe" set "QPDF_BIN=%%D\bin\qpdf.exe" & goto :qpdf_ok
echo [warn] qpdf not found
:qpdf_ok

rem ---- poppler ----
for %%B in (pdftotext pdftoppm pdfunite) do (
  call :set_poppler "%%B"
)
if not defined POPPLER_BIN echo [warn] poppler tools not found on PATH
goto :poppler_done
:set_poppler
if not defined POPPLER_BIN for /f "delims=" %%F in ('where %~1 2^>nul') do set "POPPLER_BIN=%%~dpF"
exit /b
:poppler_done
if not defined PDFTOTEXT_BIN set "PDFTOTEXT_BIN=%POPPLER_BIN%pdftotext.exe"
if not defined PDFTOPPM_BIN set "PDFTOPPM_BIN=%POPPLER_BIN%pdftoppm.exe"
if not defined PDFUNITE_BIN set "PDFUNITE_BIN=%POPPLER_BIN%pdfunite.exe"

rem ---- 7-Zip ----
if defined SEVENZ_BIN goto :7z_ok
for /f "delims=" %%F in ('where 7z 2^>nul') do (set "SEVENZ_BIN=%%F" & goto :7z_ok)
if exist "C:\Program Files\7-Zip\7z.exe" set "SEVENZ_BIN=C:\Program Files\7-Zip\7z.exe" & goto :7z_ok
echo [warn] 7z not found
:7z_ok

rem ---- img2pdf (python) ----
if defined IMG2PDF_BIN goto :img2pdf_ok
for /f "delims=" %%F in ('where img2pdf 2^>nul') do (set "IMG2PDF_BIN=%%F" & goto :img2pdf_ok)
echo [warn] img2pdf not found
:img2pdf_ok