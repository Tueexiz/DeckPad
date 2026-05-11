/**
 * DeckPad — Service Worker
 *
 * Stratégie :
 *  - Précache du shell statique (HTML/CSS/JS/icons) à l'install
 *  - Network-first pour HTML (fraîcheur de l'app)
 *  - Cache-first stale-while-revalidate pour JS/CSS/icons
 *  - Bypass complet pour /api/*, /health, et toute requête WebSocket
 *  - Auto-skipWaiting + clientsClaim pour push de version sans friction
 */

const VERSION = 'deckpad-v1.0.0';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/css/design-system.css',
  '/css/main.css',
  '/css/stream-deck.css',
  '/css/global-3d.css',
  '/css/components.css',
  '/css/premium.css',
  '/js/connection.js',
  '/js/app.js',
  '/js/system-dashboard.js',
  '/js/spectrum.js',
  '/js/premium.js',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // addAll est all-or-nothing → on map vers add() individuel pour résilience
      Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => !k.startsWith(VERSION))
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET et same-origin uniquement
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Bypass APIs et flux temps réel
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname === '/health') return;
  if (url.pathname.startsWith('/ws')) return;

  // HTML (navigations) : network-first
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets statiques : stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback ultime : index.html shellé
    const shell = await caches.match('/index.html');
    if (shell) return shell;
    return new Response('Hors ligne', { status: 503, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

// Permet à la page de demander un skipWaiting (mise à jour immédiate)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
