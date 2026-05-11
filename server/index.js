/**
 * DeckPad - Serveur Principal
 * Point d'entrée de l'application serveur
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const os = require('os');

const ScreenCapture = require('./modules/screen-capture');
const inputHandler = require('./modules/input-handler');
const SystemMonitor = require('./modules/system-monitor');
const appLauncher = require('./modules/app-launcher');
const soundPlayer = require('./modules/sound-player');
const audioManager = require('./modules/audio-manager');
const ConnectionManager = require('./modules/connection-manager');
const mediaMonitor = require('./modules/media-monitor');

// Configuration
const PORT = process.env.PORT || 9090;
const CLIENT_DIR = path.join(__dirname, '..', 'client');

// Initialisation Express
const app = express();
app.use(express.static(CLIENT_DIR));
app.use(express.json());

// Serveur HTTP
const server = http.createServer(app);

// Serveur WebSocket
const wss = new WebSocket.Server({ server });

// Modules
const screenCapture = new ScreenCapture();
const systemMonitor = new SystemMonitor();
const connectionManager = new ConnectionManager(wss);

// Initialiser le handler d'input
inputHandler.init();

// Écouter les mises à jour média
mediaMonitor.on('media_update', (data) => {
  connectionManager.broadcast({ type: 'media_info', media: data });
});

// ═══════════════════════════════════════
// Gestion des connexions WebSocket
// ═══════════════════════════════════════
wss.on('connection', (ws, req) => {
  connectionManager.handleConnection(ws, req);

  ws.on('message', async (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return; // Ignorer les messages non-JSON
    }

    // ─── Authentification ───
    if (msg.type === 'auth') {
      const success = connectionManager.authenticate(ws, msg.pin);
      connectionManager.send(ws, {
        type: 'auth_result',
        success,
        pcName: os.hostname(),
        screenSize: inputHandler.getScreenSize()
      });

      if (success) {
        // Envoyer les infos statiques du PC
        const staticInfo = await systemMonitor.getStaticInfo();
        if (staticInfo) {
          connectionManager.send(ws, { type: 'pc_info', ...staticInfo });
        }

        // Envoyer la liste des apps
        connectionManager.send(ws, {
          type: 'app_list',
          apps: await appLauncher.getApps()
        });

        // Envoyer les infos média actuelles
        const currentMedia = mediaMonitor.getCurrentMedia();
        if (currentMedia) {
          connectionManager.send(ws, { type: 'media_info', media: currentMedia });
        }

        // Envoyer le volume actuel
        const masterVol = await audioManager.getMasterVolume();
        connectionManager.send(ws, { type: 'volume_info', volume: masterVol });

        // Démarrer le monitoring si c'est le premier client
        if (connectionManager.getClientCount() === 1) {
          systemMonitor.startMonitoring(2000, (stats) => {
            connectionManager.broadcast({ type: 'system_stats', ...stats });
          });
        }
      }
      return;
    }

    // ─── Vérifier l'authentification ───
    if (!connectionManager.isAuthenticated(ws)) {
      connectionManager.send(ws, { type: 'error', message: 'Non authentifié' });
      return;
    }

    // ─── Routage des messages ───
    switch (msg.type) {
      // --- Entrées souris/clavier ---
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

      // --- Streaming écran ---
      case 'start_stream':
        if (!screenCapture.isRunning()) {
          const started = screenCapture.start({
            fps: msg.fps || 20,
            quality: msg.quality || 5,
            width: msg.width || 1280,
            height: msg.height || 720
          });
          if (started) {
            screenCapture.onFrame((frame) => {
              connectionManager.broadcastBinary(frame);
            });
          }
          connectionManager.send(ws, {
            type: 'stream_status',
            running: screenCapture.isRunning()
          });
        }
        break;

      case 'stop_stream':
        screenCapture.stop();
        connectionManager.send(ws, { type: 'stream_status', running: false });
        break;

      // --- Applications ---
      case 'get_apps':
        connectionManager.send(ws, {
          type: 'app_list',
          apps: await appLauncher.getApps()
        });
        break;

      case 'launch_app':
        appLauncher.launchApp(msg.id);
        break;

      case 'add_app':
        const newApp = appLauncher.addApp(msg.app);
        connectionManager.broadcast({
          type: 'app_list',
          apps: await appLauncher.getApps()
        });
        break;

      case 'remove_app':
        appLauncher.removeApp(msg.id);
        connectionManager.broadcast({
          type: 'app_list',
          apps: await appLauncher.getApps()
        });
        break;

      // --- Actions système ---
      case 'system_action':
        appLauncher.systemAction(msg.action);
        break;

      case 'play_sound':
        soundPlayer.play(msg.sound);
        break;

      case 'set_volume':
        audioManager.setVolume(msg.device, msg.value);
        break;

      // --- Processus ---
      case 'get_processes':
        try {
          const processes = await appLauncher.getProcesses();
          connectionManager.send(ws, { type: 'process_list', processes });
        } catch (err) {
          connectionManager.send(ws, { type: 'error', message: err.message });
        }
        break;

      case 'kill_process':
        try {
          await appLauncher.killProcess(msg.pid);
          connectionManager.send(ws, { type: 'process_killed', pid: msg.pid });
        } catch (err) {
          connectionManager.send(ws, { type: 'error', message: err.message });
        }
        break;

      default:
        break;
    }
  });

  ws.on('close', () => {
    // Si plus aucun client connecté, arrêter le monitoring et le stream
    if (connectionManager.getClientCount() === 0) {
      systemMonitor.stopMonitoring();
      if (screenCapture.isRunning()) {
        screenCapture.stop();
      }
    }
  });
});

// ═══════════════════════════════════════
// API REST (pour debug/config)
// ═══════════════════════════════════════
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    clients: connectionManager.getClientCount(),
    streaming: screenCapture.isRunning()
  });
});

// ═══════════════════════════════════════
// Démarrage du serveur
// ═══════════════════════════════════════
server.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        localIP = addr.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }

  console.log('═══════════════════════════════════════════');
  console.log('  🎮 DeckPad Server - Prêt !');
  console.log('═══════════════════════════════════════════');
  console.log(`  📡 WiFi:  http://${localIP}:${PORT}`);
  console.log(`  🔌 USB:   http://localhost:${PORT}`);
  console.log(`  💻 PC:    ${os.hostname()}`);
  console.log('═══════════════════════════════════════════');
  console.log('  Ouvre cette adresse dans Chrome sur ta tablette');
  console.log('');
});

// Nettoyage à la fermeture
process.on('SIGINT', () => {
  console.log('\n[DeckPad] Arrêt...');
  screenCapture.stop();
  systemMonitor.stopMonitoring();
  connectionManager.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  screenCapture.stop();
  systemMonitor.stopMonitoring();
  connectionManager.destroy();
  process.exit(0);
});
