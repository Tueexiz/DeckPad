/**
 * DeckPad — Spectrum Analyzer
 *
 * Source de vérité prioritaire : peak meter Windows Core Audio
 *   (broadcast WS `audio_meter` { peak, channels[] })
 *
 * Fallback : animation pseudo-spectrale dérivée du slider master
 *   (si serveur ne diffuse pas / connexion perdue / mode dégradé)
 *
 *  - Animation 60 FPS via requestAnimationFrame, pause auto si onglet caché
 *  - Désactivation totale si reduced-motion ou batterie faible (Battery API)
 */

class SpectrumAnalyzer {
  constructor(wrapperId = 'spectrum-master', sliderId = 'mixer-master') {
    this.wrapper = document.getElementById(wrapperId);
    this.slider  = document.getElementById(sliderId);
    if (!this.wrapper || !this.slider) return;

    this.bars = Array.from(this.wrapper.querySelectorAll('.spectrum-bar'));
    if (!this.bars.length) return;

    this.barCount = this.bars.length;
    // Amplitudes courantes (0..1) et cibles
    this.values  = new Float32Array(this.barCount);
    this.targets = new Float32Array(this.barCount);

    this.energy = 0;          // Boost transitoire (decay)
    this.idleTimer = null;
    this.running = false;
    this.rafId = null;

    // Source serveur (peak meter Windows)
    this.serverPeak = 0;
    this.serverChannels = [];
    this.lastServerSampleAt = 0;
    // Historique pour donner le profil "spectrum" à partir de samples scalaires
    this.history = new Float32Array(64);
    this.historyIdx = 0;

    // Respect des préférences utilisateur
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._bindEvents();
    this._bindServerSource();
    if (!this.reducedMotion) this.start();
  }

  _bindServerSource() {
    const conn = window.deckpadConnection;
    if (!conn) return;
    conn.on('audio_meter', (msg) => {
      this.serverPeak = typeof msg.peak === 'number' ? msg.peak : 0;
      this.serverChannels = Array.isArray(msg.channels) ? msg.channels : [];
      this.lastServerSampleAt = performance.now();
      // Push dans l'historique pour générer le shape "spectrum"
      this.history[this.historyIdx] = this.serverPeak;
      this.historyIdx = (this.historyIdx + 1) % this.history.length;
      // Activation visuelle si signal présent
      if (this.serverPeak > 0.02) {
        this.wrapper.classList.add('active');
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => this.wrapper.classList.remove('active'), 400);
      }
    });
  }

  _bindEvents() {
    // Slider input → boost énergie + activation visuelle
    this.slider.addEventListener('input', () => this._pulse(0.85));

    // Sound pads → boost
    document.addEventListener('click', (e) => {
      if (e.target.closest('.sound-pad')) this._pulse(1.0);
    });

    // Sortie d'onglet : pause complète
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.stop();
      else if (!this.reducedMotion) this.start();
    });

    // Battery API — désactive si batterie faible et non chargée
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        const check = () => {
          if (!battery.charging && battery.level < 0.2) this.stop();
        };
        check();
        battery.addEventListener('levelchange', check);
        battery.addEventListener('chargingchange', check);
      }).catch(() => {});
    }
  }

  _pulse(intensity) {
    this.energy = Math.min(1, this.energy + intensity);
    this.wrapper.classList.add('active');
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.wrapper.classList.remove('active');
    }, 1400);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._lastFrame = performance.now();
    const tick = (t) => {
      if (!this.running) return;
      const dt = Math.min(64, t - this._lastFrame); // clamp 64ms
      this._lastFrame = t;
      this._step(dt);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    // Repli visuel
    for (let i = 0; i < this.barCount; i++) {
      this.values[i] = 0;
      this.bars[i].style.height = '8%';
    }
  }

  _step(dt) {
    const masterPct = (parseFloat(this.slider.value) || 0) / 100;
    // Décroissance énergie locale
    this.energy = Math.max(0, this.energy - dt * 0.0012);

    const now = performance.now();
    const serverFresh = (now - this.lastServerSampleAt) < 250;

    if (serverFresh) {
      // ─── MODE 1 : Peak meter serveur (réel) ───
      // On synthétise les "bins" à partir de :
      //  - peak global
      //  - channels (L/R) → effet stéréo subtil
      //  - historique récent → profil temporel évoluant comme un vrai spectrum
      const peak = this.serverPeak;
      const left  = this.serverChannels[0] ?? peak;
      const right = this.serverChannels[1] ?? peak;

      for (let i = 0; i < this.barCount; i++) {
        const center = (i / (this.barCount - 1));         // 0..1
        const stereoBias = center < 0.5
          ? left  * (1 - center * 1.2)
          : right * ((center - 0.5) * 2);
        // Lecture de l'historique avec offset → déphasage = profil "fréquentiel"
        const histIdx = (this.historyIdx - 1 - i * 2 + this.history.length) % this.history.length;
        const histVal = this.history[histIdx];
        const blend = peak * 0.55 + histVal * 0.30 + stereoBias * 0.45;
        // Compression dynamique douce (sqrt) pour mieux montrer les sons faibles
        const v = Math.sqrt(Math.max(0, Math.min(1, blend)));
        // Modulation par le slider master (l'utilisateur voit l'effet de son réglage)
        this.targets[i] = v * (0.4 + masterPct * 0.6);
      }
    } else {
      // ─── MODE 2 : Fallback animé ───
      const t = now * 0.001;
      for (let i = 0; i < this.barCount; i++) {
        const center = (i / (this.barCount - 1)) - 0.5;
        const profile = 0.45 + Math.cos(center * Math.PI * 1.6) * 0.3;
        const wave =
          Math.sin(t * 2.1 + i * 0.7) * 0.5 +
          Math.sin(t * 4.3 + i * 1.3) * 0.3 +
          Math.sin(t * 7.7 + i * 0.4) * 0.2;
        const noise = (Math.random() - 0.5) * 0.15;
        const idle = masterPct * 0.18 * profile;
        const live = masterPct * (0.55 + this.energy * 0.45) * profile * (0.5 + wave * 0.5);
        this.targets[i] = Math.max(0, Math.min(1, idle + live + noise * this.energy));
      }
    }

    // Lerp vers les cibles (réactivité douce, plus rapide en mode serveur)
    const lerp = Math.min(1, dt / (serverFresh ? 50 : 90));
    for (let i = 0; i < this.barCount; i++) {
      const v = this.values[i] + (this.targets[i] - this.values[i]) * lerp;
      this.values[i] = v;
      const h = Math.max(8, Math.round(v * 100));
      this.bars[i].style.height = h + '%';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.deckpadSpectrum = new SpectrumAnalyzer();
});
