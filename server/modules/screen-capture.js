/**
 * DeckPad — Module de capture d'écran
 * FFmpeg gdigrab → MJPEG, avec watchdog auto-restart si crash
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const EventEmitter = require('events');
const log = require('./logger').create('ScreenCapture');

/* ─── Détection FFmpeg ─── */
function findFFmpeg() {
  try {
    const result = execSync('where ffmpeg', { encoding: 'utf-8', timeout: 5000 }).trim();
    if (result) return result.split('\n')[0].trim();
  } catch (_) {}

  const wingetBase = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(wingetBase)) {
    try {
      const dirs = fs.readdirSync(wingetBase).filter(d => d.includes('FFmpeg'));
      for (const dir of dirs) {
        const found = findFileRecursive(path.join(wingetBase, dir), 'ffmpeg.exe', 3);
        if (found) return found;
      }
    } catch (_) {}
  }

  const commonPaths = [
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
    path.join(os.homedir(), 'ffmpeg', 'bin', 'ffmpeg.exe'),
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'ffmpeg';
}

function findFileRecursive(dir, filename, maxDepth) {
  if (maxDepth <= 0) return null;
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === filename) return fullPath;
      if (entry.isDirectory()) {
        const found = findFileRecursive(fullPath, filename, maxDepth - 1);
        if (found) return found;
      }
    }
  } catch (_) {}
  return null;
}

const FFMPEG_PATH = findFFmpeg();
const FFMPEG_AVAILABLE = FFMPEG_PATH !== 'ffmpeg' || (() => {
  try { execSync('ffmpeg -version', { timeout: 2000, stdio: 'ignore' }); return true; }
  catch (_) { return false; }
})();

log.info('FFmpeg detection', { path: FFMPEG_PATH, available: FFMPEG_AVAILABLE });

/* ─── ScreenCapture avec Watchdog ─── */
class ScreenCapture extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.running = false;
    this.shouldRun = false;          // Intention utilisateur (pour watchdog)
    this.frameCallback = null;
    this.frameBuffer = Buffer.alloc(0);
    this.options = { fps: 20, quality: 5, width: 1280, height: 720 };

    // Watchdog state
    this.crashCount = 0;
    this.lastCrashAt = 0;
    this.maxCrashesPerMinute = 5;
    this.restartTimer = null;

    // Health
    this.lastFrameAt = 0;
    this.framesSent = 0;
  }

  /**
   * Etat exposé pour /health
   */
  getHealth() {
    return {
      available: FFMPEG_AVAILABLE,
      ffmpegPath: FFMPEG_PATH,
      running: this.running,
      shouldRun: this.shouldRun,
      crashCount: this.crashCount,
      framesSent: this.framesSent,
      lastFrameAt: this.lastFrameAt ? new Date(this.lastFrameAt).toISOString() : null,
      msSinceLastFrame: this.lastFrameAt ? Date.now() - this.lastFrameAt : null,
    };
  }

  start(options = {}) {
    if (!FFMPEG_AVAILABLE) {
      log.warn('FFmpeg indisponible — capture désactivée');
      this.emit('unavailable', { reason: 'ffmpeg_missing' });
      return false;
    }

    if (this.running) this._killProcess();

    Object.assign(this.options, options);
    this.shouldRun = true;
    return this._spawn();
  }

  _spawn() {
    const { fps, quality, width, height } = this.options;
    const args = [
      '-f', 'gdigrab',
      '-framerate', String(fps),
      '-offset_x', '0',
      '-offset_y', '0',
      '-video_size', '1920x1080',
      '-i', 'desktop',
      '-vf', `scale=${width}:${height}`,
      '-f', 'mjpeg',
      '-q:v', String(quality),
      '-fflags', 'nobuffer',
      '-an',
      'pipe:1'
    ];

    log.info('Démarrage FFmpeg', { fps, width, height, quality });

    try {
      this.process = spawn(FFMPEG_PATH, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (err) {
      log.error('Impossible de lancer FFmpeg', err);
      return false;
    }

    this.running = true;
    this.frameBuffer = Buffer.alloc(0);

    this.process.stdout.on('data', (chunk) => {
      this.frameBuffer = Buffer.concat([this.frameBuffer, chunk]);
      this._extractFrames();
    });

    this.process.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.startsWith('frame=') && !msg.includes('speed=')) {
        if (msg.includes('Error') || msg.includes('error') || msg.includes('fatal')) {
          log.warn('FFmpeg stderr', { msg });
        }
      }
    });

    this.process.on('close', (code) => {
      this.running = false;
      this.process = null;
      log.info('FFmpeg terminé', { code });

      // Watchdog : si on devait tourner et qu'on a planté, on redémarre
      if (this.shouldRun && code !== 0 && code !== null) {
        this._scheduleRestart();
      }
    });

    this.process.on('error', (err) => {
      log.error('Erreur process FFmpeg', err);
      this.running = false;
    });

    return true;
  }

  _scheduleRestart() {
    const now = Date.now();
    // Reset compteur si > 60s depuis le dernier crash
    if (now - this.lastCrashAt > 60000) this.crashCount = 0;

    this.crashCount++;
    this.lastCrashAt = now;

    if (this.crashCount > this.maxCrashesPerMinute) {
      log.error('Trop de crashes FFmpeg — abandon watchdog', {
        crashes: this.crashCount,
        windowMs: 60000,
      });
      this.shouldRun = false;
      this.emit('watchdog_failed', { crashes: this.crashCount });
      return;
    }

    // Backoff exponentiel : 500ms, 1s, 2s, 4s, 8s
    const delay = Math.min(8000, 500 * Math.pow(2, this.crashCount - 1));
    log.warn('Watchdog FFmpeg — restart programmé', { crash: this.crashCount, delay });

    this.emit('watchdog_restart', { attempt: this.crashCount, delay });

    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => {
      if (this.shouldRun) this._spawn();
    }, delay);
  }

  _killProcess() {
    if (this.process) {
      try { this.process.kill('SIGTERM'); } catch (_) {}
      this.process = null;
    }
    this.running = false;
  }

  stop() {
    this.shouldRun = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this._killProcess();
    this.frameBuffer = Buffer.alloc(0);
    log.info('Capture arrêtée (volontaire)');
  }

  onFrame(callback) {
    this.frameCallback = callback;
  }

  isRunning() {
    return this.running;
  }

  _extractFrames() {
    const SOI = Buffer.from([0xFF, 0xD8]);
    const EOI = Buffer.from([0xFF, 0xD9]);

    while (true) {
      const startIdx = this.frameBuffer.indexOf(SOI);
      if (startIdx === -1) {
        this.frameBuffer = Buffer.alloc(0);
        break;
      }

      const endIdx = this.frameBuffer.indexOf(EOI, startIdx + 2);
      if (endIdx === -1) {
        if (startIdx > 0) this.frameBuffer = this.frameBuffer.subarray(startIdx);
        break;
      }

      const frame = this.frameBuffer.subarray(startIdx, endIdx + 2);
      this.lastFrameAt = Date.now();
      this.framesSent++;

      if (this.frameCallback) this.frameCallback(frame);
      this.frameBuffer = this.frameBuffer.subarray(endIdx + 2);
    }

    if (this.frameBuffer.length > 5 * 1024 * 1024) {
      log.warn('Buffer trop grand — reset');
      this.frameBuffer = Buffer.alloc(0);
    }
  }
}

module.exports = ScreenCapture;
