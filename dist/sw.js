const CACHE_NAME = 'sescincco-v1';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'logo-unidade.png',
  'icon-192.png',
  'icon-512.png',
  'splash.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
