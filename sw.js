// EPS – Mes applications : service worker de la racine.
// Il ne gère que la page d'accueil, le bouton Accueil partagé et Relais Vitesse (qui n'a pas de service worker propre).
// Acrosport, Escalade et OrienRun gardent leur propre service worker : leurs requêtes ne sont pas touchées ici.
const CORE = "eps-core-v3";
const CORE_FILES = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/eps-home.js", "/relais/", "/relais/index.html"];
// Bibliothèques externes utilisées par Relais Vitesse (lecture Excel, polices)
const EXT = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(CORE_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("eps-core") && k !== CORE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function mine(url) {
  if (url.origin === location.origin) {
    const p = url.pathname;
    return p === "/" || p === "/index.html" || p === "/manifest.webmanifest" || p === "/eps-home.js" || /^\/icon-\d+\.png$/.test(p) || p.startsWith("/relais/");
  }
  return EXT.test(url.href);
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!mine(url)) return; // les autres applications gèrent leurs propres fichiers

  // Réseau d'abord (toujours à jour), le cache si pas de connexion
  e.respondWith((async () => {
    const cache = await caches.open(CORE);
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true }) ||
        (req.mode === "navigate" ? await cache.match(url.pathname.startsWith("/relais/") ? "/relais/" : "/") : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
