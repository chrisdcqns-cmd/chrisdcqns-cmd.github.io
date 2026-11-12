// ===== Espace enseignant =====
let P = null;            // projet (carte, balises, parcours)
let CFG = LS.get("cfg", {}) || {};
CFG = Object.assign({ api: API_DEFAULT, tel: "", interval: 20, poll: 5, appUrl: "", scanMax: 60 }, CFG);
const saveCfg = () => LS.set("cfg", CFG);
const apiUrl = () => (CFG.api || API_DEFAULT || "").trim();
const appUrl = () => { const u = (CFG.appUrl || APP_URL_DEFAULT || "").trim(); if (u) return u.replace(/#.*$/, ""); return /^https?:/.test(location.href) ? location.href.replace(/[#?].*$/, "") : "https://VOTRE-PSEUDO.github.io/orientation/"; };
let ptab = "carte";
let undoStack = [];

function newProject() { return { v: 1, nom: "Mon site d'orientation", salt: uid(6), map: { img: null, w: 2000, h: 1414, sym: 1, circ: 1.3, txt: 1.3, fade: 0 }, calib: [], features: [], controls: [], courses: [] }; }
let saveTimer;
function saveP(now) { clearTimeout(saveTimer); const go = () => DB.set("projet", P).catch(e => toast("Sauvegarde impossible : " + e.message, "ko")); if (now) return go(); saveTimer = setTimeout(go, 400); }
function pushUndo() { undoStack.push(JSON.stringify({ calib: P.calib, features: P.features, controls: P.controls })); if (undoStack.length > 40) undoStack.shift(); }
function undo() { const s = undoStack.pop(); if (!s) return toast("Rien à annuler"); Object.assign(P, JSON.parse(s)); saveP(); renderEditor(); }
const ctrlById = id => P.controls.find(c => c.id === id);
const nextN = () => { let n = Math.max(30, ...P.controls.filter(c => c.type === "C").map(c => +c.n || 0)) + 1; while (numAmbigu(n)) n++; return n; };
const ctrlLabel = c => c.type === "S" ? "Départ" : c.type === "F" ? "Arrivée" : "Balise " + c.n;
const georef = () => makeGeoref(calibPoints());
function calibPoints() { // points de calage + balises placées ET géolocalisées
  const pts = P.calib.map(c => ({ x: c.x, y: c.y, lat: c.lat, lon: c.lon }));
  P.controls.forEach(c => { if (c.x != null && c.lat != null && c.calage !== false) pts.push({ x: c.x, y: c.y, lat: c.lat, lon: c.lon }); });
  return pts;
}

// ---------- fenêtres ----------
function openModal(html, opts = {}) {
  const root = $("#modalRoot"); const m = document.createElement("div"); m.className = "modal";
  m.innerHTML = `<div class="sheet ${opts.wide ? "wide" : ""}"><button class="close" aria-label="Fermer">✕</button>${html}</div>`;
  root.appendChild(m);
  const close = () => { m.remove(); opts.onClose && opts.onClose(); };
  m.querySelector(".close").onclick = close; m.addEventListener("click", e => { if (e.target === m && !opts.sticky) close(); });
  m.close = close; return m;
}
function closeModals() { $$("#modalRoot .modal").forEach(m => m.remove()); }
function pickFile(accept) { return new Promise(res => { const f = $("#fileIn"); f.value = ""; f.accept = accept; f.onchange = () => res(f.files[0] || null); f.click(); }); }
function loadScript(src) { return new Promise((res, rej) => { if ([...document.scripts].some(s => s.src === src)) return res(); const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("Chargement impossible (pas d'internet ?)")); document.head.appendChild(s); }); }
function loadCss(href) { if (![...document.querySelectorAll("link")].some(l => l.href === href)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); } }
function download(name, data, type = "application/octet-stream") { const b = data instanceof Blob ? data : new Blob([data], { type }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }

// ---------- accès enseignant ----------
async function profLogin() {
  const hasApi = !!apiUrl(), local = LS.get("tHash", null);
  const m = openModal(`<h2>Espace enseignant</h2><p class="muted">${hasApi ? "Mot de passe enseignant (celui du script Google)." : "Code enseignant (par défaut : <b>eps</b>, modifiable dans les réglages)."}</p>
    <div class="field"><input class="inp" type="password" id="pw" autocomplete="current-password" placeholder="Mot de passe"></div><div class="row"><button class="btn or" id="pwOk">Entrer</button><span id="pwMsg" class="muted"></span></div>`);
  const pw = $("#pw", m); pw.focus();
  const go = async () => {
    const v = pw.value.trim(); if (!v) return; $("#pwMsg", m).textContent = "Vérification…";
    const h = await sha256("orienrun:" + v);
    if (hasApi) {
      try { await apiCall(apiUrl(), "teacherCheck", { teacher: v }); LS.set("tHash", h); sessionStorage.setItem("tpw", v); m.close(); return openProf(); }
      catch (e) { if (local && local === h && /répond|fetch|network|Failed/i.test(e.message)) { sessionStorage.setItem("tpw", v); m.close(); return openProf(); } $("#pwMsg", m).textContent = "✕ " + e.message; return; }
    }
    const want = LS.get("tLocal", null) || await sha256("orienrun:eps");
    if (h === want) { sessionStorage.setItem("tpw", v); m.close(); openProf(); } else $("#pwMsg", m).textContent = "✕ Code incorrect";
  };
  $("#pwOk", m).onclick = go; pw.onkeydown = e => { if (e.key === "Enter") go(); };
}
const tpw = () => sessionStorage.getItem("tpw") || "";

async function openProf() {
  P = (await DB.get("projet")) || newProject();
  if (!P.salt) P.salt = uid(6);
  showScreen("prof"); setPTab(LS.get("ptab", "carte"));
  resumeSession();
}
function setPTab(t) {
  ptab = t; LS.set("ptab", t);
  $$("#ptabs .tab").forEach(b => b.classList.toggle("on", b.dataset.t === t));
  $("#projName").textContent = P.nom;
  stopMyPos();
  const v = $("#pview"); v.innerHTML = "";
  ({ carte: viewCarte, balises: viewBalises, parcours: viewParcours, seance: viewSeance, resultats: viewResultats, reglages: viewReglages })[t](v);
}

// ================= CARTE =================
const ED = { tool: "select", view: null, draw: null, sel: null, place: null, myPos: null, watch: null, showCal: true };
function viewCarte(v) {
  const groups = {}; SYM.forEach(s => (groups[s.grp] = groups[s.grp] || []).push(s));
  const icon = s => `<svg viewBox="0 0 26 20">${symIcon(s)}</svg>`;
  v.innerHTML = `<div class="pmain" style="padding-bottom:10px"><div class="editor">
    <div class="tools">
      <div class="row" style="gap:6px"><button class="btn small or" id="loadMap">📂 Charger ma carte</button><button class="btn small ghost" id="mapSet">⚙</button><button class="btn small ghost" id="undoB" title="Annuler">↶</button></div>
      <h4>Outils</h4><div class="tgrid">
        <button class="tool" data-tool="select"><svg viewBox="0 0 26 20"><path d="M8 2l10 9-5 1 3 6-2 1-3-6-3 4z" fill="currentColor"/></svg>Choisir / déplacer</button>
        <button class="tool" data-tool="pan"><svg viewBox="0 0 26 20"><path d="M13 1v18M4 10h18M13 1l-3 3M13 1l3 3M13 19l-3-3M13 19l3-3M4 10l3-3M4 10l3 3M22 10l-3-3M22 10l-3 3" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>Se déplacer</button>
        <button class="tool" data-tool="C"><svg viewBox="0 0 26 20"><circle cx="13" cy="10" r="7" fill="none" stroke="${VIOLET}" stroke-width="2"/></svg>Balise (poste)</button>
        <button class="tool" data-tool="S"><svg viewBox="0 0 26 20"><path d="M13 2l8 14H5z" fill="none" stroke="${VIOLET}" stroke-width="2"/></svg>Départ</button>
        <button class="tool" data-tool="F"><svg viewBox="0 0 26 20"><circle cx="13" cy="10" r="5" fill="none" stroke="${VIOLET}" stroke-width="1.8"/><circle cx="13" cy="10" r="8.5" fill="none" stroke="${VIOLET}" stroke-width="1.8"/></svg>Arrivée</button>
        <button class="tool" data-tool="cal"><svg viewBox="0 0 26 20"><circle cx="13" cy="10" r="6" fill="none" stroke="#1a9b55" stroke-width="2"/><path d="M13 1v6M13 13v6M4 10h6M16 10h6" stroke="#1a9b55" stroke-width="2"/></svg>Point GPS (calage)</button>
      </div>
      ${Object.entries(groups).map(([g, list]) => `<h4>${g}</h4><div class="tgrid">${list.map(s => `<button class="tool" data-tool="sym:${s.id}" title="${s.code ? "ISOM " + s.code + " – " : ""}${esc(s.nom)}">${icon(s)}${esc(s.nom)}</button>`).join("")}</div>`).join("")}
      <h4>Sur le terrain</h4>
      <button class="btn small ghost" id="myPosB" style="width:100%">📍 Afficher ma position</button>
      <p class="muted" style="font-size:.78rem;margin:8px 2px">Calage : <b id="calInfo"></b></p>
    </div>
    <div class="mapwrap" id="mapwrap"><svg class="map" id="mapsvg" xmlns="http://www.w3.org/2000/svg"></svg>
      <div class="zoombtns"><button id="zin">+</button><button id="zout">−</button><button id="zfit" style="font-size:.9rem">⤢</button></div>
      <div class="mapbar" id="mapbar"></div><div class="empty-map ${P.map.img || P.features.length ? "hidden" : ""}" id="emptyMap"><div><h2 style="margin:0 0 8px">Ta carte</h2><p class="muted">Charge une photo, un scan ou un PDF de ta carte (plan du lycée, carte du parc…), ou dessine directement sur une feuille blanche avec les symboles officiels.</p><div class="row" style="justify-content:center"><button class="btn or" id="loadMap2">📂 Charger une carte</button><button class="btn alt" id="blankMap">Feuille blanche</button></div></div></div>
    </div></div></div>`;
  $$(".tool", v).forEach(b => b.onclick = () => setTool(b.dataset.tool));
  $("#loadMap").onclick = $("#loadMap2").onclick = loadMapImage;
  $("#blankMap").onclick = () => { $("#emptyMap").classList.add("hidden"); };
  $("#mapSet").onclick = mapSettings; $("#undoB").onclick = undo;
  $("#zin").onclick = () => zoomBy(1 / 1.4); $("#zout").onclick = () => zoomBy(1.4); $("#zfit").onclick = () => { ED.view = null; renderEditor(); };
  $("#myPosB").onclick = toggleMyPos;
  setTool(ED.tool); initPointer($("#mapsvg"), $("#mapwrap")); renderEditor();
}
function symIcon(s) {
  if (s.k === "line") { const D = s.draw; const pts = [[2, 14], [10, 6], [17, 13], [24, 5]]; const f = { sym: s.id, pts }; return featureSVG(f, 2.4).replace(/data-f="[^"]*"/g, ""); }
  if (s.k === "area") { const D = s.draw; return `${s.draw.pat ? patDefs(2.4).replace(/id="pat-/g, `id="i${s.id}-pat-`) : ""}<rect x="2" y="3" width="22" height="14" rx="2" fill="${D.pat ? `url(#i${s.id}-pat-${D.pat})` : D.f}" stroke="${D.s || "#0002"}" stroke-width="1"/>`; }
  if (s.k === "point") return s.id === "nord" ? pointSymbol("nord", 13, 11, 1.4) : pointSymbol(s.id, 13, 10, 5);
  return `<text x="13" y="15" font-size="13" text-anchor="middle" font-weight="700" fill="currentColor">Aa</text>`;
}
function setTool(t) {
  if (ED.draw && t !== ED.tool) finishDraw();
  ED.tool = t; $$(".tool").forEach(b => b.classList.toggle("on", b.dataset.tool === t));
  $("#mapwrap")?.classList.toggle("pan", t === "pan");
  if (t !== "select") ED.sel = null;
  renderBar(); renderEditor();
}
function fitView() { const w = P.map.w, h = P.map.h; return { x: -w * .03, y: -h * .03, w: w * 1.06, h: h * 1.06 }; }
function applyView() { const s = $("#mapsvg"); if (!s) return; if (!ED.view) ED.view = fitView(); const v = ED.view; s.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`); }
function zoomBy(f, cx, cy) { const v = ED.view || fitView(); cx = cx ?? v.x + v.w / 2; cy = cy ?? v.y + v.h / 2; const nw = clamp(v.w * f, P.map.w / 40, P.map.w * 4), k = nw / v.w; ED.view = { x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k, w: nw, h: v.h * k }; applyView(); }
function renderEditor() {
  const s = $("#mapsvg"); if (!s) return; applyView();
  const mm = mapMM(P);
  let extra = "";
  if (ED.showCal) P.calib.forEach(c => { extra += `<g data-cal="${c.id}"><circle cx="${c.x}" cy="${c.y}" r="${2.2 * mm}" fill="#1a9b5533" stroke="#1a9b55" stroke-width="${.4 * mm}"/><path d="M${c.x} ${c.y - 3.5 * mm}V${c.y + 3.5 * mm}M${c.x - 3.5 * mm} ${c.y}H${c.x + 3.5 * mm}" stroke="#1a9b55" stroke-width="${.3 * mm}"/><text x="${c.x + 2.6 * mm}" y="${c.y - 2.6 * mm}" font-size="${2.6 * mm}" fill="#1a9b55" font-weight="700" font-family="Arial">GPS</text></g>`; });
  if (ED.draw && ED.draw.pts.length) { const f = { sym: ED.draw.sym, pts: ED.draw.pts }; extra += featureSVG(f, mm).replace(/data-f="[^"]*"/g, "") + ED.draw.pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="${mm * .9}" fill="#fff" stroke="#f47a20" stroke-width="${mm * .4}"/>`).join(""); }
  if (ED.sel?.k === "f") { const f = P.features.find(x => x.id === ED.sel.id); if (f?.pts) extra += f.pts.map((p, i) => `<circle data-v="${i}" cx="${p[0]}" cy="${p[1]}" r="${mm * 1.3}" fill="#fff" stroke="#f47a20" stroke-width="${mm * .5}"/>`).join(""); else if (f) extra += `<circle cx="${f.x}" cy="${f.y}" r="${mm * 2.5}" fill="none" stroke="#f47a20" stroke-width="${mm * .5}" stroke-dasharray="${mm} ${mm}"/>`; }
  if (ED.myPos) { const g = georef(); if (g) { const q = g.toPx(ED.myPos.lat, ED.myPos.lon); extra += `<circle cx="${q.x}" cy="${q.y}" r="${mm * 2}" fill="#2b7bff" stroke="#fff" stroke-width="${mm * .6}"/><circle cx="${q.x}" cy="${q.y}" r="${Math.max(mm * 2, (ED.myPos.acc || 0) / (g.mPerPx || 1))}" fill="#2b7bff22" stroke="#2b7bff" stroke-width="${mm * .2}"/>`; } }
  s.innerHTML = mapSVG(P, { highlight: ED.sel?.k === "c" ? ED.sel.id : null }) + extra;
  const g = georef(); const ci = $("#calInfo");
  if (ci) ci.textContent = !g ? `${calibPoints().length} point(s) – il en faut au moins 2 (3 conseillés)` : `${g.n} points${g.err != null ? ` · précision ≈ ±${Math.round(g.err)} m` : ""}${g.mPerPx ? ` · 1 cm carte ≈ ${Math.round(g.mPerPx * P.map.w / 29.7)} m (A4)` : ""}`;
}
function renderBar() {
  const b = $("#mapbar"); if (!b) return;
  let h = "";
  if (ED.draw) h = `<span class="info">${esc(SYMI[ED.draw.sym].nom)} : ${ED.draw.pts.length} point(s) — touche la carte pour ajouter des points</span><button class="btn green small" id="bDone">✓ Terminer</button><button class="btn small alt" id="bBack">↶ Point</button><button class="btn small red" id="bCancel">✕</button>`;
  else if (ED.place) { const c = ctrlById(ED.place); h = `<span class="info">Touche la carte pour placer : ${esc(ctrlLabel(c))}</span><button class="btn small red" id="bCancelPl">✕</button>`; }
  else if (ED.sel) {
    if (ED.sel.k === "c") { const c = ctrlById(ED.sel.id); h = `<span class="info">${esc(ctrlLabel(c))}${c.lat != null ? ` · GPS ±${Math.round(c.acc || 0)} m` : " · pas de GPS"}</span><button class="btn small or" id="bEditC">Modifier</button><button class="btn small alt" id="bLab">↻ Numéro</button><button class="btn small red" id="bDelC">Supprimer</button>`; }
    if (ED.sel.k === "f") { const f = P.features.find(x => x.id === ED.sel.id); const s = SYMI[f?.sym]; h = `<span class="info">${esc(s?.nom)}</span>${s?.k === "point" || s?.k === "text" ? `<button class="btn small alt" id="bBig">＋</button><button class="btn small alt" id="bSmall">－</button><button class="btn small alt" id="bRot">↻</button>` : ""}${s?.k === "text" ? `<button class="btn small alt" id="bTxt">Texte</button>` : ""}<button class="btn small red" id="bDelF">Supprimer</button>`; }
    if (ED.sel.k === "cal") { const c = P.calib.find(x => x.id === ED.sel.id); h = `<span class="info">Point GPS · ${c.lat.toFixed(5)}, ${c.lon.toFixed(5)} (±${Math.round(c.acc || 0)} m)</span><a class="btn small alt" target="_blank" href="${gmapsUrl(c.lat, c.lon)}">Google Maps</a><button class="btn small red" id="bDelCal">Supprimer</button>`; }
  } else if (ED.tool === "C") h = `<span class="info">Touche la carte pour poser la balise n° ${nextN()}</span>`;
  else if (ED.tool === "cal") h = `<span class="info">Touche sur la carte l'endroit où tu te trouves sur le terrain, puis mesure ta position GPS.</span>`;
  b.innerHTML = h;
  const on = (id, f) => { const e = $("#" + id, b); if (e) e.onclick = f; };
  on("bDone", finishDraw); on("bBack", () => { ED.draw.pts.pop(); renderBar(); renderEditor(); }); on("bCancel", () => { ED.draw = null; renderBar(); renderEditor(); });
  on("bCancelPl", () => { ED.place = null; renderBar(); });
  on("bEditC", () => editControl(ED.sel.id)); on("bDelC", () => { if (confirm("Supprimer ce poste ?")) { pushUndo(); delControl(ED.sel.id); ED.sel = null; saveP(); renderBar(); renderEditor(); } });
  on("bLab", () => { const c = ctrlById(ED.sel.id); pushUndo(); c.lab = ((c.lab ?? 45) + 45) % 360; saveP(); renderEditor(); });
  const fsel = () => P.features.find(x => x.id === ED.sel.id);
  on("bBig", () => { const f = fsel(); f.size = (f.size || 1) * 1.25; saveP(); renderEditor(); }); on("bSmall", () => { const f = fsel(); f.size = (f.size || 1) / 1.25; saveP(); renderEditor(); });
  on("bRot", () => { const f = fsel(); f.rot = ((f.rot || 0) + 15) % 360; saveP(); renderEditor(); });
  on("bTxt", () => { const f = fsel(); const t = prompt("Texte :", f.txt); if (t != null) { f.txt = t; saveP(); renderEditor(); } });
  on("bDelF", () => { pushUndo(); P.features = P.features.filter(x => x.id !== ED.sel.id); ED.sel = null; saveP(); renderBar(); renderEditor(); });
  on("bDelCal", () => { pushUndo(); P.calib = P.calib.filter(x => x.id !== ED.sel.id); ED.sel = null; saveP(); renderBar(); renderEditor(); });
}
function delControl(id) { P.controls = P.controls.filter(c => c.id !== id); P.courses.forEach(k => { k.ctrl = k.ctrl.filter(x => x !== id); if (k.depart === id) k.depart = null; if (k.arrivee === id) k.arrivee = null; }); }
function finishDraw() {
  const d = ED.draw; ED.draw = null;
  if (d) { const k = SYMI[d.sym].k; if (d.pts.length >= (k === "area" ? 3 : 2)) { pushUndo(); P.features.push({ id: uid(6), sym: d.sym, pts: d.pts }); saveP(); } else toast("Pas assez de points"); }
  renderBar(); renderEditor();
}
function initPointer(svg, wrap) {
  const ptrs = new Map(); let start = null, pinch = null, drag = null;
  const toMap = (cx, cy) => { const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy; const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 }; const q = pt.matrixTransform(m.inverse()); return { x: q.x, y: q.y }; };
  svg.addEventListener("wheel", e => { e.preventDefault(); const q = toMap(e.clientX, e.clientY); zoomBy(e.deltaY > 0 ? 1.15 : 1 / 1.15, q.x, q.y); }, { passive: false });
  svg.addEventListener("pointerdown", e => {
    svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), view: { ...ED.view }, c: toMap((a.x + b.x) / 2, (a.y + b.y) / 2) }; start = null; drag = null; return; }
    start = { x: e.clientX, y: e.clientY, t: Date.now(), view: { ...(ED.view || fitView()) }, moved: false, target: e.target };
    drag = null;
    if (ED.tool === "select" && ED.sel) {
      const hv = e.target.closest("[data-v]"), hc = e.target.closest("[data-c]"), hf = e.target.closest("[data-f]"), hcal = e.target.closest("[data-cal]");
      if (hv && ED.sel.k === "f") drag = { k: "v", i: +hv.dataset.v };
      else if (hc && ED.sel.k === "c" && hc.dataset.c === ED.sel.id) drag = { k: "c" };
      else if (hf && ED.sel.k === "f" && hf.dataset.f === ED.sel.id) drag = { k: "f", last: toMap(e.clientX, e.clientY) };
      else if (hcal && ED.sel.k === "cal" && hcal.dataset.cal === ED.sel.id) drag = { k: "cal" };
      if (drag) pushUndo();
    }
  });
  svg.addEventListener("pointermove", e => {
    if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const f = pinch.d / (d || 1); const v = pinch.view; const nw = clamp(v.w * f, P.map.w / 40, P.map.w * 4), k = nw / v.w; ED.view = { x: pinch.c.x - (pinch.c.x - v.x) * k, y: pinch.c.y - (pinch.c.y - v.y) * k, w: nw, h: v.h * k }; applyView(); return; }
    if (!start) return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 7) start.moved = true;
    if (!start.moved) return;
    if (drag) {
      const q = toMap(e.clientX, e.clientY);
      if (drag.k === "c") { const c = ctrlById(ED.sel.id); c.x = q.x; c.y = q.y; }
      if (drag.k === "cal") { const c = P.calib.find(x => x.id === ED.sel.id); c.x = q.x; c.y = q.y; }
      if (drag.k === "v") { const f = P.features.find(x => x.id === ED.sel.id); f.pts[drag.i] = [q.x, q.y]; }
      if (drag.k === "f") { const f = P.features.find(x => x.id === ED.sel.id); const dx = q.x - drag.last.x, dy = q.y - drag.last.y; drag.last = q; if (f.pts) f.pts = f.pts.map(p => [p[0] + dx, p[1] + dy]); else { f.x += dx; f.y += dy; } }
      renderEditor(); return;
    }
    const r = svg.getBoundingClientRect(), v = start.view, sc = Math.max(v.w / r.width, v.h / r.height);
    ED.view = { ...v, x: v.x - (e.clientX - start.x) * sc, y: v.y - (e.clientY - start.y) * sc }; applyView();
  });
  const up = e => {
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
    if (start && !start.moved && Date.now() - start.t < 700) { const q = toMap(e.clientX, e.clientY); tapMap(q, start.target); }
    if (drag && start?.moved) saveP();
    start = null; drag = null;
  };
  svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", e => { ptrs.delete(e.pointerId); start = null; pinch = null; drag = null; });
}
function tapMap(q, target) {
  $("#emptyMap")?.classList.add("hidden");
  const t = ED.tool;
  if (ED.place) { const c = ctrlById(ED.place); pushUndo(); c.x = q.x; c.y = q.y; ED.place = null; saveP(); renderBar(); renderEditor(); toast(ctrlLabel(c) + " placée ✓", "ok"); return; }
  if (t === "pan") return;
  if (t === "select") {
    const hc = target.closest?.("[data-c]"), hf = target.closest?.("[data-f]"), hcal = target.closest?.("[data-cal]");
    ED.sel = hc ? { k: "c", id: hc.dataset.c } : hcal ? { k: "cal", id: hcal.dataset.cal } : hf ? { k: "f", id: hf.dataset.f } : null;
    renderBar(); renderEditor(); return;
  }
  if (t === "C" || t === "S" || t === "F") {
    pushUndo(); const c = { id: uid(6), type: t, n: t === "C" ? nextN() : t === "S" ? "D" : "A", code: randCode(3), desc: "", x: q.x, y: q.y, lat: null, lon: null, acc: null };
    if (t !== "C") c.n = t === "S" ? "D" + (P.controls.filter(x => x.type === "S").length || "") : "A" + (P.controls.filter(x => x.type === "F").length || "");
    P.controls.push(c); saveP(); ED.sel = { k: "c", id: c.id }; renderEditor();
    if (t !== "C") setTool("select"); else renderBar();
    ED.sel = { k: "c", id: c.id }; renderBar(); return;
  }
  if (t === "cal") return calibAt(q);
  if (t.startsWith("sym:")) {
    const id = t.slice(4), s = SYMI[id];
    if (s.k === "point") { pushUndo(); P.features.push({ id: uid(6), sym: id, x: q.x, y: q.y }); saveP(); renderEditor(); return; }
    if (s.k === "text") { const txt = prompt("Texte à écrire sur la carte :"); if (txt) { pushUndo(); P.features.push({ id: uid(6), sym: id, x: q.x, y: q.y, txt }); saveP(); renderEditor(); } return; }
    if (!ED.draw || ED.draw.sym !== id) ED.draw = { sym: id, pts: [] };
    ED.draw.pts.push([q.x, q.y]); renderBar(); renderEditor();
  }
}
function calibAt(q) {
  const m = openModal(`<h2>Point GPS de calage</h2><p class="muted">Va sur le terrain à l'endroit que tu as touché sur la carte (angle de bâtiment, poteau, arbre…). Les points de calage servent à placer précisément les élèves sur ta carte, même si elle n'est pas à l'échelle. Mets-en au moins 3, bien répartis (coins de la carte).</p>
  <div class="row"><button class="btn or" id="gMeasure">📍 Mesurer ma position (10 s)</button><span id="gProg" class="muted"></span></div>
  <div class="field" style="margin-top:14px"><label>…ou coller des coordonnées / un lien Google Maps</label><input class="inp" id="gPaste" placeholder="48.85837, 2.29448  ou  https://maps.google.com/…"></div>
  <div class="row"><button class="btn green" id="gSave" disabled>Enregistrer le point</button><span id="gRes" class="muted"></span></div>`);
  let pos = null;
  const show = () => { $("#gRes", m).innerHTML = pos ? `${pos.lat.toFixed(6)}, ${pos.lon.toFixed(6)}${pos.acc ? ` · ±${pos.acc} m` : ""}` : ""; $("#gSave", m).disabled = !pos; };
  $("#gMeasure", m).onclick = async () => { $("#gMeasure", m).disabled = true; try { pos = await measureGPS(10, p => $("#gProg", m).textContent = `${p.n} mesure(s)${p.acc ? ` · ±${Math.round(p.acc)} m` : ""} · ${Math.ceil(p.left)} s`); $("#gProg", m).textContent = "✓"; } catch (e) { $("#gProg", m).textContent = "✕ " + e.message; } $("#gMeasure", m).disabled = false; show(); };
  $("#gPaste", m).oninput = e => { const g = parseLatLon(e.target.value); if (g) { pos = { ...g, acc: null }; show(); } };
  $("#gSave", m).onclick = () => { pushUndo(); P.calib.push({ id: uid(6), x: q.x, y: q.y, lat: pos.lat, lon: pos.lon, acc: pos.acc, t: Date.now() }); saveP(); m.close(); renderEditor(); toast("Point de calage ajouté ✓", "ok"); };
}
function toggleMyPos() {
  if (ED.watch != null) return stopMyPos();
  if (!georef()) toast("Ajoute d'abord au moins 2 points GPS (calage) pour te voir sur la carte.");
  ED.watch = navigator.geolocation?.watchPosition(p => { ED.myPos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }; renderEditor(); }, e => toast(e.message, "ko"), { enableHighAccuracy: true });
  const b = $("#myPosB"); if (b) b.textContent = "📍 Masquer ma position";
}
function stopMyPos() { if (ED.watch != null) navigator.geolocation.clearWatch(ED.watch); ED.watch = null; ED.myPos = null; const b = $("#myPosB"); if (b) b.textContent = "📍 Afficher ma position"; }

