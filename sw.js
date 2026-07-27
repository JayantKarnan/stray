// STRAY service worker — caches the whole (small, self-contained) game for instant repeat loads
// and offline play.
//
// CACHE_NAME is rewritten to a unique value on every deploy by deploy.sh (the __BUILD__ token
// below gets replaced with a timestamp), so a stale cache from a previous deploy is ALWAYS
// evicted by the activate handler below — no more "forgot to bump the version" bugs.
const CACHE_NAME = 'stray-__BUILD__';
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
      .then(() => self.skipWaiting()) // activate this version immediately, don't wait for old tabs to close
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()) // take control of already-open tabs right away
  );
});

// NETWORK-FIRST for the page shell (index.html / navigations): this file changes on every deploy
// during active development, so we must never let a stale cached copy win over a live network
// fetch. Falls back to cache only when offline. This is the fix for a real bug: an earlier
// cache-first version kept serving a pre-multiplayer index.html forever, because CACHE_NAME never
// happened to change across several deploys — a returning visitor's browser never re-fetched it.
async function networkFirst(request) {
  try {
    const fresh = await fetch(request, { cache: 'no-store' }); // never let the browser's own HTTP cache hand back a stale shell either
    if (fresh && fresh.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw e;
  }
}

// CACHE-FIRST for everything else (three.module.js, cannon-es.js, dog.glb, jsm/, icons/): these
// are large and effectively immutable between deploys, so instant-from-cache is safe — and still
// gets invalidated wholesale by the activate handler whenever CACHE_NAME actually changes.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && fresh.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, fresh.clone());
  }
  return fresh;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isShell = event.request.mode === 'navigate' || event.request.url.endsWith('/index.html') || event.request.url.endsWith('/');
  event.respondWith(isShell ? networkFirst(event.request) : cacheFirst(event.request));
});
