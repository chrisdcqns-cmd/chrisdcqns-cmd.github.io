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
  function epsPin(o){o=o||{};return new Promise(function(res){
  if(!document.getElementById("epp-css")){var st=document.createElement("style");st.id="epp-css";st.textContent=
  ".epp{position:fixed;inset:0;z-index:2147483600;background:rgba(20,22,27,.94);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-user-select:none;user-select:none;touch-action:manipulation}"+
  ".epp *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}"+
  ".epp-b{width:100%;max-width:380px;color:#fff;text-align:center}"+
  ".epp .epp-b h3{margin:0 0 6px;font-size:22px;font-weight:800;color:#fff;background:none;border:0;padding:0;text-transform:none;letter-spacing:0}.epp .epp-t{margin:0 0 10px;font-size:15px;color:#fff;opacity:.75;line-height:1.35}"+
  ".epp-d{display:flex;justify-content:center;gap:12px;min-height:22px;margin:16px 0 6px;flex-wrap:wrap}.epp-d i{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.6)}.epp-d i.f{background:#fff;border-color:#fff}"+
  ".epp-e{min-height:22px;margin:4px 0 10px;color:#ff8a7a;font-weight:700;font-size:15px}"+
  ".epp-k{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}"+
  ".epp-k.l{grid-template-columns:repeat(10,1fr);gap:5px}"+
  ".epp-k button,.epp-a button{border:0;border-radius:16px;background:rgba(255,255,255,.12);color:#fff;font:700 26px system-ui,sans-serif;height:64px;padding:0;outline:none;transition:none;-webkit-appearance:none;appearance:none}"+
  ".epp-k.l button{height:48px;font-size:18px;border-radius:10px}.epp-k button.w{grid-column:span 2;font-size:15px}.epp-k.l button.w{grid-column:span 3}"+
  ".epp-k button:active,.epp-k button:focus,.epp-k button:hover{background:rgba(255,255,255,.12)}.epp-k button.x,.epp-k button.x:active{background:transparent;font-size:15px}"+
  ".epp-a{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.epp-a button{font-size:17px;height:54px}.epp-a .ok{background:#2E9E5B}.epp-a .ok[disabled]{opacity:.4}"+
  "@keyframes epp-s{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}.epp-d.s{animation:epp-s .25s 2}";
  document.head.appendChild(st)}
  try{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur()}catch(e){}
  var v="",lt=false,up=false,busy=false,len=o.len||0,min=o.min||(len||4),el=document.createElement("div");el.className="epp";
  el.innerHTML='<div class="epp-b" role="dialog" aria-label="Code"><h3></h3><p class="epp-t"></p><div class="epp-d" aria-hidden="true"></div><div class="epp-e" aria-live="polite"></div><div class="epp-k"></div><div class="epp-a"><button type="button" class="no">Annuler</button><button type="button" class="ok">Valider</button></div></div>';
  el.querySelector("h3").textContent=o.title||"🔒 Code enseignant";var tx=el.querySelector(".epp-t");tx.textContent=o.text||"";if(!o.text)tx.style.display="none";
  var D=el.querySelector(".epp-d"),E=el.querySelector(".epp-e"),K=el.querySelector(".epp-k"),OK=el.querySelector(".ok");if(len)OK.style.display="none",el.querySelector(".epp-a").style.gridTemplateColumns="1fr";
  function dots(){var n=Math.max(len,v.length,len?0:min),h="";for(var i=0;i<n;i++)h+='<i class="'+(i<v.length?"f":"")+'"></i>';D.innerHTML=h;OK.disabled=v.length<min}
  function keys(){var h="";if(!lt){"123456789".split("").forEach(function(c){h+='<button type="button" data-k="'+c+'">'+c+"</button>"});h+=o.letters?'<button type="button" class="x" data-m="1">ABC</button>':"<span></span>";h+='<button type="button" data-k="0">0</button><button type="button" class="x" data-b="1" aria-label="Effacer">⌫</button>';K.className="epp-k"}
  else{"AZERTYUIOPQSDFGHJKLMWXCVBN-_.!".split("").forEach(function(c){var d=/[A-Z]/.test(c)?(up?c:c.toLowerCase()):c;h+='<button type="button" data-k="'+d+'">'+d+"</button>"});h+='<button type="button" class="x w" data-u="1">'+(up?"⇩ abc":"⇧ ABC")+'</button><button type="button" class="x w" data-m="1">123</button><button type="button" data-k="@">@</button><button type="button" class="x w" data-b="1" aria-label="Effacer">⌫</button>';K.className="epp-k l"}
  K.innerHTML=h}
  function close(r){document.removeEventListener("keydown",kd,true);el.remove();res(r)}
  function fail(m){E.textContent=m||"Code incorrect.";v="";dots();D.classList.remove("s");void D.offsetWidth;D.classList.add("s")}
  function submit(){if(busy||v.length<min)return;var val=v;if(!o.check)return close(val);busy=true;Promise.resolve(o.check(val)).then(function(r){busy=false;if(r===true)close(val);else fail(typeof r=="string"?r:"")},function(){busy=false;fail("Vérification impossible.")})}
  function add(c){if(busy)return;E.textContent="";if(v.length>=(len||o.max||40))return;v+=c;dots();if(len&&v.length===len)setTimeout(submit,120)}
  function bs(){if(busy)return;v=v.slice(0,-1);dots()}
  K.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;e.preventDefault();b.blur();if(b.dataset.k)add(b.dataset.k);else if(b.dataset.b)bs();else if(b.dataset.u){up=!up;keys()}else if(b.dataset.m){lt=!lt;keys()}});
  el.querySelector(".no").onclick=function(){close(null)};OK.onclick=submit;
  function kd(e){if(!document.body.contains(el))return;var k=e.key;if(/^[0-9]$/.test(k)||(o.letters&&/^[a-zA-Z@._!-]$/.test(k)))add(k);else if(k==="Backspace")bs();else if(k==="Enter")submit();else if(k==="Escape")close(null);else return;e.preventDefault();e.stopPropagation()}
  document.addEventListener("keydown",kd,true);
  if(o.err)E.textContent=o.err;keys();dots();document.body.appendChild(el)})}
  if (!window.epsPin) window.epsPin = epsPin;
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
      '<div class="epsd-act"><button data-x>Fermer</button>' + (shCfg() && s.url !== RELAIS_URL ? '<button id="epsd-sqr">📲 Régler une autre tablette</button>' : "") + '<button id="epsd-stest">Tester</button><button class="p" id="epsd-ssave">Enregistrer</button></div>');
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
      window[cb] = end; s.onerror = function () { end(null); }; t = setTimeout(function () { end(null); }, ms || 15000);
      params.key = cfg.key; params.callback = cb;
      s.src = cfg.url + (cfg.url.indexOf("?") >= 0 ? "&" : "?") + Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
      document.head.appendChild(s);
    });
  }
  var busy = false, timer = null, lastErr = "", lastOk = 0;
  function stamp() { return Math.max(Date.now(), (D.maxU || 0) + 1); }
  async function sync() {
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
        LL = lld(); lk.forEach(function (k) { delete LL.pend[k]; }); lsv(LL);
        await new Promise(function (r) { setTimeout(r, 1200); });
      }
      var changed = false;
      for (var loop = 0; loop < 20; loop++) {
        var r = await jsonp(cfg, { pull: 1, since: D.since || 0, pre: "disp|" });
        if (!r || !r.keyOk || !r.sync) { lastErr = !r ? "pas de connexion" : !r.keyOk ? "clé" : "script à mettre à jour"; break; }
        lastErr = ""; lastOk = Date.now();
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
    } catch (e) { lastErr = "réseau"; }
    finally { busy = false; sched(); try { syncBadge(); } catch (e) {} }
  }
  /* magasins de données génériques (ex. évaluations d'eps-eval.js) : {pre, key, onChange} ;
     localStorage[key] = {items:{id:{…, u}}, pend:{id:u}, since} ; le plus récent (u) l'emporte, élément par élément */
  var STORES = [];
  function stLd(k) { var v = jget(k, null); if (!v || !v.items) v = { items: {}, pend: {}, since: 0 }; v.pend = v.pend || {}; return v; }
  async function syncStore(cfg, st) {
    var V = stLd(st.key), pk = Object.keys(V.pend), sent = {};
    if (pk.length) { var recs = [];
      for (var i = 0; i < pk.length; i++) { var it = V.items[pk[i]]; if (!it) continue; sent[pk[i]] = V.pend[pk[i]]; recs.push({ k: st.pre + pk[i], u: V.pend[pk[i]], d: 0, x: await enc(cfg.key, JSON.stringify(it)) }); }
      if (recs.length) await fetch(cfg.url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ key: cfg.key, sync: { dev: "eval", recs: recs } }) });
      V = stLd(st.key); Object.keys(sent).forEach(function (k) { if (V.pend[k] === sent[k]) delete V.pend[k]; }); jsetS(st.key, V);
      await new Promise(function (r) { setTimeout(r, 1200); }); }
    var ch = false;
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
    ".epsd-act{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.epsd-act button{height:50px;padding:0 20px;border-radius:14px;border:2px solid #1B1E24;background:#fff;font:800 17px system-ui,sans-serif;color:#1B1E24}" +
    ".epsd-act .p{background:#C0392B;border-color:#C0392B;color:#fff}.epsd-g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}" +
    ".epsd-steps{display:flex;gap:8px;margin:4px 0 8px;font-weight:800;font-size:14px;color:#9AA0A6}.epsd-steps .on{color:#C0392B}" +
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
        '<div class="epsd-act"><button data-x>Fermer</button><button class="p" id="epsd-all">Voir tous les dispensés (' + A.length + ")</button></div>");
      o.querySelector("#epsd-all").onclick = function () { o.remove(); showList(null, true); };
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
    var u = document.getElementById("eps-upd"); if (u) u.style.display = t ? (u.className == "epsb" ? "inline-flex" : "grid") : "none";
    document.querySelectorAll("[data-eps-teach]").forEach(function (el) { el.style.display = t ? "" : "none"; });
    try { document.documentElement.classList.toggle("eps-teach", !!t); } catch (e) {}
    var b = document.getElementById("eps-teachbtn"); if (b) { b.textContent = "🔓 Quitter le mode enseignant"; b.style.display = t ? "" : "none"; }
    try { applyReg(); } catch (e) {}
  }
  function askCode() {
    if (Date.now() < unlockedUntil || hubTeach()) return Promise.resolve(true);
    var stored = null; try { stored = JSON.parse(localStorage.getItem("relais-vitesse-code-v1") || "null"); } catch (e) {}
    var pin = window.epsPin || epsPin;
    function done() { unlockedUntil = Date.now() + 10 * 60000; setHubTeach(true); return true; }
    if (stored) return pin({ title: "🔒 Code enseignant", min: 4, max: 12, check: function (v) { return hashCode(v) === stored; } }).then(function (v) { return v === null ? false : done(); });
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
    if (!c) { c = { id: freeId(V.classes, clsId(cl)), nom: cl, voie: voie, eleves: [], matchs: {}, poules: {} }; V.classes.push(c); }
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
    if (exact) (it.el || []).forEach(function (n) { var k = nkey(n); if (!keep[k] && it.rm.indexOf(k) < 0) it.rm.push(k); });
    else (it.el || []).forEach(function (n) { if (!keep[nkey(n)]) { names.push(n); keep[nkey(n)] = 1; } });
    it.old = old && norm(old) !== norm(nom) ? old : ""; it.nom = nom; it.el = names; it.ts = Date.now(); it.del = false;
    if (off) { it.off = off.slice(); it.man = 1; } /* activités choisies à la main : l'emploi du temps ne les change plus */
    L.pend[it.id] = stamp(); L.app[it.id] = JSON.stringify(it); lsv(L);
    applyLocal(); setTimeout(sync, 300);
  }
  /* activités des classes déduites de l'emploi du temps (appli EDT, enseignant choisi dans « Qui es-tu ? » ou nom de l'enseignant des réglages).
     Une classe dont les activités ont été choisies à la main dans Réglages (it.man) n'est jamais modifiée. */
  function actCode(a) { a = norm(a); if (/escalad/.test(a)) return "esc"; if (/relais|vitesse/.test(a)) return "rel"; if (/orientation|^co$|^co /.test(a)) return "ori"; if (/volley/.test(a)) return "vol"; if (/badminton|^bad/.test(a)) return "bad"; if (/danse/.test(a)) return "dan"; if (/acro/.test(a)) return "acro"; return null; }
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
  function edtApply() {
    var E = edtActs(); if (!E || !E.moi) return { n: 0, moi: E && E.moi, edt: !!E };
    var ALL = ["esc", "rel", "ori", "vol", "bad", "dan", "acro"], L = lld(), n = 0;
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
    var APPS = [["esc", "Escalade"], ["rel", "Relais Vitesse"], ["ori", "OrienRun"], ["vol", "Volley-ball"], ["bad", "Badminton"], ["dan", "Danse"], ["acro", "Acrosport"]];
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
        '<span class="epsd-lab">Élèves (un par ligne : Prénom Nom)</span><textarea class="epsd-in" id="epsl-t" style="height:min(34vh,300px);padding:10px 12px;line-height:1.45">' + esc(x.draft != null ? x.draft : names.join("\n")) + "</textarea>" +
        '<p class="m" id="epsl-c" style="margin-top:6px"></p>' +
        '<p class="m">La liste est commune à toutes les tablettes. Une activité décochée ne propose plus cette classe (elle n\'y est gardée que si des évaluations y sont déjà enregistrées). Un élève retiré n\'apparaît plus ; ce qu\'il a déjà fait reste dans les résultats.</p>' +
        (err ? '<p class="m" style="color:#C0392B;font-weight:800">' + esc(err) + "</p>" : "") +
        '<div class="epsd-act"><button id="epsl-del" style="color:#C0392B;margin-right:auto">🗑 Supprimer la liste</button><button id="epsl-b">← Retour</button><button class="p" id="epsl-ok">Enregistrer</button></div>';
      var ti = box.querySelector("#epsl-t"), ni = box.querySelector("#epsl-n");
      var cnt = function () { var n = ti.value.split("\n").filter(function (l) { return l.trim(); }).length; box.querySelector("#epsl-c").textContent = n + " élève" + (n > 1 ? "s" : ""); };
      ti.oninput = function () { x.draft = ti.value; cnt(); }; ni.oninput = function () { x.draftName = ni.value; }; cnt();
      box.querySelectorAll("[data-a]").forEach(function (b) { b.onclick = function () { sel[b.dataset.a] = sel[b.dataset.a] ? 0 : 1; editView(); }; });
      box.querySelector("#epsl-b").onclick = function () { x.draft = x.draftName = null; x.sel = null; listView(); };
      box.querySelector("#epsl-del").onclick = function () { delView(1); };
      box.querySelector("#epsl-ok").onclick = async function () {
        var nn = ni.value.replace(/\s+/g, " ").trim(), old = x.name;
        if (!nn) return editView("Donne un nom à la classe.");
        if (norm(nn) !== norm(old) && M[norm(nn)]) return editView("Une classe « " + M[norm(nn)].name + " » existe déjà.");
        var L = []; ti.value.split("\n").forEach(function (l) { l = l.replace(/\s+/g, " ").trim(); if (l && !L.some(function (y) { return nkey(y) === nkey(l); })) L.push(l); });
        var off = APPS.filter(function (a) { return !sel[a[0]]; }).map(function (a) { return a[0]; });
        try { await writeClass(nn, old, L, sel, off); } catch (e) { return editView("Enregistrement impossible : " + (e && e.message || e)); }
        x.sel = null; M = await allLists();
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
    if (E.pend && E.data) {
      var x = await enc(cfg.key, JSON.stringify({ data: E.data, u: E.u }));
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
        try { var o = JSON.parse(await dec(cfg.key, L[i][4])); if ((+o.u || 0) > (+E.u || 0) && !E.pend) { E.data = o.data; E.u = o.u; ch = true; } } catch (e) {}
      }
      E.since = L.length ? +L[L.length - 1][0] : Math.max(E.since || 0, +q.seq || 0); eset(E);
      if (ch) try { window.dispatchEvent(new CustomEvent("eps-edt")); } catch (e) {}
      if (!q.more) break;
    }
  }
  window.EPSE = { get: eget, set: function (data) { var E = eget(); E.data = data; E.u = Math.max(Date.now(), (+E.u || 0) + 1); E.pend = E.u; eset(E); setTimeout(sync, 300); } };
  var APPS = [["acrosport", "Acrosport"], ["escalade", "Escalade"], ["orientation", "OrienRun"], ["relais", "Relais Vitesse"], ["volley", "Volley-ball"], ["badminton", "Badminton"], ["danse", "Danse"], ["co-eval", "CO – Évaluation"]];
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
      '<div class="dbtns epsd-act" style="margin-top:8px"><button type="button" id="er-edit">✏️ Modifier les listes</button><button type="button" class="p" id="er-imp">📥 Importer une liste d\'élèves</button></div>' +
      '<div class="epsd-cls" style="margin-top:18px">Sauvegarde</div>' +
      '<p class="m">Fichier de sauvegarde de toutes les applications de cette tablette (classes, leçons, évaluations, réglages), à garder sur ton ordinateur ou ta clé USB. Les vidéos et les cartes d\'OrienRun n\'y sont pas.</p>' +
      '<div class="dbtns epsd-act" style="margin-top:8px"><button type="button" id="er-save">💾 Enregistrer une sauvegarde</button><label style="height:50px;padding:0 20px;border-radius:14px;border:2px solid #1B1E24;display:inline-flex;align-items:center;font:800 17px system-ui,sans-serif;cursor:pointer">♻️ Restaurer<input type="file" accept=".json,.eps,application/json" id="er-load" style="display:none"></label></div>' +
      '<div class="epsd-act"><button data-x>Fermer</button><button class="p" id="er-ok">Enregistrer les réglages</button></div>');
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
  function gateOpen() {
    var G = GATE; if (!G) return;
    gateCss(); gateClose();
    var col = G.color || "#1B1E24", L = [];
    try { L = (G.classes && G.classes()) || []; } catch (e) {}
    var cur = ""; try { cur = G.current ? G.current() : ""; } catch (e) {}
    var R = G.resources || [];
    var d = document.createElement("div"); d.className = "epsg";
    d.innerHTML = '<div class="epsg-hd" style="background:#14171C;box-shadow:inset 0 -4px 0 ' + col + '"><div class="epsg-ic" style="background:' + col + '">' + (G.icon || "") + '</div><div><h1>' + esc(G.app || "") + '</h1>' + (G.sub ? "<p>" + esc(G.sub) + "</p>" : "") + '</div><a class="epsg-home" href="' + BASE + '"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>Accueil</a></div>' +
      '<div class="epsg-in"><h2>Choisis ta classe</h2>' +
      (L.length || G.noClass ? '<div class="epsg-g">' + L.map(function (c) {
        return '<button class="epsg-c' + (c.id === cur ? " on" : "") + '" data-c="' + esc(c.id) + '"' + (c.id === cur ? ' style="border-color:' + col + '"' : "") + '><b>' + esc(c.nom) + '</b><span>' + esc(c.note || (c.n != null ? c.n + " élève" + (c.n > 1 ? "s" : "") : "")) + "</span></button>";
      }).join("") + (G.noClass ? '<button class="epsg-c nl" data-nl="1"><b style="font-size:17px">' + esc(G.noClass.label || "Sans liste") + "</b><span>" + esc(G.noClass.sub || "") + "</span></button>" : "") + "</div>"
        : '<div class="epsg-empty">Aucune classe sur cette tablette pour l\'instant : demande à ton enseignant.</div>') +
      (R.length ? '<div class="epsg-lab">Ressources · sans classe</div><div class="epsg-g">' + R.map(function (r, i) {
        return '<button class="epsg-r" data-r="' + i + '" style="background:' + tint(col, .12) + ';color:' + col + '"><i>' + (r.ico || "📘") + "</i><span>" + esc(r.label) + (r.sub ? "<small>" + esc(r.sub) + "</small>" : "") + "</span></button>";
      }).join("") + "</div>" : "") +
      "</div>"; /* accès enseignant : appui long (3 s) sur le logo de l'appli, sans bouton visible pour les élèves */
    d.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.c != null) { gateClose(); try { G.select(b.dataset.c); } catch (er) {} }
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
  window.EPSG = { register: gateRegister, open: gateOpen, close: gateClose };

  /* ================= Commentaires : 🎤 dictée (reconnaissance vocale de la tablette) et ✨ Reformuler (Claude, par le script commun) =================
     Toute appli marque ses champs de commentaire avec l'attribut data-eps-comment (facultatif : data-eps-ctx = éléments d'évaluation, data-eps-mode = "fiche" | "bulletin").
     Le texte envoyé ne contient jamais le nom de l'élève. Barre visible seulement en mode enseignant. */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, DICT = null;
  function setVal(ta, v) { ta.value = v; ["input", "change"].forEach(function (ev) { try { ta.dispatchEvent(new Event(ev, { bubbles: true })); } catch (e) {} }); }
  function actName() { return (GATE && GATE.app) || String(document.title || "EPS").split(/[–—·|-]/)[0].trim(); }
  function reformuler(texte, o) {
    o = o || {}; var cfg = shCfg();
    if (!cfg) return Promise.reject(new Error("Règle d'abord le partage entre tablettes (Réglages), qui donne accès au script commun."));
    return jsonp(cfg, { ai: o.mode || "fiche", t: String(texte || "").slice(0, o.mode === "lecon" ? 3200 : 1500), act: o.act || actName(), ctx: String(o.ctx || "").slice(0, 600), lang: o.lang || "" }, 40000).then(function (r) {
      if (!r) throw new Error("Pas de réponse du script (connexion ?)");
      if (!r.keyOk) throw new Error("Clé du partage refusée par le script");
      if (r.aiErr) throw new Error(/ANTHROPIC_KEY/.test(r.aiErr) ? "Clé Claude absente du script (Propriétés du script → ANTHROPIC_KEY)" : r.aiErr);
      if (r.ai == null) throw new Error("Le script n'est pas encore à jour : colle le nouveau Code.gs et redéploie (nouvelle version)");
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

  /* ================= Accès enseignant caché : maintenir 3 s le logo =================
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
      tm = setTimeout(function () { stop(); teacherEntry(); }, 3000);
    }, true);
    document.addEventListener("pointermove", function (e) { if (el && Math.hypot(e.clientX - sx, e.clientY - sy) > 14) stop(); }, true);
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
  window.EPSD = { refresh: function () { try { draw(); } catch (e) {} },
    reformuler: function (t, o) { return reformuler(t, o); },
    store: function (o) { if (!STORES.some(function (x) { return x.key === o.key; })) STORES.push(o); clearTimeout(timer); timer = setTimeout(sync, 2000); },
    syncSoon: function () { clearTimeout(timer); timer = setTimeout(sync, 4000); },
    /* synchro immédiate d'un seul magasin (ex. leçon en cours : relevé toutes les quelques secondes) */
    syncOne: function (k) { var cfg = shCfg(), st = STORES.filter(function (x) { return x.key === k; })[0]; if (!cfg || !st || st._busy || navigator.onLine === false) return Promise.resolve(false);
      st._busy = true; return syncStore(cfg, st).then(function () { st._busy = false; return true; }, function () { st._busy = false; return false; }); },
    /* requête longue au script commun (POST, réponse lisible) : ex. {lc:{…}} pour les leçons (Claude) */
    post: function (body) { var cfg = shCfg(); if (!cfg) return Promise.reject(new Error("Règle d'abord le partage entre tablettes (Réglages), qui donne accès au script commun."));
      body = Object.assign({ key: cfg.key }, body);
      return fetch(cfg.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) }).then(function (r) { return r.json(); }); },
    shared: function () { return !!shCfg(); }, applyLists: function () { return applyLocal(); }, share: shareSettings,  list: all, active: activeOn, find: find, label: label, manage: manage, importList: importList, editLists: editLists, shareSettings: function () { askCode().then(function (ok) { if (ok) shareSettings(); }); }, show: showList, sync: sync,
    teacherToggle: function () { if (isTeacher()) { unlockedUntil = 0; setHubTeach(false); } else askCode().then(function (ok) { if (ok) setHubTeach(true); }); } };

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
    var HOLD = 3000;
    var b = document.createElement("button");
    b.type = "button"; b.id = "eps-home";
    b.setAttribute("aria-label", "Accueil de l'application (maintenir 3 secondes : toutes les applications EPS)");
    b.title = "Appui : accueil de l'application · Maintenir 3 s : toutes les applications";
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
    b.type = "button"; b.id = "eps-upd"; b.title = "Mettre à jour (données et application)"; b.setAttribute("aria-label", "Mettre à jour");
    b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.9-4M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4"/></svg>';
    var s = b.style, slot = epsSlot();
    if (slot) { b.className = "epsb"; } else {
    s.position = "fixed"; s.zIndex = "2147483000"; s.border = "0"; s.padding = "0";
    s.left = "calc(10px + env(safe-area-inset-left, 0px))"; s.bottom = HUB ? "calc(10px + env(safe-area-inset-bottom, 0px))" : "calc(64px + env(safe-area-inset-bottom, 0px))";
    s.width = "46px"; s.height = "46px"; s.borderRadius = "50%"; s.display = "grid"; s.placeItems = "center";
    s.background = "rgba(31,95,139,.85)"; s.color = "#fff"; s.boxShadow = "0 2px 8px rgba(0,0,0,.25)";
    }
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
    (slot || document.body).appendChild(b);
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
    if (!cfg) { st = "○"; t = "Partage non réglé"; }
    else if (lastErr && (!lastOk || Date.now() - lastOk > 120000)) { st = "⚠"; t = lastErr === "clé" ? "Clé refusée" : lastErr === "script à mettre à jour" ? "Script à mettre à jour" : "Hors ligne"; }
    else if (p) { st = "⏳"; t = p + " à envoyer"; }
    else if (lastOk) { st = "✓"; t = ago < 1 ? "À jour" : "À jour (" + ago + " min)"; }
    else { st = "⟳"; t = "Synchro…"; }
    b.style.color = st === "✓" ? "#7FD49A" : st === "⚠" ? "#FF8A7A" : st === "⏳" ? "#F5C76B" : "#D5D8DE";
    b.title = "Partage entre tablettes : " + t + (lastOk ? " · dernier échange " + new Date(lastOk).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "") + " · toucher pour synchroniser";
    b.innerHTML = st + " <span>" + t + "</span>";
  }
  setInterval(function () { try { syncBadge(); } catch (e) {} }, 3000);
  function redock() {
    var L = document.querySelectorAll("[data-eps-bar]"); if (L.length < 2) return;
    var sl = epsSlot();
    ["eps-sync", "epsd-pill", "eps-upd", "eps-home"].forEach(function (id) {
      var e = document.getElementById(id);
      if (e && e.parentNode && e.parentNode !== sl && e.parentNode.hasAttribute && e.parentNode.hasAttribute("data-eps-bar")) sl.appendChild(e);
    });
  }
  function init() {
    addCss();
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
    /* leçons communes (eps-lecons.js) : dans les applis d'activité seulement */
    if (!HUB && /\/(escalade|relais|volley|badminton|danse|acrosport|orientation)\//.test(location.pathname) && !window.EPSLC) { var lc = document.createElement("script"); lc.src = BASE + "eps-lecons.js"; document.head.appendChild(lc); }
    if (window.EPSL) goL(); else { var ls = document.createElement("script"); ls.src = BASE + "eps-lists.js"; ls.onload = goL; document.head.appendChild(ls); }
  }
  if (document.body) init(); else document.addEventListener("DOMContentLoaded", init);
  if (HUB) { var goP = function () { setTimeout(partageDepuisLien, 300); }; if (document.readyState === "complete") goP(); else addEventListener("load", goP); addEventListener("hashchange", partageDepuisLien); }
})();
