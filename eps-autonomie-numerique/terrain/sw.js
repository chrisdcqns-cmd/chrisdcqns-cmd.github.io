// Terrain (OrienRun) — service worker : appli utilisable sans réseau ; fonds de carte IGN gardés en cache quand on les a vus.
const CORE = "terrain-core-v7", LIBS = "terrain-libs-v1", TILES = "terrain-tiles-v1", MAX_TILES = 2500;
const CORE_FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
const LIB_FILES = ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"];
self.addEventListener("install", e => e.waitUntil((async () => {
  const c = await caches.open(CORE); await c.addAll(CORE_FILES);
  const l = await caches.open(LIBS); await Promise.all(LIB_FILES.map(u => l.add(u).catch(() => {})));
  await self.skipWaiting();
})()));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(K => Promise.all(K.filter(k => k.startsWith("terrain-") && ![CORE, LIBS, TILES].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname === "data.geopf.fr") { // tuiles IGN : cache d'abord (utile sans réseau sur le terrain)
    e.respondWith((async () => { const c = await caches.open(TILES); const hit = await c.match(req); if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === "opaque") { c.put(req, res.clone()); c.keys().then(k => { if (k.length > MAX_TILES) k.slice(0, k.length - MAX_TILES).forEach(x => c.delete(x)); }); } return res; } catch (err) { return new Response("", { status: 504 }); } })());
    return;
  }
  if (url.hostname === "unpkg.com") { e.respondWith(caches.open(LIBS).then(async c => (await c.match(req)) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))); return; }
  if (url.origin !== location.origin || !url.pathname.startsWith(new URL("./", self.registration.scope).pathname)) return;
  e.respondWith((async () => { const c = await caches.open(CORE); try { const r = await fetch(req, { cache: "no-cache" }); if (r.ok) c.put(req, r.clone()); return r; } catch (err) { return (await c.match(req, { ignoreSearch: true })) || (await c.match("index.html")); } })());
});
