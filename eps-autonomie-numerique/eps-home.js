// Commun à toutes les applications EPS (et à la page d'accueil) :
//  - pas de glissé pour actualiser ;
//  - dispenses partagées (window.EPSD) : pastille « 🩹 dispensés » dans chaque application, gestion depuis la page d'accueil ;
//  - pavé de code enseignant window.epsPin({title,text,len,min,max,letters,check}) → Promise<code|null> (pas de clavier du système, rien d'affiché) ;
//  - bouton « Accueil », petit, en bas à gauche : un appui = accueil de l'application en cours (window.epsAppHome), maintenir 3 s = page commune (/), glisser = déplacer.
(function () {
  try {
    var st = document.createElement("style");
    st.textContent = "html,body{overscroll-behavior-y:contain!important}";
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}
  /* Pavé de code enseignant (commun aux applications EPS) : pas de clavier du système, aucun chiffre affiché (seulement des points), aucune touche mise en surbrillance. */
  function epsPin(o){return (window.epsPinCommon||window.epsPin)(o)}
  if (window.__epsHome) return;
  window.__epsHome = true;
  var BASE = "/eps-autonomie-numerique/"; /* adresse de la page d'accueil commune */
  var HUB = location.pathname === BASE || location.pathname === BASE + "index.html" || location.pathname === "/" || location.pathname === "/index.html";

  /* ================= Dispenses ================= */
  var KD = "eps.disp.v1";
  function ld() { try { var v = JSON.parse(localStorage.getItem(KD) || "null"); if (v && v.items) return v; } catch (e) {} return { items: {}, pend: {}, since: 0, maxU: 0 }; }
  function sv(d) { try { localStorage.setItem(KD, JSON.stringify(d)); } catch (e) {} }
  /* listes de classes partagées entre tablettes (import / modification depuis la page d'accueil) : enregistrements « lst|<id> » */
  var KL = "eps.lists.v1";
  function lld() { try { var v = JSON.parse(localStorage.getItem(KL) || "null"); if (v && v.items) { v.app = v.app || {}; return v; } } catch (e) {} return { items: {}, pend: {}, since: 0, app: {} }; }
  function lsv(v) { try { localStorage.setItem(KL, JSON.stringify(v)); } catch (e) {} }
  var D = ld(); D.pend = D.pend || {};
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function nkey(s) { return norm(s).split(" ").filter(Boolean).sort().join(" "); } // « Léa MARTIN » = « MARTIN Léa »
  var JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  function fmt(iso) { if (!iso) return ""; var d = new Date(iso + "T12:00:00"); return JOURS[d.getDay()] + " " + ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function all() { return Object.values(D.items).filter(function (x) { return x && !x.del; }); }
  function activeOn(day) { day = day || today(); return all().filter(function (x) { return x.du <= day && day <= x.au; }); }
  function upcoming() { var t = today(); return all().filter(function (x) { return x.du > t; }).sort(function (a, b) { return a.du < b.du ? -1 : 1; }); }
  function label(x) {
    if (!x) return "";
    var t = today();
    if (x.du > t) return "dispensé(e) du " + fmt(x.du) + " au " + fmt(x.au);
    return x.au === t ? "dispensé(e) aujourd'hui" : "dispensé(e) jusqu'au " + fmt(x.au);
  }
  /* un élève (classe + nom, dans n'importe quel ordre) est-il dispensé aujourd'hui ? */
  function find(classe, nom, prenom) {
    var full = prenom != null ? prenom + " " + nom : nom, k = nkey(full), c = norm(classe);
    var L = activeOn().filter(function (x) { return nkey(x.nom) === k; });
    return L.filter(function (x) { return !c || !x.classe || norm(x.classe) === c; })[0] || L[0] || null;
  }

  /* -------- partage entre tablettes : même canal que Relais Vitesse (onglet « Sync » de la feuille), chiffré -------- */
  /* réglage commun à toutes les applications (racine) : adresse du script Google + clé secrète, une fois par tablette */
  /* script commun (apps-script/Code.gs), indépendant de celui de Relais Vitesse (RELAIS_URL) */
  var KS = "eps.share.v1", RELAIS_URL = "https://script.google.com/macros/s/AKfycbxx2iiF_YauPOeCrmBBuNp2Szn4s8qnifLbvuDUCCYCD8djF7egfH3oSg2XEfSIVJjg/exec";
  var GUIDE_COMMUN = "https://github.com/chrisdcqns-cmd/chrisdcqns-cmd.github.io/blob/main/eps-autonomie-numerique/apps-script/README.md";
  /* adresse du script commun déployé (publique : seule la clé secrète, saisie sur chaque tablette, donne accès aux données) */
  var DEF_URL = "https://script.google.com/macros/s/AKfycbzMC68J_J-iKj6mCi9sIkxYTQoW8w5Qsool00ng1mwwRN4BVOAu9l0FN8_pVSPp0oh1lQ/exec";
  function shareGet() {
    var s = null; try { s = JSON.parse(localStorage.getItem(KS) || "null"); } catch (e) {}
    return s || { url: DEF_URL, key: "" };
  }
  /* enregistre le réglage ; Relais Vitesse garde son propre script (recopie de l'ancien réglage s'il n'avait pas sa clé) */
  function saveShare(v) {
    try { var old = shareGet(), rs = JSON.parse(localStorage.getItem("relais-vitesse-sheets-v1") || "null") || {};
      if (old.url && old.key && old.url !== v.url && !rs.key) { rs.url = old.url; rs.key = old.key; localStorage.setItem("relais-vitesse-sheets-v1", JSON.stringify(rs)); } } catch (e) {}
    try { localStorage.setItem(KS, JSON.stringify(v)); } catch (e) {}
    D.since = 0; sv(D);
  }
  /* « Régler une autre tablette » : lien + QR code contenant le réglage (adresse si différente + clé) */
  function u64(t) { var b = new TextEncoder().encode(t), x = ""; b.forEach(function (c) { x += String.fromCharCode(c); }); return btoa(x).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function d64(t) { t = t.replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; return new TextDecoder().decode(Uint8Array.from(atob(t), function (c) { return c.charCodeAt(0); })); }
  function lienPartage(c) { return location.origin + BASE + "#partage=" + u64(JSON.stringify(c.url === DEF_URL ? [c.key] : [c.key, c.url])); }
  function loadQR() {
    if (window.QRLib) return Promise.resolve(window.QRLib);
    return new Promise(function (res, rej) { var sc = document.createElement("script"); sc.src = BASE + "eps-qr.js"; sc.onload = function () { res(window.QRLib); }; sc.onerror = rej; document.head.appendChild(sc); });
  }
  function shareQR() {
    var c = shCfg(); if (!c) return;
    var url = lienPartage(c);
    var o = overlay('<h3>📲 Régler une autre tablette</h3><p class="m">Sur l\'autre tablette, scanne ce QR code avec l\'appareil photo (ou ouvre le lien), puis tape ton code enseignant : le partage est réglé.</p>' +
      '<div style="text-align:center"><canvas id="epsd-qr" width="260" height="260" style="width:260px;height:260px;border-radius:12px"></canvas></div>' +
      '<p class="m" style="color:#C0392B;font-weight:700">⚠ Ce QR code contient ta clé secrète : ne le montre pas aux élèves.</p>' +
      '<div class="epsd-act"><button data-x>Fermer</button><button id="epsd-qcp">Copier le lien</button></div>');
    o.querySelector("#epsd-qcp").onclick = function () { try { navigator.clipboard.writeText(url).then(function () { toastHub("Lien copié"); }); } catch (e) {} };
    loadQR().then(function (L) {
      var q = new L.QRCode(-1, L.ECL.M); q.addData(url); q.make();
      var cv = o.querySelector("#epsd-qr"), n = q.getModuleCount(), sz = Math.floor(cv.width / (n + 8)), off = Math.floor((cv.width - sz * n) / 2), g = cv.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = "#000";
      for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (q.isDark(r, cc)) g.fillRect(off + cc * sz, off + r * sz, sz, sz);
    }).catch(function () { var cv = o.querySelector("#epsd-qr"); if (cv) cv.replaceWith(document.createTextNode("QR code indisponible : utilise « Copier le lien ».")); });
  }
  /* arrivée par le lien / QR code « #partage=… » (page d'accueil) : code enseignant, puis réglage enregistré */
  function partageDepuisLien() {
    var m = /^#partage=([A-Za-z0-9_-]+)$/.exec(location.hash || ""); if (!m) return;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    var a; try { a = JSON.parse(d64(m[1])); } catch (e) { toastHub("Lien de partage illisible"); return; }
    var v = { key: String(a[0] || ""), url: String(a[1] || DEF_URL) }; if (!v.key) return;
    askCode().then(function (ok) {
      if (!ok) return;
      saveShare(v); sync();
      var o = overlay('<h3>✓ Partage réglé</h3><p class="m">Cette tablette utilise maintenant le script commun : les réglages, dispenses et listes des autres tablettes arrivent dans quelques secondes.</p><div class="epsd-act"><button class="p" data-x>OK</button></div>');
      try { window.dispatchEvent(new CustomEvent("eps-reglages")); } catch (e) {}
    });
  }
  /* empreinte du canal (adresse + clé) : quand elle change, tout ce qui est sur la tablette est renvoyé au nouveau script */
  function chSig(c) { var h = 5381, t = c.url + "|" + c.key; for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return String(h); }
  function migrer(cfg) {
    var sig = chSig(cfg); if (D.ch === sig) return;
    D.ch = sig; D.since = 0; /* u = 1 : ne remplace jamais une version plus récente déjà présente dans le script */
    Object.keys(D.items).forEach(function (id) { if (!D.pend[id]) D.pend[id] = 1; }); sv(D);
    var LL = lld(); LL.since = 0; Object.keys(LL.items).forEach(function (id) { if (!LL.pend[id]) LL.pend[id] = 1; }); lsv(LL);
    try { var r = rget(); r.since = 0; if (!r.pend && r.u) r.pend = r.u; localStorage.setItem(KR, JSON.stringify(r)); } catch (e) {}
    try { var ee = eget(); ee.since = 0; if (ee.data && !ee.pend) ee.pend = ee.u || Date.now(); eset(ee); } catch (e) {}
  }
  function shCfg() { var s = shareGet(); return s.url && s.key ? s : null; }
  function shareSettings(back) {
    var s = shareGet();
    var o = overlay('<h3>⚙ Partage entre tablettes</h3><p class="m">Réglage commun à toutes les applications : réglages, dispenses et listes passent par le <b>script commun EPS</b> (ta feuille Google), chiffrés avec la clé secrète. À faire <b>une fois sur chaque tablette</b>. <a href="' + GUIDE_COMMUN + '" target="_blank" rel="noopener">Installer le script commun</a></p>' +
      (s.url === RELAIS_URL ? '<p class="m" style="color:#B26B00;font-weight:700">⚠ Cette tablette utilise encore le script de Relais Vitesse : installe le script commun, puis colle ici sa nouvelle adresse et sa clé.</p>' : "") +
      '<span class="epsd-lab">Adresse du script commun (…/exec)</span><input class="epsd-in" id="epsd-surl" placeholder="https://script.google.com/macros/s/…/exec" value="' + esc(s.url && s.url !== RELAIS_URL ? s.url : DEF_URL) + '">' +
      '<span class="epsd-lab">Clé secrète (la même que dans le script)</span><input class="epsd-in" id="epsd-skey" type="password" autocomplete="off" value="' + esc(s.key || "") + '">' +
      '<p class="m" id="epsd-sst" style="margin-top:10px"></p>' +
      '<div class="epsd-act"><button data-x>Fermer</button>' + (shCfg() && s.url !== RELAIS_URL ? '<button id="epsd-sqr">📲 Régler une autre tablette</button>' : "") + '<button id="epsd-ctest">🤖 Tester Claude</button><button id="epsd-stest">Tester</button><button class="p" id="epsd-ssave">Enregistrer</button></div>');
    var bq = o.querySelector("#epsd-sqr"); if (bq) bq.onclick = function () { o.remove(); shareQR(); };
    function val() { return { url: o.querySelector("#epsd-surl").value.trim(), key: o.querySelector("#epsd-skey").value.trim() }; }
    async function test() {
      var v = val(), st = o.querySelector("#epsd-sst"); if (!v.url || !v.key) { st.textContent = "Indique l'adresse et la clé."; return false; }
      st.textContent = "Test…"; var r = await jsonp(v, {});
      st.textContent = !r ? "✕ Impossible de joindre le script (adresse ou déploiement)." : !r.keyOk ? "✕ La clé ne correspond pas à celle du script." : !r.sync ? "⚠ Le script doit être mis à jour (nouvelle version de Code.gs)." : r.app === "Relais Vitesse EPS" ? "⚠ Connexion réussie, mais c'est le script de Relais Vitesse : installe le script commun (lien ci-dessus)." : "✓ Connexion réussie au script commun.";
      if (r && r.app === "Danse EPS") st.textContent = "✕ Cette adresse est celle du script de Danse : il faut celle du script commun.";
      return !!(r && r.keyOk);
    }
    o.querySelector("#epsd-stest").onclick = test;
    o.querySelector("#epsd-ctest").onclick = function () { var b = this, m = o.querySelector("#epsd-cmsg"); if (!m) { m = document.createElement("div"); m.id = "epsd-cmsg"; m.style.cssText = "margin-top:10px;padding:10px 12px;border-radius:12px;background:#F5F3EE;font:15px/1.4 system-ui;white-space:pre-wrap"; b.parentNode.parentNode.appendChild(m); }
      b.disabled = true; m.textContent = "Test de Claude en cours (jusqu'à 40 s)…"; testClaude().then(function (t) { m.textContent = t; b.disabled = false; }); };
    o.querySelector("#epsd-ssave").onclick = async function () { var v = val(); saveShare(v); var ok = await test(); if (ok) { sync(); setTimeout(function () { o.remove(); if (back) back(); }, 700); } };
  }
  var KEY = null, KEYSRC = null;
  function key(k) {
    if (KEY && KEYSRC === k) return Promise.resolve(KEY);
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(k), "PBKDF2", false, ["deriveKey"]).then(function (b) {
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode("relais-vitesse-sync-v1"), iterations: 120000, hash: "SHA-256" }, b, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    }).then(function (x) { KEY = x; KEYSRC = k; return x; });
  }
  function b64(u) { var s = "", B = new Uint8Array(u); for (var i = 0; i < B.length; i += 0x8000) s += String.fromCharCode.apply(null, B.subarray(i, i + 0x8000)); return btoa(s); }
  function enc(k, str) { var iv = crypto.getRandomValues(new Uint8Array(12)); return key(k).then(function (K) { return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, K, new TextEncoder().encode(str)); }).then(function (ct) { var o = new Uint8Array(12 + ct.byteLength); o.set(iv); o.set(new Uint8Array(ct), 12); return b64(o); }); }
  function dec(k, s) { var b = Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); return key(k).then(function (K) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, K, b.slice(12)); }).then(function (pt) { return new TextDecoder().decode(pt); }); }
  function jsonp(cfg, params, ms) {
    return new Promise(function (res) {
      var cb = "epsdCb" + Date.now() + Math.floor(Math.random() * 1e4), s = document.createElement("script"), t;
      function end(d) { clearTimeout(t); try { delete window[cb]; } catch (e) {} s.remove(); res(d); }
      window[cb] = end; s.charset = "utf-8"; s.onerror = function () { end(null); }; t = setTimeout(function () { end(null); }, ms || 15000);
      params.key = cfg.key; params.callback = cb;
      s.src = cfg.url + (cfg.url.indexOf("?") >= 0 ? "&" : "?") + Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
      document.head.appendChild(s);
    });
  }
  var busy = false, timer = null, lastErr = "", lastOk = 0, lastBackup = null;
  function stamp() { return Math.max(Date.now(), (D.maxU || 0) + 1); }
  async function sync() {
    if (window.EPS_SIM) return; /* 🧪 simulation : rien ne part */
    var cfg = shCfg();
    if (!cfg || busy || !(window.crypto && crypto.subtle) || navigator.onLine === false) { sched(); return; }
    busy = true;
    try {
      migrer(cfg);
      var ks = Object.keys(D.pend);
      if (ks.length) {
        var recs = [];
        for (var i = 0; i < ks.length; i++) {
          var id = ks[i], it = D.items[id], u = D.pend[id];
          if (!it) { delete D.pend[id]; continue; }
          recs.push(it.del ? { k: "disp|" + id, u: u, d: 1 } : { k: "disp|" + id, u: u, d: 0, x: await enc(cfg.key, JSON.stringify(it)) });
        }
        if (recs.length) await fetch(cfg.url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ key: cfg.key, sync: { dev: "dispenses", recs: recs } }) });
        await new Promise(function (r) { setTimeout(r, 1200); });
      }
      var LL = lld(), lk = Object.keys(LL.pend);
      if (lk.length) {
        var lr = [];
        for (var li = 0; li < lk.length; li++) { var lo = LL.items[lk[li]]; if (!lo) continue; lr.push(lo.del ? { k: "lst|" + lk[li], u: LL.pend[lk[li]], d: 1 } : { k: "lst|" + lk[li], u: LL.pend[lk[li]], d: 0, x: await enc(cfg.key, JSON.stringify(lo)) }); }
        if (lr.length) await fetch(cfg.url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ key: cfg.key, sync: { dev: "listes", recs: lr } }) });
        await new Promise(function (r) { setTimeout(r, 1200); });
        var lw = {}, lcf = null; lk.forEach(function (k) { if (LL.items[k]) lw["lst|" + k] = LL.pend[k]; });
        try { lcf = lr.length ? await confirmes(cfg, lw) : {}; } catch (e) { lcf = null; }
        var LN = lld(); LN.essais = LN.essais || {};
        lk.forEach(function (k) { if (LN.pend[k] !== LL.pend[k]) return;
          if (!LL.items[k] || lcf === "ancien" || (lcf && lcf["lst|" + k])) { delete LN.pend[k]; delete LN.essais[k]; return; }
          LN.essais[k] = (LN.essais[k] || 0) + 1; if (LN.essais[k] >= ESSAIS_MAX) { delete LN.pend[k]; delete LN.essais[k]; } });
        lsv(LN);
      }
      var changed = false;
      for (var loop = 0; loop < 20; loop++) {
        var r = await jsonp(cfg, { pull: 1, since: D.since || 0, pre: "disp|" });
        if (!r || !r.keyOk || !r.sync) { lastErr = !r ? "pas de connexion" : !r.keyOk ? "clé" : "script à mettre à jour"; break; }
        lastErr = ""; lastOk = Date.now(); if (r.sauv != null) lastBackup = r.sauv;
        try { localStorage.setItem("eps.share.dropv", r.dropv ? "1" : "0"); } catch (e) {} /* le script commun sait-il recevoir les auto-positionnements ? */
        var L = r.recs || [];
        for (var j = 0; j < L.length; j++) {
          var k = L[j][1], uu = +L[j][2], del = +L[j][3], x = L[j][4];
          D.maxU = Math.max(D.maxU || 0, uu);
          if (k.indexOf("disp|") !== 0) continue;
          var did = k.slice(5);
          if (D.pend[did] && D.pend[did] > uu) continue;
          delete D.pend[did];
          if (del) { if (D.items[did] && !D.items[did].del) { D.items[did].del = 1; changed = true; } continue; }
          try { var o = JSON.parse(await dec(cfg.key, x)); if (JSON.stringify(D.items[did]) !== JSON.stringify(o)) { D.items[did] = o; changed = true; } } catch (e) {}
        }
        D.since = L.length ? +L[L.length - 1][0] : Math.max(D.since || 0, +r.seq || 0);
        if (!r.more) break;
      }
      sv(D);
      if (changed) fire();
      /* listes de classes reçues d'une autre tablette → appliquées dans Escalade, Relais Vitesse, OrienRun */
      var lch = false;
      for (var lp = 0; lp < 20; lp++) {
        var LS2 = lld(), rr = await jsonp(cfg, { pull: 1, since: LS2.since || 0, pre: "lst|" });
        if (!rr || !rr.keyOk || !rr.sync) break;
        var RL = rr.recs || [];
        for (var q = 0; q < RL.length; q++) {
          var lid = String(RL[q][1]).slice(4), ldel = +RL[q][3];
          if (ldel || LS2.pend[lid]) continue;
          try { var ob = JSON.parse(await dec(cfg.key, RL[q][4])), sig = JSON.stringify(ob);
            if (LS2.app[lid] !== sig) { LS2.items[lid] = ob; LS2.app[lid] = sig; lsv(LS2); lch = true; } } catch (e) {}
        }
        LS2.since = RL.length ? +RL[RL.length - 1][0] : Math.max(LS2.since || 0, +rr.seq || 0); lsv(LS2);
        if (!rr.more) break;
      }
      if (lch) { try { await applyLocal(); } catch (e) {} if (HUB) try { window.dispatchEvent(new CustomEvent("eps-lists")); } catch (e) {} }
      try { await syncReg(cfg); } catch (e) {}
      try { await syncEdt(cfg); } catch (e) {}
      try { edtApply(); } catch (e) {}
      for (var si = 0; si < STORES.length; si++) { try { await syncStore(cfg, STORES[si]); } catch (e) {} }
      /* magasins des autres applis présents sur la tablette : leurs données en attente partent d'ici aussi (sinon elles ne partaient
         qu'appli ouverte, et une saisie suivie d'une sortie rapide restait sur la tablette). Envoi seulement, sauf « Tout récupérer ». */
      var AU = autoStores(FULLPULL); for (var ai = 0; ai < AU.length; ai++) { if (!FULLPULL && !Object.keys(stLd(AU[ai].key).pend || {}).length) continue; try { await syncStore(cfg, Object.assign({ pushOnly: !FULLPULL }, AU[ai])); } catch (e) {} }
    } catch (e) { lastErr = "réseau"; }
    finally { busy = false; sched(); try { syncBadge(); } catch (e) {} }
  }
  /* magasins de données génériques (ex. évaluations d'eps-eval.js) : {pre, key, onChange} ;
     localStorage[key] = {items:{id:{…, u}}, pend:{id:u}, since} ; le plus récent (u) l'emporte, élément par élément */
  var STORES = [], ESSAIS_MAX = 8; /* essais sans confirmation avant de lever l'attente quand même (évite de renvoyer sans fin) */
  function stLd(k) { var v = jget(k, null); if (!v || !v.items) v = { items: {}, pend: {}, since: 0 }; v.pend = v.pend || {}; return v; }
  var AUTOPAT = [[/^eps\.attest\.v1$/, "at|"], [/^eps\.quiz\.v1$/, "qz|"], [/^eps\.carnet\.v1$/, "cn|"], [/^eps\.ref\.v1$/, "rf|"], [/^eps\.ico\.v1$/, "iq|"], [/^eps\.cdc\.v1$/, "kc|"], [/^eps\.terrain\.v1$/, "tz|"], [/^eps\.coeval\.v1$/, "cv|"], [/^eps\.trash\.v1$/, "tk|"], [/^eps\.analyse\.v1$/, "an|"], [/^eps\.eval\.([a-z]+)\.v1$/, "ev.$1|"], [/^eps\.lecons\.([a-z]+)\.v1$/, "lc.$1|"], [/^eps\.lcimg\.([a-z]+)\.v1$/, "li.$1|"], [/^eps\.lcdocs\.([a-z]+)\.v1$/, "ld.$1|"],
    [/^eps\.live\.([a-z]+)\.v1$/, "lv.$1|"], [/^eps\.leceval\.([a-z]+)\.v1$/, "le.$1|"], [/^eps\.lecres\.([a-z]+)\.v1$/, "lr.$1|"], [/^eps\.evmod\.([a-z]+)\.v1$/, "em.$1|"], [/^eps\.valid\.([a-z]+)\.v1$/, "va.$1|"], [/^eps\.obs\.v1$/, "ob|"], [/^eps\.rang\.v1$/, "rg|"], [/^ct\.v1$/, "ct|"], [/^step\.v1$/, "sp|"], [/^bk\.v1$/, "bk|"], [/^eps\.niv\.v1$/, "nv|"], [/^eps\.remed\.v1$/, "rm|"], [/^eps\.avis\.v1$/, "av|"], [/^eps\.grphist\.v1$/, "gh|"], [/^eps\.console\.v1$/, "cs|"]], FULLPULL = false;
  function autoStores(all) { var out = [], seen = {}; STORES.forEach(function (s) { seen[s.key] = 1; });
    var keys = []; for (var i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    if (all) { ["escalade", "relais", "volley", "badminton", "danse", "acrosport", "orientation", "ccf", "crosstraining", "basket", "step"].forEach(function (d) { ["lecons", "lcimg", "lcdocs", "live", "leceval", "lecres"].forEach(function (t) { keys.push("eps." + t + "." + d + ".v1"); }); });
      ["esc", "acro", "ori", "ct", "bk", "step"].forEach(function (a) { keys.push("eps.eval." + a + ".v1"); }); keys.push("eps.obs.v1", "eps.rang.v1", "ct.v1", "bk.v1", "step.v1"); }
    keys.forEach(function (k) { if (!k || seen[k]) return; for (var j = 0; j < AUTOPAT.length; j++) if (AUTOPAT[j][0].test(k)) { seen[k] = 1; out.push({ key: k, pre: k.replace(AUTOPAT[j][0], AUTOPAT[j][1]) }); break; } });
    return out; }
  /* 📥 restauration d'une tablette neuve : relevé complet de tous les magasins communs, puis chaque appli ouverte en arrière-plan
     (cadre invisible) pour qu'elle relève ses propres données (Volley, Badminton, Danse, Relais, Escalade, Acrosport, OrienRun…). */
  async function restoreAll() {
    if (!shCfg()) { alert("Règle d'abord le partage entre tablettes (même script et même clé que tes autres tablettes)."); return; }
    var DIRS = ["escalade", "relais", "volley", "badminton", "danse", "acrosport", "orientation", "crosstraining", "basket", "step", "ccf", "edt", "appel-as"];
    var o = overlay('<h3>📥 Récupération de toutes les données</h3><p class="m" id="rs-m">Relevé des données communes…</p><div style="height:10px;background:#EEE;border-radius:6px;overflow:hidden"><div id="rs-b" style="height:100%;width:3%;background:#2E7D4F"></div></div><div class="epsd-act"><button data-x>Fermer</button></div>');
    var m = o.querySelector("#rs-m"), bar = o.querySelector("#rs-b"), step = function (i, t) { m.textContent = t; bar.style.width = Math.round(100 * i / (DIRS.length + 1)) + "%"; };
    FULLPULL = true; try { await sync(); } catch (e) {} FULLPULL = false;
    for (var i = 0; i < DIRS.length; i++) { if (!document.body.contains(o)) return; step(i + 1, "Ouverture de " + (NAPP[DIRS[i]] || DIRS[i]) + " (" + (i + 1) + " / " + DIRS.length + ")…");
      await new Promise(function (res) { var f = document.createElement("iframe"); f.style.cssText = "position:fixed;left:-9999px;top:0;width:1024px;height:768px;opacity:0;pointer-events:none"; f.setAttribute("aria-hidden", "true"); f.src = BASE + DIRS[i] + "/?restauration=1";
        /* chaque appli relève aussi ses propres données tout de suite (Danse : synchroniser ; toute appli peut fournir window.epsSyncNow) */
        f.onload = function () { setTimeout(function () { try { var w = f.contentWindow; ["epsSyncNow", "synchroniser"].forEach(function (n) { if (typeof w[n] === "function") try { w[n](); } catch (x) {} }); } catch (x) {} }, 2500); };
        document.body.appendChild(f); setTimeout(function () { f.remove(); res(); }, 14000); }); }
    try { await applyLocal(); } catch (e) {}
    step(DIRS.length + 1, "✓ Terminé. Les données des autres tablettes sont sur celle-ci. Ouvre une appli pour vérifier ; si une donnée manque, attends une minute puis touche 🔄."); }
  /* ✔ Confirmation de réception. Les envois partent « à l'aveugle » (no-cors : la réponse du script n'est pas lisible) ; si le
     script échoue (trop de tablettes en même temps, quota Google…), l'ancien code croyait l'envoi fait. confirmes(cfg, {clé: u})
     demande au script la version qu'il détient et rend {clé: true} pour les envois bien reçus ; null si la question n'a pas
     abouti (réseau) ; "ancien" si le script n'a pas encore cette fonction (ancien comportement : envoi supposé reçu). */
  async function confirmes(cfg, want) {
    var keys = Object.keys(want), ok = {};
    for (var i = 0; i < keys.length; i += 30) {
      var lot = keys.slice(i, i + 30), r = await jsonp(cfg, { chk: JSON.stringify(lot) }, 20000);
      if (!r || !r.keyOk) return null;
      if (!r.chkv || !r.chk) return "ancien";
      lot.forEach(function (k) { if ((+r.chk[k] || 0) >= (+want[k] || 0)) ok[k] = true; });
    }
    return ok;
  }
  async function syncStore(cfg, st) {
    var V = stLd(st.key), pk = Object.keys(V.pend), sent = {};
    if (pk.length) { var recs = [];
      for (var i = 0; i < pk.length; i++) { var it = V.items[pk[i]]; if (!it) continue; sent[pk[i]] = V.pend[pk[i]]; recs.push({ k: st.pre + pk[i], u: V.pend[pk[i]], d: 0, x: await enc(cfg.key, JSON.stringify(it)) }); }
      if (recs.length) await fetch(cfg.url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ key: cfg.key, sync: { dev: "eval", recs: recs } }) });
      await new Promise(function (r) { setTimeout(r, 1200); });
      /* l'attente n'est levée que pour ce que le script confirme avoir reçu ; le reste repart au prochain tour */
      var want = {}, cf = null; Object.keys(sent).forEach(function (k) { want[st.pre + k] = sent[k]; });
      try { cf = recs.length ? await confirmes(cfg, want) : {}; } catch (e) { cf = null; }
      V = stLd(st.key); V.essais = V.essais || {};
      Object.keys(sent).forEach(function (k) { if (V.pend[k] !== sent[k]) return; /* modifié entre-temps : reste en attente */
        if (cf === "ancien" || (cf && cf[st.pre + k])) { delete V.pend[k]; delete V.essais[k]; return; }
        V.essais[k] = (V.essais[k] || 0) + 1; if (V.essais[k] >= ESSAIS_MAX) { delete V.pend[k]; delete V.essais[k]; } });
      pk.forEach(function (k) { if (!V.items[k] && V.pend[k]) { delete V.pend[k]; delete V.essais[k]; } }); /* élément disparu : plus rien à envoyer */
      jsetS(st.key, V); }
    var ch = false;
    if (st.pushOnly) return;
    for (var loop = 0; loop < 20; loop++) {
      V = stLd(st.key); var r = await jsonp(cfg, { pull: 1, since: V.since || 0, pre: st.pre });
      if (!r || !r.keyOk || !r.sync) break;
      var L = r.recs || [];
      for (var j = 0; j < L.length; j++) { var k = String(L[j][1]); if (k.indexOf(st.pre) !== 0 || +L[j][3]) continue; var id = k.slice(st.pre.length);
        try { var o = JSON.parse(await dec(cfg.key, L[j][4])), cur = V.items[id];
          if (V.pend[id] && (!o.u || V.pend[id] >= o.u)) continue;
          if (!cur || (o.u || 0) > (cur.u || 0)) { V.items[id] = o; ch = true; } } catch (e) {} }
      V.since = L.length ? +L[L.length - 1][0] : Math.max(V.since || 0, +r.seq || 0); jsetS(st.key, V);
      if (!r.more) break;
    }
    if (ch && st.onChange) try { st.onChange(); } catch (e) {}
  }
  function jsetS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  /* 📶 retour du réseau : envoi tout de suite (sans attendre le prochain tour) */
  window.addEventListener("online", function () { clearTimeout(timer); timer = setTimeout(sync, 1500); });
  function sched() { clearTimeout(timer); timer = setTimeout(sync, document.visibilityState === "hidden" ? 60000 : 20000); }
  function fire() { try { window.dispatchEvent(new CustomEvent("epsd-change")); } catch (e) {} draw(); }
  function put(it) { it.upd = Date.now(); D.items[it.id] = it; D.pend[it.id] = stamp(); sv(D); fire(); setTimeout(sync, 200); }
  function remove(id) { var it = D.items[id]; if (!it) return; it.del = 1; put(it); }
  window.addEventListener("storage", function (e) { if (e.key === KD) { D = ld(); fire(); } });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") setTimeout(sync, 300); });

  /* -------- listes de classes déjà présentes sur la tablette (toutes applications) -------- */
  function rosters() {
    var R = {};
    function addC(c) { c = String(c || "").trim(); if (!c) return null; var n = norm(c); for (var k in R) if (norm(k) === n) return k; R[c] = []; return c; }
    function addE(c, name) { c = addC(c); name = String(name || "").replace(/\s+/g, " ").trim(); if (!c || !name) return; if (!R[c].some(function (x) { return nkey(x) === nkey(name); })) R[c].push(name); }
    try { var rv = JSON.parse(localStorage.getItem("relais-vitesse-data-v3") || "null"); (rv && rv.classes || []).forEach(function (c) { addC(c.name); (c.eleves || []).forEach(function (e) { addE(c.name, (e.prenom || "") + " " + (e.nom || "")); }); }); } catch (e) {}
    try { (JSON.parse(localStorage.getItem("escalade.cl") || "[]") || []).forEach(function (c) { addC(c.nom); (c.el || []).forEach(function (n) { addE(c.nom, n); }); }); } catch (e) {}
    try { var ac = JSON.parse(localStorage.getItem("acro.cache.v1") || "{}") || {}; (ac.__classes || []).forEach(function (c) { var nm = typeof c === "string" ? c : (c && (c.classe || c.nom || c.name)); addC(nm); (ac["st|" + norm(nm)] || []).forEach(function (s) { addE(nm, (s.prenom || "") + " " + (s.nom || "")); }); }); } catch (e) {}
    all().forEach(function (x) { addE(x.classe, x.nom); });
    return new Promise(function (res) {
      try {
        var q = indexedDB.open("orienrun", 1);
        q.onupgradeneeded = function () { try { q.result.createObjectStore("kv"); } catch (e) {} };
        q.onerror = function () { res(R); };
        q.onsuccess = function () {
          try {
            var g = q.result.transaction("kv").objectStore("kv").get("classes");
            g.onsuccess = function () { var C = g.result || {}; Object.keys(C).forEach(function (c) { addC(c); (C[c] || []).forEach(function (n) { addE(c, n); }); }); res(R); };
            g.onerror = function () { res(R); };
          } catch (e) { res(R); }
        };
      } catch (e) { res(R); }
    });
  }

  /* -------- interface -------- */
  var css = "#epsd-pill{position:fixed;z-index:2147482999;left:calc(64px + env(safe-area-inset-left,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));display:none;align-items:center;gap:6px;height:38px;padding:0 14px;border-radius:999px;border:0;background:#C0392B;color:#fff;font:700 15px system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.25)}" +
    "#epsd-pill.on{display:flex}" +
    "[data-eps-bar]{display:flex;align-items:center;gap:8px;margin-left:auto;flex:none}" +
    "[data-eps-bar] .epsb{position:relative;height:40px;min-width:40px;padding:0 12px;border-radius:10px;border:1.5px solid #3A3F47;background:transparent;color:#D5D8DE;font:700 14px system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}" +
    "[data-eps-bar] .epsb:active{background:#ffffff14}[data-eps-bar] .epsb svg{width:20px;height:20px;flex:none}" +
    "[data-eps-bar] #epsd-pill{position:static;height:40px;border-radius:10px;box-shadow:none;padding:0 12px}" +
    "@media (max-width:620px){[data-eps-bar] .epsb span{display:none}}" +
    ".epsd-ov{position:fixed;inset:0;z-index:2147483001;background:rgba(27,30,36,.55);display:flex;align-items:center;justify-content:center;padding:18px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}" +
    ".epsd-box{background:#fff;color:#1B1E24;border-radius:20px;width:min(720px,100%);max-height:92vh;overflow:auto;padding:22px 24px;box-shadow:0 10px 40px rgba(0,0,0,.3)}" +
    ".epsd-box h3{margin:0 0 6px;font-size:24px;font-weight:900}.epsd-box .m{color:#6A6F78;font-size:15px;margin:0 0 12px}" +
    ".epsd-cls{margin-top:12px;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#6A6F78}" +
    ".epsd-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:#FDF0EE;margin-top:6px;font-size:17px}" +
    ".epsd-row b{flex:1}.epsd-row span{color:#9C2B10;font-weight:700;font-size:15px}.epsd-row small{color:#6A6F78}" +
    ".epsd-row button{border:0;background:#fff;border-radius:10px;width:40px;height:40px;font-size:18px}" +
    ".epsd-chips{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}" +
    ".epsd-chips button{min-height:46px;padding:0 16px;border-radius:999px;border:2px solid #E2DDD2;background:#FBFAF7;font:700 17px system-ui,sans-serif;color:#1B1E24}" +
    ".epsd-chips button.on{border-color:#C0392B;background:#FDF0EE;color:#9C2B10}" +
    ".epsd-in{width:100%;height:48px;border-radius:12px;border:2px solid #E2DDD2;background:#FBFAF7;font:500 17px system-ui,sans-serif;padding:0 12px;color:#1B1E24}" +
    ".epsd-lab{display:block;font-weight:800;font-size:14px;color:#6A6F78;margin:14px 0 6px}" +
    ".epsd-b2{min-height:44px;padding:0 14px;border-radius:12px;border:2px solid #E6E1D6;background:#fff;color:#14171C;font:800 15px system-ui,sans-serif;cursor:pointer}.epsd-b2:active{transform:scale(.98)}" +
    ".epsd-act{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.epsd-act button{height:50px;padding:0 20px;border-radius:14px;border:2px solid #1B1E24;background:#fff;font:800 17px system-ui,sans-serif;color:#1B1E24}" +
    ".epsd-act .p{background:#C0392B;border-color:#C0392B;color:#fff}.epsd-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}" +
    ".epsd-steps{display:flex;gap:8px;margin:4px 0 8px;font-weight:800;font-size:14px;color:#6A6F78}.epsd-steps .on{color:#C0392B}" +
    "@media print{#epsd-pill{display:none!important}}";
  function addCss() { var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }
  var pill = null;
  /* classe affichée dans l'application (facultatif) : window.epsCurrentClass() → {nom, eleves:["Prénom Nom", …]}.
     La pastille compte alors seulement les dispensés de cette classe (même classe, ou élève présent dans sa liste) ; la liste permet de voir tous les autres. */
  function curClass() { try { var c = typeof window.epsCurrentClass === "function" && window.epsCurrentClass(); return c && c.nom ? c : null; } catch (e) { return null; } }
  function inClass(x, cc) { if (x.classe && norm(x.classe) === norm(cc.nom)) return true; var k = nkey(x.nom); return (cc.eleves || []).some(function (e) { return nkey(e) === k; }); }
  function draw() {
    if (!pill) return;
    var all0 = activeOn(), cc = curClass(), n = cc ? all0.filter(function (x) { return inClass(x, cc); }).length : all0.length;
    pill.classList.toggle("on", n > 0 && !HUB && hubTeach()); /* mode enseignant seulement ; classe choisie : ses dispensés uniquement, sinon tous */
    pill.textContent = "🩹 " + n; /* logo + nombre ; le détail est dans l'infobulle et la liste */
    pill.title = n + " élève" + (n > 1 ? "s" : "") + " dispensé" + (n > 1 ? "s" : "") + " aujourd'hui" + (cc ? " (" + cc.nom + ")" : ""); pill.setAttribute("aria-label", pill.title);
    var hc = document.getElementById("epsd-hubcount");
    if (hc) hc.textContent = !hubTeach() ? "Mode enseignant pour voir les dispenses" : n ? n + " élève" + (n > 1 ? "s" : "") + " dispensé" + (n > 1 ? "s" : "") + " aujourd'hui" : "Aucun élève dispensé aujourd'hui";
  }
  function overlay(html) {
    var o = document.createElement("div"); o.className = "epsd-ov"; o.innerHTML = '<div class="epsd-box">' + html + "</div>";
    o.addEventListener("click", function (e) { if (e.target === o || e.target.closest("[data-x]")) o.remove(); });
    document.body.appendChild(o); return o;
  }
  function byClass(L) { var g = {}; L.forEach(function (x) { (g[x.classe || "Sans classe"] = g[x.classe || "Sans classe"] || []).push(x); }); return g; }
  function listHTML(L, admin) {
    if (!L.length) return '<p class="m">Aucun élève.</p>';
    var g = byClass(L), h = "";
    Object.keys(g).sort().forEach(function (c) {
      h += '<div class="epsd-cls">' + esc(c) + "</div>";
      g[c].sort(function (a, b) { return a.nom.localeCompare(b.nom, "fr"); }).forEach(function (x) {
        h += '<div class="epsd-row"><b>' + esc(x.nom) + "</b><span>" + esc(label(x)) + "</span>" + (admin && x.motif ? "<small>" + esc(x.motif) + "</small>" : "") + (admin ? '<button data-del="' + esc(x.id) + '" aria-label="Supprimer">🗑</button>' : "") + "</div>";
      });
    });
    return h;
  }
  /* vue pour tous (dans chaque application) : qui est dispensé, jusqu'à quand — sans le motif */
  function showList(ev, everyone) {
    var up = upcoming().filter(function (x) { return x.du <= addDays(today(), 7); }), cc = everyone === true ? null : curClass();
    if (cc) {
      var A = activeOn(), mine = A.filter(function (x) { return inClass(x, cc); }), upm = up.filter(function (x) { return inClass(x, cc); });
      var o = overlay("<h3>🩹 Dispensés · " + esc(cc.nom) + "</h3><p class=\"m\">Aujourd'hui, " + fmt(today()) + "</p>" + (mine.length ? listHTML(mine, false) : '<p class="m">Aucun élève de cette classe n\'est dispensé aujourd\'hui.</p>') +
        (upm.length ? '<h3 style="font-size:18px;margin-top:18px">Dans les 7 prochains jours</h3>' + listHTML(upm, false) : "") +
        '<div class="epsd-act"><button data-x>Fermer</button>' + (isTeacher() ? '<button id="epsd-mis">🎯 Donner une mission</button>' : "") + '<button class="p" id="epsd-all">Voir tous les dispensés (' + A.length + ")</button></div>");
      o.querySelector("#epsd-all").onclick = function () { o.remove(); showList(null, true); };
      var bm = o.querySelector("#epsd-mis"); if (bm) bm.onclick = function () { location.href = BASE + "espace/?cls=" + encodeURIComponent(cc.nom) + "#missions"; };
      return;
    }
    overlay("<h3>🩹 Élèves dispensés</h3><p class=\"m\">Aujourd'hui, " + fmt(today()) + "</p>" + listHTML(activeOn(), false) +
      (up.length ? '<h3 style="font-size:18px;margin-top:18px">Dans les 7 prochains jours</h3>' + listHTML(up, false) : "") +
      '<div class="epsd-act"><button data-x>Fermer</button></div>');
  }
  function addDays(iso, n) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  /* code enseignant : le même que celui de Relais Vitesse */
  function hashCode(c) { var h = 5381, s = "relais:" + c; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); }
  var unlockedUntil = 0;
  /* mode enseignant : celui de l'application (window.epsIsTeacher), ou celui de la page d'accueil (code enseignant) */
  function hubTeach() { try { return Date.now() < +(localStorage.getItem("eps.teach.until") || 0); } catch (e) { return false; } }
  setInterval(function () { try { draw(); } catch (e) {} }, 2000);
  function isTeacher() { try { if (typeof window.epsIsTeacher === "function" && window.epsIsTeacher()) return true; } catch (e) {} return HUB && hubTeach(); }
  function setHubTeach(on) { try { localStorage.setItem("eps.teach.until", on ? String(Date.now() + (rget().teachMin || 60) * 60000) : "0"); } catch (e) {} applyTeach(); }
  function applyTeach() {
    var t = isTeacher();
    try { placeUpd(); } catch (e) {}
    document.querySelectorAll("[data-eps-teach]").forEach(function (el) { el.style.display = t ? "" : "none"; });
    try { document.documentElement.classList.toggle("eps-teach", !!t); } catch (e) {}
    var b = document.getElementById("eps-teachbtn"); if (b) { b.textContent = innerWidth < 600 ? "🔓 Quitter" : "🔓 Quitter le mode enseignant"; b.title = "Quitter le mode enseignant"; b.style.display = t ? "" : "none"; }
    try { applyReg(); } catch (e) {}
  }
  function askCode() {
    if (Date.now() < unlockedUntil || hubTeach()) return Promise.resolve(true);
    var stored = null; try { stored = JSON.parse(localStorage.getItem("relais-vitesse-code-v1") || "null"); } catch (e) {}
    var pin = window.epsPin || epsPin;
    function done() { unlockedUntil = Date.now() + 10 * 60000; setHubTeach(true); return true; }
    if (stored) return pin({ title: "🔒 Code enseignant", len: 4, check: function (v) { return hashCode(v) === stored; } }).then(function (v) { return v === null ? false : done(); });
    return pin({ title: "🔒 Crée ton code enseignant", text: "4 chiffres, pour toutes les applications.", len: 4 }).then(function (v) {
      if (v === null) return false;
      return pin({ title: "🔒 Confirme le code", text: "Tape le même code une 2e fois.", len: 4, check: function (w) { return w === v || "Les deux codes sont différents."; } }).then(function (w) {
        if (w === null) return false;
        try { localStorage.setItem("relais-vitesse-code-v1", JSON.stringify(hashCode(v))); } catch (e) {}
        return done();
      });
    });
  }

  /* ================= Import d'une liste d'élèves (page d'accueil, mode enseignant) ================= */
  function loadX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise(function (res, rej) { var sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; sc.onload = function () { res(window.XLSX); }; sc.onerror = function () { rej(new Error("x")); }; document.head.appendChild(sc); });
  }
  function readRows(file) {
    var low = file.name.toLowerCase();
    if (/\.(csv|txt)$/.test(low)) return file.arrayBuffer().then(function (b) { var t = new TextDecoder("utf-8").decode(b); if (t.indexOf("�") >= 0) t = new TextDecoder("windows-1252").decode(b); return t.split(/\r?\n/).map(function (l) { return l.split(/[;\t,]/); }); });
    return Promise.all([loadX(), file.arrayBuffer()]).then(function (a) { var wb = a[0].read(a[1], { type: "array" }); return a[0].utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: "" }); });
  }
  function cap(w) { return w.toLowerCase().replace(/(^|[\s'-])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); }); }
  /* « DUPONT Marie » ou « Marie Dupont » → {nom, prenom} */
  function splitFull(t) {
    var w = String(t).replace(/\s+/g, " ").trim().split(" "); if (!w[0]) return null;
    var up = function (x) { return x.length > 1 && x === x.toUpperCase() && x !== x.toLowerCase(); };
    var i = 0; while (i < w.length - 1 && up(w[i])) i++;
    if (i > 0) return { nom: w.slice(0, i).join(" "), prenom: cap(w.slice(i).join(" ")) };
    if (w.length === 1) return { nom: "", prenom: w[0] };
    return { prenom: w[0], nom: w.slice(1).join(" ") };
  }
  function parseList(rows) {
    rows = (rows || []).map(function (r) { return Array.prototype.map.call(r || [], function (v) { return String(v == null ? "" : v).trim(); }); }).filter(function (r) { return r.some(Boolean); });
    var h = -1, iN = -1, iP = -1, iF = -1, iC = -1;
    for (var r = 0; r < Math.min(rows.length, 12) && h < 0; r++) {
      rows[r].forEach(function (c, j) { var n = norm(c);
        if (/^(nom|nom de famille|nom eleve|nom de l eleve)$/.test(n)) iN = j;
        else if (/^prenom/.test(n)) iP = j;
        else if (/^(eleve|eleves|nom prenom|prenom nom|nom et prenom|nom et prenoms|identite|nom complet)$/.test(n)) iF = j;
        else if (/^(classe|division|classe eleve)$/.test(n)) iC = j; });
      if (iN >= 0 || iF >= 0 || iP >= 0) h = r; else iC = -1;
    }
    var out = [], seen = {};
    rows.slice(h + 1).forEach(function (r) {
      var e = null;
      if (iN >= 0 || iP >= 0) { var nm = iN >= 0 ? r[iN] : "", pr = iP >= 0 ? r[iP] : ""; if (nm && !pr && iP < 0) e = splitFull(nm); else if (nm || pr) e = { nom: nm, prenom: pr }; }
      else e = splitFull(iF >= 0 ? r[iF] : r[0]);
      if (!e || !(e.nom || e.prenom) || /^(total|effectif)/i.test(e.nom + e.prenom)) return;
      e.classe = iC >= 0 ? (r[iC] || "") : "";
      var k = nkey(e.prenom + " " + e.nom); if (seen[k]) return; seen[k] = 1; out.push(e);
    });
    return out;
  }
  /* identifiant de classe tiré du nom (même calcul que dans Escalade) : la même classe importée sur plusieurs tablettes a le même identifiant */
  function clsId(n) { var h = 5381, t = String(n).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " "); for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return "n" + (h >>> 0).toString(36); }
  function freeId(list, id) { return list.some(function (x) { return x.id === id; }) ? "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) : id; }
  function full(e) { return (e.prenom + " " + e.nom).replace(/\s+/g, " ").trim(); }
  var TARGETS = [["esc", "Escalade"], ["rel", "Relais Vitesse"], ["ori", "OrienRun"], ["vol", "Volley-ball"], ["bad", "Badminton"], ["dan", "Danse"], ["acro", "Acrosport"]];
  /* Danse (évaluation CA3) : localStorage « danse-eps-v1 » = {classes:[{id,nom,eleves:[{id,nom,prenom,groupeId,ev,comm,statut}],groupes}], classeId, …} (grille et réglages créés par l'application) */
  function toDan(cl, L) {
    var D = jget("danse-eps-v1", null); if (!D || typeof D !== "object") D = { classes: [] };
    D.classes = (D.classes || []).filter(function (c) { return !(c.nom === "Ma classe" && !(c.eleves || []).length); });
    var c = D.classes.filter(function (x) { return norm(x.nom) === norm(cl); })[0], n = 0;
    if (!c) { c = { id: freeId(D.classes, clsId(cl)), nom: cl, eleves: [], groupes: [] }; D.classes.push(c); }
    L.forEach(function (e) { if (c.eleves.some(function (x) { return nkey(x.prenom + " " + x.nom) === nkey(e.prenom + " " + e.nom); })) return;
      c.eleves.push({ id: "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nom: e.nom, prenom: e.prenom, groupeId: "", ev: {}, comm: "", statut: "" }); n++; });
    D.classeId = c.id; localStorage.setItem("danse-eps-v1", JSON.stringify(D)); return n;
  }
  /* Volley-ball (évaluation) : localStorage « eps_volley_eval_v1 » = {bareme, classes:[{id,nom,eleves:[{id,nom,prenom,ev,choix,statut,comment}]}], cur} (le barème est créé par l'application) */
  function h32v(t) { var h = 5381; t = String(t); for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); } /* même identifiant d'élève que dans l'appli Volley */
  function toVol(cl, L) {
    var V = jget("eps_volley_eval_v1", null); if (!V || typeof V !== "object") V = { classes: [], cur: 0 };
    V.classes = (V.classes || []).filter(function (c) { return !(c.nom === "Ma classe" && !(c.eleves || []).length); });
    var c = V.classes.filter(function (x) { return norm(x.nom) === norm(cl); })[0], n = 0;
    if (!c) { c = { id: freeId(V.classes, clsId(cl)), nom: cl, eleves: [] }; V.classes.push(c); }
    L.forEach(function (e) { if (c.eleves.some(function (x) { return nkey(x.prenom + " " + x.nom) === nkey(e.prenom + " " + e.nom); })) return;
      c.eleves.push({ id: "e" + h32v(nkey(e.prenom + " " + e.nom) + "|" + c.id), nom: e.nom, prenom: e.prenom, ev: {}, choix: "4-4", statut: "", comment: "" }); n++; });
    c.eleves.sort(function (a, b) { return (a.nom + " " + a.prenom).localeCompare(b.nom + " " + b.prenom, "fr"); });
    V.cur = V.classes.indexOf(c); localStorage.setItem("eps_volley_eval_v1", JSON.stringify(V)); return n;
  }
  /* Badminton : localStorage « eps_badminton_v1 » = {voie, prof, tech, presets, classes:[{id,nom,voie,eleves:[{id,nom,prenom,ev,choix,statut,comment,rout}],matchs,poules}], cur} (grilles, séquence et situations créées par l'application) */
  function toBad(cl, L) {
    var V = jget("eps_badminton_v1", null); if (!V || typeof V !== "object") V = { classes: [], cur: 0 };
    V.classes = (V.classes || []).filter(function (c) { return !(c.nom === "Ma classe" && !(c.eleves || []).length && !Object.keys(c.matchs || {}).length); });
    var voie = V.voie === "pro" ? "pro" : "gt";
    var c = V.classes.filter(function (x) { return norm(x.nom) === norm(cl); })[0], n = 0;
    if (!c) { c = { id: freeId(V.classes, clsId(cl)), nom: cl, voie: window.epsVoie ? epsVoie(cl) : voie, eleves: [], matchs: {}, poules: {} }; V.classes.push(c); }
    L.forEach(function (e) { if (c.eleves.some(function (x) { return nkey(x.prenom + " " + x.nom) === nkey(e.prenom + " " + e.nom); })) return;
      c.eleves.push({ id: "e" + h32v(nkey(e.prenom + " " + e.nom) + "|" + c.id), nom: e.nom, prenom: e.prenom, ev: {}, choix: "4-4", statut: "", comment: "", rout: {} }); n++; });
    c.eleves.sort(function (a, b) { return (a.nom + " " + a.prenom).localeCompare(b.nom + " " + b.prenom, "fr"); });
    V.voie = c.voie || voie; V.cur = V.classes.indexOf(c); localStorage.setItem("eps_badminton_v1", JSON.stringify(V)); return n;
  }
  function toEsc(cl, L) {
    var a = []; try { a = JSON.parse(localStorage.getItem("escalade.cl") || "[]") || []; } catch (e) {}
    var c = a.filter(function (x) { return norm(x.nom) === norm(cl); })[0], n = 0;
    if (!c) { c = { id: freeId(a, clsId(cl)), nom: cl, el: [] }; a.push(c); }
    L.forEach(function (e) { var f = full(e); if (!c.el.some(function (x) { return nkey(x) === nkey(f); })) { c.el.push(f); n++; } });
    localStorage.setItem("escalade.cl", JSON.stringify(a)); return n;
  }
  function toRel(cl, L) {
    var D = null; try { D = JSON.parse(localStorage.getItem("relais-vitesse-data-v3") || "null"); } catch (e) {}
    if (!D || !D.classes) D = { classes: [], cur: null };
    var c = D.classes.filter(function (x) { return norm(x.name) === norm(cl); })[0], n = 0;
    if (!c) { c = { id: freeId(D.classes, clsId(cl)), name: cl, eleves: [], groupes: [], courses: [], lecons: [], curg: "all" }; D.classes.push(c); }
    var id = Math.max.apply(null, [-1].concat(c.eleves.map(function (e) { return +e.id || 0; }))) + 1;
    L.forEach(function (e) { if (c.eleves.some(function (x) { return norm(x.nom) === norm(e.nom) && norm(x.prenom) === norm(e.prenom); })) return;
      c.eleves.push({ id: id++, nom: e.nom, prenom: e.prenom, ea: [null, null, null], ma: 0, el: [null, null, null], ml: 0, orig: { ea: [null, null, null], ma: 0, el: [null, null, null], ml: 0 }, imported: true }); n++; });
    if (!D.cur) D.cur = c.id;
    localStorage.setItem("relais-vitesse-data-v3", JSON.stringify(D)); return n;
  }
  function toOri(cl, L) {
    return new Promise(function (res, rej) {
      var q = indexedDB.open("orienrun", 1);
      q.onupgradeneeded = function () { try { q.result.createObjectStore("kv"); } catch (e) {} };
      q.onerror = function () { rej(q.error); };
      q.onsuccess = function () {
        var db = q.result, st = db.transaction("kv", "readwrite").objectStore("kv"), g = st.get("classes");
        g.onsuccess = function () {
          var C = g.result || {}, key = Object.keys(C).filter(function (k) { return norm(k) === norm(cl); })[0] || cl, A = C[key] || [], n = 0;
          L.forEach(function (e) { var f = full(e); if (!A.some(function (x) { return nkey(x) === nkey(f); })) { A.push(f); n++; } });
          C[key] = A; var p = st.put(C, "classes"); p.onsuccess = function () { res(n); }; p.onerror = function () { rej(p.error); };
        };
        g.onerror = function () { rej(g.error); };
      };
    });
  }
  var ACRO_API = "https://script.google.com/macros/s/AKfycbzCW8b2vq-REokxUCdkbKyHf_nHJf4khfcCueu1AKKGlJVAiiSsiB7I-beOmjsUpE25Qg/exec";
  async function toAcro(cl, L) {
    var prof = {}; try { prof = JSON.parse(localStorage.getItem("acro.prof.v1") || "{}") || {}; } catch (e) {}
    var url = (prof.api || ACRO_API).trim(), code = "";
    try { var m = JSON.parse(localStorage.getItem("acro.codes.v1") || "{}") || {}; Object.keys(m).forEach(function (k) { if (norm(k) === norm(cl)) code = m[k]; }); } catch (e) {}
    var pw = await (window.epsPin || epsPin)({ title: "🔒 Mot de passe enseignant d'Acrosport", text: "Touche ABC pour les lettres.", min: 1, letters: true,
      check: async function (v) {
        try { var r = await fetch(url, { method: "POST", body: JSON.stringify({ action: "teacherCheck", teacher: v }), redirect: "follow" }); var j = await r.json(); return j.ok ? true : "Mot de passe incorrect."; }
        catch (e) { return "Pas de connexion internet."; } } });
    if (pw === null) throw new Error("annulé");
    var r = await fetch(url, { method: "POST", body: JSON.stringify({ action: "teacherSetStudents", teacher: pw, classe: cl, code: code, students: L.map(function (e) { return { nom: e.nom, prenom: e.prenom, classe: e.classe || "" }; }) }), redirect: "follow" });
    var j = await r.json(); if (!j.ok) throw new Error(j.error || "erreur");
    return j.count;
  }

  /* ================= Modifier les listes (page d'accueil) : renommer une classe, corriger ses élèves dans les applications ================= */
  function oriGet() {
    return new Promise(function (res) {
      try { var q = indexedDB.open("orienrun", 1); q.onupgradeneeded = function () { try { q.result.createObjectStore("kv"); } catch (e) {} };
        q.onerror = function () { res({}); };
        q.onsuccess = function () { try { var g = q.result.transaction("kv").objectStore("kv").get("classes"); g.onsuccess = function () { res(g.result || {}); }; g.onerror = function () { res({}); }; } catch (e) { res({}); } };
      } catch (e) { res({}); }
    });
  }
  function oriPut(C) {
    return new Promise(function (res, rej) { var q = indexedDB.open("orienrun", 1); q.onupgradeneeded = function () { try { q.result.createObjectStore("kv"); } catch (e) {} };
      q.onerror = function () { rej(q.error); }; q.onsuccess = function () { var p = q.result.transaction("kv", "readwrite").objectStore("kv").put(C, "classes"); p.onsuccess = function () { res(); }; p.onerror = function () { rej(p.error); }; }; });
  }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  async function allLists() {
    var M = {}, put = function (app, name, list) { var k = norm(name); if (!k) return; var x = M[k] || (M[k] = { name: name, apps: {} }); x.apps[app] = list; };
    (jget("escalade.cl", []) || []).forEach(function (c) { put("esc", c.nom, (c.el || []).slice()); });
    ((jget("relais-vitesse-data-v3", {}) || {}).classes || []).forEach(function (c) { put("rel", c.name, (c.eleves || []).map(full)); });
    var O = await oriGet(); Object.keys(O).forEach(function (k) { put("ori", k, (O[k] || []).slice()); });
    [["vol", "eps_volley_eval_v1"], ["bad", "eps_badminton_v1"], ["dan", "danse-eps-v1"]].forEach(function (a) {
      ((jget(a[1], {}) || {}).classes || []).forEach(function (c) { if (c.nom === "Ma classe" && !(c.eleves || []).length) return; put(a[0], c.nom, (c.eleves || []).map(full)); }); });
    /* Acrosport : classes de son Google Sheet (cache de la tablette) */
    try { var ac = jget("acro.cache.v1", {}) || {}; (ac.__classes || []).forEach(function (c) { var nm = typeof c === "string" ? c : (c && (c.classe || c.nom || c.name)); if (!nm) return;
      put("acro", nm, (ac["st|" + norm(nm)] || []).map(function (x) { return full({ prenom: x.prenom || "", nom: x.nom || "" }); })); }); } catch (e) {}
    /* listes communes : classes importées sur les autres tablettes ou dans une appli pas encore ouverte ici */
    try { if (window.EPSL) EPSL.items().forEach(function (o) { var k = norm(o.nom), x = M[k] || (o.old && M[norm(o.old)]); if (x && !M[k]) { M[k] = x; delete M[norm(o.old)]; x.name = o.nom; }
      put("com", o.nom, (o.el || []).slice()); }); } catch (e) {}
    return M;
  }
  /* après un import ou une modification ici : la liste finale part vers les autres tablettes */
  async function shareList(nom, old, apps, exact, off) {
    var M = await allLists(), x = M[norm(nom)]; if (!x && !exact) return;
    var names = exact ? exact.slice() : [];
    if (!exact) Object.keys(x.apps).forEach(function (a) { if (apps[a]) x.apps[a].forEach(function (n) { if (!names.some(function (y) { return nkey(y) === nkey(n); })) names.push(n); }); });
    var L = lld(), it = null;
    Object.keys(L.items).forEach(function (k) { var o = L.items[k]; if (o && !o.del && (norm(o.nom) === norm(old || nom) || norm(o.nom) === norm(nom))) it = it || o; });
    if (!it) { it = { id: clsId(nom), nom: nom, el: [], st: {}, rm: [] }; L.items[it.id] = it; }
    var keep = {}; names.forEach(function (n) { keep[nkey(n)] = 1; });
    it.rm = (it.rm || []).filter(function (k) { return !keep[k]; });
    if (exact) (it.el || []).forEach(function (n) { var k = nkey(n); if (!keep[k] && it.rm.indexOf(k) < 0) { it.rm.push(k); if (!it.demo) trKeep({ type: "Élève", label: n, sub: it.nom, el: { lid: it.id, nom: n } }); /* 🗑 corbeille */ } });
    else (it.el || []).forEach(function (n) { if (!keep[nkey(n)]) { names.push(n); keep[nkey(n)] = 1; } });
    it.old = old && norm(old) !== norm(nom) ? old : ""; it.nom = nom; it.el = names; it.ts = Date.now(); it.del = false;
    if (off) { it.off = off.slice(); it.man = 1; } /* activités choisies à la main : l'emploi du temps ne les change plus */
    L.pend[it.id] = stamp(); L.app[it.id] = JSON.stringify(it); lsv(L);
    applyLocal(); setTimeout(sync, 300);
  }
  /* activités des classes déduites de l'emploi du temps (appli EDT, enseignant choisi dans « Qui es-tu ? » ou nom de l'enseignant des réglages).
     Une classe dont les activités ont été choisies à la main dans Réglages (it.man) n'est jamais modifiée. */
  function actCode(a) { a = norm(a); if (/escalad/.test(a)) return "esc"; if (/relais|vitesse/.test(a)) return "rel"; if (/orientation|^co$|^co /.test(a)) return "ori"; if (/volley/.test(a)) return "vol"; if (/badminton|^bad/.test(a)) return "bad"; if (/danse/.test(a)) return "dan"; if (/acro/.test(a)) return "acro"; if (/basket/.test(a)) return "bk"; if (/cross|^ct$/.test(a)) return "ct"; if (/^step/.test(a)) return "step"; return null; }
  function cmp(x) { return norm(x).replace(/ /g, ""); }
  function edtActs() {
    var D = (eget() || {}).data; if (!D || !D.R || !D.T) return null;
    var moi = null; try { moi = localStorage.getItem("eps.edt.moi"); } catch (e) {}
    if (!moi) { var prof = String(rget().prof || "").toLowerCase(); D.T.forEach(function (t) { if (!moi && prof && prof.indexOf(String(t[0]).toLowerCase()) >= 0) moi = t[0]; }); }
    var ti = D.T.map(function (t) { return t[0]; }).indexOf(moi); if (ti < 0) return { moi: null, map: {} };
    var out = {};
    D.R.forEach(function (r) { if (r[3] !== ti) return; String(r[6] || "").split(",").forEach(function (t) { if (!t || /^[scou]$/.test(t)) return; var c = actCode((D.acts || [])[+t.split("~")[0].split(".")[0]]); if (c) (out[r[4]] = out[r[4]] || {})[c] = 1; }); });
    return { moi: moi, map: out };
  }

  /* créneaux de l'emploi du temps (appli EDT) d'un enseignant : prochains cours d'une classe (ou de toutes) pour une activité.
     → [{at, end, cls, act}] triés, ou null s'il n'y a pas d'emploi du temps sur la tablette. Vacances et jours fériés exclus. */
  function edtMe(D) {
    var moi = null; try { moi = localStorage.getItem("eps.edt.moi"); } catch (e) {}
    if (!moi) { var prof = String(rget().prof || "").toLowerCase(); D.T.forEach(function (t) { if (!moi && prof && prof.indexOf(String(t[0]).toLowerCase()) >= 0) moi = t[0]; }); }
    return D.T.map(function (t) { return t[0]; }).indexOf(moi);
  }
  function clsMatch(edtName, nom) { if (!nom) return true; var parts = [edtName].concat(String(edtName).split(/[\/+,&]| et /)); return parts.some(function (p) { return p.trim() && cmp(p) === cmp(nom); }); }
  function edtSlots(nom, act, from, max) {
    var D = (eget() || {}).data; if (!D || !D.R || !D.T || !D.w) return null;
    var ti = edtMe(D), out = []; from = from || Date.now();
    D.R.forEach(function (r) {
      if (ti >= 0 && r[3] !== ti) return; if (!clsMatch(r[4], nom)) return;
      var cells = String(r[6] || "").split(",");
      for (var w = 0; w < D.w.length; w++) {
        if ((D.vac || []).indexOf(w) >= 0 || (D.fer || []).some(function (x) { return x[0] === r[0] && x[1] === w; })) continue;
        var t = cells[w]; if (!t || /^[scou]$/.test(t)) continue;
        var a = actCode((D.acts || [])[+t.split("~")[0].split(".")[0]]); if (act && a !== act) continue;
        var d = new Date(D.w[w] + "T00:00:00"); d.setDate(d.getDate() + (+r[0] || 0)); d.setHours(Math.floor(r[1]), Math.round((r[1] % 1) * 60), 0, 0);
        if (d.getTime() + (r[2] - r[1]) * 3600e3 < from) continue;
        out.push({ at: d.getTime(), end: d.getTime() + (r[2] - r[1]) * 3600e3, cls: r[4], act: a });
      }
    });
    out.sort(function (a, b) { return a.at - b.at; }); return out.slice(0, max || 40);
  }

  /* ✅ « Tout est prêt ? » : contrôle avant la leçon, commun à toutes les applis (onglet Séquence).
     L'appli peut ajouter ses propres vérifications : window.epsCheck(classe, heure) → [{ok:true|false|null, t, d, fix:{label, go}}] */
  var CK_APP = { escalade: "esc", relais: "rel", volley: "vol", badminton: "bad", danse: "dan", acrosport: "acro", orientation: "ori", crosstraining: "ct", basket: "bk", step: "step", ccf: null };
  function check() {
    var dir = (location.pathname.match(/\/eps-autonomie-numerique\/([^\/]+)\//) || [])[1] || "", code = CK_APP[dir];
    var o = overlay('<h3>✅ Tout est prêt pour la leçon ?</h3><div id="epsd-ck"><p class="m">Vérification…</p></div><div class="epsd-act"><button data-x>Fermer</button><button id="epsd-ckr">↻ Revérifier</button></div>');
    o.querySelector("#epsd-ckr").onclick = function () { run(); };
    var FIX = [];
    function line(ok, t, d, fix) { var i = fix ? FIX.push(fix) - 1 : -1;
      return '<div style="display:flex;gap:12px;align-items:flex-start;padding:9px 0;border-top:1px solid #E6E1D6"><span style="font-size:20px;width:26px;text-align:center;color:' + (ok === true ? "#2E7D4F" : ok === false ? "#C0392B" : "#6A6F78") + '">' + (ok === true ? "✓" : ok === false ? "⚠" : "○") + '</span><div style="flex:1"><b>' + esc(t) + "</b>" + (d ? '<div class="m" style="margin:2px 0 0">' + esc(d) + "</div>" : "") + "</div>" + (i >= 0 ? '<button data-ckfix="' + i + '" style="white-space:nowrap;min-height:40px;padding:0 12px;border:1.5px solid #E6E1D6;border-radius:10px;background:#fff;font:700 14px system-ui;cursor:pointer">' + esc(fix.label) + "</button>" : "") + "</div>"; }
    function hh(t) { var d = new Date(t); return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
    function run() {
      FIX = []; var box = o.querySelector("#epsd-ck"), h = "", cc = null; try { cc = window.epsCurrentClass && window.epsCurrentClass(); } catch (e) {}
      var S = code ? edtSlots(null, code, Date.now() - 45 * 60e3, 1) : null, next = S && S[0], cls = next ? next.cls : (cc && cc.nom) || "", at = next ? next.at : null;
      if (S === null) h += line(null, "Pas d'emploi du temps sur cette tablette", "Ouvre l'appli EDT en mode enseignant et choisis ton prénom : l'appli saura quel est ton prochain cours.");
      else if (!next) h += line(null, "Aucun cours à venir dans l'emploi du temps pour cette activité", cc && cc.nom ? "Vérifications faites pour la classe choisie : " + cc.nom + "." : "");
      else h += line(true, "Prochain cours : " + next.cls, hh(next.at) + (next.at <= Date.now() ? " (en cours)" : ""));
      if (window.EPSLC && cls) { var p = EPSLC.nextProg(cls), n = EPSLC.count(cls);
        if (p && (!at || Math.abs(p.at - at) < 3 * 3600e3)) h += line(true, "Fiche de leçon programmée", p.titre + " · " + hh(p.at) + " : elle s'ouvrira toute seule sur les tablettes.");
        else if (n) h += line(false, "Aucune fiche de leçon programmée pour ce cours", n + " fiche(s) validée(s) disponible(s).", { label: "📅 Programmer", go: function () { o.remove(); EPSLC.open("lec"); } });
        else h += line(null, "Pas de fiche de leçon pour cette classe", "Facultatif : les fiches s'affichent sur les tablettes élèves.", { label: "📝 Fiches", go: function () { o.remove(); EPSLC.open("lec"); } }); }
      if (cls) { var day = at ? new Date(at - new Date(at).getTimezoneOffset() * 6e4).toISOString().slice(0, 10) : today(), dl = activeOn(day).filter(function (x) { return !x.classe || norm(x.classe) === norm(cls) || clsMatch(cls, x.classe); });
        h += line(null, dl.length ? dl.length + " dispensé(s) ce jour-là" : "Aucun dispensé saisi pour ce jour-là", dl.map(function (x) { return x.nom; }).join(", "), { label: "🩹 Dispenses", go: function () { o.remove(); try { manage(); } catch (e) {} } }); }
      if (cls) { var vo = window.epsVoie ? epsVoie(cls) : "";
        if (vo) h += line(null, (vo === "pro" ? "🛠 Voie professionnelle" : "🎓 Voie générale et technologique") + " : " + cls, vo === "pro" ? "Textes AFLP, barème CCF Bac pro, grille de la voie pro." : "Textes AFL, barème du bac général, grille de la voie générale.");
        var apd = abGet(cls), nP = 0; try { EPSL.items().forEach(function (it) { if (norm(it.nom) === norm(cls)) nP = EPSL.people(it).length; }); } catch (e) {}
        if (!at || new Date(at).toDateString() === new Date().toDateString()) h += apd ? line(true, "Appel fait : " + (nP - (apd.abs || []).length) + " présent(s)" + ((apd.abs || []).length ? ", absent(s) : " + apd.abs.join(", ") : ""), "Groupes, matériel et évaluations ne comptent que les présents.") : line(null, "Appel pas encore fait", "À faire au début de la leçon (📡 Leçon en cours) : groupes, matériel et évaluations s'adaptent aux présents.", window.EPSLC ? { label: "🙋 Faire l'appel", go: function () { o.remove(); EPSLC.open("live", cls); } } : null); }
      var TW = tabsWaiting(); if (TW.length) h += line(false, TW.length + " tablette(s) avec des données pas encore envoyées", TW.map(function (x) { return tabName(x) + " (" + x.pend + ", vue " + ago(x.at) + ")"; }).join(" ; ") + ". Allume-les avec le Wi-Fi et ouvre l'appli.", { label: "📱 Tablettes", go: function () { o.remove(); tablets(); } });
      var app = []; try { if (window.epsCheck) app = window.epsCheck(cls, at) || []; } catch (e) { app = [{ ok: false, t: "Vérification de l'appli impossible", d: String(e && e.message || e) }]; }
      app.forEach(function (x) { h += line(x.ok, x.t, x.d, x.fix ? { label: x.fix.label, go: function () { o.remove(); x.fix.go(); } } : null); });
      h += line(navigator.onLine !== false, navigator.onLine !== false ? "Connexion Internet" : "Pas de connexion Internet", navigator.onLine !== false ? "" : "Les données seront envoyées au retour de la connexion.");
      var cfg = shCfg(), p0 = cfg ? nPend() : 0;
      if (!cfg) h += line(false, "Partage entre tablettes non réglé", "Sans lui, chaque tablette garde ses données pour elle.", { label: "Régler", go: function () { o.remove(); try { shareSettings(); } catch (e) {} } });
      else h += line(!p0, p0 ? p0 + " modification(s) pas encore envoyée(s)" : "Toutes les données de cette tablette sont envoyées", lastOk ? "Dernier échange à " + new Date(lastOk).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "", p0 ? { label: "Envoyer", go: function () { sync(); setTimeout(run, 3000); } } : null) + '<div id="epsd-ckscript">' + line(null, "Script commun : vérification…", "") + "</div>";
      box.innerHTML = h;
      box.querySelectorAll("[data-ckfix]").forEach(function (b) { b.onclick = function () { FIX[+b.dataset.ckfix].go(); }; });
      if (cfg) jsonp(cfg, {}, 12000).then(function (r) { var el = o.querySelector("#epsd-ckscript"); if (!el) return; var t = "";
        if (!r) t = line(false, "Le script commun ne répond pas", "Vérifie la connexion ; sinon, dans le script : Déployer > Gérer les déploiements, accès « Tout le monde ».");
        else if (!r.keyOk) t = line(false, "Le script refuse la clé du partage", "La clé de cette tablette doit être celle de Code.gs (SECRET).");
        else { t = line(!(r.aiv < 2) && "aiv" in r, "aiv" in r && r.aiv >= 2 ? "Script commun à jour" : "Script commun à mettre à jour", "aiv" in r && r.aiv >= 2 ? "" : "Colle le dernier Code.gs (dossier apps-script) puis Déployer > Nouvelle version.");
          var b = r.sauv ? Math.floor((Date.now() - new Date(r.sauv).getTime()) / 864e5) : null;
          t += line(b != null && b <= 9, b == null ? "Pas de sauvegarde Drive" : "Sauvegarde Drive il y a " + b + " jour(s)", b == null || b > 9 ? "Dans le script, exécute une fois « installerSauvegarde » : une copie chaque semaine." : ""); }
        el.innerHTML = t; });
    }
    run();
  }
  function edtApply() {
    var E = edtActs(); if (!E || !E.moi) return { n: 0, moi: E && E.moi, edt: !!E };
    var ALL = ["esc", "rel", "ori", "vol", "bad", "dan", "acro", "ct"].concat(Object.keys(E.map).some(function (c) { return E.map[c].bk; }) ? ["bk"] : []) /* basket : seulement si l'emploi du temps en contient */.concat(Object.keys(E.map).some(function (c) { return E.map[c].step; }) ? ["step"] : []) /* step : même règle */, L = lld(), n = 0;
    Object.keys(L.items).forEach(function (k) { var it = L.items[k]; if (!it || it.del || it.man || !it.nom) return;
      var S = {}; Object.keys(E.map).forEach(function (c) { var parts = [c].concat(String(c).split(/[\/+,&]| et /)); if (parts.some(function (p) { return p.trim() && cmp(p) === cmp(it.nom); })) Object.keys(E.map[c]).forEach(function (a) { S[a] = 1; }); });
      if (!Object.keys(S).length) return;
      var off = ALL.filter(function (a) { return !S[a]; }); if (JSON.stringify(off) === JSON.stringify(it.off || [])) return;
      it.off = off; it.ts = Date.now(); L.pend[it.id] = stamp(); L.app[it.id] = JSON.stringify(it); n++; });
    if (n) { lsv(L); try { applyLocal(); } catch (e) {} setTimeout(sync, 300); }
    return { n: n, moi: E.moi, edt: true };
  }
  /* suppression d'une liste commune (partout) : la classe disparaît des applis où elle n'a pas encore de données */
  async function deleteList(nom) {
    var L = lld(), it = null;
    Object.keys(L.items).forEach(function (k) { var o = L.items[k]; if (o && !o.del && (norm(o.nom) === norm(nom) || (o.old && norm(o.old) === norm(nom)))) it = it || o; });
    if (!it) { it = { id: clsId(nom), nom: nom, el: [], st: {}, rm: [] }; L.items[it.id] = it; }
    else if (!it.del && !it.demo) trKeep({ type: "Classe", label: it.nom, sub: (it.el || []).length + " élèves", lst: JSON.parse(JSON.stringify(it)) });   /* 🗑 corbeille */
    it.del = true; it.ts = Date.now(); L.pend[it.id] = stamp(); L.app[it.id] = JSON.stringify(it); lsv(L);
    try { var A = jget("escalade.cl", []) || []; localStorage.setItem("escalade.cl", JSON.stringify(A.filter(function (c) { return norm(c.nom) !== norm(nom); }))); } catch (e) {}
    try { var O = await oriGet(); Object.keys(O).forEach(function (k) { if (norm(k) === norm(nom)) delete O[k]; }); await oriPut(O); } catch (e) {}
    await applyLocal(); setTimeout(sync, 300);
  }
  /* page d'accueil (aucune appli ouverte) : les listes communes sont écrites dans toutes les applis de la tablette ;
     dans une appli : seulement OrienRun (IndexedDB) ici, l'appli elle-même les reçoit à sa prochaine ouverture (eps-lists.js) */
  async function applyLocal() {
    if (!window.EPSL) return;
    if (HUB) ["esc", "rel", "vol", "bad", "dan"].forEach(function (a) { try { if (localStorage.getItem({ esc: "escalade.cl", rel: "relais-vitesse-data-v3", vol: "eps_volley_eval_v1", bad: "eps_badminton_v1", dan: "danse-eps-v1" }[a]) != null) EPSL.apply(a); } catch (e) {} });
    else if (EPSL.app) { /* appli ouverte : ses données sont enregistrées, la liste est ajoutée, puis l'appli se recharge (mise à jour en direct) */
      var H = window.epsListsHook, ch = false;
      try { if (H && H.save) H.save(); } catch (e) {}
      try { ch = EPSL.apply(EPSL.app); } catch (e) {}
      if (ch) { if (H && H.reload) { try { H.reload(); } catch (e) {} } else try { window.dispatchEvent(new CustomEvent("eps-lists")); } catch (e) {} }
    }
    else if (window.epsListsHook && window.epsListsHook.reload) { try { window.epsListsHook.reload(); } catch (e) {} } /* Acrosport, OrienRun… */
    try { /* OrienRun */
      var O = await oriGet(), ch = false, V = JSON.parse(localStorage.getItem(KL) || "{}"), skip = V.skip || {};
      Object.keys(V.items || {}).map(function (k) { return V.items[k]; }).filter(function (o) { return o && o.nom && (o.del || (o.off || []).indexOf("ori") >= 0); }).forEach(function (o) {
        Object.keys(O).forEach(function (k) { if (norm(k) === norm(o.nom)) { delete O[k]; ch = true; } }); });
      EPSL.items().forEach(function (o) {
        if (skip["ori|" + norm(o.nom)] || (o.off || []).indexOf("ori") >= 0) return;
        var key = Object.keys(O).filter(function (k) { return norm(k) === norm(o.nom) || (o.old && norm(k) === norm(o.old)); })[0];
        if (key && key !== o.nom) { O[o.nom] = O[key]; delete O[key]; ch = true; }
        if (!key && !Object.keys(O).length && !/\/orientation\//.test(location.pathname) && !HUB) return;
        var A = O[o.nom] || (O[o.nom] = []), have = {}; A.forEach(function (n) { have[nkey(n)] = 1; }); if (!key) ch = true;
        (o.el || []).forEach(function (n) { if (!have[nkey(n)]) { A.push(n); have[nkey(n)] = 1; ch = true; } });
        (o.rm || []).forEach(function (k) { if (have[k]) { O[o.nom] = A = A.filter(function (n) { return nkey(n) !== k; }); ch = true; } });
      });
      if (ch) await oriPut(O);
    } catch (e) {}
  }
  /* ce qui a été importé ou modifié dans une appli de cette tablette → listes communes (puis autres tablettes) */
  async function collectLists() {
    if (!window.EPSL) return;
    var O = await oriGet(), ex = { ori: Object.keys(O).map(function (k) { return { nom: k, ppl: (O[k] || []).map(function (n) { return { full: n }; }) }; }) };
    try { var ac = JSON.parse(localStorage.getItem("acro.cache.v1") || "{}") || {}; /* Acrosport : listes de son Google Sheet (cache de la tablette) */
      ex.acro = (ac.__classes || []).map(function (c) { var nm = typeof c === "string" ? c : (c && (c.classe || c.nom || c.name)); var st = ac["st|" + norm(nm)];
        return st && st.length ? { nom: nm, ppl: st.map(function (x) { return { full: full({ prenom: x.prenom || "", nom: x.nom || "" }), prenom: x.prenom || "", nom: x.nom || "" }; }) } : null; }).filter(Boolean); } catch (e) {}
    var n = 0; try { n = EPSL.collect(ex); } catch (e) {}
    if (n) { if (HUB) applyLocal(); clearTimeout(timer); timer = setTimeout(sync, 1500); }
  }
  /* liste reçue : même nom (ou ancien nom) → la classe prend exactement cette liste */
  async function applyList(o) {
    var L = o.el || [], nn = o.nom, old = o.old || o.nom, same = function (y) { return norm(y) === norm(nn) || norm(y) === norm(old); };
    if (o.apps.esc) {
      var A = jget("escalade.cl", []) || [], c = A.filter(function (y) { return same(y.nom); })[0];
      if (!c) { c = { id: freeId(A, clsId(nn)), nom: nn, el: [] }; A.push(c); }
      if (c.nom !== nn) { var R = jget("escalade.r", []) || []; R.forEach(function (r) { if ((r.cl || "") === c.nom) r.cl = nn; }); localStorage.setItem("escalade.r", JSON.stringify(R)); }
      c.nom = nn; c.el = L.slice(); localStorage.setItem("escalade.cl", JSON.stringify(A));
    }
    if (o.apps.rel) {
      var D2 = jget("relais-vitesse-data-v3", null); if (!D2 || !D2.classes) D2 = { classes: [], cur: null };
      var k = D2.classes.filter(function (y) { return same(y.name); })[0];
      if (!k) { k = { id: freeId(D2.classes, clsId(nn)), name: nn, eleves: [], groupes: [], courses: [], lecons: [], curg: "all" }; D2.classes.push(k); }
      var id2 = Math.max.apply(null, [-1].concat(k.eleves.map(function (e) { return +e.id || 0; }))) + 1;
      k.eleves = L.map(function (l) { var e = k.eleves.filter(function (y) { return nkey(full(y)) === nkey(l); })[0]; if (e) return e; var p = splitFull(l) || { prenom: l, nom: "" };
        return { id: id2++, nom: p.nom, prenom: p.prenom, ea: [null, null, null], ma: 0, el: [null, null, null], ml: 0, orig: { ea: [null, null, null], ma: 0, el: [null, null, null], ml: 0 }, imported: true }; });
      k.name = nn; if (!D2.cur) D2.cur = k.id; localStorage.setItem("relais-vitesse-data-v3", JSON.stringify(D2));
    }
    if (o.apps.ori) { var O = await oriGet(); Object.keys(O).forEach(function (kk) { if (same(kk)) delete O[kk]; }); O[nn] = L.slice(); await oriPut(O); }
  }
  async function editLists() {
    if (!(await askCode())) return;
    var o = overlay('<div id="epsl"></div>'), box = o.querySelector("#epsl"), M = await allLists(), cur = null;
    var APPS = [["esc", "Escalade"], ["rel", "Relais Vitesse"], ["ori", "OrienRun"], ["vol", "Volley-ball"], ["bad", "Badminton"], ["dan", "Danse"], ["acro", "Acrosport"], ["bk", "Basket-ball"], ["ct", "Cross-training"], ["step", "Step"]];
    function itemOf(name) { var r = null; try { (window.EPSL ? EPSL.items() : []).forEach(function (it) { if (!r && (norm(it.nom) === norm(name) || (it.old && norm(it.old) === norm(name)))) r = it; }); } catch (e) {} return r; }
    function offOf(name) { var it = itemOf(name); return (it && it.off) || []; }
    function namesOf(x) { var names = []; Object.keys(x.apps).forEach(function (a) { x.apps[a].forEach(function (n) { if (!names.some(function (y) { return nkey(y) === nkey(n); })) names.push(n); }); }); return names; }
    /* listes très proches (beaucoup d'élèves en commun) : fusion proposée */
    function similar() {
      var keys = Object.keys(M), out = [];
      for (var a = 0; a < keys.length; a++) for (var b = a + 1; b < keys.length; b++) {
        var A = namesOf(M[keys[a]]).map(nkey), B = namesOf(M[keys[b]]).map(nkey); if (A.length < 3 || B.length < 3) continue;
        var setB = {}; B.forEach(function (k) { setB[k] = 1; }); var n = A.filter(function (k) { return setB[k]; }).length;
        if (n >= 3 && n / Math.min(A.length, B.length) >= 0.6) out.push([keys[a], keys[b], n]);
      }
      return out;
    }
    async function writeClass(nn, old, L, sel, off) {
      if (sel.esc) {
        var A = jget("escalade.cl", []) || [], c = A.filter(function (y) { return norm(y.nom) === norm(old); })[0];
        if (!c) { c = { id: freeId(A, clsId(nn)), nom: nn, el: [] }; A.push(c); }
        if (c.nom !== nn) { var R = jget("escalade.r", []) || []; R.forEach(function (r) { if ((r.cl || "") === c.nom) r.cl = nn; }); localStorage.setItem("escalade.r", JSON.stringify(R)); }
        c.nom = nn; c.el = L.slice(); localStorage.setItem("escalade.cl", JSON.stringify(A));
      }
      if (sel.rel) {
        var D = jget("relais-vitesse-data-v3", null); if (!D || !D.classes) D = { classes: [], cur: null };
        var k = D.classes.filter(function (y) { return norm(y.name) === norm(old); })[0];
        if (!k) { k = { id: freeId(D.classes, clsId(nn)), name: nn, eleves: [], groupes: [], courses: [], lecons: [], curg: "all" }; D.classes.push(k); }
        var id = Math.max.apply(null, [-1].concat(k.eleves.map(function (e) { return +e.id || 0; }))) + 1;
        k.eleves = L.map(function (l) { var e = k.eleves.filter(function (y) { return nkey(full(y)) === nkey(l); })[0]; if (e) return e; var p = splitFull(l) || { prenom: l, nom: "" };
          return { id: id++, nom: p.nom, prenom: p.prenom, ea: [null, null, null], ma: 0, el: [null, null, null], ml: 0, orig: { ea: [null, null, null], ma: 0, el: [null, null, null], ml: 0 }, imported: true }; });
        k.name = nn; localStorage.setItem("relais-vitesse-data-v3", JSON.stringify(D));
      }
      if (sel.ori) { var O = await oriGet(); Object.keys(O).forEach(function (kk) { if (norm(kk) === norm(old)) delete O[kk]; }); O[nn] = L.slice(); await oriPut(O); }
      await shareList(nn, old, sel, L, off);
    }
    function after(msg) { return (shCfg() ? msg + " Les autres tablettes suivent." : msg + " (Partage entre tablettes non réglé : seulement sur cette tablette.)"); }
    function listView(msg, bad) {
      var keys = Object.keys(M).sort(function (a, b) { return M[a].name.localeCompare(M[b].name, "fr"); }), sim = similar();
      box.innerHTML = "<h3>✏️ Listes d'élèves</h3><p class=\"m\">Touche une classe pour la renommer, corriger ses élèves, choisir ses activités ou la supprimer. Les changements s'appliquent dans toutes les applications et sur toutes les tablettes.</p>" +
        (msg ? '<p class="m" style="color:' + (bad ? "#C0392B" : "#2E7D4F") + ';font-weight:800">' + esc(msg) + "</p>" : "") +
        (sim.length ? '<div style="background:#FFF6E0;border:1px solid #F0D58A;border-radius:12px;padding:10px 12px;margin:8px 0 12px"><b>Listes en double ?</b>' + sim.map(function (p, i) {
          return '<div style="display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap"><span style="flex:1;min-width:200px">« ' + esc(M[p[0]].name) + " » et « " + esc(M[p[1]].name) + " » ont <b>" + p[2] + "</b> élèves en commun.</span><button data-m=\"" + i + '" style="height:40px;border-radius:10px;border:1.5px solid #B7791F;background:#fff;color:#8A5A1F;font-weight:800;padding:0 14px">Fusionner…</button></div>'; }).join("") + "</div>" : "") +
        (keys.length ? '<div class="epsd-chips">' + keys.map(function (k) { var x = M[k], n = namesOf(x).length, off = offOf(x.name);
          var act = APPS.filter(function (a) { return off.indexOf(a[0]) < 0; });
          return '<button data-k="' + esc(k) + '">' + esc(x.name) + " <small>(" + n + " · " + (act.length === APPS.length ? "toutes les activités" : act.length ? act.map(function (a) { return a[1].split(" ")[0]; }).join(", ") : "aucune activité") + ")</small></button>"; }).join("") + "</div>"
          : '<p class="m">Aucune liste pour l\'instant. Importe d\'abord une liste d\'élèves.</p>') +
        '<div class="epsd-act"><button data-x>Fermer</button><button data-edt>📅 Activités depuis l\'emploi du temps</button></div><p class="m" style="margin-top:8px">Les activités de chaque classe sont déduites de ton emploi du temps (appli EDT) ; une classe dont tu as choisi les activités à la main garde ton choix.</p>';
      box.querySelector("[data-edt]").onclick = function () { var r = edtApply(); listView(!r.edt ? "Aucun emploi du temps sur cette tablette (appli EDT)." : !r.moi ? "Ouvre l'appli EDT et choisis ton prénom (« Qui es-tu ? »)." : r.n ? r.n + " classe(s) mise(s) à jour d'après l'emploi du temps de " + r.moi + "." : "Tout est déjà à jour d'après l'emploi du temps de " + r.moi + ".", !r.edt || !r.moi); };
      box.querySelectorAll("[data-k]").forEach(function (b) { b.onclick = function () { cur = b.dataset.k; editView(); }; });
      box.querySelectorAll("[data-m]").forEach(function (b) { b.onclick = function () { mergeView(sim[+b.dataset.m]); }; });
    }
    function mergeView(p, keepK) {
      var a = M[p[0]], b = M[p[1]], keep = keepK ? M[keepK] : null, gone = keep ? (keep === a ? b : a) : null;
      var U = namesOf(a).slice(); namesOf(b).forEach(function (n) { if (!U.some(function (y) { return nkey(y) === nkey(n); })) U.push(n); });
      U.sort(function (x, y) { return x.localeCompare(y, "fr"); });
      box.innerHTML = "<h3>🔗 Fusionner deux listes</h3>" +
        '<p class="m">« ' + esc(a.name) + " » (" + namesOf(a).length + " élèves) et « " + esc(b.name) + " » (" + namesOf(b).length + " élèves) → une seule liste de <b>" + U.length + " élèves</b>.</p>" +
        (!keep ? '<span class="epsd-lab">Quel nom garder ?</span><div class="epsd-chips"><button data-keep="' + esc(p[0]) + '">' + esc(a.name) + '</button><button data-keep="' + esc(p[1]) + '">' + esc(b.name) + "</button></div>"
          : '<p class="m">La liste « <b>' + esc(keep.name) + "</b> » reçoit tous les élèves ; la liste « " + esc(gone.name) + " » est supprimée partout (sauf dans une activité où elle a déjà des évaluations, qui restent consultables).</p>") +
        '<div class="epsd-act"><button id="epsl-b">← Retour</button>' + (keep ? '<button class="p" id="epsl-ok">Fusionner</button>' : "") + "</div>";
      box.querySelector("#epsl-b").onclick = function () { listView(); };
      box.querySelectorAll("[data-keep]").forEach(function (x) { x.onclick = function () { mergeView(p, x.dataset.keep); }; });
      if (keep) box.querySelector("#epsl-ok").onclick = async function () {
        var off = offOf(keep.name).slice(), sel = {}; /* la liste gardée conserve ses activités */
        APPS.forEach(function (x) { sel[x[0]] = off.indexOf(x[0]) < 0 ? 1 : 0; });
        try { await writeClass(keep.name, keep.name, U, sel, off); await deleteList(gone.name); } catch (e) { return listView("Fusion impossible : " + (e && e.message || e), true); }
        M = await allLists(); listView(after("✓ Listes fusionnées dans « " + keep.name + " » (" + U.length + " élèves)."));
      };
    }
    function delView(step) {
      var x = M[cur];
      box.innerHTML = "<h3>🗑 Supprimer « " + esc(x.name) + " »</h3>" +
        (step === 1 ? '<p class="m">La liste de <b>' + namesOf(x).length + " élèves</b> sera retirée de toutes les applications et de toutes les tablettes.</p>" +
          '<div class="epsd-act"><button id="epsl-b">Annuler</button><button id="epsl-ok" style="background:#C0392B;color:#fff;border-color:#C0392B">Supprimer…</button></div>'
          : '<p class="m" style="color:#C0392B;font-weight:800">Dernière confirmation : supprimer définitivement la liste « ' + esc(x.name) + " » ?</p>" +
          '<p class="m">Les évaluations déjà faites ne sont pas effacées : une activité où la classe a des données la garde.</p>' +
          '<div class="epsd-act"><button id="epsl-b">Non, garder</button><button id="epsl-ok" style="background:#C0392B;color:#fff;border-color:#C0392B">Oui, supprimer définitivement</button></div>');
      box.querySelector("#epsl-b").onclick = function () { editView(); };
      box.querySelector("#epsl-ok").onclick = async function () {
        if (step === 1) return delView(2);
        var nm = x.name; try { await deleteList(nm); } catch (e) { return editView("Suppression impossible : " + (e && e.message || e)); }
        M = await allLists(); var still = M[norm(nm)];
        listView(after("✓ Liste « " + nm + " » supprimée." + (still ? " Gardée dans " + APPS.filter(function (a) { return still.apps[a[0]]; }).map(function (a) { return a[1]; }).join(", ") + " car des évaluations y sont enregistrées." : "")));
      };
    }
    function editView(err) {
      var x = M[cur], names = namesOf(x);
      names.sort(function (a, b) { return a.localeCompare(b, "fr"); });
      var sel = x.sel; if (!sel) { var off0 = offOf(x.name); sel = x.sel = {}; APPS.forEach(function (a) { sel[a[0]] = off0.indexOf(a[0]) < 0 ? 1 : 0; }); }
      box.innerHTML = "<h3>✏️ " + esc(x.name) + "</h3>" +
        '<span class="epsd-lab">Nom de la classe</span><input class="epsd-in" id="epsl-n" value="' + esc(x.draftName != null ? x.draftName : x.name) + '">' +
        '<span class="epsd-lab">Activités de cette classe <small style="font-weight:600;color:#6A6F78">(touche pour retirer ou ajouter)</small></span><div class="epsd-chips">' +
          APPS.map(function (a) { return '<button data-a="' + a[0] + '"' + (sel[a[0]] ? ' style="border-color:#2E7D4F;background:#E4F1E8;color:#21603B"' : ' style="opacity:.55;text-decoration:line-through"') + ">" + (sel[a[0]] ? "✓ " : "") + a[1] + "</button>"; }).join("") + "</div>" +
        (function () { if (x.voie == null) x.voie = window.epsVoie ? epsVoie(x.name) : "gt"; return '<span class="epsd-lab">Voie <small style="font-weight:600;color:#6A6F78">(textes officiels AFL / AFLP, barèmes CCF, leçons proposées par Claude)</small></span><div class="epsd-chips">' + [["gt", "🎓 Générale et technologique"], ["pro", "🛠 Professionnelle"]].map(function (v) { return '<button data-voie="' + v[0] + '"' + (x.voie === v[0] ? ' style="border-color:#1F5F8B;background:#E3EEF6;color:#174A6C"' : "") + ">" + (x.voie === v[0] ? "✓ " : "") + v[1] + "</button>"; }).join("") + "</div>"; })() +
        '<span class="epsd-lab">Élèves (un par ligne : Prénom Nom)</span><textarea class="epsd-in" id="epsl-t" style="height:min(34vh,300px);padding:10px 12px;line-height:1.45">' + esc(x.draft != null ? x.draft : names.join("\n")) + "</textarea>" +
        '<p class="m" id="epsl-c" style="margin-top:6px"></p>' +
        '<p class="m">La liste est commune à toutes les tablettes. Une activité décochée ne propose plus cette classe (elle n\'y est gardée que si des évaluations y sont déjà enregistrées). Un élève retiré n\'apparaît plus ; ce qu\'il a déjà fait reste dans les résultats.</p>' +
        (err ? '<p class="m" style="color:#C0392B;font-weight:800">' + esc(err) + "</p>" : "") +
        '<div class="epsd-act"><button id="epsl-del" style="color:#C0392B;margin-right:auto">🗑 Supprimer la liste</button><button id="epsl-b">← Retour</button><button class="p" id="epsl-ok">Enregistrer</button></div>';
      var ti = box.querySelector("#epsl-t"), ni = box.querySelector("#epsl-n");
      var cnt = function () { var n = ti.value.split("\n").filter(function (l) { return l.trim(); }).length; box.querySelector("#epsl-c").textContent = n + " élève" + (n > 1 ? "s" : ""); };
      ti.oninput = function () { x.draft = ti.value; cnt(); }; ni.oninput = function () { x.draftName = ni.value; }; cnt();
      box.querySelectorAll("[data-a]").forEach(function (b) { b.onclick = function () { sel[b.dataset.a] = sel[b.dataset.a] ? 0 : 1; editView(); }; });
      box.querySelectorAll("[data-voie]").forEach(function (b) { b.onclick = function () { x.voie = b.dataset.voie; editView(); }; });
      box.querySelector("#epsl-b").onclick = function () { x.draft = x.draftName = null; x.sel = null; x.voie = null; listView(); };
      box.querySelector("#epsl-del").onclick = function () { delView(1); };
      box.querySelector("#epsl-ok").onclick = async function () {
        var nn = ni.value.replace(/\s+/g, " ").trim(), old = x.name;
        if (!nn) return editView("Donne un nom à la classe.");
        if (norm(nn) !== norm(old) && M[norm(nn)]) return editView("Une classe « " + M[norm(nn)].name + " » existe déjà.");
        var L = []; ti.value.split("\n").forEach(function (l) { l = l.replace(/\s+/g, " ").trim(); if (l && !L.some(function (y) { return nkey(y) === nkey(l); })) L.push(l); });
        var off = APPS.filter(function (a) { return !sel[a[0]]; }).map(function (a) { return a[0]; });
        try { await writeClass(nn, old, L, sel, off); } catch (e) { return editView("Enregistrement impossible : " + (e && e.message || e)); }
        try { var LV = lld(), rule = /^(TGT|2GT|1GT)/.test(String(nn).replace(/[\s._-]+/g, "").toUpperCase()) ? "gt" : "pro"; Object.keys(LV.items).forEach(function (k) { var o = LV.items[k]; if (!o || o.del || norm(o.nom) !== norm(nn)) return; var want = x.voie && x.voie !== rule ? x.voie : undefined; if (o.voie === want) return; if (want) o.voie = want; else delete o.voie; o.ts = Date.now(); LV.pend[o.id] = stamp(); LV.app[o.id] = JSON.stringify(o); }); lsv(LV); setTimeout(sync, 300); } catch (e) {}
        x.voie = null; x.sel = null; M = await allLists();
        listView(after("✓ « " + nn + " » enregistrée" + (off.length ? " (" + (APPS.length - off.length) + " activité" + (APPS.length - off.length > 1 ? "s" : "") + ")." : " dans toutes les activités.")));
      };
    }
    listView();
  }
  async function importList() {
    if (!(await askCode())) return;
    var o = overlay('<div id="epsi"></div>'), box = o.querySelector("#epsi"), L = [], cl = "", sel = { esc: 1, rel: 1, ori: 1, vol: 1, bad: 1, dan: 1, acro: 0 };
    function step1(msg) {
      box.innerHTML = "<h3>👥 Importer une liste d'élèves</h3><p class=\"m\">Fichier Excel (.xlsx, .xls, .ods) ou CSV : colonnes « Nom » et « Prénom », ou « Élève », ou les noms dans la première colonne (export Pronote accepté).</p>" +
        (msg ? '<p class="m" style="color:#C0392B;font-weight:700">' + esc(msg) + "</p>" : "") +
        '<div class="epsd-act" style="justify-content:flex-start;margin-top:8px"><label class="p" style="display:inline-grid;place-items:center;cursor:pointer;height:50px;padding:0 20px;border-radius:14px;background:#1F5F8B;color:#fff;font:800 17px system-ui,sans-serif">📄 Choisir le fichier<input type="file" id="epsi-f" accept=".xlsx,.xls,.ods,.csv,.txt" hidden></label></div>' +
        '<div class="epsd-act"><button data-x>Annuler</button></div>';
      box.querySelector("#epsi-f").onchange = async function (e) {
        var f = e.target.files[0]; if (!f) return;
        try { L = parseList(await readRows(f)); } catch (x) { return step1("Impossible de lire ce fichier (pour un fichier Excel, la première ouverture demande internet). Enregistre-le en .csv si besoin."); }
        if (!L.length) return step1("Aucun élève trouvé dans ce fichier.");
        cl = f.name.replace(/\.[^.]+$/, ""); step2();
      };
    }
    function step2(msg) {
      box.innerHTML = "<h3>👥 " + L.length + " élève" + (L.length > 1 ? "s" : "") + " trouvé" + (L.length > 1 ? "s" : "") + "</h3>" +
        '<span class="epsd-lab">Nom de la classe</span><input class="epsd-in" id="epsi-c" value="' + esc(cl) + '">' +
        '<span class="epsd-lab">Ajouter dans</span><div class="epsd-chips">' + TARGETS.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (sel[t[0]] ? "on" : "") + '">' + (sel[t[0]] ? "✓ " : "") + t[1] + "</button>"; }).join("") + "</div>" +
        (sel.acro ? '<p class="m">Acrosport : la liste de cette classe est <b>remplacée</b> en ligne (internet et mot de passe enseignant d\'Acrosport demandés).</p>' : "") +
        '<p class="m">Les élèves déjà présents dans une classe du même nom ne sont pas ajoutés deux fois.</p>' +
        (msg ? '<p class="m" style="color:#C0392B;font-weight:700">' + esc(msg) + "</p>" : "") +
        '<div class="epsd-chips" style="max-height:30vh;overflow:auto">' + L.map(function (e) { return '<span style="padding:6px 12px;border-radius:999px;background:#F3F0EA;font-weight:600">' + esc(full(e)) + (e.classe ? " <small>(" + esc(e.classe) + ")</small>" : "") + "</span>"; }).join("") + "</div>" +
        '<div class="epsd-act"><button id="epsi-b">Autre fichier</button><button class="p" id="epsi-go">Importer</button></div>';
      var ci = box.querySelector("#epsi-c"); ci.oninput = function () { cl = ci.value; };
      box.querySelectorAll("[data-t]").forEach(function (b) { b.onclick = function () { sel[b.dataset.t] = sel[b.dataset.t] ? 0 : 1; step2(); }; });
      box.querySelector("#epsi-b").onclick = function () { step1(); };
      box.querySelector("#epsi-go").onclick = async function () {
        cl = String(cl).replace(/\s+/g, " ").trim(); if (!cl) return step2("Donne un nom à la classe.");
        if (!TARGETS.some(function (t) { return sel[t[0]]; })) return step2("Choisis au moins une application.");
        var res = [];
        for (var i = 0; i < TARGETS.length; i++) { var t = TARGETS[i]; if (!sel[t[0]]) continue;
          try {
            var n = t[0] === "esc" ? toEsc(cl, L) : t[0] === "rel" ? toRel(cl, L) : t[0] === "ori" ? await toOri(cl, L) : t[0] === "vol" ? toVol(cl, L) : t[0] === "bad" ? toBad(cl, L) : t[0] === "dan" ? toDan(cl, L) : await toAcro(cl, L);
            res.push("✓ " + t[1] + " : " + (t[0] === "acro" ? n + " élève(s) dans la liste en ligne" : n + " élève(s) ajouté(s)"));
          } catch (x) { res.push("✕ " + t[1] + " : " + (x && x.message === "annulé" ? "annulé" : "échec (" + esc(x && x.message || "erreur") + ")")); }
        }
        await collectLists(); await shareList(cl, "", { esc: 1, rel: 1, ori: 1, vol: 1, bad: 1, dan: 1 });
        res.push(shCfg() ? "↗ Envoi vers les autres tablettes en cours." : "⚠ Partage entre tablettes non réglé (bouton « ⚙ Partage entre tablettes » de la carte Listes d'élèves) : la classe reste sur cette tablette.");
        box.innerHTML = "<h3>Classe « " + esc(cl) + " »</h3>" + res.map(function (r) { return '<p class="m" style="font-size:17px;color:#1B1E24">' + r + "</p>"; }).join("") +
          '<div class="epsd-act"><button class="p" data-x>Fermer</button></div>';
      };
    }
    step1();
  }
  /* gestion (page d'accueil) : liste + nouvelle dispense en 3 étapes : classe, élève, période et motif */
  async function manage() {
    if (!(await askCode())) return;
    var o = overlay('<div id="epsd-m"></div>'), box = o.querySelector("#epsd-m"), R = await rosters(), S = { step: 0, classe: "", nom: "" };
    function render() {
      var cfg = shCfg();
      if (S.step === 0) {
        var L = all().filter(function (x) { return x.au >= today(); }).sort(function (a, b) { return a.du < b.du ? -1 : 1; });
        box.innerHTML = "<h3>🩹 Dispenses</h3><p class=\"m\">" + (cfg ? "✓ Partagées avec toutes les tablettes et toutes les applications (chiffrées)." + (lastErr ? " ⚠ Dernier échange : " + esc(lastErr) + "." : "") : "⚠ Partage entre tablettes pas encore réglé sur cette tablette : les dispenses restent ici.") + ' <button type="button" id="epsd-share" style="border:0;background:none;color:#1F5F8B;font-weight:800;text-decoration:underline;font-size:15px">⚙ Partage entre tablettes</button></p>' +
          '<div class="epsd-act" style="margin-top:4px"><button class="p" id="epsd-new">+ Nouvelle dispense</button></div>' +
          '<h3 style="font-size:18px;margin-top:18px">En cours et à venir</h3>' + listHTML(L, true) +
          '<div class="epsd-act"><button data-x>Fermer</button></div>';
        box.querySelector("#epsd-new").onclick = function () { S = { step: 1, classe: "", nom: "" }; render(); };
        box.querySelector("#epsd-share").onclick = function () { shareSettings(render); };
        box.querySelectorAll("[data-del]").forEach(function (b) { b.onclick = function () { var it = D.items[b.dataset.del]; if (it && confirm("Supprimer la dispense de " + it.nom + " ?")) { remove(it.id); render(); } }; });
        return;
      }
      var steps = '<div class="epsd-steps"><span class="' + (S.step === 1 ? "on" : "") + '">1. Classe</span>›<span class="' + (S.step === 2 ? "on" : "") + '">2. Élève</span>›<span class="' + (S.step === 3 ? "on" : "") + '">3. Période</span></div>';
      if (S.step === 1) {
        var cls = Object.keys(R).sort(function (a, b) { return a.localeCompare(b, "fr"); });
        box.innerHTML = "<h3>Nouvelle dispense</h3>" + steps + '<span class="epsd-lab">Classe</span><div class="epsd-chips">' + cls.map(function (c) { return '<button data-c="' + esc(c) + '">' + esc(c) + (R[c].length ? " <small>(" + R[c].length + ")</small>" : "") + "</button>"; }).join("") + "</div>" +
          '<span class="epsd-lab">Autre classe</span><input class="epsd-in" id="epsd-oc" placeholder="Nom de la classe (ex. 1G2)">' +
          '<div class="epsd-act"><button id="epsd-back">Retour</button><button class="p" id="epsd-oknc">Continuer</button></div>';
        box.querySelectorAll("[data-c]").forEach(function (b) { b.onclick = function () { S.classe = b.dataset.c; S.step = 2; render(); }; });
        box.querySelector("#epsd-oknc").onclick = function () { var v = box.querySelector("#epsd-oc").value.trim(); if (!v) return; S.classe = v; if (!R[v]) R[v] = []; S.step = 2; render(); };
        box.querySelector("#epsd-back").onclick = function () { S.step = 0; render(); };
        return;
      }
      if (S.step === 2) {
        var el = (R[S.classe] || []).slice().sort(function (a, b) { return a.localeCompare(b, "fr"); });
        box.innerHTML = "<h3>Nouvelle dispense · " + esc(S.classe) + "</h3>" + steps + '<span class="epsd-lab">Élève</span>' +
          (el.length ? '<div class="epsd-chips">' + el.map(function (n) { return '<button data-n="' + esc(n) + '">' + esc(n) + "</button>"; }).join("") + "</div>" : '<p class="m">Aucune liste d\'élèves pour cette classe sur la tablette : tape le nom ci-dessous.</p>') +
          '<span class="epsd-lab">Ou tape le nom</span><input class="epsd-in" id="epsd-on" placeholder="Prénom Nom">' +
          '<div class="epsd-act"><button id="epsd-back">Retour</button><button class="p" id="epsd-okn">Continuer</button></div>';
        box.querySelectorAll("[data-n]").forEach(function (b) { b.onclick = function () { S.nom = b.dataset.n; S.step = 3; render(); }; });
        box.querySelector("#epsd-okn").onclick = function () { var v = box.querySelector("#epsd-on").value.replace(/\s+/g, " ").trim(); if (!v) return; S.nom = v; S.step = 3; render(); };
        box.querySelector("#epsd-back").onclick = function () { S.step = 1; render(); };
        return;
      }
      var t = today();
      box.innerHTML = "<h3>Dispense de " + esc(S.nom) + "</h3><p class=\"m\">" + esc(S.classe) + "</p>" + steps +
        '<div class="epsd-chips" id="epsd-q"><button data-q="0">Aujourd\'hui</button><button data-q="6">1 semaine</button><button data-q="13">2 semaines</button><button data-q="20">3 semaines</button><button data-q="30">1 mois</button><button data-q="90">3 mois</button></div>' +
        '<div class="epsd-g2"><label><span class="epsd-lab">Du</span><input class="epsd-in" type="date" id="epsd-du" value="' + t + '"></label><label><span class="epsd-lab">Au (inclus)</span><input class="epsd-in" type="date" id="epsd-au" value="' + t + '"></label></div>' +
        '<span class="epsd-lab">Motif (facultatif, visible seulement ici)</span><input class="epsd-in" id="epsd-mo" placeholder="ex. certificat médical, entorse…">' +
        '<p class="m" id="epsd-err" style="color:#C0392B;margin-top:8px"></p>' +
        '<div class="epsd-act"><button id="epsd-back">Retour</button><button class="p" id="epsd-save">✓ Enregistrer la dispense</button></div>';
      box.querySelectorAll("[data-q]").forEach(function (b) { b.onclick = function () { var du = box.querySelector("#epsd-du").value || t; box.querySelector("#epsd-au").value = addDays(du, +b.dataset.q); box.querySelectorAll("[data-q]").forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
      box.querySelector("#epsd-back").onclick = function () { S.step = 2; render(); };
      box.querySelector("#epsd-save").onclick = function () {
        var du = box.querySelector("#epsd-du").value, au = box.querySelector("#epsd-au").value;
        if (!du || !au || au < du) { box.querySelector("#epsd-err").textContent = "Vérifie les dates : la fin doit être après le début."; return; }
        put({ id: "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), classe: S.classe, nom: S.nom, du: du, au: au, motif: box.querySelector("#epsd-mo").value.trim() });
        S = { step: 0 }; render();
      };
    }
    render();
  }
  /* ================= Réglages communs (page d'accueil, mode enseignant) =================
     localStorage « eps.reglages.v1 » : {etab, ville, annee, prof, ca, masque:[dossiers], teachMin, u} → tous partagés entre les tablettes
     (un seul utilisateur ; enregistrement chiffré « cfg|commun »). « equipe » est gardé pour une future version partageable.
     window.EPSR.get() → réglages ; EPSR.pdfHead(doc, o) → en-tête commun des bilans PDF (générateurs EPDF / PDFDoc) ;
     EPSR.htmlHead(o) → même en-tête en HTML (Volley-ball). */
  var KR = "eps.reglages.v1", SHARED = ["etab", "ville", "annee", "equipe", "prof", "ca", "masque", "teachMin", "asSheet"];
  function anneeDef() { var d = new Date(), y = d.getFullYear() - (d.getMonth() < 7 ? 1 : 0); return y + "-" + (y + 1); }
  function rget() {
    var r = null; try { r = JSON.parse(localStorage.getItem(KR) || "null"); } catch (e) {}
    r = r || {};
    if (!r.etab || !r.prof) { /* reprise des réglages déjà saisis dans Danse */
      try { var dz = JSON.parse(localStorage.getItem("danse-eps-v1") || "null"), dr = dz && dz.reglages || {}; if (!r.etab && dr.etab) r.etab = dr.etab; if (!r.prof && dr.prof) r.prof = dr.prof; } catch (e) {}
    }
    r.equipe = Array.isArray(r.equipe) ? r.equipe : [];
    if (r.prof && r.equipe.indexOf(r.prof) < 0) r.equipe.push(r.prof);
    if (!r.annee) r.annee = anneeDef();
    if (r.ca === undefined) r.ca = true;
    r.masque = Array.isArray(r.masque) ? r.masque : [];
    r.teachMin = +r.teachMin || 60;
    return r;
  }
  function rset(r, shared) {
    if (shared) { r.u = Math.max(Date.now(), (+r.u || 0) + 1); r.pend = r.u; }
    try { localStorage.setItem(KR, JSON.stringify(r)); } catch (e) {}
    applyReg(); try { window.dispatchEvent(new CustomEvent("eps-reglages")); } catch (e) {}
    if (shared) setTimeout(sync, 300);
  }
  var regSig = "";
  function applyReg() {
    if (!HUB) return;
    var t = isTeacher(), sig = t + "|" + (localStorage.getItem(KR) || "");
    if (sig === regSig) return; regSig = sig;
    var r = rget();
    document.querySelectorAll("a.app[href]").forEach(function (a) {
      var k = a.getAttribute("href").replace(/\/.*$/, ""), off = r.masque.indexOf(k) >= 0;
      a.style.opacity = off && t ? ".45" : "";
      if (off && !t) a.style.display = "none"; else if (!a.hasAttribute("data-eps-teach")) a.style.display = "";
    });
    var h = document.getElementById("eps-etab"); if (h) h.textContent = r.etab ? r.etab + (r.ville ? " · " + r.ville : "") + " — " : "";
    var rs = document.getElementById("eps-regsum"); if (rs) rs.textContent = (r.etab || "Établissement à renseigner") + " · " + (r.prof || "enseignant à choisir") + " · " + r.annee + " — listes d'élèves, partage, sauvegarde";
  }
  /* synchronisation des réglages communs (établissement, année, équipe) */
  async function syncReg(cfg) {
    var r = rget();
    if (r.pend) {
      var x = {}; SHARED.forEach(function (k) { x[k] = r[k]; }); x.u = r.u;
      await fetch(cfg.url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ key: cfg.key, sync: { dev: "reglages", recs: [{ k: "cfg|commun", u: r.pend, d: 0, x: await enc(cfg.key, JSON.stringify(x)) }] } }) });
      r = rget(); delete r.pend; try { localStorage.setItem(KR, JSON.stringify(r)); } catch (e) {}
      await new Promise(function (res) { setTimeout(res, 1200); });
    }
    for (var lp = 0; lp < 10; lp++) {
      r = rget(); var q = await jsonp(cfg, { pull: 1, since: r.since || 0, pre: "cfg|" });
      if (!q || !q.keyOk || !q.sync) break;
      var L = q.recs || [], ch = false;
      for (var i = 0; i < L.length; i++) {
        if (String(L[i][1]) !== "cfg|commun" || +L[i][3]) continue;
        try { var o = JSON.parse(await dec(cfg.key, L[i][4])); if ((+o.u || 0) > (+r.u || 0) && !r.pend) { SHARED.forEach(function (k) { if (o[k] !== undefined) r[k] = o[k]; }); r.u = o.u; ch = true; } } catch (e) {}
      }
      r.since = L.length ? +L[L.length - 1][0] : Math.max(r.since || 0, +q.seq || 0);
      try { localStorage.setItem(KR, JSON.stringify(r)); } catch (e) {}
      if (ch) { applyReg(); try { window.dispatchEvent(new CustomEvent("eps-reglages")); } catch (e) {} }
      if (!q.more) break;
    }
  }
  /* ================= Emploi du temps (application edt/, mode enseignant) =================
     localStorage « eps.edt.v1 » : {data (export « Appli EPS » de Planif EPS), u, pend, since} → enregistrement chiffré « edt|equipe » partagé entre les tablettes */
  var KE = "eps.edt.v1";
  function eget() { try { return JSON.parse(localStorage.getItem(KE) || "null") || {}; } catch (e) { return {}; } }
  function eset(v) { try { localStorage.setItem(KE, JSON.stringify(v)); } catch (e) {} }
  async function syncEdt(cfg) {
    var E = eget();
    if (E.pend && (E.data || E.add)) {
      var x = await enc(cfg.key, JSON.stringify({ data: E.data, add: E.add || [], u: E.u }));
      if (x.length < 48000) await fetch(cfg.url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ key: cfg.key, sync: { dev: "edt", recs: [{ k: "edt|equipe", u: E.pend, d: 0, x: x }] } }) });
      E = eget(); delete E.pend; eset(E);
      await new Promise(function (res) { setTimeout(res, 1200); });
    }
    for (var lp = 0; lp < 10; lp++) {
      E = eget(); var q = await jsonp(cfg, { pull: 1, since: E.since || 0, pre: "edt|" });
      if (!q || !q.keyOk || !q.sync) break;
      var L = q.recs || [], ch = false;
      for (var i = 0; i < L.length; i++) {
        if (String(L[i][1]) !== "edt|equipe" || +L[i][3]) continue;
        try { var o = JSON.parse(await dec(cfg.key, L[i][4])); if ((+o.u || 0) > (+E.u || 0) && !E.pend) { if (o.data) E.data = o.data; if (o.add) E.add = o.add; E.u = o.u; ch = true; } } catch (e) {}
      }
      E.since = L.length ? +L[L.length - 1][0] : Math.max(E.since || 0, +q.seq || 0); eset(E);
      if (ch) try { window.dispatchEvent(new CustomEvent("eps-edt")); } catch (e) {}
      if (!q.more) break;
    }
  }
  /* emploi du temps : get / set ajoutés à window.EPSE sans écraser le module d'évaluation (eps-eval.js : create, store, libs) */
  window.EPSE = Object.assign(window.EPSE || {}, { get: eget, set: function (data) { var E = eget(); E.data = data; E.u = Math.max(Date.now(), (+E.u || 0) + 1); E.pend = E.u; eset(E); setTimeout(sync, 300); },
    /* cours ajoutés dans l'appli (edt/) : gardés quand l'emploi du temps est remis à jour depuis Planif EPS */
    getAdd: function () { return eget().add || []; },
    setAdd: function (L) { var E = eget(); E.add = L; E.u = Math.max(Date.now(), (+E.u || 0) + 1); E.pend = E.u; eset(E); setTimeout(sync, 300); } });
  var APPS = [["acrosport", "Acrosport"], ["escalade", "Escalade"], ["orientation", "OrienRun"], ["relais", "Relais Vitesse"], ["volley", "Volley-ball"], ["badminton", "Badminton"], ["danse", "Danse"], ["co-eval", "CO Course"], ["crosstraining", "Cross-training"], ["basket", "Basket-ball"], ["step", "Step"]];
  function reglages(msg) {
    var r = rget();
    var chips = function (L, on, attr) { return L.map(function (x) { return '<button type="button" ' + attr + '="' + esc(x[0]) + '" class="' + (on(x[0]) ? "on" : "") + '">' + esc(x[1]) + "</button>"; }).join(""); };
    var o = overlay('<h3>⚙️ Réglages</h3>' + (msg ? '<p class="m" style="color:#2E7D4F;font-weight:800">' + esc(msg) + "</p>" : "") +
      (shCfg() ? '<p class="m" style="background:#E7F3EC;color:#1E5A37;border-radius:12px;padding:10px 12px;font-weight:700">✅ Réglages et listes d\'élèves communs à toutes tes tablettes (partage entre tablettes actif). <button type="button" id="er-share" style="margin:8px 0 0;display:block;height:42px;padding:0 16px;border-radius:12px;border:2px solid currentColor;background:#fff;color:inherit;font:800 15px system-ui,sans-serif;cursor:pointer">⚙ Partage entre tablettes</button></p>'
        : '<p class="m" style="background:#FDF0E1;color:#7A4A06;border-radius:12px;padding:10px 12px;font-weight:700">⚠️ Le partage entre tablettes n\'est pas réglé sur cette tablette : ce que tu enregistres ici reste sur elle. <button type="button" id="er-share" style="margin:8px 0 0;display:block;height:42px;padding:0 16px;border-radius:12px;border:2px solid currentColor;background:#fff;color:inherit;font:800 15px system-ui,sans-serif;cursor:pointer">⚙ Régler le partage</button></p>') +
      '<div class="epsd-cls">En-tête des bilans</div>' +
      '<p class="m">Ces informations apparaissent dans l\'en-tête de tous les bilans (PDF) de toutes les applications.</p>' +
      '<span class="epsd-lab">Nom exact de l\'établissement</span><input class="epsd-in" id="er-etab" placeholder="Lycée …" value="' + esc(r.etab || "") + '">' +
      '<div class="epsd-g2"><div><span class="epsd-lab">Ville (facultatif)</span><input class="epsd-in" id="er-ville" value="' + esc(r.ville || "") + '"></div>' +
      '<div><span class="epsd-lab">Année scolaire</span><input class="epsd-in" id="er-annee" value="' + esc(r.annee) + '"></div></div>' +
      '<span class="epsd-lab">Enseignant (tel qu\'il apparaît sur les bilans)</span><input class="epsd-in" id="er-prof" placeholder="M. …" value="' + esc(r.prof || "") + '">' +
      '<span class="epsd-lab">Champ d\'apprentissage (CA) dans l\'en-tête</span><div class="epsd-chips" id="er-ca">' + chips([["1", "Afficher"], ["0", "Masquer"]], function (v) { return (v === "1") === !!r.ca; }, "data-v") + "</div>" +
      '<span class="epsd-lab">Mode enseignant ouvert depuis l\'accueil pendant</span><div class="epsd-chips" id="er-tm">' + chips([["30", "30 min"], ["60", "1 h"], ["120", "2 h"], ["240", "4 h"]], function (v) { return +v === r.teachMin; }, "data-v") + "</div>" +
      '<span class="epsd-lab">Applications visibles par les élèves sur l\'accueil</span><div class="epsd-chips" id="er-apps">' + chips(APPS, function (k) { return r.masque.indexOf(k) < 0; }, "data-a") + "</div>" +
      '<div class="epsd-cls" style="margin-top:18px">Appel AS</div>' +
      '<span class="epsd-lab">Lien du fichier d\'appel de l\'association sportive (Google Sheets)</span><input class="epsd-in" id="er-as" placeholder="https://docs.google.com/spreadsheets/d/…" value="' + esc(r.asSheet || "") + '">' +
      '<div class="epsd-cls" style="margin-top:18px">Listes d\'élèves</div>' +
      '<p class="m">Les listes sont communes : une classe importée ici ou dans n\'importe quelle application apparaît dans toutes les applications (Escalade, Relais Vitesse, OrienRun, Volley-ball, Badminton, Danse, Acrosport) et sur toutes tes tablettes.</p>' +
      '<div id="er-cls" class="m" style="margin:6px 0 4px">…</div>' +
      '<div class="dbtns epsd-act" style="margin-top:8px"><button type="button" id="er-edit">✏️ Modifier les listes</button><button type="button" id="er-trash">🗑 Corbeille</button><button type="button" class="p" id="er-imp">📥 Importer une liste d\'élèves</button></div>' +
      '<div class="epsd-cls" style="margin-top:18px">🧪 Simulation</div>' +
      '<p class="m">' + (window.EPS_SIM ? "Tu es en simulation : rien n'est partagé ni gardé. Quitte-la pour retrouver tes vraies données." : "Explore toutes les applis comme un bac à sable : tes données sont mises de côté, le partage est coupé, une classe fictive de 8 élèves est installée avec une leçon, des observations et des évaluations. Tu passes librement d'enseignant à élève. En quittant, la tablette retrouve exactement ses données.") + '</p>' +
      '<div class="dbtns epsd-act" style="margin-top:8px">' + (window.EPS_SIM ? '<button type="button" id="er-sim-x">⏹ Quitter la simulation</button>' : '<button type="button" class="p" id="er-sim">🧪 Entrer en simulation</button>') + (demoOn() && !window.EPS_SIM ? '<button type="button" id="er-demo-x">🗑 Retirer l\'ancienne classe de démonstration</button>' : "") + '</div>' +
      '<div class="epsd-cls" style="margin-top:18px">📥 Tablette neuve ou remplacée</div><p class="m">Une fois le partage réglé, récupère tout sur cette tablette : classes, leçons, évaluations, résultats et données de chaque appli (les applis sont ouvertes une à une, en arrière-plan ; environ 2 minutes).</p>' +
      '<div class="dbtns epsd-act" style="margin-top:8px"><button type="button" id="er-rest">📥 Tout récupérer sur cette tablette</button></div>' +
      '<div class="epsd-cls" style="margin-top:18px">Sauvegarde</div>' +
      '<p class="m">Fichier de sauvegarde de toutes les applications de cette tablette (classes, leçons, évaluations, réglages), à garder sur ton ordinateur ou ta clé USB. Les vidéos et les cartes d\'OrienRun n\'y sont pas.</p>' +
      '<div class="dbtns epsd-act" style="margin-top:8px"><button type="button" id="er-save">💾 Enregistrer une sauvegarde</button><label style="height:50px;padding:0 20px;border-radius:14px;border:2px solid #1B1E24;display:inline-flex;align-items:center;font:800 17px system-ui,sans-serif;cursor:pointer">♻️ Restaurer<input type="file" accept=".json,.eps,application/json" id="er-load" style="display:none"></label></div>' +
      '<div class="epsd-act"><button data-x>Fermer</button><button class="p" id="er-ok">Enregistrer les réglages</button></div>');
    var rs = o.querySelector("#er-rest"); if (rs) rs.onclick = function () { o.remove(); restoreAll(); };
    var sm = o.querySelector("#er-sim"); if (sm) sm.onclick = function () { sm.disabled = true; simEnter(); };
    var sx = o.querySelector("#er-sim-x"); if (sx) sx.onclick = function () { if (confirm("Quitter la simulation ? Tout ce qui a été fait pendant la simulation est effacé.")) simExit(); };
    var dm = o.querySelector("#er-demo"); if (dm) dm.onclick = function () { dm.disabled = true; demoCreate().then(function () { o.remove(); reglages("🧪 Classe « " + DEMO + " » créée. La fiche de leçon s'ouvre côté élève dans 2 minutes (👁 Vue élève, classe DÉMO)."); }); };
    var dx = o.querySelector("#er-demo-x"); if (dx) dx.onclick = function () { if (!confirm("Retirer la classe de démonstration et tout ce qui la concerne (évaluations, leçons, observations), sur toutes les tablettes ?")) return; dx.disabled = true; demoRemove().then(function () { o.remove(); reglages("🗑 Classe de démonstration retirée."); }); };
    function readForm() {
      r.etab = o.querySelector("#er-etab").value.trim(); r.ville = o.querySelector("#er-ville").value.trim(); r.annee = o.querySelector("#er-annee").value.trim() || anneeDef();
      r.prof = o.querySelector("#er-prof").value.replace(/\s+/g, " ").trim();
      r.asSheet = o.querySelector("#er-as").value.trim();
    }
    function saveNow() { var old = rget(); rset(r, SHARED.some(function (k) { return JSON.stringify(old[k]) !== JSON.stringify(r[k]); })); }
    function tog(sel, fn) { o.querySelector(sel).addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) fn(b); }); }
    tog("#er-ca", function (b) { r.ca = b.dataset.v === "1"; o.querySelectorAll("#er-ca button").forEach(function (x) { x.classList.toggle("on", x === b); }); });
    tog("#er-tm", function (b) { r.teachMin = +b.dataset.v; o.querySelectorAll("#er-tm button").forEach(function (x) { x.classList.toggle("on", x === b); }); });
    tog("#er-apps", function (b) { var k = b.dataset.a, i = r.masque.indexOf(k); if (i >= 0) r.masque.splice(i, 1); else r.masque.push(k); b.classList.toggle("on", i >= 0); });
    o.querySelector("#er-ok").onclick = function () {
      readForm(); saveNow(); o.remove(); toastHub("Réglages enregistrés");
    };
    o.querySelector("#er-share").onclick = function () { o.remove(); shareSettings(function () { reglages(); }); };
    o.querySelector("#er-save").onclick = backupSave;
    o.querySelector("#er-edit").onclick = function () { o.remove(); editLists(); };
    var etr = o.querySelector("#er-trash"); if (etr) etr.onclick = function () { o.remove(); trOpen(); };
    o.querySelector("#er-imp").onclick = function () { o.remove(); importList(); };
    var showCls = function () { return allLists().then(function (M) {
      var el = o.querySelector("#er-cls"); if (!el) return;
      var L = Object.keys(M).map(function (k) { var x = M[k], n = 0; Object.keys(x.apps).forEach(function (a) { n = Math.max(n, (x.apps[a] || []).length); }); return [x.name, n]; })
        .sort(function (a, b) { return a[0].localeCompare(b[0], "fr"); });
      el.innerHTML = L.length ? L.map(function (c) { return '<span style="display:inline-block;margin:3px 6px 3px 0;padding:6px 12px;border-radius:999px;background:#F1EFE8;font-weight:700">' + esc(c[0]) + ' · ' + c[1] + ' élève' + (c[1] > 1 ? "s" : "") + "</span>"; }).join("")
        : "Aucune liste pour l'instant.";
    }).catch(function () {}); };
    collectLists().catch(function () {}).then(showCls).then(function () { return sync(); }).then(showCls).catch(function () {});
    o.querySelector("#er-load").onchange = function (e) { var f = e.target.files[0]; if (f) backupLoad(f, o); };
  }
  function toastHub(t) {
    var d = document.createElement("div"); d.textContent = t;
    d.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483646;background:#1B1E24;color:#fff;font:700 16px system-ui,sans-serif;padding:12px 20px;border-radius:14px";
    document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2200);
  }
  /* sauvegarde complète de la tablette (toutes les clés localStorage des applications EPS) */
  function backupSave() {
    var data = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k === "eps.teach.until") continue; data[k] = localStorage.getItem(k); }
    var r = rget(), d = new Date(), dd = ("0" + d.getDate()).slice(-2) + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + d.getFullYear();
    var blob = new Blob([JSON.stringify({ type: "eps-autonomie-numerique", v: 1, date: d.toISOString(), etab: r.etab || "", prof: r.prof || "", data: data })], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "EPS_sauvegarde_" + (r.prof ? norm(r.prof).replace(/ /g, "-") + "_" : "") + dd + ".json";
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    try { var rr = rget(); rr.lastBackup = Date.now(); localStorage.setItem(KR, JSON.stringify(rr)); } catch (e) {}
  }
  function backupLoad(file, o) {
    var fr = new FileReader();
    fr.onload = function () {
      var j = null; try { j = JSON.parse(fr.result); } catch (e) {}
      if (!j || j.type !== "eps-autonomie-numerique" || !j.data) { alert("Ce fichier n'est pas une sauvegarde EPS – Autonomie et Numérique."); return; }
      var n = Object.keys(j.data).length, when = new Date(j.date).toLocaleString("fr-FR");
      if (!confirm("Restaurer la sauvegarde du " + when + (j.prof ? " (" + j.prof + ")" : "") + " ?\n\n" + n + " éléments. Les données actuelles de cette tablette seront remplacées par celles du fichier.")) return;
      Object.keys(j.data).forEach(function (k) { try { localStorage.setItem(k, j.data[k]); } catch (e) {} });
      if (o) o.remove(); toastHub("Sauvegarde restaurée"); setTimeout(function () { location.reload(); }, 900);
    };
    fr.readAsText(file);
  }
  /* en-tête commun des bilans PDF (même présentation que Danse) */
  function headInfo(o) {
    var r = rget();
    return { l1: (o.act || "") + (o.titre ? " — " + o.titre : ""), l2: [r.etab, r.prof, "EPS" + (r.ca && o.ca ? " · " + o.ca : "")].filter(Boolean).join(" · "),
      r1: o.nom || "", r2: [o.classe, o.lecon, o.date].filter(Boolean).join(" · ") };
  }
  function pdfHead(doc, o) {
    var h = headInfo(o), M = doc.M, W = doc.W - 2 * M, top = 26, HH = 58, half = W * 0.58;
    if (!o.noPage) doc.page();
    doc.rect(M, top, W, HH, "#14171C"); doc.rect(M, top, 6, HH, o.ac || "#D9481F");
    doc.text(M + 18, top + 25, h.l1, { size: 14.5, bold: true, color: "#ffffff", max: half - 20 });
    doc.text(M + 18, top + 44, h.l2, { size: 9, color: "#A9AEB8", max: half - 20 });
    doc.text(M + W - 14, top + 25, h.r1, { size: 14.5, bold: true, color: "#ffffff", align: "right", max: W - half - 20 });
    doc.text(M + W - 14, top + 44, h.r2, { size: 9, color: "#A9AEB8", align: "right", max: W - half - 20 });
    if (o.info) doc.text(M, top + HH + 18, o.info, { size: 9.5, bold: true, color: "#1B1E24", max: W });
    doc.y = top + HH + (o.info ? 34 : 24);
    return doc;
  }
  function htmlHead(o) {
    var h = headInfo(o);
    return '<div style="display:flex;background:#14171C;color:#fff;margin:0 0 14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:Arial,Helvetica,sans-serif">' +
      '<div style="width:7px;background:' + esc(o.ac || "#7A3E9D") + '"></div><div style="flex:1;display:flex;justify-content:space-between;gap:14px;align-items:center;padding:9px 14px">' +
      '<div><div style="font-size:17px;font-weight:700">' + esc(h.l1) + '</div><div style="font-size:12px;color:#A9AEB8">' + esc(h.l2) + "</div></div>" +
      '<div style="text-align:right"><div style="font-size:17px;font-weight:700">' + esc(h.r1) + '</div><div style="font-size:12px;color:#A9AEB8">' + esc(h.r2) + "</div></div></div></div>";
  }
  /* ================= Écran élève commun : « Choisis ta classe » + ressources sans classe =================
     Chaque application enregistre sa configuration (avant ou après le chargement de ce fichier) :
       (window.EPSG_Q = window.EPSG_Q || []).push({ app, sub, color, icon(svg), classes(): [{id, nom, n, note}],
         current(): id, select(id), resources: [{ico, label, sub, open()}], teacher(), when(): bool, noClass: {label, sub, open()} });
     L'écran s'affiche au chargement de l'application, en mode élève seulement (when() permet de l'éviter). */
  var GATE = null;
  function gateCss() {
    if (document.getElementById("epsg-css")) return;
    var st = document.createElement("style"); st.id = "epsg-css";
    st.textContent = ".epsg{position:fixed;inset:0;z-index:2147483000;background:#F5F3EE;overflow:auto;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1B1E24;-webkit-font-smoothing:antialiased}" +
      ".epsg *{box-sizing:border-box}.epsg-hd{color:#fff;padding:calc(env(safe-area-inset-top) + 18px) 22px 20px;display:flex;align-items:center;gap:14px}" +
      ".epsg-ic{width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;flex:none}.epsg-ic svg{width:30px;height:30px}" +
      ".epsg-hd h1{margin:0;font-size:26px;font-weight:800;letter-spacing:-.01em;line-height:1.1}.epsg-hd p{margin:3px 0 0;font-size:14px;opacity:.82;font-weight:600}" +
      ".epsg-home{margin-left:auto;display:inline-flex;align-items:center;gap:7px;height:40px;color:#D5D8DE;text-decoration:none;font-weight:700;font-size:14px;border:1.5px solid #3A3F47;border-radius:10px;padding:0 12px;white-space:nowrap}" +
      ".epsg-in{max-width:1100px;margin:0 auto;padding:22px 22px 120px}.epsg h2{font-size:22px;font-weight:800;margin:4px 0 12px}" +
      ".epsg-lab{font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:#6A6F78;font-weight:800;margin:26px 0 10px}" +
      ".epsg-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}" +
      ".epsg-c{background:#fff;border:2px solid #E6E1D6;border-radius:14px;padding:16px;text-align:left;cursor:pointer;font:inherit;color:inherit;min-height:84px;transition:border-color .15s}" +
      ".epsg-c b{display:block;font-size:21px;font-weight:800}.epsg-c span{display:block;font-size:13px;color:#6A6F78;margin-top:4px;font-weight:600}" +
      ".epsg-c.on{border-width:3px}.epsg-c.nl{border-style:dashed;background:transparent}" +
      ".epsg-r{display:flex;align-items:center;gap:10px;border:0;border-radius:12px;padding:13px 14px;text-align:left;cursor:pointer;font:inherit;font-weight:700;font-size:15px}" +
      ".epsg-r i{font-style:normal;font-size:20px}.epsg-r small{display:block;font-weight:600;font-size:12px;opacity:.8}" +
      ".epsg-ft{margin-top:34px;text-align:center}.epsg-ft button{font:inherit;font-weight:700;font-size:15px;color:#6A6F78;background:#fff;border:1.5px solid #DDD7CA;border-radius:12px;padding:11px 18px;cursor:pointer}" +
      ".epsg-empty{background:#fff;border-radius:14px;padding:18px;color:#6A6F78;font-weight:600}";
    document.head.appendChild(st);
  }
  function tint(hex, a) { var h = String(hex || "#444").replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); var n = parseInt(h, 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
  function gateClose() { var g = document.querySelector(".epsg"); if (g) g.remove(); try { document.documentElement.style.overflow = ""; } catch (e) {} }
  window.EPSG_REFRESH = function () { gateOpen(); };
  function gateOpen() {
    var G = GATE; if (!G) return;
    gateCss(); gateClose();
    var col = G.color || "#1B1E24", L = [];
    try { L = (G.classes && G.classes()) || []; } catch (e) {}
    var cur = ""; try { cur = G.current ? G.current() : ""; } catch (e) {}
    var R = (G.resources || []).concat((window.EPSG_COMMON || []).filter(function (r) { try { return !r.when || r.when(); } catch (e) { return false; } }));
    var d = document.createElement("div"); d.className = "epsg";
    d.innerHTML = '<div class="epsg-hd" style="background:#14171C;box-shadow:inset 0 -4px 0 ' + col + '"><div class="epsg-ic" style="background:' + col + '">' + (G.icon || "") + '</div><div style="flex:1"><h1>' + esc(G.app || "") + '</h1>' + (G.sub ? "<p>" + esc(G.sub) + "</p>" : "") + '</div><span data-eps-upd-slot></span><a class="epsg-home" href="' + BASE + '"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>Accueil</a></div>' +
      '<div class="epsg-in">' + (function () { /* classe déjà choisie aujourd'hui sur cette tablette : un seul appui pour continuer */
        var last = null; try { last = JSON.parse(localStorage.getItem("eps.gate.last." + appDir()) || "null"); } catch (e) {}
        var c = last && last.day === today() && !cur ? L.filter(function (x) { return String(x.id) === String(last.id); })[0] : null;
        return c ? '<button class="epsg-c on" data-c="' + esc(c.id) + '" style="border-color:' + col + ';width:100%;max-width:520px;margin:0 0 14px;display:block;text-align:left"><b>▶ Continuer : ' + esc(c.nom) + '</b><span>Ta classe d\'aujourd\'hui sur cette tablette</span></button>' : ""; })() + '<h2>Choisis ta classe</h2>' +
      (L.length || G.noClass ? '<div class="epsg-g">' + L.map(function (c) {
        return '<button class="epsg-c' + (c.id === cur ? " on" : "") + '" data-c="' + esc(c.id) + '"' + (c.id === cur ? ' style="border-color:' + col + '"' : "") + '><b>' + esc(c.nom) + '</b><span>' + esc(c.note || (c.n != null ? c.n + " élève" + (c.n > 1 ? "s" : "") : "")) + "</span></button>";
      }).join("") + (G.noClass ? '<button class="epsg-c nl" data-nl="1"><b style="font-size:17px">' + esc(G.noClass.label || "Sans liste") + "</b><span>" + esc(G.noClass.sub || "") + "</span></button>" : "") + "</div>"
        : '<div class="epsg-empty">Aucune classe sur cette tablette pour l\'instant : demande à ton enseignant.</div>') +
      (R.length ? '<div class="epsg-lab">Ressources · sans classe</div><div class="epsg-g">' + R.map(function (r, i) {
        return '<button class="epsg-r" data-r="' + i + '" style="background:' + tint(col, .12) + ';color:' + col + '"><i>' + (r.ico || "📘") + "</i><span>" + esc(r.label) + (r.sub ? "<small>" + esc(r.sub) + "</small>" : "") + "</span></button>";
      }).join("") + "</div>" : "") +
      "</div>"; /* accès enseignant : 3 appuis rapides (ou appui long) sur le logo de l'appli, sans bouton visible pour les élèves */
    d.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.c != null) { try { localStorage.setItem("eps.gate.last." + appDir(), JSON.stringify({ id: b.dataset.c, day: today(), nom: ((L.filter(function (x) { return String(x.id) === String(b.dataset.c); })[0] || {}).nom) || "" })); } catch (er) {} gateClose(); try { G.select(b.dataset.c); } catch (er) {} }
      else if (b.dataset.nl) { gateClose(); try { G.noClass.open(); } catch (er) {} }
      else if (b.dataset.r != null) { gateClose(); try { R[+b.dataset.r].open(); } catch (er) {} }
      else if (b.dataset.t) { gateClose(); try { G.teacher(); } catch (er) {} }
    });
    document.body.appendChild(d); try { document.documentElement.style.overflow = "hidden"; } catch (e) {}
  }
  function gateRegister(cfg) {
    GATE = cfg;
    var show = true; try { show = !(cfg.isTeacher ? cfg.isTeacher() : isTeacher()) && (!cfg.when || cfg.when()); } catch (e) { show = false; }
    if (show) { if (document.body) gateOpen(); else document.addEventListener("DOMContentLoaded", gateOpen); }
  }
  /* Fiche ressource plein écran pour une appli dont les écrans ne s'ouvrent pas sans classe (Volley, Badminton, Acrosport) :
     EPSG.sheet({titre, html, color}) ; « ← Retour » ramène à « Choisis ta classe ». Classe .epsgs (et non .epsg) pour ne pas
     être fermée par un rafraîchissement de l'écran de classe. Contenu : h3, p, img, ul, .epsgs-card, .epsgs-grid. */
  function gateSheet(o) {
    o = o || {}; gateCss();
    if (!document.getElementById("epsgs-css")) { var st = document.createElement("style"); st.id = "epsgs-css";
      st.textContent = ".epsgs{position:fixed;inset:0;z-index:2147483000;background:#F5F3EE;overflow:auto;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#14171C;-webkit-font-smoothing:antialiased}.epsgs *{box-sizing:border-box}" +
        ".epsgs-in{max-width:900px;margin:0 auto;padding:18px 22px 120px;font-size:16px;line-height:1.45}.epsgs-in h3{font-size:19px;font-weight:800;margin:22px 0 10px}.epsgs-in p{margin:0 0 10px}.epsgs-in ul{margin:6px 0 10px;padding-left:22px}.epsgs-in li{margin:3px 0}" +
        ".epsgs-in img{max-width:100%;height:auto;border-radius:12px;display:block;background:#fff}.epsgs-in video{width:100%;max-height:60vh;border-radius:12px;background:#000;display:block;margin-top:8px}" +
        ".epsgs-card{background:#fff;border:1px solid #E6E1D6;border-radius:14px;padding:14px 16px;margin:0 0 12px}.epsgs-card b.t{display:block;font-size:17px;font-weight:800;margin-bottom:4px}.epsgs-card .m{color:#6A6F78;font-size:14px}" +
        ".epsgs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.epsgs-grid figure{margin:0;background:#fff;border:1px solid #E6E1D6;border-radius:12px;padding:8px;text-align:center;font-weight:700;font-size:14px}.epsgs-grid figure img{margin:0 auto 6px}" +
        ".epsgs-back{margin-left:auto;display:inline-flex;align-items:center;gap:7px;height:40px;color:#D5D8DE;background:transparent;font:700 14px system-ui,sans-serif;border:1.5px solid #3A3F47;border-radius:10px;padding:0 14px;white-space:nowrap;cursor:pointer}";
      document.head.appendChild(st); }
    var G = GATE || {}, col = o.color || G.color || "#1B1E24", old = document.querySelector(".epsgs"); if (old) old.remove();
    var d = document.createElement("div"); d.className = "epsgs";
    d.innerHTML = '<div class="epsg-hd" style="background:#14171C;box-shadow:inset 0 -4px 0 ' + col + '"><div class="epsg-ic" style="background:' + col + '">' + (G.icon || "") + '</div><div style="flex:1;min-width:0"><h1>' + esc(o.titre || "") + "</h1>" + (G.app ? "<p>" + esc(G.app) + "</p>" : "") + '</div><button type="button" class="epsgs-back">← Retour</button></div><div class="epsgs-in">' + (o.html || "") + "</div>";
    d.querySelector(".epsgs-back").onclick = function () { d.remove(); try { document.documentElement.style.overflow = ""; } catch (e) {} gateOpen(); };
    document.body.appendChild(d); try { document.documentElement.style.overflow = "hidden"; } catch (e) {} d.scrollTop = 0;
    return d;
  }
  window.EPSG = { register: gateRegister, open: gateOpen, close: gateClose, sheet: gateSheet };

  /* ================= Commentaires : 🎤 dictée (reconnaissance vocale de la tablette) et ✨ Reformuler (Claude, par le script commun) =================
     Toute appli marque ses champs de commentaire avec l'attribut data-eps-comment (facultatif : data-eps-ctx = éléments d'évaluation, data-eps-mode = "fiche" | "bulletin").
     Le texte envoyé ne contient jamais le nom de l'élève. Barre visible seulement en mode enseignant. */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, DICT = null;
  function setVal(ta, v) { ta.value = v; ["input", "change"].forEach(function (ev) { try { ta.dispatchEvent(new Event(ev, { bubbles: true })); } catch (e) {} }); }
  function actName() { return (GATE && GATE.app) || String(document.title || "EPS").split(/[–—·|-]/)[0].trim(); }
  /* 🤖 diagnostic de la liaison avec Claude (Réglages → Partage) : dit précisément ce qui bloque et quoi faire */
  function testClaude() {
    var cfg = shCfg(); if (!cfg) return Promise.resolve("○ Le partage entre tablettes n'est pas réglé : Claude passe par le script commun. Règle d'abord l'adresse et la clé.");
    return jsonp(cfg, { ai: "fiche", t: "Test : pieds précis, lit bien la voie, assurage encore hésitant.", act: "Escalade", ctx: "", lang: "" }, 90000).then(function (r) {
      if (!r) return "⚠ Pas de réponse du script.\n→ Vérifie la connexion, puis dans le script : Déployer > Gérer les déploiements : « Exécuter en tant que : moi » et « Qui a accès : Tout le monde ».";
      if (!r.keyOk) return "⚠ Le script refuse la clé du partage.\n→ Dans Code.gs, la ligne « const SECRET = '…' » doit contenir TA clé (celle de cette tablette), pas « CHANGE-MOI ». Enregistre puis redéploie (nouvelle version).";
      var e = String(r.aiErr || "");
      if (!e && r.ai == null) return "⚠ Le script en ligne est une ancienne version : il ne connaît pas encore Claude.\n→ Colle le dernier Code.gs, puis Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer (enregistrer ne suffit pas).";
      if (e) { var how = /ANTHROPIC_KEY/.test(e) ? "La clé Claude n'est pas dans le script.\n→ Paramètres du projet (⚙ à gauche) > Propriétés du script > ajouter ANTHROPIC_KEY = ta clé sk-ant-…"
          : /permission|autoris|UrlFetchApp|external_request/i.test(e) ? "Le script n'a pas encore l'autorisation d'appeler Claude.\n→ Dans l'éditeur, choisis la fonction « testerClaude » puis ▶ Exécuter, et accepte toutes les autorisations. Puis redéploie (nouvelle version)."
          : /API 401|invalid x-api-key|authentication/i.test(e) ? "La clé Claude est refusée par Anthropic.\n→ Recopie-la sans espace depuis console.anthropic.com (API Keys) dans la propriété ANTHROPIC_KEY."
          : /credit|billing|balance|API 402/i.test(e) ? "Le crédit de l'API Claude est épuisé ou non activé.\n→ console.anthropic.com > Billing : ajoute du crédit."
          : /API 404|model/i.test(e) ? "Le modèle demandé n'est pas disponible pour ta clé.\n→ Envoie-moi ce message, je changerai le modèle dans Code.gs."
          : /API 429|rate/i.test(e) ? "Trop de demandes en même temps.\n→ Réessaie dans une minute."
          : /API 5\d\d|overloaded/i.test(e) ? "Le service Claude est momentanément surchargé.\n→ Réessaie dans quelques minutes." : "Erreur inattendue.";
        return "⚠ " + how + "\n\nMessage exact : " + e; }
      var t = String(r.ai); if (/Ã|Â/.test(t)) return "⚠ Claude répond mais les accents sont mal lus.\n→ Le script en ligne n'est pas la dernière version : colle le dernier Code.gs et redéploie (nouvelle version).\n\nRéponse : " + t;
      return "✓ Claude répond correctement.\n\nExemple de reformulation : « " + t + " »";
    });
  }
  function reformuler(texte, o) {
    o = o || {}; var cfg = shCfg();
    if (!cfg) return Promise.reject(new Error("Règle d'abord le partage entre tablettes (Réglages), qui donne accès au script commun."));
    return jsonp(cfg, { ai: o.mode || "fiche", t: String(texte || "").slice(0, o.mode === "lecon" ? 3200 : (o.mode === "bulletin" || o.mode === "avis") ? 2200 : 1500), act: o.act || actName(), ctx: String(o.ctx || "").slice(0, 600), lang: o.lang || "" }, 90000).then(function (r) {
      if (!r) throw new Error("Pas de réponse du script en 90 s (connexion ? Claude surchargé ?) : réessaie.");
      if (!r.keyOk) throw new Error("Clé du partage refusée par le script");
      if (r.aiErr) throw new Error(/ANTHROPIC_KEY/.test(r.aiErr) ? "Clé Claude absente du script (Propriétés du script → ANTHROPIC_KEY)" : r.aiErr);
      if (r.ai == null) throw new Error("Le script n'est pas encore à jour : colle le nouveau Code.gs et redéploie (nouvelle version)");
      if (o.mode === "indic" && !(r.aiv >= 3)) throw new Error("Le script Google doit être mis à jour pour proposer des indicateurs : colle le nouveau Code.gs (dossier apps-script) et redéploie (nouvelle version)");
      if (o.mode === "lecon" && !(r.aiv >= 2)) throw new Error("Le script Google doit être mis à jour pour le bilan de leçon : colle le nouveau Code.gs (dossier apps-script) et redéploie (nouvelle version)");
      return r.ai; });
  }
  function dicter(ta, b) {
    if (DICT) { try { DICT.stop(); } catch (e) {} return; }
    var r = new SR(); r.lang = "fr-FR"; r.continuous = true; r.interimResults = false; DICT = r;
    var base = ta.value; b.classList.add("on"); b.innerHTML = "⏹ Arrêter";
    r.onresult = function (ev) { var t = ""; for (var i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) t += ev.results[i][0].transcript; if (!t) return;
      t = t.trim(); base = (base ? base.replace(/\s*$/, "") + (/[.!?]$/.test(base.trim()) ? " " : (base.trim() ? ". " : "")) : "") + t.charAt(0).toUpperCase() + t.slice(1); setVal(ta, base); };
    r.onend = function () { DICT = null; b.classList.remove("on"); b.innerHTML = "🎤 Dicter"; };
    r.onerror = function (e) { if (e.error === "not-allowed") alert("Autorise le micro pour ce site dans les réglages de la tablette."); };
    try { r.start(); } catch (e) { DICT = null; }
  }
  function commentBars() {
    var t = isTeacher() || HUB;
    document.querySelectorAll("textarea[data-eps-comment]").forEach(function (ta) {
      var bar = ta.nextElementSibling && ta.nextElementSibling.classList && ta.nextElementSibling.classList.contains("eps-cbar") ? ta.nextElementSibling : null;
      if (!bar) {
        bar = document.createElement("div"); bar.className = "eps-cbar";
        bar.innerHTML = (SR ? '<button type="button" data-cb="dict">🎤 Dicter</button>' : "") + '<button type="button" data-cb="ai">✨ Reformuler</button><button type="button" data-cb="undo" hidden>↶ Annuler</button><span></span>';
        ta.insertAdjacentElement("afterend", bar); var prev = null, msg = bar.querySelector("span");
        bar.addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return; e.preventDefault();
          if (b.dataset.cb === "dict") return dicter(ta, b);
          if (b.dataset.cb === "undo") { if (prev != null) setVal(ta, prev); prev = null; b.hidden = true; msg.textContent = ""; return; }
          if (!ta.value.trim() && !ta.dataset.epsCtx) { msg.textContent = "Dicte ou tape d'abord quelques notes."; return; }
          b.disabled = true; msg.textContent = "Claude reformule…";
          reformuler(ta.value, { mode: ta.dataset.epsMode, ctx: ta.dataset.epsCtx }).then(function (v) {
            prev = ta.value; setVal(ta, v); bar.querySelector('[data-cb="undo"]').hidden = false; msg.textContent = "✓ Reformulé (vérifie avant d'enregistrer)"; })
            .catch(function (err) { msg.textContent = "⚠ " + (err && err.message || err); })
            .then(function () { b.disabled = false; });
        });
      }
      bar.style.display = t ? "" : "none";
    });
  }
  (function () {
    var st = document.createElement("style");
    st.textContent = ".eps-cbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0 4px}.eps-cbar button{height:36px;border-radius:10px;border:1.5px solid #D8D2C4;background:#fff;color:#14171C;font:700 14px system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;padding:0 12px;cursor:pointer}" +
      ".eps-cbar button.on{background:#C0392B;border-color:#C0392B;color:#fff}.eps-cbar button:disabled{opacity:.5}.eps-cbar span{font:600 13px system-ui,sans-serif;color:#6A6F78}";
    (document.head || document.documentElement).appendChild(st);
    setInterval(commentBars, 1200);
  })();

  /* ================= 🔒 Mode élève : pas de retour arrière, pas de sélection de texte =================
     - Retour arrière (bouton ou geste Android, Chrome) : bloqué tant qu'on n'est pas en mode enseignant (une entrée d'historique est remise à chaque retour).
     - Sélection de texte, loupe et menu « Copier / Rechercher » de Chrome : désactivés, sauf dans les champs de saisie.
     En mode enseignant (html.eps-teach), tout redevient normal. Le cadre « Vue élève » n'est pas concerné. */
  (function eleveLock() {
    try { var st = document.createElement("style"); st.id = "eps-nosel";
      st.textContent = "html:not(.eps-teach) body,html:not(.eps-teach) body *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}" +
        "html:not(.eps-teach) input,html:not(.eps-teach) textarea,html:not(.eps-teach) select,html:not(.eps-teach) [contenteditable],html:not(.eps-teach) [contenteditable] *{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}";
      (document.head || document.documentElement).appendChild(st); } catch (e) {}
    function eleve() { return !document.documentElement.classList.contains("eps-teach") && !isTeacher(); }
    document.addEventListener("contextmenu", function (e) { if (!eleve()) return; var t = e.target; if (t && t.closest && t.closest("input,textarea,[contenteditable]")) return; e.preventDefault(); }, true);
    document.addEventListener("selectstart", function (e) { if (!eleve()) return; var t = e.target; if (t && t.closest && t.closest("input,textarea,[contenteditable]")) return; e.preventDefault(); }, true);
    if (window.top !== window) return; /* aperçu « Vue élève » dans un cadre : pas d'historique à bloquer */
    function arm() { try { if (!(history.state && history.state.epsLock)) history.pushState(Object.assign({}, history.state || {}, { epsLock: 1 }), "", location.href); } catch (e) {} }
    window.addEventListener("popstate", function () { if (eleve()) { arm(); } }, true);
    /* Chrome ne compte une entrée d'historique que si elle suit un geste : on la (re)pose au premier appui */
    document.addEventListener("pointerdown", function () { if (eleve()) arm(); }, true);
    setTimeout(function () { if (eleve()) arm(); }, 600);
  })();
  /* ================= Accès enseignant caché : 3 appuis rapides sur le logo (ou le maintenir 2 s) =================
     Logos : barre de l'accueil (.mark), barre de chaque appli, écran « Choisis ta classe ».
     L'appli peut fournir window.epsTeacherEntry() ; sinon : celle de l'écran de classe, sinon le code enseignant commun. */
  var LOGOS = ".mark,.epsg-ic,header .mk,.ebar .ei,.top h1 .ei,.brand .ei,.topline .ei,.chd h1,[data-eps-logo]";
  function teacherEntry() {
    if (window.EPS_VUE_ELEVE) return; /* cadre « Vue élève » : pas d'accès enseignant */
    try { navigator.vibrate && navigator.vibrate(60); } catch (e) {}
    if (HUB) { if (!isTeacher()) window.EPSD.teacherToggle(); return; }
    if (typeof window.epsTeacherEntry === "function") { gateClose(); try { window.epsTeacherEntry(); } catch (e) {} return; }
    if (GATE && GATE.teacher) { gateClose(); try { GATE.teacher(); } catch (e) {} return; }
    askCode().then(function (ok) { if (ok) { setHubTeach(true); location.reload(); } });
  }
  (function () {
    var st = document.createElement("style");
    st.textContent = ".mark,.epsg-ic,header .mk,.ebar .ei,.top h1 .ei,.brand .ei,.topline .ei,.chd h1,[data-eps-logo]{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none}" +
      ".eps-hold{animation:epshold 1.8s linear forwards}@keyframes epshold{from{box-shadow:0 0 0 0 rgba(255,201,60,.0)}to{box-shadow:0 0 0 5px rgba(255,201,60,.9)}}";
    (document.head || document.documentElement).appendChild(st);
    var tm = 0, t2 = 0, el = null, sx = 0, sy = 0;
    function stop() { clearTimeout(tm); clearTimeout(t2); if (el) el.classList.remove("eps-hold"); el = null; }
    document.addEventListener("pointerdown", function (e) {
      var l = e.target.closest && e.target.closest(LOGOS); if (!l) return;
      stop(); el = l; sx = e.clientX; sy = e.clientY;
      t2 = setTimeout(function () { if (el) el.classList.add("eps-hold"); }, 1200);
      tm = setTimeout(function () { stop(); teacherEntry(); }, 2000);
    }, true);
    document.addEventListener("pointermove", function (e) { if (el && Math.hypot(e.clientX - sx, e.clientY - sy) > 14) { stop(); taps = []; } }, true);
    /* 👆👆👆 3 appuis rapides sur le logo (en moins de 1,2 s) : accès enseignant, sans attendre */
    var taps = [], tapEl = null;
    document.addEventListener("pointerup", function (e) {
      var l = el; if (!l || !(e.target.closest && e.target.closest(LOGOS))) { taps = []; return; }
      var now = Date.now(); if (tapEl !== l) { taps = []; tapEl = l; } taps = taps.filter(function (t) { return now - t < 1200; }); taps.push(now);
      if (taps.length >= 3) { taps = []; stop(); teacherEntry(); }
    }, true);
    ["pointerup", "pointercancel"].forEach(function (ev) { document.addEventListener(ev, stop, true); });
    document.addEventListener("contextmenu", function (e) { if (e.target.closest && e.target.closest(LOGOS)) e.preventDefault(); }, true);
  })();
  (window.EPSG_Q || []).forEach(gateRegister);
  window.EPSG_Q = { push: gateRegister };
  /* ================= Export Pronote (commun à toutes les applis) =================
     EPSR.pronote({app, classe, titre, cols:[{t:'Note /20'}, …], rows:[{nom, prenom, v:[valeurs], st:'ABS'|'DISP'|''}]})
     → fenêtre : élèves dans l'ordre alphabétique de Pronote (NOM puis prénom), notes à la virgule, codes Pronote
       A (absent), D (dispensé / inapte), N (non noté) ; copie de la colonne à coller dans le devoir, copie noms + notes,
       fichier .csv (Excel) pour l'import du Client PRONOTE. */
  function pnCode(v, st) {
    st = String(st || "");
    if (/disp|inap|^d$/i.test(st)) return "D";
    if (/abs|^a$/i.test(st)) return "A";
    if (v == null || v === "" || isNaN(v)) return "N";
    return String(Math.round(+v * 100) / 100).replace(".", ",");
  }
  function pronote(o) {
    o = o || {}; var cols = o.cols && o.cols.length ? o.cols : [{ t: "Note /20" }];
    var col = new Intl.Collator("fr", { sensitivity: "base" });
    var rows = (o.rows || []).slice().sort(function (a, b) { return col.compare(a.nom || "", b.nom || "") || col.compare(a.prenom || "", b.prenom || ""); });
    var cell = function (r, i) { return pnCode(r.v ? r.v[i] : null, r.st); };
    var sel = 0, avecNoms = false;
    if (!document.getElementById("epspn-css")) { var st = document.createElement("style"); st.id = "epspn-css"; st.textContent =
      ".epspn{position:fixed;inset:0;z-index:2147483300;background:rgba(20,22,27,.55);display:flex;align-items:center;justify-content:center;padding:14px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#14171C}" +
      ".epspn .bx{background:#fff;border-radius:18px;max-width:760px;width:100%;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden}" +
      ".epspn .hd{background:#14171C;color:#fff;padding:14px 18px;box-shadow:inset 0 -4px 0 var(--pn,#666);display:flex;align-items:center;gap:10px}.epspn .hd b{font-size:18px}.epspn .hd small{display:block;color:#A9AEB8}" +
      ".epspn .hd button{margin-left:auto;background:transparent;border:1.5px solid #3A3F47;color:#D5D8DE;border-radius:10px;height:38px;padding:0 12px;font:700 14px system-ui,sans-serif;cursor:pointer}" +
      ".epspn .bd{padding:14px 18px;overflow:auto}.epspn .m{color:#6A6F78;font-size:14px;margin:4px 0 10px}" +
      ".epspn .cs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}.epspn .cs button{border:2px solid #E6E1D6;background:#fff;border-radius:999px;padding:6px 12px;font:700 14px system-ui,sans-serif;cursor:pointer}.epspn .cs button.on{border-color:var(--pn,#666);background:var(--pn,#666);color:#fff}" +
      ".epspn table{border-collapse:collapse;width:100%;font-size:14px}.epspn th,.epspn td{border-bottom:1px solid #E6E1D6;padding:5px 8px;text-align:left}.epspn th{background:#F5F3EE;font-size:12px;color:#6A6F78}.epspn td.n{text-align:center;font-weight:800;font-variant-numeric:tabular-nums}.epspn td.k{color:#9aa0a8;width:28px}.epspn td.hl{background:#f3eef8}" +
      ".epspn .cd{display:inline-block;min-width:22px;border-radius:6px;padding:0 5px;font-size:12px;background:#F5F3EE;color:#6A6F78}" +
      ".epspn .ft{padding:12px 18px;border-top:1px solid #E6E1D6;display:flex;flex-wrap:wrap;gap:8px;align-items:center}.epspn .ft button{height:42px;border-radius:12px;border:2px solid var(--pn,#666);background:#fff;font:800 14px system-ui,sans-serif;padding:0 14px;cursor:pointer;color:#14171C}.epspn .ft button.p{background:var(--pn,#666);color:#fff}" +
      ".epspn ol{margin:6px 0 0;padding-left:20px;font-size:14px;color:#3a3f47}.epspn ol li{margin:3px 0}.epspn label{font-size:14px;display:flex;align-items:center;gap:6px}";
      document.head.appendChild(st); }
    var ov = document.createElement("div"); ov.className = "epspn"; ov.style.setProperty("--pn", o.color || "#6B3FA0");
    var nb = { A: 0, D: 0, N: 0 }; rows.forEach(function (r) { var c = cell(r, 0); if (nb[c] != null) nb[c]++; });
    function texte(tout) {
      return rows.map(function (r) {
        var v = tout ? cols.map(function (c, i) { return cell(r, i); }) : [cell(r, sel)];
        return (avecNoms ? [r.nom || "", r.prenom || ""] : []).concat(v).join("\t");
      }).join("\r\n");
    }
    function copier(t, msg) {
      var ok = function () { var b = ov.querySelector("[data-msg]"); if (b) b.textContent = "✓ " + msg; };
      try { navigator.clipboard.writeText(t).then(ok, function () { fb(); }); } catch (e) { fb(); }
      function fb() { var ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); ok(); } catch (x) { prompt("Copie ces notes :", t); } ta.remove(); }
    }
    function csv() {
      var q = function (x) { x = String(x == null ? "" : x); return /[;"\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
      var lines = [["Nom", "Prénom"].concat(cols.map(function (c) { return c.t; })).map(q).join(";")].concat(rows.map(function (r) { return [r.nom, r.prenom].concat(cols.map(function (c, i) { return cell(r, i); })).map(q).join(";"); }));
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
      var sf = function (x) { return String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9_-]+/g, "_"); };
      a.download = sf(o.app || "EPS") + "_" + sf(o.classe) + "_Pronote.csv"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    }
    function render() {
      ov.innerHTML = '<div class="bx"><div class="hd"><div><b>📋 Notes pour Pronote</b><small>' + esc((o.app || "") + (o.classe ? " · " + o.classe : "") + (o.titre ? " · " + o.titre : "")) + '</small></div><button data-x>✕ Fermer</button></div><div class="bd">' +
        (cols.length > 1 ? '<div class="m">Colonne à copier (un devoir Pronote par colonne) :</div><div class="cs">' + cols.map(function (c, i) { return '<button data-c="' + i + '" class="' + (i === sel ? "on" : "") + '">' + esc(c.t) + "</button>"; }).join("") + "</div>" : "") +
        '<p class="m">Élèves dans l\'ordre de Pronote (NOM puis prénom). Codes : <span class="cd">A</span> absent · <span class="cd">D</span> dispensé · <span class="cd">N</span> non noté.' + (nb.N ? " <b>" + nb.N + " élève(s) non noté(s).</b>" : "") + "</p>" +
        '<table><tr><th></th><th>NOM Prénom</th>' + cols.map(function (c, i) { return "<th style=\"text-align:center\">" + esc(c.t) + "</th>"; }).join("") + "</tr>" +
        rows.map(function (r, k) { return '<tr><td class="k">' + (k + 1) + "</td><td><b>" + esc(r.nom || "") + "</b> " + esc(r.prenom || "") + "</td>" + cols.map(function (c, i) { return '<td class="n' + (i === sel ? " hl" : "") + '">' + esc(cell(r, i)) + "</td>"; }).join("") + "</tr>"; }).join("") + "</table>" +
        '<ol><li>Dans Pronote : <b>Notes › Saisie des notes</b>, crée le devoir (sur 20, ou sur le barème de la colonne).</li><li>Ici : <b>Copier la colonne</b>.</li><li>Dans Pronote, clique dans la case de note du <b>premier élève</b> puis <b>Ctrl + V</b> (ou appui long › Coller). Vérifie 2 ou 3 élèves : l\'ordre doit être le même.</li><li>Si le collage ne prend pas sur ton navigateur : <b>Fichier Excel</b>, puis « Importer des notes » depuis le Client PRONOTE.</li></ol>' +
        '</div><div class="ft"><button class="p" data-cp>📋 Copier la colonne</button>' + (cols.length > 1 ? "<button data-all>📋 Copier toutes les colonnes</button>" : "") + '<button data-csv>⬇ Fichier Excel (.csv)</button><label><input type="checkbox" data-nm ' + (avecNoms ? "checked" : "") + "> avec les noms</label><span data-msg style=\"font-weight:700;color:#2e7d4f\"></span></div></div>";
      ov.querySelector("[data-x]").onclick = function () { ov.remove(); };
      ov.querySelectorAll("[data-c]").forEach(function (b) { b.onclick = function () { sel = +b.dataset.c; render(); }; });
      ov.querySelector("[data-cp]").onclick = function () { copier(texte(false), rows.length + " notes copiées (" + cols[sel].t + ")"); };
      var al = ov.querySelector("[data-all]"); if (al) al.onclick = function () { copier(texte(true), rows.length + " lignes copiées (" + cols.length + " colonnes)"); };
      ov.querySelector("[data-csv]").onclick = csv;
      ov.querySelector("[data-nm]").onchange = function (e) { avecNoms = e.target.checked; };
    }
    ov.addEventListener("click", function (e) { if (e.target === ov) ov.remove(); });
    render(); document.body.appendChild(ov);
  }
  window.EPSR = { pronote: pronote, get: rget, set: function (o) { var r = rget(), ch = false; Object.keys(o || {}).forEach(function (k) { if (JSON.stringify(r[k]) !== JSON.stringify(o[k])) { r[k] = o[k]; if (SHARED.indexOf(k) >= 0) ch = true; } }); rset(r, ch); }, open: function () { askCode().then(function (ok) { if (ok) reglages(); }); }, pdfHead: pdfHead, htmlHead: htmlHead, head: headInfo, save: backupSave };
  /* ===== Boîte de dépôt des auto-positionnements (lien personnel des fiches élèves) =====
     Un seul script : le script commun (dès qu'il a la version qui reçoit les dépôts, drapeau « dropv »).
     Le script de Danse (ancien réglage de Danse) n'est plus utilisé pour les nouveaux liens, mais il est encore relevé
     tant qu'il est réglé, pour ne pas perdre les positionnements des liens déjà distribués.
     boite(propre) → {envoi: cfg|null (pour les nouveaux liens), lire: [cfg…] (à relever)} ; cfg = {url, key, src, id} */
  function boite(propre) {
    function ok(c, src) { return c && /^https:\/\/\S+\/exec$/.test(String(c.url || "").trim()) && String(c.key || "").trim() ? { url: String(c.url).trim(), key: String(c.key).trim(), src: src, id: (function (t) { var h = 5381; for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); })(String(c.url).trim()) } : null; }
    var pr = ok(propre, "appli"), dv = false; try { dv = localStorage.getItem("eps.share.dropv") === "1"; } catch (e) {}
    var co = dv ? ok(shareGet(), "commun") : null, R = {}; try { R = (JSON.parse(localStorage.getItem("danse-eps-v1") || "{}") || {}).reglages || {}; } catch (e) {}
    var da = ok({ url: R.envoiUrl, key: R.envoiCle }, "danse"), lire = [];
    [pr, co, da].forEach(function (c) { if (c && !lire.some(function (x) { return x.url === c.url; })) lire.push(c); });
    return { envoi: pr || co || da, lire: lire };
  }
  /* renommer une classe depuis une appli : la liste commune suit (ancien nom gardé), ainsi que les dispenses de cette classe */
  async function renameClass(old, nom) {
    if (!old || !nom || norm(old) === norm(nom)) return;
    all().forEach(function (x) { if (x.classe && norm(x.classe) === norm(old)) { x.classe = nom; put(x); } });
    try { await shareList(nom, old, { esc: 1, rel: 1, ori: 1, vol: 1, bad: 1, dan: 1 }); } catch (e) {}
  }
  window.EPSD = { refresh: function () { try { draw(); } catch (e) {} },
    boite: boite, renameClass: renameClass,
    reformuler: function (t, o) { return reformuler(t, o); },
    shareSettings: function () { return shareSettings(); }, devId: function () { return devInfo().id; }, devName: function () { return devInfo().nom || ""; },
    tabList: function (app) { var V = stLd(KTB), L = Object.keys(V.items).map(function (k) { return V.items[k]; }).filter(function (x) { return x && x.at && (!app || x.app === app) && x.mode !== "enseignant" && Date.now() - x.at < 60 * 864e5; }); return L.sort(function (a, b) { return String(a.nom || "zz").localeCompare(String(b.nom || "zz"), "fr", { numeric: true }) || b.at - a.at; }); }, sigCheck: function () { sigCheck(); },
    tablets: function () { return tablets(); }, signal: function (t, min, tout) { return t ? sigSend(t, min, tout) : signal(); },
    store: function (o) { if (!STORES.some(function (x) { return x.key === o.key; })) STORES.push(o); clearTimeout(timer); timer = setTimeout(sync, 2000); },
    /* ✨ version élève d'un critère (éditeurs de grille propres à Volley, Badminton, Danse) : Claude propose les 4 descripteurs « Je… »
       dans les champs élève (en jaune, non enregistrés) ; enregistrement seulement au 2e appui « ✓ Valider » après relecture. */
    versionEleve: function (btn, srcs, dsts, save) {
      dsts = Array.prototype.slice.call(dsts || []);
      if (btn.dataset.pending === "1") { save(dsts.map(function (t) { return t.value; })); dsts.forEach(function (t) { t.style.background = ""; }); btn.dataset.pending = ""; btn.textContent = "✓ Version élève enregistrée"; setTimeout(function () { btn.textContent = "✨ Proposer la version élève"; }, 2500); return; }
      btn.disabled = true; btn.textContent = "Claude rédige…"; var out = [], i = 0;
      (function next() {
        if (i >= dsts.length) { dsts.forEach(function (t, k) { t.value = out[k]; t.style.background = "#FFF6E0"; }); btn.disabled = false; btn.dataset.pending = "1"; btn.textContent = "✓ Valider la version élève (après relecture)"; return; }
        reformuler(String(srcs[i] || ""), { mode: "eleve" }).then(function (t) { out.push(String(t || "").trim()); i++; next(); },
          function (e) { btn.disabled = false; btn.textContent = "✨ Proposer la version élève"; alert("⚠ " + (e && e.message || e)); });
      })();
    },
    demo: { on: function () { return demoOn(); }, create: function () { return demoCreate(); }, remove: function () { return demoRemove(); }, nom: "DÉMO (fictive)" },
    appel: { get: function (c, d) { var o = abGet(c, d); return o ? (o.abs || []).slice() : []; }, fait: function (c, d) { return !!abGet(c, d); }, set: function (c, abs) { abSet(c, abs); },
      absent: function (c, n, d) { return abIs(c, n, d); }, dispense: function (c, n) { return !!find(c, n); },
      presents: function (c, R) { return (R || []).filter(function (n) { return !abIs(c, n); }); } },
    sim: { on: function () { return !!window.EPS_SIM; }, enter: function (n) { return simEnter(n); }, exit: function () { return simExit(); } },
    testClaude: function () { return testClaude(); },
    search: function () { searchStudents(); },
    evalsOf: function (n, c) { return evalsOf(n, c); }, qr: function () { return loadQR(); },
    overview: function () { return overview(); },
    edtSlots: function (c, a, f, n) { return edtSlots(c, a, f, n); },
    edtInfo: function () { var D = (eget() || {}).data; return D && D.w ? { w: D.w.slice(), vac: (D.vac || []).slice() } : null; },
    check: function () { check(); },
    restoreAll: function () { return restoreAll(); },
    publish: function (o) { publish(o); }, bilLink: function () { return bilLink(); }, bilans: function (c) { bilans(c); },
    bulletin: function (c) { bulletin(c); },
    syncSoon: function () { clearTimeout(timer); timer = setTimeout(sync, 4000); },
    /* synchro immédiate d'un seul magasin (ex. leçon en cours : relevé toutes les quelques secondes) */
    syncOne: function (k) { var cfg = shCfg(), st = STORES.filter(function (x) { return x.key === k; })[0]; if (!cfg || !st || st._busy || navigator.onLine === false) return Promise.resolve(false);
      st._busy = true; return syncStore(cfg, st).then(function () { st._busy = false; return true; }, function () { st._busy = false; return false; }); },
    /* requête longue au script commun (POST, réponse lisible) : ex. {lc:{…}} pour les leçons (Claude) */
    post: function (body) { var cfg = shCfg(); if (!cfg) return Promise.reject(new Error("Règle d'abord le partage entre tablettes (Réglages), qui donne accès au script commun."));
      body = Object.assign({ key: cfg.key }, body);
      /* attente plafonnée à 4 min (un long document peut prendre du temps), message clair au lieu d'une attente sans fin */
      var ac = window.AbortController ? new AbortController() : null, tm = setTimeout(function () { try { ac && ac.abort(); } catch (e) {} }, 240000);
      return fetch(cfg.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body), signal: ac ? ac.signal : undefined }).then(function (r) { clearTimeout(tm); return r.json(); },
        function (e) { clearTimeout(tm); throw new Error(e && e.name === "AbortError" ? "pas de réponse après 4 min : réessaie, ou découpe le document" : (navigator.onLine === false ? "pas de connexion Internet" : "réseau : " + (e && e.message || e))); }); },
    shared: function () { return !!shCfg(); }, applyLists: function () { return applyLocal(); }, share: shareSettings,  list: all, active: activeOn, find: find, label: label, manage: manage, importList: importList, editLists: editLists, shareSettings: function () { askCode().then(function (ok) { if (ok) shareSettings(); }); }, show: showList, sync: sync,
    /* console ordinateur : enregistrer une liste commune (noms exacts, activités) et sa voie */
    listSave: function (nom, names, off, old) { return shareList(nom, old || "", { esc: 1, rel: 1, ori: 1, vol: 1, bad: 1, dan: 1 }, names, off); },
    listVoie: function (nom, voie) { var LV = lld(), rule = /^(TGT|2GT|1GT)/.test(String(nom).replace(/[\s._-]+/g, "").toUpperCase()) ? "gt" : "pro";
      Object.keys(LV.items).forEach(function (k) { var o = LV.items[k]; if (!o || o.del || norm(o.nom) !== norm(nom)) return; var want = voie && voie !== rule ? voie : undefined; if (o.voie === want) return; if (want) o.voie = want; else delete o.voie; o.ts = Date.now(); LV.pend[o.id] = stamp(); LV.app[o.id] = JSON.stringify(o); }); lsv(LV); setTimeout(sync, 300); },
    askCode: function () { return askCode(); },
    listDelete: function (nom) { return deleteList(nom); }, syncNow: function () { return sync(); }, isTeacher: function () { return isTeacher(); },
    teacherToggle: function () { if (isTeacher()) { unlockedUntil = 0; setHubTeach(false); } else askCode().then(function (ok) { if (ok) setHubTeach(true); }); } };

  /* ================= 🗑 Corbeille (commune) =================
     Magasin « eps.trash.v1 » (tk|), synchronisé : {id:"t<date>", k:"t", type, label, sub, at, its:[{key, data}], lst:<liste de classe>, el:{lid, nom}}.
     EPSD.trash.keep({type, label, sub, items:[{key, id}]}) AVANT d'effacer un élément d'un magasin commun : sa copie est gardée 30 jours.
     Classes supprimées et élèves retirés d'une liste y passent d'office (deleteList, shareList). Restaurer = réécrire la copie avec une date neuve
     (elle l'emporte sur l'effacement, sur toutes les tablettes). Toute nouvelle suppression définitive côté enseignant doit passer par keep(). */
  var KTR = "eps.trash.v1", TR_J = 30;
  function trKeep(o) { try { o = o || {}; var its = []; (o.items || []).forEach(function (x) { var d = stLd(x.key).items[x.id]; if (d && !d.del) its.push({ key: x.key, data: JSON.parse(JSON.stringify(d)) }); });
      if (!its.length && !o.lst && !o.el) return false; stPutRaw(KTR, { id: "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), k: "t", type: String(o.type || "Élément"), label: String(o.label || "").slice(0, 120), sub: String(o.sub || "").slice(0, 120), at: Date.now(), its: its, lst: o.lst || null, el: o.el || null }); try { timer && clearTimeout(timer); timer = setTimeout(sync, 2000); } catch (e) {} return true; } catch (e) { return false; } }
  function trList() { var V = stLd(KTR), L = [], lim = Date.now() - TR_J * 864e5; Object.keys(V.items).forEach(function (k) { var o = V.items[k]; if (!o || o.del || o.k !== "t") return; if ((o.at || 0) < lim) { stPutRaw(KTR, { id: k, del: 1 }); return; } L.push(o); }); return L.sort(function (a, b) { return b.at - a.at; }); }
  async function trRestore(id) { var o = stLd(KTR).items[id]; if (!o || o.del) return false;
    (o.its || []).forEach(function (x) { if (x && x.key && x.data && x.data.id != null) { var d = JSON.parse(JSON.stringify(x.data)); delete d.del; stPutRaw(x.key, d); } });
    if (o.lst && o.lst.id) { var L = lld(), it = JSON.parse(JSON.stringify(o.lst)); it.del = false; it.ts = Date.now(); L.items[it.id] = it; L.pend[it.id] = stamp(); L.app[it.id] = JSON.stringify(it); lsv(L); await applyLocal(); }
    if (o.el && o.el.lid && o.el.nom) { var L2 = lld(), it2 = L2.items[o.el.lid]; if (it2 && !it2.del) { var k = nkey(o.el.nom); it2.rm = (it2.rm || []).filter(function (x) { return x !== k; }); if (!(it2.el || []).some(function (n) { return nkey(n) === k; })) (it2.el = it2.el || []).push(o.el.nom); it2.ts = Date.now(); L2.pend[it2.id] = stamp(); L2.app[it2.id] = JSON.stringify(it2); lsv(L2); await applyLocal(); } else return false; }
    stPutRaw(KTR, { id: id, del: 1 }); try { document.dispatchEvent(new CustomEvent("eps-ref")); document.dispatchEvent(new CustomEvent("eps-trash")); } catch (e) {} setTimeout(sync, 300); return true; }
  function trOpen() { var o = overlay('<div id="epstr"></div>'), box = o.querySelector("#epstr");
    function draw() { var L = trList();
      box.innerHTML = "<h3>🗑 Corbeille</h3><p class=\"m\">Ce que tu as effacé depuis " + TR_J + " jours. Restaurer le remet en place sur toutes les tablettes.</p>" +
        (L.length ? L.map(function (x, i) { var j = Math.floor((Date.now() - x.at) / 864e5); return '<div class="epsd-row"><b>' + esc(x.label || x.type) + "</b><span>" + esc(x.type) + (x.sub ? " · " + esc(x.sub) : "") + " · " + (j ? "il y a " + j + " j" : "aujourd'hui") + '</span><button type="button" data-tr="' + i + '" style="min-height:40px;padding:0 12px;border-radius:10px;border:1.5px solid #14171C;background:#fff;font-weight:800">↺ Restaurer</button></div>'; }).join("") : '<p class="m">La corbeille est vide.</p>') +
        '<div class="epsd-act"><button data-x>✕ Fermer</button></div>';
      box.querySelectorAll("[data-tr]").forEach(function (b) { b.onclick = function () { var x = L[+b.dataset.tr]; b.disabled = true; trRestore(x.id).then(function (ok) { if (!ok) alert("Impossible de restaurer : la classe de cet élève n'existe plus. Restaure d'abord la classe."); draw(); }); }; }); }
    draw(); try { EPSD.store({ key: KTR, pre: "tk|", onChange: function () { if (document.body.contains(box)) draw(); } }); } catch (e) {} return o; }
  EPSD.trash = { keep: trKeep, list: trList, restore: trRestore, open: trOpen };

  /* ================= Bouton « Accueil » (sauf sur la page d'accueil) =================
     Un appui : accueil de l'application en cours (window.epsAppHome() si l'application le fournit, sinon sa page de départ).
     Maintenir 3 secondes : menu général (/), avec un anneau qui se remplit.
     Glisser : déplacer le bouton (position mémorisée). */
  function appRoot() { var p = location.pathname, pre = p.indexOf(BASE) === 0 ? BASE : "/", seg = p.slice(pre.length).split("/").filter(Boolean)[0]; return seg && !/\./.test(seg) ? pre + seg + "/" : BASE; }
  function appHome() {
    if (typeof window.epsAppHome === "function") { try { window.epsAppHome(); return; } catch (e) {} }
    location.href = appRoot();
  }
  function addHome() {
    var HOLD = 2000;
    var b = document.createElement("button");
    b.type = "button"; b.id = "eps-home";
    b.setAttribute("aria-label", "Accueil de l'application (maintenir 2 secondes : toutes les applications EPS)");
    b.title = "Appui : accueil de l'application · Maintenir 2 s : toutes les applications";
    b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="position:relative"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>';
    var s = b.style, BG = "rgba(27,30,36,.78)", slot = epsSlot();
    if (slot) { /* bouton logé dans la barre du haut de l'appli (charte commune) */
      BG = "transparent"; b.className = "epsb";
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg><span>Accueil</span>';
    } else {
    s.position = "fixed"; s.zIndex = "2147483000"; s.border = "0"; s.padding = "0"; s.cursor = "pointer";
    s.left = "calc(10px + env(safe-area-inset-left, 0px))"; s.bottom = "calc(10px + env(safe-area-inset-bottom, 0px))";
    s.width = "46px"; s.height = "46px"; s.borderRadius = "50%";
    s.display = "grid"; s.placeItems = "center";
    s.background = BG; s.color = "#fff";
    s.boxShadow = "0 2px 8px rgba(0,0,0,.25)";
    s.webkitTapHighlightColor = "transparent"; s.touchAction = "none"; s.userSelect = "none"; s.webkitUserSelect = "none"; s.webkitTouchCallout = "none";
    try { var p = JSON.parse(localStorage.getItem("eps.homeBtn") || "null"); if (p) { s.left = Math.min(p.x, innerWidth - 50) + "px"; s.top = Math.min(p.y, innerHeight - 50) + "px"; s.bottom = "auto"; } } catch (e) {}
    }
    var tip = document.createElement("div");
    tip.textContent = "Maintiens pour toutes les applications…";
    var ts = tip.style; ts.position = "fixed"; ts.zIndex = "2147483001"; ts.background = "rgba(27,30,36,.92)"; ts.color = "#fff"; ts.font = "600 14px system-ui,sans-serif";
    ts.padding = "7px 12px"; ts.borderRadius = "10px"; ts.pointerEvents = "none"; ts.display = "none"; ts.whiteSpace = "nowrap";
    var pre = false;
    /* départ immédiat vers la page commune : écran « Toutes les applications… » tout de suite, sans attendre le chargement */
    function goHub() {
      var o = document.createElement("div");
      o.style.cssText = "position:fixed;inset:0;z-index:2147483646;background:#F4F1EA;display:grid;place-items:center;font:800 22px system-ui,sans-serif;color:#1B1E24";
      o.textContent = "Toutes les applications…"; document.body.appendChild(o);
      location.href = BASE;
    }
    var down = false, drag = false, fired = false, sx = 0, sy = 0, ox = 0, oy = 0, t0 = 0, raf = 0, pid = null;
    function ring(f) { s.background = f > 0 ? "conic-gradient(#ffc93c " + (f * 360) + "deg, " + BG + " 0)" : BG; }
    function showTip() { var r = b.getBoundingClientRect(); ts.left = Math.min(r.right + 8, innerWidth - 270) + "px"; ts.top = (r.top + 10) + "px"; ts.display = "block"; }
    function stop() { cancelAnimationFrame(raf); raf = 0; ring(0); ts.display = "none"; }
    function tick() {
      if (!down || drag) return;
      var f = Math.min(1, (performance.now() - t0) / HOLD);
      ring(f); if (f > 0.12) showTip();
      if (f > 0.4 && !pre) { pre = true; try { var l = document.createElement("link"); l.rel = "prefetch"; l.href = BASE; document.head.appendChild(l); } catch (x) {} }
      if (f >= 1) { fired = true; stop(); goHub(); return; }
      raf = requestAnimationFrame(tick);
    }
    b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    b.addEventListener("pointerdown", function (e) {
      if (e.button > 0) return;
      down = true; drag = false; fired = false; pid = e.pointerId;
      sx = e.clientX; sy = e.clientY; ox = e.clientX - b.offsetLeft; oy = e.clientY - b.offsetTop;
      try { b.setPointerCapture(e.pointerId); } catch (x) {}
      t0 = performance.now(); raf = requestAnimationFrame(tick);
    });
    b.addEventListener("pointermove", function (e) {
      if (!down) return;
      if (slot) return;
      if (!drag && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) { drag = true; stop(); s.background = "rgba(217,72,31,.9)"; }
      if (!drag) return; e.preventDefault();
      var x = Math.max(4, Math.min(innerWidth - 50, e.clientX - ox)), y = Math.max(4, Math.min(innerHeight - 50, e.clientY - oy));
      s.left = x + "px"; s.top = y + "px"; s.bottom = "auto";
    });
    function end(e, cancel) {
      if (!down) return; down = false; stop();
      try { b.releasePointerCapture(pid); } catch (x) {}
      if (drag) { s.background = BG; try { localStorage.setItem("eps.homeBtn", JSON.stringify({ x: b.offsetLeft, y: b.offsetTop })); } catch (x) {} return; }
      if (!fired && !cancel) appHome();
    }
    b.addEventListener("pointerup", function (e) { end(e, false); });
    b.addEventListener("pointercancel", function (e) { end(e, true); });
    b.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); appHome(); } });
    (slot || document.body).appendChild(b); document.body.appendChild(tip);
  }
  /* ================= Bouton « Mise à jour » : récupère les nouveautés (données et application) sans quitter ================= */
  function addUpdate() {
    var b = document.createElement("button");
    b.type = "button"; b.id = "eps-upd"; b.title = "Forcer la mise à jour (données et application)"; b.setAttribute("aria-label", "Mettre à jour");
    b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.9-4M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4"/></svg>';
    var s = b.style, slot = epsSlot();
    /* 🔄 réservé à l'enseignant (masqué côté élève : html:not(.eps-teach)) : dans la barre du haut si elle est visible, sinon bouton rond en haut à droite (placeUpd) */
    try { var cs = document.createElement("style"); cs.textContent = "#eps-upd.eps-upd-n{margin-left:auto;align-self:center;flex:none;position:sticky;right:4px;z-index:3;background:#14171C!important}#eps-upd.eps-upd-l{background:#fff!important;color:#14171C!important;border:1.5px solid #E6E1D6!important}[data-eps-upd-slot]{display:inline-flex;align-items:center;gap:6px}html:not(.eps-teach):not(.eps-tool) #eps-upd{display:none!important}html.eps-tous:not(.eps-teach) #eps-upd{display:none!important}@media print{#eps-upd{display:none!important}}"; document.head.appendChild(cs); } catch (e) {}
    /* outils réservés à l'enseignant (pas de mode élève) : 🔄 toujours affiché */
    if (/\/(edt|appel-as|co-eval|terrain|console|attestation|guide|tactique|boite|quiz|carnet|espace|referentiel)\//.test(location.pathname)) document.documentElement.classList.add("eps-tool");
    /* pages ouvertes aux élèves (planche, boîte à outils, quiz, carnet) : jamais de 🔄 côté élève (demande de l'enseignant) */
    if (/\/(tactique|boite|quiz|carnet)\//.test(location.pathname)) document.documentElement.classList.add("eps-tous");
    b.className = "epsb"; b.style.display = "none"; document.body.appendChild(b); setTimeout(function () { try { placeUpd(); } catch (e) {} }, 50);
    b.onclick = async function () {
      if (b.dataset.busy) return; b.dataset.busy = "1"; s.opacity = ".6";
      var tip = document.createElement("div");
      tip.textContent = "Mise à jour…";
      tip.style.cssText = "position:fixed;z-index:2147483002;left:50%;bottom:24px;transform:translateX(-50%);background:#1B1E24;color:#fff;padding:12px 20px;border-radius:999px;font:700 16px system-ui,sans-serif";
      document.body.appendChild(tip);
      var wait = function (p, ms) { return Promise.race([p, new Promise(function (r) { setTimeout(r, ms); })]); };
      try { if (typeof window.epsBeforeUpdate === "function") await wait(Promise.resolve(window.epsBeforeUpdate()), 8000); } catch (e) {}
      try { await wait(sync(), 6000); } catch (e) {}
      await forceUpd(wait);
    };
    (slot || document.body).appendChild(b);
  }
  /* 🔄 toujours dans un bandeau : emplacement réservé visible ([data-eps-upd-slot] : écran « Choisis ta classe », pages sans barre commune,
     valeur "light" pour un bandeau clair), sinon la barre commune [data-eps-bar] ; si aucun bandeau n'est visible (écran plein recouvrant), masqué. */
  function visibleFree(el) { if (!el || !el.getClientRects().length) return false; var r = el.getBoundingClientRect(); if (!r.width && !r.height) { var p = el.parentElement; if (!p) return false; r = p.getBoundingClientRect(); }
    var y = r.top + Math.max(4, r.height / 2), x = Math.max(r.left + 4, Math.min(r.right - 4, r.left + r.width / 2)); if (y < 0 || y > innerHeight) return false; var t = document.elementFromPoint(x, y); return !!t && (el.contains(t) || t.contains(el) || (el.parentElement && el.parentElement.contains(t) && !t.closest(".epse,.lc-ov,.lc-modal,.epsd-ov,.epspn,.lc-st"))); }
  /* 🟢 / 🔴 la tablette est-elle à jour ? version installée (cache « eps-core-vN » du service worker) comparée à celle publiée (/sw.js relu sans cache) ;
     pastille sur le bouton 🔄 : verte = à jour, rouge = nouvelle version publiée → toucher 🔄. Vérifié au chargement puis toutes les 5 min. */
  var UPD = { loc: 0, net: 0, at: 0 };
  async function verCheck() {
    /* version qui a servi CETTE page : demandée une fois au service worker qui la contrôle (une version téléchargée en arrière-plan ne compte qu'après rechargement) */
    if (!UPD.page && navigator.serviceWorker && navigator.serviceWorker.controller) { try { UPD.page = await new Promise(function (res) { var t = setTimeout(function () { res(0); }, 2500);
      navigator.serviceWorker.addEventListener("message", function h(ev) { if (ev.data && ev.data.epsVer) { clearTimeout(t); navigator.serviceWorker.removeEventListener("message", h); res(+String(ev.data.epsVer).replace(/\D/g, "") || 0); } });
      navigator.serviceWorker.controller.postMessage("eps-ver"); }); } catch (e) {} }
    try { var ks = await caches.keys(); UPD.loc = Math.max.apply(null, [0].concat(ks.filter(function (x) { return /^eps-core-v\d+$/.test(x); }).map(function (x) { return +x.slice(10); }))); } catch (e) {}
    if (!UPD.loc && navigator.serviceWorker && location.protocol !== "file:") { try { await navigator.serviceWorker.register("/sw.js"); } catch (e) {} }
    try { var t = await (await fetch("/sw.js?v=" + Date.now(), { cache: "no-store" })).text(), m = /eps-core-v(\d+)/.exec(t); if (m) UPD.net = +m[1]; } catch (e) {}
    UPD.at = Date.now(); updDot(); }
  function updDot() { var b = document.getElementById("eps-upd"); if (!b) return; var d = b.querySelector(".eps-dot"); if (!d) { d = document.createElement("i"); d.className = "eps-dot"; d.setAttribute("aria-hidden", "true"); b.appendChild(d); b.style.position = b.style.position || "relative"; }
    var mine = UPD.page || UPD.loc, st = !UPD.net || !mine ? "?" : mine >= UPD.net ? "ok" : "old";
    d.style.cssText = "position:absolute;top:3px;right:3px;width:11px;height:11px;border-radius:50%;border:2px solid #14171C;background:" + (st === "ok" ? "#2ECC71" : st === "old" ? "#E53935" : "#9E9E9E") + (st === "old" ? ";animation:epsblink 1s infinite" : "");
    var t = st === "ok" ? "Tablette à jour (version " + mine + ")" : st === "old" ? "Nouvelle version publiée (" + UPD.net + ", cette page est en " + mine + ") : elle s'installe seule dès que la tablette est au repos ; touche pour forcer" : "Mettre à jour (version non vérifiée : hors ligne ?)";
    b.title = t; b.setAttribute("aria-label", t); }
  try { var bk = document.createElement("style"); bk.textContent = "@keyframes epsblink{50%{opacity:.25}}"; document.head.appendChild(bk); } catch (e) {}
  /* ⬇ mise à jour forcée (bouton 🔄, enseignant) : données envoyées, service workers relancés, et si une version plus récente est publiée
     et la tablette en ligne, tous les caches de fichiers vidés (les données des élèves sont ailleurs : rien n'est perdu) puis rechargement */
  async function forceUpd(wait) {
    wait = wait || function (p, ms) { return Promise.race([p, new Promise(function (r) { setTimeout(r, ms); })]); };
    try { await wait(sync(), 6000); } catch (e) {}
    try { if (navigator.serviceWorker) { var regs = await navigator.serviceWorker.getRegistrations(); await wait(Promise.all(regs.map(function (r) { return r.update().catch(function () {}); })), 4000); } } catch (e) {}
    try { await wait(verCheck(), 4000); var mine = UPD.page || UPD.loc; if (navigator.onLine !== false && UPD.net && (!mine || mine < UPD.net)) { var ks = await caches.keys(); await Promise.all(ks.map(function (k) { return caches.delete(k); })); } } catch (e) {}
    location.reload();
  }
  window.epsForceUpdate = function () { return forceUpd(); };
  /* 🔄 automatique (élèves ET enseignant) : une nouvelle version publiée s'installe seule, sans rien interrompre :
     au retour sur la tablette après au moins 1 min en veille / sur une autre appli, ou après 2 min sans toucher l'écran ;
     jamais pendant une saisie ni avec une fenêtre ouverte (fiche, évaluation, leçon en cours…) */
  var hidAt = 0, lastAct = Date.now(), autoBusy = false;
  ["pointerdown", "keydown", "input"].forEach(function (ev) { document.addEventListener(ev, function () { lastAct = Date.now(); }, true); });
  function busyNow() { var a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== "button") return true; if (a && a.isContentEditable) return true;
    return Array.prototype.some.call(document.querySelectorAll(".lc-ov,.lc-modal,.epse-ov,.epst-vue,#lc-cl,#lc-ctl,[role=dialog]"), function (e) { return e.getClientRects().length && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden"; }); }
  function autoUpd(why) { if (autoBusy || location.protocol === "file:" || window.top !== window) return; verCheck().then(function () { var mine = UPD.page || UPD.loc;
    if (!(UPD.net && mine && mine < UPD.net) || busyNow()) return; if (why === "idle" && Date.now() - lastAct < 120000) return; autoBusy = true; forceUpd(); }); }
  document.addEventListener("visibilitychange", function () { if (document.hidden) { hidAt = Date.now(); return; } if (hidAt && Date.now() - hidAt >= 60000) { hidAt = 0; autoUpd("retour"); } });
  setTimeout(verCheck, 2500); setInterval(function () { verCheck().then(function () { autoUpd("idle"); }); }, 5 * 60000); window.addEventListener("online", function () { setTimeout(verCheck, 2000); });
  function placeUpd() {
    var b = document.getElementById("eps-upd"); if (!b) return; if (window.EPS_VUE_ELEVE && window.top !== window) { b.style.display = "none"; return; }
    var S = Array.prototype.filter.call(document.querySelectorAll("[data-eps-upd-slot]"), function (x) { return visibleFree(x); })[0], sl = S || (function () { var e = epsSlot(); return e && (visibleFree(e) || (b.parentNode === e && visibleFree(b))) ? e : null; })();
    if (!sl) { var nv = Array.prototype.filter.call(document.querySelectorAll(".epst-nav"), function (x) { return visibleFree(x); })[0]; /* barre de l'appli cachée en descendant : le 🔄 passe dans la barre des onglets, toujours visible */
      if (nv) { if (b.parentNode !== nv) nv.appendChild(b); b.className = "epsb eps-upd-n"; b.style.display = "inline-flex"; return; }
      b.style.display = "none"; return; }
    if (b.parentNode !== sl) sl.appendChild(b);
    var cls = S && S.getAttribute("data-eps-upd-slot") === "light" ? "epsb eps-upd-l" : "epsb"; if (b.className !== cls) b.className = cls; b.style.display = "inline-flex"; b.style.position = "relative"; if (!b.querySelector(".eps-dot") && UPD.at) updDot();
  }
  /* emplacement(s) des boutons communs dans la barre du haut de l'appli : on utilise celui qui est visible
     (une appli peut en avoir plusieurs, par exemple un par écran) */
  function epsSlot() {
    var L = document.querySelectorAll("[data-eps-bar]");
    for (var i = 0; i < L.length; i++) if (L[i].getClientRects().length) return L[i];
    return L[0] || null;
  }
  /* pastille d'état du partage entre tablettes (mode enseignant) : ✓ à jour · ⏳ envoi en attente · ⚠ problème · ○ non réglé */
  function nPend() { var n = Object.keys(D.pend || {}).length + Object.keys(lld().pend || {}).length; STORES.forEach(function (st) { n += Object.keys(stLd(st.key).pend || {}).length; }); return n; }
  function syncBadge() {
    var b = document.getElementById("eps-sync"), sl = epsSlot();
    if (!b) { if (!sl) return; b = document.createElement("button"); b.type = "button"; b.id = "eps-sync"; b.className = "epsb"; sl.insertBefore(b, sl.firstChild);
      b.onclick = function () { if (!shCfg()) { try { shareSettings(); } catch (e) {} return; } b.innerHTML = "⟳ <span>Synchro…</span>"; sync(); }; }
    b.style.display = isTeacher() ? "" : "none";
    var cfg = shCfg(), p = cfg ? nPend() : 0, ago = lastOk ? Math.round((Date.now() - lastOk) / 60000) : -1, st, t;
    if (window.EPS_SIM) { st = "🧪"; t = "Simulation : partage coupé"; }
    else if (!cfg) { st = "○"; t = "Partage non réglé"; }
    else if (lastErr && (!lastOk || Date.now() - lastOk > 120000)) { st = "⚠"; t = lastErr === "clé" ? "Clé refusée" : lastErr === "script à mettre à jour" ? "Script à mettre à jour" : "Hors ligne"; }
    else if (p) { st = "⏳"; t = p + " à envoyer"; }
    else if (lastOk) { st = "✓"; t = ago < 1 ? "À jour" : "À jour (" + ago + " min)"; }
    if (st === "✓" && lastBackup != null && (!lastBackup || Date.now() - lastBackup > 9 * 864e5)) { st = "⚠"; t = lastBackup ? "Sauvegarde Drive en retard" : "Sauvegarde Drive à installer"; }
    else { st = "⟳"; t = "Synchro…"; }
    b.style.color = st === "✓" ? "#7FD49A" : st === "⚠" ? "#FF8A7A" : st === "⏳" ? "#F5C76B" : "#D5D8DE";
    b.title = "Partage entre tablettes : " + t + (lastOk ? " · dernier échange " + new Date(lastOk).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "") + " · " + (lastBackup ? "sauvegarde Drive du " + new Date(lastBackup).toLocaleDateString("fr-FR") : lastBackup === 0 ? "sauvegarde Drive non installée (script : installerSauvegarde)" : "") + " · toucher pour synchroniser";
    b.innerHTML = st + " <span>" + t + "</span>";
  }
  setInterval(function () { try { syncBadge(); } catch (e) {} }, 3000);
  /* 🔍 recherche rapide d'un élève (mode enseignant) : classes, activités de la classe, dispense du jour, évaluations et commentaires dans chaque appli */
  var ACTN = { esc: "Escalade", rel: "Relais Vitesse", ori: "OrienRun", vol: "Volley-ball", bad: "Badminton", dan: "Danse", acro: "Acrosport", ct: "Cross-training", bk: "Basket-ball", step: "Step" };
  function evalsOf(nomComplet, classe) {
    var out = [], k = nkey(nomComplet), c = cmp(classe);
    for (var i = 0; i < localStorage.length; i++) { var key = localStorage.key(i), m = /^eps\.eval\.([a-z]+)\.v1$/.exec(key || ""); if (!m) continue;
      var V = jget(key, {}), I = (V && V.items) || {};
      Object.keys(I).forEach(function (id) { var r = I[id]; if (!r || id === "cfg" || nkey((r.p || "") + " " + (r.n || "")) !== k || (c && r.c && cmp(r.c) !== c)) return;
        var n = r.ev ? Object.keys(r.ev).filter(function (x) { return r.ev[x] && r.ev[x].d != null; }).length : 0;
        out.push({ app: ACTN[m[1]] || ({ escalade: "Escalade", acrosport: "Acrosport", orientation: "OrienRun", ori: "OrienRun" }[m[1]]) || m[1], n: n, comm: r.comm || "", st: r.st || "", auto: !!(r.ap && r.ap.ev), apr: (r.ap && (r.ap.r || r.ap.reussi)) || "", apm: (r.ap && (r.ap.m || r.ap.ameliorer)) || "" }); }); }
    /* applis à évaluation propre : Volley, Badminton, Danse (e.ev, commentaire, auto-positionnement), Relais (évaluations de course) */
    [["eps_volley_eval_v1", "Volley-ball"], ["eps_badminton_v1", "Badminton"], ["danse-eps-v1", "Danse"], ["relais-vitesse-data-v3", "Relais Vitesse"]].forEach(function (A) {
      var d = jget(A[0], null); ((d && d.classes) || []).forEach(function (cl) { if (c && cmp(cl.nom || cl.name) !== c) return;
        (cl.eleves || []).forEach(function (e) { if (nkey((e.prenom || "") + " " + (e.nom || "")) !== k) return;
          var n = e.ev ? Object.keys(e.ev).filter(function (x) { return e.ev[x] != null && e.ev[x] !== ""; }).length : (e.ea || []).concat(e.el || []).filter(function (x) { return x != null; }).length;
          var st = String(e.statut || "").toUpperCase(); st = /ABS/.test(st) ? "ABS" : /DISP/.test(st) ? "DISP" : "";
          var ap = e.ap || e.auto || null;
          if (n || e.comment || e.comm || st || ap) out.push({ app: A[1], n: n, comm: e.comment || e.comm || "", st: st, auto: !!(ap && ap.ev), apr: (ap && (ap.reussi || ap.r)) || "", apm: (ap && (ap.ameliorer || ap.m)) || "" }); }); });
    });
    return out;
  }
  function searchStudents() {
    var o = overlay('<div id="epss"><h3>🔍 Rechercher un élève</h3><input class="epsd-in" id="epss-q" placeholder="Nom ou prénom…" autocomplete="off"><div id="epss-r" style="margin-top:10px"></div><div class="epsd-act"><button data-x>Fermer</button></div></div>');
    var q = o.querySelector("#epss-q"), res = o.querySelector("#epss-r"), P = [];
    try { (window.EPSL ? EPSL.items() : []).forEach(function (it) { EPSL.people(it).forEach(function (p) { P.push({ full: p.full, cls: it.nom, off: it.off || [] }); }); }); } catch (e) {}
    function draw() {
      var t = norm(q.value); if (t.length < 2) { res.innerHTML = '<p class="m">' + P.length + " élèves dans tes listes. Tape au moins 2 lettres.</p>"; return; }
      var W = t.split(" "), L = P.filter(function (p) { var n = norm(p.full); return W.every(function (w) { return n.indexOf(w) >= 0; }); }).slice(0, 12);
      res.innerHTML = L.length ? L.map(function (p) {
        var acts = Object.keys(ACTN).filter(function (a) { return p.off.indexOf(a) < 0; }).map(function (a) { return ACTN[a]; }), d = find(p.cls, p.full), E = evalsOf(p.full, p.cls);
        return '<div style="border:1px solid #E6E1D6;border-radius:14px;padding:10px 14px;margin:0 0 8px"><b style="font-size:18px">' + esc(p.full) + '</b> <span style="color:#6A6F78">· ' + esc(p.cls) + "</span>" +
          (d ? '<div style="color:#9C2B10;font-weight:700;margin-top:4px">🩹 ' + esc(label(d)) + "</div>" : "") +
          '<div style="color:#6A6F78;font-size:14px;margin-top:4px">Activités de la classe : ' + esc(acts.join(", ") || "aucune") + "</div>" +
          (function () { var O = window.EPSOB ? EPSOB.of(p.full, p.cls) : []; return O.length ? '<div style="font-size:14px;margin-top:4px">🎙 <b>' + O.length + " observation(s)</b>, dernière le " + new Date(O[O.length - 1].t).toLocaleDateString("fr-FR") + ' : <span style="color:#6A6F78">« ' + esc(O[O.length - 1].txt.slice(0, 140)) + " »</span></div>" : ""; })() +
          (E.length ? E.map(function (e) { return '<div style="font-size:14px;margin-top:4px">📋 <b>' + esc(e.app) + "</b> : " + (e.st === "ABS" ? "absent(e)" : e.st === "DISP" ? "dispensé(e)" : e.n + " critère(s) évalué(s)") + (e.auto ? " · auto-positionnement reçu" : "") + (e.comm ? '<div style="color:#6A6F78;margin-left:22px">« ' + esc(e.comm.slice(0, 160)) + (e.comm.length > 160 ? "…" : "") + " »</div>" : "") + "</div>"; }).join("") : '<div style="color:#6A6F78;font-size:14px;margin-top:4px">Pas encore d\'évaluation sur cette tablette.</div>') + "</div>"; }).join("")
        : '<p class="m">Aucun élève trouvé.</p>';
    }
    q.oninput = draw; draw(); setTimeout(function () { q.focus(); }, 50);
    var bb = document.createElement("button"); bb.type = "button"; bb.textContent = "📝 Appréciations de bulletin"; bb.onclick = bulletin;
    var bn = document.createElement("button"); bn.type = "button"; bn.textContent = "🌐 Bilans en ligne"; bn.onclick = function () { o.remove(); bilans(); };
    var act = o.querySelector(".epsd-act"); if (act) { act.insertBefore(bb, act.firstChild); act.insertBefore(bn, act.firstChild); }
  }
  /* ================= 🧪 Classe de démonstration (Réglages communs) =================
     Classe fictive attribuée à toutes les activités, fiche de leçon validée programmée dans 2 minutes dans chaque appli,
     quelques observations ; évaluations et auto-positionnements fictifs semés par eps-eval.js (Escalade, Acrosport, OrienRun).
     « Retirer » efface tout ce qui concerne la classe, partout (même ce que tu y as saisi). */
  var DEMO = "DÉMO (fictive)", DEMO_EL = ["Léa Démo", "Hugo Démo", "Inès Démo", "Tom Démo", "Sarah Démo", "Noah Démo", "Jade Démo", "Yanis Démo"];
  var DEMO_APPS = { escalade: "Escalade", relais: "Relais Vitesse", volley: "Volley-ball", badminton: "Badminton", danse: "Danse", acrosport: "Acrosport", orientation: "OrienRun", ccf: "CCF", crosstraining: "Cross-training", basket: "Basket-ball", step: "Step" };
  function demoOn() { return !!jget("eps.demo.v1", null); }
  function stPutRaw(k, it) { var V = stLd(k), o = V.items[it.id]; it.u = Math.max(Date.now(), ((o && o.u) || 0) + 1); V.items[it.id] = it; V.pend[it.id] = it.u; try { localStorage.setItem(k, JSON.stringify(V)); } catch (e) {} }
  function demoLesson(a, nom, at) {
    return { id: "demo-" + a, demo: 1, seq: "Séquence de démonstration", num: "1", titre: "Leçon de démonstration", duree: "1 h 45", statut: "ok", ai: {}, cr: Date.now(), prog: [{ c: DEMO, at: at }],
      objM: "Enchaîner les actions clés de l'activité avec plus de précision.", objMe: "Observer un camarade et lui donner un conseil.", objS: "Respecter les règles de sécurité et les rôles.",
      but: "Réussir 3 fois de suite l'action travaillée dans la situation 1.", disp: "Classe en 4 groupes, un atelier par groupe, rotation toutes les 10 minutes.", mat: "Matériel habituel de " + nom + ", plots, chasubles, tablettes.",
      ech: "Échauffement général 8 minutes (course, mobilisation articulaire), puis 5 minutes d'échauffement spécifique par deux.",
      sits: [{ t: "Situation 1 · l'action de base", cons: "Par deux : l'un réalise l'action, l'autre observe avec la fiche. On change toutes les 5 réussites.", crQ: "5 réussites sur 8 essais.", crQl: "Action fluide, sans arrêt.", crR: "Regarder loin, s'organiser avant d'agir.", simp: "Réduire la distance ou la vitesse.", comp: "Ajouter une contrainte de temps." },
        { t: "Situation 2 · en opposition ou en enchaînement", cons: "Par groupes de 4 : enchaîner l'action dans une situation proche du jeu ou de la performance.", crQ: "3 enchaînements réussis.", crQl: "Choix adapté à la situation.", crR: "Prendre l'information avant d'agir.", simp: "Supprimer l'opposition.", comp: "Réduire l'espace ou le temps." }],
      rem: "Situation de référence : match ou épreuve complète, avec un observateur par élève.", remCr: "Réussir au moins une fois l'action travaillée dans la situation complète.", bilan: "Chacun dit ce qu'il a réussi et ce qu'il travaillera la prochaine fois." };
  }
  async function demoCreate() {
    var L = lld(), id = clsId(DEMO), it = { id: id, nom: DEMO, el: DEMO_EL.slice(), st: {}, rm: [], ts: Date.now(), man: 1, demo: 1, off: [] };
    L.items[id] = it; L.pend[id] = stamp(); L.app[id] = JSON.stringify(it); lsv(L);
    try { localStorage.setItem("eps.demo.v1", JSON.stringify({ t: Date.now() })); } catch (e) {}
    var at = Date.now() + 2 * 60000, today = new Date(), dk = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    Object.keys(DEMO_APPS).forEach(function (a) {
      stPutRaw("eps.lecons." + a + ".v1", demoLesson(a, DEMO_APPS[a], at));
      [["Hugo Démo", "Très actif, encourage ses camarades."], ["Inès Démo", "Bonne lecture de la situation, manque de vitesse dans l'exécution."], ["Tom Démo", "S'arrête souvent ; à relancer sur la situation 1."]].forEach(function (x, i) {
        stPutRaw("eps.obs.v1", { id: "demo-" + a + "-" + i, demo: 1, app: a, cls: DEMO, el: x[0], txt: x[1], raw: x[1], t: Date.now() - (3 - i) * 600000, day: dk }); });
      /* 🏁 résultats des situations notés par les élèves (bilan de séquence) : la situation 2 « pèche » */
      var V0 = [2, 2, 1, 0, 2, 2, 1, 2], V1 = [2, 1, 0, 0, 1, 2, 0, 1], V2 = [2, 1, 1, 0, 2, 1, 0, 1], cn = (window.EPSL ? EPSL.norm(DEMO) : norm(DEMO)).replace(/\s+/g, "");
      DEMO_EL.forEach(function (n, i) { if (n === "Jade Démo") return; /* absente à l'appel du jour */ var k = nkey(n), r = {}; r["demo-" + a + ":s0"] = V0[i]; r["demo-" + a + ":s1"] = V1[i]; r["demo-" + a + ":rem"] = V2[i];
        stPutRaw("eps.lecres." + a + ".v1", { id: cn + "|" + dk + "|" + k, demo: 1, cls: DEMO, day: dk, ek: k, r: r }); });
      /* 📊 évaluation de leçon du jour (participation, sérieux, thème) : reprise par la note proposée et le bulletin */
      var LE = [[3, 3, 2], [3, 2, 2], [2, 2, 1], [1, 1, 0], [3, 3, 3], [2, 3, 2], [1, 2, 1], [2, 2, 2]], el = {};
      DEMO_EL.forEach(function (n, i) { if (n !== "Jade Démo") el[nkey(n)] = { p: LE[i][0], s: LE[i][1], t: LE[i][2] }; });
      stPutRaw("eps.leceval." + a + ".v1", { id: cn + "|" + dk, demo: 1, cls: DEMO, day: dk, lec: "demo-" + a, theme: "Situation de la leçon de démonstration", el: el });
    });
    try { abSet(DEMO, ["Jade Démo"]); } catch (e) {}
    await applyLocal(); setTimeout(sync, 300);
  }
  async function demoRemove() {
    STORES.concat([{ key: "eps.obs.v1" }, { key: KC }, { key: "eps.ref.v1" }]).forEach(function (st) { var V = stLd(st.key), ch = false;
      Object.keys(V.items).forEach(function (k) { var o = V.items[k]; if (!o || o.del) return;
        if (o.demo || /^demo-/.test(k) || (o.cls && cmp(o.cls) === cmp(DEMO)) || (o.c && cmp(o.c) === cmp(DEMO))) { V.items[k] = { id: k, del: 1, u: Date.now() }; V.pend[k] = Date.now(); ch = true; } });
      if (ch) try { localStorage.setItem(st.key, JSON.stringify(V)); } catch (e) {} });
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (!/^eps\.(lecons|eval|leceval|lecres)\.[a-z]+\.v1$/.test(k || "")) continue; var V = stLd(k), ch = false;
      Object.keys(V.items).forEach(function (id) { var o = V.items[id]; if (o && !o.del && (o.demo || /^demo-/.test(id) || (o.c && cmp(o.c) === cmp(DEMO)) || (o.cls && cmp(o.cls) === cmp(DEMO)))) { V.items[id] = { id: id, del: 1, u: Date.now() }; V.pend[id] = Date.now(); ch = true; } });
      if (ch) try { localStorage.setItem(k, JSON.stringify(V)); } catch (e) {} }
    var L = lld(); Object.keys(L.items).forEach(function (k) { var o = L.items[k]; if (o && o.nom && cmp(o.nom) === cmp(DEMO)) { o.demo = 1; L.app[k] = JSON.stringify(o); } }); lsv(L);
    try { localStorage.removeItem("eps.demo.v1"); } catch (e) {}
    await deleteList(DEMO);
  }
  /* ================= ♿ accessibilité commune (toutes les applis, y compris futures) =================
     contour de focus visible au clavier ; boutons-icônes nommés pour les lecteurs d'écran ; petites cibles agrandies ; champs sans étiquette nommés. */
  /* ⓘ moins de texte à l'écran (demande de l'enseignant) : les paragraphes d'explication longs (classes mut, lc-mut, gr-mut,
     epse-mut, m, muted, sans identifiant ni attribut data-) sont raccourcis à leur début + « ⓘ » ; un appui ouvre le texte
     entier dans une petite fenêtre. Messages d'état, champs, liens et boutons ne sont jamais touchés. Un conteneur
     [data-eps-longtext] garde ses textes entiers (fiche d'utilisation…). */
  (function tips() {
    var SEL = "p.mut,p.lc-mut,p.gr-mut,p.epse-mut,p.m,p.muted,div.lc-mut,div.mut,span.gr-mut,p.mc", LIM = 110;
    try { var st = document.createElement("style"); st.textContent = ".eps-tipb{border:0;background:none;padding:0 0 0 4px;margin:0;cursor:pointer;vertical-align:middle;min-height:0!important;min-width:0!important;position:relative}.eps-tipb::after{content:'';position:absolute;inset:-11px -9px}.eps-tipb i{font-style:normal;display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#E6E1D6;color:#14171C;font:800 13px system-ui,sans-serif}" +
      ".eps-tipo{position:fixed;inset:0;z-index:2147483600;background:rgba(20,23,28,.35);display:flex;align-items:center;justify-content:center;padding:16px}.eps-tipo>div{background:#fff;color:#14171C;border-radius:16px;max-width:520px;width:100%;padding:16px 18px;font:16px/1.45 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.25)}.eps-tipo button{margin-top:12px;min-height:42px;border-radius:10px;border:0;background:#14171C;color:#fff;font:800 15px system-ui;padding:0 18px;cursor:pointer}";
      (document.head || document.documentElement).appendChild(st); } catch (e) {}
    function plain(el) { if (el.attributes.length > 2 || el.id) return false; for (var i = 0; i < el.attributes.length; i++) { var n = el.attributes[i].name; if (n !== "class" && n !== "style") return false; }
      return !el.querySelector("a,button,input,select,textarea,label,img,svg,table,canvas,[data-msg],[contenteditable]") && !el.closest("[data-eps-longtext],.eps-tipo,[contenteditable],.epsg,.lc-st,#lc-au,#lc-st"); }
    function short(t) { var m = t.match(/^(.{25,80}?[.:!?])(\s|$)/); if (m) return m[1].replace(/\s*:$/, ""); var s = t.slice(0, 80), c = Math.max(s.lastIndexOf(", "), s.lastIndexOf(" ("), s.lastIndexOf(" ;"));
      if (c >= 30) return s.slice(0, c) + "…"; return s.slice(0, Math.max(30, s.lastIndexOf(" "))) + "…"; }
    function open(html) { var o = document.createElement("div"); o.className = "eps-tipo"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true");
      o.innerHTML = '<div><div class="t"></div><button type="button">OK</button></div>'; o.querySelector(".t").innerHTML = html;
      var x = function () { o.remove(); }; o.onclick = function (e) { if (e.target === o) x(); }; o.querySelector("button").onclick = x; document.body.appendChild(o); o.querySelector("button").focus(); }
    function run(root) { if (!document.documentElement.classList.contains("eps-teach")) return; /* côté élève, rien n'est caché (consignes, sécurité) */
      var L; try { L = (root || document).querySelectorAll(SEL); } catch (e) { return; }
      Array.prototype.forEach.call(L, function (el) { if (el.dataset.epsTip) return; var t = (el.textContent || "").replace(/\s+/g, " ").trim(); if (t.length <= LIM || !plain(el)) return;
        var html = el.innerHTML; el.dataset.epsTip = "1"; el.textContent = short(t); var b = document.createElement("button"); b.type = "button"; b.className = "eps-tipb"; b.setAttribute("aria-label", "Lire l'explication"); b.title = "Lire l'explication"; b.innerHTML = "<i>i</i>";
        b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); open(html); }; el.appendChild(b); }); }
    var T = null; function soon() { if (T) return; T = setTimeout(function () { T = null; run(document); }, 60); }
    function start() { run(document); try { new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); } catch (e) {} setInterval(soon, 2500); }
    if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
    window.EPSTIP = { run: run, open: open };
  })();
  /* 📱 téléphone : la barre du haut d'une appli passe à la ligne au lieu de déborder (boutons communs, 🎙, 🔄…) */
  (function narrow() {
    function fix() { if (innerWidth >= 700) return; document.querySelectorAll("[data-eps-bar]").forEach(function (sl) { var p = sl.parentElement; for (var i = 0; p && i < 2; i++, p = p.parentElement) { var cs = getComputedStyle(p); if (cs.display.indexOf("flex") >= 0 && cs.flexDirection.indexOf("row") === 0) { if (cs.flexWrap === "nowrap") { p.style.flexWrap = "wrap"; p.style.rowGap = "6px"; } if (p.scrollWidth > p.clientWidth + 2) { p.style.flexWrap = "wrap"; } } } });
      var tb = document.getElementById("eps-teachbtn"); if (tb && tb.style.display !== "none") tb.textContent = "🔓 Quitter"; }
    setTimeout(fix, 600); setTimeout(fix, 2000); setInterval(fix, 4000); addEventListener("resize", fix);
  })();
  (function a11y() {
    try { var st = document.createElement("style"); st.id = "eps-a11y";
      st.textContent = ":focus-visible{outline:3px solid #1F5F8B!important;outline-offset:2px!important}[data-eps-a11y-sm]{min-width:44px!important;min-height:44px!important}[data-eps-a11y-h='1'][data-eps-a11y-h][data-eps-a11y-h]{min-height:44px!important}a[data-eps-a11y-h='1']{display:inline-flex!important;align-items:center}.btn.sm,button.sm,.back{min-height:36px!important}@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}";
      (document.head || document.documentElement).appendChild(st); } catch (e) {}
    var NOMS = { "↑": "Monter", "↓": "Descendre", "▲": "Monter", "▼": "Descendre", "←": "Retour", "→": "Suivant", "◀": "Précédent", "▶": "Suivant", "✕": "Fermer", "×": "Fermer", "🗑": "Supprimer", "✎": "Modifier", "✏": "Modifier", "✏️": "Modifier", "🖨": "Imprimer", "🖨️": "Imprimer", "⟳": "Synchroniser", "🔍": "Rechercher", "🎙": "Dicter une observation", "🎤": "Dicter", "🔊": "Écouter", "＋": "Ajouter", "+": "Ajouter", "−": "Retirer", "-": "Retirer", "⧉": "Dupliquer", "⚙": "Réglages", "⚙️": "Réglages", "⌂": "Accueil", "📋": "Copier", "↺": "Rétablir", "↶": "Annuler", "✓": "Valider", "★": "Favori" };
    var TOUCH = false; try { TOUCH = navigator.maxTouchPoints > 0 || matchMedia("(pointer:coarse)").matches; } catch (e) {}
    function pass() {
      try { document.querySelectorAll("button,[role=button],a.btn,a.back,a.hb,a.lien44,select").forEach(function (b) {
          if (b.tagName === "SELECT") { if (TOUCH && !b.hasAttribute("data-eps-a11y-h") && !b.multiple) { var rs = b.getBoundingClientRect(); if (rs.height >= 16 && rs.height < 43.5) b.setAttribute("data-eps-a11y-h", "1"); } return; }
          if (!b.offsetParent) return; var txt = (b.innerText || "").trim(), letters = txt.replace(/[^A-Za-zÀ-ÿ0-9]/g, "");
          if (!letters && !b.getAttribute("aria-label")) { var n = b.title || NOMS[txt] || NOMS[txt.replace(/️/g, "")]; if (n) b.setAttribute("aria-label", n); }
          if (!letters && !b.hasAttribute("data-eps-a11y-sm")) { var r = b.getBoundingClientRect(); if (r.width && (r.width < 32 || r.height < 32)) b.setAttribute("data-eps-a11y-sm", ""); }
          /* écran tactile (tablette, téléphone) : aucun bouton de moins de 44 px de haut (demande de l'enseignant, 27/11/2026) ; les boutons posés à un endroit précis (plan, carte) et les ⓘ ne bougent pas */
          if (TOUCH && !b.hasAttribute("data-eps-a11y-h")) { var r2 = b.getBoundingClientRect(); if (r2.height >= 16 && r2.height < 43.5) { var cs = getComputedStyle(b), ok = cs.position !== "absolute" && cs.position !== "fixed" && !/eps-tipb/.test(b.className) && !b.closest("svg,[data-eps-compact]"); b.setAttribute("data-eps-a11y-h", ok ? "1" : "0"); } } });
        document.querySelectorAll("input:not([type=hidden]),select,textarea").forEach(function (f) {
          if (f.getAttribute("aria-label") || f.getAttribute("aria-labelledby") || (f.labels && f.labels.length) || f.placeholder || f.title) return;
          var pv = f.previousElementSibling, t = pv && /LABEL|SPAN|B|STRONG|DIV|SMALL/.test(pv.tagName) ? (pv.innerText || "").trim() : "";
          if (!t) { var c = f.closest("td,th,.field,.row,div"); var h = c && c.querySelector("label,b,strong,span"); t = h && h !== f ? (h.innerText || "").trim() : ""; }
          if (t) f.setAttribute("aria-label", t.slice(0, 80)); }); } catch (e) {}
    }
    setInterval(pass, 1500); setTimeout(pass, 400);
  })();
  /* ================= 🧪 SIMULATION (bac à sable) =================
     Entrer : toutes les données de la tablette (localStorage + base d'OrienRun) sont mises de côté dans IndexedDB « eps-sim »,
     le partage est coupé (garde d'eps-lists.js), une classe fictive est créée ; on circule librement, en enseignant ou en élève.
     Quitter : la tablette retrouve exactement ses données d'avant. Rien de la simulation n'est partagé ni gardé. */
  function idb(name, ver, up) { return new Promise(function (res, rej) { var r = indexedDB.open(name, ver); if (up) r.onupgradeneeded = function () { up(r.result); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  function tx(db, st, mode, f) { return new Promise(function (res, rej) { var t = db.transaction(st, mode), out = f(t); t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); }; t.onerror = function () { rej(t.error); }; }); }
  async function idbDump(name) { var db; try { db = await idb(name); } catch (e) { return null; } var out = {}, S = Array.prototype.slice.call(db.objectStoreNames);
    for (var i = 0; i < S.length; i++) { out[S[i]] = await new Promise(function (res) { var o = [], t = db.transaction(S[i], "readonly"), c = t.objectStore(S[i]).openCursor(); c.onsuccess = function () { var x = c.result; if (x) { o.push([x.primaryKey, x.value]); x.continue(); } else res(o); }; c.onerror = function () { res(o); }; }); }
    db.close(); return out; }
  async function idbLoad(name, dump) { if (!dump) return; var db; try { db = await idb(name); } catch (e) { return; }
    var S = Array.prototype.slice.call(db.objectStoreNames).filter(function (x) { return dump[x]; });
    for (var i = 0; i < S.length; i++) await tx(db, S[i], "readwrite", function (t) { var st = t.objectStore(S[i]); st.clear(); dump[S[i]].forEach(function (kv) { try { st.keyPath ? st.put(kv[1]) : st.put(kv[1], kv[0]); } catch (e) {} }); });
    db.close(); }
  function simDb() { return idb("eps-sim", 1, function (db) { db.createObjectStore("snap"); }); }
  async function simEnter(next) {
    if (window.EPS_SIM) return;
    var ls = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); ls[k] = localStorage.getItem(k); }
    var snap = { t: Date.now(), ls: ls, ori: await idbDump("orienrun") };
    var db = await simDb(); await tx(db, "snap", "readwrite", function (t) { t.objectStore("snap").put(snap, "snap"); });
    var back = await tx(db, "snap", "readonly", function (t) { return t.objectStore("snap").get("snap"); }); db.close();
    if (!back || Object.keys(back.ls || {}).length !== Object.keys(ls).length) { alert("Impossible de mettre tes données de côté : simulation annulée (rien n'a changé)."); return; }
    localStorage.setItem("eps.sim.v1", JSON.stringify({ t: Date.now(), init: 1, next: next || null }));
    localStorage.setItem("eps.teach.until", String(Date.now() + 12 * 3600e3));
    location.reload();
  }
  async function simExit() {
    var db = await simDb(), snap = await tx(db, "snap", "readonly", function (t) { return t.objectStore("snap").get("snap"); });
    if (!snap || !snap.ls) { db.close(); if (!confirm("Aucune copie de tes données n'a été trouvée. Quitter quand même la simulation (les données actuelles de la tablette restent) ?")) return; localStorage.removeItem("eps.sim.v1"); location.reload(); return; }
    localStorage.clear(); Object.keys(snap.ls).forEach(function (k) { try { localStorage.setItem(k, snap.ls[k]); } catch (e) {} });
    await idbLoad("orienrun", snap.ori);
    await tx(db, "snap", "readwrite", function (t) { t.objectStore("snap").delete("snap"); }); db.close();
    location.reload();
  }
  function simBar() {
    if (!window.EPS_SIM || document.getElementById("eps-simbar")) return;
    var b = document.createElement("div"); b.id = "eps-simbar"; b.setAttribute("role", "status");
    b.style.cssText = "position:fixed;left:calc(10px + env(safe-area-inset-left,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:2147483400;display:flex;gap:6px;align-items:center;flex-wrap:wrap;max-width:calc(100vw - 100px);background:repeating-linear-gradient(135deg,#FFB020 0 14px,#FFC54D 14px 28px);color:#14171C;border:2px solid #14171C;border-radius:16px;padding:6px 8px;font:800 14px system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25)";
    var t = isTeacher();
    b.innerHTML = '<span style="background:#fff;border-radius:10px;padding:4px 8px">🧪 SIMULATION · rien n\'est partagé ni gardé</span>' +
      '<button type="button" data-r style="height:38px;border-radius:10px;border:2px solid #14171C;background:#fff;font:800 14px system-ui;padding:0 10px">' + (t ? "👁 Passer en élève" : "🎓 Passer en enseignant") + '</button>' +
      '<button type="button" data-q style="height:38px;border-radius:10px;border:2px solid #14171C;background:#14171C;color:#fff;font:800 14px system-ui;padding:0 10px">⏹ Quitter la simulation</button>';
    b.querySelector("[data-r]").onclick = function () { if (isTeacher()) localStorage.setItem("eps.teach.until", "0"); else localStorage.setItem("eps.teach.until", String(Date.now() + 12 * 3600e3)); location.reload(); };
    b.querySelector("[data-q]").onclick = function () { if (confirm("Quitter la simulation ? Tout ce que tu as fait pendant la simulation est effacé et la tablette retrouve ses vraies données.")) simExit(); };
    document.body.appendChild(b);
  }
  async function simBoot() {
    if (!window.EPS_SIM) return; simBar();
    var F = jget("eps.sim.v1", {}); if (!F.init) return;
    F.init = 0; localStorage.setItem("eps.sim.v1", JSON.stringify(F));
    try { await demoCreate(); } catch (e) {}
    if (!F.next) setTimeout(function () { alert("🧪 Simulation lancée.\n\nLa classe « " + DEMO + " » (8 élèves fictifs) est dans toutes les applis, avec une fiche de leçon, des observations et des évaluations. Circule librement, passe en élève avec le bandeau en bas à gauche, puis « Quitter la simulation » : tes vraies données reviennent telles quelles."); }, 300);
  }
  /* ================= 🌐 Bilans en ligne (codes personnels, page « Mon bilan ») =================
     Code personnel de 6 caractères par élève (commun à toutes les applis, partagé entre tablettes : eps.codes.v1).
     Chaque fiche PDF est chiffrée AVEC LE CODE DE L'ÉLÈVE (PBKDF2 + AES-GCM) puis déposée sur le script commun (feuille « Bilans ») :
     sans le code, personne (ni le script) ne peut la lire. Lien unique à envoyer par Pronote : …/mon-bilan/#s=<script>. */
  var KC = "eps.codes.v1", ALPH = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  /* 🙋 appel du jour, commun à toutes les applis et tablettes : eps.appel.v1 (abs|), id = classe|jour → {cls, day, abs:[noms complets], at}.
     Les applis en tiennent compte : groupes (travail, rangement), matériel pour les présents, évaluation de leçon, élèves proposés sur les tablettes. */
  var KAB = "eps.appel.v1";
  STORES.push({ pre: "abs|", key: KAB });
  function abGet(c, d) { var o = stLd(KAB).items[cmp(c) + "|" + (d || today())]; return o && !o.del ? o : null; }
  function abSet(c, abs) { stPutRaw(KAB, { id: cmp(c) + "|" + today(), cls: c, day: today(), abs: (abs || []).slice(), at: Date.now() }); clearTimeout(timer); timer = setTimeout(sync, 1500); }
  function abIs(c, n, d) { var o = abGet(c, d), k = nkey(n); return !!o && (o.abs || []).some(function (x) { return nkey(x) === k; }); }
  STORES.push({ pre: "cd|", key: KC });
  STORES.push({ pre: "pa|", key: "eps.param.v1" });
  STORES.push({ pre: "av|", key: "eps.avis.v1" }, { pre: "rm|", key: "eps.remed.v1" }, { pre: "nv|", key: "eps.niv.v1" }, { pre: "gh|", key: "eps.grphist.v1" }, { pre: "cs|", key: "eps.console.v1" });
  STORES.push({ pre: "cc|", key: "eps.ccfcfg.v1" }); /* 🎯 réglages CCF des évaluations (eps-eval.js) */ /* 🎛 paramètres des applis (EPSP, eps-lists.js) */
  function codeId(cls, full) { return cmp(cls) + "|" + nkey(full); }
  function codeGet(cls, full) { var o = stLd(KC).items[codeId(cls, full)]; return o && !o.del ? o : null; }
  function codePut(o) { var V = stLd(KC), old = V.items[o.id]; o.u = Math.max(Date.now(), ((old && old.u) || 0) + 1); V.items[o.id] = o; V.pend[o.id] = o.u; try { localStorage.setItem(KC, JSON.stringify(V)); } catch (e) {} if (window.EPSD) EPSD.syncSoon(); }
  function newCode() { var r = crypto.getRandomValues(new Uint8Array(6)), c = ""; r.forEach(function (x) { c += ALPH[x % ALPH.length]; }); return c; }
  function codeFor(cls, full, renew) { var o = codeGet(cls, full); if (o && !renew) return o; o = { id: codeId(cls, full), cls: cls, n: full, c: newCode(), pub: (o && o.pub) || {}, old: o ? o.c : "" }; codePut(o); return o; }
  function b64url(u8) { var x = ""; for (var i = 0; i < u8.length; i += 0x8000) x += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(x).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  async function bilHid(code) { return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("eps-bilan|" + code)))).slice(0, 22); }
  async function bilKey(code, hid) { var base = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: new TextEncoder().encode("eps-bilan|" + hid), iterations: 150000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]); }
  async function bilPack(code, obj) { var hid = await bilHid(code), k = await bilKey(code, hid), iv = crypto.getRandomValues(new Uint8Array(12));
    var ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, k, new TextEncoder().encode(JSON.stringify(obj)))), all = new Uint8Array(12 + ct.length); all.set(iv); all.set(ct, 12);
    var t = b64url(all), parts = []; for (var i = 0; i < t.length; i += 40000) parts.push(t.slice(i, i + 40000)); return { hid: hid, parts: parts }; }
  /* ================= ☀ Contraste fort (soleil), pour tous : gardé sur la tablette (eps.fort) =================
     Filtre posé sur <html> (la racine : les fenêtres en position fixe ne bougent pas), bouton ☀ dans la barre commune et sur « Choisis ta classe ». */
  function fortOn() { try { return localStorage.getItem("eps.fort") === "1"; } catch (e) { return false; } }
  function fortApply() { var on = fortOn(); document.documentElement.classList.toggle("eps-fort", on); Array.prototype.forEach.call(document.querySelectorAll(".eps-fortb"), function (b) { b.setAttribute("aria-pressed", on ? "true" : "false"); b.style.background = on ? "#FFD54A" : ""; b.style.color = on ? "#14171C" : ""; }); }
  function fortBtn(extra) { var b = document.createElement("button"); b.type = "button"; b.className = "epsb eps-fortb"; b.setAttribute("aria-label", "Contraste fort, pour le soleil"); b.title = "Contraste fort (soleil)"; b.textContent = "☀"; if (extra) b.style.cssText = extra;
    b.onclick = function (e) { e.stopPropagation(); try { localStorage.setItem("eps.fort", fortOn() ? "0" : "1"); } catch (er) {} fortApply(); }; return b; }
  try { var fst = document.createElement("style"); fst.textContent = "html.eps-fort{filter:contrast(1.12) saturate(1.2)}html.eps-fort body *:not(svg):not(path):not(circle):not(rect):not(line){border-color:#14171C!important}html.eps-fort button,html.eps-fort .btn,html.eps-fort .tab{font-weight:800}html.eps-fort .mut,html.eps-fort small,html.eps-fort .m{color:#3B4047!important}"; document.head.appendChild(fst); fortApply();
    setInterval(function () { try { if (HUB) return; var sl = epsSlot(); if (sl && !sl.querySelector(".eps-fortb")) { sl.appendChild(fortBtn()); fortApply(); }
      var gh = document.querySelector(".epsg .epsg-hd"); if (gh && !gh.querySelector(".eps-fortb")) { var hm = gh.querySelector(".epsg-home"), fb = fortBtn("height:40px;min-width:44px;border-radius:10px;border:1.5px solid #3A3F47;background:none;color:#D5D8DE;font-size:18px;cursor:pointer;margin-right:8px"); if (hm) gh.insertBefore(fb, hm); else gh.appendChild(fb); fortApply(); } } catch (e) {} }, 1500); } catch (e) {}

  /* ================= 📖 Lexique de l'activité (ressource sans classe, modifiable : ⚙ Réglages → 🎛 Paramètres → Lexique) ================= */
  var LEX = {
    volley: ["Manchette : frappe à deux bras tendus, mains jointes, pour une balle basse", "Passe haute : frappe au-dessus du front, à dix doigts", "Smash : attaque frappée fort vers le bas, au-dessus du filet", "Contre : mains au-dessus du filet pour arrêter l'attaque adverse", "Rotation : chaque joueur avance d'un poste quand l'équipe récupère le service"],
    badminton: ["Dégagé : frappe haute et longue vers le fond du terrain adverse", "Amorti : frappe douce qui tombe juste derrière le filet", "Smash : frappe forte vers le bas pour finir le point", "Lob : frappe haute par-dessus l'adversaire", "Replacement : revenir au centre après chaque frappe"],
    escalade: ["Assurer : retenir la corde pour protéger le grimpeur", "Moulinette : la corde passe en haut de la voie avant de grimper", "Dégaine : deux mousquetons reliés par une sangle", "Prise : endroit où poser la main ou le pied", "Cotation : difficulté de la voie (4, 5, 6… puis a, b, c)"],
    acrosport: ["Porteur : celui qui soutient", "Voltigeur : celui qui monte sur le porteur", "Pareur : celui qui aide et sécurise le montage et le démontage", "Pyramide : figure tenue à plusieurs", "Gainage : corps tenu, solide, sans se relâcher"],
    relais: ["Témoin : le bâton qu'on se transmet", "Zone de transmission : espace où le témoin doit changer de main", "Marque : repère au sol qui dit au receveur quand partir", "Donneur : celui qui arrive avec le témoin", "Receveur : celui qui part et reçoit le témoin"],
    danse: ["Unisson : tous le même mouvement en même temps", "Canon : le même mouvement repris en décalé", "Accumulation : on reprend la phrase en ajoutant un mouvement à chaque fois", "Énergie : la qualité du mouvement (fluide, saccadé, fort, léger)", "Espace scénique : l'endroit où l'on danse, face au public"],
    crosstraining: ["Répétition : un mouvement fait une fois", "Série : plusieurs répétitions à la suite", "Récupération : temps de repos entre deux efforts", "AMRAP : le plus de tours possible dans un temps donné", "EMOM : un exercice à refaire au début de chaque minute"],
    orientation: ["Balise : repère orange et blanc à trouver, avec un code", "Légende : explication des couleurs et des symboles de la carte", "Orienter sa carte : la tourner pour qu'elle corresponde au terrain", "Ligne d'arrêt : limite à ne pas dépasser (route, clôture, rivière)", "Point d'attaque : repère facile près de la balise, d'où l'on part pour la trouver"],
    basket: ["Dribble : faire rebondir le ballon pour se déplacer", "Marcher : faute, plus de deux appuis ballon en main sans dribbler", "Reprise de dribble : faute, redribbler après s'être arrêté", "Démarquage : se libérer de son défenseur pour recevoir", "Rebond : récupérer le ballon après un tir manqué"] };
  try { if (LEX[appDir()] && window.EPSP && EPSP.p) { var LEXV = function () { try { return EPSP.p({ id: "lexique_" + appDir(), sec: "Lexique", label: "Les mots de l'activité (« mot : définition », un par ligne)", type: "list", def: LEX[appDir()] }) || []; } catch (e) { return LEX[appDir()]; } }; LEXV();
    (window.EPSG_COMMON = window.EPSG_COMMON || []).push({ ico: "📖", label: "Lexique", sub: "Les mots de l'activité", when: function () { return LEXV().length > 0; }, open: function () { var col = (GATE && GATE.color) || "#14171C";
      window.EPSG.sheet({ titre: "📖 Lexique", color: col, html: LEXV().map(function (t) { var i = String(t).indexOf(":"), m = i > 0 ? String(t).slice(0, i).trim() : String(t), d = i > 0 ? String(t).slice(i + 1).trim() : ""; return '<div class="epsgs-card"><h3 style="margin:0 0 4px">' + esc(m) + "</h3>" + (d ? '<p style="margin:0">' + esc(d) + "</p>" : "") + "</div>"; }).join("") }); } }); } } catch (e) {}

  /* ================= 🎒 Espace élève (page mon-bilan/, sur le téléphone de l'élève) =================
     Aucun changement du script : l'espace d'un élève est un « bilan » de plus (id <empreinte du code>|espace), chiffré avec son code personnel :
     {kind:"espace", eleve, classe, date, todo:[{id, ty:'quiz'|'lien'|'txt', t, qz, url}], quiz:{id:{nom, q}}, acts:[…], rid, rk}.
     Retours du téléphone (quiz faits, tâches cochées) : dépôt « dan|E<rid> » (une ligne par élève, la dernière remplace), chiffré avec la clé rk
     gardée avec le code de l'élève (eps.codes.v1) ; relever() les range dans eps.quiz.v1 (résultats) et eps.espace.v1 (ep|, r|<classe>|<clé>). */
  var KEP = "eps.espace.v1";
  STORES.push({ pre: "ep|", key: KEP });
  function espRid(cls, full) { var o = codeFor(cls, full); if (!o.rid || !o.rk) { o.rid = b64url(crypto.getRandomValues(new Uint8Array(10))); o.rk = b64url(crypto.getRandomValues(new Uint8Array(32))); codePut(o); } return o; }
  async function espPublier(cls, eleves, make, prog) {
    var cfg = shCfg(); if (!cfg) throw new Error("Règle d'abord le partage entre tablettes (Réglages communs).");
    var put = [], n = 0;
    for (var i = 0; i < eleves.length; i++) { var o = espRid(cls, eleves[i]), obj = make(eleves[i]); obj.kind = "espace"; obj.eleve = eleves[i]; obj.classe = cls; obj.date = new Date().toLocaleDateString("fr-FR"); obj.rid = o.rid; obj.rk = o.rk;
      var pk = await bilPack(o.c, obj); put.push({ id: pk.hid + "|espace", parts: pk.parts }); n++; if (prog) prog(n, eleves.length);
      if (put.length >= 6 || i === eleves.length - 1) { await fetch(cfg.url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ key: cfg.key, bil: { put: put } }) }); put = []; } }
    /* contrôle : le premier élève doit retrouver son espace */
    if (eleves.length) { var ok = false; for (var k = 0; k < 4 && !ok; k++) { await new Promise(function (r) { setTimeout(r, 1500); }); try { ok = (await bilFetch(codeGet(cls, eleves[0]).c)).some(function (x) { return x && x.kind === "espace"; }); } catch (e) {} } if (!ok) throw new Error("L'envoi n'a pas pu être vérifié : réessaie avec du réseau."); }
    return n; }
  async function espRelever() {
    var cfg = shCfg(); if (!cfg) return 0; var since = +(localStorage.getItem("eps.espace.since") || 0), more = true, garde = 0, n = 0, I = stLd(KC).items, byRid = {};
    Object.keys(I).forEach(function (id) { var o = I[id]; if (o && !o.del && o.rid && o.rk) byRid[o.rid] = o; });
    while (more && garde++ < 20) { var r = await jsonp(cfg, { key: cfg.key, drops: 1, since: since }, 30000); if (!r || !r.keyOk || !Array.isArray(r.drops)) break;
      for (var i = 0; i < r.drops.length; i++) { var x = r.drops[i]; since = Math.max(since, +x[0] || 0); var m = /^dan\|E(.+)$/.exec(String(x[1])); if (!m || !byRid[m[1]]) continue; var o = byRid[m[1]];
        try { var key = await crypto.subtle.importKey("raw", unb64u(o.rk), "AES-GCM", false, ["decrypt"]), b = unb64u(String(x[3])), d = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, key, b.slice(12))));
          if (!d || typeof d !== "object") continue; var ek = norm(o.n).toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim().split(" ").sort().join(" ");
          stPutRaw(KEP, { id: "r|" + o.cls + "|" + ek, k: "ret", cls: o.cls, nom: o.n, fait: (d.fait && typeof d.fait === "object") ? d.fait : {}, obs: (d.obs && typeof d.obs === "object") ? d.obs : {}, at: +d.at || Date.now() });
          var Q = d.quiz && typeof d.quiz === "object" ? d.quiz : {}, QV = stLd("eps.quiz.v1");
          Object.keys(Q).forEach(function (qid) { var q = Q[qid]; if (!q || !QV.items[qid] || QV.items[qid].del) return; var qn = function (t) { return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, ""); }, pk = qn(o.n);
            try { EPSL.items().forEach(function (it) { if (it.nom === o.cls) EPSL.people(it).forEach(function (pp) { if (nkey(pp.full) === nkey(o.n)) pk = pp.k || qn(pp.full); }); }); } catch (e) {}
            var rid2 = "r|" + qid + "|" + qn(o.cls) + "|" + pk, old = QV.items[rid2];
            if (old && (old.nb || 0) >= (+q.nb || 1) && old.d === q.d) return;
            stPutRaw("eps.quiz.v1", { id: rid2, k: "res", qz: qid, cls: o.cls, nom: o.n, s: +q.s || 0, n: +q.n || 0, a: Array.isArray(q.a) ? q.a.slice(0, 60) : [], d: String(q.d || ""), nb: +q.nb || 1, src: "espace" }); });
          n++; } catch (e) {} }
      more = !!r.more; }
    try { localStorage.setItem("eps.espace.since", String(since)); } catch (e) {} if (n) try { EPSD.syncSoon(); } catch (e) {} return n; }
  setTimeout(function () { EPSD.espace = { publier: espPublier, relever: espRelever, lien: bilLink, pret: function () { return !!shCfg(); },
    code: function (cls, full) { var o = codeGet(cls, full); return o ? o.c : ""; },
    dispenses: function (cls) { try { return activeOn().filter(function (x) { return x && x.classe && norm(x.classe) === norm(cls); }).map(function (x) { return x.nom; }); } catch (e) { return []; } },
    get: function (id) { return stLd(KEP).items[id] || null; }, put: function (it) { stPutRaw(KEP, it); try { EPSD.syncSoon(); } catch (e) {} },
    retours: function (cls) { var V = stLd(KEP); return Object.keys(V.items).map(function (k) { return V.items[k]; }).filter(function (x) { return x && x.k === "ret" && x.cls === cls; }); } }; }, 0);
  function bilLink() { var cfg = shCfg(), m = cfg && /\/macros\/s\/([^/]+)\/exec/.exec(cfg.url); return m ? location.origin + BASE + "mon-bilan/#s=" + m[1] : ""; }
  function u8b64plain(u8) { var x = ""; for (var i = 0; i < u8.length; i += 0x8000) x += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(x); }
  /* ================= 🌐 Bilans en ligne, côté enseignant =================
     Accès : mode enseignant (ton code à 4 chiffres). Par classe : chaque élève, son code personnel (créé au besoin), les applis où sa fiche est en ligne ;
     👁 télécharge ses fiches et les déchiffre avec son code (gardé, chiffré, sur tes tablettes) ; 🖨 codes à distribuer ; lien « Mon bilan » à envoyer par Pronote.
     Entrée : bouton de la recherche 🔍, EPSD.bilans(), ou « Espace enseignant » de la page Mon bilan (accueil#bilans). */
  async function bilKeyD(code, hid) { var base = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: new TextEncoder().encode("eps-bilan|" + hid), iterations: 150000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]); }
  function unb64u(t) { t = t.replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; var s = atob(t), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  async function bilFetch(code) { var cfg = shCfg(), h = await bilHid(code), r = await jsonp(cfg, { bil: h }, 40000); if (!r) throw new Error("pas de réponse du script"); if (r.bilErr) throw new Error("script : " + r.bilErr);
    var k = await bilKeyD(code, h), out = []; for (var i = 0; i < (r.bil || []).length; i++) { try { var b = unb64u(r.bil[i].parts.join("")), pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, k, b.slice(12)); out.push(JSON.parse(new TextDecoder().decode(pt))); } catch (e) {} } return out; }
  function pdfOpen(o) { var u = unb64u(String(o.pdf || "").replace(/\+/g, "-").replace(/\//g, "_")), bl = new Blob([u], { type: "application/pdf" }), url = URL.createObjectURL(bl), w = window.open(url, "_blank");
    if (!w) { var a = document.createElement("a"); a.href = url; a.download = "Bilan_" + String(o.app || "").replace(/[^A-Za-z0-9]+/g, "_") + "_" + String(o.eleve || "").replace(/[^A-Za-z0-9À-ÿ]+/g, "_") + ".pdf"; document.body.appendChild(a); a.click(); a.remove(); } }
  function codesPrint(cls, P) { var link = bilLink(), w = window.open("", "_blank"); if (!w) { alert("Autorise les fenêtres pour imprimer les codes."); return; }
    w.document.write('<!doctype html><meta charset="utf-8"><title>Codes ' + esc(cls) + '</title><style>body{font-family:system-ui,sans-serif;margin:10mm}.g{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.e{border:1px dashed #999;border-radius:6px;padding:4mm;break-inside:avoid}.c{font:800 22px ui-monospace,monospace;letter-spacing:.2em;margin:2mm 0}.l{font-size:11px;word-break:break-all;color:#444}</style><div class="g">' +
      P.map(function (n) { var c = codeFor(cls, n); return '<div class="e"><b>' + esc(n) + "</b> · " + esc(cls) + "<div>Ton code pour voir tes bilans d'EPS (le même pour toutes les activités, ne le donne à personne) :</div><div class=\"c\">" + esc(c.c) + '</div><div class="l">' + esc(link) + "</div></div>"; }).join("") + "</div><script>setTimeout(function(){print()},300)<\/script>"); w.document.close(); }
  function bilans(want, sur) {
    /* « sur » : le code vient d'être donné. Hors de l'accueil (carnet, espace élève…), isTeacher() reste faux : sans ce repère la fonction se rappelait sans fin et figeait la tablette (corrigé le 27/11/2026) */
    if (!sur && !isTeacher()) { askCode().then(function (ok) { if (ok) { setHubTeach(true); bilans(want, true); } }); return; }
    if (!shCfg()) { alert("Règle d'abord le partage entre tablettes (Réglages) : les bilans en ligne passent par le script commun."); return; }
    var CL = []; try { CL = EPSL.items().map(function (it) { return it.nom; }).sort(function (a, b) { return a.localeCompare(b, "fr", { numeric: true }); }); } catch (e) {}
    var cur = want && CL.indexOf(want) >= 0 ? want : CL[0], link = bilLink();
    var o = overlay('<div id="epsbp"><h3>🌐 Bilans en ligne des élèves</h3><p class="m">Les élèves ouvrent la page « Mon bilan » (lien ci-dessous, à envoyer par Pronote) et tapent leur code personnel de 6 caractères : ils voient les fiches publiées de toutes les activités. Ici, en mode enseignant, tu vois et ouvres les fiches de chacun.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0"><select class="epsd-in" id="bp-c" style="width:auto;margin:0">' + CL.map(function (c) { return "<option" + (c === cur ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + '</select><button type="button" id="bp-cp">📋 Copier le lien Mon bilan</button><button type="button" id="bp-pr">🖨 Codes à distribuer</button></div>' +
      '<input class="epsd-in" readonly value="' + esc(link) + '" style="margin:0 0 8px"><p class="m" id="bp-m"></p><div id="bp-l"></div><div class="epsd-act"><button data-x>Fermer</button></div></div>');
    var bx = o.querySelector(".epsd-box"); if (bx) { bx.style.maxWidth = "820px"; bx.style.width = "96vw"; }
    var sel = o.querySelector("#bp-c"), list = o.querySelector("#bp-l"), msg = o.querySelector("#bp-m");
    function people(c) { var P = []; try { EPSL.items().forEach(function (it) { if (it.nom === c) P = EPSL.people(it).map(function (p) { return p.full; }); }); } catch (e) {} return P; }
    function draw() { var c = sel.value, P = people(c);
      list.innerHTML = P.length ? '<table style="width:100%;border-collapse:collapse;font-size:15px;text-align:left"><tr class="m"><th style="padding:4px">Élève</th><th>Code</th><th>Fiches en ligne</th><th></th></tr>' + P.map(function (n, i) { var k = codeGet(c, n), pub = k && k.pub ? Object.keys(k.pub) : [];
        return '<tr style="border-top:1px solid #E6E1D6"><td style="padding:6px 4px"><b>' + esc(n) + '</b></td><td style="font:800 15px ui-monospace,monospace;letter-spacing:.1em">' + (k ? esc(k.c) : '<span class="m">—</span>') + '</td><td class="m" style="font-size:13px">' + (pub.length ? esc(pub.map(function (a) { return ACTN[a] || OV_NOM[a] || a; }).join(", ")) : "aucune") + '</td><td style="white-space:nowrap">' + (k ? '<button type="button" data-v="' + i + '">👁 Voir</button>' : '<button type="button" data-k="' + i + '">🔑 Créer son code</button>') + "</td></tr>" + '<tr><td colspan="4" data-f="' + i + '"></td></tr>'; }).join("") + "</table>"
        : '<p class="m">Aucun élève dans cette classe.</p>';
      list.querySelectorAll("[data-k]").forEach(function (b) { b.onclick = function () { codeFor(c, P[+b.dataset.k]); draw(); }; });
      list.querySelectorAll("[data-v]").forEach(function (b) { b.onclick = async function () { var n = P[+b.dataset.v], k = codeGet(c, n), box = list.querySelector('[data-f="' + b.dataset.v + '"]'); b.disabled = true; box.innerHTML = '<span class="m">Recherche et déchiffrement…</span>';
        try { var F = await bilFetch(k.c); box.innerHTML = F.length ? F.map(function (f, j) { return '<button type="button" data-o="' + j + '" style="margin:4px 6px 4px 0">📄 ' + esc(f.app) + " · " + esc(f.date || "") + "</button>"; }).join("") : '<span class="m">Aucune fiche en ligne pour ce code : publie-la depuis le bilan de l\'activité (🌐 Publier en ligne).</span>';
          box.querySelectorAll("[data-o]").forEach(function (x) { x.onclick = function () { pdfOpen(F[+x.dataset.o]); }; }); } catch (e) { box.innerHTML = '<span style="color:#C0392B">⚠ ' + esc(e.message || e) + "</span>"; } b.disabled = false; }; });
    }
    sel.onchange = draw; draw();
    o.querySelector("#bp-cp").onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { msg.textContent = "📋 Lien copié : colle-le dans un message Pronote à la classe."; }, function () { prompt("Copie ce lien :", link); }); };
    o.querySelector("#bp-pr").onclick = function () { var c = sel.value; codesPrint(c, people(c)); draw(); };
  }
  /* o = {app, nom, color, classe, eleves:[{full, bytes: () => Promise<Uint8Array>}]} (appelé par eps-eval.js : « 🌐 Publier en ligne ») */
  function publish(o) {
    if (!shCfg()) { alert("Règle d'abord le partage entre tablettes (Réglages) : la publication passe par le script commun."); return; }
    var link = bilLink();
    var ov = overlay('<div id="epsbil"><h3>🌐 Bilans en ligne · ' + esc(o.nom) + " · " + esc(o.classe) + '</h3><p class="m">Chaque fiche est chiffrée avec le code personnel de l\'élève : sans son code, personne ne peut la lire. Envoie le lien ci-dessous par Pronote et donne à chaque élève son code (étiquettes à imprimer). Le code est le même pour toutes les activités.</p>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input class="epsd-in" readonly value="' + esc(link) + '" style="flex:1;min-width:240px;margin:0"></div>' +
      '<div class="epsd-act" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="bil-go">🌐 Publier les fiches</button><button type="button" id="bil-cp">📋 Copier le lien</button><button type="button" id="bil-pr">🖨 Codes à distribuer</button><button type="button" id="bil-rm">🗑 Retirer en ligne</button></div><p class="m" id="bil-m"></p><div id="bil-l"></div><div class="epsd-act"><button data-x>Fermer</button></div></div>');
    var msg = ov.querySelector("#bil-m"), list = ov.querySelector("#bil-l");
    function draw() { list.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:15px">' + o.eleves.map(function (e, i) { var c = codeGet(o.classe, e.full), p = c && c.pub && c.pub[o.app];
      return '<tr style="border-top:1px solid #E6E1D6"><td style="padding:6px 4px;text-align:left">' + esc(e.full) + '</td><td style="font:800 16px ui-monospace,monospace;letter-spacing:.12em">' + (c ? esc(c.c) : "—") + '</td><td class="m" style="font-size:13px">' + (p ? "en ligne le " + new Date(p).toLocaleDateString("fr-FR") : "non publié") + '</td><td><button type="button" data-rn="' + i + '" title="Code perdu : nouveau code" style="height:34px;border-radius:10px;border:1.5px solid #ccc;background:#fff;padding:0 8px">↻ Nouveau code</button></td></tr>'; }).join("") + "</table>";
      list.querySelectorAll("[data-rn]").forEach(function (b) { b.onclick = function () { var e = o.eleves[+b.dataset.rn]; if (!confirm("Donner un nouveau code à " + e.full + " ? L'ancien ne marchera plus (toutes activités) : republie ensuite ses bilans.")) return; renew(e); }; }); }
    async function renew(e) { var c = codeGet(o.classe, e.full), del = []; if (c && c.c) { var h = await bilHid(c.c); Object.keys(c.pub || {}).forEach(function (a) { del.push(h + "|" + a); }); }
      var n = codeFor(o.classe, e.full, true); n.pub = {}; codePut(n); if (del.length) { try { await EPSD.post({ bil: { del: del } }); } catch (x) {} }
      msg.textContent = "Nouveau code pour " + e.full + " : " + n.c + ". Republie ses fiches (« 🌐 Publier les fiches »)."; draw(); }
    ov.querySelector("#bil-cp").onclick = function () { (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { msg.textContent = "📋 Lien copié : colle-le dans un message Pronote à la classe."; }, function () { msg.textContent = "Sélectionne le lien et copie-le."; }); };
    ov.querySelector("#bil-pr").onclick = function () { o.eleves.forEach(function (e) { codeFor(o.classe, e.full); }); draw();
      var w = window.open("", "_blank"); if (!w) { msg.textContent = "Autorise les fenêtres pour imprimer."; return; }
      w.document.write('<!doctype html><meta charset="utf-8"><title>Codes ' + esc(o.classe) + '</title><style>body{font-family:system-ui,sans-serif;margin:10mm}.g{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.e{border:1px dashed #999;border-radius:6px;padding:4mm;break-inside:avoid}.c{font:800 22px ui-monospace,monospace;letter-spacing:.2em;margin:2mm 0}.l{font-size:10px;color:#555;word-break:break-all}</style><div class="g">' +
        o.eleves.map(function (e) { var c = codeGet(o.classe, e.full); return '<div class="e"><b>' + esc(e.full) + "</b> · " + esc(o.classe) + '<div>Ton code pour voir tes bilans d\'EPS :</div><div class="c">' + esc(c.c) + '</div><div class="l">' + esc(link) + "</div></div>"; }).join("") + "</div><script>print()<\/script>"); w.document.close(); };
    ov.querySelector("#bil-rm").onclick = async function () { if (!confirm("Retirer en ligne les fiches " + o.nom + " de " + o.classe + " ?")) return; var del = [];
      for (var i = 0; i < o.eleves.length; i++) { var c = codeGet(o.classe, o.eleves[i].full); if (c && c.pub && c.pub[o.app]) { del.push((await bilHid(c.c)) + "|" + o.app); delete c.pub[o.app]; codePut(c); } }
      if (!del.length) { msg.textContent = "Rien en ligne."; return; } try { await EPSD.post({ bil: { del: del } }); msg.textContent = "🗑 " + del.length + " fiche(s) retirée(s)."; } catch (e) { msg.textContent = "⚠ " + e.message; } draw(); };
    ov.querySelector("#bil-go").onclick = async function () { var b = this; b.disabled = true; var batch = [], done = 0, date = new Date().toLocaleDateString("fr-FR");
      try {
        for (var i = 0; i < o.eleves.length; i++) { var e = o.eleves[i], c = codeFor(o.classe, e.full); msg.textContent = "Chiffrement " + (i + 1) + " / " + o.eleves.length + "…";
          var bytes = await e.bytes(), pk = await bilPack(c.c, { app: o.nom, color: o.color, classe: o.classe, eleve: e.full, date: date, pdf: u8b64plain(new Uint8Array(bytes)) });
          batch.push({ id: pk.hid + "|" + o.app, parts: pk.parts, e: e }); var size = batch.reduce(function (s, x) { return s + x.parts.join("").length; }, 0);
          if (size > 400000 || i === o.eleves.length - 1) { msg.textContent = "Envoi au script…"; var r = await EPSD.post({ bil: { put: batch.map(function (x) { return { id: x.id, parts: x.parts }; }) } });
            if (!r || !r.ok) throw new Error(r && r.error === "requête" ? "le script n'est pas à jour : colle le nouveau Code.gs et redéploie" : (r && r.error) || "pas de réponse");
            batch.forEach(function (x) { var cc = codeGet(o.classe, x.e.full); cc.pub = cc.pub || {}; cc.pub[o.app] = Date.now(); codePut(cc); done++; }); batch = []; } }
        msg.textContent = "✓ " + done + " fiche(s) en ligne. Envoie le lien par Pronote et distribue les codes.";
      } catch (x) { msg.textContent = "⚠ " + (x.message || x) + (done ? " (" + done + " déjà en ligne)" : ""); }
      b.disabled = false; draw(); };
    draw();
  }
  /* 🙋 bulle d'auto-positionnement (pastilles créées par window.epsApChip d'eps-lists.js, dans l'onglet Évaluation de chaque appli) */
  function apPop(el) {
    var o; try { o = JSON.parse(el.getAttribute("data-eps-ap")); } catch (e) { return; }
    var old = document.getElementById("eps-appop"); if (old) old.remove();
    var DC = ["", "#C0392B", "#E67E22", "#2E86C1", "#1E8449"], deg = function (d) { return d ? '<b style="display:inline-block;min-width:30px;text-align:center;border-radius:8px;padding:1px 6px;color:#fff;background:' + (DC[d] || "#888") + '">D' + d + "</b>" : '<span style="color:#6A6F78">–</span>'; };
    var p = document.createElement("div"); p.id = "eps-appop";
    p.style.cssText = "position:fixed;z-index:2147483600;max-width:min(440px,92vw);background:#fff;color:#14171C;border:1px solid #E6E1D6;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:14px 16px;font:15px/1.4 system-ui,sans-serif";
    p.innerHTML = '<div style="display:flex;gap:8px;align-items:center"><b style="font-size:17px;flex:1">🙋 ' + esc(o.nom || "Auto-positionnement") + '</b><button type="button" data-c style="border:0;background:#F1EEE6;border-radius:10px;height:32px;padding:0 10px;font-weight:800">✕</button></div>' +
      (o.date ? '<div style="color:#6A6F78;font-size:13px">envoyé le ' + esc(o.date) + "</div>" : "") +
      ((o.crit || []).length ? '<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:14px"><tr style="color:#6A6F78;font-size:12px"><td></td><td style="text-align:center">Toi (prof)</td><td style="text-align:center">Élève</td></tr>' + o.crit.map(function (c) { var g = c.p && c.e ? c.e - c.p : 0;
        return '<tr style="border-top:1px solid #F0ECE3"><td style="padding:5px 4px">' + esc(c.l) + '</td><td style="text-align:center">' + deg(c.p) + '</td><td style="text-align:center">' + deg(c.e) + (g > 0 ? " ▲" : g < 0 ? " ▼" : "") + "</td></tr>"; }).join("") + "</table>" : "") +
      (o.r ? '<div style="margin-top:10px"><div style="font-weight:800;color:#1D6B3A;font-size:13px">✓ CE QUE J\'AI RÉUSSI</div>' + esc(o.r) + "</div>" : "") +
      (o.m ? '<div style="margin-top:8px"><div style="font-weight:800;color:#9A5B00;font-size:13px">→ CE QUE JE DOIS AMÉLIORER</div>' + esc(o.m) + "</div>" : "") +
      (!o.r && !o.m ? '<div style="margin-top:8px;color:#6A6F78">Pas de commentaire de l\'élève.</div>' : "");
    document.body.appendChild(p);
    var r = el.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
    p.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left)) + "px"; p.style.top = (r.bottom + h + 12 < innerHeight ? r.bottom + 6 : Math.max(8, r.top - h - 6)) + "px";
    p.querySelector("[data-c]").onclick = function () { p.remove(); };
  }
  document.addEventListener("click", function (e) {
    var c = e.target.closest && e.target.closest("[data-eps-ap]");
    if (c) { e.preventDefault(); e.stopPropagation(); apPop(c); return; }
    var p = document.getElementById("eps-appop"); if (p && !p.contains(e.target)) p.remove();
  }, true);
  /* 📝 appréciations de bulletin : Claude rédige à partir de TES commentaires et évaluations (toutes activités), sans aucun nom d'élève ;
     tu relis, corriges, coches ✓, puis copies vers Pronote. Gardées sur cette tablette seulement (eps.bulletin.v1). */
  function bulletin(want) {
    var KB = "eps.bulletin.v1", B = jget(KB, {}), C = [];
    /* période : trimestre (année scolaire en cours) ou année ; les données datées (observations, évaluations de leçon, résultats, remédiation) sont filtrées */
    var SY = new Date().getMonth() >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1, pd = function (y, m, d) { return y + "-" + ("0" + m).slice(-2) + "-" + ("0" + d).slice(-2); };
    var TR = { 1: [pd(SY, 9, 1), pd(SY, 11, 30)], 2: [pd(SY, 12, 1), pd(SY + 1, 2, new Date(SY + 1, 2, 0).getDate())], 3: [pd(SY + 1, 3, 1), pd(SY + 1, 7, 10)], 0: [pd(SY, 8, 20), pd(SY + 1, 7, 10)] }, TCUR = [1, 2, 3].filter(function (t) { return today() >= TR[t][0] && today() <= TR[t][1]; })[0] || 0;
    var PER = TR[TCUR], inPer = function (d) { return !d || (d >= PER[0] && d <= PER[1]); }, dOf = function (t) { var x = new Date(t); return pd(x.getFullYear(), x.getMonth() + 1, x.getDate()); }; try { C = (window.EPSL ? EPSL.items() : []).map(function (it) { return it.nom; }); } catch (e) {}
    var cur = want && C.indexOf(want) >= 0 ? want : B._cls && C.indexOf(B._cls) >= 0 ? B._cls : C[0];
    var o = overlay('<div id="epsbu"><h3>📝 Appréciations de bulletin</h3><p class="m">Claude part de tes commentaires et évaluations de toutes les activités de la période (aucun nom ne lui est envoyé) et formule l\'appréciation de façon positive : tu ajoutes tes remarques. Relis, corrige, coche ✓ : seules les appréciations cochées sont copiées.</p>' +
      '<div class="epsd-act" style="justify-content:flex-start;flex-wrap:wrap;align-items:center;margin-top:6px"><select class="epsd-in" id="bu-c" style="width:auto;margin:0">' + C.map(function (c) { return "<option" + (c === cur ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + '</select><select class="epsd-in" id="bu-p" style="width:auto;margin:0" aria-label="Période">' + [1, 2, 3, 0].map(function (t) { return '<option value="' + t + '"' + (t === TCUR ? " selected" : "") + ">" + (t ? "Trimestre " + t : "Toute l'année") + "</option>"; }).join("") + '</select><button type="button" id="bu-go">✨ Proposer les appréciations</button><button type="button" id="bu-cp">📋 Copier (✓)</button></div><p class="m" id="bu-m"></p><div id="bu-l"></div><div class="epsd-act"><button data-x>Fermer</button></div></div>');
    var sel = o.querySelector("#bu-c"), list = o.querySelector("#bu-l"), msg = o.querySelector("#bu-m"), psel = o.querySelector("#bu-p");
    var rk = function (c) { var k = c + "|" + psel.value; if (!B[k] && psel.value === String(TCUR) && B[c] && typeof B[c] === "object") B[k] = B[c]; return k; };
    psel.onchange = function () { PER = TR[psel.value]; save(); draw(); };
    function people(c) { var P = []; try { EPSL.items().forEach(function (it) { if (it.nom === c) P = EPSL.people(it).map(function (p) { return p.full; }); }); } catch (e) {} return P; }
    function notes(c, n) { var O = (window.EPSOB ? EPSOB.of(n, c) : []).filter(function (o) { return inPer(o.day); }), fs = people(c).map(function (x) { return x.split(" ")[0]; });
      var LE = []; try { var kk = String(n).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean).sort().join(" ");
        for (var li = 0; li < localStorage.length; li++) { var lk = localStorage.key(li); if (!/^eps\.leceval\.[a-z]+\.v1$/.test(lk || "")) continue; var LV = jget(lk, {}); Object.keys((LV && LV.items) || {}).forEach(function (id) { var o = LV.items[id]; if (!o || o.del || cmp(o.cls) !== cmp(c) || !inPer(o.day)) return; var x = (o.el || {})[kk]; if (!x) return; var v = ["p", "s", "t"].filter(function (q) { return x[q] != null; }).map(function (q) { return +x[q]; }); if (v.length) LE.push(v.reduce(function (a, b) { return a + b; }, 0) / v.length); }); } } catch (e) {}
      var RS = [0, 0]; try { for (var lj = 0; lj < localStorage.length; lj++) { var rk = localStorage.key(lj); if (!/^eps\.lecres\.[a-z]+\.v1$/.test(rk || "")) continue; var RV = jget(rk, {}); Object.keys((RV && RV.items) || {}).forEach(function (id) { var o = RV.items[id]; if (!o || o.del || o.ek !== kk || cmp(o.cls) !== cmp(c) || !inPer(o.day)) return; Object.keys(o.r || {}).forEach(function (q) { if (/@auto$/.test(q)) return; RS[0] += o.r[q] === 2 ? 1 : o.r[q] === 1 ? .5 : 0; RS[1]++; }); }); } } catch (e) {}
      var RM = []; try { var RMV = jget("eps.remed.v1", {}); Object.keys((RMV && RMV.items) || {}).forEach(function (id) { var o = RMV.items[id]; if (o && !o.del && cmp(o.cls) === cmp(c) && nkey(o.el) === nkey(n) && inPer(dOf(o.at))) RM.push(o); }); } catch (e) {}
      var rm = RM.length ? "\nRemédiation en autonomie : " + RM.length + " situation(s) proposée(s) (" + RM.map(function (o) { return o.tag; }).filter(Boolean).join(", ") + "), " + RM.filter(function (o) { return o.st === 3; }).length + " réussie(s), " + RM.filter(function (o) { return o.st === 2; }).length + " en partie, " + RM.filter(function (o) { return !o.st; }).length + " pas encore essayée(s)" : "";
      var rs = RS[1] ? "\nSituations des leçons (résultats notés par l'élève) : " + Math.round(RS[0] / RS[1] * 100) + " % de réussite sur " + RS[1] + " situation(s)" : "";
      var le = LE.length ? "\nÉvaluations de leçon (participation, sérieux, thème du jour) : moyenne " + (Math.round(LE.reduce(function (a, b) { return a + b; }, 0) / LE.length * 10) / 10) + " / 3 sur " + LE.length + " leçon(s)" : "";
      var ob = O.length ? "\nObservations du professeur pendant les leçons : " + O.slice(-12).map(function (o) { var t = o.txt; fs.forEach(function (f) { if (f) t = t.replace(new RegExp("\\b" + f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi"), "un camarade"); }); return t; }).join(" ; ") : "";
      return evalsOf(n, c).map(function (e) { return e.app + " : " + (e.st === "ABS" ? "absent(e)" : e.st === "DISP" ? "dispensé(e)" : e.n + " critère(s) évalué(s)") + (e.comm ? ". Commentaire du professeur : " + e.comm : ""); }).join("\n") + ob + le + rs + rm; }
    function save() { B._cls = sel.value; try { localStorage.setItem(KB, JSON.stringify(B)); } catch (e) {} }
    function draw() {
      var c = sel.value, R = B[rk(c)] = B[rk(c)] || {}, P = people(c);
      list.innerHTML = P.map(function (n, i) { var r = R[n] || {}, has = !!notes(c, n);
        return '<div style="border:1px solid #E6E1D6;border-radius:12px;padding:8px 12px;margin:0 0 8px"><label style="display:flex;gap:10px;align-items:center;justify-content:flex-start;font-weight:800;text-align:left"><input type="checkbox" style="width:24px;height:24px;flex:none;margin:0" data-ok="' + i + '"' + (r.ok ? " checked" : "") + "> " + esc(n) + (has ? "" : ' <span class="m" style="font-weight:400">(aucune donnée)</span>') + '</label><textarea class="epsd-in" data-t="' + i + '" style="min-height:58px;margin-top:6px' + (r.ai && !r.ok ? ";background:#FFF8D6" : "") + '" placeholder="Appréciation…">' + esc(r.t || "") + "</textarea></div>"; }).join("") || '<p class="m">Aucun élève dans cette classe.</p>';
      list.querySelectorAll("[data-t]").forEach(function (ta) { ta.oninput = function () { var n = P[+ta.dataset.t]; R[n] = R[n] || {}; R[n].t = ta.value; R[n].ai = 0; ta.style.background = ""; save(); }; });
      list.querySelectorAll("[data-ok]").forEach(function (cb) { cb.onchange = function () { var n = P[+cb.dataset.ok]; R[n] = R[n] || {}; R[n].ok = cb.checked; if (cb.checked) R[n].ai = 0; save(); draw(); }; });
    }
    sel.onchange = function () { save(); draw(); };
    o.querySelector("#bu-go").onclick = function () {
      var b = this, c = sel.value, R = B[rk(c)] = B[rk(c)] || {}, P = people(c).filter(function (n) { return notes(c, n) && !(R[n] && (R[n].ok || (R[n].t && !R[n].ai))); }), i = 0;
      if (!P.length) { msg.textContent = "Rien à proposer : appréciations déjà écrites ou validées, ou aucune donnée."; return; }
      b.disabled = true;
      (function next() {
        if (i >= P.length) { b.disabled = false; msg.textContent = "✓ " + P.length + " proposition(s) en jaune : relis, corrige et coche ✓."; save(); draw(); return; }
        var n = P[i++]; msg.textContent = "Claude rédige " + i + " / " + P.length + "…";
        reformuler("Période : " + psel.options[psel.selectedIndex].text + "\n" + notes(c, n), { mode: "bulletin", act: "EPS (toutes activités)", ctx: "Classe de lycée. Données du professeur pour un élève, activité par activité. Appréciation positive : l'enseignant ajoute ses remarques." })
          .then(function (t) { R[n] = { t: String(t || "").trim(), ai: 1, ok: false }; save(); draw(); next(); })
          .catch(function (e) { b.disabled = false; msg.textContent = "⚠ " + e.message; save(); draw(); });
      })();
    };
    o.querySelector("#bu-cp").onclick = function () { var c = sel.value, R = B[rk(c)] || {}, txt = people(c).filter(function (n) { return R[n] && R[n].ok && R[n].t; }).map(function (n) { return n + " : " + R[n].t; }).join("\n");
      if (!txt) { msg.textContent = "Coche ✓ les appréciations relues pour les copier."; return; }
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { msg.textContent = "📋 Copié : colle dans Pronote ou un document."; }, function () { var ta = document.createElement("textarea"); ta.value = txt; o.appendChild(ta); ta.select(); try { document.execCommand("copy"); msg.textContent = "📋 Copié."; } catch (e) {} ta.remove(); }); };
    draw();
  }
  function searchBtn() {
    var b = document.getElementById("eps-find"), sl = epsSlot();
    if (!b) { if (!sl) return; b = document.createElement("button"); b.type = "button"; b.id = "eps-find"; b.className = "epsb"; b.title = "Rechercher un élève"; b.innerHTML = "🔍"; b.onclick = searchStudents; var sy = document.getElementById("eps-sync"); sl.insertBefore(b, sy && sy.parentNode === sl ? sy : sl.firstChild); }
    b.style.display = isTeacher() ? "" : "none";
  }
  setInterval(function () { try { searchBtn(); } catch (e) {} }, 3000);
  /* ================= 📊 Vue d'ensemble (mode enseignant, bouton 📊 de l'en-tête) =================
     Une carte par classe : appel du jour, dispensés, et pour chaque activité de la classe : leçon en cours ou prochaine leçon programmée,
     élèves évalués, auto-positionnements reçus, leçons évaluées, réussite des situations notées par les élèves, observations dictées.
     Tout est lu sur la tablette (données déjà synchronisées) : rien n'est envoyé. Toucher une activité ouvre l'appli. */
  var OV_DIR = { esc: "escalade", rel: "relais", ori: "orientation", vol: "volley", bad: "badminton", dan: "danse", acro: "acrosport", ct: "crosstraining", bk: "basket", step: "step" };
  var OV_NOM = { esc: "Escalade", rel: "Relais Vitesse", ori: "OrienRun", vol: "Volley-ball", bad: "Badminton", dan: "Danse", acro: "Acrosport", ct: "Cross-training", bk: "Basket-ball", step: "Step" };
  function ovItems(k) { var V = jget(k, null); return V && V.items ? Object.keys(V.items).map(function (i) { return V.items[i]; }).filter(function (o) { return o && !o.del; }) : []; }
  function overview() {
    var CL = []; try { CL = (window.EPSL ? EPSL.items() : []).slice().sort(function (a, b) { return String(a.nom).localeCompare(String(b.nom), "fr", { numeric: true }); }); } catch (e) {}
    var root = location.pathname.replace(/(\/eps-autonomie-numerique\/).*$/, "$1"), now = Date.now(), d0 = today();
    var obs = ovItems("eps.obs.v1"), cards = CL.map(function (it) {
      var P = []; try { P = EPSL.people(it).map(function (p) { return p.full; }); } catch (e) {}
      var acts = Object.keys(OV_DIR).filter(function (a) { return (it.off || []).indexOf(a) < 0; });
      var ab = abGet(it.nom), dp = P.filter(function (n) { return !!find(it.nom, n); }).length;
      var EV = {}; P.forEach(function (n) { evalsOf(n, it.nom).forEach(function (e) { var x = EV[e.app] = EV[e.app] || { n: 0, auto: 0 }; if (e.n > 0 || e.st) x.n++; if (e.auto) x.auto++; }); });
      var rows = acts.map(function (a) {
        var dir = OV_DIR[a], live = ovItems("eps.live." + dir + ".v1").filter(function (v) { return v.on && cmp(v.cls) === cmp(it.nom) && v.st > now - 4 * 3600e3; })[0];
        var nx = null; ovItems("eps.lecons." + dir + ".v1").forEach(function (l) { if (l.statut === "brouillon") return; (l.prog || []).forEach(function (p) { if (cmp(p.c) === cmp(it.nom) && p.at > now && (!nx || p.at < nx.at)) nx = { at: p.at, t: l.titre || "Leçon" }; }); });
        var le = ovItems("eps.leceval." + dir + ".v1").filter(function (o) { return cmp(o.cls) === cmp(it.nom); }).length;
        var rs = [0, 0]; ovItems("eps.lecres." + dir + ".v1").forEach(function (o) { if (cmp(o.cls) !== cmp(it.nom)) return; Object.keys(o.r || {}).forEach(function (q) { rs[0] += o.r[q] === 2 ? 1 : o.r[q] === 1 ? .5 : 0; rs[1]++; }); });
        var ob = obs.filter(function (o) { return o.app === dir && cmp(o.cls) === cmp(it.nom); }).length, ev = EV[OV_NOM[a]] || EV[a === "vol" ? "Volley-ball" : OV_NOM[a]] || { n: 0, auto: 0 };
        var bits = [live ? '<b style="color:#1E8449">● leçon en cours</b>' : nx ? "📅 " + esc((new Date(nx.at).toDateString() === new Date().toDateString() ? "aujourd'hui" : new Date(nx.at).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })) + " à " + new Date(nx.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })) + " : " + esc(nx.t) : '<span class="m">pas de leçon programmée</span>',
          "📋 " + ev.n + "/" + P.length + " évalué" + (ev.n > 1 ? "s" : ""), ev.auto ? "🙋 " + ev.auto + " auto-positionnement" + (ev.auto > 1 ? "s" : "") : "", le ? "📊 " + le + " leçon" + (le > 1 ? "s" : "") + " évaluée" + (le > 1 ? "s" : "") : "",
          rs[1] ? "🏁 " + Math.round(rs[0] / rs[1] * 100) + " % de réussite (" + rs[1] + ")" : "", ob ? "🎙 " + ob + " observation" + (ob > 1 ? "s" : "") : ""].filter(Boolean);
        return '<a href="' + root + dir + '/" style="display:block;text-decoration:none;color:inherit;border-top:1px solid #F0ECE3;padding:7px 2px"><b>' + esc(OV_NOM[a]) + " ›</b><div style=\"font-size:14px;display:flex;flex-wrap:wrap;gap:4px 12px\">" + bits.map(function (b) { return "<span>" + b + "</span>"; }).join("") + "</div></a>"; }).join("");
      return '<div style="border:1px solid #E6E1D6;border-radius:14px;padding:10px 14px;background:#fff"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap"><h4 style="margin:0;font-size:18px">' + esc(it.nom) + '</h4><span class="m" style="margin:0">' + P.length + " élève" + (P.length > 1 ? "s" : "") + "</span></div>" +
        '<div style="font-size:14px;margin:4px 0 2px">' + (ab ? "🙋 Appel : <b>" + (P.length - (ab.abs || []).length) + " présent" + (P.length - (ab.abs || []).length > 1 ? "s" : "") + "</b>" + ((ab.abs || []).length ? " · absent" + ((ab.abs || []).length > 1 ? "s" : "") + " : " + esc(ab.abs.join(", ")) : "") : '<span class="m">🙋 Appel pas encore fait aujourd\'hui</span>') + (dp ? " · 🩹 " + dp + " dispensé" + (dp > 1 ? "s" : "") : "") + "</div>" +
        (rows || '<p class="m">Aucune activité attribuée (⚙ Réglages → Listes).</p>') + "</div>"; });
    var o = overlay("<h3>📊 Vue d'ensemble · " + esc(new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })) + '</h3><p class="m">Tes classes et leurs activités d\'après ce qui est sur cette tablette. Touche une activité pour l\'ouvrir.</p>' +
      (cards.length ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;text-align:left;align-items:start">' + cards.join("") + "</div>" : '<p class="m">Aucune classe : ajoute tes listes dans ⚙ Réglages.</p>') + '<div class="epsd-act"><button data-x>Fermer</button></div>');
    var bx = o.querySelector(".epsd-box"); if (bx) { bx.style.maxWidth = "1100px"; bx.style.width = "96vw"; }
    return o;
  }
  /* ================= 📱 Tablettes connectées et 📣 signal général (communs) =================
     Chaque tablette (partage réglé) envoie un signe de vie « tb|<id> » : {id, nom, app, mode, cls, eq, at, ok, err, ver}
     (toutes les 60 s quand l'écran est allumé, si quelque chose a changé ou toutes les 3 min) → EPSD.tablets().
     Signal « sg|cur » : {txt, at, until, from, app ('*' = toutes les applis)} envoyé par l'enseignant (EPSD.signal()),
     relevé toutes les 8 s par les tablettes, affiché en plein écran avec un son ; « J'ai compris » le ferme sur la tablette. */
  var KTB = "eps.tabs.v1", KSG = "eps.sig.v1";
  STORES.push({ pre: "tb|", key: KTB });
  STORES.push({ pre: "sg|", key: KSG, onChange: function () { sigCheck(); } });
  function devInfo() { var d = jget("eps.dev.v1", null); if (!d || !d.id) { d = { id: "d" + Math.random().toString(36).slice(2, 10), nom: "" }; try { localStorage.setItem("eps.dev.v1", JSON.stringify(d)); } catch (e) {} } return d; }
  function appDir() { var m = /\/eps-autonomie-numerique\/([^\/]+)\//.exec(location.pathname); return m ? m[1] : "accueil"; }
  var VER = ""; try { caches.keys().then(function (k) { var v = k.filter(function (x) { return /^eps-core-v\d+$/.test(x); }).map(function (x) { return +x.slice(10); }).sort(function (a, b) { return b - a; })[0]; if (v) VER = v; }); } catch (e) {}
  var tbLast = { s: "", t: 0 };
  function beat() {
    if (!shCfg() || window.EPS_SIM || document.visibilityState === "hidden") return;
    var o = {}; try { if (typeof window.epsTabInfo === "function") o = window.epsTabInfo() || {}; } catch (e) {}
    var cc = null; try { cc = window.epsCurrentClass && window.epsCurrentClass(); } catch (e) {}
    var d = devInfo(), it = { id: d.id, nom: d.nom || "", app: appDir(), mode: isTeacher() ? "enseignant" : (o.mode || "élève"), cls: o.cls || (cc && cc.nom) || "", eq: o.eq || "", ok: lastOk || 0, err: lastErr || "", ver: VER || "", pend: 0 };
    try { it.pend = nPend(); } catch (e) {}
    var sig = JSON.stringify([it.app, it.mode, it.cls, it.eq, it.nom, it.err, it.ver, it.pend > 0]);
    if (sig === tbLast.s && Date.now() - tbLast.t < 180000) return;
    tbLast = { s: sig, t: Date.now() }; it.at = Date.now(); stPutRaw(KTB, it);
  }
  setInterval(function () { try { beat(); } catch (e) {} }, 60000); setTimeout(function () { try { beat(); } catch (e) {} }, 8000);
  document.addEventListener("visibilitychange", function () { try { beat(); } catch (e) {} });
  var NAPP = { accueil: "Accueil", volley: "Volley-ball", badminton: "Badminton", danse: "Danse", relais: "Relais", escalade: "Escalade", acrosport: "Acrosport", orientation: "OrienRun", ccf: "CCF", crosstraining: "Cross-training", basket: "Basket-ball", step: "Step" };
  function ago(t) { var s = Math.round((Date.now() - t) / 1000); return s < 60 ? "à l'instant" : s < 3600 ? "il y a " + Math.round(s / 60) + " min" : s < 86400 ? "il y a " + Math.round(s / 3600) + " h" : new Date(t).toLocaleDateString("fr-FR"); }
  /* ⏳ tablettes qui avaient des données pas encore envoyées à leur dernier signe de vie, et silencieuses depuis plus de 10 min */
  function tabsWaiting() { var me = devInfo().id, V = stLd(KTB); return Object.keys(V.items).map(function (k) { return V.items[k]; }).filter(function (x) { return x && x.id !== me && x.pend > 0 && x.at && Date.now() - x.at > 10 * 60000 && Date.now() - x.at < 7 * 864e5; }).sort(function (a, b) { return b.at - a.at; }); }
  function tabName(x) { return x.nom || (NAPP[x.app] || x.app) + (x.cls ? " · " + x.cls : "") + (x.eq ? " · " + x.eq : ""); }
  var tbWarned = jget("eps.tabs.warned", {});
  setInterval(function () { try { if (!isTeacher() || document.hidden) return; var W = tabsWaiting().filter(function (x) { return tbWarned[x.id] !== x.at; }); if (!W.length) return;
    W.forEach(function (x) { tbWarned[x.id] = x.at; }); try { localStorage.setItem("eps.tabs.warned", JSON.stringify(tbWarned)); } catch (e) {}
    toastHub("⏳ " + W.map(tabName).join(", ") + " : des données (résultats, positionnements…) n'ont pas encore été envoyées. Allume la tablette avec le Wi-Fi et ouvre l'appli."); } catch (e) {} }, 5 * 60000);
  function tablets() {
    var V = stLd(KTB), me = devInfo().id, hide = jget("eps.tabs.hide", {}), L = Object.keys(V.items).map(function (k) { return V.items[k]; }).filter(function (x) { return x && x.at && !hide[x.id]; }).sort(function (a, b) { return b.at - a.at; });
    var vmax = Math.max.apply(null, [+VER || 0].concat(L.map(function (x) { return +x.ver || 0; })));
    var row = function (x) {
      var old = Date.now() - x.at > 5 * 60000, st = (x.pend > 0 ? '<b style="color:#B4232B">⏳ ' + x.pend + " donnée(s) pas encore envoyée(s)</b> · " : "") + (x.err ? "⚠ partage : " + esc(x.err) : x.ok ? "✓ synchronisée " + ago(x.ok) : "○ pas encore synchronisée");
      var maj = x.ver && +x.ver < vmax ? '<b style="color:#B4232B">⚠ ancienne version (v' + esc(x.ver) + ") : touche ⟳ sur cette tablette</b>" : x.ver ? "version à jour (v" + esc(x.ver) + ")" : "";
      return '<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #E6E1D6;' + (old ? "opacity:.6" : "") + '"><div style="font-size:26px">' + (x.mode === "enseignant" ? "🧑‍🏫" : x.mode === "coach" ? "🧢" : "📱") + '</div><div style="flex:1;text-align:left">' +
        "<b>" + esc(x.nom || (NAPP[x.app] || x.app) + (x.eq ? " · " + x.eq : "")) + "</b>" + (x.id === me ? ' <small style="color:#6B3FA0">(cette tablette)</small>' : "") +
        '<div class="m" style="margin:2px 0">' + esc((NAPP[x.app] || x.app) + " · " + x.mode + (x.cls ? " · " + x.cls : "") + (x.eq ? " · équipe " + x.eq : "")) + "</div>" +
        '<div class="m" style="margin:0">' + (old ? "⏸ plus de signe de vie depuis " + ago(x.at).replace("il y a ", "") : "🟢 active " + ago(x.at)) + " · " + st + (maj ? " · " + maj : "") + "</div></div>" +
        '<button class="epsd-b2" data-hide="' + esc(x.id) + '" title="Retirer de la liste">✕</button></div>';
    };
    var act = L.filter(function (x) { return Date.now() - x.at < 15 * 60000; }), anc = L.filter(function (x) { return Date.now() - x.at >= 15 * 60000; });
    var o = overlay('<h2 style="margin:0 0 4px">📱 Tablettes connectées</h2><p class="m">Chaque tablette se signale toutes les minutes quand elle est allumée (partage entre tablettes réglé). Une tablette « ancienne version » : touche ⟳ dessus.</p>' +
      '<div style="display:flex;gap:8px;align-items:center;margin:8px 0"><label class="m" style="margin:0">Nom de cette tablette</label><input data-nom value="' + esc(devInfo().nom || "") + '" placeholder="Ex. : Tablette 3" style="flex:1;min-height:40px;border:1.5px solid #E6E1D6;border-radius:10px;padding:0 10px;font:inherit"><button class="epsd-b2" data-sv>Enregistrer</button></div>' +
      (shCfg() ? "" : '<p style="background:#fff4dc;border-radius:10px;padding:8px">⚠ Partage entre tablettes non réglé sur cette tablette : rien ne peut s\'afficher.</p>') +
      "<h3 style=\"margin:10px 0 0\">Actives (" + act.length + ")</h3>" + (act.map(row).join("") || '<p class="m">Aucune tablette active depuis 15 min.</p>') +
      (anc.length ? '<details style="margin-top:8px"><summary style="cursor:pointer;font-weight:700">Plus anciennes (' + anc.length + ")</summary>" + anc.map(row).join("") + "</details>" : "") +
      '<div class="epsd-act"><button data-r>⟳ Actualiser</button><button data-x>Fermer</button></div>');
    o.querySelector("[data-sv]").onclick = function () { var d = devInfo(); d.nom = o.querySelector("[data-nom]").value.trim(); try { localStorage.setItem("eps.dev.v1", JSON.stringify(d)); } catch (e) {} tbLast.s = ""; beat(); o.remove(); tablets(); };
    o.querySelector("[data-r]").onclick = function () { var k = KTB; EPSD.syncOne(k).then(function () { o.remove(); tablets(); }); };
    o.querySelectorAll("[data-hide]").forEach(function (b) { b.onclick = function () { var h = jget("eps.tabs.hide", {}); h[b.dataset.hide] = 1; try { localStorage.setItem("eps.tabs.hide", JSON.stringify(h)); } catch (e) {} o.remove(); tablets(); }; });
    var bx = o.querySelector(".epsd-box"); if (bx) { bx.style.maxWidth = "720px"; bx.style.width = "96vw"; }
    return o;
  }
  function sigPresets() { try { if (window.EPSP) return EPSP.p({ id: "signaux", sec: "Signal général", label: "Messages prêts à envoyer à toutes les tablettes", type: "list", def: ["📣 Rassemblement auprès de l'enseignant", "⏱ Rotation dans 1 minute", "🔄 Rotation : changez de terrain", "🤫 Silence : écoutez la consigne", "💧 Pause eau", "🧰 Rangement du matériel", "🏁 Fin de la leçon"] }); } catch (e) {} return ["📣 Rassemblement auprès de l'enseignant", "⏱ Rotation dans 1 minute", "🧰 Rangement du matériel"]; }
  function sigSend(txt, min, tout) {
    var d = devInfo(), it = { id: "cur", txt: String(txt || "").trim(), at: Date.now(), until: Date.now() + (min || 2) * 60000, from: d.id, app: tout ? "*" : appDir() };
    if (!it.txt) return; stPutRaw(KSG, it); EPSD.syncOne(KSG);
  }
  function signal() {
    var P = sigPresets(), cur = stLd(KSG).items.cur, on = cur && cur.until > Date.now();
    var o = overlay('<h2 style="margin:0 0 4px">📣 Signal à toutes les tablettes</h2><p class="m">Le message s\'affiche en plein écran, avec un son, sur les tablettes ' + (NAPP[appDir()] ? "de " + esc(NAPP[appDir()]) : "") + " (8 à 20 s selon la connexion).</p>" +
      (on ? '<p style="background:#fff4dc;border-radius:10px;padding:8px">En cours : <b>' + esc(cur.txt) + '</b> <button class="epsd-b2" data-stop>■ Arrêter</button></p>' : "") +
      '<div style="display:grid;gap:8px;margin:10px 0">' + P.map(function (t, i) { return '<button class="epsd-b2" style="min-height:52px;font-size:17px;text-align:left;padding:0 14px" data-p="' + i + '">' + esc(t) + "</button>"; }).join("") + "</div>" +
      '<div style="display:flex;gap:8px"><input data-t placeholder="Autre message…" style="flex:1;min-height:44px;border:1.5px solid #E6E1D6;border-radius:10px;padding:0 10px;font:inherit"><button class="epsd-b2" data-s>Envoyer</button></div>' +
      '<label class="m" style="display:flex;gap:6px;align-items:center;margin-top:8px"><input type="checkbox" data-all> sur toutes les applis (pas seulement celle-ci)</label>' +
      '<p class="m">Les messages prêts se modifient dans ⚙ Réglages › Paramètres (Signal général).</p><div class="epsd-act"><button data-x>Fermer</button></div>');
    var go = function (t) { sigSend(t, 2, o.querySelector("[data-all]").checked); o.remove(); try { (window.toast || function (m) { alert(m); })("Signal envoyé : " + t); } catch (e) {} };
    o.querySelectorAll("[data-p]").forEach(function (b) { b.onclick = function () { go(P[+b.dataset.p]); }; });
    o.querySelector("[data-s]").onclick = function () { var t = o.querySelector("[data-t]").value.trim(); if (t) go(t); };
    var st = o.querySelector("[data-stop]"); if (st) st.onclick = function () { var c = stLd(KSG).items.cur; if (c) { c.until = Date.now(); stPutRaw(KSG, c); EPSD.syncOne(KSG); } o.remove(); };
    return o;
  }
  function bip() { try { var A = window.AudioContext || window.webkitAudioContext, a = new A(); [0, .28, .56].forEach(function (t) { var g = a.createGain(), os = a.createOscillator(); os.frequency.value = 880; os.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.0001, a.currentTime + t); g.gain.exponentialRampToValueAtTime(.4, a.currentTime + t + .02); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + t + .22); os.start(a.currentTime + t); os.stop(a.currentTime + t + .24); }); } catch (e) {} }
  function sigCheck() {
    var c = stLd(KSG).items.cur, seen = +(localStorage.getItem("eps.sig.seen") || 0), el = document.getElementById("eps-sig");
    var show = c && c.at > seen && c.until > Date.now() && c.from !== devInfo().id && (c.app === "*" || c.app === appDir());
    if (!show) { if (el && (!c || c.until <= Date.now() || c.at <= seen)) el.remove(); return; }
    if (el && +el.dataset.at === c.at) return; if (el) el.remove();
    el = document.createElement("div"); el.id = "eps-sig"; el.dataset.at = c.at;
    el.style.cssText = "position:fixed;inset:0;z-index:2147483600;background:#14171C;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;padding:24px;text-align:center;font-family:system-ui,sans-serif;box-shadow:inset 0 0 0 14px #F0A030";
    el.innerHTML = '<div style="font-size:clamp(2rem,7vw,5rem);font-weight:900;line-height:1.15;max-width:1000px">' + esc(c.txt) + '</div><div style="color:#A9AEB8;font-size:18px">Message de ton enseignant · ' + new Date(c.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + '</div><button style="min-height:64px;padding:0 34px;border-radius:18px;border:0;background:#F0A030;color:#14171C;font:900 22px system-ui,sans-serif">✓ J\'ai compris</button>';
    el.querySelector("button").onclick = function () { try { localStorage.setItem("eps.sig.seen", String(c.at)); } catch (e) {} el.remove(); };
    document.body.appendChild(el); bip(); try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) {}
    setTimeout(function () { var x = document.getElementById("eps-sig"); if (x && +x.dataset.at === c.at) x.remove(); }, Math.max(5000, c.until - Date.now()));
  }
  setInterval(function () { if (shCfg() && document.visibilityState !== "hidden" && !window.EPS_SIM && !HUB) EPSD.syncOne(KSG).then(sigCheck, sigCheck); }, 8000);
  function sigBtn() {
    var b = document.getElementById("eps-sigb"), sl = epsSlot();
    if (!b) { if (!sl) return; b = document.createElement("button"); b.type = "button"; b.id = "eps-sigb"; b.className = "epsb"; b.title = "Signal général et tablettes"; b.setAttribute("aria-label", "Signal général et tablettes connectées"); b.innerHTML = "📣";
      b.onclick = function () { var o = overlay('<h2 style="margin:0 0 10px">Toutes les tablettes</h2><div style="display:grid;gap:10px"><button class="epsd-b2" style="min-height:56px;font-size:18px" data-a>📣 Envoyer un signal (rassemblement, rotation…)</button><button class="epsd-b2" style="min-height:56px;font-size:18px" data-b>📱 Tablettes connectées</button><button class="epsd-b2" style="min-height:56px;font-size:18px" data-c>📋 Planche tactique (envoyer un schéma)</button></div><div class="epsd-act"><button data-x>Fermer</button></div>');
        o.querySelector("[data-a]").onclick = function () { o.remove(); signal(); }; o.querySelector("[data-b]").onclick = function () { o.remove(); tablets(); }; o.querySelector("[data-c]").onclick = function () { o.remove(); var cc = null; try { cc = window.epsCurrentClass && window.epsCurrentClass(); } catch (e) {} EPSD.planche({ cls: cc && cc.nom }); }; };
      var f = document.getElementById("eps-ovw"); sl.insertBefore(b, f && f.parentNode === sl ? f : sl.firstChild); }
    b.style.display = isTeacher() && !HUB ? "" : "none";
  }
  setInterval(function () { try { sigBtn(); } catch (e) {} }, 3000);

  /* 📋 Planche tactique (eps-tactique.js, page tactique/) : mes planches « eps.plan.v1 » (pl|), {id, nom, d:{sport, items}} ;
     planche envoyée aux tablettes : élément « plan » du magasin des signaux (sg|plan, relevé toutes les 8 s avec le signal, aucun trafic en plus) :
     {nom, d, to:'*' | [id de tablette…], at, until, from}. Les élèves la voient en plein écran (lecture seule). */
  var KPL = "eps.plan.v1";
  STORES.push({ pre: "pl|", key: KPL });
  function tacLoad(cb) { if (window.EPSTAC) { cb(); return; } var s = document.getElementById("eps-tac-js"); if (!s) { s = document.createElement("script"); s.id = "eps-tac-js"; s.src = BASE + "eps-tactique.js"; document.head.appendChild(s); } s.addEventListener("load", function () { cb(); }); }
  function planCheck() {
    var c = stLd(KSG).items.plan, seen = +(localStorage.getItem("eps.plan.seen") || 0), el = document.getElementById("eps-plan"), me = devInfo().id;
    if (c && c.live) seen = (localStorage.getItem("eps.plan.seenrv") === c.at + ":" + (c.rv || 0)) ? c.at : 0;
    var show = c && c.d && c.at > seen && c.until > Date.now() && c.from !== me && !isTeacher() && (c.to === "*" || (Array.isArray(c.to) && c.to.indexOf(me) >= 0));
    if (!show) { if (el) el.remove(); planFast(!!(c && c.live && c.until > Date.now() && c.from !== me && !isTeacher())); return; }
    planFast(!!c.live);
    if (el && +el.dataset.at === c.at) { if (c.live && +el.dataset.rv !== (c.rv || 0)) { el.dataset.rv = c.rv || 0; planDraw(el, c); } return; } if (el) el.remove();
    el = document.createElement("div"); el.id = "eps-plan"; el.dataset.at = c.at; el.dataset.rv = c.rv || 0;
    el.style.cssText = "position:fixed;inset:0;z-index:2147483590;background:#fff;color:#14171C;display:flex;flex-direction:column;font-family:system-ui,sans-serif;box-shadow:inset 0 0 0 8px #F0A030";
    el.innerHTML = '<div style="display:flex;align-items:center;gap:12px;padding:14px 18px 6px"><b style="font-size:clamp(18px,3vw,28px);flex:1">' + (c.live ? "🔴 En direct · " : "📋 ") + esc(c.nom || "Planche de ton enseignant") + '</b><button type="button" style="min-height:52px;padding:0 24px;border-radius:14px;border:0;background:#F0A030;color:#14171C;font:900 18px system-ui,sans-serif">✓ Vu</button></div><div data-pl style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 14px 14px"></div>';
    el.querySelector("button").onclick = function () { var x = stLd(KSG).items.plan || c; try { if (x.live) localStorage.setItem("eps.plan.seenrv", x.at + ":" + (x.rv || 0)); else localStorage.setItem("eps.plan.seen", String(c.at)); } catch (e) {} el.remove(); };
    document.body.appendChild(el); bip();
    planDraw(el, c);
  }
  function planDraw(el, c) { tacLoad(function () { var bx = el.querySelector("[data-pl]"); if (!bx || !window.EPSTAC) return; var w = bx.firstChild || bx.appendChild(document.createElement("div")); w.style.cssText = "width:100%;max-width:" + Math.round((window.innerHeight - 110) * 1.9) + "px"; w.innerHTML = EPSTAC.svg(c.d, { maxh: (window.innerHeight - 100) + "px" }); }); }
  /* planche en direct : la tablette élève relève le signal toutes les 3 s tant que la planche est en cours */
  var planFastT = 0;
  function planFast(on) { if (on && !planFastT) planFastT = setInterval(function () { if (!document.hidden && shCfg()) try { EPSD.syncOne(KSG); } catch (e) {} }, 3000); else if (!on && planFastT) { clearInterval(planFastT); planFastT = 0; } }
  STORES.forEach(function (st) { if (st.key === KSG) { var f0 = st.onChange; st.onChange = function () { try { f0 && f0(); } catch (e) {} try { planCheck(); } catch (e) {} }; } });
  setInterval(function () { try { planCheck(); } catch (e) {} }, 4000);
  EPSD.plan = {
    list: function () { var V = stLd(KPL); return Object.keys(V.items).map(function (k) { return V.items[k]; }).filter(function (x) { return x && x.d && !x.del; }).sort(function (a, b) { return (b.u || 0) - (a.u || 0); }); },
    save: function (b) { var id = b.id || "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); stPutRaw(KPL, { id: id, nom: String(b.nom || "Planche").slice(0, 60), d: b.d }); try { EPSD.syncSoon(); } catch (e) {} return id; },
    del: function (id) { stPutRaw(KPL, { id: id, del: 1 }); try { EPSD.syncSoon(); } catch (e) {} },
    send: function (b, to, min, live) { stPutRaw(KSG, { id: "plan", nom: String(b.nom || "").slice(0, 60), d: b.d, to: to === "*" ? "*" : (to || []).slice(0, 40), at: Date.now(), until: Date.now() + (min || 10) * 60000, from: devInfo().id, live: live ? 1 : 0, rv: 0 }); return EPSD.syncOne(KSG); },
    /* en direct : le dessin en cours remplace celui des tablettes (mêmes destinataires, même durée) */
    live: function (b) { var c = stLd(KSG).items.plan; if (!c || !c.live || c.until <= Date.now() || c.from !== devInfo().id) return Promise.resolve(false); c.d = b.d; c.nom = String(b.nom || "").slice(0, 60); c.rv = (c.rv || 0) + 1; stPutRaw(KSG, c); return EPSD.syncOne(KSG); },
    stop: function () { var c = stLd(KSG).items.plan; if (c) { c.until = Date.now(); stPutRaw(KSG, c); return EPSD.syncOne(KSG); } return Promise.resolve(false); },
    cur: function () { var c = stLd(KSG).items.plan; return c && c.d && c.until > Date.now() ? c : null; },
    ready: function () { return !!shCfg(); },
    tabs: function () { var V = stLd(KTB), me = devInfo().id; return Object.keys(V.items).map(function (k) { return V.items[k]; }).filter(function (x) { return x && x.at && x.id !== me && x.mode !== "enseignant" && Date.now() - x.at < 20 * 60000; }).sort(function (a, b) { return tabName(a).localeCompare(tabName(b), "fr", { numeric: true }); }).map(function (x) { return { id: x.id, nom: [x.nom, x.eq, x.cls, NAPP[x.app] || x.app].filter(Boolean).join(" · "), cls: x.cls || "", eq: x.eq || "", at: x.at }; }); }
  };
  /* ✋ Appeler l'enseignant (27/11/2026) : bouton « ✋ Enseignant » dans le bandeau des tablettes élèves des applis d'activité
     (jamais flottant). Un appui : « Où es-tu ? » (zones du 🗺 plan de terrain, facultatif) puis le motif (liste réglable appel_motifs).
     L'appel est un élément du magasin des signaux (sg|call|<id tablette>, relevé toutes les 8 s avec le signal : aucun autre relevé) :
     {k:"call", app, cls, who[], eq, tab, lieu, motif, at, st: 0 envoyé · 1 « J'y vais » · 2 terminé, from}. Un seul appel par tablette.
     Côté enseignant : pastille « ✋ N » dans le bandeau (son réglable), file d'attente dans 🧭 Pilotage de leçon (eps-lecons.js). */
  var CALL_APPS = ["escalade", "relais", "volley", "badminton", "danse", "acrosport", "orientation", "crosstraining", "basket", "step"];
  function callP(id, label, type, def) { try { if (window.EPSP) return EPSP.p({ id: id, sec: "Pilotage de leçon", label: label, type: type, def: def }); } catch (e) {} return def; }
  function callMotifs() { var d = ["🆘 Je suis bloqué", "🛡 Vérification sécurité", "✅ J'ai terminé", "🧰 Problème de matériel", "❓ J'ai une question"], v = callP("appel_motifs", "✋ Appeler l'enseignant : motifs proposés aux élèves (une icône puis l'intitulé)", "list", d);
    v = (Array.isArray(v) ? v : d).map(function (x) { return String(x).trim(); }).filter(Boolean); return v.length ? v : d; }
  function callMin() { var v = +callP("appel_duree", "✋ Un appel sans réponse s'efface après (minutes)", "number", 20); return isFinite(v) && v > 0 ? v : 20; }
  function callSon() { var v = +callP("appel_son", "✋ Son et vibration à l'arrivée d'un appel (1 = oui, 0 = non)", "number", 1); return v !== 0; }
  function callOn() { var v = +callP("appel_actif", "✋ Bouton « Enseignant » sur les tablettes élèves (1 = affiché, 0 = masqué)", "number", 1); return v !== 0; }
  function callAll() { var V = stLd(KSG), lim = Date.now() - callMin() * 60000; return Object.keys(V.items).map(function (k) { return V.items[k]; }).filter(function (c) { return c && c.k === "call" && !c.del && (c.st || 0) < 2 && c.at > lim; }).sort(function (a, b) { return a.at - b.at; }); }
  function callMine() { return callAll().filter(function (c) { return c.id === "call|" + devInfo().id; })[0] || null; }
  function callSet(id, st) { var c = stLd(KSG).items[id]; if (!c || c.k !== "call") return Promise.resolve(false); c.st = st; if (st === 1) c.tk = Date.now(); stPutRaw(KSG, c); return EPSD.syncOne(KSG); }
  function callWho() { var o = {}, cc = null, n = []; try { if (typeof window.epsTabInfo === "function") o = window.epsTabInfo() || {}; } catch (e) {} try { cc = window.epsCurrentClass && window.epsCurrentClass(); } catch (e) {}
    try { var w = JSON.parse(sessionStorage.getItem("eps.lcwho." + appDir()) || "null"); if (w && Array.isArray(w.n)) n = w.n.slice(0, 6); } catch (e) {}
    if (!n.length && Array.isArray(o.who)) n = o.who.map(function (x) { return String(x); }).filter(Boolean).slice(0, 6);
    var R = []; try { R = ((cc && cc.eleves) || []).map(function (x) { return String(typeof x === "string" ? x : (x && (x.full || ((x.prenom || "") + " " + (x.nom || "")))) || "").trim(); }).filter(Boolean); } catch (e) {}
    var cl = o.cls || (cc && cc.nom) || "";
    /* à défaut, la classe choisie aujourd'hui sur l'écran « Choisis ta classe » de cette tablette */
    if (!cl) try { var gl = JSON.parse(localStorage.getItem("eps.gate.last." + appDir()) || "null"); if (gl && gl.day === today() && gl.nom) cl = String(gl.nom); } catch (e) {}
    if (!R.length && cl && window.EPSL) try { EPSL.items().forEach(function (it) { if (EPSL.norm(it.nom) === EPSL.norm(cl)) R = EPSL.people(it).map(function (x) { return x.full; }); }); } catch (e) {}
    return { cls: cl, eq: String(o.eq || ""), who: n, liste: R, lieu: String(o.lieu || "") }; }
  function callZones() { try { var o = stLd("eps.terrain.v1").items["lay|" + appDir()]; if (o && !o.del && Array.isArray(o.zones)) return o.zones.map(function (z) { return String(z.nom || "").trim(); }).filter(Boolean).slice(0, 16); } catch (e) {} return []; }
  function callAsk() {
    var mine = callMine(), M = callMotifs(), Z = callZones(), W = callWho(), lieu = (mine && mine.lieu) || W.lieu || "", QUI = [], ask = !W.who.length && !W.eq && W.liste.length > 0 && W.liste.length <= 45;
    var o = overlay('<h2 style="margin:0 0 6px">✋ Appeler l\'enseignant</h2>' +
      (mine ? '<p style="background:' + (mine.st === 1 ? "#E3F4E8" : "#fff4dc") + ';border-radius:10px;padding:10px;font-weight:700;margin:0 0 10px">' + (mine.st === 1 ? "👍 Ton enseignant arrive." : "⏳ Appel envoyé : " + esc(mine.motif) + ". Ton enseignant le voit sur sa tablette.") + '</p><div class="epsd-act"><button data-stop>✕ Annuler mon appel</button><button data-x>✕ Fermer</button></div>' :
      (ask ? '<p class="m" style="margin:0 0 4px">Qui appelle ?</p><div style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px;max-height:150px;overflow:auto">' + W.liste.map(function (n, i) { return '<button type="button" class="epsd-b2" data-qi="' + i + '" aria-pressed="false" style="min-height:40px">' + esc(n) + "</button>"; }).join("") + "</div>" : "") +
      (Z.length && !W.lieu ? '<p class="m" style="margin:0 0 4px">Où es-tu ?</p><div data-z style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px">' + Z.map(function (z, i) { return '<button type="button" class="epsd-b2" data-zi="' + i + '" aria-pressed="false" style="min-height:44px">' + esc(z) + "</button>"; }).join("") + "</div>" : "") +
      '<p class="m" style="margin:0 0 4px">Pourquoi ?</p><div style="display:grid;gap:8px">' + M.map(function (t, i) { return '<button type="button" class="epsd-b2" data-mi="' + i + '" style="min-height:56px;font-size:18px;text-align:left;padding:0 14px">' + esc(t) + "</button>"; }).join("") + '</div><div class="epsd-act"><button data-x>✕ Fermer</button></div>'));
    var st = o.querySelector("[data-stop]"); if (st) st.onclick = function () { callSet(mine.id, 2); o.remove(); callDraw(); };
    Array.prototype.forEach.call(o.querySelectorAll("[data-zi]"), function (b) { b.onclick = function () { lieu = lieu === Z[+b.dataset.zi] ? "" : Z[+b.dataset.zi]; Array.prototype.forEach.call(o.querySelectorAll("[data-zi]"), function (x) { var on = Z[+x.dataset.zi] === lieu; x.setAttribute("aria-pressed", on ? "true" : "false"); x.style.background = on ? "#14171C" : ""; x.style.color = on ? "#fff" : ""; }); }; });
    Array.prototype.forEach.call(o.querySelectorAll("[data-qi]"), function (b) { b.onclick = function () { var n = W.liste[+b.dataset.qi], i = QUI.indexOf(n); if (i >= 0) QUI.splice(i, 1); else if (QUI.length < 6) QUI.push(n); var on = QUI.indexOf(n) >= 0; b.setAttribute("aria-pressed", on ? "true" : "false"); b.style.background = on ? "#14171C" : ""; b.style.color = on ? "#fff" : ""; }; });
    Array.prototype.forEach.call(o.querySelectorAll("[data-mi]"), function (b) { b.onclick = function () { o.remove();
      if (window.EPS_VUE_ELEVE) { toastHub("Aperçu : en vue élève, aucun appel n'est envoyé."); return; }
      var w = callWho(), d = devInfo(); if (!w.who.length && QUI.length) w.who = QUI.slice(); stPutRaw(KSG, { id: "call|" + d.id, k: "call", app: appDir(), cls: w.cls, who: w.who, eq: w.eq, tab: d.nom || "", lieu: lieu, motif: M[+b.dataset.mi], at: Date.now(), st: 0, from: d.id });
      try { EPSD.syncOne(KSG); } catch (e) {} toastHub(shCfg() ? "✋ Appel envoyé à ton enseignant." : "✋ Appel noté. Sans partage entre tablettes, lève aussi la main."); callDraw(); }; });
    return o;
  }
  var callSeen = +(sessionStorage.getItem("eps.call.seen") || 0) || Date.now() - 60000, callAck = 0;
  function callT() { if (window.EPS_VUE_ELEVE) return false; if (isTeacher()) return true; var H = document.documentElement.classList; return H.contains("eps-teach") || H.contains("epst-on"); }
  function callDraw() {
    var T = callT(), okApp = CALL_APPS.indexOf(appDir()) >= 0, b = document.getElementById("eps-callb"), sl = callHost() || (b && b.parentNode);
    if (!b) { if (!sl) return; b = document.createElement("button"); b.type = "button"; b.id = "eps-callb"; b.className = "epsb"; b.setAttribute("data-eps-a11y-h", "0"); }
    if (sl && b.parentNode !== sl) { var slot = sl.hasAttribute("data-eps-bar");
      /* hors de la barre commune (écran plein écran d'une appli) : le bouton porte lui-même son style, à la fin du bandeau de cet écran */
      b.style.cssText = slot ? "" : "flex:none;height:40px;min-width:40px;padding:0 12px;margin:0 6px;border-radius:10px;border:1.5px solid #3A3F47;background:transparent;color:#14171C;font:700 14px system-ui,sans-serif;white-space:nowrap";
      b.dataset.out = slot ? "" : callSombre(sl) ? "d" : "c"; if (slot) sl.insertBefore(b, sl.firstChild); else sl.insertBefore(b, sl.lastElementChild && sl.children.length > 1 ? sl.lastElementChild : null); }
    var D0 = b.dataset.out === "c" ? "#fff" : b.dataset.out ? "transparent" : "", D1 = b.dataset.out === "c" ? "#14171C" : b.dataset.out ? "#D5D8DE" : "", D2 = b.dataset.out ? "#3A3F47" : "";
    if (T) { var L = callAll().filter(function (c) { return c.from !== devInfo().id && (HUB || c.app === appDir()); }), n0 = L.filter(function (c) { return !c.st; }).length;
      b.style.display = L.length && (HUB || okApp) ? "" : "none"; b.textContent = "✋ " + L.length; b.title = "Appels des élèves"; b.setAttribute("aria-label", L.length + " appel" + (L.length > 1 ? "s" : "") + " d'élèves");
      b.style.background = n0 ? "#B4232B" : "#1E8449"; b.style.color = "#fff"; b.style.borderColor = "transparent"; b.style.fontWeight = "800";
      b.onclick = function () { if (window.EPSLC && EPSLC.controle) EPSLC.controle({ cls: (L[0] && L[0].cls) || undefined }); else if (window.epsCtlOwn && window.epsCtlOwn.open) window.epsCtlOwn.open((L[0] && L[0].cls) || ""); else callListe(); };
      var nv = L.filter(function (c) { return !c.st && c.at > callSeen; });
      if (nv.length) { callSeen = Math.max.apply(null, nv.map(function (c) { return c.at; })); try { sessionStorage.setItem("eps.call.seen", String(callSeen)); } catch (e) {}
        if (callSon()) { bip(); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} }
        toastHub("✋ " + nv.map(function (c) { return callNom(c) + " : " + c.motif; }).join(" · ")); }
      return; }
    var mine = callMine(); b.style.display = okApp && !HUB && callOn() ? "" : "none";
    b.textContent = mine ? (mine.st === 1 ? "👍 Il arrive" : "⏳ Appel envoyé") : "✋ Enseignant"; b.title = "Appeler l'enseignant"; b.setAttribute("aria-label", "Appeler l'enseignant");
    b.style.background = mine ? (mine.st === 1 ? "#1E8449" : "#F0A030") : D0; b.style.color = mine ? (mine.st === 1 ? "#fff" : "#14171C") : D1; b.style.borderColor = mine ? "transparent" : D2; b.style.fontWeight = mine ? "800" : "";
    b.onclick = callAsk;
    if (mine && mine.st === 1 && callAck !== mine.at) { callAck = mine.at; bip(); toastHub("👍 Ton enseignant arrive."); }
  }
  /* où poser le bouton : la barre commune si elle est vraiment à l'écran ; si un écran plein écran de l'appli la recouvre
     (tablette du coach de Volley, groupes de Badminton, Acrosport, fiche de leçon), le bandeau du haut de cet écran. */
  function callHost() { var sl = epsSlot();
    if (sl) { var r = sl.getBoundingClientRect(), t = r.width ? document.elementFromPoint(Math.min(innerWidth - 2, Math.max(1, r.left + r.width / 2)), Math.min(innerHeight - 2, Math.max(1, r.top + r.height / 2))) : null; if (!r.width && sl.getClientRects().length) return sl; if (t && (sl.contains(t) || (sl.parentNode && sl.parentNode.contains(t)))) return sl; }
    var e = document.elementFromPoint(Math.max(1, innerWidth - 24), 26); if (e && e.id === "eps-callb") e = e.parentNode;
    while (e && e !== document.body && e.nodeType === 1) { if (e.closest && e.closest(".epsd-ov,#eps-sig,#eps-plan,#lc-ico,#lc-det")) return null; var q = e.getBoundingClientRect(); if (q.top <= 6 && q.top >= -2 && q.width >= innerWidth * .8 && q.height <= 130 && q.height >= 36 && /flex/.test(getComputedStyle(e).display)) return e; e = e.parentNode; }
    return null; }
  function callSombre(e) { while (e && e.nodeType === 1) { var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(getComputedStyle(e).backgroundColor || ""); if (m && (m[4] == null || +m[4] > .5)) return (+m[1] * .299 + +m[2] * .587 + +m[3] * .114) < 120; e = e.parentNode; } return false; }
  function callNom(c) { return ((c.who && c.who.length ? c.who.join(", ") : c.eq || c.tab || (c.cls ? "Une tablette · " + c.cls : "Une tablette")) + (c.lieu ? " · " + c.lieu : "")); }
  function callListe() { var L = callAll(); var o = overlay('<h2 style="margin:0 0 8px">✋ Appels des élèves</h2>' + (L.map(function (c) { return '<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid #E6E1D6"><div style="flex:1;text-align:left"><b>' + esc(callNom(c)) + '</b><div class="m" style="margin:0">' + esc((NAPP[c.app] || c.app) + (c.cls ? " · " + c.cls : "") + " · " + c.motif + " · " + ago(c.at)) + '</div></div><button class="epsd-b2" data-go="' + esc(c.id) + '">' + (c.st ? "✓ Fait" : "J'y vais") + "</button></div>"; }).join("") || '<p class="m">Aucun appel.</p>') + '<div class="epsd-act"><button data-x>✕ Fermer</button></div>');
    Array.prototype.forEach.call(o.querySelectorAll("[data-go]"), function (b) { b.onclick = function () { var c = stLd(KSG).items[b.dataset.go]; callSet(b.dataset.go, c && c.st ? 2 : 1); o.remove(); callDraw(); if (callAll().length) callListe(); }; }); return o; }
  STORES.forEach(function (st) { if (st.key === KSG) { var f1 = st.onChange; st.onChange = function () { try { f1 && f1(); } catch (e) {} try { callDraw(); } catch (e) {} try { window.dispatchEvent(new CustomEvent("eps-appels")); } catch (e) {} }; } });
  setInterval(function () { try { callDraw(); } catch (e) {} }, 1500); setTimeout(function () { try { callDraw(); } catch (e) {} }, 1200);
  /* les appels en cours, prêts à poser en tête de l'écran de suivi propre à une appli (Escalade, Step) : EPSD.appels.html(dossier).
     Rien quand il n'y a pas d'appel. Les boutons [data-eps-call] sont gérés ici, pour toute la page. */
  function callHtml(app) { var L = callAll().filter(function (c) { return !app || c.app === app; }), now = Date.now(); if (!L.length) return "";
    return '<div data-eps-appels style="display:grid;gap:6px;margin:0 0 10px">' + L.map(function (c) { var mn = Math.max(0, Math.round((now - c.at) / 6e4));
      return '<div style="display:flex;gap:10px;align-items:center;background:#fff;border:2px solid ' + (c.st ? "#1E8449" : "#B4232B") + ';border-radius:12px;padding:8px 10px"><div style="flex:1;min-width:0;text-align:left"><b>✋ ' + esc(callNom(c)) + '</b><div style="font-size:13px;color:#5b6a72">' + esc(c.motif) + " · " + (mn ? mn + " min" : "à l'instant") + (c.st ? " · pris en charge" : "") + '</div></div><button type="button" data-eps-call="' + esc(c.id) + '" data-st="' + (c.st ? 2 : 1) + '" style="min-height:44px;padding:0 16px;border-radius:10px;border:0;font:800 15px system-ui,sans-serif;color:#fff;background:' + (c.st ? "#1E8449" : "#B4232B") + '">' + (c.st ? "✓ Fait" : "J'y vais") + "</button></div>"; }).join("") + "</div>"; }
  document.addEventListener("click", function (e) { var b = e.target && e.target.closest ? e.target.closest("[data-eps-call]") : null; if (!b || !callT()) return; callSet(b.getAttribute("data-eps-call"), b.getAttribute("data-st") === "2" ? 2 : 1); callDraw();
    var bx = b.closest("[data-eps-appels]"); if (bx) bx.outerHTML = callHtml(bx.getAttribute("data-app") || appDir()); try { window.dispatchEvent(new CustomEvent("eps-appels")); } catch (x) {} });
  /* 🏟 Plan des terrains d'un écran de suivi (Volley 3 terrains, Badminton 5, Basket 2 ; demande de l'enseignant, 27/11/2026) :
     EPSD.courts({cfg:1 (bouton « 🏟 Terrains » : fermer / rouvrir), redraw:"nomDeFonctionGlobale", dispo:"ligne"|"vert"|"bad5"|"duo", color, click:"nomDeFonctionGlobale", app, cts:[{n, a, b, sc, sub, etat:"jeu"|"attente"|"libre", al, obs:["nom"…]}]})
     → HTML. bad5 = 2 terrains de chaque côté en parallèle, 1 au centre à la verticale ; 👁 observateurs (obs) : sur le côté des terrains 1, 2, 4, 5,
     sous le terrain 3 (demande de l'enseignant), sous le terrain dans les autres dispositions. Un terrain d'où part un ✋ appel (lieu « Terrain n ») le montre ;
     al = à regarder (le terrain clignote). L'appli fournit seulement ses données ; aucun autre écran, aucune autre ligne. */
  function courtsCss() { if (document.getElementById("eps-ct-css")) return; var st = document.createElement("style"); st.id = "eps-ct-css";
    st.textContent = ".epsct{display:grid;gap:10px;margin:0 0 12px}.epsct.ligne{grid-template-columns:repeat(auto-fit,minmax(200px,1fr));align-items:start}.epsct.duo{grid-template-columns:repeat(2,minmax(0,1fr))}" +
      /* chaque terrain est dans une enveloppe .epsct-w : le terrain + ses 👁 observateurs (.epsct-o), dessous par défaut */
      ".epsct-w{display:flex;flex-direction:column;gap:6px;min-width:0}.epsct-w>.epsct-t{flex:1}.epsct-o{display:flex;flex-wrap:wrap;gap:4px;align-items:center;justify-content:center;font:700 12.5px system-ui,sans-serif;color:#14171C}.epsct-o i{font-style:normal}.epsct-o span{background:#fff;border:1.5px solid #E6E1D6;border-radius:999px;padding:2px 8px;white-space:nowrap}" +
      /* badminton : 5 terrains de même taille, 1-2 à gauche, 3 au centre à la verticale, 4-5 à droite ; observateurs sur le côté extérieur des terrains 1, 2, 4, 5 et sous le terrain 3 */
      ".epsct.bad5{--h:clamp(84px,13vw,140px);grid-template-columns:auto auto auto;grid-template-rows:auto auto;justify-content:center;align-items:center}.epsct.bad5 .epsct-t{flex:none;min-height:0;box-sizing:border-box;width:calc(2*var(--h) + 10px);height:var(--h)}" +
      ".epsct.bad5>:nth-child(1){grid-column:1;grid-row:1}.epsct.bad5>:nth-child(2){grid-column:1;grid-row:2}.epsct.bad5>:nth-child(3){grid-column:2;grid-row:1/span 2}.epsct.bad5>:nth-child(4){grid-column:3;grid-row:1}.epsct.bad5>:nth-child(5){grid-column:3;grid-row:2}" +
      ".epsct.bad5>:nth-child(1),.epsct.bad5>:nth-child(2){flex-direction:row-reverse;justify-content:flex-start}.epsct.bad5>:nth-child(4),.epsct.bad5>:nth-child(5){flex-direction:row;justify-content:flex-start}" +
      ".epsct.bad5>:nth-child(1) .epsct-o,.epsct.bad5>:nth-child(2) .epsct-o,.epsct.bad5>:nth-child(4) .epsct-o,.epsct.bad5>:nth-child(5) .epsct-o{flex-direction:column;flex-wrap:nowrap;max-width:96px}.epsct.bad5 .epsct-o span{max-width:92px;overflow:hidden;text-overflow:ellipsis}" +
      ".epsct.bad5>:nth-child(3) .epsct-t{width:var(--h);height:calc(2*var(--h) + 10px)}.epsct.bad5>:nth-child(3) .epsct-o{max-width:calc(var(--h) + 40px)}.epsct.bad5>:nth-child(3){align-items:center}" +
      ".epsct.bad5>:nth-child(3) .epsct-m{grid-template-columns:minmax(0,1fr);grid-template-rows:1fr auto 1fr;justify-items:center}.epsct.bad5>:nth-child(3) .epsct-t:before{top:50%;bottom:auto;left:8px;right:8px;border-left:0;border-top:2px dashed var(--ct,#14171C)}.epsct.bad5>:nth-child(3) .epsct-h{flex-wrap:wrap;justify-content:center}.epsct.bad5>:nth-child(3) .epsct-h span{margin-left:0}" +
      ".epsct.duo>.epsct-w{flex-direction:row}.epsct.duo>.epsct-w:first-child{flex-direction:row-reverse}.epsct.duo .epsct-o{flex-direction:column;flex-wrap:nowrap;max-width:110px}.epsct.duo .epsct-o span{max-width:104px;overflow:hidden;text-overflow:ellipsis}" +
      /* vert : terrains à la verticale (Volley), répartis sur toute la largeur : chacun au-dessus de sa colonne de détail ; filet à l'horizontale, observateurs dessous */
      ".epsct.vert{--w:clamp(100px,19vw,210px);grid-template-columns:repeat(var(--n,3),minmax(0,1fr));justify-items:center;align-items:start;gap:14px}.epsct.vert .epsct-t{flex:none;min-height:0;box-sizing:border-box;width:var(--w);height:calc(var(--w)*1.55);padding:10px}.epsct.vert .epsct-w{align-items:center;width:100%}.epsct.vert .epsct-o{max-width:100%}" +
      ".epsct.vert .epsct-m{grid-template-columns:minmax(0,1fr);grid-template-rows:1fr auto 1fr;justify-items:center}.epsct.vert .epsct-t:before{top:calc(50% + 14px);bottom:auto;left:8px;right:8px;border-left:0;border-top:2px dashed var(--ct,#14171C)}.epsct.vert .epsct-h{flex-direction:column;gap:2px}.epsct.vert .epsct-h span{margin-left:0}" +
      ".epsct.vert .epsct-m b{font-size:17px}.epsct.vert .epsct-m i{font-size:30px}" +
      /* terrain fermé par l'enseignant : toujours dessiné à sa place, grisé, sans équipe */
      ".epsct-t.ferme{background:repeating-linear-gradient(135deg,#EFECE6 0 10px,#F7F5F0 10px 20px);border-color:#C9C3B6;border-style:solid;color:#6A6F78;cursor:default}.epsct-t.ferme:before{display:none}.epsct-t.ferme .epsct-h span{background:#14171C;color:#fff}" +
      ".epsct-cfg{display:flex;justify-content:flex-end;margin:0 0 6px}.epsct-cfg button{min-height:40px;padding:0 12px;border-radius:10px;border:1.5px solid #E6E1D6;background:#fff;color:#14171C;font:700 14px system-ui,sans-serif}" +
      "div.epsct-t{cursor:default}.epsct-t{position:relative;display:flex;flex-direction:column;gap:4px;min-height:132px;padding:8px 10px;border-radius:12px;border:3px solid var(--ct,#14171C);background:#fff;color:#14171C;font:inherit;text-align:center;cursor:pointer;overflow:hidden}" +
      ".epsct-t:before{content:'';position:absolute;top:34px;bottom:8px;left:50%;border-left:2px dashed var(--ct,#14171C);opacity:.25}.epsct-t.libre{background:#F5F3EE;border-style:dashed;color:#6A6F78}" +
      ".epsct-h{display:flex;align-items:center;gap:6px;font:800 14px system-ui,sans-serif;position:relative}.epsct-h span{margin-left:auto;font-weight:700;font-size:12px;border-radius:999px;padding:2px 8px;background:#EFECE6;color:#14171C}.epsct-t.jeu .epsct-h span{background:#E3F4E8;color:#1D6B3A}" +
      ".epsct-m{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:6px;flex:1;position:relative}.epsct-m b{font:800 15px system-ui,sans-serif;overflow-wrap:anywhere}.epsct-m i{font:900 24px system-ui,sans-serif;font-style:normal;background:#fff;padding:0 6px;border-radius:8px;white-space:nowrap}" +
      ".epsct-s{font-size:12.5px;color:#5b6a72;position:relative;background:#ffffffcc;border-radius:6px}.epsct-t.al{border-color:#B4232B;animation:epsctal 1.2s ease-in-out infinite}.epsct-t.call{border-color:#B4232B;background:#FDECEC}" +
      "@keyframes epsctal{50%{box-shadow:0 0 0 5px #B4232B40;border-color:#F3B4B4}}@media (prefers-reduced-motion:reduce){.epsct-t.al{animation:none;box-shadow:0 0 0 4px #B4232B40}}" +
      "@media (max-width:620px){.epsct.bad5,.epsct.duo{grid-template-columns:minmax(0,1fr);grid-template-rows:none}.epsct.duo>.epsct-w{flex-direction:column!important}.epsct.duo .epsct-o{flex-direction:row;flex-wrap:wrap;max-width:none}.epsct.bad5>*{grid-column:auto!important;grid-row:auto!important;flex-direction:column!important}.epsct.bad5 .epsct-t,.epsct.bad5>:nth-child(3) .epsct-t{width:auto;height:auto;min-height:132px}.epsct.bad5 .epsct-o{flex-direction:row!important;flex-wrap:wrap!important;max-width:none!important}" +
      ".epsct.bad5>:nth-child(3) .epsct-m{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);grid-template-rows:none}.epsct.bad5>:nth-child(3) .epsct-t:before{top:34px;bottom:8px;left:50%;right:auto;border-top:0;border-left:2px dashed var(--ct,#14171C)}}";
    document.head.appendChild(st); }
  /* 🚫 terrains fermés (demande de l'enseignant : pouvoir désactiver des terrains) : élément ct|<dossier> du magasin des signaux
     ({off:[numéros]}, relevé toutes les 8 s par toutes les tablettes, aucun autre relevé). EPSD.courtsOff(dossier) → numéros fermés ;
     EPSD.courtsCfg({app, n, color, redraw}) → petite fenêtre : un bouton par terrain. Les applis écartent ces terrains de leurs
     répartitions et de leurs choix ; le terrain reste dessiné à sa place, grisé. */
  function courtsOff(app) { try { var o = stLd(KSG).items["ct|" + (app || appDir())]; return o && !o.del && Array.isArray(o.off) ? o.off.map(Number).filter(function (n) { return n > 0; }) : []; } catch (e) { return []; } }
  function courtsCfg(o) { o = o || {}; var app = o.app || appDir(), n = Math.max(1, Math.min(20, +o.n || 3)), off = courtsOff(app);
    var ov = overlay('<h2 style="margin:0 0 4px">🏟 Terrains utilisés</h2><p class="m" style="margin:0 0 10px">Touche un terrain pour le fermer ou le rouvrir.</p><div data-g style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px"></div><div class="epsd-act"><button data-x>✕ Fermer</button></div>');
    function draw() { ov.querySelector("[data-g]").innerHTML = Array.apply(null, { length: n }).map(function (x, i) { var k = i + 1, f = off.indexOf(k) >= 0; return '<button type="button" data-k="' + k + '" aria-pressed="' + (!f) + '" style="min-height:64px;border-radius:12px;font:800 16px system-ui,sans-serif;border:2px solid ' + (f ? "#C9C3B6" : esc(o.color || "#14171C")) + ";background:" + (f ? "#EFECE6" : "#fff") + ";color:" + (f ? "#6A6F78" : "#14171C") + '">Terrain ' + k + '<br><small style="font-weight:700">' + (f ? "🚫 fermé" : "✓ utilisé") + "</small></button>"; }).join("");
      Array.prototype.forEach.call(ov.querySelectorAll("[data-k]"), function (b) { b.onclick = function () { var k = +b.dataset.k, i = off.indexOf(k); if (i >= 0) off.splice(i, 1); else { if (off.length >= n - 1) { toastHub("Garde au moins un terrain."); return; } off.push(k); }
        off.sort(function (a, c) { return a - c; }); stPutRaw(KSG, { id: "ct|" + app, off: off.slice() }); try { EPSD.syncOne(KSG); } catch (e) {} draw(); try { if (o.redraw && typeof window[o.redraw] === "function") window[o.redraw](); } catch (e) {} try { window.dispatchEvent(new CustomEvent("eps-terrains")); } catch (e) {} }; }); }
    draw(); return ov; }
  function courtsHtml(o) { courtsCss(); o = o || {}; var C = Array.isArray(o.cts) ? o.cts : [], OFF = o.app ? courtsOff(o.app) : [], dispo = o.dispo === "bad5" && C.length === 5 ? "bad5" : o.dispo === "duo" && C.length === 2 ? "duo" : o.dispo === "vert" ? "vert" : "ligne", LB = { jeu: "en jeu", attente: "en attente", libre: "libre" };
    var appels = {}; try { callAll().forEach(function (c) { var m = /^terrain\s*(\d+)$/i.exec(String(c.lieu || "").trim()); if (m && (!o.app || c.app === o.app)) appels[+m[1]] = c; }); } catch (e) {}
    var fn = /^[A-Za-z_$][\w$]*$/.test(o.click || "") ? o.click : "";
    var rd = /^[A-Za-z_$][\w$]*$/.test(o.redraw || "") ? o.redraw : "";
    return (o.cfg && o.app ? '<div class="epsct-cfg"><button type="button" data-eps-a11y-h="0" onclick="EPSD.courtsCfg({app:&quot;' + esc(o.app) + '&quot;,n:' + C.length + ',color:&quot;' + esc(o.color || "#14171C") + '&quot;,redraw:&quot;' + rd + '&quot;})">🏟 Terrains' + (OFF.length ? " · " + OFF.length + " fermé" + (OFF.length > 1 ? "s" : "") : "") + "</button></div>" : "") +
      '<div class="epsct ' + dispo + '" style="--ct:' + esc(o.color || "#14171C") + ";--n:" + C.length + '">' + C.map(function (t) { var et = LB[t.etat] ? t.etat : "libre", ap = appels[+t.n];
      if (OFF.indexOf(+t.n) >= 0) return '<div class="epsct-w"><div class="epsct-t ferme"><div class="epsct-h">Terrain ' + (+t.n) + '<span>fermé</span></div><div class="epsct-m"></div></div></div>';
      var tg = fn ? "button" : "div", ob = (Array.isArray(t.obs) ? t.obs : []).map(function (x) { return String(x || "").trim(); }).filter(Boolean).slice(0, 8); return '<div class="epsct-w">' + "<" + tg + (fn ? ' type="button"' : "") + ' class="epsct-t ' + et + (t.al ? " al" : "") + (ap ? " call" : "") + '" data-eps-a11y-h="0"' + (fn ? ' onclick="' + fn + "(" + (+t.n) + ')"' : "") + '><div class="epsct-h">' + (ap ? "✋ " : "") + "Terrain " + (+t.n) + "<span>" + LB[et] + '</span></div><div class="epsct-m"><b>' + esc(t.a || "") + "</b><i>" + esc(t.sc || (t.a || t.b ? "–" : "")) + "</i><b>" + esc(t.b || "") + '</b></div>' + (ap ? '<div class="epsct-s" style="color:#B4232B;font-weight:800">' + esc(ap.motif) + "</div>" : t.sub ? '<div class="epsct-s">' + esc(t.sub) + "</div>" : "") + "</" + tg + ">" + (ob.length ? '<div class="epsct-o" aria-label="Observateurs du terrain ' + (+t.n) + '">' + (o.obsIco === "" ? "" : '<i aria-hidden="true">' + esc(o.obsIco || "👁") + "</i>") + ob.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>" : "") + "</div>"; }).join("") + "</div>"; }
  EPSD.courts = courtsHtml; EPSD.courtsOff = courtsOff; EPSD.courtsCfg = courtsCfg;
  EPSD.appels = { html: callHtml, list: function (app) { return callAll().filter(function (c) { return !app || c.app === app; }); }, take: function (id) { var p = callSet(id, 1); callDraw(); return p; }, done: function (id) { var p = callSet(id, 2); callDraw(); return p; }, nom: callNom, ask: callAsk };
  /* ouvre la planche par-dessus la page (cadre), sans quitter la leçon en cours */
  EPSD.planche = function (o) { o = o || {}; var old = document.getElementById("eps-planche"); if (old) old.remove();
    var sp = o.sport || ({ volley: "volley", badminton: "badminton", basket: "basket3" }[appDir()] || ""), f = document.createElement("div"); f.id = "eps-planche"; f.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:#F5F3EE";
    f.innerHTML = '<iframe title="Planche tactique" src="' + BASE + "tactique/?embed=1" + (sp ? "&sport=" + encodeURIComponent(sp) : "") + (o.cls ? "&cls=" + encodeURIComponent(o.cls) : "") + '" style="border:0;width:100%;height:100%;display:block"></iframe>'; document.body.appendChild(f); return f; };
  window.addEventListener("message", function (ev) { if (ev.origin === location.origin && ev.data && ev.data.epsPlanche === "close") { var f = document.getElementById("eps-planche"); if (f) f.remove(); } });
  function overviewBtn() {
    var b = document.getElementById("eps-ovw"), sl = epsSlot();
    if (!b) { if (!sl) return; b = document.createElement("button"); b.type = "button"; b.id = "eps-ovw"; b.className = "epsb"; b.title = "Vue d'ensemble des classes"; b.setAttribute("aria-label", "Vue d'ensemble des classes"); b.innerHTML = "📊"; b.onclick = overview; var f = document.getElementById("eps-find"); sl.insertBefore(b, f && f.parentNode === sl ? f : sl.firstChild); }
    b.style.display = isTeacher() ? "" : "none";
  }
  setInterval(function () { try { overviewBtn(); } catch (e) {} }, 3000);

  function redock() {
    var L = document.querySelectorAll("[data-eps-bar]"); if (L.length < 2) return;
    var sl = epsSlot();
    ["eps-find", "eps-sync", "epsd-pill", "eps-upd", "eps-home"].forEach(function (id) {
      var e = document.getElementById(id);
      if (e && e.parentNode && e.parentNode !== sl && e.parentNode.hasAttribute && e.parentNode.hasAttribute("data-eps-bar")) sl.appendChild(e);
    });
  }
  function init() {
    addCss();
    if (HUB && /[#&]bilans\b/.test(location.hash)) setTimeout(function () { try { history.replaceState(null, "", location.pathname); } catch (e) {} bilans(); }, 900);
    addUpdate();
    applyTeach(); setInterval(applyTeach, 1000);
    setInterval(redock, 400);
    pill = document.createElement("button"); pill.id = "epsd-pill"; pill.type = "button"; pill.onclick = showList;
    var sl = epsSlot(); if (sl) sl.insertBefore(pill, sl.firstChild); else document.body.appendChild(pill);
    if (!HUB) addHome();
    draw();
    setTimeout(sync, 1500);
    /* listes de classes communes (eps-lists.js) : chargé ici s'il ne l'est pas déjà par l'appli */
    var goL = function () { setTimeout(function () { collectLists().then(applyLocal).catch(function () {}); }, 600); setInterval(function () { collectLists().catch(function () {}); }, 5000); };
    try { simBoot(); } catch (e) {} /* 🧪 simulation : bandeau, classe fictive au premier chargement */
    /* leçons communes (eps-lecons.js) : dans les applis d'activité seulement */
    if (!HUB && /\/(escalade|relais|volley|badminton|danse|acrosport|orientation|ccf|crosstraining|basket|step)\//.test(location.pathname) && !window.EPSLC) { var lc = document.createElement("script"); lc.src = BASE + "eps-lecons.js"; document.head.appendChild(lc); }
    if (!HUB && /\/(escalade|relais|volley|badminton|danse|acrosport|orientation|ccf|crosstraining|basket|step)\//.test(location.pathname) && !window.EPSOB) { var ob = document.createElement("script"); ob.src = BASE + "eps-obs.js"; document.head.appendChild(ob); }
    /* 🧭 référentiel de compétences (eps-ref.js) : relevé des évaluations de l'appli, en mode enseignant, pour le suivi toutes activités */
    if (!HUB && /\/(escalade|relais|volley|badminton|danse|acrosport|orientation|crosstraining|basket|step)\//.test(location.pathname) && !window.EPSREF) { var rf = document.createElement("script"); rf.src = BASE + "eps-ref.js"; document.head.appendChild(rf); }
    if (window.EPSL) goL(); else { var ls = document.createElement("script"); ls.src = BASE + "eps-lists.js"; ls.onload = goL; document.head.appendChild(ls); }
  }
  if (document.body) init(); else document.addEventListener("DOMContentLoaded", init);
  if (HUB) { var goP = function () { setTimeout(partageDepuisLien, 300); }; if (document.readyState === "complete") goP(); else addEventListener("load", goP); addEventListener("hashchange", partageDepuisLien); }
})();