async function loadMapImage() {
  const f = await pickFile("image/*,application/pdf"); if (!f) return;
  toast("Chargement de la carte…");
  try {
    let src;
    if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise; const page = await pdf.getPage(1);
      const v0 = page.getViewport({ scale: 1 }), sc = 2600 / Math.max(v0.width, v0.height), vp = page.getViewport({ scale: sc });
      const cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height; await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise; src = cv;
    } else { src = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Image illisible")); i.src = URL.createObjectURL(f); }); }
    const W = src.naturalWidth || src.width, H = src.naturalHeight || src.height, k = Math.min(1, 2600 / Math.max(W, H));
    const cv = document.createElement("canvas"); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
    const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(src, 0, 0, cv.width, cv.height);
    const had = P.map.img || P.controls.some(c => c.x != null) || P.features.length;
    if (had && !confirm("Remplacer la carte actuelle ? Les balises et dessins restent à leur place (en proportion).")) return;
    const sx = cv.width / P.map.w, sy = cv.height / P.map.h;
    if (had) { P.controls.forEach(c => { if (c.x != null) { c.x *= sx; c.y *= sy; } }); P.calib.forEach(c => { c.x *= sx; c.y *= sy; }); P.features.forEach(f => { if (f.pts) f.pts = f.pts.map(p => [p[0] * sx, p[1] * sy]); else { f.x *= sx; f.y *= sy; } }); }
    P.map.img = cv.toDataURL("image/jpeg", .86); P.map.w = cv.width; P.map.h = cv.height; ED.view = null;
    saveP(true); renderEditor(); $("#emptyMap")?.classList.add("hidden"); toast("Carte chargée ✓", "ok");
  } catch (e) { toast(e.message, "ko"); }
}
function mapSettings() {
  const m = openModal(`<h2>Réglages de la carte</h2>
   <div class="field"><label>Nom du site / du projet</label><input class="inp" id="msNom" value="${esc(P.nom)}"></div>
   ${[["sym", "Taille des symboles", .4, 3], ["circ", "Taille des cercles de poste", .4, 3], ["txt", "Taille des numéros", .4, 3], ["fade", "Estomper le fond (pour mieux voir le tracé)", 0, .8]].map(([k, l, a, b]) => `<div class="field"><label>${l} <span id="v_${k}"></span></label><input type="range" min="${a}" max="${b}" step="0.05" value="${P.map[k] ?? (k === "fade" ? 0 : 1)}" data-k="${k}"></div>`).join("")}
   <div class="row"><button class="btn alt" id="msBlank">Nouvelle feuille blanche…</button><button class="btn red" id="msClear">Effacer les dessins</button></div>`);
  $("#msNom", m).oninput = e => { P.nom = e.target.value; $("#projName").textContent = P.nom; saveP(); };
  $$("input[type=range]", m).forEach(r => { const upd = () => $("#v_" + r.dataset.k, m).textContent = "(" + (+r.value).toFixed(2) + ")"; upd(); r.oninput = () => { P.map[r.dataset.k] = +r.value; upd(); saveP(); renderEditor(); }; });
  $("#msBlank", m).onclick = () => { const f = prompt("Format de la feuille : paysage ou portrait ?", "paysage"); if (!f) return; P.map.img = null; if (/portrait/i.test(f)) { P.map.w = 1414; P.map.h = 2000; } else { P.map.w = 2000; P.map.h = 1414; } ED.view = null; saveP(); renderEditor(); m.close(); };
  $("#msClear", m).onclick = () => { if (confirm("Effacer tous les dessins (les balises restent) ?")) { pushUndo(); P.features = []; saveP(); renderEditor(); } };
}
