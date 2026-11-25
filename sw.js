// EPS – Autonomie et Numérique : service worker de la racine.
// Il ne gère que la page d'accueil (/eps-autonomie-numerique/), le bouton Accueil partagé, Relais Vitesse, Volley-ball, Badminton, Danse, Emploi du temps et Appel AS (qui n'ont pas de service worker propre).
// Acrosport, Escalade et OrienRun gardent leur propre service worker : leurs requêtes ne sont pas touchées ici.
const CORE = "eps-core-v132";
const B = "/eps-autonomie-numerique/"; // adresse des applications
const CORE_FILES = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", B, B + "index.html", B + "course-orientation/index.html", B + "eps-home.js", B + "eps-lists.js", B + "eps-eval.js", B + "eps-shell.js", B + "eps-guides.js", B + "eps-lecons.js", B + "eps-obs.js", B + "eps-qr.js", B + "eps-groupes.js", B + "eps-remed-ref.js", B + "console/", B + "console/index.html", B + "relais/", B + "relais/index.html", B + "volley/", B + "volley/index.html", B + "badminton/", B + "badminton/index.html", B + "badminton/echauffement-deplacements.webp", B + "danse/", B + "danse/index.html", B + "edt/", B + "edt/index.html", B + "appel-as/", B + "appel-as/index.html", B + "ccf/", B + "ccf/index.html", B + "crosstraining/", B + "crosstraining/index.html", B + "crosstraining/scinde.html"];
// Bibliothèques externes utilisées par Relais Vitesse (lecture Excel, polices)
const EXT = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(CORE_FILES)).then(() => self.skipWaiting()));
});
/* version de cette tablette, demandée par les pages (pastille 🟢 / 🔴 du bouton 🔄, eps-home.js) */
self.addEventListener("message", e => { if (e.data === "eps-ver" && e.source) e.source.postMessage({ epsVer: CORE }); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("eps-core") && k !== CORE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function mine(url) {
  if (url.origin === location.origin) {
    const p = url.pathname;
    return p === "/" || p === "/index.html" || p === "/manifest.webmanifest" || p === "/eps-home.js" || /^\/icon-\d+\.png$/.test(p) || p === B || p === B + "index.html" || p === B + "eps-home.js" || p === B + "eps-lists.js" || p === B + "eps-eval.js" || p === B + "eps-shell.js" || p === B + "eps-guides.js" || p === B + "eps-lecons.js" || p === B + "eps-obs.js" || p === B + "eps-groupes.js" || p === B + "eps-remed-ref.js" || p.startsWith(B + "console/") || p.indexOf(B + "vendor/") === 0 || p === B + "eps-qr.js" || p.startsWith(B + "relais/") || p.startsWith(B + "volley/") || p.startsWith(B + "badminton/") || p.startsWith(B + "danse/") || p.startsWith(B + "edt/") || p.startsWith(B + "appel-as/") || p.startsWith(B + "ccf/");
  }
  return EXT.test(url.href);
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!mine(url)) return; // les autres applications gèrent leurs propres fichiers

  // Page d'accueil commune et eps-home.js : tout de suite depuis la tablette, mise à jour en arrière-plan pour la fois suivante
  const fast = url.origin === location.origin && (url.pathname === B || url.pathname === B + "index.html" || url.pathname === B + "eps-home.js");
  if (fast) {
    e.respondWith((async () => {
      const cache = await caches.open(CORE);
      const hit = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    })());
    return;
  }
  // Réseau d'abord (toujours à jour), le cache si pas de connexion
  e.respondWith((async () => {
    const cache = await caches.open(CORE);
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true }) ||
        (req.mode === "navigate" ? await cache.match(url.pathname.startsWith(B + "relais/") ? B + "relais/" : url.pathname.startsWith(B + "volley/") ? B + "volley/" : url.pathname.startsWith(B + "badminton/") ? B + "badminton/" : url.pathname.startsWith(B + "danse/") ? B + "danse/" : url.pathname.startsWith(B + "edt/") ? B + "edt/" : url.pathname.startsWith(B + "appel-as/") ? B + "appel-as/" : url.pathname.startsWith(B + "ccf/") ? B + "ccf/" : url.pathname.startsWith(B + "console/") ? B + "console/" : B) : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
