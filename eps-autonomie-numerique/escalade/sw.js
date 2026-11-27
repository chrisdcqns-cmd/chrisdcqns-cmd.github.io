// Escalade EPS — service worker : appli à jour quand il y a du réseau, utilisable hors connexion sinon.
const CORE = "escalade-core-v47";
const CORE_FILES = ["./", "index.html"];
const SHARED = ["../eps-lists.js", "../eps-home.js", "../eps-eval.js", "../eps-shell.js", "../eps-lecons.js", "../eps-obs.js", "../eps-groupes.js", "../eps-guides.js", "../eps-remed-ref.js", "../eps-tactique.js", "../eps-ref.js", "../eps-qr.js"]; // fichiers communs (dossier parent), gardés aussi ici pour le hors ligne
const isShared = p => /\/eps-autonomie-numerique\/(eps-[a-z-]+\.js|vendor\/[^/]+)$/.test(p);


self.addEventListener("install", e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(CORE_FILES.concat(SHARED))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("escalade-core") && k !== CORE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !(url.pathname.includes("/escalade/") || isShared(url.pathname))) return; // Google Sheets, autres applis : réseau direct
  // réseau d'abord (mises à jour), copie locale si pas de réseau
  e.respondWith((async () => {
    const cache = await caches.open(CORE);
    try { const res = await fetch(req, { cache: "no-cache" }); if (res.ok) cache.put(req, res.clone()); return res; }
    catch (err) { const hit = await cache.match(req, { ignoreSearch: true }); if (hit) return hit; if (req.mode === "navigate") return (await cache.match("index.html")) || Response.error(); throw err; }
  })());
});
