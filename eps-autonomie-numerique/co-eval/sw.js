// CO Course : fonctionnement hors ligne (l'appli reste disponible sans réseau, même après un rechargement)
const V = "coe-v72", CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "../vendor/pdf-lib.min.js", "../vendor/jszip.min.js", "../eps-lists.js", "../eps-home.js", "../eps-eval.js", "../eps-shell.js", "../eps-lecons.js", "../eps-obs.js", "../eps-groupes.js", "../eps-guides.js", "../eps-remed-ref.js", "../eps-tactique.js", "../eps-ref.js", "../eps-culture.js", "../eps-qr.js"];
const isCommon = p => /\/eps-autonomie-numerique\/eps-[a-z-]+\.js$/.test(p); // fichiers communs : réseau d'abord (mises à jour), copie sinon
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(K => Promise.all(K.filter(k => k.startsWith("coe-") && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || !(u.pathname.includes("/co-eval/") || u.pathname.includes("/vendor/") || isCommon(u.pathname))) return;
  if (isCommon(u.pathname)) { e.respondWith(fetch(r).then(y => { if (y.ok) { const z = y.clone(); caches.open(V).then(c => c.put(r, z)); } return y; }).catch(() => caches.match(r, { ignoreSearch: true }).then(x => x || Response.error()))); return; } // le script Google, les fonds IGN… ne passent pas par ici
  const page = r.mode === "navigate" || /\/co-eval\/(index\.html)?$/.test(u.pathname);
  if (page) { // la version en ligne d'abord (mises à jour), la copie du téléphone si pas de réseau
    e.respondWith(new Promise(res => {
      let done = false; const fall = () => caches.match("./index.html").then(x => { if (!done && x) { done = true; res(x); } });
      const t = setTimeout(fall, 4000);
      fetch(r, { cache: "no-store" }).then(x => { clearTimeout(t); if (x.ok) { const y = x.clone(); caches.open(V).then(c => c.put("./index.html", y)); } if (!done) { done = true; res(x); } })
        .catch(() => { clearTimeout(t); caches.match("./index.html").then(x => { if (!done) { done = true; res(x || Response.error()); } }); });
    }));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(x => x || fetch(r).then(y => { if (y.ok) { const z = y.clone(); caches.open(V).then(c => c.put(r, z)); } return y; })));
});
