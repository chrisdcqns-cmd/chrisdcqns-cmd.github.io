/* 🧩 Niveaux & groupes (commun à toutes les applis d'activité et à la console ordinateur) — EPSGR
   - 📶 Classement : niveau 1 à 4 de chaque élève par activité, posé à la main (glisser ou toucher) ou proposé d'après les données
     (évaluations, évaluations de leçon, résultats aux situations, classement propre à l'appli : ATP en Badminton…).
   - 🤝 Affinités : élèves souvent ensemble d'après l'historique des groupes (groupes du jour, groupes formés dans les applis),
     contraintes de l'enseignant « toujours ensemble » / « à séparer » (par classe, valables dans toutes les activités).
   - 👥 Groupes : de niveau, mélangés (équilibrés), par affinités, « casser les habitudes », au hasard ; contraintes respectées ;
     échanges à la main ; « 📡 En faire les groupes du jour » → repris par la leçon en cours et par les applis (epsGroupesJour).
   Données (synchronisées par eps-home.js) : eps.niv.v1 (« nv| » : classement et contraintes), eps.grphist.v1 (« gh| » : historique,
   écrit par epsGroupesLog d'eps-lists.js). Cache local eps.nivauto.v1 : niveaux calculés par une appli ouverte (pour la console).
   Enseignant seulement ; aucun nom d'élève n'est envoyé à Claude. */
