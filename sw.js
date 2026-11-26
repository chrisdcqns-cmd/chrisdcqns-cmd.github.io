// EPS – Autonomie et Numérique : service worker de la racine.
// Il gère la page d'accueil, les fichiers communs (eps-*.js, vendor/) et TOUTES les applis du dossier qui n'ont pas
// leur propre service worker (toute nouvelle appli est donc prise en charge sans rien ajouter à mine()).
// Acrosport, Escalade, OrienRun, CO Course et Pose des balises (OWN) gardent le leur : leurs requêtes ne sont pas touchées ici ;
// ces service workers gardent eux-mêmes une copie des fichiers communs (voir SHARED dans chacun).
const CORE = "eps-core-v156";
const B = "/eps-autonomie-numerique/"; // adresse des applications
const CORE_FILES = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", B, B + "index.html", B + "course-orientation/", B + "course-orientation/index.html", B + "eps-home.js", B + "eps-lists.js", B + "eps-eval.js", B + "eps-shell.js", B + "eps-guides.js", B + "eps-lecons.js", B + "eps-obs.js", B + "eps-qr.js", B + "eps-groupes.js", B + "eps-remed-ref.js", B + "vendor/qrlib.js", B + "vendor/jszip.min.js", B + "vendor/pdf-lib.min.js", B + "console/", B + "console/index.html", B + "relais/", B + "relais/index.html", B + "volley/", B + "volley/index.html", B + "volley/echauffement-temps1.webp", B + "volley/echauffement-temps2.webp", B + "badminton/", B + "badminton/index.html", B + "badminton/echauffement-deplacements.webp", B + "danse/", B + "danse/index.html", B + "edt/", B + "edt/index.html", B + "appel-as/", B + "appel-as/index.html", B + "ccf/", B + "ccf/index.html", B + "crosstraining/", B + "crosstraining/index.html", B + "crosstraining/scinde.html", B + "mon-bilan/", B + "mon-bilan/index.html"];
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

const OWN = ["acrosport/", "escalade/", "orientation/", "co-eval/", "terrain/"]; // applis qui ont leur propre service worker
function mine(url) {
  if (url.origin === location.origin) {
    const p = url.pathname;
    if (p === "/" || p === "/index.html" || p === "/manifest.webmanifest" || p === "/eps-home.js" || /^\/icon-\d+\.png$/.test(p)) return true;
    if (!p.startsWith(B)) return false; // anciennes adresses (redirections) : réseau direct
    const r = p.slice(B.length);
    return !OWN.some(d => r.startsWith(d));
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
      // page demandée sans réseau : la copie du dossier de l'appli (…/volley/, …/crosstraining/…), sinon la page d'accueil
      const dir = url.pathname.startsWith(B) ? url.pathname.slice(B.length).split("/")[0] : "";
      const hit = await cache.match(req, { ignoreSearch: true }) ||
        (req.mode === "navigate" ? (dir && await cache.match(B + dir + "/")) || await cache.match(B) : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
