@echo off
setlocal

echo ==============================================
echo   Personal OS - macOS 26 Liquid Glass Preview
echo ==============================================
echo.

cd /d "%~dp0apps\desktop"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Required version: 24.14.0
  pause
  exit /b 1
)

where corepack >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Corepack not found.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [SETUP] Installing locked desktop dependencies...
  corepack pnpm install --frozen-lockfile
  if errorlevel 1 (
    echo.
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
  )
)

echo [START] Launching Personal OS macOS 26 preview...
corepack pnpm start

if errorlevel 1 (
  echo.
  echo [ERROR] Personal OS exited with an error.
  pause
  exit /b 1
)

endlocal
