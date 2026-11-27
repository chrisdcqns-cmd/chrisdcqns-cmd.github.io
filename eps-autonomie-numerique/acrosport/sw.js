// Acrosport EPS — service worker : appli toujours à jour quand il y a du réseau, utilisable hors connexion sinon.
const CORE = "acro-core-v48";
const VIDEOS = "acro-videos-v1";
const CORE_FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "trame-1gt.js"];
const SHARED = ["../eps-lists.js", "../eps-home.js", "../eps-eval.js", "../eps-shell.js", "../eps-lecons.js", "../eps-obs.js", "../eps-groupes.js", "../eps-guides.js", "../eps-remed-ref.js", "../eps-tactique.js", "../eps-ref.js", "../eps-qr.js"]; // fichiers communs (dossier parent), gardés aussi ici pour le hors ligne


self.addEventListener("install", e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(CORE_FILES.concat(SHARED))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("acro-core") && k !== CORE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function rangeFrom(cached, req) {
  const buf = await cached.arrayBuffer();
  const m = /bytes=(\d+)-(\d*)/.exec(req.headers.get("range") || "");
  const start = m ? +m[1] : 0;
  const end = m && m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: { "Content-Type": "video/mp4", "Content-Range": `bytes ${start}-${end}/${buf.byteLength}`, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" }
  });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // vidéos : depuis la tablette si elles ont été téléchargées, sinon depuis internet
  if (url.pathname.endsWith(".mp4")) {
    e.respondWith((async () => {
      const cache = await caches.open(VIDEOS);
      const name = url.pathname.replace(/^.*\/v\//, "");
      const hit = await cache.match("v/" + name) || await cache.match(req.url) || await cache.match("/acrosport/v/" + name); // vidéos téléchargées à l'ancienne adresse /acrosport/
      if (hit) return req.headers.get("range") ? rangeFrom(hit, req) : hit;
      return fetch(req);
    })());
    return;
  }

  // page et fichiers de l'appli : réseau d'abord (mises à jour), copie locale si pas de réseau
  e.respondWith((async () => {
    const cache = await caches.open(CORE);
    try {
      const res = await fetch(req, { cache: "no-cache" });
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      return (await cache.match(req)) || (await cache.match("index.html"));
    }
  })());
});
