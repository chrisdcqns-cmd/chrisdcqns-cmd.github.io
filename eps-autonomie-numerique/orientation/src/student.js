// ===== Espace élève =====
const RUNKEY = "run";
const loadRun = () => LS.get(RUNKEY, null);
const saveRun = r => LS.set(RUNKEY, r);
function mutRun(fn) { const r = loadRun(); if (!r) return null; fn(r); saveRun(r); return r; }
try { navigator.getBattery?.().then(b => { const u = () => E.bat = Math.round(b.level * 100); u(); b.addEventListener("levelchange", u); }); } catch (e) {}
let E = { bat: null, fix: null, watch: null, timer: null, tick: null, wake: null, sending: false, online: null, active: true, chan: null, scanning: false, mapProj: null };
const TAB_ID = uid(5);

function newEvent(r, k, extra = {}) {
  r.seq = (r.seq || 0) + 1; const e = { id: `${r.r}-${r.seq}`, k, t: Date.now(), ...extra };
  if (E.fix && e.la == null && Date.now() - E.fix.t < 60000) { e.la = +E.fix.lat.toFixed(6); e.lo = +E.fix.lon.toFixed(6); e.ac = Math.round(E.fix.acc); }
  if (k === "pos" && E.bat != null) e.bat = E.bat;
  r.ev[e.id] = e; r.queue.push(e.id); return e;
}

