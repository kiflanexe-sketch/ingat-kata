/* Service worker IngatKata. File ini diproses oleh plugin di vite.config.ts:
   __VERSION__ dan __PRECACHE__ diganti saat build. */
const VERSION = __VERSION__;
const PRECACHE = __PRECACHE__;
const CACHE = `ingatkata-${VERSION}`;
const NAV_TIMEOUT = 3000;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('ingatkata-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Halaman: jaringan dulu supaya versi baru cepat terpakai, cadangan dari cache saat offline.
// Aset ber-hash: cache dulu, karena isinya tidak pernah berubah.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await Promise.race([
          fetch(request),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NAV_TIMEOUT)),
        ]);
        if (response.ok) cache.put('index.html', response.clone());
        return response;
      } catch {
        return (await cache.match('index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const hit = await caches.match(request, { ignoreSearch: true });
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
    return response;
  })());
});
