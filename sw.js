const V = 'time-jar-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function store(r, res) { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); } return res; }
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    // Network first (so updates arrive), fall back to the saved copy when offline or slow
    const net = new Promise((ok, no) => {
      const t = setTimeout(() => no('slow'), 3000);
      fetch(r).then(x => { clearTimeout(t); ok(x); }, y => { clearTimeout(t); no(y); });
    });
    e.respondWith(net.then(res => store(r, res)).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
  } else if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => store(r, res)).catch(() => m)));
  }
});
