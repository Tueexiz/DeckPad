/**
 * DeckPad — Serveur Principal
 * Point d'entrée de l'application serveur
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const os = require('os');
const fs = require('fs');

const log = require('./modules/logger').create('Server');

const ScreenCapture     = require('./modules/screen-capture');
const inputHandler      = require('./modules/input-handler');
const SystemMonitor     = require('./modules/system-monitor');
const appLauncher       = require('./modules/app-launcher');
const soundPlayer       = require('./modules/sound-player');
const audioManager      = require('./modules/audio-manager');
const audioMeter        = require('./modules/audio-meter');
const ConnectionManager = require('./modules/connection-manager');
const mediaMonitor      = require('./modules/media-monitor');

/* ─── Config ─── */
const PORT = process.env.PORT || 9090;
const CLIENT_BASE = path.join(__dirname, '..', 'client');
const DIST_DIR    = path.join(CLIENT_BASE, 'dist');
// Si un build existe et qu'on n'est pas en mode dev, on sert le bundle minifié
const USE_DIST = process.env.DECKPAD_DIST !== '0' &&
                 process.env.NODE_ENV !== 'development' &&
                 fs.existsSync(path.join(DIST_DIR, 'index.html'));
const CLIENT_DIR = USE_DIST ? DIST_DIR : CLIENT_BASE;

let pkgVersion = 'unknown';
try {
  pkgVersion = require(path.join(__dirname, '..', 'package.json')).version || pkgVersion;
} catch (_) {}

/* ─── Express + WS ─── */
const app = express();
// Sert dist/ en priorité si build présent, sinon les sources directement
app.use(express.static(CLIENT_DIR, { maxAge: USE_DIST ? '7d' : 0 }));
// En mode dist, on garde aussi l'accès aux assets statiques de base (icons, manifest)
if (USE_DIST) app.use(express.static(CLIENT_BASE, { maxAge: 0 }));
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const screenCapture     = new ScreenCapture();
const systemMonitor     = new SystemMonitor();
const connectionManager = new ConnectionManager(wss);

inputHandler.init();

/* ─── Wiring watchdog → broadcast vers clients ─── */
screenCapture.on('watchdog_restart', (info) => {
  log.warn('Watchdog screen restart', info);
  connectionManager.broadcast({ type: 'watchdog', module: 'screen', event: 'restart', ...info });
});
screenCapture.on('watchdog_failed', (info) => {
  log.error('Watchdog screen abandon', info);
  connectionManager.broadcast({ type: 'watchdog', module: 'screen', event: 'failed', ...info });
});
screenCapture.on('unavailable', (info) => {
  log.warn('Module screen indisponible', info);
  connectionManager.broadcast({ type: 'capability', module: 'screen', available: false, ...info });
});

/* ─── Media monitor → broadcast ─── */
mediaMonitor.on('media_update', (data) => {
  connectionManager.broadcast({ type: 'media_info', media: data });
});

/* ─── Audio meter → broadcast (throttle ~80ms) ─── */
let lastMeterBroadcast = 0;
audioMeter.on('level', (sample) => {
  const now = Date.now();
  if (now - lastMeterBroadcast < 80) return;
  lastMeterBroadcast = now;
  // On envoie peak + channels (Left/Right typiquement). Le client interpolera 12 bins.
  connectionManager.broadcast({
    type: 'audio_meter',
    peak: sample.peak,
    channels: sample.channels,
    t: sample.t,
  });
});

/* ═══════════════════════════════════════════════════════════
   API REST
   ═══════════════════════════════════════════════════════════ */

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    version: pkgVersion,
    clients: connectionManager.getClientCount(),
    streaming: screenCapture.isRunning(),
  });
});

app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: pkgVersion,
    pcName: os.hostname(),
    clients: connectionManager.getClientCount(),
    modules: {
      screen: screenCapture.getHealth(),
      audio:  audioManager.getHealth(),
      meter:  audioMeter.getHealth(),
      input:  { available: typeof inputHandler.handleInputMessage === 'function' },
      media:  { available: !!mediaMonitor.getCurrentMedia || true },
    },
  };
  // Statut global
  if (!health.modules.screen.available) health.status = 'degraded';
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

app.get('/api/capabilities', (req, res) => {
  res.json({
    version: pkgVersion,
    audio: audioManager.getHealth(),
    screen: { available: screenCapture.getHealth().available },
  });
});

