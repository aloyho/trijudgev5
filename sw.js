// TriJudge Service Worker — v1.0.0
const CACHE = 'trijudge-v1';

// Files to cache on install
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  // Google Fonts are cached on first fetch via network-first strategy
];

// ══ INSTALL: cache core files ══
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ══ ACTIVATE: clean old caches ══
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ══ FETCH: network-first for fonts/CDN, cache-first for app shell ══
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for Google Fonts and external CDN
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for app shell (same origin)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(request, clone));
          }
          return res;
        });
      })
    );
  }
});
