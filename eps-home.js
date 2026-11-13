// Commun à toutes les applications EPS (et à la page d'accueil) :
//  - pas de glissé pour actualiser ;
//  - dispenses partagées (window.EPSD) : pastille « 🩹 dispensés » dans chaque application, gestion depuis la page d'accueil ;
//  - bouton « Accueil » qui ramène à la page commune (/), petit, en bas à gauche, déplaçable par appui long.
(function () {
  try {
    var st = document.createElement("style");
    st.textContent = "html,body{overscroll-behavior-y:contain!important}";
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}
  if (window.__epsHome) return;
  window.__epsHome = true;
  var HUB = location.pathname === "/" || location.pathname === "/index.html";

  /* ================= Dispenses ================= */
  var KD = "eps.disp.v1";
  function ld() { try { var v = JSON.parse(localStorage.getItem(KD) || "null"); if (v && v.items) return v; } catch (e) {} return { items: {}, pend: {}, since: 0, maxU: 0 }; }
  function sv(d) { try { localStorage.setItem(KD, JSON.stringify(d)); } catch (e) {} }
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
  function shCfg() { try { var s = JSON.parse(localStorage.getItem("relais-vitesse-sheets-v1") || "null"); return s && s.url && s.key ? s : null; } catch (e) { return null; } }
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
  function jsonp(cfg, params) {
    return new Promise(function (res) {
      var cb = "epsdCb" + Date.now() + Math.floor(Math.random() * 1e4), s = document.createElement("script"), t;
      function end(d) { clearTimeout(t); try { delete window[cb]; } catch (e) {} s.remove(); res(d); }
      window[cb] = end; s.onerror = function () { end(null); }; t = setTimeout(function () { end(null); }, 15000);
      params.key = cfg.key; params.callback = cb;
      s.src = cfg.url + (cfg.url.indexOf("?") >= 0 ? "&" : "?") + Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
      document.head.appendChild(s);
    });
  }
  var busy = false, timer = null, lastErr = "";
  function stamp() { return Math.max(Date.now(), (D.maxU || 0) + 1); }
  async function sync() {
    var cfg = shCfg();
    if (!cfg || busy || !(window.crypto && crypto.subtle) || navigator.onLine === false) { sched(); return; }
    busy = true;
    try {
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
      var changed = false;
      for (var loop = 0; loop < 20; loop++) {
        var r = await jsonp(cfg, { pull: 1, since: D.since || 0, pre: "disp|" });
        if (!r || !r.keyOk || !r.sync) { lastErr = !r ? "pas de connexion" : !r.keyOk ? "clé" : "script à mettre à jour"; break; }
        lastErr = "";
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
    } catch (e) { lastErr = "réseau"; }
    finally { busy = false; sched(); }
  }
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
    ".epsd-act{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.epsd-act button{height:50px;padding:0 20px;border-radius:14px;border:2px solid #1B1E24;background:#fff;font:800 17px system-ui,sans-serif;color:#1B1E24}" +
    ".epsd-act .p{background:#C0392B;border-color:#C0392B;color:#fff}.epsd-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}" +
    ".epsd-steps{display:flex;gap:8px;margin:4px 0 8px;font-weight:800;font-size:14px;color:#9AA0A6}.epsd-steps .on{color:#C0392B}" +
    "@media print{#epsd-pill{display:none!important}}";
  function addCss() { var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }
  var pill = null;
  function draw() {
    if (!pill) return;
    var n = activeOn().length;
    pill.classList.toggle("on", n > 0 && !HUB);
    pill.textContent = "🩹 " + n + " dispensé" + (n > 1 ? "s" : "");
    var hc = document.getElementById("epsd-hubcount");
    if (hc) hc.textContent = n ? n + " élève" + (n > 1 ? "s" : "") + " dispensé" + (n > 1 ? "s" : "") + " aujourd'hui" : "Aucun élève dispensé aujourd'hui";
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
  function showList() {
    var up = upcoming().filter(function (x) { return x.du <= addDays(today(), 7); });
    overlay("<h3>🩹 Élèves dispensés</h3><p class=\"m\">Aujourd'hui, " + fmt(today()) + "</p>" + listHTML(activeOn(), false) +
      (up.length ? '<h3 style="font-size:18px;margin-top:18px">Dans les 7 prochains jours</h3>' + listHTML(up, false) : "") +
      '<div class="epsd-act"><button data-x>Fermer</button></div>');
  }
  function addDays(iso, n) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  /* code enseignant : le même que celui de Relais Vitesse */
  function hashCode(c) { var h = 5381, s = "relais:" + c; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); }
  var unlockedUntil = 0;
  function askCode() {
    return new Promise(function (res) {
      if (Date.now() < unlockedUntil) return res(true);
      var stored = null; try { stored = JSON.parse(localStorage.getItem("relais-vitesse-code-v1") || "null"); } catch (e) {}
      var o = overlay("<h3>🔒 Code enseignant</h3><p class=\"m\">" + (stored ? "Le même code que dans Relais Vitesse." : "Crée un code enseignant (il servira aussi dans Relais Vitesse).") + '</p><input class="epsd-in" id="epsd-code" type="password" inputmode="numeric" autocomplete="off" placeholder="Code"><p class="m" id="epsd-cerr" style="color:#C0392B;margin-top:8px"></p><div class="epsd-act"><button data-x>Annuler</button><button class="p" id="epsd-cok">Valider</button></div>');
      var inp = o.querySelector("#epsd-code"); setTimeout(function () { inp.focus(); }, 50);
      function ok() {
        var v = inp.value.trim(); if (v.length < 4) { o.querySelector("#epsd-cerr").textContent = "4 chiffres minimum."; return; }
        if (!stored) { try { localStorage.setItem("relais-vitesse-code-v1", JSON.stringify(hashCode(v))); } catch (e) {} }
        else if (hashCode(v) !== stored) { o.querySelector("#epsd-cerr").textContent = "Code incorrect."; inp.value = ""; return; }
        unlockedUntil = Date.now() + 10 * 60000; o.remove(); res(true);
      }
      o.querySelector("#epsd-cok").onclick = ok; inp.addEventListener("keydown", function (e) { if (e.key === "Enter") ok(); });
      o.addEventListener("click", function (e) { if (e.target === o || e.target.closest("[data-x]")) res(false); });
    });
  }
  /* gestion (page d'accueil) : liste + nouvelle dispense en 3 étapes : classe, élève, période et motif */
  async function manage() {
    if (!(await askCode())) return;
    var o = overlay('<div id="epsd-m"></div>'), box = o.querySelector("#epsd-m"), R = await rosters(), S = { step: 0, classe: "", nom: "" };
    function render() {
      var cfg = shCfg();
      if (S.step === 0) {
        var L = all().filter(function (x) { return x.au >= today(); }).sort(function (a, b) { return a.du < b.du ? -1 : 1; });
        box.innerHTML = "<h3>🩹 Dispenses</h3><p class=\"m\">" + (cfg ? "Partagées automatiquement avec les autres tablettes (comme Relais Vitesse), chiffrées." : "Enregistrées sur cette tablette. Pour les partager avec les autres tablettes, configure Google Sheets dans Relais Vitesse (🔒 Enseignant → Google Sheets).") + "</p>" +
          '<div class="epsd-act" style="margin-top:4px"><button class="p" id="epsd-new">+ Nouvelle dispense</button></div>' +
          '<h3 style="font-size:18px;margin-top:18px">En cours et à venir</h3>' + listHTML(L, true) +
          '<div class="epsd-act"><button data-x>Fermer</button></div>';
        box.querySelector("#epsd-new").onclick = function () { S = { step: 1, classe: "", nom: "" }; render(); };
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
  window.EPSD = { list: all, active: activeOn, find: find, label: label, manage: manage, show: showList, sync: sync };

  /* ================= Bouton « Accueil » (sauf sur la page d'accueil) ================= */
  function addHome() {
    var b = document.createElement("a");
    b.href = "/";
    b.setAttribute("aria-label", "Accueil : toutes les applications EPS");
    b.title = "Toutes les applications EPS";
    b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>';
    var s = b.style;
    s.position = "fixed"; s.zIndex = "2147483000";
    s.left = "calc(10px + env(safe-area-inset-left, 0px))"; s.bottom = "calc(10px + env(safe-area-inset-bottom, 0px))";
    s.width = "46px"; s.height = "46px"; s.borderRadius = "50%";
    s.display = "grid"; s.placeItems = "center";
    s.background = "rgba(27,30,36,.78)"; s.color = "#fff";
    s.boxShadow = "0 2px 8px rgba(0,0,0,.25)"; s.textDecoration = "none";
    s.webkitTapHighlightColor = "transparent"; s.touchAction = "none";
    try { var p = JSON.parse(localStorage.getItem("eps.homeBtn") || "null"); if (p) { s.left = p.x + "px"; s.top = p.y + "px"; s.bottom = "auto"; } } catch (e) {}
    var t = null, drag = false, ox = 0, oy = 0;
    b.addEventListener("pointerdown", function (e) {
      drag = false; ox = e.clientX - b.offsetLeft; oy = e.clientY - b.offsetTop;
      t = setTimeout(function () { drag = true; s.background = "rgba(217,72,31,.9)"; try { b.setPointerCapture(e.pointerId); } catch (x) {} }, 500);
    });
    b.addEventListener("pointermove", function (e) {
      if (!drag) return; e.preventDefault();
      var x = Math.max(4, Math.min(innerWidth - 50, e.clientX - ox)), y = Math.max(4, Math.min(innerHeight - 50, e.clientY - oy));
      s.left = x + "px"; s.top = y + "px"; s.bottom = "auto";
    });
    function end() {
      clearTimeout(t);
      if (drag) { s.background = "rgba(27,30,36,.78)"; try { localStorage.setItem("eps.homeBtn", JSON.stringify({ x: b.offsetLeft, y: b.offsetTop })); } catch (e) {} }
    }
    b.addEventListener("pointerup", end); b.addEventListener("pointercancel", end);
    b.addEventListener("click", function (e) { if (drag) { e.preventDefault(); drag = false; } });
    document.body.appendChild(b);
  }
  /* ================= Bouton « Mise à jour » : récupère les nouveautés (données et application) sans quitter ================= */
  function addUpdate() {
    var b = document.createElement("button");
    b.type = "button"; b.id = "eps-upd"; b.title = "Mettre à jour (données et application)"; b.setAttribute("aria-label", "Mettre à jour");
    b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.9-4M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4"/></svg>';
    var s = b.style;
    s.position = "fixed"; s.zIndex = "2147483000"; s.border = "0"; s.padding = "0";
    s.left = "calc(10px + env(safe-area-inset-left, 0px))"; s.bottom = HUB ? "calc(10px + env(safe-area-inset-bottom, 0px))" : "calc(64px + env(safe-area-inset-bottom, 0px))";
    s.width = "46px"; s.height = "46px"; s.borderRadius = "50%"; s.display = "grid"; s.placeItems = "center";
    s.background = "rgba(31,95,139,.85)"; s.color = "#fff"; s.boxShadow = "0 2px 8px rgba(0,0,0,.25)";
    b.onclick = async function () {
      if (b.dataset.busy) return; b.dataset.busy = "1"; s.opacity = ".6";
      var tip = document.createElement("div");
      tip.textContent = "Mise à jour…";
      tip.style.cssText = "position:fixed;z-index:2147483002;left:50%;bottom:24px;transform:translateX(-50%);background:#1B1E24;color:#fff;padding:12px 20px;border-radius:999px;font:700 16px system-ui,sans-serif";
      document.body.appendChild(tip);
      var wait = function (p, ms) { return Promise.race([p, new Promise(function (r) { setTimeout(r, ms); })]); };
      try { if (typeof window.epsBeforeUpdate === "function") await wait(Promise.resolve(window.epsBeforeUpdate()), 8000); } catch (e) {}
      try { await wait(sync(), 6000); } catch (e) {}
      try { if (navigator.serviceWorker) { var regs = await navigator.serviceWorker.getRegistrations(); await wait(Promise.all(regs.map(function (r) { return r.update().catch(function () {}); })), 4000); } } catch (e) {}
      location.reload();
    };
    document.body.appendChild(b);
  }
  function init() {
    addCss();
    addUpdate();
    pill = document.createElement("button"); pill.id = "epsd-pill"; pill.type = "button"; pill.onclick = showList;
    document.body.appendChild(pill);
    if (!HUB) addHome();
    draw();
    setTimeout(sync, 1500);
  }
  if (document.body) init(); else document.addEventListener("DOMContentLoaded", init);
})();
