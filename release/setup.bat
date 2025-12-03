@echo off
echo ==========================================
echo   Hybrid Music Player Installer
echo ==========================================
echo.

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo and try again.
    pause
    exit /b 1
)

echo [1/4] Installing dependencies...
cd backend
call npm install --production
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo [2/4] Installing Windows Service...
node install-service.js
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install service.
    pause
    exit /b 1
)

echo.
echo [3/4] Configuring Firewall...
netsh advfirewall firewall show rule name="HybridMusicPlayer" >nul
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="HybridMusicPlayer" dir=in action=allow protocol=TCP localport=3001
    echo [OK] Firewall rule added.
) else (
    echo [OK] Firewall rule already exists.
)

echo.
echo [4/4] Starting Service...
net start HybridMusicPlayer

echo.
echo ==========================================
echo   Installation Complete!
echo ==========================================
echo.
echo The application is running at:
echo   http://localhost:3001
echo.
echo To access from other computers, use your IP address:
echo   http://YOUR_SERVER_IP:3001
echo.
pause
