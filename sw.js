// Service worker: guarda la pantalla de la app para abrirla rápido.
// Las llamadas a /api NUNCA se guardan: los datos siempre vienen del servidor.
const V = 'yeli-v1';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.add('/'))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(r).then((x) => { const c = x.clone(); caches.open(V).then((ch) => ch.put(r, c)); return x; }).catch(() => caches.match(r).then((m) => m || caches.match('/'))));
});
