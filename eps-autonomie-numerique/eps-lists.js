/* 🔢 Pavé de code enseignant, UNIQUE pour toutes les applications (accueil, applis, Escalade, Relais, Acrosport, OrienRun…) :
   window.epsPin({title, text, len, min, max, letters, check, noAuto}) → Promise<code|null>. Pas de clavier du système, aucun chiffre affiché.
   len:4 → validé tout seul au 4e chiffre ; avec check sans len, le code est essayé tout seul dès le 4e caractère (mot de passe plus long : « Valider »). */
window.epsPin = window.epsPinCommon = (function () {
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
  function add(c){if(busy)return;E.textContent="";if(v.length>=(len||o.max||40))return;v+=c;dots();if(len&&v.length===len)setTimeout(submit,120);else if(!len&&o.check&&!o.noAuto&&v.length===4){var tv=v;Promise.resolve().then(function(){return o.check(tv)}).then(function(r){if(r===true&&document.body.contains(el))close(tv)},function(){})}}/* code à 4 caractères : essayé tout seul, sans « Valider » */
  function bs(){if(busy)return;v=v.slice(0,-1);dots()}
  K.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;e.preventDefault();b.blur();if(b.dataset.k)add(b.dataset.k);else if(b.dataset.b)bs();else if(b.dataset.u){up=!up;keys()}else if(b.dataset.m){lt=!lt;keys()}});
  el.querySelector(".no").onclick=function(){close(null)};OK.onclick=submit;
  function kd(e){if(!document.body.contains(el))return;var k=e.key;if(/^[0-9]$/.test(k)||(o.letters&&/^[a-zA-Z@._!-]$/.test(k)))add(k);else if(k==="Backspace")bs();else if(k==="Enter")submit();else if(k==="Escape")close(null);else return;e.preventDefault();e.stopPropagation()}
  document.addEventListener("keydown",kd,true);
  if(o.err)E.textContent=o.err;keys();dots();document.body.appendChild(el)})}
return epsPin; })();
/* EPS – Autonomie et numérique : listes de classes communes à toutes les applications.
   Chargé de façon SYNCHRONE en haut de chaque application (avant son propre script), pour que
   les classes importées ailleurs (accueil, autre appli, autre tablette) soient déjà dans ses données à l'ouverture.

   Stockage commun : localStorage « eps.lists.v1 » = {items:{id:{id,nom,old,el:[« Prénom Nom »],st:{nkey:[prénom,nom]},rm:[nkey],ts}},
     pend, since, app, snap:{"app|classe":[nkey]}, skip:{"app|classe":1}}  (items partagés entre tablettes : enregistrements « lst|id »).
   - EPSL.apply(app) : ajoute dans l'appli les classes et élèves des listes communes (jamais de doublon) ;
     retire les élèves supprimés de la liste commune (rm) seulement s'ils n'ont encore aucune donnée.
   - EPSL.collect() (appelé par eps-home.js) : ce qui a été importé / ajouté / supprimé dans une appli remonte dans les listes communes.
   Applis : esc (Escalade), rel (Relais), vol (Volley), bad (Badminton), dan (Danse). OrienRun (IndexedDB) et Acrosport sont gérés à part. */
/* 🧪 SIMULATION (bac à sable, eps-home.js) : tant que « eps.sim.v1 » existe sur la tablette, rien ne part vers Google
   (script commun, Google Sheets d'Acrosport, scripts d'OrienRun et de CO-Éval) ; seules les demandes à Claude passent. */
(function () {
  var on = false; try { on = !!localStorage.getItem("eps.sim.v1"); } catch (e) {}
  window.EPS_SIM = on; if (!on) return;
  var G = /script\.google(usercontent)?\.com|docs\.google\.com|googleapis\.com/;
  function ok(u, body) { u = String(u || ""); if (!G.test(u)) return true;
    if (/[?&](ai|aiget)=/.test(u) && !/[?&](pull|bil)=/.test(u)) return true; /* Claude (lecture seule) */
    var b = typeof body === "string" ? body : ""; return /"(lc|aiReq)"\s*:/.test(b) && !/"(sync|bil)"\s*:/.test(b); }
  var F = window.fetch; if (F) window.fetch = function (u, o) { var s = typeof u === "string" ? u : (u && u.url) || ""; if (!ok(s, o && o.body)) return Promise.reject(new TypeError("Simulation : partage coupé")); return F.apply(this, arguments); };
  var XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this._simU = u; return XO.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function (b) { if (!ok(this._simU, b)) { var x = this; setTimeout(function () { try { x.dispatchEvent(new Event("error")); } catch (e) {} }, 0); return; } return XS.apply(this, arguments); };
  if (navigator.sendBeacon) { var SB = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = function (u, d) { return ok(u, d) ? SB(u, d) : true; }; }
  var D = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src");
  function blockS(el, v) { if (ok(v)) return false; setTimeout(function () { try { el.dispatchEvent(new Event("error")); } catch (e) {} }, 0); return true; }
  Object.defineProperty(HTMLScriptElement.prototype, "src", { get: D.get, set: function (v) { if (!blockS(this, v)) D.set.call(this, v); }, configurable: true });
  var SA = Element.prototype.setAttribute; Element.prototype.setAttribute = function (n, v) { if (this.tagName === "SCRIPT" && String(n).toLowerCase() === "src" && blockS(this, v)) return; return SA.apply(this, arguments); };
})();
/* « Vue élève » de l'espace enseignant (eps-shell.js) : l'appli est ouverte dans un cadre avec ?vue=eleve.
   Le mode enseignant y est ignoré (lecture du jeton enseignant neutralisée, aucune écriture), pour voir l'appli exactement comme un élève. */
