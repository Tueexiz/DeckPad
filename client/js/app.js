/**
 * DeckPad - Application principale
 * Gère la navigation, la connexion UI, et le touchpad
 */

class DeckPadApp {
  constructor() {
    this.currentView = 'dashboard';
    this.conn = window.deckpadConnection;
    this.sensitivity = 8;

    this._setupConnection();
    this._setupNavigation();
    this._setupConnectScreen();
    this._setupTouchpad();
    this._setupSettings();
    this._setupHaptics();
    this._startClock();
  }

  // ═══════════════════════════════════════
  // HAPTIQUES
  // ═══════════════════════════════════════
  _setupHaptics() {
    // Vibre légèrement dès le toucher d'un bouton pour un ressenti immédiat
    document.body.addEventListener('touchstart', (e) => {
      const btn = e.target.closest('button, .app-card, .action-btn, .nav-btn, .shortcut-btn, .deck-key');
      if (btn && navigator.vibrate) {
        // Petite vibration de 10ms (effet "clic" Premium)
        navigator.vibrate(10);
      }
    }, { passive: true });
  }

  // ═══════════════════════════════════════
  // CONNEXION
  // ═══════════════════════════════════════

  _setupConnectScreen() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    const wifiFields = document.getElementById('wifi-fields');
    const ipInput = document.getElementById('input-ip');
    const connectBtn = document.getElementById('btn-connect');
    const pinDigits = document.querySelectorAll('.pin-digit');
    const errorEl = document.getElementById('connect-error');
    const statusEl = document.getElementById('connect-status');

    let mode = 'wifi';

