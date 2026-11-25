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
  var ORDER = [["seq", "📅", "Séquence"], ["vue", "👁", "Vue élève"], ["bib", "📚", "Bibliothèque"], ["eval", "📋", "Évaluation"], ["cls", "👥", "Classe"], ["bil", "📄", "Bilans"], ["reg", "⚙", "Réglages"]];
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
      "html.epst-on.epst-acts-on:not(.epst-pan) .epst-acts{display:flex}",
      ".epst-acts button{height:42px;border-radius:12px;border:2px solid var(--epst,#666);background:#fff;color:#14171C;font:800 14px system-ui,sans-serif;padding:0 14px;cursor:pointer}",
      ".epst-panel{display:none;max-width:1100px;margin:0 auto;padding:18px 18px 60px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#14171C}",
      "html.epst-pan .epst-panel{display:block}",
      ".epst-panel h2{font-size:22px;margin:0 0 4px}.epst-panel .mut{color:#6A6F78;font-size:14px;margin:0 0 14px}",
      ".epst-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin:0 0 18px}",
      ".epst-card{display:flex;gap:12px;align-items:center;text-align:left;background:#fff;border:1px solid #E6E1D6;border-left:5px solid var(--epst,#666);border-radius:14px;padding:14px;font:inherit;color:inherit;cursor:pointer;min-height:76px}",
      ".epst-card:active{transform:scale(.99)}.epst-card i{font-style:normal;font-size:26px;flex:none}.epst-card b{display:block;font-size:16px}.epst-card small{display:block;color:#6A6F78;font-size:13px;margin-top:2px}",
      ".epst-b{height:40px;border-radius:10px;border:2px solid var(--epst,#666);background:#fff;color:#14171C;font:800 14px system-ui,sans-serif;padding:0 14px;cursor:pointer}.epst-b:disabled{opacity:.5}",
      "@media print{html.epst-pan body>*:not(.epst-panel){display:none!important}html.epst-pan .epst-panel{display:block!important;padding:0}.epst-panel button{display:none!important}}",
      ".epst-vue{position:fixed;left:0;right:0;bottom:0;z-index:2147481500;background:#F5F3EE;display:none;flex-direction:column}",
      "html.epst-vue-on .epst-vue{display:flex}",
      ".epst-vue .h{display:flex;align-items:center;gap:10px;padding:8px 14px;background:#FFF6E0;border-bottom:1px solid #F0D58A;font:600 14px system-ui,sans-serif;color:#6b4e00}",
      ".epst-vue .h button{margin-left:auto;height:36px;border-radius:10px;border:1.5px solid #D8C27A;background:#fff;font:700 14px system-ui,sans-serif;padding:0 12px;cursor:pointer}",
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
    vue.innerHTML = '<div class="h">👁 Vue élève : l\'appli telle que la voit un élève (avec tes vraies données). Tu restes en mode enseignant.<button type="button">✕ Revenir à l\'espace enseignant</button></div><iframe title="Vue élève"></iframe>';
    var tabs = ORDER.filter(function (t) { return t[0] === "vue" || t[0] === "bib" || t[0] === "reg" || (C.tabs && C.tabs[t[0]]); });
    nav.innerHTML = tabs.map(function (t) { return '<button type="button" data-t="' + t[0] + '"><span>' + t[1] + "</span>" + t[2] + "</button>"; }).join("");
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
    function mark(id) { M.cur = id; nav.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", b.dataset.t === id); });
      /* raccourcis propres à l'onglet (ex. Séquence : leçon en cours, tablette de contrôle) */
      var A = (((C.tabs || {})[id] || {}).actions || []).concat(id === "seq" && window.EPSLC ? EPSLC.actions() : []) /* + leçons communes (eps-lecons.js) */
        .map(function (a, i) { return [a.ord != null ? a.ord : 1, i, a]; }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; }).map(function (x) { return x[2]; });
      document.documentElement.classList.toggle("epst-acts-on", A.length > 0);
      acts.innerHTML = A.map(function (x, i) { return '<button type="button" data-a="' + i + '">' + (x.ico ? x.ico + " " : "") + esc(x.label) + "</button>"; }).join("");
      acts.querySelectorAll("[data-a]").forEach(function (b) { b.onclick = function () { try { A[+b.dataset.a].go(); } catch (e) { console.warn(e); } }; }); }
    function panel(html) { document.documentElement.classList.add("epst-pan"); mains(false); pan.innerHTML = html; window.scrollTo(0, 0); return pan; }
    function closePanel() { document.documentElement.classList.remove("epst-pan"); mains(true); pan.innerHTML = ""; }
    function cards(L) { return '<div class="epst-grid">' + L.map(function (x, i) { return '<button type="button" class="epst-card" data-i="' + i + '"><i>' + (x.ico || "•") + "</i><span><b>" + esc(x.label) + "</b>" + (x.sub ? "<small>" + esc(x.sub) + "</small>" : "") + "</span></button>"; }).join("") + "</div>"; }
    function bindCards(root, L, keepTab) { root.querySelectorAll(".epst-card[data-i]").forEach(function (b) { b.onclick = function () { var x = L[+b.dataset.i]; closePanel(); mark(keepTab); try { x.go(); } catch (e) { console.warn(e); } }; }); }
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
        D.forEach(function (d) { var f = el.querySelector('[data-p="' + d.id + '"]'); if (!f) return; var v = d.type === "list" ? f.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean) : d.type === "number" ? Number(f.value) : f.value;
          if (d.type === "list" && d.fixed && v.length !== d.fixed) { msg.textContent = "⚠ « " + d.label + " » doit avoir " + d.fixed + " lignes."; n = -1; return; }
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
    function go(id) {
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
        var p = panel('<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><h2 style="flex:1">📖 Fiche d\'utilisation · ' + esc(A.nom) + '</h2><button type="button" class="epst-b" id="epst-gb">← Réglages</button><button type="button" class="epst-b" id="epst-gp">🖨 Imprimer</button></div>' +
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
      v.innerHTML = '<div class="h">👁 Vue élève : l\'appli telle que la voit un élève (avec tes vraies données). Tu restes en mode enseignant.<button type="button">✕ Revenir à l\'espace enseignant</button></div><iframe title="Vue élève"></iframe>';
      v.querySelector("button").onclick = function () { v.style.display = "none"; }; document.body.appendChild(v); }
    v.querySelector("iframe").src = location.pathname + "?vue=eleve"; v.style.display = "flex";
  }
  window.EPST = { init: init, vueEleve: VUE, openVue: openVue };
})();
