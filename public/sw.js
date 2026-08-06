const CACHE = 'draper-v1';
const OFFLINE_URL = '/';

// Cache key assets on install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['/', '/event-schedule', '/now-playing', '/listen-now', '/gallery', '/manifest.json'])
    )
  );
  self.skipWaiting();
});

// Clean old caches on activate
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for HTML, cache-first for assets
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Skip Keystatic admin, API routes, and third-party embeds
  if (
    url.pathname.startsWith('/keystatic') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('remotefalcon') ||
    url.hostname.includes('pulsemesh') ||
    url.hostname.includes('facebook')
  ) return;

  if (e.request.headers.get('accept')?.includes('text/html')) {
    // Network-first for pages
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r ?? caches.match(OFFLINE_URL)))
    );
  } else {
    // Cache-first for static assets (images, CSS, JS)
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          }
          return res;
        });
      })
    );
  }
});
