/**
 * DeckPad - Gestionnaire de connexions WebSocket
 * Gère l'authentification par PIN, les heartbeats, et la diffusion aux clients
 */

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

    this._setupHeartbeat();
  }

  /**
   * Génère un PIN aléatoire à 4 chiffres
   */
  _generatePin() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  /**
   * Configure le heartbeat pour détecter les déconnexions
   */
  _setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('[ConnectionManager] Client déconnecté (heartbeat timeout)');
          this.authenticatedClients.delete(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 10000);
  }

  /**
   * Gère une nouvelle connexion
   */
  handleConnection(ws, req) {
    ws.isAlive = true;
    ws.isAuthenticated = false;

    const ip = req.socket.remoteAddress;
    console.log(`[ConnectionManager] Nouvelle connexion depuis ${ip}`);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      this.authenticatedClients.delete(ws);
      console.log(`[ConnectionManager] Client déconnecté (${ip})`);
    });
  }

  /**
   * Vérifie l'authentification d'un client
   */
  authenticate(ws, pin) {
    if (pin === this.pin) {
      ws.isAuthenticated = true;
      this.authenticatedClients.add(ws);
      console.log('[ConnectionManager] Client authentifié ✅');
      return true;
    }
    console.log(`[ConnectionManager] Échec auth (PIN: ${pin})`);
    return false;
  }

  /**
   * Vérifie si un client est authentifié
   */
  isAuthenticated(ws) {
    return ws.isAuthenticated === true;
  }

  /**
   * Envoie un message JSON à tous les clients authentifiés
   */
  broadcast(message) {
    const data = JSON.stringify(message);
    this.authenticatedClients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(data);
      }
    });
  }

  /**
   * Envoie des données binaires à tous les clients authentifiés
   */
  broadcastBinary(data) {
    this.authenticatedClients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(data, { binary: true });
      }
    });
  }

  /**
   * Envoie un message JSON à un client spécifique
   */
  send(ws, message) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Nombre de clients connectés
   */
  getClientCount() {
    return this.authenticatedClients.size;
  }

  /**
   * Régénère le PIN
   */
  regeneratePin() {
    this.pin = this._generatePin();
    console.log(`[ConnectionManager] Nouveau PIN: ${this.pin}`);
    // Déconnecter tous les clients
    this.authenticatedClients.forEach(client => {
      this.send(client, { type: 'disconnected', reason: 'pin_changed' });
      client.close();
    });
    this.authenticatedClients.clear();
    return this.pin;
  }

  /**
   * Nettoyage
   */
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.clients.forEach(client => client.close());
  }
}

module.exports = ConnectionManager;
