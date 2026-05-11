/**
 * DeckPad — Module de connexion WebSocket
 * Reconnexion exponentielle 1s → 30s avec émission d'états :
 *   'connected' | 'reconnecting' | 'offline' | 'disconnected'
 */

class DeckPadConnection {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.authenticated = false;

    this.messageHandlers = new Map();
    this.binaryHandler = null;
    this.onStatusChange = null;

    // Reconnexion exponentielle
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 12;        // ~ 6 min max
    this.reconnectMinDelay = 1000;         // 1s
    this.reconnectMaxDelay = 30000;        // 30s
    this.reconnectTimer = null;
    this.shouldReconnect = false;

    // Mémoire pour reconnexion auto
    this.lastHost = null;
    this.lastPin = null;
    this.serverUrl = '';

    // Visibility — relancer immédiatement si tablette se réveille
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.shouldReconnect && !this.connected) {
        this._scheduleReconnect(true);
      }
    });
  }

  /**
   * Connexion WebSocket initiale (ou reconnexion explicite)
   */
  connect(host, pin) {
    this.lastHost = host;
    this.lastPin = pin;
    this.shouldReconnect = true;

    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${host}:9090`;
      this.serverUrl = `http://${host}:9090`;

      console.log(`[Connection] → ${wsUrl}`);

      try {
        this.ws = new WebSocket(wsUrl);
      } catch (err) {
        reject(new Error('Impossible de se connecter'));
        return;
      }

      const timeout = setTimeout(() => {
        try { this.ws.close(); } catch (_) {}
        reject(new Error('Timeout de connexion'));
      }, 5000);

      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('[Connection] WebSocket connecté');
        this.connected = true;
        this.reconnectAttempts = 0;
        clearTimeout(timeout);
        this.send({ type: 'auth', pin });
      };

      this.ws.onmessage = (event) => {
        // Frame binaire (vidéo)
        if (event.data instanceof ArrayBuffer) {
          if (this.binaryHandler) this.binaryHandler(event.data);
          return;
        }

        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'auth_result') {
            if (msg.success) {
              this.authenticated = true;
              this._notifyStatus('connected');
              clearTimeout(timeout);
              resolve(msg);
            } else {
              clearTimeout(timeout);
              this.shouldReconnect = false; // PIN faux : on ne tente plus
              reject(new Error('Code PIN incorrect'));
              try { this.ws.close(); } catch (_) {}
            }
            return;
          }

          const handler = this.messageHandlers.get(msg.type);
          if (handler) handler(msg);
        } catch (err) {
          console.error('[Connection] Parse error:', err);
        }
      };

      this.ws.onclose = () => {
        const wasAuth = this.authenticated;
        this.connected = false;
        this.authenticated = false;

        if (wasAuth && this.shouldReconnect) {
          // Connexion établie puis perdue — reconnexion auto
          this._notifyStatus('reconnecting');
          this._scheduleReconnect();
        } else {
          this._notifyStatus('disconnected');
        }
      };

      this.ws.onerror = () => {
        console.error('[Connection] Erreur WebSocket');
        clearTimeout(timeout);
        if (!this.authenticated) {
          reject(new Error('Erreur de connexion — vérifie l\'adresse IP'));
        }
      };
    });
  }

  /**
   * Backoff exponentiel : 1s → 2s → 4s → 8s → ... → 30s
   */
  _scheduleReconnect(immediate = false) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[Connection] Max reconnect attempts atteint — offline');
      this.shouldReconnect = false;
      this._notifyStatus('offline');
      return;
    }

    const baseDelay = immediate
      ? 0
      : Math.min(
          this.reconnectMinDelay * Math.pow(2, this.reconnectAttempts),
          this.reconnectMaxDelay
        );
    // Jitter ±20% pour éviter thundering herd
    const jitter = baseDelay * (0.8 + Math.random() * 0.4);
    const delay = Math.round(jitter);

    this.reconnectAttempts++;
    console.log(`[Connection] Reconnexion #${this.reconnectAttempts} dans ${delay}ms`);

    this._notifyStatus('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimer = setTimeout(() => {
      if (!this.shouldReconnect) return;
      this.connect(this.lastHost, this.lastPin)
        .catch(() => this._scheduleReconnect());
    }, delay);
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  on(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  onBinary(handler) {
    this.binaryHandler = handler;
  }

  /**
   * Déconnexion volontaire (utilisateur)
   */
  disconnect() {
    this.shouldReconnect = false;
    this.authenticated = false;
    this.connected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    this._notifyStatus('disconnected');
  }

  isReady() {
    return this.connected && this.authenticated;
  }

  _notifyStatus(status, payload = null) {
    if (this.onStatusChange) this.onStatusChange(status, payload);
  }
}

window.deckpadConnection = new DeckPadConnection();
