/**
 * DeckPad — Premium Layer
 *
 * Regroupe :
 *  • Error Boundary global (catch JS → fallback overlay)
 *  • Splash screen 3D animé (1.2s)
 *  • View Transitions API entre vues
 *  • Skeleton loaders (glass shimmer)
 *  • Sound design UI (clicks subtils, toggle dans réglages)
 *  • Mode sombre optionnel
 *  • Cursor magnetism (desktop uniquement)
 *  • Banner UI : nircmd absent / FFmpeg absent / update available
 *  • Audio profils UI
 *  • Mute visual state animé
 *  • Update notification
 */

(() => {
  'use strict';

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */
  const PREFS_KEY = 'deckpad.prefs';
  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function savePrefs(prefs) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }
    catch (_) {}
  }
  const prefs = loadPrefs();

  /* ═══════════════════════════════════════════════════════
     1. ERROR BOUNDARY GLOBAL
     ═══════════════════════════════════════════════════════ */
  function setupErrorBoundary() {
    let overlay = null;

    const showFallback = (err) => {
      if (overlay) return;
      overlay = document.createElement('div');
      overlay.className = 'error-boundary';
      overlay.innerHTML = `
        <div class="error-boundary-content">
          <div class="error-boundary-icon"><i data-lucide="alert-triangle"></i></div>
          <h2>Une erreur est survenue</h2>
          <p>L'interface a rencontré un problème inattendu. Tu peux recharger l'app pour continuer.</p>
          <details><summary>Détails techniques</summary><pre>${escapeHtml(String(err && (err.stack || err.message || err)))}</pre></details>
          <button class="btn-primary" id="error-reload">
            <i data-lucide="rotate-cw"></i> Recharger l'app
          </button>
        </div>
      `;
      document.body.appendChild(overlay);
      if (window.lucide) window.lucide.createIcons();
      document.getElementById('error-reload')?.addEventListener('click', () => location.reload());
    };

    window.addEventListener('error', (e) => {
      console.error('[ErrorBoundary]', e.error || e.message);
      showFallback(e.error || e.message);
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('[ErrorBoundary]', e.reason);
      showFallback(e.reason);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  /* ═══════════════════════════════════════════════════════
     2. SPLASH SCREEN 3D
     ═══════════════════════════════════════════════════════ */
  function setupSplashScreen() {
    if (sessionStorage.getItem('deckpad.splashShown')) return;
    sessionStorage.setItem('deckpad.splashShown', '1');

    const splash = document.createElement('div');
    splash.id = 'deckpad-splash';
    splash.innerHTML = `
      <div class="splash-stage">
        <div class="splash-logo">
          <span class="splash-cube"></span>
          <span class="splash-cube"></span>
          <span class="splash-cube"></span>
          <span class="splash-cube"></span>
          <span class="splash-cube"></span>
          <span class="splash-cube"></span>
          <span class="splash-cube"></span>
          <span class="splash-cube"></span>
          <span class="splash-cube"></span>
        </div>
        <div class="splash-title">DECKPAD<span>PRO</span></div>
        <div class="splash-tagline">Liquid Glass · Electric Blue</div>
      </div>
    `;
    document.body.appendChild(splash);

    requestAnimationFrame(() => splash.classList.add('animate'));
    setTimeout(() => splash.classList.add('fade'), 1200);
    setTimeout(() => splash.remove(), 1700);
  }

  /* ═══════════════════════════════════════════════════════
     3. VIEW TRANSITIONS API
     ═══════════════════════════════════════════════════════ */
  function setupViewTransitions() {
    if (!document.startViewTransition) return;

    // Hook les boutons nav
    document.addEventListener('click', (e) => {
      const navBtn = e.target.closest('.nav-btn[data-view]');
      if (!navBtn) return;

      const viewId = navBtn.dataset.view;
      const target = document.getElementById(`view-${viewId}`);
      if (!target || target.classList.contains('active')) return;

      e.stopImmediatePropagation();
      e.preventDefault();

      document.startViewTransition(() => {
        document.querySelectorAll('#main-app .view').forEach(v => v.classList.remove('active'));
        target.classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        navBtn.classList.add('active');
        const titleEl = document.getElementById('header-title');
        if (titleEl) {
          const titles = {
            dashboard:'Accueil', soundboard:'Sons', monitor:'Stats', settings:'Config',
            screen:'Écran', 'mouse-keyboard':'Contrôle PC',
          };
          titleEl.textContent = titles[viewId] || '';
        }
        if (window.deckpadApp) window.deckpadApp.currentView = viewId;
      });
    }, true); // capture phase pour court-circuiter le handler app.js
  }

  /* ═══════════════════════════════════════════════════════
     4. SOUND DESIGN UI
     ═══════════════════════════════════════════════════════ */
  let audioCtx = null;
  function getAudioCtx() {
    if (audioCtx) return audioCtx;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    } catch (_) { return null; }
  }

  function playClick(freq = 880, duration = 0.04) {
    if (!prefs.soundUI) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function setupSoundDesign() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, .deck-key, .app-tile, .sound-pad, .nav-btn, .cat-pill');
      if (!btn) return;
      // Différencie le ton selon le type
      if (btn.classList.contains('deck-key'))      playClick(1100, 0.05);
      else if (btn.classList.contains('sound-pad')) playClick(660, 0.06);
      else if (btn.classList.contains('nav-btn'))   playClick(820, 0.04);
      else                                          playClick(880, 0.035);
    });
  }

  /* ═══════════════════════════════════════════════════════
     5. DARK MODE OPTIONNEL
     ═══════════════════════════════════════════════════════ */
  function applyDarkMode(enabled) {
    document.documentElement.classList.toggle('dark', !!enabled);
    prefs.darkMode = !!enabled;
    savePrefs(prefs);
  }

  /* ═══════════════════════════════════════════════════════
     6. CURSOR MAGNETISM (desktop only)
     ═══════════════════════════════════════════════════════ */
  function setupCursorMagnetism() {
    // Désactivé si tactile principal
    if (matchMedia('(pointer: coarse)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const SELECTOR = '.btn-primary, .btn-secondary, .deck-key, .action-btn, .sound-pad, .nav-btn, .btn-connect';
    const RADIUS = 80;
    const STRENGTH = 0.18;

    let raf = null;
    let mouseX = 0, mouseY = 0;
    let elements = [];

    const refresh = () => { elements = Array.from(document.querySelectorAll(SELECTOR)); };
    refresh();
    new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true });

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        for (const el of elements) {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = mouseX - cx;
          const dy = mouseY - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < RADIUS) {
            const f = (1 - dist / RADIUS) * STRENGTH;
            el.style.setProperty('--magnet-x', `${dx * f}px`);
            el.style.setProperty('--magnet-y', `${dy * f}px`);
            el.classList.add('magnet');
          } else if (el.classList.contains('magnet')) {
            el.style.removeProperty('--magnet-x');
            el.style.removeProperty('--magnet-y');
            el.classList.remove('magnet');
          }
        }
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     7. BANNERS (capabilities + updates)
     ═══════════════════════════════════════════════════════ */
  function showBanner({ id, kind = 'info', icon = 'info', message, action }) {
    if (document.getElementById(id)) return;
    let host = document.getElementById('banner-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'banner-host';
      document.body.appendChild(host);
    }
    const banner = document.createElement('div');
    banner.id = id;
    banner.className = `banner banner-${kind}`;
    banner.innerHTML = `
      <i data-lucide="${icon}"></i>
      <span class="banner-message">${message}</span>
      ${action ? `<button class="banner-action" data-href="${action.href || ''}">${action.label}</button>` : ''}
      <button class="banner-close" aria-label="Fermer"><i data-lucide="x"></i></button>
    `;
    host.appendChild(banner);
    if (window.lucide) window.lucide.createIcons();

    banner.querySelector('.banner-close')?.addEventListener('click', () => banner.remove());
    banner.querySelector('.banner-action')?.addEventListener('click', (e) => {
      const href = e.currentTarget.dataset.href;
      if (href) window.open(href, '_blank');
      banner.remove();
    });
  }

  /* ═══════════════════════════════════════════════════════
     8. SKELETON LOADERS
     ═══════════════════════════════════════════════════════ */
  function setupSkeletons() {
    // Si l'app-list met du temps à arriver, on affiche un skeleton dans la grille
    const grid = document.getElementById('apps-grid');
    if (!grid) return;
    if (!grid.children.length) {
      for (let i = 0; i < 8; i++) {
        const sk = document.createElement('div');
        sk.className = 'app-tile skeleton';
        sk.innerHTML = '<div class="skel-icon"></div><div class="skel-line"></div>';
        grid.appendChild(sk);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════
     9. AUDIO PROFILS + MUTE ANIMÉ
     ═══════════════════════════════════════════════════════ */
  function setupAudioProfiles() {
    // Conteneur sous le mixer
    const mixerSection = document.querySelector('.mixer-section');
    if (!mixerSection || document.getElementById('audio-profiles')) return;

    const wrap = document.createElement('div');
    wrap.id = 'audio-profiles';
    wrap.className = 'audio-profiles';
    wrap.innerHTML = `
      <div class="audio-profiles-label">Profils</div>
      <div class="audio-profiles-row">
        <button class="profile-pill" data-profile="gaming"><i data-lucide="gamepad-2"></i> Gaming</button>
        <button class="profile-pill" data-profile="stream"><i data-lucide="radio"></i> Stream</button>
        <button class="profile-pill" data-profile="musique"><i data-lucide="music"></i> Musique</button>
      </div>
    `;
    mixerSection.appendChild(wrap);
    if (window.lucide) window.lucide.createIcons();

    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.profile-pill');
      if (!btn) return;
      wrap.querySelectorAll('.profile-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const conn = window.deckpadConnection;
      if (conn?.send) conn.send({ type: 'apply_audio_profile', name: btn.dataset.profile });
      if (navigator.vibrate) navigator.vibrate(15);
    });
  }

  function setupMuteVisual() {
    const conn = window.deckpadConnection;
    if (!conn) return;

    // Bouton mute synchronisé avec icône volume-x du Stream Deck
    conn.on('volume_info', (msg) => {
      const muteBtns = document.querySelectorAll('[data-action="volume_mute"]');
      muteBtns.forEach(btn => {
        btn.classList.toggle('muted', !!msg.muted);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     10. SETTINGS PANEL — toggles dynamiques
     ═══════════════════════════════════════════════════════ */
  function setupSettingsToggles() {
    const container = document.querySelector('.settings-container');
    if (!container || document.getElementById('premium-toggles')) return;

    const group = document.createElement('div');
    group.id = 'premium-toggles';
    group.className = 'settings-group';
    group.innerHTML = `
      <h3>Expérience</h3>
      <label class="settings-toggle">
        <span>Sound Design UI</span>
        <input type="checkbox" id="toggle-sound-ui" ${prefs.soundUI ? 'checked' : ''}>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      </label>
      <label class="settings-toggle">
        <span>Mode Sombre</span>
        <input type="checkbox" id="toggle-dark-mode" ${prefs.darkMode ? 'checked' : ''}>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      </label>
      <label class="settings-toggle">
        <span>Animations Premium</span>
        <input type="checkbox" id="toggle-animations" ${prefs.animations !== false ? 'checked' : ''}>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      </label>
    `;
    // Insérer avant le bouton de déconnexion
    const disconnectBtn = container.querySelector('#btn-disconnect');
    if (disconnectBtn) container.insertBefore(group, disconnectBtn);
    else container.appendChild(group);

    document.getElementById('toggle-sound-ui')?.addEventListener('change', (e) => {
      prefs.soundUI = e.target.checked;
      savePrefs(prefs);
      if (e.target.checked) playClick(900, 0.05);
    });
    document.getElementById('toggle-dark-mode')?.addEventListener('change', (e) => {
      applyDarkMode(e.target.checked);
    });
    document.getElementById('toggle-animations')?.addEventListener('change', (e) => {
      prefs.animations = e.target.checked;
      savePrefs(prefs);
      document.documentElement.classList.toggle('no-anim', !e.target.checked);
    });
  }

  /* ═══════════════════════════════════════════════════════
     11. WIRING SERVEUR
     ═══════════════════════════════════════════════════════ */
  function wireServerSignals() {
    const conn = window.deckpadConnection;
    if (!conn) return;

    conn.on('capability', (msg) => {
      if (msg.module === 'screen' && msg.available === false) {
        showBanner({
          id: 'banner-no-ffmpeg',
          kind: 'warn',
          icon: 'video-off',
          message: 'FFmpeg non détecté — la capture d\'écran est désactivée.',
        });
      }
    });

    conn.on('watchdog', (msg) => {
      if (msg.module === 'screen' && msg.event === 'restart') {
        showBanner({
          id: 'banner-watchdog',
          kind: 'info',
          icon: 'rotate-cw',
          message: `Capture relancée automatiquement (tentative ${msg.attempt})`,
        });
        setTimeout(() => document.getElementById('banner-watchdog')?.remove(), 4000);
      }
      if (msg.module === 'screen' && msg.event === 'failed') {
        showBanner({
          id: 'banner-watchdog-failed',
          kind: 'error',
          icon: 'alert-circle',
          message: 'Capture désactivée après plusieurs erreurs. Redémarre le serveur.',
        });
      }
    });

    conn.on('update_available', (msg) => {
      showBanner({
        id: 'banner-update',
        kind: 'info',
        icon: 'sparkles',
        message: `DeckPad ${msg.version} est disponible !`,
        action: { label: 'Voir', href: msg.url },
      });
    });

    // Capabilities reçues à l'auth_result : on n'a pas accès direct,
    // mais on peut écouter une éventuelle absence audio via un message dédié
    // (placeholder, no-op si non émis).

    // Profils audio reçus → mettre à jour la pill active si possible
    conn.on('audio_profiles', (msg) => {
      // Reservé pour usage futur — la liste est déjà figée dans l'UI
      if (window.deckpadApp?.showToast) {
        // silencieux
      }
    });
  }

  /* ═══════════════════════════════════════════════════════
     12. SERVICE WORKER (PWA)
     ═══════════════════════════════════════════════════════ */
  function setupServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    // Évite l'enregistrement en HTTP (sauf localhost/USB) — SW requiert HTTPS ou localhost
    const isSecure = location.protocol === 'https:' ||
                     location.hostname === 'localhost' ||
                     location.hostname === '127.0.0.1';
    if (!isSecure) {
      // En LAN HTTP, le SW ne marche pas — on skip silencieusement
      return;
    }
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Quand une nouvelle version est prête, on signale à l'utilisateur
      if (reg.waiting) promptUpdate(reg);
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            promptUpdate(reg);
          }
        });
      });
    }).catch(() => { /* silencieux */ });

    // Quand le contrôleur change, on recharge pour appliquer la nouvelle version
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
  }

  function promptUpdate(reg) {
    showBanner({
      id: 'banner-sw-update',
      kind: 'info',
      icon: 'sparkles',
      message: 'Nouvelle version disponible',
      action: { label: 'Actualiser' },
    });
    document.getElementById('banner-sw-update')?.querySelector('.banner-action')
      ?.addEventListener('click', () => {
        reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */
  function init() {
    // Apply persisted prefs
    if (prefs.darkMode) applyDarkMode(true);
    if (prefs.animations === false) document.documentElement.classList.add('no-anim');

    setupErrorBoundary();
    setupSplashScreen();
    setupSkeletons();

    // Différer le reste après DOM stable
    requestAnimationFrame(() => {
      setupViewTransitions();
      setupSoundDesign();
      setupCursorMagnetism();
      setupAudioProfiles();
      setupSettingsToggles();
      setupMuteVisual();
      wireServerSignals();
      setupServiceWorker();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
