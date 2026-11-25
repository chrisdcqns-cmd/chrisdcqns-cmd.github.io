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
   eps.live.<appli>.v1 (leçon en cours), eps.rang.v1 (groupes de rangement, communs à toutes les applis). */
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
      "@media print{.lc-ov .lc-top,.lc-b{display:none!important}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* ---------- son ---------- */
  var AC = null;
  document.addEventListener("pointerdown", function () { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) {} }, true);
  function bip(n) { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); var t = AC.currentTime; for (var i = 0; i < (n || 3); i++) { var o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = i % 2 ? 660 : 880; o.connect(g); g.connect(AC.destination); g.gain.setValueAtTime(0.0001, t + i * 0.35); g.gain.exponentialRampToValueAtTime(0.5, t + i * 0.35 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.35 + 0.3); o.start(t + i * 0.35); o.stop(t + i * 0.35 + 0.32); } } catch (e) {} try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) {} }

  /* ---------- Claude (script commun) ---------- */
  function ask(lc) {
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
      [["lec", "📝 Fiches de leçon"], ["docs", "📂 Mes documents"], ["live", "📡 Leçon en cours"]].map(function (t) { return '<button type="button" data-tab="' + t[0] + '"' + (TAB === t[0] ? ' class="on"' : "") + ">" + t[1] + "</button>"; }).join("") +
      '<button type="button" class="x" data-x>✕ Fermer</button></div><div class="lc-body"><div class="lc-in">' + body + "</div></div>";
    OV.querySelector("[data-x]").onclick = close;
    OV.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { saveEdit(); TAB = b.dataset.tab; EDIT = null; draw(); }; });
    return OV.querySelector(".lc-in");
  }
  function draw() { if (!OV || OV.style.display === "none") return; if (TAB === "docs") return drawDocs(); if (TAB === "live") return drawLive(); if (EDIT) return drawEdit(); drawList(); }

  /* ---- liste des leçons ---- */
  function drawList() {
    var L = lecons(), S = seqs(), br = L.filter(function (l) { return l.statut === "brouillon"; }).length;
    var h = '<h2>Mes fiches de leçon</h2><p class="lc-mut">Fiches de leçon de ' + esc(NOM) + ". Les élèves ne voient que les leçons validées ✓, programmées ou lancées.</p>" +
      '<div class="lc-row"><button type="button" class="lc-b p" data-new>＋ Nouvelle leçon</button><button type="button" class="lc-b" data-ai>✨ Proposer avec Claude</button><button type="button" class="lc-b" data-docs>📂 Mes documents (' + docList().length + ")</button></div>" +
      (br ? '<div class="lc-warn">✨ ' + br + " brouillon" + (br > 1 ? "s" : "") + " de Claude à relire : invisible" + (br > 1 ? "s" : "") + " pour les élèves tant que tu n'as pas validé.</div>" : "");
    if (!L.length) h += '<div class="lc-box">Aucune leçon pour l\'instant. Crée-en une, ou dépose tes documents (séquence, fiches de leçon) puis demande à Claude de les mettre en forme.</div>';
    S.forEach(function (s) {
      h += "<h3>📚 " + esc(s) + "</h3>";
      L.filter(function (l) { return (l.seq || "Sans séquence") === s; }).forEach(function (l) {
        var pg = (l.prog || []).filter(function (p) { return p.at > Date.now() - 3 * 3600e3; }).sort(function (a, b) { return a.at - b.at; })[0];
        h += '<div class="lc-card" data-id="' + l.id + '"><div class="t"><b>' + esc(titreL(l)) + (l.statut === "brouillon" ? '<span class="lc-tag br">✨ brouillon à relire</span>' : '<span class="lc-tag ok">✓ validée</span>') + (pg ? '<span class="lc-tag pg">📅 ' + esc(pg.c) + " · " + esc(hm(pg.at)) + "</span>" : "") + "</b><small>" + esc(l.but || l.objM || "") + "</small></div><span>›</span></div>";
      });
    });
    var el = shell(h);
    el.querySelector("[data-new]").onclick = function () { var l = blank(S[S.length - 1] && S[S.length - 1] !== "Sans séquence" ? S[S.length - 1] : ""); l.cr = Date.now(); l.num = String(L.filter(function (x) { return x.seq === l.seq; }).length + 1); put(KL, l); EDIT = l.id; draw(); };
    el.querySelector("[data-ai]").onclick = function () { aiDialog(); };
    el.querySelector("[data-docs]").onclick = function () { TAB = "docs"; draw(); };
    el.querySelectorAll("[data-id]").forEach(function (c) { c.onclick = function () { EDIT = c.dataset.id; draw(); }; });
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
      fld("titre", "Titre", WORK.titre, A.titre, 'data-f="titre"', true) + '<datalist id="lc-seqs">' + seqs().map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + "</datalist></div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">🎯 Objectifs et but</h3><div class="lc-g3">' + F.slice(0, 3).map(function (x) { return fld(x[0], x[1], WORK[x[0]], A[x[0]], 'data-f="' + x[0] + '"'); }).join("") + "</div>" + fld("but", "But de la leçon", WORK.but, A.but, 'data-f="but"') + "</div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">🧰 Dispositif et matériel</h3>' + fld("disp", "Dispositif", WORK.disp, A.disp, 'data-f="disp"') + fld("mat", "Matériel", WORK.mat, A.mat, 'data-f="mat"') + "</div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">🔥 Échauffement</h3>' + fld("ech", "Consigne", WORK.ech, A.ech, 'data-f="ech"') + imgBox("ech", WORK.echImg) + "</div>" +
      (WORK.sits || []).map(function (s, i) { return '<div class="lc-box"><div class="lc-row" style="margin:0"><h3 style="margin:4px 0;flex:1">🏃 Situation ' + (i + 1) + "</h3>" + '<button type="button" class="lc-b s" data-rmsit="' + i + '">✕ Retirer</button></div>' + fld("t", SF[0][1], s.t, A["s" + i + ".t"], 'data-s="' + i + '" data-f="t"', true) + fld("cons", SF[1][1], s.cons, A["s" + i + ".cons"], 'data-s="' + i + '" data-f="cons"') + imgBox("s" + i, s.img) +
        '<div class="lc-g3">' + SF.slice(2, 4).map(function (x) { return fld(x[0], x[1], s[x[0]], A["s" + i + "." + x[0]], 'data-s="' + i + '" data-f="' + x[0] + '"'); }).join("") + "</div>" + fld("crR", SF[4][1], s.crR, A["s" + i + ".crR"], 'data-s="' + i + '" data-f="crR"') +
        '<div class="lc-g3">' + SF.slice(5).map(function (x) { return fld(x[0], x[1], s[x[0]], A["s" + i + "." + x[0]], 'data-s="' + i + '" data-f="' + x[0] + '"'); }).join("") + "</div></div>"; }).join("") +
      '<div class="lc-row"><button type="button" class="lc-b s" data-addsit>＋ Ajouter une situation</button></div>' +
      '<div class="lc-box"><h3 style="margin-top:4px">🏆 Remise en action et bilan</h3>' + RF.map(function (x) { return fld(x[0], x[1], WORK[x[0]], A[x[0]], 'data-f="' + x[0] + '"'); }).join("") + "</div>" +
      '<div class="lc-box"><h3 style="margin-top:4px">📅 Programmer pour une classe</h3><p class="lc-mut">À l\'heure prévue, la leçon s\'ouvre toute seule sur les tablettes élèves de la classe (compte à rebours avant).</p>' +
      (br ? '<div class="lc-warn">Valide d\'abord la leçon pour pouvoir la programmer.</div>' : '<div class="lc-row"><select class="lc-sel" data-pc>' + classes().map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") + '</select><input type="datetime-local" class="lc-sel" data-pt><button type="button" class="lc-b s" data-padd>📅 Programmer</button><button type="button" class="lc-b s" data-launch>▶ Lancer maintenant…</button></div>') +
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
    el.querySelector("[data-addsit]").onclick = function () { saveEdit(); WORK.sits.push({}); put(KL, WORK); draw(); };
    el.querySelectorAll("[data-rmsit]").forEach(function (b) { b.onclick = function () { if (!confirm("Retirer la situation " + (+b.dataset.rmsit + 1) + " ?")) return; WORK.sits.splice(+b.dataset.rmsit, 1); WORK.ai = {}; put(KL, WORK); draw(); }; });
    el.querySelectorAll("[data-img]").forEach(function (inp) { inp.onchange = function () { var f = inp.files[0]; if (!f) return; var k = inp.dataset.img;
      (function go(max, q) { shrink(f, max, q).then(function (d) { if (d.length > 30000 && max > 240) return go(Math.round(max * 0.8), Math.max(0.35, q - 0.08)); var id = uid(); put(KI, { id: id, d: d }); if (k === "ech") WORK.echImg = id; else WORK.sits[+k.slice(1)].img = id; put(KL, WORK); draw(); }).catch(function (e) { msg.textContent = "⚠ " + e.message; }); })(620, 0.6); }; });
    el.querySelectorAll("[data-noimg]").forEach(function (b) { b.onclick = function () { var k = b.dataset.noimg; if (k === "ech") WORK.echImg = ""; else WORK.sits[+k.slice(1)].img = ""; put(KL, WORK); draw(); }; });
    var ok = el.querySelector("[data-ok]"); if (ok) ok.onclick = function () { WORK.statut = "ok"; WORK.ai = {}; WORK.val = Date.now(); put(KL, WORK); draw(); };
    var un = el.querySelector("[data-unok]"); if (un) un.onclick = function () { WORK.statut = "brouillon"; put(KL, WORK); draw(); };
    el.querySelector("[data-dup]").onclick = function () { saveEdit(); var c = JSON.parse(JSON.stringify(WORK)); c.id = uid(); c.cr = Date.now(); c.prog = []; c.titre = (c.titre || "") + " (copie)"; put(KL, c); EDIT = c.id; draw(); };
    el.querySelector("[data-del]").onclick = function () { if (!confirm("Supprimer cette leçon ?")) return; if (!confirm("Vraiment ? Elle disparaîtra sur toutes les tablettes.")) return; WORK = null; del(KL, EDIT); EDIT = null; draw(); };
    el.querySelector("[data-see]").onclick = function () { saveEdit(); showStudent(WORK, null, true); };
    var pa = el.querySelector("[data-padd]"); if (pa) {
      var pt = el.querySelector("[data-pt]"), d0 = new Date(Date.now() + 864e5); d0.setHours(8, 0, 0, 0); pt.value = new Date(d0 - d0.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
      pa.onclick = function () { var c = el.querySelector("[data-pc]").value, at = new Date(pt.value).getTime(); if (!c || !at) { msg.textContent = "Choisis la classe, la date et l'heure."; return; } saveEdit(); WORK.prog = (WORK.prog || []).filter(function (p) { return !(same(p.c, c) && Math.abs(p.at - at) < 6e4); }); WORK.prog.push({ c: c, at: at }); put(KL, WORK); draw(); };
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
      '<label class="lc-f"><span>Précisions (facultatif)</span><textarea data-cons placeholder="ex. leçon 3 du document ; classe de 2de ; 24 élèves ; gymnase avec 4 terrains…"></textarea></label>' +
      '<div class="lc-row"><button type="button" class="lc-b p" data-go>✨ Proposer</button><button type="button" class="lc-b" data-cancel>Annuler</button></div><p class="lc-mut" data-msg></p></div>';
    document.body.appendChild(md);
    var sel = md.querySelector("[data-mode]"), msg = md.querySelector("[data-msg]");
    function vis() { var v = sel.value; md.querySelector("[data-wdoc]").style.display = v === "importer" ? "" : "none"; md.querySelector("[data-wseq]").querySelector("span").textContent = /simple|difficile|variante/.test(v) ? "Séquence de départ" : "Séquence"; }
    sel.onchange = vis; vis();
    md.querySelector("[data-cancel]").onclick = function () { md.remove(); };
    md.querySelector("[data-go]").onclick = function () {
      var b = this, mode = sel.value, seq = md.querySelector("[data-seq]").value.trim(), cons = md.querySelector("[data-cons]").value, L = lecons().filter(function (x) { return x.seq === seq; });
      b.disabled = true;
      if (/simple|difficile|variante/.test(mode)) {
        if (!L.length) { msg.textContent = "Cette séquence n'a pas encore de leçon."; b.disabled = false; return; }
        var nseq = seq + (mode === "simple" ? " (plus simple)" : mode === "difficile" ? " (plus difficile)" : " (variante)"), i = 0, done = 0;
        (function next() {
          if (i >= L.length) { msg.textContent = "✓ " + done + " leçon(s) en brouillon dans « " + nseq + " »."; setTimeout(function () { md.remove(); draw(); }, 900); return; }
          var src = L[i++]; msg.textContent = "Claude adapte la leçon " + i + " / " + L.length + "…";
          ask({ op: "lecon", mode: mode, act: NOM, consigne: cons, base: compact(src), docs: docsFor(), lecons: [] }).then(function (r) { var l = fromAI(blank(nseq), r.lecon || {}); l.seq = nseq; l.num = src.num; l.cr = Date.now(); l.src = src.id; put(KL, l); done++; next(); })
            .catch(function (e) { msg.textContent = "⚠ " + e.message; b.disabled = false; });
        })();
        return;
      }
      msg.textContent = "Claude prépare la proposition…";
      ask({ op: "lecon", mode: mode, act: NOM, consigne: cons, docs: mode === "importer" ? docsFor(md.querySelector("[data-doc]").value) : docsFor(), lecons: (mode === "suivante" ? L : lecons()).slice(-12).map(compact) })
        .then(function (r) { var l = fromAI(blank(seq), r.lecon || {}); if (!l.seq) l.seq = seq; if (mode === "suivante" && !l.num) l.num = String(L.length + 1); l.cr = Date.now(); put(KL, l); md.remove(); EDIT = l.id; draw(); })
        .catch(function (e) { msg.textContent = "⚠ " + e.message; b.disabled = false; });
    };
  }

  /* ---- documents ---- */
  function drawDocs() {
    var D = docList();
    var h = '<h2>📂 Mes documents</h2><p class="lc-mut">Dépose ici ce que tu as construit (séquence, fiches de leçon, situations, grilles…). Claude s\'en sert en priorité pour tes leçons ; il ne fait des suggestions que pour les rubriques vides ou quand tu le lui demandes. Word, PowerPoint, LibreOffice et texte sont lus sur la tablette ; les PDF et les photos sont lus par Claude.</p>' +
      '<div class="lc-row"><label class="lc-b p" style="display:inline-flex;align-items:center">⬆ Déposer des documents<input type="file" multiple accept=".docx,.pptx,.odt,.odp,.pdf,.txt,.md,image/*" data-up hidden></label><button type="button" class="lc-b" data-paste>✍ Coller un texte</button></div><p class="lc-mut" data-msg></p>' +
      (D.length ? "" : '<div class="lc-box">Aucun document déposé.</div>') +
      D.map(function (d) { return '<div class="lc-box"><div class="lc-row" style="margin:0"><b style="flex:1">📄 ' + esc(d.nom) + '</b><small class="lc-mut" style="margin:0">' + Math.round(d.n / 100) / 10 + ' k caractères</small><label style="font-weight:700"><input type="checkbox" data-use="' + d.id + '"' + (d.use ? " checked" : "") + '> utilisé par Claude</label><button type="button" class="lc-b s" data-see="' + d.id + '">Voir</button><button type="button" class="lc-b s" data-rm="' + d.id + '">🗑</button></div><pre class="lc-pre" data-txt="' + d.id + '" style="display:none;max-height:300px;overflow:auto;background:#FBFAF7;border-radius:10px;padding:10px;font:13px/1.4 system-ui"></pre></div>'; }).join("");
    var el = shell(h), msg = el.querySelector("[data-msg]");
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

  /* ---- leçon en cours (tablette de contrôle) ---- */
  function live(cls) { return all(KV).filter(function (v) { return same(v.cls, cls); })[0] || null; }
  function startLive(cls, lec) { var v = live(cls) || { id: nn(cls) || uid() }; v.cls = cls; v.on = 1; v.st = Date.now(); v.lec = lec || ""; v.part = ""; v.msgs = []; v.tim = null; v.rang = null; put(KV, v, true); }
  function liveSet(cls, f) { var v = live(cls); if (!v) return; f(v); put(KV, v, true); drawLive(); }
  function sendMsg(cls, txt) { liveSet(cls, function (v) { v.msgs = (v.msgs || []).filter(function (x) { return x.at > Date.now() - 15 * 6e4; }).concat([{ id: uid(), at: Date.now(), t: txt }]); }); }
  function rang(cls) { return all(KR).filter(function (r) { return same(r.cls, cls); })[0] || null; }
  function makeGroups(cls, n) { var R = roster(cls).slice(); for (var i = R.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = R[i]; R[i] = R[j]; R[j] = t; } var G = []; for (var k = 0; k < n; k++) G.push([]); R.forEach(function (x, i) { G[i % n].push(x); }); var r = rang(cls) || { id: nn(cls) || uid(), cls: cls, h: [] }; r.g = G; put(KR, r); }
  function proposal(r) { if (!r || !r.g || !r.g.length) return -1; var last = r.g.map(function (_, i) { var t = 0; (r.h || []).forEach(function (x) { if (x.g === i) t = Math.max(t, x.at); }); return t; }); var best = 0; last.forEach(function (t, i) { if (t < last[best]) best = i; }); return best; }
  function drawLive() {
    if (!OV || OV.style.display === "none" || TAB !== "live") return;
    var C = classes(); if (!LIVECLS) { var c0 = cur(); LIVECLS = (c0 && c0.nom) || all(KV).filter(function (v) { return v.on; }).map(function (v) { return v.cls; })[0] || C[0] || ""; }
    var cls = LIVECLS, v = live(cls), on = v && v.on, L = lecons().filter(function (l) { return l.statut !== "brouillon"; }), lec = on && v.lec && get(KL, v.lec);
    var h = '<h2>📡 Leçon en cours</h2><p class="lc-mut">Cette tablette pilote les tablettes élèves de la classe : messages en grand avec un son, minuteur, étape en cours, rangement.</p>' +
      '<div class="lc-row"><b>Classe</b><select class="lc-sel" data-cls>' + C.map(function (c) { return "<option" + (same(c, cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>" + (on ? '<span class="lc-tag ok">● en cours depuis ' + Math.max(1, Math.round((Date.now() - v.st) / 6e4)) + " min</span>" : "") + "</div>";
    if (!on) h += '<div class="lc-box"><div class="lc-row"><b>Leçon</b><select class="lc-sel" data-lec><option value="">— sans fiche de leçon —</option>' + L.map(function (l) { return '<option value="' + l.id + '">' + esc((l.seq ? l.seq + " · " : "") + titreL(l)) + "</option>"; }).join("") + '</select><button type="button" class="lc-b p" data-start>▶ Démarrer la leçon</button></div><p class="lc-mut">La fiche choisie s\'ouvre sur les tablettes élèves de la classe (seulement les leçons validées).</p></div>';
    else {
      var parts = [["", "—"], ["ech", "🔥 Échauffement"]].concat(((lec && lec.sits) || [{}, {}]).map(function (s, i) { return ["s" + i, "🏃 Situation " + (i + 1)]; })).concat([["rem", "🏆 Remise en action"], ["bilan", "💬 Bilan"]]);
      h += '<div class="lc-box"><b>' + (lec ? esc(titreL(lec)) : "Sans fiche de leçon") + '</b><div class="lc-row">' + parts.map(function (p) { return '<button type="button" class="lc-b s' + (v.part === p[0] ? " p" : "") + '" data-part="' + p[0] + '">' + p[1] + "</button>"; }).join("") + '</div><p class="lc-mut">Étape mise en avant sur les tablettes élèves.</p></div>' +
        '<div class="lc-box"><h3 style="margin-top:4px">📣 Message à toutes les tablettes</h3><div class="lc-row">' + ["Il vous reste 5 minutes", "Il vous reste 2 minutes", "Changement de situation", "Regroupement auprès du professeur", "Fin de la leçon : on range le matériel", "Arrêtez-vous et écoutez"].map(function (t) { return '<button type="button" class="lc-b s" data-q="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") +
        '</div><div class="lc-row"><input class="lc-sel" data-mt style="flex:1;min-width:220px" placeholder="Ton message…">' + ((window.SpeechRecognition || window.webkitSpeechRecognition) ? '<button type="button" class="lc-b s" data-dict>🎤</button>' : "") + '<button type="button" class="lc-b p" data-send>📣 Envoyer</button></div>' +
        (v.msgs || []).slice(-3).reverse().map(function (x) { return '<div class="lc-mut">' + new Date(x.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " · " + esc(x.t) + "</div>"; }).join("") + "</div>" +
        '<div class="lc-box"><h3 style="margin-top:4px">⏱ Minuteur</h3><div class="lc-row"><input class="lc-sel" data-tl placeholder="Intitulé (facultatif)" value="' + esc((v.tim && v.tim.lab) || "") + '">' + [1, 2, 3, 5, 8, 10, 15, 20].map(function (n) { return '<button type="button" class="lc-b s" data-tm="' + n + '">' + n + " min</button>"; }).join("") + (v.tim ? '<button type="button" class="lc-b s" data-tstop>⏹ Arrêter</button>' : "") + "</div>" + (v.tim ? '<div class="lc-mut" data-tleft></div>' : "") + "</div>";
      var R = rang(cls), pr = proposal(R);
      h += '<div class="lc-box"><h3 style="margin-top:4px">🧹 Rangement</h3>' + (R && R.g && R.g.length ? R.g.map(function (g, i) { var lst = (R.h || []).filter(function (x) { return x.g === i; }).sort(function (a, b) { return b.at - a.at; })[0];
        return '<div class="lc-row" style="align-items:flex-start"><b style="min-width:86px">Groupe ' + (i + 1) + (i === pr ? " 👉" : "") + '</b><span style="flex:1">' + esc(g.join(", ") || "—") + '<br><small class="lc-mut">' + (lst ? "a rangé le " + esc(hm(lst.at)) + " (" + esc(lst.app) + ")" : "n'a pas encore rangé") + '</small></span><button type="button" class="lc-b s' + (i === pr ? " p" : "") + '" data-rg="' + i + '">🧹 Range aujourd\'hui</button></div>'; }).join("") +
        '<p class="lc-mut">👉 = proposition (le groupe qui n\'a pas rangé depuis le plus longtemps, toutes activités confondues). ' + ((v.rang && v.rang.g != null) ? "Aujourd'hui : groupe " + (v.rang.g + 1) + "." : "") + "</p>" : '<p class="lc-mut">Pas encore de groupes de rangement pour cette classe.</p>') +
        '<div class="lc-row"><select class="lc-sel" data-ng>' + [2, 3, 4, 5, 6].map(function (n) { return "<option" + (n === ((R && R.g && R.g.length) || 4) ? " selected" : "") + ">" + n + "</option>"; }).join("") + '</select><button type="button" class="lc-b s" data-mk>' + (R && R.g ? "↻ Refaire les groupes" : "Former les groupes") + "</button>" + (R && R.g ? '<button type="button" class="lc-b s" data-edg>✏ Modifier</button>' : "") + "</div>" +
        ((R && R.h && R.h.length) ? '<details><summary class="lc-mut">Trace des rangements</summary>' + R.h.slice().sort(function (a, b) { return b.at - a.at; }).slice(0, 30).map(function (x) { return '<div class="lc-mut">' + esc(hm(x.at)) + " · groupe " + (x.g + 1) + " · " + esc(x.app) + "</div>"; }).join("") + "</details>" : "") + "</div>" +
        '<div class="lc-row">' + (window.EPST && EPST.openVue ? '<button type="button" class="lc-b p" data-vue>👁 Voir côté élève</button>' : "") + '<button type="button" class="lc-b" data-stop style="border-color:#C0392B;color:#C0392B">⏹ Terminer la leçon</button></div>';
    }
    var el = shell(h);
    el.querySelector("[data-cls]").onchange = function () { LIVECLS = this.value; drawLive(); };
    var st = el.querySelector("[data-start]"); if (st) st.onclick = function () { startLive(cls, el.querySelector("[data-lec]").value); drawLive(); };
    if (!on) return;
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
      liveSet(cls, function (x) { x.rang = { g: i, noms: R.g[i] }; x.msgs = (x.msgs || []).concat([{ id: uid(), at: Date.now(), t: "🧹 Rangement : groupe " + (i + 1) + "\n" + R.g[i].join(", ") }]); }); }; });
    var vu = el.querySelector("[data-vue]"); if (vu) vu.onclick = function () { close(); EPST.openVue(); };
    el.querySelector("[data-stop]").onclick = function () { if (!confirm("Terminer la leçon pour " + cls + " ?")) return; liveSet(cls, function (x) { x.on = 0; x.tim = null; }); };
  }

  /* 🧪 leçon simulée : classe fictive (créée au besoin), fiche de démonstration de l'appli lancée tout de suite, pilotage ouvert */
  function simulate() {
    var D = window.EPSD && EPSD.demo; if (!D) { alert("Module commun indisponible : recharge la page."); return; }
    function go() { var l = get(KL, "demo-" + APP); startLive(D.nom, l ? l.id : ""); LIVECLS = D.nom; open("live"); }
    if (D.on()) return go();
    if (!confirm("Créer la classe de démonstration « " + D.nom + " » (8 élèves fictifs, à retirer ensuite dans Réglages communs) et lancer une leçon simulée ?")) return;
    D.create().then(function () { setTimeout(go, 400); });
  }
  /* ================= côté élève ================= */
  function showStudent(l, v, prev) {
    css(); var o = document.getElementById("lc-st"); if (!o) { o = document.createElement("div"); o.id = "lc-st"; o.className = "lc-st"; document.body.appendChild(o); }
    o.dataset.lec = l ? l.id : ""; o.dataset.prev = prev ? "1" : ""; o.style.zIndex = prev ? "2147481400" : ""; var part = (v && v.part) || "", img = function (id) { var im = id && get(KI, id); return im ? '<img class="lc-img" src="' + im.d + '" alt="schéma">' : ""; };
    var say = window.speechSynthesis ? '<button type="button" class="say" title="Écouter la consigne" style="float:right;height:40px;min-width:44px;border-radius:12px;border:1.5px solid #E6E1D6;background:#fff;font-size:20px">🔊</button>' : "";
    var bk = function (key, title, inner) { return inner ? '<div class="bk' + (part === key ? " now" : "") + '" data-p="' + key + '">' + say + "<h3>" + title + (part === key ? '<span class="now-tag">maintenant</span>' : "") + "</h3>" + inner + "</div>" : ""; };
    var k = function (lab, t) { return t ? '<div class="k">' + lab + '</div><div class="lc-pre">' + esc(t) + "</div>" : ""; };
    var h = '<div class="hd"><b>📅 ' + esc(l ? titreL(l) : "Leçon") + '</b><button type="button" data-x>✕ Fermer</button></div><div class="in">';
    if (v && v.rang && v.rang.g != null) h += '<div class="bk rang"><h3>🧹 Rangement aujourd\'hui : groupe ' + (v.rang.g + 1) + '</h3><div>' + esc((v.rang.noms || []).join(", ")) + "</div></div>";
    if (l) {
      h += (l.but || l.mat) ? '<div class="bk">' + k("But de la leçon", l.but) + k("Matériel", l.mat) + "</div>" : "";
      h += bk("ech", "🔥 Échauffement", (l.ech ? '<div class="lc-pre">' + esc(l.ech) + "</div>" : "") + img(l.echImg));
      (l.sits || []).forEach(function (s, i) { h += bk("s" + i, "🏃 Situation " + (i + 1) + (s.t ? " · " + esc(s.t) : ""), (s.cons ? '<div class="lc-pre">' + esc(s.cons) + "</div>" : "") + img(s.img) + k("✅ Je réussis si…", [s.crQ, s.crQl].filter(Boolean).join("\n")) + k("💡 Pour réussir…", s.crR) + k("⬇ Plus facile", s.simp) + k("⬆ Plus difficile", s.comp)); });
      h += bk("rem", "🏆 Remise en action", (l.rem ? '<div class="lc-pre">' + esc(l.rem) + "</div>" : "") + k("✅ Je réussis si…", l.remCr));
    } else h += '<div class="bk">La leçon a commencé. Écoute les consignes de ton professeur.</div>';
    o.innerHTML = h + "</div>"; o.style.display = "block";
    o.querySelector("[data-x]").onclick = function () { try { speechSynthesis.cancel(); } catch (e) {} o.style.display = "none"; };
    /* 🔊 lecture à voix haute par la tablette elle-même (aucune donnée envoyée) */
    o.querySelectorAll(".say").forEach(function (b) { b.onclick = function () { try { var S = window.speechSynthesis; if (S.speaking) { S.cancel(); return; }
      var t = b.parentNode.innerText.replace(/🔊/g, "").replace(/maintenant/g, "").replace(/[✅💡⬇⬆🔥🏃🏆]/g, ""), u = new SpeechSynthesisUtterance(t); u.lang = "fr-FR"; u.rate = 0.95;
      var v = S.getVoices().filter(function (x) { return /^fr/i.test(x.lang); })[0]; if (v) u.voice = v; S.speak(u); } catch (e) {} }; });
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
      else if (stOpen && (LASTPART[V.id] !== (V.part || "") + "|" + JSON.stringify(V.rang || ""))) showStudent(L, V);
      LASTPART[V.id] = (V.part || "") + "|" + JSON.stringify(V.rang || "");
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
    EPSD.store({ pre: "rg|", key: KR, onChange: function () { if (TAB === "live") redraw(); } });
    setInterval(function () { try { tickStudent(); } catch (e) { console.warn(e); } }, 1000);
    setInterval(function () { if (OV && OV.style.display !== "none" && TAB === "live") { var tl = OV.querySelector("[data-tleft]"), v = live(LIVECLS); if (tl && v && v.tim) tl.textContent = v.tim.end > Date.now() ? "Reste " + mmss(v.tim.end - Date.now()) + (v.tim.lab ? " · " + v.tim.lab : "") : "⏰ Temps écoulé"; } }, 1000);
  }
  boot();
  window.EPSLC = {
    open: open, close: close, app: APP,
    actions: function () { return [{ ico: "🧪", label: "Leçon simulée", go: simulate }, { ico: "📝", label: "Fiches de leçon", go: function () { open("lec"); } }, { ico: "📡", label: "Leçon en cours", go: function () { open("live"); } }]; },
    biblio: function () { return [{ ico: "📂", label: "Mes documents", sub: "Ta séquence, tes fiches : Claude s'en sert en priorité pour tes leçons", go: function () { open("docs"); } }, { ico: "📝", label: "Mes fiches de leçon", sub: "Fiches de leçon, brouillons de Claude à valider, programmation", go: function () { open("lec"); } }]; },
    _test: { lecons: lecons, put: put, all: all, KL: KL, KV: KV, KD: KD, KR: KR, fromAI: fromAI, startLive: startLive, sendMsg: sendMsg, extract: extract }
  };
})();