    // Mode toggle
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mode = btn.dataset.mode;
        if (mode === 'usb') {
          wifiFields.classList.add('hidden');
        } else {
          wifiFields.classList.remove('hidden');
        }
      });
    });

    // PIN auto-focus
    pinDigits.forEach((digit, idx) => {
      digit.addEventListener('input', (e) => {
        if (e.target.value && idx < 3) {
          pinDigits[idx + 1].focus();
        }
      });
      digit.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && idx > 0) {
          pinDigits[idx - 1].focus();
        }
      });
    });

    // Connexion
    connectBtn.addEventListener('click', async () => {
      const host = mode === 'usb' ? 'localhost' : ipInput.value.trim();
      const pin = Array.from(pinDigits).map(d => d.value).join('');

      if (mode === 'wifi' && !host) {
        this._showConnectError('Entre l\'adresse IP du PC');
        return;
      }
      if (pin.length !== 4) {
        this._showConnectError('Entre le code PIN à 4 chiffres');
        return;
      }

      // UI loading
      connectBtn.querySelector('.btn-text').textContent = 'Connexion...';
      connectBtn.querySelector('.btn-loader').classList.remove('hidden');
      connectBtn.disabled = true;
      if (errorEl) errorEl.classList.add('hidden');
      if (statusEl) statusEl.textContent = 'Connexion en cours...';

      try {
        const result = await this.conn.connect(host, pin);

        // Stocker l'info écran
        if (result.screenSize && window.screenViewer) {
          window.screenViewer.setScreenSize(result.screenSize);
        }

        // Stocker le nom du PC
        if (result.pcName) {
          document.getElementById('header-pc-name').textContent = result.pcName;
          document.getElementById('setting-pc-name').textContent = result.pcName;
        }

        document.getElementById('setting-mode').textContent = mode === 'usb' ? 'USB' : 'WiFi';

        // Afficher l'app principale
        document.getElementById('view-connect').classList.remove('active');
        document.getElementById('view-connect').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');

        this.showToast('Connecté au PC ! 🎮', 'success');
      } catch (err) {
        this._showConnectError(err.message);
        if (statusEl) statusEl.textContent = 'Échec de la connexion';
      } finally {
        connectBtn.querySelector('.btn-text').textContent = 'Connexion';
        connectBtn.querySelector('.btn-loader').classList.add('hidden');
        connectBtn.disabled = false;
      }
    });

    // Déconnexion depuis le statut
    this.conn.onStatusChange = (status) => {
      if (status === 'disconnected' && this.conn.authenticated === false) {
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('view-connect').classList.remove('hidden');
        document.getElementById('view-connect').classList.add('active');
        if (statusEl) statusEl.textContent = 'Déconnecté';
      }
    };
  }

  _showConnectError(message) {
    const el = document.getElementById('connect-error');
    if (el) {
      el.textContent = message;
      el.classList.remove('hidden');
    }
  }

  // ═══════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════

  _setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('#main-app .view');
    const titles = {
      dashboard: 'Accueil',
      screen: 'Écran',
      'mouse-keyboard': 'Contrôle PC',
      monitor: 'Monitor Pro',
      soundboard: 'Soundboard',
      settings: 'Réglages'
    };

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const viewId = btn.dataset.view;
        if (viewId === this.currentView) return;

        // Update nav
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update views
        views.forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) targetView.classList.add('active');

        // Update header
        document.getElementById('header-title').textContent = titles[viewId] || '';

        this.currentView = viewId;
        if (navigator.vibrate) navigator.vibrate(10);
      });
    });
  }

  // ═══════════════════════════════════════
  // TOUCHPAD
  // ═══════════════════════════════════════

  _setupTouchpad() {
    const touchpad = document.getElementById('touchpad-area');
    const scrollArea = document.getElementById('scroll-area');
    let lastX = 0, lastY = 0;
    let touching = false;
    let lastScrollY = 0;

    // Touchpad - mouvement souris relatif
    touchpad.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touching = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      touchpad.classList.add('touching');
    }, { passive: false });

    touchpad.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!touching) return;
      const touch = e.touches[0];
      const dx = (touch.clientX - lastX) * (this.sensitivity / 5);
      const dy = (touch.clientY - lastY) * (this.sensitivity / 5);

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        this.conn.send({
          type: 'mouse_move_relative',
          dx: Math.round(dx),
          dy: Math.round(dy)
        });
      }

      lastX = touch.clientX;
      lastY = touch.clientY;
    }, { passive: false });

    touchpad.addEventListener('touchend', (e) => {
      e.preventDefault();
      touching = false;
      touchpad.classList.remove('touching');
    }, { passive: false });

    // Double tap = double clic
    let lastTap = 0;
    touchpad.addEventListener('touchend', () => {
      const now = Date.now();
      if (now - lastTap < 300) {
        this.conn.send({ type: 'mouse_double_click', button: 'left' });
      }
      lastTap = now;
    });

    // Boutons souris
    document.getElementById('btn-click-left').addEventListener('click', () => {
      this.conn.send({ type: 'mouse_click', button: 'left' });
      if (navigator.vibrate) navigator.vibrate(15);
    });
    document.getElementById('btn-click-right').addEventListener('click', () => {
      this.conn.send({ type: 'mouse_click', button: 'right' });
      if (navigator.vibrate) navigator.vibrate(15);
    });
    document.getElementById('btn-click-middle').addEventListener('click', () => {
      this.conn.send({ type: 'mouse_click', button: 'middle' });
      if (navigator.vibrate) navigator.vibrate(15);
    });

    // Zone scroll
    scrollArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      lastScrollY = e.touches[0].clientY;
    }, { passive: false });

    scrollArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const dy = e.touches[0].clientY - lastScrollY;
      if (Math.abs(dy) > 10) {
        this.conn.send({ type: 'mouse_scroll', delta: dy > 0 ? 1 : -1 });
        lastScrollY = e.touches[0].clientY;
      }
    }, { passive: false });
  }

  // ═══════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════

  _setupSettings() {
    // FPS slider
    const fpsRange = document.getElementById('setting-fps');
    const fpsValue = document.getElementById('setting-fps-value');
    if (fpsRange) {
      fpsRange.addEventListener('input', () => {
        fpsValue.textContent = fpsRange.value;
      });
    }

    // Quality slider
    const qualityRange = document.getElementById('setting-quality');
    const qualityValue = document.getElementById('setting-quality-value');
    if (qualityRange) {
      qualityRange.addEventListener('input', () => {
        qualityValue.textContent = qualityRange.value;
      });
    }

    // Sensitivity slider
    const sensRange = document.getElementById('setting-sensitivity');
    const sensValue = document.getElementById('setting-sensitivity-value');
    if (sensRange) {
      sensRange.addEventListener('input', () => {
        this.sensitivity = parseInt(sensRange.value);
        sensValue.textContent = sensRange.value;
      });
    }

    // Disconnect button
    document.getElementById('btn-disconnect').addEventListener('click', () => {
      this.conn.disconnect();
      document.getElementById('main-app').classList.add('hidden');
      document.getElementById('view-connect').classList.add('active');
    });
  }

  // ═══════════════════════════════════════
  // UTILITAIRES
  // ═══════════════════════════════════════

  _setupConnection() {
    // Handler pour les infos PC
    this.conn.on('pc_info', (msg) => {
      document.getElementById('header-pc-name').textContent = msg.pcName || 'PC';
      document.getElementById('setting-pc-name').textContent = msg.pcName || 'PC';
    });

    // Erreurs
    this.conn.on('error', (msg) => {
      this.showToast(msg.message, 'error');
    });

    // Process killed
    this.conn.on('process_killed', (msg) => {
      this.showToast(`Processus ${msg.pid} terminé`, 'success');
    });
  }

  _startClock() {
    const update = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const el = document.getElementById('header-time');
      if (el) el.textContent = time;
    };
    update();
    setInterval(update, 30000);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  window.deckpadApp = new DeckPadApp();
});
