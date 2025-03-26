// static/service-worker.js
const CACHE_NAME = 'mantra-tracker-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json',
  '/build/bundle.css',
  '/build/bundle.js'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Don't cache API requests
        if (event.request.url.includes('/webhook/')) {
          return fetchResponse;
        }
        
        // Cache other requests
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    }).catch(() => {
      // Fallback for offline
      if (event.request.url.includes('/webhook/')) {
        return new Response(
          JSON.stringify({ error: 'You are offline' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    })
  );
});