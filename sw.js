const CACHE = 'finanzas-v1777802959';
const CORE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache core files
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(CORE);
    })
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for core files, network-first for Firebase/CDN
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  // Always go to network for Firebase and CDN requests
  if (url.indexOf('firebase') >= 0 || 
      url.indexOf('googleapis') >= 0 ||
      url.indexOf('jsdelivr') >= 0) {
    e.respondWith(fetch(e.request).catch(function() {
      return new Response('', {status: 503});
    }));
    return;
  }
  // Cache-first for app files
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return resp;
      });
    }).catch(function() {
      return caches.match('/index.html');
    })
  );
});
