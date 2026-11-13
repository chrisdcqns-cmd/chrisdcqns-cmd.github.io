// ================= LEÇON LIVE =================
let S = null, pollTimer = null, liveMap = null, liveLayer = null, liveTick = null, lastSync = null, syncErr = null;
const COLORS = ["#e63946", "#1f77b4", "#2a9d6f", "#f4a261", "#8a4fd8", "#e76f51", "#118ab2", "#d62598", "#6a994e", "#ff7f0e", "#3d5a80", "#bc4749", "#0f9d9a", "#b5179e", "#7f5539", "#4361ee"];
const rColor = r => COLORS[hash32(r) % COLORS.length];
const initials = n => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");

function compactCourse(k) {
  const ctrl = P.controls; const dep = ctrlById(k.depart), fin = ctrlById(k.arrivee);
  const pts = k.mode === "score" || k.ptsOn, bo = k.bonus || [];
  return { id: k.id, k: k.k, nm: k.nom, m: k.mode, v: k.valid, tm: k.tm, pen: k.pen, ch: k.choix ? 1 : 0, nb: k.nb, ds: k.desc !== false ? 1 : 0, fb: k.fb ? 1 : 0, mp: k.carte !== false ? 1 : 0,
    so: k.mode === "ordre" && k.so ? 1 : 0, dm: k.dm || "libre", prep: k.prep || 0, rk: k.rk || "auto", hr: S?.hr || null,
    dLa: dep?.lat != null ? +dep.lat.toFixed(6) : undefined, dLo: dep?.lon != null ? +dep.lon.toFixed(6) : undefined,
    b: k.ctrl.map(id => ctrlById(id)).filter(Boolean).map(c => ({ n: +c.n, h: codeHash(P.salt, c.n, c.code), p: pts ? (k.pts[c.id] ?? 10) : undefined, x: bo.includes(c.id) ? 1 : undefined, d: k.desc !== false ? c.desc || undefined : undefined })),
    dn: dep?.n, hS: dep ? codeHash(P.salt, dep.n, dep.code) : undefined, fn: fin?.n, hF: fin ? codeHash(P.salt, fin.n, fin.code) : undefined, depId: k.depart, finId: k.arrivee };
}
const goPayload = (k) => ({ s: S.code, a: shortApi(apiUrl()), t: CFG.tel, i: CFG.interval, z: P.salt, u: P.nom, c: compactCourse(k) });
const goUrl = k => `${appUrl()}#go=${b64e(S.snap?.[k.k] ? goFromSnap(S.snap[k.k]) : goPayload(k))}`;
const eleveUrl = () => `${appUrl()}#eleve`;
const sessionCourses = () => P.courses.filter(k => S.courses.includes(k.id) || (S.snap && S.snap[k.k] && S.snap[k.k].id === k.id));
const courseOf = r => { const snap = (S.snap || {})[r.c]; if (snap) return snap; const k = P.courses.find(x => x.k === r.c); return k ? compactCourse(k) : null; };
const goFromSnap = c => ({ s: S.code, a: shortApi(apiUrl()), t: CFG.tel, i: CFG.interval, z: S.salt || P.salt, u: P.nom, c });
function publicProject() { // carte + postes SANS codes ni GPS (pour l'affichage sur les téléphones)
  return { map: P.map, features: P.features, controls: P.controls.map(c => ({ id: c.id, n: c.n, type: c.type, x: c.x, y: c.y, lab: c.lab })), courses: sessionCourses().map(k => ({ id: k.id, k: k.k, mode: k.mode, ctrl: k.ctrl, bonus: k.bonus || [], depart: k.depart, arrivee: k.arrivee, carte: k.carte !== false })) };
}
async function saveS() { if (!S) return; await DB.set("session:" + S.code, S); const L = (await DB.get("sessions")) || []; if (!L.some(x => x.code === S.code)) { L.unshift({ code: S.code, nom: S.nom, date: S.date }); await DB.set("sessions", L); } }
async function resumeSession() { const c = LS.get("curSession", null); if (c && !S) { S = await DB.get("session:" + c); if (S && S.active) startPolling(); } }