/* ═══════════════════════════════════════════════════════════
   AUTO-UPDATE CHECK (best-effort, non bloquant)
   ═══════════════════════════════════════════════════════════ */

const REPO = process.env.DECKPAD_REPO || 'anomalyco/opencode';
let latestRelease = null;

function checkForUpdate() {
  const url = `https://api.github.com/repos/${REPO}/releases/latest`;
  const https = require('https');
  https.get(url, { headers: { 'User-Agent': `DeckPad/${pkgVersion}` } }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data && data.tag_name) {
          latestRelease = {
            version: data.tag_name.replace(/^v/, ''),
            url: data.html_url,
            publishedAt: data.published_at,
          };
          if (latestRelease.version !== pkgVersion) {
            log.info('Mise à jour disponible', latestRelease);
            connectionManager.broadcast({ type: 'update_available', ...latestRelease });
          }
        }
      } catch (_) {}
    });
  }).on('error', () => { /* offline ou repo privé : ignorer */ });
}
// Au démarrage + toutes les 6h
setTimeout(checkForUpdate, 5000);
setInterval(checkForUpdate, 6 * 3600 * 1000);

app.get('/api/update', (req, res) => {
  res.json({
    current: pkgVersion,
    latest: latestRelease,
    upToDate: latestRelease ? latestRelease.version === pkgVersion : null,
  });
});

/* ═══════════════════════════════════════════════════════════
   WebSocket
   ═══════════════════════════════════════════════════════════ */

