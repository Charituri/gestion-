/* Charituri Gestion : garde l'application en mémoire pour qu'elle s'ouvre même sans réseau.
   Les données (Supabase) ne sont jamais mises en cache ici. */
var V = 'charituri-gestion-v2';
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

/* Notifications : s'affichent même quand l'application est fermée (téléphone en veille) */
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = {texte: e.data ? e.data.text() : ''}; }
  e.waitUntil(self.registration.showNotification(d.titre || 'Charituri', {
    body: d.texte || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: d.tag || 'charituri',
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 150, 300, 150, 600],
    data: {url: d.url || './'}
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(function (l) {
    for (var i = 0; i < l.length; i++) { if ('focus' in l[i]) return l[i].focus(); }
    return self.clients.openWindow(url);
  }));
});
