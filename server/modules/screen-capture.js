/**
 * DeckPad - Module de capture d'écran
 * Utilise FFmpeg gdigrab pour capturer le bureau Windows en MJPEG
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Cherche FFmpeg dans les emplacements connus
 */
function findFFmpeg() {
  // 1. Vérifier si ffmpeg est dans le PATH
  try {
    const result = execSync('where ffmpeg', { encoding: 'utf-8', timeout: 5000 }).trim();
    if (result) return result.split('\n')[0].trim();
  } catch {}

  // 2. Chercher dans WinGet packages
  const wingetBase = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(wingetBase)) {
    try {
      const dirs = fs.readdirSync(wingetBase).filter(d => d.includes('FFmpeg'));
      for (const dir of dirs) {
        const binDir = path.join(wingetBase, dir);
        const found = findFileRecursive(binDir, 'ffmpeg.exe', 3);
        if (found) return found;
      }
    } catch {}
  }

  // 3. Chemins courants
  const commonPaths = [
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
    path.join(os.homedir(), 'ffmpeg', 'bin', 'ffmpeg.exe'),
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }

  return 'ffmpeg'; // Fallback: espérer qu'il est dans le PATH
}

function findFileRecursive(dir, filename, maxDepth) {
  if (maxDepth <= 0) return null;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === filename) return fullPath;
      if (entry.isDirectory()) {
        const found = findFileRecursive(fullPath, filename, maxDepth - 1);
        if (found) return found;
      }
    }
  } catch {}
  return null;
}

const FFMPEG_PATH = findFFmpeg();
console.log(`[ScreenCapture] FFmpeg trouvé: ${FFMPEG_PATH}`);

class ScreenCapture {
  constructor() {
    this.process = null;
    this.running = false;
    this.frameCallback = null;
    this.frameBuffer = Buffer.alloc(0);
    this.options = {
      fps: 20,
      quality: 5,
      width: 1280,
      height: 720
    };
  }

  /**
   * Démarre la capture d'écran
   */
  start(options = {}) {
    if (this.running) {
      this.stop();
    }

    Object.assign(this.options, options);
    const { fps, quality, width, height } = this.options;

    // L'utilisateur veut l'écran de gauche (X=0, Y=0)
    // On capture le desktop en précisant l'offset
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

    console.log(`[ScreenCapture] Démarrage FFmpeg: ${fps}fps, ${width}x${height}, q=${quality}`);

    try {
      this.process = spawn(FFMPEG_PATH, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (err) {
      console.error('[ScreenCapture] Erreur lancement FFmpeg:', err.message);
      console.error('[ScreenCapture] Vérifie que FFmpeg est installé et dans le PATH');
      return false;
    }

    this.running = true;
    this.frameBuffer = Buffer.alloc(0);

    // Parser le flux MJPEG pour extraire les frames individuelles
    this.process.stdout.on('data', (chunk) => {
      this.frameBuffer = Buffer.concat([this.frameBuffer, chunk]);
      this._extractFrames();
    });

    this.process.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.startsWith('frame=') && !msg.includes('speed=')) {
        // Ne log que les erreurs, pas les stats de progression
        if (msg.includes('Error') || msg.includes('error') || msg.includes('fatal')) {
          console.error('[ScreenCapture] FFmpeg:', msg);
        }
      }
    });

    this.process.on('close', (code) => {
      console.log(`[ScreenCapture] FFmpeg terminé (code: ${code})`);
      this.running = false;
    });

    this.process.on('error', (err) => {
      console.error('[ScreenCapture] Erreur FFmpeg:', err.message);
      this.running = false;
    });

    return true;
  }

  /**
   * Arrête la capture
   */
  stop() {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.running = false;
    this.frameBuffer = Buffer.alloc(0);
    console.log('[ScreenCapture] Capture arrêtée');
  }

  /**
   * Enregistre un callback pour chaque frame
   */
  onFrame(callback) {
    this.frameCallback = callback;
  }

  /**
   * Vérifie si la capture est en cours
   */
  isRunning() {
    return this.running;
  }

  /**
   * Extrait les frames JPEG du buffer
   * JPEG commence par 0xFFD8 (SOI) et finit par 0xFFD9 (EOI)
   */
  _extractFrames() {
    const SOI = Buffer.from([0xFF, 0xD8]); // Start Of Image
    const EOI = Buffer.from([0xFF, 0xD9]); // End Of Image

    while (true) {
      // Chercher le début d'une frame
      const startIdx = this.frameBuffer.indexOf(SOI);
      if (startIdx === -1) {
        // Pas de SOI trouvé, vider le buffer
        this.frameBuffer = Buffer.alloc(0);
        break;
      }

      // Chercher la fin de la frame (après le SOI)
      const endIdx = this.frameBuffer.indexOf(EOI, startIdx + 2);
      if (endIdx === -1) {
        // Frame incomplète, garder le buffer à partir du SOI
        if (startIdx > 0) {
          this.frameBuffer = this.frameBuffer.subarray(startIdx);
        }
        break;
      }

      // Extraire la frame complète (inclure les 2 bytes de EOI)
      const frame = this.frameBuffer.subarray(startIdx, endIdx + 2);

      // Émettre la frame
      if (this.frameCallback) {
        this.frameCallback(frame);
      }

      // Avancer le buffer après cette frame
      this.frameBuffer = this.frameBuffer.subarray(endIdx + 2);
    }

    // Limiter la taille du buffer pour éviter les fuites mémoire
    if (this.frameBuffer.length > 5 * 1024 * 1024) {
      console.warn('[ScreenCapture] Buffer trop grand, reset');
      this.frameBuffer = Buffer.alloc(0);
    }
  }
}

module.exports = ScreenCapture;
