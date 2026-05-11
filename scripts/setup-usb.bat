@echo off
title DeckPad - Configuration USB
echo ==========================================
echo   DeckPad - Configuration connexion USB
echo ==========================================
echo.

:: Chercher ADB dans les emplacements connus
set "ADB_CMD=adb"

:: Vérifier si ADB est dans le PATH
where adb >nul 2>nul
if %errorlevel% equ 0 (
    goto :adb_found
)

:: Chercher dans WinGet
for /f "delims=" %%i in ('dir /b /s "C:\Users\%USERNAME%\AppData\Local\Microsoft\WinGet\Packages\*adb.exe" 2^>nul') do (
    set "ADB_CMD=%%i"
    goto :adb_found
)

:: Chercher dans Android SDK
if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
    set "ADB_CMD=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
    goto :adb_found
)

echo [ERREUR] ADB n'est pas installe.
echo.
echo Installe-le avec :
echo   winget install Google.PlatformTools
echo.
pause
exit /b 1

:adb_found
echo [OK] ADB trouve : %ADB_CMD%
echo.

:: Vérifier si un appareil est connecté
echo Verification des appareils connectes...
"%ADB_CMD%" devices -l
echo.

:: Vérifier qu'un appareil est bien détecté
"%ADB_CMD%" get-state >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Aucun appareil detecte !
    echo.
    echo Verifie que :
    echo   1. La tablette est branchee en USB
    echo   2. Le debogage USB est active :
    echo      Parametres ^> A propos ^> Tape 7x sur Numero de build
    echo      Puis Parametres ^> Systeme ^> Options developpeur ^> Debogage USB
    echo   3. Tu as accepte "Autoriser le debogage USB" sur la tablette
    echo.
    pause
    exit /b 1
)

echo [OK] Appareil detecte !
echo.

:: Configurer le reverse port forwarding
echo Configuration du port forwarding USB...
"%ADB_CMD%" reverse tcp:9090 tcp:9090
if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo   [OK] Configuration USB reussie !
    echo ==========================================
    echo.
    echo   Sur ta tablette, ouvre Chrome et va a :
    echo   http://localhost:9090
    echo.
    echo   Assure-toi que le serveur DeckPad tourne
    echo   sur le PC [npm start]
    echo ==========================================
) else (
    echo.
    echo [ERREUR] Impossible de configurer le port forwarding.
    echo Verifie que le debogage USB est bien active.
)
echo.
pause
