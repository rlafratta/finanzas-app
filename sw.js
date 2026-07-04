const CACHE = 'finanzas-v2026070401';
const CORE = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Al instalar: limpiar TODOS los caches anteriores inmediatamente
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() {
      return caches.open(CACHE).then(function(c) { return c.addAll(CORE); });
    })
  );
  self.skipWaiting();
});

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
  // Forzar recarga de todos los clientes
  self.clients.matchAll({type:'window'}).then(function(clients) {
    clients.forEach(function(client) { client.navigate(client.url); });
  });
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  if (!url.startsWith('http')) return;

  if (url.indexOf('firebase') >= 0 ||
      url.indexOf('googleapis') >= 0 ||
      url.indexOf('jsdelivr') >= 0 ||
      url.indexOf('firestore') >= 0) {
    e.respondWith(fetch(e.request).catch(function() {
      return new Response('', {status: 503});
    }));
    return;
  }

  // Network-first para index.html SIEMPRE
  if (url.indexOf('index.html') >= 0 || url.endsWith('/') || url.endsWith('/finanzas-app/') || url.indexOf('finanzas-app/?') >= 0) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).then(function(resp) {
        if (resp.ok) {
          var clone = resp.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return resp;
      }).catch(function() {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Cache-first para el resto
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(resp) {
        if (resp.ok) {
          var clone = resp.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return resp;
      });
    }).catch(function() {
      return caches.match('./index.html');
    })
  );
});
