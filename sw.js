/* Service worker dell'App-hub Bersaglieri SGV.
   Regola di sicurezza: intercetta SOLO i file dell'hub.
   Tutto il resto del sito (home, eventi, galleria, /api/*, area riservata,
   invii email a Web3Forms) NON viene toccato: passa in rete come sempre. */

const CACHE = 'bersaglieri-hub-v2';

// File che compongono le due app (consiglio + soci): precaricati per aprirle anche offline.
const SHELL = [
  '/app.html',
  '/manifest.json',
  '/soci.html',
  '/manifest-soci.json',
  '/assets/logo.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-maskable-512.png',
  '/assets/apple-touch-icon.png',
  '/assets/icon-soci-192.png',
  '/assets/icon-soci-512.png',
  '/assets/icon-soci-maskable-512.png',
  '/assets/apple-touch-icon-soci.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Mai toccare richieste non-GET (iscrizioni, adesioni, admin, email Web3Forms).
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Mai toccare richieste verso altri domini (es. api.web3forms.com, cloudflareaccess.com).
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;

  // Le app (app.html = consiglio, soci.html = bacheca soci): prima la rete,
  // la cache solo come riserva se offline.
  if (req.mode === 'navigate' && (path === '/app.html' || path === '/soci.html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(path, copy));
          return res;
        })
        .catch(() => caches.match(path))
    );
    return;
  }

  // Icone e manifest dell'hub: prima la cache (sono statici).
  if (SHELL.includes(path)) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
    return;
  }

  // Tutto il resto del sito: nessuna intercettazione, comportamento invariato.
});
