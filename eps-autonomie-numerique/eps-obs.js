/* EPS – Autonomie et numérique : observations dictées (toutes les applis d'activité, mode enseignant ; chargé par eps-home.js).
   Bouton 🎙 flottant : l'enseignant dit « Prénom … contenu » ; l'observation est rangée pour cet élève, ce jour-là, dans l'activité.
   Liste par élève (ajouter, corriger, supprimer), condensation par Claude (mode « obs », prénoms retirés), reprise dans la recherche 🔍
   et dans les appréciations de bulletin. Données : eps.obs.v1 (synchronisées et chiffrées, préfixe « ob| »). */
(function () {
  if (window.EPSOB) return;
  var APPS = { escalade: ["esc", "Escalade", "#2E7D4F"], relais: ["rel", "Relais Vitesse", "#D9481F"], volley: ["vol", "Volley-ball", "#6B3FA0"], badminton: ["bad", "Badminton", "#0B7A75"], danse: ["dan", "Danse", "#C2185B"], acrosport: ["acro", "Acrosport", "#1F4FA3"], orientation: ["ori", "OrienRun", "#E8701A"], ccf: ["ccf", "CCF", "#B8860B"] };
  var m = location.pathname.match(/\/(escalade|relais|volley|badminton|danse|acrosport|orientation|ccf)\//); if (!m) return;
  var APP = m[1], CODE = APPS[APP][0], NOM = APPS[APP][1], COL = APPS[APP][2], K = "eps.obs.v1", VUE = !!window.EPS_VUE_ELEVE;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function ld() { var v = jget(K, null); if (!v || !v.items) v = { items: {}, pend: {}, since: 0 }; v.pend = v.pend || {}; return v; }
  function put(it) { var V = ld(), o = V.items[it.id]; it.u = Math.max(Date.now(), ((o && o.u) || 0) + 1); V.items[it.id] = it; V.pend[it.id] = it.u; try { localStorage.setItem(K, JSON.stringify(V)); } catch (e) {} if (window.EPSD && EPSD.syncSoon) EPSD.syncSoon(); }
  function del(id) { put({ id: id, del: 1 }); }
  function all() { var V = ld(); return Object.keys(V.items).map(function (k) { return V.items[k]; }).filter(function (o) { return o && !o.del; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim(); }
  function cmp(s) { return norm(s).replace(/ /g, ""); }
  function day(t) { var d = new Date(t || Date.now()); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function dayFR(d) { return new Date(d + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); }
  function isT() { if (VUE) return false; try { if (typeof window.epsIsTeacher === "function" && window.epsIsTeacher()) return true; } catch (e) {} var H = document.documentElement.classList; return H.contains("eps-teach") || H.contains("epst-on"); }

  /* classes de l'activité et élèves (listes communes) */
  function classes() { var L = []; try { EPSL.items().forEach(function (o) { if ((o.off || []).indexOf(CODE) < 0) L.push(o.nom); }); } catch (e) {} return L.sort(function (a, b) { return a.localeCompare(b, "fr", { numeric: true }); }); }
  function people(cls) { var R = []; try { EPSL.items().forEach(function (o) { if (cmp(o.nom) === cmp(cls)) R = EPSL.people(o).map(function (p) { return { full: p.full, prenom: p.prenom || String(p.full).split(" ")[0], nom: p.nom || String(p.full).split(" ").slice(1).join(" ") }; }); }); } catch (e) {}
    if (!R.length) try { var c = window.epsCurrentClass && epsCurrentClass(); if (c && cmp(c.nom) === cmp(cls)) R = (c.eleves || []).map(function (f) { var w = String(f).split(" "); return { full: f, prenom: w[0], nom: w.slice(1).join(" ") }; }); } catch (e) {}
    return R; }
  function curClass() { var k = "eps.obs.cls." + APP, c = null; try { var x = window.epsCurrentClass && epsCurrentClass(); if (x && x.nom) c = x.nom; } catch (e) {} if (!c) c = localStorage.getItem(k); var L = classes(); if (!c || !L.some(function (x) { return cmp(x) === cmp(c); })) c = L[0] || ""; return c; }
  function setClass(c) { try { localStorage.setItem("eps.obs.cls." + APP, c); } catch (e) {} }

  /* « Léa bon placement… » → {eleve, texte} ; plusieurs élèves du même prénom : l'initiale ou le nom qui suit départage */
  function match(txt, P) {
    var w = norm(txt).split(" "), best = null;
    P.forEach(function (p) { var pr = norm(p.prenom).split(" "), no = norm(p.nom).split(" "), sc = 0, used = 0;
      if (pr.every(function (x, i) { return w[i] === x; })) { sc = 2; used = pr.length; if (no[0] && (w[used] === no[0] || w[used] === no[0][0])) { sc = 3; used++; } }
      else if (no[0] && w[0] === no[0]) { sc = 1.5; used = 1; if (pr[0] && w[1] === pr[0]) { sc = 2.5; used = 2; } }
      if (sc && (!best || sc > best.sc)) best = { p: p, sc: sc, used: used, tie: false }; else if (sc && best && sc === best.sc) best.tie = true; });
    if (!best || best.tie) return null;
    var words = String(txt).trim().split(/\s+/); var rest = words.slice(best.used).join(" ").replace(/^[,:;.\-–\s]+/, "");
    return { eleve: best.p.full, texte: rest.charAt(0).toUpperCase() + rest.slice(1) };
  }

  /* ---------- interface ---------- */
  function css() {
    if (document.getElementById("eob-css")) return; var st = document.createElement("style"); st.id = "eob-css";
    st.textContent = [
      "#eob-btn{position:fixed;right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:2147481050;width:60px;height:60px;border-radius:50%;border:3px solid #fff;background:" + COL + ";color:#fff;font-size:28px;box-shadow:0 6px 18px rgba(0,0,0,.3);cursor:pointer;display:none}",
      "#eob-btn.rec{background:#C0392B;animation:eobp 1s infinite}@keyframes eobp{50%{transform:scale(1.08)}}",
      ".eob-ov{position:fixed;inset:0;z-index:2147481400;background:rgba(20,23,28,.5);display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
      ".eob-sh{background:#F5F3EE;color:#14171C;width:100%;max-width:820px;max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;padding:16px 18px 26px;box-shadow:0 -8px 30px rgba(0,0,0,.25)}",
      ".eob-sh h3{margin:0;font-size:20px}.eob-m{color:#6A6F78;font-size:14px}.eob-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}",
      ".eob-b{height:42px;border-radius:12px;border:2px solid " + COL + ";background:#fff;color:#14171C;font:800 14px system-ui,sans-serif;padding:0 12px;cursor:pointer}.eob-b.p{background:" + COL + ";color:#fff}.eob-b.s{height:34px;font-size:13px;border-width:1.5px;padding:0 9px}",
      ".eob-sel,.eob-in{height:42px;border:2px solid #E6E1D6;border-radius:12px;padding:0 10px;font:15px system-ui,sans-serif;background:#fff}.eob-in{flex:1;min-width:200px}",
      ".eob-mic{display:block;width:100%;border:0;border-radius:18px;background:" + COL + ";color:#fff;font:900 20px system-ui,sans-serif;padding:22px;margin:10px 0;cursor:pointer}.eob-mic.rec{background:#C0392B}",
      ".eob-live{min-height:28px;font-size:18px;font-weight:700;margin:6px 0}.eob-ok{background:#E3F4E8;border:1px solid #9BD3AE;border-radius:14px;padding:10px 12px;margin:8px 0}",
      ".eob-st{background:#fff;border:1px solid #E6E1D6;border-left:5px solid " + COL + ";border-radius:14px;padding:8px 12px;margin:0 0 8px}",
      ".eob-it{display:flex;gap:8px;align-items:flex-start;border-top:1px solid #F0ECE3;padding:6px 0}.eob-it textarea{flex:1;border:1px solid #E6E1D6;border-radius:10px;padding:6px 8px;font:15px/1.35 system-ui,sans-serif;min-height:38px;resize:vertical}",
      ".eob-it small{color:#9AA0A6;min-width:44px;padding-top:8px}.eob-cond{background:#FFF8D6;border:1px solid #E9CF6A;border-radius:10px;padding:6px 8px;margin:4px 0;font-size:14px}"
    ].join("\n"); document.head.appendChild(st);
  }
  var BTN = null, SH = null, TAB = "dict", DAY = day(), LAST = null;
  function btn() {
    if (!BTN) { css(); BTN = document.createElement("button"); BTN.id = "eob-btn"; BTN.type = "button"; BTN.title = "Observation dictée : dis le prénom puis ton observation"; BTN.textContent = "🎙"; BTN.onclick = function () { open("dict", true); }; document.body.appendChild(BTN); }
    var lc = document.querySelector(".lc-ov"), hide = !!(lc && lc.style.display !== "none");
    BTN.style.display = isT() && !hide && !SH ? "block" : "none";
  }
  function close() { if (SH) { SH.remove(); SH = null; } stopRec(); }
  function open(tab, auto) {
    css(); TAB = tab || TAB; if (SH) SH.remove();
    SH = document.createElement("div"); SH.className = "eob-ov"; SH.innerHTML = '<div class="eob-sh"></div>';
    SH.addEventListener("click", function (e) { if (e.target === SH) close(); }); document.body.appendChild(SH); draw();
    if (auto && TAB === "dict" && SR) startRec();
  }
  function head(cls) {
    return '<div class="eob-row" style="margin-top:0"><h3 style="flex:1">🎙 Observations · ' + esc(NOM) + '</h3><button type="button" class="eob-b s" data-x>✕</button></div>' +
      '<div class="eob-row"><select class="eob-sel" data-cls>' + classes().map(function (c) { return "<option" + (cmp(c) === cmp(cls) ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>" +
      '<button type="button" class="eob-b s' + (TAB === "dict" ? " p" : "") + '" data-tab="dict">🎙 Dicter</button><button type="button" class="eob-b s' + (TAB === "list" ? " p" : "") + '" data-tab="list">📋 Traces (' + all().filter(function (o) { return o.app === APP && cmp(o.cls) === cmp(cls) && o.day === DAY; }).length + ")</button></div>";
  }
  function bindHead(el) {
    el.querySelector("[data-x]").onclick = close;
    el.querySelector("[data-cls]").onchange = function () { setClass(this.value); draw(); };
    el.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { stopRec(); TAB = b.dataset.tab; draw(); }; });
  }
  function draw() { if (!SH) return; var el = SH.querySelector(".eob-sh"), cls = curClass(); if (TAB === "list") return drawList(el, cls); drawDict(el, cls); }

  /* ---- dictée ---- */
  var REC = null;
  function drawDict(el, cls) {
    var P = people(cls);
    el.innerHTML = head(cls) + (cls ? "" : '<p class="eob-m">Aucune classe attribuée à cette activité.</p>') +
      '<p class="eob-m">Appuie, dis le <b>prénom</b> (et l\'initiale du nom si deux élèves ont le même prénom), puis ton observation. Elle est rangée tout de suite pour cet élève.</p>' +
      (SR ? '<button type="button" class="eob-mic" data-mic>🎙 Appuie et parle</button>' : '<p class="eob-m">Dictée vocale indisponible sur ce navigateur : écris ci-dessous.</p>') +
      '<div class="eob-live" data-live></div><div data-res></div>' +
      '<div class="eob-row"><input class="eob-in" data-txt placeholder="ou écris : Léa bon placement, ralentit à la transmission"><button type="button" class="eob-b p" data-add>＋ Ajouter</button></div>' +
      (P.length ? "" : '<p class="eob-m">Pas de liste d\'élèves pour cette classe.</p>');
    bindHead(el);
    var mic = el.querySelector("[data-mic]"); if (mic) mic.onclick = function () { if (REC) stopRec(); else startRec(); };
    el.querySelector("[data-add]").onclick = function () { var t = el.querySelector("[data-txt]"); if (t.value.trim()) { handle(t.value.trim()); t.value = ""; } };
    el.querySelector("[data-txt]").onkeydown = function (e) { if (e.key === "Enter") el.querySelector("[data-add]").click(); };
    if (LAST) showRes(LAST);
  }
  function startRec() {
    if (!SR || !SH) return; var el = SH.querySelector(".eob-sh"), mic = el.querySelector("[data-mic]"), live = el.querySelector("[data-live]");
    var r = new SR(); r.lang = "fr-FR"; r.interimResults = true; r.continuous = false; REC = r; var fin = "";
    if (mic) { mic.classList.add("rec"); mic.textContent = "⏺ J'écoute… (appuie pour arrêter)"; } if (BTN) BTN.classList.add("rec");
    r.onresult = function (e) { var t = ""; for (var i = 0; i < e.results.length; i++) { t += e.results[i][0].transcript; if (e.results[i].isFinal) fin = t; } if (live) live.textContent = t; };
    r.onerror = function (e) { if (live) live.textContent = e.error === "not-allowed" ? "⚠ Autorise le micro pour cette page." : e.error === "no-speech" ? "Je n'ai rien entendu." : "⚠ " + e.error; };
    r.onend = function () { REC = null; if (BTN) BTN.classList.remove("rec"); if (mic) { mic.classList.remove("rec"); mic.textContent = "🎙 Appuie et parle"; } if (fin.trim()) { if (live) live.textContent = ""; handle(fin.trim()); } };
    try { r.start(); } catch (e) { REC = null; }
  }
  function stopRec() { if (REC) try { REC.stop(); } catch (e) {} }
  function handle(txt) {
    var cls = curClass(), P = people(cls), r = match(txt, P);
    if (!r) { LAST = { pend: txt }; return showRes(LAST); }
    var o = { id: uid(), app: APP, cls: cls, el: r.eleve, txt: r.texte || txt, raw: txt, t: Date.now(), day: day() }; put(o); LAST = { ok: o }; showRes(LAST);
  }
  function showRes(R) {
    if (!SH) return; var box = SH.querySelector("[data-res]"); if (!box) return; var cls = curClass();
    if (R.ok) { box.innerHTML = '<div class="eob-ok">✓ <b>' + esc(R.ok.el) + "</b> : " + esc(R.ok.txt) + '<div class="eob-row" style="margin:6px 0 0"><button type="button" class="eob-b s" data-undo>↶ Annuler</button><button type="button" class="eob-b s" data-other>Autre élève…</button></div></div>';
      box.querySelector("[data-undo]").onclick = function () { del(R.ok.id); LAST = null; box.innerHTML = '<p class="eob-m">Observation annulée.</p>'; };
      box.querySelector("[data-other]").onclick = function () { del(R.ok.id); LAST = { pend: R.ok.raw }; showRes(LAST); }; return; }
    var P = people(cls);
    box.innerHTML = '<div class="eob-ok" style="background:#FFF6E0;border-color:#F0D58A">Pour qui ? « ' + esc(R.pend) + ' »<div class="eob-row">' + P.map(function (p, i) { return '<button type="button" class="eob-b s" data-p="' + i + '">' + esc(p.full) + "</button>"; }).join("") + '</div><button type="button" class="eob-b s" data-drop>✕ Ignorer</button></div>';
    box.querySelectorAll("[data-p]").forEach(function (b) { b.onclick = function () { var p = P[+b.dataset.p], t = R.pend, w = norm(t).split(" "), pr = norm(p.prenom);
      if (w[0] === pr) t = String(t).trim().split(/\s+/).slice(1).join(" "); var o = { id: uid(), app: APP, cls: cls, el: p.full, txt: t.charAt(0).toUpperCase() + t.slice(1), raw: R.pend, t: Date.now(), day: day() }; put(o); LAST = { ok: o }; showRes(LAST); }; });
    box.querySelector("[data-drop]").onclick = function () { LAST = null; box.innerHTML = ""; };
  }

  /* ---- traces : par élève, éditables ---- */
  function drawList(el, cls) {
    var O = all().filter(function (o) { return o.app === APP && cmp(o.cls) === cmp(cls); }), days = {};
    O.forEach(function (o) { days[o.day] = 1; }); days[DAY] = 1;
    var D = Object.keys(days).sort().reverse(), today = O.filter(function (o) { return o.day === DAY; }), by = {};
    today.forEach(function (o) { (by[o.el] = by[o.el] || []).push(o); });
    var P = people(cls), names = Object.keys(by).sort(function (a, b) { return a.localeCompare(b, "fr"); });
    el.innerHTML = head(cls) + '<div class="eob-row"><select class="eob-sel" data-day>' + D.map(function (d) { return '<option value="' + d + '"' + (d === DAY ? " selected" : "") + ">" + esc(dayFR(d)) + "</option>"; }).join("") + "</select>" +
      '<span class="eob-m">' + today.length + " observation(s), " + names.length + " élève(s)</span></div>" +
      (names.length ? names.map(function (n) { var L = by[n].sort(function (a, b) { return a.t - b.t; }), cd = jget("eps.obs.cond", {})[APP + "|" + cmp(cls) + "|" + DAY + "|" + n];
        return '<div class="eob-st"><div class="eob-row" style="margin:0"><b style="flex:1;font-size:16px">' + esc(n) + '</b><button type="button" class="eob-b s" data-cond="' + esc(n) + '">✨ Condenser</button><button type="button" class="eob-b s" data-addto="' + esc(n) + '">＋</button></div>' +
          (cd ? '<div class="eob-cond">✨ ' + esc(cd) + "</div>" : "") +
          L.map(function (o) { return '<div class="eob-it"><small>' + new Date(o.t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + '</small><textarea data-ed="' + o.id + '">' + esc(o.txt) + '</textarea><button type="button" class="eob-b s" data-rm="' + o.id + '" title="Supprimer">🗑</button></div>'; }).join("") + "</div>"; }).join("")
        : '<p class="eob-m">Aucune observation ce jour-là pour cette classe.</p>') +
      '<div class="eob-row"><select class="eob-sel" data-np><option value="">Ajouter pour…</option>' + P.map(function (p) { return "<option>" + esc(p.full) + "</option>"; }).join("") + '</select><input class="eob-in" data-nt placeholder="Observation"><button type="button" class="eob-b p" data-nadd>＋</button></div><p class="eob-m" data-msg></p>';
    bindHead(el);
    var msg = el.querySelector("[data-msg]");
    el.querySelector("[data-day]").onchange = function () { DAY = this.value; draw(); };
    el.querySelectorAll("[data-ed]").forEach(function (t) { var T = null; t.oninput = function () { clearTimeout(T); T = setTimeout(function () { var o = ld().items[t.dataset.ed]; if (o) { o.txt = t.value; put(o); } }, 600); }; });
    el.querySelectorAll("[data-rm]").forEach(function (b) { b.onclick = function () { if (confirm("Supprimer cette observation ?")) { del(b.dataset.rm); draw(); } }; });
    el.querySelectorAll("[data-addto]").forEach(function (b) { b.onclick = function () { el.querySelector("[data-np]").value = b.dataset.addto; el.querySelector("[data-nt]").focus(); }; });
    el.querySelector("[data-nadd]").onclick = function () { var n = el.querySelector("[data-np]").value, t = el.querySelector("[data-nt]").value.trim(); if (!n || !t) { msg.textContent = "Choisis l'élève et écris l'observation."; return; }
      put({ id: uid(), app: APP, cls: cls, el: n, txt: t, raw: t, t: DAY === day() ? Date.now() : new Date(DAY + "T12:00").getTime(), day: DAY }); draw(); };
    el.querySelectorAll("[data-cond]").forEach(function (b) { b.onclick = function () {
      var n = b.dataset.cond, firsts = people(cls).map(function (p) { return p.prenom; }).filter(Boolean);
      var txt = by[n].sort(function (a, b) { return a.t - b.t; }).map(function (o) { var t = o.txt; firsts.forEach(function (f) { t = t.replace(new RegExp("\\b" + f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi"), "un camarade"); }); return "- " + t; }).join("\n");
      if (!window.EPSD || !EPSD.reformuler) { msg.textContent = "Indisponible."; return; }
      b.disabled = true; b.textContent = "Claude…";
      EPSD.reformuler(txt, { mode: "obs", act: NOM }).then(function (r) { var C = jget("eps.obs.cond", {}); C[APP + "|" + cmp(cls) + "|" + DAY + "|" + n] = String(r || "").trim(); try { localStorage.setItem("eps.obs.cond", JSON.stringify(C)); } catch (e) {} draw(); },
        function (e) { b.disabled = false; b.textContent = "✨ Condenser"; msg.textContent = "⚠ " + (e && e.message || e); }); }; });
  }

  /* pour la recherche 🔍 et les appréciations (eps-home.js) : observations d'un élève, toutes activités */
  function of(full, cls) { var k = norm(full).split(" ").sort().join(" "); return all().filter(function (o) { return norm(o.el).split(" ").sort().join(" ") === k && (!cls || cmp(o.cls) === cmp(cls)); }).sort(function (a, b) { return a.t - b.t; }); }

  function boot() {
    if (!window.EPSD || !EPSD.store) return setTimeout(boot, 500);
    EPSD.store({ pre: "ob|", key: K, onChange: function () { if (SH && TAB === "list" && !(document.activeElement && SH.contains(document.activeElement) && document.activeElement.tagName === "TEXTAREA")) draw(); } });
    setInterval(btn, 1000); btn();
  }
  boot();
  window.EPSOB = { open: open, of: of, match: match, _all: all };
})();
