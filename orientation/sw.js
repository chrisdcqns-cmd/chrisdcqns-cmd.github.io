// OrienRun EPS — service worker : appli à jour quand il y a du réseau, utilisable hors connexion sinon.
const CORE = "orienrun-core-v1";
const LIBS = "orienrun-libs-v1";
const CORE_FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
const LIB_FILES = ["https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"]; // lecteur QR pour iPhone (hors connexion)
const LIB_HOSTS = ["cdn.jsdelivr.net", "unpkg.com", "cdn.sheetjs.com", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CORE); await c.addAll(CORE_FILES);
    const l = await caches.open(LIBS); await Promise.all(LIB_FILES.map(u => l.add(new Request(u, { mode: "no-cors" })).catch(() => {})));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => (k.startsWith("orienrun-core") && k !== CORE) || (k.startsWith("orienrun-libs") && k !== LIBS)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  // bibliothèques externes (lecteur QR, Leaflet, Excel, polices) : copie locale d'abord
  if (LIB_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => { const c = await caches.open(LIBS); const hit = await c.match(req, { ignoreVary: true }); if (hit) return hit; const res = await fetch(req); if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; })());
    return;
  }
  if (url.origin !== location.origin) return; // tuiles satellite, Google, etc. : réseau direct
  // page et fichiers de l'appli : réseau d'abord (mises à jour), copie locale si pas de réseau
  e.respondWith((async () => {
    const cache = await caches.open(CORE);
    try { const res = await fetch(req, { cache: "no-cache" }); if (res.ok) cache.put(req, res.clone()); return res; }
    catch (err) { return (await cache.match(req, { ignoreSearch: true })) || (await cache.match("index.html")); }
  })());
});