function viewSeance(v) {
  if (!S || !S.active) {
    v.innerHTML = `<div class="pmain"><div class="panel" style="margin-top:0"><h2>Lancer une leçon</h2>
     <p class="muted">La tablette de contrôle reçoit en direct la position des élèves (toutes les ${CFG.interval} s), leurs balises, leurs temps intermédiaires et les alertes. ${apiUrl() ? "" : "<b style='color:var(--red)'>Serveur non configuré (⚙ Réglages) : les élèves pourront courir, mais tu ne recevras leurs résultats que par SMS.</b>"}</p>
     <div class="field"><label>Nom de la leçon</label><input class="inp" id="sNom" value="${esc(new Date().toLocaleDateString("fr-FR"))} – ${esc(P.nom)}"></div>
     <div class="grid2"><div class="field"><label>Heure limite de retour (facultatif)</label><input class="inp" id="sHr" type="time"><small class="muted">Tous les élèves voient le compte à rebours et sont prévenus 5 min avant.</small></div></div>
     <div class="lbl">Classes présentes (appel + noms à choisir sur le téléphone)</div><div class="cchips" id="sCls" style="margin:6px 0 14px"><span class="muted">…</span></div>
     <div class="lbl">Parcours proposés</div><div class="cchips" style="margin:6px 0 14px">${P.courses.map(k => `<label class="chip" style="padding:8px 12px"><input type="checkbox" value="${k.id}" checked> ${esc(k.k)} – ${esc(k.nom)}</label>`).join("") || `<span class="muted">Crée d'abord un parcours.</span>`}</div>
     <div class="row"><button class="btn or" id="sGo" ${P.courses.length ? "" : "disabled"}>📡 Lancer la leçon</button><button class="btn ghost" id="sPerm">🔳 QR permanent « élèves »</button></div></div>
     ${S && !S.active ? `<div class="panel"><b>Dernière leçon : ${esc(S.nom)}</b> <button class="btn small alt" id="sReopen">Rouvrir</button></div>` : ""}</div>`;
    $("#sGo") && ($("#sGo").onclick = async () => {
      const ids = $$("input[type=checkbox]:checked:not([name=cls])", v).map(i => i.value); const cls = $$("input[name=cls]:checked", v).map(i => i.value); if (!ids.length) return toast("Choisis au moins un parcours", "ko");
      let hr = null; const hv = $("#sHr").value; if (hv) { const [h, mi] = hv.split(":").map(Number); const d = new Date(); d.setHours(h, mi, 0, 0); if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1); hr = d.getTime(); }
      S = { code: randCode(4), nom: $("#sNom").value.trim(), date: Date.now(), courses: ids, runners: {}, dec: {}, msgs: [], since: 0, active: true, ack: {}, hr, salt: P.salt };
      S.snap = Object.fromEntries(sessionCourses().map(k => [k.k, compactCourse(k)]));
      const C = await getClasses(); S.cls = cls; S.appel = { list: cls.flatMap(c => (C[c] || []).map(nom => ({ nom, cl: c, present: !dzO(c, nom) }))) };
      LS.set("curSession", S.code); await saveS(); await publishSession(); startPolling(); setPTab("seance");
    });
    $("#sPerm").onclick = printPermQR;
    getClasses().then(C => { const b = $("#sCls"); if (!b) return; const n = Object.keys(C).sort(); b.innerHTML = n.length ? n.map(c => `<label class="chip" style="padding:8px 12px"><input type="checkbox" name="cls" value="${esc(c)}"> ${esc(c)} (${C[c].length})</label>`).join("") : '<span class="muted">Aucune liste : ajoute-les dans ⚙ Réglages → Listes de classe (facultatif).</span>'; });
    $("#sReopen") && ($("#sReopen").onclick = async () => { S.active = true; await saveS(); startPolling(); setPTab("seance"); });
    return;
  }
  v.innerHTML = `<div class="pmain" style="padding-bottom:10px">
    <div class="row" style="margin-bottom:10px"><span class="chip or" style="font-size:1rem">Leçon <b>${esc(S.code)}</b></span><b>${esc(S.nom)}</b>${S.hr ? `<span class="chip wait">⏰ retour ${new Date(S.hr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>` : ""}<span id="syncInfo" class="muted"></span><span class="grow"></span>
     ${apiUrl() && !S.published ? `<button class="btn small red" id="sPub">⚠ Publier en ligne</button>` : ""}<button class="btn small or" id="sQr">🔳 QR de départ</button><button class="btn small ghost" id="sUpd" title="Après avoir modifié un parcours pendant la leçon">↻ Appliquer mes modifs</button><button class="btn small alt" id="sSms">✉ Importer SMS</button><button class="btn small alt" id="sAppel">📋 Appel</button><button class="btn small red" id="sRecall">📢 Rappel général</button><button class="btn small alt" id="sMsg">💬 Message à tous</button><button class="btn small red" id="sEnd">Terminer</button></div>
    <div id="alerts"></div><div id="recallBox"></div>
    <div class="live"><div class="runners" id="runners"></div>
     <div class="mapwrap" id="liveWrap"><svg class="map" id="livesvg" xmlns="http://www.w3.org/2000/svg"></svg><div id="liveSat" class="hidden" style="position:absolute;inset:0"></div>
      <div class="zoombtns"><button id="lzin">+</button><button id="lzout">−</button><button id="lzfit" style="font-size:.9rem">⤢</button></div>
      <div class="mapbar"><button class="btn small alt" id="lBg">🛰 Satellite</button><label class="info"><input type="checkbox" id="lTr" ${S.traces !== false ? "checked" : ""}> traces</label><span class="info" id="lInfo"></span></div></div></div></div>`;
  $("#sPub") && ($("#sPub").onclick = async () => { await publishSession(); setPTab("seance"); });
  $("#sQr").onclick = showStartQRs;
  $("#sUpd").onclick = async () => { if (!confirm("Appliquer à cette leçon les modifications faites dans l'onglet Parcours ?\nLes élèves déjà partis gardent leur ancien parcours sur leur téléphone.")) return; S.snap = Object.fromEntries(sessionCourses().map(k => [k.k, compactCourse(k)])); await saveS(); await publishSession(); renderLive(); toast("Parcours de la leçon mis à jour ✓", "ok"); }; $("#sSms").onclick = importSMS; $("#sRecall").onclick = startRecall; $("#sAppel").onclick = openAppel; $("#sMsg").onclick = () => sendMsg("*");
  $("#sEnd").onclick = async () => { const ap = S.appel?.list?.length ? appelSummary() : null; if (ap && ap.manquent.length && !confirm(`⚠ Pas encore rentré(s) : ${ap.manquent.join(", ")}.\nTerminer quand même la leçon ?`)) return; if (!confirm("Terminer la leçon ? (les résultats restent dans l'onglet Résultats)")) return; S.active = false; await saveS(); stopPolling(); if (apiUrl()) apiCall(apiUrl(), "close", { teacher: tpw(), s: S.code }).catch(() => {}); LS.set("curSession", null); setPTab("resultats"); };
  $("#lTr").onchange = e => { S.traces = e.target.checked; renderLive(); };
  $("#lBg").onclick = toggleSat;
  ED.lview = null;
  const svg = $("#livesvg");
  // déplacement/zoom simples
  let st = null; svg.addEventListener("pointerdown", e => { st = { x: e.clientX, y: e.clientY, v: { ...liveView() } }; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener("pointermove", e => { if (!st) return; const r = svg.getBoundingClientRect(), sc = Math.max(st.v.w / r.width, st.v.h / r.height); ED.lview = { ...st.v, x: st.v.x - (e.clientX - st.x) * sc, y: st.v.y - (e.clientY - st.y) * sc }; svg.setAttribute("viewBox", `${ED.lview.x} ${ED.lview.y} ${ED.lview.w} ${ED.lview.h}`); });
  svg.addEventListener("pointerup", e => { if (st && Math.hypot(e.clientX - st.x, e.clientY - st.y) < 6) { const g = e.target.closest("[data-r]"); if (g) runnerDetail(g.dataset.r); } st = null; });
  svg.addEventListener("wheel", e => { e.preventDefault(); lzoom(e.deltaY > 0 ? 1.15 : 1 / 1.15); }, { passive: false });
  $("#lzin").onclick = () => lzoom(1 / 1.4); $("#lzout").onclick = () => lzoom(1.4); $("#lzfit").onclick = () => { ED.lview = null; renderLive(); };
  renderLive();
}
const liveView = () => ED.lview || { x: -P.map.w * .02, y: -P.map.h * .02, w: P.map.w * 1.04, h: P.map.h * 1.04 };
function lzoom(f) { const v = liveView(), cx = v.x + v.w / 2, cy = v.y + v.h / 2; ED.lview = { x: cx - v.w * f / 2, y: cy - v.h * f / 2, w: v.w * f, h: v.h * f }; $("#livesvg").setAttribute("viewBox", `${ED.lview.x} ${ED.lview.y} ${ED.lview.w} ${ED.lview.h}`); }

async function publishSession() {
  if (!apiUrl()) return;
  try { await apiCall(apiUrl(), "publish", { teacher: tpw(), s: S.code, data: { nom: S.nom, salt: P.salt, hr: S.hr, gos: Object.fromEntries(Object.entries(S.snap || {}).map(([kc, c]) => [kc, goFromSnap(c)])), proj: publicProject(), geo: calibPoints(), eleves: Object.fromEntries((S.cls || []).map(c => [c, [...new Set((S.appel?.list || []).filter(e => e.cl === c).map(e => e.nom))]])) } }, 45000); S.published = true; saveS(); toast("Leçon publiée en ligne ✓", "ok"); }
  catch (e) { toast("Publication impossible : " + e.message + " (les élèves pourront quand même courir)", "ko"); }
}
function startPolling() { stopPolling(); const go = async () => { await pollOnce(); if (ptab === "seance") renderLive(); }; go(); pollTimer = setInterval(go, Math.max(3, CFG.poll) * 1000); liveTick = setInterval(() => { if (ptab === "seance") { renderRunnerList(); } }, 1000); }
function stopPolling() { clearInterval(pollTimer); clearInterval(liveTick); pollTimer = liveTick = null; }
async function pollOnce() {
  if (!S || !apiUrl()) return;
  try {
    const j = await apiCall(apiUrl(), "poll", { teacher: tpw(), s: S.code, since: S.since || 0 }, 20000);
    (j.rows || []).forEach(mergeRow); S.since = j.since ?? S.since; lastSync = Date.now(); syncErr = null; await saveS();
    checkAlerts();
  } catch (e) { syncErr = e.message; }
}
function runnerRec(r, info = {}) {
  const R = S.runners[r] || (S.runners[r] = { r, nom: info.nom || "?", cl: info.cl || "", c: info.c || "", sel: info.sel || null, ev: {} });
  if (info.nom) R.nom = info.nom; if (info.cl) R.cl = info.cl; if (info.c) R.c = info.c; if (info.sel && info.sel.length) R.sel = info.sel;
  return R;
}
function mergeRow(row) { const R = runnerRec(row.r, row); const e = row.d || {}; e.k = row.k; e.t = +row.t; e.rt = row.rt ? +row.rt : undefined; e.id = e.id || `${row.r}-${row.k}-${row.t}`; R.ev[e.id] = e; }
function checkAlerts() {
  const al = []; Object.values(S.runners).forEach(R => { const L = Object.values(R.ev).filter(e => e.k === "alert" && !S.ack[e.id]).sort((a, b) => a.t - b.t); if (L.length) al.push({ R, e: { ...L[L.length - 1], txt: L.map(x => x.txt).filter(Boolean).pop(), first: L[0].t }, ids: L.map(x => x.id) }); });
  const b = $("#alertBdg"); if (b) { b.textContent = al.length; b.classList.toggle("hidden", !al.length); }
  S._beeped = S._beeped || {}; const fresh = al.flatMap(a => a.ids).filter(id => !S._beeped[id]);
  if (fresh.length) { fresh.forEach(id => S._beeped[id] = 1); beep(); navigator.vibrate?.([400, 200, 400]); }
  return al;
}
function beep() { try { const c = new (window.AudioContext || window.webkitAudioContext)(); [0, .35, .7].forEach(t => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880; o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(.3, c.currentTime + t); o.start(c.currentTime + t); o.stop(c.currentTime + t + .22); }); } catch (e) {} }
function renderLive() {
  if (!$("#runners")) return;
  renderRunnerList();
  const al = checkAlerts();
  $("#alerts").innerHTML = al.map(({ R, e, ids }) => `<div class="alertbar" style="margin-bottom:8px">🆘 ALERTE — ${esc(R.nom)} (${esc(R.c)}) à ${fmtHeure(e.first)}${e.la != null ? ` · <a style="color:#fff" target="_blank" href="${gmapsUrl(e.la, e.lo)}">voir la position</a>` : ""}${e.txt ? " · « " + esc(e.txt) + " »" : ""}<span class="grow"></span><button class="btn small alt" data-det="${R.r}">Détails</button><button class="btn small sun" data-ack="${ids.join(",")}">Pris en charge</button></div>`).join("");
  const imm = Object.values(S.runners).map(R => ({ R, x: immobility(R, runnerSummary(R)) })).filter(o => o.x && (S.immAck || {})[o.R.r] !== o.x.since);
  $("#alerts").innerHTML += imm.map(({ R, x }) => `<div class="alertbar" style="margin-bottom:8px;background:#f4a261;color:#14213d">🟠 ${esc(R.nom)} (${esc(R.c)}) ne bouge plus depuis <b>${fmtDur(x.dur)}</b>, loin des balises · <a target="_blank" href="${gmapsUrl(x.la, x.lo)}">voir la position</a><span class="grow"></span><button class="btn small alt" data-det2="${R.r}">Détails</button><button class="btn small" data-imm="${R.r}" data-since="${x.since}">Vu</button></div>`).join("");
  S._immBeep = S._immBeep || {}; imm.forEach(({ R, x }) => { if (S._immBeep[R.r] !== x.since) { S._immBeep[R.r] = x.since; beep(); } });
  $$("[data-imm]").forEach(b => b.onclick = () => { S.immAck = S.immAck || {}; S.immAck[b.dataset.imm] = +b.dataset.since; saveS(); renderLive(); });
  $$("[data-det2]").forEach(b => b.onclick = () => runnerDetail(b.dataset.det2));
  const sa = $("#sAppel"); if (sa && S.appel?.list?.length) { const s = appelSummary(); sa.innerHTML = `📋 Appel ${s.rentres}/${s.partis}${s.manquent.length && s.rentres ? " ⚠" : ""}`; }
  $("#appelModal")?._draw?.();
  const rb = $("#recallBox"); if (rb) { rb.innerHTML = recallPanel(); $("#rcAgain") && ($("#rcAgain").onclick = () => { const t0 = S.recall.t; sendMsg("*", S.recall.txt, "recall"); S.recall.t = t0; saveS(); }); $("#rcEnd") && ($("#rcEnd").onclick = () => { S.recall = null; saveS(); renderLive(); }); $$("[data-rr]", rb).forEach(b => b.onclick = () => runnerDetail(b.dataset.rr)); }
  $$("[data-ack]").forEach(b => b.onclick = () => { b.dataset.ack.split(",").forEach(id => S.ack[id] = Date.now()); saveS(); renderLive(); });
  $$("[data-det]", $("#alerts")).forEach(b => b.onclick = () => runnerDetail(b.dataset.det));
  // carte
  const svg = $("#livesvg"), v = liveView(); svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
  const g = georef(), mm = mapMM(P);
  const proj = { ...P, controls: P.controls.filter(c => c.type !== "C" || sessionCourses().some(k => k.ctrl.includes(c.id))) };
  let layer = "";
  if (g) Object.values(S.runners).forEach(R => {
    const pts = Object.values(R.ev).filter(e => e.la != null).sort((a, b) => a.t - b.t); if (!pts.length) return;
    const col = rColor(R.r), xy = pts.map(e => g.toPx(e.la, e.lo)), last = xy[xy.length - 1], le = pts[pts.length - 1];
    const stale = Date.now() - (le.rt || le.t) > (CFG.interval * 3 + 30) * 1000 && !Object.values(R.ev).some(e => e.k === "finish");
    if (S.traces !== false && xy.length > 1) layer += `<path d="${polyD(xy.map(p => [p.x, p.y]))}" fill="none" stroke="${col}" stroke-width="${mm * .6}" stroke-opacity=".75" stroke-linejoin="round"/>`;
    const alert = Object.values(R.ev).some(e => e.k === "alert" && !S.ack[e.id]);
    layer += `<g data-r="${R.r}" style="cursor:pointer">${alert ? `<circle cx="${last.x}" cy="${last.y}" r="${mm * 5}" fill="none" stroke="#e63946" stroke-width="${mm}"><animate attributeName="r" values="${mm * 3};${mm * 7};${mm * 3}" dur="1.2s" repeatCount="indefinite"/></circle>` : ""}<circle cx="${last.x}" cy="${last.y}" r="${mm * 2.6}" fill="${stale ? "#999" : col}" stroke="#fff" stroke-width="${mm * .6}"/><text x="${last.x}" y="${last.y}" font-size="${mm * 2.4}" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-weight="700">${esc(initials(R.nom))}</text></g>`;
  });
  svg.innerHTML = mapSVG(proj, {}) + layer;
  $("#lInfo").textContent = g ? `${Object.keys(S.runners).length} élève(s)` : "Carte non calée : ajoute 2 points GPS ou utilise 🛰";
  if (liveMap) updateSat();
}
function runnerSummary(R) { return analyseRun(R, courseOf(R), P, S.dec, S.ack || {}, { scanMax: CFG.scanMax }); }
function renderRunnerList() {
  const box = $("#runners"); if (!box) return;
  const list = Object.values(S.runners).map(R => ({ R, a: runnerSummary(R) }));
  const order = { ALERTE: 0, "En course": 1, "À valider": 2, Inscrit: 3, PM: 4, OK: 5, Abandon: 6 };
  list.sort((x, y) => (order[x.a.statut] ?? 9) - (order[y.a.statut] ?? 9) || x.R.nom.localeCompare(y.R.nom));
  const si = $("#syncInfo"); if (si) si.innerHTML = !apiUrl() ? "· hors ligne (SMS seulement)" : syncErr ? `· <b style="color:var(--red)">⚠ ${esc(syncErr)}</b>` : lastSync ? `· synchro il y a ${Math.round((Date.now() - lastSync) / 1000)} s` : "· connexion…";
  box.innerHTML = list.length ? list.map(({ R, a }) => {
    const stale = a.statut === "En course" && a.lastSeen && Date.now() - a.lastSeen > (CFG.interval * 3 + 30) * 1000;
    const chip = { OK: "ok", PM: "ko", ALERTE: "ko", Abandon: "ko", "À valider": "wait", "En course": "or" }[a.statut] || "";
    return `<button class="runner ${a.statut === "ALERTE" ? "alert" : ""} ${stale ? "stale" : ""}" data-r="${R.r}"><span class="dot" style="background:${rColor(R.r)}"></span><span><span class="nm">${esc(R.nom)}</span><br><small class="muted">${esc(R.cl)} · ${esc(R.c)} · <span class="chip ${chip}">${a.statut}</span> ${a.found}/${a.total}${a.pending ? ` · <b style="color:#a36b00">${a.pending} à valider</b>` : ""}${a.bonusFound ? ` · ★${a.bonusFound}` : ""}${a.erreurs ? ` · ${a.erreurs} erreur(s)` : ""}${a.hasPts ? ` · ${a.score} pts` : ""}${a.suspects ? ` · <b style="color:var(--red)">⚠ ${a.suspects} scan(s) suspect(s)</b>` : ""}${a.retard && !a.finish ? ` · <b style="color:var(--red)">⏰ retard ${fmtDur(a.retard)}</b>` : a.deadline && !a.finish && a.start ? ` · ⏳ ${fmtDur(a.deadline - Date.now())}` : ""}${S.recall && Object.values(R.ev).some(e => e.k === "here" && e.t >= S.recall.t - 1000) ? ' · <span class="chip ok">✅ au point</span>' : ""}${(() => { const x = immobility(R, a); return x ? ` · <b style="color:#b85c00">🟠 immobile ${fmtDur(x.dur)}</b>` : ""; })()}</small></span><span class="chr">${fmtDur(a.temps)}<br><small class="muted" style="font-size:.7rem;font-family:Barlow">${a.legs.length ? "dernier poste " + esc(a.legs[a.legs.length - 1].n) : ""}</small></span></button>`;
  }).join("") : `<div class="panel" style="margin:0"><b>En attente des élèves…</b><p class="muted">Montre le QR de départ du parcours aux élèves (bouton 🔳). Ils le scannent avec l'appareil photo de leur téléphone, entrent leur nom et partent.</p></div>`;
  $$(".runner", box).forEach(b => b.onclick = () => runnerDetail(b.dataset.r));
}
function showStartQRs() {
  const ks = sessionCourses();
  const m = openModal(`<h2>QR codes de départ</h2><p class="muted">Les élèves scannent le QR de leur parcours avec l'appareil photo du téléphone : l'appli s'ouvre directement sur ce parcours, reliée à ta tablette.</p>
   <div class="grid2">${ks.map(k => `<div class="panel" style="text-align:center;margin-top:0"><h2 style="margin:0">${esc(k.k)}</h2><div class="muted">${esc(k.nom)}</div><div style="max-width:300px;margin:8px auto">${QR.svg(goUrl(k), { ecl: "L" })}</div><button class="btn small ghost" data-cp="${k.id}">Copier le lien</button></div>`).join("")}</div>
   <div class="row" style="margin-top:12px"><button class="btn" id="qPrint">🖨 Imprimer (affiche de départ)</button></div>`, { wide: true });
  $$("[data-cp]", m).forEach(b => b.onclick = () => { navigator.clipboard?.writeText(goUrl(P.courses.find(k => k.id === b.dataset.cp))); toast("Lien copié"); });
  $("#qPrint", m).onclick = () => printWin("QR de départ", ks.map(k => `<div class="pg"><h1>${esc(k.k)} — ${esc(k.nom)}</h1><p>${esc(modeNom[k.mode])} · leçon ${esc(S.code)}</p>${QR.svg(goUrl(k), { ecl: "L" })}<p>1. Scanne avec l'appareil photo · 2. Entre ton nom · 3. Garde l'écran allumé · 4. Pars !</p></div>`).join(""), `.pg{text-align:center;page-break-after:always;padding-top:15mm}.pg svg{width:150mm;height:150mm}h1{font-size:32pt}p{font-size:14pt}`);
}
function importSMS() {
  const m = openModal(`<h2>Importer des SMS</h2><p class="muted">Quand un élève n'a pas de réseau internet, son téléphone prépare un SMS commençant par <b>OR1;</b>. Copie-colle ici le ou les SMS reçus.</p><textarea class="inp" id="smsT" style="min-height:160px" placeholder="OR1;S=…;C=P1;R=…;N=…;P=31+135,35+340;F=1351"></textarea><div class="row" style="margin-top:10px"><button class="btn or" id="smsGo">Importer</button><span id="smsR" class="muted"></span></div>`);
  $("#smsGo", m).onclick = () => { const L = parseSMS($("#smsT", m).value); if (!L.length) { $("#smsR", m).textContent = "Aucun message OR1 reconnu"; return; }
    L.forEach(x => { const R = runnerRec(x.r, { nom: x.nom, cl: x.cl, c: x.c }); x.ev.forEach(e => { if (!Object.values(R.ev).some(o => o.k === e.k && Math.abs(o.t - e.t) < 3000 && (o.n ?? null) === (e.n ?? null))) R.ev[e.id] = e; }); });
    saveS(); renderLive(); m.close(); toast(L.length + " message(s) importé(s) ✓", "ok"); };
}
function sendMsg(r, txt, type) {
  if (txt == null) txt = prompt(r === "*" ? "Message pour tous les élèves :" : "Message pour " + S.runners[r]?.nom + " :", r === "*" ? "Retour au point de départ, merci !" : "");
  if (!txt) return;
  const msg = { id: uid(6), to: r, txt, t: Date.now(), type: type || "msg" }; S.msgs.push(msg); if (type === "recall") S.recall = { id: msg.id, t: msg.t, txt }; saveS();
  if (apiUrl()) apiCall(apiUrl(), "msg", { teacher: tpw(), s: S.code, ...msg }).then(() => toast(type === "recall" ? "Rappel envoyé à tous ✓" : "Message envoyé ✓", "ok")).catch(e => toast(e.message, "ko")); else toast("Pas de serveur : message non envoyé", "ko");
  if (ptab === "seance") renderLive();
}
async function decide(R, evId, ok) {
  S.dec[evId] = ok; saveS();
  if (apiUrl()) try { await apiCall(apiUrl(), "decide", { teacher: tpw(), s: S.code, r: R.r, id: evId, ok }); toast(`Notification envoyée à ${R.nom} : balise ${ok ? "juste ✓" : "fausse ✕"}`, ok ? "ok" : "ko"); } catch (e) { toast("Notification non transmise : " + e.message, "ko"); }
}
function legTable(a, R, withActions) {
  const k = courseOf(R);
  return `<div class="tw"><table class="t"><thead><tr><th>Poste</th><th>Heure</th><th class="num">Temps inter.</th><th class="num">Cumul</th><th class="num">Vol d'oiseau</th><th class="num">Distance GPS</th><th class="num">Vitesse</th><th class="num">Allure</th><th class="num">Arrêts</th><th>État</th></tr></thead><tbody>
   ${a.legs.map(l => `<tr><td><b>${esc(l.de)} → ${esc(l.n)}</b>${l.pts ? ` <small>(${l.pts} pts)</small>` : ""}</td><td>${fmtHeure(l.t)}</td><td class="num"><b>${fmtDur(l.split)}</b></td><td class="num">${fmtDur(l.cumul)}</td><td class="num">${fmtDist(l.vol)}</td><td class="num">${fmtDist(l.gps)}${l.gps && l.vol ? ` <small class="muted">(×${fmtNum(l.gps / l.vol)})</small>` : ""}</td><td class="num">${l.gps && l.split ? fmtNum(l.gps / (l.split / 1000) * 3.6) + " km/h" : "–"}</td><td class="num">${fmtAllure(l.gps, l.split)}</td><td class="num">${l.stop ? fmtDur(l.stop) : "–"}</td>
     <td>${l.bonus ? '<span class="chip wait">★ bonus</span> ' : ""}${l.pm ? '<span class="chip ko">PM ordre</span> ' : ""}${l.suspect ? `<span class="chip ko" title="Distance entre l'élève et la balise au moment du scan">⚠ scan à ${fmtDist(l.dist)}</span> ` : l.dist != null ? `<small class="muted">scan à ${fmtDist(l.dist)}</small> ` : ""}${l.status === "fin" ? '<span class="chip ok">arrivée</span>' : l.status === "ok" ? `<span class="chip ok">✓${S.dec[l.id] === true ? " validé" : ""}</span>` : '<span class="chip wait">à valider</span>'}${!l.ordre ? ' <span class="chip ko">ordre</span>' : ""}${l.via === "code" ? ' <span class="chip">code</span>' : l.via === "sms" ? ' <span class="chip">SMS</span>' : l.via === "prof" ? ' <span class="chip vi">ajoutée par l\'enseignant</span>' : ""}
     ${withActions && l.id && l.status !== "fin" && l.via !== "prof" ? ` <button class="btn small green" data-ok="${l.id}" title="Notifier l'élève : balise juste">✓ Juste</button> <button class="btn small red" data-ko="${l.id}" title="Notifier l'élève : balise fausse">✕ Fausse</button>${S.dec[l.id] != null ? ` <small class="muted">notifié</small>` : ""}` : ""}</td></tr>`).join("")}
   ${a.punches.filter(p => p.status === "hors" || p.status === "code" || p.status === "refus").map(p => `<tr style="background:#fff4f4"><td>Balise ${esc(p.n)}</td><td>${fmtHeure(p.t)}</td><td colspan="7" class="muted">${p.status === "hors" ? "Balise hors de son parcours" : p.status === "code" ? "Code incorrect" : "Refusée par l'enseignant"}</td><td>${withActions ? `${p.status !== "hors" ? `<button class="btn small green" data-ok="${p.id}">✓ Juste</button> ` : ""}<button class="btn small red" data-ko="${p.id}">✕ Fausse</button>${S.dec[p.id] != null ? ` <small class="muted">notifié</small>` : ""}` : '<span class="chip ko">✕</span>'}</td></tr>`).join("")}
   </tbody></table></div>`;
}
const QUICK = ["Reviens au point de départ", "Tu es sur la bonne voie 👍", "Attention : tu sors de la zone !", "Appelle-moi", "Regarde bien ta carte", "Plus que 5 minutes !"];
function runnerTrackSVG(R, a, k) {
  const g = georef(); if (!g) return "";
  const mm = mapMM(P), pts = Object.values(R.ev).filter(e => e.la != null).sort((x, y) => x.t - y.t).map(e => g.toPx(e.la, e.lo));
  const kc = P.courses.find(x => x.k === R.c);
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const ctl = kc ? [kc.depart, ...kc.ctrl, kc.arrivee].map(ctrlById).filter(c => c && c.x != null) : []; ctl.forEach(c => { xs.push(c.x); ys.push(c.y); });
  if (!xs.length) return "";
  const pad = mm * 12, x0 = Math.max(-pad, Math.min(...xs) - pad), y0 = Math.max(-pad, Math.min(...ys) - pad), x1 = Math.min(P.map.w + pad, Math.max(...xs) + pad), y1 = Math.min(P.map.h + pad, Math.max(...ys) + pad);
  const col = rColor(R.r), last = pts[pts.length - 1];
  return `<div style="border-radius:14px;overflow:hidden;background:#ddd;margin-top:12px"><svg viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" style="width:100%;max-height:340px;display:block">${mapSVG(P, { course: kc ? { ...kc, ctrl: R.sel?.length && kc.mode !== "ordre" ? kc.ctrl.filter(id => R.sel.includes(+ctrlById(id)?.n)) : kc.ctrl } : null })}
    ${pts.length > 1 ? `<path d="${polyD(pts.map(p => [p.x, p.y]))}" fill="none" stroke="${col}" stroke-width="${mm * .7}" stroke-linejoin="round"/>` : ""}
    ${last ? `<circle cx="${last.x}" cy="${last.y}" r="${mm * 2.4}" fill="${col}" stroke="#fff" stroke-width="${mm * .6}"/>` : ""}</svg></div>`;
}
function runnerDetail(r) {
  const R = S.runners[r]; if (!R) return;
  const a = runnerSummary(R), k = courseOf(R), ev = Object.values(R.ev).sort((x, y) => x.t - y.t);
  const lastEv = ev[ev.length - 1], lastPos = ev.filter(e => e.la != null).pop(), bat = ev.filter(e => e.bat != null).pop();
  const lu = {}; ev.filter(e => e.k === "lu" && e.mid).forEach(e => lu[e.mid] = e.t);
  const here = ev.filter(e => e.k === "here").pop();
  const msgs = (S.msgs || []).filter(m => m.to === r || m.to === "*").slice(-8);
  const T = k ? (R.sel && R.sel.length && k.m !== "ordre" ? R.sel : k.b.map(b => b.n)) : [];
  const stateOf = n => { const ps = a.punches.filter(p => p.n === n); if (ps.some(p => p.status === "ok")) return "ok"; if (ps.some(p => p.status === "attente")) return "attente"; if (ps.some(p => p.status === "refus" || p.status === "code")) return "ko"; return "none"; };
  const stats = [["Temps", fmtDur(a.temps)], ["Balises", `${a.found}/${a.total}${a.pending ? ` (+${a.pending} à valider)` : ""}`], ["Distance GPS", fmtDist(a.dist)], ["Vitesse moy.", a.vitesse ? fmtNum(a.vitesse) + " km/h" : "–"], ["Allure", fmtAllure(a.dist, a.temps)], ["Temps arrêté", a.stop ? fmtDur(a.stop) : "–"], ["Temps moyen / balise", a.found ? fmtDur(a.temps / Math.max(1, a.found)) : "–"], ["Erreurs", a.erreurs + (a.ordreErr ? ` · ${a.ordreErr} d'ordre` : "")], ...(a.bonusTotal ? [["Bonus", `★ ${a.bonusFound}/${a.bonusTotal}`]] : []), ...(a.hasPts ? [["Points", `${a.score}${a.penal ? ` (−${a.penal})` : ""}`]] : []), ["Scans suspects", a.suspects ? `<span style="color:var(--red)">⚠ ${a.suspects}</span>` : "0"], ...(a.deadline ? [[a.retard ? "Retard" : "Temps restant", a.retard ? `<span style="color:var(--red)">${fmtDur(a.retard)}</span>` : a.finish ? "dans les temps ✓" : fmtDur(a.deadline - Date.now())]] : []), ["Dernier signal", lastEv ? `il y a ${fmtDur(Date.now() - (lastEv.rt || lastEv.t))}` : "–"], ["Précision GPS", lastPos?.ac ? "±" + Math.round(lastPos.ac) + " m" : "–"], ["Batterie", bat ? bat.bat + " %" : "–"]];
  const m = openModal(`<h2><span class="dot" style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${rColor(r)}"></span> ${esc(R.nom)}</h2>
   <div class="row" style="margin-bottom:10px"><span class="chip">${esc(R.cl || "classe ?")}</span><span class="chip vi">${esc(R.c)} · ${esc(modeNom[{ ordre: "ordre", libre: "libre", score: "score" }[k?.m]] || "")}</span><span class="chip ${a.statut === "OK" ? "ok" : a.statut === "En course" ? "or" : "ko"}">${a.statut}</span>${here ? `<span class="chip ok">📍 au point de retour (${fmtHeure(here.t)})</span>` : ""}${R.sel?.length ? `<span class="chip">balises choisies : ${R.sel.join(", ")}</span>` : ""}<span class="muted">départ ${fmtHeure(a.start)}${a.finish ? " · arrivée " + fmtHeure(a.finish) : ""}</span></div>
   <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px">${stats.map(([x, y]) => `<div class="panel" style="margin:0;padding:9px 10px"><div class="lbl">${x}</div><b style="font-size:1.2rem">${y}</b></div>`).join("")}</div>
   ${runnerTrackSVG(R, a, k)}
   <h3>💬 Message à ${esc(R.nom.split(" ")[0])}</h3>
   <div class="cchips" style="margin-bottom:8px">${QUICK.map(q => `<button class="btn small ghost" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>
   <div class="row"><input class="inp grow" id="dTxt" placeholder="Écris un message…" style="width:auto"><button class="btn or" id="dSend">Envoyer</button></div>
   ${msgs.length ? `<div style="margin-top:8px;display:flex;flex-direction:column;gap:4px">${msgs.map(x => `<small class="muted">${fmtHeure(x.t)} · ${x.type === "recall" ? "📢 " : ""}${x.to === "*" ? "(à tous) " : ""}« ${esc(x.txt)} » ${lu[x.id] ? `<b style="color:var(--green)">✓ lu ${fmtHeure(lu[x.id])}</b>` : "· pas encore lu"}</small>`).join("")}</div>` : ""}
   <h3>✏ Corriger les balises</h3><p class="muted" style="margin-top:-6px">Touche une balise pour la compter comme trouvée ou l'enlever (par exemple à l'arrivée, après avoir vérifié avec l'élève).</p>
   <div class="cchips" id="dCorr">${T.map(n => { const st = stateOf(n); return `<button class="cchip" data-corr="${n}" style="${st === "ok" ? "background:var(--green);color:#fff;box-shadow:none" : st === "attente" ? "background:var(--sun);box-shadow:none" : st === "ko" ? "background:#fde0e2;color:#a3202b" : ""}">${n}<small style="font-family:inherit;font-weight:600;font-size:.7rem;display:block;line-height:1">${{ ok: "trouvée", attente: "à valider", ko: "erreur", none: "manque" }[st]}</small></button>`; }).join("")}</div>
   <h3>Balises scannées <small class="muted">— ✓ Juste / ✕ Fausse envoie une notification à l'élève</small></h3>${legTable(a, R, true)}
   ${a.manquants.length ? `<p><b>Balises manquantes :</b> ${a.manquants.join(", ")}${a.ordreManq.length ? ` <span class="chip ko">dont ${a.ordreManq.join(", ")} : ordre non respecté</span>` : ""}</p>` : ""}
   <div class="row" style="margin-top:12px">${a.last ? `<a class="btn small alt" target="_blank" href="${gmapsUrl(a.last.la, a.last.lo)}">📍 Dernière position (${fmtHeure(a.last.t)})</a>` : ""}<button class="btn small or" id="dAna">🗺 Analyse d'itinéraire</button><button class="btn small" id="dBil">📄 Fiche bilan</button><button class="btn small ghost" id="dAb">Marquer abandon / rentré</button><button class="btn small ghost" id="dSat">🛰 Trace sur satellite</button></div>`, { wide: true });
  const reopen = () => { m.remove(); runnerDetail(r); renderLive(); };
  $$("[data-ok]", m).forEach(b => b.onclick = async () => { await decide(R, b.dataset.ok, true); reopen(); });
  $$("[data-ko]", m).forEach(b => b.onclick = async () => { await decide(R, b.dataset.ko, false); reopen(); });
  $$("[data-q]", m).forEach(b => b.onclick = () => { $("#dTxt", m).value = b.dataset.q; $("#dTxt", m).focus(); });
  const send = () => { const t = $("#dTxt", m).value.trim(); if (!t) return; sendMsg(r, t); reopen(); };
  $("#dSend", m).onclick = send; $("#dTxt", m).onkeydown = e => { if (e.key === "Enter") send(); };
  $$("[data-corr]", m).forEach(b => b.onclick = async () => {
    const n = +b.dataset.corr, st = stateOf(n), ps = a.punches.filter(p => p.n === n);
    if (st === "ok" || st === "attente") { if (!confirm(`Enlever la balise ${n} ?`)) return; for (const p of ps.filter(p => p.status === "ok" || p.status === "attente")) await decide(R, p.id, false); }
    else { const p = ps.find(p => p.status === "refus" || p.status === "code"); if (p) await decide(R, p.id, true); else { const id = `${r}-prof-${n}-${Date.now()}`; R.ev[id] = { id, k: "punch", n, ok: true, via: "prof", t: a.finish || Date.now() }; S.dec[id] = true; saveS(); } }
    reopen();
  });
  $("#dAna", m).onclick = () => openAnalysis({ proj: P, geo: calibPoints(), R, course: k, a, lesson: S.nom });
  $("#dBil", m).onclick = () => printBilans([{ proj: P, geo: calibPoints(), R, course: k, a, lesson: S.nom }]);
  $("#dAb", m).onclick = () => { const id = r + "-prof-ab"; R.ev[id] = { id, k: "abandon", t: Date.now(), via: "prof" }; saveS(); reopen(); };
  $("#dSat", m).onclick = () => satView((map, pts) => { const tr = Object.values(R.ev).filter(e => e.la != null).sort((x, y) => x.t - y.t).map(e => [e.la, e.lo]); if (tr.length) { L.polyline(tr, { color: rColor(r), weight: 4 }).addTo(map); L.circleMarker(tr[tr.length - 1], { radius: 8, color: "#fff", fillColor: rColor(r), fillOpacity: 1 }).addTo(map); pts.push(...tr); } });
}
// ---------- rappel général ----------
function startRecall() {
  const pts = P.controls.filter(c => c.type !== "C");
  const m = openModal(`<h2>📢 Rappel général</h2><p class="muted">Tous les élèves reçoivent une alerte plein écran (vibration + son) et répondent « J'y suis » en arrivant. Tu vois qui est revenu.</p>
   <div class="field"><label>Point de retour</label><select class="inp" id="rcPt">${pts.map(c => `<option>${esc(ctrlLabel(c))}</option>`).join("")}<option>Point de rassemblement</option><option value="">Autre (écrire ci-dessous)</option></select></div>
   <div class="field"><label>Message</label><input class="inp" id="rcTxt" value="Fin de l'activité : reviens tout de suite au point de retour !"></div>
   <button class="btn red" id="rcGo" style="width:100%;min-height:56px">📢 Envoyer le rappel à tous</button>`);
  $("#rcGo", m).onclick = () => { const pt = $("#rcPt", m).value; sendMsg("*", $("#rcTxt", m).value.trim() + (pt ? " (" + pt + ")" : ""), "recall"); m.close(); };
}
function recallPanel() {
  const rc = S.recall; if (!rc) return "";
  const list = Object.values(S.runners).map(R => { const ev = Object.values(R.ev); const here = ev.find(e => e.k === "here" && e.t >= rc.t - 1000); const ack = ev.find(e => e.k === "lu" && e.mid === rc.id); return { R, here, ack }; });
  const nHere = list.filter(x => x.here).length;
  return `<div class="panel" style="margin:0 0 10px;background:#fff4d6;border:2px solid var(--sun)"><div class="row"><b style="font-size:1.1rem">📢 Rappel envoyé à ${fmtHeure(rc.t)} · ${nHere}/${list.length} élève(s) au point</b><span class="grow"></span><button class="btn small alt" id="rcAgain">Renvoyer</button><button class="btn small ghost" id="rcEnd">Fermer le rappel</button></div>
    <div class="cchips" style="margin-top:8px">${list.sort((x, y) => !!x.here - !!y.here).map(({ R, here, ack }) => `<button class="chip ${here ? "ok" : ack ? "wait" : "ko"}" data-rr="${R.r}" style="padding:6px 10px">${here ? "✅" : ack ? "🏃" : "❔"} ${esc(R.nom)}${here ? " " + fmtHeure(here.t) : ack ? " en route" : " pas de réponse"}</button>`).join("")}</div></div>`;
}
async function toggleSat() {
  const box = $("#liveSat"), b = $("#lBg");
  if (!box.classList.contains("hidden")) { box.classList.add("hidden"); b.textContent = "🛰 Satellite"; return; }
  box.classList.remove("hidden"); b.textContent = "🗺 Ma carte";
  try {
    loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"); await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
    if (liveMap && liveMap._container !== box) { liveMap.remove(); liveMap = null; }
    if (!liveMap) { liveMap = L.map(box); L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 20, maxNativeZoom: 19 }).addTo(liveMap); liveLayer = L.layerGroup().addTo(liveMap); liveMap._fitted = false; }
    updateSat();
  } catch (e) { box.innerHTML = `<p style="padding:20px;background:#fff">${esc(e.message)}</p>`; }
}
function updateSat() {
  if (!liveMap || !window.L) return; liveLayer.clearLayers(); const all = [];
  P.controls.filter(c => c.lat != null).forEach(c => { all.push([c.lat, c.lon]); L.circleMarker([c.lat, c.lon], { radius: 7, color: VIOLET, weight: 3, fillOpacity: 0 }).addTo(liveLayer).bindTooltip(String(c.n)); });
  Object.values(S.runners).forEach(R => { const tr = Object.values(R.ev).filter(e => e.la != null).sort((a, b) => a.t - b.t).map(e => [e.la, e.lo]); if (!tr.length) return; all.push(...tr); if (S.traces !== false) L.polyline(tr, { color: rColor(R.r), weight: 3, opacity: .8 }).addTo(liveLayer); L.circleMarker(tr[tr.length - 1], { radius: 10, color: "#fff", weight: 2, fillColor: rColor(R.r), fillOpacity: 1 }).addTo(liveLayer).bindTooltip(R.nom, { permanent: true, direction: "right" }).on("click", () => runnerDetail(R.r)); });
  if (!liveMap._fitted && all.length) { liveMap.fitBounds(all, { padding: [30, 30], maxZoom: 19 }); liveMap._fitted = true; } else if (!all.length) liveMap.setView([46.6, 2.4], 6);
  setTimeout(() => liveMap.invalidateSize(), 50);
}

