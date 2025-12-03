@echo off
echo ========================================
echo  Installing Music Player as Windows Service
echo ========================================
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] ERROR: This script requires Administrator privileges
    echo [!] Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

REM Instalar node-windows globalmente
echo [*] Installing node-windows...
call npm install -g node-windows
echo.

REM Crear servicio
echo [*] Creating Windows Service...
node install-service.js

echo.
echo ========================================
echo  Service installed successfully!
echo ========================================
echo.
echo The music player will now start automatically with Windows.
echo.
echo To manage the service:
echo   - Start:   sc start HybridMusicPlayer
echo   - Stop:    sc stop HybridMusicPlayer
echo   - Remove:  node uninstall-service.js
echo.
pause
