/* EPS – Autonomie et numérique : espace enseignant commun (mêmes onglets, même ordre, dans toutes les applis).
   Onglets : 📅 Séquence · 👁 Vue élève · 📚 Bibliothèque · 📋 Évaluation · 👥 Classe · 📄 Bilans · ⚙ Réglages.
   EPST.init({
     app, nom, color, isTeacher(),                     // obligatoire
     anchor: élément ou sélecteur après lequel la barre d'onglets s'insère (en général la barre du haut de l'appli),
     main: sélecteur(s) du contenu de l'appli, masqué quand un panneau commun est affiché,
     tabs: { seq:{go(), on()} , cls:{go(), on()}, eval:{go()|panel(el)}, bil:{go()|panel(el)}, ... },   // go() = écran de l'appli ; panel(el) = panneau commun
     biblio: [{ico, label, sub, go()}],                // ressources (écrans de l'appli) : onglet Bibliothèque
     reglages: [{ico, label, sub, go()}],              // réglages propres à l'appli (en plus des réglages communs)
     home: 'seq'                                       // onglet d'ouverture en mode enseignant
   })
   « Vue élève » : l'appli s'ouvre dans un cadre avec ?vue=eleve (le mode enseignant y est ignoré : voir eps-lists.js),
   sans quitter le mode enseignant. */
