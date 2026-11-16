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
function convertTraces(list) {
  const g = georef(); if (!g) return 0; const mm = mapMM(P); let n = 0;
  (list || P.gpsTraces || []).forEach(t => { t.segments.forEach(seg => { if (seg.length < 2) return; const px = seg.map(p => { const q = g.toPx(p.lat, p.lon); return [q.x, q.y]; }); P.features.push({ id: uid(6), sym: SYMI[t.type] ? t.type : "chemin", pts: simplify(px, mm * .3), src: "terrain" }); n++; }); });
  if (!list) P.gpsTraces = [];
  return n;
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
  try { const txt = await f.text(); if (/\.gpx$/i.test(f.name) || txt.trim().startsWith("<")) data = parseGPXText(txt, f.name.replace(/\.gpx$/i, "")); else { const j = JSON.parse(txt); if (j.app !== "orienrun-terrain") throw new Error("Ce fichier ne vient pas de l'appli Terrain"); data = { balises: j.balises || [], traces: j.traces || [] }; } }
  catch (e) { return toast(e.message || "Fichier illisible", "ko"); }
  const g = georef(), exist = n => P.controls.find(c => c.type === "C" && +c.n === +n);
  const m = openModal(`<h2>📥 Import depuis l'appli Terrain</h2><p class="muted" style="margin-top:-6px">${data.balises.length} balise(s), ${data.traces.length} chemin(s). ${g ? "La carte est calée : tout sera placé automatiquement." : "<b>La carte n'est pas encore calée</b> (2 points GPS minimum) : les balises gardent leur position GPS et les chemins attendront le calage."}</p>
   ${data.balises.length ? `<h3>Balises</h3><div class="tw"><table class="t"><thead><tr><th><input type="checkbox" id="tiAllB" checked></th><th>N°</th><th>Définition</th><th>Précision</th><th>Photos</th><th>Action</th></tr></thead><tbody>${data.balises.map((b, i) => { const e = b.n != null && exist(b.n); return `<tr><td><input type="checkbox" data-ib="${i}" checked></td><td><b>${esc(b.n ?? "?")}</b></td><td>${esc(b.desc || "")}</td><td>${b.acc ? `±${b.acc} m` : "–"}${b.imprecise ? ' <span class="chip ko">imprécise</span>' : ""}</td><td>${b.photos?.length || 0}</td><td>${e ? `<select data-ia="${i}" class="inp" style="min-height:34px;padding:2px 6px"><option value="maj">Mettre à jour la balise ${esc(b.n)} existante</option><option value="new">Créer une nouvelle balise</option></select>` : "Nouvelle balise"}</td></tr>`; }).join("")}</tbody></table></div>` : ""}
   ${data.traces.length ? `<h3>Chemins</h3><div class="tw"><table class="t"><thead><tr><th></th><th>Nom</th><th>Symbole sur la carte</th><th class="num">Points</th></tr></thead><tbody>${data.traces.map((t, i) => `<tr><td><input type="checkbox" data-it="${i}" checked></td><td>${esc(t.nom)}</td><td><select data-is="${i}" class="inp" style="min-height:34px;padding:2px 6px">${SYM.filter(s => s.k === "line").map(s => `<option value="${s.id}" ${(SYMI[t.type] ? t.type : "chemin") === s.id ? "selected" : ""}>${esc(s.nom)}</option>`).join("")}</select></td><td class="num">${t.segments.reduce((s, x) => s + x.length, 0)}</td></tr>`).join("")}</tbody></table></div>` : ""}
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
    const tr = data.traces.filter((t, i) => $(`[data-it="${i}"]`, m)?.checked).map(t => ({ ...t, type: $(`[data-is="${data.traces.indexOf(t)}"]`, m).value }));
    if (tr.length) { if (g) nt = convertTraces(tr); else { P.gpsTraces = (P.gpsTraces || []).concat(tr.map(t => ({ id: t.id || uid(6), nom: t.nom, type: t.type, segments: t.segments.map(s => s.map(p => ({ lat: p.lat, lon: p.lon }))) }))); } }
    saveP(true); m.close();
    toast(`Import : ${nb} nouvelle(s) balise(s), ${nm} mise(s) à jour${tr.length ? g ? `, ${nt} chemin(s) dessiné(s)` : `, ${tr.length} chemin(s) en attente du calage` : ""} ✓`, "ok");
    setPTab(ptab);
  };
}