// ---------- entrée élève ----------
const runOpen = r => r && r.start && !r.finish && !r.abandon;
function studentEntry(goData) {
  showScreen("eleve");
  const run = loadRun();
  if (goData) {
    if (run && !run.done && run.s === goData.s && run.c.k === goData.c.k) return run.start ? runScreen() : readyScreen();
    if (runOpen(run)) return closeFirst(run, () => joinScreen(goData));
    return joinScreen(goData);
  }
  if (run && !run.done) return run.start ? (run.finish || run.abandon ? endScreen() : runScreen()) : readyScreen();
  welcomeScreen();
}
// Une course n'est pas terminée : l'élève doit la clôturer avant d'en commencer une autre
function closeFirst(run, then) {
  const m = openModal(`<h2>⚠ Course non terminée</h2><p>Tu n'as pas clôturé ta course <b>${esc(run.c.k)}</b> (${esc(run.nom)}), commencée à ${fmtHeure(run.start)}.</p><p class="muted">Clôture-la d'abord : tes balises et ton temps seront envoyés à ton enseignant.</p>
    <div style="display:flex;flex-direction:column;gap:10px"><button class="btn green" id="cfEnd">🏁 Clôturer la course ${esc(run.c.k)}</button><button class="btn alt" id="cfBack">↩ Reprendre la course ${esc(run.c.k)}</button></div>`, { sticky: true });
  $("#cfBack", m).onclick = () => { m.close(); history.replaceState(null, "", location.pathname); runScreen(); };
  $("#cfEnd", m).onclick = async () => {
    mutRun(r => { r.finish = Date.now(); newEvent(r, "finish", { via: "cloture" }); r.done = true; });
    await flush(true); const r = loadRun(); if (r.queue.length) keepOld(r);
    m.close(); toast(`Course ${run.c.k} clôturée ✓`, "ok"); then();
  };
}
// données pas encore reçues d'une ancienne course : gardées et renvoyées plus tard (plus de perte)
function keepOld(r) { const L = LS.get("oldRuns", []).filter(x => x.r !== r.r); L.push(r); LS.set("oldRuns", L.slice(-5)); }
async function flushOld() {
  const L = LS.get("oldRuns", []); if (!L.length) return; const keep = [];
  for (const r of L) { try { const ids = r.queue.slice(0, 150); const ev = ids.map(id => r.ev[id]).filter(Boolean).map(({ code, ...x }) => x); await apiCall(r.a, "push", { s: r.s, r: r.r, nom: r.nom, cl: r.cl, c: r.c.k, sel: r.sel, ev }, 15000); r.queue = r.queue.filter(id => !ids.includes(id)); if (r.queue.length) keep.push(r); } catch (e) { keep.push(r); } }
  LS.set("oldRuns", keep);
}
const lessonApi = () => { const r = loadRun(); return (typeof CFG !== "undefined" && CFG.api) || API_DEFAULT || r?.a || LS.get("lastApi", ""); };
function welcomeScreen() {
  const run = loadRun();
  $("#eleve").innerHTML = `<div class="ehead"><div class="flag"></div><h1>OrienRun</h1><span class="grow"></span><button class="btn small ghost" id="eHome">⌂</button></div>
   <div class="panel"><h2>Choisis ta leçon</h2><div id="wLessons" class="list"><p class="muted">Recherche des leçons en cours…</p></div>
    <div class="row" style="margin-top:10px"><input class="inp grow" id="wCode" maxlength="6" placeholder="ou tape le code de la leçon" style="width:auto;text-transform:uppercase"><button class="btn alt" id="wCodeGo">OK</button></div></div>
   <div class="panel"><p class="muted" style="margin-top:0">Ton enseignant a affiché un QR code de départ ?</p><button class="btn or" id="wScan" style="width:100%;min-height:56px">📷 Scanner le QR de départ</button></div>
   ${run?.done ? `<div class="panel"><b>Dernière course :</b> ${esc(run.c.k)} · ${fmtDur((run.finish || Date.now()) - run.start)} <button class="btn small alt" id="wLast">Revoir</button></div>` : ""}`;
  $("#eHome").onclick = () => { location.hash = ""; showHome(); };
  $("#wScan").onclick = () => openScanner(txt => { const m = String(txt).match(/#go=([\w-]+)/); if (m) { try { const g = b64d(m[1]); studentEntry(g); return true; } catch (e) {} } toast("Ce n'est pas un QR de départ", "ko"); return false; });
  $("#wLast") && ($("#wLast").onclick = () => endScreen());
  const openLesson = async code => {
    const api = lessonApi(); if (!api) return toast("Pas de serveur : scanne le QR de départ", "ko");
    try { const j = await apiCall(api, "getSession", { s: code }, 30000); const d = j.data || {}; const gos = Object.values(d.gos || {}); if (!gos.length) throw new Error("Cette leçon n'a pas de parcours (mets à jour le script de l'enseignant)");
      if (d.proj) DB.set("map:" + code, d.proj);
      LS.set("lastApi", api);
      gos.forEach(g => g.eleves = d.eleves || null);
      if (gos.length === 1) return studentEntry(gos[0]);
      const m = openModal(`<h2>${esc(d.nom || code)}</h2><p class="muted">Choisis ton parcours :</p><div style="display:flex;flex-direction:column;gap:10px">${gos.map((g, i) => `<button class="btn alt" data-g="${i}" style="justify-content:flex-start;min-height:56px"><b>${esc(g.c.k)}</b>&nbsp;· ${esc(g.c.nm || "")} <small class="muted">&nbsp;${g.c.b.filter(b => !b.x).length} balises</small></button>`).join("")}</div>`);
      $$("[data-g]", m).forEach(b => b.onclick = () => { m.close(); studentEntry(gos[+b.dataset.g]); });
    } catch (e) { toast(e.message, "ko"); }
  };
  $("#wCodeGo").onclick = () => { const c = $("#wCode").value.trim().toUpperCase(); if (c) openLesson(c); };
  (async () => { const api = lessonApi(), box = $("#wLessons"); if (!api) { box.innerHTML = '<p class="muted">Scanne le QR de départ affiché par ton enseignant.</p>'; return; }
    try { const j = await apiCall(api, "lessons", {}, 20000); const L = j.lessons || [];
      box.innerHTML = L.length ? L.map(l => `<button class="item" data-l="${esc(l.s)}" style="text-align:left"><div class="num" style="background:var(--violet);color:#fff;text-shadow:none;font-size:1.1rem">${esc(l.s)}</div><div class="body"><b>${esc(l.nom)}</b><br><small class="muted">lancée à ${fmtHeure(l.t)}</small></div></button>`).join("") : '<p class="muted">Aucune leçon en cours pour l\'instant. Attends que ton enseignant la lance, puis touche ↻.</p><button class="btn small ghost" id="wRe">↻ Actualiser</button>';
      $$("[data-l]", box).forEach(b => b.onclick = () => openLesson(b.dataset.l)); $("#wRe") && ($("#wRe").onclick = welcomeScreen);
    } catch (e) { box.innerHTML = `<p class="muted">Liste indisponible (${esc(e.message)}). Tape le code de la leçon ou scanne le QR de départ.</p>`; }
  })();
}
function joinScreen(g) {
  const me = LS.get("moi", {});
  const c = g.c, req = c.b.filter(b => !b.x), bonus = c.b.filter(b => b.x);
  $("#eleve").innerHTML = `<div class="ehead"><div class="flag"></div><h1>${esc(c.k)}</h1></div>
   <div class="panel"><h2>${esc(c.nm || "Parcours " + c.k)}</h2><p class="muted" style="margin-top:-6px">${esc(g.u || "")} · ${req.length} balises${bonus.length ? ` + ${bonus.length} bonus` : ""} · ${{ ordre: "dans l'ordre imposé", libre: "dans l'ordre que tu veux", score: "au score" }[c.m]}${c.tm ? ` · ${c.tm} min maximum` : ""}${c.hr ? ` · retour avant ${new Date(c.hr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}</p>
    <div id="jWho"></div>
    ${c.ch ? `<h3>Choisis tes balises${c.nb ? ` (${c.nb})` : ""}</h3><p class="muted" style="margin-top:-4px">Touche les balises que tu veux aller chercher.${c.prep ? " Tu pourras encore changer pendant ta préparation." : ""}</p><div class="cchips" id="jSel">${req.map(b => `<button class="cchip" data-n="${b.n}">${b.n}${b.p != null ? `<small style="font-family:inherit;font-weight:600"> ${b.p}pt</small>` : ""}</button>`).join("")}</div><p id="jSelInfo" class="muted"></p>` : ""}
    ${bonus.length ? `<p class="muted">★ Balises bonus (facultatives) : ${bonus.map(b => b.n + (b.p != null ? ` (${b.p} pts)` : "")).join(", ")}</p>` : ""}
    <button class="btn or" id="jGo" style="width:100%;min-height:58px;margin-top:10px">${c.prep ? `Commencer ma préparation (${c.prep} min) →` : "Continuer →"}</button></div>`;
  // identité : liste de la classe (si l'enseignant l'a chargée) ou saisie libre
  let eleves = g.eleves || null, libre = false;
  const who = () => {
    const box = $("#jWho"); if (!box) return;
    const cls = eleves ? Object.keys(eleves) : [];
    if (cls.length && !libre) {
      const cur = box._cl && eleves[box._cl] ? box._cl : (cls.includes(me.cl) ? me.cl : cls.length === 1 ? cls[0] : null);
      box._cl = cur;
      box.innerHTML = `<div class="lbl">Ta classe</div><div class="cchips" style="margin:6px 0 10px">${cls.map(c => `<button class="cchip ${c === cur ? "on" : ""}" data-jc="${esc(c)}" style="padding:0 14px">${esc(c)}</button>`).join("")}</div>
       ${cur ? `<div class="field"><label>Ton nom</label><select class="inp" id="jNomSel"><option value="">— choisis ton nom —</option>${eleves[cur].map(n => `<option value="${esc(n)}" ${normName(n) === normName(me.nom) ? "selected" : ""}>${esc(n)}${dzO(cur, n) ? " 🩹 " + esc(EPSD.label(dzO(cur, n))) : ""}</option>`).join("")}</select></div>
       <div class="field"><label>Équipier(e) (si vous courez à deux)</label><select class="inp" id="jBinSel"><option value="">— personne —</option>${eleves[cur].map(n => `<option value="${esc(n)}">${esc(n)}${dzO(cur, n) ? " 🩹" : ""}</option>`).join("")}</select></div>` : ""}
       <button class="btn small ghost" id="jLibre">Je ne suis pas dans la liste</button>`;
      $$("[data-jc]", box).forEach(b => b.onclick = () => { box._cl = b.dataset.jc; who(); });
      $("#jLibre", box).onclick = () => { libre = true; who(); };
    } else box.innerHTML = `<div class="field"><label>Prénom NOM</label><input class="inp" id="jNom" value="${esc(me.nom || "")}" autocomplete="name" placeholder="ex. Léa DUPONT"></div>
      <div class="field"><label>Équipier(e) (si vous courez à deux)</label><input class="inp" id="jBin" placeholder="facultatif"></div>
      <div class="field"><label>Classe</label><input class="inp" id="jCl" list="dlCl" value="${esc(me.cl || "")}" placeholder="ex. TMELEC"><datalist id="dlCl">${(cls.length ? cls : ["TMELEC", "TTBMA", "1G1", "1G2", "1G3", "1G4", "1STMG"]).map(c => `<option>${esc(c)}</option>`).join("")}</datalist></div>`;
  };
  who();
  if (!eleves && g.a) apiCall(longApi(g.a), "getSession", { s: g.s }, 20000).then(j => { if (j.data?.eleves && Object.keys(j.data.eleves).length) { eleves = j.data.eleves; who(); } if (j.data?.proj) DB.set("map:" + g.s, j.data.proj); }).catch(() => {});
  const prev = loadRun(); const sel = new Set(prev && prev.s === g.s && prev.c.k === c.k && !prev.start ? prev.sel || [] : []);
  const showSel = () => { $$("#jSel .cchip").forEach(b => b.classList.toggle("on", sel.has(+b.dataset.n))); const i = $("#jSelInfo"); if (i) i.textContent = sel.size ? `${sel.size} balise(s) choisie(s) : ${[...sel].join(", ")}` : ""; };
  $$("#jSel .cchip").forEach(b => b.onclick = () => { const n = +b.dataset.n; if (sel.has(n)) sel.delete(n); else { if (c.nb && sel.size >= c.nb) return toast(`${c.nb} balises maximum`); sel.add(n); } showSel(); });
  showSel();
  $("#jGo").onclick = () => {
    const fromList = !!$("#jNomSel");
    const nom = fromList ? $("#jNomSel").value : $("#jNom").value.trim(), bin = fromList ? $("#jBinSel").value : $("#jBin").value.trim(), cl = fromList ? $("#jWho")._cl : $("#jCl").value.trim().toUpperCase();
    if (fromList && !nom) return toast("Choisis ton nom dans la liste", "ko");
    if (bin && bin === nom) return toast("Ton équipier ne peut pas être toi 😉", "ko");
    if (nom.length < 2) return toast("Écris ton prénom et ton nom", "ko");
    if (c.ch && c.nb && sel.size !== c.nb) return toast(`Choisis exactement ${c.nb} balises`, "ko");
    if (c.ch && !sel.size) return toast("Choisis au moins une balise", "ko");
    LS.set("moi", { nom, cl });
    const same = prev && !prev.start && !prev.done && prev.s === g.s && prev.c.k === c.k;
    if (prev && prev.queue?.length && !same) keepOld(prev);
    const r = same ? prev : { s: g.s, a: longApi(g.a), t: g.t, i: g.i || 20, z: g.z, u: g.u, c, r: uid(6), start: null, finish: null, ev: {}, queue: [], seq: 0, dec: {}, msgs: [], seenMsg: {} };
    Object.assign(r, { nom: bin ? `${nom} & ${bin}` : nom, cl, sel: c.ch ? [...sel] : null }); r.joinT = r.joinT || Date.now();
    if (c.prep && !r.prepStart) { r.prepStart = Date.now(); newEvent(r, "prep"); }
    newEvent(r, "select", { sel: r.sel || undefined });
    saveRun(r); history.replaceState(null, "", location.pathname); readyScreen(); flush();
  };
}
function readyScreen() {
  const r = loadRun(); const c = r.c;
  const prepLeft = () => c.prep && r.prepStart ? c.prep * 60000 - (Date.now() - r.prepStart) : 0;
  const dm = c.dm || (c.hS ? "balise" : "libre");
  const startBtn = dm === "balise" ? `<button class="btn green" id="rScanStart" style="width:100%;min-height:64px;font-size:1.2rem">📷 Scanner la balise DÉPART</button><button class="btn ghost small" id="rCodeStart" style="width:100%;margin-top:8px">⌨ Taper le code de la balise départ</button>`
    : dm === "confirm" ? `<button class="btn green" id="rHereStart" style="width:100%;min-height:64px;font-size:1.15rem">📍 Je suis bien au point de départ</button>`
    : `<button class="btn green" id="rGo" style="width:100%;min-height:70px;font-size:1.4rem">▶ DÉPART</button>`;
  $("#eleve").innerHTML = `<div class="ehead"><div class="flag"></div><h1>${c.prep ? "Préparation" : "Prêt ?"}</h1></div>
   <div class="panel"><h2>${esc(r.nom)}</h2><p class="muted" style="margin-top:-6px">${esc(r.cl)} · parcours ${esc(c.k)}${r.sel ? " · balises : " + r.sel.join(", ") : ""}</p>
    ${c.prep ? `<div class="runcard" style="text-align:center"><div class="lbl" style="color:#fff">Temps de préparation</div><div class="chrono" id="prepT"></div><div class="sub" style="justify-content:center">Prépare ton itinéraire sur la carte${c.ch ? " et vérifie tes balises" : ""}.</div></div>` : ""}
    <div class="row" style="margin-top:10px">${c.mp ? `<button class="btn alt" id="rMap">🗺 Voir la carte</button>` : ""}${c.ch ? `<button class="btn ghost" id="rBack">✏ Changer mes balises</button>` : `<button class="btn ghost small" id="rBack">← Changer de nom</button>`}</div>
    <ol style="line-height:1.6;padding-left:20px"><li>Autorise la <b>localisation</b> (ton enseignant suit ta position pour ta sécurité).</li><li>Garde l'appli <b>ouverte et l'écran allumé</b> pendant la course.</li><li>À chaque balise : bouton <b>Scanner</b> (ou ton appareil photo).</li><li>En cas de problème : bouton rouge <b>SOS</b>.</li></ol>
    <div class="row"><button class="btn alt" id="rGps">📍 Autoriser la localisation</button><span id="rGpsR" class="muted"></span></div>
    <div id="msgs"></div>
    <div style="margin-top:16px" id="startBox">${startBtn}</div></div>`;
  $("#rGps").onclick = () => navigator.geolocation?.getCurrentPosition(p => { E.fix = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() }; const o = $("#rGpsR"); if (o) o.innerHTML = `<b style="color:var(--green)">✓ ±${Math.round(p.coords.accuracy)} m</b>`; }, e => $("#rGpsR") && ($("#rGpsR").textContent = "✕ " + (e.code === 1 ? "refusée : autorise-la dans les réglages" : e.message)), { enableHighAccuracy: true, timeout: 20000 });
  startGps(); fetchMap();
  const blocked = () => { const l = prepLeft(); if (l > 0) { toast(`Encore ${fmtDur(l)} de préparation`, "ko"); return true; } return false; };
  const go = (via) => { if (blocked()) return; mutRun(r => { if (!r.start) { r.start = Date.now(); newEvent(r, "start", { via }); } }); stopLobby(); runScreen(); flush(); };
  $("#rGo") && ($("#rGo").onclick = () => go("bouton"));
  $("#rScanStart") && ($("#rScanStart").onclick = () => { if (blocked()) return; openScanner(txt => { const p = parsePunch(txt); if (p && String(p.n) === String(c.dn)) { if (codeHash(r.z, p.n, p.code) !== c.hS) { toast("Code de départ incorrect", "ko"); return false; } go("qr"); return true; } toast("Ce n'est pas la balise de départ", "ko"); return false; }); });
  $("#rCodeStart") && ($("#rCodeStart").onclick = () => { if (blocked()) return; const v = prompt("Code écrit sous le QR de la balise DÉPART :"); if (!v) return; if (codeHash(r.z, c.dn, v.trim().toUpperCase()) !== c.hS) return toast("Code de départ incorrect", "ko"); go("code"); });
  $("#rHereStart") && ($("#rHereStart").onclick = async () => {
    if (blocked()) return;
    if (c.dLa == null) { if (confirm("Tu confirmes être au point de départ ?")) go("confirme"); return; }
    const b = $("#rHereStart"); b.disabled = true; b.textContent = "📍 Vérification de ta position…";
    try { const p = E.fix && Date.now() - E.fix.t < 15000 && E.fix.acc < 40 ? E.fix : await measureGPS(5); const d = haversine(p, { lat: c.dLa, lon: c.dLo }); E.fix = { lat: p.lat, lon: p.lon, acc: p.acc, t: Date.now() };
      if (d <= 50 + Math.min(p.acc || 0, 30)) { toast(`✓ Tu es au départ (${Math.round(d)} m)`, "ok"); go("gps"); }
      else toast(`Tu es à ${fmtDist(d)} du point de départ : rapproche-toi puis réessaie.`, "ko");
    } catch (e) { if (confirm(e.message + "\nConfirmer quand même que tu es au départ ?")) go("confirme"); }
    b.disabled = false; b.textContent = "📍 Je suis bien au point de départ";
  });
  $("#rMap") && ($("#rMap").onclick = showStudentMap);
  $("#rBack").onclick = () => joinScreen({ s: r.s, a: shortApi(r.a), t: r.t, i: r.i, z: r.z, u: r.u, c: r.c });
  // préparation : compte à rebours
  clearInterval(E.prepTick);
  const pt = () => { const el = $("#prepT"); if (!el) return clearInterval(E.prepTick); const l = prepLeft(); el.textContent = l > 0 ? fmtDur(l) : "C'est parti !"; $("#startBox").style.opacity = l > 0 ? .45 : 1; if (l <= 0 && !E.prepDone) { E.prepDone = 1; navigator.vibrate?.([300, 100, 300]); sbeep([660, 990]); } };
  if (c.prep) { E.prepDone = prepLeft() <= 0; pt(); E.prepTick = setInterval(pt, 500); }
  startLobby(); renderLobbyMsgs();
}
// Avant le départ, le téléphone écoute déjà l'enseignant (rappel général, messages)
function startLobby() { stopLobby(); E.lobby = setInterval(() => { const r = loadRun(); if (!r || r.start || r.done) return stopLobby(); flush(true); }, Math.max(10, +(loadRun()?.i) || 20) * 1000); }
function stopLobby() { clearInterval(E.lobby); E.lobby = null; }
function renderLobbyMsgs() { const r = loadRun(), box = $("#msgs"); if (!box || !r) return; const unseen = (r.msgs || []).filter(m => !r.seenMsg[m.id] && m.type !== "recall"); box.innerHTML = unseen.map(m => `<div class="msgbox">💬 ${esc(m.txt)} <button class="btn small alt" data-mid="${m.id}" style="float:right">OK</button></div>`).join(""); $$("[data-mid]", box).forEach(b => b.onclick = () => { readMsg(b.dataset.mid); renderLobbyMsgs(); }); }
const parsePunch = txt => { const m = String(txt || "").match(/#b=([\w%-]+)\.([A-Za-z0-9]+)/); return m ? { n: decodeURIComponent(m[1]), code: m[2].toUpperCase() } : null; };

// ---------- pendant la course ----------
function targetsOf(r) { const req = r.c.b.filter(b => !b.x); return r.sel && r.sel.length && r.c.m !== "ordre" ? req.filter(b => r.sel.includes(b.n)) : req; }
const bonusOf = r => r.c.b.filter(b => b.x);
function runScreen() {
  const r = loadRun(); if (!r) return welcomeScreen(); if (!r.start) return readyScreen(); if (r.finish || r.abandon) return endScreen();
  $("#eleve").innerHTML = `<div class="ehead"><div class="flag" style="width:34px;height:34px"></div><h1 style="font-size:1.4rem">${esc(r.c.k)} · ${esc(r.nom)}</h1><span class="grow"></span><button class="btn small ghost" id="rMenu">☰</button></div>
   <div class="runcard"><div class="chrono" id="chrono">0:00</div><div class="sub"><span class="status" id="stGps"><i></i>GPS</span><span class="status" id="stNet"><i></i>Réseau</span><span id="stCount"></span></div>
    <div class="next" id="nextBox"></div></div>
   <div id="msgs"></div>
   <div class="bigbtns"><button class="btn or" id="bScan">📷 Scanner</button><button class="btn alt" id="bCode">⌨ Saisir un code</button></div>
   ${E.mapProj || r.c.mp ? `<button class="btn ghost" id="bMap" style="width:100%;margin-top:10px">🗺 Voir la carte</button>` : ""}
   <div class="targets" id="targets"></div>
   <div class="row" style="margin-top:16px">${r.c.hF ? `<button class="btn green grow" id="bFinScan">📷 Scanner l'ARRIVÉE</button>` : ""}<button class="btn ${r.c.hF ? "ghost" : "green"} grow" id="bFin">🏁 J'ai terminé</button></div>
   <button class="sos" id="sos"><span>SOS</span></button>`;
  $("#bScan").onclick = () => openScanner(txt => { const p = parsePunch(txt); if (!p) { toast("QR code non reconnu", "ko"); return false; } handlePunch(p.n, p.code, "qr"); return true; });
  $("#bCode").onclick = manualCode;
  $("#bMap") && ($("#bMap").onclick = showStudentMap);
  $("#bFinScan") && ($("#bFinScan").onclick = () => openScanner(txt => { const p = parsePunch(txt); if (!p) return false; handlePunch(p.n, p.code, "qr"); return true; }));
  $("#bFin").onclick = () => { const r = loadRun(); const a = anaS(r); if (!confirm(a.manquants.length ? `Il te manque ${a.manquants.length} balise(s) (${a.manquants.join(", ")}). Terminer quand même ?` : "Terminer ta course ?")) return; finishRun(); };
  $("#rMenu").onclick = runMenu;
  initSOS($("#sos"));
  startGps(); startLoop(); renderRun(); fetchMap();
  clearInterval(E.tick); E.tick = setInterval(() => {
    const r = loadRun(); if (!r || !$("#chrono")) return clearInterval(E.tick);
    const el = Date.now() - r.start, dl = deadlineOf(r.c, r.start);
    if (dl == null) $("#chrono").textContent = fmtDur(el);
    else { const left = dl - Date.now(); $("#chrono").innerHTML = `${fmtDur(el)}<div style="font-size:1.1rem;color:${left < 0 ? "#ff8a8a" : left < 300000 ? "#ffd27a" : "#cfe"}">${left < 0 ? "⏰ en retard de " + fmtDur(-left) : "reste " + fmtDur(left) + (r.c.hr ? ` · retour avant ${new Date(r.c.hr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "")}</div>`;
      if (left < 300000 && left > 0 && !r.warn5) { mutRun(x => x.warn5 = 1); navigator.vibrate?.([400, 150, 400]); sbeep([880, 660]); feedback(null, "⏳ Plus que 5 minutes !", "Pense à revenir à l'arrivée / au point de retour.", "", true); }
      if (left <= 0 && !r.warn0) { mutRun(x => x.warn0 = 1); navigator.vibrate?.([800, 200, 800, 200, 800]); sbeep([440, 330, 440, 330]); feedback(false, "⏰ Temps écoulé !", "Reviens immédiatement au point de retour.", "", true); }
    }
    updStatus(); }, 500);
  requestWake();
}
function renderRun() {
  const r = loadRun(); if (!r || !$("#targets")) return;
  const a = anaS(r), T = targetsOf(r), fb = fbOn(r);
  const st = {}; a.punches.forEach(p => { if (!st[p.n] || p.status === "ok") st[p.n] = p; });
  const leg = {}; a.legs.forEach(l => leg[l.n] = l);
  let next = null; if (r.c.m === "ordre") next = T.find(b => !(st[b.n] && (st[b.n].status === "ok" || st[b.n].status === "attente")));
  $("#stCount").textContent = `${a.found + a.pending}/${T.length} balises${a.bonusTotal ? ` · ★${a.bonusFound}` : ""}${a.hasPts && fb ? ` · ${a.points} pts` : ""}`;
  const nb = $("#nextBox");
  if (r.c.m === "ordre") nb.innerHTML = next ? `<div class="flag">${next.n}</div><div><div class="lbl" style="color:var(--ink2)">Prochaine balise · n° ${T.indexOf(next) + 1}/${T.length}</div><b style="font-size:1.25rem">Balise ${next.n}</b>${next.d ? `<div class="muted">${esc(next.d)}</div>` : ""}</div>` : `<div class="flag">🏁</div><div><b style="font-size:1.2rem">Toutes les balises sont trouvées !</b><div class="muted">${r.c.hF ? "Va à l'arrivée et scanne-la." : "Touche « J'ai terminé »."}</div></div>`;
  else nb.innerHTML = `<div class="flag">${a.found + a.pending}</div><div><div class="lbl" style="color:var(--ink2)">${r.c.m === "score" ? "Course au score" : "Dans l'ordre que tu veux"}</div><b style="font-size:1.15rem">${T.length - a.found - a.pending ? `Encore ${T.length - a.found - a.pending} balise(s) à trouver` : "Tout est trouvé ! Va à l'arrivée."}</b></div>`;
  $("#targets").innerHTML = `<div class="lbl" style="margin:4px 2px">Mes balises</div>` + T.map(b => { const p = st[b.n], l = leg[b.n]; const cls = !p ? "" : p.status === "refus" ? "ko" : r.dec[p.id] === true ? "done" : !fb ? "wait" : p.status === "ok" ? "done" : p.status === "attente" ? "wait" : "ko";
    return `<div class="target ${cls} ${next && next.n === b.n ? "cur" : ""}"><div class="n">${b.n}</div><div>${b.d ? esc(b.d) : ""}${b.p != null ? ` <span class="chip">${b.p} pts</span>` : ""}<br><small class="muted">${!p ? "à trouver" : p.status === "refus" ? "<b style='color:var(--red)'>✕ fausse (notifiée par ton enseignant)</b>" : r.dec[p.id] === true ? "<b style='color:var(--green)'>✓ juste (confirmée par ton enseignant)</b>" : !fb ? "📍 enregistrée" : p.status === "ok" ? "✓ validée" + (l && !l.ordre ? " (hors ordre)" : "") : p.status === "attente" ? "⏳ en attente de validation par l'enseignant" : "✕ code incorrect"}</small></div><div class="tm">${l ? fmtDur(l.split) + `<br><small class="muted">${fmtDur(l.cumul)}</small>` : ""}</div></div>`; }).join("")
    + (bonusOf(r).length ? `<div class="lbl" style="margin:10px 2px 4px">★ Balises bonus (facultatives)</div>` + bonusOf(r).map(b => { const p = st[b.n], l = leg[b.n]; const cls = !p ? "" : p.status === "refus" ? "ko" : r.dec[p.id] === true || (fb && p.status === "ok") ? "done" : "wait"; return `<div class="target ${cls}"><div class="n">★${b.n}</div><div>${b.d ? esc(b.d) : ""}${b.p != null ? ` <span class="chip">${b.p} pts</span>` : ""}<br><small class="muted">${!p ? "facultative" : p.status === "refus" ? "✕ fausse" : r.dec[p.id] === true ? "✓ juste" : !fb ? "📍 enregistrée" : p.status === "ok" ? "✓ validée" : "✕"}</small></div><div class="tm">${l && l.split != null ? fmtDur(l.split) : ""}</div></div>`; }).join("") : "")
    + (fb && a.punches.filter(p => p.status === "hors").length ? `<p class="muted">Balises hors parcours scannées : ${a.punches.filter(p => p.status === "hors").map(p => p.n).join(", ")}</p>` : "");
  const unseen = (r.msgs || []).filter(m => !r.seenMsg[m.id] && m.type !== "recall");
  $("#msgs").innerHTML = unseen.map(m => `<div class="msgbox">💬 ${esc(m.txt)} <button class="btn small alt" data-mid="${m.id}" style="float:right">OK</button></div>`).join("");
  $$("[data-mid]").forEach(b => b.onclick = () => { readMsg(b.dataset.mid); renderRun(); });
}
function updStatus() {
  const r = loadRun(); if (!r) return;
  const g = $("#stGps"), n = $("#stNet"); if (!g) return;
  const fresh = E.fix && Date.now() - E.fix.t < 45000;
  g.className = "status " + (fresh ? (E.fix.acc < 30 ? "ok" : "wait") : "ko"); g.lastChild.textContent = fresh ? `GPS ±${Math.round(E.fix.acc)} m` : "GPS…";
  const q = r.queue.length;
  n.className = "status " + (!r.a ? "wait" : E.online === false ? "ko" : q > 3 ? "wait" : "ok"); n.lastChild.textContent = !r.a ? "Hors ligne (SMS)" : E.online === false ? `Pas de réseau · ${q} en attente` : q ? `Envoi… (${q})` : "Connecté";
}
function handlePunch(n, code, via) {
  const r = loadRun(); if (!r || !r.start) { toast("Ouvre d'abord ton parcours (QR de départ)", "ko"); return; }
  if (r.finish || r.abandon) { toast("Ta course est terminée", "ko"); return; }
  const c = r.c, fb = fbOn(r);
  if (c.dn != null && String(n) === String(c.dn)) { toast("C'est la balise de départ 😉"); return; }
  if (c.fn != null && String(n) === String(c.fn)) { if (codeHash(r.z, n, code) !== c.hF) return toast("Code d'arrivée incorrect", "ko"); return finishRun(true); }
  const num = parseInt(n); const b = c.b.find(x => x.n === num);
  const a = analyseRun(r, c, null, r.dec);
  const ok = b ? codeHash(r.z, num, code) === b.h : null;
  if (a.punches.some(p => p.n === num && (p.status === "ok" || p.status === "attente")) || (!fb && a.punches.some(p => p.n === num && String(p.code || "") === String(code).toUpperCase().slice(0, 6) && p.ok === ok))) { toast(`Balise ${num} déjà enregistrée`); return; }
  let warn = "";
  if (fb && b && ok && c.m === "ordre") { const T = targetsOf(r); const nx = T.find(x => !a.punches.some(p => p.n === x.n && (p.status === "ok" || p.status === "attente"))); if (nx && nx.n !== num) warn = `Attention : la balise attendue était la n° ${nx.n}.`; }
  const T0 = c.m === "ordre" ? targetsOf(r).find(x => !a.punches.some(p => p.n === x.n && (p.status === "ok" || p.status === "attente")))?.n : null;
  mutRun(r => newEvent(r, "punch", { n: num, ok: !!ok, via, code: ok ? undefined : String(code).toUpperCase().slice(0, 6) }));
  const r2 = loadRun(); const a2 = fb ? analyseRun(r2, c, null, r2.dec) : anaS(r2); const leg = a2.legs.filter(l => l.n === num).pop();
  const sub = leg ? `${fmtDur(leg.split)} depuis ${leg.de === "Départ" ? "le départ" : "la balise " + leg.de}` : "";
  if (!fb) feedback(null, `Balise ${num} enregistrée`, sub);
  else if (!b) feedback(false, `Balise ${num} : mauvaise balise !`, `Elle n'est pas sur ton parcours${c.m === "ordre" && T0 ? ` : tu cherches la balise ${T0}` : ""}. Reprends ta carte.`);
  else if (!ok) feedback(false, `Balise ${num} : code faux !`, "Vérifie le code écrit sur la balise et ta position sur la carte.");
  else feedback(true, `Balise ${num} ✓${c.v === "prof" ? " (en attente de validation)" : ""}`, sub, warn);
  renderRun(); flush();
  if (b && c.m !== "score" && (ok || !fb)) { const left = targetsOf(r2).filter(x => !a2.punches.some(p => p.n === x.n && (p.status === "ok" || p.status === "attente"))); if (!left.length && !c.hF) setTimeout(() => { if (confirm("Tu as scanné toutes tes balises ! Arrêter le chrono ?")) finishRun(); }, 1600); }
}
function feedback(ok, title, sub = "", warn = "", persist = false) {
  navigator.vibrate?.(ok !== false ? [120, 60, 120] : [600, 150, 600]); sbeep(ok !== false ? [880, 1320] : [300, 220, 300]);
  const d = document.createElement("div"); d.className = "modal"; d.style.alignItems = "center";
  d.innerHTML = `<div class="sheet" style="max-width:420px;text-align:center;background:${ok === null ? "#1f4fa3" : ok ? "#2a9d6f" : "#e63946"};color:#fff;border-radius:24px"><div style="font-size:4rem">${ok === null ? "📍" : ok ? "✓" : "✕"}</div><h2 style="margin:0">${esc(title)}</h2><p style="font-size:1.2rem">${esc(sub)}</p>${warn ? `<p style="background:#fff3;border-radius:12px;padding:8px">${esc(warn)}</p>` : ""}<button class="btn alt" style="min-width:140px">OK</button></div>`;
  $("#modalRoot").appendChild(d); d.querySelector("button").onclick = () => d.remove(); if (!persist) setTimeout(() => d.remove(), warn ? 6000 : 3000);
}
function manualCode() {
  const r = loadRun();
  const m = openModal(`<h2>Saisir une balise</h2><p class="muted">Si le QR code ne passe pas : tape le numéro de la balise et le code écrit dessous.</p>
   <div class="grid2"><div class="field"><label>Numéro de balise</label><input class="inp" id="mN" inputmode="numeric" style="font-size:1.6rem"></div><div class="field"><label>Code</label><input class="inp" id="mC" maxlength="4" style="font-size:1.6rem;text-transform:uppercase" autocapitalize="characters"></div></div>
   <button class="btn or" id="mOk" style="width:100%">Valider</button>`);
  $("#mN", m).focus();
  $("#mOk", m).onclick = () => { const n = $("#mN", m).value.trim(), c = $("#mC", m).value.trim().toUpperCase(); if (!n || !c) return; m.close(); const isF = r.c.fn != null && n.toUpperCase() === String(r.c.fn).toUpperCase(); handlePunch(isF ? r.c.fn : n, c, "code"); };
}
function finishRun(scanned) {
  mutRun(r => { if (!r.finish) { r.finish = Date.now(); newEvent(r, "finish", { via: scanned ? "qr" : "bouton" }); } });
  stopLoop(); flush().then(() => endScreen()); endScreen();
}
function runMenu() {
  const r = loadRun();
  const m = openModal(`<h2>Menu</h2><div style="display:flex;flex-direction:column;gap:10px">
   <button class="btn alt" id="mSms">📩 Envoyer mes balises par SMS (pas de réseau)</button>
   ${r.t ? `<a class="btn alt" href="tel:${esc(r.t.replace(/[^\d+]/g, ""))}">📞 Appeler mon enseignant</a>` : ""}
   <button class="btn alt" id="mSync">↻ Renvoyer maintenant</button>
   <button class="btn red" id="mAb">Abandonner la course</button></div>
   <p class="muted" style="font-size:.8rem;margin-top:14px">Leçon ${esc(r.s)} · ${esc(r.r)} · ${r.queue.length} donnée(s) en attente d'envoi</p>`);
  $("#mSms", m).onclick = () => { location.href = smsHref(r.t, smsResultat(smsRunData(loadRun()))); mutRun(r => r.smsSent = Date.now()); };
  $("#mSync", m).onclick = () => { flush(true); m.close(); };
  $("#mAb", m).onclick = () => { if (!confirm("Abandonner ? Ton enseignant sera prévenu.")) return; mutRun(r => { r.abandon = Date.now(); newEvent(r, "abandon"); }); m.close(); stopLoop(); flush(); endScreen(); };
}
function smsRunData(r) {
  const P = Object.values(r.ev).filter(e => e.k === "punch").sort((a, b) => a.t - b.t);
  const last = E.fix ? { lat: E.fix.lat, lon: E.fix.lon } : null;
  return { s: r.s, c: r.c, r: r.r, nom: r.nom, cl: r.cl, start: r.start, finish: r.finish, punches: P, last };
}

// ---------- SOS ----------
function initSOS(btn) {
  let h = null, t0 = 0;
  const down = e => { e.preventDefault(); t0 = Date.now(); btn.innerHTML = `<span class="ring"></span><span>Maintiens…</span>`; h = setTimeout(() => { btn.innerHTML = "<span>SOS</span>"; sendAlert(); }, 1200); };
  const upf = () => { if (h) clearTimeout(h); h = null; btn.innerHTML = "<span>SOS</span>"; if (Date.now() - t0 < 1100) toast("Maintiens le bouton SOS appuyé pour envoyer une alerte"); };
  btn.addEventListener("pointerdown", down); btn.addEventListener("pointerup", upf); btn.addEventListener("pointerleave", () => { if (h) { clearTimeout(h); h = null; btn.innerHTML = "<span>SOS</span>"; } });
}
function sendAlert() {
  navigator.vibrate?.([300, 100, 300]);
  const ev = mutRun(r => newEvent(r, "alert", { txt: "" }));
  const r = loadRun(); const last = Object.values(r.ev).filter(e => e.la != null).sort((a, b) => b.t - a.t)[0];
  const pos = E.fix || (last ? { lat: last.la, lon: last.lo, acc: last.ac } : null);
  const sms = `🆘 ALERTE OrienRun – ${r.nom} (${r.c.k}) à ${fmtHeure(Date.now())}${pos ? ` – position : ${gmapsUrl(pos.lat, pos.lon)} (±${Math.round(pos.acc || 0)} m)` : ""}\nOR1;S=${r.s};C=${r.c.k};R=${r.r};N=${r.nom.replace(/[;=]/g, " ")};T=${Math.round(Date.now() / 1000)}${pos ? `;A=${pos.lat.toFixed(5)},${pos.lon.toFixed(5)}` : ""}`;
  const m = openModal(`<h2 style="color:var(--red)">🆘 Alerte</h2><p id="aSt"><b>Envoi de l'alerte à ton enseignant…</b></p>
   <div class="lbl">Que se passe-t-il ?</div><div class="cchips" style="margin:6px 0 12px">${["Je suis perdu(e)", "Je suis blessé(e)", "Mon équipier est blessé", "Autre problème"].map(t => `<button class="btn small alt" data-t="${t}">${t}</button>`).join("")}</div>
   <div style="display:flex;flex-direction:column;gap:10px">${r.t ? `<a class="btn red" href="${smsHref(r.t, sms)}">📩 Envoyer aussi l'alerte par SMS</a><a class="btn alt" href="tel:${esc(r.t.replace(/[^\d+]/g, ""))}">📞 Appeler mon enseignant</a>` : ""}</div>
   <p class="muted">Reste où tu es si tu es perdu(e) ou blessé(e) : ton enseignant voit ta position.</p>`, { sticky: true });
  $$("[data-t]", m).forEach(b => b.onclick = () => { mutRun(r => newEvent(r, "alert", { txt: b.dataset.t })); flush(true); $$("[data-t]", m).forEach(x => x.classList.toggle("on", x === b)); b.className = "btn small red"; });
  flush(true).then(ok => { const st = $("#aSt", m); if (st) st.innerHTML = ok ? "<b style='color:var(--green)'>✓ Alerte reçue par le serveur. Ton enseignant est prévenu.</b>" : "<b style='color:var(--red)'>⚠ Pas de réseau internet : envoie l'alerte par SMS ou appelle ton enseignant !</b>"; });
}

// ---------- GPS + envoi ----------
function startGps() {
  if (E.watch != null || !navigator.geolocation) return;
  E.watch = navigator.geolocation.watchPosition(p => { E.fix = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() }; updStatus(); }, e => { if (e.code === 1) toast("Localisation refusée : ton enseignant ne peut pas te suivre", "ko"); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 });
}
function startLoop() {
  stopLoop();
  const r = loadRun(); const iv = Math.max(5, +r.i || 20) * 1000;
  const tick = () => { if (!E.active) return; const r = loadRun(); if (!r || !r.start || r.finish || r.abandon) return stopLoop(); if (E.fix && Date.now() - E.fix.t < iv * 2) { mutRun(r => newEvent(r, "pos")); } flush(); };
  E.timer = setInterval(tick, iv); setTimeout(tick, 1500);
  // un seul onglet envoie (si l'élève a ouvert l'appli plusieurs fois)
  try { E.chan = E.chan || new BroadcastChannel("orienrun"); E.chan.onmessage = m => { if (m.data?.take && m.data.id !== TAB_ID) { E.active = false; } }; E.chan.postMessage({ take: 1, id: TAB_ID }); E.active = true; } catch (e) {}
}
function stopLoop() { clearInterval(E.timer); E.timer = null; }
async function flush(force) {
  const r = loadRun(); if (!r || !r.a) { E.online = r?.a ? E.online : null; updStatus(); return false; }
  if (E.sending && !force) return false; E.sending = true;
  try {
    const ids = r.queue.slice(0, 150); const ev = ids.map(id => r.ev[id]).filter(Boolean).map(e => { const { code, ...x } = e; return x; });
    const j = await apiCall(r.a, "push", { s: r.s, r: r.r, nom: r.nom, cl: r.cl, c: r.c.k, sel: r.sel, ev }, 15000);
    const news = [], decs = [];
    mutRun(x => { x.queue = x.queue.filter(id => !ids.includes(id)); Object.entries(j.dec || {}).forEach(([id, v]) => { if (x.dec[id] !== v && x.ev[id]) decs.push({ e: x.ev[id], v }); x.dec[id] = v; }); (j.msgs || []).forEach(m => { if (!x.msgs.some(o => o.id === m.id)) { x.msgs.push(m); if (!(x.joinT && m.t && m.t < x.joinT - 10000)) news.push(m); else x.seenMsg[m.id] = 1; } }); });
    E.online = true; if ($("#targets")) renderRun();
    incoming(news, decs); renderLobbyMsgs(); flushOld();
    const left = loadRun().queue.length; if (left && ids.length === 150) setTimeout(() => flush(), 500);
    return true;
  } catch (e) { E.online = false; return false; }
  finally { E.sending = false; updStatus(); }
}
async function requestWake() { try { if ("wakeLock" in navigator && !E.wake) { E.wake = await navigator.wakeLock.request("screen"); E.wake.addEventListener("release", () => E.wake = null); } } catch (e) {} }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && $("#chrono")) { requestWake(); try { E.chan?.postMessage({ take: 1, id: TAB_ID }); } catch (e) {} E.active = true; renderRun(); flush(); } });
window.addEventListener("storage", e => { if (e.key === "or." + RUNKEY && $("#targets")) renderRun(); });
window.addEventListener("online", () => flush());

// ---------- carte sur le téléphone ----------
async function fetchMap() {
  const r = loadRun(); if (!r.c.mp || !r.a || E.mapProj) return;
  const cached = await DB.get("map:" + r.s); if (cached) { E.mapProj = cached; return; }
  try { const j = await apiCall(r.a, "getSession", { s: r.s }, 30000); if (j.data?.proj) { E.mapProj = j.data.proj; DB.set("map:" + r.s, j.data.proj); if (!$("#bMap") && $("#targets")) runScreen(); } } catch (e) {}
}
function showStudentMap() {
  const r = loadRun(), pr = E.mapProj;
  if (!pr) return toast("Carte pas encore téléchargée (il faut du réseau)", "ko");
  const k = pr.courses.find(x => x.k === r.c.k); if (k && !k.carte) return toast("Ton enseignant n'a pas partagé la carte", "ko");
  const course = k ? { ...k, ctrl: r.sel && k.mode !== "ordre" ? k.ctrl.filter(id => r.sel.includes(+pr.controls.find(c => c.id === id)?.n)) : k.ctrl } : null;
  let z = 1;
  const m = openModal(`<h2>Carte · ${esc(r.c.k)}</h2><div class="row" style="margin-bottom:8px"><button class="btn small alt" id="zp">＋</button><button class="btn small alt" id="zm">－</button></div><div style="overflow:auto;max-height:72vh;border-radius:12px;background:#ddd"><svg id="smap" viewBox="0 0 ${pr.map.w} ${pr.map.h}" style="width:100%;display:block">${mapSVG(pr, { course })}</svg></div>`, { wide: true });
  const set = () => $("#smap", m).style.width = (100 * z) + "%";
  $("#zp", m).onclick = () => { z = Math.min(5, z * 1.5); set(); }; $("#zm", m).onclick = () => { z = Math.max(1, z / 1.5); set(); };
}

// ---------- fin ----------
function endScreen() {
  const r = loadRun(); if (!r) return welcomeScreen();
  stopLoop(); clearInterval(E.tick);
  if (E.watch != null) { navigator.geolocation.clearWatch(E.watch); E.watch = null; }
  const a = anaS(r);
  $("#eleve").innerHTML = `<div class="ehead"><div class="flag"></div><h1>${r.abandon ? "Course arrêtée" : "Bravo !"}</h1></div>
   <div class="runcard"><div class="chrono">${fmtDur(a.temps)}</div><div class="sub" style="justify-content:center"><span>${a.found}/${a.total} balises${a.pending ? ` (+${a.pending} à valider)` : ""}</span>${r.c.m === "score" && fbOn(r) ? `<span>· ${a.score} pts${a.penal ? ` (−${a.penal} retard)` : ""}</span>` : ""}${a.dist ? `<span>· ${fmtDist(a.dist)}</span>` : ""}</div></div>
   <div class="panel"><h2>Mes temps</h2><div class="tw"><table class="t"><thead><tr><th>Poste</th><th class="num">Temps inter.</th><th class="num">Cumul</th></tr></thead><tbody>${a.legs.map(l => `<tr><td><b>${esc(l.de)} → ${esc(l.n)}</b>${fbOn(r) && !l.ordre ? ' <span class="chip ko">ordre</span>' : ""}${r.dec[l.id] === true ? ' <span class="chip ok">✓ juste</span>' : ""}${l.status === "attente" && fbOn(r) ? ' <span class="chip wait">à valider</span>' : ""}</td><td class="num">${fmtDur(l.split)}</td><td class="num">${fmtDur(l.cumul)}</td></tr>`).join("")}</tbody></table></div>
    ${a.manquants.length ? `<p><b>Balises manquantes :</b> ${a.manquants.join(", ")}</p>` : ""}</div>
   <div class="panel"><p id="endSync" class="muted"></p><div style="display:flex;flex-direction:column;gap:10px">
    <button class="btn" id="eAna">🗺 Revoir mon itinéraire</button><button class="btn alt" id="eBil">📄 Ma fiche bilan (PDF)</button>
    <button class="btn or" id="eSms">📩 Envoyer mes résultats par SMS</button><button class="btn alt" id="eRetry">↻ Renvoyer par internet</button><button class="btn ghost" id="eNew">Nouvelle course</button></div></div>`;
  const upd = () => { const r = loadRun(); if (!$("#endSync")) return; $("#endSync").innerHTML = !r.a ? "Pas de connexion à la tablette prévue : <b>envoie tes résultats par SMS</b>." : r.queue.length ? `⚠ ${r.queue.length} donnée(s) pas encore reçue(s) par la tablette. Reste près du réseau ou envoie par SMS.` : "<b style='color:var(--green)'>✓ Résultats reçus par la tablette de l'enseignant.</b>"; };
  upd();
  const getTrace = async () => {
    const r = loadRun(); if (!r.a) throw new Error("Pas de connexion à la tablette prévue");
    await flush(true);
    let proj = E.mapProj || await DB.get("map:" + r.s); if (!proj) { const j = await apiCall(r.a, "getSession", { s: r.s }, 30000); proj = j.data?.proj; if (proj) DB.set("map:" + r.s, proj); }
    const t = await apiCall(r.a, "trace", { s: r.s, r: r.r }, 20000);
    return { proj, geo: t.geo, R: { ...r, c: r.c.k, ev: r.ev }, course: r.c, a: anaS(r), lesson: r.u };
  };
  $("#eAna").onclick = async () => { try { openAnalysis(await getTrace()); } catch (e) { toast(e.message, "ko"); } };
  $("#eBil").onclick = async () => { try { printBilans([await getTrace()]); } catch (e) { toast(e.message, "ko"); } };
  $("#eSms").onclick = () => { location.href = smsHref(r.t, smsResultat(smsRunData(loadRun()))); mutRun(r => r.smsSent = Date.now()); };
  $("#eRetry").onclick = async () => { await flush(true); upd(); };
  $("#eNew").onclick = () => { const r = loadRun(); if (r.queue.length && !r.smsSent && !confirm("Tes résultats ne sont pas encore arrivés. Continuer quand même ?")) return; mutRun(r => r.done = true); welcomeScreen(); };
  if (r.queue.length) flush(true).then(upd);
  clearInterval(E.endPoll); if (r.a && Date.now() - r.start < 4 * 3600000) E.endPoll = setInterval(() => { const x = loadRun(); if (!x || x.done || !$("#endSync")) return clearInterval(E.endPoll); flush(true).then(upd); }, 20000);
  const pend = (r.msgs || []).filter(m => !r.seenMsg[m.id] && m.type !== "recall"); if (pend.length) msgPopup(pend[pend.length - 1]);
}

// ---------- messages, rappel général, décisions de l'enseignant ----------
function sbeep(freqs) { try { const c = new (window.AudioContext || window.webkitAudioContext)(); freqs.forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(.25, c.currentTime + i * .18); o.start(c.currentTime + i * .18); o.stop(c.currentTime + i * .18 + .15); }); } catch (e) {} }
function readMsg(mid) { mutRun(r => { if (!r.seenMsg[mid]) { r.seenMsg[mid] = 1; newEvent(r, "lu", { mid }); } }); flush(); }
function incoming(news, decs) {
  decs.forEach(({ e, v }) => { if (e.k !== "punch") return; if (v === false) feedback(false, `Balise ${e.n} : FAUSSE ✕`, "Ton enseignant t'indique que ce n'est pas la bonne balise. Reprends ta carte !", "", true); else feedback(true, `Balise ${e.n} : JUSTE ✓`, "Confirmé par ton enseignant. Continue !", "", true); });
  if (decs.length && $("#eSms")) endScreen();
  news.forEach(m => {
    if (m.type === "recall") { const r = loadRun(); if (r?.hereT && Date.now() - r.hereT < 30 * 60000) return; showRecall(m); }
    else { navigator.vibrate?.([200, 100, 200, 100, 200]); sbeep([660, 880]); if (!$("#targets")) msgPopup(m); }
  });
}
function msgPopup(m) {
  const d = openModal(`<h2>💬 Message de ton enseignant</h2><p style="font-size:1.3rem;font-weight:700">${esc(m.txt)}</p><button class="btn or" id="mOkB" style="width:100%">OK, j'ai lu</button>`, { sticky: true });
  $("#mOkB", d).onclick = () => { readMsg(m.id); d.close(); };
}
function showRecall(m) {
  $$("#recallOv").forEach(x => x.remove());
  navigator.vibrate?.([800, 200, 800, 200, 800]); sbeep([880, 660, 880, 660, 880]);
  const d = document.createElement("div"); d.id = "recallOv"; d.className = "modal"; d.style.alignItems = "center"; d.style.zIndex = 160;
  d.innerHTML = `<div class="sheet" style="max-width:460px;background:var(--red);color:#fff;text-align:center;border-radius:24px"><div style="font-size:3.5rem">📢</div><h2 style="margin:0">Retour au point !</h2><p style="font-size:1.25rem;font-weight:700">${esc(m.txt)}</p>
    <div style="display:flex;flex-direction:column;gap:10px"><button class="btn alt" id="rcOn" style="min-height:58px">🏃 J'ai compris, j'arrive</button><button class="btn green" id="rcHere" style="min-height:64px;font-size:1.2rem">✅ J'y suis</button></div></div>`;
  document.body.appendChild(d);
  const banner = () => { $$("#recallBan").forEach(x => x.remove()); const b = document.createElement("div"); b.id = "recallBan"; b.style.cssText = "position:fixed;left:10px;right:10px;top:calc(8px + env(safe-area-inset-top));z-index:90;background:var(--red);color:#fff;border-radius:16px;padding:10px 12px;display:flex;gap:10px;align-items:center;font-weight:700;box-shadow:0 6px 20px #0004";
    b.innerHTML = `<span style="flex:1">📢 Retour au point demandé</span><button class="btn green small" id="rcHere2">✅ J'y suis</button>`; document.body.appendChild(b); $("#rcHere2").onclick = here; };
  const here = () => { mutRun(r => { r.hereT = Date.now(); r.seenMsg[m.id] = 1; newEvent(r, "lu", { mid: m.id }); newEvent(r, "here", { mid: m.id }); }); flush(true); d.remove(); $$("#recallBan").forEach(x => x.remove()); toast("✓ Ton enseignant sait que tu es au point de retour", "ok"); };
  $("#rcOn", d).onclick = () => { mutRun(r => { if (!r.seenMsg[m.id]) { r.seenMsg[m.id] = 1; newEvent(r, "lu", { mid: m.id }); } }); flush(true); d.remove(); banner(); };
  $("#rcHere", d).onclick = here;
}

// Sans retour immédiat (option du parcours) : l'élève voit « enregistrée » tant que l'enseignant n'a pas notifié juste / fausse
const fbOn = r => !!r.c.fb;
function dispRun(r) { if (fbOn(r)) return r; const ev = {}; Object.values(r.ev).forEach(e => ev[e.id] = e.k === "punch" && r.dec[e.id] !== false ? { ...e, ok: true } : e); return { ...r, ev }; }
const anaS = r => analyseRun(dispRun(r), r.c, null, r.dec);

// Départ déclenché par la balise DÉPART scannée avec l'appareil photo
function startFromCode(code, via) {
  const r = loadRun(); if (!r || r.start) return; const c = r.c;
  if (codeHash(r.z, c.dn, code) !== c.hS) return toast("Code de départ incorrect", "ko");
  const l = c.prep && r.prepStart ? c.prep * 60000 - (Date.now() - r.prepStart) : 0;
  if (l > 0) return toast(`Encore ${fmtDur(l)} de préparation avant de partir`, "ko");
  mutRun(r => { r.start = Date.now(); newEvent(r, "start", { via }); }); stopLobby(); runScreen(); flush();
}
