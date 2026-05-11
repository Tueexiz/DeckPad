/**
 * DeckPad - Dashboard Système
 * Met à jour les stats en temps réel et gère les interactions 3D
 */

class SystemDashboard {
  constructor() {
    this._initElements();
    this.apps = [];
    this.currentCategory = 'all';
    this._setupEvents();
    this._setupCategories();
  }

  _initElements() {
    this.elements = {
      cpuValue: document.getElementById('stat-cpu-value'),
      ramValue: document.getElementById('stat-ram-value'),
      gpuValue: document.getElementById('stat-gpu-value'),
      appsGrid: document.getElementById('apps-grid'),
      fillCpu: document.getElementById('fill-cpu'),
      valCpu: document.getElementById('val-cpu'),
      fillGpu: document.getElementById('fill-gpu'),
      valGpu: document.getElementById('val-gpu'),
      fillRam: document.getElementById('fill-ram'),
      valRam: document.getElementById('val-ram'),
      mediaTitle: document.getElementById('media-title'),
      mediaArtist: document.getElementById('media-artist'),
      btnMediaPlay: document.getElementById('btn-media-play'),
    };
  }

  _setupEvents() {
    const conn = window.deckpadConnection;

    conn.on('system_stats', (msg) => this.updateStats(msg));
    conn.on('app_list', (msg) => {
      this.apps = msg.apps || [];
      this.renderApps();
    });
    conn.on('media_info', (msg) => this.updateMedia(msg.media));
    
    // Sync Volume Info
    conn.on('volume_info', (msg) => {
      const masterSlider = document.getElementById('mixer-master');
      if (masterSlider) masterSlider.value = msg.volume;
    });

    // Delegated events for better reliability
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.deck-key, .media-btn-pro, .action-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      if (!action) return;

      // Haptic & Visual Feedback
      if (btn.classList.contains('deck-key')) {
        btn.classList.add('rippling');
        setTimeout(() => btn.classList.remove('rippling'), 400);
      }
      if (navigator.vibrate) navigator.vibrate(20);

      // System Actions
      if (['shutdown', 'restart', 'sleep'].includes(action)) {
        if (confirm(`Confirmer l'action : ${action} ?`)) {
          conn.send({ type: 'system_action', action });
        }
        return;
      }

      conn.send({ type: 'system_action', action });
    });

    // Long press for volume on Stream Deck keys
    document.querySelectorAll('.deck-key[data-action^="volume_"]').forEach(btn => {
      let holdInterval = null;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        holdInterval = setInterval(() => {
          conn.send({ type: 'system_action', action: btn.dataset.action });
        }, 100);
      });
      const stop = () => clearInterval(holdInterval);
      btn.addEventListener('touchend', stop);
      btn.addEventListener('touchcancel', stop);
    });

    // Mixer sliders
    document.querySelectorAll('.mixer-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const device = slider.dataset.app;
        if (device) conn.send({ type: 'set_volume', device, value: e.target.value });
      });
    });
  }

  _setupCategories() {
    document.addEventListener('click', (e) => {
      const pad = e.target.closest('.sound-pad');
      if (pad) {
        const sound = pad.dataset.sound;
        if (sound) window.deckpadConnection.send({ type: 'play_sound', sound });
      }
    });
  }

  updateStats(stats) {
    const setGauge = (fill, val, percent) => {
      if (!fill || !val) return;
      const offset = 283 - (percent / 100) * 283;
      fill.style.strokeDashoffset = offset;
      val.textContent = `${Math.round(percent)}%`;
    };

    if (stats.cpu) {
      if (this.elements.fillCpu) setGauge(this.elements.fillCpu, this.elements.valCpu, stats.cpu.usage);
      if (this.elements.cpuValue) this.elements.cpuValue.textContent = `${Math.round(stats.cpu.usage)}%`;
    }
    if (stats.ram) {
      if (this.elements.fillRam) setGauge(this.elements.fillRam, this.elements.valRam, stats.ram.usagePercent);
      if (this.elements.ramValue) this.elements.ramValue.textContent = `${Math.round(stats.ram.usagePercent)}%`;
    }
    
    const netDown = document.getElementById('val-net-down');
    const netUp = document.getElementById('val-net-up');
    if (stats.network && stats.network[0]) {
      const net = stats.network[0];
      if (netDown) netDown.textContent = `↓ ${(net.rx_sec / 1024).toFixed(1)} KB/s`;
      if (netUp) netUp.textContent = `↑ ${(net.tx_sec / 1024).toFixed(1)} KB/s`;
    }
  }

  renderApps() {
    const grid = this.elements.appsGrid;
    if (!grid) return;
    grid.innerHTML = '';
    
    this.apps.forEach(app => {
      const tile = document.createElement('div');
      tile.className = 'app-tile';
      tile.innerHTML = `
        <span class="app-tile-icon">${app.realIcon ? `<img src="${app.realIcon}">` : '<i data-lucide="package"></i>'}</span>
        <span class="app-tile-name">${app.name}</span>
      `;
      tile.onclick = () => window.deckpadConnection.send({ type: 'launch_app', id: app.id });
      grid.appendChild(tile);
    });
    if (window.lucide) lucide.createIcons();
  }

  updateMedia(media) {
    if (!media) return;
    if (this.elements.mediaTitle) this.elements.mediaTitle.textContent = media.title || 'Inconnu';
    if (this.elements.mediaArtist) this.elements.mediaArtist.textContent = media.artist || 'Artiste';

    const playKey = document.getElementById('action-play');
    if (playKey) {
      const face = playKey.querySelector('.key-face-top');
      if (media.thumbnail) {
        face.style.backgroundImage = `url(${media.thumbnail})`;
        face.style.backgroundSize = 'cover';
        face.style.color = 'white'; // White icon over cover
        face.style.textShadow = '0 0 10px rgba(0,0,0,0.8)';
      } else {
        face.style.backgroundImage = 'none';
        face.style.color = ''; // Back to theme blue
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.systemDashboard = new SystemDashboard();
});
