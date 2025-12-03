import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const releaseDir = path.join(rootDir, 'release')

console.log('🚀 Starting build process...')

// 1. Clean release directory
if (fs.existsSync(releaseDir)) {
  console.log('🧹 Cleaning release directory...')
  fs.rmSync(releaseDir, { recursive: true, force: true })
}
fs.mkdirSync(releaseDir)

// 2. Build Frontend
console.log('📦 Building frontend...')
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' })
} catch (error) {
  console.error('❌ Error building frontend:', error)
  process.exit(1)
}

// 3. Copy Backend
console.log('📂 Copying backend...')
const backendSrc = path.join(rootDir, 'backend')
const backendDest = path.join(releaseDir, 'backend')
fs.mkdirSync(backendDest)

const filesToCopy = [
  'package.json',
  'server.js',
  'install-service.js',
  'uninstall-service.js',
  '.env.example',
  'paths.js',
]
const dirsToCopy = ['config', 'routes', 'services']

filesToCopy.forEach(file => {
  if (fs.existsSync(path.join(backendSrc, file))) {
    fs.copyFileSync(path.join(backendSrc, file), path.join(backendDest, file))
  }
})

dirsToCopy.forEach(dir => {
  if (fs.existsSync(path.join(backendSrc, dir))) {
    fs.cpSync(path.join(backendSrc, dir), path.join(backendDest, dir), { recursive: true })
  }
})

// Create empty folders (only temp is needed locally, music is now in ProgramData)
;['temp'].forEach(dir => {
  if (!fs.existsSync(path.join(backendDest, dir))) {
    fs.mkdirSync(path.join(backendDest, dir))
  }
})

// 4. Copy Frontend Dist
console.log('📂 Copying frontend build...')
const distSrc = path.join(rootDir, 'dist')
const distDest = path.join(releaseDir, 'dist')
fs.cpSync(distSrc, distDest, { recursive: true })

// 5. Create Setup Script
console.log('📝 Creating setup script...')
const setupScript = `@echo off
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
`

fs.writeFileSync(path.join(releaseDir, 'setup.bat'), setupScript)

// 6. Create NSIS Installer Script
console.log('📜 Creating NSIS script...')
const nsisScript = `
!include "MUI2.nsh"

Name "Hybrid Music Player"
OutFile "HybridMusicPlayer_Setup.exe"
InstallDir "$PROGRAMFILES\\HybridMusicPlayer"
RequestExecutionLevel admin

!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  
  ; Copy all files
  File /r "*.*"
  
  ; Run setup script
  ExecWait '"$INSTDIR\\setup.bat"'
  
  ; Create Uninstaller
  WriteUninstaller "$INSTDIR\\Uninstall.exe"
  
  ; Create Desktop Shortcut
  CreateShortCut "$DESKTOP\\Hybrid Music Player.lnk" "http://localhost:3001" "" "$INSTDIR\\dist\\favicon.ico" 0
  
SectionEnd

Section "Uninstall"
  ; Stop and remove service
  ExecWait '"node" "$INSTDIR\\backend\\uninstall-service.js"'
  
  ; Remove firewall rule
  ExecWait 'netsh advfirewall firewall delete rule name="HybridMusicPlayer"'

  ; Remove shortcut
  Delete "$DESKTOP\\Hybrid Music Player.lnk"

  ; Remove files
  RMDir /r "$INSTDIR"
SectionEnd
`

fs.writeFileSync(path.join(releaseDir, 'installer.nsi'), nsisScript)

// 7. Create README
const readmeContent = `
Hybrid Music Player - Server Installation
=========================================

Prerequisites:
- Windows 10/11 or Windows Server
- Node.js installed (https://nodejs.org/)

Installation:
1. Run 'HybridMusicPlayer_Setup.exe' as Administrator.
2. Follow the installation wizard.

Manual Installation:
1. Copy this folder to your server.
2. Run 'setup.bat' as Administrator.

Access:
- Local: http://localhost:3001
- Network: http://<SERVER_IP>:3001

Uninstall:
- Run 'Uninstall.exe' in the installation folder.
`

fs.writeFileSync(path.join(releaseDir, 'README.txt'), readmeContent)

// 8. Attempt to compile with NSIS
console.log('🔨 Attempting to compile installer...')
try {
  execSync('makensis installer.nsi', { cwd: releaseDir, stdio: 'inherit' })
  console.log('✅ Installer generated successfully: HybridMusicPlayer_Setup.exe')
} catch (error) {
  console.log('⚠️ Could not compile installer automatically.')
  console.log('   Please install NSIS (sudo apt install nsis) and run:')
  console.log('   makensis release/installer.nsi')
}

console.log('✅ Build complete! Release package created at:', releaseDir)
