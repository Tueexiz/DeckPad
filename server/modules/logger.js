/**
 * DeckPad — Logger structuré
 *
 * Format : [LEVEL] ISO-timestamp [scope] message {meta}
 * Niveaux : DEBUG | INFO | WARN | ERROR
 * Rotation : log courant écrit dans logs/deckpad.log
 *            quand > 1 MB → archivé en deckpad.<timestamp>.log (max 5 archives)
 * Console : couleurs ANSI selon niveau
 */

const fs = require('fs');
const path = require('path');

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const COLORS = {
  DEBUG: '\x1b[90m', // gris
  INFO:  '\x1b[36m', // cyan
  WARN:  '\x1b[33m', // jaune
  ERROR: '\x1b[31m', // rouge
  RESET: '\x1b[0m',
  DIM:   '\x1b[2m',
};

const LOG_DIR  = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'deckpad.log');
const MAX_SIZE = 1 * 1024 * 1024; // 1 MB
const MAX_ARCHIVES = 5;

// Niveau minimal (override via env DECKPAD_LOG_LEVEL)
const minLevel = LEVELS[(process.env.DECKPAD_LOG_LEVEL || 'INFO').toUpperCase()] ?? LEVELS.INFO;

// Init dossier
try {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (_) {}

let stream = null;
function getStream() {
  if (stream) return stream;
  try {
    stream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
    stream.on('error', () => { stream = null; });
    return stream;
  } catch (_) {
    return null;
  }
}

function rotateIfNeeded() {
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const { size } = fs.statSync(LOG_FILE);
    if (size < MAX_SIZE) return;

    if (stream) {
      stream.end();
      stream = null;
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const archived = path.join(LOG_DIR, `deckpad.${ts}.log`);
    fs.renameSync(LOG_FILE, archived);

    // Purge des archives anciennes
    const archives = fs.readdirSync(LOG_DIR)
      .filter(f => f.startsWith('deckpad.') && f.endsWith('.log') && f !== 'deckpad.log')
      .map(f => ({ f, t: fs.statSync(path.join(LOG_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);

    archives.slice(MAX_ARCHIVES).forEach(({ f }) => {
      try { fs.unlinkSync(path.join(LOG_DIR, f)); } catch (_) {}
    });
  } catch (_) {}
}

function formatMeta(meta) {
  if (!meta) return '';
  if (typeof meta !== 'object') return ' ' + String(meta);
  try {
    const json = JSON.stringify(meta, (k, v) => {
      if (v instanceof Error) return { name: v.name, message: v.message, stack: v.stack };
      return v;
    });
    return ' ' + json;
  } catch (_) {
    return '';
  }
}

function write(level, scope, msg, meta) {
  if (LEVELS[level] < minLevel) return;

  const ts = new Date().toISOString();
  const metaStr = formatMeta(meta);
  const plain = `[${level}] ${ts} [${scope}] ${msg}${metaStr}`;

  // Console (couleurs)
  const c = COLORS[level] || '';
  const fn = level === 'ERROR' ? console.error : (level === 'WARN' ? console.warn : console.log);
  fn(`${c}[${level}]${COLORS.RESET} ${COLORS.DIM}${ts}${COLORS.RESET} ${c}[${scope}]${COLORS.RESET} ${msg}${metaStr}`);

  // Fichier
  rotateIfNeeded();
  const s = getStream();
  if (s) {
    try { s.write(plain + '\n'); } catch (_) {}
  }
}

/**
 * Crée un logger scopé pour un module
 * Usage : const log = require('./logger').create('AudioManager');
 *        log.info('volume changed', { device, value });
 */
function create(scope) {
  return {
    debug: (msg, meta) => write('DEBUG', scope, msg, meta),
    info:  (msg, meta) => write('INFO',  scope, msg, meta),
    warn:  (msg, meta) => write('WARN',  scope, msg, meta),
    error: (msg, meta) => write('ERROR', scope, msg, meta),
  };
}

// Capture des exceptions non gérées
process.on('uncaughtException', (err) => {
  write('ERROR', 'process', 'Uncaught exception', err);
});
process.on('unhandledRejection', (reason) => {
  write('ERROR', 'process', 'Unhandled rejection', reason);
});

module.exports = { create, LEVELS };
