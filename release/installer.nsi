
!include "MUI2.nsh"

Name "Hybrid Music Player"
OutFile "HybridMusicPlayer_Setup.exe"
InstallDir "$PROGRAMFILES\HybridMusicPlayer"
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
  ExecWait '"$INSTDIR\setup.bat"'
  
  ; Create Uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
SectionEnd

Section "Uninstall"
  ; Stop and remove service
  ExecWait '"node" "$INSTDIR\backend\uninstall-service.js"'
  
  ; Remove firewall rule
  ExecWait 'netsh advfirewall firewall delete rule name="HybridMusicPlayer"'

  ; Remove files
  RMDir /r "$INSTDIR"
SectionEnd
