@echo off
title DeckPad - Installation des dependances
echo ==========================================
echo   DeckPad - Installation
echo ==========================================
echo.

:: Installer FFmpeg
echo [1/3] Installation de FFmpeg...
where ffmpeg >nul 2>nul
if %errorlevel% equ 0 (
    echo   FFmpeg deja installe !
) else (
    echo   Installation via winget...
    winget install --id Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements
)
echo.

:: Installer ADB
echo [2/3] Installation de ADB (Android Platform Tools)...
where adb >nul 2>nul
if %errorlevel% equ 0 (
    echo   ADB deja installe !
) else (
    echo   Installation via winget...
    winget install Google.PlatformTools --accept-package-agreements --accept-source-agreements
)
echo.

:: Installer les deps npm
echo [3/3] Installation des dependances npm...
cd /d "%~dp0.."
call npm install
echo.

echo ==========================================
echo   Installation terminee !
echo ==========================================
echo.
echo   Pour lancer DeckPad :
echo     npm start
echo.
echo   Pour la connexion USB :
echo     scripts\setup-usb.bat
echo.
pause
