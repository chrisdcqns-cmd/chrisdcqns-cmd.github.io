/* EPS – Autonomie et numérique : listes de classes communes à toutes les applications.
   Chargé de façon SYNCHRONE en haut de chaque application (avant son propre script), pour que
   les classes importées ailleurs (accueil, autre appli, autre tablette) soient déjà dans ses données à l'ouverture.

   Stockage commun : localStorage « eps.lists.v1 » = {items:{id:{id,nom,old,el:[« Prénom Nom »],st:{nkey:[prénom,nom]},rm:[nkey],ts}},
     pend, since, app, snap:{"app|classe":[nkey]}, skip:{"app|classe":1}}  (items partagés entre tablettes : enregistrements « lst|id »).
   - EPSL.apply(app) : ajoute dans l'appli les classes et élèves des listes communes (jamais de doublon) ;
     retire les élèves supprimés de la liste commune (rm) seulement s'ils n'ont encore aucune donnée.
   - EPSL.collect() (appelé par eps-home.js) : ce qui a été importé / ajouté / supprimé dans une appli remonte dans les listes communes.
   Applis : esc (Escalade), rel (Relais), vol (Volley), bad (Badminton), dan (Danse). OrienRun (IndexedDB) et Acrosport sont gérés à part. */
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

  /* description de chaque appli : où sont ses classes, comment lire / ajouter / retirer un élève */
  var APPS = {
    esc: { key: "escalade.cl", list: function (d) { return d || []; }, nom: "nom",
      names: function (c) { return (c.el || []).map(function (n) { return { full: n }; }); },
      make: function (L, o) { return { id: freeId(L, clsId(o.nom)), nom: o.nom, el: [] }; },
      add: function (c, p) { c.el.push(p.full); }, del: function (c, k) { c.el = c.el.filter(function (n) { return nkey(n) !== k; }); } },
    rel: { key: "relais-vitesse-data-v3", list: function (d) { return d && d.classes || []; }, nom: "name", init: function () { return { classes: [], cur: null }; },
      names: function (c) { return (c.eleves || []).map(function (e) { return { full: full(e), prenom: e.prenom, nom: e.nom }; }); },
      make: function (L, o) { return { id: freeId(L, clsId(o.nom)), name: o.nom, eleves: [], groupes: [], courses: [], lecons: [], curg: "all" }; },
      add: function (c, p) { var id = Math.max.apply(null, [-1].concat(c.eleves.map(function (e) { return +e.id || 0; }))) + 1;
        c.eleves.push({ id: id, nom: p.nom, prenom: p.prenom, ea: [null, null, null], ma: 0, el: [null, null, null], ml: 0, orig: { ea: [null, null, null], ma: 0, el: [null, null, null], ml: 0 }, imported: true }); },
      del: function (c, k) { c.eleves = c.eleves.filter(function (e) { if (nkey(full(e)) !== k) return true; return (e.ea || []).concat(e.el || []).some(function (x) { return x != null; }); }); } },
    vol: { key: "eps_volley_eval_v1", list: function (d) { return d && d.classes || []; }, nom: "nom", init: function () { return { classes: [], cur: 0 }; },
      names: function (c) { return (c.eleves || []).map(function (e) { return { full: full(e), prenom: e.prenom, nom: e.nom }; }); },
      make: function (L, o) { return { id: freeId(L, clsId(o.nom)), nom: o.nom, eleves: [] }; },
      add: function (c, p) { c.eleves.push({ id: "e" + h32v(p.k + "|" + c.id), nom: p.nom, prenom: p.prenom, ev: {}, choix: "4-4", statut: "", comment: "" }); },
      del: function (c, k) { c.eleves = c.eleves.filter(function (e) { return nkey(full(e)) !== k || hasEv(e); }); } },
    bad: { key: "eps_badminton_v1", list: function (d) { return d && d.classes || []; }, nom: "nom", init: function () { return { classes: [], cur: 0 }; },
      names: function (c) { return (c.eleves || []).map(function (e) { return { full: full(e), prenom: e.prenom, nom: e.nom }; }); },
      make: function (L, o, d) { return { id: freeId(L, clsId(o.nom)), nom: o.nom, voie: d && d.voie === "pro" ? "pro" : "gt", eleves: [], matchs: {}, poules: {} }; },
      add: function (c, p) { c.eleves.push({ id: "e" + h32v(p.k + "|" + c.id), nom: p.nom, prenom: p.prenom, ev: {}, choix: "4-4", statut: "", comment: "", rout: {} }); },
      del: function (c, k) { c.eleves = c.eleves.filter(function (e) { return nkey(full(e)) !== k || hasEv(e); }); } },
    dan: { key: "danse-eps-v1", list: function (d) { return d && d.classes || []; }, nom: "nom", init: function () { return { classes: [] }; },
      names: function (c) { return (c.eleves || []).map(function (e) { return { full: full(e), prenom: e.prenom, nom: e.nom }; }); },
      make: function (L, o) { return { id: freeId(L, clsId(o.nom)), nom: o.nom, eleves: [], groupes: [] }; },
      add: function (c, p) { c.eleves.push({ id: "d" + h32v(p.k + "|" + c.id), nom: p.nom, prenom: p.prenom, groupeId: "", ev: {}, comm: "", statut: "" }); },
      del: function (c, k) { c.eleves = c.eleves.filter(function (e) { return nkey(full(e)) !== k || hasEv(e) || e.groupeId; }); } }
  };

  /* listes communes → données de l'appli (à l'ouverture de l'appli) */
  function apply(app) {
    var A = APPS[app]; if (!A) return false;
    var v = ld(), its = items(v); if (!its.length) return false;
    var d = jget(A.key, null);
    if (d == null) { if (!A.init) d = []; else d = A.init(); }
    var L = A.list(d); if (!Array.isArray(L)) return false;
    if (d && !Array.isArray(d) && !d.classes) d.classes = L;
    var ch = false;
    its.forEach(function (o) {
      var sk = app + "|" + norm(o.nom); if (v.skip[sk]) return;
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
    return ch;
  }

  /* données des applis de cette tablette → listes communes (import ou modification faits dans une appli) */
  function collect(extra) {
    var v = ld(), its = items(v), changed = [], now = Date.now();
    function itemFor(nom) { return its.filter(function (o) { return same(o, nom); })[0]; }
    function scan(app, classes) {
      classes.forEach(function (c) {
        var nom = String(c.nom || "").replace(/\s+/g, " ").trim(); if (!nom || (nom === "Ma classe" && !c.ppl.length)) return;
        var sk = app + "|" + norm(nom), snap = v.snap[sk], o = itemFor(nom), loc = {}, dirty = false;
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
})();
