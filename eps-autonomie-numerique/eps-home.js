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
  /* mode enseignant : celui de l'application (window.epsIsTeacher), ou celui de la page d'accueil (code enseignant) */
  function hubTeach() { try { return Date.now() < +(localStorage.getItem("eps.teach.until") || 0); } catch (e) { return false; } }
  function isTeacher() { try { if (typeof window.epsIsTeacher === "function" && window.epsIsTeacher()) return true; } catch (e) {} return HUB && hubTeach(); }
  function setHubTeach(on) { try { localStorage.setItem("eps.teach.until", on ? String(Date.now() + 60 * 60000) : "0"); } catch (e) {} applyTeach(); }
  function applyTeach() {
    var t = isTeacher();
    var u = document.getElementById("eps-upd"); if (u) u.style.display = t ? "grid" : "none";
    document.querySelectorAll("[data-eps-teach]").forEach(function (el) { el.style.display = t ? "" : "none"; });
    var b = document.getElementById("eps-teachbtn"); if (b) b.textContent = t ? "🔓 Quitter le mode enseignant" : "🔒 Enseignant";
  }
  function askCode() {
    if (Date.now() < unlockedUntil) return Promise.resolve(true);
    var stored = null; try { stored = JSON.parse(localStorage.getItem("relais-vitesse-code-v1") || "null"); } catch (e) {}
    var pin = window.epsPin || epsPin;
    function done() { unlockedUntil = Date.now() + 10 * 60000; if (HUB) setHubTeach(true); return true; }
    if (stored) return pin({ title: "🔒 Code enseignant", text: "Le même code que dans Relais Vitesse.", min: 4, max: 12, check: function (v) { return hashCode(v) === stored; } }).then(function (v) { return v === null ? false : done(); });
    return pin({ title: "🔒 Crée ton code enseignant", text: "4 chiffres (il servira aussi dans Relais Vitesse).", len: 4 }).then(function (v) {
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
  function full(e) { return (e.prenom + " " + e.nom).replace(/\s+/g, " ").trim(); }
  var TARGETS = [["esc", "Escalade"], ["rel", "Relais Vitesse"], ["ori", "OrienRun"], ["acro", "Acrosport"]];
  function toEsc(cl, L) {
    var a = []; try { a = JSON.parse(localStorage.getItem("escalade.cl") || "[]") || []; } catch (e) {}
    var c = a.filter(function (x) { return norm(x.nom) === norm(cl); })[0], n = 0;
    if (!c) { c = { id: "c" + Date.now().toString(36), nom: cl, el: [] }; a.push(c); }
    L.forEach(function (e) { var f = full(e); if (!c.el.some(function (x) { return nkey(x) === nkey(f); })) { c.el.push(f); n++; } });
    localStorage.setItem("escalade.cl", JSON.stringify(a)); return n;
  }
  function toRel(cl, L) {
    var D = null; try { D = JSON.parse(localStorage.getItem("relais-vitesse-data-v3") || "null"); } catch (e) {}
    if (!D || !D.classes) D = { classes: [], cur: null };
    var c = D.classes.filter(function (x) { return norm(x.name) === norm(cl); })[0], n = 0;
    if (!c) { c = { id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: cl, eleves: [], groupes: [], courses: [], lecons: [], curg: "all" }; D.classes.push(c); }
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
  async function importList() {
    if (!(await askCode())) return;
    var o = overlay('<div id="epsi"></div>'), box = o.querySelector("#epsi"), L = [], cl = "", sel = { esc: 1, rel: 1, ori: 1, acro: 0 };
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
            var n = t[0] === "esc" ? toEsc(cl, L) : t[0] === "rel" ? toRel(cl, L) : t[0] === "ori" ? await toOri(cl, L) : await toAcro(cl, L);
            res.push("✓ " + t[1] + " : " + (t[0] === "acro" ? n + " élève(s) dans la liste en ligne" : n + " élève(s) ajouté(s)"));
          } catch (x) { res.push("✕ " + t[1] + " : " + (x && x.message === "annulé" ? "annulé" : "échec (" + esc(x && x.message || "erreur") + ")")); }
        }
        box.innerHTML = "<h3>Classe « " + esc(cl) + " »</h3>" + res.map(function (r) { return '<p class="m" style="font-size:17px;color:#1B1E24">' + r + "</p>"; }).join("") +
          '<p class="m">Les tablettes reliées par Google Sheets recevront la liste à la prochaine ouverture de chaque application.</p><div class="epsd-act"><button class="p" data-x>Fermer</button></div>';
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
  window.EPSD = { list: all, active: activeOn, find: find, label: label, manage: manage, importList: importList, show: showList, sync: sync,
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
    var s = b.style, BG = "rgba(27,30,36,.78)";
    s.position = "fixed"; s.zIndex = "2147483000"; s.border = "0"; s.padding = "0"; s.cursor = "pointer";
    s.left = "calc(10px + env(safe-area-inset-left, 0px))"; s.bottom = "calc(10px + env(safe-area-inset-bottom, 0px))";
    s.width = "46px"; s.height = "46px"; s.borderRadius = "50%";
    s.display = "grid"; s.placeItems = "center";
    s.background = BG; s.color = "#fff";
    s.boxShadow = "0 2px 8px rgba(0,0,0,.25)";
    s.webkitTapHighlightColor = "transparent"; s.touchAction = "none"; s.userSelect = "none"; s.webkitUserSelect = "none"; s.webkitTouchCallout = "none";
    try { var p = JSON.parse(localStorage.getItem("eps.homeBtn") || "null"); if (p) { s.left = Math.min(p.x, innerWidth - 50) + "px"; s.top = Math.min(p.y, innerHeight - 50) + "px"; s.bottom = "auto"; } } catch (e) {}
    var tip = document.createElement("div");
    tip.textContent = "Maintiens pour toutes les applications…";
    var ts = tip.style; ts.position = "fixed"; ts.zIndex = "2147483001"; ts.background = "rgba(27,30,36,.92)"; ts.color = "#fff"; ts.font = "600 14px system-ui,sans-serif";
    ts.padding = "7px 12px"; ts.borderRadius = "10px"; ts.pointerEvents = "none"; ts.display = "none"; ts.whiteSpace = "nowrap";
    var down = false, drag = false, fired = false, sx = 0, sy = 0, ox = 0, oy = 0, t0 = 0, raf = 0, pid = null;
    function ring(f) { s.background = f > 0 ? "conic-gradient(#ffc93c " + (f * 360) + "deg, " + BG + " 0)" : BG; }
    function showTip() { var r = b.getBoundingClientRect(); ts.left = Math.min(r.right + 8, innerWidth - 270) + "px"; ts.top = (r.top + 10) + "px"; ts.display = "block"; }
    function stop() { cancelAnimationFrame(raf); raf = 0; ring(0); ts.display = "none"; }
    function tick() {
      if (!down || drag) return;
      var f = Math.min(1, (performance.now() - t0) / HOLD);
      ring(f); if (f > 0.12) showTip();
      if (f >= 1) { fired = true; stop(); location.href = BASE; return; }
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
    document.body.appendChild(b); document.body.appendChild(tip);
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
    applyTeach(); setInterval(applyTeach, 1000);
    pill = document.createElement("button"); pill.id = "epsd-pill"; pill.type = "button"; pill.onclick = showList;
    document.body.appendChild(pill);
    if (!HUB) addHome();
    draw();
    setTimeout(sync, 1500);
  }
  if (document.body) init(); else document.addEventListener("DOMContentLoaded", init);
})();
