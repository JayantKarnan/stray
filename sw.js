// STRAY service worker — caches the whole (small, self-contained) game for instant repeat loads
// and offline play. Bump CACHE_NAME on any deploy that changes cached files so clients pick up
// the new version instead of serving stale assets forever.
const CACHE_NAME = 'stray-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './three.module.js',
  './cannon-es.js',
  './audio-assets.js',
  './dog.glb',
  './jsm/loaders/GLTFLoader.js',
  './jsm/postprocessing/EffectComposer.js',
  './jsm/postprocessing/MaskPass.js',
  './jsm/postprocessing/OutputPass.js',
  './jsm/postprocessing/Pass.js',
  './jsm/postprocessing/RenderPass.js',
  './jsm/postprocessing/ShaderPass.js',
  './jsm/postprocessing/UnrealBloomPass.js',
  './jsm/shaders/CopyShader.js',
  './jsm/shaders/LuminosityHighPassShader.js',
  './jsm/shaders/OutputShader.js',
  './jsm/utils/BufferGeometryUtils.js',
  './jsm/utils/SkeletonUtils.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// cache-first: the game is fully self-contained and versioned by CACHE_NAME, so a cache hit is
// always safe and fast; only network-fetch (and cache) things we haven't seen before.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
