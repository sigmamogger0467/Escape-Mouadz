// Offline-Speicher fuer die App-Version. Bei jeder Spiel-Aenderung VERSION erhoehen,
// damit die Geraete die neuen Dateien laden.
const VERSION = 'mouadz-v1';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'js/three.min.js',
  'js/data.js',
  'js/core.js',
  'js/gfx.js',
  'js/world.js',
  'js/characters.js',
  'js/objects.js',
  'js/game.js',
  'js/ui.js',
  'js/main.js',
  'fonts/luckiest-guy-latin-400-normal.woff2',
  'fonts/fredoka-latin-400-normal.woff2',
  'fonts/fredoka-latin-500-normal.woff2',
  'fonts/fredoka-latin-600-normal.woff2',
  'fonts/fredoka-latin-700-normal.woff2',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst aus dem Netz holen (damit Updates ankommen), ohne Internet aus dem Speicher.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
