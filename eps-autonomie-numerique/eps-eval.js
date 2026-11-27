/* EPS – Autonomie et numérique : évaluation commune au format Danse / Volley-ball.
   - Grille par degrés (4 degrés par critère, curseur dans le degré), note /20.
   - Auto-positionnement de l'élève : QR code + lien personnel sur sa fiche (#auto=<jeton>), envoi chiffré au dépôt
     (script Google de Danse, clé « dan|<préfixe>… »), code de repli à coller, ou tablette passée en mode élève.
   - Fiches PDF (pdf-lib) : une page paysage par élève, récapitulatif de classe, .zip.
   Deux façons de l'utiliser :
   1) EPSE.create(A) avec un adaptateur A fourni par une appli qui a déjà son évaluation (Badminton…) ;
   2) EPSE.store(o) : évaluation complète gérée ici (données « eps.eval.<appli>.v1 », synchronisées entre tablettes
      par eps-home.js), avec un écran Évaluation ouvert par EPSE.open() (Escalade, Acrosport, OrienRun…).
   Les bibliothèques (vendor/pdf-lib.min.js, jszip.min.js, qrlib.js) sont chargées seulement au premier export. */
(function () {
  var SRC = (document.currentScript && document.currentScript.src) || "", BASE = SRC.replace(/eps-eval\.js.*$/, "");
  var DCOL = ["#d64545", "#f0a030", "#3aa0d8", "#2e9e5b"], DTINT = ["#fbe3e3", "#fdf0d9", "#e1f0f9", "#def1e5"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nk(s) { return String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " "); }
  function nkey(s) { return nk(s).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean).sort().join(" "); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function plusJours(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function dIso(s) { return s ? new Date(s + "T12:00").toLocaleDateString("fr-FR") : ""; }
  function dateFR() { return new Date().toLocaleDateString("fr-FR"); }
  function fr(x) { return x == null || isNaN(x) ? "—" : String(Math.round(x * 100) / 100).replace(".", ","); }
  function safe(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, ""); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function h32(t) { var h = 5381; t = String(t); for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function toast(m) { var t = document.createElement("div"); t.className = "epse-toast"; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
  function download(blob, name) { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  function b64e(str) { var b = new TextEncoder().encode(str), s = ""; b.forEach(function (x) { s += String.fromCharCode(x); }); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64d(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); }
  var TE8 = new TextEncoder();
  function u8b64(u8) { var x = ""; u8.forEach(function (c) { x += String.fromCharCode(c); }); return btoa(x).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64u8(t) { t = t.replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; return Uint8Array.from(atob(t), function (c) { return c.charCodeAt(0); }); }
  function cryptoOk() { return !!(window.crypto && crypto.subtle); }
  async function hmac(cle, msg) { var k = await crypto.subtle.importKey("raw", TE8.encode(cle), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return new Uint8Array(await crypto.subtle.sign("HMAC", k, TE8.encode(msg))); }
  async function aes(k) { return crypto.subtle.importKey("raw", b64u8(k), "AES-GCM", false, ["encrypt", "decrypt"]); }
  async function chiffrer(k, obj) { var iv = crypto.getRandomValues(new Uint8Array(12)), ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, await aes(k), TE8.encode(JSON.stringify(obj)))), o = new Uint8Array(12 + ct.length); o.set(iv); o.set(ct, 12); return u8b64(o); }
  async function dechiffrer(k, x) { var b = b64u8(x), pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, await aes(k), b.slice(12)); return JSON.parse(new TextDecoder().decode(pt)); }
  function sidDe(url) { var m = /^https:\/\/script\.google\.com\/macros\/s\/([^/]+)\/exec$/.exec(url || ""); return m ? m[1] : ""; }
  function urlScript(sid) { return /^https:\/\//.test(sid) ? sid : "https://script.google.com/macros/s/" + sid + "/exec"; }
  function jsonpGet(url, params) { return new Promise(function (res) { var cb = "epseCb" + Date.now() + Math.floor(Math.random() * 1e4), sc = document.createElement("script"), t;
    var fin = function (d) { clearTimeout(t); try { delete window[cb]; } catch (e) {} sc.remove(); res(d); }; window[cb] = fin; sc.onerror = function () { fin(null); }; t = setTimeout(function () { fin(null); }, 15000);
    params.callback = cb; sc.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&"); document.head.appendChild(sc); }); }
  function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function loadJs(src) { return new Promise(function (ok, ko) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }
  async function libs() { if (!window.PDFLib) await loadJs(BASE + "vendor/pdf-lib.min.js"); if (!window.JSZip) await loadJs(BASE + "vendor/jszip.min.js"); if (!window.QRLib) await loadJs(BASE + "vendor/qrlib.js"); }
  function posLbl(d, pos) { return pos < .2 ? "au début du niveau" : pos < .45 ? "plutôt au début" : pos < .7 ? "au milieu" : pos < .9 ? "bien avancé" : d === 3 ? "au top" : "presque au niveau suivant"; }
  /* envoi automatique : script Google de Danse (réglé dans Danse, ou propre à l'appli) */
  function envoiDanse() { var R = ((jget("danse-eps-v1", {}) || {}).reglages) || {}; return { url: (R.envoiUrl || "").trim(), key: (R.envoiCle || "").trim() }; }

  /* ---------------- styles communs (charte) ---------------- */
  function css(col) {
    if (document.getElementById("epse-css")) return;
    var st = document.createElement("style"); st.id = "epse-css";
    st.textContent = [
      ".epse-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#14171C;color:#fff;padding:12px 18px;border-radius:12px;font:700 15px system-ui,sans-serif;z-index:2147483600;box-shadow:0 8px 24px #0004}",
      ".epse{position:fixed;inset:0;z-index:2147482000;background:#F5F3EE;overflow:auto;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#14171C;-webkit-overflow-scrolling:touch}",
      ".epse-bar{position:sticky;top:0;z-index:2;background:#14171C;color:#fff;box-shadow:inset 0 -4px 0 var(--app);padding:12px 18px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}",
      ".epse-bar .ei{width:36px;height:36px;border-radius:10px;background:var(--app);display:grid;place-items:center;flex:none}.epse-bar .ei svg{width:22px;height:22px}",
      ".epse-bar b{font-size:20px;font-weight:800}.epse-bar small{color:#A9AEB8;font-weight:600;font-size:14px;flex:1}",
      ".epse-bar button,.epse-bar select{height:40px;border-radius:10px;border:1.5px solid #3A3F47;background:transparent;color:#D5D8DE;font:700 14px system-ui,sans-serif;padding:0 12px}",
      ".epse-bar select option{color:#14171C}",
      ".epse-bar select,.epse-bar button{width:auto!important;max-width:45%;flex:none;margin:0}",
      ".epse-tabs{display:flex;gap:6px;padding:0 18px;background:#14171C}.epse-tabs button{border:0;background:transparent;color:#B9BEC7;font:700 15px system-ui,sans-serif;padding:10px 16px;border-radius:10px 10px 0 0}.epse-tabs button.on{background:var(--app);color:#fff}",
      ".epse-in{max-width:1100px;margin:0 auto;padding:16px 18px 60px}",
      ".epse-card input[type=checkbox],.epse input[type=checkbox]{width:22px!important;height:22px!important;min-height:0!important;margin:0 6px 0 0;vertical-align:middle;accent-color:var(--app)}.epse-card label,.epse-sub label{display:inline-flex;align-items:center;gap:6px;width:auto;font-weight:700}.epse-card input[type=date]{width:auto!important;display:inline-block}",
      ".epse-host .epse-in{padding:8px 0 40px}.epse-sub{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 6px}.epse-sub button{height:40px;border-radius:10px;border:2px solid #E2DDD2;background:#fff;font:800 14px system-ui,sans-serif;padding:0 14px;cursor:pointer}.epse-sub button.on{background:var(--app);border-color:var(--app);color:#fff}.epse-sub select{height:40px;border-radius:10px;border:2px solid #E2DDD2;padding:0 10px;font:700 14px system-ui,sans-serif;margin-left:6px}",
      ".epse-card{background:#fff;border:1px solid #E6E1D6;border-radius:16px;padding:14px 16px;margin:0 0 14px;box-shadow:0 1px 0 #E6E1D6}",
      ".epse-card h2{margin:0 0 10px;font-size:18px}.epse-mut{color:#6A6F78;font-size:14px}",
      ".epse-btn{height:44px;border-radius:12px;border:2px solid #E2DDD2;background:#FBFAF7;font:800 15px system-ui,sans-serif;color:#14171C;padding:0 14px;cursor:pointer}",
      ".epse-btn.p{background:var(--app);border-color:var(--app);color:#fff}.epse-btn:disabled{opacity:.45}",
      ".epse-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0}",
      ".epse-chips{display:flex;flex-wrap:wrap;gap:8px}.epse-chip{min-height:44px;padding:6px 12px;border-radius:12px;border:2px solid #E6E1D6;background:#fff;font:700 15px system-ui,sans-serif;text-align:left;cursor:pointer}",
      ".epse-chip.ok{border-color:#2e9e5b;background:#EEF8F1}.epse-chip small{display:block;color:#6A6F78;font-weight:600;font-size:12px}",
      ".epse-crit{border:1px solid #E6E1D6;border-radius:14px;padding:10px;margin:0 0 12px;background:#fff}",
      ".epse-ch{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;margin:0 0 8px}.epse-ch b{font-size:16px}.epse-ch span{color:var(--app);font-weight:800;font-size:13px}",
      ".epse-degs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}@media(max-width:700px){.epse-degs{grid-template-columns:1fr 1fr}}",
      ".epse-deg{display:flex;flex-direction:column;justify-content:flex-start;border:2px solid #E6E1D6;border-radius:12px;background:#fff;padding:8px;text-align:left;font:500 13px/1.35 system-ui,sans-serif;color:#14171C;cursor:pointer;min-height:70px}",
      ".epse-deg b{display:block;font-size:13px;color:var(--dc);margin-bottom:3px}.epse-deg.on{border-color:var(--dc);background:var(--dt)}",
      ".epse-deg .me{display:inline-block;margin-left:6px;border:1.5px solid var(--app);color:var(--app);border-radius:6px;padding:0 5px;font-size:11px;font-weight:800}",
      ".epse-intra{display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap}.epse-intra input[type=range]{flex:1;min-width:180px;accent-color:var(--dc)}",
      ".epse-prog{display:flex;gap:6px;align-items:center;margin:4px 0 14px}.epse-prog i{flex:1;height:8px;border-radius:4px;background:#E6E1D6}.epse-prog i.ok{background:var(--app)}.epse-prog i.on{background:var(--app);opacity:.45}.epse-prog span{flex:none;font-weight:800;color:#6A6F78;margin-left:8px}",
      ".epse-nav{display:flex;justify-content:space-between;gap:12px;margin:16px 0 40px}.epse-nav .epse-btn{height:54px;font-size:17px;min-width:160px}.epse-nav .epse-btn[disabled]{opacity:.45}",
      ".epse-ri{display:flex;justify-content:space-between;gap:12px;width:100%;text-align:left;background:#fff;border:2px solid #E6E1D6;border-left:8px solid var(--dc);border-radius:12px;padding:12px 14px;margin:8px 0;font:inherit;cursor:pointer}.epse-ri b{color:var(--dc);white-space:nowrap}",
      ".epse textarea,.epse input[type=text],.epse input[type=date],.epse input[type=password],.epse select.f{width:100%;border:2px solid #E6E1D6;border-radius:12px;padding:10px 12px;font:500 15px system-ui,sans-serif;background:#FBFAF7}",
      ".epse input[type=date]{width:auto}",
      ".epse table,.epse-card table{border-collapse:collapse;width:100%;font-size:14px}.epse th,.epse td,.epse-card th,.epse-card td{border-bottom:1px solid #EEE9DF;padding:7px 8px;text-align:center}.epse th.l,.epse td.l,.epse-card th.l,.epse-card td.l{text-align:left}",
      ".epse-d{display:inline-block;min-width:28px;padding:2px 6px;border-radius:7px;color:#fff;font-weight:800;font-size:12px}.epse-d.e{background:#fff;border:1.8px solid;}",
      ".epse-note{font-size:28px;font-weight:900}",
      ".epse-ap .ap-in{max-width:820px;margin:0 auto;padding:16px 16px 40px}.epse-ap h1{font-size:22px;margin:0 0 8px}",
      ".epse-code{font:700 14px ui-monospace,monospace;word-break:break-all;background:#F1EFE8;border-radius:10px;padding:10px;margin:10px 0}",
      ".epse-spin{width:42px;height:42px;border-radius:50%;border:5px solid #E6E1D6;border-top-color:var(--app);animation:epsespin 1s linear infinite;margin:10px auto}@keyframes epsespin{to{transform:rotate(360deg)}}",
      "body.epse-lock>*:not(.epse):not(.epse-toast):not(script){display:none!important}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* =====================================================================
     Moteur : auto-positionnement + PDF pour un adaptateur A
     A = { app, nom, ca, color, icon, pfx (2 lettres), code ('BAD1'), url,
           grid() → {criteres:[{id, afl, nom, but, nomEl, butEl, desc:[4], descEl:[4], max}], degres:[4], degresEl:[4]},
           classes() → [{nom, eleves:[E]}], name(E) → {nom, prenom},
           prof(cr, E) → {d, pos, pts} | null,  note(E) → nombre | null,  absent(E) → '' | 'ABS' | 'DISP',
           comment(E), extras(c, E) → [texte], getAp(E), setAp(E, ap) (puis enregistre),
           settings() → {apOuvert, apJusqua, envoiUrl, envoiCle}, setSettings(o),
           isTeacher(), unlock() → Promise, changed() (réaffichage) }
     ===================================================================== */
  /* ================= 👥 Coévaluation entre élèves (commune à toutes les activités, Volley et Danse compris) =================
     L'enseignant crée SA grille de coévaluation par activité (ou choisit de reprendre la grille d'évaluation) : elle ne dépend pas de l'évaluation finale.
     Magasin eps.coeval.v1 (cv|), synchronisé :
       g|<appli>                    {k:"g", app, on:0|1, src:"own"|"eval", crit:[{id:"k…", nom, desc:["","","",""]}]}   grille et ouverture aux élèves
       <appli>|<classe>|<clé élève> {k:"co", app, cls, n, by:{<clé observateur>:{n, g:"own"|"eval", ev:{critère:{d, pos}}, t}}}   observations reçues
     Côté élève : ressource commune « 👥 J'observe un camarade » de l'écran « Choisis ta classe » (seulement si la grille est ouverte) : classe, « Je suis »,
     « J'observe », un critère par écran, récapitulatif. Côté enseignant : EPSE.coeval.edit({app, nom, color, cls}) (action de l'onglet Évaluation, carte 🙋).
     Niveaux par défaut réglables (paramètre co_niveaux). Lu aussi par le référentiel (eps-ref.js). */
  var KCO = "eps.coeval.v1", CODIR = { esc: "escalade", rel: "relais", vol: "volley", bad: "badminton", dan: "danse", acro: "acrosport", ori: "orientation", ct: "crosstraining", bk: "basket", step: "step" };
  function coLd() { var v = jget(KCO, null); if (!v || !v.items || typeof v.items !== "object" || Array.isArray(v.items)) v = { items: {}, pend: {}, since: 0 }; v.pend = v.pend && typeof v.pend === "object" ? v.pend : {}; return v; }
  function coPut(o) { var V = coLd(), old = V.items[o.id]; o.u = Math.max(Date.now(), ((old && old.u) || 0) + 1); V.items[o.id] = o; V.pend[o.id] = o.u; jset(KCO, V); try { if (window.EPSD && EPSD.syncSoon) EPSD.syncSoon(); } catch (e) {} }
  function coId(app, cls, full, obs) { return app + "|" + nk(cls) + "|" + nkey(full) + (obs ? "|" + nkey(obs) : ""); }
  /* toutes les observations d'un élève. Une fiche par couple observé / observateur (deux tablettes ne s'écrasent pas) ; les anciennes fiches (plusieurs observateurs dans « by ») sont lues aussi. */
  function coGet(app, cls, full, gid) { var I = coLd().items, B = {}, k1 = nk(cls), k2 = nkey(full), n = 0; Object.keys(I).forEach(function (id) { var o = I[id]; if (!o || o.del || o.k !== "co" || o.app !== app || !o.by || typeof o.by !== "object" || nk(o.cls) !== k1 || nkey(o.n) !== k2) return; Object.keys(o.by).forEach(function (k) { var x = o.by[k]; if (!x || !x.ev || typeof x.ev !== "object" || (gid != null && (x.gr || "") !== gid)) return; k += "|" + (x.gr || ""); if (!B[k] || (+x.t || 0) >= (+B[k].t || 0)) B[k] = x; }); }); Object.keys(B).forEach(function () { n++; }); return n ? { n: full, by: B } : null; }
  var COFAM = [["Moteur", "#1D4ED8"], ["Méthodologique", "#B45309"], ["Social", "#1E6B3A"]], COMAXC = 12, COMAXO = 6;
  /* 💡 Idées de thématiques par activité (propositions rédigées par Claude, ajoutées seulement après confirmation, puis entièrement modifiables).
     [titre, [[famille : 0 = critère de réalisation (ce qu'il y a à faire pour faire), 1 = critère de réussite (ce qu'il y a à faire pour être en réussite), critère, [observables]]…]] */
  var COIDFAM = [["Critères de réalisation", "#1D4ED8"], ["Critères de réussite", "#1E6B3A"]];
  var COIDEES = {
    bad: [["Le smash", [[0, "Il / elle se place de profil, sous le volant", ["Épaules de profil", "Appui sur la jambe arrière"]], [0, "Il / elle frappe haut, bras tendu, devant lui / elle", ["Coude haut avant la frappe", "Frappe au-dessus de la tête"]], [0, "Il / elle accélère la raquette vers le bas", []], [1, "Le volant descend vite et tombe dans le terrain adverse", []], [1, "Le smash fait gagner le point ou met l'adversaire en difficulté", []]]],
      ["Le dégagé", [[0, "Il / elle se place de profil, sous le volant", []], [0, "Il / elle frappe haut, avec une trajectoire qui monte", ["Bras tendu à la frappe", "Le volant passe haut au-dessus de l'adversaire"]], [1, "Le volant arrive dans le fond du terrain adverse", []], [1, "L'adversaire doit reculer pour le jouer", []]]],
      ["L'amorti", [[0, "Il / elle se prépare comme pour un dégagé", []], [0, "Il / elle ralentit son geste au moment de la frappe", []], [1, "Le volant tombe près du filet", []], [1, "L'adversaire arrive en retard sur le volant", []]]],
      ["Construire le point", [[0, "Il / elle se replace au centre après chaque frappe", []], [0, "Il / elle varie ses frappes : long, court, droite, gauche", ["Joue long", "Joue court", "Joue sur les côtés"]], [1, "L'adversaire se déplace beaucoup", []], [1, "Il / elle finit le point quand l'adversaire est en retard", []]]]],
    vol: [["La réception en manchette", [[0, "Il / elle se place derrière le ballon, jambes fléchies", []], [0, "Il / elle joint les bras tendus et touche le ballon avec les avant-bras", []], [0, "Il / elle oriente ses épaules vers le passeur", []], [1, "Le ballon monte haut vers la zone du passeur", []], [1, "Le passeur peut jouer sans se déplacer de plus d'un pas", []]]],
      ["La passe haute", [[0, "Il / elle se place sous le ballon, mains au-dessus du front", []], [0, "Il / elle pousse avec les jambes et les bras", []], [1, "Le ballon monte haut, près du filet", []], [1, "Le partenaire peut attaquer le ballon", []]]],
      ["L'attaque", [[0, "Il / elle prend de l'élan et saute", []], [0, "Il / elle frappe le ballon bras tendu, au plus haut", []], [1, "Le ballon tombe dans le camp adverse", []], [1, "L'attaque met l'équipe adverse en difficulté", []]]],
      ["Le service", [[0, "Il / elle se place face à la cible, ballon tenu devant", []], [0, "Il / elle frappe le ballon avec la paume, bras tendu", []], [1, "Le ballon passe le filet et tombe dans le terrain", []], [1, "Le service gêne la réception adverse", []]]]],
    bk: [["Le tir en course", [[0, "Il / elle enchaîne deux appuis sans marcher", ["Premier appui long", "Deuxième appui vers le haut"]], [0, "Il / elle monte le genou et tend le bras vers le panier", []], [0, "Il / elle vise le carré de la planche", []], [1, "Le panier est marqué, ou le ballon touche le carré", []]]],
      ["Le tir à l'arrêt", [[0, "Il / elle est équilibré(e), pieds orientés vers le panier", []], [0, "Il / elle place le coude sous le ballon", []], [0, "Il / elle finit bras tendu, poignet cassé", []], [1, "Le panier est marqué, ou le ballon touche le cercle", []]]],
      ["Se démarquer", [[0, "Il / elle se déplace vers un espace libre", []], [0, "Il / elle montre sa main pour demander le ballon", []], [1, "Il / elle reçoit le ballon sans défenseur près de lui / elle", []], [1, "L'équipe avance vers le panier grâce à son déplacement", []]]]],
    esc: [["La vérification avant de grimper", [[0, "Il / elle contrôle le nœud de huit et le nœud d'arrêt", []], [0, "Il / elle contrôle le baudrier du partenaire : serré, sangles en place", []], [0, "Il / elle contrôle le frein et le mousqueton vissé", []], [1, "Le grimpeur ne part qu'après la vérification à deux", []]]],
      ["L'assurage en moulinette", [[0, "Il / elle garde toujours une main sous le frein", []], [0, "Il / elle avale la corde au fur et à mesure", []], [0, "Il / elle regarde son grimpeur", []], [0, "Il / elle fait descendre lentement et régulièrement", []], [1, "La corde reste tendue, sans tirer le grimpeur", []]]],
      ["Grimper avec les jambes", [[0, "Il / elle pousse sur les jambes avant de tirer sur les bras", []], [0, "Il / elle pose la pointe du pied avec précision", []], [0, "Il / elle garde les bras tendus pour se reposer", []], [1, "Il / elle atteint le haut de la voie ou la zone visée", []], [1, "Il / elle grimpe sans longs arrêts", []]]]],
    rel: [["La transmission du témoin", [[0, "Le receveur part quand le donneur passe sur sa marque", []], [0, "Le receveur ne se retourne pas", []], [0, "Le donneur annonce « hop » et pose le témoin dans la main", []], [1, "Le témoin est transmis dans la zone", []], [1, "Le témoin ne ralentit pas pendant la transmission", []]]],
      ["Le départ", [[0, "Il / elle est immobile et concentré(e) avant le signal", []], [0, "Il / elle pousse fort sur ses premiers appuis", []], [0, "Il / elle se redresse progressivement", []], [1, "Il / elle réagit dès le signal", []], [1, "Il / elle atteint vite sa vitesse", []]]]],
    dan: [["L'interprétation", [[0, "Il / elle place son regard", ["Regard vers le public ou dans la direction du mouvement"]], [0, "Il / elle va au bout de ses gestes, avec amplitude", []], [0, "Il / elle reste dans son rôle du début à la fin", []], [1, "Aucun geste parasite : rire, cheveux, vêtements", []], [1, "On comprend l'intention ou l'émotion", []]]],
      ["La composition", [[0, "Le début et la fin sont nets : immobilité", []], [0, "Le groupe utilise tout l'espace : niveaux, directions", ["Au sol", "Debout", "Déplacements variés"]], [0, "Les danseurs sont en relation : unisson, canon, contact…", []], [1, "La chorégraphie est mémorisée, sans hésitation", []], [1, "On repère les procédés choisis", []]]]],
    acro: [["La pyramide", [[0, "Le porteur a le dos plat et reste gainé", []], [0, "Le voltigeur pose ses appuis sur les zones solides : bassin, épaules", []], [0, "Le montage et le démontage sont contrôlés, sans sauter", []], [1, "La pyramide tient 3 secondes, immobile", []], [1, "La pyramide ressemble à la figure choisie", []]]],
      ["La parade", [[0, "Le pareur est placé près du voltigeur, mains prêtes", []], [0, "Le groupe se parle : « prêt ? », « je monte », « je descends »", []], [1, "Le voltigeur est accompagné jusqu'au sol", []], [1, "Aucune chute ni descente brutale", []]]],
      ["L'enchaînement", [[0, "Les figures sont reliées par des éléments de liaison", []], [0, "Le groupe utilise l'espace de présentation", []], [1, "Le début et la fin sont nets", []], [1, "L'enchaînement est réalisé sans arrêt ni oubli", []]]]],
    ori: [["Lire et orienter sa carte", [[0, "Il / elle oriente sa carte avant de partir", []], [0, "Il / elle suit sa position avec le pouce sur la carte", []], [0, "Il / elle s'appuie sur des lignes : chemin, clôture, lisière", []], [1, "Il / elle trouve la balise sans erreur de poste", []], [1, "Il / elle revient dans le temps prévu", []]]],
      ["Choisir son itinéraire", [[0, "Il / elle explique son itinéraire avant de partir", []], [0, "Il / elle repère un point d'attaque près de la balise", []], [1, "Il / elle trouve les balises dans l'ordre prévu", []], [1, "Il / elle court entre les postes faciles", []]]]],
    ct: [["Le squat", [[0, "Pieds largeur d'épaules, talons au sol", []], [0, "Dos droit, regard devant", []], [0, "Genoux dans l'axe des pieds", []], [0, "Il / elle descend jusqu'aux cuisses parallèles au sol", []], [1, "Toutes les répétitions sont complètes", []]]],
      ["Les pompes", [[0, "Corps aligné et gainé, de la tête aux pieds", []], [0, "Mains sous les épaules", []], [0, "La poitrine descend près du sol", []], [1, "Toutes les répétitions sont complètes", []]]],
      ["Le gainage", [[0, "Épaules, bassin et chevilles sont alignés", []], [0, "Coudes sous les épaules", []], [0, "Il / elle respire régulièrement", []], [1, "Il / elle tient le temps prévu sans perdre l'alignement", []]]]],
    step: [["Les appuis sur le step", [[0, "Il / elle pose le pied entier sur le step", []], [0, "Il / elle garde le dos droit, regard devant", []], [0, "Il / elle redescend près du step", []], [1, "Il / elle reste en rythme avec la musique", []], [1, "Il / elle enchaîne sans s'arrêter", []]]],
      ["Le bloc", [[0, "Il / elle connaît l'ordre des pas", []], [0, "Il / elle coordonne les bras et les jambes", []], [0, "Il / elle est synchronisé(e) avec son groupe", []], [1, "Le bloc est réalisé sans erreur, sur la musique", []]]]]
  };
  /* plusieurs grilles par activité : la principale (g|<appli>) et une par thématique (g|<appli>|<id>) */
  function coGrid(app, gid) { gid = gid || ""; var id = "g|" + app + (gid ? "|" + gid : ""), o = coLd().items[id]; if (!o || o.del || o.k !== "g") o = { id: id, k: "g", app: app, on: 0, src: "own", crit: [] }; o.gid = gid; o.titre = String(o.titre || ""); if (!Array.isArray(o.crit)) o.crit = []; o.src = o.src === "eval" ? "eval" : "own";
    o.nv = [2, 3, 4, 5].indexOf(+o.nv) >= 0 ? +o.nv : 4; o.nn = o.nn && typeof o.nn === "object" && !Array.isArray(o.nn) ? o.nn : {}; o.fam = (Array.isArray(o.fam) ? o.fam : []).filter(function (f) { return f && f.id; }); o.ecart = +o.ecart === 2 ? 2 : 1; o.auto = o.auto ? 1 : 0; o.com = o.com ? 1 : 0; o.mot = o.mot ? 1 : 0; return o; }
  function coGrids(app) { var I = coLd().items, L = Object.keys(I).filter(function (id) { var o = I[id]; return o && !o.del && o.k === "g" && o.app === app && (id === "g|" + app || id.indexOf("g|" + app + "|") === 0); }).map(function (id) { return coGrid(app, id === "g|" + app ? "" : id.slice(("g|" + app + "|").length)); }); L.sort(function (a, b) { return (a.gid ? 1 : 0) - (b.gid ? 1 : 0) || (+a.c || 0) - (+b.c || 0); }); return L.length ? L : [coGrid(app)]; }
  function coTitre(g) { return g.titre.trim() || (g.gid ? "Sans titre" : "Grille principale"); }
  function coNv(g) { return g.src === "eval" ? 4 : g.nv; }
  function coDefN(n) { return n === 2 ? ["Pas encore", "Oui"] : n === 3 ? ["Pas encore", "Parfois", "Toujours"] : n === 5 ? ["Jamais", "Rarement", "Parfois", "Souvent", "Toujours"] : coNiv(); }
  /* noms des niveaux : ceux de la grille (par nombre de niveaux), sinon ceux par défaut */
  function coNames(g) { var n = coNv(g), D = coDefN(n), L = g.src === "eval" ? [] : (g.nn[n] || []); return D.map(function (d, i) { return String(L[i] || "").trim() || d; }); }
  function coD(i, nv) { return nv <= 1 ? 0 : Math.max(0, Math.min(3, Math.round(i * 3 / (nv - 1)))); }
  function coNiv() { var d = ["Pas encore", "Parfois", "Souvent", "Toujours"]; try { var v = window.EPSP ? EPSP.p({ id: "co_niveaux", sec: "Coévaluation", label: "Les 4 niveaux proposés à l'élève observateur (du plus faible au plus fort)", type: "list", def: d, fixed: 4 }) : d; return Array.isArray(v) && v.length === 4 ? v.map(String) : d; } catch (e) { return d; } }
  function coInst(app) { ["evvol", "evdan"].forEach(function (f) { try { if (typeof window[f] === "function") window[f](); } catch (e) {} }); var L = (window.EPSE_INST || []).filter(function (x) { return x && x.A && x.A.app === app; }); return L[0] || null; }
  /* critères proposés à l'observateur : la grille de l'enseignant (famille en couleur, observables), ou celle de l'évaluation (formulée pour l'élève quand elle existe) */
  function coCrits(app, gid) { var g = coGrid(app, gid), N = coNames(g); if (g.src === "eval") { var I = coInst(app), G = null; try { G = I && I.A.grid(); } catch (e) {} return ((G && G.criteres) || []).map(function (cr) { var d = (cr.descEl && cr.descEl.length === 4 && cr.descEl.join("").trim() ? cr.descEl : cr.desc) || []; return { id: String(cr.id), nom: String(cr.nomEl || cr.nom || ""), fam: null, obs: [], desc: [0, 1, 2, 3].map(function (i) { return String(d[i] || N[i]); }) }; }); }
    return g.crit.filter(function (c) { return c && c.id && String(c.nom || "").trim(); }).map(function (c) { var d = Array.isArray(c.desc) ? c.desc : [], f = g.fam.filter(function (x) { return x.id === c.fam; })[0]; return { id: String(c.id), nom: String(c.nom), fam: f ? { nom: String(f.nom || ""), col: /^#[0-9a-f]{6}$/i.test(f.col || "") ? f.col : "#14171C" } : null, obs: (Array.isArray(c.obs) ? c.obs : []).map(function (x) { return String(x || "").trim(); }).filter(Boolean), desc: N.map(function (n, i) { return String(d[i] || "").trim() || n; }) }; }); }
  function coAdd(app, cls, cible, obs, ev, src, plus, gid) { var x = { n: obs, g: src, ev: ev, t: Date.now(), gr: gid || "" }; plus = plus || {}; if (plus.self) x.self = plus.self; if (plus.com) x.com = plus.com; if (plus.mot) x.mot = String(plus.mot).slice(0, 300); var by = {}; by[nkey(obs)] = x; coPut({ id: coId(app, cls, cible, obs) + (gid ? "|" + gid : ""), k: "co", app: app, cls: cls, n: cible, by: by }); }
  /* regard des camarades par critère : {n, ev:{critère:{d, pos, v, n, r, nv}}, self:{critère:{r, d, n}}, div, qui, det}. d = degré ramené sur 4 (Référentiel) ; r = niveau moyen sur l'échelle de la grille. */
  function coMoy(app, cls, full, gid) { var o = coGet(app, cls, full, gid); if (!o) return null; var B = Object.keys(o.by).map(function (k) { return o.by[k]; }), T = {}, S = {}, div = 0, ec = coGrid(app, gid).ecart; if (!B.length) return null;
    B.forEach(function (x) { Object.keys(x.ev).forEach(function (c) { var z = x.ev[c]; if (!z || z.d == null || isNaN(+z.d)) return; var t = T[c] || (T[c] = { s: 0, n: 0, r: 0, nv: 0, mix: 0 }), nv = +z.nv || 4, i = z.i == null ? +z.d : +z.i; t.s += +z.d + (z.pos == null ? .5 : +z.pos); t.n++; if (t.nv && t.nv !== nv) t.mix = 1; t.nv = nv; t.r += i;
      var s = x.self && x.self[c]; if (s && s.i != null) { var u = S[c] || (S[c] = { r: 0, d: 0, n: 0 }); u.r += +s.i; u.d += +s.d || 0; u.n++; if (Math.abs(+s.i - i) >= ec) div++; } }); });
    var ev = {}, self = {}; Object.keys(T).forEach(function (c) { var v = T[c].s / T[c].n, d = Math.max(0, Math.min(3, Math.floor(v))); ev[c] = { d: d, pos: Math.max(0, Math.min(1, v - d)), v: v, n: T[c].n, r: T[c].mix ? null : T[c].r / T[c].n, nv: T[c].nv }; }); Object.keys(S).forEach(function (c) { self[c] = { r: S[c].r / S[c].n, d: Math.max(0, Math.min(3, Math.round(S[c].d / S[c].n))), n: S[c].n }; });
    return { n: B.length, ev: ev, self: self, div: div, qui: B.map(function (x) { return x.n; }), det: B.slice().sort(function (a, b) { return (+b.t || 0) - (+a.t || 0); }) }; }
  function coClasses(app) { var L = []; try { if (window.EPSL) L = EPSL.items().filter(function (it) { return it && it.nom && (it.off || []).indexOf(app) < 0; }).map(function (it) { return { nom: it.nom, el: EPSL.people(it).map(function (p) { return p.full || ((p.prenom || "") + " " + (p.nom || "")).trim(); }).filter(Boolean) }; }); } catch (e) {} return L.sort(function (a, b) { return a.nom.localeCompare(b.nom, "fr", { numeric: true }); }); }
  function coAbs(n, cls) { try { return !!(window.epsAbsJour && epsAbsJour(n, cls)); } catch (e) { return false; } }
  var COCSS = ".co-b{min-height:54px;border-radius:14px;border:2px solid #E2DDD2;background:#FBFAF7;font:800 17px system-ui,sans-serif;color:#14171C;padding:8px 14px;cursor:pointer;text-align:left;width:100%;display:block;margin:0 0 8px}.co-b.on{border-color:#14171C;background:#14171C;color:#fff}.co-b small{display:block;font-weight:600;font-size:14px;opacity:.85}.co-s{width:100%;min-height:54px;border-radius:12px;border:2px solid #E2DDD2;background:#fff;font:700 17px system-ui;padding:0 10px;margin:4px 0 12px}.co-n{display:flex;gap:10px;margin-top:14px}.co-n button{flex:1;min-height:54px;border-radius:14px;border:2px solid #14171C;background:#fff;font:800 17px system-ui;cursor:pointer}.co-n button.p{background:#14171C;color:#fff}.co-n button[disabled]{opacity:.4}.co-ban{background:#FFF4D6;border:1.5px solid #E0B040;border-radius:12px;padding:8px 12px;font-weight:800;margin:0 0 12px}" +
    ".co-ov{position:fixed;inset:0;z-index:2147483100;background:rgba(20,23,28,.55);display:flex;align-items:flex-start;justify-content:center;padding:3vh 12px;overflow:auto;font-family:system-ui,sans-serif;color:#14171C}.co-ov>div{background:#fff;border-radius:16px;padding:16px 18px;width:100%;max-width:820px}.co-ov h2{margin:0 0 6px;font-size:20px}.co-ov h3{margin:16px 0 6px;font-size:16px}.co-ov .m{color:#6A6F78;font-size:14px;margin:4px 0}.co-ov input[type=text]{width:100%;border:1.5px solid #E6E1D6;border-radius:10px;padding:8px 10px;font:inherit;min-height:44px}.co-ov table{border-collapse:collapse;width:100%;font-size:14px}.co-ov th,.co-ov td{border:1px solid #E6E1D6;padding:6px 8px;text-align:center}.co-ov th:first-child,.co-ov td:first-child{text-align:left}.co-th{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 12px;padding:8px;background:#F5F3EE;border-radius:12px}.co-ed{border:1.5px solid #E6E1D6;border-radius:12px;padding:10px;margin:0 0 8px}.co-ed .g{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px}@media(max-width:640px){.co-ed .g{grid-template-columns:1fr 1fr}}.co-t{min-height:44px;padding:0 14px;border-radius:12px;border:1.5px solid #14171C;background:#fff;font:800 15px system-ui;cursor:pointer}.co-t.p{background:#14171C;color:#fff}.co-t.on{background:#1E6B3A;border-color:#1E6B3A;color:#fff}.co-lk{min-height:40px;border:0;background:none;font:800 14px system-ui;color:#14171C;text-decoration:underline;cursor:pointer;text-align:left;padding:0}.co-fam{display:inline-block;color:#fff;font:800 13px system-ui;border-radius:999px;padding:3px 10px;margin:0 6px 6px 0}.co-ob{display:inline-block;min-height:46px;text-align:left;border-radius:999px;margin-right:6px;border:2px solid #E2DDD2;background:#fff;font:700 16px system-ui;color:#14171C;padding:6px 12px;margin:0 0 6px;cursor:pointer}.co-ob.on{border-color:#1E6B3A;background:#E8F5EC}.co-ta,.co-in{width:100%;border:2px solid #E2DDD2;border-radius:12px;padding:8px 10px;font:600 16px system-ui;margin:6px 0 0;min-height:46px;box-sizing:border-box}.co-ta{min-height:80px}.co-cmp{border:2px solid #E2DDD2;border-radius:12px;padding:10px 12px;margin:0 0 8px}.co-cmp.div{background:#FFF8E1;border-color:#E0B040}.co-cmp .l{display:inline-block;width:calc(50% - 6px);vertical-align:top;background:#F5F3EE;border-radius:10px;padding:8px 10px;margin:8px 4px 0 0;box-sizing:border-box}.co-cmp .l b{display:block;font-size:17px}.co-cmp.div .l{background:#fff}.co-slots{display:flex;gap:8px;align-items:stretch;flex-wrap:wrap;margin-bottom:6px}.co-arr{align-self:center;font:800 22px system-ui;color:#6A6F78}.co-slot{flex:1;min-width:120px;min-height:76px;border-radius:14px;border:2px dashed #C9C3B6;background:#FBFAF7;color:#14171C;padding:8px 10px;text-align:center;cursor:pointer;font:inherit}.co-slot .i{font-size:22px;display:block}.co-slot small{display:block;color:#6A6F78;font-weight:700;font-size:13px}.co-slot b{display:block;font-size:17px}.co-slot.ok{border-style:solid;border-color:#14171C;background:#fff}.co-slot.cur{border-color:#14171C;box-shadow:0 0 0 3px rgba(20,23,28,.15)}.co-slot[disabled]{cursor:default;opacity:1}.co-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}.co-p{min-height:72px;border-radius:14px;border:2px solid #E2DDD2;background:#fff;color:#14171C;cursor:pointer;padding:8px;text-align:center;font:inherit}.co-p b{display:block;font-size:19px}.co-p small{display:block;color:#6A6F78;font-weight:700;font-size:13px}.co-p:active{background:#14171C;color:#fff}.co-dots{display:flex;gap:6px;margin:0 0 10px}.co-dots i{flex:1;height:8px;border-radius:99px;background:#E2DDD2}.co-dots i.ok{background:#1E6B3A}.co-dots i.cur{background:#14171C}.co-q{margin:4px 0 12px;font-size:22px;line-height:1.25}.co-lvs{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:10px}@media(max-width:620px){.co-lvs{grid-template-columns:1fr 1fr}}.co-lv{min-height:120px;border-radius:16px;border:2px solid #E2DDD2;background:#FBFAF7;color:#14171C;cursor:pointer;padding:12px 8px;font:800 16px system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center}.co-lv.on{background:#14171C;border-color:#14171C;color:#fff}.co-bars{display:inline-flex;align-items:flex-end;gap:4px;height:34px}.co-bars i{width:10px;border-radius:3px;background:#D9D3C6}.co-bars i.f{background:#1E6B3A}.co-lv.on .co-bars i{background:#4B5563}.co-lv.on .co-bars i.f{background:#7EE2A0}.co-g2{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:10px}.co-r{min-height:120px;border-radius:14px;border:2px solid #E2DDD2;background:#fff;color:#14171C;cursor:pointer;padding:10px;font:inherit;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}.co-r small{font-weight:700;font-size:14px;color:#3A3F47}.co-r b{font-size:17px}.co-cmp .w{font-weight:800;color:#8A5A00;margin-top:6px}";
  function coCss() { if (document.getElementById("co-css")) return; var st = document.createElement("style"); st.id = "co-css"; st.textContent = COCSS; document.head.appendChild(st); }
  /* ---- côté élève : un critère par écran ; si la grille le demande, l'élève observé s'auto-évalue ensuite sur la même tablette, puis les deux regards sont comparés ---- */
  function coEleve(o) { o = o || {}; coCss(); var app = o.app, OPEN = coGrids(app).filter(function (g) { return g.on && coCrits(app, g.gid).length; }), G = OPEN[0] || coGrid(app), CR = coCrits(app, G.gid), NV = coNv(G), CL = coClasses(app), P = { cls: o.cls && CL.some(function (c) { return c.nom === o.cls; }) ? o.cls : (CL.length === 1 ? CL[0].nom : ""), moi: "", cible: "", ph: OPEN.length > 1 ? "th" : "id", step: 0, ev: {}, ob: {}, self: {}, com: {}, mot: "" };
    if (!window.EPSG || !EPSG.sheet) return null; var sh = EPSG.sheet({ titre: "👥 J'observe un camarade", color: o.color, html: "" }), box = sh.querySelector(".epsgs-in"), pn = function (n) { return String(n || "").split(" ")[0]; };
    function chip(cr) { return cr.fam ? '<span class="co-fam" style="background:' + cr.fam.col + '">' + esc(cr.fam.nom || "Famille") + "</span>" : ""; }
    function bars(i, n) { var h = '<span class="co-bars" aria-hidden="true">'; for (var j = 0; j < n; j++) h += '<i class="' + (j <= i ? "f" : "") + '" style="height:' + Math.round(10 + j * 22 / Math.max(1, n - 1)) + 'px"></i>'; return h + "</span>"; }
    function ecart(cr) { return P.ev[cr.id] != null && P.self[cr.id] != null && Math.abs(P.ev[cr.id] - P.self[cr.id]) >= G.ecart; }
    function draw() { var c = CL.filter(function (x) { return x.nom === P.cls; })[0], E = c ? c.el.filter(function (n) { return !coAbs(n, c.nom); }) : [], N = CR.length, h = "", me = P.ph === "self";
      if (!OPEN.length) { box.innerHTML = '<div class="epsgs-card"><p>La coévaluation n\'est pas ouverte pour cette activité.</p></div>'; return; }
      if (P.ph === "th") h = '<div class="epsgs-card"><h3 style="margin-top:0">Qu\'est-ce que tu observes aujourd\'hui ?</h3><div class="co-g">' + OPEN.map(function (g, i) { return '<button type="button" class="co-p" data-th="' + i + '"><b>🎯 ' + esc(coTitre(g)) + "</b><small>" + coCrits(app, g.gid).length + " questions</small></button>"; }).join("") + "</div></div>";
      else if (P.ph === "fin") h = '<div class="epsgs-card" style="text-align:center"><div style="font-size:44px">✅</div><h3 style="margin-top:6px">Merci ' + esc(pn(P.moi)) + (G.auto ? " et " + esc(pn(P.cible)) : "") + " !</h3><p>" + (G.auto ? "Votre coévaluation est enregistrée pour votre enseignant." : "Ton observation de <b>" + esc(P.cible) + "</b> est enregistrée. Seul ton enseignant la voit.") + '</p><div class="co-n"><button type="button" class="p" data-new>Observation suivante</button></div></div>';
      else if (P.ph === "id") { var need = !c ? "cls" : !P.moi ? "moi" : !P.cible ? "cible" : "", slot = function (k, ico, lab, val) { return '<button type="button" class="co-slot' + (need === k ? " cur" : "") + (val ? " ok" : "") + '" data-slot="' + k + '"' + (val ? ' aria-label="' + lab + " : " + esc(val) + ', changer"' : " disabled") + '><span class="i" aria-hidden="true">' + ico + "</span><small>" + lab + "</small><b>" + (val ? esc(val) : "…") + "</b></button>"; }, tile = function (k, n) { var q = String(n).split(" "); return '<button type="button" class="co-p" data-pick="' + k + '" data-v="' + esc(n) + '"><b>' + esc(q[0]) + "</b>" + (k !== "cls" && q.length > 1 ? "<small>" + esc(q.slice(1).join(" ")) + "</small>" : "") + "</button>"; };
        h = '<div class="epsgs-card"><div class="co-slots">' + (OPEN.length > 1 ? slot("th", "🎯", "J'observe quoi", coTitre(G)) : "") + (CL.length > 1 ? slot("cls", "🏫", "Ma classe", c ? c.nom : "") : "") + slot("moi", "🙂", "Je suis", P.moi) + '<span class="co-arr" aria-hidden="true">→</span>' + slot("cible", "👀", "J'observe", P.cible) + "</div>" +
          (need === "cls" ? '<h3>Quelle est ta classe ?</h3><div class="co-g">' + CL.map(function (x) { return tile("cls", x.nom); }).join("") + "</div>" : need === "moi" ? '<h3>Qui es-tu ?</h3><div class="co-g">' + E.map(function (n) { return tile("moi", n); }).join("") + "</div>" : need === "cible" ? '<h3>Qui observes-tu ?</h3><div class="co-g">' + E.filter(function (n) { return n !== P.moi; }).map(function (n) { return tile("cible", n); }).join("") + "</div>" :
            "<p>Tu vas répondre à <b>" + N + " question" + (N > 1 ? "s" : "") + "</b> sur ce que tu as vu. Sois juste et bienveillant : c'est pour l'aider à progresser." + (G.auto ? " Ensuite, " + esc(pn(P.cible)) + " s'évaluera et vous comparerez." : "") + '</p><div class="co-n"><button type="button" class="p" data-go>Commencer →</button></div>') + "</div>"; }
      else if (P.ph === "obs" || me) { var cr = CR[P.step], R = me ? P.self : P.ev, v = R[cr.id], O = P.ob[cr.id] || [];
        h = '<p class="co-ban">' + (me ? "🙋 " + esc(pn(P.cible)) + ", tu t'évalues toi-même" : "👥 Tu observes " + esc(P.cible)) + (G.titre.trim() ? " · 🎯 " + esc(G.titre.trim()) : "") + '</p><div class="epsgs-card"' + (cr.fam ? ' style="border-top:8px solid ' + cr.fam.col + '"' : "") + ">" + '<div class="co-dots" aria-label="Question ' + (P.step + 1) + " sur " + N + '">' + CR.map(function (x, i) { return '<i class="' + (i < P.step ? "ok" : i === P.step ? "cur" : "") + '"></i>'; }).join("") + "</div>" + chip(cr) + '<h3 class="co-q">' + esc(cr.nom) + "</h3>" +
          (cr.obs.length ? '<p class="m" style="margin-bottom:4px"><b>' + (me ? "Ce qu'il faut regarder" : "Coche ce que tu vois") + "</b></p>" + cr.obs.map(function (t, i) { return me ? '<div class="co-ob" style="cursor:default">• ' + esc(t) + "</div>" : '<button type="button" class="co-ob' + (O.indexOf(i) >= 0 ? " on" : "") + '" data-ob="' + i + '" aria-pressed="' + (O.indexOf(i) >= 0) + '">' + (O.indexOf(i) >= 0 ? "☑ " : "☐ ") + esc(t) + "</button>"; }).join("") + '<p class="m" style="margin:10px 0 4px"><b>' + (me ? "Mon niveau" : "Son niveau") + "</b></p>" : "") +
          '<div class="co-lvs" style="--n:' + cr.desc.length + '">' + cr.desc.map(function (t, i) { return '<button type="button" class="co-lv' + (v === i ? " on" : "") + '" data-d="' + i + '" aria-pressed="' + (v === i) + '">' + bars(i, cr.desc.length) + "<span>" + esc(t) + "</span></button>"; }).join("") + "</div>" +
          '<div class="co-n"><button type="button" data-prev>← Retour</button><button type="button" class="p" data-next' + (v == null ? " disabled" : "") + ">" + (P.step === N - 1 ? (me ? "Comparer nos regards →" : "Voir mes réponses →") : "Suivant →") + "</button></div></div>"; }
      else if (P.ph === "rec") h = '<p class="co-ban">👥 Tu observes ' + esc(P.cible) + '</p><div class="epsgs-card"><h3 style="margin-top:0">Mes réponses</h3><p class="m">Touche une carte pour changer une réponse.</p><div class="co-g2">' + CR.map(function (cr, i) { return '<button type="button" class="co-r" data-jump="' + i + '"' + (cr.fam ? ' style="border-top:8px solid ' + cr.fam.col + '"' : "") + "><small>" + esc(cr.nom) + "</small>" + bars(P.ev[cr.id], cr.desc.length) + "<b>" + esc(cr.desc[P.ev[cr.id]]) + "</b></button>"; }).join("") + "</div>" +
        (G.mot ? '<label><b>Un conseil pour ' + esc(pn(P.cible)) + '</b><textarea class="co-ta" data-mot maxlength="300" placeholder="Pour progresser, tu peux…">' + esc(P.mot) + "</textarea></label>" : "") +
        '<div class="co-n"><button type="button" data-prev>← Retour</button>' + (G.auto ? '<button type="button" class="p" data-pass>Passer la tablette à ' + esc(pn(P.cible)) + " →</button>" : '<button type="button" class="p" data-ok>Valider mon observation</button>') + "</div></div>";
      else if (P.ph === "pass") h = '<div class="epsgs-card" style="text-align:center"><div style="font-size:44px">📱</div><h3 style="margin-top:6px">Passe la tablette à ' + esc(P.cible) + "</h3><p><b>" + esc(pn(P.cible)) + '</b>, à toi : réponds aux mêmes questions sur toi. Les réponses de ton camarade restent cachées jusqu\'à la fin.</p><div class="co-n"><button type="button" data-prev>← Retour</button><button type="button" class="p" data-self>Je suis ' + esc(pn(P.cible)) + " →</button></div></div>";
      else { var nd = CR.filter(ecart).length;
        h = '<p class="co-ban">👥 ' + esc(pn(P.moi)) + " et 🙋 " + esc(pn(P.cible)) + " : comparez vos regards</p>" + '<div class="epsgs-card"><p style="margin-top:0"><b>' + (nd ? nd + " regard" + (nd > 1 ? "s" : "") + " différent" + (nd > 1 ? "s" : "") + " sur " + N : "Vous êtes d'accord sur tout") + "</b>" + (nd ? " : parlez-en ensemble." : " 👍") + "</p>" +
          CR.map(function (cr) { var d = ecart(cr), cm = P.com[cr.id] || {}; return '<div class="co-cmp' + (d ? " div" : "") + '"' + (cr.fam ? ' style="border-left:8px solid ' + cr.fam.col + '"' : "") + ">" + chip(cr) + "<b>" + esc(cr.nom) + '</b><div class="l">👥 ' + esc(pn(P.moi)) + " : <b>" + esc(cr.desc[P.ev[cr.id]]) + '</b></div><div class="l">🙋 ' + esc(pn(P.cible)) + " : <b>" + esc(cr.desc[P.self[cr.id]]) + "</b></div>" +
            (d ? '<div class="w">⚠ Vos regards sont différents</div>' + (G.com ? '<input type="text" class="co-in" data-com="' + esc(cr.id) + '|o" maxlength="200" value="' + esc(cm.o || "") + '" placeholder="👥 ' + esc(pn(P.moi)) + ' : ce que j\'ai vu" aria-label="Commentaire de l\'observateur"><input type="text" class="co-in" data-com="' + esc(cr.id) + '|s" maxlength="200" value="' + esc(cm.s || "") + '" placeholder="🙋 ' + esc(pn(P.cible)) + ' : ce que j\'ai ressenti" aria-label="Commentaire de l\'élève observé">' : "") : "") + "</div>"; }).join("") +
          (G.mot && P.mot ? '<p class="m">✍ Le conseil de ' + esc(pn(P.moi)) + " : « " + esc(P.mot) + " »</p>" : "") + '<div class="co-n"><button type="button" data-prev>← Retour</button><button type="button" class="p" data-ok>Valider ensemble</button></div></div>'; }
      box.innerHTML = h; sh.scrollTop = 0;
      [].forEach.call(box.querySelectorAll("[data-pick]"), function (f) { f.onclick = function () { P[f.dataset.pick] = f.dataset.v; draw(); }; });
      [].forEach.call(box.querySelectorAll("[data-slot]"), function (f) { f.onclick = function () { var k = f.dataset.slot; if (k === "th") { P.ph = "th"; draw(); return; } P[k] = ""; if (k === "cls") { P.moi = ""; P.cible = ""; } if (k === "moi") P.cible = ""; draw(); }; });
      var q = function (x) { return box.querySelector(x); }, all = function (x, f) { [].forEach.call(box.querySelectorAll(x), f); };
      all("[data-th]", function (b) { b.onclick = function () { G = OPEN[+b.dataset.th]; CR = coCrits(app, G.gid); NV = coNv(G); P.ev = {}; P.ob = {}; P.self = {}; P.com = {}; P.ph = "id"; draw(); }; });
      if (q("[data-go]")) q("[data-go]").onclick = function () { P.ph = "obs"; P.step = 0; draw(); };
      all("[data-d]", function (b) { b.onclick = function () { (P.ph === "self" ? P.self : P.ev)[CR[P.step].id] = +b.dataset.d; draw(); }; });
      all("[data-ob]", function (b) { b.onclick = function () { var id = CR[P.step].id, L = P.ob[id] || (P.ob[id] = []), i = +b.dataset.ob, k = L.indexOf(i); if (k >= 0) L.splice(k, 1); else L.push(i); var y = sh.scrollTop; draw(); sh.scrollTop = y; }; });
      if (q("[data-prev]")) q("[data-prev]").onclick = function () { if (P.ph === "obs") { if (P.step > 0) P.step--; else P.ph = "id"; } else if (P.ph === "rec") { P.ph = "obs"; P.step = N - 1; } else if (P.ph === "pass") P.ph = "rec"; else if (P.ph === "self") { if (P.step > 0) P.step--; else P.ph = "pass"; } else if (P.ph === "cmp") { P.ph = "self"; P.step = N - 1; } draw(); };
      if (q("[data-next]")) q("[data-next]").onclick = function () { if (P.step < N - 1) P.step++; else P.ph = P.ph === "self" ? "cmp" : "rec"; draw(); };
      all("[data-jump]", function (b) { b.onclick = function () { P.ph = "obs"; P.step = +b.dataset.jump; draw(); }; });
      if (q("[data-mot]")) q("[data-mot]").oninput = function () { P.mot = this.value; };
      if (q("[data-pass]")) q("[data-pass]").onclick = function () { P.ph = "pass"; draw(); };
      if (q("[data-self]")) q("[data-self]").onclick = function () { P.ph = "self"; P.step = 0; draw(); };
      all("[data-com]", function (f) { f.oninput = function () { var p = f.dataset.com.split("|"); (P.com[p[0]] || (P.com[p[0]] = {}))[p[1]] = f.value; }; });
      if (q("[data-ok]")) q("[data-ok]").onclick = function () { var ev = {}, plus = { mot: G.mot ? P.mot.trim() : "" }; CR.forEach(function (cr) { var i = P.ev[cr.id]; if (i == null) return; ev[cr.id] = { d: coD(i, NV), pos: .5, i: i, nv: NV }; if (cr.obs.length) ev[cr.id].ob = (P.ob[cr.id] || []).slice().sort(); });
        if (G.auto) { plus.self = {}; plus.com = {}; CR.forEach(function (cr) { var i = P.self[cr.id]; if (i == null) return; plus.self[cr.id] = { i: i, d: coD(i, NV) }; var cm = P.com[cr.id]; if (ecart(cr) && cm && (String(cm.o || "").trim() || String(cm.s || "").trim())) plus.com[cr.id] = { o: String(cm.o || "").trim().slice(0, 200), s: String(cm.s || "").trim().slice(0, 200) }; }); }
        coAdd(app, P.cls, P.cible, P.moi, ev, G.src, plus, G.gid); P.ph = "fin"; draw(); };
      if (q("[data-new]")) q("[data-new]").onclick = function () { P.moi = ""; P.cible = ""; P.ph = "id"; P.step = 0; P.ev = {}; P.ob = {}; P.self = {}; P.com = {}; P.mot = ""; draw(); }; }
    draw(); return sh; }
  /* ---- côté enseignant : ma grille (niveaux, familles en couleur, observables, options), ouverture, résultats ---- */
  var coLive = null;
  function coEdit(o) { o = o || {}; coCss(); var app = o.app, gid = o.gid || "", G = coGrid(app, gid), tab = o.tab === "r" ? "r" : "g", cls = o.cls || "", det = "", old = document.getElementById("co-ov"); if (old) old.remove();
    var ov = document.createElement("div"); ov.className = "co-ov"; ov.id = "co-ov"; document.body.appendChild(ov);
    function save() { coPut({ id: G.id, k: "g", app: app, titre: String(G.titre || "").slice(0, 60), c: +G.c || 0, prop: G.prop ? 1 : 0, on: G.on ? 1 : 0, src: G.src, nv: G.nv, nn: G.nn, ecart: G.ecart, auto: G.auto ? 1 : 0, com: G.com ? 1 : 0, mot: G.mot ? 1 : 0, fam: G.fam.map(function (f) { return { id: f.id, nom: String(f.nom || "").slice(0, 40), col: f.col }; }),
      crit: G.crit.map(function (c) { return { id: c.id, nom: String(c.nom || "").slice(0, 160), fam: c.fam || "", desc: [0, 1, 2, 3, 4].map(function (i) { return String((c.desc || [])[i] || "").slice(0, 200); }), obs: (Array.isArray(c.obs) ? c.obs : []).slice(0, COMAXO).map(function (x) { return String(x || "").slice(0, 160); }) }; }) }); }
    function lv(z) { return z.r != null ? String(Math.round((z.r + 1) * 10) / 10).replace(".", ",") + " / " + z.nv : (z.d + 1) + " / 4"; }
    var busy = 0;
    /* busy : un champ qui perd le focus pendant le redessin enregistre sa valeur sans relancer le dessin */
    function draw() { if (busy) return; var N = coNames(G), NV = coNv(G), CR = coCrits(app, gid), CL = coClasses(app), GR = coGrids(app), ID = COIDEES[app] || [], tg = function (k, t) { return '<button type="button" class="co-t' + (G[k] ? " on" : "") + '" data-opt="' + k + '" aria-pressed="' + !!G[k] + '">' + (G[k] ? "✓ " : "") + t + "</button>"; },
        h = '<div role="dialog" aria-modal="true"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><h2 style="flex:1">👥 Coévaluation · ' + esc(o.nom || app) + '</h2><button type="button" class="co-t" data-x>✕ Fermer</button></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 12px"><button type="button" class="co-t' + (tab === "g" ? " p" : "") + '" data-tab="g">🧩 Ma grille</button><button type="button" class="co-t' + (tab === "r" ? " p" : "") + '" data-tab="r">📊 Résultats</button>' + (ID.length ? '<button type="button" class="co-t' + (tab === "i" ? " p" : "") + '" data-tab="i">💡 Idées de thématiques</button>' : "") + '<span style="flex:1"></span>' + (tab === "i" ? "" : '<button type="button" class="co-t' + (G.on ? " on" : "") + '" data-on aria-pressed="' + !!G.on + '">' + (G.on ? "✓ Ouverte aux élèves" : "Fermée aux élèves") + "</button>") + "</div>";
      if (tab !== "i") h += '<div class="co-th"><span class="m" style="margin:0">Thématique</span>' + GR.map(function (g) { return '<button type="button" class="co-t' + (g.gid === gid ? " p" : "") + '" data-gid="' + esc(g.gid) + '">' + (g.on ? "● " : "") + esc(coTitre(g)) + "</button>"; }).join("") + '<button type="button" class="co-t" data-gnew>＋ Thématique</button></div>';
      if (tab === "i") h += '<p>Des coévaluations par thématique, proposées pour ' + esc(o.nom || app) + '. Chacune sépare les <b style="color:' + COIDFAM[0][1] + '">critères de réalisation</b> (ce qu\'il y a à faire pour faire) et les <b style="color:' + COIDFAM[1][1] + '">critères de réussite</b> (ce qu\'il y a à faire pour être en réussite). Ce sont des propositions : une fois ajoutée, tu modifies tout.</p>' + ID.map(function (t, i) { var deja = GR.some(function (g) { return g.titre.trim() === t[0]; }); return '<div class="co-ed"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="flex:1;font-size:17px">🎯 ' + esc(t[0]) + '</b><button type="button" class="co-t' + (deja ? "" : " p") + '" data-idee="' + i + '">' + (deja ? "Ajouter une autre fois" : "＋ Ajouter") + '</button></div><ul style="margin:8px 0 0;padding-left:0;list-style:none">' + t[1].map(function (c) { return '<li style="border-left:6px solid ' + COIDFAM[c[0]][1] + ';padding:3px 0 3px 8px;margin:3px 0">' + esc(c[1]) + (c[2].length ? '<span class="m"> · ☐ ' + c[2].map(esc).join(" · ☐ ") + "</span>" : "") + "</li>"; }).join("") + "</ul></div>"; }).join("");
      else
      if (tab === "g") { h += (G.prop ? '<p style="color:#B3261E;font-weight:800;border:2px solid #B3261E;border-radius:12px;padding:8px 12px;margin:0 0 10px">Proposition à relire : change les critères, les observables et les niveaux comme tu veux. <button type="button" class="co-t" data-vu>✓ J\'ai relu</button></p>' : "") + '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><input type="text" data-titre maxlength="60" value="' + esc(G.titre) + '" placeholder="Nom de la thématique. Ex. Le smash" aria-label="Nom de la thématique"><button type="button" class="co-t" data-gdel aria-label="Supprimer cette thématique">🗑</button></div><p class="m">Les élèves la trouvent sur « Choisis ta classe » : 👥 J\'observe un camarade. Elle ne change rien à ton évaluation.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"><button type="button" class="co-t' + (G.src === "own" ? " p" : "") + '" data-src="own">Ma grille de coévaluation</button><button type="button" class="co-t' + (G.src === "eval" ? " p" : "") + '" data-src="eval">Reprendre ma grille d\'évaluation</button></div>';
        h += '<h3>🙋 Regard de l\'élève observé</h3><div style="display:flex;gap:8px;flex-wrap:wrap">' + tg("auto", "L'élève observé s'auto-évalue ensuite") + tg("com", "Commentaire de chacun en cas de divergence") + tg("mot", "Un conseil écrit pour le camarade") + "</div>" +
          (G.auto ? '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px"><span class="m">Divergence signalée à partir de</span>' + [1, 2].map(function (n) { return '<button type="button" class="co-t' + (G.ecart === n ? " p" : "") + '" data-ecart="' + n + '">' + n + " niveau" + (n > 1 ? "x" : "") + " d'écart</button>"; }).join("") + "</div>" : "");
        if (G.src === "eval") h += (CR.length ? '<p class="m">Les élèves verront ces ' + CR.length + " critères, dans leur version élève :</p><ul>" + CR.map(function (c) { return "<li>" + esc(c.nom) + "</li>"; }).join("") + "</ul>" : '<p class="m">Grille d\'évaluation introuvable sur cet écran : ouvre l\'onglet Évaluation de l\'activité, puis reviens.</p>');
        else { var D = coDefN(NV), L = G.nn[NV] || [];
          h += '<h3>📶 Niveaux</h3><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' + [2, 3, 4, 5].map(function (n) { return '<button type="button" class="co-t' + (NV === n ? " p" : "") + '" data-nv="' + n + '">' + n + " niveaux</button>"; }).join("") + '</div><div class="g" style="display:grid;gap:6px;margin-top:6px;grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">' + D.map(function (d, j) { return '<input type="text" data-nn="' + j + '" maxlength="40" value="' + esc(L[j] || "") + '" placeholder="' + esc(d) + '" aria-label="Nom du niveau ' + (j + 1) + '">'; }).join("") + '</div><p class="m">Du plus faible au plus fort. Vide = le nom proposé en gris.</p>' +
            '<h3>🎨 Familles de critères</h3>' + G.fam.map(function (f, i) { return '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px"><input type="color" data-fcol="' + i + '" value="' + esc(/^#[0-9a-f]{6}$/i.test(f.col || "") ? f.col : "#14171C") + '" aria-label="Couleur de la famille ' + (i + 1) + '" style="width:48px;height:44px;border:1.5px solid #E6E1D6;border-radius:10px;padding:2px;background:#fff"><input type="text" data-fnom="' + i + '" maxlength="40" value="' + esc(f.nom || "") + '" placeholder="Nom de la famille. Ex. Moteur" aria-label="Nom de la famille ' + (i + 1) + '"><button type="button" class="co-t" data-frm="' + i + '" aria-label="Supprimer la famille ' + (i + 1) + '">✕</button></div>'; }).join("") +
            '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="co-t" data-fadd>＋ Famille</button>' + (G.fam.length ? "" : '<button type="button" class="co-t" data-fdef>Familles proposées…</button>') + '</div><p class="m">Une couleur par famille : elle se voit sur l\'écran de l\'élève et dans tes résultats.</p>' +
            "<h3>🧩 Critères (" + G.crit.length + " sur " + COMAXC + " au plus)</h3>" + G.crit.map(function (c, i) { var f = G.fam.filter(function (x) { return x.id === c.fam; })[0], O = Array.isArray(c.obs) ? c.obs : [];
              return '<div class="co-ed"' + (f ? ' style="border-left:8px solid ' + esc(f.col) + '"' : "") + '><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + (G.fam.length ? '<select data-cfam="' + i + '" aria-label="Famille du critère ' + (i + 1) + '" style="min-height:44px;border-radius:10px;border:1.5px solid #E6E1D6;padding:0 6px;font:700 14px system-ui"><option value="">Sans famille</option>' + G.fam.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === c.fam ? " selected" : "") + ">" + esc(x.nom || "Famille") + "</option>"; }).join("") + "</select>" : "") +
                '<input type="text" style="flex:1;min-width:200px" data-nom="' + i + '" maxlength="160" value="' + esc(c.nom || "") + '" placeholder="Ce que l\'observateur regarde. Ex. Il / elle se replace après son action" aria-label="Critère ' + (i + 1) + '">' + (i ? '<button type="button" class="co-t" data-up="' + i + '" aria-label="Monter le critère ' + (i + 1) + '">↑</button>' : "") + '<button type="button" class="co-t" data-rm="' + i + '" aria-label="Supprimer le critère ' + (i + 1) + '">✕</button></div><div class="g" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">' + N.map(function (n, j) { return '<input type="text" data-desc="' + i + "|" + j + '" maxlength="200" value="' + esc((c.desc || [])[j] || "") + '" placeholder="' + esc(n) + '" aria-label="Niveau ' + (j + 1) + '">'; }).join("") + "</div>" +
                O.map(function (t, j) { return '<div style="display:flex;gap:8px;align-items:center;margin-top:6px"><span aria-hidden="true">☐</span><input type="text" data-obs="' + i + "|" + j + '" maxlength="160" value="' + esc(t || "") + '" placeholder="Observable ' + (j + 1) + '. Ex. Regarde le ballon et les partenaires" aria-label="Observable ' + (j + 1) + " du critère " + (i + 1) + '"><button type="button" class="co-t" data-orm="' + i + "|" + j + '" aria-label="Supprimer l\'observable ' + (j + 1) + '">✕</button></div>'; }).join("") +
                (O.length < COMAXO ? '<button type="button" class="co-t" style="margin-top:6px" data-oadd="' + i + '">＋ Observable à cocher</button>' : "") + "</div>"; }).join("") +
            (G.crit.length ? "" : '<p class="m">Aucun critère pour l\'instant.</p>') + '<div style="display:flex;gap:8px;flex-wrap:wrap">' + (G.crit.length < COMAXC ? '<button type="button" class="co-t p" data-add>＋ Critère</button>' : "") + '</div><p class="m">Sous chaque critère : ses niveaux (vide = le nom du niveau), puis, si tu veux, des observables que l\'observateur coche.</p>'; }
        if (G.on && !CR.length) h += '<p class="m" style="color:#B3261E;font-weight:800">Ouverte, mais sans critère : les élèves ne verront rien.</p>'; }
      else { h += '<select data-cls aria-label="Classe" style="min-height:44px;border-radius:10px;border:1.5px solid #E6E1D6;padding:0 8px;font:700 15px system-ui;margin-bottom:10px"><option value="">— classe —</option>' + CL.map(function (c) { return "<option" + (c.nom === cls ? " selected" : "") + ">" + esc(c.nom) + "</option>"; }).join("") + "</select>";
        var c = CL.filter(function (x) { return x.nom === cls; })[0], th = function (x) { return '<th title="' + esc(x.nom) + '"' + (x.fam ? ' style="border-top:6px solid ' + x.fam.col + '"' : "") + ">" + esc(x.nom.length > 26 ? x.nom.slice(0, 25) + "…" : x.nom) + "</th>"; };
        if (c && det) { var m = coMoy(app, c.nom, det, gid); h += '<button type="button" class="co-t" data-back>← Retour</button><h3>' + esc(det) + "</h3>";
          h += !m ? '<p class="m">Aucune observation.</p>' : m.det.map(function (x) { var S = x.self || {}, C = x.com || {}, has = Object.keys(S).length;
            return '<div class="co-ed"><b>👥 Observé par ' + esc(x.n) + '</b> <span class="m">' + (x.t ? new Date(x.t).toLocaleDateString("fr-FR") : "") + '</span><div style="overflow-x:auto;margin-top:6px"><table><tr><th>Critère</th><th>👥 Camarade</th>' + (has ? "<th>🙋 Lui / elle</th>" : "") + "</tr>" + CR.filter(function (k) { return x.ev[k.id]; }).map(function (k) { var z = x.ev[k.id], nv = +z.nv || 4, i = z.i == null ? +z.d : +z.i, s = S[k.id], same = nv === k.desc.length, lab = function (j) { return (same ? esc(k.desc[j]) + " · " : "") + (j + 1) + " / " + nv; }, dv = s && s.i != null && Math.abs(s.i - i) >= G.ecart, cm = C[k.id], ob = Array.isArray(z.ob) && k.obs.length ? z.ob.length + " / " + k.obs.length + " observable" + (k.obs.length > 1 ? "s" : "") + " coché" + (z.ob.length > 1 ? "s" : "") : "";
              return "<tr" + (dv ? ' style="background:#FFF4D6"' : "") + '><td' + (k.fam ? ' style="border-left:6px solid ' + k.fam.col + '"' : "") + ">" + esc(k.nom) + (ob ? '<div class="m">' + ob + "</div>" : "") + (cm ? '<div class="m">' + (cm.o ? "👥 « " + esc(cm.o) + " » " : "") + (cm.s ? "🙋 « " + esc(cm.s) + " »" : "") + "</div>" : "") + '</td><td><b style="color:' + DCOL[z.d] + '">' + lab(i) + "</b></td>" + (has ? "<td>" + (s && s.i != null ? '<b style="color:' + DCOL[s.d] + '">' + lab(+s.i) + "</b>" + (dv ? " ⚠" : "") : "") + "</td>" : "") + "</tr>"; }).join("") + "</table></div>" + (x.mot ? '<p class="m">✍ Conseil : « ' + esc(x.mot) + " »</p>" : "") + "</div>"; }).join(""); }
        else if (c) { var ids = {}, rows = c.el.map(function (n) { var m = coMoy(app, c.nom, n, gid); if (m) Object.keys(m.ev).forEach(function (k) { ids[k] = 1; }); return { n: n, m: m }; }), K = CR.filter(function (x) { return ids[x.id]; }), autres = Object.keys(ids).filter(function (k) { return !CR.some(function (x) { return x.id === k; }); }).length, nb = rows.filter(function (r) { return r.m; }).length, au = rows.some(function (r) { return r.m && Object.keys(r.m.self).length; });
          h += nb ? '<div style="overflow-x:auto"><table><tr><th>Élève observé</th><th>👥</th>' + (au ? "<th>⚠</th>" : "") + K.map(th).join("") + "</tr>" + rows.map(function (r) { return "<tr><td>" + (r.m ? '<button type="button" class="co-lk" data-det="' + esc(r.n) + '">' + esc(r.n) + "</button>" : esc(r.n)) + "</td><td" + (r.m ? ' title="Observé par : ' + esc(r.m.qui.join(", ")) + '"' : "") + ">" + (r.m ? r.m.n : "–") + "</td>" + (au ? "<td>" + (r.m && r.m.div ? "<b>" + r.m.div + "</b>" : "") + "</td>" : "") + K.map(function (x) { var z = r.m && r.m.ev[x.id], s = r.m && r.m.self[x.id]; return "<td>" + (z ? '<b style="color:' + DCOL[z.d] + '" title="' + esc(x.desc[Math.min(x.desc.length - 1, Math.round(z.r != null ? z.r : z.d))] || "") + '">👥 ' + lv(z) + "</b>" : "") + (s ? '<div style="color:' + DCOL[s.d] + ';font-weight:700">🙋 ' + lv({ r: s.r, nv: z ? z.nv : NV, d: s.d }) + "</div>" : "") + "</td>"; }).join("") + "</tr>"; }).join("") + '</table></div><p class="m">Touche un nom pour le détail : qui l\'a observé, ses réponses' + (au ? ", son auto-évaluation, les commentaires" : "") + ". 👥 = nombre de camarades qui l'ont observé ; niveau moyen." + (au ? " 🙋 = son propre regard ; ⚠ = nombre de divergences." : "") + (autres ? " D'anciennes observations portent sur des critères que la grille n'a plus." : "") + "</p>" : '<p class="m">Aucune observation pour cette classe.</p>'; } }
      busy = 1; try { ov.innerHTML = h + "</div>"; } finally { busy = 0; }
      var q = function (x) { return ov.querySelector(x); }, qa = function (x) { return [].slice.call(ov.querySelectorAll(x)); }, on = function (x, f) { qa(x).forEach(function (b) { b.onclick = function () { f(b); }; }); }, ch = function (x, f) { qa(x).forEach(function (b) { b.onchange = function () { f(b); }; }); }, sd = function () { save(); draw(); }, sl = function () { save(); setTimeout(draw, 0); };
      q("[data-x]").onclick = function () { coLive = null; ov.remove(); if (o.onClose) try { o.onClose(); } catch (e) {} };
      on("[data-tab]", function (b) { tab = b.dataset.tab; det = ""; draw(); });
      on("[data-gid]", function (b) { gid = b.dataset.gid; G = coGrid(app, gid); det = ""; draw(); });
      on("[data-gnew]", function () { gid = "t" + Date.now().toString(36); G = coGrid(app, gid); G.c = Date.now(); tab = "g"; det = ""; sd(); var f = q("[data-titre]"); if (f) try { f.focus(); } catch (e) {} });
      ch("[data-titre]", function (f) { G.titre = f.value.trim(); sl(); });
      on("[data-vu]", function () { G.prop = 0; sd(); });
      on("[data-gdel]", function () { if (!confirm("Supprimer la thématique « " + coTitre(G) + " » et sa grille ? Les observations déjà faites restent enregistrées.")) return; coPut({ id: G.id, k: "g", app: app, del: 1 }); gid = coGrids(app)[0].gid; G = coGrid(app, gid); draw(); });
      on("[data-idee]", function (b) { var t = ID[+b.dataset.idee]; if (!confirm("Ajouter la thématique « " + t[0] + " » (" + t[1].length + " critères proposés) ?\n\nElle sera fermée aux élèves : tu la relis, tu la modifies, puis tu l'ouvres.")) return; var k = Date.now().toString(36); gid = "t" + k; G = coGrid(app, gid); G.c = Date.now(); G.titre = t[0]; G.prop = 1; G.fam = COIDFAM.map(function (f, i) { return { id: "f" + k + i, nom: f[0], col: f[1] }; }); G.crit = t[1].map(function (c, i) { return { id: "k" + k + i, nom: c[1], fam: G.fam[c[0]].id, desc: [], obs: c[2].slice() }; }); tab = "g"; sd(); });
      if (q("[data-on]")) q("[data-on]").onclick = function () { G.on = G.on ? 0 : 1; sd(); };
      on("[data-src]", function (b) { G.src = b.dataset.src; sd(); });
      on("[data-opt]", function (b) { var k = b.dataset.opt; G[k] = G[k] ? 0 : 1; if (k === "com" && G.com) G.auto = 1; if (k === "auto" && !G.auto) G.com = 0; sd(); });
      on("[data-ecart]", function (b) { G.ecart = +b.dataset.ecart; sd(); });
      on("[data-nv]", function (b) { G.nv = +b.dataset.nv; sd(); });
      ch("[data-nn]", function (f) { var L = G.nn[G.nv] || (G.nn[G.nv] = []); L[+f.dataset.nn] = f.value.trim().slice(0, 40); sl(); });
      on("[data-fadd]", function () { if (G.fam.length >= 8) return; G.fam.push({ id: "f" + Date.now().toString(36) + G.fam.length, nom: "", col: ["#1D4ED8", "#B45309", "#1E6B3A", "#9D174D", "#6D28D9", "#0E7490", "#B3261E", "#4B5563"][G.fam.length % 8] }); sd(); var L = qa("[data-fnom]"); if (L.length) try { L[L.length - 1].focus(); } catch (e) {} });
      on("[data-fdef]", function () { if (!confirm("Ajouter ces trois familles proposées ?\n\n" + COFAM.map(function (f) { return "• " + f[0]; }).join("\n") + "\n\nTu pourras changer leur nom et leur couleur.")) return; COFAM.forEach(function (f, i) { G.fam.push({ id: "f" + Date.now().toString(36) + i, nom: f[0], col: f[1] }); }); sd(); });
      ch("[data-fnom]", function (f) { G.fam[+f.dataset.fnom].nom = f.value.trim(); sl(); });
      ch("[data-fcol]", function (f) { G.fam[+f.dataset.fcol].col = f.value; sl(); });
      on("[data-frm]", function (b) { var f = G.fam[+b.dataset.frm], n = G.crit.filter(function (c) { return c.fam === f.id; }).length; if (n && !confirm("Supprimer cette famille ? " + n + " critère" + (n > 1 ? "s" : "") + " resteront, sans famille.")) return; G.crit.forEach(function (c) { if (c.fam === f.id) c.fam = ""; }); G.fam.splice(+b.dataset.frm, 1); sd(); });
      ch("[data-cfam]", function (f) { G.crit[+f.dataset.cfam].fam = f.value; sl(); });
      ch("[data-nom]", function (f) { G.crit[+f.dataset.nom].nom = f.value.trim(); save(); });
      ch("[data-desc]", function (f) { var p = f.dataset.desc.split("|"), c = G.crit[+p[0]]; c.desc = Array.isArray(c.desc) ? c.desc : []; c.desc[+p[1]] = f.value.trim(); save(); });
      ch("[data-obs]", function (f) { var p = f.dataset.obs.split("|"); G.crit[+p[0]].obs[+p[1]] = f.value.trim(); save(); });
      on("[data-oadd]", function (b) { var c = G.crit[+b.dataset.oadd]; c.obs = Array.isArray(c.obs) ? c.obs : []; if (c.obs.length >= COMAXO) return; c.obs.push(""); sd(); var L = qa('[data-obs^="' + b.dataset.oadd + '|"]'); if (L.length) try { L[L.length - 1].focus(); } catch (e) {} });
      on("[data-orm]", function (b) { var p = b.dataset.orm.split("|"); G.crit[+p[0]].obs.splice(+p[1], 1); sd(); });
      on("[data-up]", function (b) { var i = +b.dataset.up, c = G.crit.splice(i, 1)[0]; G.crit.splice(i - 1, 0, c); sd(); });
      on("[data-add]", function () { if (G.crit.length >= COMAXC) return; G.crit.push({ id: "k" + Date.now().toString(36) + G.crit.length, nom: "", fam: "", desc: [], obs: [] }); sd(); var L = qa("[data-nom]"); if (L.length) try { L[L.length - 1].focus(); } catch (e) {} });
      on("[data-rm]", function (b) { var c = G.crit[+b.dataset.rm]; if (String(c.nom || "").trim() && !confirm("Supprimer ce critère de ta grille de coévaluation ?")) return; G.crit.splice(+b.dataset.rm, 1); sd(); });
      on("[data-det]", function (b) { det = b.dataset.det; draw(); });
      on("[data-back]", function () { det = ""; draw(); });
      if (q("[data-cls]")) q("[data-cls]").onchange = function () { cls = this.value; det = ""; draw(); }; }
    /* les observations arrivent d'une autre tablette : l'onglet Résultats se met à jour seul */
    coLive = function () { if (document.getElementById("co-ov") === ov && tab === "r") draw(); };
    draw(); return ov; }
  try { (function reg(n) { if (window.EPSD && EPSD.store) { EPSD.store({ key: KCO, pre: "cv|", onChange: function () { try { if (coLive) coLive(); } catch (e) {} } }); return; } if ((n || 0) < 60) setTimeout(function () { reg((n || 0) + 1); }, 500); })(0); } catch (e) {}
  /* ressource commune de « Choisis ta classe » : visible seulement quand la grille de l'activité est ouverte et a des critères */
  (function () { var m = /\/(escalade|relais|volley|badminton|danse|acrosport|orientation|crosstraining|basket|step)\//.exec(location.pathname); if (!m) return; var app = Object.keys(CODIR).filter(function (k) { return CODIR[k] === m[1]; })[0]; if (!app) return;
    (window.EPSG_COMMON = window.EPSG_COMMON || []).push({ ico: "👥", label: "J'observe un camarade", sub: "Coévaluation", when: function () { return coGrids(app).some(function (g) { return !!g.on && (g.src === "eval" || g.crit.some(function (c) { return String(c.nom || "").trim(); })); }); }, open: function () { var c = null; try { c = window.epsCurrentClass && epsCurrentClass(); } catch (e) {} coEleve({ app: app, cls: c && c.nom, color: (window.EPSG_Q && EPSG_Q[0] && EPSG_Q[0].color) || "#14171C" }); } }); })();

  function create(A) {
    var HASH = "#auto=", SEQ = "eps.eval.seq." + A.app;
    if (document.head) css(); else document.addEventListener("DOMContentLoaded", function () { css(); });
    var M = {};
    function S() { return A.settings() || {}; }
    function ouvert() { var s = S(); return !!s.apOuvert && (!s.apJusqua || today() <= s.apJusqua); }
    function etat() { var s = S(); if (ouvert()) return s.apJusqua ? "Ouvert jusqu'au " + dIso(s.apJusqua) + " : un lien personnel figure sur chaque fiche PDF." : "Ouvert : un lien personnel figure sur chaque fiche PDF.";
      return s.apOuvert ? "Date dépassée : les liens ne fonctionnent plus." : "Fermé : aucun lien sur les fiches, les élèves ne peuvent pas se positionner."; }
    function pageUrl() { if (/^https?:$/.test(location.protocol)) return location.href.split("#")[0].split("?")[0]; return A.url; }
    /* boîte de dépôt : réglage propre à l'appli, sinon le script commun (EPSD.boite), sinon l'ancien script de Danse */
    function boite() { var s = S(); try { if (window.EPSD && EPSD.boite) return EPSD.boite({ url: s.envoiUrl, key: s.envoiCle }); } catch (e) {}
      var url = (s.envoiUrl || "").trim(), key = (s.envoiCle || "").trim(), src = "appli"; if (!url || !key) { var d = envoiDanse(); url = d.url; key = d.key; src = "danse"; }
      var c = /^https:\/\/\S+\/exec$/.test(url) && key ? { url: url, key: key, src: src, id: src } : null; return { envoi: c, lire: c ? [c] : [] }; }
    function envoi() { return boite().envoi; }
    async function cle(secret, id) { return u8b64((await hmac(secret, A.app + "|k|" + id)).slice(0, 16)); }
    async function depot(cfg, cnom, n) { var id = A.pfx + u8b64((await hmac(cfg.key, A.app + "|id|" + nk(cnom) + "|" + nk(n.nom) + "|" + nk(n.prenom))).slice(0, 12)); return { id: id, k: await cle(cfg.key, id) }; }
    async function lien(E, c) {
      var n = A.name(E), t = [n.nom, n.prenom || "", c.nom, (S().apJusqua || "").replace(/-/g, "")], cfg = envoi();
      if (cfg && cryptoOk()) { try { var d = await depot(cfg, c.nom, n); t.push(d.id, d.k, sidDe(cfg.url) || cfg.url); } catch (e) {} }
      return pageUrl() + HASH + b64e(JSON.stringify(t));
    }
    function trouver(nom, prenom, classe) {
      var cible = nk(nom + " " + prenom), inv = nk(prenom + " " + nom), C = A.classes();
      var ordre = C.filter(function (c) { return nk(c.nom) === nk(classe); }).concat(C.filter(function (c) { return nk(c.nom) !== nk(classe); }));
      for (var i = 0; i < ordre.length; i++) { var c = ordre[i]; for (var j = 0; j < c.eleves.length; j++) { var n = A.name(c.eleves[j]), a = nk(n.nom + " " + (n.prenom || "")); if (a === cible || a === inv) return { c: c, e: c.eleves[j] }; } }
      return null;
    }
    function payload(P) { var a = {}; A.grid().criteres.forEach(function (cr) { var x = P.ev[cr.id]; if (x) a[cr.id] = [x.d + 1, Math.round(x.pos * 100) / 100]; }); return { n: P.nom.trim(), p: P.prenom.trim(), c: P.classe.trim(), a: a, r: (P.reussi || "").trim(), m: (P.ameliorer || "").trim(), t: Date.now() }; }
    function depuis(d, via) { var ev = {}; Object.keys(d.a || {}).forEach(function (id) { var v = d.a[id]; if (v && v[0]) ev[id] = { d: v[0] - 1, pos: +v[1] || 0 }; }); return { ev: ev, r: d.r || "", m: d.m || "", t: d.t || Date.now(), via: via }; }
    function poser(f, d, via) { var a = A.getAp(f.e); if (a && (a.t || 0) >= (d.t || 0)) return false; A.setAp(f.e, depuis(d, via)); return true; }
    var releve = false, dernier = 0;
    async function relever(force) {
      var srcs = boite().lire; if (!srcs.length) return { err: "reglage" };
      if (!cryptoOk() || releve || (!force && Date.now() - dernier < 15000)) return null;
      releve = true; dernier = Date.now();
      var n = 0, inconnus = 0, err = null, okUn = false, re = new RegExp("^dan\\|" + A.pfx), seqs = {}; try { seqs = JSON.parse(localStorage.getItem(SEQ + ".m") || "{}") || {}; } catch (e) {}
      try {
        for (var si = 0; si < srcs.length; si++) { var cfg = srcs[si], since = seqs[cfg.id] != null ? seqs[cfg.id] : (cfg.src !== "commun" ? +(localStorage.getItem(SEQ) || 0) : 0), more = true, garde = 0, e1 = null;
          while (more && garde++ < 20) {
            var r = await jsonpGet(cfg.url, { key: cfg.key, drops: 1, since: since });
            if (!r) { e1 = "connexion"; break; } if (!r.keyOk) { e1 = "cle"; break; } if (!Array.isArray(r.drops)) { e1 = "script"; break; }
            for (var i = 0; i < r.drops.length; i++) { var x = r.drops[i]; since = Math.max(since, +x[0] || 0); if (!re.test(String(x[1]))) continue;
              try { var d = await dechiffrer(await cle(cfg.key, String(x[1]).slice(4)), x[3]), f = trouver(d.n, d.p, d.c); if (!f) { inconnus++; continue; } if (poser(f, d, "lien")) n++; } catch (e) {} }
            more = !!r.more;
          }
          if (e1) err = err || e1; else okUn = true; seqs[cfg.id] = since;
        }
        try { localStorage.setItem(SEQ + ".m", JSON.stringify(seqs)); } catch (e) {}
        return okUn ? { n: n, inconnus: inconnus } : { err: err };
      } finally { releve = false; }
    }
    function msg(r) { return !r ? "" : r.err === "connexion" ? "Pas de connexion au script Google." : r.err === "cle" ? "Clé secrète refusée par le script." : r.err === "script" ? "Ce n'est pas le script des auto-positionnements." : r.err === "reglage" ? "Envoi automatique non réglé." : r.n ? r.n + " nouveau(x) positionnement(s) reçu(s)" + (r.inconnus ? ", " + r.inconnus + " élève(s) non reconnu(s)" : "") + "." : "Rien de nouveau."; }
    setInterval(function () { if (!isT_() || !boite().lire.length || document.hidden || !ouvert()) return; relever(false).then(function (r) { if (r && r.n) { toast("🙋 " + r.n + " auto-positionnement" + (r.n > 1 ? "s" : "") + " reçu" + (r.n > 1 ? "s" : "")); try { A.changed(); } catch (e) {} } }); }, 30000);
    function codeDe(P) { return A.code + "." + b64e(JSON.stringify(payload(P))); }
    function importer(txt) {
      var codes = String(txt || "").match(new RegExp(A.code.replace(/\./g, "\\.") + "\\.[A-Za-z0-9_-]+", "g")) || []; if (!codes.length) { toast("Aucun code trouvé"); return; }
      var ok = 0, inc = []; codes.forEach(function (k) { var d; try { d = JSON.parse(b64d(k.slice(A.code.length + 1))); } catch (e) { inc.push("code illisible"); return; }
        var f = trouver(d.n, d.p, d.c); if (!f) { inc.push((d.p + " " + d.n).trim() + (d.c ? " (" + d.c + ")" : "")); return; } poser(f, d, "code"); ok++; });
      alert(ok + " auto-positionnement(s) importé(s)." + (inc.length ? "\nNon reconnus (vérifie l'orthographe) : " + inc.join(", ") : "")); try { A.changed(); } catch (e) {}
    }
    function ecart(cr, E) { var v = A.prof(cr, E), a = A.getAp(E), x = a && a.ev && a.ev[cr.id]; if (!v || v.d == null || !x) return null; return (x.d + x.pos) - (v.d + v.pos); }

    /* ---------- vue élève (lien personnel ou tablette en mode élève) ---------- */
    var LIEN = (function () { var m = /^#auto=(.+)$/.exec(location.hash); if (m) { try { sessionStorage.setItem("epse.lien." + A.app, m[1]); } catch (e) {} return m[1]; } try { return sessionStorage.getItem("epse.lien." + A.app) || ""; } catch (e) { return ""; } })();
    var TAB = "epse.tab." + A.app; /* tablette passée en mode élève : classe choisie */
    var P = null;
    function ctx() {
      var tok = LIEN || ((/^#auto=(.+)$/.exec(location.hash) || [])[1]);
      if (tok) { var t; try { t = JSON.parse(b64d(tok)); } catch (e) { return { err: "Ce lien est incomplet : vérifie que tu l'as bien ouvert en entier depuis ta fiche." }; }
        if (!Array.isArray(t)) return { err: "Ce lien n'est pas valide." }; var x = String(t[3] || ""), fin = x.length === 8 ? x.slice(0, 4) + "-" + x.slice(4, 6) + "-" + x.slice(6) : "";
        if (fin && today() > fin) return { err: "Ce lien était valable jusqu'au " + dIso(fin) + ". Demande à ton enseignant s'il peut rouvrir l'auto-positionnement." };
        return { ident: { n: t[0] || "", p: t[1] || "", c: t[2] || "", x: fin, drop: t[4] && t[5] && t[6] ? { id: t[4], k: t[5], sid: t[6] } : null } }; }
      if (!ouvert()) return { err: "L'auto-positionnement n'est pas ouvert pour le moment." };
      var cl = null; try { cl = sessionStorage.getItem(TAB); } catch (e) {}
      var c = A.classes().filter(function (x) { return x.nom === cl; })[0];
      return { ident: null, classe: c || null };
    }
    function apActif() { if (LIEN || /^#auto=/.test(location.hash)) return true; try { return !!sessionStorage.getItem(TAB); } catch (e) { return false; } }
    function vue() { var v = document.getElementById("epse-ap-" + A.app); if (!v) { css(); v = document.createElement("div"); v.id = "epse-ap-" + A.app; v.className = "epse epse-ap"; v.style.setProperty("--app", A.color); v.style.zIndex = "2147483300"; document.body.appendChild(v); } return v; }
    function apShow() { if (!apActif()) return; document.body.classList.add("epse-lock"); document.querySelectorAll(".epsg").forEach(function (x) { x.remove(); }); renderAp(); }
    function bar(sub, quit) { return '<div class="epse-bar"><span class="ei">' + (A.icon || "") + "</span><b>" + esc(A.nom) + "</b><small>" + esc(sub) + "</small>" + (quit ? '<button data-q="1">🔒 Quitter</button>' : "") + "</div>"; }
    function renderAp() {
      var V = vue(), C = ctx(), G = A.grid(), top = bar("Je me positionne · " + A.ca, !C.ident);
      if (C.err) { V.innerHTML = top + '<div class="ap-in"><div class="epse-card" style="text-align:center"><div style="font-size:44px">🔒</div><h1>Auto-positionnement fermé</h1><p>' + esc(C.err) + "</p></div></div>"; bindQ(V); return; }
      if (!P) { P = { etape: "form", eleve: -1, nom: "", prenom: "", classe: "", ev: {}, reussi: "", ameliorer: "", code: "" }; if (C.ident) { P.nom = C.ident.n; P.prenom = C.ident.p; P.classe = C.ident.c; } }
      var recap = function () { return '<div class="epse-chips" style="justify-content:center;margin:12px 0">' + G.criteres.map(function (cr) { var x = P.ev[cr.id]; return '<span class="epse-chip" style="border-color:' + (x ? DCOL[x.d] : "#ccc") + '"><b>' + esc(cr.nomEl || cr.nom) + "</b><small>" + (x ? esc((G.degresEl || G.degres)[x.d]) : "—") + "</small></span>"; }).join("") + "</div>"; };
      var fin = function (h) { V.innerHTML = top + '<div class="ap-in"><div class="epse-card" style="text-align:center">' + h + "</div></div>"; bindQ(V); var b = V.querySelector("[data-next]"); if (b) b.onclick = function () { P = null; renderAp(); };
        var r = V.querySelector("[data-retry]"); if (r) r.onclick = envoyer; var cp = V.querySelector("[data-copy]"); if (cp) cp.onclick = function () { copier(P.code); }; var md = V.querySelector("[data-mod]"); if (md) md.onclick = function () { P.etape = "form"; renderAp(); }; };
      if (P.etape === "merci") return fin('<div style="font-size:44px">✅</div><h1>Merci ' + esc(P.prenom) + " !</h1><p>Ton positionnement est enregistré.</p>" + recap() + '<button class="epse-btn p" data-next="1">Élève suivant</button>');
      if (P.etape === "envoi") return fin('<div class="epse-spin"></div><h1>Envoi en cours…</h1><p>Ne ferme pas cette page.</p>');
      if (P.etape === "envoye") return fin('<div style="font-size:44px">✅</div><h1>Merci ' + esc(P.prenom) + " !</h1><p>Ton positionnement a bien été <b>envoyé à ton enseignant</b>. Tu n'as rien d'autre à faire.</p>" + recap());
      if (P.etape === "code") return fin("<h1>C'est presque fini, " + esc(P.prenom) + " !</h1>" + (P.echec ? '<p style="color:#C0392B;font-weight:700">L\'envoi automatique n\'a pas fonctionné (connexion ?). Réessaie, ou utilise le code ci-dessous.</p><button class="epse-btn" data-retry="1">Réessayer l\'envoi</button>' : "") +
        "<p>Copie ce code et <b>envoie-le à ton enseignant</b> par la messagerie Pronote :</p><div class=\"epse-code\">" + esc(P.code) + '</div><div class="epse-row" style="justify-content:center"><button class="epse-btn p" data-copy="1">Copier mon code</button><button class="epse-btn" data-mod="1">Modifier mes réponses</button></div>' + recap());
      /* pas à pas (règle commune) : 0 = qui es-tu, 1…N = un critère par écran, N+1 = mes mots + récapitulatif */
      var N = G.criteres.length, DGL = G.degresEl || G.degres; if (P.step == null) P.step = 0; P.step = Math.max(0, Math.min(N + 1, P.step));
      var ident, ok1 = true, corps;
      if (C.ident) ident = '<p>Bonjour <b>' + esc((P.prenom + " " + P.nom).trim()) + "</b>" + (P.classe ? " · " + esc(P.classe) : "") + "</p>";
      else if (C.classe && C.classe.eleves.length) { ident = '<label class="epse-mut" style="font-weight:800;font-size:17px">Je suis<select class="f" data-who="1" style="min-height:54px;font-size:17px"><option value="-1">— choisis ton nom —</option>' + C.classe.eleves.map(function (e, i) { var n = A.name(e); return '<option value="' + i + '"' + (P.eleve === i ? " selected" : "") + ">" + esc((n.prenom + " " + n.nom).trim()) + "</option>"; }).join("") + "</select></label>"; ok1 = P.eleve >= 0; }
      else { ident = '<p class="epse-mut">Aucune liste d\'élèves pour cette classe : demande à ton enseignant.</p>'; ok1 = false; }
      var prog = '<div class="epse-prog">' + Array.apply(null, Array(N + 2)).map(function (_, i) { return '<i class="' + (i < P.step ? "ok" : i === P.step ? "on" : "") + '"></i>'; }).join("") + "<span>Étape " + (P.step + 1) + " / " + (N + 2) + "</span></div>";
      if (P.step === 0) corps = '<div class="epse-card"><h1>Je me positionne · ' + esc(A.nom) + "</h1>" + ident +
        "<p>Tu vas répondre à <b>" + N + " question" + (N > 1 ? "s" : "") + "</b>, une à la fois. Pour chacune : <b>1.</b> lis les 4 niveaux et touche celui qui te ressemble le plus ; <b>2.</b> précise avec le curseur où tu en es dans ce niveau. Sois honnête : c'est pour t'aider à progresser !</p></div>";
      else if (P.step <= N) { var cr = G.criteres[P.step - 1], x = P.ev[cr.id]; ok1 = !!x;
        corps = '<p class="epse-mut" style="font-weight:800;margin:0 0 6px">Question ' + P.step + " sur " + N + '</p><div class="epse-crit" id="epse-c-' + esc(cr.id) + '"><div class="epse-ch"><b>' + esc(cr.nomEl || cr.nom) + "</b><span>" + esc(cr.afl || "") + "</span></div>" + (cr.butEl || cr.but ? '<p class="epse-mut" style="margin:0 0 8px">' + esc(cr.butEl || cr.but) + "</p>" : "") +
          '<div class="epse-degs">' + [0, 1, 2, 3].map(function (d) { return '<button class="epse-deg' + (x && x.d === d ? " on" : "") + '" style="--dc:' + DCOL[d] + ";--dt:" + DTINT[d] + '" data-c="' + esc(cr.id) + '" data-d="' + d + '"><b>Niveau ' + (d + 1) + " · " + esc(DGL[d]) + "</b>" + esc((cr.descEl || cr.desc)[d] || "") + "</button>"; }).join("") + "</div>" +
          (x ? '<div class="epse-intra" style="--dc:' + DCOL[x.d] + '"><span>Dans ce niveau, je suis…</span><input type="range" min="0" max="4" step="1" value="' + Math.round(x.pos * 4) + '" data-p="' + esc(cr.id) + '"><b id="epse-pv-' + esc(cr.id) + '" style="color:' + DCOL[x.d] + '">' + esc(posLbl(x.d, x.pos)) + "</b></div>" : "") + "</div>"; }
      else corps = '<div class="epse-card"><h2 style="margin-top:0">Pour finir, avec tes mots</h2><label class="epse-mut" style="font-weight:800">Ce que je pense avoir réussi<textarea rows="3" data-t="reussi" placeholder="J\'ai réussi à…">' + esc(P.reussi) + '</textarea></label><label class="epse-mut" style="font-weight:800">Ce que je veux améliorer<textarea rows="3" data-t="ameliorer" placeholder="Je voudrais…">' + esc(P.ameliorer) + "</textarea></label></div>" +
        '<div class="epse-card"><b>Mes réponses</b> <span class="epse-mut">(touche une réponse pour la changer)</span>' + G.criteres.map(function (cr, i) { var x = P.ev[cr.id];
          return '<button class="epse-ri" data-go="' + (i + 1) + '" style="--dc:' + (x ? DCOL[x.d] : "#bbb") + '"><span>' + esc(cr.nomEl || cr.nom) + "</span><b>" + (x ? "Niveau " + (x.d + 1) + " · " + esc(posLbl(x.d, x.pos)) : "à faire") + "</b></button>"; }).join("") + "</div>";
      var nav = '<div class="epse-nav">' + (P.step ? '<button class="epse-btn" data-prev="1">← Retour</button>' : "<span></span>") + (P.step <= N ? '<button class="epse-btn p" data-suiv="1"' + (ok1 ? "" : " disabled") + ">Suivant →</button>" : '<button class="epse-btn p" data-ok="1">Valider mon positionnement</button>') + "</div>";
      V.innerHTML = top + '<div class="ap-in">' + prog + corps + nav + "</div>";
      bindQ(V);
      var go = function (k) { P.step = k; renderAp(); V.scrollTop = 0; };
      var w = V.querySelector("[data-who]"); if (w) w.onchange = function () { var i = +w.value, e = C.classe && C.classe.eleves[i], a = e && A.getAp(e);
        if (a && a.ev && Object.keys(a.ev).length && !confirm((A.name(e).prenom || A.name(e).nom) + ", tu t'es déjà positionné(e)" + (a.t ? " le " + new Date(a.t).toLocaleDateString("fr-FR") : "") + ".\nSi tu continues, ta nouvelle réponse remplacera l'ancienne.\n\nOK = c'est moi, je recommence · Annuler = ce n'est pas moi")) { P.eleve = -1; renderAp(); return; }
        P.eleve = i; renderAp(); };
      V.querySelectorAll("[data-d]").forEach(function (b) { b.onclick = function () { var id = b.dataset.c, d = +b.dataset.d; if (!P.ev[id] || P.ev[id].d !== d) P.ev[id] = { d: d, pos: .5 }; renderAp(); }; });
      V.querySelectorAll("[data-p]").forEach(function (r) { r.oninput = function () { var x = P.ev[r.dataset.p]; x.pos = (+r.value) / 4; var s = document.getElementById("epse-pv-" + r.dataset.p); if (s) s.textContent = posLbl(x.d, x.pos); }; });
      V.querySelectorAll("[data-t]").forEach(function (t) { t.oninput = function () { P[t.dataset.t] = t.value; }; });
      /* débuts de phrase à toucher pour aider l'élève à écrire (modifiables : 🎛 Paramètres → Auto-positionnement) */
      try { var AID = { reussi: ["J'ai réussi à ", "Je sais maintenant ", "Je suis fier de "], ameliorer: ["Je veux améliorer ", "La prochaine fois, je ", "J'ai encore du mal à "] };
        if (window.EPSP && EPSP.p) { AID.reussi = EPSP.p({ id: "ap_aide_reussi", sec: "Auto-positionnement", label: "Débuts de phrase : ce que j'ai réussi", type: "list", def: AID.reussi }) || AID.reussi; AID.ameliorer = EPSP.p({ id: "ap_aide_ameliorer", sec: "Auto-positionnement", label: "Débuts de phrase : ce que je veux améliorer", type: "list", def: AID.ameliorer }) || AID.ameliorer; }
        V.querySelectorAll('textarea[data-t="reussi"], textarea[data-t="ameliorer"]').forEach(function (t) { var L = AID[t.dataset.t] || []; if (!L.length || t.parentNode.querySelector(".epse-aide")) return; var d = document.createElement("div"); d.className = "epse-aide"; d.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 2px";
          L.forEach(function (x) { var b = document.createElement("button"); b.type = "button"; b.textContent = String(x).trim() + "…"; b.style.cssText = "min-height:40px;padding:0 12px;border-radius:999px;border:1.5px solid #E6E1D6;background:#fff;font:700 14px system-ui,sans-serif;color:#14171C";
            b.onclick = function (ev) { ev.preventDefault(); var s = String(x).replace(/\s*$/, " "); t.value = (t.value && !/\s$/.test(t.value) ? t.value + " " : t.value) + s; P[t.dataset.t] = t.value; t.focus(); }; d.appendChild(b); });
          t.parentNode.insertBefore(d, t); }); } catch (e) {}
      V.querySelectorAll("[data-go]").forEach(function (b) { b.onclick = function () { go(+b.dataset.go); }; });
      var bp = V.querySelector("[data-prev]"); if (bp) bp.onclick = function () { go(P.step - 1); };
      var bs = V.querySelector("[data-suiv]"); if (bs) bs.onclick = function () { if (ok1) go(P.step + 1); };
      var bo = V.querySelector("[data-ok]"); if (bo) bo.onclick = valider;
    }
    function bindQ(V) { var q = V.querySelector("[data-q]"); if (q) q.onclick = quitter; }
    async function quitter() { await A.unlock(); if (!isT_()) return; try { sessionStorage.removeItem(TAB); } catch (e) {} P = null; document.body.classList.remove("epse-lock"); var v = document.getElementById("epse-ap-" + A.app); if (v) v.remove(); try { A.changed(); } catch (e) {} }
    function copier(t) { try { navigator.clipboard.writeText(t).then(function () { toast("Copié !"); }, function () { prompt("Copie ce code :", t); }); } catch (e) { prompt("Copie ce code :", t); } }
    function valider() {
      var G = A.grid(), C = ctx(), manque = G.criteres.filter(function (cr) { return !P.ev[cr.id]; });
      if (manque.length) { toast("Il te manque une réponse"); P.step = G.criteres.indexOf(manque[0]) + 1; renderAp(); vue().scrollTop = 0; return; }
      if (!C.ident) { var c = C.classe, e = c && c.eleves[P.eleve]; if (!e) { toast("Choisis ton nom dans la liste"); P.step = 0; renderAp(); return; } var nn = A.name(e); P.nom = nn.nom; P.prenom = nn.prenom || ""; P.classe = c.nom;
        poser({ e: e }, payload(P), "tablette"); try { A.changed(); } catch (x) {} P.etape = "merci"; renderAp(); vue().scrollTop = 0; return; }
      P.code = codeDe(P);
      if (C.ident.drop && cryptoOk()) { envoyer(); return; }
      P.etape = "code"; renderAp(); vue().scrollTop = 0;
    }
    async function envoyer() {
      var C = ctx(), drop = C.ident && C.ident.drop; if (!drop) return; P.etape = "envoi"; renderAp(); var ok = false, x = "";
      try { var url = urlScript(drop.sid), k = "dan|" + drop.id; x = await chiffrer(drop.k, payload(P));
        await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ drop: { k: k, x: x } }) });
        for (var i = 0; i < 5 && !ok; i++) { await pause(i ? 2000 : 800); var r = await jsonpGet(url, { dropchk: k }); if (r && r.drop && r.drop === x.slice(0, 16)) ok = true; } } catch (e) {}
      P.echec = !ok; P.etape = ok ? "envoye" : "code"; renderAp();
    }
    M.modeEleve = function (classe) { if (!ouvert()) { toast("Ouvre d'abord l'auto-positionnement"); return; } try { sessionStorage.setItem(TAB, classe); } catch (e) {} P = null; apShow(); };
    if (LIEN && location.hash !== HASH + LIEN) try { history.replaceState(null, "", location.pathname + location.search + HASH + LIEN); } catch (e) {}
    if (apActif()) { if (document.body) apShow(); else document.addEventListener("DOMContentLoaded", apShow); }
    addEventListener("hashchange", function () { if (/^#auto=/.test(location.hash)) apShow(); });
    M.actif = apActif;

    /* ---------- carte « Auto-positionnement » (bilan, côté enseignant) ---------- */
    M.card = function (c) {
      var s = S(), cfg = envoi(), G = A.grid(), cs = G.criteres, recu = c.eleves.filter(function (e) { var a = A.getAp(e); return a && a.ev && Object.keys(a.ev).length; });
      var rows = c.eleves.map(function (e) { var a = A.getAp(e), n = A.name(e);
        var co = coMoy(A.app, c.nom, ((n.prenom || "") + " " + (n.nom || "")).trim());
        return '<tr><td class="l">' + esc((n.prenom + " " + n.nom).trim()) + (co ? ' <small class="epse-mut" title="Observé par : ' + esc(co.qui.join(", ")) + '">👥 ' + co.n + "</small>" : "") + "</td>" + cs.map(function (cr) { var v = A.prof(cr, e), x = a && a.ev && a.ev[cr.id], g = ecart(cr, e), z = co && co.ev[cr.id];
          return "<td>" + (v && v.d != null ? '<span class="epse-d" style="background:' + DCOL[v.d] + '">D' + (v.d + 1) + "</span>" : "–") + (x ? ' <span class="epse-d e" style="border-color:' + DCOL[x.d] + ";color:" + DCOL[x.d] + '">🙋 D' + (x.d + 1) + "</span>" : "") + (z ? ' <span class="epse-d e" style="border-style:dashed;border-color:' + DCOL[z.d] + ";color:" + DCOL[z.d] + '">👥 D' + (z.d + 1) + "</span>" : "") + (g != null && Math.abs(g) > .6 ? (g > 0 ? " ▲" : " ▼") : "") + "</td>"; }).join("") +
          '<td class="l"><small>' + (a ? new Date(a.t || Date.now()).toLocaleDateString("fr-FR") + " · " + ({ lien: "lien", code: "code", tablette: "tablette" }[a.via] || "") : '<span class="epse-mut">pas encore</span>') + "</small>" + (a && (a.r || a.m) ? '<div class="epse-mut" style="font-size:12px">' + (a.r ? "✓ " + esc(a.r) : "") + (a.r && a.m ? "<br>" : "") + (a.m ? "→ " + esc(a.m) : "") + "</div>" : "") + "</td></tr>"; }).join("");
      return '<div class="epse-card"><h2>🙋 Auto-positionnement des élèves</h2>' +
        '<div class="epse-row"><label><input type="checkbox" data-ap-on' + (s.apOuvert ? " checked" : "") + "> Autoriser l'auto-positionnement</label><label>jusqu'au <input type=\"date\" data-ap-date value=\"" + esc(s.apJusqua || "") + '" min="' + today() + '"></label></div>' +
        '<p class="epse-mut">' + esc(etat()) + "</p>" +
        '<div class="epse-row"><button class="epse-btn" data-co-open>👥 Coévaluation entre élèves : ma grille, ouverture, résultats</button></div>' +
        '<p class="epse-mut">' + (cfg ? "✓ Envoi automatique actif (" + (cfg.src === "commun" ? "ton script commun" : cfg.src === "danse" ? "ancien script de Danse" : "script réglé ici") + ", chiffré) : les positionnements arrivent tout seuls." : "⚠ Envoi automatique inactif : règle le partage entre tablettes (script commun, à jour). En attendant, l'élève obtient un code à t'envoyer.") + "</p>" +
        '<div class="epse-row"><button class="epse-btn p" data-ap-tab' + (ouvert() ? "" : " disabled") + ">🙋 Passer cette tablette en mode élève (" + esc(c.nom) + ")</button>" + (cfg ? '<button class="epse-btn" data-ap-rel>Relever maintenant</button>' : "") + "</div>" +
        '<details><summary class="epse-mut" style="cursor:pointer">Codes reçus (si l\'envoi a échoué) · réglage de l\'envoi</summary><textarea rows="2" data-ap-codes placeholder="' + esc(A.code) + '.eyJu…"></textarea><div class="epse-row"><button class="epse-btn" data-ap-imp>Importer les codes</button></div>' +
        '<div class="epse-row"><input type="text" data-ap-u placeholder="https://script.google.com/macros/s/…/exec (vide = ton script commun)" value="' + esc(s.envoiUrl || "") + '" style="flex:2"><input type="password" data-ap-k placeholder="Clé secrète" value="' + esc(s.envoiCle || "") + '" style="flex:1"><button class="epse-btn" data-ap-save>Enregistrer</button></div></details>' +
        '<h3 style="margin:14px 0 6px">Suivi : ' + recu.length + " / " + c.eleves.length + ' élève(s) positionné(s)</h3><p class="epse-mut">D = toi · 🙋 = l\'élève · 👥 = moyenne des camarades (quand la coévaluation reprend cette grille).</p><div style="overflow:auto"><table><tr><th class="l">Élève</th>' + cs.map(function (cr) { return "<th>" + esc(cr.nomEl || cr.nom) + "</th>"; }).join("") + '<th class="l">Reçu · ses mots</th></tr>' + rows + "</table></div></div>";
    };
    M.bindCard = function (root, c) {
      var q = function (s) { return root.querySelector(s); }, ch = function () { try { A.changed(); } catch (e) {} };
      if (q("[data-ap-on]")) q("[data-ap-on]").onchange = function (e) { var s = S(), o = { apOuvert: e.target.checked }; if (e.target.checked && (!s.apJusqua || s.apJusqua < today())) o.apJusqua = plusJours(14); A.setSettings(o); ch(); };
      if (q("[data-co-open]")) q("[data-co-open]").onclick = function () { coEdit({ app: A.app, nom: A.nom, color: A.color, cls: c && c.nom }); };
      if (q("[data-ap-date]")) q("[data-ap-date]").onchange = function (e) { A.setSettings({ apJusqua: e.target.value }); ch(); };
      if (q("[data-ap-tab]")) q("[data-ap-tab]").onclick = function () { M.modeEleve(c.nom); };
      if (q("[data-ap-rel]")) q("[data-ap-rel]").onclick = function (e) { e.target.disabled = true; relever(true).then(function (r) { e.target.disabled = false; toast(msg(r)); if (r && r.n) ch(); }); };
      if (q("[data-ap-imp]")) q("[data-ap-imp]").onclick = function () { importer(q("[data-ap-codes]").value); };
      if (q("[data-ap-save]")) q("[data-ap-save]").onclick = function () { A.setSettings({ envoiUrl: q("[data-ap-u]").value.trim(), envoiCle: q("[data-ap-k]").value.trim() }); toast("Enregistré"); ch(); };
    };

    /* ---------- PDF ---------- */
    var sanCache = new Map();
    function rgbH(h) { var n = parseInt(h.slice(1), 16); return PDFLib.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); }
    function san(font, s) { s = String(s == null ? "" : s).replace(/[   ​]/g, " ").replace(/[‑]/g, "-").replace(/\t/g, " ").replace(/[’]/g, "'");
      var ok = sanCache.get(font); if (!ok) { ok = new Map(); sanCache.set(font, ok); } var out = "";
      for (var ch of s) { if (ch === "\n") { out += ch; continue; } var v = ok.get(ch); if (v === undefined) { try { font.encodeText(ch); v = true; } catch (e) { v = false; } ok.set(ch, v); } if (v) out += ch; } return out; }
    function wrap(s, font, size, w) { s = san(font, s); var out = [];
      s.split("\n").forEach(function (para) { var words = para.split(/\s+/).filter(Boolean), line = "";
        words.forEach(function (wd) { var t = line ? line + " " + wd : wd; if (font.widthOfTextAtSize(t, size) <= w) { line = t; return; } if (line) out.push(line);
          if (font.widthOfTextAtSize(wd, size) > w) { var part = ""; for (var ch of wd) { if (font.widthOfTextAtSize(part + ch, size) > w) { out.push(part); part = ch; } else part += ch; } line = part; } else line = wd; });
        out.push(line); }); return out.length ? out : [""]; }
    async function doc0() { await libs(); var doc = await PDFLib.PDFDocument.create(); doc.setTitle(A.nom + " EPS — positionnement"); doc.setCreator(A.nom + " EPS");
      return { doc: doc, F: { r: await doc.embedFont(PDFLib.StandardFonts.Helvetica), b: await doc.embedFont(PDFLib.StandardFonts.HelveticaBold), o: await doc.embedFont(PDFLib.StandardFonts.HelveticaOblique) } }; }
    function PT(page, s, x, y, size, font, color) { page.drawText(san(font, s), { x: x, y: y, size: size, font: font, color: color || PDFLib.rgb(.106, .118, .141) }); }
    function PLn(page, arr, x, y, size, font, lh, color) { arr.forEach(function (l, i) { PT(page, l, x, y - i * lh, size, font, color); }); return arr.length * lh; }
    function headTxt(o) { try { if (window.EPSR && EPSR.head) return EPSR.head(o); } catch (e) {} return { l1: o.act + (o.titre ? " — " + o.titre : ""), l2: "EPS · " + o.ca, r1: o.nom || "", r2: [o.classe, o.date].filter(Boolean).join(" · ") }; }
    function conseil(E, el) { var G = A.grid(), cs = G.criteres.filter(function (cr) { var v = A.prof(cr, E); return v && v.d != null; }); if (!cs.length) return "";
      var w = cs.slice().sort(function (a, b) { var va = A.prof(a, E), vb = A.prof(b, E); return (va.d + va.pos) - (vb.d + vb.pos); })[0], v = A.prof(w, E);
      if (v.d >= 3) return el ? "Je continue ainsi : j'ai atteint le meilleur niveau sur tous les critères." : "Très bonne maîtrise sur tous les critères.";
      var D = el ? (w.descEl || w.desc) : w.desc; return el ? "Je travaille « " + (w.nomEl || w.nom) + " ». Mon prochain objectif : " + (D[v.d + 1] || "") : w.nom + (w.afl ? " (" + w.afl + ")" : "") + " — pour atteindre le degré " + (v.d + 2) + " : " + (D[v.d + 1] || ""); }
    function qrPdf(page, texte, x, y, size) { var qr = new QRLib.QRCode(-1, QRLib.ECL.L); qr.addData(unescape(encodeURIComponent(texte))); qr.make();
      var n = qr.getModuleCount(), s = size / (n + 4), ink = PDFLib.rgb(0, 0, 0); page.drawRectangle({ x: x, y: y, width: size, height: size, color: PDFLib.rgb(1, 1, 1) }); var x0 = x + 2 * s, y0 = y + 2 * s;
      for (var r = 0; r < n; r++) { var k = 0; while (k < n) { if (!qr.isDark(r, k)) { k++; continue; } var k2 = k; while (k2 < n && qr.isDark(r, k2)) k2++; page.drawRectangle({ x: x0 + k * s, y: y0 + (n - r - 1) * s, width: (k2 - k) * s + .02, height: s + .02, color: ink }); k = k2; } } return size; }
    function lienPdf(doc, page, url, x, y, w, h) { var cx = doc.context, an = cx.register(cx.obj({ Type: "Annot", Subtype: "Link", Rect: [x, y, x + w, y + h], Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: PDFLib.PDFString.of(url) } }));
      var ex = page.node.lookupMaybe(PDFLib.PDFName.of("Annots"), PDFLib.PDFArray); if (ex) ex.push(an); else page.node.set(PDFLib.PDFName.of("Annots"), cx.obj([an])); }
    function fullN(E) { var n = A.name(E); return ((n.prenom || "") + " " + (n.nom || "")).trim(); }
    function pageEleve(ctx, c, E, url, el) {
      var doc = ctx.doc, F = ctx.F, G = A.grid(), PW = 841.89, PH = 595.28, Mg = 26, W = PW - 2 * Mg, ink = PDFLib.rgb(.106, .118, .141), grey = PDFLib.rgb(.42, .43, .47), light = PDFLib.rgb(.86, .85, .82), white = PDFLib.rgb(1, 1, 1), app = rgbH(A.color);
      var LW = 170, CW = (W - LW) / 4, pad = 5, abs = A.absent(E), n20 = abs ? null : A.note(E), ap = A.getAp(E), a = ap && ap.ev && Object.keys(ap.ev).length ? ap.ev : null;
      var avecLien = !!url && ouvert() && !abs, HL = avecLien ? 90 : 0, comm = (A.comment(E) || "").trim(), obj = abs ? "" : conseil(E, el), extra = (A.extras ? A.extras(c, E) : []) || [];
      var DG = el ? (G.degresEl || G.degres) : G.degres;
      function mesure(fs) { var lh = fs * 1.22;
        var rows = G.criteres.map(function (cr) { var nm = el ? (cr.nomEl || cr.nom) : cr.nom, bt = el ? (cr.butEl || cr.but || "") : (cr.but || ""), D = el ? (cr.descEl || cr.desc) : cr.desc;
          var tl = wrap(nm, F.b, fs + 1.2, LW - 2 * pad), sl = wrap(bt, F.o, fs - .8, LW - 2 * pad), labelH = tl.length * (fs + 1.2) * 1.2 + 11 + sl.length * (fs - .8) * 1.22, cells = [0, 1, 2, 3].map(function (d) { return wrap(D[d] || "", F.r, fs, CW - 2 * pad); });
          return { cr: cr, tl: tl, sl: sl, cells: cells, h: Math.max(labelH, 12 + Math.max.apply(null, cells.map(function (l) { return l.length; })) * lh) + 2 * pad, gauge: 24 }; });
        var footW = (W - 120 - 16) / 2, cl1 = wrap(comm || "—", F.r, fs + .4, footW - 14), cl2 = wrap(obj || "—", F.r, fs + .4, footW - 14), footH = Math.max(58, 24 + Math.max(cl1.length, cl2.length) * (fs + .4) * 1.25);
        return { fs: fs, lh: lh, rows: rows, footW: footW, cl1: cl1, cl2: cl2, footH: footH, total: rows.reduce(function (s, r) { return s + r.h + r.gauge; }, 0) + footH }; }
      var dispo = PH - 2 * Mg - 58 - 18 - 18 - 14 - 10 - HL, L = null; for (var fs = 9.6; fs >= 5.6; fs -= .2) { L = mesure(fs); if (L.total <= dispo) break; }
      var page = doc.addPage([PW, PH]), y = PH - Mg, H = headTxt({ act: A.nom, titre: el ? "Mon positionnement" : "Évaluation", ca: A.ca, nom: fullN(E), classe: c.nom, date: dateFR() });
      page.drawRectangle({ x: Mg, y: y - 52, width: W, height: 52, color: rgbH("#14171C") }); page.drawRectangle({ x: Mg, y: y - 52, width: 6, height: 52, color: app });
      PT(page, H.l1, Mg + 18, y - 22, 15, F.b, white); PT(page, H.l2, Mg + 18, y - 40, 9, F.r, PDFLib.rgb(.663, .682, .722));
      PT(page, H.r1, Mg + W - 16 - F.b.widthOfTextAtSize(san(F.b, H.r1), 15), y - 22, 15, F.b, white); PT(page, H.r2, Mg + W - 16 - F.r.widthOfTextAtSize(san(F.r, H.r2), 9), y - 40, 9, F.r, PDFLib.rgb(.663, .682, .722));
      y -= 70;
      PT(page, (abs ? (abs === "ABS" ? "ABSENT(E)" : "DISPENSÉ(E)") + "   ·   " : "") + (extra.join("   ·   ") || " "), Mg, y, 9.5, F.b, ink);
      var lx = Mg + W - 300; page.drawSvgPath("M0 0 L10 0 L5 8 Z", { x: lx, y: y + 8, color: ink }); PT(page, el ? "Positionnement de mon enseignant" : "Positionnement du professeur", lx + 14, y, 8, F.r, grey);
      if (a) { lx += 165; page.drawCircle({ x: lx + 5, y: y + 3, size: 4, borderColor: app, borderWidth: 1.6, color: white }); PT(page, el ? "Mon auto-positionnement" : "Auto-positionnement de l'élève", lx + 14, y, 8, F.r, grey); }
      y -= 18; PT(page, el ? "Ce qui est évalué" : "Critères", Mg + pad, y, 8, F.b, grey);
      for (var d0 = 0; d0 < 4; d0++) { var x0 = Mg + LW + d0 * CW; page.drawRectangle({ x: x0 + 1, y: y - 4, width: CW - 2, height: 3, color: rgbH(DCOL[d0]) }); PT(page, (el ? "" : "D" + (d0 + 1) + " · ") + DG[d0], x0 + pad, y + 2, 8.6, F.b, rgbH(DCOL[d0])); }
      y -= 10; var fsz = L.fs, lh = L.lh;
      L.rows.forEach(function (r) { var cr = r.cr, top = y, h = r.h, sel = A.prof(cr, E), au = a ? a[cr.id] : null; if (sel && sel.d == null) sel = null;
        page.drawRectangle({ x: Mg, y: top - h, width: W, height: h, borderColor: light, borderWidth: .7 }); page.drawRectangle({ x: Mg, y: top - h, width: LW, height: h, color: PDFLib.rgb(.965, .957, .98) });
        var ty = top - pad - fsz - 1; PLn(page, r.tl, Mg + pad, ty, fsz + 1.2, F.b, (fsz + 1.2) * 1.2, ink); ty -= r.tl.length * (fsz + 1.2) * 1.2;
        var mx = A.max ? A.max(cr, E) : cr.max; PT(page, (cr.afl ? cr.afl + " · " : "") + (mx != null ? fr(mx) + " pts" : ""), Mg + pad, ty, fsz - .6, F.b, app); ty -= 11; PLn(page, r.sl, Mg + pad, ty, fsz - .8, F.o, (fsz - .8) * 1.22, grey);
        for (var d = 0; d < 4; d++) { var cx = Mg + LW + d * CW, on = sel && sel.d === d, aon = au && au.d === d;
          if (on) page.drawRectangle({ x: cx + 1.5, y: top - h + 1.5, width: CW - 3, height: h - 3, color: rgbH(DTINT[d]), borderColor: rgbH(DCOL[d]), borderWidth: 1.8 });
          else page.drawLine({ start: { x: cx, y: top }, end: { x: cx, y: top - h }, thickness: .7, color: light });
          var bx = cx + pad;
          if (on) { var t = el ? "ENSEIGNANT" : "PROFESSEUR", tw = F.b.widthOfTextAtSize(t, 6.2) + 8; page.drawRectangle({ x: bx, y: top - pad - 9, width: tw, height: 9, color: rgbH(DCOL[d]) }); PT(page, t, bx + 4, top - pad - 7, 6.2, F.b, white); bx += tw + 4; }
          if (aon) { var t2 = el ? "MOI" : "ÉLÈVE", tw2 = F.b.widthOfTextAtSize(san(F.b, t2), 6.2) + 8; page.drawRectangle({ x: bx, y: top - pad - 9, width: tw2, height: 9, borderColor: app, borderWidth: 1, color: white }); PT(page, t2, bx + 4, top - pad - 7, 6.2, F.b, app); }
          PLn(page, r.cells[d], cx + pad, top - pad - 12 - fsz + 1, fsz, F.r, lh, on || !sel ? ink : grey); }
        y = top - h; var gy = y - 13;
        if (sel) { PT(page, (el ? DG[sel.d] : "Degré " + (sel.d + 1)) + (sel.pts != null && mx != null ? "  ·  " + fr(sel.pts) + " / " + fr(mx) + " pts" : ""), Mg + pad, gy + 1, Math.min(9, fsz + .6), F.b, rgbH(DCOL[sel.d])); PT(page, posLbl(sel.d, sel.pos), Mg + pad, gy - 8.5, Math.min(7.5, fsz), F.r, grey); }
        else PT(page, abs ? "—" : "Non évalué", Mg + pad, gy - 2, fsz, F.b, grey);
        for (var d2 = 0; d2 < 4; d2++) { var gx = Mg + LW + d2 * CW + 3; page.drawRectangle({ x: gx, y: gy - 3, width: CW - 6, height: 6, color: sel && sel.d === d2 ? rgbH(DCOL[d2]) : rgbH(DTINT[d2]) }); }
        if (au) { var ax = Mg + LW + au.d * CW + 3 + au.pos * (CW - 6); page.drawCircle({ x: ax, y: gy, size: 4.6, borderColor: app, borderWidth: 1.8, color: white }); }
        if (sel) { var px = Mg + LW + sel.d * CW + 3 + (sel.pos || 0) * (CW - 6); page.drawSvgPath("M-5 0 L5 0 L0 8 Z", { x: px, y: gy + 13, color: ink }); page.drawLine({ start: { x: px, y: gy + 5 }, end: { x: px, y: gy - 5 }, thickness: 1.6, color: ink }); }
        y -= r.gauge; });
      y -= 4; var fx = Mg, fh = L.footH;
      page.drawRectangle({ x: fx, y: y - fh, width: 120, height: fh, color: rgbH("#1B1E24") }); page.drawRectangle({ x: fx, y: y - fh, width: 120, height: 3, color: app });
      PT(page, el ? "Ma note" : "Note", fx + 10, y - 16, 9, F.b, PDFLib.rgb(.663, .682, .722));
      var nt = abs ? abs : (n20 == null ? "—" : fr(n20)); PT(page, nt, fx + 10, y - fh / 2 - 12, 26, F.b, white);
      if (!abs && n20 != null) PT(page, "/ 20", fx + 14 + F.b.widthOfTextAtSize(san(F.b, nt), 26), y - fh / 2 - 12, 11, F.r, white); fx += 128;
      var box = function (titre, arr, col) { page.drawRectangle({ x: fx, y: y - fh, width: L.footW, height: fh, borderColor: light, borderWidth: .8 }); page.drawRectangle({ x: fx, y: y - fh, width: 3, height: fh, color: col });
        PT(page, titre, fx + 10, y - 14, 9, F.b, col); PLn(page, arr, fx + 10, y - 27, fsz + .4, F.r, (fsz + .4) * 1.25, ink); fx += L.footW + 8; };
      box(el ? "Le mot de mon enseignant" : "Commentaire du professeur", L.cl1, rgbH("#1F5F8B")); box(el ? "Pour progresser" : "Axe de progrès", L.cl2, rgbH("#2e9e5b"));
      if (avecLien) { var by = y - fh - 8, bh = 82;
        page.drawRectangle({ x: Mg, y: by - bh, width: W, height: bh, color: rgbH("#F5F3EE"), borderColor: app, borderWidth: 1.2 });
        var q = qrPdf(page, url, Mg + 6, by - bh + 4, bh - 8), tx0 = Mg + 16 + q, auto = false; try { auto = JSON.parse(b64d(url.split(HASH)[1])).length > 4; } catch (x) {}
        PT(page, el ? "Et moi, où je me situe ? Je me positionne !" : "Auto-positionnement de l'élève", tx0, by - 24, 12, F.b, app);
        var m = "Scanne le QR code ou clique ici pour te positionner toi-même dans les niveaux" + (S().apJusqua ? " (lien valable jusqu'au " + dIso(S().apJusqua) + ")" : "") + ". " + (auto ? "Quand tu valides, ton positionnement est envoyé directement à ton enseignant." : "Ensuite, envoie le code obtenu à ton enseignant par la messagerie Pronote.");
        PLn(page, wrap(m, F.r, 9.2, W - (tx0 - Mg) - 160), tx0, by - 42, 9.2, F.r, 11.6, ink);
        var bw = 128, bx2 = Mg + W - bw - 12, bby = by - bh / 2 - 13; page.drawRectangle({ x: bx2, y: bby, width: bw, height: 26, color: app });
        var lb = "Je me positionne  >"; PT(page, lb, bx2 + (bw - F.b.widthOfTextAtSize(lb, 10)) / 2, bby + 9, 10, F.b, white); lienPdf(doc, page, url, Mg, by - bh, W, bh); }
      PT(page, A.nom + " EPS — " + (el ? "grille en langage élève" : "grille enseignant") + " · document généré le " + dateFR(), Mg, Mg - 12, 6.5, F.r, grey);
    }
    async function pageLien(ctx, c, E, el) { var u = ouvert() && !A.absent(E) ? await lien(E, c) : ""; pageEleve(ctx, c, E, u, el); }
    function nomPdf(c, E) { var n = A.name(E); return (safe(n.nom) + "_" + safe(n.prenom || "") + "_" + safe(A.nom) + "_" + safe(c.nom) + ".pdf").replace(/__+/g, "_"); }
    async function ficheBytes(c, E, el) { var ctx = await doc0(); await pageLien(ctx, c, E, el); return ctx.doc.save(); }
    async function recapBytes(c) {
      var ctx = await doc0(), doc = ctx.doc, F = ctx.F, G = A.grid(), PW = 595.28, PH = 841.89, Mg = 32, W = PW - 2 * Mg, ink = PDFLib.rgb(.106, .118, .141), grey = PDFLib.rgb(.42, .43, .47), light = PDFLib.rgb(.88, .87, .85);
      var cols = [{ t: "Élève", w: 150 }].concat(G.criteres.map(function (cr) { return { t: cr.nom.length > 16 ? cr.nom.slice(0, 15) + "." : cr.nom, w: 72 }; })).concat([{ t: "Note /20", w: 48 }, { t: "Auto (élève)", w: 0 }]);
      cols[cols.length - 1].w = Math.max(40, W - cols.slice(0, -1).reduce(function (s, x) { return s + x.w; }, 0)); var page, y, num = 0;
      var H = headTxt({ act: A.nom, titre: "Récapitulatif", ca: A.ca, nom: c.nom, classe: "", date: dateFR() });
      var entete = function () { page = doc.addPage([PW, PH]); num++; y = PH - Mg; page.drawRectangle({ x: Mg, y: y - 44, width: W, height: 44, color: rgbH("#14171C") }); page.drawRectangle({ x: Mg, y: y - 44, width: 6, height: 44, color: rgbH(A.color) });
        PT(page, H.l1 + " · " + c.nom, Mg + 16, y - 19, 13, F.b, PDFLib.rgb(1, 1, 1)); PT(page, H.l2 + " · " + dateFR(), Mg + 16, y - 34, 8, F.r, PDFLib.rgb(.663, .682, .722));
        y -= 60; var x = Mg; cols.forEach(function (k) { PT(page, k.t, x + 4, y, 7.6, F.b, grey); x += k.w; }); y -= 6; page.drawLine({ start: { x: Mg, y: y }, end: { x: Mg + W, y: y }, thickness: 1, color: ink }); PT(page, "Page " + num, Mg + W - 30, Mg - 14, 7, F.r, grey); };
      entete(); var notes = [];
      c.eleves.forEach(function (E, i) { if (y < Mg + 30) entete(); var rh = 17, abs = A.absent(E), n = abs ? null : A.note(E); if (n != null) notes.push(n);
        if (i % 2) page.drawRectangle({ x: Mg, y: y - rh, width: W, height: rh, color: PDFLib.rgb(.975, .97, .96) }); var x = Mg, by = y - 12;
        var fit = function (s, w, f, sz) { s = san(f, s); while (s && f.widthOfTextAtSize(s, sz) > w - 8) s = s.slice(0, -1); return s; };
        PT(page, fit(fullN(E), cols[0].w, F.b, 8.5), x + 4, by, 8.5, F.b, ink); x += cols[0].w;
        G.criteres.forEach(function (cr, k) { var v = A.prof(cr, E); if (v && v.d != null) { page.drawRectangle({ x: x + 4, y: by - 3, width: 18, height: 11, color: rgbH(DTINT[v.d]) }); PT(page, "D" + (v.d + 1), x + 6.5, by, 7.5, F.b, rgbH(DCOL[v.d])); if (v.pts != null) PT(page, fr(v.pts), x + 27, by, 8, F.r, ink); } else PT(page, "—", x + 6, by, 8, F.r, grey); x += cols[1 + k].w; });
        PT(page, abs || fr(n), x + 4, by, 9, F.b, ink); x += cols[cols.length - 2].w;
        var ap = A.getAp(E); PT(page, ap && ap.ev ? G.criteres.map(function (cr) { var z = ap.ev[cr.id]; return z ? "D" + (z.d + 1) : "–"; }).join(" ") : "", x + 4, by, 7.5, F.r, grey);
        y -= rh; page.drawLine({ start: { x: Mg, y: y }, end: { x: Mg + W, y: y }, thickness: .4, color: light }); });
      if (y < Mg + 40) entete(); y -= 20; var moy = notes.length ? notes.reduce(function (s, v) { return s + v; }, 0) / notes.length : null;
      PT(page, "Élèves notés : " + notes.length + " / " + c.eleves.length + "    Moyenne : " + fr(moy) + "    Min : " + (notes.length ? fr(Math.min.apply(null, notes)) : "—") + "    Max : " + (notes.length ? fr(Math.max.apply(null, notes)) : "—"), Mg, y, 9, F.b, ink);
      return doc.save();
    }
    function err(e) { console.error(e); toast("Erreur lors de la création du PDF (la première fois, il faut une connexion)"); }
    M.pdfEleve = async function (c, E, el) { try { download(new Blob([await ficheBytes(c, E, el !== false)], { type: "application/pdf" }), nomPdf(c, E)); } catch (e) { err(e); } };
    M.pdfTous = async function (c, el) { if (!c.eleves.length) { toast("Aucun élève"); return; } toast("Préparation des fiches…");
      try { var ctx = await doc0(); for (var i = 0; i < c.eleves.length; i++) await pageLien(ctx, c, c.eleves[i], el !== false); download(new Blob([await ctx.doc.save()], { type: "application/pdf" }), safe(A.nom) + "_" + safe(c.nom) + "_fiches.pdf"); } catch (e) { err(e); } };
    M.pdfRecap = async function (c) { try { download(new Blob([await recapBytes(c)], { type: "application/pdf" }), safe(A.nom) + "_" + safe(c.nom) + "_recapitulatif.pdf"); } catch (e) { err(e); } };
    M.zip = async function (c, el) { if (!c.eleves.length) { toast("Aucun élève"); return; } toast("Préparation des PDF…");
      try { await libs(); var zip = new JSZip(), dos = zip.folder(safe(A.nom) + "_" + safe(c.nom)); for (var i = 0; i < c.eleves.length; i++) dos.file(nomPdf(c, c.eleves[i]), await ficheBytes(c, c.eleves[i], el !== false));
        dos.file("_Recapitulatif_" + safe(c.nom) + ".pdf", await recapBytes(c));
        download(await zip.generateAsync({ type: "blob" }), safe(A.nom) + "_" + safe(c.nom) + "_" + dateFR().replace(/\//g, "-") + ".zip"); toast(c.eleves.length + " PDF prêts dans le ZIP"); } catch (e) { err(e); } };
    M.exportsHtml = function () { return '<div class="epse-card"><h2>📄 Fiches PDF</h2><p class="epse-mut">Une fiche par élève (grille en langage élève, positionnement de l\'enseignant et de l\'élève, note, commentaire' + (ouvert() ? ", QR code d'auto-positionnement" : "") + "), récapitulatif de la classe, ou tout dans un .zip.</p>" +
      '<div class="epse-row"><button class="epse-btn p" data-x-zip>🗂 Tout en .zip</button><button class="epse-btn" data-x-all>📄 Toutes les fiches (un PDF)</button><button class="epse-btn" data-x-rec>📊 Récapitulatif</button><button class="epse-btn" data-x-pn>📋 Pronote</button><button class="epse-btn" data-x-pub>🌐 Publier en ligne</button><label class="epse-mut"><input type="checkbox" data-x-prof> grille enseignant</label></div></div>'; };
    M.bindExports = function (root, c) { var el = function () { var x = root.querySelector("[data-x-prof]"); return !(x && x.checked); };
      root.querySelector("[data-x-zip]").onclick = function () { M.zip(c, el()); }; root.querySelector("[data-x-all]").onclick = function () { M.pdfTous(c, el()); }; root.querySelector("[data-x-rec]").onclick = function () { M.pdfRecap(c); }; var pb = root.querySelector("[data-x-pub]"); if (pb) pb.onclick = function () { if (!(window.EPSD && EPSD.publish)) { toast("Publication indisponible (recharge la page)"); return; } EPSD.publish({ app: A.app, nom: A.nom, color: A.color, classe: c.nom, eleves: c.eleves.map(function (E) { return { full: fullN(E), bytes: function () { return libs().then(function () { return ficheBytes(c, E, true); }); } }; }) }); }; var pn = root.querySelector("[data-x-pn]"); if (pn) pn.onclick = function () { M.pronote(c); }; };
    /* notes à coller dans Pronote (fenêtre commune EPSR.pronote d'eps-home.js) */
    M.pronote = function (c) { if (c && c.nom && c.eleves) return M.pronoteAll(c.nom, c.eleves); if (!(window.EPSR && EPSR.pronote)) { toast("Export Pronote indisponible (recharge la page)"); return; }
      EPSR.pronote({ app: A.nom, classe: c.nom, color: A.color, cols: [{ t: "Note /20" }], rows: c.eleves.map(function (E) { var n = A.name(E), ab = A.absent(E); return { nom: n.nom, prenom: n.prenom || "", st: ab || "", v: [ab ? null : A.note(E)] }; }) }); };
    /* 📋 Pronote de toute l'activité : une colonne par évaluation (note de l'appli, note proposée, points par AFL, chaque évaluation de leçon,
       moyenne des leçons, réussite aux situations). Dans la fenêtre Pronote : copier une colonne (une évaluation) ou toutes (bilan général). */
    M.pronoteAll = function (cls, L) { if (!(window.EPSR && EPSR.pronote)) { toast("Export Pronote indisponible (recharge la page)"); return; }
      L = (typeof L === "function" ? L() : L) || []; var DIR = { esc: "escalade", rel: "relais", vol: "volley", bad: "badminton", dan: "danse", acro: "acrosport", ori: "orientation", ct: "crosstraining", bk: "basket" }[A.app] || A.app, LV = null;
      try { LV = JSON.parse(localStorage.getItem("eps.leceval." + DIR + ".v1") || "null"); } catch (e) {}
      var J = Object.keys((LV && LV.items) || {}).map(function (id) { return LV.items[id]; }).filter(function (o) { return o && !o.del && nk(o.cls) === nk(cls); }).sort(function (a, b) { return String(a.day).localeCompare(String(b.day)); });
      var P0 = L.length ? M.prop(L[0], cls) : { afl: [] }, AF = P0.afl.map(function (a) { return a.code; }), cc = M.ccf(cls);
      var cols = [{ t: "Note de l'évaluation /20" }, { t: "Note proposée /20" + (cc.on ? " (CCF)" : "") }].concat(AF.map(function (c, i) { var a = P0.afl[i]; return { t: c + " /" + fr(cc.on && a.ccfMax != null ? a.ccfMax : a.mx) }; }))
        .concat(J.map(function (o) { return { t: "Leçon du " + new Date(o.day + "T12:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) + (o.theme ? " · " + String(o.theme).slice(0, 24) : "") + " /20" }; }))
        .concat([{ t: "Moyenne des leçons /20" }, { t: "Situations réussies /20" }]);
      var rows = L.map(function (E) { var n = A.name(E), ab = A.absent(E), P = M.prop(E, cls), k = ekey(E);
        var v = [A.note ? A.note(E) : null, P.note].concat(AF.map(function (c) { var a = P.afl.filter(function (x) { return x.code === c; })[0]; return !a || a.deg == null ? null : cc.on ? a.ccf : a.pts; }))
          .concat(J.map(function (o) { var x = (o.el || {})[k]; if (!x) return null; var q = ["p", "s", "t"].filter(function (z) { return x[z] != null; }).map(function (z) { return +x[z]; }); return q.length ? Math.round(q.reduce(function (a, b) { return a + b; }, 0) / q.length / 3 * 20 * 4) / 4 : null; }))
          .concat([P.noteLec, P.noteSit]);
        return { nom: n.nom, prenom: n.prenom || "", st: ab || "", v: ab ? v.map(function () { return null; }) : v }; });
      EPSR.pronote({ app: A.nom, classe: cls, titre: A.nom + " · toutes les évaluations", color: A.color, cols: cols, rows: rows }); };
    /* données de la bulle 🙋 commune (window.epsApChip) */
    M.apData = function (E) { var a = A.getAp(E); if (!a || !a.ev || !Object.keys(a.ev).length) return null; var n = A.name(E);
      return { nom: ((n.prenom || "") + " " + (n.nom || "")).trim(), date: a.t ? new Date(a.t).toLocaleDateString("fr-FR") : "", r: a.r || "", m: a.m || "",
        crit: A.grid().criteres.map(function (cr) { var v = A.prof(cr, E), x = a.ev[cr.id]; return { l: cr.nom, p: v && v.d != null ? v.d + 1 : "", e: x ? x.d + 1 : "" }; }) }; };
    M.apChip = function (E) { return window.epsApChip ? window.epsApChip(M.apData(E)) : ""; };
    /* ================= 🎯 Proposition de positionnement et de note (commune) =================
       Par AFL / AFLP (champ « afl » des critères) : degré moyen pondéré par les points, et note proposée.
       Source indiquée : évaluation enregistrée (degrés de l'enseignant) ou estimation (auto-positionnement, évaluations de leçon).
       Case CCF : barème officiel (fin d'épreuve 12 pts : Bac général linéaire, Bac pro AFLP1 7 pts / AFLP2 5 pts ;
       fil de la séquence 8 pts sur 2 AFL, répartition 4-4 / 6-2 / 2-6 au choix de l'élève, valeurs par degré : voir BAR / BARP). */
    var R7 = [[0, 1], [1.5, 3], [3.5, 5], [5.5, 7]], R5 = [[0, .5], [1, 2], [2.5, 4], [4.5, 5]], BAR = { 2: [.5, 1, 1.5, 2], 4: [1, 2, 3, 4], 6: [1.5, 2.5, 4.5, 6] },
      BARP = { 2: [[0, .25], [.5, .75], [1, 1.5], [1.75, 2]], 4: [[0, 1], [1.25, 1.75], [2, 3], [3.25, 4]], 6: [[0, 1.5], [1.75, 2.75], [3, 4.5], [4.75, 6]] };
    /* Vérifié le 25/11/2026 : Bac GT, table éduscol (2 pts : 0,5/1/1,5/2 ; 4 pts : 1/2/3/4 ; 6 pts : 1,5/2,5/4,5/6).
       Bac pro : AFLP1 7 pts, AFLP2 5 pts ; AFLP 3-6 « répartis sur les 4 degrés, la moitié des points au début du degré 3 » (circulaire du 29-12-2020) :
       plages académiques (Grenoble) interpolées selon la position dans le degré. Les plages R7/R5 sont indicatives : le barème précis dépend de l'APSA. */
    var KCC = "eps.ccfcfg.v1";
    function ccGet(id) { try { var V = JSON.parse(localStorage.getItem(KCC) || "null"); var o = V && V.items && V.items[id]; return o && !o.del ? o : null; } catch (e) { return null; } }
    function ccPut(o) { var V; try { V = JSON.parse(localStorage.getItem(KCC) || "null"); } catch (e) {} V = V && V.items ? V : { items: {}, pend: {}, since: 0 }; V.pend = V.pend || {};
      var old = V.items[o.id]; o.u = Math.max(Date.now(), ((old && old.u) || 0) + 1); V.items[o.id] = o; V.pend[o.id] = o.u; localStorage.setItem(KCC, JSON.stringify(V)); try { EPSD.syncSoon(); } catch (e) {} }
    function ekey(E) { var n = A.name(E); return nkey((n.prenom || "") + " " + (n.nom || "")); }
    M.ccf = function (cls) { var o = ccGet(A.app + "|" + cls) || {}; return { on: !!o.on, voie: o.voie || (window.epsVoie ? epsVoie(cls) : "gt") }; }; /* voie par défaut : celle de la classe (TGT, 2GT, 1GT = générale ; sinon pro) */
    M.setCcf = function (cls, v) { var o = ccGet(A.app + "|" + cls) || { id: A.app + "|" + cls }; Object.assign(o, v); ccPut(o); };
    M.choix = function (cls, E) { var o = ccGet(A.app + "|" + cls + "|" + ekey(E)); return (o && o.choix) || "4-4"; };
    M.setChoix = function (cls, E, ch) { ccPut({ id: A.app + "|" + cls + "|" + ekey(E), choix: ch }); };
    function lecAvg(cls, E) { var k = ekey(E), V = null; try { var DIR = { esc: "escalade", rel: "relais", vol: "volley", bad: "badminton", dan: "danse", acro: "acrosport", ori: "orientation", ct: "crosstraining", bk: "basket" }[A.app] || A.app; V = JSON.parse(localStorage.getItem("eps.leceval." + DIR + ".v1") || "null"); } catch (e) {}
      var L = []; Object.keys((V && V.items) || {}).forEach(function (id) { var o = V.items[id]; if (!o || o.del || nk(o.cls) !== nk(cls)) return; var x = (o.el || {})[k]; if (!x) return; var v = []; ["p", "s", "t"].forEach(function (q) { if (x[q] != null) v.push(+x[q]); }); if (v.length) L.push(v.reduce(function (a, b) { return a + b; }, 0) / v.length); });
      return L.length ? { n: L.length, m: L.reduce(function (a, b) { return a + b; }, 0) / L.length } : null; }
    /* 🏁 réussite aux situations notée par l'élève dans les fiches de leçon (eps.lecres.<dossier>.v1) : indicatif */
    function sitRate(cls, E) { var k = ekey(E), V = null; try { var DIR = { esc: "escalade", rel: "relais", vol: "volley", bad: "badminton", dan: "danse", acro: "acrosport", ori: "orientation", ct: "crosstraining", bk: "basket" }[A.app] || A.app; V = JSON.parse(localStorage.getItem("eps.lecres." + DIR + ".v1") || "null"); } catch (e) {}
      var last = {}; Object.keys((V && V.items) || {}).map(function (id) { return V.items[id]; }).filter(function (o) { return o && !o.del && o.ek === k && nk(o.cls) === nk(cls); }).sort(function (a, b) { return String(a.day).localeCompare(String(b.day)); }).forEach(function (o) { Object.keys(o.r || {}).forEach(function (q) { last[q] = o.r[q]; }); });
      var ks = Object.keys(last); if (!ks.length) return null; var pts = ks.reduce(function (a, q) { return a + (last[q] === 2 ? 1 : last[q] === 1 ? .5 : 0); }, 0);
      return { n: ks.length, t: pts / ks.length, ok: ks.filter(function (q) { return last[q] === 2; }).length, ko: ks.filter(function (q) { return last[q] === 0; }).length }; }
    M.prop = function (E, cls) {
      var G = A.grid(), ap = A.getAp(E), groups = {}, order = [], nT = 0, nA = 0;
      G.criteres.forEach(function (cr) { var code = String(cr.afl || "AFL1").trim(), v = A.prof(cr, E), src = "eval";
        if (!v && ap && ap.ev && ap.ev[cr.id] && ap.ev[cr.id].d != null) { v = { d: ap.ev[cr.id].d, pos: ap.ev[cr.id].pos == null ? .5 : ap.ev[cr.id].pos }; src = "auto"; }
        var mx = A.max ? A.max(cr, E) : (+cr.max || 1); if (!groups[code]) { groups[code] = { code: code, w: 0, s: 0, mx: 0, crit: 0, done: 0, auto: 0 }; order.push(code); }
        var g = groups[code]; g.mx += mx; g.crit++; if (v) { g.w += mx; g.s += mx * (v.d + (v.pos == null ? .5 : v.pos)); g.done++; if (src === "auto") { g.auto++; nA++; } else nT++; } });
      var afl = order.map(function (c) { var g = groups[c]; if (!g.w) return { code: c, deg: null, mx: g.mx, crit: g.crit, done: 0 }; var m = Math.min(3.999, g.s / g.w), d = Math.floor(m);
        return { code: c, m: m, deg: d, pos: m - d, mx: g.mx, crit: g.crit, done: g.done, auto: g.auto, pts: Math.round(g.mx * m / 4 * 4) / 4 }; });
      var lec = cls ? lecAvg(cls, E) : null, cc = cls ? M.ccf(cls) : { on: false }, note = null, detail = "";
      if (afl.some(function (a) { return a.deg != null; })) {
        if (!cc.on && A.note && nA === 0 && A.note(E) != null) { note = A.note(E); detail = "note calculée par l'appli"; }
        else if (!cc.on) { var t = 0, mx = 0; afl.forEach(function (a) { mx += a.mx; if (a.deg != null) t += a.pts; }); var mxDone = afl.filter(function (a) { return a.deg != null; }).reduce(function (x, a) { return x + a.mx; }, 0);
          note = mxDone ? Math.round(t / mxDone * 20 * 4) / 4 : null; detail = "barème de la grille" + (mxDone < mx ? " (sur les AFL évalués)" : ""); }
        else { var fin = afl.filter(function (a) { return /^AFL1\b|^AFLP[12]\b/i.test(a.code); }), fil = afl.filter(function (a) { return fin.indexOf(a) < 0; }), tot = 0, ok = true;
          fin.forEach(function (a) { if (a.deg == null) { ok = false; return; }
            var R = cc.voie === "pro" && /^AFLP1/i.test(a.code) ? R7 : cc.voie === "pro" && /^AFLP2/i.test(a.code) ? R5 : null, P = 12 / fin.length;
            a.ccf = R ? R[a.deg][0] + a.pos * (R[a.deg][1] - R[a.deg][0]) : P * a.m / 4; a.ccfMax = R ? R[3][1] : P; a.ccf = Math.round(a.ccf * 4) / 4; tot += a.ccf; });
          var ch = (M.choix(cls, E) || "4-4").split("-").map(Number);
          fil.slice(0, 2).forEach(function (a, i) { var P = ch[i] || 4; a.ccfMax = P; if (a.deg == null) { ok = false; return; } var Rg = cc.voie === "pro" ? BARP[P][a.deg] : null; a.ccf = Rg ? Math.round((Rg[0] + a.pos * (Rg[1] - Rg[0])) * 4) / 4 : BAR[P][a.deg]; tot += a.ccf; });
          if (!fin.length) ok = false; note = Math.round(tot * 4) / 4; detail = "barème CCF " + (cc.voie === "pro" ? "Bac pro" : "Bac général") + " · fil de la séquence " + ch.join("-") + (ok ? "" : " · incomplet : il manque des AFL"); } }
      var src = nT && !nA ? "eval" : nT && nA ? "mixte" : nA ? "auto" : "none";
      var noteLec = lec ? Math.round(lec.m / 3 * 20 * 4) / 4 : null;
      var sit = cls ? sitRate(cls, E) : null;
      return { afl: afl, note: note, detail: detail, src: src, nT: nT, nA: nA, lec: lec, noteLec: noteLec, sit: sit, noteSit: sit ? Math.round(sit.t * 20 * 4) / 4 : null, ccf: cc };
    };
    M.propHtml = function (E, cls) { css(A.color);
      var P = M.prop(E, cls), DL = ["Degré 1", "Degré 2", "Degré 3", "Degré 4"], cc = P.ccf;
      var SRC = { eval: ["#E3F4E8", "#1D6B3A", "✓ Calculée à partir de l'évaluation enregistrée"], mixte: ["#FFF6E0", "#7A5A00", "◐ En partie estimée : des critères ne sont pas évalués par toi, l'auto-positionnement de l'élève les complète"], auto: ["#FFF1BF", "#7A5A00", "⚠ Estimation : aucune évaluation enregistrée, seulement l'auto-positionnement de l'élève"], none: ["#F1EEE6", "#6A6F78", "Pas encore d'évaluation ni d'auto-positionnement"] }[P.src];
      var pos = function (p) { return p < .34 ? "bas" : p < .67 ? "milieu" : "haut"; };
      var vo = window.epsVoie && cls ? epsVoie(cls) : "", codes = P.afl.map(function (a) { return a.code; }), aflp = codes.some(function (c) { return /^AFLP/i.test(c); }), afl = codes.some(function (c) { return /^AFL\d/i.test(c); });
      var vWarn = vo === "pro" && afl && !aflp ? "Classe de voie professionnelle, mais la grille parle d'AFL (lycée général) : pour les textes et le barème Bac pro, mets les codes AFLP1 à AFLP6 dans la grille (champ AFL de chaque critère)." : vo === "gt" && aflp && !afl ? "Classe de voie générale, mais la grille parle d'AFLP (voie pro) : mets les codes AFL1 à AFL3 pour le barème du bac général." : "";
      return '<div class="epse-card epse-prop"><h2 style="margin:0 0 6px">🎯 Proposition de positionnement' + (vo ? ' <small class="epse-mut" style="font-weight:600">· ' + (vo === "pro" ? "🛠 voie professionnelle" : "🎓 voie générale") + "</small>" : "") + "</h2>" + (vWarn ? '<div style="background:#FFF6E0;border-radius:10px;padding:6px 10px;margin:0 0 6px;font-size:14px">⚠ ' + esc(vWarn) + "</div>" : "") +
        P.afl.map(function (a) { return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px solid #F0ECE3;padding:6px 0"><b style="min-width:70px">' + esc(a.code) + "</b>" +
          (a.deg == null ? '<span class="epse-mut">non évalué</span>' : '<span style="background:' + DCOL[a.deg] + ';color:#fff;border-radius:8px;padding:2px 8px;font-weight:800">' + DL[a.deg] + "</span><span class=\"epse-mut\">(" + pos(a.pos) + " du degré" + (a.done < a.crit ? " · " + a.done + "/" + a.crit + " critères" : "") + (a.auto ? ", dont " + a.auto + " d'après l'élève" : "") + ")</span>" +
            '<span style="margin-left:auto;font-weight:800">' + (cc.on ? (a.ccf != null ? fr(a.ccf) + " / " + fr(a.ccfMax) + " pts CCF" : "") : fr(a.pts) + " / " + fr(a.mx) + " pts") + "</span>") + "</div>"; }).join("") +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px"><span style="font-size:20px;font-weight:900">Note proposée : ' + (P.note == null ? "—" : fr(P.note) + " / 20") + '</span><span class="epse-mut">' + esc(P.detail || "") + "</span></div>" +
        '<div style="background:' + SRC[0] + ";color:" + SRC[1] + ';border-radius:10px;padding:6px 10px;margin-top:6px;font-weight:700;font-size:14px">' + SRC[2] + "</div>" +
        (P.lec ? '<div class="epse-mut" style="margin-top:6px">📊 Évaluations de leçon : ' + P.lec.n + " leçon(s), moyenne " + fr(Math.round(P.lec.m * 100) / 100) + " / 3 → " + fr(P.noteLec) + " / 20 (participation, sérieux, thème du jour ; indicatif, hors grille)</div>" : "") +
        (P.sit ? '<div class="epse-mut" style="margin-top:4px">🏁 Situations des leçons notées par l\'élève : ' + P.sit.n + " situation(s), ✅ " + P.sit.ok + " réussie(s), ❌ " + P.sit.ko + " pas encore · réussite " + Math.round(P.sit.t * 100) + " % → " + fr(P.noteSit) + " / 20 (déclaré par l'élève ; indicatif, hors grille)</div>" : "") +
        (cls ? '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px;border-top:1px solid #F0ECE3;padding-top:8px"><label style="font-weight:800;display:flex;gap:6px;align-items:center"><input type="checkbox" data-ccf' + (cc.on ? " checked" : "") + ' style="width:22px;height:22px"> Évaluation CCF</label>' +
          (cc.on ? '<select data-voie class="epse-sel"><option value="gt"' + (cc.voie !== "pro" ? " selected" : "") + '>Bac général</option><option value="pro"' + (cc.voie === "pro" ? " selected" : "") + '>Bac pro</option></select><label class="epse-mut">Choix de l\'élève (fil de la séquence) <select data-choix class="epse-sel">' + ["4-4", "6-2", "2-6"].map(function (x) { return "<option" + (M.choix(cls, E) === x ? " selected" : "") + ">" + x + "</option>"; }).join("") + "</select></label>" : "") +
          (P.src === "auto" || P.src === "mixte" ? '<button type="button" class="epse-btn" data-take>✓ Reprendre ces degrés dans mon évaluation</button>' : "") + "</div>" : "") + "</div>";
    };
    /* ✨ phrase pour l'élève (fiche) : Claude part des degrés, de l'auto-positionnement et des observations dictées ; aucun nom envoyé ; validée ou non par l'enseignant */
    M.phraseNotes = function (E, cls) {
      var G = A.grid(), P = M.prop(E, cls), ap = A.getAp(E), n = A.name(E), full = ((n.prenom || "") + " " + (n.nom || "")).trim(), L = [];
      G.criteres.forEach(function (cr) { var v = A.prof(cr, E); if (v && v.d != null) L.push(cr.nom + " : degré " + (v.d + 1) + "/4" + (cr.desc && cr.desc[v.d] ? " (" + cr.desc[v.d] + ")" : "")); });
      P.afl.forEach(function (a) { if (a.deg != null) L.push(a.code + " : degré " + (a.deg + 1) + "/4"); });
      if (ap && (ap.r || ap.m)) L.push("L'élève dit avoir réussi : " + (ap.r || "—") + " ; vouloir améliorer : " + (ap.m || "—"));
      try { (window.EPSOB ? EPSOB.of(full, cls) : []).slice(-8).forEach(function (o) { L.push("Observation : " + o.txt); }); } catch (e) {}
      if (P.lec) L.push("Évaluations de leçon (participation, sérieux, thème) : moyenne " + (Math.round(P.lec.m * 10) / 10) + "/3 sur " + P.lec.n + " leçon(s)");
      if (P.sit) L.push("Situations des leçons (résultats notés par l'élève) : " + Math.round(P.sit.t * 100) + " % de réussite sur " + P.sit.n + " situation(s)");
      var fs = String(n.prenom || "").trim(); return L.join("\n").replace(fs ? new RegExp("\\b" + fs.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi") : /$^/, "l'élève");
    };
    M.bindPhrase = function (R, E, cls, keep) {
      var b = R.querySelector("[data-phr]"), box = R.querySelector("[data-phrbox]"), bu = R.querySelector("[data-bul]");
      if (bu) bu.onclick = function () { if (window.EPSD && EPSD.bulletin) EPSD.bulletin(cls); };
      if (!b || !box) return;
      b.onclick = function () { var notes = M.phraseNotes(E, cls); if (!notes) { box.innerHTML = '<p class="epse-mut">Évalue d\'abord au moins un critère.</p>'; return; }
        if (!(window.EPSD && EPSD.reformuler)) { box.innerHTML = '<p class="epse-mut">Module commun indisponible.</p>'; return; }
        b.disabled = true; box.innerHTML = '<p class="epse-mut">Claude rédige…</p>';
        EPSD.reformuler(notes, { mode: "fiche", act: A.nom, ctx: "Phrase de bilan pour l'élève, à partir de son évaluation" }).then(function (t) { b.disabled = false;
          box.innerHTML = '<div style="background:#FFF8D6;border:1px solid #E9CF6A;border-radius:12px;padding:10px 12px;margin:0 0 8px"><textarea rows="3" data-phrt style="width:100%;box-sizing:border-box;border:0;background:transparent;font:15px/1.4 system-ui">' + esc(t) + '</textarea><div class="epse-row" style="margin:6px 0 0"><button type="button" class="epse-btn p" data-phrok>✓ Mettre sur la fiche</button><button type="button" class="epse-btn" data-phrno>✕ Ne pas garder</button></div></div>';
          box.querySelector("[data-phrok]").onclick = function () { keep(box.querySelector("[data-phrt]").value.trim()); };
          box.querySelector("[data-phrno]").onclick = function () { box.innerHTML = ""; };
        }, function (e) { b.disabled = false; box.innerHTML = '<p class="epse-mut">⚠ ' + esc(e && e.message || e) + "</p>"; }); };
    };
    /* bloc commun « 🎯 Proposition » + « ✨ phrase pour l'élève » dans la fiche propre d'une appli (Volley, Badminton, Danse, Relais) :
       M.propBlock(apres, E, classe, {redraw, keep(texte), take}) — inséré juste après l'élément « apres » */
    M.propBlock = function (after, E, cls, o) { o = o || {}; if (!after || !after.parentNode) return;
      try { var d = document.createElement("div"); d.className = "epse-block"; d.innerHTML = M.propHtml(E, cls) +
          '<div class="epse-card"><div class="epse-row" style="margin:0"><button type="button" class="epse-btn" data-phr>✨ Proposer une phrase pour l\'élève</button><button type="button" class="epse-btn" data-bul>📝 Appréciations de bulletin (classe)</button>' + (o.list ? '<button type="button" class="epse-btn" data-pnall>📋 Pronote : toutes les évaluations de la classe</button>' : "") + '</div><div data-phrbox style="margin-top:6px"></div></div>';
        after.parentNode.insertBefore(d, after.nextSibling); M.bindProp(d, E, cls, o.redraw || function () {}, o.take);
        var pn = d.querySelector("[data-pnall]"); if (pn) pn.onclick = function () { M.pronoteAll(cls, o.list); }; if (o.keep) M.bindPhrase(d, E, cls, o.keep);
        /* 🎯 remédiation : critères au degré 1 ou 2 → situation liée à proposer (eps-lecons.js) */
        try { if (window.EPSLC && EPSLC.remCard) { var lows = []; A.grid().criteres.forEach(function (cr) { var v = A.prof(cr, E); if (v && v.d != null && v.d <= 1) lows.push({ cr: cr, d: v.d }); });
          var n = A.name(E), rc = EPSLC.remCard(cls, ((n.prenom || "") + " " + (n.nom || "")).trim(), lows); if (rc) { var w = document.createElement("div"); w.innerHTML = rc.html; d.appendChild(w); rc.bind(w); } } } catch (e) { console.warn(e); } } catch (e) { console.warn(e); } };
    M.bindProp = function (R, E, cls, redraw, take) {
      var b = R.querySelector("[data-ccf]"); if (b) b.onchange = function () { M.setCcf(cls, { on: b.checked }); redraw(); };
      var v = R.querySelector("[data-voie]"); if (v) v.onchange = function () { M.setCcf(cls, { voie: v.value }); redraw(); };
      var c = R.querySelector("[data-choix]"); if (c) c.onchange = function () { M.setChoix(cls, E, c.value); redraw(); };
      var t = R.querySelector("[data-take]"); if (t && take) t.onclick = function () { if (confirm("Reprendre les degrés proposés par l'élève pour les critères que tu n'as pas évalués ? Tu pourras les modifier ensuite.")) take(); };
    };
    M.ouvert = ouvert; M.relever = relever; M.lien = lien; M.ecart = ecart;
    /* instances connues des fiches de leçon (eps-lecons.js : critères des grilles, remédiation) */
    function isT_() { try { return typeof A.isTeacher === "function" && !!A.isTeacher(); } catch (e) { return false; } } /* adaptateurs réduits (Volley, Danse) : pas de relevé automatique ici */
    (window.EPSE_INST = window.EPSE_INST || []).push({ A: A, M: M });
    /* 🧪 classe fictive (simulation, leçon simulée) : auto-positionnement de démonstration pour que la note proposée,
       le positionnement par AFL et l'onglet Protocole aient des données (jamais sur une vraie classe) */
    var demoFill = function () { try { if (!(window.EPSD && EPSD.demo && EPSD.demo.on())) return; var DN = EPSD.demo.nom, G = A.grid().criteres || [];
      (A.classes() || []).filter(function (c) { return nk(c.nom) === nk(DN); }).forEach(function (c) { (c.eleves || []).forEach(function (E, i) { if (A.getAp(E)) return; var ev = {};
        G.forEach(function (cr, j) { ev[cr.id] = { d: Math.max(0, Math.min(3, ((i * 3 + j * 2) % 4 + (i % 3 === 0 ? 1 : 0)) % 4)), pos: ((i + j) % 4) / 4 + .1 }; });
        A.setAp(E, { ev: ev, r: "J'ai progressé dans la situation 1.", m: "Je veux être plus régulier.", t: Date.now(), via: "demo" }); }); }); } catch (e) {} };
    demoFill(); setTimeout(demoFill, 1500);
    return M;
  }

  /* =====================================================================
     Évaluation complète gérée ici (appli sans évaluation par degrés)
     o = { app, nom, ca, color, icon, pfx, code, url, grid (grille par défaut), extras(c, eleve), unlock, isTeacher }
     Données : localStorage « eps.eval.<app>.v1 » = {items:{cfg:{grid, apOuvert, apJusqua, envoiUrl, envoiCle, u}, s<id>:{c, n, p, ev, ap, comm, st, u}}, pend, since}
     Classes et élèves : listes communes (eps-lists.js) attribuées à cette activité.
     ===================================================================== */
  function store(o) {
    var KEY = "eps.eval." + o.app + ".v1", PRE = "ev." + o.app + "|";
    function ld() { var v = jget(KEY, null); if (!v || !v.items) v = { items: {}, pend: {}, since: 0 }; v.pend = v.pend || {}; return v; }
    function put(id, obj) { var v = ld(); obj.u = Date.now(); v.items[id] = obj; v.pend[id] = obj.u; jset(KEY, v); try { if (window.EPSD && EPSD.syncSoon) EPSD.syncSoon(); } catch (e) {} }
    function cfg() { var c = ld().items.cfg || {}; if (!c.grid) c.grid = JSON.parse(JSON.stringify(o.grid)); return c; }
    function setCfg(x) { var c = cfg(); Object.keys(x).forEach(function (k) { c[k] = x[k]; }); put("cfg", c); }
    function sid(cl, n) { return "s" + h32(nk(cl) + "|" + nkey((n.prenom || "") + " " + (n.nom || ""))); }
    function rec(cl, n) { var id = sid(cl, n), r = ld().items[id]; return r || { c: cl, n: n.nom, p: n.prenom || "", ev: {}, ap: null, comm: "", st: "" }; }
    function save(cl, n, r) { r.c = cl; r.n = n.nom; r.p = n.prenom || ""; put(sid(cl, n), r); }
    function classes() {
      var L = []; try { if (window.EPSL) L = EPSL.items().filter(function (it) { return (it.off || []).indexOf(o.app) < 0; }).map(function (it) { return { nom: it.nom, eleves: EPSL.people(it).map(function (p) { return { nom: p.nom || "", prenom: p.prenom || "", _c: it.nom }; }) }; }); } catch (e) {}
      L.sort(function (a, b) { return a.nom.localeCompare(b.nom, "fr"); }); L.forEach(function (c) { c.eleves.sort(function (a, b) { return (a.nom + " " + a.prenom).localeCompare(b.nom + " " + b.prenom, "fr"); }); }); return L;
    }
    /* 🎓 une grille par voie : cfg.grid (voie générale) et cfg.gridPro (voie professionnelle, copie de la grille générale tant qu'elle n'a pas été modifiée).
       La voie est celle de la classe ouverte (epsVoie : TGT, 2GT, 1GT = générale ; sinon pro). */
    function gv() { try { return window.epsVoie && UI && UI.cls ? epsVoie(UI.cls) : "gt"; } catch (e) { return "gt"; } }
    /* voie pro : grille enregistrée, sinon celle du protocole CCF Bac pro fourni par l'appli (o.gridPro) tant qu'aucune classe pro n'a été évaluée avec la grille générale */
    function proData() { var I = ld().items || {}; return Object.keys(I).some(function (k) { var r = I[k]; if (!r || k === "cfg" || !r.c || !r.ev || !Object.keys(r.ev).length) return false; try { return window.epsVoie && epsVoie(r.c) === "pro" && !Object.keys(r.ev).some(function (x) { return /^pro-/.test(x); }); } catch (e) { return false; } }); }
    function grid() { var c = cfg(); if (gv() !== "pro") return c.grid; if (c.gridPro) return c.gridPro; if (o.gridPro && !proData()) return JSON.parse(JSON.stringify(o.gridPro)); return c.grid; }
    function setGrid(G) { if (gv() === "pro") setCfg({ gridPro: G }); else setCfg({ grid: G }); }
    function maxOf(cr) { return +cr.max || 0; }
    function prof(cr, e) { var r = rec(e._c, e), v = r.ev && r.ev[cr.id]; if (!v || v.d == null) return null; var pos = v.pos == null ? .5 : v.pos; return { d: v.d, pos: pos, pts: Math.round(maxOf(cr) * (v.d + pos) / 4 * 4) / 4 }; }
    function note(e) { var G = grid(), tot = 0, max = 0, n = 0; G.criteres.forEach(function (cr) { var v = prof(cr, e); max += maxOf(cr); if (v) { tot += v.pts; n++; } }); if (!n || !max) return null; return Math.round(tot / max * 20 * 4) / 4; }
    /* 🧪 classe de démonstration (Réglages communs) : évaluations et auto-positionnements fictifs, une seule fois */
    function demoSeed() {
      if (!jget("eps.demo.v1", null)) return; var c = classes().filter(function (x) { return /^DÉMO/.test(x.nom); })[0]; if (!c) return;
      var G = grid(), R = [["J'ai réussi à rester concentré(e) toute la leçon.", "Je dois mieux m'organiser avant d'agir."], ["J'ai bien aidé mon binôme.", "Je dois prendre plus de risques."], ["J'ai progressé sur la situation 1.", "Je dois être plus régulier(e)."]];
      c.eleves.forEach(function (e, i) { var id = sid(c.nom, e); if (ld().items[id]) return; var ev = {}, ap = null;
        G.criteres.forEach(function (cr, k) { if ((i + k) % 5 !== 4) ev[cr.id] = { d: (i + k) % 4, pos: .5 }; });
        if (i % 2 === 0) { var a = {}; G.criteres.forEach(function (cr, k) { a[cr.id] = { d: Math.min(3, ((i + k) % 4) + (k % 2)), pos: .5 }; }); ap = { ev: a, r: R[i % 3][0], m: R[i % 3][1], t: Date.now() - 3600000, via: "tablette" }; }
        put(id, { c: c.nom, n: e.nom, p: e.prenom || "", ev: ev, ap: ap, comm: i % 3 === 0 ? "Investi(e), progrès nets sur la situation 1." : "", st: "", demo: 1 }); });
    }
    setTimeout(function () { try { demoSeed(); } catch (e) {} }, 2500); setInterval(function () { try { demoSeed(); } catch (e) {} }, 20000);
    /* grille d'une classe donnée, quelle que soit la classe ouverte (référentiel de compétences, eps-ref.js) */
    function gridFor(cl) { var c = cfg(), pro = false; try { pro = !!window.epsVoie && epsVoie(cl) === "pro"; } catch (e) {} if (!pro) return c.grid; if (c.gridPro) return c.gridPro; if (o.gridPro && !proData()) return JSON.parse(JSON.stringify(o.gridPro)); return c.grid; }
    var A = { app: o.app, nom: o.nom, ca: o.ca, color: o.color, icon: o.icon, pfx: o.pfx, code: o.code, url: o.url, gridFor: gridFor,
      grid: function () { var G = grid(); G.criteres.forEach(function (cr) { if (!cr.descEl) cr.descEl = cr.desc; }); return G; },
      classes: classes, name: function (e) { return { nom: e.nom, prenom: e.prenom }; }, prof: prof, note: note,
      absent: function (e) { return rec(e._c, e).st || ""; }, comment: function (e) { return rec(e._c, e).comm || ""; },
      extras: function (c, e) { try { return o.extras ? o.extras(c, e) : []; } catch (x) { return []; } },
      getAp: function (e) { return rec(e._c, e).ap; }, setAp: function (e, ap) { var r = rec(e._c, e); r.ap = ap; save(e._c, e, r); },
      settings: function () { return cfg(); }, setSettings: setCfg, isTeacher: o.isTeacher, unlock: o.unlock, changed: function () { if (UI.open) render(); } };
    var M = create(A);
    try { if (window.EPSD && EPSD.store) EPSD.store({ pre: PRE, key: KEY, onChange: A.changed }); else document.addEventListener("DOMContentLoaded", function () { if (window.EPSD && EPSD.store) EPSD.store({ pre: PRE, key: KEY, onChange: A.changed }); }); } catch (e) {}
    setTimeout(function () { try { if (window.EPSD && EPSD.store && !M._reg) { M._reg = 1; EPSD.store({ pre: PRE, key: KEY, onChange: A.changed }); } } catch (e) {} }, 1500);

    /* ---------- écran Évaluation (enseignant) ---------- */
    var KCLS = "eps.eval.cls." + o.app, UI = { open: false, tab: "eval", cls: (function () { try { return localStorage.getItem(KCLS); } catch (e) { return null; } })(), el: -1 }; /* dernière classe choisie, gardée (sinon on retombait sur la 1re classe de la liste) */
    function root() { if (UI.host) { UI.host.classList.add("epse-host"); UI.host.style.setProperty("--app", o.color); return UI.host; } var v = document.getElementById("epse-" + o.app); if (!v) { css(); v = document.createElement("div"); v.id = "epse-" + o.app; v.className = "epse"; v.style.setProperty("--app", o.color); document.body.appendChild(v); } return v; }
    function curC() { var L = classes(); var c = L.filter(function (x) { return x.nom === UI.cls; })[0] || L[0] || null; if (c && c.nom !== UI.cls) { UI.cls = c.nom; } if (c) try { localStorage.setItem(KCLS, c.nom); } catch (e) {} return c; }
    /* groupes enregistrés dans l'appli (option o.groups(classe) → [{nom, membres:["Prénom NOM", …]}]) : élèves rangés par groupe dans Évaluer */
    function grouper(c) {
      var GR = []; try { if (o.groups) GR = o.groups(c.nom) || []; } catch (e) {}
      if (!GR.length) return null;
      var pris = {}, out = [], ordre = [];
      GR.forEach(function (g) {
        var ids = [];
        (g.membres || []).forEach(function (m) { var k = nkey(m); c.eleves.forEach(function (e, i) { if (!pris[i] && nkey((e.prenom || "") + " " + (e.nom || "")) === k) { pris[i] = 1; ids.push(i); } }); });
        if (ids.length) out.push({ nom: g.nom, ids: ids });
      });
      if (!out.length) return null;
      var reste = c.eleves.map(function (e, i) { return i; }).filter(function (i) { return !pris[i]; });
      if (reste.length) out.push({ nom: "Sans groupe", ids: reste });
      var el = []; out.forEach(function (g) { g.ids = g.ids.map(function (i) { el.push(c.eleves[i]); return el.length - 1; }); });
      c.eleves = el; return out;
    }
    function render() {
      var R = root(), L = classes(), c = curC(), G = grid();
      var GRP = c && UI.tab === "eval" ? grouper(c) : null;
      var sel = L.length ? '<select data-cls>' + L.map(function (x) { return "<option" + (c && x.nom === c.nom ? " selected" : "") + ">" + esc(x.nom) + "</option>"; }).join("") + "</select>" : "";
      var tabsH = [["eval", "Évaluer"], ["bilan", "Bilan & export"], ["grille", "Grille"]].filter(function (t) { return !UI.only || UI.only.indexOf(t[0]) >= 0; });
      var head = UI.host ? '<div class="epse-sub">' + (tabsH.length > 1 ? tabsH.map(function (t) { return '<button data-tab="' + t[0] + '"' + (UI.tab === t[0] ? ' class="on"' : "") + ">" + t[1] + "</button>"; }).join("") : "") + '<span style="flex:1"></span>' + (sel ? '<label class="epse-mut">Classe ' + sel + "</label>" : "") + "</div>"
        : '<div class="epse-bar"><span class="ei">' + (o.icon || "") + "</span><b>" + esc(o.nom) + "</b><small>Évaluation · " + esc(o.ca) + "</small>" + sel + '<button data-close>✕ Fermer</button></div>' +
        '<div class="epse-tabs">' + tabsH.map(function (t) { return '<button data-tab="' + t[0] + '"' + (UI.tab === t[0] ? ' class="on"' : "") + ">" + t[1] + "</button>"; }).join("") + "</div>";
      var body = "";
      if (!c) body = '<div class="epse-card"><p>Aucune classe pour cette activité. Importe une liste d\'élèves dans Réglages (accueil) et vérifie que l\'activité est cochée pour la classe.</p></div>';
      else if (UI.tab === "eval") body = UI.el >= 0 && c.eleves[UI.el] ? sheet(c, c.eleves[UI.el]) : '<div class="epse-card"><h2>' + esc(c.nom) + " · " + c.eleves.length + ' élèves</h2><p class="epse-mut">Touche un élève pour le positionner sur la grille.</p><div class="epse-chips">' +
        (function () { function chip(i) { var e = c.eleves[i], n = note(e), r = rec(e._c, e); return '<button class="epse-chip' + (n != null ? " ok" : "") + '" data-el="' + i + '">' + esc(e.prenom + " " + e.nom) + (r.ap ? M.apChip(e) : "") + "<small>" + (r.st ? r.st : n != null ? fr(n) + " / 20" : "à évaluer") + "</small></button>"; }
          if (!GRP) return c.eleves.map(function (e, i) { return chip(i); }).join("");
          return "</div>" + GRP.map(function (g) { return '<h3 style="margin:14px 0 4px;font-size:15px">' + esc(g.nom) + ' <small class="epse-mut">· ' + g.ids.length + "</small></h3><div class=\"epse-chips\">" + g.ids.map(chip).join("") + "</div>"; }).join("") + "<div>"; })() + "</div></div>";
      else if (UI.tab === "bilan") body = table(c) + M.card(c) + M.exportsHtml();
      else body = gridEditor(G);
      R.innerHTML = head + '<div class="epse-in">' + body + "</div>";
      if (R.querySelector("[data-close]")) R.querySelector("[data-close]").onclick = close;
      var s = R.querySelector("[data-cls]"); if (s) s.onchange = function () { UI.cls = s.value; UI.el = -1; render(); };
      R.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { UI.tab = b.dataset.tab; UI.el = -1; render(); }; });
      R.querySelectorAll("[data-el]").forEach(function (b) { b.onclick = function () { UI.el = +b.dataset.el; render(); R.scrollTop = 0; }; });
      if (c && UI.tab === "eval" && UI.el >= 0) bindSheet(R, c, c.eleves[UI.el]);
      if (c && UI.tab === "bilan") { M.bindCard(R, c); M.bindExports(R, c); }
      if (UI.tab === "grille") bindGrid(R);
    }
    function sheet(c, e) {
      var G = grid(), r = rec(e._c, e), n = note(e), ap = r.ap;
      return '<div class="epse-card"><div class="epse-row" style="justify-content:space-between"><button class="epse-btn" data-back>← Retour</button><b style="font-size:20px">' + esc(e.prenom + " " + e.nom) + '</b><span class="epse-note">' + (r.st || (n == null ? "—" : fr(n) + " / 20")) + '</span><span><button class="epse-btn" data-nav="-1">‹</button> <button class="epse-btn" data-nav="1">›</button></span></div>' +
        '<div class="epse-row">' + ["", "ABS", "DISP"].map(function (st) { return '<button class="epse-btn' + ((r.st || "") === st ? " p" : "") + '" data-st="' + st + '">' + (st || "Présent(e)") + "</button>"; }).join("") + '<button class="epse-btn" data-pdf>📄 Fiche PDF</button></div></div>' +
        M.propHtml(e, e._c) +
        G.criteres.map(function (cr) { var v = r.ev && r.ev[cr.id], x = ap && ap.ev && ap.ev[cr.id], p = prof(cr, e);
          return '<div class="epse-crit"><div class="epse-ch"><b>' + esc(cr.nom) + "</b><span>" + esc(cr.afl || "") + " · " + fr(maxOf(cr)) + " pts" + (p ? " · " + fr(p.pts) + " pts" : "") + "</span></div>" + (cr.but ? '<p class="epse-mut" style="margin:0 0 8px">' + esc(cr.but) + "</p>" : "") +
            '<div class="epse-degs">' + [0, 1, 2, 3].map(function (d) { return '<button class="epse-deg' + (v && v.d === d ? " on" : "") + '" style="--dc:' + DCOL[d] + ";--dt:" + DTINT[d] + '" data-c="' + esc(cr.id) + '" data-d="' + d + '"><b>D' + (d + 1) + " · " + esc(G.degres[d]) + (x && x.d === d ? '<span class="me">🙋 élève</span>' : "") + "</b>" + esc(cr.desc[d] || "") + "</button>"; }).join("") + "</div>" +
            (v ? '<div class="epse-intra" style="--dc:' + DCOL[v.d] + '"><span>Dans le degré :</span><input type="range" min="0" max="4" step="1" value="' + Math.round((v.pos == null ? .5 : v.pos) * 4) + '" data-p="' + esc(cr.id) + '"><b style="color:' + DCOL[v.d] + '">' + esc(posLbl(v.d, v.pos == null ? .5 : v.pos)) + "</b></div>" : "") + "</div>"; }).join("") +
        (ap && (ap.r || ap.m) ? '<div class="epse-card"><h2>🙋 Les mots de l\'élève</h2>' + (ap.r ? "<p>✓ " + esc(ap.r) + "</p>" : "") + (ap.m ? "<p>→ " + esc(ap.m) + "</p>" : "") + "</div>" : "") +
        '<div class="epse-card"><div class="epse-row" style="margin:0 0 6px"><button type="button" class="epse-btn" data-phr>✨ Proposer une phrase pour l\'élève</button><button type="button" class="epse-btn" data-bul>📝 Appréciations de bulletin (classe)</button><button type="button" class="epse-btn" data-pnall>📋 Pronote : toutes les évaluations de la classe</button></div><div data-phrbox></div><label class="epse-mut" style="font-weight:800">Commentaire (sur la fiche)<textarea rows="3" data-comm data-eps-comment data-eps-ctx="' + esc(G.criteres.map(function (cr) { var p = prof(cr, e); return cr.nom + " : " + (p ? "degré " + (p.d + 1) + " (" + G.degres[p.d] + ")" : "non évalué"); }).join(" ; ") + (n != null ? " ; note " + fr(n) + "/20" : "")) + '">' + esc(r.comm || "") + "</textarea></label></div>";
    }
    function bindSheet(R, c, e) {
      var up = function (f) { var r = rec(e._c, e); f(r); save(e._c, e, r); render(); };
      R.querySelector("[data-back]").onclick = function () { UI.el = -1; render(); };
      R.querySelectorAll("[data-nav]").forEach(function (b) { b.onclick = function () { var n = UI.el + (+b.dataset.nav); if (n >= 0 && n < c.eleves.length) { UI.el = n; render(); } }; });
      R.querySelectorAll("[data-st]").forEach(function (b) { b.onclick = function () { up(function (r) { r.st = b.dataset.st; }); }; });
      R.querySelector("[data-pdf]").onclick = function () { M.pdfEleve(c, e, true); };
      R.querySelectorAll("[data-d]").forEach(function (b) { b.onclick = function () { up(function (r) { r.ev = r.ev || {}; var id = b.dataset.c, d = +b.dataset.d; if (r.ev[id] && r.ev[id].d === d) delete r.ev[id]; else r.ev[id] = { d: d, pos: .5 }; }); }; });
      R.querySelectorAll("[data-p]").forEach(function (i) { i.onchange = function () { up(function (r) { r.ev[i.dataset.p].pos = (+i.value) / 4; }); }; });
      var t = R.querySelector("[data-comm]"); t.oninput = t.onchange = function () { var r = rec(e._c, e); r.comm = t.value; save(e._c, e, r); };
      M.bindProp(R, e, e._c, render, function () { up(function (r) { var a = r.ap; r.ev = r.ev || {}; grid().criteres.forEach(function (cr) { if (!r.ev[cr.id] && a && a.ev && a.ev[cr.id]) r.ev[cr.id] = { d: a.ev[cr.id].d, pos: a.ev[cr.id].pos == null ? .5 : a.ev[cr.id].pos }; }); }); });
      M.bindPhrase(R, e, e._c, function (txt) { var r = rec(e._c, e); r.comm = txt; save(e._c, e, r); render(); });
      var pna = R.querySelector("[data-pnall]"); if (pna) pna.onclick = function () { M.pronoteAll(e._c, c.eleves); };
    }
    function table(c) { var G = grid();
      return '<div class="epse-card"><h2>📋 ' + esc(c.nom) + '</h2><div style="overflow:auto"><table><tr><th class="l">Élève</th>' + G.criteres.map(function (cr) { return "<th>" + esc(cr.nom) + "</th>"; }).join("") + "<th>Note /20</th></tr>" +
        c.eleves.map(function (e) { var r = rec(e._c, e); return '<tr><td class="l">' + esc(e.prenom + " " + e.nom) + "</td>" + G.criteres.map(function (cr) { var p = prof(cr, e); return "<td>" + (p ? '<span class="epse-d" style="background:' + DCOL[p.d] + '">D' + (p.d + 1) + "</span> " + fr(p.pts) : "–") + "</td>"; }).join("") + "<td><b>" + (r.st || fr(note(e))) + "</b></td></tr>"; }).join("") + "</table></div></div>"; }
    function gridEditor(G) {
      var gvv = gv(), cP = cfg().gridPro;
      return '<div class="epse-card"><h2>Grille d\'évaluation · ' + (gvv === "pro" ? "🛠 voie professionnelle" : "🎓 voie générale et technologique") + '</h2><p class="epse-mut">Grille des classes de la ' + (gvv === "pro" ? "voie professionnelle" : "voie générale") + " (celle de la classe choisie, " + esc(UI.cls || "") + "). Proposition à adapter : intitulés, points, code AFL" + (gvv === "pro" ? "P (AFLP1 à AFLP6)" : " (AFL1 à AFL3)") + " et textes des 4 degrés (enseignant et élève). Les modifications valent pour toutes les tablettes.</p>" +
        (gvv === "pro" && !cP ? (o.gridPro && !proData() ? '<div style="background:#E3F4E8;border-radius:10px;padding:8px 12px;margin:0 0 8px">✓ Grille reprise de ton protocole CCF Bac pro (' + esc(o.gridProSrc || "") + ') : AFLP et degrés à la lettre. Tu peux l\'adapter (une modification l\'enregistre pour les classes pro).</div>' : '<div style="background:#FFF6E0;border-radius:10px;padding:8px 12px;margin:0 0 8px">⚠ Pas encore de grille propre à la voie professionnelle : c\'est une copie de la grille générale' + (o.gridPro ? " (des classes pro ont déjà été évaluées avec elle)" : "") + '. Mets les codes AFLP et les textes du référentiel Bac pro, ou importe ta grille ; elle sera enregistrée pour les classes pro seulement.' + (o.gridPro ? '<br><button class="epse-btn" data-g-proto>📋 Reprendre la grille de mon protocole CCF Bac pro</button>' : "") + "</div>") : "") +
        '<div class="epse-row">' + [0, 1, 2, 3].map(function (d) { return '<label class="epse-mut">D' + (d + 1) + ' <input type="text" data-g="degres.' + d + '" value="' + esc(G.degres[d]) + '" style="width:140px"></label>'; }).join("") + "</div>" +
        G.criteres.map(function (cr, i) { return '<div class="epse-crit"><div class="epse-row" style="justify-content:flex-end;margin:0 0 4px"><button class="epse-btn" data-gel="' + i + '">✨ Proposer la version élève</button></div><div class="epse-row"><input type="text" data-g="c.' + i + '.nom" value="' + esc(cr.nom) + '" style="flex:2"><input type="text" data-g="c.' + i + '.afl" value="' + esc(cr.afl || "") + '" style="width:90px"><label class="epse-mut">pts <input type="text" data-g="c.' + i + '.max" value="' + esc(cr.max) + '" style="width:60px"></label></div>' +
          '<input type="text" data-g="c.' + i + '.but" value="' + esc(cr.but || "") + '" placeholder="Ce qui est attendu">' +
          '<div class="epse-degs" style="margin-top:6px">' + [0, 1, 2, 3].map(function (d) { return '<div><small class="epse-mut">D' + (d + 1) + ' (enseignant)</small><textarea rows="3" data-g="c.' + i + '.desc.' + d + '">' + esc(cr.desc[d] || "") + '</textarea><small class="epse-mut">D' + (d + 1) + ' (élève)</small><textarea rows="3" data-g="c.' + i + '.descEl.' + d + '">' + esc((cr.descEl || cr.desc)[d] || "") + "</textarea></div>"; }).join("") + "</div></div>"; }).join("") +
        '<div class="epse-row"><button class="epse-btn" data-g-imp>📥 Importer une grille (Additio : PDF, Excel/CSV, photo)</button><button class="epse-btn" data-g-reset>↺ Revenir à la grille proposée</button><input type="file" data-g-file accept=".pdf,.csv,.txt,.xlsx,image/*" style="display:none"></div></div>';
    }
    function bindGrid(R) {
      R.querySelectorAll("[data-g]").forEach(function (i) { i.onchange = function () { var G = JSON.parse(JSON.stringify(grid())), p = i.dataset.g.split("."), v = i.value;
        if (p[0] === "degres") G.degres[+p[1]] = v; else { var cr = G.criteres[+p[1]]; if (p[2] === "desc" || p[2] === "descEl") { cr[p[2]] = (cr[p[2]] || cr.desc).slice(); cr[p[2]][+p[3]] = v; } else cr[p[2]] = p[2] === "max" ? (+String(v).replace(",", ".") || 0) : v; }
        setGrid(G); toast("Grille enregistrée" + (gv() === "pro" ? " (voie professionnelle)" : "")); }; });
      /* ✨ version élève proposée par Claude : affichée dans les champs « élève », enregistrée seulement après relecture (« Valider ») */
      R.querySelectorAll("[data-gel]").forEach(function (b) { b.onclick = async function () {
        var i = +b.dataset.gel, cr = grid().criteres[i]; if (!window.EPSD || !EPSD.reformuler) return toast("Indisponible");
        b.disabled = true; b.textContent = "Claude rédige…"; var props = [];
        try { for (var d = 0; d < 4; d++) props.push(await EPSD.reformuler(cr.desc[d] || "", { mode: "eleve", act: o.nom })); }
        catch (e) { b.disabled = false; b.textContent = "✨ Proposer la version élève"; return toast("⚠ " + (e && e.message || e)); }
        [0, 1, 2, 3].forEach(function (d) { var t = R.querySelector('[data-g="c.' + i + '.descEl.' + d + '"]'); if (t) { t.value = props[d]; t.style.background = "#FFF6E0"; t.dataset.pending = "1"; } });
        b.disabled = false; b.textContent = "✓ Valider la version élève (après relecture)";
        b.onclick = function () { var G = JSON.parse(JSON.stringify(grid())), c = G.criteres[i]; c.descEl = [0, 1, 2, 3].map(function (d) { var t = R.querySelector('[data-g="c.' + i + '.descEl.' + d + '"]'); return t ? t.value : (c.descEl || c.desc)[d]; });
          setGrid(G); toast("Version élève enregistrée"); render(); };
      }; });
      /* 📥 import d'une grille (Additio…) : Claude la convertit, l'enseignant relit l'aperçu avant de remplacer */
      var gf = R.querySelector("[data-g-file]"), gi = R.querySelector("[data-g-imp]");
      if (gi && gf) { gi.onclick = function () { gf.click(); }; gf.onchange = async function () {
        var f = gf.files[0]; if (!f) return; if (!window.EPSD || !EPSD.post) return toast("Indisponible (recharge la page)");
        gi.disabled = true; gi.textContent = "Claude lit la grille…";
        try {
          var q = { op: "grille", act: o.nom, nom: f.name, mime: f.type };
          if (/\.xlsx$/i.test(f.name)) { if (!window.JSZip) await loadJs(BASE + "vendor/jszip.min.js"); var z = await JSZip.loadAsync(f), ss = z.file("xl/sharedStrings.xml"); q.txt = ss ? (await ss.async("string")).replace(/<\/si>/g, "\n").replace(/<[^>]+>/g, "") : ""; }
          else if (/^(application\/pdf|image\/)/.test(f.type)) q.b64 = await new Promise(function (ok) { var rd = new FileReader(); rd.onload = function () { ok(String(rd.result).split(",")[1]); }; rd.readAsDataURL(f); });
          else q.txt = await f.text();
          var r = await EPSD.post({ lc: q }); if (!r || !r.ok || !r.grille) throw new Error((r && r.error) || "réponse vide");
          var g = r.grille, ok = (g.criteres || []).length;
          if (!ok) throw new Error("aucun critère trouvé");
          var apercu = g.criteres.map(function (c) { return "• " + (c.afl ? c.afl + " · " : "") + c.nom + " (" + c.max + " pts)"; }).join("\n");
          if (confirm("Grille lue (" + ok + " critères) :\n" + apercu + (g.remarque ? "\n\nRemarque : " + g.remarque : "") + "\n\nRemplacer la grille actuelle ? (tu pourras retoucher chaque texte ensuite)")) {
            g.degres = (g.degres && g.degres.length === 4) ? g.degres : grid().degres; g.degresEl = grid().degresEl;
            g.criteres.forEach(function (c, i) { c.id = c.id || "c" + (i + 1); c.max = +String(c.max).replace(",", ".") || 0; c.desc = (c.desc || []).concat(["", "", "", ""]).slice(0, 4); });
            setGrid(g); toast("Grille importée ✓" + (gv() === "pro" ? " (voie professionnelle)" : "")); render(); return;
          }
        } catch (e) { toast("⚠ " + (e && e.message || e)); }
        gi.disabled = false; gi.textContent = "📥 Importer une grille (Additio : PDF, Excel/CSV, photo)"; gf.value = "";
      }; }
      var gp = R.querySelector("[data-g-proto]"); if (gp) gp.onclick = function () { if (confirm("Remplacer la grille des classes pro par celle de ton protocole CCF Bac pro ? Les évaluations déjà faites avec l'ancienne grille ne seront plus affichées dans la grille (elles restent enregistrées).")) { setCfg({ gridPro: JSON.parse(JSON.stringify(o.gridPro)) }); render(); } };
      R.querySelector("[data-g-reset]").onclick = function () { if (confirm("Revenir à la grille proposée" + (gv() === "pro" ? " pour la voie professionnelle (copie de la grille générale)" : "") + " ? Les textes modifiés seront remplacés.")) { if (gv() === "pro") setCfg({ gridPro: o.gridPro ? JSON.parse(JSON.stringify(o.gridPro)) : null }); else setCfg({ grid: JSON.parse(JSON.stringify(o.grid)) }); render(); } };
    }
    /* affichage dans un onglet de l'espace enseignant (eps-shell.js) : mount(élément, ['eval','grille'] | ['bilan']) */
    function mount(el, only, cls) { UI.host = el; UI.open = true; UI.only = only || null; if (only && only.indexOf(UI.tab) < 0) UI.tab = only[0]; if (cls) UI.cls = cls; UI.el = -1; render();
      var obs = setInterval(function () { if (!document.body.contains(el)) { clearInterval(obs); if (UI.host === el) { UI.host = null; UI.open = false; UI.only = null; } } }, 1000); }
    function open(cls) { UI.host = null; UI.only = null; UI.open = true; if (cls) UI.cls = cls; UI.el = -1; render(); document.documentElement.style.overflow = "hidden"; }
    function close() { UI.open = false; var v = document.getElementById("epse-" + o.app); if (v) v.remove(); document.documentElement.style.overflow = ""; }
    M.open = open; M.close = close; M.mount = mount; M.classes = classes; M.adapter = A;
    return M;
  }

  window.EPSE = { create: create, store: store, libs: libs, DCOL: DCOL, DTINT: DTINT, coeval: { edit: coEdit, eleve: coEleve, grid: coGrid, grids: coGrids, crits: coCrits, moy: coMoy, add: coAdd, IDEES: COIDEES, DIR: CODIR } };
})();
