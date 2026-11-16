// ===== Import des relevés de l'appli « Terrain » (iPhone) : balises GPS + photos, chemins tracés =====
const terrainUrl = () => new URL("../terrain/", /^https?:/.test(location.href) ? location.href : "https://chrisdcqns-cmd.github.io/eps-autonomie-numerique/orientation/").href;
function showTerrainQR() {
  openModal(`<h2>📱 Appli Terrain (iPhone)</h2><p>Pour poser les balises avec une position GPS contrôlée (photos, lien Google Maps) et tracer les chemins en marchant.</p>
   <div style="max-width:240px;margin:10px auto">${QR.svg(terrainUrl(), { ecl: "M" })}</div><p style="text-align:center;word-break:break-all"><a href="${esc(terrainUrl())}" target="_blank">${esc(terrainUrl())}</a></p>
   <ol style="line-height:1.6"><li>Scanne ce QR avec l'iPhone, puis dans Safari : <b>Partager → Sur l'écran d'accueil</b>.</li><li>Sur le terrain : « Poser des balises » ou « Tracer un chemin ».</li><li>De retour : <b>Exporter → Vers OrienRun</b> (AirDrop, Mail…), puis ici « 📥 Importer (appli Terrain) ».</li></ol>`);
}
function shrinkData(src, max = 640, q = .72) { return new Promise(res => { const i = new Image(); i.onload = () => { const k = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement("canvas"); c.width = Math.round(i.width * k); c.height = Math.round(i.height * k); c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", q)); }; i.onerror = () => res(null); i.src = src; }); }
// Simplification d'une ligne (Douglas-Peucker) en pixels de la carte
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const d = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; if (!L) return Math.hypot(p[0] - a[0], p[1] - a[1]); const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  let im = 0, dm = 0; for (let i = 1; i < pts.length - 1; i++) { const x = d(pts[i], pts[0], pts[pts.length - 1]); if (x > dm) { dm = x; im = i; } }
  return dm > tol ? simplify(pts.slice(0, im + 1), tol).slice(0, -1).concat(simplify(pts.slice(im), tol)) : [pts[0], pts[pts.length - 1]];
}
// Densité notée de part et d'autre du chemin (appli Terrain) → bandes de végétation
const DENS_SYM = { vert1: "vert1", vert2: "vert2", vert3: "vert3", jaune: "decouvert", jclair: "semi" };
function offsetGeo(pts, dist) { // dist > 0 : à gauche dans le sens de la marche
  const la0 = pts[0].lat, kx = 111320 * Math.cos(la0 * Math.PI / 180), ky = 110540;
  return pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let dx = (b.lon - a.lon) * kx, dy = (b.lat - a.lat) * ky; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L; return { lat: p.lat + dx * dist / ky, lon: p.lon - dy * dist / kx }; });
}
function densBandsGeo(t) {
  const out = [], w = t.bande || 15;
  (t.segments || []).forEach(seg => ["g", "d"].forEach(side => {
    let run = [];
    const flush = () => { if (run.length > 1 && run[0][side]) { const off = offsetGeo(run, side === "g" ? w : -w); out.push({ cls: run[0][side], poly: [...run, ...off.reverse()].map(p => [+(+p.lat).toFixed(7), +(+p.lon).toFixed(7)]) }); } run = []; };
    seg.forEach(p => { if (run.length && (p[side] || "") !== (run[run.length - 1][side] || "")) { const last = run[run.length - 1]; flush(); if (p[side]) run.push({ ...last, [side]: p[side] }); } run.push(p); });
    flush();
  }));
  return out;
}
const isAreaType = t => SYMI[t.type]?.k === "area";
function convertTraces(list) {
  const g = georef(); if (!g) return 0; const mm = mapMM(P); let n = 0;
  const toPx = gps => gps.map(([la, lo]) => { const q = g.toPx(la, lo); return [q.x, q.y]; });
  const gpsOf = seg => seg.map(p => [+(+p.lat).toFixed(7), +(+p.lon).toFixed(7)]);
  (list || P.gpsTraces || []).forEach(t => {
    if (isAreaType(t)) { t.segments.forEach(seg => { if (seg.length < 3) return; const gps = gpsOf(seg); P.features.push({ id: uid(6), sym: t.type, pts: simplify(toPx(gps), mm * .15), src: "terrain", gps }); n++; }); return; }
    densBandsGeo(t).forEach(b => { const sym = DENS_SYM[b.cls]; if (sym) P.features.push({ id: uid(6), sym, pts: simplify(toPx(b.poly), mm * .15), src: "terrain", gps: b.poly, dens: 1 }); });
    t.segments.forEach(seg => { if (seg.length < 2) return; const gps = gpsOf(seg); P.features.push({ id: uid(6), sym: SYMI[t.type] ? t.type : "chemin", pts: simplify(toPx(gps), mm * .15), src: "terrain", gps }); n++; });
  });
  if (!list) { P.gpsTraces = []; n += convertElts(); }
  return n;
}
function convertElts(list) {
  const g = georef(); if (!g) return 0; let n = 0;
  (list || P.gpsElts || []).forEach(e => { if (!SYMI[e.sym]) return; const q = g.toPx(e.lat, e.lon); P.features.push({ id: uid(6), sym: e.sym, x: q.x, y: q.y, src: "terrain", gpsPt: [+(+e.lat).toFixed(7), +(+e.lon).toFixed(7)], note: e.note || "" }); n++; });
  if (!list) P.gpsElts = [];
  return n;
}
// Après un nouveau calage (repères placés…), les chemins GPS sont redessinés depuis leurs points d'origine
function recalTraces() { const g = georef(); if (!g) return null; const mm = mapMM(P); let n = 0; P.features.filter(f => f.gps?.length > 1).forEach(f => { f.pts = simplify(f.gps.map(([la, lo]) => { const q = g.toPx(la, lo); return [q.x, q.y]; }), mm * .15); n++; }); P.features.filter(f => f.gpsPt).forEach(f => { const q = g.toPx(f.gpsPt[0], f.gpsPt[1]); f.x = q.x; f.y = q.y; n++; }); return n; }
function placeReperes() {
  const L = P.calib.filter(c => c.x == null);
  const m = openModal(`<h2>📌 Repères du terrain</h2><p class="muted">Chaque repère a été mesuré au GPS sur le terrain. Touche-en un, puis touche sur ta carte l'endroit exact où il se trouve : il devient un point de calage, et les chemins GPS se recalent dessus (même si ta carte n'est pas à l'échelle).</p>
   <div class="list">${L.map(c => `<div class="item">${c.photos?.[0] ? `<img src="${c.photos[0]}" style="width:64px;height:64px;object-fit:cover;border-radius:10px">` : '<div class="num" style="background:#d9f2e6">📌</div>'}<div class="body"><b>${esc(c.nom || "Repère")}</b><br><small class="muted">±${c.acc ?? "?"} m · <a target="_blank" href="${gmapsUrl(c.lat, c.lon)}">Google Maps</a></small></div><div class="row"><button class="btn small gr" data-pc="${c.id}">Placer</button><button class="btn small ghost" data-pd="${c.id}">✕</button></div></div>`).join("")}</div>`, { wide: true });
  $$("[data-pc]", m).forEach(b => b.onclick = () => { m.close(); ED.placeCal = b.dataset.pc; ED.tool = "select"; setPTab("carte"); });
  $$("[data-pd]", m).forEach(b => b.onclick = () => { P.calib = P.calib.filter(c => c.id !== b.dataset.pd); saveP(); m.close(); setPTab("carte"); });
}
function parseGPXText(txt, name) {
  const x = new DOMParser().parseFromString(txt, "application/xml"), tim = el => { const t = el.querySelector("time")?.textContent; return t ? Date.parse(t) : Date.now(); };
  const traces = [...x.querySelectorAll("trk")].map(trk => ({ id: uid(6), nom: trk.querySelector("name")?.textContent || name, type: "chemin", segments: [...trk.querySelectorAll("trkseg")].map(sg => [...sg.querySelectorAll("trkpt")].map(p => ({ lat: +p.getAttribute("lat"), lon: +p.getAttribute("lon"), t: tim(p) }))).filter(s => s.length > 1) })).filter(t => t.segments.length);
  const balises = [...x.querySelectorAll("wpt")].map(w => ({ n: parseInt(w.querySelector("name")?.textContent) || null, desc: (w.querySelector("desc")?.textContent || "").replace(/\s*\(±[\d.,]+ m\)\s*$/, "").trim(), lat: +w.getAttribute("lat"), lon: +w.getAttribute("lon"), acc: null, photos: [], t: tim(w) }));
  return { balises, traces };
}
async function importTerrain() {
  const f = await pickFile(".json,.gpx,application/json,application/gpx+xml,application/xml"); if (!f) return;
  let data;
  try { const txt = await f.text(); if (/\.gpx$/i.test(f.name) || txt.trim().startsWith("<")) data = parseGPXText(txt, f.name.replace(/\.gpx$/i, "")); else { const j = JSON.parse(txt); if (j.app !== "orienrun-terrain") throw new Error("Ce fichier ne vient pas de l'appli Terrain"); data = { balises: j.balises || [], traces: j.traces || [], reperes: j.reperes || [], elements: j.elements || [], corrige: j.corrige }; } }
  catch (e) { return toast(e.message || "Fichier illisible", "ko"); }
  const g = georef(), exist = n => P.controls.find(c => c.type === "C" && +c.n === +n);
  const m = openModal(`<h2>📥 Import depuis l'appli Terrain</h2><p class="muted" style="margin-top:-6px">${data.balises.length} balise(s), ${data.traces.length} chemin(s)${data.reperes?.length ? `, ${data.reperes.length} repère(s)` : ""}${data.elements?.length ? `, ${data.elements.length} élément(s)` : ""}.${data.corrige ? " Positions <b>déjà calées</b> sur la photo aérienne dans l'appli Terrain." : ""} ${g ? "La carte est calée : tout sera placé automatiquement." : "<b>La carte n'est pas encore calée</b> (2 points GPS minimum) : les balises gardent leur position GPS et les chemins attendront le calage."}</p>
   ${data.balises.length ? `<h3>Balises</h3><div class="tw"><table class="t"><thead><tr><th><input type="checkbox" id="tiAllB" checked></th><th>N°</th><th>Définition</th><th>Précision</th><th>Photos</th><th>Action</th></tr></thead><tbody>${data.balises.map((b, i) => { const e = b.n != null && exist(b.n); return `<tr><td><input type="checkbox" data-ib="${i}" checked></td><td><b>${esc(b.n ?? "?")}</b></td><td>${esc(b.desc || "")}</td><td>${b.acc ? `±${b.acc} m` : "–"}${b.imprecise ? ' <span class="chip ko">imprécise</span>' : ""}</td><td>${b.photos?.length || 0}</td><td>${e ? `<select data-ia="${i}" class="inp" style="min-height:34px;padding:2px 6px"><option value="maj">Mettre à jour la balise ${esc(b.n)} existante</option><option value="new">Créer une nouvelle balise</option></select>` : "Nouvelle balise"}</td></tr>`; }).join("")}</tbody></table></div>` : ""}
   ${data.traces.length ? `<h3>Chemins</h3><div class="tw"><table class="t"><thead><tr><th></th><th>Nom</th><th>Symbole sur la carte</th><th class="num">Points</th></tr></thead><tbody>${data.traces.map((t, i) => { const ar = isAreaType(t), nd = densBandsGeo(t).filter(b => DENS_SYM[b.cls]).length; return `<tr><td><input type="checkbox" data-it="${i}" checked></td><td>${esc(t.nom)}${ar ? ' <span class="chip">zone</span>' : ""}${nd ? ` <span class="chip ok">+ ${nd} bande(s) de densité</span>` : ""}</td><td><select data-is="${i}" class="inp" style="min-height:34px;padding:2px 6px">${SYM.filter(s => s.k === (ar ? "area" : "line")).map(s => `<option value="${s.id}" ${(SYMI[t.type] ? t.type : ar ? "vert1" : "chemin") === s.id ? "selected" : ""}>${esc(s.nom)}</option>`).join("")}</select></td><td class="num">${t.segments.reduce((s, x) => s + x.length, 0)}</td></tr>`; }).join("")}</tbody></table></div>` : ""}
   ${data.elements?.length ? `<h3>📍 Éléments ponctuels</h3><div class="tw"><table class="t"><thead><tr><th></th><th>Symbole</th><th>Précision</th></tr></thead><tbody>${data.elements.map((e, i) => `<tr><td><input type="checkbox" data-iel="${i}" checked></td><td>${esc(SYMI[e.sym]?.nom || e.sym)}${e.note ? " · " + esc(e.note) : ""}</td><td>±${e.acc ?? "?"} m</td></tr>`).join("")}</tbody></table></div>` : ""}
   ${data.reperes?.length ? `<h3>📌 Repères (points de calage à placer sur ta carte)</h3><div class="tw"><table class="t"><thead><tr><th></th><th>Nom</th><th>Précision</th></tr></thead><tbody>${data.reperes.map((r, i) => `<tr><td><input type="checkbox" data-ir="${i}" checked></td><td>${esc(r.nom)}</td><td>±${r.acc ?? "?"} m</td></tr>`).join("")}</tbody></table></div>` : ""}
   <div class="row" style="margin-top:14px"><button class="btn or" id="tiGo">Importer</button></div>`, { wide: true });
  $("#tiAllB", m) && ($("#tiAllB", m).onchange = e => $$("[data-ib]", m).forEach(x => x.checked = e.target.checked));
  $("#tiGo", m).onclick = async () => {
    pushUndo(); let nb = 0, nm = 0, nt = 0;
    for (const [i, b] of data.balises.entries()) {
      if (!$(`[data-ib="${i}"]`, m)?.checked) continue;
      const photos = []; for (const p of (b.photos || []).slice(0, 5)) { const s = await shrinkData(p); if (s) photos.push(s); }
      const act = $(`[data-ia="${i}"]`, m)?.value; let c = act === "maj" ? exist(b.n) : null;
      if (!c) { let n = b.n != null && !exist(b.n) ? +b.n : nextN(); c = { id: uid(6), type: "C", n, code: randCode(3), desc: "", x: null, y: null }; P.controls.push(c); nb++; } else nm++;
      Object.assign(c, { lat: b.lat, lon: b.lon, acc: b.acc ?? null, gpsT: b.t, desc: b.desc || c.desc || "", photos: photos.length ? photos : c.photos, imprecise: !!b.imprecise });
      if (g && c.x == null) { const q = g.toPx(c.lat, c.lon); c.x = q.x; c.y = q.y; c.calage = false; }
    }
    let nr = 0;
    for (const [i, r] of (data.reperes || []).entries()) { if (!$(`[data-ir="${i}"]`, m)?.checked) continue; if (P.calib.some(c => c.src === "terrain" && Math.abs(c.lat - r.lat) < 1e-7 && Math.abs(c.lon - r.lon) < 1e-7)) continue; const ph = r.photos?.[0] ? await shrinkData(r.photos[0], 480) : null; P.calib.push({ id: uid(6), x: null, y: null, lat: r.lat, lon: r.lon, acc: r.acc, nom: r.nom, photos: ph ? [ph] : [], src: "terrain", t: r.t }); nr++; }
    const tr = data.traces.filter((t, i) => $(`[data-it="${i}"]`, m)?.checked).map(t => ({ ...t, type: $(`[data-is="${data.traces.indexOf(t)}"]`, m).value }));
    if (tr.length) { if (g) nt = convertTraces(tr); else { P.gpsTraces = (P.gpsTraces || []).concat(tr.map(t => ({ id: t.id || uid(6), nom: t.nom, type: t.type, bande: t.bande, segments: t.segments.map(s => s.map(p => { const q = { lat: p.lat, lon: p.lon }; if (p.g) q.g = p.g; if (p.d) q.d = p.d; return q; })) }))); } }
    const el = (data.elements || []).filter((e, i) => $(`[data-iel="${i}"]`, m)?.checked).map(e => ({ sym: e.sym, note: e.note, lat: e.lat, lon: e.lon, acc: e.acc }));
    if (el.length) { if (g) convertElts(el); else P.gpsElts = (P.gpsElts || []).concat(el); }
    saveP(true); m.close();
    if (nr) setTimeout(() => toast(`📌 ${nr} repère(s) à placer sur la carte (onglet Carte) pour caler les chemins`, "ok"), 3500);
    toast(`Import : ${nb} nouvelle(s) balise(s), ${nm} mise(s) à jour${tr.length ? g ? `, ${nt} chemin(s)/zone(s) dessiné(s)` : `, ${tr.length} chemin(s)/zone(s) en attente du calage` : ""}${el.length ? `, ${el.length} élément(s)` : ""} ✓`, "ok");
    setPTab(ptab);
  };
}

// ================= Carte vierge à l'échelle, à partir des relevés GPS =================
function gpsExtent() {
  const pts = [];
  (P.gpsTraces || []).forEach(t => t.segments.forEach(sg => sg.forEach(p => pts.push([p.lat, p.lon]))));
  (P.gpsTraces || []).forEach(t => densBandsGeo(t).forEach(b => b.poly.forEach(q => pts.push(q))));
  (P.gpsElts || []).forEach(e => pts.push([e.lat, e.lon]));
  P.features.forEach(f => { (f.gps || []).forEach(q => pts.push(q)); if (f.gpsPt) pts.push(f.gpsPt); });
  P.controls.forEach(c => { if (c.lat != null) pts.push([c.lat, c.lon]); });
  P.calib.forEach(c => { if (c.lat != null) pts.push([c.lat, c.lon]); });
  if (!pts.length) return null;
  const la = pts.map(p => +p[0]), lo = pts.map(p => +p[1]);
  return { s: Math.min(...la), n: Math.max(...la), w: Math.min(...lo), e: Math.max(...lo), n_pts: pts.length };
}
function blankMapDialog() {
  const ex = gpsExtent();
  if (!ex) return toast("Aucun relevé GPS : importe d'abord des balises, chemins ou repères de l'appli Terrain.", "ko");
  const la0 = (ex.s + ex.n) / 2, kx = 111320 * Math.cos(la0 * Math.PI / 180), ky = 110540;
  const Wm = (ex.e - ex.w) * kx, Hm = (ex.n - ex.s) * ky;
  const sizes = sc => { const mg = Math.max(25, .08 * Math.max(Wm, Hm)); return { mg, w: (Wm + 2 * mg) / sc * 1000, h: (Hm + 2 * mg) / sc * 1000 }; };
  const fit = z => { const a = Math.max(z.w, z.h), b = Math.min(z.w, z.h); return a <= 277 && b <= 190 ? "A4" : a <= 400 && b <= 277 ? "A3" : null; };
  const scales = [1000, 2000, 4000, 5000, 7500, 10000, 15000];
  const best = scales.find(sc => fit(sizes(sc)) === "A4") || 15000;
  const m = openModal(`<h2>🗺 Créer une carte vierge à l'échelle</h2>
   <p class="muted">À partir de tes relevés GPS (${ex.n_pts} points, zone de ${Math.round(Wm)} × ${Math.round(Hm)} m), OrienRun crée une carte <b>orientée au nord et à l'échelle exacte</b>, déjà calée : les chemins, zones, densités, éléments et balises sont dessinés automatiquement. La photo aérienne IGN peut s'afficher dessous pour t'aider à compléter à la main (elle n'est jamais imprimée).</p>
   <div class="field"><label>Échelle</label><select class="inp" id="bmS">${scales.map(sc => { const z = sizes(sc), f = fit(z); return `<option value="${sc}" ${sc === best ? "selected" : ""}>1 : ${sc.toLocaleString("fr-FR")} — carte de ${Math.round(z.w)} × ${Math.round(z.h)} mm${f ? " (tient sur " + f + ")" : " (trop grande pour A3)"}</option>`; }).join("")}</select></div>
   <p class="muted" style="font-size:.85rem">Repères en CO scolaire : 1 : 2 000 à 1 : 5 000 pour un parc ou un établissement, 1 : 7 500 à 1 : 10 000 pour un bois.</p>
   ${P.map.img || P.features.some(f => !f.gps && !f.gpsPt) ? `<p class="chip ko" style="display:inline-block">Attention : ta carte actuelle ${P.map.img ? "(image) " : ""}sera remplacée. Les éléments dessinés à la main sans GPS risquent d'être mal placés.</p>` : ""}
   <div class="row" style="margin-top:12px"><button class="btn or" id="bmGo">Créer la carte</button></div>`, { wide: true });
  $("#bmGo", m).onclick = () => { const sc = +$("#bmS", m).value; m.close(); makeBlankMap(ex, sc, sizes(sc).mg); };
}
function makeBlankMap(ex, scale, mg) {
  pushUndo();
  const la0 = (ex.s + ex.n) / 2, lo0 = (ex.w + ex.e) / 2, kx = 111320 * Math.cos(la0 * Math.PI / 180), ky = 110540;
  const Wm = (ex.e - ex.w) * kx + 2 * mg, Hm = (ex.n - ex.s) * ky + 2 * mg;
  const wmm = Wm / scale * 1000, hmm = Hm / scale * 1000; let pxmm = 10; if (Math.max(wmm, hmm) * pxmm > 6000) pxmm = 6000 / Math.max(wmm, hmm);
  const w = Math.round(wmm * pxmm), h = Math.round(hmm * pxmm), mpp = Wm / w;
  const west = lo0 - Wm / 2 / kx, north = la0 + Hm / 2 / ky;
  const toPx = (lat, lon) => ({ x: (lon - west) * kx / mpp, y: (north - lat) * ky / mpp });
  const toLL = (x, y) => ({ lat: north - y * mpp / ky, lon: west + x * mpp / kx });
  P.map = { ...P.map, img: null, w, h, sym: pxmm * 297 / Math.max(w, h), scale, pxmm, fade: 0, frame: { west, north, kx, ky, mpp } };
  // calage automatique : les 4 coins + le centre (exacts par construction)
  P.calib = P.calib.filter(c => !c.auto).map(c => c.lat != null ? { ...c, ...toPx(c.lat, c.lon) } : c).filter(c => c.x != null || c.src === "terrain");
  [[0, 0], [w, 0], [0, h], [w, h], [w / 2, h / 2]].forEach(([x, y]) => P.calib.push({ id: uid(6), x, y, ...toLL(x, y), auto: true, nom: "Cadre de la carte" }));
  P.controls.forEach(c => { if (c.lat != null) { const q = toPx(c.lat, c.lon); c.x = q.x; c.y = q.y; } });
  recalTraces(); convertTraces();
  makeUnderlay(); P.map.showUnder = !!P.map.under;
  ED.view = null; saveP(true); setPTab("carte");
  toast(`Carte créée au 1 : ${scale.toLocaleString("fr-FR")} (${Math.round(wmm)} × ${Math.round(hmm)} mm) ✓`, "ok");
}
// photo aérienne IGN (BD ORTHO) sous la carte : tuiles Web Mercator positionnées dans le cadre
function makeUnderlay() {
  const F = P.map.frame; if (!F) { P.map.under = null; return; }
  const lat2y = (lat, z) => { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z; }, lon2x = (lon, z) => (lon + 180) / 360 * 2 ** z;
  const y2lat = (y, z) => { const n = Math.PI - 2 * Math.PI * y / 2 ** z; return 180 / Math.PI * Math.atan(Math.sinh(n)); }, x2lon = (x, z) => x / 2 ** z * 360 - 180;
  const south = F.north - P.map.h * F.mpp / F.ky, east = F.west + P.map.w * F.mpp / F.kx, la0 = (F.north + south) / 2;
  let z = Math.round(Math.log2(156543.03 * Math.cos(la0 * Math.PI / 180) / F.mpp)); z = Math.max(14, Math.min(19, z));
  let x0, x1, y0, y1; const rng = () => { x0 = Math.floor(lon2x(F.west, z)); x1 = Math.floor(lon2x(east, z)); y0 = Math.floor(lat2y(F.north, z)); y1 = Math.floor(lat2y(south, z)); };
  rng(); while ((x1 - x0 + 1) * (y1 - y0 + 1) > 160 && z > 14) { z--; rng(); }
  const px = (lat, lon) => ({ x: (lon - F.west) * F.kx / F.mpp, y: (F.north - lat) * F.ky / F.mpp }), tiles = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) { const a = px(y2lat(y, z), x2lon(x, z)), b = px(y2lat(y + 1, z), x2lon(x + 1, z)); tiles.push([x, y, +a.x.toFixed(1), +a.y.toFixed(1), +(b.x - a.x).toFixed(1), +(b.y - a.y).toFixed(1)]); }
  P.map.under = { z, tiles };
}
const ignTile = (z, x, y) => `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}`;
function underlaySVG(proj) { const U = proj.map?.under; if (!U) return ""; return `<g opacity=".55" pointer-events="none">${U.tiles.map(([x, y, px, py, pw, ph]) => `<image href="${ignTile(U.z, x, y)}" x="${px}" y="${py}" width="${pw + .6}" height="${ph + .6}" preserveAspectRatio="none"/>`).join("")}</g>`; }
// distance réelle entre deux points de la carte
function mapDist(a, b) {
  if (P.map.scale && P.map.pxmm) return Math.hypot(a.x - b.x, a.y - b.y) / P.map.pxmm * P.map.scale / 1000;
  const g = georef(); if (!g) return null; return haversine(g.toGeo(a.x, a.y), g.toGeo(b.x, b.y));
}
