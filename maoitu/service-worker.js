const CACHE_NAME = 'maoitu-cache-v1';
const ASSETS = [
  '/maoitu/',
  '/maoitu/index.html',
  '/maoitu/bgm.mp3',
  '/maoitu/manifest.webmanifest',
  '/maoitu/icons/icon-192.png',
  '/maoitu/icons/icon-512.png'
];

// Precache core assets so the game boots offline.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Remove old caches created by previous versions.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('maoitu-cache') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/maoitu/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cacheResponse => {
      if (cacheResponse) {
        return cacheResponse;
      }

      return fetch(request)
        .then(networkResponse => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('/maoitu/index.html');
          }
          return Response.error();
        });
    })
  );
});
