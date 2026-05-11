/**
 * DeckPad — Gestionnaire de connexions WebSocket
 * Auth PIN, heartbeats, broadcast.
 */

const log = require('./logger').create('ConnectionManager');

class ConnectionManager {
  constructor(wss) {
    this.wss = wss;
    this.pin = this._generatePin();
    this.authenticatedClients = new Set();
    this.heartbeatInterval = null;

    console.log(`\n  ╔══════════════════════════════════════╗`);
    console.log(`  ║  🔐 Code PIN: ${this.pin}                  ║`);
    console.log(`  ║  Entre ce code sur ta tablette       ║`);
    console.log(`  ╚══════════════════════════════════════╝\n`);

    log.info('Manager prêt', { pin: this.pin });
    this._setupHeartbeat();
  }

  _generatePin() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  _setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          log.warn('Client timeout (heartbeat)');
          this.authenticatedClients.delete(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        try { ws.ping(); } catch (_) {}
      });
    }, 10000);
  }

  handleConnection(ws, req) {
    ws.isAlive = true;
    ws.isAuthenticated = false;

    const ip = req.socket.remoteAddress;
    log.info('Nouvelle connexion', { ip });

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('close', () => {
      this.authenticatedClients.delete(ws);
      log.info('Client déconnecté', { ip });
    });
  }

  authenticate(ws, pin) {
    if (pin === this.pin) {
      ws.isAuthenticated = true;
      this.authenticatedClients.add(ws);
      log.info('Client authentifié');
      return true;
    }
    log.warn('Échec authentification', { pinTried: pin });
    return false;
  }

  isAuthenticated(ws) {
    return ws.isAuthenticated === true;
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.authenticatedClients.forEach((client) => {
      if (client.readyState === 1) {
        try { client.send(data); } catch (_) {}
      }
    });
  }

  broadcastBinary(data) {
    this.authenticatedClients.forEach((client) => {
      if (client.readyState === 1) {
        try { client.send(data, { binary: true }); } catch (_) {}
      }
    });
  }

  send(ws, message) {
    if (ws.readyState === 1) {
      try { ws.send(JSON.stringify(message)); } catch (_) {}
    }
  }

  getClientCount() {
    return this.authenticatedClients.size;
  }

  regeneratePin() {
    this.pin = this._generatePin();
    log.info('PIN régénéré', { pin: this.pin });
    this.authenticatedClients.forEach(client => {
      this.send(client, { type: 'disconnected', reason: 'pin_changed' });
      try { client.close(); } catch (_) {}
    });
    this.authenticatedClients.clear();
    return this.pin;
  }

  destroy() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.wss.clients.forEach(client => {
      try { client.close(); } catch (_) {}
    });
  }
}

module.exports = ConnectionManager;
