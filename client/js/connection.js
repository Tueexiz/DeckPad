/**
 * DeckPad - Module de connexion WebSocket
 */

class DeckPadConnection {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.authenticated = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Map();
    this.binaryHandler = null;
    this.onStatusChange = null;
    this.serverUrl = '';
  }

  /**
   * Connecte au serveur WebSocket
   */
  connect(host, pin) {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${host}:9090`;
      this.serverUrl = `http://${host}:9090`;

      console.log(`[Connection] Connexion à ${wsUrl}...`);

      try {
        this.ws = new WebSocket(wsUrl);
      } catch (err) {
        reject(new Error('Impossible de se connecter'));
        return;
      }

      const timeout = setTimeout(() => {
        this.ws.close();
        reject(new Error('Timeout de connexion'));
      }, 5000);

      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('[Connection] WebSocket connecté');
        this.connected = true;
        this.reconnectAttempts = 0;
        clearTimeout(timeout);

        // Envoyer le PIN
        this.send({ type: 'auth', pin: pin });
      };

      this.ws.onmessage = (event) => {
        // Message binaire (frame vidéo)
        if (event.data instanceof ArrayBuffer) {
          if (this.binaryHandler) {
            this.binaryHandler(event.data);
          }
          return;
        }

        // Message JSON
        try {
          const msg = JSON.parse(event.data);

          // Gérer l'authentification
          if (msg.type === 'auth_result') {
            if (msg.success) {
              this.authenticated = true;
              this._notifyStatus('connected');
              resolve(msg);
            } else {
              clearTimeout(timeout);
              reject(new Error('Code PIN incorrect'));
              this.ws.close();
            }
            return;
          }

          // Router vers les handlers
          const handler = this.messageHandlers.get(msg.type);
          if (handler) {
            handler(msg);
          }
        } catch (err) {
          console.error('[Connection] Erreur parsing message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('[Connection] WebSocket fermé');
        const wasAuth = this.authenticated;
        this.connected = false;
        this.authenticated = false;
        this._notifyStatus('disconnected');

        if (wasAuth && this.reconnectAttempts < this.maxReconnectAttempts) {
          // Pas de reconnection auto pour l'instant
        }
      };

      this.ws.onerror = (err) => {
        console.error('[Connection] Erreur WebSocket');
        clearTimeout(timeout);
        if (!this.authenticated) {
          reject(new Error('Erreur de connexion - Vérifie l\'adresse IP'));
        }
      };
    });
  }

  /**
   * Envoie un message JSON
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Enregistre un handler pour un type de message
   */
  on(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Enregistre le handler pour les messages binaires
   */
  onBinary(handler) {
    this.binaryHandler = handler;
  }

  /**
   * Déconnexion
   */
  disconnect() {
    this.authenticated = false;
    this.connected = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._notifyStatus('disconnected');
  }

  /**
   * Vérifie si connecté et authentifié
   */
  isReady() {
    return this.connected && this.authenticated;
  }

  /**
   * Notifie le changement de statut
   */
  _notifyStatus(status) {
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }
}

// Instance globale
window.deckpadConnection = new DeckPadConnection();
