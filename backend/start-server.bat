@echo off
echo ========================================
echo  Hybrid Music Player - Starting Server
echo ========================================
echo.

REM Navegar al directorio del backend
cd /d %~dp0

REM Verificar si existe node_modules
if not exist "node_modules\" (
    echo [!] node_modules not found, installing dependencies...
    call npm install
    echo.
)

REM Verificar si existe .env
if not exist ".env" (
    echo [!] .env file not found, creating from .env.example...
    copy .env.example .env
    echo [!] Please edit .env file with your Dropbox folder URL
    pause
)

REM Crear directorio music si no existe
if not exist "music\" (
    echo [*] Creating music directory...
    mkdir music
)

echo [*] Starting server...
echo.
node server.js

pause
