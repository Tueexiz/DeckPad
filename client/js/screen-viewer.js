/**
 * DeckPad - Screen Viewer
 * Affiche le flux MJPEG du PC sur un canvas
 */

class ScreenViewer {
  constructor() {
    this.canvas = document.getElementById('screen-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.overlay = document.getElementById('screen-overlay');
    this.toggleBtn = document.getElementById('btn-stream-toggle');
    this.qualitySelect = document.getElementById('select-quality');
    this.touchInfo = document.getElementById('screen-touch-info');
    this.streaming = false;
    this.img = new Image();
    this.prevUrl = null;
    this.screenSize = { width: 1920, height: 1080 };
    this.touchState = { active: false, lastX: 0, lastY: 0 };

    this._setupEvents();
  }

  _setupEvents() {
    const conn = window.deckpadConnection;

    // Toggle stream
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => {
        if (this.streaming) {
          this.stopStream();
        } else {
          this.startStream();
        }
      });
    }

    // Recevoir les frames
    conn.onBinary((data) => {
      if (!this.streaming) return;

      const blob = new Blob([data], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);

      this.img.onload = () => {
        if (this.canvas) {
          this.canvas.width = this.img.naturalWidth;
          this.canvas.height = this.img.naturalHeight;
          this.ctx.drawImage(this.img, 0, 0);
        }
        URL.revokeObjectURL(url);
      };
      this.img.src = url;
    });

    // Status du stream
    conn.on('stream_status', (msg) => {
      this.streaming = msg.running;
      this._updateUI();
    });

    // Touch events sur le canvas pour contrôler la souris
    if (this.canvas) {
      this.canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
      this.canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
      this.canvas.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
    }
  }

  startStream() {
    const conn = window.deckpadConnection;
    if (!conn.isReady()) return;

    const quality = this.qualitySelect ? this.qualitySelect.value : 'medium';
    const settings = {
      low: { width: 854, height: 480, fps: 15, quality: 8 },
      medium: { width: 1280, height: 720, fps: 20, quality: 5 },
      high: { width: 1920, height: 1080, fps: 25, quality: 3 }
    };

    const s = settings[quality] || settings.medium;
    conn.send({ type: 'start_stream', ...s });
    this.streaming = true;
    this._updateUI();
  }

  stopStream() {
    const conn = window.deckpadConnection;
    conn.send({ type: 'stop_stream' });
    this.streaming = false;
    this._updateUI();
  }

  _updateUI() {
    if (this.streaming) {
      this.toggleBtn = document.getElementById('btn-stream-toggle');
      if (this.toggleBtn) this.toggleBtn.textContent = '⏹️ Arrêter le stream';
      if (this.touchInfo) this.touchInfo.classList.remove('hidden');
    } else {
      if (this.overlay) this.overlay.classList.remove('streaming');
      if (this.toggleBtn) this.toggleBtn.textContent = '▶️ Démarrer le stream';
      if (this.touchInfo) this.touchInfo.classList.add('hidden');
    }
  }

  /**
   * Convertit les coordonnées tactiles en coordonnées écran PC
   */
  _touchToScreen(touch) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const canvasX = (touch.clientX - rect.left) * scaleX;
    const canvasY = (touch.clientY - rect.top) * scaleY;

    // Mapper vers la résolution de l'écran PC
    const pcX = (canvasX / this.canvas.width) * this.screenSize.width;
    const pcY = (canvasY / this.canvas.height) * this.screenSize.height;

    return { x: Math.round(pcX), y: Math.round(pcY) };
  }

  _onTouchStart(e) {
    if (!this.streaming) return;
    e.preventDefault();
    this.touchState.active = true;
    this.touchState.moved = false;
    this.touchState.touches = e.touches.length;
    this.touchState.longPressTriggered = false;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.touchState.lastX = touch.clientX;
      this.touchState.lastY = touch.clientY;
      this.touchState.startTime = Date.now();

      const pos = this._touchToScreen(touch);

      // Long press -> Right click
      this.touchState.longPressTimer = setTimeout(() => {
        if (!this.touchState.moved) {
          window.deckpadConnection.send({ type: 'mouse_move', x: pos.x, y: pos.y });
          window.deckpadConnection.send({ type: 'mouse_click', button: 'right' });
          if (navigator.vibrate) navigator.vibrate(50);
          this.touchState.longPressTriggered = true;
        }
      }, 500);
    } else if (e.touches.length === 2) {
      clearTimeout(this.touchState.longPressTimer);
      this.touchState.lastY = e.touches[0].clientY;
    }
  }

  _onTouchMove(e) {
    if (!this.streaming || !this.touchState.active) return;
    e.preventDefault();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - this.touchState.lastX;
      const dy = touch.clientY - this.touchState.lastY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.touchState.moved = true;
        clearTimeout(this.touchState.longPressTimer);
      }

      if (this.touchState.moved && !this.touchState.longPressTriggered) {
        // En mode tablette absolu, on ne suit pas le doigt, on clique juste là où on tap,
        // mais si l'utilisateur glisse, on peut quand même bouger la souris.
        const pos = this._touchToScreen(touch);
        window.deckpadConnection.send({ type: 'mouse_move', x: pos.x, y: pos.y });
      }
    } else if (e.touches.length === 2) {
      this.touchState.moved = true;
      clearTimeout(this.touchState.longPressTimer);

      const touch = e.touches[0];
      const dy = touch.clientY - this.touchState.lastY;

      if (Math.abs(dy) > 5) {
        // Envoie l'action de scroll. Dans handleInputMessage, delta positif = scroll up
        window.deckpadConnection.send({ type: 'mouse_scroll', delta: dy > 0 ? 1 : -1 });
        this.touchState.lastY = touch.clientY;
      }
    }
  }

  _onTouchEnd(e) {
    if (!this.streaming) return;
    e.preventDefault();
    clearTimeout(this.touchState.longPressTimer);

    if (this.touchState.touches === 1 && !this.touchState.longPressTriggered && !this.touchState.moved) {
      const elapsed = Date.now() - this.touchState.startTime;
      if (elapsed < 300) {
        const touch = e.changedTouches[0];
        const pos = this._touchToScreen(touch);
        window.deckpadConnection.send({ type: 'mouse_move', x: pos.x, y: pos.y });
        window.deckpadConnection.send({ type: 'mouse_click', button: 'left' });
        if (navigator.vibrate) navigator.vibrate(15);
      }
    }

    this.touchState.active = false;
  }

  setScreenSize(size) {
    this.screenSize = size;
  }
}

window.screenViewer = null;
document.addEventListener('DOMContentLoaded', () => {
  window.screenViewer = new ScreenViewer();
});