// ================= RÉSULTATS =================
async function viewResultats(v) {
  const L = (await DB.get("sessions")) || [];
  const cur = LS.get("resSession", null) || S?.code || L[0]?.code;
  v.innerHTML = `<div class="pmain"><div class="panel" style="margin-top:0"><h2>Résultats</h2>${L.length ? `<div class="row"><select class="inp" id="rSel" style="max-width:420px">${L.map(x => `<option value="${x.code}" ${x.code === cur ? "selected" : ""}>${esc(x.nom)} (${esc(x.code)})</option>`).join("")}</select>
    <button class="btn or" id="rXls">⬇ Excel</button><button class="btn alt" id="rCsv">⬇ CSV</button><button class="btn alt" id="rPos">⬇ Positions GPS</button><button class="btn ghost" id="rPrint">🖨 Imprimer</button><button class="btn" id="rProg">📈 Progression</button><button class="btn ghost" id="rBil">📄 Fiches bilan</button><button class="btn ghost" id="rSync">↻ Recharger du serveur</button><button class="btn ghost" id="rSms">✉ Importer SMS</button><button class="btn ghost" id="rDel">🗑</button></div>` : `<p class="muted">Aucune leçon pour l'instant.</p>`}</div><div id="rBody"></div></div>`;
  if (!L.length) return;
  const load = async code => { LS.set("resSession", code); const X = S?.code === code ? S : await DB.get("session:" + code); renderResults(X); return X; };
  let X = await load(cur);
  $("#rSel").onchange = async e => X = await load(e.target.value);
  $("#rProg").onclick = openProgression;
  $("#rBil").onclick = () => { const keep = S; S = X; const L = Object.values(X.runners).map(R => { const k = courseOf(R); return { proj: P, geo: calibPoints(), R, course: k, a: analyseRun(R, k, P, X.dec, X.ack || {}, { scanMax: CFG.scanMax }), lesson: X.nom }; }).filter(o => o.a.start).sort((a, b) => (a.R.cl || "").localeCompare(b.R.cl || "") || a.R.nom.localeCompare(b.R.nom)); S = keep; if (!L.length) return toast("Aucun élève parti dans cette leçon", "ko"); printBilans(L); };
  $("#rXls").onclick = () => exportResults(X, "xlsx"); $("#rCsv").onclick = () => exportResults(X, "csv"); $("#rPos").onclick = () => exportPositions(X);
  $("#rPrint").onclick = () => printWin("Résultats " + X.nom, resultsHTML(X, true), `table{border-collapse:collapse;width:100%;font-size:9pt;margin-bottom:6mm}td,th{border:1px solid #999;padding:1.2mm}h2{font-size:13pt;margin:4mm 0 2mm}`);
  $("#rSync").onclick = async () => { const keep = S; S = X; S.since = 0; await pollOnce(); X = S; await saveS(); S = keep?.code === X.code ? X : keep; renderResults(X); toast(syncErr ? syncErr : "Rechargé ✓", syncErr ? "ko" : "ok"); };
  $("#rSms").onclick = () => { const keep = S; S = X; importSMS(); const obs = new MutationObserver(() => { if (!$("#modalRoot .modal")) { obs.disconnect(); renderResults(X); if (keep?.code !== X.code) S = keep; } }); obs.observe($("#modalRoot"), { childList: true }); };
  $("#rDel").onclick = async () => { if (!confirm("Supprimer définitivement cette leçon de la tablette ?")) return; await DB.del("session:" + X.code); await DB.set("sessions", L.filter(x => x.code !== X.code)); if (S?.code === X.code) { S = null; LS.set("curSession", null); stopPolling(); } LS.set("resSession", null); setPTab("resultats"); };
}
function resultRows(X) {
  const keep = S; S = X; const groups = {};
  Object.values(X.runners).forEach(R => { const a = analyseRun(R, courseOf(R), P, X.dec, X.ack || {}, { scanMax: CFG.scanMax }); (groups[R.c] = groups[R.c] || []).push({ R, a }); });
  Object.entries(groups).forEach(([c, list]) => { const k = courseOf(list[0].R); const rank = { OK: 0, "À valider": 1, PM: 2, "En course": 3, Inscrit: 4, ALERTE: 5, Abandon: 6 };
    const mode = k?.rk && k.rk !== "auto" ? k.rk : (k?.m === "score" || (k?.b || []).some(b => b.p != null)) ? "points" : (k?.ch || (k?.b || []).some(b => b.x)) ? "balises" : "temps";
    const T = x => x.a.finish ? x.a.temps : 1e12;
    list.sort((x, y) => mode === "points" ? (y.a.score - x.a.score || T(x) - T(y)) : mode === "balises" ? ((x.a.finish ? 0 : 1) - (y.a.finish ? 0 : 1) || (y.a.found + y.a.bonusFound) - (x.a.found + x.a.bonusFound) || T(x) - T(y)) : ((rank[x.a.statut] ?? 9) - (rank[y.a.statut] ?? 9) || y.a.found - x.a.found || T(x) - T(y)));
    let rk = 0; list.forEach(x => x.rang = (mode !== "temps" || x.a.statut === "OK") && x.a.finish ? ++rk : ""); list.mode = mode; });
  S = keep; return groups;
}
function resultsHTML(X, print) {
  const G = resultRows(X); const keep = S; S = X;
  const html = Object.entries(G).map(([c, list]) => { const k = courseOf(list[0].R); const nums = k ? k.b.map(b => b.n) : [];
    return `<h2>${esc(c)} ${k ? "– " + esc(k.nm || "") : ""} <small class="muted">(${list.length} élève(s) · classement ${{ temps: "au temps", balises: "aux balises puis au temps", points: "aux points puis au temps" }[list.mode]})</small></h2><div class="tw"><table class="t"><thead><tr><th>Rang</th><th>Nom</th><th>Classe</th><th>Statut</th><th class="num">Temps</th><th class="num">Balises</th>${(k?.b || []).some(b => b.x) ? '<th class="num">Bonus</th>' : ""}${(k?.m === "score" || (k?.b || []).some(b => b.p != null)) ? '<th class="num">Points</th>' : ""}<th class="num">Retard</th><th class="num">Scans suspects</th><th class="num">Distance</th><th class="num">Vitesse</th><th class="num">Erreurs</th>${nums.map(n => `<th class="num">${n}</th>`).join("")}${print ? "" : "<th></th>"}</tr></thead><tbody>
     ${list.map(({ R, a, rang }) => { const byN = {}; a.legs.forEach(l => byN[l.n] = l); return `<tr><td>${rang}</td><td><b>${esc(R.nom)}</b></td><td>${esc(R.cl)}</td><td>${a.statut}</td><td class="num"><b>${fmtDur(a.temps)}</b></td><td class="num">${a.found}/${a.total}</td>${(k?.b || []).some(b => b.x) ? `<td class="num">${a.bonusFound}/${a.bonusTotal}</td>` : ""}${(k?.m === "score" || (k?.b || []).some(b => b.p != null)) ? `<td class="num">${a.score}${a.penal ? ` <small>(−${a.penal})</small>` : ""}</td>` : ""}<td class="num">${a.retard ? fmtDur(a.retard) : "–"}</td><td class="num">${a.suspects || "–"}</td><td class="num">${fmtDist(a.dist)}</td><td class="num">${a.vitesse ? fmtNum(a.vitesse) : "–"}</td><td class="num">${a.erreurs}</td>${nums.map(n => `<td class="num">${byN[n] ? fmtDur(byN[n].split) + `<br><small class="muted">${fmtDur(byN[n].cumul)}</small>` : "–"}</td>`).join("")}${print ? "" : `<td><button class="btn small alt" data-rd="${R.r}">Détail</button></td>`}</tr>`; }).join("")}</tbody></table></div>`; }).join("") || `<div class="panel muted">Aucun élève dans cette leçon.</div>`;
  S = keep; return html;
}
function renderResults(X) {
  const b = $("#rBody"); if (!b || !X) return; b.innerHTML = resultsHTML(X);
  $$("[data-rd]", b).forEach(x => x.onclick = () => { const keep = S; S = X; runnerDetail(x.dataset.rd); const obs = new MutationObserver(() => { if (!$("#modalRoot .modal")) { obs.disconnect(); if (keep?.code !== X.code) S = keep; renderResults(X); } }); obs.observe($("#modalRoot"), { childList: true }); });
}
async function exportResults(X, fmt) {
  const G = resultRows(X); const keep = S; S = X;
  const sheets = Object.entries(G).map(([c, list]) => { const k = courseOf(list[0].R); const nums = k ? k.b.map(b => b.n) : [];
    const head = ["Rang", "Nom", "Classe", "Parcours", "Statut", "Départ", "Arrivée", "Temps", "Temps (s)", "Balises trouvées", "Balises du parcours", "Manquantes", "Bonus trouvés", ...(k?.m === "score" || (k?.b || []).some(b => b.p != null) ? ["Points", "Pénalité", "Score"] : []), "Retard", "Scans suspects", "Distance GPS (m)", "Vitesse moy. (km/h)", "Temps arrêté", "Erreurs", "Erreurs d'ordre", "Alertes", ...nums.flatMap(n => [`Inter ${n}`, `Cumul ${n}`, `Dist. ${n} (m)`])];
    const rows = list.map(({ R, a, rang }) => { const byN = {}; a.legs.forEach(l => byN[l.n] = l); return [rang, R.nom, R.cl, R.c, a.statut, fmtHeure(a.start), fmtHeure(a.finish), fmtDur(a.temps), a.temps != null ? Math.round(a.temps / 1000) : "", a.found, a.total, a.manquants.join(" "), a.bonusFound, ...(k?.m === "score" || (k?.b || []).some(b => b.p != null) ? [a.points, a.penal, a.score] : []), a.retard ? fmtDur(a.retard) : "", a.suspects, a.dist != null ? Math.round(a.dist) : "", a.vitesse ? +a.vitesse.toFixed(2) : "", a.stop ? fmtDur(a.stop) : "", a.erreurs, a.ordreErr, a.alerts.length, ...nums.flatMap(n => byN[n] ? [fmtDur(byN[n].split), fmtDur(byN[n].cumul), byN[n].gps != null ? Math.round(byN[n].gps) : ""] : ["", "", ""])]; });
    return { name: String(c).slice(0, 28) || "Parcours", rows: [head, ...rows] }; });
  S = keep;
  const fname = `OrienRun_${X.nom}`.replace(/[^\wÀ-ÿ-]+/g, "_");
  if (fmt === "xlsx") {
    try { await loadScript("https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"); const wb = XLSX.utils.book_new(); sheets.forEach(s => { const ws = XLSX.utils.aoa_to_sheet(s.rows); ws["!cols"] = s.rows[0].map((h, i) => ({ wch: i === 1 ? 22 : 11 })); XLSX.utils.book_append_sheet(wb, ws, s.name); }); XLSX.writeFile(wb, fname + ".xlsx"); return; }
    catch (e) { toast("Excel indisponible hors connexion : export CSV à la place", "ko"); }
  }
  const csv = "﻿" + sheets.map(s => s.rows.map(r => r.map(v => { v = String(v ?? ""); return /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(";")).join("\r\n")).join("\r\n\r\n");
  download(fname + ".csv", csv, "text/csv;charset=utf-8");
}
function exportPositions(X) {
  const rows = [["Nom", "Classe", "Parcours", "Type", "Heure", "Horodatage", "Latitude", "Longitude", "Précision (m)", "Balise", "Lien Google Maps"]];
  Object.values(X.runners).forEach(R => Object.values(R.ev).sort((a, b) => a.t - b.t).forEach(e => rows.push([R.nom, R.cl, R.c, { pos: "position", punch: "balise", start: "départ", finish: "arrivée", alert: "ALERTE", abandon: "abandon", select: "choix" }[e.k] || e.k, fmtHeure(e.t), new Date(e.t).toISOString(), e.la ?? "", e.lo ?? "", e.ac ?? "", e.n ?? "", e.la != null ? gmapsUrl(e.la, e.lo) : ""])));
  download(`OrienRun_positions_${X.code}.csv`, "﻿" + rows.map(r => r.join(";")).join("\r\n"), "text/csv;charset=utf-8");
}

// ================= RÉGLAGES =================
function viewReglages(v) {
  v.innerHTML = `<div class="pmain"><div class="panel" style="margin-top:0"><h2>Connexion en direct (Google Sheet)</h2>
    <p class="muted">Colle l'URL du script Google (elle finit par <b>/exec</b>) — voir le guide d'installation. Sans script, l'appli marche quand même : les élèves envoient leurs résultats par SMS.</p>
    <div class="field"><label>URL du script</label><input class="inp" id="cApi" value="${esc(CFG.api)}" placeholder="https://script.google.com/macros/s/…/exec"></div>
    <div class="row"><button class="btn alt" id="cTest">Tester la connexion</button><span id="cTestR" class="muted"></span></div></div>
   <div class="panel"><h2>Élèves</h2><div class="grid2">
    <div class="field"><label>Ton numéro de portable (SMS de secours)</label><input class="inp" id="cTel" type="tel" value="${esc(CFG.tel)}" placeholder="06 12 34 56 78"><small class="muted">Utilisé pour les alertes et les résultats envoyés par SMS quand il n'y a pas d'internet. Il est inscrit dans le QR de départ.</small></div>
    <div class="field"><label>Envoi de la position GPS toutes les…</label><select class="inp" id="cInt">${[10, 15, 20, 30, 60].map(s => `<option value="${s}" ${+CFG.interval === s ? "selected" : ""}>${s} secondes</option>`).join("")}</select></div>
    <div class="field"><label>Scan « suspect » au-delà de… (distance élève ↔ balise)</label><select class="inp" id="cScan">${[30, 40, 60, 80, 120].map(s => `<option value="${s}" ${+CFG.scanMax === s ? "selected" : ""}>${s} m</option>`).join("")}</select><small class="muted">Repère les QR photographiés et partagés : la tablette signale un scan fait loin de la balise géolocalisée.</small></div>
    <div class="field"><label>Alerte d'immobilité</label><select class="inp" id="cImmo">${[[0, "désactivée"], [3, "après 3 min"], [5, "après 5 min"], [8, "après 8 min"], [10, "après 10 min"]].map(([v, l]) => `<option value="${v}" ${+CFG.immo === v ? "selected" : ""}>${l}</option>`).join("")}</select><small class="muted">Élève en course qui ne bouge plus, loin de toute balise.</small></div>
    <div class="field"><label>Rafraîchissement de la tablette</label><select class="inp" id="cPoll">${[3, 5, 10, 15].map(s => `<option value="${s}" ${+CFG.poll === s ? "selected" : ""}>${s} secondes</option>`).join("")}</select></div>
    <div class="field"><label>Adresse publique de l'appli</label><input class="inp" id="cUrl" value="${esc(CFG.appUrl)}" placeholder="${esc(appUrl())}"><small class="muted">Laisse vide si tu utilises l'appli depuis son adresse GitHub. C'est l'adresse mise dans les QR codes.</small></div></div>
    <button class="btn green" id="cSave">Enregistrer les réglages</button></div>
   <div class="panel" id="clPanel"></div>
   <div class="panel"><h2>Projet</h2><p class="muted">Carte, balises et parcours sont gardés dans cette tablette. Exporte-les pour les sauvegarder ou les transférer sur une autre tablette.</p>
    <div class="row"><button class="btn alt" id="pExp">⬇ Exporter le projet</button><button class="btn alt" id="pImp">⬆ Importer un projet</button><button class="btn red" id="pNew">Nouveau projet</button></div></div>
   ${apiUrl() ? "" : `<div class="panel"><h2>Code enseignant</h2><div class="row"><input class="inp" id="pw2" type="password" placeholder="Nouveau code" style="max-width:260px"><button class="btn alt" id="pwSave">Changer le code</button></div></div>`}
   <p class="muted" style="text-align:center;font-size:.8rem">OrienRun EPS v${APP_VERSION}</p></div>`;
  $("#cTest").onclick = async () => { $("#cTestR").textContent = "…"; try { await apiCall($("#cApi").value.trim(), "teacherCheck", { teacher: tpw() }); $("#cTestR").innerHTML = "<b style='color:var(--green)'>✓ Connexion OK, mot de passe reconnu</b>"; } catch (e) { $("#cTestR").textContent = "✕ " + e.message; } };
  $("#cSave").onclick = () => { CFG.api = $("#cApi").value.trim(); CFG.tel = $("#cTel").value.trim(); CFG.interval = +$("#cInt").value; CFG.poll = +$("#cPoll").value; CFG.scanMax = +$("#cScan").value; CFG.immo = +$("#cImmo").value; CFG.appUrl = $("#cUrl").value.trim(); saveCfg(); toast("Réglages enregistrés ✓", "ok"); if (S?.active) startPolling(); };
  classesPanel($("#clPanel"));
  $("#pExp").onclick = () => download(`OrienRun_${P.nom.replace(/[^\wÀ-ÿ-]+/g, "_")}.orienrun.json`, JSON.stringify(P), "application/json");
  $("#pImp").onclick = async () => { const f = await pickFile(".json,application/json"); if (!f) return; try { const j = JSON.parse(await f.text()); if (!j.controls || !j.map) throw new Error("Fichier non reconnu"); if (!confirm("Remplacer le projet actuel par « " + j.nom + " » ?")) return; P = j; saveP(true); toast("Projet importé ✓", "ok"); setPTab("carte"); } catch (e) { toast(e.message, "ko"); } };
  $("#pNew").onclick = () => { if (!confirm("Créer un nouveau projet vide ? (pense à exporter l'actuel)")) return; P = newProject(); ED.view = null; saveP(true); setPTab("carte"); };
  $("#pwSave") && ($("#pwSave").onclick = async () => { const v = $("#pw2").value.trim(); if (v.length < 3) return toast("3 caractères minimum", "ko"); LS.set("tLocal", await sha256("orienrun:" + v)); toast("Code changé ✓", "ok"); });
}

// QR permanent : ouvre l'appli élève, qui liste les leçons en cours (à imprimer une fois pour toutes)
function printPermQR() {
  printWin("QR permanent élèves", `<div class="pg"><h1>Course d'orientation</h1><p>Scanne pour ouvrir l'appli, puis choisis ta leçon et ton parcours.</p>${QR.svg(eleveUrl(), { ecl: "Q" })}<p style="font-size:12pt">${esc(eleveUrl())}</p></div>`, `.pg{text-align:center;padding-top:15mm}.pg svg{width:140mm;height:140mm}h1{font-size:32pt}p{font-size:15pt}`);
}
