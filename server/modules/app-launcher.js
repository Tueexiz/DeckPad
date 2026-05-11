/**
 * DeckPad - Lanceur d'applications et actions système
 * Gère le lancement d'apps, le kill de processus, et les contrôles système
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const inputHandler = require('./input-handler');

const APPS_CONFIG_PATH = path.join(__dirname, '..', 'config', 'apps.json');
const ICON_CACHE_DIR = path.join(__dirname, '..', '..', 'client', 'assets', 'icons');

// Créer le dossier de cache s'il n'existe pas
if (!fs.existsSync(ICON_CACHE_DIR)) {
  fs.mkdirSync(ICON_CACHE_DIR, { recursive: true });
}

/**
 * Extrait l'icône d'un fichier .exe via PowerShell
 */
async function extractIcon(appPath, appId) {
  if (!appPath || !appPath.endsWith('.exe')) return null;
  
  const iconName = `${appId}.png`;
  const iconPath = path.join(ICON_CACHE_DIR, iconName);
  
  if (fs.existsSync(iconPath)) return `assets/icons/${iconName}`;

  const psScript = `
    Add-Type -AssemblyName System.Drawing
    $path = "${appPath.replace(/"/g, '`"')}"
    if (Test-Path $path) {
      $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path)
      $bitmap = $icon.ToBitmap()
      $bitmap.Save("${iconPath.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png)
      $icon.Dispose()
      $bitmap.Dispose()
    }
  `;

  return new Promise((resolve) => {
    exec(`powershell -NoProfile -Command "${psScript}"`, (err) => {
      if (err) {
        console.warn(`[AppLauncher] Impossible d'extraire l'icône de ${appPath}:`, err.message);
        resolve(null);
      } else {
        resolve(`assets/icons/${iconName}`);
      }
    });
  });
}
function loadApps() {
  try {
    const data = fs.readFileSync(APPS_CONFIG_PATH, 'utf-8');
    return JSON.parse(data).apps || [];
  } catch (err) {
    console.error('[AppLauncher] Erreur chargement apps.json:', err.message);
    return [];
  }
}

/**
 * Sauvegarde la configuration des apps
 */
function saveApps(apps) {
  try {
    fs.writeFileSync(APPS_CONFIG_PATH, JSON.stringify({ apps }, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[AppLauncher] Erreur sauvegarde apps.json:', err.message);
    return false;
  }
}

/**
 * Retourne la liste des apps configurées avec leurs icônes réelles
 */
async function getApps() {
  const apps = loadApps();
  for (const app of apps) {
    if (app.path && (!app.realIcon || app.realIcon.includes('undefined'))) {
      const icon = await extractIcon(app.path, app.id);
      if (icon) app.realIcon = icon;
    }
  }
  return apps;
}

/**
 * Ajoute une app personnalisée
 */
function addApp(app) {
  const apps = loadApps();
  const newApp = {
    id: app.id || `custom_${Date.now()}`,
    name: app.name || 'Sans nom',
    icon: app.icon || '📦',
    path: app.path || '',
    color: app.color || '#333333'
  };
  apps.push(newApp);
  saveApps(apps);
  return newApp;
}

/**
 * Supprime une app
 */
function removeApp(id) {
  const apps = loadApps();
  const filtered = apps.filter(a => a.id !== id);
  if (filtered.length !== apps.length) {
    saveApps(filtered);
    return true;
  }
  return false;
}

/**
 * Met à jour une app
 */
function updateApp(id, updates) {
  const apps = loadApps();
  const idx = apps.findIndex(a => a.id === id);
  if (idx !== -1) {
    Object.assign(apps[idx], updates);
    saveApps(apps);
    return apps[idx];
  }
  return null;
}

/**
 * Lance une application
 */
function launchApp(id) {
  const apps = loadApps();
  const app = apps.find(a => a.id === id);
  if (!app) {
    console.error(`[AppLauncher] App non trouvée: ${id}`);
    return false;
  }

  console.log(`[AppLauncher] Lancement: ${app.name} (${app.path})`);

  try {
    // Utiliser start pour les protocoles (steam://, discord://, etc.) et les chemins
    exec(`start "" "${app.path}"`, { shell: true }, (err) => {
      if (err) {
        console.error(`[AppLauncher] Erreur lancement ${app.name}:`, err.message);
      }
    });
    return true;
  } catch (err) {
    console.error(`[AppLauncher] Erreur lancement ${app.name}:`, err.message);
    return false;
  }
}

/**
 * Lance une application par chemin direct
 */
function launchPath(appPath) {
  try {
    exec(`start "" "${appPath}"`, { shell: true });
    return true;
  } catch (err) {
    console.error('[AppLauncher] Erreur lancement:', err.message);
    return false;
  }
}

/**
 * Récupère la liste des processus en cours
 */
function getProcesses() {
  return new Promise((resolve, reject) => {
    exec('tasklist /FO CSV /NH', { encoding: 'utf-8' }, (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }
      const processes = [];
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.match(/"([^"]*)"/g);
        if (parts && parts.length >= 5) {
          const name = parts[0].replace(/"/g, '');
          const pid = parseInt(parts[1].replace(/"/g, ''));
          const memStr = parts[4].replace(/"/g, '').replace(/[^\d]/g, '');
          const memKb = parseInt(memStr) || 0;
          if (pid > 0 && name !== 'System Idle Process') {
            processes.push({ name, pid, memKb });
          }
        }
      }
      // Trier par mémoire décroissante et garder les 30 premiers
      processes.sort((a, b) => b.memKb - a.memKb);
      resolve(processes.slice(0, 30));
    });
  });
}

/**
 * Tue un processus par PID
 */
function killProcess(pid) {
  return new Promise((resolve, reject) => {
    exec(`taskkill /PID ${pid} /F`, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Exécute une action système
 */
function systemAction(action) {
  console.log(`[AppLauncher] Action système: ${action}`);

  switch (action) {
    case 'volume_up':
      inputHandler.keyPress('volume_up');
      return true;

    case 'volume_down':
      inputHandler.keyPress('volume_down');
      return true;

    case 'volume_mute':
      inputHandler.keyPress('volume_mute');
      return true;

    case 'media_play':
      inputHandler.keyPress('media_play');
      return true;

    case 'media_next':
      inputHandler.keyPress('media_next');
      return true;

    case 'media_prev':
      inputHandler.keyPress('media_prev');
      return true;

    case 'lock':
      exec('rundll32.exe user32.dll,LockWorkStation');
      return true;

    case 'sleep':
      exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
      return true;

    case 'shutdown':
      exec('shutdown /s /t 30 /c "Arrêt initié depuis DeckPad"');
      return true;

    case 'shutdown_cancel':
      exec('shutdown /a');
      return true;

    case 'restart':
      exec('shutdown /r /t 30 /c "Redémarrage initié depuis DeckPad"');
      return true;

    case 'screenshot':
      inputHandler.keyPress('printscreen', ['win']);
      return true;

    case 'task_manager':
      exec('taskmgr.exe');
      return true;

    case 'explorer':
      exec('explorer.exe');
      return true;

    case 'desktop':
      inputHandler.keyPress('d', ['win']);
      return true;

    case 'alt_tab':
      inputHandler.keyPress('tab', ['alt']);
      return true;

    case 'game_boost':
      console.log('[AppLauncher] Exécution du Deep Boost...');
      const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'deep-boost.bat');
      // On utilise start pour exécuter le script dans une nouvelle fenêtre si besoin, ou juste exec
      exec(`"${scriptPath}"`, (err, stdout, stderr) => {
        if (err) {
          console.error(`[DeepBoost] Erreur d'exécution: ${err.message}`);
        } else {
          console.log(`[DeepBoost] Succès:\n${stdout}`);
        }
      });
      return true;

    default:
      console.warn(`[AppLauncher] Action inconnue: ${action}`);
      return false;
  }
}

module.exports = {
  getApps,
  addApp,
  removeApp,
  updateApp,
  launchApp,
  launchPath,
  getProcesses,
  killProcess,
  systemAction
};
