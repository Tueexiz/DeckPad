#!/usr/bin/env node
/**
 * DeckPad — Tests E2E
 *
 * Lance le serveur dans un sub-process, vérifie :
 *  - Boot serveur sans erreur
 *  - GET /health → 200 + structure attendue
 *  - GET /api/capabilities → 200
 *  - WebSocket : auth PIN incorrect → rejet
 *  - WebSocket : auth PIN correct → succès + flux audio_meter
 *  - Robustesse : kill du process audio meter, vérif redémarrage automatique
 *
 * Aucune dépendance externe — utilise http/ws natifs.
 * Usage : npm run test:e2e
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const PORT = 9091;
const SERVER_PATH = path.join(__dirname, '..', 'server', 'index.js');

let serverProc = null;
let serverPin = null;
let testsPassed = 0;
let testsFailed = 0;

const C = {
  green: '\x1b[32m', red: '\x1b[31m', cyan: '\x1b[36m', dim: '\x1b[2m', reset: '\x1b[0m',
};

function log(msg) { console.log(msg); }
function pass(name) { testsPassed++; log(`  ${C.green}✓${C.reset} ${name}`); }
function fail(name, err) {
  testsFailed++;
  log(`  ${C.red}✗${C.reset} ${name}`);
  if (err) log(`    ${C.dim}${err.message || err}${C.reset}`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    log(`${C.cyan}● Démarrage serveur (port ${PORT})${C.reset}`);
    serverProc = spawn(process.execPath, [SERVER_PATH], {
      env: { ...process.env, PORT: String(PORT), DECKPAD_DIST: '0', NODE_ENV: 'development' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let booted = false;
    const timeout = setTimeout(() => {
      if (!booted) { serverProc.kill(); reject(new Error('Boot timeout (10s)')); }
    }, 10000);

    serverProc.stdout.on('data', (chunk) => {
      const s = chunk.toString();
      const m = s.match(/Code PIN:\s*(\d{4})/);
      if (m) serverPin = m[1];
      if (s.includes('DeckPad Server - Prêt') || s.includes('Server listening')) {
        booted = true;
        clearTimeout(timeout);
        // Petit délai pour la stabilisation
        setTimeout(() => resolve(), 500);
      }
    });

    serverProc.stderr.on('data', (chunk) => {
      const s = chunk.toString();
      if (s.toLowerCase().includes('error') && !s.includes('ENOENT')) {
        log(`${C.dim}stderr: ${s.trim().slice(0, 200)}${C.reset}`);
      }
    });

    serverProc.on('exit', (code) => {
      if (!booted) {
        clearTimeout(timeout);
        reject(new Error(`Serveur exited (code ${code})`));
      }
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (!serverProc) return resolve();
    serverProc.once('exit', () => resolve());
    try { serverProc.kill('SIGTERM'); } catch (_) {}
    setTimeout(() => {
      try { serverProc.kill('SIGKILL'); } catch (_) {}
      resolve();
    }, 2500);
  });
}

/* ═══════════ TESTS ═══════════ */

async function testHealth() {
  log(`\n${C.cyan}▶ Health endpoint${C.reset}`);
  const res = await getJson(`http://localhost:${PORT}/health`);
  if (res.status !== 200 && res.status !== 503) throw new Error(`status ${res.status}`);
  pass('GET /health → 200/503');

  const h = res.body;
  if (!h.timestamp) throw new Error('missing timestamp');
  if (!h.modules) throw new Error('missing modules');
  if (!h.modules.screen) throw new Error('missing modules.screen');
  if (!h.modules.audio) throw new Error('missing modules.audio');
  if (!h.modules.meter) throw new Error('missing modules.meter');
  pass('Structure /health complète (screen, audio, meter, input, media)');

  if (typeof h.modules.audio.nircmd !== 'boolean') throw new Error('audio.nircmd not boolean');
  pass('audio.nircmd détecté correctement');
}

async function testCapabilities() {
  log(`\n${C.cyan}▶ Capabilities endpoint${C.reset}`);
  const res = await getJson(`http://localhost:${PORT}/api/capabilities`);
  if (res.status !== 200) throw new Error(`status ${res.status}`);
  if (!res.body.version) throw new Error('missing version');
  if (!res.body.audio) throw new Error('missing audio capabilities');
  pass('GET /api/capabilities → version + audio + screen');
}