wss.on('connection', (ws, req) => {
  connectionManager.handleConnection(ws, req);

  ws.on('message', async (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); }
    catch { return; }

    /* ─ Auth ─ */
    if (msg.type === 'auth') {
      const success = connectionManager.authenticate(ws, msg.pin);
      connectionManager.send(ws, {
        type: 'auth_result',
        success,
        pcName: os.hostname(),
        screenSize: inputHandler.getScreenSize(),
        version: pkgVersion,
        capabilities: {
          audio: audioManager.getHealth(),
          screen: { available: screenCapture.getHealth().available },
        },
      });

      if (success) {
        const staticInfo = await systemMonitor.getStaticInfo();
        if (staticInfo) connectionManager.send(ws, { type: 'pc_info', ...staticInfo });

        connectionManager.send(ws, {
          type: 'app_list',
          apps: await appLauncher.getApps(),
        });

        const currentMedia = mediaMonitor.getCurrentMedia();
        if (currentMedia) connectionManager.send(ws, { type: 'media_info', media: currentMedia });

        try {
          const masterState = await audioManager.getState('master');
          connectionManager.send(ws, {
            type: 'volume_info',
            volume: masterState.volume,
            muted:  masterState.muted,
          });
        } catch (err) { log.warn('volume_info init', err); }

        connectionManager.send(ws, {
          type: 'audio_profiles',
          profiles: audioManager.listProfiles(),
        });

        if (latestRelease && latestRelease.version !== pkgVersion) {
          connectionManager.send(ws, { type: 'update_available', ...latestRelease });
        }

        if (connectionManager.getClientCount() === 1) {
          systemMonitor.startMonitoring(2000, (stats) => {
            connectionManager.broadcast({ type: 'system_stats', ...stats });
          });
          audioMeter.subscribe();
        }
      }
      return;
    }

    /* ─ Auth check ─ */
    if (!connectionManager.isAuthenticated(ws)) {
      connectionManager.send(ws, { type: 'error', message: 'Non authentifié' });
      return;
    }

    /* ─ Routage ─ */
    try {
      switch (msg.type) {
        // Input
        case 'mouse_move':
        case 'mouse_move_relative':
        case 'mouse_click':
        case 'mouse_double_click':
        case 'mouse_down':
        case 'mouse_up':
        case 'mouse_scroll':
        case 'key_press':
        case 'key_down':
        case 'key_up':
        case 'type_text':
          inputHandler.handleInputMessage(msg);
          break;

        // Streaming
        case 'start_stream':
          if (!screenCapture.isRunning()) {
            const started = screenCapture.start({
              fps: msg.fps || 20,
              quality: msg.quality || 5,
              width: msg.width || 1280,
              height: msg.height || 720,
            });
            if (started) {
              screenCapture.onFrame((frame) => connectionManager.broadcastBinary(frame));
            }
            connectionManager.send(ws, {
              type: 'stream_status',
              running: screenCapture.isRunning(),
            });
          }
          break;

        case 'stop_stream':
          screenCapture.stop();
          connectionManager.send(ws, { type: 'stream_status', running: false });
          break;

        // Apps
        case 'get_apps':
          connectionManager.send(ws, { type: 'app_list', apps: await appLauncher.getApps() });
          break;
        case 'launch_app':
          appLauncher.launchApp(msg.id);
          break;
        case 'add_app':
          appLauncher.addApp(msg.app);
          connectionManager.broadcast({ type: 'app_list', apps: await appLauncher.getApps() });
          break;
        case 'remove_app':
          appLauncher.removeApp(msg.id);
          connectionManager.broadcast({ type: 'app_list', apps: await appLauncher.getApps() });
          break;

        // Système
        case 'system_action':
          appLauncher.systemAction(msg.action);
          break;

        case 'play_sound':
          soundPlayer.play(msg.sound);
          break;

        // Audio
        case 'set_volume':
          audioManager.setVolume(msg.device, msg.value);
          break;
        case 'set_mute':
          audioManager.setMute(msg.device || 'master', !!msg.mute);
          break;
        case 'get_audio_state': {
          const st = await audioManager.getState(msg.device || 'master');
          connectionManager.send(ws, {
            type: 'volume_info',
            device: msg.device || 'master',
            volume: st.volume,
            muted: st.muted,
          });
          break;
        }
        case 'apply_audio_profile':
          audioManager.applyProfile(msg.name);
          break;
        case 'save_audio_profile':
          audioManager.saveProfile(msg.name, msg.settings || {});
          connectionManager.broadcast({
            type: 'audio_profiles',
            profiles: audioManager.listProfiles(),
          });
          break;

        // Health (via WS aussi pour tablette)
        case 'health': {
          connectionManager.send(ws, {
            type: 'health',
            modules: {
              screen: screenCapture.getHealth(),
              audio: audioManager.getHealth(),
            },
            uptime: process.uptime(),
            clients: connectionManager.getClientCount(),
          });
          break;
        }

        // Processus
        case 'get_processes':
          try {
            const processes = await appLauncher.getProcesses();
            connectionManager.send(ws, { type: 'process_list', processes });
          } catch (err) {
            log.error('get_processes', err);
            connectionManager.send(ws, { type: 'error', message: err.message });
          }
          break;

        case 'kill_process':
          try {
            await appLauncher.killProcess(msg.pid);
            connectionManager.send(ws, { type: 'process_killed', pid: msg.pid });
          } catch (err) {
            log.error('kill_process', err);
            connectionManager.send(ws, { type: 'error', message: err.message });
          }
          break;

        default:
          break;
      }
    } catch (err) {
      log.error('Erreur traitement message', { type: msg.type, error: err.message });
      connectionManager.send(ws, { type: 'error', message: 'Erreur serveur' });
    }
  });

  ws.on('close', () => {
    if (connectionManager.getClientCount() === 0) {
      systemMonitor.stopMonitoring();
      audioMeter.unsubscribe();
      if (screenCapture.isRunning()) screenCapture.stop();
    }
  });
});

/* ═══════════════════════════════════════════════════════════
   DÉMARRAGE
   ═══════════════════════════════════════════════════════════ */

server.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) { localIP = addr.address; break; }
    }
    if (localIP !== 'localhost') break;
  }

  console.log('═══════════════════════════════════════════');
  console.log('  🎮 DeckPad Server - Prêt !');
  console.log('═══════════════════════════════════════════');
  console.log(`  📡 WiFi:   http://${localIP}:${PORT}`);
  console.log(`  🔌 USB:    http://localhost:${PORT}`);
  console.log(`  💻 PC:     ${os.hostname()}`);
  console.log(`  🩺 Health: http://${localIP}:${PORT}/health`);
  console.log(`  📦 v${pkgVersion}${USE_DIST ? '  · bundle minifié' : '  · sources'}`);
  console.log('═══════════════════════════════════════════');
  console.log('  Ouvre cette adresse dans Chrome sur ta tablette');
  console.log('');
  log.info('Server listening', { port: PORT, version: pkgVersion });
});

/* ─── Cleanup ─── */
function shutdown(signal) {
  log.info('Arrêt serveur', { signal });
  console.log(`\n[DeckPad] Arrêt (${signal})...`);
  screenCapture.stop();
  systemMonitor.stopMonitoring();
  connectionManager.destroy();
  process.exit(0);
}
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