(function () {
  if (!/[?&]vue=eleve\b/.test(location.search)) return;
  window.EPS_VUE_ELEVE = true;
  var T = { "eps.teach.until": 1, "tpw": 1, "acro.tpw": 1 };
  try {
    var g = Storage.prototype.getItem, st = Storage.prototype.setItem;
    Storage.prototype.getItem = function (k) { return T[k] ? null : g.call(this, k); };
    Storage.prototype.setItem = function (k, v) { if (T[k]) return; return st.call(this, k, v); };
  } catch (e) {}
})();
(function () {
  var KL = "eps.lists.v1";
  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function nkey(s) { return norm(s).split(" ").filter(Boolean).sort().join(" "); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function ld() { var v = jget(KL, null); if (!v || !v.items) v = { items: {}, pend: {}, since: 0, app: {} }; v.app = v.app || {}; v.pend = v.pend || {}; v.snap = v.snap || {}; v.skip = v.skip || {}; return v; }
  function clsId(n) { var h = 5381, t = String(n).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " "); for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return "n" + (h >>> 0).toString(36); }
  function h32v(t) { var h = 5381; t = String(t); for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function freeId(list, id) { return list.some(function (x) { return x.id === id; }) ? "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) : id; }
  function cap(w) { return w.toLowerCase().replace(/(^|[\s'-])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); }); }
  function split(t) {
    var w = String(t).replace(/\s+/g, " ").trim().split(" "); if (!w[0]) return { prenom: "", nom: "" };
    var up = function (x) { return x.length > 1 && x === x.toUpperCase() && x !== x.toLowerCase(); };
    var i = 0; while (i < w.length - 1 && up(w[i])) i++;
    if (i > 0) return { nom: w.slice(0, i).join(" "), prenom: cap(w.slice(i).join(" ")) };
    if (w.length === 1) return { nom: "", prenom: w[0] };
    return { prenom: w[0], nom: w.slice(1).join(" ") };
  }
  function full(e) { return ((e.prenom || "") + " " + (e.nom || "")).replace(/\s+/g, " ").trim(); }
  function items(v) { return Object.keys(v.items).map(function (k) { return v.items[k]; }).filter(function (o) { return o && !o.del && o.nom; }); }
  function people(o) { var st = o.st || {}; return (o.el || []).map(function (f) { var s = st[nkey(f)], p = s ? { prenom: s[0], nom: s[1] } : split(f); p.full = f; p.k = nkey(f); return p; }); }
  function same(o, n) { return norm(n) === norm(o.nom) || (o.old && norm(n) === norm(o.old)); }
  function isDefault(c, nm) { return nm === "Ma classe" && !(c.eleves || []).length; }
  function hasEv(e) { return e && e.ev && Object.keys(e.ev).length > 0; }
  function anyEv(c) { return (c.eleves || []).some(hasEv); }
  function nonEmpty(o) { return o && (Array.isArray(o) ? o.length : Object.keys(o).length) > 0; }
  function offFor(o, app) { return !!(o && (o.del || (o.off || []).indexOf(app) >= 0)); }

  /* description de chaque appli : où sont ses classes, comment lire / ajouter / retirer un élève */
  var APPS = {
    esc: { key: "escalade.cl", list: function (d) { return d || []; }, nom: "nom",
      names: function (c) { return (c.el || []).map(function (n) { return { full: n }; }); },
      make: function (L, o) { return { id: freeId(L, clsId(o.nom)), nom: o.nom, el: [] }; },
      add: function (c, p) { c.el.push(p.full); }, del: function (c, k) { c.el = c.el.filter(function (n) { return nkey(n) !== k; }); },
      data: function (c) { var R = jget("escalade.r", []) || []; return R.some(function (r) { return r && (r.cl || "") === c.nom; }); } },
    rel: { key: "relais-vitesse-data-v3", list: function (d) { return d && d.classes || []; }, nom: "name", init: function () { return { classes: [], cur: null }; },
      names: function (c) { return (c.eleves || []).map(function (e) { return { full: full(e), prenom: e.prenom, nom: e.nom }; }); },
      make: function (L, o) { return { id: freeId(L, clsId(o.nom)), name: o.nom, eleves: [], groupes: [], courses: [], lecons: [], curg: "all" }; },
      add: function (c, p) { var id = Math.max.apply(null, [-1].concat(c.eleves.map(function (e) { return +e.id || 0; }))) + 1;
        c.eleves.push({ id: id, nom: p.nom, prenom: p.prenom, ea: [null, null, null], ma: 0, el: [null, null, null], ml: 0, orig: { ea: [null, null, null], ma: 0, el: [null, null, null], ml: 0 }, imported: true }); },
      del: function (c, k) { c.eleves = c.eleves.filter(function (e) { if (nkey(full(e)) !== k) return true; return (e.ea || []).concat(e.el || []).some(function (x) { return x != null; }); }); },
      data: function (c) { return nonEmpty(c.courses) || nonEmpty(c.lecons) || (c.eleves || []).some(function (e) { return (e.ea || []).concat(e.el || []).some(function (x) { return x != null; }); }); } },
    vol: { key: "eps_volley_eval_v1", list: function (d) { return d && d.classes || []; }, nom: "nom", init: function () { return { classes: [], cur: 0 }; },
      names: function (c) { return (c.eleves || []).map(function (e) { return { full: full(e), prenom: e.prenom, nom: e.nom }; }); },
      make: function (L, o) { return { id: freeId(L, clsId(o.nom)), nom: o.nom, eleves: [] }; },
      add: function (c, p) { c.eleves.push({ id: "e" + h32v(p.k + "|" + c.id), nom: p.nom, prenom: p.prenom, ev: {}, choix: "4-4", statut: "", comment: "" }); },
      del: function (c, k) { c.eleves = c.eleves.filter(function (e) { return nkey(full(e)) !== k || hasEv(e); }); },
      data: function (c) { return anyEv(c); } },
    bad: { key: "eps_badminton_v1", list: function (d) { return d && d.classes || []; }, nom: "nom", init: function () { return { classes: [], cur: 0 }; },
      names: function (c) { return (c.eleves || []).map(function (e) { return { full: full(e), prenom: e.prenom, nom: e.nom }; }); },
      make: function (L, o, d) { return { id: freeId(L, clsId(o.nom)), nom: o.nom, voie: window.epsVoie ? window.epsVoie(o.nom) : (d && d.voie === "pro" ? "pro" : "gt"), eleves: [], matchs: {}, poules: {} }; },
      add: function (c, p) { c.eleves.push({ id: "e" + h32v(p.k + "|" + c.id), nom: p.nom, prenom: p.prenom, ev: {}, choix: "4-4", statut: "", comment: "", rout: {} }); },
      del: function (c, k) { c.eleves = c.eleves.filter(function (e) { return nkey(full(e)) !== k || hasEv(e); }); },
      data: function (c) { return anyEv(c) || nonEmpty(c.matchs) || nonEmpty(c.poules); } },
    dan: { key: "danse-eps-v1", list: function (d) { return d && d.classes || []; }, nom: "nom", init: function () { return { classes: [] }; },
      names: function (c) { return (c.eleves || []).map(function (e) { return { full: full(e), prenom: e.prenom, nom: e.nom }; }); },
      make: function (L, o) { return { id: freeId(L, clsId(o.nom)), nom: o.nom, eleves: [], groupes: [] }; },
      add: function (c, p) { c.eleves.push({ id: "d" + h32v(p.k + "|" + c.id), nom: p.nom, prenom: p.prenom, groupeId: "", ev: {}, comm: "", statut: "" }); },
      del: function (c, k) { c.eleves = c.eleves.filter(function (e) { return nkey(full(e)) !== k || hasEv(e) || e.groupeId; }); },
      data: function (c) { return anyEv(c) || nonEmpty(c.groupes); } }
  };

  /* listes communes → données de l'appli (à l'ouverture de l'appli) */
  function apply(app) {
    var A = APPS[app]; if (!A) return false;
    var v = ld(), its = items(v); if (!Object.keys(v.items || {}).length) return false; /* (une liste supprimée doit aussi être retirée, même si c'était la dernière) */
    var d = jget(A.key, null);
    if (d == null) { if (!A.init) d = []; else d = A.init(); }
    var L = A.list(d); if (!Array.isArray(L)) return false;
    if (d && !Array.isArray(d) && !d.classes) d.classes = L;
    var ch = false, vch = false;
    /* liste supprimée, ou classe non attribuée à cette activité : la classe est retirée de l'appli si elle n'y a encore aucune donnée */
    Object.keys(v.items).map(function (k) { return v.items[k]; }).filter(function (o) { return o && o.nom && offFor(o, app); }).forEach(function (o) {
      for (var i = L.length - 1; i >= 0; i--) { var c = L[i]; if (!same(o, c[A.nom])) continue;
        if (A.data && A.data(c) && !(o.demo && o.del)) continue; /* la classe de démonstration est retirée même avec des données */
        L.splice(i, 1); ch = true; delete v.snap[app + "|" + norm(c[A.nom])]; vch = true;
        if (d && !Array.isArray(d)) { if (typeof d.cur === "number" && d.cur >= L.length) d.cur = 0; if (d.classeId === c.id && L[0]) d.classeId = L[0].id; } }
    });
    its.forEach(function (o) {
      var sk = app + "|" + norm(o.nom); if (v.skip[sk] || offFor(o, app)) return;
      var c = L.filter(function (x) { return same(o, x[A.nom]); })[0];
      if (!c) { c = A.make(L, o, d); L.push(c); ch = true; }
      if (c[A.nom] !== o.nom) { c[A.nom] = o.nom; ch = true; }
      if (c.el) c.el = c.el || []; if (c.eleves) c.eleves = c.eleves || [];
      var have = {}; A.names(c).forEach(function (p) { have[nkey(p.full)] = 1; });
      people(o).forEach(function (p) { if (!p.k || have[p.k]) return; A.add(c, p); have[p.k] = 1; ch = true; });
      (o.rm || []).forEach(function (k) { if (!have[k]) return; var n0 = A.names(c).length; A.del(c, k); if (A.names(c).length !== n0) ch = true; });
    });
    /* classe vide par défaut (« Ma classe ») inutile dès qu'une vraie classe existe */
    if (ch && L.length > 1) { for (var i = L.length - 1; i >= 0; i--) if (isDefault(L[i], L[i][A.nom]) && L.length > 1) { L.splice(i, 1); if (d && typeof d.cur === "number" && d.cur >= L.length) d.cur = 0; } }
    if (ch) jset(A.key, d);
    if (vch) jset(KL, v);
    return ch;
  }

  /* données des applis de cette tablette → listes communes (import ou modification faits dans une appli) */
  function collect(extra) {
    var v = ld(), its = items(v), changed = [], now = Date.now();
    function itemFor(nom) { return its.filter(function (o) { return same(o, nom); })[0]; }
    function deadFor(nom) { return Object.keys(v.items).map(function (k) { return v.items[k]; }).filter(function (o) { return o && o.del && o.nom && same(o, nom); })[0]; }
    function scan(app, classes) {
      classes.forEach(function (c) {
        var nom = String(c.nom || "").replace(/\s+/g, " ").trim(); if (!nom || (nom === "Ma classe" && !c.ppl.length)) return;
        var sk = app + "|" + norm(nom), snap = v.snap[sk], o = itemFor(nom), loc = {}, dirty = false;
        if (!o) { var dd = deadFor(nom); if (dd) { if (snap || !c.ppl.length) { v.snap[sk] = c.ppl.map(function (p) { return nkey(p.full); }); return; } /* classe gardée pour ses données */
          o = dd; o.del = false; o.el = []; o.rm = []; o.st = {}; its.push(o); dirty = true; } } /* classe réimportée : la liste revient */
        if (o && offFor(o, app)) { v.snap[sk] = c.ppl.map(function (p) { return nkey(p.full); }); return; }
        c.ppl.forEach(function (p) { if (p.full) loc[nkey(p.full)] = p; });
        if (!o) { if (!c.ppl.length) { v.snap[sk] = []; return; }
          o = { id: clsId(nom), nom: nom, old: "", el: [], st: {}, rm: [], ts: now }; while (v.items[o.id] && !v.items[o.id].del && !same(v.items[o.id], nom)) o.id += "x"; its.push(o); v.items[o.id] = o; dirty = true; }
        o.el = o.el || []; o.st = o.st || {}; o.rm = o.rm || [];
        var inEl = {}; o.el.forEach(function (f) { inEl[nkey(f)] = 1; });
        var seen = {}; (snap || []).forEach(function (k) { seen[k] = 1; });
        Object.keys(loc).forEach(function (k) {
          var p = loc[k];
          if (!inEl[k] && !seen[k]) { o.el.push(p.full); inEl[k] = 1; o.rm = o.rm.filter(function (x) { return x !== k; }); dirty = true; }
          if (inEl[k] && p.prenom != null && !o.st[k] && (p.prenom || p.nom)) { o.st[k] = [p.prenom || "", p.nom || ""]; dirty = true; }
        });
        if (snap) Object.keys(seen).forEach(function (k) { if (inEl[k] && !loc[k]) { o.el = o.el.filter(function (f) { return nkey(f) !== k; }); if (o.rm.indexOf(k) < 0) o.rm.push(k); delete o.st[k]; dirty = true; } });
        v.snap[sk] = Object.keys(loc);
        if (dirty) { o.ts = now; if (changed.indexOf(o.id) < 0) changed.push(o.id); }
      });
    }
    Object.keys(APPS).forEach(function (app) {
      var A = APPS[app], d = jget(A.key, null); if (d == null) return;
      var L = A.list(d); if (!Array.isArray(L)) return;
      var seenCls = {};
      scan(app, L.map(function (c) { seenCls[norm(c[A.nom])] = 1; return { nom: c[A.nom], ppl: A.names(c) }; }));
      /* classe supprimée dans l'appli sur cette tablette : on ne la remet plus dans cette appli */
      Object.keys(v.snap).forEach(function (sk) { if (sk.indexOf(app + "|") === 0 && !seenCls[sk.slice(app.length + 1)]) { v.skip[sk] = 1; delete v.snap[sk]; } });
    });
    if (extra) Object.keys(extra).forEach(function (app) { scan(app, extra[app]); });
    if (changed.length) changed.forEach(function (id) { v.pend[id] = Math.max(now, (v.pend[id] || 0) + 1); v.app[id] = JSON.stringify(v.items[id]); });
    jset(KL, v);
    return changed.length;
  }

  var APP = (function () { var p = location.pathname; return /\/escalade\//.test(p) ? "esc" : /\/relais\//.test(p) ? "rel" : /\/volley\//.test(p) ? "vol" : /\/badminton\//.test(p) ? "bad" : /\/danse\//.test(p) ? "dan" : ""; })();
  try { if (APP) apply(APP); } catch (e) {}
  window.EPSL = { apply: apply, collect: collect, app: APP, items: function () { return items(ld()); }, people: people, norm: norm, nkey: nkey, KEY: KL };
  /* 🎓 voie de la classe : « gt » (générale et technologique) ou « pro » (professionnelle).
     Règle de l'enseignant : TGT, 2GT et 1GT = générale, toutes les autres classes = pro. Une classe peut être corrigée à la main
     (⚙ Réglages → Listes de classes : champ « voie » de la liste commune, qui l'emporte). Sert aux textes officiels (AFL / AFLP),
     aux barèmes CCF, à Claude pour les leçons, et aux applis qui ont un mode général / pro (Badminton, CCF). */
  window.epsVoie = function (cls) {
    try { var k = norm(cls), L = items(ld()); for (var i = 0; i < L.length; i++) if (norm(L[i].nom) === k && (L[i].voie === "pro" || L[i].voie === "gt")) return L[i].voie; } catch (e) {}
    var n = String(cls || "").replace(/[\s._-]+/g, "").toUpperCase();
    return /^(TGT|2GT|1GT)/.test(n) ? "gt" : "pro";
  };
  window.epsVoieNom = function (v) { return v === "gt" ? "Voie générale et technologique" : "Voie professionnelle"; };
})();
/* 🙋 pastille d'auto-positionnement commune (toutes les applis) : epsApChip({nom, date, crit:[{l, p, e}], r, m})
   p / e = degré du professeur / de l'élève (1, 2, 3, 4 ou ""), r = « ce que j'ai réussi », m = « ce que je dois améliorer ».
   Un appui ouvre la bulle (eps-home.js) sans ouvrir la fiche de l'élève. */
/* 🙋 appel du jour (eps.appel.v1, saisi dans 📡 Leçon en cours ou 📊 Évaluer la leçon, commun à toutes les applis) :
   epsAbsJour(élève ou nom, classe?) → true si l'élève est noté absent aujourd'hui. Élève = objet {prenom, nom} / {full} / chaîne.
   Classe par défaut : epsCurrentClass(). Sert aux outils d'équipes, poules, groupes, cordées propres à chaque appli. */
window.epsAbsJour = function (e, cls) {
  try {
    if (!cls) { var cc = typeof window.epsCurrentClass === "function" && window.epsCurrentClass(); cls = cc && cc.nom; }
    if (!cls || !e) return false;
    var nrm = function (s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); };
    var nk = function (s) { return nrm(s).split(" ").filter(Boolean).sort().join(" "); };
    var full = typeof e === "string" ? e : e.full || ((e.prenom || "") + " " + (e.nom || "")) || e.name || "";
    var d = new Date(), day = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    var V = JSON.parse(localStorage.getItem("eps.appel.v1") || "null"), o = V && V.items && V.items[nrm(cls).replace(/ /g, "") + "|" + day];
    if (!o || o.del) return false; var k = nk(full); return (o.abs || []).some(function (x) { return nk(x) === k; });
  } catch (x) { return false; }
};
/* 👥 groupes du jour formés dans 📡 Leçon en cours (eps-lecons.js, eps.live.<dossier>.v1 → v.grp) pour la classe, aujourd'hui seulement.
   → [["Prénom Nom", …], …] (présents qui pratiquent) ou null. Sert aux équipes / poules / groupes propres à chaque appli. */
window.epsGroupesJour = function (cls) {
  try {
    if (!cls) { var cc = typeof window.epsCurrentClass === "function" && window.epsCurrentClass(); cls = cc && cc.nom; }
    var m = location.pathname.match(/\/eps-autonomie-numerique\/([^\/]+)\//); if (!m || !cls) return null;
    var nrm = function (s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ""); };
    var V = JSON.parse(localStorage.getItem("eps.live." + m[1] + ".v1") || "null"), I = (V && V.items) || {}, t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var v = Object.keys(I).map(function (k) { return I[k]; }).filter(function (x) { return x && !x.del && nrm(x.cls) === nrm(cls) && x.grp && x.grp.g && x.grp.g.length && (x.grp.at || x.st || 0) >= t0.getTime(); })[0];
    return v ? v.grp.g.map(function (g) { return g.slice(); }) : null;
  } catch (e) { return null; }
};
/* retrouve un élève d'une appli à partir d'un nom complet (ordre des mots et accents indifférents) */
window.epsMatchNom = function (L, full, nameOf) { var nk = function (s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean).sort().join(" "); }, k = nk(full);
  return (L || []).filter(function (e) { return nk(nameOf ? nameOf(e) : typeof e === "string" ? e : ((e.prenom || "") + " " + (e.nom || ""))) === k; })[0] || null; };
/* 🧩 historique des groupes (affinités, eps-groupes.js) : toute appli qui forme des groupes / équipes / poules appelle
   epsGroupesLog(dossier, classe, [["Prénom Nom", …], …], source). eps.grphist.v1 (« gh| », synchronisé), une entrée par appli|classe|jour|source. */
window.epsGroupesLog = function (dir, cls, G, src) {
  try { if (!cls || !G || !G.length || window.EPS_VUE_ELEVE) return; G = G.map(function (g) { return (g || []).map(function (x) { return String(typeof x === "string" ? x : ((x && (x.full || ((x.prenom || "") + " " + (x.nom || "")))) || "")).replace(/\s+/g, " ").trim(); }).filter(Boolean); }).filter(function (g) { return g.length; });
    if (G.length < 2 && !(G[0] && G[0].length > 1)) return;
    var nk = function (s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }, d = new Date(), dy = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    var K = "eps.grphist.v1", V = JSON.parse(localStorage.getItem(K) || "null"); if (!V || !V.items) V = { items: {}, pend: {}, since: 0 }; V.pend = V.pend || {};
    var id = (dir || "app") + "|" + nk(cls) + "|" + dy + "|" + (src || "g"), old = V.items[id], sig = JSON.stringify(G.map(function (g) { return g.slice().sort(); }).sort());
    if (old && JSON.stringify((old.g || []).map(function (g) { return g.slice().sort(); }).sort()) === sig) return;
    var u = Math.max(Date.now(), ((old && old.u) || 0) + 1); V.items[id] = { id: id, app: dir, cls: cls, day: dy, src: src || "g", g: G, at: Date.now(), u: u }; V.pend[id] = u;
    localStorage.setItem(K, JSON.stringify(V)); try { window.EPSD && EPSD.syncSoon && EPSD.syncSoon(); } catch (e) {}
  } catch (e) {}
};
window.epsAbsJourN = function (L, cls) { return (L || []).filter(function (e) { return window.epsAbsJour(e, cls); }).length; };
window.epsApChip = function (o) {
  if (!o) return "";
  var j = JSON.stringify(o).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return '<span class="eps-apc" role="button" tabindex="0" title="Auto-positionnement de l\'élève : toucher pour voir" data-eps-ap="' + j + '" style="display:inline-flex;align-items:center;gap:2px;margin-left:6px;padding:1px 7px;border-radius:999px;background:#FFF1BF;border:1px solid #E9CF6A;color:#6b4e00;font:700 13px system-ui,sans-serif;cursor:pointer;vertical-align:middle">🙋' + (o.r || o.m ? "💬" : "") + "</span>";
};
/* 🎛 paramètres de l'appli (commun) : chaque appli déclare ses valeurs modifiables, l'enseignant les change dans ⚙ Réglages → 🎛 Paramètres
   (eps-shell.js) ; valeurs dans eps.param.v1 (« <dossier>|<id> »), synchronisées par eps-home.js (préfixe « pa| »).
   const MSGS = EPSP.p({id, sec, label, type:'list'|'text'|'number', def, fixed, aide}) → valeur modifiée ou défaut. */
(function () {
  var m = location.pathname.match(/eps-autonomie-numerique\/([a-z0-9-]+)\//), APP = m ? m[1] : "";
  function V() { try { return JSON.parse(localStorage.getItem("eps.param.v1") || "null") || { items: {} }; } catch (e) { return { items: {} }; } }
  /* déclarations gardées sur l'appareil (eps.paramdefs.v1) : la console ordinateur affiche les paramètres de toutes les applis */
  var dT = 0; function saveDefs() { if (!APP || window.EPS_VUE_ELEVE) return; clearTimeout(dT); dT = setTimeout(function () { try { var A = JSON.parse(localStorage.getItem("eps.paramdefs.v1") || "{}") || {}; A[APP] = { at: Date.now(), defs: P.defs.map(function (d) { return { id: d.id, sec: d.sec, label: d.label, type: d.type, def: d.def, fixed: d.fixed, aide: d.aide }; }) }; localStorage.setItem("eps.paramdefs.v1", JSON.stringify(A)); } catch (e) {} }, 300); }
  var P = window.EPSP = { app: APP, defs: [],
    reg: function (d) { if (!P.defs.some(function (x) { return x.id === d.id; })) { P.defs.push(d); saveDefs(); } },
    get: function (id, def) { var o = (V().items || {})[APP + "|" + id]; if (!o || o.del || o.v == null) return def;
      if (Array.isArray(def) && !Array.isArray(o.v)) return def;
      if (typeof def === "number" && (typeof o.v !== "number" || !isFinite(o.v))) return def; /* valeur enregistrée inutilisable : valeur d'origine */
      return o.v; },
    /* enregistre une valeur depuis un écran de l'appli (cases à cocher, curseur) : même magasin que 🎛 Paramètres, synchronisé ; null = revenir à la valeur d'origine */
    set: function (id, val) { var S; try { S = JSON.parse(localStorage.getItem("eps.param.v1") || "null"); } catch (e) {} S = S && S.items && typeof S.items === "object" ? S : { items: {}, pend: {}, since: 0 }; S.pend = S.pend && typeof S.pend === "object" ? S.pend : {};
      var k = APP + "|" + id, o = S.items[k], u = Math.max(Date.now(), ((o && o.u) || 0) + 1); S.items[k] = val == null ? { id: k, del: 1, u: u } : { id: k, v: val, u: u }; S.pend[k] = u;
      try { localStorage.setItem("eps.param.v1", JSON.stringify(S)); } catch (e) {} try { if (window.EPSD && EPSD.syncSoon) EPSD.syncSoon(); } catch (e) {} },
    p: function (d) { P.reg(d); var v = P.get(d.id, d.def); if (d.fixed && Array.isArray(v)) { v = v.slice(0, d.fixed); while (v.length < d.fixed) v.push(d.def[v.length]); } return v; } };
})();

/* 🖥 Grand écran de la console ordinateur (27/11/2026, demande de l'enseignant : « la console n'est pas adaptée à l'écran d'ordinateur,
   elle est de la taille d'une tablette »). Une appli ouverte DANS la console (cadre …/?console=…) porte html.eps-console et
   data-eps-dir="<dossier>" : ses blocs prévus pour une tablette (1000 à 1100 px) s'élargissent jusqu'à --epsw. Rien ne change sur
   tablette ni quand l'appli est ouverte seule. Toute nouvelle appli ajoute ici son bloc principal s'il a une largeur maximale. */
(function () {
  var inC = /[?&]console=/.test(location.search);
  try { if (!inC && window.parent !== window && /\/console\/(index\.html)?$/.test(window.parent.location.pathname)) inC = true; } catch (e) {}
  /* 🔧 Console = mode de préparation (27/11/2026, demande de l'enseignant : « mode de configuration, je n'ai pas besoin d'outils pour
     rappeler mes élèves ») : dans la console et dans les applis qu'elle ouvre, les outils de leçon en direct tournés vers les élèves
     (📣 signal / message à tous, 📋 planche tactique à envoyer) sont masqués : html.eps-nolive + window.EPS_NOLIVE.
     Réglage « Outils de leçon en direct » de 🎨 Personnaliser la console (eps.console.live = "1") pour les retrouver.
     Tout nouveau bouton de ce type porte data-sig, data-plan ou data-nolive (ou teste window.EPS_NOLIVE). */
  var isC = /\/console\/(index\.html)?$/.test(location.pathname);
  if (inC || isC) { var live = false; try { live = localStorage.getItem("eps.console.live") === "1"; } catch (e) {}
    if (!live) { window.EPS_NOLIVE = true; document.documentElement.classList.add("eps-nolive"); var sn = document.createElement("style"); sn.id = "eps-nolive-css";
      sn.textContent = 'html.eps-nolive #eps-sigb,html.eps-nolive [data-sig],html.eps-nolive [data-plan],html.eps-nolive [data-nolive],html.eps-nolive [data-act="planBar"],html.eps-nolive button[onclick="EPSD.signal()"]{display:none!important}';
      (document.head || document.documentElement).appendChild(sn); } }
  if (!inC) return;
  var H = document.documentElement, m = location.pathname.match(/eps-autonomie-numerique\/([a-z0-9-]+)\//);
  H.classList.add("eps-console"); if (m) H.setAttribute("data-eps-dir", m[1]);
  var C = "html.eps-console", st = document.createElement("style"); st.id = "eps-console-css";
  st.textContent = "@media (min-width:1200px){" + C + "{--epsw:1560px}" +
    /* blocs communs : barre d'actions, panneaux d'onglet, grille d'évaluation, écran de classe */
    [".epst-acts", ".epst-panel", ".epse-in", ".epsg-in", ".lc-in",
    /* blocs principaux des applis */
    "[data-eps-dir=escalade] main#m", "[data-eps-dir=relais] .wrap", "[data-eps-dir=volley] main", "[data-eps-dir=badminton] main", "[data-eps-dir=danse] main#view",
    "[data-eps-dir=acrosport] section#home", "[data-eps-dir=orientation] #home", "[data-eps-dir=crosstraining] .app", "[data-eps-dir=crosstraining] #onglets.in",
    "[data-eps-dir=basket] main#vue", "[data-eps-dir=step] .app", "[data-eps-dir=step] #onglets.in", "[data-eps-dir=ccf] .wrap", "[data-eps-dir=co-eval] main#app",
    "[data-eps-dir=edt] .wrap", "[data-eps-dir=appel-as] .wrap", "[data-eps-dir=course-orientation] .wrap", "[data-eps-dir=course-orientation] .in",
    "[data-eps-dir=referentiel] .wrap", "[data-eps-dir=referentiel] #nav"].map(function (s) { return C + (s.charAt(0) === "[" ? s : " " + s); }).join(",") +
    "{max-width:min(var(--epsw),100%)!important}}" +
    /* la console sert à configurer (demande de l'enseignant, 27/11/2026) : rien du mode élève n'y apparaît. Les boutons qui font passer la
       tablette en mode élève (quitter le mode prof, verrouiller, mode élève) et le bouton élève « ✋ Enseignant » y sont masqués (pas la pastille « ✋ N » des appels reçus) ; l'élève se voit
       seulement dans l'onglet 👁 Vue élève (cadre ?vue=eleve, qui ne porte pas html.eps-console). */
    C + ' button[onclick="quitT()"],' + C + ' button[onclick="toTerrain()"],' + C + ' button[onclick="lockApp()"],' + C + " #bLock," + C + ' #eps-callb:not([title="Appels des élèves"]),' + C + " #profHome{display:none!important}"; /* la pastille « ✋ N » des appels reçus (côté enseignant) reste */
  /* une seule barre dans la console (27/11/2026) : la barre de l'appli reçoit aussi les boutons de la console, elle reste sur une ligne */
  st.textContent += "@media (min-width:1100px){" + C + "[data-eps-dir=badminton] header .top{flex-wrap:nowrap;gap:6px}" + C + "[data-eps-dir=badminton] header .top h1{min-width:0;flex:0 1 auto;margin-right:auto;white-space:nowrap;overflow:hidden}" + C + "[data-eps-dir=badminton] header .top h1 small{display:none}" + C + "[data-eps-dir=badminton] header .top select{min-width:0;max-width:140px}" +
    C + "[data-eps-dir=volley] header h1{white-space:nowrap}" + C + " [data-eps-bar] .epsb{padding:0 9px!important}}";
  window.EPS_CONSOLE = true;
  (document.head || H).appendChild(st);
})();