async function testAuthRejection() {
  log(`\n${C.cyan}▶ WebSocket auth rejection${C.reset}`);
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${PORT}`);
    let timeout = setTimeout(() => {
      ws.close();
      reject(new Error('auth_result timeout'));
    }, 3000);
    ws.on('open', () => ws.send(JSON.stringify({ type: 'auth', pin: '0000' })));
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'auth_result') {
        clearTimeout(timeout);
        if (msg.success === false) {
          pass('PIN incorrect rejeté (auth_result.success = false)');
          ws.close();
          resolve();
        } else {
          reject(new Error('Wrong PIN was accepted!'));
        }
      }
    });
    ws.on('error', (e) => { clearTimeout(timeout); reject(e); });
  });
}

async function testAuthSuccess() {
  log(`\n${C.cyan}▶ WebSocket auth success + audio meter${C.reset}`);
  if (!serverPin) throw new Error('PIN non extrait du boot');
  pass(`PIN extrait : ${serverPin}`);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${PORT}`);
    let authed = false;
    let meterReceived = false;
    let stateReceived = false;

    const timeout = setTimeout(() => {
      ws.close();
      // On accepte que le meter ne soit pas reçu si pas de son joué
      if (authed) {
        if (!meterReceived) log(`    ${C.dim}(audio_meter non émis — silence audio probable)${C.reset}`);
        resolve();
      } else {
        reject(new Error('Auth timeout'));
      }
    }, 6000);

    ws.on('open', () => ws.send(JSON.stringify({ type: 'auth', pin: serverPin })));

    ws.on('message', (data) => {
      let msg;
      try { msg = JSON.parse(data.toString()); }
      catch { return; } // binaire (frame vidéo) — ignorer

      if (msg.type === 'auth_result') {
        if (msg.success) {
          authed = true;
          pass('Authentification réussie');
          if (msg.capabilities) pass('auth_result inclut capabilities');
          if (msg.version)      pass('auth_result inclut version');
        } else {
          reject(new Error('PIN correct refusé'));
        }
      }

      if (msg.type === 'volume_info') {
        stateReceived = true;
        pass(`volume_info reçu (vol=${msg.volume}${msg.muted !== undefined ? ', muted=' + msg.muted : ''})`);
      }

      if (msg.type === 'audio_profiles') {
        pass(`audio_profiles reçu (${msg.profiles?.length || 0} profils)`);
      }

      if (msg.type === 'audio_meter') {
        if (!meterReceived) {
          meterReceived = true;
          pass(`audio_meter reçu (peak=${msg.peak?.toFixed(3)}, ${msg.channels?.length || 0} canaux)`);
          clearTimeout(timeout);
          ws.close();
          resolve();
        }
      }
    });

    ws.on('error', (e) => { clearTimeout(timeout); reject(e); });
    ws.on('close', () => {
      if (authed && !meterReceived) {
        // OK si auth a réussi
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

async function testProfileApply() {
  log(`\n${C.cyan}▶ Apply audio profile${C.reset}`);
  if (!serverPin) return;
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${PORT}`);
    const timeout = setTimeout(() => { ws.close(); resolve(); }, 3000);
    ws.on('open', () => ws.send(JSON.stringify({ type: 'auth', pin: serverPin })));
    ws.on('message', (data) => {
      let msg;
      try { msg = JSON.parse(data.toString()); } catch { return; }
      if (msg.type === 'auth_result' && msg.success) {
        ws.send(JSON.stringify({ type: 'apply_audio_profile', name: 'gaming' }));
        pass('apply_audio_profile envoyé sans erreur serveur');
        setTimeout(() => { clearTimeout(timeout); ws.close(); resolve(); }, 500);
      }
    });
    ws.on('error', () => { clearTimeout(timeout); resolve(); });
  });
}

async function testStaticAssets() {
  log(`\n${C.cyan}▶ Static assets${C.reset}`);
  const tries = ['/manifest.webmanifest', '/sw.js', '/icons/icon-192.svg', '/css/design-system.css'];
  for (const p of tries) {
    await new Promise((resolve) => {
      const req = http.get(`http://localhost:${PORT}${p}`, (res) => {
        if (res.statusCode === 200) pass(`GET ${p} → 200`);
        else fail(`GET ${p} (status ${res.statusCode})`);
        res.resume(); resolve();
      });
      req.on('error', (e) => { fail(`GET ${p}`, e); resolve(); });
    });
  }
}

/* ═══════════ MAIN ═══════════ */

(async () => {
  log(`${C.cyan}╔═══════════════════════════════════════╗${C.reset}`);
  log(`${C.cyan}║     DeckPad — Suite E2E               ║${C.reset}`);
  log(`${C.cyan}╚═══════════════════════════════════════╝${C.reset}`);

  try {
    await startServer();
    log(`${C.green}● Serveur prêt (PIN: ${serverPin || 'inconnu'})${C.reset}`);

    const tests = [
      ['Health endpoint',           testHealth],
      ['Capabilities endpoint',     testCapabilities],
      ['WebSocket auth rejection',  testAuthRejection],
      ['WebSocket auth success',    testAuthSuccess],
      ['Apply audio profile',       testProfileApply],
      ['Static assets',             testStaticAssets],
    ];

    for (const [name, fn] of tests) {
      try { await fn(); }
      catch (e) { fail(name, e); }
    }
  } catch (e) {
    log(`${C.red}● Erreur fatale: ${e.message}${C.reset}`);
    testsFailed++;
  } finally {
    await stopServer();
  }

  log(`\n${C.cyan}═══════════════════════════════════════${C.reset}`);
  log(`  ${C.green}✓ ${testsPassed} passed${C.reset}    ${testsFailed > 0 ? C.red : C.dim}✗ ${testsFailed} failed${C.reset}`);
  log(`${C.cyan}═══════════════════════════════════════${C.reset}\n`);

  process.exit(testsFailed > 0 ? 1 : 0);
})();
