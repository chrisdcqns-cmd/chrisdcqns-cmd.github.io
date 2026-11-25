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
  var APPS = { escalade: ["esc", "Escalade", "#2E7D4F"], relais: ["rel", "Relais Vitesse", "#D9481F"], volley: ["vol", "Volley-ball", "#6B3FA0"], badminton: ["bad", "Badminton", "#0B7A75"], danse: ["dan", "Danse", "#C2185B"], acrosport: ["acro", "Acrosport", "#1F4FA3"], orientation: ["ori", "OrienRun", "#E8701A"], ccf: ["ccf", "CCF", "#B8860B"], crosstraining: ["ct", "Cross-training", "#4D7C0F"] };
  var m = location.pathname.match(/\/(escalade|relais|volley|badminton|danse|acrosport|orientation|ccf|crosstraining)\//);
  if (!m) return;
  var APP = m[1], CODE = APPS[APP][0], NOM = APPS[APP][1], COL = APPS[APP][2];
  var BASE = ((document.currentScript && document.currentScript.src) || "").replace(/eps-lecons\.js.*$/, "");
  var KL = "eps.lecons." + APP + ".v1", KI = "eps.lcimg." + APP + ".v1", KD = "eps.lcdocs." + APP + ".v1", KV = "eps.live." + APP + ".v1", KR = "eps.rang.v1";
  var VUE = !!window.EPS_VUE_ELEVE;

  /* ---------- outils ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { alert("Mémoire de la tablette pleine : supprime des documents ou des schémas."); return false; } }
  function ld(k) { var v = jget(k, null); if (!v || !v.items) v = { items: {}, pend: {}, since: 0 }; v.pend = v.pend || {}; return v; }
  function all(k) { var V = ld(k); return Object.keys(V.items).map(function (i) { return V.items[i]; }).filter(function (o) { return o && !o.del; }); }
  function get(k, id) { var o = ld(k).items[id]; return o && !o.del ? o : null; }
  function put(k, it, fast) { var V = ld(k), old = V.items[it.id]; it.u = Math.max(Date.now(), ((old && old.u) || 0) + 1); V.items[it.id] = it; V.pend[it.id] = it.u; jset(k, V);
    if (window.EPSD) { if (fast && EPSD.syncOne) EPSD.syncOne(k); else if (EPSD.syncSoon) EPSD.syncSoon(); } }
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
  var SF = [["t", "Titre de la situation"], ["cons", "Consigne"], ["crQ", "Critères de réussite : quantitatifs"], ["crQl", "Critères de réussite : qualitatifs"], ["crR", "Critères de réalisation (ce qu'il y a à faire pour réussir)"], ["simp", "Variables : simplification"], ["comp", "Variables : complexification"]];
  var RF = [["rem", "Remise en action : consigne (match ou situation plus large)"], ["remCr", "Remise en action : critères de réussite"], ["bilan", "Bilan de la leçon"]];
  function blank(seq) { return { id: uid(), seq: seq || "", num: "", titre: "", duree: "", statut: "ok", ai: {}, sits: [{}, {}], prog: [] }; }
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
    o.sits = (l.sits || []).map(function (s) { var r = {}; SF.forEach(function (x) { if (s[x[0]]) r[x[0]] = s[x[0]]; }); return r; }); return o; }

  /* ---------- styles ---------- */
  function css() {
    if (document.getElementById("eplc-css")) return;
    var st = document.createElement("style"); st.id = "eplc-css";
    st.textContent = [
      ".lc-ov{position:fixed;inset:0;z-index:2147481200;background:#F5F3EE;color:#14171C;display:flex;flex-direction:column;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
      ".lc-top{display:flex;align-items:center;gap:8px;background:#14171C;color:#fff;padding:10px 14px;box-shadow:inset 0 -4px 0 " + COL + ";flex-wrap:wrap}",
      ".lc-top b{font-size:19px;margin-right:8px}.lc-top button{height:40px;border-radius:10px;border:1.5px solid #3A3F47;background:transparent;color:#D5D8DE;font:700 14px system-ui,sans-serif;padding:0 12px;cursor:pointer}",
      ".lc-top button.on{background:" + COL + ";border-color:" + COL + ";color:#fff}.lc-top .x{margin-left:auto}",
      ".lc-body{flex:1;overflow:auto;padding:16px 18px 80px}.lc-in{max-width:1000px;margin:0 auto}",
      ".lc-ov h2{font-size:22px;margin:4px 0}.lc-ov h3{font-size:17px;margin:18px 0 8px}.lc-mut{color:#6A6F78;font-size:14px;margin:2px 0 12px}",
      ".lc-b{height:42px;border-radius:12px;border:2px solid " + COL + ";background:#fff;color:#14171C;font:800 14px system-ui,sans-serif;padding:0 14px;cursor:pointer}.lc-b.p{background:" + COL + ";color:#fff}.lc-b:disabled{opacity:.45}",
      ".lc-b.s{height:34px;border-radius:10px;font-size:13px;padding:0 10px;border-width:1.5px}.lc-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}",
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
      ".lc-st .res button.on[data-rv='2']{background:#1E8449;border-color:#1E8449;color:#fff}.lc-st .res button.on[data-rv='1']{background:#E67E22;border-color:#E67E22;color:#fff}.lc-st .res button.on[data-rv='0']{background:#C0392B;border-color:#C0392B;color:#fff}",
      ".lc-st .lc-who{display:flex;gap:8px;flex-wrap:wrap}.lc-st .lc-who button.on{background:" + COL + ";border-color:" + COL + ";color:#fff}.lc-st .bk.who.need{border:3px solid #C0392B}.lc-st .bk.today{background:#F7FBFF}",
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
  function fromAI(base, r, keepEmpty) { /* r : leçon renvoyée par Claude ; les champs remplis sont marqués « ai » */
    var l = base || blank(); l.ai = l.ai || {};
    ["seq", "num", "titre", "duree"].concat(F.map(function (x) { return x[0]; })).concat(RF.map(function (x) { return x[0]; })).forEach(function (k) {
      var v = r[k]; if (v == null || v === "") return; v = String(v).trim(); if (!v) return;
      if (keepEmpty && l[k]) return; if (l[k] !== v) { l[k] = v; l.ai[k] = 1; } });
    var S = Array.isArray(r.sits) ? r.sits : []; l.sits = l.sits || [];
    S.forEach(function (s, i) { var t = l.sits[i] = l.sits[i] || {}; SF.forEach(function (x) { var v = s && s[x[0]]; if (v == null || v === "") return; v = String(v).trim(); if (!v || (keepEmpty && t[x[0]])) return; if (t[x[0]] !== v) { t[x[0]] = v; l.ai["s" + i + "." + x[0]] = 1; } }); });
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
      if (/\.docx$/.test(n)) return z.file("word/document.xml").async("string").then(function (x) { return xmlTxt(x.replace(/<\/w:p>\s*<\/w:tc>/g, " | ").replace(/<\/w:tr>/g, "\n"), /<\/w:p>/g).replace(/ \| *(\n|$)/g, "$1"); });
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
  function saveDoc(nom, txt, type) {
    var id = uid(), CH = 26000, n = Math.max(1, Math.ceil(txt.length / CH));
    for (var i = 0; i < n; i++) put(KD, { id: id + "." + i, doc: id, nom: nom, type: type || "", part: i, of: n, txt: txt.slice(i * CH, (i + 1) * CH), use: true, cr: Date.now() });
    return id;
  }
  function docList() { var D = {}; all(KD).forEach(function (p) { var d = D[p.doc] = D[p.doc] || { id: p.doc, nom: p.nom, type: p.type, n: 0, use: p.use !== false, cr: p.cr || 0, parts: [] }; d.n += (p.txt || "").length; d.parts.push(p); }); return Object.keys(D).map(function (k) { return D[k]; }).sort(function (a, b) { return b.cr - a.cr; }); }

  /* ================= espace enseignant ================= */
  var OV = null, TAB = "lec", EDIT = null, LIVECLS = null;
  function open(tab, arg) {
    css(); TAB = tab || "lec"; EDIT = null;
    if (tab === "edit") { TAB = "lec"; EDIT = arg; }
    if (tab === "live" && arg) LIVECLS = arg;
    if (!OV) { OV = document.createElement("div"); OV.className = "lc-ov"; document.body.appendChild(OV); }
    OV.style.display = "flex"; draw();
  }
  function close() { if (OV) { OV.style.display = "none"; OV.innerHTML = ""; } EDIT = null; }
  function shell(body) {
    OV.innerHTML = '<div class="lc-top"><b>📝 Fiches de leçon · ' + esc(NOM) + '</b>' +
      [["lec", "📝 Fiches de leçon"], ["docs", "📂 Mes documents"], ["live", "📡 Leçon en cours"], ["eval", "📊 Évaluer la leçon"], ["bil", "🏁 Bilan de séquence"]].map(function (t) { return '<button type="button" data-tab="' + t[0] + '"' + (TAB === t[0] ? ' class="on"' : "") + ">" + t[1] + "</button>"; }).join("") +
      '<button type="button" class="x" data-x>✕ Fermer</button></div><div class="lc-body"><div class="lc-in">' + body + "</div></div>";
    OV.querySelector("[data-x]").onclick = close;
    OV.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { saveEdit(); TAB = b.dataset.tab; EDIT = null; draw(); }; });
    return OV.querySelector(".lc-in");
  }
  function draw() { if (!OV || OV.style.display === "none") return; if (TAB === "docs") return drawDocs(); if (TAB === "live") return drawLive(); if (TAB === "eval") return drawLEval(); if (TAB === "bil") return drawBilan(); if (EDIT) return drawEdit(); drawList(); }


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
      '<div class="lc-row"><button type="button" class="lc-b p" data-new>＋ Nouvelle leçon</button><button type="button" class="lc-b" data-ai>✨ Proposer avec Claude</button><button type="button" class="lc-b" data-docs>📂 Mes documents (' + docList().length + ")</button>" + '<button type="button" class="lc-b" data-autoprog>📅 Programmer d\'après l\'emploi du temps</button>' +
      (nd ? '<button type="button" class="lc-b" data-imall>📥 Mettre en fiches mes documents (' + nd + ")</button>" : "") + "</div>" +
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
      h += "<h3>📚 Séquence de " + esc(SELC.join(" + ")) + " (" + A.length + " leçon" + (A.length > 1 ? "s" : "") + ")</h3>" + (A.length ? A.map(function (l, i) { return card(l, "L" + (i + 1)); }).join("") : '<div class="lc-box">Aucune leçon attribuée : touche « ＋ Attribuer » sur les leçons ci-dessous.</div>');
      if (O.length) h += "<h3>Autres leçons</h3>" + O.map(function (l) { return card(l); }).join("");
    } else S.forEach(function (s) {
      h += "<h3>📚 " + esc(s) + "</h3>";
      L.filter(function (l) { return (l.seq || "Sans séquence") === s; }).forEach(function (l) { h += card(l); });
    });
    var el = shell(h);
    var apb = el.querySelector("[data-autoprog]"); if (apb) apb.onclick = function () { autoProg(el.querySelector("[data-apbox]")); };
    el.querySelector("[data-new]").onclick = function () { var l = blank(S[S.length - 1] && S[S.length - 1] !== "Sans séquence" ? S[S.length - 1] : ""); l.cr = Date.now(); l.num = String(L.filter(function (x) { return x.seq === l.seq; }).length + 1); put(KL, l); EDIT = l.id; draw(); };
    el.querySelector("[data-ai]").onclick = function () { aiDialog(); };
    el.querySelector("[data-docs]").onclick = function () { TAB = "docs"; draw(); };
    el.querySelectorAll("[data-id]").forEach(function (c) { c.onclick = function () { EDIT = c.dataset.id; draw(); }; });
    el.querySelectorAll("[data-selc]").forEach(function (b) { b.onclick = function () { var c = b.dataset.selc; SELC = SELC.some(function (x) { return same(x, c); }) ? SELC.filter(function (x) { return !same(x, c); }) : SELC.concat([c]); draw(); }; });
    var s0 = el.querySelector("[data-selc0]"); if (s0) s0.onclick = function () { SELC = []; draw(); };
    el.querySelectorAll("[data-att]").forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); var l = get(KL, b.dataset.att); if (!l) return; var allIn = SELC.every(function (c) { return expl(l, c); });
      var autres = l.voie ? SELC.filter(function (c) { return vClasse(c) !== l.voie; }) : []; if (!allIn && autres.length && !confirm("Cette leçon est écrite pour la " + (l.voie === "pro" ? "voie professionnelle (AFLP)" : "voie générale (AFL)") + ", mais " + autres.join(", ") + (autres.length > 1 ? " sont" : " est") + " en " + (l.voie === "pro" ? "voie générale" : "voie professionnelle") + ". L'attribuer quand même ?")) return;
      setCls(l, SELC, !allIn); put(KL, l); var y = OV.querySelector(".lc-body").scrollTop; draw(); OV.querySelector(".lc-body").scrollTop = y; }; });
    var im = el.querySelector("[data-imall]"); if (im) im.onclick = importAll;
  }

  /* ---- éditeur ---- */
  var WORK = null, SAVE_T = null;
  function fld(k, lab, v, ai, attrs, input) { return '<label class="lc-f' + (ai ? " ai" : "") + '"><span>' + esc(lab) + "</span>" + (input ? '<input ' + attrs + ' value="' + esc(v || "") + '">' : "<textarea " + attrs + ">" + esc(v || "") + "</textarea>") + "</label>"; }
  function imgBox(kind, ref) { var im = ref && get(KI, ref); return '<div class="lc-row">' + (im ? '<img class="lc-img" src="' + im.d + '" alt="schéma">' : "") + '<label class="lc-b s" style="display:inline-flex;align-items:center">🖼 ' + (im ? "Changer" : "Ajouter") + ' le schéma<input type="file" accept="image/*" data-img="' + kind + '" hidden></label>' + (im ? '<button type="button" class="lc-b s" data-noimg="' + kind + '">✕ Retirer</button>' : "") + "</div>"; }
  function saveEdit() { if (WORK) { clearTimeout(SAVE_T); put(KL, WORK); } }
  function drawEdit() {
    var l = get(KL, EDIT); if (!l) { EDIT = null; return drawList(); }
    WORK = JSON.parse(JSON.stringify(l)); var A = WORK.ai || {}, br = WORK.statut === "brouillon";
    var h = '<div class="lc-row"><button type="button" class="lc-b s" data-back>← Mes fiches de leçon</button><span style="flex:1"></span>' + (br ? '<span class="lc-tag br">✨ brouillon : invisible pour les élèves</span>' : '<span class="lc-tag ok">✓ validée</span>') + "</div>" +
      (br ? '<div class="lc-warn">Relis et corrige les champs en jaune (proposés par Claude), puis « ✓ Valider ». Tant que la leçon n\'est pas validée, elle ne peut être ni programmée ni montrée aux élèves.' + (WORK.sources ? "<br><small>Sources indiquées par Claude : " + esc(WORK.sources) + "</small>" : "") + "</div>" : "") +
      '<div class="lc-box"><div class="lc-g3">' + fld("seq", "Séquence", WORK.seq, A.seq, 'data-f="seq" list="lc-seqs"', true) + fld("num", "N° de leçon", WORK.num, A.num, 'data-f="num"', true) + fld("duree", "Durée", WORK.duree, A.duree, 'data-f="duree" placeholder="ex. 1 h 45"', true) + "</div>" +
      fld("titre", "Titre", WORK.titre, A.titre, 'data-f="titre"', true) + '<label class="lc-f"><span>Voie</span><select class="lc-sel" data-voie style="width:100%"><option value="gt"' + (voieDe(WORK) === "gt" ? " selected" : "") + '>🎓 Générale et technologique (AFL)</option><option value="pro"' + (voieDe(WORK) === "pro" ? " selected" : "") + '>🛠 Professionnelle (AFLP)</option></select></label>' + '<datalist id="lc-seqs">' + seqs().map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + "</datalist></div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">🎯 Objectifs et but</h3><div class="lc-g3">' + F.slice(0, 3).map(function (x) { return fld(x[0], x[1], WORK[x[0]], A[x[0]], 'data-f="' + x[0] + '"'); }).join("") + "</div>" + fld("but", "But de la leçon", WORK.but, A.but, 'data-f="but"') + "</div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">🧰 Dispositif et matériel</h3>' + fld("disp", "Dispositif", WORK.disp, A.disp, 'data-f="disp"') + fld("mat", "Matériel", WORK.mat, A.mat, 'data-f="mat"') + "</div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">🔥 Échauffement</h3>' + fld("ech", "Consigne", WORK.ech, A.ech, 'data-f="ech"') + imgBox("ech", WORK.echImg) + "</div>" +
      (WORK.sits || []).map(function (s, i) { return '<div class="lc-box"><div class="lc-row" style="margin:0"><h3 style="margin:4px 0;flex:1">🏃 Situation ' + (i + 1) + "</h3>" + '<button type="button" class="lc-b s" data-rmsit="' + i + '">✕ Retirer</button></div>' + fld("t", SF[0][1], s.t, A["s" + i + ".t"], 'data-s="' + i + '" data-f="t"', true) + fld("cons", SF[1][1], s.cons, A["s" + i + ".cons"], 'data-s="' + i + '" data-f="cons"') + imgBox("s" + i, s.img) +
        '<div class="lc-g3">' + SF.slice(2, 4).map(function (x) { return fld(x[0], x[1], s[x[0]], A["s" + i + "." + x[0]], 'data-s="' + i + '" data-f="' + x[0] + '"'); }).join("") + "</div>" + fld("crR", SF[4][1], s.crR, A["s" + i + ".crR"], 'data-s="' + i + '" data-f="crR"') +
        '<div class="lc-g3">' + SF.slice(5).map(function (x) { return fld(x[0], x[1], s[x[0]], A["s" + i + "." + x[0]], 'data-s="' + i + '" data-f="' + x[0] + '"'); }).join("") + "</div></div>"; }).join("") +
      '<div class="lc-row"><button type="button" class="lc-b s" data-addsit>＋ Ajouter une situation</button></div>' +
      '<div class="lc-box"><h3 style="margin-top:4px">🏆 Remise en action et bilan</h3>' + RF.map(function (x) { return fld(x[0], x[1], WORK[x[0]], A[x[0]], 'data-f="' + x[0] + '"'); }).join("") + "</div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">👥 Classes concernées</h3><p class="lc-mut">La leçon fait partie de la séquence de ces classes (une classe qui a des leçons attribuées ne voit que les siennes).</p><div class="lc-row">' +
        classes().map(function (c) { var on = (WORK.cls || []).some(function (x) { return same(x, c); }); return '<button type="button" class="lc-b s' + (on ? " p" : "") + '" data-ecl="' + esc(c) + '">' + (on ? "✓ " : "") + esc(c) + "</button>"; }).join("") +
        ((WORK.cls || []).length ? '<button type="button" class="lc-b s" data-ecl0>Toutes les classes</button>' : "") + "</div></div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">📅 Programmer pour une classe</h3><p class="lc-mut">À l\'heure prévue, la leçon s\'ouvre toute seule sur les tablettes élèves de la classe (compte à rebours avant).</p>' +
      (br ? '<div class="lc-warn">Valide d\'abord la leçon pour pouvoir la programmer.</div>' : '<div class="lc-row"><select class="lc-sel" data-pc>' + classes().sort(function (a, b) { return forCls(WORK, b) - forCls(WORK, a); }).map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") + '</select><input type="datetime-local" class="lc-sel" data-pt><button type="button" class="lc-b s" data-padd>📅 Programmer</button><button type="button" class="lc-b s" data-launch>▶ Lancer maintenant…</button></div><div class="lc-row" data-slots></div>') +
      (WORK.prog || []).sort(function (a, b) { return a.at - b.at; }).map(function (p, i) { return '<div class="lc-row"><span class="lc-tag pg">📅 ' + esc(p.c) + " · " + esc(hm(p.at)) + (p.at < Date.now() ? " (passée)" : "") + '</span><button type="button" class="lc-b s" data-prm="' + p.at + "|" + esc(p.c) + '">✕</button></div>'; }).join("") + "</div>" +
      '<div class="lc-row"><button type="button" class="lc-b" data-fill>✨ Compléter les rubriques vides avec Claude</button>' + (br ? '<button type="button" class="lc-b p" data-ok>✓ Valider (relu et corrigé)</button>' : '<button type="button" class="lc-b" data-unok>Repasser en brouillon</button>') + '<button type="button" class="lc-b" data-dup>⧉ Dupliquer</button><button type="button" class="lc-b" data-see>👁 Voir comme un élève</button><span style="flex:1"></span><button type="button" class="lc-b" data-del style="border-color:#C0392B;color:#C0392B">🗑 Supprimer</button></div><p class="lc-mut" data-msg></p>';
    var el = shell(h), msg = el.querySelector("[data-msg]");
    function later() { clearTimeout(SAVE_T); SAVE_T = setTimeout(function () { put(KL, WORK); }, 700); }
    el.addEventListener("input", function (e) {
      var t = e.target, f = t.dataset.f; if (!f) return; var s = t.dataset.s;
      if (s != null) { WORK.sits[+s][f] = t.value; if (WORK.ai) delete WORK.ai["s" + s + "." + f]; } else { WORK[f] = t.value; if (WORK.ai) delete WORK.ai[f]; }
      var lab = t.closest(".lc-f"); if (lab) lab.classList.remove("ai"); later();
    });
    el.querySelector("[data-back]").onclick = function () { saveEdit(); EDIT = null; draw(); };
    el.querySelectorAll("[data-ecl]").forEach(function (b) { b.onclick = function () { saveEdit(); var c = b.dataset.ecl, on = (WORK.cls || []).some(function (x) { return same(x, c); });
      WORK.cls = on ? WORK.cls.filter(function (x) { return !same(x, c); }) : (WORK.cls || []).concat([c]); put(KL, WORK); draw(); }; });
    var e0 = el.querySelector("[data-ecl0]"); if (e0) e0.onclick = function () { saveEdit(); WORK.cls = []; put(KL, WORK); draw(); };
    el.querySelector("[data-addsit]").onclick = function () { saveEdit(); WORK.sits.push({}); put(KL, WORK); draw(); };
    el.querySelectorAll("[data-rmsit]").forEach(function (b) { b.onclick = function () { if (!confirm("Retirer la situation " + (+b.dataset.rmsit + 1) + " ?")) return; WORK.sits.splice(+b.dataset.rmsit, 1); WORK.ai = {}; put(KL, WORK); draw(); }; });
    el.querySelectorAll("[data-img]").forEach(function (inp) { inp.onchange = function () { var f = inp.files[0]; if (!f) return; var k = inp.dataset.img;
      (function go(max, q) { shrink(f, max, q).then(function (d) { if (d.length > 30000 && max > 240) return go(Math.round(max * 0.8), Math.max(0.35, q - 0.08)); var id = uid(); put(KI, { id: id, d: d }); if (k === "ech") WORK.echImg = id; else WORK.sits[+k.slice(1)].img = id; put(KL, WORK); draw(); }).catch(function (e) { msg.textContent = "⚠ " + e.message; }); })(620, 0.6); }; });
    el.querySelectorAll("[data-noimg]").forEach(function (b) { b.onclick = function () { var k = b.dataset.noimg; if (k === "ech") WORK.echImg = ""; else WORK.sits[+k.slice(1)].img = ""; put(KL, WORK); draw(); }; });
    var vs = el.querySelector("[data-voie]"); if (vs) vs.onchange = function () { WORK.voie = vs.value; saveEdit(); };
    var ok = el.querySelector("[data-ok]"); if (ok) ok.onclick = function () { WORK.statut = "ok"; WORK.ai = {}; WORK.val = Date.now(); put(KL, WORK); draw(); };
    var un = el.querySelector("[data-unok]"); if (un) un.onclick = function () { WORK.statut = "brouillon"; put(KL, WORK); draw(); };
    el.querySelector("[data-dup]").onclick = function () { saveEdit(); var c = JSON.parse(JSON.stringify(WORK)); c.id = uid(); c.cr = Date.now(); c.prog = []; c.titre = (c.titre || "") + " (copie)"; put(KL, c); EDIT = c.id; draw(); };
    el.querySelector("[data-del]").onclick = function () { if (!confirm("Supprimer cette leçon ?")) return; if (!confirm("Vraiment ? Elle disparaîtra sur toutes les tablettes.")) return; WORK = null; del(KL, EDIT); EDIT = null; draw(); };
    el.querySelector("[data-see]").onclick = function () { saveEdit(); showStudent(WORK, null, true); };
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
        .then(function (r) { var l = fromAI(get(KL, EDIT), r.lecon || {}, true); put(KL, l); draw(); }).catch(function (e) { msg.textContent = "⚠ " + e.message; b.disabled = false; }); };
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
        var nseq = seq + (mode === "simple" ? " (plus simple)" : mode === "difficile" ? " (plus difficile)" : " (variante)"), i = 0, done = 0;
        (function next() {
          if (i >= L.length) { msg.textContent = "✓ " + done + " leçon(s) en brouillon dans « " + nseq + " »."; setTimeout(function () { md.remove(); draw(); }, 900); return; }
          var src = L[i++]; msg.textContent = "Claude adapte la leçon " + i + " / " + L.length + "…";
          ask({ op: "lecon", mode: mode, act: NOM, consigne: cons, base: compact(src), docs: docsFor(), lecons: [] }).then(function (r) { var l = fromAI(blank(nseq), r.lecon || {}); l.voie = VOIE_ASK || voieDe(src); l.seq = nseq; l.num = src.num; l.cr = Date.now(); l.src = src.id; put(KL, l); done++; next(); })
            .catch(function (e) { msg.textContent = "⚠ " + e.message; b.disabled = false; });
        })();
        return;
      }
      msg.textContent = "Claude prépare la proposition…";
      ask({ op: "lecon", mode: mode, act: NOM, consigne: cons, docs: mode === "importer" ? docsFor(md.querySelector("[data-doc]").value) : docsFor(), lecons: (mode === "suivante" ? L : lecons()).slice(-12).map(compact) })
        .then(function (r) { var l = fromAI(blank(seq), r.lecon || {}); l.voie = VOIE_ASK || voieDe(null); if (!l.seq) l.seq = seq; if (mode === "suivante" && !l.num) l.num = String(L.length + 1); l.cr = Date.now(); put(KL, l); md.remove(); EDIT = l.id; draw(); })
        .catch(function (e) { msg.textContent = "⚠ " + e.message; b.disabled = false; });
    };
  }

  /* ---- 📥 tous les documents → fiches (brouillons, sans rien inventer) ---- */
  function importAll() {
    var D = docList().filter(function (d) { return d.use; }), md = document.createElement("div"), stop = false, made = 0;
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
      ask({ op: "lecon", mode: "inventaire", act: NOM, docs: docsFor(d.id) }).then(function (r) {
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
      M.map(function (x) { return '<div style="padding:3px 0">• ' + esc(x.t) + (x.q != null ? ' → <b style="font-size:17px">' + x.q + "</b>" : "") + "</div>"; }).join("") +
      (calc ? "" : '<p class="lc-mut">Astuce : écris dans ta fiche « 1 ballon pour 2 », « 1 chasuble par élève », « 1 plot par groupe » : les quantités se calculent avec les présents.</p>') + "</div>";
  }
  /* 👥 groupes du jour, avec les présents seulement (dispensés à part : rôles) */
  function niveau(cls, n) { var k = ekey(n), L = []; all(KE).forEach(function (o) { if (!same(o.cls, cls)) return; var x = (o.el || {})[k]; if (!x) return; ["p", "s", "t"].forEach(function (q) { if (x[q] != null) L.push(+x[q]); }); }); return L.length ? L.reduce(function (a, b) { return a + b; }, 0) / L.length : null; }
  function makeWork(cls, n, mode) {
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
  function startLive(cls, lec) { var v = live(cls) || { id: nn(cls) || uid() }; v.cls = cls; v.on = 1; v.st = Date.now(); v.lec = lec || ""; v.part = ""; v.msgs = []; v.tim = null; v.rang = null; v.grp = null; put(KV, v, true); }
  function liveSet(cls, f) { var v = live(cls); if (!v) return; f(v); put(KV, v, true); drawLive(); }
  function sendMsg(cls, txt) { liveSet(cls, function (v) { v.msgs = (v.msgs || []).filter(function (x) { return x.at > Date.now() - 15 * 6e4; }).concat([{ id: uid(), at: Date.now(), t: txt }]); }); }
  function rang(cls) { return all(KR).filter(function (r) { return same(r.cls, cls); })[0] || null; }
  function makeGroups(cls, n) { var R = roster(cls).slice(); for (var i = R.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = R[i]; R[i] = R[j]; R[j] = t; } var G = []; for (var k = 0; k < n; k++) G.push([]); R.forEach(function (x, i) { G[i % n].push(x); }); var r = rang(cls) || { id: nn(cls) || uid(), cls: cls, h: [] }; r.g = G; put(KR, r); }
  function proposal(r, cls) { if (!r || !r.g || !r.g.length) return -1; var last = r.g.map(function (_, i) { var t = 0; (r.h || []).forEach(function (x) { if (x.g === i) t = Math.max(t, x.at); }); return t; }); var ok = function (i) { return !cls || r.g[i].filter(function (n) { return !isAbs(cls, n); }).length >= 2; }, best = -1; last.forEach(function (t, i) { if (ok(i) && (best < 0 || t < last[best])) best = i; }); return best < 0 ? 0 : best; }
  function drawLive() {
    if (!OV || OV.style.display === "none" || TAB !== "live") return;
    var C = classes(); if (!LIVECLS) { var c0 = cur(); LIVECLS = (c0 && c0.nom) || all(KV).filter(function (v) { return v.on; }).map(function (v) { return v.cls; })[0] || C[0] || ""; }
    var cls = LIVECLS, v = live(cls), on = v && v.on, L = lecons().filter(function (l) { return l.statut !== "brouillon" && forCls(l, cls); }), lec = on && v.lec && get(KL, v.lec);
    var h = '<h2>📡 Leçon en cours</h2><p class="lc-mut">Cette tablette pilote les tablettes élèves de la classe : messages en grand avec un son, minuteur, étape en cours, rangement.</p>' +
      '<div class="lc-row"><b>Classe</b><select class="lc-sel" data-cls>' + C.map(function (c) { return "<option" + (same(c, cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>" + (on ? '<span class="lc-tag ok">● en cours depuis ' + Math.max(1, Math.round((Date.now() - v.st) / 6e4)) + " min</span>" : "") + "</div>";
    h += appelBox(cls, on);
    if (!on) h += '<div class="lc-box"><div class="lc-row"><b>Leçon</b><select class="lc-sel" data-lec><option value="">— sans fiche de leçon —</option>' + L.map(function (l) { return '<option value="' + l.id + '">' + esc((l.seq ? l.seq + " · " : "") + titreL(l)) + "</option>"; }).join("") + '</select><button type="button" class="lc-b p" data-start>▶ Démarrer la leçon</button></div><div data-matpre></div><p class="lc-mut">La fiche choisie s\'ouvre sur les tablettes élèves de la classe (seulement les leçons validées).</p></div>';
    else {
      var parts = [["", "—"], ["ech", "🔥 Échauffement"]].concat(((lec && lec.sits) || [{}, {}]).map(function (s, i) { return ["s" + i, "🏃 Situation " + (i + 1)]; })).concat([["rem", "🏆 Remise en action"], ["bilan", "💬 Bilan"]]);
      h += '<div class="lc-box"><b>' + (lec ? esc(titreL(lec)) : "Sans fiche de leçon") + '</b><div class="lc-row">' + parts.map(function (p) { return '<button type="button" class="lc-b s' + (v.part === p[0] ? " p" : "") + '" data-part="' + p[0] + '">' + p[1] + "</button>"; }).join("") + '</div><p class="lc-mut">Étape mise en avant sur les tablettes élèves.</p></div>' +
        matBox(cls, lec, (v.grp && v.grp.g && v.grp.g.length) || nGroupes(lec)) +
        '<div class="lc-box"><h3 style="margin-top:4px">👥 Groupes du jour</h3>' + (v.grp && v.grp.g && v.grp.g.length ? v.grp.g.map(function (g, i) { return '<div class="lc-row" style="align-items:flex-start;margin:4px 0"><b style="min-width:86px">Groupe ' + (i + 1) + '</b><span style="flex:1">' + esc(g.join(", ") || "—") + ' <small class="lc-mut">(' + g.length + ")</small></span></div>"; }).join("") +
          (v.grp.disp && v.grp.disp.length ? '<div class="lc-mut">🩹 Dispensés (rôles : observateur, arbitre, chrono…) : ' + esc(v.grp.disp.join(", ")) + "</div>" : "") + '<p class="lc-mut">Affichés sur les tablettes élèves. ' + ({ hasard: "Au hasard.", melange: "Niveaux mélangés (d'après tes évaluations de leçon).", niveau: "Groupes de niveau (d'après tes évaluations de leçon)." }[v.grp.mode] || "") + (v.grp.sans ? " Faute d'évaluation de leçon pour cette classe, ils ont été faits au hasard." : "") + "</p>"
          : '<p class="lc-mut">Formés avec les présents qui pratiquent (' + pratiquants(cls).length + ").</p>") +
        '<div class="lc-row"><select class="lc-sel" data-gn aria-label="Nombre de groupes">' + [2, 3, 4, 5, 6, 7, 8, 10, 12].map(function (n) { return '<option value="' + n + '"' + (n === ((v.grp && v.grp.g && v.grp.g.length) || nGroupes(lec) || 4) ? " selected" : "") + ">" + n + " groupes</option>"; }).join("") + '</select><select class="lc-sel" data-gm aria-label="Façon de former les groupes">' + [["hasard", "Au hasard"], ["melange", "Niveaux mélangés"], ["niveau", "Groupes de niveau"]].map(function (m) { return '<option value="' + m[0] + '"' + ((v.grp && v.grp.mode) === m[0] ? " selected" : "") + ">" + m[1] + "</option>"; }).join("") +
        '</select><button type="button" class="lc-b s p" data-gmk>' + (v.grp && v.grp.g ? "↻ Refaire" : "Former les groupes") + "</button>" + (v.grp && v.grp.g ? '<button type="button" class="lc-b s" data-ged>✏ Modifier</button><button type="button" class="lc-b s" data-gsay>📣 Annoncer</button><button type="button" class="lc-b s" data-gdel>Effacer</button>' : "") + "</div></div>" +
        '<div class="lc-box"><h3 style="margin-top:4px">📣 Message à toutes les tablettes</h3><div class="lc-row">' + ["Il vous reste 5 minutes", "Il vous reste 2 minutes", "Changement de situation", "Regroupement auprès du professeur", "Fin de la leçon : on range le matériel", "Arrêtez-vous et écoutez"].map(function (t) { return '<button type="button" class="lc-b s" data-q="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") +
        '</div><div class="lc-row"><input class="lc-sel" data-mt style="flex:1;min-width:220px" placeholder="Ton message…">' + ((window.SpeechRecognition || window.webkitSpeechRecognition) ? '<button type="button" class="lc-b s" data-dict>🎤</button>' : "") + '<button type="button" class="lc-b p" data-send>📣 Envoyer</button></div>' +
        (v.msgs || []).slice(-3).reverse().map(function (x) { return '<div class="lc-mut">' + new Date(x.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " · " + esc(x.t) + "</div>"; }).join("") + "</div>" +
        '<div class="lc-box"><h3 style="margin-top:4px">⏱ Minuteur</h3><div class="lc-row"><input class="lc-sel" data-tl placeholder="Intitulé (facultatif)" value="' + esc((v.tim && v.tim.lab) || "") + '">' + [1, 2, 3, 5, 8, 10, 15, 20].map(function (n) { return '<button type="button" class="lc-b s" data-tm="' + n + '">' + n + " min</button>"; }).join("") + (v.tim ? '<button type="button" class="lc-b s" data-tstop>⏹ Arrêter</button>' : "") + "</div>" + (v.tim ? '<div class="lc-mut" data-tleft></div>' : "") + "</div>";
      var R = rang(cls), pr = proposal(R, cls);
      h += '<div class="lc-box"><h3 style="margin-top:4px">🧹 Rangement</h3>' + (R && R.g && R.g.length ? R.g.map(function (g, i) { var lst = (R.h || []).filter(function (x) { return x.g === i; }).sort(function (a, b) { return b.at - a.at; })[0];
        return '<div class="lc-row" style="align-items:flex-start"><b style="min-width:86px">Groupe ' + (i + 1) + (i === pr ? " 👉" : "") + '</b><span style="flex:1">' + (g.map(function (n) { return isAbs(cls, n) ? '<s style="color:#6A6F78">' + esc(n) + "</s>" : esc(n); }).join(", ") || "—") + (g.length && g.filter(function (n) { return !isAbs(cls, n); }).length < 2 ? ' <b style="color:#C0392B">⚠ ' + g.filter(function (n) { return !isAbs(cls, n); }).length + " présent</b>" : "") + '<br><small class="lc-mut">' + (lst ? "a rangé le " + esc(hm(lst.at)) + " (" + esc(lst.app) + ")" : "n'a pas encore rangé") + '</small></span><button type="button" class="lc-b s' + (i === pr ? " p" : "") + '" data-rg="' + i + '">🧹 Range aujourd\'hui</button></div>'; }).join("") +
        '<p class="lc-mut">👉 = proposition (le groupe qui n\'a pas rangé depuis le plus longtemps, toutes activités confondues). ' + ((v.rang && v.rang.g != null) ? "Aujourd'hui : groupe " + (v.rang.g + 1) + "." : "") + "</p>" : '<p class="lc-mut">Pas encore de groupes de rangement pour cette classe.</p>') +
        '<div class="lc-row"><select class="lc-sel" data-ng>' + [2, 3, 4, 5, 6].map(function (n) { return "<option" + (n === ((R && R.g && R.g.length) || 4) ? " selected" : "") + ">" + n + "</option>"; }).join("") + '</select><button type="button" class="lc-b s" data-mk>' + (R && R.g ? "↻ Refaire les groupes" : "Former les groupes") + "</button>" + (R && R.g ? '<button type="button" class="lc-b s" data-edg>✏ Modifier</button>' : "") + "</div>" +
        ((R && R.h && R.h.length) ? '<details><summary class="lc-mut">Trace des rangements</summary>' + R.h.slice().sort(function (a, b) { return b.at - a.at; }).slice(0, 30).map(function (x) { return '<div class="lc-mut">' + esc(hm(x.at)) + " · groupe " + (x.g + 1) + " · " + esc(x.app) + "</div>"; }).join("") + "</details>" : "") + "</div>" +
        '<div class="lc-row">' + (window.EPST && EPST.openVue ? '<button type="button" class="lc-b p" data-vue>👁 Voir côté élève</button>' : "") + '<button type="button" class="lc-b" data-stop style="border-color:#C0392B;color:#C0392B">⏹ Terminer la leçon</button></div>';
    }
    var el = shell(h); foldBoxes(el);
    el.querySelector("[data-cls]").onchange = function () { LIVECLS = this.value; drawLive(); };
    bindAppel(el, cls, drawLive);
    var ls = el.querySelector("[data-lec]"), mp = el.querySelector("[data-matpre]"); if (ls && mp) { var pg = lecons().filter(function (l) { return l.statut !== "brouillon" && (l.prog || []).some(function (p) { return same(p.c, cls) && Math.abs(p.at - Date.now()) < 3 * 3600e3; }); })[0]; if (pg) ls.value = pg.id;
      var upm = function () { var l = ls.value && get(KL, ls.value); mp.innerHTML = matBox(cls, l, nGroupes(l)); }; ls.onchange = upm; upm(); }
    var st = el.querySelector("[data-start]"); if (st) st.onclick = function () { startLive(cls, el.querySelector("[data-lec]").value); drawLive(); };
    if (!on) return;
    var gm = el.querySelector("[data-gmk]"); if (gm) gm.onclick = function () { if (!pratiquants(cls).length) { alert("Aucun élève présent dans la liste de cette classe."); return; } var W = makeWork(cls, +el.querySelector("[data-gn]").value, el.querySelector("[data-gm]").value); liveSet(cls, function (x) { x.grp = W; }); };
    var gd = el.querySelector("[data-gdel]"); if (gd) gd.onclick = function () { liveSet(cls, function (x) { x.grp = null; }); };
    var gs = el.querySelector("[data-gsay]"); if (gs) gs.onclick = function () { sendMsg(cls, "👥 Groupes du jour\n" + v.grp.g.map(function (g, i) { return "Groupe " + (i + 1) + " : " + g.join(", "); }).join("\n")); };
    var ge = el.querySelector("[data-ged]"); if (ge) ge.onclick = function () { var md = document.createElement("div"); md.className = "lc-modal";
      md.innerHTML = '<div><h2>✏ Groupes du jour · ' + esc(cls) + '</h2><p class="lc-mut">Un groupe par cadre, noms séparés par des virgules.</p>' + v.grp.g.map(function (g, i) { return '<label class="lc-f"><span>Groupe ' + (i + 1) + '</span><textarea data-g="' + i + '">' + esc(g.join(", ")) + "</textarea></label>"; }).join("") + '<div class="lc-row"><button type="button" class="lc-b p" data-ok>Enregistrer</button><button type="button" class="lc-b" data-c>Annuler</button></div></div>';
      document.body.appendChild(md); md.querySelector("[data-c]").onclick = function () { md.remove(); };
      md.querySelector("[data-ok]").onclick = function () { var G = v.grp.g.map(function (_, i) { return md.querySelector('[data-g="' + i + '"]').value.split(",").map(function (s) { return s.trim(); }).filter(Boolean); }); md.remove(); liveSet(cls, function (x) { x.grp = Object.assign({}, x.grp, { g: G }); }); }; };
    el.querySelectorAll("[data-part]").forEach(function (b) { b.onclick = function () { liveSet(cls, function (x) { x.part = b.dataset.part; }); }; });
    el.querySelectorAll("[data-q]").forEach(function (b) { b.onclick = function () { sendMsg(cls, b.dataset.q); }; });
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
    var v = live(cls), lec = (v && v.lec && get(KL, v.lec)) || lecons().filter(function (l) { return (l.prog || []).some(function (p) { return same(p.c, cls) && new Date(p.at).toISOString().slice(0, 10) === day; }); })[0] || null;
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
  function sitList(l) { var S = (l.sits || []).map(function (s, i) { return { k: l.id + ":s" + i, t: "Situation " + (i + 1) + (s.t ? " · " + s.t : ""), crR: s.crR || "", simp: s.simp || "" }; });
    if (l.rem || l.remCr) S.push({ k: l.id + ":rem", t: "Remise en action", crR: "", simp: "" }); return S; }
  function resId(cls, day, k) { return nn(cls) + "|" + day + "|" + k; }
  var PREVRES = {};
  function resGet(cls, nom, sk, prev) { if (prev) return PREVRES[nom + "|" + sk]; var o = get(KS, resId(cls, today(), ekey(nom))); return o && o.r ? o.r[sk] : undefined; }
  function resSet(cls, nom, sk, v, prev) { if (prev) { if (v == null) delete PREVRES[nom + "|" + sk]; else PREVRES[nom + "|" + sk] = v; return; }
    var k = ekey(nom), id = resId(cls, today(), k), o = get(KS, id) || { id: id, cls: cls, day: today(), ek: k, r: {} }; o.r = o.r || {}; if (v == null) delete o.r[sk]; else o.r[sk] = v; put(KS, o); }
  function whoList(cls) { return roster(cls).filter(function (n) { return !isAbs(cls, n); }); }
  function whoGet(cls) { try { var w = JSON.parse(sessionStorage.getItem("eps.lcwho." + APP) || "null"); return w && same(w.cls, cls) ? w.n || [] : []; } catch (e) { return []; } }
  function whoSet(cls, n) { try { sessionStorage.setItem("eps.lcwho." + APP, JSON.stringify({ cls: cls, n: n })); } catch (e) {} }
  function resRow(sk) { return '<div class="res" data-sk="' + esc(sk) + '"><span>Mon résultat :</span>' + [2, 1, 0].map(function (v) { return '<button type="button" data-rv="' + v + '">' + RES_I[v] + " " + RES_L[v] + "</button>"; }).join("") + "</div>"; }
  function bindRes(o, l, cls, prev) {
    var R = cls ? whoList(cls) : [], SL = sitList(l);
    function upd() { var W = whoGet(cls);
      o.querySelectorAll(".lc-who button").forEach(function (b) { var on = W.indexOf(R[+b.dataset.who]) >= 0; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      o.querySelectorAll(".res").forEach(function (r) { var vals = W.map(function (n) { return resGet(cls, n, r.dataset.sk, prev); }), v = vals.length && vals.every(function (x) { return x === vals[0]; }) ? vals[0] : undefined;
        r.querySelectorAll("[data-rv]").forEach(function (b) { var on = v != null && +b.dataset.rv === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); }); });
      var t = o.querySelector("[data-today]"); if (!t) return;
      if (!W.length) { t.innerHTML = "<h3>📈 Mon bilan du jour</h3><div>Touche ton nom en haut, puis note ton résultat à la fin de chaque situation.</div>"; return; }
      var h = "<h3>📈 Mon bilan du jour</h3>", worst = null;
      W.forEach(function (n) { var c = [0, 0, 0], nb = 0; SL.forEach(function (s) { var v = resGet(cls, n, s.k, prev); if (v != null) { c[v]++; nb++; if (v < 2 && (!worst || v < worst.v)) worst = { s: s, v: v }; } });
        h += "<div><b>" + esc(n.split(" ")[0]) + "</b> : " + (nb ? "✅ " + c[2] + " réussie" + (c[2] > 1 ? "s" : "") + " · 🟠 " + c[1] + " en partie · ❌ " + c[0] + " pas encore (" + nb + "/" + SL.length + " situations notées)" : "rien de noté pour l'instant") + "</div>"; });
      if (worst) h += '<div style="margin-top:8px;padding:10px 12px;background:#FFF6E0;border-radius:12px">🎯 <b>Pour la prochaine fois</b> : retravaille « ' + esc(worst.s.t) + " »." + (worst.s.crR ? "<br>💡 " + esc(worst.s.crR) : "") + (worst.v === 0 && worst.s.simp ? "<br>⬇ Pour commencer : " + esc(worst.s.simp) : "") + "</div>";
      else if (SL.some(function (s) { return W.some(function (n) { return resGet(cls, n, s.k, prev) != null; }); })) h += '<div style="margin-top:8px;padding:10px 12px;background:#E3F4E8;border-radius:12px">👏 Tout est réussi ! La prochaine fois, essaie la variante « plus difficile ».</div>';
      t.innerHTML = h; }
    o.querySelectorAll(".lc-who button").forEach(function (b) { b.onclick = function () { var W = whoGet(cls), n = R[+b.dataset.who], i = W.indexOf(n); if (i >= 0) W.splice(i, 1); else W.push(n); whoSet(cls, W); upd(); }; });
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
      return { n: n, done: done.length, taux: done.length ? pts / done.length : null, le: LE.length ? Math.round(LE.reduce(function (a, b) { return a + b; }, 0) / LE.length / 3 * 20 * 4) / 4 : null, nle: LE.length,
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
      (B ? '<button type="button" class="lc-b s" data-copy>📋 Copier le bilan</button><button type="button" class="lc-b s" data-print>🖨 Imprimer</button>' : "") + "</div>";
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
        '<p class="lc-mut">Résultats déclarés par les élèves (dernier résultat noté pour chaque situation). Ce bilan reste sur tes tablettes ; il n\'est pas montré aux élèves.</p>';
    }
    var el = shell(h);
    el.querySelector("[data-cls]").onchange = function () { LIVECLS = this.value; BSEQ = null; drawBilan(); };
    var sq = el.querySelector("[data-seq]"); if (sq) sq.onchange = function () { BSEQ = this.value; drawBilan(); };
    var cp = el.querySelector("[data-copy]"); if (cp) cp.onclick = function () { var t = bilanTexte(cls, seq, B); try { navigator.clipboard.writeText(t).then(function () { cp.textContent = "✓ Copié"; }, function () { prompt("Copie ce bilan :", t); }); } catch (e) { prompt("Copie ce bilan :", t); } };
    var pr = el.querySelector("[data-print]"); if (pr) pr.onclick = function () { document.documentElement.classList.add("lc-print"); setTimeout(function () { window.print(); setTimeout(function () { document.documentElement.classList.remove("lc-print"); }, 500); }, 50); };
  }

  /* ================= côté élève ================= */
  function showStudent(l, v, prev) {
    css(); var o = document.getElementById("lc-st"); if (!o) { o = document.createElement("div"); o.id = "lc-st"; o.className = "lc-st"; document.body.appendChild(o); }
    o.dataset.lec = l ? l.id : ""; o.dataset.prev = prev ? "1" : ""; o.style.zIndex = prev ? "2147481400" : ""; var part = (v && v.part) || "", img = function (id) { var im = id && get(KI, id); return im ? '<img class="lc-img" src="' + im.d + '" alt="schéma">' : ""; };
    var say = window.speechSynthesis ? '<button type="button" class="say" title="Écouter la consigne" style="float:right;height:40px;min-width:44px;border-radius:12px;border:1.5px solid #E6E1D6;background:#fff;font-size:20px">🔊</button>' : "";
    var bk = function (key, title, inner) { return inner ? '<div class="bk' + (part === key ? " now" : "") + '" data-p="' + key + '">' + say + "<h3>" + title + (part === key ? '<span class="now-tag">maintenant</span>' : "") + "</h3>" + inner + "</div>" : ""; };
    var k = function (lab, t) { return t ? '<div class="k">' + lab + '</div><div class="lc-pre">' + esc(t) + "</div>" : ""; };
    var h = '<div class="hd"><b>📅 ' + esc(l ? titreL(l) : "Leçon") + '</b><button type="button" data-x>✕ Fermer</button></div><div class="in">';
    var rcls = (v && v.cls) || (cur() && cur().nom) || (l && (l.prog || []).map(function (p) { return p.c; })[0]) || "", RR = l && rcls ? whoList(rcls) : [];
    if (RR.length) h += '<div class="bk who"><h3>👥 Qui utilise cette tablette ?</h3><div class="lc-who">' + RR.map(function (n, i) { return '<button type="button" data-who="' + i + '" aria-pressed="false">' + esc(n) + "</button>"; }).join("") + '</div><div style="font-size:15px;color:#6A6F78;margin-top:6px">Touche ton nom (plusieurs si vous êtes en groupe), puis note ton résultat à la fin de chaque situation.' + (prev ? " <b>Aperçu : rien n'est enregistré.</b>" : "") + "</div></div>";
    if (v && v.grp && v.grp.g && v.grp.g.length) { var Wg = rcls ? whoGet(rcls) : []; h += '<div class="bk"><h3>👥 Groupes du jour</h3>' + v.grp.g.map(function (g, i) { var me = g.some(function (n) { return Wg.indexOf(n) >= 0; }); return '<div style="padding:4px 8px;border-radius:10px;' + (me ? "background:" + COL + "22;font-weight:800" : "") + '">Groupe ' + (i + 1) + " : " + esc(g.join(", ")) + (me ? " 👈" : "") + "</div>"; }).join("") + (v.grp.disp && v.grp.disp.length ? '<div style="font-size:15px;color:#6A6F78">🩹 Rôles : ' + esc(v.grp.disp.join(", ")) + "</div>" : "") + "</div>"; }
    if (v && v.rang && v.rang.g != null) h += '<div class="bk rang"><h3>🧹 Rangement aujourd\'hui : groupe ' + (v.rang.g + 1) + '</h3><div>' + esc((v.rang.noms || []).join(", ")) + "</div></div>";
    if (l) {
      h += (l.but || l.mat) ? '<div class="bk">' + k("But de la leçon", l.but) + k("Matériel", l.mat) + "</div>" : "";
      h += bk("ech", "🔥 Échauffement", (l.ech ? '<div class="lc-pre">' + esc(l.ech) + "</div>" : "") + img(l.echImg));
      (l.sits || []).forEach(function (s, i) { h += bk("s" + i, "🏃 Situation " + (i + 1) + (s.t ? " · " + esc(s.t) : ""), (s.cons ? '<div class="lc-pre">' + esc(s.cons) + "</div>" : "") + img(s.img) + k("✅ Je réussis si…", [s.crQ, s.crQl].filter(Boolean).join("\n")) + k("💡 Pour réussir…", s.crR) + k("⬇ Plus facile", s.simp) + k("⬆ Plus difficile", s.comp) + (RR.length ? resRow(l.id + ":s" + i) : "")); });
      h += bk("rem", "🏆 Remise en action", (l.rem ? '<div class="lc-pre">' + esc(l.rem) + "</div>" : "") + k("✅ Je réussis si…", l.remCr) + (RR.length && (l.rem || l.remCr) ? resRow(l.id + ":rem") : ""));
      if (RR.length) h += '<div class="bk today" data-today></div>';
    } else h += '<div class="bk">La leçon a commencé. Écoute les consignes de ton professeur.</div>';
    o.innerHTML = h + "</div>"; o.style.display = "block";
    o.querySelector("[data-x]").onclick = function () { try { speechSynthesis.cancel(); } catch (e) {} o.style.display = "none"; };
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
  function mine(list) { var c = cur(); if (c) return list.filter(function (x) { return same(x.cls || x.c, c.nom); }); return list.length === 1 ? list : []; }
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
    EPSD.store({ pre: "le." + APP + "|", key: KE, onChange: function () { if (TAB === "eval") redraw(); } });
    EPSD.store({ pre: "lr." + APP + "|", key: KS, onChange: function () { if (TAB === "bil") redraw(); } });
    EPSD.store({ pre: "rg|", key: KR, onChange: function () { if (TAB === "live") redraw(); } });
    try { var SF = JSON.parse(localStorage.getItem("eps.sim.v1") || "null"); if (SF && SF.next && SF.next.app === APP && SF.next.act === "lesson") { SF.next = null; localStorage.setItem("eps.sim.v1", JSON.stringify(SF)); setTimeout(simulate, 1500); } } catch (e) {}
    setInterval(function () { try { tickStudent(); } catch (e) { console.warn(e); } }, 1000);
    setInterval(function () { if (OV && OV.style.display !== "none" && TAB === "live") { var tl = OV.querySelector("[data-tleft]"), v = live(LIVECLS); if (tl && v && v.tim) tl.textContent = v.tim.end > Date.now() ? "Reste " + mmss(v.tim.end - Date.now()) + (v.tim.lab ? " · " + v.tim.lab : "") : "⏰ Temps écoulé"; } }, 1000);
  }
  boot();
  window.EPSLC = {
    open: open, close: close, app: APP, code: CODE, nextProg: function (c) { var p = nextProg(c); return p ? { at: p.at, titre: titreL(p.l), id: p.l.id } : null; }, count: function (c) { return lecons().filter(function (l) { return l.statut !== "brouillon" && forCls(l, c); }).length; },
    /* ord : place dans l'onglet Séquence (0 préparer, 1 actions propres de l'appli, 2 faire la leçon, 3 simuler) */
    actions: function () { return [{ ico: "📝", label: "Fiches de leçon", ord: 0, go: function () { open("lec"); } }, { ico: "✅", label: "Tout est prêt ?", ord: 0.5, go: function () { if (window.EPSD && EPSD.check) EPSD.check(); } }, { ico: "📡", label: "Leçon en cours", ord: 2, go: function () { open("live"); } }, { ico: "📊", label: "Évaluer la leçon", ord: 2.2, go: function () { open("eval"); } }, { ico: "🏁", label: "Bilan de séquence", ord: 2.4, go: function () { open("bil"); } }, { ico: "🧪", label: "Leçon simulée", ord: 3, go: simulate }]; },
    biblio: function () { return [{ ico: "📂", label: "Mes documents", sub: "Ta séquence, tes fiches : Claude s'en sert en priorité pour tes leçons", go: function () { open("docs"); } }, { ico: "📝", label: "Mes fiches de leçon", sub: "Fiches de leçon, brouillons de Claude à valider, programmation", go: function () { open("lec"); } }]; },
    _test: { KS: KS, bilanData: bilanData, lecons: lecons, put: put, all: all, KL: KL, KV: KV, KD: KD, KR: KR, fromAI: fromAI, startLive: startLive, sendMsg: sendMsg, extract: extract }
  };
})();
