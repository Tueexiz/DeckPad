@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%.."
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_FILE=%APP_DIR%\deckpad-launcher.vbs"

echo [DeckPad] Configuration du lancement automatique...

:: 1. Création du fichier VBS pour un lancement masqué (sans fenêtre noire)
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_FILE%"
echo WshShell.Run "cmd.exe /c npm start", 0, false >> "%VBS_FILE%"

:: 2. Création du raccourci dans le dossier de démarrage
set "SHORTCUT_PATH=%STARTUP_FOLDER%\DeckPadServer.lnk"
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%SHORTCUT_PATH%');$s.TargetPath='%VBS_FILE%';$s.WorkingDirectory='%APP_DIR%';$s.Save()"

echo.
echo [SUCCES] DeckPad se lancera desormais automatiquement en arrière-plan au démarrage de Windows.
echo Tu peux trouver le lanceur ici : %VBS_FILE%
echo.
pause
