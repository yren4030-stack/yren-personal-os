@echo off
setlocal EnableExtensions

echo ==============================================
echo   Personal OS - macOS 26 Liquid Glass Preview
echo ==============================================
echo.

set "ROOT=%~dp0"
set "DESKTOP=%ROOT%apps\desktop"
set "TOOLS=%ROOT%.tools"
set "NODE_VERSION=24.14.0"
set "NODE_DIR=%TOOLS%\node-v%NODE_VERSION%-win-x64"
set "NODE_ZIP=%TOOLS%\node-v%NODE_VERSION%-win-x64.zip"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-win-x64.zip"
set "NODE_SHA256=313fa40c0d7b18575821de8cb17483031fe07d95de5994f6f435f3b345f85c66"

if not exist "%TOOLS%" mkdir "%TOOLS%"

rem ------------------------------------------------------------------
rem Project-local Node bootstrap. No global Node installation required.
rem ------------------------------------------------------------------
if not exist "%NODE_DIR%\node.exe" (
  echo [SETUP] Project-local Node.js v%NODE_VERSION% is not present.
  echo [SETUP] Downloading official Windows x64 archive...

  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%'"
  if errorlevel 1 (
    echo.
    echo [ERROR] Failed to download Node.js v%NODE_VERSION%.
    echo         Check network access to nodejs.org and run this launcher again.
    pause
    exit /b 1
  )

  echo [SETUP] Verifying Node archive SHA-256...
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$h=(Get-FileHash -Algorithm SHA256 '%NODE_ZIP%').Hash.ToLower(); if($h -ne '%NODE_SHA256%'){ Write-Error ('SHA256 mismatch: '+$h); exit 1 }"
  if errorlevel 1 (
    echo.
    echo [ERROR] Node archive verification failed. The archive will be removed.
    del /q "%NODE_ZIP%" >nul 2>nul
    pause
    exit /b 1
  )

  echo [SETUP] Extracting project-local Node.js...
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Expand-Archive -LiteralPath '%NODE_ZIP%' -DestinationPath '%TOOLS%' -Force"
  if errorlevel 1 (
    echo.
    echo [ERROR] Failed to extract Node.js.
    pause
    exit /b 1
  )

  del /q "%NODE_ZIP%" >nul 2>nul
)

set "PATH=%NODE_DIR%;%PATH%"

for /f "usebackq delims=" %%V in (`"%NODE_DIR%\node.exe" -v`) do set "FOUND_NODE=%%V"
if /I not "%FOUND_NODE%"=="v%NODE_VERSION%" (
  echo [ERROR] Wrong Node version: %FOUND_NODE%
  echo         Required: v%NODE_VERSION%
  pause
  exit /b 1
)

echo [OK] Node %FOUND_NODE% ^(project-local^)

if not exist "%NODE_DIR%\corepack.cmd" (
  echo [ERROR] Corepack is missing from the project-local Node distribution.
  pause
  exit /b 1
)

cd /d "%DESKTOP%"

rem ------------------------------------------------------------------
rem Locked dependency install only when needed.
rem ------------------------------------------------------------------
if not exist "node_modules" (
  echo [SETUP] Installing locked desktop dependencies...
  call "%NODE_DIR%\corepack.cmd" pnpm install --frozen-lockfile
  if errorlevel 1 (
    echo.
    echo [ERROR] Dependency installation failed.
    echo         Personal OS was NOT launched.
    pause
    exit /b 1
  )
)

echo.
echo [START] Launching the CURRENT Personal OS branch...
echo         This is NOT the legacy Electron Hello World POC.
echo.
call "%NODE_DIR%\corepack.cmd" pnpm start

if errorlevel 1 (
  echo.
  echo [ERROR] Personal OS exited with an error.
  pause
  exit /b 1
)

endlocal