(function () {
  var BASE = ((document.currentScript && document.currentScript.src) || "").replace(/eps-shell\.js.*$/, "");
  var ORDER = [["seq", "📅", "Séquence"], ["suivi", "📡", "Suivi"], ["vue", "👁", "Vue élève"], ["bib", "📚", "Bibliothèque"], ["eval", "📋", "Évaluation"], ["ccf", "📜", "CCF"], ["cls", "👥", "Classe"], ["bil", "📄", "Bilans"], ["reg", "⚙", "Réglages"]];
  var VUE = /[?&]vue=eleve\b/.test(location.search);
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function css() {
    if (document.getElementById("epst-css")) return;
    var st = document.createElement("style"); st.id = "epst-css";
    st.textContent = [
      ".epst-nav{position:sticky;top:0;z-index:60;display:none;gap:4px;overflow-x:auto;background:#14171C;padding:0 14px;box-shadow:inset 0 -4px 0 var(--epst,#666);scrollbar-width:none;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
      ".epst-nav::-webkit-scrollbar{display:none}",
      "html.epst-on .epst-nav{display:flex}",
      ".epst-nav button{flex:none;border:0;background:transparent;color:#B9BEC7;font:700 15px system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;padding:11px 14px 14px;border-radius:10px 10px 0 0;cursor:pointer;white-space:nowrap}",
      ".epst-nav button.on{background:var(--epst,#666);color:#fff}",
      ".epst-nav button span{margin-right:6px}",
      ".epst-acts{display:none;gap:8px;flex-wrap:wrap;max-width:1100px;margin:10px auto 0;padding:0 18px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
      /* barre d'outils : un seul bloc blanc, icône au-dessus du libellé, séparateurs fins ; le reste dans « ⋯ Plus » */
      "html.epst-on.epst-acts-on .epst-acts{display:block}html.epst-pan .epst-acts{margin-bottom:-4px}",
      ".epst-tb{display:flex;align-items:stretch;background:#fff;border:1px solid #E6E1D6;border-radius:14px;box-shadow:0 1px 2px rgba(0,0,0,.04);overflow-x:auto;scrollbar-width:none}.epst-tb::-webkit-scrollbar{display:none}",
      ".epst-tb>button{flex:1 1 0;min-width:92px;max-width:170px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:0;border-right:1px solid #EFEBE3;background:transparent;color:#14171C;font:700 12.5px/1.2 system-ui,sans-serif;padding:9px 8px 8px;cursor:pointer;text-align:center;position:relative}",
      ".epst-tb>button:last-child{border-right:0}.epst-tb>button i{font-style:normal;font-size:20px;line-height:1}",
      ".epst-tb>button:hover{background:#F7F5F0}.epst-tb>button:hover::after,.epst-tb>button.open::after{content:'';position:absolute;left:14px;right:14px;bottom:0;height:3px;border-radius:3px 3px 0 0;background:var(--epst,#666)}",
      ".epst-tb>button.more{flex:0 0 auto;margin-left:auto;min-width:76px;color:#4A4F57;position:sticky;right:0;background:#fff;border-left:1px solid #EFEBE3;z-index:1}",
      ".epst-mn{position:absolute;z-index:70;background:#fff;border:1px solid #E6E1D6;border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.16);padding:6px;min-width:280px;max-height:70vh;overflow:auto;font-family:system-ui,sans-serif}",
      ".epst-mn .r{display:flex;align-items:center;gap:4px}.epst-mn .r>button:first-child{flex:1;display:flex;align-items:center;gap:10px;border:0;background:none;text-align:left;padding:10px;border-radius:10px;font:700 14.5px system-ui;color:#14171C;cursor:pointer}",
      ".epst-mn .r>button:first-child:hover{background:#F5F3EE}.epst-mn .r>button:first-child i{font-style:normal;width:24px;text-align:center;font-size:18px}",
      ".epst-mn .pin{border:0;background:none;font-size:18px;width:38px;height:38px;border-radius:10px;cursor:pointer;color:#B5AFA3}.epst-mn .pin.on{color:#D4A000}.epst-mn .pin:hover{background:#F5F3EE}",
      ".epst-mn .h{font:800 11px system-ui;letter-spacing:.06em;text-transform:uppercase;color:#8A8F98;padding:8px 10px 4px}",
      ".epst-panel{display:none;max-width:1100px;margin:0 auto;padding:18px 18px 60px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#14171C}",
      "html.epst-pan .epst-panel{display:block}",
      ".epst-panel h2{font-size:22px;margin:0 0 4px}.epst-panel .mut{color:#6A6F78;font-size:14px;margin:0 0 14px}",
      ".epst-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin:0 0 18px}",
      ".epst-card{display:flex;gap:12px;align-items:center;text-align:left;background:#fff;border:1px solid #E6E1D6;border-left:5px solid var(--epst,#666);border-radius:14px;padding:14px;font:inherit;color:inherit;cursor:pointer;min-height:76px}",
      ".epst-card:active{transform:scale(.99)}.epst-card i{font-style:normal;font-size:26px;flex:none}.epst-card b{display:block;font-size:16px}.epst-card small{display:block;color:#6A6F78;font-size:13px;margin-top:2px}",
      ".epst-b{height:40px;border-radius:10px;border:2px solid var(--epst,#666);background:#fff;color:#14171C;font:800 14px system-ui,sans-serif;padding:0 14px;cursor:pointer}.epst-b:disabled{opacity:.5}",
      "@media print{html.epst-pan body>*:not(.epst-panel){display:none!important}html.epst-pan .epst-panel{display:block!important;padding:0}.epst-panel button{display:none!important}}",
      /* 📌 bandeau cliquable (27/11/2026) : un écran ouvert depuis le bandeau s'affiche SOUS le bandeau, comme « Leçon du jour » ; rien à fermer */
      ".epst-dock{top:var(--epst-dt,0px)!important;bottom:0!important;height:auto!important;max-height:none!important;border-top:1px solid #E6E1D6}",
      ".epst-dock.epst-dock-m{background:#F5F3EE!important;align-items:flex-start!important;overflow:auto!important;padding-top:16px!important}",
      ".epst-dock [data-epst-x]{display:none!important}",
      /* écran rangé sous le bandeau : pas de second en-tête (27/11/2026, demande de l'enseignant : « Fiches de leçon · Escalade », puis l'onglet
         « Fiches de leçon », puis « Mes fiches de leçon » et sa description, c'était trois fois la même chose). Le bouton du bandeau, souligné, suffit :
         barre des fiches de leçon masquée (ses onglets sont dans le bandeau), titre des autres barres masqué (on garde leurs sous-onglets),
         barre vide masquée, titre de l'écran et sa phrase d'explication masqués. */
      ".epst-dock.lc-ov:not([id])>.lc-top{display:none!important}.epst-dock .lc-top>b{display:none!important}.epst-dock .lc-top:not(:has(>button:not([data-epst-x]))){display:none!important}",
      ".epst-dock.lc-ov:not([id]) .lc-in>h2:first-child,.epst-dock.lc-ov:not([id]) .lc-in>h2:first-child+p.lc-mut{display:none!important}.epst-dock .lc-body{padding-top:12px!important}",
      "html.epst-docked,html.epst-docked body{overflow:hidden!important}",
      ".epst-tb>button.cur{background:#F7F5F0}.epst-tb>button.cur::after{content:'';position:absolute;left:8px;right:8px;bottom:0;height:4px;border-radius:4px 4px 0 0;background:var(--epst,#666)}",
      ".epst-mn{z-index:2147483600!important}",
      ".epst-vue{position:fixed;left:0;right:0;bottom:0;z-index:2147481500;background:#F5F3EE;display:none;flex-direction:column}",
      "html.epst-vue-on .epst-vue{display:flex}",
      ".epst-vue .h{display:flex;align-items:center;gap:10px;padding:8px 14px;background:#FFF6E0;border-bottom:1px solid #F0D58A;font:600 14px system-ui,sans-serif;color:#6b4e00}",
      ".epst-vue .h button{margin-left:auto;height:44px;flex:none;border-radius:10px;border:1.5px solid #D8C27A;background:#fff;font:700 14px system-ui,sans-serif;padding:0 12px;cursor:pointer}",
      ".epst-vue iframe{flex:1;border:0;width:100%;background:#F5F3EE}"
    ].join("\n");
    document.head.appendChild(st);
  }
  function $(s) { return typeof s === "function" ? s() : typeof s === "string" ? document.querySelector(s) : s; }

  function init(C) {
    if (VUE) return null; /* dans le cadre « Vue élève » : pas d'espace enseignant */
    css();
    var M = { C: C, cur: null }, nav = document.createElement("nav"), pan = document.createElement("div"), vue = document.createElement("div"), acts = document.createElement("div");
    acts.className = "epst-acts"; acts.style.setProperty("--epst", C.color);
    nav.className = "epst-nav"; nav.style.setProperty("--epst", C.color); pan.className = "epst-panel"; pan.style.setProperty("--epst", C.color);
    vue.className = "epst-vue";
    vue.innerHTML = '<div class="h">👁 Vue élève · tes vraies données, tu restes en mode enseignant.<button type="button">✕ Fermer</button></div><iframe title="Vue élève"></iframe>';
    /* 📡 Suivi (27/11/2026, demande de l'enseignant : suivre ses classes au même endroit dans toutes les applis) : onglet commun, juste après
       Séquence, dans toute appli d'activité (pas la CCF). Il ouvre l'écran de suivi de l'appli (window.epsCtlOwn = {open(classe), on()}),
       jamais dans les autres (précision de l'enseignant : « commun » ne veut pas dire toutes les applis ; Danse, Cross-training, Relais
       gardent l'action « Pilotage de leçon » de Séquence). Le bouton est toujours créé mais reste caché tant que l'appli n'a pas déclaré epsCtlOwn.
       Dans ces applis, le suivi n'est plus une action de Séquence ni de Classe. */
    var tabs = ORDER.filter(function (t) { return t[0] === "vue" || t[0] === "bib" || t[0] === "reg" || (t[0] === "suivi" && !!(C.tabs && C.tabs.seq) && C.app !== "ccf" && C.suivi !== false) || (t[0] === "ccf" && !!(C.tabs && C.tabs.eval) && C.tabs.ccf !== false) || (C.tabs && C.tabs[t[0]]); });
    nav.innerHTML = tabs.map(function (t) { return '<button type="button" data-t="' + t[0] + '"' + (t[0] === "suivi" && !window.epsCtlOwn ? ' style="display:none"' : "") + '><span>' + t[1] + "</span>" + t[2] + "</button>"; }).join("");
    /* deux bandeaux (barre de l'appli + onglets enseignant) : en descendant, seuls les onglets restent en haut ;
       la barre de l'appli revient dès qu'on remonte */
    var barHidden = false, lastY = {};
    function stickyBar() { var el = $(C.anchor); while (el && el !== document.body) { var p = getComputedStyle(el).position; if (p === "sticky" || p === "fixed") return el; el = el.parentElement; }
      var pv = nav.previousElementSibling; return pv && /sticky|fixed/.test(getComputedStyle(pv).position) ? pv : null; }
    function setHidden(h) { var b = stickyBar(), H = b ? b.offsetHeight : 0; barHidden = !!(h && b);
      if (b) { b.style.transition = "top .2s ease"; b.style.top = barHidden ? (-H - 8) + "px" : ""; }
      nav.style.transition = "top .2s ease"; nav.style.top = (barHidden || !b) ? "0px" : H + "px"; }
    /* la barre de l'appli peut tenir sur 2 lignes (petits écrans, boutons ajoutés) : les onglets se collent toujours juste en dessous */
    function fitTop() { if (!nav.offsetParent) return; var b = stickyBar(), H = b ? b.offsetHeight : 0;
      if (barHidden) { if (b) { var hv = (-H - 8) + "px"; if (b.style.top !== hv) b.style.top = hv; } return; }
      var v = H + "px"; if (nav.style.top !== v) { nav.style.transition = ""; nav.style.top = v; } }
    setInterval(fitTop, 700); addEventListener("resize", fitTop);
    document.addEventListener("scroll", function (e) {
      if (!nav.offsetParent) return; var t = (e.target === document || e.target === document.documentElement) ? (document.scrollingElement || document.documentElement) : e.target;
      if (!t || t.scrollTop == null || (t !== document.scrollingElement && t !== document.documentElement && !t.contains(nav))) return;
      var k = t === document.scrollingElement ? "w" : "x", y = t.scrollTop, prev = lastY[k] || 0; if (Math.abs(y - prev) < 6) return; lastY[k] = y;
      var h = y > prev && y > 80; if (h !== barHidden) setHidden(h);
    }, true);
    function place() {
      var a = $(C.anchor); if (a && a.parentNode) { if (nav.previousElementSibling !== a) a.insertAdjacentElement("afterend", nav); }
      else if (!nav.parentNode) document.body.insertBefore(nav, document.body.firstChild);
      if (!acts.parentNode) nav.insertAdjacentElement("afterend", acts);
      if (!pan.parentNode) acts.insertAdjacentElement("afterend", pan);
      if (!vue.parentNode) document.body.appendChild(vue);
    }
    function mains(show) { String(C.main || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (sel) { document.querySelectorAll(sel).forEach(function (el) { el.style.display = show ? "" : "none"; }); }); }
    /* ===== 📌 Bandeau cliquable (demande de l'enseignant, 27/11/2026) =====
       « Si tu as fait un bandeau, je veux qu'il soit cliquable, comme pour Leçon du jour. Pas besoin de me renvoyer vers quelque chose que
       je dois fermer. » Un écran ouvert depuis le bandeau, le menu « Plus » ou une carte (fiches de leçon, leçon en cours, évaluer la leçon,
       ma classe, pilotage, plan de terrain, niveaux & groupes…) n'est plus une fenêtre par-dessus tout : il se range sous le bandeau
       (.epst-dock), les onglets et le bandeau restent cliquables, son bouton « ✕ Fermer » disparaît, le bouton du bandeau reste marqué.
       Changer d'onglet ou toucher un autre bouton le remplace. Les écrans communs plein écran (.lc-ov, .gr-w) ouverts depuis une page de
       l'appli se rangent de la même façon. Jamais dans l'atelier de la console (?console=lecons / classe : l'écran y est la page). */
    var H = document.documentElement, NODOCK = /[?&]console=(lecons|classe)/.test(location.search), ROOT = null, AUTO = ".lc-ov,.gr-w";
    function shown(el) { if (!el || !el.isConnected) return false; var cs = getComputedStyle(el); return cs.display !== "none" && cs.visibility !== "hidden" && el.getBoundingClientRect().height > 40; }
    function big(el) { if (el.nodeType !== 1 || el === nav || el === acts || el === pan || el === vue || /^(SCRIPT|STYLE|LINK)$/.test(el.tagName)) return false;
      if (el.matches(".lc-st,.lc-msg,.epsg,.epst-mn,#eps-simbar,.epst-vue")) return false;
      var cs = getComputedStyle(el); if (cs.position !== "fixed" || cs.display === "none" || cs.visibility === "hidden") return false;
      var r = el.getBoundingClientRect(); return r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.6; }
    function opaque(el) { var m = getComputedStyle(el).backgroundColor.match(/rgba\(([^)]+)\)/); return !m || parseFloat(m[1].split(",")[3]) > 0.9; }
    function screens() { return Array.prototype.filter.call(document.body.children, big); }
    function docked() { return Array.prototype.filter.call(document.body.children, function (e) { return e.classList && e.classList.contains("epst-dock"); }); }
    function closer(el) { var B = Array.prototype.slice.call(el.querySelectorAll("button[data-x],button.x,button[data-close]")), f = function (re) { return B.filter(function (b) { return re.test(b.textContent); })[0]; };
      return f(/Fermer|^\s*✕\s*$/) || f(/Retour/) || null; } /* « Fermer » d'abord : un « ← Retour » de l'écran (ex. modalités) reste utilisable */
    function dockTop() { var a = shown(acts) ? acts : nav, t = Math.max(0, Math.round(a.getBoundingClientRect().bottom + (a === acts ? 8 : 0))); H.style.setProperty("--epst-dt", t + "px"); }
    function dock(el) { if (NODOCK || el.classList.contains("epst-dock")) return; el.classList.add("epst-dock"); if (!opaque(el)) el.classList.add("epst-dock-m");
      if (!ROOT || !shown(ROOT)) ROOT = el; dockSync(); }
    function undock(close) { docked().forEach(function (el) { el.querySelectorAll("[data-epst-x]").forEach(function (b) { b.removeAttribute("data-epst-x"); });
        if (close && shown(el)) { var b = closer(el); if (b) try { b.click(); } catch (e) {} if (shown(el)) { if (el.classList.contains("lc-ov") || el.classList.contains("gr-w")) el.style.display = "none"; else el.remove(); } }
        el.classList.remove("epst-dock", "epst-dock-m"); }); ROOT = null; M.act = null; H.classList.remove("epst-docked"); hilite(); }
    function hilite() { acts.querySelectorAll(".epst-tb>button[data-a]").forEach(function (b) { b.classList.toggle("cur", !!M.act && b.title === M.act); }); }
    function dockSync() {
      var on = H.classList.contains("epst-on") && !NODOCK;
      if (on && M.cur !== "vue") Array.prototype.forEach.call(document.body.querySelectorAll(AUTO), function (el) { if (el.parentNode === document.body && !el.classList.contains("epst-dock") && big(el)) { el.classList.add("epst-dock"); if (!ROOT || !shown(ROOT)) ROOT = el; } });
      var D = docked(), V = D.filter(shown);
      if (!on) { if (D.length) undock(false); return; }
      if (ROOT && !shown(ROOT)) ROOT = null; if (!ROOT && V.length) ROOT = V[0];
      D.forEach(function (el) { if (!shown(el) && !el.matches(AUTO)) el.classList.remove("epst-dock", "epst-dock-m"); });
      H.classList.toggle("epst-docked", V.length > 0);
      if (!V.length) { if (M.act) { M.act = null; hilite(); } return; }
      if (window.scrollY > 0 && !barHidden) window.scrollTo(0, 0);
      dockTop();
      /* le bouton « ✕ Fermer » de l'écran rangé n'a plus lieu d'être ; un écran ouvert par-dessus (aperçu, détail) garde le sien */
      D.forEach(function (el) { var b = el === ROOT ? closer(el) : null; el.querySelectorAll("[data-epst-x]").forEach(function (x) { if (x !== b) x.removeAttribute("data-epst-x"); }); if (b && !b.hasAttribute("data-epst-x")) b.setAttribute("data-epst-x", ""); });
      /* onglets internes des fiches de leçon ↔ bouton du bandeau */
      if (ROOT && ROOT.classList.contains("lc-ov") && !ROOT.id) { var t = ROOT.querySelector(".lc-top button.on"), l = t ? t.textContent.replace(/^[^A-Za-zÀ-ÿ]+/, "").trim() : ""; if (l && l !== M.act && acts.querySelector('.epst-tb>button[title="' + l + '"]')) M.act = l; }
      hilite();
    }
    /* lance une action du bandeau / du menu / d'une carte : ce qu'elle ouvre se range sous le bandeau */
    function run(x) {
      if (NODOCK) { try { x.go(); } catch (e) { console.warn(e); } return; }
      undock(true); setHidden(false); try { window.scrollTo(0, 0); } catch (e) {}
      var before = screens();
      try { x.go(); } catch (e) { console.warn(e); }
      var look = function () { screens().forEach(function (el) { if (before.indexOf(el) < 0 && !el.classList.contains("epst-dock")) { dock(el); M.act = x.label; } }); dockSync(); };
      look(); [60, 250, 600, 1200, 2500].forEach(function (d) { setTimeout(look, d); });
    }
    var dq = 0; try { new MutationObserver(function () { if (dq) return; dq = 1; (window.requestAnimationFrame || setTimeout)(function () { dq = 0; if (H.classList.contains("epst-docked") || document.body.querySelector(AUTO)) dockSync(); }); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] }); } catch (e) {}
    setInterval(dockSync, 400); addEventListener("resize", dockSync);
    function mark(id) { M.cur = id; nav.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b.dataset.t === id); });
      /* raccourcis propres à l'onglet (ex. Séquence : leçon en cours, tablette de contrôle) */
      var A = (((C.tabs || {})[id] || {}).actions || []).concat(id === "seq" && window.EPSLC ? EPSLC.actions() : []).concat(id === "eval" && window.EPSLC && EPSLC.evalActions ? EPSLC.evalActions() : []).concat(id === "bil" && window.EPSLC && EPSLC.bilActions ? EPSLC.bilActions() : []) /* + leçons communes (eps-lecons.js) */
        .map(function (a, i) { return [a.ord != null ? a.ord : 1, i, a]; }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; }).map(function (x) { return x[2]; });
      /* console (mode de préparation) : pas d'action de leçon en direct tournée vers les élèves (planche à envoyer, signal) ; a.live = 1 pour en déclarer une */
      if (window.EPS_NOLIVE) A = A.filter(function (a) { return !a.live && !/^(Planche tactique|Signal|Message)/.test(a.label || ""); });
      document.documentElement.classList.toggle("epst-acts-on", A.length > 0);
      drawActs(A); }
    /* actions principales : les 4 communes les plus utilisées + celles que l'appli marque main:1 + celles épinglées ★ par l'enseignant (sur cette tablette) ;
       un onglet avec 5 actions ou moins les montre toutes. Le reste est dans « ⋯ Plus ». */
    var MAIN = /^(Fiches de leçon|Leçon en cours|Évaluer la leçon|Ma classe : vue d'ensemble)$/, PKB = "eps.acts.pin." + (C.app || location.pathname);
    function pins() { try { return JSON.parse(localStorage.getItem(PKB + "." + M.cur) || "null"); } catch (e) { return null; } }
    function short(l) { return String(l).replace(/\s*\(.*\)\s*$/, "").replace(/ : vue d'ensemble$/, "").replace(/^Tableau de bord de la leçon$/, "Tableau de bord"); }
    function drawActs(A) {
      var P = pins(), isMain = function (x) { return P ? P.indexOf(x.label) >= 0 : (x.main || MAIN.test(x.label)); };
      var top = A.length <= 5 ? A : A.filter(isMain), rest = A.length <= 5 ? [] : A.filter(function (x) { return !isMain(x); });
      if (!top.length) { top = A.slice(0, 4); rest = A.slice(4); }
      acts.innerHTML = '<div class="epst-tb">' + top.map(function (x) { return '<button type="button" data-a="' + A.indexOf(x) + '" title="' + esc(x.label) + '"><i>' + (x.ico || "•") + "</i>" + esc(short(x.label)) + "</button>"; }).join("") +
        (rest.length || A.length > 5 ? '<button type="button" class="more" data-more aria-haspopup="true" title="Autres actions"><i>⋯</i>Plus' + (rest.length ? " (" + rest.length + ")" : "") + "</button>" : "") + "</div>";
      acts.querySelectorAll("[data-a]").forEach(function (b) { b.onclick = function () { run(A[+b.dataset.a]); }; }); hilite();
      var mb = acts.querySelector("[data-more]"); if (mb) mb.onclick = function (e) { e.stopPropagation(); menu(mb, A, isMain); }; }
    function menu(mb, A, isMain) {
      var old = document.querySelector(".epst-mn"); if (old) { old.remove(); mb.classList.remove("open"); return; }
      var m = document.createElement("div"); m.className = "epst-mn"; m.setAttribute("role", "menu");
      var row = function (x) { var on = isMain(x); return '<div class="r"><button type="button" data-g="' + A.indexOf(x) + '"><i>' + (x.ico || "•") + "</i>" + esc(x.label) + '</button><button type="button" class="pin' + (on ? " on" : "") + '" data-pin="' + A.indexOf(x) + '" title="' + (on ? "Retirer de la barre" : "Mettre dans la barre") + '" aria-label="' + (on ? "Retirer de la barre" : "Mettre dans la barre") + '">' + (on ? "★" : "☆") + "</button></div>"; };
      var rest = A.filter(function (x) { return !isMain(x); }), top = A.filter(isMain);
      m.innerHTML = (rest.length ? '<div class="h">Autres actions</div>' + rest.map(row).join("") : "") + '<div class="h">Dans la barre (★ pour retirer)</div>' + top.map(row).join("") +
        (pins() ? '<div class="r"><button type="button" data-reset style="color:#6A6F78;font-weight:600"><i>↺</i>Barre par défaut</button></div>' : "");
      document.body.appendChild(m); mb.classList.add("open");
      var r = mb.getBoundingClientRect(), w = m.offsetWidth; m.style.top = (r.bottom + scrollY + 6) + "px"; m.style.left = Math.max(8, Math.min(r.right + scrollX - w, innerWidth - w - 8)) + "px";
      var close = function () { m.remove(); mb.classList.remove("open"); document.removeEventListener("click", out, true); document.removeEventListener("keydown", key); };
      var out = function (e) { if (!m.contains(e.target) && e.target !== mb && !mb.contains(e.target)) close(); }, key = function (e) { if (e.key === "Escape") close(); };
      setTimeout(function () { document.addEventListener("click", out, true); document.addEventListener("keydown", key); }, 0);
      m.querySelectorAll("[data-g]").forEach(function (b) { b.onclick = function () { close(); run(A[+b.dataset.g]); }; });
      m.querySelectorAll("[data-pin]").forEach(function (b) { b.onclick = function () { var x = A[+b.dataset.pin], P = pins() || A.filter(isMain).map(function (y) { return y.label; }), i = P.indexOf(x.label);
        if (i >= 0) P.splice(i, 1); else P.push(x.label); try { localStorage.setItem(PKB + "." + M.cur, JSON.stringify(P)); } catch (e) {} close(); drawActs(A); menu(acts.querySelector("[data-more]"), A, function (y) { return P.indexOf(y.label) >= 0; }); }; });
      var rs = m.querySelector("[data-reset]"); if (rs) rs.onclick = function () { try { localStorage.removeItem(PKB + "." + M.cur); } catch (e) {} close(); drawActs(A); }; }
    function panel(html) { document.documentElement.classList.add("epst-pan"); mains(false); pan.innerHTML = html; window.scrollTo(0, 0); return pan; }
    function closePanel() { document.documentElement.classList.remove("epst-pan"); mains(true); pan.innerHTML = ""; }
    function cards(L) { return '<div class="epst-grid">' + L.map(function (x, i) { return '<button type="button" class="epst-card" data-i="' + i + '"><i>' + (x.ico || "•") + "</i><span><b>" + esc(x.label) + "</b>" + (x.sub ? "<small>" + esc(x.sub) + "</small>" : "") + "</span></button>"; }).join("") + "</div>"; }
    function bindCards(root, L, keepTab) { root.querySelectorAll(".epst-card[data-i]").forEach(function (b) { b.onclick = function () { var x = L[+b.dataset.i]; closePanel(); mark(keepTab); run(x); }; }); }
    /* 🎛 page commune des paramètres déclarés par l'appli (EPSP.p, eps-lists.js) */
    function params() {
      var D = EPSP.defs, secs = [], K = "eps.param.v1";
      D.forEach(function (d) { var x = d.sec || "Général"; if (secs.indexOf(x) < 0) secs.push(x); });
      var cur = function (d) { return EPSP.get(d.id, d.def); }, txt = function (v) { return Array.isArray(v) ? v.join("\n") : String(v == null ? "" : v); };
      var h = "<h2>🎛 Paramètres de " + esc(C.nom) + '</h2><p class="mut">Tout ce qui est modifiable dans l\'appli. Listes : un élément par ligne. Les changements valent sur toutes tes tablettes.</p>' +
        secs.map(function (x) { return '<details class="epst-sec" open><summary style="font:800 17px system-ui;margin:12px 0 6px;cursor:pointer">' + esc(x) + "</summary>" + D.filter(function (d) { return (d.sec || "Général") === x; }).map(function (d) {
          var v = cur(d), mod = JSON.stringify(v) !== JSON.stringify(d.def);
          return '<div style="background:#fff;border:1px solid #E6E1D6;border-radius:14px;padding:10px 12px;margin:0 0 8px"><div style="display:flex;gap:8px;align-items:center"><b style="flex:1">' + esc(d.label) + (mod ? ' <span style="color:#9A7400;font-size:12px">· modifié</span>' : "") + '</b><button type="button" data-def="' + esc(d.id) + '" style="height:32px;border-radius:10px;border:1.5px solid #E6E1D6;background:#fff;font-weight:700">↺ Défaut</button></div>' +
            (d.aide || d.fixed ? '<div class="mut" style="font-size:13px">' + esc(d.aide || "") + (d.fixed ? " (" + d.fixed + " lignes, dans cet ordre : renommer seulement)" : "") + "</div>" : "") +
            (d.type === "list" ? '<textarea data-p="' + esc(d.id) + '" rows="' + Math.min(10, Math.max(3, (v || []).length + 1)) + '" style="width:100%;box-sizing:border-box;margin-top:6px;border:2px solid #E6E1D6;border-radius:10px;padding:8px;font:15px/1.4 system-ui">' + esc(txt(v)) + "</textarea>"
              : '<input data-p="' + esc(d.id) + '"' + (d.type === "number" ? ' type="number" step="any"' : "") + ' value="' + esc(txt(v)) + '" style="width:100%;box-sizing:border-box;margin-top:6px;height:42px;border:2px solid #E6E1D6;border-radius:10px;padding:0 10px;font:15px system-ui">') + "</div>"; }).join("") + "</details>"; }).join("") +
        '<div style="display:flex;gap:8px;margin:12px 0"><button type="button" data-save style="height:46px;border-radius:12px;border:0;background:' + C.color + ';color:#fff;font:800 15px system-ui;padding:0 18px">💾 Enregistrer et appliquer</button></div><p class="mut" data-msg></p>';
      var el = panel(h), msg = el.querySelector("[data-msg]");
      function store(id, val) { var V; try { V = JSON.parse(localStorage.getItem(K) || "null"); } catch (e) {} V = V && V.items ? V : { items: {}, pend: {}, since: 0 }; V.pend = V.pend || {};
        var k = EPSP.app + "|" + id, o = V.items[k], u = Math.max(Date.now(), ((o && o.u) || 0) + 1); V.items[k] = val === null ? { id: k, del: 1, u: u } : { id: k, v: val, u: u }; V.pend[k] = u; localStorage.setItem(K, JSON.stringify(V)); }
      el.querySelectorAll("[data-def]").forEach(function (b) { b.onclick = function () { var d = D.filter(function (x) { return x.id === b.dataset.def; })[0], f = el.querySelector('[data-p="' + d.id + '"]'); f.value = txt(d.def); }; });
      el.querySelector("[data-save]").onclick = function () { var n = 0;
        D.forEach(function (d) { var f = el.querySelector('[data-p="' + d.id + '"]'); if (!f) return; var v = d.type === "list" ? f.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean) : d.type === "number" ? Number(String(f.value).trim().replace(",", ".")) : f.value;
          if (n < 0) return;
          if (d.type === "list" && d.fixed && v.length !== d.fixed) { msg.textContent = "⚠ « " + d.label + " » doit avoir " + d.fixed + " lignes."; n = -1; return; }
          if (d.type === "number" && (String(f.value).trim() === "" || !isFinite(v))) { msg.textContent = "⚠ « " + d.label + " » doit être un nombre."; n = -1; return; } /* champ vidé = 0 enregistré auparavant */
          if (n < 0) return; var same = JSON.stringify(v) === JSON.stringify(d.def), was = JSON.stringify(cur(d)) === JSON.stringify(v); if (was) return; store(d.id, same ? null : v); n++; });
        if (n < 0) return; if (!n) { msg.textContent = "Aucun changement."; return; }
        try { window.EPSD && EPSD.syncSoon && EPSD.syncSoon(); } catch (e) {} msg.textContent = "✓ Enregistré. L'appli se recharge…"; setTimeout(function () { location.reload(); }, 1200); };
    }
    function openVue() {
      var f = vue.querySelector("iframe"), top = nav.getBoundingClientRect().bottom;
      vue.style.top = Math.max(0, top) + "px";
      if (!f.getAttribute("src")) f.src = location.pathname + "?vue=eleve";
      document.documentElement.classList.add("epst-vue-on");
    }
    function closeVue() { document.documentElement.classList.remove("epst-vue-on"); }
    vue.querySelector(".h button").onclick = function () { closeVue(); go(M.prev || C.home || "seq"); };
    function suiviOn() { var o = window.epsCtlOwn; try { if (o && typeof o.on === "function") return !!o.on(); } catch (e) {} return false; }
    function go(id) {
      undock(true);
      if (id === "suivi") { /* l'écran de suivi de l'appli, ou le pilotage commun posé par-dessus */
        closeVue(); closePanel(); if (M.cur && M.cur !== "suivi" && M.cur !== "vue") M.back = M.cur; var cc = null; try { cc = window.epsCurrentClass && window.epsCurrentClass(); } catch (e) {}
        mark("suivi"); M.sv = Date.now();
        try { if (window.epsCtlOwn && typeof window.epsCtlOwn.open === "function") window.epsCtlOwn.open((cc && cc.nom) || ""); } catch (e) { console.warn(e); }
        return; }
      if (id !== "vue") { closeVue(); M.prev = id; }
      mark(id);
      var t = (C.tabs || {})[id];
      if (id === "vue") { openVue(); return; }
      if (id === "bib") { var BL = (window.EPSLC ? EPSLC.biblio() : []).concat(C.biblio || []); var p = panel("<h2>📚 Bibliothèque</h2><p class=\"mut\">Tes documents et tes leçons, puis les ressources et les écrans de l'appli, à consulter ou à montrer aux élèves.</p>" + cards(BL) + adaptHtml()); bindCards(p, BL, "bib"); bindAdapt(p); return; }
      if (id === "reg") {
        var R = [{ ico: "📖", label: "Fiche d'utilisation", sub: "Tout ce que permet " + C.nom + " et les fonctions communes", go: guide }]
          .concat(window.top === window && matchMedia("(min-width: 1000px)").matches ? [{ ico: "🖥", label: "Console ordinateur", sub: "Gérer " + C.nom + " en grand, avec 🤖 Claude à côté pour demander des réglages ou des modifications", go: function () { var m = location.pathname.match(/eps-autonomie-numerique\/([a-z0-9-]+)\//); location.href = "../console/#app:" + (m ? m[1] : ""); } }] : [])
          .concat(window.EPSP && EPSP.defs.length ? [{ ico: "🎛", label: "Paramètres de l'appli", sub: "Toutes les valeurs et listes modifiables de " + C.nom + " (" + EPSP.defs.length + ")", go: params }] : []).concat(C.reglages || []).concat([{ ico: "🏫", label: "Réglages communs", sub: "Établissement, enseignant, listes d'élèves, activités des classes, partage entre tablettes", go: function () { try { EPSR.open(); } catch (e) {} } }]);
        var q = panel("<h2>⚙ Réglages</h2><p class=\"mut\">Réglages de " + esc(C.nom) + " et réglages communs à toutes les applis.</p>" + cards(R)); bindCards(q, R, "reg"); return;
      }
      if (id === "ccf") { var cp = panel(window.EPSLC ? "" : '<p class="mut">Chargement…</p>'); if (!window.EPSLC) { setTimeout(function () { if (M.cur === "ccf") go("ccf"); }, 1200); return; } try { EPSLC.ccfPanel(cp); } catch (e) { console.warn(e); } return; }
      if (t && t.panel) { var el = panel(""); try { t.panel(el); } catch (e) { console.warn(e); } return; }
      closePanel(); if (t && t.go) try { t.go(); } catch (e) { console.warn(e); }
    }
    nav.addEventListener("click", function (e) { var b = e.target.closest("button[data-t]"); if (b) go(b.dataset.t); });
    var was = null;
    function tick() {
      place();
      var on = false; try { on = !!C.isTeacher(); } catch (e) {}
      document.documentElement.classList.toggle("epst-on", on);
      if (on && !was) { if (!M.cur) go(C.home || "seq"); }
      if (!on && was) { closePanel(); closeVue(); M.cur = null; }
      was = on;
      if (on && !barHidden) setHidden(false); else if (!on && barHidden) { barHidden = false; var sb = stickyBar(); if (sb) sb.style.top = ""; }
      if (on && window.EPSLC && !M.lc) { M.lc = 1; if (M.cur && M.cur !== "vue") mark(M.cur); } /* leçons chargées après coup : raccourcis ajoutés */
      if (on && !document.documentElement.classList.contains("epst-pan") && M.cur !== "vue") { /* onglet actif suivant l'écran affiché par l'appli */
        var T = C.tabs || {}, k = Object.keys(T).filter(function (id) { return T[id].on && (function () { try { return T[id].on(); } catch (e) { return false; } })(); })[0];
        /* 📡 Suivi : actif tant que l'écran de suivi est affiché (il l'emporte sur l'onglet qui portait cet écran) ; refermé, on revient à l'onglet d'avant */
        var sb0 = nav.querySelector('[data-t="suivi"]'); if (sb0) sb0.style.display = window.epsCtlOwn ? "" : "none";
        if (sb0 && window.epsCtlOwn) { if (suiviOn()) k = "suivi"; else if (M.cur === "suivi" && Date.now() - (M.sv || 0) > 1500) k = k || M.back || "seq"; else if (M.cur === "suivi") k = "suivi"; }
        if (k && k !== M.cur && !(M.cur === "bib" || M.cur === "reg")) mark(k);
      }
    }
    /* ✨ Adapter une consigne (Claude) : simplifiée pour un élève dys, ou traduite pour un élève allophone.
       Rien n'est montré à l'élève sans que l'enseignant ait relu (texte modifiable, puis « Afficher en grand »). */
    var LANGS = ["anglais", "espagnol", "portugais", "italien", "allemand", "arabe", "turc", "roumain", "ukrainien", "russe", "chinois", "albanais"];
    function adaptHtml() {
      return '<div class="epst-adapt" style="background:#fff;border:1px solid #E6E1D6;border-radius:16px;padding:14px 16px;margin-top:6px"><h3 style="margin:0 0 4px;font-size:18px">✨ Adapter une consigne</h3>' +
        '<p class="mut">Colle ou dicte une consigne : Claude propose une version simplifiée (élève dys) ou traduite (élève allophone). Tu relis et corriges avant de la montrer.</p>' +
        '<textarea id="epst-src" rows="4" style="width:100%;box-sizing:border-box;border:2px solid #E6E1D6;border-radius:12px;padding:10px;font:15px system-ui,sans-serif" placeholder="Ex. : Par deux, un grimpeur et un assureur…"></textarea>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0"><button type="button" class="epst-b" data-ad="simple">✨ Simplifier (dys)</button><button type="button" class="epst-b" data-ad="trad">🌍 Traduire en</button><select id="epst-lang" style="height:40px;border-radius:10px;border:2px solid #E6E1D6;padding:0 8px">' + LANGS.map(function (l) { return "<option>" + l + "</option>"; }).join("") + '</select><span id="epst-msg" class="mut" style="margin:0"></span></div>' +
        '<textarea id="epst-out" rows="6" style="width:100%;box-sizing:border-box;border:2px solid var(--epst,#666);border-radius:12px;padding:10px;font:16px/1.5 system-ui,sans-serif;display:none"></textarea>' +
        '<div id="epst-ok" style="display:none;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="epst-b" data-ad="show">📺 Afficher en grand (relu ✓)</button><button type="button" class="epst-b" data-ad="copy">📋 Copier</button></div></div>';
    }
    function bindAdapt(root) {
      var src = root.querySelector("#epst-src"), out = root.querySelector("#epst-out"), msg = root.querySelector("#epst-msg"), ok = root.querySelector("#epst-ok");
      root.querySelectorAll("[data-ad]").forEach(function (b) { b.onclick = function () {
        var m = b.dataset.ad;
        if (m === "copy") { try { navigator.clipboard.writeText(out.value); msg.textContent = "Copié."; } catch (e) {} return; }
        if (m === "show") { var v = document.createElement("div"); v.style.cssText = "position:fixed;inset:0;z-index:2147483400;background:#fff;color:#14171C;padding:40px 6vw;overflow:auto;font:700 clamp(22px,3.4vw,40px)/1.5 system-ui,sans-serif;white-space:pre-wrap";
          v.textContent = out.value; var x = document.createElement("button"); x.textContent = "✕ Fermer"; x.style.cssText = "position:fixed;top:14px;right:14px;height:44px;border-radius:12px;border:2px solid #ccc;background:#fff;font:800 16px system-ui"; x.onclick = function () { v.remove(); }; v.appendChild(x); document.body.appendChild(v); return; }
        if (!src.value.trim()) { msg.textContent = "Écris d'abord la consigne."; return; }
        if (!window.EPSD || !EPSD.reformuler) { msg.textContent = "Indisponible."; return; }
        b.disabled = true; msg.textContent = "Claude adapte la consigne…";
        EPSD.reformuler(src.value, { mode: m, lang: root.querySelector("#epst-lang").value, act: C.nom }).then(function (t) { out.value = t; out.style.display = ""; ok.style.display = "flex"; msg.textContent = "✓ Proposition : relis-la et corrige-la si besoin."; })
          .catch(function (e) { msg.textContent = "⚠ " + (e && e.message || e); }).then(function () { b.disabled = false; });
      }; });
    }
    /* 📖 Fiche d'utilisation (eps-guides.js) */
    function guide() {
      var show = function () {
        var G = window.EPS_GUIDES || {}, A = G[C.app] || { nom: C.nom, items: [] }, sec = function (t, L) { return "<h3 style=\"margin:18px 0 8px;font-size:18px\">" + t + "</h3>" + L.map(function (x) { return '<div style="background:#fff;border:1px solid #E6E1D6;border-radius:12px;padding:10px 14px;margin:0 0 8px"><b>' + esc(x[0]) + '</b><div style="margin-top:3px;line-height:1.45">' + esc(x[1]) + "</div></div>"; }).join(""); };
        var p = panel('<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><h2 style="flex:1">📖 Fiche d\'utilisation · ' + esc(A.nom) + '</h2><button type="button" class="epst-b" id="epst-gb">← Retour</button><button type="button" class="epst-b" id="epst-gp">🖨 Imprimer</button></div>' +
          sec("Dans " + esc(A.nom), A.items || []) + sec("Commun à toutes les applis", G.commun || []));
        mark("reg"); p.querySelector("#epst-gb").onclick = function () { go("reg"); }; p.querySelector("#epst-gp").onclick = function () { window.print(); };
      };
      if (window.EPS_GUIDES) show(); else { var sc = document.createElement("script"); sc.src = BASE + "eps-guides.js"; sc.onload = show; document.head.appendChild(sc); }
    }
    M.go = go; M.closePanel = closePanel; M.tick = tick; M.mark = mark;
    if (document.body) tick(); else document.addEventListener("DOMContentLoaded", tick);
    setInterval(tick, 700);
    return M;
  }
  /* Vue élève seule (appli qui garde sa propre organisation, ex. OrienRun) */
  function openVue(color) {
    css(); var v = document.getElementById("epst-vue1");
    if (!v) { v = document.createElement("div"); v.id = "epst-vue1"; v.className = "epst-vue"; v.style.top = "0";
      v.innerHTML = '<div class="h">👁 Vue élève · tes vraies données, tu restes en mode enseignant.<button type="button">✕ Fermer</button></div><iframe title="Vue élève"></iframe>';
      v.querySelector("button").onclick = function () { v.style.display = "none"; }; document.body.appendChild(v); }
    v.querySelector("iframe").src = location.pathname + "?vue=eleve"; v.style.display = "flex";
  }
  window.EPST = { init: init, vueEleve: VUE, openVue: openVue };
})();
