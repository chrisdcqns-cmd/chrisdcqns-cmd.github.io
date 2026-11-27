/* EPS – Autonomie et numérique : leçons communes à toutes les applis d'activité (chargé par eps-home.js).
   Enseignant (espace enseignant → Séquence : « 📝 Leçons », « 📡 Leçon en cours » ; Bibliothèque : « 📂 Mes documents ») :
   - fiches de leçon à la structure de l'enseignant : objectifs (moteur, méthodologique, social), but, dispositif et matériel,
     échauffement (consigne, schéma), situations (consigne, critères de réussite quantitatifs / qualitatifs, critères de réalisation,
     variables : simplification / complexification), remise en action (match ou situation plus large), bilan ;
   - dépôt de documents (docx, pptx, odt, txt lus sur la tablette ; pdf et photos transcrits par Claude) : Claude s'en sert EN PRIORITÉ
     pour mettre en forme une leçon, proposer la suivante, compléter les rubriques vides, ou une séquence parallèle plus simple / plus difficile ;
   - toute proposition de Claude est un BROUILLON (champs en jaune), jamais visible par les élèves tant que l'enseignant ne l'a pas validée ;
   - leçons programmées (classe, date, heure) : compte à rebours côté élève, ouverture automatique à l'heure ;
   - leçon en cours (tablette de contrôle) : messages en grand avec son sur toutes les tablettes, minuteur, étape en cours,
     groupes de rangement (trace de qui a rangé, rotation proposée).
   Données (chiffrées dans le partage, comme le reste) : eps.lecons.<appli>.v1, eps.lcimg.<appli>.v1 (schémas), eps.lcdocs.<appli>.v1,
   eps.live.<appli>.v1 (leçon en cours), eps.leceval.<appli>.v1 (évaluation de leçon), eps.lecres.<appli>.v1 (résultats des situations notés par les élèves), eps.rang.v1 (groupes de rangement, communs à toutes les applis). */
(function () {
  if (window.EPSLC) return;
  var APPS = { escalade: ["esc", "Escalade", "#2E7D4F"], relais: ["rel", "Relais Vitesse", "#D9481F"], volley: ["vol", "Volley-ball", "#6B3FA0"], badminton: ["bad", "Badminton", "#0B7A75"], danse: ["dan", "Danse", "#C2185B"], acrosport: ["acro", "Acrosport", "#1F4FA3"], orientation: ["ori", "OrienRun", "#E8701A"], ccf: ["ccf", "CCF", "#B8860B"], crosstraining: ["ct", "Cross-training", "#4D7C0F"], basket: ["bk", "Basket-ball", "#A4161A"], step: ["step", "Step", "#A21CAF"] };
  var m = location.pathname.match(/\/(escalade|relais|volley|badminton|danse|acrosport|orientation|ccf|crosstraining|basket|step)\//);
  if (!m) return;
  var APP = m[1], CODE = APPS[APP][0], NOM = APPS[APP][1], COL = APPS[APP][2];
  var BASE = ((document.currentScript && document.currentScript.src) || "").replace(/eps-lecons\.js.*$/, "");
  var KL = "eps.lecons." + APP + ".v1", KI = "eps.lcimg." + APP + ".v1", KD = "eps.lcdocs." + APP + ".v1", KV = "eps.live." + APP + ".v1", KR = "eps.rang.v1";
  var VUE = !!window.EPS_VUE_ELEVE;
  if (!VUE && !window.EPSGR) try { var gsc = document.createElement("script"); gsc.src = BASE + "eps-groupes.js"; gsc.defer = true; document.head.appendChild(gsc); } catch (e) {}
  /* 📅 classe du cours en cours ou du prochain cours de l'activité (emploi du temps), pour ouvrir directement sur la bonne classe */
  function edtClass() { try { var S = window.EPSD && EPSD.edtSlots ? EPSD.edtSlots(null, CODE, Date.now() - 2 * 3600e3, 1) : null, x = S && S[0]; if (!x || x.at > Date.now() + 14 * 3600e3) return null;
    var parts = [x.cls].concat(String(x.cls).split(/[\/+,&]| et /)); return classes().filter(function (c) { return parts.some(function (p) { return p.trim() && same(p.trim(), c); }); })[0] || null; } catch (e) { return null; } }
  function grOpen(cls, tab) { if (!window.EPSGR) { alert("Module en cours de chargement : réessaie dans un instant."); return; } EPSGR.open({ dir: APP, cls: cls || (cur() || {}).nom, tab: tab || "rang", onClose: function () { try { drawLive(); } catch (e) {} } }); }

  /* ---------- outils ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { alert("Mémoire de la tablette pleine : supprime des documents ou des schémas."); return false; } }
  function ld(k) { var v = jget(k, null); if (!v || !v.items) v = { items: {}, pend: {}, since: 0 }; v.pend = v.pend || {}; return v; }
  function all(k) { var V = ld(k); return Object.keys(V.items).map(function (i) { return V.items[i]; }).filter(function (o) { return o && !o.del; }); }
  function get(k, id) { var o = ld(k).items[id]; return o && !o.del ? o : null; }
  function put(k, it, fast) { var V = ld(k), old = V.items[it.id]; it.u = Math.max(Date.now(), ((old && old.u) || 0) + 1); V.items[it.id] = it; V.pend[it.id] = it.u; jset(k, V);
    if (window.EPSD) { if (fast && EPSD.syncOne) EPSD.syncOne(k); else if (EPSD.syncSoon) EPSD.syncSoon(); }
    if (k === KL) { clearTimeout(put.t); put.t = setTimeout(function () { try { window.dispatchEvent(new Event("eps-lecons")); } catch (e) {} }, 300); } /* les applis qui affichent les fiches (Séquence de Badminton, Volley) se mettent à jour */ }
  function del(k, id) { put(k, { id: id, del: 1 }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function nn(s) { return (window.EPSL ? EPSL.norm(s) : String(s || "").toLowerCase()).replace(/\s+/g, ""); }
  function same(a, b) { return !!a && !!b && nn(a) === nn(b); }
  function isT() { if (VUE) return false; try { if (typeof window.epsIsTeacher === "function" && window.epsIsTeacher()) return true; } catch (e) {} var H = document.documentElement.classList; return H.contains("eps-teach") || H.contains("epst-on") || !!(OV && OV.style.display !== "none"); }
  function hm(ts) { var d = new Date(ts); return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
  function mmss(ms) { ms = Math.max(0, Math.round(ms / 1000)); var h = Math.floor(ms / 3600), mn = Math.floor(ms % 3600 / 60), s = ms % 60; return (h ? h + " h " + (mn < 10 ? "0" : "") : "") + mn + " min " + (s < 10 ? "0" : "") + s + " s"; }
  function classes() {
    var L = []; try { (window.EPSL ? EPSL.items() : []).forEach(function (o) { if ((o.off || []).indexOf(CODE) < 0) L.push(o.nom); }); } catch (e) {}
    var c = cur(); if (c && !L.some(function (x) { return same(x, c.nom); })) L.unshift(c.nom);
    return L.sort(function (a, b) { return a.localeCompare(b, "fr", { numeric: true }); });
  }
  function cur() { try { var c = typeof window.epsCurrentClass === "function" && window.epsCurrentClass(); return c && c.nom ? c : null; } catch (e) { return null; } }
  function roster(cls) {
    var R = []; try { (window.EPSL ? EPSL.items() : []).forEach(function (o) { if (same(o.nom, cls)) R = EPSL.people(o).map(function (p) { return p.full; }); }); } catch (e) {}
    if (!R.length) { var c = cur(); if (c && same(c.nom, cls)) R = (c.eleves || []).slice(); }
    return R;
  }

  /* ---------- structure d'une leçon ---------- */
  var F = [["objM", "Objectif moteur"], ["objMe", "Objectif méthodologique"], ["objS", "Objectif social"], ["but", "But de la leçon"], ["disp", "Dispositif"], ["mat", "Matériel"], ["ech", "Échauffement : consigne"]];
  var SF = [["t", "Titre de la situation"], ["cons", "Consigne"], ["crQ", "Critères de réussite (pour être en réussite) : quantitatifs"], ["crQl", "Critères de réussite (pour être en réussite) : qualitatifs"], ["crR", "Critères de réalisation (ce qu'il y a à faire pour faire)"], ["simp", "Variables : simplification"], ["comp", "Variables : complexification"]];
  var RF = [["rem", "Remise en action : consigne (match ou situation plus large)"], ["remCr", "Remise en action : critères de réussite"], ["bilan", "Bilan de la leçon"]];
  function blank(seq) { return { id: uid(), seq: seq || "", num: "", titre: "", duree: "", statut: "ok", ai: {}, sits: [{}, {}], prog: [] }; }
  /* trames de séquence fournies par l'appli (window.EPS_TRAMES, ex. acrosport/trame-1gt.js) : fiches créées en brouillon, sans situations */
  function trames() { var L = lecons(); return (window.EPS_TRAMES || []).filter(function (t) { return t && t.id && (t.lecons || []).length && !L.some(function (l) { return l.trame === t.id; }); }); }
  /* 📥 leçons déjà écrites dans l'appli (séquence de Badminton, Volley, Relais, OrienRun…) reprises une fois pour toutes dans les fiches communes.
     L'appli fournit window.EPS_APP_LECONS() → [{key, seq, voie, num, titre, objM, objMe, objS, but, disp, mat, ech, rem, bilan, sits:[{t, cons, crQ, crQl, crR, simp, comp, ap}], prop}].
     Identifiant fixe « app-<appli>-<key> » : jamais en double d'une tablette à l'autre ; une fiche supprimée ne revient pas (trace gardée) ;
     date d'écriture ancienne (u petit) : une fiche déjà modifiée par l'enseignant n'est jamais écrasée par la reprise faite sur une autre tablette.
     Leçons de l'enseignant → validées ; leçons proposées par Claude (prop) → brouillon à valider. Mode enseignant seulement. */
  function seedApp() { if (!isT() || typeof window.EPS_APP_LECONS !== "function") return 0; var L; try { L = window.EPS_APP_LECONS() || []; } catch (e) { return 0; }
    var V = ld(KL), n = 0;
    /* seules les leçons rédigées par l'enseignant sont reprises ; les propositions (de Claude) restent à ajouter par une trame, avec confirmation.
       Nettoyage : une proposition reprise auparavant et jamais modifiée (u d'origine) est retirée. */
    Object.keys(V.items).forEach(function (id) { var o = V.items[id]; if (o && !o.del && o.src === "appli" && o.statut === "brouillon" && (o.u || 0) < 5000) { V.items[id] = { id: id, del: 1, u: 4000 }; V.pend[id] = 4000; n++; } });
    L.forEach(function (x, i) { if (!x || !x.key || x.prop) return; var id = "app-" + APP + "-" + x.key; if (V.items[id]) return;
      var l = blank(x.seq || NOM); l.id = id; l.num = String(x.num || i + 1); l.titre = x.titre || ""; l.duree = x.duree || ""; l.ai = {};
      l.sits = (x.sits || []).map(function (y) { var o = {}; SF.forEach(function (f) { if (y[f[0]]) o[f[0]] = String(y[f[0]]); }); if (y.ap) o.ap = String(y.ap); if (y.img) o.img = y.img; return o; });
      F.concat(RF).forEach(function (f) { var v = x[f[0]]; if (v) l[f[0]] = Array.isArray(v) ? v.join("\n") : String(v); });
      if (x.prop) { l.statut = "brouillon"; F.concat(RF).forEach(function (f) { if (l[f[0]]) l.ai[f[0]] = 1; }); } else { l.statut = "ok"; l.val = 1; }
      if (x.voie) l.voie = x.voie; l.src = "appli"; l.cr = 1000 + i; l.u = 1000 + i; V.items[id] = l; V.pend[id] = l.u; n++; });
    if (n) jset(KL, V); return n; }
  function addTrame(T) {
    if (!T || !confirm("Créer les " + T.lecons.length + " fiches de « " + T.nom + " » en brouillon ?\nTu pourras tout modifier" + (T.lecons.some(function (x) { return (x.sits || []).length; }) ? "" : ", ajouter les situations") + ", puis « ✓ Valider » chaque fiche.")) return;
    var now = Date.now();
    T.lecons.forEach(function (x, i) {
      var l = blank(T.seq || T.nom); l.num = String(x.num || i + 1); l.titre = x.titre || ""; l.duree = x.duree || ""; l.ai = {};
      /* situations fournies par la trame (facultatif) : champs SF + ap (apprentissage) */
      l.sits = (x.sits || []).map(function (y) { var o = {}; SF.forEach(function (f) { if (y[f[0]]) o[f[0]] = String(y[f[0]]); }); if (y.ap) o.ap = String(y.ap); return o; });
      F.concat(RF).forEach(function (f) { var v = x[f[0]]; if (v) { l[f[0]] = String(v); l.ai[f[0]] = 1; } });
      ["num", "titre"].forEach(function (k) { if (l[k]) l.ai[k] = 1; });
      l.statut = "brouillon"; l.trame = T.id; if (T.voie) l.voie = T.voie; l.cr = now + i; if (T.sources) l.sources = T.sources;
      put(KL, l);
    });
    draw();
  }
  function lecons() { return all(KL).sort(function (a, b) { return String(a.seq).localeCompare(String(b.seq), "fr") || (parseFloat(a.num) || 0) - (parseFloat(b.num) || 0) || (a.cr || 0) - (b.cr || 0); }); }
  /* attribution aux classes : l.cls = [noms]. Une classe qui a au moins une leçon attribuée a sa propre séquence (seulement ses leçons) ;
     une classe sans aucune leçon attribuée garde toutes les leçons non attribuées. */
  function expl(l, c) { return (l.cls || []).some(function (x) { return same(x, c); }); }
  function hasSeq(c) { return all(KL).some(function (l) { return expl(l, c); }); }
  function forCls(l, c) { return !c || ((l.cls || []).length ? expl(l, c) : !hasSeq(c)); }
  function clsTxt(l) { return (l.cls || []).length ? l.cls.join(", ") : "pas encore attribuée"; }
  function setCls(l, C, on) { /* ajoute (on) ou retire les classes C de la leçon l */
    var cur0 = (l.cls || []).slice();
    C.forEach(function (c) { cur0 = cur0.filter(function (x) { return !same(x, c); }); if (on) cur0.push(c); });
    l.cls = cur0.sort(function (a, b) { return a.localeCompare(b, "fr", { numeric: true }); }); }
  var SELC = null;
  function seqs() { var S = []; lecons().forEach(function (l) { var s = l.seq || "Sans séquence"; if (S.indexOf(s) < 0) S.push(s); }); return S; }
  function titreL(l) { return (l.num ? "Leçon " + l.num + " · " : "") + (l.titre || "Leçon sans titre"); }
  function compact(l) { var o = {}; ["seq", "num", "titre", "duree"].concat(F.map(function (x) { return x[0]; })).concat(RF.map(function (x) { return x[0]; })).forEach(function (k) { if (l[k]) o[k] = l[k]; });
    if (l.echImg) o.echImg = l.echImg; o.sits = (l.sits || []).map(function (s) { var r = {}; SF.forEach(function (x) { if (s[x[0]]) r[x[0]] = s[x[0]]; }); if (s.img) r.img = s.img; if (s.ap) r.ap = s.ap; if (s.ind) r.ind = s.ind; return r; }); return o; }

  /* ---------- styles ---------- */
  function css() {
    if (document.getElementById("eplc-css")) return;
    var st = document.createElement("style"); st.id = "eplc-css";
    st.textContent = [
      ".lc-ov{position:fixed;inset:0;z-index:2147481200;background:#F5F3EE;color:#14171C;display:flex;flex-direction:column;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
      ".lc-top{display:flex;align-items:center;gap:8px;background:#14171C;color:#fff;padding:10px 14px;box-shadow:inset 0 -4px 0 " + COL + ";flex-wrap:wrap}",
      ".lc-top b{font-size:19px;margin-right:8px}.lc-top button{height:40px;border-radius:10px;border:1.5px solid #3A3F47;background:transparent;color:#D5D8DE;font:700 14px system-ui,sans-serif;padding:0 12px;cursor:pointer}",
      ".lc-top button.on{background:" + COL + ";border-color:" + COL + ";color:#fff}.lc-top .x{margin-left:auto}.lc-top button{width:auto;min-width:44px;flex:none;white-space:nowrap}",
      /* fenêtre ouverte DANS la page, sous les onglets de l'espace enseignant (inl(), modalités d'évaluation) : pas de bandeau noir, les onglets restent visibles */
      ".lc-ov.lc-inl{box-shadow:none}.lc-inl .lc-top{background:transparent;color:#14171C;box-shadow:none;padding:4px 18px 0;max-width:1100px;width:100%;box-sizing:border-box;margin:0 auto}.lc-inl .lc-top b{font-size:18px}" +
      ".lc-inl .lc-top button{border-color:#D8D2C4;background:#fff;color:#14171C}.lc-inl .lc-body .lc-in{max-width:1100px!important}.epst-tb>button.lc-act::after{content:'';position:absolute;left:14px;right:14px;bottom:0;height:3px;border-radius:3px 3px 0 0;background:var(--epst,#666)}",
      ".lc-kpi{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;margin:8px 0}.lc-kpi>div{background:#fff;border:1.5px solid #E6E1D6;border-radius:14px;padding:10px 12px;display:flex;flex-direction:column}.lc-kpi i{font-style:normal;font-size:20px}.lc-kpi b{font-size:22px}.lc-kpi span{color:#6A6F78;font-size:13px}" +
      ".lc-tab{border-collapse:collapse;background:#fff;width:100%}.lc-tab th,.lc-tab td{border-bottom:1px solid #E6E1D6;padding:7px 9px;text-align:left;vertical-align:top;font-size:14.5px}.lc-tab th{background:#FBFAF7;font-size:13px;color:#4A4F58}.lc-tab tr[data-el]:hover{background:#F5F3EE}" +
      ".lc-carte{border-collapse:collapse;background:#fff;min-width:100%}.lc-carte th,.lc-carte td{border:1px solid #E6E1D6;padding:4px 7px;text-align:center;font-size:14px}.lc-carte td:first-child,.lc-carte th:first-child{text-align:left;min-width:200px}.lc-carte td small{font-size:10px;color:#6A6F78;margin-left:2px}.lc-carte tr.vide td:first-child{background:#FDECEA}.lc-carte tr.une td:first-child{background:#FFF1BF}" +
      ".lc-au-c{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;text-align:left;border:1.5px solid #E6E1D6;background:#fff;border-radius:14px;padding:12px 14px;margin:6px 0;font:600 17px system-ui;cursor:pointer;position:relative}.lc-au-c span{font-weight:500;font-size:14.5px;color:#4A4F58}.lc-au-c i{position:absolute;right:12px;top:12px;font-style:normal}.lc-ap{border-top:1.5px dashed #E6E1D6;margin-top:8px;padding-top:6px}" +
      ".lc-body{flex:1;overflow:auto;padding:16px 18px 80px}.lc-in{max-width:1000px;margin:0 auto}",
      ".lc-st-g{display:grid;grid-template-columns:250px minmax(0,1fr) 210px;gap:18px;max-width:1600px;margin:0 auto;align-items:start}.lc-studio .lc-st-g .lc-in{max-width:none;margin:0}" +
      ".lc-st-l,.lc-st-r{position:sticky;top:0;max-height:calc(100vh - 110px);overflow:auto;background:#fff;border:1.5px solid #E6E1D6;border-radius:14px;padding:10px}" +
      ".lc-st-h{font:800 11.5px system-ui;letter-spacing:.06em;text-transform:uppercase;color:#6A6F78;margin:8px 4px 4px}" +
      ".lc-ov .lc-st-i,.lc-ov .lc-st-t{display:flex;gap:8px;align-items:center;width:100%;text-align:left;border:0;background:none;border-radius:9px;padding:7px 8px;font:600 14px system-ui;color:#14171C;cursor:pointer;min-height:36px}.lc-st-i:hover,.lc-st-t:hover{background:#F5F3EE}" +
      ".lc-st-i b{min-width:22px;color:#6A6F78}.lc-st-i span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lc-st-i i{font-style:normal}.lc-st-l,.lc-st-r{display:block!important}.lc-ov .lc-st-i.lc-cur,.lc-ov .lc-st-t.lc-cur{color:#14171C;background:" + COL + "1F;box-shadow:inset 3px 0 0 " + COL + "}",
      ".lc-ov h2{font-size:22px;margin:4px 0}.lc-ov h3{font-size:17px;margin:18px 0 8px}.lc-mut{color:#6A6F78;font-size:14px;margin:2px 0 12px}",
      ".lc-b{height:42px;border-radius:12px;border:2px solid " + COL + ";background:#fff;color:#14171C;font:800 14px system-ui,sans-serif;padding:0 14px;cursor:pointer}.lc-b.p{background:" + COL + ";color:#fff}.lc-b:disabled{opacity:.45}",
      ".lc-b.s{height:34px;border-radius:10px;font-size:13px;padding:0 10px;border-width:1.5px}.lc-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}",
      "@media (min-width:1400px){.lc-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px}.lc-cards .lc-card{margin:0}}@media (min-width:2100px){.lc-cards{grid-template-columns:repeat(3,minmax(0,1fr))}}",
      /* atelier de la console : les onglets de la barre disent déjà où l'on est (pas de titre « Fiches de leçon · … », ni titre ni phrase en tête d'écran) */
      ".lc-atel>.lc-top>b{display:none}.lc-atel .lc-in>h2:first-child,.lc-atel .lc-in>h2:first-child+p.lc-mut{display:none}",
      ".lc-card{background:#fff;border:1px solid #E6E1D6;border-left:5px solid " + COL + ";border-radius:14px;padding:12px 14px;margin:0 0 8px;display:flex;gap:10px;align-items:center;cursor:pointer}",
      ".lc-card .t{flex:1}.lc-card b{display:block;font-size:16px}.lc-card small{color:#6A6F78}",
      ".lc-tag{display:inline-block;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800;margin-left:6px}.lc-tag.br{background:#FFF1BF;color:#7A5A00}.lc-tag.ok{background:#E3F4E8;color:#1D6B3A}.lc-tag.pg{background:#E6EEF9;color:#1F4F8B}",
      ".lc-box{background:#fff;border:1px solid #E6E1D6;border-radius:16px;padding:12px 16px;margin:0 0 12px}",
      ".lc-f{display:block;margin:8px 0}.lc-f span{display:block;font-weight:800;font-size:13px;color:#6A6F78;margin:0 0 4px}",
      ".lc-f textarea,.lc-f input,.lc-sel{width:100%;box-sizing:border-box;border:2px solid #E6E1D6;border-radius:12px;padding:9px 11px;font:15px/1.4 system-ui,sans-serif;background:#FBFAF7;color:#14171C}",
      ".lc-sel{width:auto;height:42px;padding:0 10px}.lc-f textarea{min-height:58px;resize:vertical}",
      ".lc-f.ai textarea,.lc-f.ai input{background:#FFF8D6;border-color:#E9CF6A}.lc-f.ai span:after{content:' ✨ proposé par Claude : à relire';color:#9A7400;font-weight:700}",
      ".lc-g3{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0 12px}",
      ".lc-warn{background:#FFF6E0;border:1px solid #F0D58A;color:#6b4e00;border-radius:12px;padding:10px 12px;margin:8px 0;font-weight:600}",
      ".lc-img{max-width:100%;max-height:320px;border-radius:10px;border:1px solid #E6E1D6;display:block;margin:6px 0}",
      ".lc-modal{position:fixed;inset:0;z-index:2147481300;background:rgba(20,23,28,.55);display:flex;align-items:center;justify-content:center;padding:16px}",
      ".lc-modal>div{background:#fff;border-radius:18px;max-width:640px;width:100%;max-height:92vh;overflow:auto;padding:18px 20px}",
      ".lc-chip{position:fixed;right:calc(14px + env(safe-area-inset-right,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:2147481100;border:0;border-radius:999px;background:" + COL + ";color:#fff;font:800 16px system-ui,sans-serif;padding:12px 18px;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;display:none}",
      ".lc-tim{position:fixed;left:50%;transform:translateX(-50%);top:calc(8px + env(safe-area-inset-top,0px));z-index:2147481350;background:#14171C;color:#fff;border-radius:16px;padding:8px 18px;font:900 26px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.3);display:none;border:3px solid " + COL + "}",
      ".lc-tim small{display:block;font:700 13px system-ui,sans-serif;color:#C9CDD3;text-align:center}.lc-tim.end{background:#C0392B}",
      ".lc-msg{position:fixed;inset:0;z-index:2147483200;background:" + COL + ";color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6vw;text-align:center;font-family:system-ui,sans-serif}",
      ".lc-msg p{font:900 clamp(30px,6vw,68px)/1.2 system-ui,sans-serif;margin:0 0 30px;white-space:pre-wrap}.lc-msg button{height:64px;border-radius:18px;border:0;background:#fff;color:#14171C;font:900 22px system-ui;padding:0 34px}",
      ".lc-st{position:fixed;inset:0;z-index:2147481250;background:#F5F3EE;overflow:auto;font-family:system-ui,sans-serif;color:#14171C}",
      ".lc-st .hd{position:sticky;top:0;background:#14171C;color:#fff;padding:12px 16px;display:flex;gap:10px;align-items:center;box-shadow:inset 0 -4px 0 " + COL + "}",
      ".lc-st .hd b{font-size:20px;flex:1}.lc-st .hd button{height:44px;border-radius:12px;border:1.5px solid #3A3F47;background:transparent;color:#fff;font:800 15px system-ui;padding:0 14px}",
      ".lc-st .in{max-width:900px;margin:0 auto;padding:16px 16px 60px}.lc-st .bk{background:#fff;border:1px solid #E6E1D6;border-radius:16px;padding:14px 16px;margin:0 0 12px;font-size:18px;line-height:1.45}",
      ".lc-st .bk.now{border:3px solid " + COL + ";box-shadow:0 0 0 4px " + COL + "22}.lc-st .bk h3{margin:0 0 6px;font-size:20px}.lc-st .bk .k{font-weight:800;color:" + COL + ";font-size:14px;text-transform:uppercase;letter-spacing:.04em;margin-top:10px}",
      ".lc-st .now-tag{background:" + COL + ";color:#fff;border-radius:999px;padding:2px 10px;font-size:13px;margin-left:8px;vertical-align:middle}",
      ".lc-st .rang{background:#FFF6E0;border:2px solid #F0D58A}.lc-pre{white-space:pre-wrap}",
      ".lc-st .res{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px;padding-top:10px;border-top:1px dashed #E6E1D6;font:800 15px system-ui}",
      ".lc-st .res button,.lc-st .lc-who button{min-height:44px;border-radius:12px;border:2px solid #E6E1D6;background:#fff;font:800 15px system-ui;padding:0 12px;color:#14171C}",
      ".lc-st .res button.on[data-rv='2'],.res button.on[data-av='2']{background:#1E8449;border-color:#1E8449;color:#fff}.lc-st .res button.on[data-rv='1'],.res button.on[data-av='1']{background:#E67E22;border-color:#E67E22;color:#fff}.lc-st .res button.on[data-rv='0'],.res button.on[data-av='0']{background:#C0392B;border-color:#C0392B;color:#fff}",
      ".lc-st .lc-who{display:flex;gap:8px;flex-wrap:wrap}.lc-st .lc-who button.on{background:" + COL + ";border-color:" + COL + ";color:#fff}.lc-st .bk.who.need{border:3px solid #C0392B}.lc-st .bk.today{background:#F7FBFF}",
      ".lc-more{position:relative;display:inline-block}.lc-more>summary{list-style:none;display:inline-flex;align-items:center;cursor:pointer}.lc-more>summary::-webkit-details-marker{display:none}.lc-more>div{position:absolute;z-index:20;top:calc(100% + 6px);left:0;background:#fff;border:1px solid #E6E1D6;border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.16);padding:8px;display:flex;flex-direction:column;gap:6px;min-width:280px}.lc-more>div .lc-b{width:100%;text-align:left}",
      "@media print{.lc-ov .lc-top,.lc-b{display:none!important}html.lc-print body>*:not(.lc-ov){display:none!important}html.lc-print .lc-ov{position:static!important;display:block!important;height:auto!important}html.lc-print .lc-body{overflow:visible!important;height:auto!important}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* ---------- son ---------- */
  var AC = null;
  document.addEventListener("pointerdown", function () { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} }, true);
  function bip(n) { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); var t = AC.currentTime; for (var i = 0; i < (n || 3); i++) { var o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = i % 2 ? 660 : 880; o.connect(g); g.connect(AC.destination); g.gain.setValueAtTime(0.0001, t + i * 0.35); g.gain.exponentialRampToValueAtTime(0.5, t + i * 0.35 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.35 + 0.3); o.start(t + i * 0.35); o.stop(t + i * 0.35 + 0.32); } } catch (e) {} try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) {} }

  /* ---------- 🎓 voie (générale / professionnelle) : textes officiels de référence ---------- */
  function vClasse(c) { try { return window.epsVoie ? epsVoie(c) : "gt"; } catch (e) { return "gt"; } }
  function voieDe(l) { if (l && (l.voie === "pro" || l.voie === "gt")) return l.voie; var p = l && (l.prog || [])[0]; if (p && p.c) return vClasse(p.c); var c = cur(); if (c) return vClasse(c.nom); if (LIVECLS) return vClasse(LIVECLS); var C = classes(); return C.length ? vClasse(C[0]) : "gt"; }
  var VOIE_TXT = {
    gt: "VOIE GÉNÉRALE ET TECHNOLOGIQUE. Appuie-toi sur le programme d'EPS du lycée général et technologique (arrêté du 17 janvier 2019) : champs d'apprentissage et attendus de fin de lycée AFL1, AFL2, AFL3 (écris « AFL », jamais « AFLP »). Évaluation : référentiel du baccalauréat général et technologique (AFL1 sur 12 points ; AFL2 et AFL3 sur 8 points répartis 4-4, 6-2 ou 2-6 au choix de l'élève).",
    pro: "VOIE PROFESSIONNELLE (CAP / baccalauréat professionnel). Appuie-toi sur le programme d'EPS de la voie professionnelle (arrêté du 3 avril 2019) : champs d'apprentissage et attendus de fin de lycée professionnel AFLP1 à AFLP6 (écris « AFLP »). Évaluation : référentiel CCF de la voie professionnelle (circulaire du 29 décembre 2020) : situation de fin de séquence sur 12 points (AFLP1 sur 7, AFLP2 sur 5), évaluation au fil de la séquence sur 8 points (2 AFLP parmi AFLP3 à AFLP6, répartis 4-4, 6-2 ou 2-6)." };
  var VOIE_ASK = null;
  /* ---------- Claude (script commun) ---------- */
  function ask(lc) {
    if (lc && lc.op === "lecon" && lc.mode !== "inventaire") { var vv = lc.voie || VOIE_ASK || voieDe(WORK); lc.voie = vv; lc.consigne = VOIE_TXT[vv] + (lc.consigne ? "\n" + lc.consigne : ""); }
    if (!window.EPSD || !EPSD.post) return Promise.reject(new Error("Module commun indisponible"));
    return EPSD.post({ lc: lc }).then(function (r) {
      if (!r) throw new Error("Pas de réponse du script");
      if (r.error === "key") throw new Error("Clé du partage refusée par le script");
      if (r.error === "requête") throw new Error("Le script n'est pas encore à jour : colle le nouveau Code.gs et redéploie (nouvelle version)");
      if (!r.ok) throw new Error(/ANTHROPIC_KEY/.test(r.error || "") ? "Clé Claude absente du script (Propriétés du script → ANTHROPIC_KEY)" : (r.error || "erreur"));
      return r;
    }, function (e) { throw new Error("Pas de connexion au script (" + (e && e.message || e) + ")"); });
  }
  function docsFor(onlyId) {
    var D = {}; all(KD).forEach(function (p) { if (onlyId ? p.doc !== onlyId : p.use === false) return; (D[p.doc] = D[p.doc] || { nom: p.nom, parts: [] }).parts[p.part || 0] = p.txt || ""; });
    var out = [], tot = 0;
    Object.keys(D).forEach(function (k) { var t = D[k].parts.join("\n"); if (tot + t.length > 150000) t = t.slice(0, Math.max(0, 150000 - tot)); tot += t.length; if (t) out.push({ nom: D[k].nom, txt: t }); });
    return out;
  }
  /* ✋ confirmation avant tout ajout rédigé par Claude (demande de l'enseignant) : aperçu, puis « ✓ Ajouter » ou « ✕ Ne rien ajouter » */
  function aiSum(l) { var t = []; if (l.objM) t.push("🎯 " + l.objM); if (l.but) t.push("🏁 " + String(l.but).split("\n")[0]); (l.sits || []).forEach(function (x, i) { t.push("🏃 Situation " + (i + 1) + (x.t ? " · " + x.t : "") + (x.cons ? " : " + String(x.cons).slice(0, 140) + (String(x.cons).length > 140 ? "…" : "") : "")); });
    return { titre: (l.num ? "Leçon " + l.num + " · " : "") + (l.titre || l.seq || "Fiche"), lignes: t }; }
  function aiConfirm(items, o) { o = o || {}; css(); return new Promise(function (res) {
    var md = document.createElement("div"); md.className = "lc-modal"; md.style.zIndex = "2147483500";
    md.innerHTML = '<div style="max-width:760px"><h2 style="margin:0 0 4px">✋ ' + esc(o.titre || "Ajouter ce que Claude propose ?") + '</h2><p class="lc-mut" style="margin:0 0 10px">Rien n\'est enregistré tant que tu n\'as pas confirmé. Ensuite, tout reste en brouillon à relire et valider.</p>' +
      '<div style="max-height:55vh;overflow:auto">' + items.map(function (x) { return '<div class="lc-box" style="margin:0 0 8px"><b>' + esc(x.titre) + "</b>" + (x.lignes || []).map(function (y) { return '<div style="font-size:14px;margin-top:3px">' + esc(y) + "</div>"; }).join("") + "</div>"; }).join("") + "</div>" +
      '<div class="lc-row" style="margin-top:10px"><button type="button" class="lc-b p" data-y>✓ ' + esc(o.oui || "Ajouter") + '</button><button type="button" class="lc-b" data-n>✕ Ne rien ajouter</button></div></div>';
    document.body.appendChild(md); md.querySelector("[data-y]").onclick = function () { md.remove(); res(true); }; md.querySelector("[data-n]").onclick = function () { md.remove(); res(false); }; }); }
  function fromAI(base, r, keepEmpty, whole) { /* r : leçon renvoyée par Claude ; les champs remplis sont marqués « ai » ; whole = remise en forme (tout est réécrit) */
    var l = base || blank(); l.ai = l.ai || {};
    var okImg = function (id) { return id && get(KI, String(id).replace(/^\[?SCH[ÉE]MA:/i, "").replace(/\]$/, "")) ? String(id).replace(/^\[?SCH[ÉE]MA:/i, "").replace(/\]$/, "") : null; };
    if (whole) { F.concat(RF).forEach(function (x) { l[x[0]] = ""; }); var keepImg = (l.sits || []).map(function (q) { return q.img; }); l.sits = (r.sits || []).map(function (q, i) { return keepImg[i] && !q.img ? { img: keepImg[i] } : {}; }); }
    if (okImg(r.echImg) && !(keepEmpty && l.echImg)) l.echImg = okImg(r.echImg);
    ["seq", "num", "titre", "duree"].concat(F.map(function (x) { return x[0]; })).concat(RF.map(function (x) { return x[0]; })).forEach(function (k) {
      var v = r[k]; if (v == null || v === "") return; v = String(v).trim(); if (!v) return;
      if (keepEmpty && l[k]) return; if (l[k] !== v) { l[k] = v; l.ai[k] = 1; } });
    var S = Array.isArray(r.sits) ? r.sits : []; l.sits = l.sits || [];
    S.forEach(function (s, i) { var t = l.sits[i] = l.sits[i] || {}; if (s && okImg(s.img) && !(keepEmpty && t.img)) t.img = okImg(s.img); if (s && s.ap && !(keepEmpty && t.ap)) { t.ap = String(s.ap).trim(); l.ai["s" + i + ".ap"] = 1; } SF.forEach(function (x) { var v = s && s[x[0]]; if (v == null || v === "") return; v = String(v).trim(); if (!v || (keepEmpty && t[x[0]])) return; if (t[x[0]] !== v) { t[x[0]] = v; l.ai["s" + i + "." + x[0]] = 1; } }); });
    if (r.sources) l.sources = String(r.sources);
    l.statut = "brouillon"; return l;
  }

  /* ---------- extraction de texte des documents déposés ---------- */
  function loadJS(src) { return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error("chargement " + src)); }; document.head.appendChild(s); }); }
  function zip() { return window.JSZip ? Promise.resolve(window.JSZip) : loadJS(BASE + "vendor/jszip.min.js").then(function () { return window.JSZip; }); }
  function xmlTxt(x, para, tab) { return x.replace(tab || /<w:tab\/>/g, "\t").replace(para, "\n").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/\n{3,}/g, "\n\n").trim(); }
  function b64(buf) { var s = "", B = new Uint8Array(buf); for (var i = 0; i < B.length; i += 0x8000) s += String.fromCharCode.apply(null, B.subarray(i, i + 0x8000)); return btoa(s); }
  function shrink(file, max, q) { return new Promise(function (res, rej) { var im = new Image(), u = URL.createObjectURL(file); im.onload = function () { var k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL("image/jpeg", q)); }; im.onerror = function () { rej(new Error("image illisible")); }; im.src = u; }); }
  function extract(file, msg) {
    var n = file.name.toLowerCase();
    if (/\.(txt|md|csv)$/.test(n)) return file.text();
    if (/\.(docx|pptx|odt|odp)$/.test(n)) return Promise.all([zip(), file.arrayBuffer()]).then(function (a) { return a[0].loadAsync(a[1]); }).then(function (z) {
      if (/\.docx$/.test(n)) { var rf = z.file("word/_rels/document.xml.rels");
        return Promise.all([z.file("word/document.xml").async("string"), rf ? rf.async("string") : ""]).then(function (a) {
          var x = a[0], R = {}, J = [], pre = "dx" + uid(); (a[1].match(/<Relationship\b[^>]*>/g) || []).forEach(function (t) { var i = (t.match(/\bId="([^"]+)"/) || [])[1], g = (t.match(/\bTarget="([^"]+)"/) || [])[1]; if (i && g) R[i] = g; });
          x = x.replace(/<w:drawing>[\s\S]*?<\/w:drawing>|<w:pict>[\s\S]*?<\/w:pict>/g, function (d) { var r = (d.match(/r:(?:embed|id)="([^"]+)"/) || [])[1], t = r && R[r]; if (!t || !/\.(png|jpe?g|gif|bmp|webp)$/i.test(t)) return ""; var kid = pre + "-" + J.length; J.push({ kid: kid, path: "word/" + t.replace(/^\/?word\//, "") }); return "<w:t>[SCHÉMA:" + kid + "]</w:t>"; });
          return Promise.all(J.map(function (j) { var f = z.file(j.path); if (!f) return null; return f.async("blob").then(imgData).then(function (d) { put(KI, { id: j.kid, d: d }); return j.kid; }, function () { return null; }); })).then(function (ok) {
            var t = xmlTxt(x.replace(/<\/w:p>\s*<\/w:tc>/g, " | ").replace(/<\/w:tr>/g, "\n"), /<\/w:p>/g).replace(/ \| *(\n|$)/g, "$1");
            J.forEach(function (j, i) { if (!ok[i]) t = t.split("[SCHÉMA:" + j.kid + "]").join(""); }); if (ok.filter(Boolean).length) msg("« " + file.name + " » : " + ok.filter(Boolean).length + " schéma(s) repris."); return t; }); }); }
      if (/\.(odt|odp)$/.test(n)) return z.file("content.xml").async("string").then(function (x) { return xmlTxt(x, /<\/text:(p|h)>/g, /<text:tab\/>/g); });
      var S = Object.keys(z.files).filter(function (k) { return /^ppt\/slides\/slide\d+\.xml$/.test(k); }).sort(function (a, b) { return parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")); });
      return Promise.all(S.map(function (k) { return z.file(k).async("string"); })).then(function (L) { return L.map(function (x, i) { return "--- Diapositive " + (i + 1) + " ---\n" + xmlTxt(x, /<\/a:p>/g, /<a:tab\/>/g); }).join("\n\n"); });
    });
    if (/\.pdf$/.test(n) || /^image\//.test(file.type)) {
      if (file.size > 9e6) return Promise.reject(new Error("fichier trop lourd (9 Mo au plus) : coupe-le en plusieurs PDF"));
      msg("Claude lit « " + file.name + " » (peut prendre une minute)…");
      var p = /\.pdf$/.test(n) ? file.arrayBuffer().then(function (b) { return { mime: "application/pdf", b64: b64(b) }; })
        : shrink(file, 1800, 0.85).then(function (d) { return { mime: "image/jpeg", b64: d.split(",")[1] }; });
      return p.then(function (o) { return ask({ op: "transcrire", act: NOM, nom: file.name, mime: o.mime, b64: o.b64 }); }).then(function (r) { return r.texte || ""; });
    }
    return Promise.reject(new Error("format non lu (docx, pptx, odt, pdf, txt ou photo)"));
  }
  function imgData(blob) { return new Promise(function (res, rej) { (function go(max, q) { shrink(blob, max, q).then(function (d) { if (d.length > 30000 && max > 240) return go(Math.round(max * 0.8), Math.max(0.35, q - 0.08)); res(d); }, rej); })(900, 0.8); }); }
  function saveDoc(nom, txt, type) {
    var id = uid(), CH = 26000, n = Math.max(1, Math.ceil(txt.length / CH));
    for (var i = 0; i < n; i++) put(KD, { id: id + "." + i, doc: id, nom: nom, type: type || "", part: i, of: n, txt: txt.slice(i * CH, (i + 1) * CH), use: true, cr: Date.now() });
    return id;
  }
  function docList() { var D = {}; all(KD).forEach(function (p) { var d = D[p.doc] = D[p.doc] || { id: p.doc, nom: p.nom, type: p.type, n: 0, use: p.use !== false, cr: p.cr || 0, parts: [] }; d.n += (p.txt || "").length; d.parts.push(p); }); return Object.keys(D).map(function (k) { return D[k]; }).sort(function (a, b) { return b.cr - a.cr; }); }

  /* ================= espace enseignant ================= */
  var OV = null, TAB = "lec", EDIT = null, LIVECLS = null;
  var ATEL = /[?&]console=lecons/.test(location.search); /* atelier de la console : les fiches SONT la page, rien à fermer */
  function open(tab, arg) {
    css(); seedApp(); TAB = tab || "lec"; EDIT = null;
    if (tab === "edit") { TAB = "lec"; EDIT = arg; }
    if (tab === "live" && arg) LIVECLS = arg;
    LIVEMIN = false; /* « Plus » d'un écran de suivi (EPSLC.plus) : remis à faux par toute autre ouverture */
    if (!OV) { OV = document.createElement("div"); OV.className = "lc-ov" + (ATEL ? " lc-atel" : ""); document.body.appendChild(OV); }
    OV.style.display = "flex"; draw();
  }
  var ONCLOSE = null; /* à la fermeture des fiches : l'écran qui les a ouvertes se redessine (📅 Leçons du jour de l'onglet Évaluer) */
  function close() { try { saveEdit(); } catch (e) {} if (OV) { OV.style.display = "none"; OV.innerHTML = ""; } EDIT = null; if (ONCLOSE) { var f = ONCLOSE; ONCLOSE = null; try { f(); } catch (e) { console.warn(e); } } }
  function shell(body) {
    OV.innerHTML = '<div class="lc-top"><b>📝 Fiches de leçon · ' + esc(NOM) + '</b>' +
      [["lec", "📝 Fiches de leçon"], ["docs", "📂 Mes documents"], ["live", "📡 Leçon en cours"], ["eval", "📊 Évaluer la leçon"], ["bil", "🏁 Bilan de séquence"]].map(function (t) { return '<button type="button" data-tab="' + t[0] + '"' + (TAB === t[0] ? ' class="on"' : "") + ">" + t[1] + "</button>"; }).join("") +
      (ATEL ? "" : '<button type="button" class="x" data-x>✕ Fermer</button>') + '</div><div class="lc-body"><div class="lc-in">' + body + "</div></div>";
    var bx = OV.querySelector("[data-x]"); if (bx) bx.onclick = close;
    OV.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { saveEdit(); TAB = b.dataset.tab; EDIT = null; draw(); }; });
    return OV.querySelector(".lc-in");
  }
  function draw() { if (!OV || OV.style.display === "none") return; if (TAB === "docs") return drawDocs(); if (TAB === "live") return drawLive(); if (TAB === "eval") return drawLEval(); if (TAB === "bil") return drawBilan(); if (EDIT) { drawEdit(); studio(); return; } drawList(); }

  /* 🖥 atelier sur grand écran (≥ 1200 px : ordinateur, console) : liste des fiches à gauche (on passe d'une leçon à l'autre sans
     revenir en arrière), fiche au centre, sommaire à droite (aller directement à une partie, valider) — au lieu d'une longue page seule */
  function studio() {
    if (!OV || window.innerWidth < 1200) { if (OV) OV.classList.remove("lc-studio"); return; }
    var body = OV.querySelector(".lc-body"), inn = OV.querySelector(".lc-in"); if (!body || !inn) return;
    OV.classList.add("lc-studio");
    var L = lecons(), S = [], ls = document.createElement("div"), toc = document.createElement("div"); ls.className = "lc-st-l"; toc.className = "lc-st-r"; toc.setAttribute("role", "navigation"); toc.setAttribute("aria-label", "Sommaire de la fiche");
    L.forEach(function (l) { var q = l.seq || "Sans séquence"; if (S.indexOf(q) < 0) S.push(q); });
    ls.innerHTML = '<div class="lc-row" style="margin:0 0 8px"><button type="button" class="lc-b s p" data-stnew>＋ Nouvelle leçon</button></div>' + S.map(function (q) { return '<div class="lc-st-h">' + esc(q) + "</div>" + L.filter(function (l) { return (l.seq || "Sans séquence") === q; }).map(function (l) {
      return '<button type="button" class="lc-st-i' + (l.id === EDIT ? " lc-cur" : "") + '" data-stl="' + esc(l.id) + '"><b>' + esc(l.num || "·") + "</b><span>" + esc(l.titre || "Leçon sans titre") + "</span>" + (l.statut === "brouillon" ? '<i title="brouillon">✨</i>' : "") + "</button>"; }).join(""); }).join("");
    var boxes = Array.prototype.filter.call(inn.querySelectorAll(".lc-box"), function (b) { return b.querySelector("h3") || b === inn.querySelector(".lc-box"); });
    toc.innerHTML = '<div class="lc-st-h">Sommaire</div>' + boxes.map(function (b, i) { var h = b.querySelector("h3"); return '<button type="button" class="lc-st-t" data-sto="' + i + '">' + esc(h ? h.textContent.replace(/✕ Retirer/, "").trim() : "📋 En-tête") + "</button>"; }).join("") +
      '<div class="lc-st-h" style="margin-top:14px">Actions</div><div data-stact></div>';
    var grid = document.createElement("div"); grid.className = "lc-st-g"; body.innerHTML = ""; grid.appendChild(ls); grid.appendChild(inn); grid.appendChild(toc); body.appendChild(grid);
    /* boutons d'action de la fiche (valider, Claude, programmer…) repris dans le sommaire : toujours à portée */
    var act = toc.querySelector("[data-stact]");
    ["[data-ok]", "[data-fill]", "[data-refmt]", "[data-modfill]", "[data-print]", "[data-see]", "[data-launch]", "[data-dup]", "[data-modsave]", "[data-unok]"].map(function (q) { return inn.querySelector(q); }).filter(Boolean).forEach(function (b) { var c = document.createElement("button"); c.type = "button"; c.className = "lc-st-t"; c.textContent = b.textContent; c.onclick = function () { b.scrollIntoView({ block: "center" }); b.click(); }; act.appendChild(c); });
    ls.querySelectorAll("[data-stl]").forEach(function (b) { b.onclick = function () { saveEdit(); EDIT = b.dataset.stl; draw(); OV.querySelector(".lc-body").scrollTop = 0; }; });
    ls.querySelector("[data-stnew]").onclick = function () { saveEdit(); var last = L[L.length - 1], l = fromModel(last ? last.seq || "" : ""); l.cr = Date.now(); l.num = String(L.filter(function (x) { return x.seq === l.seq; }).length + 1); put(KL, l); EDIT = l.id; draw(); };
    var T = toc.querySelectorAll("[data-sto]");
    T.forEach(function (b) { b.onclick = function () { var x = boxes[+b.dataset.sto]; body.scrollTo({ top: x.offsetTop - 10, behavior: "smooth" }); }; });
    body.onscroll = function () { var y = body.scrollTop + 60, k = 0; boxes.forEach(function (x, i) { if (x.offsetTop <= y) k = i; }); T.forEach(function (b, i) { b.classList.toggle("lc-cur", i === k); }); };
    body.onscroll();
  }
  /* console ordinateur, section « 📝 Leçons » : l'appli s'ouvre directement sur les fiches (…/?console=lecons) */
  if (/[?&]console=lecons/.test(location.search) && !VUE) (function w(n) { if (window.EPSD && document.body) { var pm = location.search.match(/[?&]prog=([^&]+)/); if (pm) SELC = [decodeURIComponent(pm[1])]; open("lec"); if (pm) setTimeout(function () { var bx = OV && OV.querySelector("[data-apbox]"); if (bx) { autoProg(bx); bx.scrollIntoView({ block: "start" }); } }, 300); return; } if (n < 40) setTimeout(function () { w(n + 1); }, 150); })(0);
  /* ================= 🏫 Ma classe (vue d'ensemble d'une classe dans l'activité) =================
     EPSCL : vue générale (leçons faites, présence, réussite, évaluations), élèves (général et par leçon), bilans et avis
     par séquence / année / trimestre / dates, avis de bilan ou appréciations de bulletin (positives) proposés par Claude
     sans aucun nom, relus et validés (eps.avis.v1, « av| »). Ouvert depuis 📅 Séquence, ou la console (…/?console=classe&cls=). */
  var KAV = "eps.avis.v1";
  function evInit() { ["evvol", "evdan"].forEach(function (f) { try { if (typeof window[f] === "function") window[f](); } catch (e) {} }); }
  function schoolYear() { var d = new Date(), y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return y; }
  function trim(n) { var y = schoolYear(), p = function (Y, m, j) { return Y + "-" + String(m).padStart(2, "0") + "-" + String(j).padStart(2, "0"); };
    return n === 1 ? [p(y, 9, 1), p(y, 11, 30)] : n === 2 ? [p(y, 12, 1), p(y + 1, 2, new Date(y + 1, 2, 0).getDate())] : n === 3 ? [p(y + 1, 3, 1), p(y + 1, 7, 10)] : [p(y, 8, 20), p(y + 1, 7, 10)]; }
  function dayOf(t) { var d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function fr(d) { return d ? d.split("-").reverse().join("/") : ""; }
  function inst(cls) { evInit(); var I = window.EPSE_INST || []; for (var i = 0; i < I.length; i++) { try { if (typeof I[i].A.classes === "function" && (I[i].A.classes() || []).some(function (c) { return same(c.nom, cls); })) return I[i]; } catch (e) {} } return I[0] || null; }
  /* P = {kind:'seq'|'dates', seq, from, to} */
  function inP(P, day, lecId) { if (P.kind === "seq") { if (!lecId) return false; var l = get(KL, lecId); return !!l && (l.seq || "Sans séquence") === P.seq; } return (!P.from || day >= P.from) && (!P.to || day <= P.to); }
  function classData(cls, P) {
    var R = roster(cls), X = inst(cls), now = Date.now();
    var LS = lecons().filter(function (l) { return l.statut !== "brouillon" && forCls(l, cls) && (P.kind !== "seq" || (l.seq || "Sans séquence") === P.seq); });
    var EVL = all(KE).filter(function (o) { return same(o.cls, cls) && (P.kind === "seq" ? inP(P, o.day, o.lec) : inP(P, o.day)); });
    var RES = all(KS).filter(function (o) { return same(o.cls, cls) && (P.kind !== "seq" ? inP(P, o.day) : true); });
    var seqIds = P.kind === "seq" ? LS.map(function (l) { return l.id; }) : null, keyOk = function (k) { if (/@auto$/.test(k)) return false; return !seqIds || seqIds.indexOf(String(k).split(":")[0]) >= 0; };
    var AP = []; try { var AV = jget("eps.appel.v1", {}); Object.keys((AV && AV.items) || {}).forEach(function (id) { var o = AV.items[id]; if (!o || o.del) return; var p = id.split("|"); if (nn(p[0]) !== nn(cls)) return; AP.push({ day: p[1], abs: o.abs || [] }); }); } catch (e) {}
    /* leçons faites : jours avec appel, évaluation de leçon ou résultats ; leçon programmée ce jour-là */
    var days = {}; AP.forEach(function (a) { days[a.day] = days[a.day] || {}; days[a.day].abs = a.abs; }); EVL.forEach(function (o) { days[o.day] = days[o.day] || {}; days[o.day].ev = o; }); RES.forEach(function (o) { if (Object.keys(o.r || {}).some(keyOk)) { days[o.day] = days[o.day] || {}; (days[o.day].res = days[o.day].res || []).push(o); } });
    LS.forEach(function (l) { (l.prog || []).forEach(function (p) { if (!same(p.c, cls) || p.at > now) return; var d = dayOf(p.at); if (P.kind !== "seq" && !inP(P, d)) return; days[d] = days[d] || {}; days[d].lec = l; }); });
    Object.keys(days).forEach(function (d) { var x = days[d]; if (!x.lec && x.ev && x.ev.lec) x.lec = get(KL, x.ev.lec); if (!x.lec && x.res) { var k = Object.keys(x.res[0].r || {}).filter(keyOk)[0]; if (k) x.lec = get(KL, String(k).split(":")[0]); }
      if (P.kind === "seq" && !(x.lec && (x.lec.seq || "Sans séquence") === P.seq)) delete days[d]; else if (P.kind !== "seq" && !inP(P, d)) delete days[d]; });
    var D = Object.keys(days).sort(), RM = all(KRM).filter(function (r) { return r.app === APP && same(r.cls, cls) && (P.kind === "seq" || inP(P, dayOf(r.at))); });
    var OB = []; try { OB = (window.EPSOB ? EPSOB._all() : []).filter(function (o) { return o.app === APP && same(o.cls, cls) && (P.kind === "seq" ? !!days[o.day] : inP(P, o.day)); }); } catch (e) {}
    var EL = R.map(function (n) { var k = ekey(n), E = null, pr = null, comm = "", ap = null, st = "";
      if (X && typeof X.A.classes === "function") try { var c = (X.A.classes() || []).filter(function (c) { return same(c.nom, cls); })[0]; E = c ? window.epsMatchNom(c.eleves, n, function (e) { var m = X.A.name(e); return (m.prenom || "") + " " + (m.nom || ""); }) : null;
        if (E) { pr = X.M.prop(E, cls); comm = (X.A.comment && X.A.comment(E)) || ""; ap = X.A.getAp && X.A.getAp(E); st = (X.A.absent && X.A.absent(E)) || ""; } } catch (e) {}
      var L = D.map(function (d) { var x = days[d], abs = (x.abs || []).some(function (a) { return ekey(a) === k; }), ev = x.ev && x.ev.el ? x.ev.el[k] : null, rs = {};
        (x.res || []).forEach(function (o) { if (o.ek !== k) return; Object.keys(o.r || {}).filter(keyOk).forEach(function (q) { rs[q] = o.r[q]; }); });
        return { d: d, lec: x.lec, abs: abs, ev: ev, rs: rs, ob: OB.filter(function (o) { return o.day === d && ekey(o.el) === k; }) }; });
      var evs = [], rv = [0, 0], nAbs = 0; L.forEach(function (x) { if (x.abs) nAbs++; if (x.ev) { var v = ["p", "s", "t"].filter(function (q) { return x.ev[q] != null; }).map(function (q) { return +x.ev[q]; }); if (v.length) evs.push(v.reduce(function (a, b) { return a + b; }, 0) / v.length); } Object.keys(x.rs).forEach(function (q) { rv[0] += x.rs[q] === 2 ? 1 : x.rs[q] === 1 ? .5 : 0; rv[1]++; }); });
      var rm = RM.filter(function (r) { return ekey(r.el) === k; });
      return { n: n, k: k, E: E, pr: pr, comm: comm, ap: ap, st: st, L: L, nAbs: nAbs, le: evs.length ? evs.reduce(function (a, b) { return a + b; }, 0) / evs.length : null, nle: evs.length, sit: rv[1] ? rv[0] / rv[1] : null, nsit: rv[1], rm: rm, ob: OB.filter(function (o) { return ekey(o.el) === k; }) }; });
    return { cls: cls, P: P, D: D, days: days, EL: EL, X: X, grid: X ? (function () { try { return X.A.grid(); } catch (e) { return null; } })() : null };
  }
  function isTerm(c) { c = String(c || ""); try { if (window.EPSD && EPSD.demo && same(c, EPSD.demo.nom)) return true; } catch (e) {} /* classe fictive : pour voir l'onglet en simulation */
    return /^\s*T(?!\d)/i.test(c) || /terminale/i.test(c); }
  function pcs(x) { return x == null ? "—" : Math.round(x * 100) + " %"; }
  function n20(x) { return x == null ? "—" : String(Math.round(x * 4) / 4).replace(".", ","); }
  function factsOf(D, e) { /* faits pour Claude, sans aucun nom (prénoms des camarades remplacés) */
    var fs = roster(D.cls).map(function (x) { return x.split(" ")[0]; }), t = ["Activité : " + NOM, "Période : " + perLabel(D.P)];
    if (e.st) t.push("Statut à l'évaluation : " + e.st);
    if (e.pr && e.pr.note != null) t.push("Note proposée : " + n20(e.pr.note) + "/20");
    if (e.pr && e.pr.afl) t.push("Positionnement : " + e.pr.afl.filter(function (a) { return a.deg != null; }).map(function (a) { return a.code + " degré " + (a.deg + 1) + "/4"; }).join(" ; "));
    if (e.le != null) t.push("Évaluations de leçon (participation, sérieux, thème) : " + String(Math.round(e.le * 10) / 10).replace(".", ",") + "/3 sur " + e.nle + " leçon(s)");
    if (e.sit != null) t.push("Situations des leçons : " + pcs(e.sit) + " de réussite sur " + e.nsit + " résultat(s)");
    t.push("Présence : " + (D.D.length - e.nAbs) + " leçon(s) sur " + D.D.length);
    if (e.rm.length) t.push("Remédiation en autonomie : " + e.rm.length + " situation(s) proposée(s), " + e.rm.filter(function (r) { return r.st === 3; }).length + " réussie(s)");
    if (e.comm) t.push("Commentaire du professeur : " + e.comm);
    if (e.ap && (e.ap.r || e.ap.reussi)) t.push("L'élève dit avoir réussi : " + (e.ap.r || e.ap.reussi));
    if (e.ap && (e.ap.m || e.ap.ameliorer)) t.push("L'élève veut améliorer : " + (e.ap.m || e.ap.ameliorer));
    if (e.ob.length) t.push("Observations du professeur : " + e.ob.slice(-8).map(function (o) { var x = o.txt; fs.forEach(function (f) { if (f) x = x.replace(new RegExp("\\b" + f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi"), "un camarade"); }); return x; }).join(" ; "));
    return t.join("\n"); }
  function perLabel(P) { return P.kind === "seq" ? "séquence « " + P.seq + " »" : P.lab || ("du " + fr(P.from) + " au " + fr(P.to)); }
  /* ================= 🧭 Pilotage de leçon, ancienne « tablette de contrôle » (commun à toutes les activités) =================
     Retour en direct sur l'activité des élèves de la classe, actualisé toutes les 8 s à partir des données partagées :
     appel, tablettes actives, résultats des situations du jour (eps.lecres), remédiation (eps.remed.v1), observations (eps.obs.v1),
     groupes du jour. Lecture seule : le pilotage reste dans 📡 Leçon en cours. */
  function ctlSeuil() { var v = 40; try { v = +(window.EPSP ? EPSP.p({ id: "ctl_seuil", sec: "Pilotage de leçon", label: "« À reprendre » quand la part de ❌ dépasse (%)", type: "number", def: 40 }) : 40); } catch (e) {} return (isFinite(v) ? v : 40) / 100; }
  /* ⚡ Repères rapides (icônes) posés depuis le pilotage de leçon : eps.ico.v1 (iq|), id = classe|jour|appli,
     {cls, day, app, el:{<clé élève>:[{i:"👕 Tenue oubliée", t}]}} ; palette réglable (paramètre ctl_icones). Lus par le référentiel (eps-ref.js). */
  var KQ = "eps.ico.v1";
  function icoList() { var d = ["👕 Tenue oubliée", "🎒 Matériel oublié", "🤝 Entraide", "💡 Initiative", "👏 Effort remarquable", "🔔 Rappel au calme"]; try { var v = window.EPSP ? EPSP.p({ id: "ctl_icones", sec: "Pilotage de leçon", label: "Repères rapides : une icône puis son intitulé, un par ligne", type: "list", def: d }) : d; return (v || d).map(function (x) { return String(x).trim(); }).filter(Boolean); } catch (e) { return d; } }
  function icoRec(cls, day) { var id = nn(cls) + "|" + day + "|" + APP, r = get(KQ, id); if (!r || typeof r.el !== "object" || !r.el) r = { id: id, cls: cls, day: day, app: APP, el: {} }; return r; }
  function icoOf(cls, n, day) { var x = icoRec(cls, day || today()).el[ekey(n)]; return Array.isArray(x) ? x : []; }
  function icoEmo(l) { return String(l || "").trim().split(/\s+/)[0] || "•"; }
  function icoPop(cls, n, after) { var old = document.getElementById("lc-ico"); if (old) old.remove(); var m = document.createElement("div"); m.id = "lc-ico"; m.style.cssText = "position:fixed;inset:0;z-index:2147483200;background:rgba(20,23,28,.55);display:flex;align-items:center;justify-content:center;padding:14px";
    function shut() { m.remove(); if (after) after(); }
    function draw() { var L = icoList(), T = icoOf(cls, n);
      m.innerHTML = '<div role="dialog" aria-modal="true" aria-label="Repères rapides" style="background:#fff;border-radius:16px;padding:16px 18px;max-width:560px;width:100%;max-height:90vh;overflow:auto"><h2 style="margin:0 0 4px;font:800 20px system-ui">⚡ ' + esc(n) + '</h2><p class="lc-mut" style="margin:0 0 10px">Un appui = un repère daté d\'aujourd\'hui.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">' + L.map(function (l, i) { return '<button type="button" data-i="' + i + '" style="min-height:64px;border-radius:14px;border:1.5px solid #E6E1D6;background:#FBFAF7;font:700 15px system-ui;padding:6px 8px"><span style="font-size:24px;display:block">' + esc(icoEmo(l)) + "</span>" + esc(l.replace(icoEmo(l), "").trim()) + "</button>"; }).join("") + "</div>" +
        '<p style="font:800 14px system-ui;margin:14px 0 6px">Aujourd\'hui</p>' + (T.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap">' + T.map(function (x, j) { return '<button type="button" data-rm="' + j + '" aria-label="Retirer ' + esc(x.i) + '" style="min-height:40px;border-radius:999px;border:1.5px solid #E6E1D6;background:#fff;font:700 14px system-ui;padding:0 12px">' + esc(x.i) + " ✕</button>"; }).join("") + "</div>" : '<p class="lc-mut" style="margin:0">Aucun repère.</p>') +
        '<div class="lc-row" style="margin-top:14px"><button type="button" class="lc-b" data-undo' + (T.length ? "" : " disabled") + '>↩ Annuler le dernier</button><span style="flex:1"></span><button type="button" class="lc-b p" data-x>✕ Fermer</button></div></div>';
      m.querySelector("[data-x]").onclick = shut;
      m.querySelectorAll("[data-i]").forEach(function (b) { b.onclick = function () { var r = icoRec(cls, today()), k = ekey(n); (r.el[k] = Array.isArray(r.el[k]) ? r.el[k] : []).push({ i: L[+b.dataset.i], t: Date.now() }); put(KQ, r); draw(); }; });
      var del1 = function (j) { var r = icoRec(cls, today()), k = ekey(n); if (Array.isArray(r.el[k])) { r.el[k].splice(j, 1); put(KQ, r); } draw(); };
      m.querySelectorAll("[data-rm]").forEach(function (b) { b.onclick = function () { del1(+b.dataset.rm); }; }); m.querySelector("[data-undo]").onclick = function () { del1(T.length - 1); }; }
    m.addEventListener("click", function (e) { if (e.target === m) shut(); }); document.body.appendChild(m); draw(); }
  /* nom d'un groupe du jour : celui de sa zone quand les groupes viennent du 🗺 plan de terrain (v.grp.nm), sinon « Groupe n » */
  function gNom(v, i) { var n = v && v.grp && Array.isArray(v.grp.nm) ? v.grp.nm[i] : ""; return n ? String(n) : "Groupe " + (i + 1); }
  function ctlNum(id, label, def) { var v = def; try { v = +(window.EPSP ? EPSP.p({ id: id, sec: "Pilotage de leçon", label: label, type: "number", def: def }) : def); } catch (e) {} return isFinite(v) && v >= 0 ? v : def; }
  /* 🧭 Pilotage de leçon (ancienne « tablette de contrôle », renommée et triée le 27/11/2026). Trois étages, toujours dans cet ordre :
     1 · ce qui demande l'enseignant : ✋ appels des élèves (EPSD.appels, eps-home.js) et alertes de sécurité de l'appli ;
     2 · la classe : une carte par élève, UNE ligne, couleur = état (🆘 en échec, ⏳ inactif, ✅ en réussite, en cours, absent), filtres ;
     3 · le détail d'un élève dans une petite fenêtre (ctlDet), jamais sur la carte. Les chiffres d'ensemble sont repliés (📊).
     Une appli dit qui est en échec avec window.epsCtlAlerts(classe) → [{n:"nom de l'élève", niv:"echec"|"secu"|"ok"|"", t:"ligne courte",
     d:["lignes de détail"], at: date (ms) de sa dernière action}] ; sans cela : ❌ des situations (ctl_echec_n) et inactivité (ctl_inactif_min). */
  var CTL_F = "tous", CTL_VUE = false, CTL_XA = true;
  var CTL_ST = { echec: ["🆘", "En échec", "#B4232B", "#FDECEC"], inactif: ["⏳", "Inactifs", "#B45F06", "#FFF4DC"], cours: ["🏃", "En cours", "#6A6F78", "#fff"], ok: ["✅", "En réussite", "#1D6B3A", "#E3F4E8"], abs: ["🚫", "Absents", "#6A6F78", "#F5F3EE"] };
  function ctlDet(cls, e, SL, after) { var old = document.getElementById("lc-det"); if (old) old.remove(); var m = document.createElement("div"); m.id = "lc-det"; m.style.cssText = "position:fixed;inset:0;z-index:2147483200;background:rgba(20,23,28,.55);display:flex;align-items:center;justify-content:center;padding:14px";
    var S = CTL_ST[e.st], L = [];
    if (e.x && e.x.t) L.push("<b>" + esc(e.x.t) + "</b>"); (e.x && Array.isArray(e.x.d) ? e.x.d : []).forEach(function (t) { L.push(esc(t)); });
    if (SL.length) SL.forEach(function (s) { var x = e.r[s.k]; L.push((x == null ? "·" : RES_I[x]) + " " + esc(s.t)); }); else if (e.ks.length) L.push(e.ks.map(function (q) { return RES_I[e.r[q]]; }).join(" "));
    if (e.au) L.push("🎯 " + e.au + " résultat" + (e.au > 1 ? "s" : "") + " en autonomie");
    e.rm.forEach(function (r) { L.push("🎯 " + esc(r.tag || "remédiation") + " (" + REC_ST[r.st || 0] + ")"); });
    e.ob.slice(-3).forEach(function (x) { L.push("👁 " + esc(x.txt)); });
    if (e.ic.length) L.push(e.ic.map(function (x) { return esc(x.i); }).join(" · "));
    m.innerHTML = '<div role="dialog" aria-modal="true" aria-label="Détail de l\'élève" style="background:#fff;border-radius:16px;padding:16px 18px;max-width:520px;width:100%;max-height:90vh;overflow:auto"><h2 style="margin:0 0 6px;font:800 20px system-ui">' + esc(e.n) + ' <span class="lc-tag" style="background:' + S[3] + ";color:" + S[2] + ';border:1px solid ' + S[2] + '">' + S[0] + " " + esc(e.st === "abs" ? "Absent" : S[1].replace(/s$/, "")) + "</span></h2>" +
      (e.call ? '<p style="background:#FDECEC;border-radius:10px;padding:8px;margin:0 0 8px;font-weight:700">✋ ' + esc(e.call.motif) + "</p>" : "") +
      (L.length ? L.map(function (t) { return '<p style="margin:4px 0;font-size:15px">' + t + "</p>"; }).join("") : '<p class="lc-mut" style="margin:0">Rien de noté aujourd\'hui.</p>') +
      '<div class="lc-row" style="margin-top:14px">' + (e.st === "abs" ? "" : '<button type="button" class="lc-b" data-ico>⚡ Repères rapides</button>') + '<span style="flex:1"></span><button type="button" class="lc-b p" data-x>✕ Fermer</button></div></div>';
    function shut() { m.remove(); if (after) after(); }
    m.querySelector("[data-x]").onclick = shut; var bi = m.querySelector("[data-ico]"); if (bi) bi.onclick = function () { m.remove(); icoPop(cls, e.n, after); };
    m.addEventListener("click", function (ev) { if (ev.target === m) shut(); }); document.body.appendChild(m); }
  /* ⏱ Chrono d'un élève sur sa carte (demande de l'enseignant, 27/11/2026, Cross-training : le timer du WOD sous le nom, avec ce que fait l'élève).
     Une appli le donne dans epsCtlAlerts : tm = {e: ms écoulées à l'envoi, at: heure de l'envoi, s: durée en s (0 = libre), up: 1 chrono montant,
     run: 1 s'il tourne, lab: étiquette (Travail, Repos…), col: couleur}. La carte garde alors le nom, le chrono, puis la ligne t sur 2 lignes au plus.
     Le chrono avance à la seconde entre deux relevés (ctlTmTick), sans redessiner la fenêtre. */
  function ctlTmTxt(tm, now) { var e = ((+tm.e || 0) + (tm.run ? Math.max(0, now - (+tm.at || now)) : 0)) / 1000, s = tm.up || !tm.s ? e : Math.max(0, Math.ceil(tm.s - e)); s = Math.max(0, Math.floor(s));
    return (s >= 3600 ? Math.floor(s / 3600) + ":" + ("0" + Math.floor(s % 3600 / 60)).slice(-2) : Math.floor(s / 60)) + ":" + ("0" + s % 60).slice(-2); }
  function ctlTm(tm) { var c = /^#[0-9a-f]{3,8}$/i.test(tm.col || "") ? tm.col : "#14171C";
    return '<span style="display:flex;align-items:center;gap:6px;margin:3px 0 2px"><span data-tm="' + esc(JSON.stringify({ e: +tm.e || 0, at: +tm.at || 0, s: +tm.s || 0, up: tm.up ? 1 : 0, run: tm.run ? 1 : 0 })) + '" style="font:800 22px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.5px;color:#14171C">' + ctlTmTxt(tm, Date.now()) + '</span><span style="font:800 11px system-ui;text-transform:uppercase;color:#fff;background:' + c + ';border-radius:999px;padding:2px 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%">' + esc(tm.lab || "") + "</span></span>"; }
  function ctlTmTick(ov) { var now = Date.now(); [].forEach.call(ov.querySelectorAll("[data-tm]"), function (n) { try { var t = ctlTmTxt(JSON.parse(n.getAttribute("data-tm")), now); if (n.textContent !== t) n.textContent = t; } catch (e) {} }); }
  function ctlOpen(o) { css(); o = o || {};
    var C = classes(), lv = all(KV).filter(function (v) { return v.on; })[0], cls = o.cls || (lv && lv.cls) || (cur() && cur().nom) || edtClass() || C[0] || "", T = null;
    var ov = document.getElementById("lc-ctl"); if (!ov) { ov = document.createElement("div"); ov.id = "lc-ctl"; ov.className = "lc-ov"; document.body.appendChild(ov); } ov.style.display = "flex"; ov.style.zIndex = "2147483100";
    if (ov._t) clearInterval(ov._t); if (ov._h) window.removeEventListener("eps-appels", ov._h);
    function close() { ov.style.display = "none"; clearInterval(T); window.removeEventListener("eps-appels", ov._h); }
    function draw() { if (ov.style.display === "none") { clearInterval(T); return; }
      var R = roster(cls), d = today(), v = live(cls), lec = v && v.on && v.lec ? get(KL, v.lec) : null, SL = lec ? sitList(lec) : [], now = Date.now(), on = !!(v && v.on);
      var res = {}, lastU = {}; all(KS).filter(function (x) { return same(x.cls, cls) && x.day === d; }).forEach(function (x) { res[x.ek] = Object.assign(res[x.ek] || {}, x.r || {}); lastU[x.ek] = Math.max(lastU[x.ek] || 0, x.u || 0); });
      var obs = []; try { var OV = jget("eps.obs.v1", {}); Object.keys((OV && OV.items) || {}).forEach(function (k) { var x = OV.items[k]; if (x && !x.del && same(x.cls, cls) && x.day === d && (!x.app || x.app === APP)) obs.push(x); }); } catch (e) {}
      var tabs = []; try { tabs = (EPSD.tabList(APP) || []).filter(function (t) { return Date.now() - t.at < 5 * 6e4; }); } catch (e) {}
      /* ce que l'appli sait de chaque élève : rattaché à la liste par le nom entier, sinon par un prénom porté par un seul élève */
      var XL = []; try { if (typeof window.epsCtlAlerts === "function") XL = window.epsCtlAlerts(cls) || []; } catch (e) { XL = []; } if (!Array.isArray(XL)) XL = [];
      var RK = R.map(function (n) { return ekey(n); }), XM = {}; XL.forEach(function (a) { if (!a || !a.n) return; var k = ekey(a.n), w = k.split(" "); if (RK.indexOf(k) >= 0) { XM[k] = a; return; }
        var c = RK.filter(function (r) { var t = r.split(" "); return w.length && w.every(function (x) { return t.indexOf(x) >= 0; }); }); if (c.length === 1 && !XM[c[0]]) XM[c[0]] = a; });
      var CA = []; try { CA = (window.EPSD && EPSD.appels ? EPSD.appels.list(APP) : []); } catch (e) {} var CK = {}; CA.forEach(function (c) { (c.who || []).forEach(function (n) { if (!c.cls || same(c.cls, cls)) CK[ekey(n)] = c; }); });
      var nE = ctlNum("ctl_echec_n", "« En échec » à partir de combien de ❌ dans la leçon", 2), nI = ctlNum("ctl_inactif_min", "« Inactif » après combien de minutes sans rien noter (0 = jamais)", 10), suivi = XL.length || Object.keys(res).length;
      var EL = R.map(function (n) { var k = ekey(n), r = res[k] || {}, ks = Object.keys(r).filter(function (q) { return !/@auto$/.test(q); }), au = Object.keys(r).filter(function (q) { return /@auto$/.test(q); });
        var ok = ks.filter(function (q) { return r[q] === 2; }).length, ko = ks.filter(function (q) { return r[q] === 0; }).length, rm = recsOf(cls, n).filter(function (x) { return (x.st || 0) < 3; }), x = XM[k] || null, abs = isAbs(cls, n), disp = false;
        try { disp = !!(window.EPSD && EPSD.appel && EPSD.appel.dispense(cls, n)); } catch (e) {}
        var last = Math.max(lastU[k] || 0, (x && +x.at) || 0, (v && v.st) || 0), st = abs ? "abs" : (x && (x.niv === "echec" || x.niv === "secu")) || (nE > 0 && ko >= nE && ko > ok) ? "echec" : on && nI > 0 && suivi && !disp && now - last > nI * 6e4 ? "inactif" : (x && x.niv === "ok") || ok ? "ok" : "cours";
        var li = st === "abs" ? "absent" : st === "inactif" ? "Rien depuis " + Math.round((now - last) / 6e4) + " min" : x && x.t ? x.t : st === "echec" ? ko + " ❌ aujourd'hui" : SL.length && ks.length ? SL.map(function (s) { var y = r[s.k]; return y == null ? "·" : RES_I[y]; }).join(" ") : ks.length ? ks.map(function (q) { return RES_I[r[q]]; }).join(" ") : disp ? "🩹 dispensé" : "Pas encore de retour";
        return { n: n, k: k, abs: abs, r: r, ks: ks, ok: ok, ko: ko, au: au.length, rm: rm, x: x, st: st, li: li, call: CK[k] || null, ic: icoOf(cls, n, d), ob: obs.filter(function (y) { return ekey(y.el) === k; }) }; });
      var pres = EL.filter(function (e) { return !e.abs; }), act = pres.filter(function (e) { return e.ks.length || e.au; }), ORD = ["echec", "inactif", "cours", "ok", "abs"], NB = {}; ORD.forEach(function (s) { NB[s] = EL.filter(function (e) { return e.st === s; }).length; });
      if (CTL_F !== "tous" && !NB[CTL_F]) CTL_F = "tous";
      var grpOf = function (n) { var g = v && v.grp && v.grp.g; if (!g) return ""; for (var i = 0; i < g.length; i++) if (g[i].some(function (m) { return ekey(m) === ekey(n); })) return gNom(v, i); return ""; };
      var h = '<div class="lc-top"><b>🧭 Pilotage de leçon · ' + esc(NOM) + '</b><span style="flex:1"></span><button type="button" class="x" data-x>✕ Fermer</button></div><div class="lc-body"><div class="lc-in" style="max-width:1400px">' +
        '<div class="lc-row"><b>Classe</b><select class="lc-sel" data-c>' + C.map(function (c) { return "<option" + (same(c, cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>" +
        (on ? '<span class="lc-tag ok">● ' + esc(lec ? titreL(lec) : "leçon sans fiche") + (v.part ? " · " + esc({ ech: "échauffement", rem: "remise en action", bilan: "bilan" }[v.part] || "situation " + (+String(v.part).slice(1) + 1)) : "") + " · " + Math.max(1, Math.round((now - v.st) / 6e4)) + " min</span>" : '<span class="lc-tag">Pas de leçon lancée</span>') +
        '<span style="flex:1"></span><button type="button" class="lc-b s" data-live>📡 Leçon en cours</button><button type="button" class="lc-b" data-sig>📣 Message à tous</button><button type="button" class="lc-b" data-plan>📋 Planche</button><button type="button" class="lc-b" data-terr>🗺 Plan</button></div>';
      /* 1 · appels et sécurité */
      var SEC = EL.filter(function (e) { return e.x && e.x.niv === "secu" && !e.abs; });
      h += '<h3 style="margin-bottom:6px">✋ Appels' + (CA.length ? " (" + CA.length + ")" : "") + "</h3>" + (CA.length || SEC.length ? CA.map(function (c) { var lieu = c.lieu || ((c.who || [])[0] ? grpOf(c.who[0]) : "") || "", qui = (c.who && c.who.length ? c.who.join(", ") : c.eq || c.tab || (c.cls ? "Une tablette · " + c.cls : "Une tablette")), mn = Math.max(0, Math.round((now - c.at) / 6e4));
          return '<div class="lc-row" style="margin:4px 0;background:#fff;border:1.5px solid ' + (c.st ? "#1E8449" : "#B4232B") + ';border-radius:12px;padding:8px 10px"><div style="flex:1;min-width:0"><b>' + esc(qui) + (lieu ? " · " + esc(lieu) : "") + '</b><div class="lc-mut" style="margin:0">' + esc(c.motif) + " · " + (mn ? mn + " min" : "à l'instant") + (c.cls && !same(c.cls, cls) ? " · " + esc(c.cls) : "") + (c.st ? " · pris en charge" : "") + '</div></div><button type="button" class="lc-b' + (c.st ? "" : " p") + '" data-call="' + esc(c.id) + '" data-st="' + (c.st ? 2 : 1) + '">' + (c.st ? "✓ Fait" : "J'y vais") + "</button></div>"; }).join("") +
        SEC.map(function (e) { return '<div class="lc-row" style="margin:4px 0;background:#FDECEC;border:1.5px solid #B4232B;border-radius:12px;padding:8px 10px"><b>🛡 ' + esc(e.n) + "</b><span>" + esc(e.x.t || "sécurité à vérifier") + "</span></div>"; }).join("") : '<p class="lc-mut" style="margin:0">Aucun appel en cours.</p>');
      /* 2 · la classe, filtrée */
      h += '<h3 style="margin-bottom:6px">👥 La classe</h3><div class="lc-row" style="gap:6px">' + [["tous", "", "Tous", "#14171C", "#fff", EL.length]].concat(ORD.map(function (s) { return [s].concat(CTL_ST[s]).concat([NB[s]]); })).filter(function (f) { return f[0] === "tous" || f[5]; }).map(function (f) { var sel = CTL_F === f[0];
          return '<button type="button" data-f="' + f[0] + '" aria-pressed="' + sel + '" style="min-height:40px;border-radius:999px;padding:0 14px;font:800 14px system-ui;border:1.5px solid ' + f[3] + ";background:" + (sel ? f[3] : f[4]) + ";color:" + (sel ? "#fff" : f[3]) + '">' + (f[1] ? f[1] + " " : "") + f[2] + " " + f[5] + "</button>"; }).join("") + "</div>";
      var SH = EL.filter(function (e) { return CTL_F === "tous" || e.st === CTL_F; }).sort(function (a, b) { return ORD.indexOf(a.st) - ORD.indexOf(b.st); });
      h += EL.length ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(' + (EL.some(function (e) { return e.x && e.x.tm; }) ? 210 : 170) + 'px,1fr));gap:8px;margin-top:8px">' + SH.map(function (e) { var S = CTL_ST[e.st], tm = e.x && e.x.tm && e.x.t === e.li ? e.x.tm : null;
          return '<button type="button" data-el="' + esc(e.k) + '" style="text-align:left;background:' + S[3] + ";border:1.5px solid " + (e.st === "cours" ? "#E6E1D6" : S[2]) + ";border-radius:12px;padding:8px 10px;min-height:58px;font:inherit;color:#14171C" + (e.abs ? ";opacity:.6" : "") + '"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (e.call ? "✋ " : "") + esc(e.n) + (e.ic.length ? " " + e.ic.map(function (x) { return esc(icoEmo(x.i)); }).join("") : "") + "</b>" + (tm ? ctlTm(tm) : "") + '<span style="display:block;font-size:13px;color:' + (e.st === "cours" ? "#6A6F78" : S[2]) + ";overflow:hidden;" + (tm ? "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.25" : "text-overflow:ellipsis;white-space:nowrap") + '">' + esc(e.li) + "</span></button>"; }).join("") + "</div>" : '<p class="lc-mut">Pas de liste d\'élèves pour cette classe.</p>';
      /* suivi propre à l'appli : window.epsCtlApp = {label, html(classe), open(classe)} (Step : groupes, blocs, fréquence cardiaque) ; déplié, repliable */
      var XA = window.epsCtlApp; if (XA && typeof XA.html === "function") { try { var xh = XA.html(cls); h += '<details data-xad style="margin-top:14px"' + (CTL_XA ? " open" : "") + '><summary style="font:800 16px system-ui;min-height:40px;cursor:pointer">' + esc(XA.label || NOM) + '</summary><div class="lc-row" style="margin:4px 0"><button type="button" class="lc-b s" data-xa>Ouvrir en grand</button></div>' + xh + "</details>"; } catch (e) {} }
      /* les chiffres d'ensemble, repliés */
      h += '<details data-vue style="margin-top:14px"' + (CTL_VUE ? " open" : "") + '><summary style="font:800 16px system-ui;min-height:40px;cursor:pointer">📊 Vue d\'ensemble de la leçon</summary>' +
        '<div class="lc-kpi">' + [["🙋", pres.length + "/" + EL.length, "présents"], ["📱", tabs.length, "tablette" + (tabs.length > 1 ? "s" : "") + " active" + (tabs.length > 1 ? "s" : "") + " (5 min)"], ["🏃", act.length + "/" + pres.length, "élèves avec un résultat aujourd'hui"],
          ["✅", EL.reduce(function (a, e) { return a + e.ok; }, 0), "situations réussies"], ["❌", EL.reduce(function (a, e) { return a + e.ko; }, 0), "pas encore réussies"], ["🎯", EL.reduce(function (a, e) { return a + e.rm.length; }, 0), "remédiations en cours"], ["👁", obs.length, "observations du jour"]].map(function (k) { return "<div><i>" + k[0] + "</i><b>" + k[1] + "</b><span>" + k[2] + "</span></div>"; }).join("") + "</div>";
      if (SL.length) h += "<h3>🏃 Situations de la leçon</h3>" + '<div class="lc-kpi">' + SL.map(function (s) { var c = [0, 0, 0]; EL.forEach(function (e) { var x = e.r[s.k]; if (x != null) c[x]++; }); var n = c[0] + c[1] + c[2];
          return '<div style="' + (n && c[0] / n > ctlSeuil() ? "border-color:#C0392B" : "") + '"><b style="font-size:15px">' + esc(s.t) + "</b><span>✅ " + c[2] + " · 🟠 " + c[1] + " · ❌ " + c[0] + (n ? "" : " · aucun retour") + (n && c[0] / n > ctlSeuil() ? ' · <b style="color:#C0392B">à reprendre</b>' : "") + "</span></div>"; }).join("") + "</div>";
      if (v && v.grp && v.grp.g && v.grp.g.length) h += "<h3>🧩 Groupes du jour</h3>" + v.grp.g.map(function (g, i) { return '<div class="lc-row" style="margin:3px 0"><b style="min-width:86px">' + esc(gNom(v, i)) + "</b><span>" + g.map(function (n) { var e = EL.filter(function (x) { return x.n === n; })[0]; return esc(n) + (e ? " " + (e.st === "echec" ? "🆘" : e.ok ? "✅" : e.ko ? "❌" : e.ks.length ? "🟠" : "") : ""); }).join(", ") + "</span></div>"; }).join("");
      h += (tabs.length ? "<h3>📱 Tablettes actives</h3>" + tabs.map(function (t) { return '<div class="lc-mut">' + esc(t.nom || t.id || "tablette") + " · " + new Date(t.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + (t.mode ? " · " + esc(t.mode) : "") + "</div>"; }).join("") : "") + "</details>" +
        '<p class="lc-mut" style="margin-top:10px">Actualisé à ' + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + "</p>";
      var sy = ov.querySelector(".lc-body"), top = sy ? sy.scrollTop : 0; ov.innerHTML = h + "</div></div>"; var sy2 = ov.querySelector(".lc-body"); if (sy2) sy2.scrollTop = top;
      ov.querySelector("[data-x]").onclick = close; ov.querySelector("[data-c]").onchange = function () { cls = this.value; CTL_F = "tous"; draw(); };
      ov.querySelector("[data-live]").onclick = function () { close(); LIVECLS = cls; open("live"); };
      ov.querySelector("[data-sig]").onclick = function () { try { EPSD.signal(); } catch (e) {} };
      ov.querySelector("[data-plan]").onclick = function () { if (window.EPSD && EPSD.planche) EPSD.planche({ cls: cls }); };
      ov.querySelector("[data-terr]").onclick = function () { terrOpen(cls); };
      ov.querySelector("[data-vue]").ontoggle = function () { CTL_VUE = this.open; };
      var xd = ov.querySelector("[data-xad]"); if (xd) xd.ontoggle = function () { CTL_XA = this.open; };
      ov.querySelectorAll("[data-f]").forEach(function (b) { b.onclick = function () { CTL_F = b.dataset.f; draw(); }; });
      ov.querySelectorAll("[data-call]").forEach(function (b) { b.onclick = function () { try { EPSD.appels[b.dataset.st === "2" ? "done" : "take"](b.dataset.call); } catch (e) {} draw(); }; });
      ov.querySelectorAll("[data-el]").forEach(function (b) { b.onclick = function () { var e = EL.filter(function (x) { return x.k === b.dataset.el; })[0]; if (!e) return;
        /* écran propre à l'appli pour cet élève (Cross-training : miroir de son timer) ; elle reçoit de quoi ouvrir la fiche commune */
        if (e.x && typeof e.x.open === "function" && e.x.t === e.li) { try { e.x.open(function () { ctlDet(cls, e, SL, draw); }); return; } catch (er) {} } ctlDet(cls, e, SL, draw); }; });
      var xb = ov.querySelector("[data-xa]"); if (xb) xb.onclick = function () { close(); try { window.epsCtlApp.open(cls); } catch (e) {} };  ctlTmTick(ov); }
    draw(); T = ov._t = setInterval(function () { try { if (window.EPSD && EPSD.syncSoon) EPSD.syncSoon(); } catch (e) {} draw(); }, 8000);
    if (ov._tm) clearInterval(ov._tm); ov._tm = setInterval(function () { if (ov.style.display === "none") { clearInterval(ov._tm); return; } ctlTmTick(ov); }, 500);
    ov._h = function () { try { draw(); } catch (e) {} }; window.addEventListener("eps-appels", ov._h);
  }
  /* 🗺 Plan de terrain (eps-groupes.js `EPSGR.terrain`) : groupes du jour posés sur les installations, déplacés au doigt, envoyés aux tablettes */
  function terrOpen(cls) { if (!window.EPSGR || !EPSGR.terrain) { alert("Module en cours de chargement : réessaie dans un instant."); return; } EPSGR.terrain({ dir: APP, cls: cls || (cur() && cur().nom) || edtClass() || classes()[0] || "" }); }
  /* ================= 🧪 Modalités d'évaluation personnalisées + 🧮 notes (leçon, séquence, évaluation) =================
     eps.evmod.<appli>.v1 (synchronisé « em.<appli>| ») :
       modalité {id:"m<uid>", k:"mod", nom, cls:[classes, vide = toutes], total (20), crit:[{id, t, afl, ty:"deg"|"pts"|"ok"|"perf", max, w, best, worst, unit}]}
       résultats {id:"r|<modalité>|<classe>", k:"res", mod, cls, el:{<clé élève>:{<critère>: valeur}}}
     Note d'un critère (0 à 1) : degré 1 à 4 (demi-degrés possibles) → (d − 0,5) / 4 ; points → v / max ; réussi → 0 ou 1 ;
     performance → place entre « moins bonne » et « meilleure » ; note = Σ poids × part / Σ poids × total. Tout est réglable. */
  var KM = "eps.evmod." + APP + ".v1";
  function prm(id, label, def, type) { try { return window.EPSP ? EPSP.p({ id: id, sec: "Notes et évaluation", label: label, type: type || "number", def: def }) : def; } catch (e) { return def; } }
  function noteCfg() { var th = prm("note_seuils", "Seuils des degrés en % (degré 2, 3, 4)", ["25", "50", "75"], "list").map(Number);
    return { jourSit: +prm("note_jour_sit", "Note d'une leçon : part des résultats aux situations (%), le reste = évaluation de leçon", 70), seqLec: +prm("note_seq_lec", "Note de séquence : part de la moyenne des leçons (%), le reste = évaluations", 50), th: th.length === 3 && th.every(isFinite) ? th : [25, 50, 75] }; }
  function degOf(sc) { var t = noteCfg().th; return sc * 100 < t[0] ? 0 : sc * 100 < t[1] ? 1 : sc * 100 < t[2] ? 2 : 3; }
  var CTY = { deg: "Degré 1 à 4", pts: "Points", ok: "Réussi / pas encore", perf: "Performance (chrono, distance…)" };
  function modPart(c, v) { if (v == null || v === "") return null; v = +v; if (!isFinite(v)) return null;
    if (c.ty === "deg") return Math.max(0, Math.min(1, (v - .5) / 4)); if (c.ty === "pts") return c.max > 0 ? Math.max(0, Math.min(1, v / c.max)) : null; if (c.ty === "ok") return v ? 1 : 0;
    if (c.ty === "perf") { var b = +c.best, w = +c.worst; if (!isFinite(b) || !isFinite(w) || b === w) return null; return Math.max(0, Math.min(1, (v - w) / (b - w))); } return null; }
  function modNote(m, r) { var sw = 0, s = 0, n = 0; (m.crit || []).forEach(function (c) { var p = modPart(c, r && r[c.id]), w = +c.w || 1; if (p == null) return; s += w * p; sw += w; n++; });
    return n ? { sc: s / sw, note: Math.round(s / sw * (+m.total || 20) * 4) / 4, n: n } : null; }
  function mods(cls) { return all(KM).filter(function (x) { return x.k === "mod" && (!cls || !(x.cls || []).length || (x.cls || []).some(function (c) { return same(c, cls); })); }); }
  function modRes(m, cls) { return get(KM, "r|" + m.id + "|" + nn(cls)) || { id: "r|" + m.id + "|" + nn(cls), k: "res", mod: m.id, cls: cls, el: {} }; }
  function modTpl(kind) { var c = function (t, afl, ty, w, max) { return { id: uid(), t: t, afl: afl || "", ty: ty, w: w || 1, max: max || "" }; };
    if (kind === "ccf") return { nom: "Épreuve type CCF", total: 20, crit: [c("AFL1 : motricité / performance", "AFL1", "deg", 12), c("AFL2 : s'entraîner, s'engager", "AFL2", "deg", 4), c("AFL3 : rôles, coopération", "AFL3", "deg", 4)] };
    if (kind === "perf") return { nom: "Performance chronométrée", total: 20, crit: [Object.assign(c("Temps réalisé", "AFL1", "perf", 12), { best: "", worst: "", unit: "s" }), c("Respect de la technique", "AFL1", "deg", 4), c("Gestion de l'effort / échauffement", "AFL2", "deg", 4)] };
    return { nom: "Nouvelle modalité", total: 20, crit: [c("Critère 1", "", "deg", 1)] }; }
  /* Ouvre une fenêtre .lc-ov DANS la page quand l'espace enseignant est affiché (demande du 27/11/2026 : les modalités s'ouvrent simplement, pas dans une fenêtre) :
     posée sous la barre d'actions, onglets visibles ; un appui sur un onglet ou une autre action la referme. Sans espace enseignant (console, autre écran) : plein écran comme avant.
     Renvoie { on, close } ; `close` est à appeler par le bouton ✕ Fermer. */
  function inl(ov, label) {
    var bar = document.querySelector(".epst-acts"), on = !!(bar && bar.offsetParent && document.documentElement.classList.contains("epst-on"));
    ov.classList.toggle("lc-inl", on); if (ov._inlOff) ov._inlOff();
    if (!on) { ov.style.top = ""; ov.style.zIndex = "2147483100"; return { on: false, close: function () { ov.style.display = "none"; } }; }
    try { window.scrollTo(0, 0); } catch (e) {}
    var btn = function () { return [].filter.call(bar.querySelectorAll(".epst-tb>button"), function (b) { return b.title === label; })[0]; };
    function fit() { if (ov.style.display === "none") return; var r = bar.getBoundingClientRect(), nv = document.querySelector(".epst-nav"), nb = nv ? nv.getBoundingClientRect().bottom : 0; ov.style.top = Math.max(0, Math.round(Math.max(nb, r.bottom + 6))) + "px"; var b = btn(); if (b) b.classList.add("lc-act"); }
    function out(e) { var t = e.target; if (t && t.closest && t.closest(".epst-nav button,.epst-tb button,.epst-mn button")) close(); }
    function close() { ov.style.display = "none"; ov.classList.remove("lc-inl"); ov.style.top = ""; clearInterval(iv); removeEventListener("resize", fit); removeEventListener("scroll", fit, true); document.removeEventListener("click", out, true); var b = btn(); if (b) b.classList.remove("lc-act"); ov._inlOff = null; }
    ov.style.zIndex = "60"; var iv = setInterval(fit, 500); addEventListener("resize", fit); addEventListener("scroll", fit, true); document.addEventListener("click", out, true); ov._inlOff = close; ov.style.display = "flex"; fit();
    return { on: true, close: close };
  }
  function modOpen(o) { css(); o = o || {}; var C = classes(), cls = o.cls || (cur() && cur().nom) || edtClass() || C[0] || "", ED = null, EV = null;
    var ov = document.getElementById("lc-em"); if (!ov) { ov = document.createElement("div"); ov.id = "lc-em"; ov.className = "lc-ov"; document.body.appendChild(ov); } ov.style.display = "flex"; var INL = inl(ov, "Modalités d'évaluation");
    var top = function (t) { return '<div class="lc-top"><b>🧪 ' + t + " · " + esc(NOM) + '</b><span style="flex:1"></span>' + (ED || EV ? '<button type="button" class="x" data-bk>← Retour</button>' : "") + '<button type="button" class="x" data-x>✕ Fermer</button></div><div class="lc-body"><div class="lc-in" style="max-width:1300px">'; };
    function draw() { if (ED) return edit(); if (EV) return evals();
      var M = mods(), h = top("Modalités d'évaluation") + '<p class="lc-mut">Crée tes propres modalités : critères en degrés, en points, réussi / pas encore ou en performance, avec leur poids. La note se calcule toute seule.</p>' +
        '<div class="lc-row"><button type="button" class="lc-b p" data-new="vide">＋ Nouvelle modalité</button><button type="button" class="lc-b" data-new="ccf">📜 Partir d\'une épreuve type CCF</button><button type="button" class="lc-b" data-new="perf">⏱ Partir d\'une performance</button></div>' +
        (M.length ? M.map(function (m) { return '<div class="lc-box"><div class="lc-row" style="margin:0"><b style="flex:1">' + esc(m.nom) + '</b><span class="lc-mut" style="margin:0">' + (m.crit || []).length + " critère(s) · sur " + (m.total || 20) + ((m.cls || []).length ? " · " + esc(m.cls.join(", ")) : " · toutes les classes") + '</span><button type="button" class="lc-b p s" data-ev="' + m.id + '">✍ Évaluer</button><button type="button" class="lc-b s" data-ed="' + m.id + '">✎ Modifier</button><button type="button" class="lc-b s" data-dup="' + m.id + '">⧉ Dupliquer</button></div></div>'; }).join("") : '<p class="lc-mut">Aucune modalité pour l\'instant.</p>');
      ov.innerHTML = h + "</div></div>"; bindTop();
      ov.querySelectorAll("[data-new]").forEach(function (b) { b.onclick = function () { var t = modTpl(b.dataset.new); ED = Object.assign({ id: "m" + uid(), k: "mod", cls: [] }, t); draw(); }; });
      ov.querySelectorAll("[data-ed]").forEach(function (b) { b.onclick = function () { ED = JSON.parse(JSON.stringify(get(KM, b.dataset.ed))); draw(); }; });
      ov.querySelectorAll("[data-dup]").forEach(function (b) { b.onclick = function () { var m = JSON.parse(JSON.stringify(get(KM, b.dataset.dup))); m.id = "m" + uid(); m.nom += " (copie)"; delete m.u; put(KM, m); draw(); }; });
      ov.querySelectorAll("[data-ev]").forEach(function (b) { b.onclick = function () { EV = b.dataset.ev; draw(); }; }); }
    function bindTop() { ov.querySelector("[data-x]").onclick = function () { INL.close(); }; var bk = ov.querySelector("[data-bk]"); if (bk) bk.onclick = function () { ED = null; EV = null; draw(); }; }
    function edit() { var m = ED, tw = (m.crit || []).reduce(function (a, c) { return a + (+c.w || 0); }, 0);
      var h = top("Modalité") + '<div class="lc-row"><b>Nom</b><input class="lc-sel" style="flex:1;min-width:240px" data-f="nom" value="' + esc(m.nom) + '"><b>Note sur</b><input class="lc-sel" type="number" style="width:80px" data-f="total" value="' + esc(m.total || 20) + '"></div>' +
        '<div class="lc-row"><b>Classes</b>' + C.map(function (c) { var on = (m.cls || []).some(function (x) { return same(x, c); }); return '<button type="button" class="lc-b s' + (on ? " p" : "") + '" data-cl="' + esc(c) + '">' + (on ? "✓ " : "") + esc(c) + "</button>"; }).join("") + '<span class="lc-mut" style="margin:0">aucune cochée = toutes</span></div>' +
        '<div style="overflow:auto"><table class="lc-tab"><tr><th>Critère</th><th>AFL</th><th>Type</th><th>Réglage</th><th>Poids</th><th></th></tr>' + (m.crit || []).map(function (c, i) {
          return '<tr><td><input class="lc-sel" style="width:100%;min-width:200px" data-c="' + i + '" data-k="t" value="' + esc(c.t) + '"></td><td><input class="lc-sel" style="width:80px" data-c="' + i + '" data-k="afl" value="' + esc(c.afl || "") + '" placeholder="AFL1"></td>' +
            '<td><select class="lc-sel" data-c="' + i + '" data-k="ty">' + Object.keys(CTY).map(function (k) { return '<option value="' + k + '"' + (c.ty === k ? " selected" : "") + ">" + CTY[k] + "</option>"; }).join("") + "</select></td><td>" +
            (c.ty === "pts" ? 'sur <input class="lc-sel" type="number" style="width:70px" data-c="' + i + '" data-k="max" value="' + esc(c.max || "") + '">' : c.ty === "perf" ? 'meilleure <input class="lc-sel" style="width:70px" data-c="' + i + '" data-k="best" value="' + esc(c.best || "") + '"> moins bonne <input class="lc-sel" style="width:70px" data-c="' + i + '" data-k="worst" value="' + esc(c.worst || "") + '"> unité <input class="lc-sel" style="width:60px" data-c="' + i + '" data-k="unit" value="' + esc(c.unit || "") + '">' : '<span class="lc-mut" style="margin:0">' + (c.ty === "deg" ? "degré 1 à 4 (demi-degrés possibles)" : "✓ ou ✗") + "</span>") +
            '</td><td><input class="lc-sel" type="number" step="0.5" style="width:70px" data-c="' + i + '" data-k="w" value="' + esc(c.w) + '"> <small class="lc-mut">' + (tw ? Math.round((+c.w || 0) / tw * (+m.total || 20) * 10) / 10 + " pts" : "") + '</small></td><td><button type="button" class="lc-b s" data-del="' + i + '" aria-label="Retirer">✕</button></td></tr>'; }).join("") + "</table></div>" +
        '<div class="lc-row"><button type="button" class="lc-b" data-add>＋ Critère</button><span style="flex:1"></span>' + (get(KM, m.id) ? '<button type="button" class="lc-b" data-rm style="color:#B4232B">🗑 Supprimer la modalité</button>' : "") + '<button type="button" class="lc-b p" data-save>✓ Enregistrer</button></div>' +
        '<p class="lc-mut">Le poids règle la part de chaque critère dans la note (ex. 12 / 4 / 4 pour un barème CCF). Performance : la note va de 0 (moins bonne valeur) au maximum (meilleure valeur) ; pour un chrono, la meilleure est la plus petite.</p>';
      ov.innerHTML = h + "</div></div>"; bindTop();
      ov.querySelectorAll("[data-f]").forEach(function (x) { x.oninput = function () { m[x.dataset.f] = x.dataset.f === "total" ? +x.value : x.value; }; });
      ov.querySelectorAll("[data-cl]").forEach(function (b) { b.onclick = function () { var c = b.dataset.cl, L = m.cls || [], i = L.findIndex(function (x) { return same(x, c); }); if (i >= 0) L.splice(i, 1); else L.push(c); m.cls = L; edit(); }; });
      ov.querySelectorAll("[data-c]").forEach(function (x) { x.onchange = function () { var c = m.crit[+x.dataset.c]; c[x.dataset.k] = x.dataset.k === "w" ? +x.value : x.value; if (x.dataset.k === "ty" || x.dataset.k === "w") edit(); }; x.oninput = function () { m.crit[+x.dataset.c][x.dataset.k] = x.dataset.k === "w" ? +x.value : x.value; }; });
      ov.querySelectorAll("[data-del]").forEach(function (b) { b.onclick = function () { m.crit.splice(+b.dataset.del, 1); edit(); }; });
      ov.querySelector("[data-add]").onclick = function () { m.crit.push({ id: uid(), t: "Critère " + (m.crit.length + 1), afl: "", ty: "deg", w: 1 }); edit(); };
      ov.querySelector("[data-save]").onclick = function () { if (!(m.crit || []).length) { alert("Ajoute au moins un critère."); return; } m.nom = (m.nom || "").trim() || "Modalité"; put(KM, m); ED = null; draw(); };
      var rm = ov.querySelector("[data-rm]"); if (rm) rm.onclick = function () { if (confirm("Supprimer « " + m.nom + " » et ses résultats ?")) { del(KM, m.id); all(KM).filter(function (x) { return x.k === "res" && x.mod === m.id; }).forEach(function (x) { del(KM, x.id); }); ED = null; draw(); } }; }
    function evals() { var m = get(KM, EV); if (!m) { EV = null; return draw(); } var CL = (m.cls || []).length ? m.cls : C; if (!CL.some(function (c) { return same(c, cls); })) cls = CL[0] || cls;
      var R = roster(cls), res = modRes(m, cls);
      var inp = function (c, k) { var v = (res.el[k] || {})[c.id]; v = v == null ? "" : v;
        if (c.ty === "deg") return '<select class="lc-sel" data-v="' + c.id + '|' + esc(k) + '"><option value=""></option>' + ["1", "1.5", "2", "2.5", "3", "3.5", "4"].map(function (d) { return '<option value="' + d + '"' + (String(v) === d ? " selected" : "") + ">D" + d.replace(".5", "+") + "</option>"; }).join("") + "</select>";
        if (c.ty === "ok") return '<select class="lc-sel" data-v="' + c.id + '|' + esc(k) + '"><option value=""></option><option value="1"' + (String(v) === "1" ? " selected" : "") + '>✓</option><option value="0"' + (String(v) === "0" ? " selected" : "") + ">✗</option></select>";
        return '<input class="lc-sel" type="number" step="any" style="width:80px" data-v="' + c.id + '|' + esc(k) + '" value="' + esc(v) + '">' + (c.ty === "perf" && c.unit ? " " + esc(c.unit) : c.ty === "pts" ? " /" + esc(c.max) : ""); };
      var h = top(esc(m.nom)) + '<div class="lc-row"><b>Classe</b><select class="lc-sel" data-cls>' + CL.map(function (c) { return "<option" + (same(c, cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select></div>" +
        '<div style="overflow:auto"><table class="lc-tab"><tr><th>Élève</th>' + m.crit.map(function (c) { return "<th>" + esc(c.t) + (c.afl ? " <small>(" + esc(c.afl) + ")</small>" : "") + "</th>"; }).join("") + "<th>Note /" + (m.total || 20) + "</th><th>Degré</th></tr>" +
        R.map(function (n) { var k = ekey(n), N = modNote(m, res.el[k]); return "<tr><td><b>" + esc(n) + "</b>" + (isAbs(cls, n) ? ' <span class="lc-tag">absent</span>' : "") + "</td>" + m.crit.map(function (c) { return "<td>" + inp(c, k) + "</td>"; }).join("") +
          '<td><b data-n="' + esc(k) + '">' + (N ? n20(N.note) : "—") + '</b></td><td data-d="' + esc(k) + '">' + (N ? "D" + (degOf(N.sc) + 1) : "—") + "</td></tr>"; }).join("") + "</table></div>" +
        '<div class="lc-row"><button type="button" class="lc-b" data-cp>📋 Copier les notes (Pronote)</button><span class="lc-mut" data-msg style="margin:0">Enregistré à chaque saisie.</span></div>';
      ov.innerHTML = h + "</div></div>"; bindTop();
      ov.querySelector("[data-cls]").onchange = function () { cls = this.value; evals(); };
      ov.querySelectorAll("[data-v]").forEach(function (x) { x.onchange = function () { var p = x.dataset.v.split("|"), c = p[0], k = p.slice(1).join("|"), r = modRes(m, cls); r.el[k] = r.el[k] || {}; if (x.value === "") delete r.el[k][c]; else r.el[k][c] = +x.value; put(KM, r); res = r;
        var N = modNote(m, r.el[k]), nb = ov.querySelector('[data-n="' + k + '"]'), db = ov.querySelector('[data-d="' + k + '"]'); if (nb) nb.textContent = N ? n20(N.note) : "—"; if (db) db.textContent = N ? "D" + (degOf(N.sc) + 1) : "—"; }; });
      ov.querySelector("[data-cp]").onclick = function () { var t = R.map(function (n) { var N = modNote(m, modRes(m, cls).el[ekey(n)]); return N ? n + "\t" + n20(N.note) : ""; }).filter(Boolean).join("\n"); if (!t) return;
        try { navigator.clipboard.writeText(t).then(function () { ov.querySelector("[data-msg]").textContent = "✓ Notes copiées."; }, function () { prompt("Copie :", t); }); } catch (e) { prompt("Copie :", t); } }; }
    draw(); }
  /* ================= 🥋 Validations d'apprentissages (reprise des ceintures d'Acrosport, pour toutes les activités) =================
     eps.valid.<appli>.v1 (synchronisé « va.<appli>| ») : {id: <classe>|<clé élève>, cls, k, n, v:{<apprentissage normalisé>:{st:1 en cours|2 validé, at}}}
     Liste des apprentissages réglable (🎛 Paramètres « Validations ») ; proposition ⭐ quand l'élève a noté ✅ au moins N fois
     sur des situations rattachées à cet apprentissage (champ « apprentissage » de la situation) ; l'enseignant valide. */
  var KVA = "eps.valid." + APP + ".v1";
  var VDEF = { badminton: ["Service long", "Service court", "Dégagé", "Amorti", "Smash", "Kill au filet", "Replacement au centre"], volley: ["Passe à dix doigts", "Manchette", "Service par en dessous", "Service par en haut", "Attaque", "Réception et relance"],
    relais: ["Départ du donneur", "Marque de départ", "Transmission à l'arrêt", "Transmission en course", "Course à vitesse maximale"], escalade: ["Nœud de huit", "Assurage en moulinette", "Contre-assurage", "Lecture de voie", "Grimpe en tête"],
    danse: ["Mémoriser sa chorégraphie", "Procédés de composition", "Qualité du geste", "Occupation de l'espace scénique"], orientation: ["Orienter sa carte", "Lire la légende", "Choisir un itinéraire", "Poinçonner sans erreur"],
    crosstraining: ["Squat", "Gainage", "Burpee", "Gérer son effort (FC)", "Construire son WOD"], step: ["Rester en rythme", "Pied entier sur le step", "Mémoriser un bloc", "Réaliser des deux côtés", "Composer un bloc"], basket: ["Dribble de progression", "Passe à terre et passe directe", "Tir en course", "Tir à l'arrêt", "Démarquage", "Défense sur son joueur", "Rebond"], acrosport: [] /* Acrosport a déjà ses ceintures */ };
  function vlist() { var d = VDEF[APP] || []; try { return window.EPSP ? EPSP.p({ id: "valid_list", sec: "Validations", label: "Apprentissages à valider (un par ligne)", type: "list", def: d }) : d; } catch (e) { return d; } }
  function vN() { var n = 3; try { n = +(window.EPSP ? EPSP.p({ id: "valid_n", sec: "Validations", label: "Nombre de ✅ pour proposer la validation ⭐", type: "number", def: 3 }) : 3); } catch (e) {} return isFinite(n) && n > 0 ? n : 3; }
  function vGet(cls, n) { return get(KVA, nn(cls) + "|" + ekey(n)) || { id: nn(cls) + "|" + ekey(n), cls: cls, k: ekey(n), n: n, v: {} }; }
  function vCount(cls, n) { var C = {}, k = ekey(n); allSits(false).forEach(function (o) { if (!o.tags.length) return; all(KS).forEach(function (x) { if (x.ek !== k || !same(x.cls, cls)) return; var r = x.r || {};
      [o.k, o.k + "@auto"].forEach(function (q) { if (r[q] === 2) o.tags.forEach(function (t) { var tk = tnorm(t); C[tk] = (C[tk] || 0) + 1; }); }); }); }); return C; }
  function vHtml(cls) { var L = vlist(), R = roster(cls), N = vN(), IC = ["", "🟡", "✅"];
    if (!L.length) return '<p class="lc-mut">Aucun apprentissage à valider : ajoute-les dans ⚙ Réglages → 🎛 Paramètres → Validations.</p>';
    return '<p class="lc-mut" style="margin:0 0 8px">Touche une case : vide → 🟡 en cours → ✅ validé → vide. ⭐ = proposé (' + N + " ✅ ou plus sur les situations de cet apprentissage). Les élèves voient leurs validations sur leur tablette.</p>" +
      '<div style="overflow:auto"><table class="lc-tab"><tr><th>Élève</th>' + L.map(function (t) { return "<th>" + esc(t) + "</th>"; }).join("") + "<th>Validés</th></tr>" +
      R.map(function (n) { var V = vGet(cls, n).v || {}, C = vCount(cls, n), nv = 0;
        return "<tr><td><b>" + esc(n) + "</b></td>" + L.map(function (t, i) { var tk = tnorm(t), st = (V[tk] || {}).st || 0, pro = !st && (C[tk] || 0) >= N; if (st === 2) nv++;
          return '<td><button type="button" class="lc-b s" style="min-width:52px' + (st === 2 ? ";background:#def1e5" : pro ? ";border-style:dashed" : "") + '" data-vt="' + i + '" data-vn="' + esc(n) + '" title="' + (C[tk] || 0) + ' ✅">' + (IC[st] || (pro ? "⭐" : "·")) + "</button></td>"; }).join("") + "<td><b>" + nv + "/" + L.length + "</b></td></tr>"; }).join("") + "</table></div>"; }
  function vBind(ov, cls, redraw) { var L = vlist(); ov.querySelectorAll("[data-vt]").forEach(function (b) { b.onclick = function () { var n = b.dataset.vn, o = vGet(cls, n), tk = tnorm(L[+b.dataset.vt]), st = ((o.v[tk] || {}).st || 0);
      var pro = !st && (vCount(cls, n)[tk] || 0) >= vN(); st = pro ? 2 : (st + 1) % 3; if (st) o.v[tk] = { st: st, at: Date.now() }; else delete o.v[tk]; put(KVA, o); redraw(); }; }); }
  function vMine(cls, n) { var V = vGet(cls, n).v || {}, L = vlist(); return L.filter(function (t) { return ((V[tnorm(t)] || {}).st) === 2; }); }
  function clOpen(o) {
    css(); o = o || {}; var C = classes(), cls = o.cls || (cur() && cur().nom) || edtClass() || C[0] || "", TAB = o.tab || "gen", PV = o.pv || "jour", SEL = null, S0 = seqs(), P = S0.length ? { kind: "seq", seq: S0[S0.length - 1] } : { kind: "dates", from: trim(0)[0], to: trim(0)[1], lab: "année" }, MODE = "bulletin";
    var PH = []; try { PH = window.EPSP ? EPSP.p({ id: "avis_phrases", sec: "Bilans et avis", label: "Banque de phrases (bilans, bulletin) : à toucher sous chaque avis", type: "list", def: ["Élève investi(e) et volontaire.", "Progrès réguliers tout au long de la séquence.", "Bonne compréhension des consignes et des critères de réussite.", "Sait s'organiser en autonomie avec son groupe.", "Assume ses rôles (arbitre, observateur, coach) avec sérieux.", "Persévère face à la difficulté.", "Contribue positivement au travail collectif."] }) : []; } catch (e) {}
    var ov = document.getElementById("lc-cl"); if (!ov) { ov = document.createElement("div"); ov.id = "lc-cl"; ov.className = "lc-ov"; document.body.appendChild(ov); } ov.style.display = "flex"; ov.style.zIndex = "2147483100";
    function head() { return '<div class="lc-top"><b>🏫 ' + esc(cls) + " · " + esc(NOM) + "</b>" + [["gen", "📊 Vue générale"], ["el", "👤 Élèves"], ["bil", "📝 Bilans & avis"]].concat([["val", "🥋 Validations"]]).concat(isTerm(cls) || TAB === "proto" ? [["proto", "📜 CCF"]] : []).map(function (t) { return '<button type="button" data-t="' + t[0] + '"' + (TAB === t[0] ? ' class="on"' : "") + ">" + t[1] + "</button>"; }).join("") + (o.noClose ? "" : '<button type="button" class="x" data-x>✕ Fermer</button>') + "</div>"; }
    function perBar() { var S = seqs();
      return '<div class="lc-row"><b>Classe</b><select class="lc-sel" data-c>' + C.map(function (c) { return "<option" + (same(c, cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select><b>Période</b>" +
        S.map(function (q) { var on = P.kind === "seq" && P.seq === q; return '<button type="button" class="lc-b s' + (on ? " p" : "") + '" data-ps="' + esc(q) + '">' + esc(/^s[ée]quence/i.test(q) ? q : "Séquence " + q) + "</button>"; }).join("") +
        [[1, "Trimestre 1"], [2, "Trimestre 2"], [3, "Trimestre 3"], [0, "Année"]].map(function (t) { var r = trim(t[0]), on = P.kind === "dates" && P.from === r[0] && P.to === r[1]; return '<button type="button" class="lc-b s' + (on ? " p" : "") + '" data-pt="' + t[0] + '">' + t[1] + "</button>"; }).join("") +
        '<span class="lc-mut" style="margin:0">du</span><input type="date" class="lc-sel" data-pf value="' + (P.kind === "dates" ? P.from : "") + '"><span class="lc-mut" style="margin:0">au</span><input type="date" class="lc-sel" data-pto value="' + (P.kind === "dates" ? P.to : "") + '"></div>'; }
    function draw() {
      var X0 = TAB === "proto" ? inst(cls) : null; if (X0 && !X0.M.ccf(cls).on) X0.M.setCcf(cls, { on: true }); /* terminale : barème du protocole par défaut */
      var D = classData(cls, P), h = head() + '<div class="lc-body"><div class="lc-in" style="max-width:1300px">' + perBar();
      if (TAB === "val") { h += vHtml(cls); ov.innerHTML = h + "</div></div>"; bind(D, null); vBind(ov, cls, draw); return; }
      if (TAB === "proto") { h += '<div class="lc-row">' + [["jour", "📅 Note de leçon"], ["seq", "🏁 Note de séquence"], ["syn", "📋 Protocole CCF"], ["mod", "🧪 Mes modalités"]].map(function (t) { return '<button type="button" class="lc-b' + (PV === t[0] ? " p" : "") + '" data-pv2="' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</div>" +
          (PV === "jour" ? jourHtml(D) : PV === "seq" ? seqNoteHtml(D, X0) : PV === "mod" ? modNotesHtml(D) : protoHtml(D, X0)); ov.innerHTML = h + "</div></div>"; bind(D, null); var mo = ov.querySelector("[data-modopen]"); if (mo) mo.onclick = function () { modOpen({ cls: cls }); };
        ov.querySelectorAll("[data-pv2]").forEach(function (b) { b.onclick = function () { PV = b.dataset.pv2; draw(); }; }); if (PV === "syn") protoBind(D, X0); else if (PV === "jour") jourBind(D); else seqBind(D, X0); return; }
      var noted = D.EL.filter(function (e) { return e.pr && e.pr.note != null; }), notes = noted.map(function (e) { return e.pr.note; });
      if (TAB === "gen") {
        var sitAll = D.EL.filter(function (e) { return e.sit != null; }), leAll = D.EL.filter(function (e) { return e.le != null; });
        h += '<div class="lc-kpi">' + [["👥", D.EL.length, "élèves"], ["📅", D.D.length, "leçon(s) faite(s)"], ["🙋", D.D.length ? pcs(1 - D.EL.reduce(function (a, e) { return a + e.nAbs; }, 0) / (D.D.length * Math.max(1, D.EL.length))) : "—", "présence"],
          ["🏃", sitAll.length ? pcs(sitAll.reduce(function (a, e) { return a + e.sit; }, 0) / sitAll.length) : "—", "réussite aux situations"], ["📊", leAll.length ? String(Math.round(leAll.reduce(function (a, e) { return a + e.le; }, 0) / leAll.length * 10) / 10).replace(".", ",") + "/3" : "—", "évaluation de leçon"],
          ["🎯", noted.length ? n20(notes.reduce(function (a, b) { return a + b; }, 0) / notes.length) + "/20" : "—", "note proposée moyenne (" + noted.length + " élève" + (noted.length > 1 ? "s" : "") + (notes.length ? ", " + n20(Math.min.apply(null, notes)) + " à " + n20(Math.max.apply(null, notes)) : "") + ")"]].map(function (k) { return '<div><i>' + k[0] + "</i><b>" + k[1] + "</b><span>" + k[2] + "</span></div>"; }).join("") + "</div>";
        h += "<h3>📅 Leçons</h3>" + (D.D.length ? '<div style="overflow:auto"><table class="lc-tab"><tr><th>Date</th><th>Leçon</th><th>Présents</th><th>Réussite situations</th><th>Éval. leçon</th></tr>' + D.D.map(function (d) { var x = D.days[d], pres = D.EL.filter(function (e) { return !e.L.filter(function (y) { return y.d === d; })[0].abs; }).length, rv = [0, 0], evs = [];
          (x.res || []).forEach(function (o) { Object.keys(o.r || {}).forEach(function (q) { if (/@auto$/.test(q)) return; rv[0] += o.r[q] === 2 ? 1 : o.r[q] === 1 ? .5 : 0; rv[1]++; }); }); if (x.ev) Object.keys(x.ev.el || {}).forEach(function (k) { var v = x.ev.el[k], a = ["p", "s", "t"].filter(function (q) { return v[q] != null; }).map(function (q) { return +v[q]; }); if (a.length) evs.push(a.reduce(function (p, q) { return p + q; }, 0) / a.length); });
          return "<tr><td>" + fr(d) + "</td><td>" + esc(x.lec ? titreL(x.lec) : "—") + "</td><td>" + pres + "/" + D.EL.length + "</td><td>" + (rv[1] ? pcs(rv[0] / rv[1]) : "—") + "</td><td>" + (evs.length ? String(Math.round(evs.reduce(function (p, q) { return p + q; }, 0) / evs.length * 10) / 10).replace(".", ",") + "/3" : "—") + "</td></tr>"; }).join("") + "</table></div>" : '<p class="lc-mut">Aucune leçon faite sur cette période (appel, évaluation de leçon ou résultats des élèves).</p>');
        if (D.grid && noted.length) h += "<h3>📋 Positionnement par AFL</h3>" + '<div class="lc-kpi">' + (noted[0].pr.afl || []).map(function (a, i) { var dg = [0, 0, 0, 0]; noted.forEach(function (e) { var x = e.pr.afl[i]; if (x && x.deg != null) dg[x.deg]++; }); return "<div><b>" + esc(a.code) + "</b><span>" + dg.map(function (n, j) { return "D" + (j + 1) + " : " + n; }).join(" · ") + "</span></div>"; }).join("") + "</div>";
      } else if (TAB === "el") {
        if (SEL) { var e = D.EL.filter(function (x) { return x.k === SEL; })[0]; if (!e) SEL = null; else {
          h += '<div class="lc-row"><button type="button" class="lc-b s" data-back>← Retour</button><h2 style="margin:0;flex:1">👤 ' + esc(e.n) + "</h2></div>" +
            '<div class="lc-kpi">' + [["🎯", e.pr && e.pr.note != null ? n20(e.pr.note) + "/20" : "—", "note proposée" + (e.pr && e.pr.detail ? " (" + e.pr.detail + ")" : "")], ["📊", e.le != null ? String(Math.round(e.le * 10) / 10).replace(".", ",") + "/3" : "—", "évaluation de leçon (" + e.nle + ")"], ["🏃", pcs(e.sit), "réussite aux situations (" + e.nsit + ")"], ["🙋", (D.D.length - e.nAbs) + "/" + D.D.length, "présence"], ["🎯", e.rm.length ? e.rm.filter(function (r) { return r.st === 3; }).length + "/" + e.rm.length : "—", "remédiations réussies"]].map(function (k) { return "<div><i>" + k[0] + "</i><b>" + k[1] + "</b><span>" + esc(k[2]) + "</span></div>"; }).join("") + "</div>" +
            (e.pr && e.pr.afl ? '<p>' + e.pr.afl.map(function (a) { return '<span class="lc-tag">' + esc(a.code) + (a.deg != null ? " · degré " + (a.deg + 1) : " · non évalué") + "</span>"; }).join(" ") + "</p>" : "") +
            (e.comm ? '<div class="lc-box"><b>💬 Ton commentaire</b><div class="lc-pre">' + esc(e.comm) + "</div></div>" : "") +
            (e.ap && (e.ap.r || e.ap.m || e.ap.reussi || e.ap.ameliorer) ? '<div class="lc-box"><b>🙋 Auto-positionnement</b><div>✅ ' + esc(e.ap.r || e.ap.reussi || "—") + "</div><div>🔧 " + esc(e.ap.m || e.ap.ameliorer || "—") + "</div></div>" : "") +
            "<h3>📅 Par leçon</h3>" + (e.L.length ? '<div style="overflow:auto"><table class="lc-tab"><tr><th>Date</th><th>Leçon</th><th>Présence</th><th>Éval. leçon</th><th>Situations</th><th>Observations</th></tr>' + e.L.map(function (x) {
              var sl = x.lec ? sitList(x.lec) : [], rs = Object.keys(x.rs).map(function (q) { var s = sl.filter(function (z) { return z.k === q; })[0]; return RES_I[x.rs[q]] + " " + esc(s ? s.t : q.split(":")[1]); });
              return "<tr><td>" + fr(x.d) + "</td><td>" + esc(x.lec ? titreL(x.lec) : "—") + "</td><td>" + (x.abs ? '<b style="color:#C0392B">absent</b>' : "présent") + "</td><td>" + (x.ev ? ["p", "s", "t"].map(function (q) { return x.ev[q] != null ? x.ev[q] : "·"; }).join(" / ") : "—") + "</td><td>" + (rs.join("<br>") || "—") + "</td><td>" + (x.ob.map(function (o) { return esc(o.txt); }).join("<br>") || "") + "</td></tr>"; }).join("") + "</table></div>" : '<p class="lc-mut">Aucune leçon sur cette période.</p>') +
            (e.rm.length ? "<h3>🎯 Remédiation</h3>" + e.rm.map(function (r) { return "<div>" + esc(r.tag || r.k) + " · " + REC_ST[r.st || 0] + "</div>"; }).join("") : ""); } }
        if (!SEL) h += '<div style="overflow:auto"><table class="lc-tab"><tr><th>Élève</th><th>Note proposée</th><th>AFL</th><th>Éval. leçon</th><th>Situations</th><th>Présence</th><th>🎯</th><th>Obs.</th></tr>' + D.EL.map(function (e) {
            return '<tr data-el="' + esc(e.k) + '" style="cursor:pointer"><td><b>' + esc(e.n) + "</b>" + (e.st ? ' <span class="lc-tag">' + esc(e.st) + "</span>" : "") + "</td><td>" + (e.pr && e.pr.note != null ? n20(e.pr.note) + "/20" : "—") + "</td><td>" + (e.pr && e.pr.afl ? e.pr.afl.map(function (a) { return a.deg != null ? '<span class="lc-tag" title="' + esc(a.code) + '">' + esc(a.code.replace(/^AFLP?/, "")) + ":" + (a.deg + 1) + "</span>" : ""; }).join("") : "") + "</td><td>" + (e.le != null ? String(Math.round(e.le * 10) / 10).replace(".", ",") + "/3" : "—") + "</td><td>" + pcs(e.sit) + "</td><td>" + (D.D.length - e.nAbs) + "/" + D.D.length + "</td><td>" + (e.rm.length || "") + "</td><td>" + (e.ob.length || "") + "</td></tr>"; }).join("") + '</table></div><p class="lc-mut">Touche un élève pour son détail, leçon par leçon.</p>';
      } else {
        var A = all(KAV), per = P.kind === "seq" ? "seq:" + P.seq : P.from + "_" + P.to, aid = function (k) { return APP + "|" + nn(cls) + "|" + MODE + "|" + per + "|" + k; };
        h += '<div class="lc-row"><b>Type</b><button type="button" class="lc-b s' + (MODE === "bulletin" ? " p" : "") + '" data-m="bulletin">📝 Appréciation de bulletin (positive)</button><button type="button" class="lc-b s' + (MODE === "avis" ? " p" : "") + '" data-m="avis">🏁 Avis de bilan</button></div>' +
          '<p class="lc-mut">' + (MODE === "bulletin" ? "Formulée positivement et de façon générale (sans nommer l'activité) : points forts, progrès, engagement, encouragement. Aucune critique : tu ajoutes toi-même tes remarques." : "Bilan de la période : réussites, puis un axe de progrès formulé de façon constructive.") + " Claude reçoit les données de l'élève sans son nom (" + perLabel(P) + "). Relis, corrige, coche ✓ : seuls les avis cochés sont copiés.</p>" +
          '<div class="lc-row"><button type="button" class="lc-b p" data-gen>✨ Proposer pour toute la classe</button><button type="button" class="lc-b" data-cpy>📋 Copier les avis cochés (Pronote)</button><button type="button" class="lc-b" data-prt>🖨 Imprimer le bilan</button><span class="lc-mut" data-msg style="margin:0"></span></div>' +
          D.EL.map(function (e) { var a = get(KAV, aid(e.k)) || {}; return '<div class="lc-box" data-av="' + esc(e.k) + '" data-aid="' + esc(aid(e.k)) + '"><div class="lc-row" style="margin:0"><b style="flex:1">' + esc(e.n) + '</b><span class="lc-mut" style="margin:0">' + (e.pr && e.pr.note != null ? n20(e.pr.note) + "/20 · " : "") + pcs(e.sit) + " situations · " + (D.D.length - e.nAbs) + "/" + D.D.length + ' présences</span>' + (MODE === "bulletin" && window.EPSD && EPSD.genre ? EPSD.genre.btn(e.n) : "") + '<button type="button" class="lc-b s" data-one>✨</button><label style="font-weight:700"><input type="checkbox" data-ok' + (a.ok ? " checked" : "") + "> ✓</label></div><div class=\"epsd-cpw\" style=\"margin-top:6px\"><textarea data-tx style=\"width:100%;min-height:62px;border:1.5px solid #E6E1D6;border-radius:10px;padding:8px;font:15px/1.4 system-ui\">" + esc(a.t || "") + "</textarea>" + (window.EPSD && EPSD.copyBtn ? EPSD.copyBtn() : "") + "</div>" + (PH.length ? '<details class="lc-ph"><summary class="lc-mut" style="margin:2px 0;cursor:pointer">💬 Phrases à ajouter</summary><div class="lc-row" style="margin:4px 0">' + PH.map(function (t, i) { return '<button type="button" class="lc-b s" data-ph="' + i + '">' + esc(t) + "</button>"; }).join("") + "</div></details>" : "") + "</div>"; }).join("");
      }
      ov.innerHTML = h + "</div></div>"; bind(D, aid);
    }
    function bind(D, aid) {
      var q = function (s) { return ov.querySelector(s); }, qa = function (s) { return ov.querySelectorAll(s); };
      qa("[data-t]").forEach(function (b) { b.onclick = function () { TAB = b.dataset.t; SEL = null; draw(); }; }); var x = q("[data-x]"); if (x) x.onclick = function () { ov.style.display = "none"; };
      q("[data-c]").onchange = function () { cls = this.value; SEL = null; draw(); };
      qa("[data-ps]").forEach(function (b) { b.onclick = function () { P = { kind: "seq", seq: b.dataset.ps }; draw(); }; });
      qa("[data-pt]").forEach(function (b) { b.onclick = function () { var r = trim(+b.dataset.pt); P = { kind: "dates", from: r[0], to: r[1], lab: +b.dataset.pt ? "trimestre " + b.dataset.pt : "année" }; draw(); }; });
      var pf = q("[data-pf]"), pt = q("[data-pto]"), upd = function () { if (pf.value && pt.value) { P = { kind: "dates", from: pf.value, to: pt.value }; draw(); } }; pf.onchange = upd; pt.onchange = upd;
      qa("[data-el]").forEach(function (r) { r.onclick = function () { SEL = r.dataset.el; draw(); }; }); var bk = q("[data-back]"); if (bk) bk.onclick = function () { SEL = null; draw(); };
      qa("[data-m]").forEach(function (b) { b.onclick = function () { MODE = b.dataset.m; draw(); }; });
      if (TAB !== "bil") return;
      var msg = q("[data-msg]"), save = function (k) { var bx = ov.querySelector('[data-av="' + k + '"]'); put(KAV, { id: aid(k), app: APP, cls: cls, mode: MODE, per: perLabel(P), k: k, t: bx.querySelector("[data-tx]").value, ok: bx.querySelector("[data-ok]").checked }); };
      qa("[data-av]").forEach(function (bx) { var k = bx.dataset.av; bx.querySelectorAll("[data-ph]").forEach(function (b) { b.onclick = function () { var ta = bx.querySelector("[data-tx]"); ta.value = (ta.value.trim() ? ta.value.trim() + " " : "") + PH[+b.dataset.ph]; save(k); }; });
        var tx = bx.querySelector("[data-tx]"), tT = 0; tx.onchange = function () { clearTimeout(tT); save(k); }; tx.oninput = function () { clearTimeout(tT); tT = setTimeout(function () { if (tx.isConnected) save(k); }, 500); }; bx.querySelector("[data-ok]").onchange = function () { save(k); };
        bx.querySelector("[data-one]").onclick = function () { gen([k]); }; });
      /* génération : chaque texte est enregistré dès qu'il arrive, même si l'écran a été fermé ou a changé d'onglet entre-temps (27/11/2026) */
      /* plusieurs élèves en même temps (EPSD.pool, demande du 27/11/2026 : « c'est 1 par 1, donc c'est long ») ; une erreur n'arrête pas les autres */
      function gen(K) { var C0 = cls, M0 = MODE, PL0 = perLabel(P), ID = {}, ok = function (e) { return e && e.pr && e.pr.note != null && /^(eval|mixte)$/.test(e.pr.src || ""); }; K.forEach(function (k) { ID[k] = aid(k); });
        var NS = D.EL.filter(ok).map(function (e) { return +e.pr.note; }), MC = NS.length >= 3 ? NS.reduce(function (a, v) { return a + v; }, 0) / NS.length : null;
        if (!(window.EPSD && EPSD.reformuler && EPSD.pool)) { msg.textContent = "⚠ module commun indisponible (recharge la page)"; return; }
        msg.textContent = "Claude rédige (0 / " + K.length + ")…";
        EPSD.pool(K, function (k) { var e = D.EL.filter(function (z) { return z.k === k; })[0]; if (!e) return null;
          /* dispensé à l'évaluation sans note : « Dispensé(e) », sans Claude (demande du 28/11/2026) */
          if (M0 === "bulletin" && /DISP/i.test(String(e.st || "")) && !ok(e)) { var g0 = EPSD.genre ? EPSD.genre.get(e.n).g : ""; put(KAV, { id: ID[k], app: APP, cls: C0, mode: M0, per: PL0, k: k, t: g0 === "f" ? "Dispensée" : "Dispensé", ok: false }); var bd = ov.querySelector('[data-av="' + k + '"]'); if (bd && bd.getAttribute("data-aid") === ID[k]) bd.querySelector("[data-tx]").value = g0 === "f" ? "Dispensée" : "Dispensé"; return null; }
          return EPSD.reformuler(factsOf(D, e), { mode: M0, act: NOM, eleve: e.n, periode: PL0, moyClasse: MC, eviter: D.EL.filter(function (z) { return z.k !== k; }).map(function (z) { var a = get(KAV, ID[z.k] || aid(z.k)); return a && a.t ? { t: a.t, n: z.n } : null; }).filter(Boolean).slice(-3), textesClasse: D.EL.filter(function (z) { return z.k !== k; }).map(function (z) { var a = get(KAV, ID[z.k] || aid(z.k)); return a && a.t; }).filter(function (t) { return t && t.length > 20; }), note: ok(e) ? e.pr.note : null }).then(function (t) { t = String(t || "").trim(); put(KAV, { id: ID[k], app: APP, cls: C0, mode: M0, per: PL0, k: k, t: t, ok: false });
            var bx = ov.querySelector('[data-av="' + k + '"]'); if (bx && bx.getAttribute("data-aid") === ID[k]) { var tx = bx.querySelector("[data-tx]"); if (document.activeElement !== tx) tx.value = t; bx.querySelector("[data-ok]").checked = false; } }); },
          function (f, N) { msg.textContent = "Claude rédige (" + f + " / " + N + ")…"; })
          .then(function (errs) { msg.textContent = (errs.length < K.length ? "✓ Terminé : relis et coche ✓." : "") + (errs.length ? " ⚠ " + errs.length + " non rédigé(s) (" + errs[0] + ") : ✨ sur la ligne pour réessayer." : ""); }); }
      q("[data-gen]").onclick = function () { var K = D.EL.filter(function (e) { var a = get(KAV, aid(e.k)); return !(a && a.ok); }).map(function (e) { return e.k; }); if (!K.length) { msg.textContent = "Tous les avis sont déjà validés."; return; } gen(K); };
      q("[data-cpy]").onclick = function () { var L = D.EL.map(function (e) { var a = get(KAV, aid(e.k)); if (!a || !a.ok || !a.t) return null; var p = e.n.split(" "), up = p.filter(function (w) { return w === w.toUpperCase() && /[A-Z]/.test(w); }); return (up.length ? up.join(" ") + " " + p.filter(function (w) { return up.indexOf(w) < 0; }).join(" ") : e.n) + "\t" + a.t.replace(/\s+/g, " "); }).filter(Boolean).sort(function (a, b) { return a.localeCompare(b, "fr"); });
        if (!L.length) { msg.textContent = "Aucun avis coché ✓."; return; } var t = L.join("\n"); try { navigator.clipboard.writeText(t).then(function () { msg.textContent = "✓ " + L.length + " avis copiés (NOM Prénom, tabulation, avis)."; }, function () { prompt("Copie :", t); }); } catch (er) { prompt("Copie :", t); } };
      q("[data-prt]").onclick = function () { var hh = ""; try { hh = window.EPSR && EPSR.htmlHead ? EPSR.htmlHead({ act: NOM, titre: "Bilan de classe", ac: COL, nom: cls, classe: perLabel(D.P), date: new Date().toLocaleDateString("fr-FR") }) : ""; } catch (er) {}
        var t = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Bilan ' + esc(cls) + '</title><style>@page{size:A4 landscape;margin:10mm}body{font:10.5pt Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}table{border-collapse:collapse;width:100%}td,th{border:1px solid #C9C3B6;padding:4px 6px;vertical-align:top;text-align:left}th{background:#F5F3EE}</style></head><body>' + hh +
          "<table><tr><th>Élève</th><th>Note proposée</th><th>Éval. leçon</th><th>Situations</th><th>Présence</th><th>" + (MODE === "bulletin" ? "Appréciation" : "Avis") + "</th></tr>" + D.EL.map(function (e) { var a = get(KAV, aid(e.k)) || {}; return "<tr><td>" + esc(e.n) + "</td><td>" + (e.pr && e.pr.note != null ? n20(e.pr.note) + "/20" : "—") + "</td><td>" + (e.le != null ? String(Math.round(e.le * 10) / 10).replace(".", ",") + "/3" : "—") + "</td><td>" + pcs(e.sit) + "</td><td>" + (D.D.length - e.nAbs) + "/" + D.D.length + "</td><td>" + esc(a.ok ? a.t : "") + "</td></tr>"; }).join("") + "</table></body></html>";
        var md = document.createElement("div"); md.className = "lc-modal"; md.style.zIndex = "2147483400"; md.innerHTML = '<div style="max-width:1000px;width:100%"><div class="lc-row"><h2 style="flex:1;margin:0">🖨 Bilan de classe</h2><button type="button" class="lc-b p" data-p>🖨 Imprimer / PDF</button><button type="button" class="lc-b" data-x>Fermer</button></div><iframe title="Bilan" style="width:100%;height:70vh;border:1.5px solid #E6E1D6;border-radius:10px;background:#fff"></iframe></div>';
        document.body.appendChild(md); var f = md.querySelector("iframe"); f.srcdoc = t; md.querySelector("[data-x]").onclick = function () { md.remove(); }; md.querySelector("[data-p]").onclick = function () { try { f.contentWindow.print(); } catch (er) {} }; };
    }
    /* 📜 Protocole (classes de terminale) : interprétation du référentiel national du CCF à partir de la grille de l'appli :
       fin de séquence 12 pts (Bac général : AFL1 ; Bac pro : AFLP1 7 pts + AFLP2 5 pts), fil de la séquence 8 pts sur 2 AFL / AFLP,
       répartition 4-4 / 6-2 / 2-6 choisie par l'élève ; degrés d'après l'évaluation, sinon l'auto-positionnement (eps-eval.js M.prop, case CCF). */
    /* 📅 Leçons du jour : pour chaque leçon (jour) de la classe, positionnement et note par élève d'après ses résultats aux situations
       (✅ = 2, 🟠 = 1, ❌ = 0 → taux de réussite) et l'évaluation de leçon de l'enseignant (participation, sérieux, thème, 0 à 3) :
       score = 70 % réussite + 30 % évaluation de leçon (ou l'un des deux s'il manque) ; degré 1 < 25 % ≤ degré 2 < 50 % ≤ degré 3 < 75 % ≤ degré 4 ; note = score × 20. */
    function jourData(D) { var R = {}, days = {};
      all(KS).filter(function (x) { return same(x.cls, cls) && inP(x.day); }).forEach(function (x) { days[x.day] = days[x.day] || {}; var r = R[x.ek + "|" + x.day] = R[x.ek + "|" + x.day] || { s: 0, n: 0 };
        Object.keys(x.r || {}).forEach(function (q) { if (/@auto$/.test(q)) return; var v = x.r[q]; if (v === 0 || v === 1 || v === 2) { r.s += v; r.n += 2; } }); });
      all(KE).filter(function (x) { return same(x.cls, cls) && inP(x.day); }).forEach(function (x) { days[x.day] = days[x.day] || {}; if (x.lec) days[x.day].lec = x.lec; if (x.theme) days[x.day].th = x.theme;
        Object.keys(x.el || {}).forEach(function (k) { var e = x.el[k], V = ["p", "s", "t"].map(function (f) { return e[f]; }).filter(function (v) { return v != null; }); if (!V.length) return; var r = R[k + "|" + x.day] = R[k + "|" + x.day] || { s: 0, n: 0 }; r.le = V.reduce(function (a, b) { return a + b; }, 0) / (3 * V.length); }); });
      var DS = Object.keys(days).sort(), cell = function (k, d) { var r = R[k + "|" + d]; if (!r) return null; var t = r.n ? r.s / r.n : null, a = Math.max(0, Math.min(100, noteCfg().jourSit)) / 100, sc = t != null && r.le != null ? a * t + (1 - a) * r.le : t != null ? t : r.le; if (sc == null) return null;
        return { sc: sc, deg: degOf(sc), note: Math.round(sc * 80) / 4 }; };
      return { DS: DS, days: days, cell: cell }; }
    function inP(d) { return P && P.from ? d >= P.from && d <= (P.to || "9999") : true; }
    function jourHtml(D) { var J = jourData(D), DEG = ["#fbe3e3", "#fdf0d9", "#e1f0f9", "#def1e5"];
      if (!J.DS.length) return '<p class="lc-mut">Aucun résultat de leçon sur la période : les élèves notent leurs situations pendant 📡 Leçon en cours, et tu évalues la leçon avec 📊 Évaluer la leçon.</p>';
      var h = '<div style="overflow:auto"><table class="lc-tab"><tr><th>Élève</th>' + J.DS.map(function (d) { var x = J.days[d], l = x.lec && get(KL, x.lec); return '<th title="' + esc(l ? titreL(l) : x.th || "") + '">' + d.slice(8, 10) + "/" + d.slice(5, 7) + (l && l.num ? "<br><small>L" + esc(l.num) + "</small>" : "") + "</th>"; }).join("") + "<th>Moyenne</th><th>Degré</th></tr>";
      h += D.EL.map(function (e) { var C = J.DS.map(function (d) { return J.cell(e.k, d); }), ok = C.filter(Boolean), m = ok.length ? ok.reduce(function (a, c) { return a + c.sc; }, 0) / ok.length : null;
        return "<tr><td><b>" + esc(e.n) + "</b></td>" + C.map(function (c) { return "<td>" + (c ? '<span class="lc-tag" style="background:' + DEG[c.deg] + '">D' + (c.deg + 1) + "</span> " + n20(c.note) : '<span class="lc-mut">—</span>') + "</td>"; }).join("") +
          "<td><b>" + (m != null ? n20(Math.round(m * 40) / 2) : "—") + "</b></td><td>" + (m != null ? '<span class="lc-tag" style="background:' + DEG[degOf(m)] + '">D' + (degOf(m) + 1) + "</span>" : "—") + "</td></tr>"; }).join("") + "</table></div>";
      return h + '<div class="lc-row"><button type="button" class="lc-b" data-jcp>📋 Copier les moyennes (Pronote)</button><span class="lc-mut" data-jmsg style="margin:0"></span></div>' +
        '<p class="lc-mut">Calcul : ' + noteCfg().jourSit + ' % réussite aux situations (✅ 2 · 🟠 1 · ❌ 0) + ' + (100 - noteCfg().jourSit) + ' % évaluation de leçon (participation, sérieux, thème). Degrés : seuils ' + noteCfg().th.join(" / ") + ' % ; note = score × 20. Réglable dans ⚙ Réglages → 🎛 Paramètres. Proposition : tu gardes la décision.</p>'; }
    function jourBind(D) { var b = ov.querySelector("[data-jcp]"); if (!b) return; b.onclick = function () { var J = jourData(D), t = D.EL.map(function (e) { var ok = J.DS.map(function (d) { return J.cell(e.k, d); }).filter(Boolean); return ok.length ? e.n + "\t" + n20(Math.round(ok.reduce(function (a, c) { return a + c.sc; }, 0) / ok.length * 40) / 2) : ""; }).filter(Boolean).join("\n");
      if (!t) return; try { navigator.clipboard.writeText(t).then(function () { ov.querySelector("[data-jmsg]").textContent = "✓ Copié."; }, function () { prompt("Copie :", t); }); } catch (er) { prompt("Copie :", t); } }; }
    /* 🏁 note de séquence = part « leçons » (moyenne des notes de leçon de la période) + part « évaluations » (protocole CCF et modalités notées) ; parts réglables */
    function seqRows(D, X) { var J = jourData(D), a = Math.max(0, Math.min(100, noteCfg().seqLec)) / 100, M = mods(cls);
      return D.EL.map(function (e) { var ok = J.DS.map(function (d) { return J.cell(e.k, d); }).filter(Boolean), L = ok.length ? ok.reduce(function (s, c) { return s + c.sc; }, 0) / ok.length : null;
        var E = []; if (e.pr && e.pr.note != null) E.push(e.pr.note / 20); M.forEach(function (m) { var N = modNote(m, (modRes(m, cls).el || {})[e.k]); if (N) E.push(N.sc); });
        var Ev = E.length ? E.reduce(function (s, x) { return s + x; }, 0) / E.length : null, sc = L != null && Ev != null ? a * L + (1 - a) * Ev : L != null ? L : Ev;
        return { e: e, L: L, Ev: Ev, nE: E.length, sc: sc }; }); }
    function seqNoteHtml(D, X) { var R = seqRows(D, X), c = noteCfg(), DEG = ["#fbe3e3", "#fdf0d9", "#e1f0f9", "#def1e5"], f = function (x) { return x == null ? "—" : n20(Math.round(x * 80) / 4); };
      return '<div style="overflow:auto"><table class="lc-tab"><tr><th>Élève</th><th>Leçons (' + c.seqLec + ' %)</th><th>Évaluations (' + (100 - c.seqLec) + ' %)</th><th>Note de séquence /20</th><th>Degré</th></tr>' +
        R.map(function (r) { return "<tr><td><b>" + esc(r.e.n) + "</b></td><td>" + f(r.L) + "</td><td>" + f(r.Ev) + (r.nE > 1 ? ' <small class="lc-mut">(' + r.nE + ")</small>" : "") + "</td><td><b>" + f(r.sc) + "</b></td><td>" + (r.sc != null ? '<span class="lc-tag" style="background:' + DEG[degOf(r.sc)] + '">D' + (degOf(r.sc) + 1) + "</span>" : "—") + "</td></tr>"; }).join("") + "</table></div>" +
        '<div class="lc-row"><button type="button" class="lc-b" data-scp>📋 Copier les notes (Pronote)</button><span class="lc-mut" data-smsg style="margin:0"></span></div>' +
        '<p class="lc-mut">Leçons : moyenne des notes de leçon de la période choisie. Évaluations : note du protocole et de tes modalités notées (moyenne). Parts réglables dans ⚙ Réglages → 🎛 Paramètres (Notes et évaluation).</p>'; }
    function seqBind(D, X) { var b = ov.querySelector("[data-scp]"); if (!b) return; b.onclick = function () { var t = seqRows(D, X).filter(function (r) { return r.sc != null; }).map(function (r) { return r.e.n + "\t" + n20(Math.round(r.sc * 80) / 4); }).join("\n"); if (!t) return;
      try { navigator.clipboard.writeText(t).then(function () { ov.querySelector("[data-smsg]").textContent = "✓ Copié."; }, function () { prompt("Copie :", t); }); } catch (e) { prompt("Copie :", t); } }; }
    function modNotesHtml(D) { var M = mods(cls); if (!M.length) return '<p class="lc-mut">Aucune modalité pour cette classe.</p><button type="button" class="lc-b p" data-modopen>🧪 Créer une modalité d\'évaluation</button>';
      return '<div style="overflow:auto"><table class="lc-tab"><tr><th>Élève</th>' + M.map(function (m) { return "<th>" + esc(m.nom) + " <small>/" + (m.total || 20) + "</small></th>"; }).join("") + "</tr>" +
        D.EL.map(function (e) { return "<tr><td><b>" + esc(e.n) + "</b></td>" + M.map(function (m) { var N = modNote(m, (modRes(m, cls).el || {})[e.k]); return "<td>" + (N ? n20(N.note) + ' <small class="lc-mut">D' + (degOf(N.sc) + 1) + "</small>" : "—") + "</td>"; }).join("") + "</tr>"; }).join("") + "</table></div>" +
        '<div class="lc-row"><button type="button" class="lc-b" data-modopen>🧪 Ouvrir mes modalités (évaluer, modifier)</button></div>'; }
    function protoHtml(D, X) {
      if (!X) return '<p class="lc-mut">Pas de grille d\'évaluation dans cette appli : le positionnement selon le protocole n\'est pas disponible.</p>';
      var cc = X.M.ccf(cls), FIN = /^AFL1\b|^AFLP[12]\b/i, codes = ((D.EL.filter(function (e) { return e.pr && e.pr.afl; })[0] || {}).pr || { afl: [] }).afl.map(function (a) { return a.code; });
      var CC = { escalade: "esc", badminton: "bad", crosstraining: "ct", orientation: "ori" }[APP];
      var h = '<div class="lc-row"><b>Protocole</b><select class="lc-sel" data-pv><option value="gt"' + (cc.voie !== "pro" ? " selected" : "") + '>🎓 Bac général</option><option value="pro"' + (cc.voie === "pro" ? " selected" : "") + '>🛠 Bac pro</option></select>' +
        '<span class="lc-mut" style="margin:0">' + (cc.voie === "pro" ? "Fin de séquence 12 pts (AFLP1 7 + AFLP2 5) · au fil de la séquence 8 pts sur 2 AFLP" : "Fin de séquence 12 pts (AFL1) · au fil de la séquence 8 pts (AFL2 + AFL3)") + ", répartition 4-4, 6-2 ou 2-6 choisie par l\'élève.</span>" +
        (CC ? '<a class="lc-b s" href="../ccf/" target="_top" style="text-decoration:none;display:inline-flex;align-items:center">📜 Protocole de l\'établissement (appli CCF) ↗</a>' : "") + "</div>";
      if (!codes.length) return h + '<p class="lc-mut">Aucun élève évalué ni auto-positionné pour l\'instant : évalue dans l\'onglet Évaluation (critères rattachés à un AFL), le positionnement apparaîtra ici.</p>';
      var tot = function (e, f) { var t = 0, ok = false; (e.pr.afl || []).forEach(function (a) { if (f(a.code) && a.ccf != null) { t += a.ccf; ok = true; } }); return ok ? t : null; };
      h += '<div style="overflow:auto"><table class="lc-tab"><tr><th>Élève</th>' + codes.map(function (c) { return "<th>" + esc(c) + (FIN.test(c) ? " <small>(fin)</small>" : " <small>(fil)</small>") + "</th>"; }).join("") + '<th>Répartition (fil)</th><th>🙋 Auto-pos.</th><th>Fin /12</th><th>Fil /8</th><th>Note /20</th><th>Source</th></tr>' +
        D.EL.map(function (e) { if (!e.pr || !e.pr.afl) return '<tr><td><b>' + esc(e.n) + '</b></td><td colspan="' + (codes.length + 6) + '" class="lc-mut">' + (e.st || "non évalué") + "</td></tr>";
          var ch = e.E ? X.M.choix(cls, e.E) : "4-4", fi = tot(e, function (c) { return FIN.test(c); }), fl = tot(e, function (c) { return !FIN.test(c); }), ap = e.ap && (e.ap.ev || e.ap.r || e.ap.m);
          return "<tr><td><b>" + esc(e.n) + "</b>" + (e.st ? ' <span class="lc-tag">' + esc(e.st) + "</span>" : "") + "</td>" + codes.map(function (c) { var a = e.pr.afl.filter(function (x) { return x.code === c; })[0];
              return "<td>" + (a && a.deg != null ? '<span class="lc-tag" style="background:' + ["#fbe3e3", "#fdf0d9", "#e1f0f9", "#def1e5"][a.deg] + '">D' + (a.deg + 1) + "</span> " + (a.ccf != null ? n20(a.ccf) + "/" + n20(a.ccfMax) : "") : "—") + "</td>"; }).join("") +
            '<td><select class="lc-sel" data-ch="' + esc(e.k) + '"' + (e.E ? "" : " disabled") + ">" + ["4-4", "6-2", "2-6"].map(function (o) { return "<option" + (o === ch ? " selected" : "") + ">" + o + "</option>"; }).join("") + "</select></td>" +
            "<td>" + (ap ? "✓" : "—") + "</td><td>" + n20(fi) + "</td><td>" + n20(fl) + "</td><td><b>" + (e.pr.note != null ? n20(e.pr.note) : "—") + "</b></td><td class=\"lc-mut\">" + ({ eval: "évaluation", mixte: "évaluation + auto-pos.", auto: "auto-positionnement" }[e.pr.src] || "") + "</td></tr>"; }).join("") + "</table></div>" +
        '<div class="lc-row"><button type="button" class="lc-b" data-pcp>📋 Copier les notes (Pronote)</button><span class="lc-mut" data-pmsg style="margin:0"></span></div>' +
        '<p class="lc-mut">Interprétation du protocole : chaque critère de la grille compte pour son AFL. Fin de séquence : degré + position dans le degré. Fil de la séquence : barème officiel selon la répartition choisie. L\'enseignant garde la décision.</p>';
      return h; }
    function protoBind(D, X) { if (!X) return; var q = function (s) { return ov.querySelector(s); };
      var pv = q("[data-pv]"); if (pv) pv.onchange = function () { X.M.setCcf(cls, { on: true, voie: pv.value }); draw(); };
      ov.querySelectorAll("[data-ch]").forEach(function (sl) { sl.onchange = function () { var e = D.EL.filter(function (z) { return z.k === sl.dataset.ch; })[0]; if (e && e.E) { X.M.setChoix(cls, e.E, sl.value); draw(); } }; });
      var cp = q("[data-pcp]"); if (cp) cp.onclick = function () { var t = D.EL.filter(function (e) { return e.pr && e.pr.note != null; }).map(function (e) { return e.n + "\t" + n20(e.pr.note); }).join("\n"); if (!t) { q("[data-pmsg]").textContent = "Aucune note."; return; }
        try { navigator.clipboard.writeText(t).then(function () { q("[data-pmsg]").textContent = "✓ Notes copiées (élève, tabulation, note)."; }, function () { prompt("Copie :", t); }); } catch (er) { prompt("Copie :", t); } }; }
    draw();
  }
  if (/[?&]console=classe/.test(location.search) && !VUE) (function w(n) { if (window.EPSD && document.body && (window.EPSE_INST || n > 20)) { var m = location.search.match(/[?&]cls=([^&]+)/); clOpen({ cls: m ? decodeURIComponent(m[1]) : "", noClose: true }); return; } if (n < 60) setTimeout(function () { w(n + 1); }, 150); })(0);
  window.addEventListener("resize", function () { clearTimeout(studio.t); studio.t = setTimeout(function () { if (OV && OV.style.display !== "none" && EDIT && TAB === "lec") { saveEdit(); draw(); } }, 300); });


  /* ---- programmation d'après l'emploi du temps (appli EDT, EPSD.edtSlots) ---- */
  function edtSlots(c, n) { try { return window.EPSD && EPSD.edtSlots ? EPSD.edtSlots(c, CODE, Date.now(), n || 40) : null; } catch (e) { return null; } }
  function progPlan(c) {
    var S = edtSlots(c, 60); if (S === null) return null;
    var used = []; lecons().forEach(function (l) { (l.prog || []).forEach(function (p) { if (same(p.c, c)) used.push(p.at); }); });
    S = S.filter(function (x) { return !used.some(function (u) { return Math.abs(u - x.at) < 3600e3; }); });
    var L = lecons().filter(function (l) { return l.statut !== "brouillon" && forCls(l, c) && !(l.prog || []).some(function (p) { return same(p.c, c); }); }); /* déjà programmée pour cette classe (à venir ou faite) : non reprise */
    var out = []; for (var i = 0; i < L.length && i < S.length; i++) out.push({ l: L[i], at: S[i].at });
    return { plan: out, rest: L.length - out.length, slots: S.length };
  }
  function autoProg(box) {
    if (!box) return; var CC = (SELC && SELC.length ? SELC : (cur() ? [cur().nom] : [])).slice();
    if (!CC.length) { var K = classes(); box.innerHTML = '<div class="lc-box"><b>📅 Pour quelle classe ?</b><div class="lc-row">' + (K.length ? K.map(function (c) { return '<button type="button" class="lc-b s" data-apc="' + esc(c) + '">' + esc(c) + "</button>"; }).join("") : '<span class="lc-mut">Aucune classe : importe d\'abord ta liste.</span>') + "</div></div>";
      box.querySelectorAll("[data-apc]").forEach(function (b) { b.onclick = function () { SELC = [b.dataset.apc]; autoProg(box); }; }); return; }
    var P = CC.map(function (c) { return { c: c, r: progPlan(c) }; });
    if (P.every(function (x) { return x.r === null; })) { box.innerHTML = '<div class="lc-warn">Pas d\'emploi du temps sur cette tablette : ouvre l\'appli EDT (mode enseignant) et choisis ton prénom (« Qui es-tu ? »), puis reviens ici.</div>'; return; }
    var n = 0, h = '<div class="lc-box"><h3 style="margin-top:4px">📅 Programmer d\'après l\'emploi du temps</h3><p class="lc-mut">Les leçons validées, dans l\'ordre de la séquence, sont placées sur les prochains cours de ' + esc(NOM) + ' de la classe. Le jour venu, chacune s\'ouvre toute seule sur les tablettes élèves (compte à rebours avant). Déjà programmées et brouillons : non touchés.</p>';
    P.forEach(function (x) { var r = x.r; h += "<p><b>" + esc(x.c) + "</b></p>";
      if (!r) { h += '<p class="lc-mut">Pas d\'emploi du temps.</p>'; return; }
      if (!r.plan.length) { h += '<p class="lc-mut">' + (r.slots ? "Aucune leçon validée à programmer (toutes déjà programmées ?)." : "Aucun cours de " + esc(NOM) + " à venir dans l'emploi du temps.") + "</p>"; return; }
      n += r.plan.length; h += r.plan.map(function (p) { return '<div class="lc-row"><span class="lc-tag pg">📅 ' + esc(hm(p.at)) + "</span> " + esc(titreL(p.l)) + "</div>"; }).join("") + (r.rest > 0 ? '<p class="lc-mut">' + r.rest + " leçon(s) sans cours disponible dans l'emploi du temps.</p>" : ""); });
    h += '<div class="lc-row">' + (n ? '<button type="button" class="lc-b p" data-apok>✓ Programmer ces ' + n + " leçon(s)</button>" : "") + '<button type="button" class="lc-b" data-apx>Fermer</button></div></div>';
    box.innerHTML = h;
    box.querySelector("[data-apx]").onclick = function () { box.innerHTML = ""; };
    var ok = box.querySelector("[data-apok]"); if (ok) ok.onclick = function () { P.forEach(function (x) { if (!x.r) return; x.r.plan.forEach(function (p) { var l = get(KL, p.l.id) || p.l; l.prog = (l.prog || []).filter(function (q) { return !(same(q.c, x.c) && Math.abs(q.at - p.at) < 6e4); }); l.prog.push({ c: x.c, at: p.at }); put(KL, l); }); });
      box.innerHTML = '<div class="lc-box">✓ ' + n + " leçon(s) programmée(s). Elles s'ouvriront toutes seules à l'heure du cours.</div>"; setTimeout(draw, 1500); };
  }
  /* prochaine leçon programmée pour une classe (contrôle « Tout est prêt ? ») */
  function nextProg(c) { var best = null; lecons().forEach(function (l) { if (l.statut === "brouillon") return; (l.prog || []).forEach(function (p) { if (same(p.c, c) && p.at > Date.now() - 2 * 3600e3 && (!best || p.at < best.at)) best = { at: p.at, l: l }; }); }); return best; }
  /* ---- liste des leçons ---- */
  function drawList() {
    var L = lecons(), S = seqs(), br = L.filter(function (l) { return l.statut === "brouillon"; }).length, CC = classes();
    if (SELC === null) { var c0 = cur(); SELC = c0 ? [c0.nom] : []; }
    SELC = SELC.filter(function (c) { return CC.some(function (x) { return same(x, c); }); });
    var nd = docList().filter(function (d) { return d.use && !L.some(function (l) { return l.doc === d.id; }); }).length;
    var h = '<h2>Mes fiches de leçon</h2><p class="lc-mut">Fiches de leçon de ' + esc(NOM) + ". Les élèves ne voient que les leçons validées ✓, programmées ou lancées.</p>" +
      '<div class="lc-row"><button type="button" class="lc-b p" data-new>＋ Nouvelle leçon</button><button type="button" class="lc-b" data-ai>✨ Proposer avec Claude</button>' +
      trames().map(function (t, k) { return '<button type="button" class="lc-b" data-trame="' + k + '">📥 Trame proposée : ' + esc(t.nom) + "</button>"; }).join("") +
      (nd ? '<button type="button" class="lc-b" data-imall>📥 Mettre en fiches mes documents (' + nd + ")</button>" : "") +
      '<button type="button" class="lc-b" data-bankopen>🏦 Banque & apprentissages</button><button type="button" class="lc-b" data-autoprog>📅 Programmer d\'après l\'emploi du temps</button>' +
      '<button type="button" class="lc-b" data-docs title="Tes leçons rédigées (Word, PDF, photo…) : dépose-les, puis « Mettre en fiches » les range selon ton modèle, dans la séquence de ton choix">📥 Importer mes leçons rédigées' + (docList().length ? " (" + docList().length + ")" : "") + "</button>" +
      '<details class="lc-more"><summary class="lc-b">⋯ Plus</summary><div>' + (L.length ? '<button type="button" class="lc-b" data-printseq>🖨 Imprimer une séquence</button>' : "") + (L.length ? '<button type="button" class="lc-b" data-refall title="Toutes les fiches de l\'activité rangées selon ton modèle (importées de Word, de documents…)">🔁 Remettre en forme toutes les fiches</button>' : "") + "</div></details></div>" +
      (CC.length ? '<div class="lc-box"><b>👥 Séquence par classe</b><p class="lc-mut" style="margin:2px 0 6px">Touche une ou plusieurs classes, puis « ＋ Attribuer » sur les leçons à leur proposer : chaque classe a sa propre séquence. Une classe sans leçon attribuée garde toutes les leçons.</p><div class="lc-row">' +
        CC.map(function (c) { var on = SELC.some(function (x) { return same(x, c); }); return '<button type="button" class="lc-b s' + (on ? " p" : "") + '" data-selc="' + esc(c) + '" title="' + (vClasse(c) === "pro" ? "Voie professionnelle" : "Voie générale") + '">' + (on ? "✓ " : "") + esc(c) + "</button>"; }).join("") +
        (SELC.length ? '<button type="button" class="lc-b s" data-selc0>✕ Aucune</button>' : "") + "</div></div>" : "") +
      (br ? '<div class="lc-warn">✨ ' + br + " brouillon" + (br > 1 ? "s" : "") + " de Claude à relire : invisible" + (br > 1 ? "s" : "") + " pour les élèves tant que tu n'as pas validé.</div>" : "");
    h += '<div data-apbox></div>';
    if (!L.length) h += '<div class="lc-box">Aucune leçon pour l\'instant. Crée-en une, ou dépose tes documents (séquence, fiches de leçon) puis demande à Claude de les mettre en forme.</div>';
    function card(l, k) {
      var pg = (l.prog || []).filter(function (p) { return p.at > Date.now() - 3 * 3600e3; }).sort(function (a, b) { return a.at - b.at; })[0];
      var n = SELC.filter(function (c) { return expl(l, c); }).length, all0 = SELC.length && n === SELC.length;
      return '<div class="lc-card" data-id="' + l.id + '"><div class="t"><b>' + (k ? '<span class="lc-tag pg">' + k + "</span> " : "") + esc(titreL(l)) + (l.statut === "brouillon" ? '<span class="lc-tag br">✨ brouillon à relire</span>' : '<span class="lc-tag ok">✓ validée</span>') + (l.voie ? '<span class="lc-tag">' + (l.voie === "pro" ? "🛠 voie pro" : "🎓 voie GT") + "</span>" : "") + (pg ? '<span class="lc-tag pg">📅 ' + esc(pg.c) + " · " + esc(hm(pg.at)) + "</span>" : "") + "</b><small>" + esc(l.but || l.objM || "") + '</small><small style="display:block">👥 ' + esc(clsTxt(l)) + "</small></div>" +
        (SELC.length ? '<button type="button" class="lc-b s' + (all0 ? " p" : "") + '" data-att="' + l.id + '">' + (all0 ? "✓ Attribuée" : n ? "◐ " + n + "/" + SELC.length + " · compléter" : "＋ Attribuer") + "</button>" : "<span>›</span>") + "</div>";
    }
    if (SELC.length) {
      var A = L.filter(function (l) { return SELC.every(function (c) { return expl(l, c); }); }), O = L.filter(function (l) { return A.indexOf(l) < 0; });
      h += "<h3>📚 Séquence de " + esc(SELC.join(" + ")) + " (" + A.length + " leçon" + (A.length > 1 ? "s" : "") + ")</h3>" + (A.length ? '<div class="lc-cards">' + A.map(function (l, i) { return card(l, "L" + (i + 1)); }).join("") + "</div>" : '<div class="lc-box">Aucune leçon attribuée : touche « ＋ Attribuer » sur les leçons ci-dessous.</div>');
      if (O.length) h += "<h3>Autres leçons</h3>" + '<div class="lc-cards">' + O.map(function (l) { return card(l); }).join("") + "</div>";
    } else S.forEach(function (s) {
      h += "<h3>📚 " + esc(s) + "</h3>";
      h += '<div class="lc-cards">'; L.filter(function (l) { return (l.seq || "Sans séquence") === s; }).forEach(function (l) { h += card(l); }); h += "</div>";
    });
    var el = shell(h);
    var apb = el.querySelector("[data-autoprog]"); if (apb) apb.onclick = function () { autoProg(el.querySelector("[data-apbox]")); };
    el.querySelector("[data-new]").onclick = function () { var l = fromModel(S[S.length - 1] && S[S.length - 1] !== "Sans séquence" ? S[S.length - 1] : ""); l.cr = Date.now(); l.num = String(L.filter(function (x) { return x.seq === l.seq; }).length + 1); put(KL, l); EDIT = l.id; draw(); };
    el.querySelector("[data-ai]").onclick = function () { aiDialog(); };
    el.querySelector("[data-docs]").onclick = function () { TAB = "docs"; draw(); };
    el.querySelectorAll("[data-id]").forEach(function (c) { c.onclick = function () { EDIT = c.dataset.id; draw(); }; });
    el.querySelectorAll("[data-selc]").forEach(function (b) { b.onclick = function () { var c = b.dataset.selc; SELC = SELC.some(function (x) { return same(x, c); }) ? SELC.filter(function (x) { return !same(x, c); }) : SELC.concat([c]); draw(); }; });
    var s0 = el.querySelector("[data-selc0]"); if (s0) s0.onclick = function () { SELC = []; draw(); };
    el.querySelectorAll("[data-att]").forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); var l = get(KL, b.dataset.att); if (!l) return; var allIn = SELC.every(function (c) { return expl(l, c); });
      var autres = l.voie ? SELC.filter(function (c) { return vClasse(c) !== l.voie; }) : []; if (!allIn && autres.length && !confirm("Cette leçon est écrite pour la " + (l.voie === "pro" ? "voie professionnelle (AFLP)" : "voie générale (AFL)") + ", mais " + autres.join(", ") + (autres.length > 1 ? " sont" : " est") + " en " + (l.voie === "pro" ? "voie générale" : "voie professionnelle") + ". L'attribuer quand même ?")) return;
      setCls(l, SELC, !allIn); put(KL, l); var y = OV.querySelector(".lc-body").scrollTop; draw(); OV.querySelector(".lc-body").scrollTop = y; }; });
    var im = el.querySelector("[data-imall]"); if (im) im.onclick = importAll;
    el.querySelectorAll("[data-trame]").forEach(function (b) { b.onclick = function () { addTrame(trames()[+b.dataset.trame]); }; });
    var bko = el.querySelector("[data-bankopen]"); if (bko) bko.onclick = function () { bankOpen(); };
    var pq = el.querySelector("[data-printseq]"); if (pq) pq.onclick = function () { var md = document.createElement("div"); md.className = "lc-modal";
      md.innerHTML = '<div><h2>🖨 Quelle séquence ?</h2><div class="lc-row">' + S.map(function (q, i) { return '<button type="button" class="lc-b" data-q="' + i + '">' + esc(q) + " (" + L.filter(function (l) { return (l.seq || "Sans séquence") === q; }).length + ")</button>"; }).join("") + '</div><div class="lc-row"><button type="button" class="lc-b" data-x>Annuler</button></div></div>';
      document.body.appendChild(md); md.querySelector("[data-x]").onclick = function () { md.remove(); };
      md.querySelectorAll("[data-q]").forEach(function (b) { b.onclick = function () { var q = S[+b.dataset.q]; md.remove(); printOpen(L.filter(function (l) { return (l.seq || "Sans séquence") === q; }), NOM + " · " + q); }; }); };
    var rfa = el.querySelector("[data-refall]"); if (rfa) rfa.onclick = refmtAll;
  }

  /* ---- éditeur ---- */
  var WORK = null, SAVE_T = null;
  /* 📋 modèle de fiche : aide grisée dans chaque rubrique (structure de l'enseignant) + modèle enregistré, appliqué à toute nouvelle leçon */
  var PH = { objM: "Ce que l'élève apprend à faire (ex. éloigner l'adversaire en jouant en longueur)", objMe: "Comment il s'organise pour apprendre (observer, se fixer un projet, répéter…)", objS: "Rôle, entraide, règles (arbitre, coach, observateur…)",
    but: "Ce que l'élève doit réussir à la fin de la leçon, dit simplement", disp: "Organisation : groupes, terrains ou ateliers, rotations, espace", mat: "ex. 1 volant pour 2 · 1 chasuble par élève · 1 plot par groupe (les quantités se calculent avec les présents)",
    ech: "Consigne de l'échauffement (routine, durée, organisation)", t: "Titre court de la situation", cons: "Consigne : ce que font les élèves, organisation, durée, rotations",
    crQ: "Ce qu'il y a à faire pour être en réussite, qui se compte (ex. 8 réussites sur 10)", crQl: "Ce qu'il y a à faire pour être en réussite, qui s'observe (ex. le volant tombe au fond du terrain)", crR: "Ce qu'il y a à faire pour faire : comment faire (placements, gestes, prises d'information…)",
    simp: "− Pour simplifier (espace, distance, matériel, opposition…)", comp: "+ Pour complexifier", rem: "Situation plus large ou match qui reprend les acquis", remCr: "Je réussis si…", bilan: "Questions de bilan, ce qu'on retient, lien avec la leçon suivante", ap: "ex. smash, frappe haute (avec les mots que tu emploies dans tes conseils)" };
  var KMOD = "eps.console.v1";
  function modele() { return get(KMOD, "lcmod." + APP) || get(KMOD, "lcmod") || null; }
  function fromModel(seq) { var l = blank(seq), M = modele(); if (!M || !M.f) return l; var f = JSON.parse(JSON.stringify(M.f)); Object.keys(f).forEach(function (k) { l[k] = f[k]; }); if (!l.sits || !l.sits.length) l.sits = [{}, {}]; return l; }
  function modFields(l) { var f = {}; F.concat(RF).forEach(function (x) { if (l[x[0]]) f[x[0]] = l[x[0]]; }); if (l.duree) f.duree = l.duree; if (l.echImg) f.echImg = l.echImg;
    f.sits = (l.sits || []).map(function (s) { var o = {}; SF.forEach(function (x) { if (s[x[0]]) o[x[0]] = s[x[0]]; }); if (s.img) o.img = s.img; if (s.ind) o.ind = s.ind; return o; }); return f; }
  /* 🏦 banque de leçons et 🎯 apprentissages : chaque situation porte les apprentissages qu'elle travaille (s.ap, mots-clés) ;
     l'enseignant propose une situation à des élèves (eps.remed.v1, « rm| ») ou ses conseils écrits (commentaire validé d'évaluation)
     et le « à améliorer » de l'élève citent un apprentissage → l'élève retrouve la situation dans « 🎯 Travailler en autonomie ». */
  var KRM = "eps.remed.v1";
  function tnorm(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  function tagsOf(x) { return String((x && x.ap) || "").split(/[,;\n]/).map(function (t) { return t.trim(); }).filter(Boolean); }
  function allSits(onlyAuto) { var out = []; lecons().forEach(function (l) { if (l.statut === "brouillon") return; (l.sits || []).forEach(function (x, i) { if (onlyAuto && x.noauto) return; var T = tagsOf(x); if (!T.length && onlyAuto) return; out.push({ l: l, i: i, s: x, k: l.id + ":s" + i, tags: T }); }); }); return out; }
  function allTags() { var M = {}; allSits(false).forEach(function (o) { o.tags.forEach(function (t) { var k = tnorm(t); if (!k) return; (M[k] = M[k] || { t: t, n: 0 }).n++; }); }); return Object.keys(M).map(function (k) { return M[k]; }).sort(function (a, b) { return a.t.localeCompare(b.t, "fr"); }); }
  function sitTitle(o) { return (o.s.t ? o.s.t : "Situation " + (o.i + 1)) + " · " + titreL(o.l); }
  /* conseils écrits pour un élève (commentaire validé de l'enseignant, « à améliorer » de l'élève) qui citent un apprentissage */
  function conseils(cls, nom) {
    var E = []; try { E = (window.EPSD && EPSD.evalsOf) ? EPSD.evalsOf(nom, cls) : []; } catch (e) {}
    var P = tnorm(E.map(function (x) { return x.comm || ""; }).join(" ")), M = tnorm(E.map(function (x) { return x.apm || ""; }).join(" ")), out = [];
    allSits(true).forEach(function (o) { var why = ""; o.tags.forEach(function (t) { var k = tnorm(t); if (k.length < 3) return; if (!why && (" " + P + " ").indexOf(" " + k) >= 0) why = "Conseil de ton professeur : " + t; else if (!why && (" " + M + " ").indexOf(" " + k) >= 0) why = "Tu as écrit vouloir améliorer : " + t; }); if (why) out.push({ o: o, why: why }); });
    return out; }
  function recsOf(cls, nom) { return all(KRM).filter(function (r) { return r.app === APP && same(r.cls, cls) && ekey(r.el) === ekey(nom); }).sort(function (a, b) { return b.at - a.at; }); }
  function recOpen(L) {
    css();
    var C = classes(), c0 = (cur() && cur().nom) || C[0] || "", md = document.createElement("div"); md.className = "lc-modal";
    function draw(cls) { var R = roster(cls);
      md.innerHTML = '<div><h2>🎯 Proposer en autonomie</h2><p class="lc-mut">' + L.map(function (o) { return esc(sitTitle(o)); }).join("<br>") + '</p><label class="lc-f"><span>Classe</span><select class="lc-sel" data-c>' + C.map(function (c) { return "<option" + (same(c, cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select></label>" +
        '<p class="lc-mut">Touche les élèves concernés : ils retrouveront la situation dans « 🎯 Travailler en autonomie » sur les tablettes.</p><div class="lc-row" style="gap:6px">' + R.map(function (n, i) { var has = L.every(function (o) { return all(KRM).some(function (r) { return r.k === o.k && same(r.cls, cls) && ekey(r.el) === ekey(n); }); }); return '<button type="button" class="lc-b s" data-n="' + i + '" aria-pressed="' + has + '"' + (has ? ' style="background:' + COL + ';color:#fff;border-color:' + COL + '"' : "") + ">" + esc(n) + "</button>"; }).join("") + "</div>" +
        '<label class="lc-f"><span>Petit mot pour l\'élève (facultatif)</span><input data-t placeholder="ex. Travaille ton smash : frappe haute, devant toi"></label><div class="lc-row"><button type="button" class="lc-b p" data-ok>✓ Enregistrer</button><button type="button" class="lc-b" data-x>Fermer</button></div></div>';
      md.querySelector("[data-c]").onchange = function () { draw(this.value); }; md.querySelector("[data-x]").onclick = function () { md.remove(); };
      md.querySelectorAll("[data-n]").forEach(function (b) { b.onclick = function () { var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(on)); b.style.cssText = on ? "background:" + COL + ";color:#fff;border-color:" + COL : ""; }; });
      md.querySelector("[data-ok]").onclick = function () { var t = md.querySelector("[data-t]").value.trim(), n = 0;
        md.querySelectorAll("[data-n]").forEach(function (b) { var nom = R[+b.dataset.n], on = b.getAttribute("aria-pressed") === "true";
          L.forEach(function (o) { var id = nn(cls) + "|" + ekey(nom) + "|" + o.k, ex = get(KRM, id);
            if (on && !ex) { put(KRM, { id: id, app: APP, cls: cls, el: nom, k: o.k, tag: o.tags ? o.tags.join(", ") : tagsOf(o.s).join(", "), txt: t, at: Date.now(), st: 0 }); n++; }
            else if (on && ex && t) { ex.txt = t; put(KRM, ex); }
            else if (!on && ex) { ex.del = 1; put(KRM, ex); } }); });
        md.remove(); try { EPSD.syncSoon(); } catch (e) {} }; }
    document.body.appendChild(md); draw(c0);
  }
  function bankOpen(m0) {
    css();
    var md = document.createElement("div"), Q = "", TG = "", MODE = m0 || "banque", CSEQ = null, CCLS = (cur() && cur().nom) || edtClass() || classes()[0] || ""; md.className = "lc-modal";
    function modes() { return '<div class="lc-row" role="tablist" style="gap:6px">' + [["banque", "🏦 Banque"], ["sugg", "💡 Suggestions de remédiation"], ["carte", "🗺 Carte des apprentissages"]].map(function (m) { return '<button type="button" role="tab" class="lc-b s" data-mode="' + m[0] + '" aria-selected="' + (MODE === m[0]) + '"' + (MODE === m[0] ? ' style="background:' + COL + ';color:#fff;border-color:' + COL + '"' : "") + ">" + m[1] + "</button>"; }).join("") + '<span style="flex:1"></span><button type="button" class="lc-b s" data-ref>📚 Propositions vérifiées</button><button type="button" class="lc-b s" data-snew>✨ Préparer une situation</button></div>'; }
    function bindModes() { md.querySelectorAll("[data-mode]").forEach(function (b) { b.onclick = function () { MODE = b.dataset.mode; draw(); }; }); md.querySelector("[data-ref]").onclick = function () { refOpen(TG || Q); }; md.querySelector("[data-snew]").onclick = function () { sitNew(TG || Q, null); }; }
    function drawOther() {
      var C = classes(), h = '<div style="max-width:1100px"><div class="lc-row"><h2 style="flex:1;margin:0">🏦 Banque & apprentissages · ' + esc(NOM) + '</h2><button type="button" class="lc-b" data-x>✕ Fermer</button></div>' + modes() + '<div class="lc-row"><b>Classe</b><select class="lc-sel" data-cc>' + C.map(function (c) { return "<option" + (same(c, CCLS) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>";
      if (MODE === "carte") { var SQ = seqs(); if (!CSEQ || SQ.indexOf(CSEQ) < 0) CSEQ = SQ[0]; h += '<b>Séquence</b><select class="lc-sel" data-cs>' + SQ.map(function (q) { return "<option" + (q === CSEQ ? " selected" : "") + ">" + esc(q) + "</option>"; }).join("") + "</select></div>" + (CSEQ ? carteHtml(CSEQ, CCLS) : '<p class="lc-mut">Aucune séquence.</p>'); }
      else { var LW = lowsFor(CCLS); h += "</div>" + (!(window.EPSE_INST || []).length ? '<p class="lc-mut">Pas de grille d\'évaluation dans cette appli.</p>' : LW.length ? LW.map(function (e, ei) { return '<div class="lc-card"><div class="t"><b>' + esc(e.nom) + "</b></div>" + e.lows.map(function (x, xi) { var S = sitsForCrit(x.cr);
          return '<div style="margin:4px 0">📋 ' + esc(x.cr.nom || x.cr.id) + ' <span class="lc-mut" style="margin:0">degré ' + (x.d + 1) + "</span> → " + (S.length ? S.map(function (o, oi) { var ex = get(KRM, nn(CCLS) + "|" + ekey(e.nom) + "|" + o.k); return esc(o.s.t || "Situation " + (o.i + 1)) + (ex ? ' <span class="lc-tag">' + REC_ST[ex.st || 0] + "</span>" : ' <button type="button" class="lc-b s" data-sp="' + ei + ":" + xi + ":" + oi + '">🎯 Proposer</button>'); }).join(" · ") : '<span class="lc-mut" style="margin:0">aucune situation liée</span> <button type="button" class="lc-b s" data-sn="' + ei + ":" + xi + '">✨ Préparer</button>') + "</div>"; }).join("") + "</div>"; }).join("") +
          '<div class="lc-row"><button type="button" class="lc-b p" data-spall>🎯 Tout proposer</button></div>' : '<p class="lc-mut">Aucun élève avec un critère au degré 1 ou 2 dans cette classe (ou pas encore d\'évaluation).</p>'); 
        md._LW = LW; }
      md.innerHTML = h + "</div>"; bindModes(); md.querySelector("[data-x]").onclick = function () { md.remove(); };
      md.querySelector("[data-cc]").onchange = function () { CCLS = this.value; draw(); }; var cs = md.querySelector("[data-cs]"); if (cs) cs.onchange = function () { CSEQ = this.value; draw(); };
      md.querySelectorAll("[data-sp]").forEach(function (b) { b.onclick = function () { var p = b.dataset.sp.split(":"), e = md._LW[+p[0]], x = e.lows[+p[1]], o = sitsForCrit(x.cr)[+p[2]]; recAdd(CCLS, e.nom, o, "", "Critère « " + (x.cr.nom || "") + " » (degré " + (x.d + 1) + ")"); draw(); }; });
      md.querySelectorAll("[data-sn]").forEach(function (b) { b.onclick = function () { var p = b.dataset.sn.split(":"), x = md._LW[+p[0]].lows[+p[1]]; sitNew(x.cr.nom || "", x.cr); }; });
      var sa = md.querySelector("[data-spall]"); if (sa) sa.onclick = function () { var n = 0; md._LW.forEach(function (e) { e.lows.forEach(function (x) { var o = sitsForCrit(x.cr)[0]; if (o && recAdd(CCLS, e.nom, o, "", "Critère « " + (x.cr.nom || "") + " » (degré " + (x.d + 1) + ")")) n++; }); }); alert(n + " proposition(s) faite(s)."); draw(); };
    }
    function draw() { if (MODE !== "banque") return drawOther();
      var T = allTags(), S = allSits(false).filter(function (o) { var q = tnorm(Q); return (!TG || o.tags.some(function (t) { return tnorm(t) === TG; })) && (!q || tnorm(sitTitle(o) + " " + o.tags.join(" ") + " " + (o.s.cons || "")).indexOf(q) >= 0); });
      var B = lecons().filter(function (l) { var q = tnorm(Q); return l.banque && !TG && (!q || tnorm(titreL(l) + " " + (l.seq || "") + " " + (l.but || "")).indexOf(q) >= 0); });
      var RC = all(KRM).filter(function (r) { return r.app === APP; });
      md.innerHTML = '<div style="max-width:980px"><div class="lc-row"><h2 style="flex:1;margin:0">🏦 Banque & apprentissages · ' + esc(NOM) + '</h2><button type="button" class="lc-b" data-x>✕ Fermer</button></div>' + modes() +
        '<input class="lc-sel" data-q placeholder="Chercher : smash, service, relais…" value="' + esc(Q) + '" style="width:100%;margin:6px 0">' +
        '<div class="lc-row" style="gap:6px">' + (T.length ? T.map(function (t) { var on = tnorm(t.t) === TG; return '<button type="button" class="lc-b s" data-tg="' + esc(tnorm(t.t)) + '"' + (on ? ' style="background:' + COL + ';color:#fff;border-color:' + COL + '"' : "") + ">🎯 " + esc(t.t) + " <small>(" + t.n + ")</small></button>"; }).join("") : '<span class="lc-mut">Aucun apprentissage noté : dans une fiche, remplis « 🎯 Apprentissage travaillé » sous chaque situation (ex. smash).</span>') + "</div>" +
        "<h3>🏃 Situations (" + S.length + ")</h3>" + (S.map(function (o, j) { return '<div class="lc-card"><div class="t"><b>' + esc(sitTitle(o)) + "</b>" + o.tags.map(function (t) { return ' <span class="lc-tag">🎯 ' + esc(t) + "</span>"; }).join("") + (o.s.noauto ? ' <span class="lc-tag">pas en autonomie</span>' : "") + '</div><div class="lc-row" style="margin:4px 0 0"><button type="button" class="lc-b s" data-op="' + esc(o.l.id) + '">Ouvrir la fiche</button>' + (o.s.noauto || o.l.statut === "brouillon" ? "" : '<button type="button" class="lc-b s" data-rec="' + j + '">🎯 Proposer à des élèves</button>') + "</div></div>"; }).join("") || '<p class="lc-mut">Aucune situation.</p>') +
        (TG ? "" : "<h3>⭐ Leçons de ma banque (" + B.length + ")</h3>" + (B.map(function (l) { return '<div class="lc-card"><div class="t"><b>' + esc(titreL(l)) + '</b> <span class="lc-mut">' + esc(l.seq || "") + '</span></div><div class="lc-row" style="margin:4px 0 0"><button type="button" class="lc-b s" data-op="' + esc(l.id) + '">Ouvrir</button><button type="button" class="lc-b s" data-cp="' + esc(l.id) + '">⧉ Copier dans une séquence</button></div></div>'; }).join("") || '<p class="lc-mut">Range une leçon avec « ☆ Ranger dans ma banque » en haut de sa fiche : elle reste disponible d\'une année et d\'une séquence à l\'autre.</p>')) +
        "<h3>📬 Propositions en cours (" + RC.length + ")</h3>" + (RC.sort(function (a, b) { return b.at - a.at; }).slice(0, 60).map(function (r) { var l = get(KL, String(r.k).split(":")[0]); return '<div class="lc-row" style="margin:3px 0"><b>' + esc(r.el) + '</b> <span class="lc-mut">' + esc(r.cls) + "</span> · " + esc(r.tag || (l ? titreL(l) : "")) + " · " + REC_ST[r.st || 0] + ' <button type="button" class="lc-b s" data-rmr="' + esc(r.id) + '" aria-label="Retirer">✕</button></div>'; }).join("") || '<p class="lc-mut">Aucune.</p>') + "</div>";
      var q = md.querySelector("[data-q]"); q.oninput = function () { Q = q.value; var p = q.selectionStart; draw(); var q2 = md.querySelector("[data-q]"); q2.focus(); q2.setSelectionRange(p, p); };
      md.querySelector("[data-x]").onclick = function () { md.remove(); }; bindModes();
      md.querySelectorAll("[data-tg]").forEach(function (b) { b.onclick = function () { TG = TG === b.dataset.tg ? "" : b.dataset.tg; draw(); }; });
      md.querySelectorAll("[data-op]").forEach(function (b) { b.onclick = function () { md.remove(); if (!OV || OV.style.display === "none") open("edit", b.dataset.op); else { saveEdit(); TAB = "lec"; EDIT = b.dataset.op; draw(); } }; });
      md.querySelectorAll("[data-rec]").forEach(function (b) { b.onclick = function () { recOpen([S[+b.dataset.rec]]); }; });
      md.querySelectorAll("[data-rmr]").forEach(function (b) { b.onclick = function () { var r = get(KRM, b.dataset.rmr); if (r) { r.del = 1; put(KRM, r); } draw(); }; });
      md.querySelectorAll("[data-cp]").forEach(function (b) { b.onclick = function () { var l = get(KL, b.dataset.cp), sq = prompt("Dans quelle séquence ?", l.seq || ""); if (sq == null) return; var c = JSON.parse(JSON.stringify(l)); c.id = uid(); c.seq = sq; c.prog = []; c.cls = []; c.banque = false; c.cr = Date.now(); c.num = String(lecons().filter(function (x) { return x.seq === sq; }).length + 1); put(KL, c); md.remove(); open("edit", c.id); }; });
    }
    document.body.appendChild(md); draw();
  }
  /* 🎯 côté élève : « Travailler en autonomie » (aussi aperçu enseignant) */
  function autoOpen() {
    css(); var o = document.getElementById("lc-au"); if (!o) { o = document.createElement("div"); o.id = "lc-au"; o.className = "lc-st"; o.style.zIndex = "2147481500"; document.body.appendChild(o); }
    var C = classes(), cls = (cur() && cur().nom) || (C.length === 1 ? C[0] : ""), nom = "", view = null, TG = "";
    var img = function (id) { var im = id && get(KI, id); return im ? '<img class="lc-img" src="' + im.d + '" alt="schéma">' : ""; }, k = function (lab, t) { return t ? '<div class="k">' + lab + '</div><div class="lc-pre">' + esc(t) + "</div>" : ""; };
    function card(x, why, rec) { return '<button type="button" class="lc-au-c" data-k="' + esc(x.k) + '"><b>' + esc(x.s.t || "Situation " + (x.i + 1)) + "</b><span>" + esc(why || x.tags.join(" · ")) + "</span>" + (rec && rec.st ? "<i>" + ["", "essayée", "🟠", "✅"][rec.st] + "</i>" : "") + "</button>"; }
    function draw() {
      var h = '<div class="hd"><b>🎯 Travailler en autonomie</b><button type="button" data-x>✕ Fermer</button></div><div class="in">', S = allSits(true);
      if (!cls) h += '<div class="bk"><h3>Ta classe</h3><div class="lc-who">' + C.map(function (c) { return '<button type="button" data-cl="' + esc(c) + '">' + esc(c) + "</button>"; }).join("") + "</div></div>";
      else if (!nom) h += '<div class="bk"><h3>👤 Qui es-tu ?</h3><div class="lc-who">' + whoList(cls).map(function (n) { return '<button type="button" data-nm="' + esc(n) + '">' + esc(n) + "</button>"; }).join("") + "</div></div>";
      else if (view) { var x = S.filter(function (z) { return z.k === view; })[0] || allSits(false).filter(function (z) { return z.k === view; })[0]; if (!x) { view = null; return draw(); } var s = x.s, rec = recsOf(cls, nom).filter(function (r) { return r.k === x.k; })[0];
        h += '<div class="lc-row"><button type="button" class="lc-b s" data-back>← Retour</button></div><div class="bk"><h3>🏃 ' + esc(s.t || "Situation") + "</h3>" + (rec && rec.txt ? '<div class="lc-warn">💬 ' + esc(rec.txt) + "</div>" : "") + (s.cons ? '<div class="lc-pre">' + esc(s.cons) + "</div>" : "") + img(s.img) +
          k("✅ Je suis en réussite si…", [s.crQ, s.crQl].filter(Boolean).join("\n")) + k("💡 Comment faire…", s.crR) + k("⬇ Plus facile", s.simp) + k("⬆ Plus difficile", s.comp) +
          '<div class="res"><span>Mon résultat :</span>' + [2, 1, 0].map(function (v) { return '<button type="button" data-av="' + v + '">' + RES_I[v] + " " + RES_L[v] + "</button>"; }).join("") + '</div><div data-am style="color:#1E8449;font-weight:700"></div></div>'; }
      else { var R = recsOf(cls, nom), mine = [];
        R.forEach(function (r) { var x = S.filter(function (z) { return z.k === r.k; })[0]; if (x) mine.push({ x: x, why: (r.txt ? "💬 " + r.txt : "Proposée par ton professeur") + (r.tag ? " · " + r.tag : ""), r: r }); });
        conseils(cls, nom).forEach(function (c) { if (!mine.some(function (m) { return m.x.k === c.o.k; })) mine.push({ x: c.o, why: c.why }); });
        var T = allTags().filter(function (t) { return S.some(function (z) { return z.tags.some(function (u) { return tnorm(u) === tnorm(t.t); }); }); });
        h += '<div class="lc-row"><b style="flex:1;font-size:18px">👤 ' + esc(nom) + '</b><button type="button" class="lc-b s" data-chg>Changer</button></div>' +
          '<div class="bk"><h3>🎯 Pour toi</h3>' + (mine.length ? mine.map(function (m) { return card(m.x, m.why, m.r); }).join("") : "<div>Rien de proposé pour l'instant. Choisis ci-dessous ce que tu veux améliorer.</div>") + "</div>" +
          '<div class="bk"><h3>🔎 Je veux progresser sur…</h3><div class="lc-who">' + T.map(function (t) { return '<button type="button" data-tg="' + esc(tnorm(t.t)) + '" aria-pressed="' + (tnorm(t.t) === TG) + '"' + (tnorm(t.t) === TG ? ' class="on"' : "") + ">" + esc(t.t) + "</button>"; }).join("") + "</div>" +
          (TG ? S.filter(function (z) { return z.tags.some(function (u) { return tnorm(u) === TG; }); }).map(function (z) { return card(z, titreL(z.l)); }).join("") : "") + "</div>"; }
      o.innerHTML = h + "</div>"; o.style.display = "block";
      o.querySelector("[data-x]").onclick = function () { o.style.display = "none"; };
      o.querySelectorAll("[data-cl]").forEach(function (b) { b.onclick = function () { cls = b.dataset.cl; draw(); }; });
      o.querySelectorAll("[data-nm]").forEach(function (b) { b.onclick = function () { nom = b.dataset.nm; draw(); }; });
      o.querySelectorAll("[data-tg]").forEach(function (b) { b.onclick = function () { TG = TG === b.dataset.tg ? "" : b.dataset.tg; draw(); }; });
      o.querySelectorAll(".lc-au-c").forEach(function (b) { b.onclick = function () { view = b.dataset.k; draw(); o.scrollTop = 0; }; });
      var bb = o.querySelector("[data-back]"); if (bb) bb.onclick = function () { view = null; draw(); };
      var ch = o.querySelector("[data-chg]"); if (ch) ch.onclick = function () { nom = ""; view = null; draw(); };
      o.querySelectorAll("[data-av]").forEach(function (b) { b.onclick = function () { var v = +b.dataset.av; o.querySelectorAll("[data-av]").forEach(function (z) { z.classList.toggle("on", z === b); });
        if (!isT()) { resSet(cls, nom, view + "@auto", v); var r = recsOf(cls, nom).filter(function (z) { return z.k === view; })[0]; if (r) { r.st = v === 2 ? 3 : v === 1 ? 2 : 1; r.tried = Date.now(); put(KRM, r); } }
        o.querySelector("[data-am]").textContent = v === 2 ? "Bravo ! Ton professeur le verra." : "Continue : essaie la version « plus facile », puis reviens à la situation."; }; });
    }
    draw();
  }
  (window.EPSG_COMMON = window.EPSG_COMMON || []).push({ ico: "🎯", label: "Travailler en autonomie", sub: "Les situations pour progresser", when: function () { return allSits(true).length > 0; }, open: function () { autoOpen(); } });
  try { if (window.EPSG_REFRESH && document.querySelector(".epsg")) window.EPSG_REFRESH(); } catch (e) {}
  /* 🖨 fiche de leçon imprimable (A4, modèle de l'enseignant) : en-tête commun, objectifs, but, dispositif, matériel, échauffement,
     puis chaque situation : schéma à côté de la consigne, critères de réussite / de réalisation / variables en colonnes. */
  function ficheHtml(l) {
    var im = function (id) { var x = id && get(KI, id); return x ? '<img src="' + x.d + '" alt="schéma">' : ""; }, t = function (v) { return esc(v || "").replace(/\n/g, "<br>"); };
    var cell = function (lab, v) { return '<td><div class="lab">' + lab + '</div>' + (v ? t(v) : '<span class="vide">—</span>') + "</td>"; };
    var head = ""; try { head = window.EPSR && EPSR.htmlHead ? EPSR.htmlHead({ act: NOM, titre: titreL(l), ac: COL, nom: l.seq || "", classe: (l.cls || []).join(", "), lecon: l.duree ? "Durée : " + l.duree : "", date: "" }) : ""; } catch (e) {}
    return '<section class="fiche">' + (head || '<h1>' + esc(NOM) + " · " + esc(titreL(l)) + "</h1>") +
      '<table class="g"><tr>' + cell("Objectif moteur", l.objM) + cell("Objectif méthodologique", l.objMe) + cell("Objectif social", l.objS) + "</tr></table>" +
      '<table class="g"><tr>' + cell("But de la leçon", l.but) + "</tr></table>" +
      '<table class="g"><tr>' + cell("Dispositif", l.disp) + cell("Matériel", l.mat) + "</tr></table>" +
      '<h2>🔥 Échauffement</h2><div class="cs">' + (l.echImg ? '<div class="sch">' + im(l.echImg) + "</div>" : "") + '<div class="cons">' + (l.ech ? t(l.ech) : '<span class="vide">—</span>') + "</div></div>" +
      (l.sits || []).map(function (x, i) { if (!x.t && !x.cons && !x.crR) return "";
        return '<div class="sit"><h2>🏃 ' + (x.t && /^situation\s*\d/i.test(x.t) ? esc(x.t) : "Situation " + (i + 1) + (x.t ? " · " + esc(x.t) : "")) + (x.ap ? ' <small>🎯 ' + esc(x.ap) + "</small>" : "") + '</h2><div class="cs">' + (x.img ? '<div class="sch">' + im(x.img) + "</div>" : "") + '<div class="cons"><div class="lab">Consigne</div>' + (x.cons ? t(x.cons) : '<span class="vide">—</span>') + "</div></div>" +
          '<table class="g"><tr>' + cell("Critères de réussite<br><i>(pour être en réussite)</i>", [x.crQ ? "Quantitatif : " + x.crQ : "", x.crQl ? "Qualitatif : " + x.crQl : ""].filter(Boolean).join("\n")) + cell("Critères de réalisation<br><i>(ce qu'il y a à faire pour faire)</i>", x.crR) + cell("Variables", [x.simp ? "− " + x.simp : "", x.comp ? "+ " + x.comp : ""].filter(Boolean).join("\n")) + "</tr></table></div>"; }).join("") +
      (l.rem || l.remCr ? '<h2>🏆 Remise en action</h2><table class="g"><tr>' + cell("Consigne", l.rem) + cell("Critères de réussite", l.remCr) + "</tr></table>" : "") +
      (l.bilan ? '<h2>💬 Bilan</h2><div class="cs"><div class="cons">' + t(l.bilan) + "</div></div>" : "") + "</section>"; }
  function printFiches(L, titre) {
    var css = "@page{size:A4;margin:12mm}*{box-sizing:border-box}body{margin:0;font:11pt/1.35 Arial,Helvetica,sans-serif;color:#14171C;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
      ".fiche{page-break-after:always}.fiche:last-child{page-break-after:auto}h1{font-size:16pt}h2{font-size:12.5pt;margin:10px 0 4px;padding:3px 8px;border-left:5px solid " + COL + ";background:" + COL + "14}h2 small{font-weight:400;font-size:9.5pt;color:#4A4F58}" +
      "table.g{width:100%;border-collapse:collapse;margin:4px 0;table-layout:fixed}table.g td{border:1px solid #C9C3B6;padding:5px 7px;vertical-align:top}.lab{font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:" + COL + ";margin-bottom:2px}.lab i{text-transform:none;font-weight:400;color:#4A4F58}" +
      ".cs{display:flex;gap:10px;align-items:flex-start;border:1px solid #C9C3B6;padding:6px 8px}.sch{flex:0 0 45%}.sch img{width:100%;max-height:70mm;object-fit:contain}.cons{flex:1}.vide{color:#B8BDC6}.sit,h2+table.g{page-break-inside:avoid}h2{page-break-after:avoid}";
    return '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>' + esc(titre) + "</title><style>" + css + "</style></head><body>" + L.map(ficheHtml).join("") + "</body></html>"; }
  function printOpen(L, titre) {
    css();
    var md = document.createElement("div"); md.className = "lc-modal"; md.style.zIndex = "2147483400";
    md.innerHTML = '<div style="max-width:900px;width:100%"><div class="lc-row"><h2 style="flex:1;margin:0">🖨 ' + esc(titre) + '</h2><button type="button" class="lc-b p" data-p>🖨 Imprimer / enregistrer en PDF</button><button type="button" class="lc-b" data-x>Fermer</button></div><iframe title="Aperçu de la fiche" style="width:100%;height:72vh;border:1.5px solid #E6E1D6;border-radius:10px;background:#fff"></iframe><p class="lc-mut">Dans la fenêtre d\'impression, choisis « Enregistrer au format PDF » pour garder le fichier.</p></div>';
    document.body.appendChild(md); var f = md.querySelector("iframe"); f.srcdoc = printFiches(L, titre);
    md.querySelector("[data-x]").onclick = function () { md.remove(); };
    md.querySelector("[data-p]").onclick = function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { var w = window.open("", "_blank"); if (w) { w.document.write(printFiches(L, titre)); w.document.close(); setTimeout(function () { w.print(); }, 400); } } };
  }
  /* 📋 critères des grilles d'évaluation de l'appli (eps-eval.js enregistre ses instances dans window.EPSE_INST) */
  function grids() { evInit(); var out = [], seen = {}; (window.EPSE_INST || []).forEach(function (x) { try { (x.A.grid().criteres || []).forEach(function (cr) { if (!seen[cr.id]) { seen[cr.id] = 1; out.push(cr); } }); } catch (e) {} }); return out; }
  function critTxt(cr) { return tnorm([cr.nom, cr.but, cr.nomEl, cr.butEl].filter(Boolean).join(" ")); }
  /* situations qui travaillent un critère : lien explicite (s.crit) ou mot-clé d'apprentissage présent dans l'intitulé du critère */
  function sitsForCrit(cr) { var T = critTxt(cr); return allSits(true).filter(function (o) { return (o.s.crit || []).indexOf(cr.id) >= 0 || o.tags.some(function (t) { var k = tnorm(t); return k.length >= 3 && (" " + T + " ").indexOf(" " + k) >= 0; }); }); }
  function recAdd(cls, nom, o, txt, why) { var id = nn(cls) + "|" + ekey(nom) + "|" + o.k; if (get(KRM, id)) return false; put(KRM, { id: id, app: APP, cls: cls, el: nom, k: o.k, tag: (o.tags || tagsOf(o.s)).join(", "), txt: txt || "", why: why || "", at: Date.now(), st: 0 }); try { EPSD.syncSoon(); } catch (e) {} return true; }
  var REC_ST = ["proposée", "❌ pas encore", "🟠 en partie", "✅ réussie"];
  /* 💡 carte « Remédiation » sous la proposition de note (eps-eval.js propBlock) : critères au degré 1 ou 2 → situations liées */
  function remCard(cls, nom, lows) {
    if (!lows || !lows.length) return null;
    var rows = lows.map(function (x) { return { cr: x.cr, d: x.d, S: sitsForCrit(x.cr) }; });
    var h = '<div class="epse-card"><h3 style="margin:0 0 4px">🎯 Remédiation en autonomie</h3><p class="epse-mut" style="margin:0 0 6px">Critères au degré 1 ou 2 : la situation liée peut être proposée à l\'élève (il la retrouve dans « 🎯 Travailler en autonomie »).</p>' +
      rows.map(function (r, i) { return '<div style="margin:6px 0"><b>' + esc(r.cr.nom || r.cr.id) + "</b> · degré " + (r.d + 1) + "<br>" + (r.S.length ? r.S.map(function (o, j) { var ex = get(KRM, nn(cls) + "|" + ekey(nom) + "|" + o.k);
        return '<span style="display:inline-flex;gap:6px;align-items:center;margin:3px 6px 0 0">' + esc(o.s.t || "Situation " + (o.i + 1)) + (ex ? ' <span class="epse-mut">· ' + REC_ST[ex.st || 0] + "</span>" : ' <button type="button" class="epse-btn" data-rp="' + i + ":" + j + '">🎯 Proposer</button>') + "</span>"; }).join("")
        : '<span class="epse-mut">Aucune situation liée à ce critère.</span> <button type="button" class="epse-btn" data-rnew="' + i + '">✨ Préparer une situation</button>') + "</div>"; }).join("") + "</div>";
    return { html: h, bind: function (root, redraw) {
      root.querySelectorAll("[data-rp]").forEach(function (b) { b.onclick = function () { var p = b.dataset.rp.split(":"), r = rows[+p[0]], o = r.S[+p[1]]; recAdd(cls, nom, o, "", "Critère « " + (r.cr.nom || "") + " » (degré " + (r.d + 1) + ")"); b.outerHTML = '<span class="epse-mut">· proposée ✓</span>'; }; });
      root.querySelectorAll("[data-rnew]").forEach(function (b) { b.onclick = function () { var r = rows[+b.dataset.rnew]; sitNew(r.cr.nom || "", r.cr); }; }); } };
  }
  /* ✨ situation de remédiation manquante : Claude la rédige (documents de l'enseignant d'abord) → fiche brouillon « Remédiations » */
  function sitNew(ap, cr) {
    css();
    var md = document.createElement("div"); md.className = "lc-modal"; md.style.zIndex = "2147483400";
    md.innerHTML = '<div><h2>✨ Préparer une situation de remédiation</h2><label class="lc-f"><span>Apprentissage à travailler</span><input data-ap value="' + esc(ap || "") + '" placeholder="ex. smash"></label>' + (cr ? '<p class="lc-mut">Critère : ' + esc(cr.nom || "") + (cr.desc ? " · degré 3 visé : " + esc(cr.desc[2] || "") : "") + "</p>" : "") +
      '<label class="lc-f"><span>Précisions (facultatif)</span><input data-pr placeholder="ex. en autonomie, par deux, sans lanceur expert"></label><div class="lc-row"><button type="button" class="lc-b p" data-go>✨ Demander à Claude</button><button type="button" class="lc-b" data-ref>📚 Voir les propositions vérifiées</button><button type="button" class="lc-b" data-x>Fermer</button></div><p class="lc-mut" data-m>Claude s\'appuie d\'abord sur tes documents. La situation arrive en brouillon dans la séquence « Remédiations » : relis, corrige, valide.</p></div>';
    document.body.appendChild(md); var m = md.querySelector("[data-m]");
    md.querySelector("[data-x]").onclick = function () { md.remove(); };
    md.querySelector("[data-ref]").onclick = function () { md.remove(); refOpen(md.querySelector("[data-ap]").value); };
    md.querySelector("[data-go]").onclick = function () { var b = this, a = md.querySelector("[data-ap]").value.trim(); if (!a) { alert("Indique l'apprentissage."); return; } b.disabled = true; m.textContent = "Claude rédige la situation…";
      ask({ op: "lecon", mode: "situation", act: NOM, docs: docsFor(), lecons: [], consigne: "Apprentissage à travailler en autonomie (remédiation) : " + a + (cr ? "\nCritère d'évaluation : " + (cr.nom || "") + (cr.desc ? " ; niveau visé : " + (cr.desc[2] || "") : "") : "") + (md.querySelector("[data-pr]").value ? "\nPrécisions : " + md.querySelector("[data-pr]").value : "") })
        .then(function (r) { var R = r.lecon || {}, s0 = (R.sits || [])[0] || {}; s0.ap = s0.ap || a;
          return aiConfirm([{ titre: "🏃 " + (s0.t || "Situation") + " · apprentissage : " + a, lignes: [s0.cons, s0.crQ && "✅ " + s0.crQ, s0.crR && "💡 " + s0.crR].filter(Boolean).map(String) }], { titre: "Ranger cette situation dans ta banque ?" }).then(function (ok) { if (!ok) { md.remove(); return; } var l = remLesson(a, s0, true); if (cr) { l.sits[l.sits.length - 1].crit = [cr.id]; put(KL, l); } md.remove(); open("edit", l.id); }); })
        .catch(function (e) { m.textContent = "⚠ " + e.message; b.disabled = false; }); };
  }
  /* fiche « Remédiation · <apprentissage> » (séquence « Remédiations ») : une situation par apprentissage, en brouillon */
  function remLesson(ap, s0, ai) { var l = blank("Remédiations"); l.titre = "Remédiation · " + ap; l.num = String(lecons().filter(function (x) { return x.seq === "Remédiations"; }).length + 1); l.cr = Date.now(); l.statut = "brouillon"; l.ai = {};
    var x = {}; SF.forEach(function (f) { if (s0[f[0]]) { x[f[0]] = String(s0[f[0]]); if (ai) l.ai["s0." + f[0]] = 1; } }); x.ap = s0.ap || ap; if (s0.src) l.sources = s0.src; l.sits = [x]; l.banque = true; put(KL, l); return l; }
  /* 📚 propositions vérifiées (eps-remed-ref.js, recherche sur des sources institutionnelles) : à ajouter en brouillon */
  function refOpen(q) {
    css(); var go = function () { var R = (window.EPS_REMED_REF || {})[APP] || [], Q = tnorm(q || ""), md = document.createElement("div"); md.className = "lc-modal"; md.style.zIndex = "2147483400";
      function draw() { var L = R.filter(function (x) { return !Q || tnorm(x.ap + " " + x.t + " " + (x.cons || "")).indexOf(Q) >= 0; });
        md.innerHTML = '<div style="max-width:900px"><div class="lc-row"><h2 style="flex:1;margin:0">📚 Situations de remédiation proposées · ' + esc(NOM) + '</h2><button type="button" class="lc-b" data-x>Fermer</button></div><p class="lc-mut">Propositions de Claude vérifiées sur des sources institutionnelles (programmes, éduscol, académies). Rien n\'est montré aux élèves avant ta validation : « ＋ Ajouter » crée une fiche brouillon dans la séquence « Remédiations ».</p>' +
          '<input class="lc-sel" data-q placeholder="Chercher un apprentissage…" value="' + esc(q || "") + '" style="width:100%;margin:6px 0">' +
          (L.map(function (x, i) { var have = allSits(false).some(function (o) { return tnorm(o.s.t || "") === tnorm(x.t); });
            return '<div class="lc-card"><div class="t"><b>' + esc(x.t) + '</b> <span class="lc-tag">🎯 ' + esc(x.ap) + "</span>" + (x.afl ? ' <span class="lc-tag">' + esc(x.afl) + "</span>" : "") + '</div><div class="lc-pre" style="margin:4px 0">' + esc(x.cons) + '</div><div class="lc-mut" style="margin:0">✅ ' + esc([x.crQ, x.crQl].filter(Boolean).join(" · ")) + "<br>💡 " + esc(x.crR) + "<br>− " + esc(x.simp) + " · + " + esc(x.comp) + (x.src ? "<br>Source : " + esc(x.src) : "") + '</div><div class="lc-row" style="margin:4px 0 0">' + (have ? '<span class="lc-tag ok">✓ déjà dans tes fiches</span>' : '<button type="button" class="lc-b s p" data-add="' + R.indexOf(x) + '">＋ Ajouter à mes fiches (brouillon)</button>') + "</div></div>"; }).join("") || '<p class="lc-mut">Aucune proposition pour cette recherche.</p>') + "</div>";
        md.querySelector("[data-x]").onclick = function () { md.remove(); }; var qi = md.querySelector("[data-q]"); qi.oninput = function () { q = qi.value; Q = tnorm(q); var p = qi.selectionStart; draw(); var q2 = md.querySelector("[data-q]"); q2.focus(); q2.setSelectionRange(p, p); };
        md.querySelectorAll("[data-add]").forEach(function (b) { b.onclick = function () { var x = R[+b.dataset.add]; remLesson(x.ap, x, true); b.outerHTML = '<span class="lc-tag ok">✓ ajoutée en brouillon (séquence « Remédiations »)</span>'; }; }); }
      document.body.appendChild(md); draw(); };
    if (window.EPS_REMED_REF) go(); else loadJS(BASE + "eps-remed-ref.js").then(go, function () { alert("Propositions indisponibles hors ligne pour l'instant."); });
  }
  /* élèves de la classe et leurs critères au degré 1 ou 2 (évaluations de l'appli, toutes grilles) */
  function lowsFor(cls) { evInit(); var out = [];
    (window.EPSE_INST || []).forEach(function (x) { var A = x.A, G; try { G = A.grid().criteres || []; } catch (e) { return; }
      ((typeof A.classes === "function" ? A.classes() || [] : []).filter(function (c) { return same(c.nom, cls); })[0] || { eleves: [] }).eleves.forEach(function (E) { var n = A.name(E), nom = ((n.prenom || "") + " " + (n.nom || "")).trim(), lows = [];
        G.forEach(function (cr) { var v = null; try { v = A.prof(cr, E); } catch (e) {} if (v && v.d != null && v.d <= 1) lows.push({ cr: cr, d: v.d }); });
        if (lows.length) out.push({ nom: nom, lows: lows }); }); });
    return out; }
  /* 🗺 carte des apprentissages d'une séquence : lignes = apprentissages et critères de la grille, colonnes = leçons */
  function carteHtml(seq, cls) {
    var L = lecons().filter(function (l) { return (l.seq || "Sans séquence") === seq && (!cls || forCls(l, cls)); }), rows = {}, order = [];
    var row = function (key, lab, kind) { if (!rows[key]) { rows[key] = { lab: lab, kind: kind, c: {} }; order.push(key); } return rows[key]; };
    L.forEach(function (l, li) { (l.sits || []).forEach(function (x, i) { tagsOf(x).forEach(function (t) { var r = row("t:" + tnorm(t), t, "ap"); (r.c[li] = r.c[li] || []).push(i + 1); }); }); });
    var G = grids(); G.forEach(function (cr) { var r = row("c:" + cr.id, (cr.afl ? cr.afl + " · " : "") + (cr.nom || cr.id), "crit"), T = critTxt(cr);
      L.forEach(function (l, li) { (l.sits || []).forEach(function (x, i) { if ((x.crit || []).indexOf(cr.id) >= 0 || tagsOf(x).some(function (t) { var k = tnorm(t); return k.length >= 3 && (" " + T + " ").indexOf(" " + k) >= 0; })) (r.c[li] = r.c[li] || []).push(i + 1); }); }); });
    var RM = all(KRM).filter(function (r) { return r.app === APP && (!cls || same(r.cls, cls)); });
    var h = '<div style="overflow:auto"><table class="lc-carte"><tr><th>Apprentissage / critère</th>' + L.map(function (l) { return '<th title="' + esc(titreL(l)) + '">' + esc(l.num || "·") + (l.statut === "brouillon" ? "✨" : "") + "</th>"; }).join("") + "<th>Total</th><th>🎯</th></tr>" +
      order.map(function (k) { var r = rows[k], n = Object.keys(r.c).length, rm = r.kind === "ap" ? RM.filter(function (x) { return tnorm(x.tag || "").indexOf(k.slice(2)) >= 0; }).length : 0;
        return '<tr class="' + (n === 0 ? "vide" : n === 1 ? "une" : "") + '"><td>' + (r.kind === "crit" ? "📋 " : "🎯 ") + esc(r.lab) + "</td>" + L.map(function (l, li) { return "<td>" + (r.c[li] ? "●<small>" + r.c[li].join(",") + "</small>" : "") + "</td>"; }).join("") + "<td><b>" + n + "</b>" + (n === 0 ? " ⚠" : "") + "</td><td>" + (rm || "") + "</td></tr>"; }).join("") + "</table></div>" +
      '<p class="lc-mut">● = travaillé dans la leçon (n° des situations). ⚠ ligne rouge : critère de ta grille jamais travaillé ; orange : une seule leçon. 🎯 = propositions de remédiation faites. Leçons sans apprentissage noté : ' + (L.filter(function (l) { return !(l.sits || []).some(function (x) { return tagsOf(x).length; }); }).map(function (l) { return esc(l.num || l.titre || "?"); }).join(", ") || "aucune") + ".</p>";
    return L.length ? h : '<p class="lc-mut">Aucune leçon dans cette séquence.</p>';
  }
  function fld(k, lab, v, ai, attrs, input) { if (PH[k] && !/placeholder=/.test(attrs || "")) attrs = (attrs || "") + ' placeholder="' + esc(PH[k]) + '"'; return '<label class="lc-f' + (ai ? " ai" : "") + '"><span>' + esc(lab) + "</span>" + (input ? '<input ' + attrs + ' value="' + esc(v || "") + '">' : "<textarea " + attrs + ">" + esc(v || "") + "</textarea>") + "</label>"; }
  function imgBox(kind, ref) { var im = ref && get(KI, ref); return '<div class="lc-row">' + (im ? '<img class="lc-img" src="' + im.d + '" alt="schéma">' : "") + '<label class="lc-b s" style="display:inline-flex;align-items:center">🖼 ' + (im ? "Changer" : "Ajouter") + ' le schéma<input type="file" accept="image/*" data-img="' + kind + '" hidden></label>' + (im ? '<button type="button" class="lc-b s" data-noimg="' + kind + '">✕ Retirer</button>' : "") + "</div>"; }
  function saveEdit() { if (WORK) { clearTimeout(SAVE_T); put(KL, WORK); } }
  function drawEdit() {
    var l = get(KL, EDIT); if (!l) { EDIT = null; return drawList(); }
    WORK = JSON.parse(JSON.stringify(l)); var A = WORK.ai || {}, br = WORK.statut === "brouillon"; var GR = grids();
    var h = '<div class="lc-row"><button type="button" class="lc-b s" data-back>← Retour</button><span style="flex:1"></span>' + '<button type="button" class="lc-b s" data-bank aria-pressed="' + !!WORK.banque + '">' + (WORK.banque ? "⭐ Dans ma banque" : "☆ Ranger dans ma banque") + "</button>" + (br ? '<span class="lc-tag br">✨ brouillon : invisible pour les élèves</span>' : '<span class="lc-tag ok">✓ validée</span>') + "</div>" +
      (br ? '<div class="lc-warn">Relis et corrige les champs en jaune (proposés par Claude), puis « ✓ Valider ». Tant que la leçon n\'est pas validée, elle ne peut être ni programmée ni montrée aux élèves.' + (WORK.sources ? "<br><small>Sources indiquées par Claude : " + esc(WORK.sources) + "</small>" : "") + "</div>" : "") +
      '<div class="lc-box"><div class="lc-g3">' + fld("seq", "Séquence", WORK.seq, A.seq, 'data-f="seq" list="lc-seqs"', true) + fld("num", "N° de leçon", WORK.num, A.num, 'data-f="num"', true) + fld("duree", "Durée", WORK.duree, A.duree, 'data-f="duree" placeholder="ex. 1 h 45"', true) + "</div>" +
      fld("titre", "Titre", WORK.titre, A.titre, 'data-f="titre"', true) + '<label class="lc-f"><span>Voie</span><select class="lc-sel" data-voie style="width:100%"><option value="gt"' + (voieDe(WORK) === "gt" ? " selected" : "") + '>🎓 Générale et technologique (AFL)</option><option value="pro"' + (voieDe(WORK) === "pro" ? " selected" : "") + '>🛠 Professionnelle (AFLP)</option></select></label>' + '<datalist id="lc-seqs">' + seqs().map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + "</datalist></div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">🎯 Objectifs et but</h3><div class="lc-g3">' + F.slice(0, 3).map(function (x) { return fld(x[0], x[1], WORK[x[0]], A[x[0]], 'data-f="' + x[0] + '"'); }).join("") + "</div>" + fld("but", "But de la leçon", WORK.but, A.but, 'data-f="but"') + "</div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">🧰 Dispositif et matériel</h3>' + fld("disp", "Dispositif", WORK.disp, A.disp, 'data-f="disp"') + fld("mat", "Matériel", WORK.mat, A.mat, 'data-f="mat"') + "</div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">🔥 Échauffement</h3>' + fld("ech", "Consigne", WORK.ech, A.ech, 'data-f="ech"') + imgBox("ech", WORK.echImg) + "</div>" +
      (WORK.sits || []).map(function (s, i) { return '<div class="lc-box"><div class="lc-row" style="margin:0"><h3 style="margin:4px 0;flex:1">🏃 Situation ' + (i + 1) + "</h3>" + '<button type="button" class="lc-b s" data-rmsit="' + i + '">✕ Retirer</button></div>' + fld("t", SF[0][1], s.t, A["s" + i + ".t"], 'data-s="' + i + '" data-f="t"', true) + fld("cons", SF[1][1], s.cons, A["s" + i + ".cons"], 'data-s="' + i + '" data-f="cons"') + imgBox("s" + i, s.img) +
        '<div class="lc-g3">' + SF.slice(2, 4).map(function (x) { return fld(x[0], x[1], s[x[0]], A["s" + i + "." + x[0]], 'data-s="' + i + '" data-f="' + x[0] + '"'); }).join("") + "</div>" + fld("crR", SF[4][1], s.crR, A["s" + i + ".crR"], 'data-s="' + i + '" data-f="crR"') +
        '<div class="lc-g3">' + SF.slice(5).map(function (x) { return fld(x[0], x[1], s[x[0]], A["s" + i + "." + x[0]], 'data-s="' + i + '" data-f="' + x[0] + '"'); }).join("") + "</div>" +
        fld("ind", "🎨 Indicateur coloré (facultatif) : intitulé ; seuil orange ; seuil vert ; unité — ex. « Services réussis sur 10 ; 6 ; 8 » ou « Temps sur 30 m ; 6,2 ; 5,6 ; s » (plus petit = mieux si le vert est sous l'orange)", s.ind, A["s" + i + ".ind"], 'data-s="' + i + '" data-f="ind"') +
        '<div class="lc-ap">' + fld("ap", "🎯 Apprentissage travaillé (mots-clés séparés par des virgules)", s.ap, A["s" + i + ".ap"], 'data-s="' + i + '" data-f="ap" list="lc-aps"', true) +
        '<div class="lc-row" style="margin:2px 0 0"><label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" data-sauto="' + i + '"' + (s.noauto ? "" : " checked") + ' style="width:20px;height:20px"> Les élèves la retrouvent en autonomie (remédiation)</label><span style="flex:1"></span><button type="button" class="lc-b s" data-recsit="' + i + '">🎯 Proposer à des élèves</button></div>' + (GR.length ? '<div class="lc-row" style="gap:6px;margin:4px 0 0"><span class="lc-mut" style="margin:0">📋 Critères d\'évaluation travaillés :</span>' + GR.map(function (cr) { var on = (s.crit || []).indexOf(cr.id) >= 0; return '<button type="button" class="lc-b s" data-crit="' + i + "|" + esc(cr.id) + '" aria-pressed="' + on + '"' + (on ? ' style="background:' + COL + ';color:#fff;border-color:' + COL + '"' : "") + ">" + esc((cr.afl ? cr.afl + " · " : "") + (cr.nom || cr.id)) + "</button>"; }).join("") + "</div>" : "") + '</div></div>'; }).join("") +
      '<datalist id="lc-aps">' + allTags().map(function (t) { return "<option>" + esc(t.t) + "</option>"; }).join("") + "</datalist>" +
      '<div class="lc-row"><button type="button" class="lc-b s" data-addsit>＋ Ajouter une situation</button></div>' +
      '<div class="lc-box"><h3 style="margin-top:4px">🏆 Remise en action et bilan</h3>' + RF.map(function (x) { return fld(x[0], x[1], WORK[x[0]], A[x[0]], 'data-f="' + x[0] + '"'); }).join("") + "</div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">👥 Classes concernées</h3><p class="lc-mut">La leçon fait partie de la séquence de ces classes (une classe qui a des leçons attribuées ne voit que les siennes).</p><div class="lc-row">' +
        classes().map(function (c) { var on = (WORK.cls || []).some(function (x) { return same(x, c); }); return '<button type="button" class="lc-b s' + (on ? " p" : "") + '" data-ecl="' + esc(c) + '">' + (on ? "✓ " : "") + esc(c) + "</button>"; }).join("") +
        ((WORK.cls || []).length ? '<button type="button" class="lc-b s" data-ecl0>Toutes les classes</button>' : "") + "</div></div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">📅 Programmer pour une classe</h3><p class="lc-mut">À l\'heure prévue, la leçon s\'ouvre toute seule sur les tablettes élèves de la classe (compte à rebours avant).</p>' +
      (br ? '<div class="lc-warn">Valide d\'abord la leçon pour pouvoir la programmer.</div>' : '<div class="lc-row"><select class="lc-sel" data-pc>' + classes().sort(function (a, b) { return forCls(WORK, b) - forCls(WORK, a); }).map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") + '</select><input type="datetime-local" class="lc-sel" data-pt><button type="button" class="lc-b s" data-padd>📅 Programmer</button><button type="button" class="lc-b s" data-launch>▶ Lancer maintenant…</button></div><div class="lc-row" data-slots></div>') +
      (WORK.prog || []).sort(function (a, b) { return a.at - b.at; }).map(function (p, i) { return '<div class="lc-row"><span class="lc-tag pg">📅 ' + esc(p.c) + " · " + esc(hm(p.at)) + (p.at < Date.now() ? " (passée)" : "") + '</span><button type="button" class="lc-b s" data-prm="' + p.at + "|" + esc(p.c) + '">✕</button></div>'; }).join("") + "</div>" +
      '<div class="lc-row"><button type="button" class="lc-b" data-fill>✨ Compléter les rubriques vides avec Claude</button><button type="button" class="lc-b" data-refmt title="Claude range chaque élément de la fiche dans la bonne rubrique, sans rien inventer">🔁 Remettre en forme (modèle)</button>' + (WORK.avant ? '<button type="button" class="lc-b" data-undo>↺ Annuler la remise en forme</button>' : "") + (br ? '<button type="button" class="lc-b p" data-ok>✓ Valider (relu et corrigé)</button>' : '<button type="button" class="lc-b" data-unok>Repasser en brouillon</button>') + '<button type="button" class="lc-b" data-modfill title="Remplit seulement les rubriques vides avec ton modèle">📋 Compléter avec mon modèle</button><button type="button" class="lc-b" data-modsave title="Toute nouvelle leçon partira de cette fiche (sans séquence, numéro ni titre)">📋 En faire mon modèle</button><button type="button" class="lc-b" data-dup>⧉ Dupliquer</button><button type="button" class="lc-b" data-print>🖨 Imprimer la fiche</button><button type="button" class="lc-b" data-see>👁 Voir comme un élève</button><span style="flex:1"></span><button type="button" class="lc-b" data-del style="border-color:#C0392B;color:#C0392B">🗑 Supprimer</button></div><p class="lc-mut" data-msg></p>';
    var el = shell(h), msg = el.querySelector("[data-msg]");
    function later() { clearTimeout(SAVE_T); SAVE_T = setTimeout(function () { if (WORK) put(KL, WORK); /* fiche supprimée ou fermée entre-temps : rien à enregistrer */ }, 700); }
    el.addEventListener("input", function (e) {
      var t = e.target, f = t.dataset.f; if (!f) return; var s = t.dataset.s;
      if (s != null) { WORK.sits[+s][f] = t.value; if (WORK.ai) delete WORK.ai["s" + s + "." + f]; } else { WORK[f] = t.value; if (WORK.ai) delete WORK.ai[f]; }
      var lab = t.closest(".lc-f"); if (lab) lab.classList.remove("ai"); later();
    });
    el.querySelector("[data-back]").onclick = function () { saveEdit(); EDIT = null; draw(); };
    el.querySelectorAll("[data-ecl]").forEach(function (b) { b.onclick = function () { saveEdit(); var c = b.dataset.ecl, on = (WORK.cls || []).some(function (x) { return same(x, c); });
      WORK.cls = on ? WORK.cls.filter(function (x) { return !same(x, c); }) : (WORK.cls || []).concat([c]); put(KL, WORK); draw(); }; });
    var e0 = el.querySelector("[data-ecl0]"); if (e0) e0.onclick = function () { saveEdit(); WORK.cls = []; put(KL, WORK); draw(); };
    el.querySelector("[data-bank]").onclick = function () { WORK.banque = !WORK.banque; put(KL, WORK); this.textContent = WORK.banque ? "⭐ Dans ma banque" : "☆ Ranger dans ma banque"; this.setAttribute("aria-pressed", String(!!WORK.banque)); };
    el.querySelectorAll("[data-crit]").forEach(function (b) { b.onclick = function () { var p = b.dataset.crit.split("|"), x = WORK.sits[+p[0]], c = x.crit = x.crit || [], j = c.indexOf(p[1]); if (j >= 0) c.splice(j, 1); else c.push(p[1]); put(KL, WORK); var on = j < 0; b.setAttribute("aria-pressed", String(on)); b.style.cssText = on ? "background:" + COL + ";color:#fff;border-color:" + COL : ""; }; });
    el.querySelectorAll("[data-sauto]").forEach(function (c) { c.onchange = function () { var x = WORK.sits[+c.dataset.sauto]; if (c.checked) delete x.noauto; else x.noauto = 1; put(KL, WORK); }; });
    el.querySelectorAll("[data-recsit]").forEach(function (b) { b.onclick = function () { saveEdit(); var x = WORK.sits[+b.dataset.recsit]; if (!x.t && !x.cons) { alert("Remplis d'abord la situation."); return; } if (WORK.statut === "brouillon") { alert("Valide d'abord la leçon : un brouillon n'est jamais montré aux élèves."); return; } recOpen([{ l: WORK, i: +b.dataset.recsit, s: x, k: WORK.id + ":s" + b.dataset.recsit }]); }; });
    el.querySelector("[data-refmt]").onclick = function () { var b = this; saveEdit(); b.disabled = true; msg.textContent = "Claude remet la fiche en forme selon ton modèle (sans rien inventer)…";
      refmt(get(KL, EDIT), true).then(function () { draw(); }).catch(function (e) { msg.textContent = "⚠ " + e.message; b.disabled = false; }); };
    var un = el.querySelector("[data-undo]"); if (un) un.onclick = function () { if (!confirm("Revenir à la fiche d'avant la remise en forme ?")) return; var A0 = WORK.avant; F.concat(RF).forEach(function (x) { WORK[x[0]] = ""; }); WORK.sits = []; delete WORK.echImg; Object.keys(A0).forEach(function (k) { WORK[k] = A0[k]; }); if (!WORK.sits.length) WORK.sits = [{}, {}]; delete WORK.avant; WORK.ai = {}; put(KL, WORK); draw(); };
    el.querySelector("[data-modsave]").onclick = function () { saveEdit(); var both = confirm("Ce modèle sert pour toutes tes activités ?\n\nOK = toutes les activités · Annuler = seulement " + NOM);
      put(KMOD, { id: both ? "lcmod" : "lcmod." + APP, f: modFields(WORK), from: titreL(WORK), at: Date.now() }); if (both) { var o = get(KMOD, "lcmod." + APP); if (o) { o.del = 1; put(KMOD, o); } }
      msg.textContent = "✓ Modèle enregistré" + (both ? " pour toutes les activités" : " pour " + NOM) + " : chaque « ＋ Nouvelle leçon » part de cette fiche (sans séquence, numéro ni titre). Les schémas sont repris."; };
    el.querySelector("[data-modfill]").onclick = function () { var M = modele(); if (!M || !M.f) { alert("Pas encore de modèle : remplis une fiche comme tu les fais d'habitude, puis « 📋 En faire mon modèle »."); return; } var f = M.f, n = 0;
      Object.keys(f).forEach(function (k) { if (k === "sits") return; if (!WORK[k]) { WORK[k] = f[k]; n++; } });
      (f.sits || []).forEach(function (fs, i) { var w = WORK.sits[i] || (WORK.sits[i] = {}); Object.keys(fs).forEach(function (k) { if (!w[k]) { w[k] = fs[k]; n++; } }); });
      put(KL, WORK); draw(); var m2 = OV.querySelector("[data-msg]"); if (m2) m2.textContent = n ? "✓ " + n + " rubrique(s) vide(s) remplie(s) avec ton modèle." : "Rien à compléter : toutes les rubriques du modèle sont déjà remplies."; };
    el.querySelector("[data-addsit]").onclick = function () { saveEdit(); WORK.sits.push({}); put(KL, WORK); draw(); };
    el.querySelectorAll("[data-rmsit]").forEach(function (b) { b.onclick = function () { if (!confirm("Retirer la situation " + (+b.dataset.rmsit + 1) + " ?")) return; WORK.sits.splice(+b.dataset.rmsit, 1); WORK.ai = {}; put(KL, WORK); draw(); }; });
    el.querySelectorAll("[data-img]").forEach(function (inp) { inp.onchange = function () { var f = inp.files[0]; if (!f) return; var k = inp.dataset.img;
      (function go(max, q) { shrink(f, max, q).then(function (d) { if (d.length > 30000 && max > 240) return go(Math.round(max * 0.8), Math.max(0.35, q - 0.08)); var id = uid(); put(KI, { id: id, d: d }); if (k === "ech") WORK.echImg = id; else WORK.sits[+k.slice(1)].img = id; put(KL, WORK); draw(); }).catch(function (e) { msg.textContent = "⚠ " + e.message; }); })(620, 0.6); }; });
    el.querySelectorAll("[data-noimg]").forEach(function (b) { b.onclick = function () { var k = b.dataset.noimg; if (k === "ech") WORK.echImg = ""; else WORK.sits[+k.slice(1)].img = ""; put(KL, WORK); draw(); }; });
    var vs = el.querySelector("[data-voie]"); if (vs) vs.onchange = function () { WORK.voie = vs.value; saveEdit(); };
    var ok = el.querySelector("[data-ok]"); if (ok) ok.onclick = function () { WORK.statut = "ok"; WORK.ai = {}; WORK.val = Date.now(); put(KL, WORK); draw(); };
    var un = el.querySelector("[data-unok]"); if (un) un.onclick = function () { WORK.statut = "brouillon"; put(KL, WORK); draw(); };
    el.querySelector("[data-dup]").onclick = function () { saveEdit(); var c = JSON.parse(JSON.stringify(WORK)); c.id = uid(); c.cr = Date.now(); c.prog = []; c.titre = (c.titre || "") + " (copie)"; put(KL, c); EDIT = c.id; draw(); };
    el.querySelector("[data-del]").onclick = function () { if (!confirm("Supprimer cette leçon ?")) return; if (!confirm("Elle disparaîtra sur toutes les tablettes. Tu pourras la retrouver 30 jours dans la corbeille (Réglages de l'accueil).")) return; try { var lt = get(KL, EDIT); if (window.EPSD && EPSD.trash && lt) EPSD.trash.keep({ type: "Fiche de leçon", label: titreL(lt), sub: NOM, items: [{ key: KL, id: EDIT }] }); } catch (e) {} WORK = null; del(KL, EDIT); EDIT = null; draw(); };
    el.querySelector("[data-see]").onclick = function () { saveEdit(); showStudent(WORK, null, true); };
    el.querySelector("[data-print]").onclick = function () { saveEdit(); printOpen([get(KL, EDIT) || WORK], titreL(WORK)); };
    var pa = el.querySelector("[data-padd]"); if (pa) {
      var pt = el.querySelector("[data-pt]"), d0 = new Date(Date.now() + 864e5); d0.setHours(8, 0, 0, 0); pt.value = new Date(d0 - d0.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
      pa.onclick = function () { var c = el.querySelector("[data-pc]").value, at = new Date(pt.value).getTime(); if (!c || !at) { msg.textContent = "Choisis la classe, la date et l'heure."; return; } saveEdit(); WORK.prog = (WORK.prog || []).filter(function (p) { return !(same(p.c, c) && Math.abs(p.at - at) < 6e4); }); WORK.prog.push({ c: c, at: at }); put(KL, WORK); draw(); };
      var pcs = el.querySelector("[data-pc]"), sb = el.querySelector("[data-slots]");
      var drawSlots = function () { var S = edtSlots(pcs.value, 6); sb.innerHTML = S === null ? '<span class="lc-mut">Pas d\'emploi du temps sur cette tablette (appli EDT) : choisis la date et l\'heure.</span>' : S.length ? '<span class="lc-mut">Prochains cours (emploi du temps) :</span>' + S.map(function (x) { return '<button type="button" class="lc-b s" data-slot="' + x.at + '">' + esc(hm(x.at)) + "</button>"; }).join("") : '<span class="lc-mut">Aucun cours de ' + esc(NOM) + " à venir pour cette classe dans l'emploi du temps.</span>";
        sb.querySelectorAll("[data-slot]").forEach(function (b) { b.onclick = function () { var d = new Date(+b.dataset.slot); pt.value = new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); sb.querySelectorAll("[data-slot]").forEach(function (x) { x.classList.toggle("p", x === b); }); }; }); };
      pcs.onchange = drawSlots; drawSlots();
      el.querySelector("[data-launch]").onclick = function () { saveEdit(); var c = el.querySelector("[data-pc]").value; startLive(c, WORK.id); TAB = "live"; EDIT = null; LIVECLS = c; draw(); };
    }
    el.querySelectorAll("[data-prm]").forEach(function (b) { b.onclick = function () { var p = b.dataset.prm.split("|"); WORK.prog = (WORK.prog || []).filter(function (x) { return !(String(x.at) === p[0] && x.c === p.slice(1).join("|")); }); put(KL, WORK); draw(); }; });
    el.querySelector("[data-fill]").onclick = function () { var b = this; saveEdit(); b.disabled = true; msg.textContent = "Claude complète les rubriques vides à partir de tes documents…";
      ask({ op: "lecon", mode: "completer", act: NOM, base: compact(WORK), docs: docsFor(), lecons: lecons().filter(function (x) { return x.seq === WORK.seq && x.id !== WORK.id; }).map(compact) })
        .then(function (r) { var l = fromAI(get(KL, EDIT), r.lecon || {}, true); return aiConfirm([aiSum(l)], { titre: "Compléter la fiche avec ces propositions ?", oui: "Compléter" }).then(function (ok) { if (ok) put(KL, l); else msg.textContent = "Rien n'a été ajouté."; b.disabled = false; draw(); }); }).catch(function (e) { msg.textContent = "⚠ " + e.message; b.disabled = false; }); };
  }

  /* ---- Claude : propositions ---- */
  function aiDialog() {
    var S = seqs().filter(function (s) { return s !== "Sans séquence"; }), D = docList();
    var md = document.createElement("div"); md.className = "lc-modal";
    md.innerHTML = '<div><h2>✨ Proposer avec Claude</h2><p class="lc-mut">Claude s\'appuie d\'abord sur tes documents déposés (' + D.filter(function (d) { return d.use; }).length + " utilisé" + (D.length > 1 ? "s" : "") + ") et sur tes leçons. Tout arrive en brouillon, à relire et valider.</p>" +
      '<label class="lc-f"><span>Ce que tu veux</span><select class="lc-sel" data-mode style="width:100%">' +
      (D.length ? '<option value="importer">Mettre en forme une leçon de mes documents (sans rien inventer)</option>' : "") +
      '<option value="suivante">La leçon suivante d\'une séquence</option><option value="nouvelle">Une nouvelle leçon (thème libre)</option>' +
      (S.length ? '<option value="simple">Une séquence parallèle plus simple</option><option value="difficile">Une séquence parallèle plus difficile</option><option value="variante">Une séquence parallèle de même niveau (autres situations)</option>' : "") + "</select></label>" +
      '<label class="lc-f" data-wdoc><span>Document</span><select class="lc-sel" data-doc style="width:100%">' + D.map(function (d) { return '<option value="' + d.id + '">' + esc(d.nom) + "</option>"; }).join("") + "</select></label>" +
      '<label class="lc-f" data-wseq><span>Séquence</span><input data-seq list="lc-seq2" value="' + esc(S[S.length - 1] || "") + '"><datalist id="lc-seq2">' + S.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + "</datalist></label>" +
      '<label class="lc-f"><span>Voie (textes officiels utilisés)</span><select class="lc-sel" data-voie style="width:100%"><option value="gt"' + (voieDe(null) === "gt" ? " selected" : "") + '>🎓 Voie générale et technologique (AFL, bac général)</option><option value="pro"' + (voieDe(null) === "pro" ? " selected" : "") + '>🛠 Voie professionnelle (AFLP, CCF Bac pro / CAP)</option></select></label>' +
      '<label class="lc-f"><span>Précisions (facultatif)</span><textarea data-cons placeholder="ex. leçon 3 du document ; classe de 2de ; 24 élèves ; gymnase avec 4 terrains…"></textarea></label>' +
      '<div class="lc-row"><button type="button" class="lc-b p" data-go>✨ Proposer</button><button type="button" class="lc-b" data-cancel>Annuler</button></div><p class="lc-mut" data-msg></p></div>';
    document.body.appendChild(md);
    var sel = md.querySelector("[data-mode]"), msg = md.querySelector("[data-msg]");
    function vis() { var v = sel.value; md.querySelector("[data-wdoc]").style.display = v === "importer" ? "" : "none"; md.querySelector("[data-wseq]").querySelector("span").textContent = /simple|difficile|variante/.test(v) ? "Séquence de départ" : "Séquence"; }
    sel.onchange = vis; vis();
    md.querySelector("[data-cancel]").onclick = function () { md.remove(); };
    md.querySelector("[data-go]").onclick = function () {
      var b = this, mode = sel.value, seq = md.querySelector("[data-seq]").value.trim(), cons = md.querySelector("[data-cons]").value, L = lecons().filter(function (x) { return x.seq === seq; });
      VOIE_ASK = md.querySelector("[data-voie]").value; setTimeout(function () { VOIE_ASK = null; }, 600000);
      b.disabled = true;
      if (/simple|difficile|variante/.test(mode)) {
        if (!L.length) { msg.textContent = "Cette séquence n'a pas encore de leçon."; b.disabled = false; return; }
        var nseq = seq + (mode === "simple" ? " (plus simple)" : mode === "difficile" ? " (plus difficile)" : " (variante)"), i = 0, done = 0, PEND = [];
        (function next() {
          if (i >= L.length) { aiConfirm(PEND.map(aiSum), { titre: "Ajouter ces " + PEND.length + " leçon(s) dans « " + nseq + " » ?" }).then(function (ok) { if (ok) PEND.forEach(function (l) { put(KL, l); });
            msg.textContent = ok ? "✓ " + done + " leçon(s) en brouillon dans « " + nseq + " »." : "Rien n'a été ajouté."; b.disabled = false; if (ok) setTimeout(function () { md.remove(); draw(); }, 900); }); return; }
          var src = L[i++]; msg.textContent = "Claude adapte la leçon " + i + " / " + L.length + "…";
          ask({ op: "lecon", mode: mode, act: NOM, consigne: cons, base: compact(src), docs: docsFor(), lecons: [] }).then(function (r) { var l = fromAI(blank(nseq), r.lecon || {}); l.voie = VOIE_ASK || voieDe(src); l.seq = nseq; l.num = src.num; l.cr = Date.now(); l.src = src.id; PEND.push(l); done++; next(); })
            .catch(function (e) { msg.textContent = "⚠ " + e.message; b.disabled = false; });
        })();
        return;
      }
      msg.textContent = "Claude prépare la proposition…";
      ask({ op: "lecon", mode: mode, act: NOM, consigne: cons, docs: mode === "importer" ? docsFor(md.querySelector("[data-doc]").value) : docsFor(), lecons: (mode === "suivante" ? L : lecons()).slice(-12).map(compact) })
        .then(function (r) { var l = fromAI(blank(seq), r.lecon || {}); l.voie = VOIE_ASK || voieDe(null); if (!l.seq) l.seq = seq; if (mode === "suivante" && !l.num) l.num = String(L.length + 1); l.cr = Date.now(); return aiConfirm([aiSum(l)], { titre: "Ajouter cette leçon proposée par Claude ?" }).then(function (ok) { if (!ok) { msg.textContent = "Rien n'a été ajouté."; b.disabled = false; return; } put(KL, l); md.remove(); EDIT = l.id; draw(); }); })
        .catch(function (e) { msg.textContent = "⚠ " + e.message; b.disabled = false; });
    };
  }

  /* ---- 📥 tous les documents → fiches (brouillons, sans rien inventer) ---- */
  /* 🔁 remise en forme d'une fiche selon le modèle (structure de l'enseignant) : Claude redistribue le texte dans les rubriques,
     sans rien inventer (document source joint s'il existe) ; fiche d'avant gardée (« ↺ Annuler »), résultat en brouillon à relire. */
  function refmt(l, conf) { if (!l) return Promise.reject(new Error("fiche introuvable"));
    return ask({ op: "lecon", mode: "reformater", act: NOM, base: compact(l), docs: l.doc ? docsFor(l.doc) : [], lecons: [], consigne: l.titre || l.num ? "Leçon concernée : " + (l.num ? "n° " + l.num + " " : "") + (l.titre ? "« " + l.titre + " »" : "") : "" })
      .then(function (r) { var L0 = get(KL, l.id) || l, av = JSON.parse(JSON.stringify(compact(L0))); if (L0.statut) av.statut = L0.statut; var n = fromAI(L0, r.lecon || {}, false, true); n.avant = av; if (!conf) { put(KL, n); return n; }
        return aiConfirm([aiSum(n)], { titre: "Remplacer la fiche par cette version remise en forme ?", oui: "Remplacer" }).then(function (ok) { if (!ok) throw new Error("rien n'a été changé"); put(KL, n); return n; }); }); }
  function refmtAll() {
    var L = lecons().filter(function (l) { return compact(l) && (l.doc || l.titre || l.disp || l.ech || (l.sits || []).some(function (x) { return x.cons; })); }), md = document.createElement("div"), stop = false, i = 0, ok = 0;
    if (!L.length) { alert("Aucune fiche à remettre en forme."); return; }
    if (!confirm(L.length + " fiche(s) de " + NOM + " vont être remises en forme selon ton modèle par Claude (sans rien inventer). Chacune repasse en brouillon à relire ; « ↺ Annuler la remise en forme » dans la fiche rend l'ancienne version. Continuer ?")) return;
    md.className = "lc-modal"; md.innerHTML = '<div><h2>🔁 Remise en forme des fiches</h2><p data-m style="font-weight:700"></p><div class="lc-row"><button type="button" class="lc-b" data-stop>Arrêter</button></div></div>'; document.body.appendChild(md);
    var M = md.querySelector("[data-m]"), sb = md.querySelector("[data-stop]"); sb.onclick = function () { stop = true; md.remove(); draw(); };
    (function next() { if (stop) return; if (i >= L.length) { M.textContent = "✓ " + ok + " fiche(s) remise(s) en forme, en brouillon : relis-les puis « ✓ Valider »."; sb.textContent = "Fermer"; return; }
      var l = L[i++]; M.textContent = "Fiche " + i + " / " + L.length + " : " + titreL(l) + "…";
      refmt(l).then(function () { ok++; next(); }, function (e) { M.textContent = "⚠ " + e.message; setTimeout(next, 2000); }); })();
  }
  function importAll() {
    var D = docList().filter(function (d) { return d.use; }), md = document.createElement("div"), stop = false, made = 0;
    if (D.length && !confirm("Claude va créer des fiches de leçon (en brouillon, à relire et valider) à partir de " + D.length + " document(s). Continuer ?")) return;
    md.className = "lc-modal"; md.innerHTML = '<div><h2>📥 Mettre en fiches mes documents</h2><p class="lc-mut">Claude repère les leçons de chaque document, puis met chacune en forme dans ta structure, avec tes formulations (rien d\'inventé : les rubriques absentes restent vides). Tout arrive en brouillon, à relire et valider. Compte environ 30 s par leçon.</p><p data-m style="font-weight:700"></p><div class="lc-row"><button type="button" class="lc-b" data-stop>Arrêter</button></div></div>';
    document.body.appendChild(md);
    var M = md.querySelector("[data-m]"), sb = md.querySelector("[data-stop]");
    sb.onclick = function () { stop = true; md.remove(); draw(); };
    function key(x) { return nn((x.seq || "") + "|" + (x.num || "") + "|" + (x.titre || "")); }
    function fin(t) { M.textContent = t; sb.textContent = "Fermer"; }
    var di = 0;
    (function nextDoc() {
      if (stop) return; if (di >= D.length) return fin("✓ " + made + " fiche" + (made > 1 ? "s" : "") + " créée" + (made > 1 ? "s" : "") + " en brouillon.");
      var d = D[di++], have = lecons().filter(function (l) { return l.doc === d.id; });
      M.textContent = "Claude repère les leçons de « " + d.nom + " » (" + di + " / " + D.length + ")…";
      /* repérage sur la tablette (« Leçon 3 », « L3 », « Séance 3 »…) : pas besoin du script ; sinon inventaire par Claude */
      var tx = (docsFor(d.id)[0] || {}).txt || "", nums = [], re = /(?:^|\n)[ \t#*•-]*(?:le[çc]on|s[ée]ance|L)\s*(?:n\s*[°o]\s*)?(\d{1,2})\b[ \t]*[:.\-–—)]?[ \t]*([^\n]{0,80})/gi, mm;
      while ((mm = re.exec(tx))) { if (!nums.some(function (x) { return x.num === mm[1]; })) nums.push({ num: mm[1], titre: mm[2].replace(/[|*_#]+/g, " ").trim().slice(0, 70) }); }
      (nums.length ? Promise.resolve({ liste: nums.map(function (x) { return { num: x.num, titre: x.titre }; }) }) : ask({ op: "lecon", mode: "inventaire", act: NOM, docs: docsFor(d.id) })).then(function (r) {
        var Q = (r.liste || []).filter(function (x) { return !have.some(function (l) { return l.dkey === key(x); }); }), qi = 0;
        if (!r.liste) Q = have.length ? [] : [{ titre: "" }];
        (function nextL() {
          if (stop) return; if (qi >= Q.length) return nextDoc();
          var x = Q[qi++]; M.textContent = "« " + d.nom + " » : leçon " + qi + " / " + Q.length + (x.titre ? " (" + x.titre + ")" : "") + "…";
          ask({ op: "lecon", mode: "importer", act: NOM, docs: docsFor(d.id), lecons: [], consigne: x.titre || x.num ? "Mets en forme uniquement la leçon " + (x.num ? "n° " + x.num + " " : "") + (x.titre ? "« " + x.titre + " »" : "") + (x.seq ? " de la séquence « " + x.seq + " »" : "") + "." : "" })
            .then(function (r2) { var l = fromAI(blank(x.seq || ""), r2.lecon || {}); if (!l.seq) l.seq = x.seq || d.nom.replace(/\.[a-z0-9]+$/i, ""); if (!l.num && x.num) l.num = String(x.num); l.cr = Date.now(); l.doc = d.id; l.dkey = key(x); put(KL, l); made++; nextL(); })
            .catch(function (e) { M.textContent = "⚠ " + e.message; setTimeout(nextL, 2000); });
        })();
      }).catch(function (e) { fin("⚠ " + e.message); });
    })();
  }

  /* ---- documents ---- */
  function drawDocs() {
    var D = docList();
    var h = '<h2>📂 Mes documents</h2><p class="lc-mut">Dépose ici ce que tu as construit (séquence, fiches de leçon, situations, grilles…). Claude s\'en sert en priorité pour tes leçons ; il ne fait des suggestions que pour les rubriques vides ou quand tu le lui demandes. Word, PowerPoint, LibreOffice et texte sont lus sur la tablette ; les PDF et les photos sont lus par Claude.</p>' +
      '<div class="lc-row">' + (D.some(function (d) { return d.use; }) ? '<button type="button" class="lc-b" data-imall>📥 Mettre en fiches tous mes documents</button>' : "") + '<label class="lc-b p" style="display:inline-flex;align-items:center">⬆ Déposer des documents<input type="file" multiple accept=".docx,.pptx,.odt,.odp,.pdf,.txt,.md,image/*" data-up hidden></label><button type="button" class="lc-b" data-paste>✍ Coller un texte</button></div><p class="lc-mut" data-msg></p>' +
      (D.length ? "" : '<div class="lc-box">Aucun document déposé.</div>') +
      D.map(function (d) { return '<div class="lc-box"><div class="lc-row" style="margin:0"><b style="flex:1">📄 ' + esc(d.nom) + '</b><small class="lc-mut" style="margin:0">' + Math.round(d.n / 100) / 10 + ' k caractères</small><label style="font-weight:700"><input type="checkbox" data-use="' + d.id + '"' + (d.use ? " checked" : "") + '> utilisé par Claude</label><button type="button" class="lc-b s" data-see="' + d.id + '">Voir</button><button type="button" class="lc-b s" data-rm="' + d.id + '">🗑</button></div><pre class="lc-pre" data-txt="' + d.id + '" style="display:none;max-height:300px;overflow:auto;background:#FBFAF7;border-radius:10px;padding:10px;font:13px/1.4 system-ui"></pre></div>'; }).join("");
    var el = shell(h), msg = el.querySelector("[data-msg]"), ia = el.querySelector("[data-imall]");
    if (ia) ia.onclick = importAll;
    el.querySelector("[data-up]").onchange = function () {
      var files = Array.prototype.slice.call(this.files), i = 0, ok = 0;
      (function next() {
        if (i >= files.length) { msg.textContent = ok ? "✓ " + ok + " document(s) déposé(s)." : msg.textContent; if (ok) setTimeout(draw, 600); return; }
        var f = files[i++]; msg.textContent = "Lecture de « " + f.name + " »…";
        extract(f, function (t) { msg.textContent = t; }).then(function (t) { t = String(t || "").trim(); if (!t) throw new Error("aucun texte trouvé"); saveDoc(f.name, t, f.type); ok++; next(); })
          .catch(function (e) { msg.textContent = "⚠ « " + f.name + " » : " + e.message; setTimeout(next, 1800); });
      })();
    };
    el.querySelector("[data-paste]").onclick = function () {
      var md = document.createElement("div"); md.className = "lc-modal";
      md.innerHTML = '<div><h2>✍ Coller un texte</h2><label class="lc-f"><span>Nom</span><input data-n placeholder="ex. Séquence volley 2de"></label><label class="lc-f"><span>Texte</span><textarea data-t style="min-height:220px"></textarea></label><div class="lc-row"><button type="button" class="lc-b p" data-ok>Enregistrer</button><button type="button" class="lc-b" data-c>Annuler</button></div></div>';
      document.body.appendChild(md); md.querySelector("[data-c]").onclick = function () { md.remove(); };
      md.querySelector("[data-ok]").onclick = function () { var t = md.querySelector("[data-t]").value.trim(); if (!t) return; saveDoc(md.querySelector("[data-n]").value.trim() || "Texte collé", t, "text/plain"); md.remove(); draw(); };
    };
    D.forEach(function (d) {
      el.querySelector('[data-use="' + d.id + '"]').onchange = function () { var v = this.checked; d.parts.forEach(function (p) { p.use = v; put(KD, p); }); };
      el.querySelector('[data-see="' + d.id + '"]').onclick = function () { var p = el.querySelector('[data-txt="' + d.id + '"]'); if (p.style.display === "none") { p.textContent = d.parts.sort(function (a, b) { return a.part - b.part; }).map(function (x) { return x.txt; }).join(""); p.style.display = ""; } else p.style.display = "none"; };
      el.querySelector('[data-rm="' + d.id + '"]').onclick = function () { if (!confirm("Supprimer « " + d.nom + " » ?")) return; d.parts.forEach(function (p) { del(KD, p.id); }); draw(); };
    });
  }

  /* ================= 🙋 appel du jour (absents) et ses effets =================
     Absents communs à toutes les applis et tablettes (EPSD.appel, eps.appel.v1). Les présents servent : groupes du jour, matériel calculé,
     rangement, évaluation de leçon, noms proposés sur les tablettes élèves. 🩹 dispensé = présent, ne pratique pas (rôles). */
  function APL() { return window.EPSD && EPSD.appel; }
  function isAbs(cls, n, d) { var A = APL(); try { return !!(A && A.absent(cls, n, d)); } catch (e) { return false; } }
  function isDisp(cls, n) { var A = APL(); try { return !!(A && A.dispense(cls, n)); } catch (e) { return false; } }
  function presents(cls) { return roster(cls).filter(function (n) { return !isAbs(cls, n); }); }
  function pratiquants(cls) { return presents(cls).filter(function (n) { return !isDisp(cls, n); }); }
  function appelBox(cls, compact) {
    var A = APL(), R = roster(cls); if (!A || !R.length) return "";
    var ab = R.filter(function (n) { return isAbs(cls, n); }), dp = R.filter(function (n) { return !isAbs(cls, n) && isDisp(cls, n); }), fait = A.fait(cls);
    var head = "🙋 Appel · <b>" + (R.length - ab.length) + " présent" + (R.length - ab.length > 1 ? "s" : "") + "</b> / " + R.length + (ab.length ? " · " + ab.length + " absent" + (ab.length > 1 ? "s" : "") : "") + (dp.length ? " · 🩹 " + dp.length + " dispensé" + (dp.length > 1 ? "s" : "") : "") + (fait ? "" : ' <span class="lc-tag" style="background:#FFF1BF;color:#7A5A00">à faire</span>');
    var body = '<p class="lc-mut" style="margin:4px 0 8px">Touche les absents. Groupes, matériel, rangement et évaluation de la leçon ne comptent que les présents (🩹 dispensé : présent, ne pratique pas). Commun à toutes les applis et tablettes.</p><div class="lc-row" style="gap:6px">' +
      R.map(function (n, i) { var a = isAbs(cls, n), d = isDisp(cls, n); return '<button type="button" class="lc-b s" data-ab="' + i + '" aria-pressed="' + a + '" style="' + (a ? "background:#C0392B;border-color:#C0392B;color:#fff;text-decoration:line-through" : "") + '">' + esc(n) + (d ? " 🩹" : "") + (a ? " · absent" : "") + "</button>"; }).join("") +
      '</div><div class="lc-row"><button type="button" class="lc-b s p" data-abok>' + (fait ? "✓ Appel enregistré" : (ab.length ? "✓ Valider l'appel" : "✓ Tout le monde est là")) + "</button>" + (ab.length ? '<button type="button" class="lc-b s" data-ab0>Personne d\'absent</button>' : "") + "</div>";
    return compact && fait ? '<details class="lc-box" data-appel><summary style="cursor:pointer;font-size:16px">' + head + " <small class=\"lc-mut\">(modifier)</small></summary>" + body + "</details>" : '<div class="lc-box" data-appel><div style="font-size:16px">' + head + "</div>" + body + "</div>";
  }
  function bindAppel(el, cls, redraw) {
    var A = APL(); if (!A) return; var R = roster(cls);
    el.querySelectorAll("[data-ab]").forEach(function (b) { b.onclick = function () { var n = R[+b.dataset.ab], L = A.get(cls), i = L.indexOf(n); if (i >= 0) L.splice(i, 1); else L.push(n); A.set(cls, L); redraw(); }; });
    var ok = el.querySelector("[data-abok]"); if (ok) ok.onclick = function () { A.set(cls, A.get(cls)); redraw(); };
    var z = el.querySelector("[data-ab0]"); if (z) z.onclick = function () { A.set(cls, []); redraw(); };
  }
  /* 🧰 matériel recalculé : « 1 ballon pour 2 », « 1 chasuble par élève », « 1 plot par groupe », « 1 corde par binôme » */
  function nGroupes(lec) { var m = lec && String(lec.disp || "").match(/(\d+)\s*(groupes|ateliers|équipes|equipes|terrains|poules)/i); return m ? +m[1] : 0; }
  function matCalc(txt, N, G) {
    return String(txt || "").split(/\n|;/).map(function (x) { return x.trim(); }).filter(Boolean).map(function (x) {
      var q = null, m = x.match(/(\d+)\s*[^\d]*?\s+pour\s+(\d+)/i);
      if (m) q = Math.ceil(N / +m[2]) * +m[1];
      else if (/par\s+(élève|eleve|personne|joueur|joueuse|grimpeur|danseur|coureur|enfant)/i.test(x)) q = N * ((x.match(/^(\d+)/) || [0, 1])[1]);
      else if (/par\s+(binôme|binome|deux|paire|cordée|cordee|doublette)/i.test(x)) q = Math.ceil(N / 2) * ((x.match(/^(\d+)/) || [0, 1])[1]);
      else if (/par\s+(trinôme|trinome|trois|triplette)/i.test(x)) q = Math.ceil(N / 3) * ((x.match(/^(\d+)/) || [0, 1])[1]);
      else if (G && /par\s+(groupe|atelier|équipe|equipe|terrain|poule)/i.test(x)) q = G * ((x.match(/^(\d+)/) || [0, 1])[1]);
      return { t: x, q: q }; });
  }
  function matBox(cls, lec, G) {
    if (!lec || !lec.mat) return ""; var P = presents(cls), N = pratiquants(cls).length, M = matCalc(lec.mat, N, G), calc = M.some(function (x) { return x.q != null; });
    return '<div class="lc-box"><h3 style="margin-top:4px">🧰 Matériel à installer · ' + N + " élève" + (N > 1 ? "s" : "") + " qui pratiquent" + (P.length !== N ? " (" + P.length + " présents)" : "") + (G ? " · " + G + " groupes" : "") + "</h3>" +
      M.map(function (x, i) { var K = "eps.matck." + APP + "|" + nn(cls) + "|" + today(), ck = false; try { ck = !!(JSON.parse(localStorage.getItem(K) || "{}"))[i]; } catch (e) {}
        return '<label style="display:flex;gap:8px;align-items:center;padding:3px 0;cursor:pointer"><input type="checkbox" style="width:20px;height:20px"' + (ck ? " checked" : "") + ' onchange="try{var K=\'' + esc(K.replace(/\\/g, "\\\\").replace(/'/g, "\\'")) + '\',o=JSON.parse(localStorage.getItem(K)||\'{}\');o[' + i + ']=this.checked;localStorage.setItem(K,JSON.stringify(o))}catch(e){}"><span' + (ck ? ' style="text-decoration:line-through;color:#6A6F78"' : "") + ">" + esc(x.t) + (x.q != null ? ' → <b style="font-size:17px">' + x.q + "</b>" : "") + "</span></label>"; }).join("") + /* liste à cocher (reprise de Volley-ball), gardée sur la tablette pour la journée */
      (calc ? "" : '<p class="lc-mut">Astuce : écris dans ta fiche « 1 ballon pour 2 », « 1 chasuble par élève », « 1 plot par groupe » : les quantités se calculent avec les présents.</p>') + "</div>";
  }
  /* 👥 groupes du jour, avec les présents seulement (dispensés à part : rôles) */
  function niveau(cls, n) { var k = ekey(n), L = []; all(KE).forEach(function (o) { if (!same(o.cls, cls)) return; var x = (o.el || {})[k]; if (!x) return; ["p", "s", "t"].forEach(function (q) { if (x[q] != null) L.push(+x[q]); }); }); return L.length ? L.reduce(function (a, b) { return a + b; }, 0) / L.length : null; }
  function makeWork(cls, n, mode) {
    if (window.EPSGR && mode !== "hasard") { var R = EPSGR.make({ dir: APP, cls: cls, names: pratiquants(cls), n: n, mode: mode }); try { window.epsGroupesLog && epsGroupesLog(APP, cls, R.g, "jour"); } catch (e) {} return { g: R.g, disp: presents(cls).filter(function (x) { return isDisp(cls, x); }), mode: mode, sans: R.sans, at: Date.now() }; }
    var P = pratiquants(cls).map(function (x) { return { n: x, v: niveau(cls, x), r: Math.random() }; }), G = []; n = Math.max(1, Math.min(n, P.length || 1)); for (var i = 0; i < n; i++) G.push([]);
    if (mode === "hasard" || !P.some(function (x) { return x.v != null; })) { P.sort(function (a, b) { return a.r - b.r; }); P.forEach(function (x, i) { G[i % n].push(x.n); }); }
    else { P.sort(function (a, b) { return ((b.v == null ? 1.5 : b.v) - (a.v == null ? 1.5 : a.v)) || a.r - b.r; });
      if (mode === "niveau") { var per = Math.ceil(P.length / n); P.forEach(function (x, i) { G[Math.min(n - 1, Math.floor(i / per))].push(x.n); }); }
      else P.forEach(function (x, i) { var row = Math.floor(i / n), c = i % n; G[row % 2 ? n - 1 - c : c].push(x.n); }); }
    var sans = mode !== "hasard" && !P.some(function (x) { return x.v != null; });
    return { g: G, disp: presents(cls).filter(function (x) { return isDisp(cls, x); }), mode: mode, sans: sans ? 1 : 0, at: Date.now() };
  }

  /* 📂 cadres repliables : un titre h3 en tête d'un cadre .lc-box se touche pour replier / déplier ; l'état est gardé sur la tablette (eps.lcfold) */
  function foldBoxes(root) {
    var F = jget("eps.lcfold", {});
    root.querySelectorAll(".lc-box").forEach(function (bx) { var h = bx.firstElementChild; if (!h || h.tagName !== "H3") return; var key = h.textContent.replace(/[^\p{L}\s]/gu, "").trim().slice(0, 40); if (!key) return;
      var set = function (closed) { Array.prototype.forEach.call(bx.children, function (c) { if (c !== h) c.style.display = closed ? "none" : ""; }); h.setAttribute("aria-expanded", closed ? "false" : "true"); var ar = h.querySelector(".lc-fold"); if (ar) ar.textContent = closed ? "▸" : "▾"; };
      h.style.cursor = "pointer"; h.setAttribute("role", "button"); h.tabIndex = 0; h.insertAdjacentHTML("afterbegin", '<span class="lc-fold" aria-hidden="true" style="display:inline-block;width:20px;color:#6A6F78">▾</span>');
      var tog = function () { var c = !F[key]; if (c) F[key] = 1; else delete F[key]; jset("eps.lcfold", F); set(c); };
      h.onclick = tog; h.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tog(); } }; set(!!F[key]); });
  }
  /* ---- leçon en cours (tablette de contrôle) ---- */
  function live(cls) { return all(KV).filter(function (v) { return same(v.cls, cls); })[0] || null; }
  function startLive(cls, lec) { try { if (typeof window.epsOnLiveStart === "function") window.epsOnLiveStart(cls, lec ? get(KL, lec) : null); } catch (e) {} /* l'appli prépare aussi sa propre leçon du jour (un seul bouton) */
    var v = live(cls) || { id: nn(cls) || uid() }; v.cls = cls; v.on = 1; v.st = Date.now(); v.lec = lec || ""; v.part = ""; v.msgs = []; v.tim = null; v.rang = null; v.grp = null; put(KV, v, true); }
  function liveSet(cls, f) { var v = live(cls); if (!v) return; f(v); put(KV, v, true); drawLive(); }
  function sendMsg(cls, txt) { liveSet(cls, function (v) { v.msgs = (v.msgs || []).filter(function (x) { return x.at > Date.now() - 15 * 6e4; }).concat([{ id: uid(), at: Date.now(), t: txt }]); }); }
  function rang(cls) { return all(KR).filter(function (r) { return same(r.cls, cls); })[0] || null; }
  function makeGroups(cls, n) { var R = roster(cls).slice(); for (var i = R.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = R[i]; R[i] = R[j]; R[j] = t; } var G = []; for (var k = 0; k < n; k++) G.push([]); R.forEach(function (x, i) { G[i % n].push(x); }); var r = rang(cls) || { id: nn(cls) || uid(), cls: cls, h: [] }; r.g = G; put(KR, r); }
  function proposal(r, cls) { if (!r || !r.g || !r.g.length) return -1; var last = r.g.map(function (_, i) { var t = 0; (r.h || []).forEach(function (x) { if (x.g === i) t = Math.max(t, x.at); }); return t; }); var ok = function (i) { return !cls || r.g[i].filter(function (n) { return !isAbs(cls, n); }).length >= 2; }, best = -1; last.forEach(function (t, i) { if (ok(i) && (best < 0 || t < last[best])) best = i; }); return best < 0 ? 0 : best; }
  function qmsgs() { var d = ["Il vous reste 5 minutes", "Il vous reste 2 minutes", "Changement de situation", "Regroupement auprès du professeur", "Fin de la leçon : on range le matériel", "Arrêtez-vous et écoutez"]; try { return window.EPSP ? EPSP.p({ id: "live_msgs", sec: "Leçon en cours", label: "Messages rapides envoyés à toutes les tablettes", type: "list", def: d }) : d; } catch (e) { return d; } }
  /* 🎭 rôles du jour (proposés, l'enseignant choisit) : catalogue réglable « Nom : mission » ; v.roles = {on:[noms], who:{élève: rôle}} dans la leçon en cours ;
     attribution automatique parmi les présents (dispensés en priorité), par groupe si groupes du jour ; « ↻ Faire tourner » ; l'élève voit son rôle et sa mission */
  function rolesCat() { var d = ["Arbitre : fait respecter les règles et annonce le score", "Observateur : relève un critère sur la fiche et le dit à son camarade", "Coach : donne un conseil précis entre deux essais ou deux points", "Chronométreur : mesure et annonce les temps", "Juge : positionne la prestation selon les critères", "Pareur / contre-assureur : sécurise le pratiquant", "Responsable du matériel : installe et range", "Statisticien : remplit la tablette (scores, réussites)", "Capitaine : organise le groupe et rappelle les consignes", "Échauffeur : mène l'échauffement du groupe"];
    try { return window.EPSP ? EPSP.p({ id: "roles_cat", sec: "Rôles", label: "Rôles proposés (« Nom : mission », un par ligne) : tu choisis ceux du jour dans 📡 Leçon en cours", type: "list", def: d }) : d; } catch (e) { return d; } }
  function roleSplit(t) { var i = String(t).indexOf(":"); return i > 0 ? { n: t.slice(0, i).trim(), m: t.slice(i + 1).trim() } : { n: String(t).trim(), m: "" }; }
  function rolesAssign(cls, v) { var ON = (v.roles && v.roles.on) || []; if (!ON.length) return {}; var who = {}, G = v.grp && v.grp.g && v.grp.g.length ? v.grp.g.map(function (g) { return g.slice(); }) : [pratiquants(cls)], D = presents(cls).filter(function (n) { return isDisp(cls, n); }), sh = (v.roles.sh || 0);
    G.forEach(function (g) { var L = D.concat(g.filter(function (n) { return D.indexOf(n) < 0; })); ON.forEach(function (r, i) { var n = L.length ? L[(i + sh) % L.length] : null; if (n && !who[n]) who[n] = r; }); }); return who; }
  /* LIVEMIN (demande de l'enseignant, 27/11/2026, Relais : pas de doublon entre 📡 Suivi et 📡 Leçon en cours) : l'écran ne montre que ce que
     l'écran de suivi de l'appli n'a pas (appel, matériel, groupes du jour, rôles, rangement) ; les cadres [data-dup] (classe, démarrer, étape,
     message, minuteur, terminer) sont masqués, pas retirés : leurs boutons restent reliés. */
  var LIVEMIN = false;
  function drawLive() {
    if (!OV || OV.style.display === "none" || TAB !== "live") return;
    var C = classes(); if (!LIVECLS) { var c0 = cur(); LIVECLS = (c0 && c0.nom) || all(KV).filter(function (v) { return v.on; }).map(function (v) { return v.cls; })[0] || edtClass() || C[0] || ""; }
    var cls = LIVECLS, v = live(cls), on = v && v.on, L = lecons().filter(function (l) { return l.statut !== "brouillon" && forCls(l, cls); }), lec = on && v.lec && get(KL, v.lec);
    var h = (LIVEMIN ? '<div class="lc-row" style="margin-bottom:10px"><button type="button" class="lc-b p" data-minback>← Suivi</button><h2 style="margin:0">Appel, matériel, groupes, rôles, rangement · ' + esc(cls) + "</h2></div>" + (on ? "" : '<p class="lc-mut">Démarre la leçon dans Suivi pour le matériel, les groupes du jour, les rôles et le rangement.</p>')
      : '<h2>📡 Leçon en cours</h2><p class="lc-mut">Cette tablette pilote les tablettes élèves de la classe : messages en grand avec un son, minuteur, étape en cours, rangement.</p>') +
      '<div class="lc-row" data-dup><b>Classe</b><select class="lc-sel" data-cls>' + C.map(function (c) { return "<option" + (same(c, cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>" + (on ? '<span class="lc-tag ok">● en cours depuis ' + Math.max(1, Math.round((Date.now() - v.st) / 6e4)) + " min</span>" : "") + "</div>";
    h += appelBox(cls, on);
    if (!on) h += '<div class="lc-box" data-dup><div class="lc-row"><b>Leçon</b><select class="lc-sel" data-lec><option value="">— sans fiche de leçon —</option>' + L.map(function (l) { return '<option value="' + l.id + '">' + esc((l.seq ? l.seq + " · " : "") + titreL(l)) + "</option>"; }).join("") + '</select><button type="button" class="lc-b p" data-start>▶ Démarrer la leçon</button></div><div data-matpre></div><p class="lc-mut">La fiche choisie s\'ouvre sur les tablettes élèves de la classe (seulement les leçons validées).</p></div>';
    else {
      var parts = [["", "—"], ["ech", "🔥 Échauffement"]].concat(((lec && lec.sits) || [{}, {}]).map(function (s, i) { return ["s" + i, "🏃 Situation " + (i + 1)]; })).concat([["rem", "🏆 Remise en action"], ["bilan", "💬 Bilan"]]);
      h += '<div class="lc-box" data-dup><b>' + (lec ? esc(titreL(lec)) : "Sans fiche de leçon") + '</b><div class="lc-row">' + parts.map(function (p) { return '<button type="button" class="lc-b s' + (v.part === p[0] ? " p" : "") + '" data-part="' + p[0] + '">' + p[1] + "</button>"; }).join("") + '</div><p class="lc-mut">Étape mise en avant sur les tablettes élèves.</p></div>' +
        matBox(cls, lec, (v.grp && v.grp.g && v.grp.g.length) || nGroupes(lec)) +
        '<div class="lc-box"><h3 style="margin-top:4px">👥 Groupes du jour</h3>' + (v.grp && v.grp.g && v.grp.g.length ? v.grp.g.map(function (g, i) { return '<div class="lc-row" style="align-items:flex-start;margin:4px 0"><b style="min-width:86px">' + esc(gNom(v, i)) + '</b><span style="flex:1">' + esc(g.join(", ") || "—") + ' <small class="lc-mut">(' + g.length + ")</small></span></div>"; }).join("") +
          (v.grp.disp && v.grp.disp.length ? '<div class="lc-mut">🩹 Dispensés (rôles : observateur, arbitre, chrono…) : ' + esc(v.grp.disp.join(", ")) + "</div>" : "") + '<p class="lc-mut">Affichés sur les tablettes élèves. ' + ((v.grp.lib ? v.grp.lib + " (🧩 Niveaux & groupes)." : { hasard: "Au hasard.", melange: "Niveaux mélangés (d'après ton classement et tes évaluations).", niveau: "Groupes de niveau (d'après ton classement et tes évaluations).", affinite: "Par affinités.", casser: "En cassant les habitudes." }[v.grp.mode]) || "") + (v.grp.sans ? " Faute d'évaluation de leçon pour cette classe, ils ont été faits au hasard." : "") + "</p>"
          : '<p class="lc-mut">Formés avec les présents qui pratiquent (' + pratiquants(cls).length + ").</p>") +
        '<div class="lc-row"><select class="lc-sel" data-gn aria-label="Nombre de groupes">' + [2, 3, 4, 5, 6, 7, 8, 10, 12].map(function (n) { return '<option value="' + n + '"' + (n === ((v.grp && v.grp.g && v.grp.g.length) || nGroupes(lec) || 4) ? " selected" : "") + ">" + n + " groupes</option>"; }).join("") + '</select><select class="lc-sel" data-gm aria-label="Façon de former les groupes">' + [["hasard", "Au hasard"], ["melange", "Niveaux mélangés"], ["niveau", "Groupes de niveau"]].concat(window.EPSGR ? [["affinite", "Par affinités"], ["casser", "Casser les habitudes"]] : []).map(function (m) { return '<option value="' + m[0] + '"' + ((v.grp && v.grp.mode) === m[0] ? " selected" : "") + ">" + m[1] + "</option>"; }).join("") +
        '</select><button type="button" class="lc-b s p" data-gmk>' + (v.grp && v.grp.g ? "↻ Refaire" : "Former les groupes") + "</button>" + '<button type="button" class="lc-b s" data-gniv>🧩 Classement & affinités</button>' + (v.grp && v.grp.g ? '<button type="button" class="lc-b s" data-ged>✏ Modifier</button><button type="button" class="lc-b s" data-gsay>📣 Annoncer</button><button type="button" class="lc-b s" data-gdel>Effacer</button>' : "") + "</div></div>" +
        (on ? '<div class="lc-box"><h3 style="margin-top:4px">🎭 Rôles du jour</h3><div class="lc-mut" style="margin:0 0 6px">Touche les rôles à utiliser aujourd\'hui (catalogue modifiable dans 🎛 Paramètres → Rôles).</div><div class="lc-row">' + rolesCat().map(function (t, i) { var r = roleSplit(t), act = ((v.roles && v.roles.on) || []).indexOf(r.n) >= 0; return '<button type="button" class="lc-b s' + (act ? " p" : "") + '" data-role="' + i + '" title="' + esc(r.m) + '">' + (act ? "✓ " : "") + esc(r.n) + "</button>"; }).join("") + "</div>" +
          (v.roles && (v.roles.on || []).length ? '<div class="lc-row"><button type="button" class="lc-b" data-rot>↻ Faire tourner les rôles</button></div>' + (function () { var W = v.roles.who || {}; return Object.keys(W).map(function (n) { return '<div style="padding:2px 0">🎭 <b>' + esc(W[n]) + "</b> : " + esc(n) + "</div>"; }).join(""); })() : "") + "</div>" : "") +
        '<div class="lc-box" data-dup><h3 style="margin-top:4px">📣 Message à toutes les tablettes</h3><div class="lc-row">' + qmsgs().map(function (t) { return '<button type="button" class="lc-b s" data-q="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") +
        '</div><div class="lc-row"><input class="lc-sel" data-mt style="flex:1;min-width:220px" placeholder="Ton message…">' + ((window.SpeechRecognition || window.webkitSpeechRecognition) ? '<button type="button" class="lc-b s" data-dict>🎤</button>' : "") + '<button type="button" class="lc-b p" data-send>📣 Envoyer</button></div>' +
        (v.msgs || []).slice(-3).reverse().map(function (x) { return '<div class="lc-mut">' + new Date(x.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " · " + esc(x.t) + "</div>"; }).join("") + "</div>" +
        '<div class="lc-box" data-dup><h3 style="margin-top:4px">⏱ Minuteur</h3><div class="lc-row"><input class="lc-sel" data-tl placeholder="Intitulé (facultatif)" value="' + esc((v.tim && v.tim.lab) || "") + '">' + [1, 2, 3, 5, 8, 10, 15, 20].map(function (n) { return '<button type="button" class="lc-b s" data-tm="' + n + '">' + n + " min</button>"; }).join("") + (v.tim ? '<button type="button" class="lc-b s" data-tstop>⏹ Arrêter</button>' : "") + "</div>" + (v.tim ? '<div class="lc-mut" data-tleft></div>' : "") + "</div>";
      var R = rang(cls), pr = proposal(R, cls);
      h += '<div class="lc-box"><h3 style="margin-top:4px">🧹 Rangement</h3>' + (R && R.g && R.g.length ? R.g.map(function (g, i) { var lst = (R.h || []).filter(function (x) { return x.g === i; }).sort(function (a, b) { return b.at - a.at; })[0];
        return '<div class="lc-row" style="align-items:flex-start"><b style="min-width:86px">Groupe ' + (i + 1) + (i === pr ? " 👉" : "") + '</b><span style="flex:1">' + (g.map(function (n) { return isAbs(cls, n) ? '<s style="color:#6A6F78">' + esc(n) + "</s>" : esc(n); }).join(", ") || "—") + (g.length && g.filter(function (n) { return !isAbs(cls, n); }).length < 2 ? ' <b style="color:#C0392B">⚠ ' + g.filter(function (n) { return !isAbs(cls, n); }).length + " présent</b>" : "") + '<br><small class="lc-mut">' + (lst ? "a rangé le " + esc(hm(lst.at)) + " (" + esc(lst.app) + ")" : "n'a pas encore rangé") + '</small></span><button type="button" class="lc-b s' + (i === pr ? " p" : "") + '" data-rg="' + i + '">🧹 Range aujourd\'hui</button></div>'; }).join("") +
        '<p class="lc-mut">👉 = proposition (le groupe qui n\'a pas rangé depuis le plus longtemps, toutes activités confondues). ' + ((v.rang && v.rang.g != null) ? "Aujourd'hui : groupe " + (v.rang.g + 1) + "." : "") + "</p>" : '<p class="lc-mut">Pas encore de groupes de rangement pour cette classe.</p>') +
        '<div class="lc-row"><select class="lc-sel" data-ng>' + [2, 3, 4, 5, 6].map(function (n) { return "<option" + (n === ((R && R.g && R.g.length) || 4) ? " selected" : "") + ">" + n + "</option>"; }).join("") + '</select><button type="button" class="lc-b s" data-mk>' + (R && R.g ? "↻ Refaire les groupes" : "Former les groupes") + "</button>" + (R && R.g ? '<button type="button" class="lc-b s" data-edg>✏ Modifier</button>' : "") + "</div>" +
        ((R && R.h && R.h.length) ? '<details><summary class="lc-mut">Trace des rangements</summary>' + R.h.slice().sort(function (a, b) { return b.at - a.at; }).slice(0, 30).map(function (x) { return '<div class="lc-mut">' + esc(hm(x.at)) + " · groupe " + (x.g + 1) + " · " + esc(x.app) + "</div>"; }).join("") + "</details>" : "") + "</div>" +
        '<div class="lc-row" data-dup>' + (window.EPST && EPST.openVue ? '<button type="button" class="lc-b p" data-vue>👁 Voir côté élève</button>' : "") + '<button type="button" class="lc-b" data-stop style="border-color:#C0392B;color:#C0392B">⏹ Terminer la leçon</button></div>';
    }
    var el = shell(h); foldBoxes(el); OV.classList.toggle("lc-min", !!LIVEMIN);
    if (LIVEMIN) { [].forEach.call(el.querySelectorAll("[data-dup]"), function (n) { n.style.display = "none"; }); var mb = el.querySelector("[data-minback]"); if (mb) mb.onclick = function () { close(); try { if (window.epsCtlOwn) window.epsCtlOwn.open(cls); } catch (e) {} }; }
    el.querySelector("[data-cls]").onchange = function () { LIVECLS = this.value; drawLive(); };
    bindAppel(el, cls, drawLive);
    var ls = el.querySelector("[data-lec]"), mp = el.querySelector("[data-matpre]"); if (ls && mp) { var pg = lecons().filter(function (l) { return l.statut !== "brouillon" && (l.prog || []).some(function (p) { return same(p.c, cls) && Math.abs(p.at - Date.now()) < 3 * 3600e3; }); })[0]; if (pg) ls.value = pg.id;
      var upm = function () { var l = ls.value && get(KL, ls.value); mp.innerHTML = matBox(cls, l, nGroupes(l)); }; ls.onchange = upm; upm(); }
    var st = el.querySelector("[data-start]"); if (st) st.onclick = function () { startLive(cls, el.querySelector("[data-lec]").value); drawLive(); };
    if (!on) return;
    var gm = el.querySelector("[data-gmk]"); if (gm) gm.onclick = function () { if (!pratiquants(cls).length) { alert("Aucun élève présent dans la liste de cette classe."); return; } var W = makeWork(cls, +el.querySelector("[data-gn]").value, el.querySelector("[data-gm]").value); try { window.epsGroupesLog && epsGroupesLog(APP, cls, W.g, "jour"); } catch (e) {} liveSet(cls, function (x) { x.grp = W; }); };
    var gnv = el.querySelector("[data-gniv]"); if (gnv) gnv.onclick = function () { grOpen(cls, "grp"); };
    var gd = el.querySelector("[data-gdel]"); if (gd) gd.onclick = function () { liveSet(cls, function (x) { x.grp = null; }); };
    var gs = el.querySelector("[data-gsay]"); if (gs) gs.onclick = function () { sendMsg(cls, "👥 Groupes du jour\n" + v.grp.g.map(function (g, i) { return "Groupe " + (i + 1) + " : " + g.join(", "); }).join("\n")); };
    var ge = el.querySelector("[data-ged]"); if (ge) ge.onclick = function () { var md = document.createElement("div"); md.className = "lc-modal";
      md.innerHTML = '<div><h2>✏ Groupes du jour · ' + esc(cls) + '</h2><p class="lc-mut">Un groupe par cadre, noms séparés par des virgules.</p>' + v.grp.g.map(function (g, i) { return '<label class="lc-f"><span>Groupe ' + (i + 1) + '</span><textarea data-g="' + i + '">' + esc(g.join(", ")) + "</textarea></label>"; }).join("") + '<div class="lc-row"><button type="button" class="lc-b p" data-ok>Enregistrer</button><button type="button" class="lc-b" data-c>Annuler</button></div></div>';
      document.body.appendChild(md); md.querySelector("[data-c]").onclick = function () { md.remove(); };
      md.querySelector("[data-ok]").onclick = function () { var G = v.grp.g.map(function (_, i) { return md.querySelector('[data-g="' + i + '"]').value.split(",").map(function (s) { return s.trim(); }).filter(Boolean); }); md.remove(); try { window.epsGroupesLog && epsGroupesLog(APP, cls, G, "jour"); } catch (e) {} liveSet(cls, function (x) { x.grp = Object.assign({}, x.grp, { g: G }); }); }; };
    el.querySelectorAll("[data-part]").forEach(function (b) { b.onclick = function () { liveSet(cls, function (x) { x.part = b.dataset.part; }); }; });
    el.querySelectorAll("[data-q]").forEach(function (b) { b.onclick = function () { sendMsg(cls, b.dataset.q); }; });
    el.querySelectorAll("[data-role]").forEach(function (b) { b.onclick = function () { var r = roleSplit(rolesCat()[+b.dataset.role]).n; liveSet(cls, function (v) { v.roles = v.roles || { on: [], sh: 0 }; var i = v.roles.on.indexOf(r); if (i >= 0) v.roles.on.splice(i, 1); else v.roles.on.push(r); v.roles.who = rolesAssign(cls, v); }); }; });
    var rt = el.querySelector("[data-rot]"); if (rt) rt.onclick = function () { liveSet(cls, function (v) { v.roles.sh = (v.roles.sh || 0) + 1; v.roles.who = rolesAssign(cls, v); }); };
    var mt = el.querySelector("[data-mt]"); el.querySelector("[data-send]").onclick = function () { if (mt.value.trim()) sendMsg(cls, mt.value.trim()); };
    var dc = el.querySelector("[data-dict]"); if (dc) dc.onclick = function () { var r = new (window.SpeechRecognition || window.webkitSpeechRecognition)(); r.lang = "fr-FR"; dc.textContent = "⏺"; r.onresult = function (e) { mt.value = e.results[0][0].transcript; }; r.onend = function () { dc.textContent = "🎤"; }; try { r.start(); } catch (e) {} };
    el.querySelectorAll("[data-tm]").forEach(function (b) { b.onclick = function () { var lab = el.querySelector("[data-tl]").value.trim(); liveSet(cls, function (x) { x.tim = { end: Date.now() + (+b.dataset.tm) * 6e4, lab: lab }; }); }; });
    var ts = el.querySelector("[data-tstop]"); if (ts) ts.onclick = function () { liveSet(cls, function (x) { x.tim = null; }); };
    el.querySelector("[data-mk]").onclick = function () { var R = rang(cls); if (R && R.g && !confirm("Refaire les groupes de rangement de " + cls + " ? (la trace est gardée)")) return; if (!roster(cls).length) { alert("Aucune liste d'élèves pour cette classe."); return; } makeGroups(cls, +el.querySelector("[data-ng]").value); drawLive(); };
    var eg = el.querySelector("[data-edg]"); if (eg) eg.onclick = function () { var R = rang(cls), md = document.createElement("div"); md.className = "lc-modal";
      md.innerHTML = '<div><h2>✏ Groupes de rangement · ' + esc(cls) + '</h2><p class="lc-mut">Un groupe par cadre, noms séparés par des virgules.</p>' + R.g.map(function (g, i) { return '<label class="lc-f"><span>Groupe ' + (i + 1) + '</span><textarea data-g="' + i + '">' + esc(g.join(", ")) + "</textarea></label>"; }).join("") + '<div class="lc-row"><button type="button" class="lc-b p" data-ok>Enregistrer</button><button type="button" class="lc-b" data-c>Annuler</button></div></div>';
      document.body.appendChild(md); md.querySelector("[data-c]").onclick = function () { md.remove(); };
      md.querySelector("[data-ok]").onclick = function () { R.g = R.g.map(function (_, i) { return md.querySelector('[data-g="' + i + '"]').value.split(",").map(function (s) { return s.trim(); }).filter(Boolean); }); put(KR, R); md.remove(); drawLive(); }; };
    el.querySelectorAll("[data-rg]").forEach(function (b) { b.onclick = function () { var R = rang(cls), i = +b.dataset.rg; R.h = (R.h || []).concat([{ at: Date.now(), g: i, app: NOM }]); put(KR, R);
      var NP = R.g[i].filter(function (n) { return !isAbs(cls, n); }); liveSet(cls, function (x) { x.rang = { g: i, noms: NP }; x.msgs = (x.msgs || []).concat([{ id: uid(), at: Date.now(), t: "🧹 Rangement : groupe " + (i + 1) + "\n" + NP.join(", ") }]); }); }; });
    var vu = el.querySelector("[data-vue]"); if (vu) vu.onclick = function () { close(); EPST.openVue(); };
    el.querySelector("[data-stop]").onclick = function () { if (!confirm("Terminer la leçon pour " + cls + " ?")) return; liveSet(cls, function (x) { x.on = 0; x.tim = null; }); };
  }

  /* 🧪 leçon simulée : classe fictive (créée au besoin), fiche de démonstration de l'appli lancée tout de suite, pilotage ouvert */
  function simulate() {
    var D = window.EPSD && EPSD.demo; if (!D) { alert("Module commun indisponible : recharge la page."); return; }
    function go() { var l = get(KL, "demo-" + APP); startLive(D.nom, l ? l.id : ""); LIVECLS = D.nom; open("live"); }
    if (EPSD.sim && EPSD.sim.on()) { if (D.on()) return go(); return D.create().then(function () { setTimeout(go, 400); }); }
    if (!confirm("Entrer en simulation ? Tes données sont mises de côté et le partage est coupé ; une classe fictive est installée et la leçon simulée se lance. Bandeau en bas à gauche pour passer en élève ou quitter.")) return;
    EPSD.sim.enter({ app: APP, act: "lesson" });
  }
  /* ================= 📊 évaluation de leçon (participation, sérieux, thème du jour) =================
     eps.leceval.<appli>.v1 : {id: classe|jour, cls, day, lec, theme, el:{<clé élève>:{p, s, t}}} (0 à 3) ; reprise par eps-eval.js (proposition) et le bulletin. */
  var KE = "eps.leceval." + APP + ".v1";
  var LEV_L = ["Insuffisant", "Fragile", "Satisfaisant", "Très bien"], LEV_C = ["#C0392B", "#E67E22", "#2E86C1", "#1E8449"];
  function lecCrit() { var d = ["Participation", "Sérieux", "Thème du jour"]; try { return window.EPSP ? EPSP.p({ id: "leceval", sec: "Évaluation de leçon", label: "Les 3 critères de l'évaluation de leçon (le 3e reprend le thème du jour)", type: "list", fixed: 3, def: d }) : d; } catch (e) { return d; } }
  function ekey(full) { return String(full || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean).sort().join(" "); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  var LEC_DAY = null;
  function drawLEval() {
    var C = classes(); if (!LIVECLS) { var c0 = cur(); LIVECLS = (c0 && c0.nom) || C[0] || ""; }
    var cls = LIVECLS, day = LEC_DAY || today(), id = nn(cls) + "|" + day, rec = get(KE, id) || { id: id, cls: cls, day: day, el: {} };
    var v = live(cls), lec = (v && v.lec && get(KL, v.lec)) || lecons().filter(function (l) { return (l.prog || []).some(function (p) { return same(p.c, cls) && dayOf(p.at) === day; }); })[0] || null;
    var theme = rec.theme || (lec && (lec.but || lec.objM || lec.titre)) || "", CR = lecCrit(), R = roster(cls);
    var days = all(KE).filter(function (o) { return same(o.cls, cls); }).map(function (o) { return o.day; }); if (days.indexOf(day) < 0) days.push(day); days.sort().reverse();
    var h = '<h2>📊 Évaluer la leçon</h2><p class="lc-mut">Une note rapide par élève, valorisant ' + esc(CR[0].toLowerCase()) + ", " + esc(CR[1].toLowerCase()) + " et " + esc(CR[2].toLowerCase()) + '. Elle compte dans la note proposée (à titre indicatif) et dans les appréciations.</p>' +
      '<div class="lc-row"><b>Classe</b><select class="lc-sel" data-cls>' + C.map(function (c) { return "<option" + (same(c, cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + '</select><b>Jour</b><select class="lc-sel" data-day>' + days.map(function (d) { return '<option value="' + d + '"' + (d === day ? " selected" : "") + ">" + new Date(d + "T12:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) + "</option>"; }).join("") + "</select></div>" +
      (day === today() ? appelBox(cls, true) : "") + '<label class="lc-f"><span>' + esc(CR[2]) + " : intitulé de cette leçon</span><input data-theme value=\"" + esc(theme) + '" placeholder="ex. Prendre l\'information avant d\'agir"></label>' +
      (R.length ? '<div class="lc-row"><button type="button" class="lc-b s" data-all="2">Tous « Satisfaisant »</button><button type="button" class="lc-b s" data-clear>Tout effacer</button><button type="button" class="lc-b s" data-pn>📋 Pronote (cette leçon)</button><span class="lc-mut" style="margin:0">Touche une case pour changer le niveau.</span></div>' +
        '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;background:#fff;border-radius:14px"><tr style="text-align:left;color:#6A6F78;font-size:13px"><th style="padding:8px">Élève</th>' + CR.map(function (c) { return '<th style="padding:8px">' + esc(c) + "</th>"; }).join("") + '<th style="padding:8px">Moy.</th></tr>' +
        R.map(function (n) { var k = ekey(n), x = rec.el[k] || {}, vals = ["p", "s", "t"].map(function (q) { return x[q]; }), done = vals.filter(function (z) { return z != null; });
          if (isAbs(cls, n, day) && !done.length) return '<tr style="border-top:1px solid #F0ECE3;color:#6A6F78"><td style="padding:6px 8px;font-weight:700"><s>' + esc(n) + '</s></td><td colspan="4" style="padding:6px 8px">Absent(e) à l\'appel : pas évalué(e)</td></tr>';
          return '<tr style="border-top:1px solid #F0ECE3"><td style="padding:6px 8px;font-weight:700">' + esc(n) + "</td>" + ["p", "s", "t"].map(function (q) { var z = x[q];
            return '<td style="padding:4px"><button type="button" data-k="' + esc(k) + '" data-q="' + q + '" aria-label="' + esc(n) + " : " + esc(CR[["p", "s", "t"].indexOf(q)]) + " = " + (z == null ? "non évalué" : LEV_L[z]) + '" style="min-width:112px;height:40px;border-radius:10px;border:2px solid ' + (z == null ? "#E6E1D6" : LEV_C[z]) + ";background:" + (z == null ? "#FBFAF7" : LEV_C[z]) + ";color:" + (z == null ? "#6A6F78" : "#fff") + ';font:700 13px system-ui">' + (z == null ? "—" : LEV_L[z]) + "</button></td>"; }).join("") +
            '<td style="padding:6px 8px;font-weight:800">' + (done.length ? (Math.round(done.reduce(function (a, b) { return a + b; }, 0) / done.length / 3 * 20 * 4) / 4).toString().replace(".", ",") + "/20" : "—") + "</td></tr>"; }).join("") + "</table></div>"
        : '<div class="lc-box">Aucune liste d\'élèves pour cette classe.</div>') + '<p class="lc-mut" data-msg></p>';
    var el = shell(h);
    function saveRec() { rec.cls = cls; rec.day = day; rec.lec = lec ? lec.id : rec.lec || ""; put(KE, rec); }
    el.querySelector("[data-cls]").onchange = function () { LIVECLS = this.value; drawLEval(); };
    el.querySelector("[data-day]").onchange = function () { LEC_DAY = this.value; drawLEval(); };
    bindAppel(el, cls, drawLEval);
    var th = el.querySelector("[data-theme]"); th.onchange = function () { rec.theme = th.value.trim(); saveRec(); };
    var al = el.querySelector("[data-all]"); if (al) al.onclick = function () { R.forEach(function (n) { if (isAbs(cls, n, day)) return; var k = ekey(n), x = rec.el[k] = rec.el[k] || {}; ["p", "s", "t"].forEach(function (q) { if (x[q] == null) x[q] = 2; }); }); saveRec(); drawLEval(); };
    var pnb = el.querySelector("[data-pn]"); if (pnb) pnb.onclick = function () { if (!(window.EPSR && EPSR.pronote)) { alert("Export Pronote indisponible : recharge la page."); return; }
      var CRn = lecCrit(), rows = R.map(function (n) { var k = ekey(n), x = rec.el[k] || {}, q = ["p", "s", "t"].map(function (z) { return x[z] == null ? null : +x[z]; }), d = q.filter(function (z) { return z != null; }), sp = n.split(" ");
        return { nom: sp.slice(1).join(" ") || n, prenom: sp[0], st: isAbs(cls, n, day) && !d.length ? "ABS" : "", v: [d.length ? Math.round(d.reduce(function (a, b) { return a + b; }, 0) / d.length / 3 * 20 * 4) / 4 : null].concat(q.map(function (z) { return z == null ? null : Math.round(z / 3 * 20 * 4) / 4; })) }; });
      EPSR.pronote({ app: NOM, classe: cls, titre: "Leçon du " + new Date(day + "T12:00").toLocaleDateString("fr-FR") + (rec.theme ? " · " + rec.theme : ""), color: COL, cols: [{ t: "Note de la leçon /20" }].concat(CRn.map(function (c) { return { t: c + " /20" }; })), rows: rows }); };
    var cl = el.querySelector("[data-clear]"); if (cl) cl.onclick = function () { if (confirm("Effacer l'évaluation de cette leçon pour toute la classe ?")) { rec.el = {}; saveRec(); drawLEval(); } };
    el.querySelectorAll("[data-q]").forEach(function (b) { b.onclick = function () { var x = rec.el[b.dataset.k] = rec.el[b.dataset.k] || {}, q = b.dataset.q; x[q] = x[q] == null ? 2 : x[q] === 3 ? null : x[q] + 1; if (x[q] === null) delete x[q]; saveRec(); drawLEval(); }; });
  }
  /* ================= 🏁 résultats des situations (déclarés par les élèves) et bilan de fin de séquence =================
     Côté élève : à la fin de chaque situation (et de la remise en action), « Mon résultat » ✅ Réussi / 🟠 En partie / ❌ Pas encore,
     pour le ou les élèves qui utilisent la tablette (plusieurs noms si groupe). Un enregistrement par élève et par jour :
     eps.lecres.<appli>.v1 (pre lr.<appli>|), id = classe|jour|clé du nom, r = { "<idLeçon>:s0": 2, "<idLeçon>:rem": 1 }.
     Côté enseignant : onglet « 🏁 Bilan de séquence » (situations, taux de réussite, ce qui a péché, bilan par élève, impression). */
  var KS = "eps.lecres." + APP + ".v1", RES_L = ["Pas encore", "En partie", "Réussi"], RES_I = ["❌", "🟠", "✅"], RES_C = ["#C0392B", "#E67E22", "#1E8449"];
  function sitList(l) { var S = (l.sits || []).map(function (s, i) { return { k: l.id + ":s" + i, t: s.t && /^situation\s*\d/i.test(s.t) ? s.t : "Situation " + (i + 1) + (s.t ? " · " + s.t : ""), crR: s.crR || "", simp: s.simp || "" }; });
    if (l.rem || l.remCr) S.push({ k: l.id + ":rem", t: "Remise en action", crR: "", simp: "" }); return S; }
  function resId(cls, day, k) { return nn(cls) + "|" + day + "|" + k; }
  var PREVRES = {};
  function resGet(cls, nom, sk, prev) { if (prev) return PREVRES[nom + "|" + sk]; var o = get(KS, resId(cls, today(), ekey(nom))); return o && o.r ? o.r[sk] : undefined; }
  function resSet(cls, nom, sk, v, prev) { if (prev) { if (v == null) delete PREVRES[nom + "|" + sk]; else PREVRES[nom + "|" + sk] = v; return; }
    var k = ekey(nom), id = resId(cls, today(), k), o = get(KS, id) || { id: id, cls: cls, day: today(), ek: k, r: {} }; o.r = o.r || {}; if (v == null) delete o.r[sk]; else o.r[sk] = v; put(KS, o); }
  function whoList(cls) { return roster(cls).filter(function (n) { return !isAbs(cls, n); }); }
  function whoGet(cls) { try { var w = JSON.parse(sessionStorage.getItem("eps.lcwho." + APP) || "null"); return w && same(w.cls, cls) ? w.n || [] : []; } catch (e) { return []; } }
  function whoSet(cls, n) { try { sessionStorage.setItem("eps.lcwho." + APP, JSON.stringify({ cls: cls, n: n })); } catch (e) {} }
  /* 🎨 indicateur coloré d'une situation (repris d'Escalade) : « intitulé ; seuil orange ; seuil vert ; unité » ; l'élève saisit sa valeur,
     la couleur (vert = réussi, orange = en partie, rouge = pas encore) devient son résultat de la situation */
  function indParse(t) { var p = String(t || "").split(";").map(function (x) { return x.trim(); }); if (p.length < 3) return null; var o = parseFloat(p[1].replace(",", ".")), g = parseFloat(p[2].replace(",", "."));
    return isFinite(o) && isFinite(g) && o !== g ? { t: p[0], o: o, g: g, u: p[3] || "", up: g > o } : null; }
  function indVal(I, x) { return I.up ? (x >= I.g ? 2 : x >= I.o ? 1 : 0) : (x <= I.g ? 2 : x <= I.o ? 1 : 0); }
  function indRow(sk, I) { return '<div class="res" data-sk="' + esc(sk) + '"><span>' + esc(I.t || "Ma valeur") + " :</span>" + '<input type="number" step="any" inputmode="decimal" data-iv style="width:110px;font:700 18px system-ui;padding:8px;border-radius:10px;border:2px solid #E6E1D6"> ' + esc(I.u) +
      '<button type="button" data-ivok data-o="' + I.o + '" data-g="' + I.g + '">Valider</button><span data-ivr style="font-weight:800"></span><span style="display:none">' + [2, 1, 0].map(function (v) { return '<button type="button" data-rv="' + v + '"></button>'; }).join("") + "</span>" +
      '<div style="width:100%;font-size:13px;color:#6A6F78">🟢 ' + (I.up ? "≥ " : "≤ ") + String(I.g).replace(".", ",") + " · 🟠 " + (I.up ? "≥ " : "≤ ") + String(I.o).replace(".", ",") + " · 🔴 sinon</div></div>"; }
  function resRow(sk) { return '<div class="res" data-sk="' + esc(sk) + '"><span>Mon résultat :</span>' + [2, 1, 0].map(function (v) { return '<button type="button" data-rv="' + v + '">' + RES_I[v] + " " + RES_L[v] + "</button>"; }).join("") + "</div>"; }
  function bindRes(o, l, cls, prev) {
    var R = cls ? whoList(cls) : [], SL = sitList(l);
    function upd() { var W = whoGet(cls);
      o.querySelectorAll(".lc-who button").forEach(function (b) { var on = W.indexOf(R[+b.dataset.who]) >= 0; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      o.querySelectorAll(".res").forEach(function (r) { var vals = W.map(function (n) { return resGet(cls, n, r.dataset.sk, prev); }), v = vals.length && vals.every(function (x) { return x === vals[0]; }) ? vals[0] : undefined;
        r.querySelectorAll("[data-rv]").forEach(function (b) { var on = v != null && +b.dataset.rv === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
        var ir = r.querySelector("[data-ivr]"); if (ir) { ir.textContent = v == null ? "" : ["🔴 pas encore", "🟠 presque", "🟢 réussi !"][v]; ir.style.color = v == null ? "" : ["#C0392B", "#D35400", "#1E8449"][v]; } });
      var t = o.querySelector("[data-today]"); if (!t) return;
      if (!W.length) { t.innerHTML = "<h3>📈 Mon bilan du jour</h3><div>Touche ton nom en haut, puis note ton résultat à la fin de chaque situation.</div>"; return; }
      var h = "<h3>📈 Mon bilan du jour</h3>", worst = null;
      W.forEach(function (n) { var c = [0, 0, 0], nb = 0; SL.forEach(function (s) { var v = resGet(cls, n, s.k, prev); if (v != null) { c[v]++; nb++; if (v < 2 && (!worst || v < worst.v)) worst = { s: s, v: v }; } });
        h += "<div><b>" + esc(n.split(" ")[0]) + "</b> : " + (nb ? "✅ " + c[2] + " réussie" + (c[2] > 1 ? "s" : "") + " · 🟠 " + c[1] + " en partie · ❌ " + c[0] + " pas encore (" + nb + "/" + SL.length + " situations notées)" : "rien de noté pour l'instant") + "</div>"; });
      if (worst) h += '<div style="margin-top:8px;padding:10px 12px;background:#FFF6E0;border-radius:12px">🎯 <b>Pour la prochaine fois</b> : retravaille « ' + esc(worst.s.t) + " »." + (worst.s.crR ? "<br>💡 " + esc(worst.s.crR) : "") + (worst.v === 0 && worst.s.simp ? "<br>⬇ Pour commencer : " + esc(worst.s.simp) : "") + "</div>";
      else if (SL.some(function (s) { return W.some(function (n) { return resGet(cls, n, s.k, prev) != null; }); })) h += '<div style="margin-top:8px;padding:10px 12px;background:#E3F4E8;border-radius:12px">👏 Tout est réussi ! La prochaine fois, essaie la variante « plus difficile ».</div>';
      try { var VB = W.map(function (n) { var m = vMine(cls, n); return m.length ? "<div>🥋 <b>" + esc(n.split(" ")[0]) + "</b> : " + m.map(esc).join(" · ") + "</div>" : ""; }).join(""); if (VB) h += '<div style="margin-top:8px;padding:10px 12px;background:#EEF4FF;border-radius:12px"><b>🥋 Mes validations</b>' + VB + "</div>"; } catch (e) {}
      t.innerHTML = h; }
    o.querySelectorAll(".lc-who button").forEach(function (b) { b.onclick = function () { var W = whoGet(cls), n = R[+b.dataset.who], i = W.indexOf(n); if (i >= 0) W.splice(i, 1); else W.push(n); whoSet(cls, W); upd(); }; });
    o.querySelectorAll(".res [data-ivok]").forEach(function (b) { b.onclick = function () { var r = b.parentNode, x = parseFloat(String(r.querySelector("[data-iv]").value).replace(",", ".")); if (!isFinite(x)) return;
      var I = { o: +b.dataset.o, g: +b.dataset.g }; I.up = I.g > I.o; var v = indVal(I, x), out = r.querySelector("[data-ivr]"); out.textContent = ["🔴 pas encore", "🟠 presque", "🟢 réussi !"][v]; out.style.color = ["#C0392B", "#D35400", "#1E8449"][v];
      var W = whoGet(cls); if (!W.length) { var wb = o.querySelector(".bk.who"); if (wb) { wb.scrollIntoView({ block: "center" }); wb.classList.add("need"); setTimeout(function () { wb.classList.remove("need"); }, 1600); } return; }
      W.forEach(function (n) { resSet(cls, n, r.dataset.sk, v, prev); }); upd(); }; });
    o.querySelectorAll(".res [data-rv]").forEach(function (b) { b.onclick = function () { var W = whoGet(cls), sk = b.parentNode.dataset.sk, v = +b.dataset.rv;
      if (!W.length) { var wb = o.querySelector(".bk.who"); if (wb) { wb.scrollIntoView({ block: "center" }); wb.classList.add("need"); setTimeout(function () { wb.classList.remove("need"); }, 1600); } return; }
      var allSame = W.every(function (n) { return resGet(cls, n, sk, prev) === v; }); W.forEach(function (n) { resSet(cls, n, sk, allSame ? null : v, prev); }); upd(); }; });
    upd();
  }

  var BSEQ = null;
  function bilanData(cls, seq) {
    var L = lecons().filter(function (l) { return (l.seq || "Sans séquence") === seq && l.statut !== "brouillon" && forCls(l, cls); }), ids = L.map(function (l) { return l.id; });
    var recs = all(KS).filter(function (o) { return same(o.cls, cls); }).sort(function (a, b) { return String(a.day).localeCompare(String(b.day)); });
    var SIT = []; L.forEach(function (l, li) { sitList(l).forEach(function (s) { s.l = l; s.li = li; s.n = [0, 0, 0]; SIT.push(s); }); });
    SIT.forEach(function (s) { recs.forEach(function (o) { var v = o.r && o.r[s.k]; if (v != null) s.n[v]++; }); s.tot = s.n[0] + s.n[1] + s.n[2]; s.taux = s.tot ? (s.n[2] + .5 * s.n[1]) / s.tot : null; });
    var EV = all(KE).filter(function (o) { return same(o.cls, cls) && (!o.lec || ids.indexOf(o.lec) >= 0); });
    var EL = roster(cls).map(function (n) { var k = ekey(n), last = {}; recs.forEach(function (o) { if (o.ek !== k) return; Object.keys(o.r || {}).forEach(function (sk) { last[sk] = o.r[sk]; }); });
      var done = SIT.filter(function (s) { return last[s.k] != null; }), pts = done.reduce(function (a, s) { return a + (last[s.k] === 2 ? 1 : last[s.k] === 1 ? .5 : 0); }, 0);
      var LE = []; EV.forEach(function (o) { var x = (o.el || {})[k]; if (!x) return; var v = ["p", "s", "t"].filter(function (q) { return x[q] != null; }).map(function (q) { return +x[q]; }); if (v.length) LE.push(v.reduce(function (a, b) { return a + b; }, 0) / v.length); });
      return { n: n, last: last, done: done.length, taux: done.length ? pts / done.length : null, le: LE.length ? Math.round(LE.reduce(function (a, b) { return a + b; }, 0) / LE.length / 3 * 20 * 4) / 4 : null, nle: LE.length,
        rate: done.filter(function (s) { return last[s.k] === 0; }), partiel: done.filter(function (s) { return last[s.k] === 1; }) }; });
    var noted = SIT.filter(function (s) { return s.tot; }), glob = noted.length ? noted.reduce(function (a, s) { return a + s.n[2] + .5 * s.n[1]; }, 0) / noted.reduce(function (a, s) { return a + s.tot; }, 0) : null;
    var ok = noted.filter(function (s) { return s.taux >= .7; }).sort(function (a, b) { return b.taux - a.taux; }), ko = noted.filter(function (s) { return s.taux < .5; }).sort(function (a, b) { return a.taux - b.taux; });
    return { L: L, SIT: SIT, EL: EL, glob: glob, ok: ok, ko: ko, nrec: noted.reduce(function (a, s) { return a + s.tot; }, 0) };
  }
  function pc(x) { return x == null ? "—" : Math.round(x * 100) + " %"; }
  function sitName(s) { return "L" + (s.li + 1) + " · " + s.t; }
  function bilanTexte(cls, seq, B) {
    var t = "Bilan de séquence · " + NOM + " · " + seq + " · " + cls + "\n" + B.L.length + " leçon(s), " + B.SIT.length + " situation(s), " + B.nrec + " résultat(s) notés par les élèves. Réussite globale : " + pc(B.glob) + ".\n";
    if (B.ok.length) t += "Ce qui a marché : " + B.ok.slice(0, 3).map(function (s) { return sitName(s) + " (" + pc(s.taux) + ")"; }).join(" ; ") + ".\n";
    if (B.ko.length) t += "Ce qui a péché : " + B.ko.slice(0, 3).map(function (s) { return sitName(s) + " (" + pc(s.taux) + ", " + s.n[0] + " « pas encore »)"; }).join(" ; ") + ".\n";
    t += "\nPar élève :\n" + B.EL.map(function (e) { return "- " + e.n + " : " + e.done + "/" + B.SIT.length + " situations notées, réussite " + pc(e.taux) + (e.le != null ? ", évaluation de leçon " + String(e.le).replace(".", ",") + "/20" : "") + (e.rate.length ? ". À retravailler : " + e.rate.map(sitName).join(", ") : "") + "."; }).join("\n");
    return t;
  }
  /* 🖨 fiches élèves de fin de séquence (aperçu puis impression) : situations, réussite, leçons évaluées, auto-positionnement,
     mot validé du professeur (commentaire de l'évaluation), classement ATP (Badminton), lien « Mon bilan » si les bilans sont en ligne. */
  function qrSvg(txt) { try { var L = window.QRLib; if (!L || !txt) return ""; var q = new L.QRCode(-1, L.ECL.M); q.addData(txt); q.make(); var n = q.getModuleCount(), p = "";
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) p += "M" + c + " " + r + "h1v1h-1z"; return '<svg viewBox="-2 -2 ' + (n + 4) + " " + (n + 4) + '" width="110" height="110" xmlns="http://www.w3.org/2000/svg"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><path d="' + p + '" fill="#000"/></svg>'; } catch (e) { return ""; } }
  function fichesEleves(cls, seq, B) {
    var link = ""; try { link = window.EPSD && EPSD.bilLink ? EPSD.bilLink() : ""; } catch (e) {}
    var atp = null; try { var bS = (0, eval)("typeof S!=='undefined'?S:null"); if (APP === "badminton" && typeof window.atpRank === "function" && bS && bS.classes) { var bc = bS.classes.filter(function (c) { return same(c.nom, cls); })[0]; if (bc) { var AR = atpRank(bc); atp = {}; AR.forEach(function (x) { var e = bc.eleves.filter(function (y) { return y.id === x.id; })[0]; if (e && (x.v + x.d)) atp[ekey((e.prenom || "") + " " + (e.nom || ""))] = { rk: x.rk, pts: x.pts, n: AR.length, v: x.v, d: x.d }; }); } } } catch (e) {}
    var IC = { 2: "✅ Réussi", 1: "🟠 En partie", 0: "❌ Pas encore" }, today_ = new Date().toLocaleDateString("fr-FR");
    var pages = B.EL.map(function (e) {
      var ev = []; try { ev = (EPSD.evalsOf ? EPSD.evalsOf(e.n, cls) : []).filter(function (x) { return x.app === NOM; }); } catch (x) {}
      var apr = ev.map(function (x) { return x.apr; }).filter(Boolean)[0] || "", apm = ev.map(function (x) { return x.apm; }).filter(Boolean)[0] || "", comm = ev.map(function (x) { return x.comm; }).filter(Boolean)[0] || "", a = atp && atp[ekey(e.n)];
      var sits = B.SIT.map(function (s) { var v = e.last[s.k]; return "<tr><td>" + esc(sitName(s)) + "</td><td>" + (v == null ? '<span style="color:#888">non noté</span>' : IC[v]) + "</td></tr>"; }).join("");
      var aRet = e.rate.concat(e.partiel).slice(0, 3);
      return '<section class="lc-fiche"><div class="hd" style="border-bottom:4px solid ' + COL + '"><div><b style="font-size:20px">🏁 Bilan de fin de séquence · ' + esc(NOM) + "</b><br>" + esc(e.n) + " · " + esc(cls) + " · " + esc(seq) + '</div><div style="text-align:right;font-size:13px">' + today_ + "<br>" + (window.epsVoie ? (epsVoie(cls) === "pro" ? "Voie professionnelle" : "Voie générale et technologique") : "") + "</div></div>" +
        '<div class="g"><div class="k"><b>' + (e.taux == null ? "—" : Math.round(e.taux * 100) + " %") + "</b><span>de réussite aux situations (" + e.done + "/" + B.SIT.length + " notées)</span></div>" +
        (e.le != null ? '<div class="k"><b>' + String(e.le).replace(".", ",") + " / 20</b><span>évaluation des leçons (" + e.nle + ")</span></div>" : "") +
        (a ? '<div class="k"><b>n° ' + a.rk + " / " + a.n + "</b><span>classement ATP · " + a.pts + " pts · " + a.v + " V - " + a.d + " D</span></div>" : "") + "</div>" +
        "<h3>Mes situations</h3><table>" + sits + "</table>" +
        ((apr || apm) ? "<h3>🙋 Ce que j'ai dit de moi</h3>" + (apr ? "<p>✓ J'ai réussi : " + esc(apr) + "</p>" : "") + (apm ? "<p>→ Je veux améliorer : " + esc(apm) + "</p>" : "") : "") +
        (comm ? "<h3>💬 Le mot de mon professeur</h3><p>" + esc(comm) + "</p>" : "") +
        (aRet.length ? "<h3>🎯 Pour la suite</h3><ul>" + aRet.map(function (s) { return "<li>Retravailler « " + esc(sitName(s)) + " »" + (s.crR ? " : " + esc(s.crR) : "") + "</li>"; }).join("") + "</ul>" : "<h3>🎯 Pour la suite</h3><p>Bravo : continue avec les variantes plus difficiles.</p>") +
        (link ? '<div class="ln">' + qrSvg(link) + "<div><b>Mon bilan en ligne</b><br>" + esc(link) + "<br><small>avec le code personnel donné par ton professeur</small></div></div>" : "") + "</section>"; });
    var ov = document.createElement("div"); ov.className = "lc-modal lc-fiches"; ov.style.zIndex = "2147483400";
    ov.innerHTML = '<div style="max-width:860px"><div class="lc-row lc-noprint"><b style="flex:1">🖨 Fiches de fin de séquence · ' + esc(cls) + " (" + pages.length + ')</b><button type="button" class="lc-b p" data-pr>🖨 Imprimer</button><button type="button" class="lc-b" data-x>✕ Fermer</button></div><p class="lc-mut lc-noprint">Une page par élève. Seul ce qui a été validé (ton commentaire) et ce que l\'élève a saisi y figure.</p>' + pages.join("") + "</div>";
    if (!document.getElementById("lc-fiche-css")) { var st = document.createElement("style"); st.id = "lc-fiche-css"; st.textContent =
      ".lc-fiche{background:#fff;border:1px solid #E6E1D6;border-radius:14px;padding:16px 20px;margin:12px 0;font:15px/1.45 system-ui,sans-serif;color:#14171C}.lc-fiche .hd{display:flex;justify-content:space-between;gap:10px;padding-bottom:8px;margin-bottom:10px}" +
      ".lc-fiche .g{display:flex;gap:10px;flex-wrap:wrap}.lc-fiche .k{border:1px solid #E6E1D6;border-radius:12px;padding:8px 12px;min-width:150px}.lc-fiche .k b{display:block;font-size:22px}.lc-fiche .k span{font-size:13px;color:#555}" +
      ".lc-fiche h3{margin:12px 0 4px;font-size:16px}.lc-fiche table{border-collapse:collapse;width:100%}.lc-fiche td{border-bottom:1px solid #EEE;padding:4px 6px}.lc-fiche .ln{display:flex;gap:12px;align-items:center;margin-top:12px;border-top:1px dashed #CCC;padding-top:10px;font-size:13px;word-break:break-all}" +
      "@media print{html.lc-fprint body>*:not(.lc-fiches){display:none!important}html.lc-fprint .lc-fiches{position:static!important;background:none!important;padding:0!important;display:block!important;overflow:visible!important}html.lc-fprint .lc-noprint{display:none!important}html.lc-fprint .lc-fiche{break-after:page;border:0;margin:0}}";
      document.head.appendChild(st); }
    document.body.appendChild(ov);
    ov.querySelector("[data-x]").onclick = function () { ov.remove(); };
    ov.querySelector("[data-pr]").onclick = function () { document.documentElement.classList.add("lc-fprint"); setTimeout(function () { window.print(); setTimeout(function () { document.documentElement.classList.remove("lc-fprint"); }, 600); }, 60); };
  }
  function drawBilan() {
    var C = classes(); if (!LIVECLS) { var c0 = cur(); LIVECLS = (c0 && c0.nom) || C[0] || ""; }
    var cls = LIVECLS, S = seqs().filter(function (s) { return lecons().some(function (l) { return (l.seq || "Sans séquence") === s && l.statut !== "brouillon"; }); });
    if (!BSEQ || S.indexOf(BSEQ) < 0) { var best = null, bn = -1; S.forEach(function (s) { var n = bilanData(cls, s).nrec; if (n > bn) { bn = n; best = s; } }); BSEQ = best; }
    var seq = BSEQ, B = seq ? bilanData(cls, seq) : null;
    var bar = function (x) { return x == null ? '<span class="lc-mut" style="margin:0">non notée</span>' : '<span style="display:inline-block;width:110px;height:12px;border-radius:6px;background:#F0ECE3;vertical-align:middle;overflow:hidden"><span style="display:block;height:100%;width:' + Math.round(x * 100) + "%;background:" + (x >= .7 ? RES_C[2] : x >= .5 ? RES_C[1] : RES_C[0]) + '"></span></span> <b>' + pc(x) + "</b>"; };
    var th = function (t) { return '<th style="padding:8px;text-align:left;color:#6A6F78;font-size:13px">' + t + "</th>"; }, td = function (t, b) { return '<td style="padding:6px 8px;' + (b ? "font-weight:800" : "") + '">' + t + "</td>"; };
    var h = '<h2>🏁 Bilan de fin de séquence</h2><p class="lc-mut">À partir des résultats que les élèves notent sur leur tablette à la fin de chaque situation (✅ réussi, 🟠 en partie, ❌ pas encore) et de tes évaluations de leçon.</p>' +
      '<div class="lc-row"><b>Classe</b><select class="lc-sel" data-cls>' + C.map(function (c) { return "<option" + (same(c, cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>" +
      (S.length ? '<b>Séquence</b><select class="lc-sel" data-seq>' + S.map(function (s) { return "<option" + (s === seq ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("") + "</select>" : "") +
      (B ? '<button type="button" class="lc-b s" data-copy>📋 Copier le bilan</button><button type="button" class="lc-b s" data-print>🖨 Imprimer</button><button type="button" class="lc-b s p" data-fiches>🖨 Fiches élèves</button>' : "") + "</div>";
    if (!B) h += '<div class="lc-box">Aucune leçon validée pour l\'instant : crée et valide tes fiches de leçon, les élèves pourront y noter leurs résultats.</div>';
    else {
      h += '<div class="lc-box" style="font-size:16px;line-height:1.5"><b>' + B.L.length + " leçon" + (B.L.length > 1 ? "s" : "") + ", " + B.SIT.length + " situations, " + B.nrec + " résultats notés.</b> Réussite globale : " + bar(B.glob) +
        (B.ok.length ? "<div>👍 <b>Ce qui a marché</b> : " + B.ok.slice(0, 3).map(function (s) { return esc(sitName(s)) + " (" + pc(s.taux) + ")"; }).join(" ; ") + "</div>" : "") +
        (B.ko.length ? '<div style="color:#8E2B1F">⚠ <b>Ce qui a péché</b> : ' + B.ko.slice(0, 3).map(function (s) { return esc(sitName(s)) + " (" + pc(s.taux) + ", " + s.n[0] + " « pas encore »)"; }).join(" ; ") + "</div>" : "") +
        (!B.nrec ? '<div class="lc-mut" style="margin:6px 0 0">Aucun résultat noté pour cette classe : les élèves le font dans la fiche de leçon (côté élève), à la fin de chaque situation.</div>' : "") + "</div>" +
        "<h3>🏃 Situations</h3><div style=\"overflow:auto\"><table style=\"width:100%;border-collapse:collapse;background:#fff;border-radius:14px\"><tr>" + th("Leçon") + th("Situation") + th("✅") + th("🟠") + th("❌") + th("Réussite") + "</tr>" +
        B.SIT.map(function (s) { return '<tr style="border-top:1px solid #F0ECE3">' + td(esc((s.l.num ? "n° " + s.l.num : "L" + (s.li + 1)) + (s.l.titre ? " · " + s.l.titre : "")), 0) + td(esc(s.t), 1) + td(s.n[2]) + td(s.n[1]) + td(s.n[0]) + td(bar(s.taux)) + "</tr>"; }).join("") + "</table></div>" +
        "<h3>👤 Par élève</h3><div style=\"overflow:auto\"><table style=\"width:100%;border-collapse:collapse;background:#fff;border-radius:14px\"><tr>" + th("Élève") + th("Notées") + th("Réussite") + th("Éval. leçon") + th("À retravailler") + "</tr>" +
        B.EL.map(function (e) { return '<tr style="border-top:1px solid #F0ECE3">' + td(esc(e.n), 1) + td(e.done + "/" + B.SIT.length) + td(bar(e.taux)) + td(e.le != null ? String(e.le).replace(".", ",") + "/20" : "—") +
          td((e.rate.length ? "❌ " + e.rate.map(function (s) { return esc(sitName(s)); }).join(", ") : "") + (e.partiel.length ? (e.rate.length ? "<br>" : "") + '<span style="color:#6A6F78">🟠 ' + e.partiel.map(function (s) { return esc(sitName(s)); }).join(", ") + "</span>" : "") || "—") + "</tr>"; }).join("") + "</table></div>" +
        (function () { var RM = all(KRM).filter(function (r) { return r.app === APP && same(r.cls, cls); }); if (!RM.length) return "";
          var by = {}; RM.forEach(function (r) { (by[ekey(r.el)] = by[ekey(r.el)] || { n: r.el, L: [] }).L.push(r); });
          return "<h3>🎯 Remédiation en autonomie</h3><div style=\"overflow:auto\"><table style=\"width:100%;border-collapse:collapse;background:#fff;border-radius:14px\"><tr>" + th("Élève") + th("Proposées") + th("✅") + th("🟠") + th("❌") + th("Pas essayées") + th("Apprentissages") + "</tr>" +
            Object.keys(by).map(function (k) { var e = by[k], c = [0, 0, 0, 0]; e.L.forEach(function (r) { c[r.st || 0]++; }); return '<tr style="border-top:1px solid #F0ECE3">' + td(esc(e.n), 1) + td(e.L.length) + td(c[3]) + td(c[2]) + td(c[1]) + td(c[0]) + td(esc(e.L.map(function (r) { return r.tag; }).filter(Boolean).join(" · "))) + "</tr>"; }).join("") + "</table></div>"; })() +
        '<p class="lc-mut">Résultats déclarés par les élèves (dernier résultat noté pour chaque situation). Ce bilan reste sur tes tablettes ; il n\'est pas montré aux élèves.</p>';
    }
    var el = shell(h);
    el.querySelector("[data-cls]").onchange = function () { LIVECLS = this.value; BSEQ = null; drawBilan(); };
    var sq = el.querySelector("[data-seq]"); if (sq) sq.onchange = function () { BSEQ = this.value; drawBilan(); };
    var cp = el.querySelector("[data-copy]"); if (cp) cp.onclick = function () { var t = bilanTexte(cls, seq, B); try { navigator.clipboard.writeText(t).then(function () { cp.textContent = "✓ Copié"; }, function () { prompt("Copie ce bilan :", t); }); } catch (e) { prompt("Copie ce bilan :", t); } };
    var fi = el.querySelector("[data-fiches]"); if (fi) fi.onclick = function () { var go = function () { fichesEleves(cls, seq, B); }; if (window.QRLib || !(window.EPSD && EPSD.qr && EPSD.bilLink && EPSD.bilLink())) go(); else EPSD.qr().then(go, go); };
    var pr = el.querySelector("[data-print]"); if (pr) pr.onclick = function () { document.documentElement.classList.add("lc-print"); setTimeout(function () { window.print(); setTimeout(function () { document.documentElement.classList.remove("lc-print"); }, 500); }, 50); };
  }

  /* ================= côté élève ================= */
  function showStudent(l, v, prev) {
    css(); var o = document.getElementById("lc-st"); if (!o) { o = document.createElement("div"); o.id = "lc-st"; o.className = "lc-st"; document.body.appendChild(o); }
    o.dataset.lec = l ? l.id : ""; o.dataset.prev = prev ? "1" : ""; o.style.zIndex = prev ? "2147481400" : ""; var part = (v && v.part) || "", img = function (id) { var im = id && get(KI, id); return im ? '<img class="lc-img" src="' + im.d + '" alt="schéma">' : ""; };
    var say = window.speechSynthesis ? '<button type="button" class="say" title="Écouter la consigne" style="float:right;height:40px;min-width:44px;border-radius:12px;border:1.5px solid #E6E1D6;background:#fff;font-size:20px">🔊</button>' : "";
    var bk = function (key, title, inner) { return inner ? '<div class="bk' + (part === key ? " now" : "") + '" data-p="' + key + '">' + say + "<h3>" + title + (part === key ? '<span class="now-tag">maintenant</span>' : "") + "</h3>" + inner + "</div>" : ""; };
    var k = function (lab, t) { return t ? '<div class="k">' + lab + '</div><div class="lc-pre">' + esc(t) + "</div>" : ""; };
    var h = '<div class="hd"><b>📅 ' + esc(l ? titreL(l) : "Leçon") + '</b>' + (allSits(true).length ? '<button type="button" data-auto>🎯 En autonomie</button>' : "") + '<button type="button" data-x>✕ Fermer</button></div><div class="in">';
    var rcls = (v && v.cls) || (cur() && cur().nom) || (l && (l.prog || []).map(function (p) { return p.c; })[0]) || "", RR = l && rcls ? whoList(rcls) : [];
    if (RR.length) h += '<div class="bk who"><h3>👥 Qui utilise cette tablette ?</h3><div class="lc-who">' + RR.map(function (n, i) { return '<button type="button" data-who="' + i + '" aria-pressed="false">' + esc(n) + "</button>"; }).join("") + '</div><div style="font-size:15px;color:#6A6F78;margin-top:6px">Touche ton nom (plusieurs si vous êtes en groupe), puis note ton résultat à la fin de chaque situation.' + (prev ? " <b>Aperçu : rien n'est enregistré.</b>" : "") + "</div></div>";
    if (v && v.grp && v.grp.g && v.grp.g.length) { var Wg = rcls ? whoGet(rcls) : []; h += '<div class="bk"><h3>👥 Groupes du jour</h3>' + v.grp.g.map(function (g, i) { var me = g.some(function (n) { return Wg.indexOf(n) >= 0; }); return '<div style="padding:4px 8px;border-radius:10px;' + (me ? "background:" + COL + "22;font-weight:800" : "") + '">' + esc(gNom(v, i)) + " : " + esc(g.join(", ")) + (me ? " 👈" : "") + "</div>"; }).join("") + (v.grp.disp && v.grp.disp.length ? '<div style="font-size:15px;color:#6A6F78">🩹 Rôles : ' + esc(v.grp.disp.join(", ")) + "</div>" : "") + "</div>"; }
    if (v && v.roles && v.roles.who && Object.keys(v.roles.who).length) { var WR = rcls ? whoGet(rcls) : [], CAT = {}; rolesCat().forEach(function (t) { var r = roleSplit(t); CAT[r.n] = r.m; });
      h += '<div class="bk"><h3>🎭 Rôles du jour</h3>' + Object.keys(v.roles.who).map(function (n) { var me = WR.indexOf(n) >= 0, r = v.roles.who[n]; return '<div style="padding:4px 8px;border-radius:10px;' + (me ? "background:" + COL + "22;font-weight:800" : "") + '">' + (me ? "👉 " : "") + esc(n) + " : <b>" + esc(r) + "</b>" + (me && CAT[r] ? '<div style="font-weight:500">' + esc(CAT[r]) + "</div>" : "") + "</div>"; }).join("") + "</div>"; }
    if (v && v.rang && v.rang.g != null) h += '<div class="bk rang"><h3>🧹 Rangement aujourd\'hui : groupe ' + (v.rang.g + 1) + '</h3><div>' + esc((v.rang.noms || []).join(", ")) + "</div></div>";
    if (l) {
      h += (l.but || l.mat) ? '<div class="bk">' + k("But de la leçon", l.but) + k("Matériel", l.mat) + "</div>" : "";
      h += bk("ech", "🔥 Échauffement", (l.ech ? '<div class="lc-pre">' + esc(l.ech) + "</div>" : "") + img(l.echImg));
      (l.sits || []).forEach(function (s, i) { h += bk("s" + i, "🏃 Situation " + (i + 1) + (s.t ? " · " + esc(s.t) : ""), (s.cons ? '<div class="lc-pre">' + esc(s.cons) + "</div>" : "") + img(s.img) + k("✅ Je réussis si…", [s.crQ, s.crQl].filter(Boolean).join("\n")) + k("💡 Comment faire…", s.crR) + k("⬇ Plus facile", s.simp) + k("⬆ Plus difficile", s.comp) + (RR.length ? (indParse(s.ind) ? indRow(l.id + ":s" + i, indParse(s.ind)) : resRow(l.id + ":s" + i)) : "")); });
      h += bk("rem", "🏆 Remise en action", (l.rem ? '<div class="lc-pre">' + esc(l.rem) + "</div>" : "") + k("✅ Je réussis si…", l.remCr) + (RR.length && (l.rem || l.remCr) ? resRow(l.id + ":rem") : ""));
      if (RR.length) h += '<div class="bk today" data-today></div>';
    } else h += '<div class="bk">La leçon a commencé. Écoute les consignes de ton professeur.</div>';
    o.innerHTML = h + "</div>"; o.style.display = "block";
    o.querySelector("[data-x]").onclick = function () { try { speechSynthesis.cancel(); } catch (e) {} o.style.display = "none"; };
    var au = o.querySelector("[data-auto]"); if (au) au.onclick = function () { autoOpen(); };
    /* 🔊 lecture à voix haute par la tablette elle-même (aucune donnée envoyée) */
    o.querySelectorAll(".say").forEach(function (b) { b.onclick = function () { try { var S = window.speechSynthesis; if (S.speaking) { S.cancel(); return; }
      var cl = b.parentNode.cloneNode(true); cl.querySelectorAll(".res").forEach(function (z) { z.remove(); }); var t = (cl.innerText || cl.textContent).replace(/🔊/g, "").replace(/maintenant/g, "").replace(/[✅💡⬇⬆🔥🏃🏆]/g, ""), u = new SpeechSynthesisUtterance(t); u.lang = "fr-FR"; u.rate = 0.95;
      var v = S.getVoices().filter(function (x) { return /^fr/i.test(x.lang); })[0]; if (v) u.voice = v; S.speak(u); } catch (e) {} }; });
    if (l && RR.length) bindRes(o, l, rcls, prev);
    var n = o.querySelector(".bk.now"); if (n) n.scrollIntoView({ block: "center" });
  }
  var CHIP = null, TIM = null, SEEN = jget("eps.lcseen", {}), LASTPART = {}, FAST = 0;
  function seen(id) { return !!SEEN[id]; }
  function markSeen(id) { SEEN[id] = Date.now(); Object.keys(SEEN).forEach(function (k) { if (SEEN[k] < Date.now() - 2 * 864e5) delete SEEN[k]; }); jset("eps.lcseen", SEEN); }
  function showMsg(t) { css(); var o = document.createElement("div"); o.className = "lc-msg"; o.innerHTML = "<p>" + esc(t) + '</p><button type="button">OK</button>'; o.querySelector("button").onclick = function () { o.remove(); }; document.body.appendChild(o); bip(3); setTimeout(function () { if (o.parentNode) o.remove(); }, 45000); }
  function mine(list) { if (!VUE && !window.EPS_SIM) list = list.filter(function (x) { return !same(x.cls || x.c, "DÉMO (fictive)"); }); /* la leçon de la classe fictive ne s'ouvre jamais sur une tablette d'élèves */ var c = cur(); if (c) return list.filter(function (x) { return same(x.cls || x.c, c.nom); }); return list.length === 1 ? list : []; }
  function tickStudent() {
    var t = isT(); if (t) { if (CHIP) CHIP.style.display = "none"; if (TIM) TIM.style.display = "none"; var so = document.getElementById("lc-st"); if (so && !so.dataset.prev) so.style.display = "none"; return; }
    css(); var now = Date.now();
    if (!CHIP) { CHIP = document.createElement("button"); CHIP.type = "button"; CHIP.className = "lc-chip"; document.body.appendChild(CHIP); }
    if (!TIM) { TIM = document.createElement("div"); TIM.className = "lc-tim"; document.body.appendChild(TIM); }
    var V = mine(all(KV).filter(function (v) { return v.on && v.st > now - 4 * 3600e3; }))[0];
    var P = []; lecons().forEach(function (l) { if (l.statut === "brouillon") return; (l.prog || []).forEach(function (p) { if (p.at > now - 2 * 3600e3 && p.at < now + 14 * 3600e3) P.push({ c: p.c, at: p.at, l: l }); }); });
    P = mine(P).sort(function (a, b) { return Math.abs(a.at - now) - Math.abs(b.at - now); });
    var next = P.filter(function (p) { return p.at > now; }).sort(function (a, b) { return a.at - b.at; })[0], past = P.filter(function (p) { return p.at <= now; }).sort(function (a, b) { return b.at - a.at; })[0];
    var st = document.getElementById("lc-st"), stOpen = st && st.style.display !== "none";
    if (V) {
      var L = V.lec && get(KL, V.lec); if (L && L.statut === "brouillon") L = null;
      var key = "lv" + V.id + V.st; if (!seen(key)) { markSeen(key); showStudent(L, V); }
      else if (stOpen && (LASTPART[V.id] !== (V.part || "") + "|" + JSON.stringify(V.rang || "") + JSON.stringify(V.grp || ""))) showStudent(L, V);
      LASTPART[V.id] = (V.part || "") + "|" + JSON.stringify(V.rang || "") + JSON.stringify(V.grp || "");
      (V.msgs || []).forEach(function (m) { if (!seen(m.id)) { markSeen(m.id); if (m.at > now - 10 * 6e4) showMsg(m.t); } });
      CHIP.textContent = "📅 Leçon en cours"; CHIP.style.display = "block"; CHIP.onclick = function () { showStudent(L, V); };
      if (V.tim) { var left = V.tim.end - now; TIM.style.display = "block"; TIM.classList.toggle("end", left <= 0); TIM.innerHTML = (left > 0 ? "⏱ " + mmss(left).replace(/ min /, ":").replace(/ s$/, "").replace(/ h /, ":") : "⏰ Temps écoulé") + (V.tim.lab ? "<small>" + esc(V.tim.lab) + "</small>" : "");
        var tk = "tm" + V.id + V.tim.end; if (left <= 0 && left > -6e4 && !seen(tk)) { markSeen(tk); bip(5); } if (left < -3 * 6e4) TIM.style.display = "none"; }
      else TIM.style.display = "none";
      FAST = now + 6e4;
    } else {
      TIM.style.display = "none";
      if (past && past.at > now - 2 * 3600e3) { var pk = "pg" + past.l.id + past.at; if (!seen(pk)) { markSeen(pk); showStudent(past.l, null); bip(2); } CHIP.textContent = "📅 Leçon du jour"; CHIP.style.display = "block"; CHIP.onclick = function () { showStudent(past.l, null); }; }
      else if (next) { var d = next.at - now; CHIP.textContent = d < 3600e3 ? "⏳ Leçon dans " + mmss(d) : "📅 Prochaine leçon : " + new Date(next.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); CHIP.style.display = "block"; CHIP.onclick = null; }
      else CHIP.style.display = "none";
      if (next && next.at - now < 15 * 6e4) FAST = now + 6e4;
    }
    /* pendant une leçon (ou juste avant) : relevé rapide de la leçon en cours */
    if (FAST > now && window.EPSD && EPSD.syncOne && now - (tickStudent.last || 0) > 6000) { tickStudent.last = now; EPSD.syncOne(KV); }
  }

  /* ---------- démarrage ---------- */
  function boot() {
    if (!window.EPSD || !EPSD.store) return setTimeout(boot, 500);
    var redraw = function () { if (OV && OV.style.display !== "none" && !(document.activeElement && OV.contains(document.activeElement) && /TEXTAREA|INPUT/.test(document.activeElement.tagName))) draw(); };
    EPSD.store({ pre: "lc." + APP + "|", key: KL, onChange: redraw });
    EPSD.store({ pre: "li." + APP + "|", key: KI, onChange: redraw });
    EPSD.store({ pre: "ld." + APP + "|", key: KD, onChange: redraw });
    EPSD.store({ pre: "lv." + APP + "|", key: KV, onChange: function () { if (TAB === "live") redraw(); } });
    EPSD.store({ pre: "iq|", key: KQ, onChange: function () {} });
    EPSD.store({ pre: "le." + APP + "|", key: KE, onChange: function () { if (TAB === "eval") redraw(); } });
    EPSD.store({ pre: "lr." + APP + "|", key: KS, onChange: function () { if (TAB === "bil") redraw(); } });
    EPSD.store({ pre: "rg|", key: KR, onChange: function () { if (TAB === "live") redraw(); } });
    try { var SF = JSON.parse(localStorage.getItem("eps.sim.v1") || "null"); if (SF && SF.next && SF.next.app === APP && SF.next.act === "lesson") { SF.next = null; localStorage.setItem("eps.sim.v1", JSON.stringify(SF)); setTimeout(simulate, 1500); } } catch (e) {}
    setInterval(function () { try { tickStudent(); } catch (e) { console.warn(e); } }, 1000);
    setInterval(function () { if (OV && OV.style.display !== "none" && TAB === "live") { var tl = OV.querySelector("[data-tleft]"), v = live(LIVECLS); if (tl && v && v.tim) tl.textContent = v.tim.end > Date.now() ? "Reste " + mmss(v.tim.end - Date.now()) + (v.tim.lab ? " · " + v.tim.lab : "") : "⏰ Temps écoulé"; } }, 1000);
  }
  boot();
  setTimeout(function () { try { seedApp(); } catch (e) {} }, 2500);
  /* ================= 📅 Leçons du jour (onglet Évaluer de l'espace enseignant, demande du 27/11/2026) =================
     Les évaluations de leçon (📊 Évaluer la leçon : participation, sérieux, thème) et les résultats des situations notés par les élèves se
     retrouvent ICI, leçon par leçon, en CONSULTATION : rien ne se modifie d'un appui. Pour modifier toute l'évaluation d'un jour : double appui
     sur sa date (un seul accès pour la leçon, pas un bouton par ligne ; un appui simple rappelle le geste). La saisie reste celle de
     📊 Évaluer la leçon, ouverte sur ce jour. Note et degré du jour : même calcul que 📜 CCF → « 📅 Note de leçon » (note_jour_sit, note_seuils).
     📤 Exporter : fenêtre commune EPSR.pronote (copie d'une colonne, de tout, fichier .csv). */
  var EJ = { cls: "", shut: {}, tap: { d: "", t: 0, tm: 0 } };
  function ejData(cls) { var D = {};
    all(KE).filter(function (o) { return same(o.cls, cls) && o.day && o.el && typeof o.el === "object"; }).forEach(function (o) { (D[o.day] = D[o.day] || { res: {} }).le = o; });
    all(KS).filter(function (o) { return same(o.cls, cls) && o.day && o.ek; }).forEach(function (o) { var s = 0, n = 0, ok = 0; Object.keys(o.r || {}).forEach(function (q) { if (/@auto$/.test(q)) return; var v = o.r[q]; if (v === 0 || v === 1 || v === 2) { s += v; n += 2; if (v === 2) ok++; } }); if (n) (D[o.day] = D[o.day] || { res: {} }).res[o.ek] = { t: s / n, ok: ok, n: n / 2 }; });
    return D; }
  function ejCell(d, k) { var x = d.le && d.le.el && d.le.el[k], V = x ? ["p", "s", "t"].map(function (f) { return x[f]; }).filter(function (v) { return v != null && isFinite(+v); }).map(Number) : [], le = V.length ? V.reduce(function (a, b) { return a + b; }, 0) / (3 * V.length) : null, r = d.res[k] || null, t = r ? r.t : null;
    var a = Math.max(0, Math.min(100, noteCfg().jourSit)) / 100, sc = t != null && le != null ? a * t + (1 - a) * le : t != null ? t : le;
    return { x: x || {}, r: r, sc: sc, deg: sc == null ? null : degOf(sc), note: sc == null ? null : Math.round(sc * 80) / 4 }; }
  function ejFr(d, long) { return new Date(d + "T12:00").toLocaleDateString("fr-FR", long ? { weekday: "long", day: "numeric", month: "long" } : { day: "2-digit", month: "2-digit" }); }
  function ejEdit(cls, day, redraw) { LIVECLS = cls; LEC_DAY = day; ONCLOSE = function () { LEC_DAY = null; redraw(); }; open("eval"); }
  function ejExport(cls) { if (!(window.EPSR && EPSR.pronote)) { alert("Export indisponible : recharge la page."); return; }
    var D = ejData(cls), DS = Object.keys(D).sort(), R = roster(cls);
    var rows = R.map(function (n) { var k = ekey(n), C = DS.map(function (d) { return ejCell(D[d], k); }), ok = C.filter(function (c) { return c.sc != null; }), sp = String(n).split(" "), ini = /^[A-ZÀ-Ý' -]+$/, nom = sp.filter(function (w) { return ini.test(w) && w.length > 1; }).join(" "), pre = sp.filter(function (w) { return !(ini.test(w) && w.length > 1); }).join(" ");
      return { nom: nom || n, prenom: nom ? pre : "", st: "", v: C.map(function (c) { return c.note; }).concat([ok.length ? Math.round(ok.reduce(function (a, c) { return a + c.sc; }, 0) / ok.length * 80) / 4 : null]) }; });
    EPSR.pronote({ app: NOM, classe: cls, titre: NOM + " · leçons du jour", color: COL, cols: DS.map(function (d) { return { t: "Leçon du " + ejFr(d) + " /20" }; }).concat([{ t: "Moyenne des leçons /20" }]), rows: rows }); }
  function evalJour(el, o) { css(); o = o || {};
    var C = classes(); if (o.cls && C.some(function (c) { return same(c, o.cls); })) EJ.cls = o.cls; if (!EJ.cls || !C.some(function (c) { return same(c, EJ.cls); })) { var c0 = cur(); EJ.cls = (c0 && C.filter(function (c) { return same(c, c0.nom); })[0]) || C[0] || ""; }
    var cls = EJ.cls, redraw = function () { if (el.isConnected) evalJour(el, {}); };
    if (!cls) { el.innerHTML = '<h2>📅 Leçons du jour</h2><p class="mut">Aucune classe pour cette activité : importe une liste d\'élèves dans ⚙ Réglages.</p>'; return; }
    var D = ejData(cls), DS = Object.keys(D).sort().reverse(), R = roster(cls), CR = lecCrit(), DEG = ["#fbe3e3", "#fdf0d9", "#e1f0f9", "#def1e5"], tj = today(), fait = !!(D[tj] && D[tj].le && Object.keys(D[tj].le.el || {}).length);
    var pill = function (z) { return z == null || !LEV_L[z] ? '<span class="lc-mut" style="margin:0">—</span>' : '<span style="display:inline-block;border-radius:8px;padding:2px 8px;font:700 12.5px system-ui;color:#fff;background:' + LEV_C[z] + '">' + LEV_L[z] + "</span>"; };
    var h = '<div class="lc-row" style="margin:0 0 4px"><h2 style="flex:1;margin:0">📅 Leçons du jour</h2>' + (C.length > 1 ? '<select class="lc-sel" data-ejc aria-label="Classe" style="min-height:44px">' + C.map(function (c) { return "<option" + (same(c, cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>" : '<b>' + esc(cls) + "</b>") +
      (fait ? "" : '<button type="button" class="lc-b p" data-ejnew>📊 Évaluer la leçon d\'aujourd\'hui</button>') + (DS.length ? '<button type="button" class="lc-b" data-ejx>📤 Exporter</button>' : "") + "</div>" +
      '<p class="mut">' + (DS.length ? "Consultation. Double appui sur une date pour modifier la leçon." : "Aucune leçon évaluée pour cette classe : évalue la leçon du jour, ou laisse les élèves noter leurs situations pendant 📡 Leçon en cours.") + "</p>";
    h += DS.map(function (d, i) { var x = D[d], l = x.le && x.le.lec && get(KL, x.le.lec), th = (x.le && x.le.theme) || "", shut = EJ.shut[cls + "|" + d] != null ? EJ.shut[cls + "|" + d] : i > 0, hasR = Object.keys(x.res).length > 0;
      var rows = R.map(function (n) { return { n: n, c: ejCell(x, ekey(n)) }; }), ok = rows.filter(function (r) { return r.c.sc != null; }), moy = ok.length ? ok.reduce(function (a, r) { return a + r.c.sc; }, 0) / ok.length : null;
      var top = '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" data-ejd="' + d + '" title="Double appui pour modifier cette leçon" style="border:0;background:#F1EEE6;border-radius:10px;min-height:44px;padding:0 12px;font:800 16px system-ui;color:#14171C;cursor:pointer">' + esc(ejFr(d, true).replace(/^./, function (c) { return c.toUpperCase(); })) + "</button>" +
        '<span style="flex:1;min-width:120px;font-weight:700">' + esc(l ? titreL(l) : "") + (th ? ' <span class="lc-mut" style="margin:0;font-weight:500">' + (l ? "· " : "") + esc(th) + "</span>" : "") + "</span>" +
        '<span class="lc-mut" style="margin:0">' + ok.length + " / " + R.length + " élèves</span>" + (moy != null ? '<span class="lc-tag" style="background:' + DEG[degOf(moy)] + ';margin:0">D' + (degOf(moy) + 1) + '</span><b>' + n20(Math.round(moy * 80) / 4) + ' / 20</b>' : "") +
        '<button type="button" class="lc-b s" data-ejf="' + d + '" aria-expanded="' + !shut + '" aria-label="' + (shut ? "Déplier" : "Replier") + ' cette leçon" style="min-width:44px;min-height:44px">' + (shut ? "▸" : "▾") + "</button></div>";
      if (shut) return '<div class="lc-box">' + top + "</div>";
      var tab = '<div style="overflow:auto;margin-top:8px"><table class="lc-tab"><tr><th>Élève</th>' + (x.le ? CR.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") : "") + (hasR ? "<th>Situations réussies</th>" : "") + "<th>Note</th><th>Degré</th></tr>" +
        rows.map(function (r) { var c = r.c, ab = isAbs(cls, r.n, d);
          if (c.sc == null) return '<tr style="color:#6A6F78"><td>' + (ab ? "<s>" + esc(r.n) + "</s>" : esc(r.n)) + '</td><td colspan="' + ((x.le ? 3 : 0) + (hasR ? 1 : 0) + 2) + '">' + (ab ? "Absent(e) à l'appel" : "Pas évalué(e)") + "</td></tr>";
          return "<tr><td><b>" + esc(r.n) + "</b></td>" + (x.le ? ["p", "s", "t"].map(function (q) { return "<td>" + pill(c.x[q]) + "</td>"; }).join("") : "") + (hasR ? "<td>" + (c.r ? "✅ " + c.r.ok + " / " + c.r.n + ' <span class="lc-mut" style="margin:0">· ' + Math.round(c.r.t * 100) + " %</span>" : '<span class="lc-mut" style="margin:0">—</span>') + "</td>" : "") +
            "<td><b>" + n20(c.note) + '</b></td><td><span class="lc-tag" style="background:' + DEG[c.deg] + ';margin:0">D' + (c.deg + 1) + "</span></td></tr>"; }).join("") + "</table></div>";
      return '<div class="lc-box">' + top + (R.length ? tab : '<p class="lc-mut">Aucune liste d\'élèves pour cette classe.</p>') + "</div>"; }).join("");
    el.innerHTML = h;
    var q = function (x) { return el.querySelector(x); }, qa = function (x) { return [].slice.call(el.querySelectorAll(x)); };
    if (q("[data-ejc]")) q("[data-ejc]").onchange = function () { EJ.cls = this.value; redraw(); };
    if (q("[data-ejnew]")) q("[data-ejnew]").onclick = function () { ejEdit(cls, tj, redraw); };
    if (q("[data-ejx]")) q("[data-ejx]").onclick = function () { ejExport(cls); };
    qa("[data-ejf]").forEach(function (b) { b.onclick = function () { var k = cls + "|" + b.dataset.ejf; EJ.shut[k] = b.getAttribute("aria-expanded") === "true"; redraw(); }; });
    /* double appui sur la date = modifier toute la leçon (reconnu ici, car « dblclick » n'arrive pas sur toutes les tablettes) ; un appui seul rappelle le geste */
    qa("[data-ejd]").forEach(function (b) { b.onclick = function () { var T = EJ.tap, now = Date.now(), d = b.dataset.ejd; clearTimeout(T.tm);
      if (T.d === d && now - T.t < 450) { T.d = ""; ejEdit(cls, d, redraw); return; }
      T.d = d; T.t = now; T.tm = setTimeout(function () { T.d = ""; ejHint(b); }, 460); }; });
  }
  function ejHint(b) { var old = document.getElementById("lc-ejh"); if (old) old.remove(); if (!b.isConnected) return; var t = document.createElement("div"); t.id = "lc-ejh"; t.setAttribute("role", "status"); t.textContent = "Double appui pour modifier";
    var r = b.getBoundingClientRect(); t.style.cssText = "position:fixed;z-index:2147483000;left:" + Math.max(8, Math.round(r.left)) + "px;top:" + Math.round(r.bottom + 6) + "px;background:#14171C;color:#fff;border-radius:10px;padding:8px 12px;font:700 14px system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25)"; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 1800); }
  window.EPSLC = {
    /* onglet Évaluer (eps-shell.js) : 📅 Leçons du jour, et les actions de « 📤 Bilan et export » (génération du bilan et de l'appréciation : 🏫 Ma classe → 📝 Bilans & avis) */
    evalJour: function (el, o) { evalJour(el, o); },
    evalBilActions: function () { return [{ ico: "📝", label: "Bilan et appréciation", sub: "Avis de bilan ou appréciation de bulletin : toute la classe d'un coup, ou élève par élève, à relire et valider", main: 1, go: function () { clOpen({ tab: "bil", cls: (cur() && cur().nom) || undefined }); } }, { ico: "🏁", label: "Bilan de séquence", sub: "Résultats des situations, leçon par leçon", main: 1, go: function () { open("bil"); } }]; },
    seedApp: seedApp,
    fiche: function (id) { return get(KL, id); },
    /* leçon commune lancée pour cette classe (📡 Leçon en cours) : les écrans « pas encore de leçon » des applis renvoient vers elle au lieu de se contredire */
    liveFor: function (cls) { try { var v = cls && live(cls); if (!v || !v.on) return null; var l = v.lec ? get(KL, v.lec) : null; return { titre: l ? titreL(l) : "Leçon du jour", open: function () { showStudent(l, v); } }; } catch (e) { return null; } },
    open: open, close: close, app: APP, code: CODE, nextProg: function (c) { var p = nextProg(c); return p ? { at: p.at, titre: titreL(p.l), id: p.l.id } : null; }, count: function (c) { return lecons().filter(function (l) { return l.statut !== "brouillon" && forCls(l, c); }).length; },
    /* ord : place dans l'onglet Séquence (0 préparer, 1 actions propres de l'appli, 2 faire la leçon, 3 simuler) */
    /* un seul écran de suivi par activité (demande de l'enseignant) : l'appli qui a le sien (window.epsCtlOwn = {open(classe)}) le garde */
    /* l'écran commun lui-même (applis sans écran de suivi propre, tests, captures du guide) */
    pilotage: function (o) { ctlOpen(o); },
    /* ⚡ repères rapides sans passer par le pilotage commun (applis qui ont leur écran de suivi) : choix de l'élève, puis la palette */
    reperes: function (o) { css(); var cls = (o && o.cls) || (cur() && cur().nom) || edtClass() || classes()[0] || "", R = roster(cls).filter(function (n) { return !isAbs(cls, n); }), old = document.getElementById("lc-rep"); if (old) old.remove();
      var m = document.createElement("div"); m.id = "lc-rep"; m.style.cssText = "position:fixed;inset:0;z-index:2147483150;background:rgba(20,23,28,.55);display:flex;align-items:center;justify-content:center;padding:14px";
      m.innerHTML = '<div role="dialog" aria-modal="true" aria-label="Repères rapides" style="background:#fff;border-radius:16px;padding:16px 18px;max-width:640px;width:100%;max-height:90vh;overflow:auto"><h2 style="margin:0 0 4px;font:800 20px system-ui">⚡ Repères rapides · ' + esc(cls) + '</h2><p class="lc-mut" style="margin:0 0 10px">Touche un élève.</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">' + (R.map(function (n, i) { var ic = icoOf(cls, n, today()); return '<button type="button" data-r="' + i + '" style="min-height:48px;border-radius:12px;border:1.5px solid #E6E1D6;background:#FBFAF7;font:700 15px system-ui;padding:4px 8px;text-align:left">' + esc(n) + (ic.length ? " " + ic.map(function (x) { return esc(icoEmo(x.i)); }).join("") : "") + "</button>"; }).join("") || '<p class="lc-mut">Pas de liste d\'élèves pour cette classe.</p>') + '</div><div class="lc-row" style="margin-top:14px"><span style="flex:1"></span><button type="button" class="lc-b p" data-x>✕ Fermer</button></div></div>';
      m.querySelector("[data-x]").onclick = function () { m.remove(); }; m.addEventListener("click", function (e) { if (e.target === m) m.remove(); });
      m.querySelectorAll("[data-r]").forEach(function (b) { b.onclick = function () { var n = R[+b.dataset.r]; m.remove(); icoPop(cls, n, function () { EPSLC.reperes({ cls: cls }); }); }; }); document.body.appendChild(m); },
    /* 🎛 Commandes de « 📡 Leçon en cours » pour l'écran de suivi d'une appli (demande de l'enseignant, 27/11/2026, Relais : tout piloter depuis
       un seul onglet, sans aller-retour). state(classe) → {on, since, titre, part, tim, parts[[id, libellé]], fiches[{id, t}], msgs[]} ;
       start / stop / part / timer / timerStop / msg : les mêmes effets que les boutons de 📡 Leçon en cours (mêmes données, rien en double). */
    ctl: { state: function (cls) { var v = live(cls), on = !!(v && v.on), l = on && v.lec ? get(KL, v.lec) : null;
        return { on: on, since: on ? v.st : 0, titre: l ? titreL(l) : "", part: on ? v.part || "" : "", tim: on && v.tim && v.tim.end > Date.now() ? v.tim : null,
          parts: [["ech", "🔥 Échauffement"]].concat(((l && l.sits) || [{}, {}]).map(function (s, i) { return ["s" + i, "🏃 Situation " + (i + 1)]; })).concat([["rem", "🏆 Remise en action"], ["bilan", "💬 Bilan"]]),
          fiches: lecons().filter(function (x) { return x.statut !== "brouillon" && forCls(x, cls); }).map(function (x) { return { id: x.id, t: (x.seq ? x.seq + " · " : "") + titreL(x) }; }), msgs: qmsgs() }; },
      start: function (cls, lec) { startLive(cls, lec || ""); }, stop: function (cls) { liveSet(cls, function (x) { x.on = 0; x.tim = null; }); },
      part: function (cls, p) { liveSet(cls, function (x) { x.part = x.part === p ? "" : p; }); },
      timer: function (cls, min, lab) { liveSet(cls, function (x) { x.tim = { end: Date.now() + (+min) * 6e4, lab: lab || "" }; }); }, timerStop: function (cls) { liveSet(cls, function (x) { x.tim = null; }); },
      msg: function (cls, t) { var v = live(cls); if (v && v.on) sendMsg(cls, t); else if (window.EPSD && EPSD.signal) EPSD.signal(t); } },
    controle: function (o) { if (window.epsCtlOwn && typeof window.epsCtlOwn.open === "function") { try { window.epsCtlOwn.open((o && o.cls) || ""); return; } catch (e) {} } ctlOpen(o); },
    /* onglet 📜 CCF de l'espace enseignant (eps-shell.js) : choix de la classe (terminales en premier), puis 🏫 Ma classe → 📜 CCF */
    ccfPanel: function (el) { css(); var C = classes(), T = C.filter(isTerm), O = C.filter(function (c) { return !isTerm(c); });
      var card = function (c) { return '<button type="button" class="lc-b' + (isTerm(c) ? " p" : "") + '" data-cc="' + esc(c) + '" style="min-height:56px;font-size:16px">' + (isTerm(c) ? "🎓 " : "") + esc(c) + "</button>"; };
      el.innerHTML = '<h2>📜 CCF et notes</h2><p class="mut">Note de leçon, note de séquence, protocole CCF et tes modalités d\'évaluation, avec le degré.</p>' +
        (T.length ? '<h3>Terminales</h3><div class="lc-row">' + T.map(card).join("") + "</div>" : '<p class="mut">Aucune classe de terminale (nom commençant par T) : choisis une autre classe ci-dessous.</p>') +
        (O.length ? '<h3>Autres classes</h3><div class="lc-row">' + O.map(card).join("") + "</div>" : "");
      el.querySelectorAll("[data-cc]").forEach(function (b) { b.onclick = function () { clOpen({ cls: b.dataset.cc, tab: "proto" }); }; }); },
    evalActions: function () { /* 📋 Pronote : pas dans l'appli CCF, qui a son propre export dans la notation de chaque activité */ return [{ ico: "🧪", label: "Modalités d'évaluation", sub: "Crée tes propres épreuves : critères, types, poids, note automatique", main: 1, ord: -1, go: function () { modOpen({}); } }, { ico: "👥", label: "Coévaluation", sub: "Ta grille pour qu'un élève observe un camarade : critères, ouverture, résultats", main: 1, ord: -0.5, go: function () { if (window.EPSE && EPSE.coeval) EPSE.coeval.edit({ app: CODE, nom: NOM, color: COL, cls: (cur() && cur().nom) || "" }); else alert("Coévaluation indisponible sur cet écran : recharge la page."); } }, { ico: "📲", label: "Auto-positionnement", sub: "Sans QR : dans l'espace EPS des élèves, sur les tablettes de la leçon, ou par lien", main: 1, ord: -0.45, go: function () { if (window.EPSE && EPSE.autopos) EPSE.autopos({ app: CODE, nom: NOM, color: COL, cls: (cur() && cur().nom) || "" }); else alert("Auto-positionnement indisponible sur cet écran : recharge la page."); } }, { ico: "📋", label: "Pronote", sub: "Toutes les notes de la classe, prêtes à coller dans Pronote : une colonne par évaluation", main: 1, ord: -0.4, go: function () { if (window.EPSE && EPSE.pronote) EPSE.pronote({ app: CODE, color: COL, cls: (cur() && cur().nom) || "" }); else alert("Export Pronote indisponible sur cet écran : recharge la page."); } }].filter(function (x) { return !(APP === "ccf" && (x.label === "Pronote" || x.label === "Auto-positionnement")); }); },
    modalites: function (o) { modOpen(o); },
    /* onglet Bilans des applis : les bilans et avis (séquence, trimestre, bulletin) se font au même endroit, 🏫 Ma classe ; l'onglet de l'appli garde ses chiffres propres */
    bilActions: function () { return [{ ico: "📝", label: "Bilans & avis de la classe", main: 1, ord: -1, go: function () { clOpen({ tab: "bil" }); } }, { ico: "🏁", label: "Bilan de séquence (situations)", main: 1, ord: -0.5, go: function () { open("bil"); } }]; },
    actions: function () { return [{ ico: "📝", label: "Fiches de leçon", ord: 0, go: function () { open("lec"); } }, { ico: "✅", label: "Tout est prêt ?", ord: 0.5, go: function () { if (window.EPSD && EPSD.check) EPSD.check(); } }, { ico: "📡", label: "Leçon en cours", ord: 2, go: function () { open("live"); } }, { ico: "🥋", label: "Validations", sub: "Apprentissages validés par élève (comme les ceintures d'Acrosport)", ord: 2.7, go: function () { clOpen({ tab: "val" }); } }, { ico: "🧭", label: "Pilotage de leçon", sub: "Appels, élèves en échec, classe en direct", main: 1, ord: 2.1, go: function () { ctlOpen({}); } }, { ico: "⚡", label: "Repères rapides", sub: "Tenue, entraide, initiative…", ord: 2.15, go: function () { EPSLC.reperes({}); } }, { ico: "📊", label: "Évaluer la leçon", ord: 2.2, go: function () { open("eval"); } }, { ico: "🏁", label: "Bilan de séquence", ord: 2.4, go: function () { open("bil"); } }, { ico: "📂", label: "Mes documents", sub: "Ta séquence, tes fiches : Claude s'en sert en priorité", ord: 2.45, go: function () { open("docs"); } }, { ico: "🧩", label: "Niveaux & groupes", sub: "Classement par niveau, affinités, groupes", ord: 2.6, go: function () { grOpen(null, "rang"); } }, { ico: "🗺", label: "Plan de terrain", sub: "Groupes du jour posés sur tes installations, envoyés aux tablettes", ord: 2.65, go: function () { terrOpen(); } }, { ico: "🏫", label: "Ma classe : vue d'ensemble", sub: "Leçons, élèves, bilans et avis", ord: 2.5, go: function () { clOpen({}); } }, { ico: "🧪", label: "Leçon simulée", ord: 3, go: simulate }].filter(function (a) { return window.epsCtlOwn ? a.label !== "Pilotage de leçon" : a.label !== "Repères rapides"; })
        /* l'écran de suivi de l'appli porte déjà les commandes de la leçon en cours (epsCtlOwn.ctl, Relais) : pas de « Leçon en cours » en double dans Séquence */
        .filter(function (a) { return !(window.epsCtlOwn && window.epsCtlOwn.ctl && a.label === "Leçon en cours"); }); },
    /* « Plus » de l'écran de suivi d'une appli : ce que 📡 Leçon en cours a en plus (appel, matériel, groupes du jour, rôles, rangement), sans les commandes en double */
    plus: function (cls) { open("live", cls); LIVEMIN = true; drawLive(); },
    classe: function (o) { clOpen(o || {}); }, classData: function (c, P) { return classData(c, P); },
    banque: function (m) { bankOpen(m); }, autonomie: function () { autoOpen(); }, remCard: remCard, grids: grids, recAdd: recAdd, carte: carteHtml, sitNew: sitNew, refOpen: refOpen, print: function (id) { var l = get(KL, id); if (l) printOpen([l], titreL(l)); },
    biblio: function () { return [{ ico: "🏦", label: "Banque & apprentissages", sub: "Leçons gardées, situations par apprentissage (smash, service…), propositions aux élèves", go: function () { bankOpen(); } }, { ico: "📂", label: "Mes documents", sub: "Ta séquence, tes fiches : Claude s'en sert en priorité pour tes leçons", go: function () { open("docs"); } }, { ico: "📝", label: "Mes fiches de leçon", sub: "Fiches de leçon, brouillons de Claude à valider, programmation", go: function () { open("lec"); } }]; },
    _test: { KS: KS, bilanData: bilanData, lecons: lecons, put: put, all: all, KL: KL, KV: KV, KD: KD, KR: KR, fromAI: fromAI, startLive: startLive, sendMsg: sendMsg, extract: extract }
  };
})();