(function () {
  if (window.EPSGR) return;
  var DIRS = { escalade: ["esc", "Escalade", "#2E7D4F"], relais: ["rel", "Relais Vitesse", "#D9481F"], volley: ["vol", "Volley-ball", "#6B3FA0"], badminton: ["bad", "Badminton", "#0B7A75"], danse: ["dan", "Danse", "#C2185B"], acrosport: ["acro", "Acrosport", "#1F4FA3"], orientation: ["ori", "OrienRun", "#E8701A"], crosstraining: ["ct", "Cross-training", "#4D7C0F"], basket: ["bk", "Basket-ball", "#A4161A"], step: ["step", "Step", "#A21CAF"] };
  var EVK = { escalade: "eps.eval.esc.v1", acrosport: "eps.eval.acro.v1", orientation: "eps.eval.ori.v1", crosstraining: "eps.eval.ct.v1", basket: "eps.eval.bk.v1", step: "eps.eval.step.v1", volley: "eps_volley_eval_v1", badminton: "eps_badminton_v1", danse: "danse-eps-v1" };
  var KN = "eps.niv.v1", KH = "eps.grphist.v1", KA = "eps.nivauto.v1";
  var NIV = ["", "1 · à consolider", "2 · en progrès", "3 · à l'aise", "4 · expert"], NCOL = ["#B8BDC6", "#E57373", "#F0A04B", "#7CB342", "#2E7D4F"];
  var MODES = [["niveau", "Groupes de niveau", "Élèves de niveau proche ensemble (travail adapté, poules de niveau en opposition)."],
    ["melange", "Niveaux mélangés", "Groupes ou équipes équilibrés : chaque groupe a des forts et des moins forts (matchs équilibrés, tutorat)."],
    ["affinite", "Par affinités", "Les élèves souvent ensemble restent ensemble, groupes équilibrés en niveau."],
    ["casser", "Casser les habitudes", "Sépare les élèves toujours ensemble, groupes équilibrés en niveau."],
    ["hasard", "Au hasard", "Tirage au sort (tes contraintes restent respectées)."]];

  /* ---------- outils ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function ld(k) { var v = jget(k, null); if (!v || !v.items) v = { items: {}, pend: {}, since: 0 }; v.pend = v.pend || {}; return v; }
  function put(k, it) { var V = ld(k), old = V.items[it.id]; it.u = Math.max(Date.now(), ((old && old.u) || 0) + 1); V.items[it.id] = it; V.pend[it.id] = it.u; try { localStorage.setItem(k, JSON.stringify(V)); } catch (e) {} try { window.EPSD && EPSD.syncSoon && EPSD.syncSoon(); } catch (e) {} }
  function all(k) { var V = ld(k); return Object.keys(V.items).map(function (i) { return V.items[i]; }).filter(function (o) { return o && !o.del; }); }
  function nn(s) { return (window.EPSL ? EPSL.norm(s) : String(s || "").toLowerCase()).replace(/\s+/g, ""); }
  function ek(full) { return String(full || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean).sort().join(" "); }
  function pk(a, b) { a = ek(a); b = ek(b); return a < b ? a + "|" + b : b + "|" + a; }
  function day() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function shuffle(A) { for (var i = A.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = A[i]; A[i] = A[j]; A[j] = t; } return A; }
  function prenom(full) { var w = String(full || "").split(" "); return w.length > 1 && w[0] === w[0].toUpperCase() && /[A-Z]/.test(w[0]) ? w.slice(1).join(" ") + " " + w[0].charAt(0) + "." : full; }

  /* ---------- classes, élèves, présents ---------- */
  function classes(dir) { var c = DIRS[dir] && DIRS[dir][0]; try { return (window.EPSL ? EPSL.items() : []).filter(function (o) { return !c || (o.off || []).indexOf(c) < 0; }).map(function (o) { return o.nom; }).sort(function (a, b) { return a.localeCompare(b, "fr", { numeric: true }); }); } catch (e) { return []; } }
  function roster(cls) { var R = []; try { (window.EPSL ? EPSL.items() : []).forEach(function (o) { if (nn(o.nom) === nn(cls)) R = EPSL.people(o).map(function (p) { return p.full; }); }); } catch (e) {}
    if (!R.length) try { var c = window.epsCurrentClass && epsCurrentClass(); if (c && nn(c.nom) === nn(cls)) R = (c.eleves || []).slice(); } catch (e) {}
    return R; }
  function absent(cls, n) { try { return !!(window.epsAbsJour && epsAbsJour(n, cls)); } catch (e) { return false; } }
  function dispense(cls, n) { try { return !!(window.EPSD && EPSD.appel && EPSD.appel.dispense(cls, n)); } catch (e) { return false; } }
  function pratiquants(cls) { return roster(cls).filter(function (n) { return !absent(cls, n) && !dispense(cls, n); }); }

  /* ---------- niveaux ---------- */
  function manItem(dir, cls) { return ld(KN).items[dir + "|" + nn(cls)] || null; }
  function manual(dir, cls) { var o = manItem(dir, cls); return (o && !o.del && o.lv) || {}; }
  function setManual(dir, cls, lv) { put(KN, { id: dir + "|" + nn(cls), app: dir, cls: cls, lv: lv }); }
  function degOf(x) { if (x == null || x === "") return null; if (typeof x === "number") return x >= 1 && x <= 4 ? x : null; if (typeof x === "object") { var d = x.d != null ? x.d : x.deg != null ? x.deg : x.n; return typeof d === "number" && d >= 1 && d <= 4 ? d + (typeof x.pos === "number" ? Math.max(0, Math.min(1, x.pos)) * 0.99 - 0.5 : 0) : null; } var n = parseFloat(x); return n >= 1 && n <= 4 ? n : null; }
  /* score 0..1 par élève d'après les données : {clé:{s, src:[…]}} */
  function auto(dir, cls) {
    var R = roster(cls), S = {}, add = function (full, s, src, w) { if (s == null || isNaN(s)) return; var k = ek(full), o = S[k] || (S[k] = { t: 0, w: 0, src: [] }); o.t += s * (w || 1); o.w += (w || 1); if (src) o.src.push(src); };
    /* 1. classement propre à l'appli (ex. ATP) : appli ouverte, sinon dernier calcul gardé sur l'appareil */
    var H = null; try { if (typeof window.epsNiveaux === "function" && location.pathname.indexOf("/" + dir + "/") >= 0) { H = window.epsNiveaux(cls); var C = jget(KA, {}); C[dir + "|" + nn(cls)] = { at: Date.now(), L: H }; localStorage.setItem(KA, JSON.stringify(C)); } } catch (e) {}
    if (!H) { var C2 = jget(KA, {})[dir + "|" + nn(cls)]; H = C2 && C2.L; }
    (H || []).forEach(function (x) { add(x.full, x.s, x.t, 2); });
    /* 2. évaluations (degrés 1 à 4) */
    try { var EV = jget(EVK[dir], null);
      if (EV && EV.items) Object.keys(EV.items).forEach(function (id) { var r = EV.items[id]; if (!r || id === "cfg" || (r.c && nn(r.c) !== nn(cls)) || !r.ev) return; var D = Object.keys(r.ev).map(function (q) { return degOf(r.ev[q]); }).filter(function (x) { return x != null; }); if (D.length) add((r.p || "") + " " + (r.n || ""), (D.reduce(function (a, b) { return a + b; }, 0) / D.length - 1) / 3, "évaluation", 1.5); });
      else if (EV && EV.classes) EV.classes.forEach(function (c) { if (nn(c.nom || c.name) !== nn(cls)) return; (c.eleves || []).forEach(function (e) { if (!e.ev) return; var D = Object.keys(e.ev).map(function (q) { return degOf(e.ev[q]); }).filter(function (x) { return x != null; }); if (D.length) add((e.prenom || "") + " " + (e.nom || ""), (D.reduce(function (a, b) { return a + b; }, 0) / D.length - 1) / 3, "évaluation", 1.5); }); });
    } catch (e) {}
    /* 3. évaluations de leçon (0 à 3) et 4. résultats aux situations (0 à 2) */
    try { var LE = {}; all("eps.leceval." + dir + ".v1").forEach(function (o) { if (nn(o.cls) !== nn(cls)) return; Object.keys(o.el || {}).forEach(function (k) { var x = o.el[k]; ["p", "s", "t"].forEach(function (q) { if (x && x[q] != null) (LE[k] = LE[k] || []).push(+x[q] / 3); }); }); });
      R.forEach(function (n) { var L = LE[ek(n)]; if (L && L.length) add(n, L.reduce(function (a, b) { return a + b; }, 0) / L.length, "leçons évaluées", 1); }); } catch (e) {}
    try { var LR = {}; all("eps.lecres." + dir + ".v1").forEach(function (o) { if (!o.id || o.id.indexOf("|") < 0) return; var p = String(o.id).split("|"); if (nn(p[0]) !== nn(cls) && nn(o.cls) !== nn(cls)) return; var k = p[2] || o.k; Object.keys(o.r || {}).forEach(function (q) { (LR[k] = LR[k] || []).push(+o.r[q] / 2); }); });
      R.forEach(function (n) { var L = LR[ek(n)]; if (L && L.length >= 2) add(n, L.reduce(function (a, b) { return a + b; }, 0) / L.length, "situations réussies", 0.7); }); } catch (e) {}
    var out = {}; Object.keys(S).forEach(function (k) { out[k] = { s: S[k].t / S[k].w, src: S[k].src }; }); return out;
  }
  function s2lv(s) { return s == null ? 0 : s < 0.3 ? 1 : s < 0.55 ? 2 : s < 0.8 ? 3 : 4; }
  /* niveau final 1..4 (0 = inconnu) et valeur fine pour trier */
  function levels(dir, cls, names) { var M = manual(dir, cls), A = auto(dir, cls), out = {};
    (names || roster(cls)).forEach(function (n) { var k = ek(n), m = +M[k] || 0, a = A[k]; out[k] = { lv: m || s2lv(a && a.s), man: !!m, s: a ? a.s : null, src: a ? a.src : [], v: m ? m + (a ? (a.s - 0.5) * 0.4 : 0) : a ? 1 + a.s * 3 : 0 }; });
    return out; }

  /* ---------- affinités ---------- */
  function affItem(cls) { var o = ld(KN).items["aff|" + nn(cls)]; return o && !o.del ? o : { id: "aff|" + nn(cls), cls: cls, ens: [], sep: [] }; }
  function setAff(cls, o) { o.id = "aff|" + nn(cls); o.cls = cls; put(KN, o); }
  function hist(cls) { return all(KH).filter(function (h) { return nn(h.cls) === nn(cls) && h.g && h.g.length; }).sort(function (a, b) { return (a.at || 0) - (b.at || 0); }); }
  /* paires : ensemble / présents tous les deux dans la même répartition */
  function pairs(cls) { var P = {}, H = hist(cls);
    H.forEach(function (h) { var inSet = {}, grpOf = {}; h.g.forEach(function (g, gi) { g.forEach(function (n) { var k = ek(n); inSet[k] = n; grpOf[k] = gi; }); });
      var K = Object.keys(inSet); for (var i = 0; i < K.length; i++) for (var j = i + 1; j < K.length; j++) { var p = K[i] < K[j] ? K[i] + "|" + K[j] : K[j] + "|" + K[i], o = P[p] || (P[p] = { a: inSet[K[i]], b: inSet[K[j]], n: 0, t: 0 }); o.n++; if (grpOf[K[i]] === grpOf[K[j]]) o.t++; } });
    return { P: P, nH: H.length }; }
  function frequent(cls, min) { var X = pairs(cls), L = []; Object.keys(X.P).forEach(function (p) { var o = X.P[p]; if (o.t >= (min || 3) && o.t / o.n >= 0.6) L.push(o); }); return L.sort(function (a, b) { return b.t / b.n - a.t / a.n || b.t - a.t; }); }

  /* ---------- formation des groupes ---------- */
  function make(o) {
    var names = (o.names || pratiquants(o.cls)).slice(), n = Math.max(1, Math.min(o.n || 4, names.length || 1)), mode = o.mode || "melange";
    var LV = levels(o.dir, o.cls, names), A = o.contraintes === false ? { ens: [], sep: [] } : affItem(o.cls), X = pairs(o.cls).P;
    var val = function (nm) { var x = LV[ek(nm)]; return x && x.v ? x.v : 2.5; }, known = names.some(function (nm) { var x = LV[ek(nm)]; return x && x.v; });
    var ENS = {}, SEP = {}; (A.ens || []).forEach(function (p) { ENS[p[0] < p[1] ? p[0] + "|" + p[1] : p[1] + "|" + p[0]] = 1; }); (A.sep || []).forEach(function (p) { SEP[p[0] < p[1] ? p[0] + "|" + p[1] : p[1] + "|" + p[0]] = 1; });
    var FR = {}; Object.keys(X).forEach(function (p) { if (X[p].n >= 2) FR[p] = X[p].t / X[p].n; });
    /* placement de départ */
    var G = [], i; for (i = 0; i < n; i++) G.push([]);
    var P = shuffle(names.slice());
    if (mode !== "hasard" && known) { P.sort(function (a, b) { return val(b) - val(a); });
      if (mode === "niveau") { var per = Math.ceil(P.length / n); P.forEach(function (x, i) { G[Math.min(n - 1, Math.floor(i / per))].push(x); }); }
      else P.forEach(function (x, i) { var row = Math.floor(i / n), c = i % n; G[row % 2 ? n - 1 - c : c].push(x); }); }
    else P.forEach(function (x, i) { G[i % n].push(x); });
    /* coût d'une répartition */
    function mean(g) { return g.length ? g.reduce(function (a, x) { return a + val(x); }, 0) / g.length : 0; }
    function cost(G) { var c = 0, M = G.map(mean), gm = M.reduce(function (a, b) { return a + b; }, 0) / M.length;
      G.forEach(function (g, gi) { for (var a = 0; a < g.length; a++) for (var b = a + 1; b < g.length; b++) { var p = pk(g[a], g[b]); if (SEP[p]) c += 100; if (mode === "affinite" && FR[p]) c -= 3 * FR[p]; if (mode === "casser" && FR[p]) c += 4 * FR[p]; }
        if (mode === "niveau" && known) g.forEach(function (x) { c += Math.pow(val(x) - M[gi], 2); }); });
      Object.keys(ENS).forEach(function (p) { var k = p.split("|"), ga = -1, gb = -1; G.forEach(function (g, gi) { g.forEach(function (x) { var e = ek(x); if (e === k[0]) ga = gi; if (e === k[1]) gb = gi; }); }); if (ga >= 0 && gb >= 0 && ga !== gb) c += 100; });
      if (mode !== "niveau" && mode !== "hasard" && known) M.forEach(function (m) { c += 6 * Math.pow(m - gm, 2); });
      return c; }
    var best = cost(G), it = Math.min(6000, 200 * names.length);
    for (i = 0; i < it && n > 1; i++) { var a = Math.floor(Math.random() * n), b = Math.floor(Math.random() * n); if (a === b || !G[a].length || !G[b].length) continue;
      var x = Math.floor(Math.random() * G[a].length), y = Math.floor(Math.random() * G[b].length), t = G[a][x]; G[a][x] = G[b][y]; G[b][y] = t; var c = cost(G);
      if (c <= best) best = c; else { t = G[a][x]; G[a][x] = G[b][y]; G[b][y] = t; } }
    if (mode === "niveau" && known) G.sort(function (a, b) { return mean(b) - mean(a); });
    G.forEach(function (g) { g.sort(function (a, b) { return a.localeCompare(b, "fr"); }); });
    return { g: G, mode: mode, sans: mode !== "hasard" && !known ? 1 : 0, alerts: check(o.cls, G) };
  }
  function check(cls, G) { var A = affItem(cls), out = [], where = {}; G.forEach(function (g, gi) { g.forEach(function (x) { where[ek(x)] = gi; }); });
    (A.sep || []).forEach(function (p) { if (where[p[0]] != null && where[p[0]] === where[p[1]]) out.push("⛔ " + (A.names && A.names[p[0]] || p[0]) + " et " + (A.names && A.names[p[1]] || p[1]) + " sont dans le même groupe."); });
    (A.ens || []).forEach(function (p) { if (where[p[0]] != null && where[p[1]] != null && where[p[0]] !== where[p[1]]) out.push("🤝 " + (A.names && A.names[p[0]] || p[0]) + " et " + (A.names && A.names[p[1]] || p[1]) + " sont séparés."); });
    return out; }
  /* groupes du jour de l'activité (repris par 📡 Leçon en cours, les tablettes élèves et les applis) */
  function sendDay(dir, cls, G, mode, noms) {
    var K = "eps.live." + dir + ".v1", V = ld(K), id = null; Object.keys(V.items).forEach(function (k) { var v = V.items[k]; if (v && !v.del && nn(v.cls) === nn(cls)) id = id || k; });
    var v = id ? V.items[id] : { id: nn(cls), cls: cls }, disp = roster(cls).filter(function (n) { return !absent(cls, n) && dispense(cls, n); });
    v.grp = { g: G.map(function (g) { return g.slice(); }), disp: disp, mode: mode === "affinite" || mode === "casser" ? "melange" : mode, at: Date.now(), src: noms ? "plan" : "niv", lib: noms ? "Plan de terrain" : (MODES.filter(function (m) { return m[0] === mode; })[0] || [])[1] };
    if (noms) v.grp.nm = noms.map(String);   /* 🗺 plan de terrain : nom de la zone de chaque groupe */
    put(K, v); try { window.epsGroupesLog && epsGroupesLog(dir, cls, G, "niv"); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent("eps-groupes", { detail: { dir: dir, cls: cls } })); } catch (e) {}
  }

  /* ---------- interface ---------- */
  var CSS = ".tz-t{min-height:40px;padding:0 14px;border-radius:10px;border:1.5px solid #3A3F47;background:none;color:#D5D8DE;font:700 14px system-ui}.tz-z{position:absolute;width:19%;min-width:150px;background:rgba(255,255,255,.96);border:2px solid #14171C;border-radius:14px;overflow:hidden}.tz-z.arr{border-style:dashed}.tz-h{display:flex;align-items:center;gap:6px;background:#14171C;color:#fff;padding:6px 8px;font-size:14px}.tz-z.arr .tz-h{cursor:move;touch-action:none}.tz-h b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tz-h span{background:#fff;color:#14171C;border-radius:999px;padding:0 8px;font-weight:800}.tz-h button{min-width:40px;min-height:40px;border:0;border-radius:8px;background:#3A3F47;color:#fff;font-size:15px}.tz-l{display:flex;flex-wrap:wrap;gap:5px;padding:6px;min-height:44px}.tz-c{min-height:40px;padding:0 10px;border-radius:999px;border:1.5px solid #C9C3B6;background:#fff;font:700 14px system-ui;color:#14171C;touch-action:none;cursor:grab}.tz-c.on{background:#14171C;border-color:#14171C;color:#fff}.tz-banc{margin-top:10px;background:#fff;border:1.5px solid #E6E1D6;border-radius:14px;padding:10px 12px}" +
    ".gr-w{font:15px/1.4 system-ui,sans-serif;color:#14171C}.gr-w h2{margin:0 0 4px;font-size:22px}.gr-w h3{margin:14px 0 6px;font-size:17px}.gr-mut{color:#6A6F78;font-size:13.5px}.gr-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}" +
    ".gr-b{min-height:40px;border-radius:10px;border:1.5px solid #E6E1D6;background:#fff;font:700 14px system-ui;padding:0 12px;cursor:pointer;color:#14171C}.gr-b.p{background:var(--gr,#14171C);border-color:var(--gr,#14171C);color:#fff}.gr-sel{height:40px;border-radius:10px;border:1.5px solid #E6E1D6;background:#fff;font:600 14px system-ui;padding:0 8px}" +
    ".gr-tabs{display:flex;gap:6px;margin:10px 0;border-bottom:2px solid #E6E1D6}.gr-tabs button{border:0;background:none;font:800 15px system-ui;padding:8px 12px;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px;color:#4A4F58}.gr-tabs button[aria-selected=true]{border-color:var(--gr,#14171C);color:#14171C}" +
    ".gr-cols{display:grid;grid-template-columns:repeat(5,minmax(150px,1fr));gap:8px;overflow:auto}.gr-col{background:#fff;border:1.5px solid #E6E1D6;border-radius:12px;padding:8px;min-height:120px}.gr-col.over{outline:3px dashed var(--gr,#14171C)}.gr-col h4{margin:0 0 6px;font-size:14px;display:flex;flex-wrap:wrap;gap:2px 6px;align-items:center}" +
    ".gr-chip{display:flex;align-items:center;gap:6px;margin:4px 0;padding:6px 8px;border-radius:9px;background:#F5F3EE;border:1.5px solid #E6E1D6;cursor:grab;font-weight:600;user-select:none;min-height:36px}.gr-chip.sel{outline:3px solid var(--gr,#14171C);background:#fff}.gr-chip small{color:#6A6F78;font-weight:700;margin-left:auto;font-size:12px;text-align:right;white-space:nowrap;background:#fff;border-radius:999px;padding:1px 7px}" +
    ".gr-dot{width:12px;height:12px;border-radius:50%;flex:none}.gr-grp{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}.gr-al{background:#FFF1BF;border-radius:10px;padding:6px 10px;margin:4px 0;color:#6b4e00}" +
    ".gr-pair{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#fff;border:1.5px solid #E6E1D6;border-radius:10px;padding:6px 10px;margin:4px 0}.gr-pair b{flex:1;min-width:180px}" +
    "@media (max-width:760px){.gr-cols{grid-template-columns:repeat(2,1fr)}}";
  function css() { if (document.getElementById("gr-css")) return; var s = document.createElement("style"); s.id = "gr-css"; s.textContent = CSS; document.head.appendChild(s); }

  function render(root, o) {
    css(); o = o || {}; var dir = o.dir || Object.keys(DIRS)[0], cls = o.cls || classes(dir)[0] || "", tab = o.tab || "rang", sel = null, RES = null;
    root.classList.add("gr-w"); root.style.setProperty("--gr", (DIRS[dir] || [])[2] || "#14171C");
    function head() { var C = classes(dir);
      return '<div class="gr-row">' + (o.fixDir ? "" : '<select class="gr-sel" data-dir aria-label="Activité">' + Object.keys(DIRS).map(function (d) { return '<option value="' + d + '"' + (d === dir ? " selected" : "") + ">" + DIRS[d][1] + "</option>"; }).join("") + "</select>") +
        '<select class="gr-sel" data-cls aria-label="Classe">' + (C.length ? C.map(function (c) { return '<option' + (nn(c) === nn(cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") : "<option value=''>Aucune classe</option>") + "</select>" +
        '<span class="gr-mut">' + (cls ? roster(cls).length + " élèves · " + pratiquants(cls).length + " qui pratiquent aujourd'hui" : "") + "</span></div>" +
        '<div class="gr-tabs" role="tablist">' + [["rang", "📶 Classement"], ["aff", "🤝 Affinités"], ["grp", "👥 Former les groupes"]].map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + "</button>"; }).join("") + "</div>"; }
    function chip(n, L, extra) { var x = L[ek(n)] || {}, ab = absent(cls, n), dp = dispense(cls, n);
      return '<div class="gr-chip" draggable="true" data-n="' + esc(n) + '" title="' + esc((x.src || []).join(" · ") || "aucune donnée") + '"><span class="gr-dot" style="background:' + NCOL[x.lv || 0] + '"></span><span>' + esc(n) + (ab ? " · absent" : dp ? " 🩹" : "") + "</span>" + (extra || "") + "</div>"; }
    function drawRang() { var R = roster(cls), L = levels(dir, cls, R), A = auto(dir, cls), na = Object.keys(A).length;
      var h = '<p class="gr-mut">Glisse chaque élève dans son niveau (ou touche un élève puis une colonne). La pastille : ton classement ; « → 3 » : le niveau proposé d\'après les données (' + (na ? na + " élèves avec des données" : "pas encore de données") + '). Survole un élève pour voir d\'où vient la proposition.</p>' +
        '<div class="gr-row"><button type="button" class="gr-b p" data-auto>✨ Classer d\'après les données</button><button type="button" class="gr-b" data-clear>Effacer mon classement</button></div><div class="gr-cols">' +
        [0, 1, 2, 3, 4].map(function (lv) { var M = R.filter(function (n) { var x = L[ek(n)]; return (x.man ? x.lv : 0) === lv; }).sort(function (a, b) { return (L[ek(b)].v - L[ek(a)].v) || a.localeCompare(b, "fr"); });
          return '<div class="gr-col" data-lv="' + lv + '"><h4><span class="gr-dot" style="background:' + NCOL[lv] + '"></span>' + (lv ? "Niveau " + NIV[lv] : "Non classés") + ' <small class="gr-mut">(' + M.length + ")</small></h4>" +
            M.map(function (n) { var x = L[ek(n)]; return chip(n, L, !x.man && x.lv ? "<small title=\"Niveau proposé d'après les données\">→ " + x.lv + "</small>" : ""); }).join("") + "</div>"; }).join("") + "</div>";
      return h; }
    function drawAff() { var A = affItem(cls), F = frequent(cls, 3), X = pairs(cls), R = roster(cls), nm = function (k) { return (A.names && A.names[k]) || (R.filter(function (n) { return ek(n) === k; })[0]) || k; };
      var h = '<p class="gr-mut">' + (X.nH ? X.nH + " répartition" + (X.nH > 1 ? "s" : "") + " en mémoire (groupes du jour et groupes formés dans les applis, toutes activités)." : "Pas encore d'historique : il se remplit à chaque fois que des groupes sont formés (groupes du jour, équipes, groupes des applis).") + "</p>" +
        "<h3>👀 Souvent ensemble</h3>" + (F.length ? F.slice(0, 30).map(function (p) { var k = pk(p.a, p.b), isE = (A.ens || []).some(function (q) { return q.join("|") === k; }), isS = (A.sep || []).some(function (q) { return q.join("|") === k; });
          return '<div class="gr-pair"><b>' + esc(p.a) + " &amp; " + esc(p.b) + '</b><span class="gr-mut">ensemble ' + p.t + " fois sur " + p.n + " (" + Math.round(100 * p.t / p.n) + " %)</span>" + (isE ? "<span>🤝 gardés ensemble</span>" : isS ? "<span>⛔ à séparer</span>" : '<button type="button" class="gr-b" data-adde="' + esc(p.a) + "§" + esc(p.b) + '">🤝 Garder ensemble</button><button type="button" class="gr-b" data-adds="' + esc(p.a) + "§" + esc(p.b) + '">⛔ Séparer</button>') + "</div>"; }).join("")
          : '<p class="gr-mut">Aucune paire n\'a été ensemble au moins 3 fois et 60 % du temps.</p>') +
        "<h3>📌 Mes contraintes (" + esc(cls) + ", toutes activités)</h3>" +
        ((A.ens || []).map(function (p, i) { return '<div class="gr-pair"><b>🤝 ' + esc(nm(p[0])) + " &amp; " + esc(nm(p[1])) + '</b><span class="gr-mut">toujours ensemble</span><button type="button" class="gr-b" data-rme="' + i + '" aria-label="Retirer">✕</button></div>'; }).join("") +
          (A.sep || []).map(function (p, i) { return '<div class="gr-pair"><b>⛔ ' + esc(nm(p[0])) + " &amp; " + esc(nm(p[1])) + '</b><span class="gr-mut">à séparer</span><button type="button" class="gr-b" data-rms="' + i + '" aria-label="Retirer">✕</button></div>'; }).join("") || '<p class="gr-mut">Aucune.</p>') +
        '<div class="gr-row"><select class="gr-sel" data-pa aria-label="Premier élève">' + R.map(function (n) { return "<option>" + esc(n) + "</option>"; }).join("") + '</select><select class="gr-sel" data-pb aria-label="Deuxième élève">' + R.map(function (n, i) { return "<option" + (i === 1 ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("") +
        '</select><button type="button" class="gr-b" data-ens>🤝 Toujours ensemble</button><button type="button" class="gr-b" data-sep>⛔ À séparer</button></div>';
      return h; }
    function drawGrp() { var P = pratiquants(cls), L = levels(dir, cls, P), mode = o.mode || "melange";
      var h = '<p class="gr-mut">' + P.length + " élèves qui pratiquent aujourd'hui (absents et dispensés exclus : fais l'appel dans 📡 Leçon en cours). Tes contraintes « ensemble » / « à séparer » sont respectées.</p>" +
        '<div class="gr-row"><select class="gr-sel" data-gn aria-label="Nombre de groupes">' + [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map(function (n) { return "<option" + (n === (o.n || 4) ? " selected" : "") + ' value="' + n + '">' + n + " groupes" + (P.length ? " (≈ " + Math.round(P.length / n * 10) / 10 + ")" : "") + "</option>"; }).join("") + "</select>" +
        '<select class="gr-sel" data-gm aria-label="Façon de former les groupes">' + MODES.map(function (m) { return '<option value="' + m[0] + '"' + (m[0] === mode ? " selected" : "") + ">" + m[1] + "</option>"; }).join("") + '</select><button type="button" class="gr-b p" data-mk>' + (RES ? "↻ Refaire" : "Former les groupes") + "</button></div>" +
        '<p class="gr-mut" data-gmd>' + (MODES.filter(function (m) { return m[0] === mode; })[0] || [])[2] + "</p>";
      if (RES) { var mean = function (g) { var V = g.map(function (x) { return (L[ek(x)] || {}).v || 0; }).filter(Boolean); return V.length ? (V.reduce(function (a, b) { return a + b; }, 0) / V.length).toFixed(1) : "–"; };
        h += (RES.sans ? '<div class="gr-al">Aucun niveau connu pour cette classe : classe tes élèves dans 📶 Classement (ou évalue des leçons) pour des groupes de niveau ou équilibrés.</div>' : "") + check(cls, RES.g).map(function (t) { return '<div class="gr-al">' + esc(t) + "</div>"; }).join("") +
          '<p class="gr-mut">Pour changer : glisse un élève sur un autre groupe, ou touche deux élèves pour les échanger.</p><div class="gr-grp">' + RES.g.map(function (g, gi) { return '<div class="gr-col" data-g="' + gi + '"><h4><span style="white-space:nowrap">Groupe ' + (gi + 1) + '</span> <small class="gr-mut" style="white-space:nowrap">' + g.length + " élèves · niveau " + mean(g) + "</small></h4>" + g.map(function (n) { return chip(n, L); }).join("") + "</div>"; }).join("") + "</div>" +
          '<div class="gr-row">' + (o.noDay ? "" : '<button type="button" class="gr-b p" data-day>📡 En faire les groupes du jour</button>') + '<button type="button" class="gr-b" data-copy>📋 Copier</button>' + (o.onUse ? '<button type="button" class="gr-b" data-use>' + esc(o.useLabel || "Utiliser ces groupes") + "</button>" : "") + '<span class="gr-mut" data-msg></span></div>'; }
      return h; }
    function draw() { root.innerHTML = head() + '<div data-body>' + (!cls ? '<p class="gr-mut">Aucune classe attribuée à cette activité.</p>' : tab === "rang" ? drawRang() : tab === "aff" ? drawAff() : drawGrp()) + "</div>"; bind(); }
    function bind() {
      var q = function (s) { return root.querySelector(s); }, qa = function (s) { return root.querySelectorAll(s); };
      var d = q("[data-dir]"); if (d) d.onchange = function () { dir = d.value; root.style.setProperty("--gr", DIRS[dir][2]); if (classes(dir).map(nn).indexOf(nn(cls)) < 0) cls = classes(dir)[0] || ""; RES = null; draw(); };
      q("[data-cls]").onchange = function () { cls = this.value; RES = null; draw(); };
      qa("[data-tab]").forEach(function (b) { b.onclick = function () { tab = b.dataset.tab; draw(); }; });
      if (!cls) return;
      if (tab === "rang") {
        var move = function (n, lv) { var M = Object.assign({}, manual(dir, cls)); if (+lv) M[ek(n)] = +lv; else delete M[ek(n)]; setManual(dir, cls, M); sel = null; draw(); };
        dnd(".gr-col[data-lv]", function (col, n) { move(n, col.dataset.lv); });
        q("[data-auto]").onclick = function () { var M = Object.assign({}, manual(dir, cls)), A = auto(dir, cls), k = 0; roster(cls).forEach(function (n) { var a = A[ek(n)]; if (a && !M[ek(n)]) { M[ek(n)] = s2lv(a.s); k++; } }); setManual(dir, cls, M); draw(); if (!k) alert("Pas de donnée pour proposer un niveau (ou tout le monde est déjà classé). Évalue des leçons, saisis des évaluations, ou classe à la main."); };
        q("[data-clear]").onclick = function () { if (confirm("Effacer ton classement de " + cls + " en " + DIRS[dir][1] + " ?")) { setManual(dir, cls, {}); draw(); } };
      }
      if (tab === "aff") {
        var A = affItem(cls); A.ens = A.ens || []; A.sep = A.sep || []; A.names = A.names || {};
        var addP = function (a, b, t) { if (ek(a) === ek(b)) return; var k = pk(a, b).split("|"); A.names[ek(a)] = a; A.names[ek(b)] = b; ["ens", "sep"].forEach(function (z) { A[z] = A[z].filter(function (p) { return p.join("|") !== k.join("|"); }); }); A[t].push(k); setAff(cls, A); draw(); };
        qa("[data-adde]").forEach(function (b) { b.onclick = function () { var p = b.dataset.adde.split("§"); addP(p[0], p[1], "ens"); }; });
        qa("[data-adds]").forEach(function (b) { b.onclick = function () { var p = b.dataset.adds.split("§"); addP(p[0], p[1], "sep"); }; });
        qa("[data-rme]").forEach(function (b) { b.onclick = function () { A.ens.splice(+b.dataset.rme, 1); setAff(cls, A); draw(); }; });
        qa("[data-rms]").forEach(function (b) { b.onclick = function () { A.sep.splice(+b.dataset.rms, 1); setAff(cls, A); draw(); }; });
        q("[data-ens]").onclick = function () { addP(q("[data-pa]").value, q("[data-pb]").value, "ens"); };
        q("[data-sep]").onclick = function () { addP(q("[data-pa]").value, q("[data-pb]").value, "sep"); };
      }
      if (tab === "grp") {
        q("[data-gm]").onchange = function () { o.mode = this.value; q("[data-gmd]").textContent = (MODES.filter(function (m) { return m[0] === o.mode; })[0] || [])[2]; };
        q("[data-gn]").onchange = function () { o.n = +this.value; };
        q("[data-mk]").onclick = function () { o.n = +q("[data-gn]").value; o.mode = q("[data-gm]").value; if (!pratiquants(cls).length) { alert("Aucun élève qui pratique dans cette classe aujourd'hui."); return; } RES = make({ dir: dir, cls: cls, n: o.n, mode: o.mode }); draw(); };
        if (RES) {
          var where = function (n) { for (var i = 0; i < RES.g.length; i++) if (RES.g[i].indexOf(n) >= 0) return i; return -1; };
          dnd(".gr-col[data-g]", function (col, n) { var a = where(n), b = +col.dataset.g; if (a < 0 || a === b) return; RES.g[a].splice(RES.g[a].indexOf(n), 1); RES.g[b].push(n); draw(); }, function (n1, n2) { var a = where(n1), b = where(n2); if (a < 0 || b < 0) return; RES.g[a][RES.g[a].indexOf(n1)] = n2; RES.g[b][RES.g[b].indexOf(n2)] = n1; draw(); });
          var msg = q("[data-msg]"), dy = q("[data-day]"); if (dy) dy.onclick = function () { sendDay(dir, cls, RES.g, RES.mode); msg.textContent = "✓ Groupes du jour enregistrés : affichés dans 📡 Leçon en cours et sur les tablettes élèves, repris par les boutons « 👥 Groupes du jour » des applis."; if (o.onDay) try { o.onDay(RES.g); } catch (e) {} };
          q("[data-copy]").onclick = function () { var t = RES.g.map(function (g, i) { return "Groupe " + (i + 1) + " : " + g.join(", "); }).join("\n"); try { navigator.clipboard.writeText(t); msg.textContent = "✓ Copié."; } catch (e) { prompt("Copie :", t); } };
          var us = q("[data-use]"); if (us) us.onclick = function () { try { window.epsGroupesLog && epsGroupesLog(dir, cls, RES.g, "niv"); } catch (e) {} o.onUse(RES.g.map(function (g) { return g.slice(); }), RES.mode); };
        }
      }
    }
    /* glisser-déposer (souris) + toucher un élève puis une colonne / un autre élève (tablette) */
    function dnd(colSel, onDrop, onSwap) {
      root.querySelectorAll(".gr-chip[data-n]").forEach(function (c) {
        c.ondragstart = function (e) { e.dataTransfer.setData("text/plain", c.dataset.n); e.dataTransfer.effectAllowed = "move"; };
        c.onclick = function (e) { e.stopPropagation(); var n = c.dataset.n; if (sel && sel !== n) { var s = sel; sel = null; if (onSwap) onSwap(s, n); else { var col = c.closest(colSel); if (col) onDrop(col, s); } return; } sel = sel === n ? null : n; root.querySelectorAll(".gr-chip").forEach(function (x) { x.classList.toggle("sel", x.dataset.n === sel); }); };
        if (onSwap) { c.ondragover = function (e) { e.preventDefault(); e.stopPropagation(); }; c.ondrop = function (e) { e.preventDefault(); e.stopPropagation(); var n = e.dataTransfer.getData("text/plain"); if (n && n !== c.dataset.n) onSwap(n, c.dataset.n); }; }
      });
      root.querySelectorAll(colSel).forEach(function (col) {
        col.ondragover = function (e) { e.preventDefault(); col.classList.add("over"); }; col.ondragleave = function () { col.classList.remove("over"); };
        col.ondrop = function (e) { e.preventDefault(); col.classList.remove("over"); var n = e.dataTransfer.getData("text/plain"); if (n) onDrop(col, n); };
        col.onclick = function () { if (sel) { var n = sel; sel = null; onDrop(col, n); } };
      });
    }
    draw();
    return { redraw: draw, set: function (p) { if (p.dir) dir = p.dir; if (p.cls) cls = p.cls; if (p.tab) tab = p.tab; RES = null; draw(); } };
  }

  /* ================= 🗺 Plan de terrain =================
     Les groupes du jour posés sur les installations : des zones (terrains, ateliers) que l'enseignant nomme et dispose, sur un schéma
     ou une photo du lieu s'il en dépose un ; les élèves se déplacent au doigt (glisser, ou toucher l'élève puis la zone).
     « 📡 Envoyer aux tablettes » = groupes du jour (sendDay, avec le nom des zones : v.grp.nm) : rien d'autre à apprendre aux applis.
     Magasin eps.terrain.v1 (tz|), synchronisé : lay|<dossier> {zones:[{id, nom, x, y}]} (position en % du plan) ; p|<dossier>|<classe> {cls, day, z:{zone:[noms]}}.
     Le schéma déposé reste sur la tablette (eps.terrain.img.<dossier>, image réduite) : il n'est pas envoyé. */
  var KTZ = "eps.terrain.v1";
  function tzLay(dir) { var o = ld(KTZ).items["lay|" + dir]; if (o && !o.del && Array.isArray(o.zones) && o.zones.length) return o;
    return { id: "lay|" + dir, zones: [0, 1, 2, 3].map(function (i) { return { id: "z" + (i + 1), nom: "Terrain " + (i + 1), x: 3 + (i % 2) * 50, y: 4 + Math.floor(i / 2) * 48 }; }) }; }
  function terrain(o) {
    o = o || {}; css(); var dir = o.dir, cls = o.cls || "", L = tzLay(dir), sel = null, arr = false, msg = "", IMGK = "eps.terrain.img." + dir;
    var ov = document.createElement("div"); ov.className = "gr-w"; ov.style.cssText = "position:fixed;inset:0;z-index:2147483250;background:#F5F3EE;display:flex;flex-direction:column"; document.body.appendChild(ov);
    function img() { try { return localStorage.getItem(IMGK) || ""; } catch (e) { return ""; } }
    function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
    function plan() { var id = "p|" + dir + "|" + nn(cls), p = ld(KTZ).items[id]; if (p && !p.del && p.day === today() && p.z && typeof p.z === "object") return p; return null; }
    /* répartition de départ : le plan du jour, sinon les groupes du jour de la leçon, sinon tout le monde sur le banc */
    function depart() { var p = plan(), Z = {}; if (p) { L.zones.forEach(function (z) { Z[z.id] = Array.isArray(p.z[z.id]) ? p.z[z.id].slice() : []; }); return Z; }
      L.zones.forEach(function (z) { Z[z.id] = []; }); var G = null; try { var V = ld("eps.live." + dir + ".v1"); Object.keys(V.items).forEach(function (k) { var v = V.items[k]; if (v && !v.del && nn(v.cls) === nn(cls) && v.grp && Array.isArray(v.grp.g) && v.grp.g.length) G = G || v.grp.g; }); } catch (e) {}
      if (G) { while (L.zones.length < G.length && L.zones.length < 12) addZone(true); G.forEach(function (g, i) { var z = L.zones[Math.min(i, L.zones.length - 1)]; Z[z.id] = (Z[z.id] || []).concat(g); }); }
      return Z; }
    function addZone(silent) { var n = L.zones.length, id = "z" + Date.now().toString(36) + n; L.zones.push({ id: id, nom: "Terrain " + (n + 1), x: 3 + (n % 4) * 24, y: 4 + (Math.floor(n / 4) % 3) * 32 }); if (!silent) { Z[id] = []; saveLay(); } return id; }
    function saveLay() { put(KTZ, { id: "lay|" + dir, zones: L.zones.map(function (z) { return { id: z.id, nom: String(z.nom).slice(0, 30), x: Math.round(z.x * 10) / 10, y: Math.round(z.y * 10) / 10 }; }) }); }
    function savePlan() { var z = {}; L.zones.forEach(function (q) { z[q.id] = (Z[q.id] || []).slice(); }); put(KTZ, { id: "p|" + dir + "|" + nn(cls), cls: cls, day: today(), z: z }); }
    var Z = depart();
    function placed() { var P = {}; L.zones.forEach(function (z) { (Z[z.id] || []).forEach(function (n) { P[ek(n)] = z.id; }); }); return P; }
    function move(n, zid) { L.zones.forEach(function (z) { Z[z.id] = (Z[z.id] || []).filter(function (x) { return ek(x) !== ek(n); }); }); if (zid && Z[zid]) Z[zid].push(n); sel = null; msg = ""; savePlan(); draw(); }
    function chip(n) { var d = dispense(cls, n); return '<button type="button" class="tz-c' + (sel && ek(sel) === ek(n) ? " on" : "") + '" data-n="' + esc(n) + '">' + (d ? "🩹 " : "") + esc(n) + "</button>"; }
    function draw() {
      var R = roster(cls).filter(function (n) { return !absent(cls, n); }), P = placed(), banc = R.filter(function (n) { return !P[ek(n)]; }), C = classes(dir), bg = img();
      /* un élève retiré de la liste ou absent ne reste pas sur le plan */
      var ok = {}; R.forEach(function (n) { ok[ek(n)] = 1; }); L.zones.forEach(function (z) { Z[z.id] = (Z[z.id] || []).filter(function (n) { return ok[ek(n)]; }); });
      ov.innerHTML = '<div style="background:#14171C;color:#fff;padding:8px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;box-shadow:inset 0 -4px 0 ' + ((DIRS[dir] || [])[2] || "#888") + '"><b style="font-size:18px;flex:1;min-width:150px">🗺 Plan de terrain' + (DIRS[dir] ? " · " + DIRS[dir][1] : "") + "</b>" +
        '<select data-cls aria-label="Classe" style="min-height:40px;border-radius:10px;padding:0 8px;font:700 15px system-ui">' + C.map(function (c) { return "<option" + (nn(c) === nn(cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>" +
        '<button type="button" class="tz-t" data-x>✕ Fermer</button></div>' +
        '<div style="padding:8px 12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;background:#fff;border-bottom:1px solid #E6E1D6">' +
        '<button type="button" class="gr-b' + (arr ? " p" : "") + '" data-arr aria-pressed="' + arr + '">' + (arr ? "✓ Disposition terminée" : "✎ Disposer les zones") + "</button>" +
        (arr ? '<button type="button" class="gr-b" data-add>＋ Zone</button><label class="gr-b" style="display:inline-flex;align-items:center;cursor:pointer">🖼 Schéma du lieu<input type="file" accept="image/*" data-img style="display:none"></label>' + (bg ? '<button type="button" class="gr-b" data-noimg>Retirer le schéma</button>' : "")
          : '<select data-mode aria-label="Type de groupes" style="min-height:44px;border-radius:12px;border:1.5px solid #E6E1D6;padding:0 8px;font:700 15px system-ui">' + MODES.map(function (m) { return '<option value="' + m[0] + '">' + m[1] + "</option>"; }).join("") + '</select><button type="button" class="gr-b" data-mk>🎲 Répartir</button><button type="button" class="gr-b" data-vide>Tout remettre sur le banc</button><button type="button" class="gr-b p" data-send>📡 Envoyer aux tablettes</button>') +
        '<span class="gr-mut" data-msg role="status" style="font-weight:800;color:#1E6B3A">' + esc(msg) + "</span></div>" +
        '<div style="flex:1;overflow:auto;padding:10px 12px"><div data-map style="position:relative;width:100%;min-height:440px;height:62vh;border:2px dashed #C9C3B6;border-radius:16px;background:' + (bg ? "#fff url(" + bg + ") center/contain no-repeat" : "#E9F0E4") + ';touch-action:none">' +
        L.zones.map(function (z, i) { var g = Z[z.id] || []; return '<div class="tz-z' + (arr ? " arr" : "") + '" data-z="' + esc(z.id) + '" style="left:' + z.x + "%;top:" + z.y + '%"><div class="tz-h" data-zh="' + esc(z.id) + '"><b>' + esc(z.nom) + "</b><span>" + g.length + "</span>" + (arr ? '<button type="button" data-ren="' + i + '" aria-label="Renommer ' + esc(z.nom) + '">✎</button><button type="button" data-delz="' + i + '" aria-label="Supprimer ' + esc(z.nom) + '">✕</button>' : "") + '</div><div class="tz-l">' + (g.map(chip).join("") || '<span class="gr-mut">' + (arr ? "glisse le titre pour déplacer" : "vide") + "</span>") + "</div></div>"; }).join("") + "</div>" +
        '<div data-z="" class="tz-banc"><b>Banc · ' + banc.length + " élève" + (banc.length > 1 ? "s" : "") + ' à placer</b><div class="tz-l" style="margin-top:6px">' + (banc.map(chip).join("") || '<span class="gr-mut">Tout le monde est placé.</span>') + '</div></div><p class="gr-mut">Glisse un élève vers une zone, ou touche-le puis touche la zone. 🩹 = dispensé (à placer sur un rôle). Les absents à l\'appel ne sont pas affichés.</p></div>';
      var q = function (x) { return ov.querySelector(x); }, qa = function (x) { return Array.prototype.slice.call(ov.querySelectorAll(x)); };
      q("[data-x]").onclick = function () { ov.remove(); if (o.onClose) try { o.onClose(); } catch (e) {} };
      q("[data-cls]").onchange = function () { cls = this.value; sel = null; msg = ""; Z = depart(); draw(); };
      q("[data-arr]").onclick = function () { arr = !arr; sel = null; msg = ""; draw(); };
      if (arr) { q("[data-add]").onclick = function () { if (L.zones.length >= 12) { msg = "12 zones au plus."; draw(); return; } addZone(); draw(); };
        qa("[data-ren]").forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); var z = L.zones[+b.dataset.ren], v = prompt("Nom de la zone (terrain, atelier, rôle…)", z.nom); if (v && v.trim()) { z.nom = v.trim().slice(0, 30); saveLay(); draw(); } }; });
        qa("[data-delz]").forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); var i = +b.dataset.delz, z = L.zones[i]; if (L.zones.length < 2) { msg = "Garde au moins une zone."; draw(); return; } if ((Z[z.id] || []).length && !confirm("Supprimer « " + z.nom + " » ? Ses élèves retournent sur le banc.")) return; L.zones.splice(i, 1); delete Z[z.id]; saveLay(); savePlan(); draw(); }; });
        q("[data-img]").onchange = function () { var f = this.files && this.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
              try { localStorage.setItem(IMGK, c.toDataURL("image/jpeg", .6)); msg = "✓ Schéma enregistré sur cette tablette"; } catch (e) { msg = "Image trop lourde pour la mémoire de la tablette."; } draw(); }; im.onerror = function () { msg = "Image illisible."; draw(); }; im.src = r.result; }; r.readAsDataURL(f); };
        var ni = q("[data-noimg]"); if (ni) ni.onclick = function () { try { localStorage.removeItem(IMGK); } catch (e) {} draw(); };
      } else {
        q("[data-mk]").onclick = function () { var R2 = pratiquants(cls); if (!R2.length) { msg = "Aucun élève présent à répartir."; draw(); return; } var r = make({ dir: dir, cls: cls, names: R2, n: L.zones.length, mode: q("[data-mode]").value }), G = (r && r.g) || [];
          L.zones.forEach(function (z, i) { Z[z.id] = (G[i] || []).slice(); }); sel = null; msg = "✓ " + R2.length + " élèves répartis sur " + L.zones.length + " zones"; savePlan(); draw(); };
        q("[data-vide]").onclick = function () { L.zones.forEach(function (z) { Z[z.id] = []; }); sel = null; msg = ""; savePlan(); draw(); };
        q("[data-send]").onclick = function () { var ZN = L.zones.filter(function (z) { return (Z[z.id] || []).length; }); if (!ZN.length) { msg = "Place d'abord des élèves dans les zones."; draw(); return; }
          sendDay(dir, cls, ZN.map(function (z) { return Z[z.id].filter(function (n) { return !dispense(cls, n); }); }).map(function (g, i) { return g.length ? g : Z[ZN[i].id].slice(); }), "plan", ZN.map(function (z) { return z.nom; }));
          msg = "✓ Envoyé : les groupes du jour s'affichent sur les tablettes et dans 📡 Leçon en cours"; draw(); }; }
      /* toucher l'élève puis la zone */
      qa("[data-n]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); if (arr || b._drag) return; sel = sel && ek(sel) === ek(b.dataset.n) ? null : b.dataset.n; draw(); }); });
      qa("[data-z]").forEach(function (zd) { zd.addEventListener("click", function () { if (arr || !sel) return; move(sel, zd.dataset.z); }); });
      /* glisser : un élève vers une zone, ou (mode disposition) une zone sur le plan */
      var map = q("[data-map]");
      qa("[data-n]").forEach(function (b) { b.addEventListener("pointerdown", function (e) { if (arr) return; var x0 = e.clientX, y0 = e.clientY, gh = null, n = b.dataset.n;
          function mv(ev) { if (!gh && Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 10) return; if (!gh) { b._drag = true; gh = b.cloneNode(true); gh.style.cssText = "position:fixed;z-index:2147483600;pointer-events:none;opacity:.9;box-shadow:0 6px 18px rgba(0,0,0,.3)"; document.body.appendChild(gh); } gh.style.left = (ev.clientX - 40) + "px"; gh.style.top = (ev.clientY - 20) + "px"; ev.preventDefault(); }
          function up(ev) { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up); if (!gh) return; gh.remove(); var t = document.elementFromPoint(ev.clientX, ev.clientY), zd = t && t.closest ? t.closest("[data-z]") : null; setTimeout(function () { b._drag = false; }, 50); if (zd && ov.contains(zd)) move(n, zd.dataset.z); }
          document.addEventListener("pointermove", mv, { passive: false }); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up); }); });
      if (arr) qa("[data-zh]").forEach(function (hd) { hd.addEventListener("pointerdown", function (e) { if (e.target.closest("button")) return; var z = L.zones.filter(function (q2) { return q2.id === hd.dataset.zh; })[0], box = hd.parentNode, r = map.getBoundingClientRect(), dx = e.clientX - box.getBoundingClientRect().left, dy = e.clientY - box.getBoundingClientRect().top; if (!z) return; e.preventDefault();
          function mv(ev) { z.x = Math.max(0, Math.min(80, (ev.clientX - dx - r.left) / r.width * 100)); z.y = Math.max(0, Math.min(82, (ev.clientY - dy - r.top) / r.height * 100)); box.style.left = z.x + "%"; box.style.top = z.y + "%"; ev.preventDefault(); }
          function up() { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up); saveLay(); }
          document.addEventListener("pointermove", mv, { passive: false }); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up); }); });
    }
    try { if (window.EPSD && EPSD.store) EPSD.store({ key: KTZ, pre: "tz|", onChange: function () {} }); } catch (e) {}
    draw(); return ov;
  }
  function open(o) {
    o = o || {}; css(); var ov = document.createElement("div");
    ov.style.cssText = "position:fixed;inset:0;z-index:2147483300;background:rgba(20,23,28,.55);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:16px";
    ov.innerHTML = '<div role="dialog" aria-modal="true" aria-label="Niveaux et groupes" style="background:#F5F3EE;border-radius:18px;max-width:1100px;width:100%;padding:16px 18px;box-shadow:0 10px 40px rgba(0,0,0,.3)"><div style="display:flex;align-items:center;gap:10px"><h2 style="margin:0;flex:1;font:800 22px system-ui">🧩 Niveaux &amp; groupes' + (o.dir && DIRS[o.dir] ? " · " + DIRS[o.dir][1] : "") + '</h2><button type="button" class="gr-b" data-x>✕ Fermer</button></div><div data-in></div></div>';
    document.body.appendChild(ov); ov.querySelector("[data-x]").onclick = function () { ov.remove(); if (o.onClose) try { o.onClose(); } catch (e) {} };
    if (!o.cls) try { var c = window.epsCurrentClass && epsCurrentClass(); if (c && c.nom) o.cls = c.nom; } catch (e) {}
    render(ov.querySelector("[data-in]"), Object.assign({ fixDir: !!o.dir }, o)); return ov;
  }
  window.EPSGR = { open: open, terrain: terrain, render: render, make: make, levels: levels, auto: auto, manual: manual, pairs: pairs, frequent: frequent, aff: affItem, sendDay: sendDay, classes: classes, pratiquants: pratiquants, DIRS: DIRS, MODES: MODES, ek: ek };
})();
