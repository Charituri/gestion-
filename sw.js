/* Charituri Gestion : garde l'application en mémoire pour qu'elle s'ouvre même sans réseau.
   Les données (Supabase) ne sont jamais mises en cache ici. */
var V = 'charituri-gestion-v1';
var SHELL = ['./', './index.html', './manifest.webmanifest', './logo.webp', './logo-ticket.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) return;           // Supabase, polices : réseau direct
  e.respondWith(
    fetch(r).then(function (res) {
      var copy = res.clone();
      caches.open(V).then(function (c) { c.put(r, copy); });
      return res;
    }).catch(function () {
      return caches.match(r).then(function (m) { return m || caches.match('./index.html'); });
    })
  );
});
