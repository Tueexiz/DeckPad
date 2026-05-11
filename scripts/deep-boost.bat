@echo off
:: ==============================================================================
:: DeckPad - Deep Boost Engine
:: Ce script ferme les processus gourmands, vide le cache DNS, arrête la 
:: télémétrie Windows, et ajuste la priorité des processus de jeu.
:: NÉCESSITE LES DROITS ADMINISTRATEUR
:: ==============================================================================

echo [DeckPad Deep Boost] Demarrage de l'optimisation systeme...
echo.

:: 1. Fermeture des applications gourmandes en arriere-plan
echo [1/4] Fermeture des applications non essentielles...
taskkill /IM "chrome.exe" /F /FI "STATUS eq RUNNING" >nul 2>&1
taskkill /IM "msedge.exe" /F /FI "STATUS eq RUNNING" >nul 2>&1
taskkill /IM "firefox.exe" /F /FI "STATUS eq RUNNING" >nul 2>&1
taskkill /IM "spotify.exe" /F /FI "STATUS eq RUNNING" >nul 2>&1
taskkill /IM "Discord.exe" /F /FI "STATUS eq RUNNING" >nul 2>&1
taskkill /IM "OneDrive.exe" /F /FI "STATUS eq RUNNING" >nul 2>&1
taskkill /IM "EpicGamesLauncher.exe" /F /FI "STATUS eq RUNNING" >nul 2>&1

:: 2. Nettoyage du cache DNS et reseau
echo [2/4] Optimisation du reseau (Ping & Latence)...
ipconfig /flushdns >nul 2>&1
ipconfig /release >nul 2>&1
ipconfig /renew >nul 2>&1

:: 3. Arret de la telemetrie Windows et services inutiles
echo [3/4] Desactivation de la telemetrie et services inutiles...
net stop "DiagTrack" /y >nul 2>&1
net stop "sysmain" /y >nul 2>&1
net stop "wuauserv" /y >nul 2>&1

:: 4. Ajustement de la priorite GPU / CPU pour les jeux
echo [4/4] Ajustement des priorites CPU/GPU...
:: Si Rocket League est en cours, on le met en priorité haute
wmic process where name="RocketLeague.exe" CALL setpriority "high priority" >nul 2>&1
wmic process where name="csgo.exe" CALL setpriority "high priority" >nul 2>&1
wmic process where name="cs2.exe" CALL setpriority "high priority" >nul 2>&1
wmic process where name="Valorant-Win64-Shipping.exe" CALL setpriority "high priority" >nul 2>&1

echo.
echo [DeckPad Deep Boost] Optimisation terminee avec succes !
exit /b 0
