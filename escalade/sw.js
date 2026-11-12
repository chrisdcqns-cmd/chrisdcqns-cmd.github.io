// Escalade EPS — service worker : appli à jour quand il y a du réseau, utilisable hors connexion sinon.
const CORE = "escalade-core-v1";
const CORE_FILES = ["./", "index.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(CORE_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("escalade-core") && k !== CORE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.includes("/escalade/")) return; // Google Sheets, autres applis : réseau direct
  // réseau d'abord (mises à jour), copie locale si pas de réseau
  e.respondWith((async () => {
    const cache = await caches.open(CORE);
    try { const res = await fetch(req, { cache: "no-cache" }); if (res.ok) cache.put(req, res.clone()); return res; }
    catch (err) { return (await cache.match(req, { ignoreSearch: true })) || (await cache.match("index.html")); }
  })());
});
