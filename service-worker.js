const CACHE_NAME = 'asda-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// Install SW and cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event to serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// Activate event to update cache
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (!cacheWhitelist.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});
