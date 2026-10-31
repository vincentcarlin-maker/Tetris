const CACHE_NAME = 'neon-arcade-cache-v2';
const ASSETS = ['index.html', 'index.js', 'icon.svg', 'manifest.json', 'legal.html', 'assets/avatars/characters.webp', 'assets/avatars/accessories.webp'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('neon-arcade-cache-') && key !== CACHE_NAME).map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Network first: deployments are visible without changing the cache name.
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && ASSETS.some(asset => url.pathname === new URL(asset, self.registration.scope).pathname)) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => (await caches.match(event.request)) || (event.request.mode === 'navigate' ? await caches.match('index.html') : undefined) || Response.error()));
});
