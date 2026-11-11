// ================= BALISES =================
const baliseUrl = c => `${appUrl()}#b=${encodeURIComponent(c.n)}.${c.code}`;
function viewBalises(v) {
  const C = P.controls.slice().sort((a, b) => (a.type === "C") - (b.type === "C") || String(a.type).localeCompare(b.type) || (+a.n || 0) - (+b.n || 0));
  const g = georef();
  v.innerHTML = `<div class="pmain">
   <div class="panel" style="margin-top:0"><h2>Balises</h2>
    <p class="muted" style="margin-top:-6px">Crée tes balises sur place (géolocalisation + lien Google Maps), imprime-les avec leur QR code, puis place-les sur la carte. Une balise placée sur la carte <b>et</b> géolocalisée sert aussi au calage de la carte.</p>
    <div class="row"><button class="btn or" id="bNewGps">📍 Nouvelle balise ici (GPS)</button><button class="btn alt" id="bNew">＋ Nouvelle balise</button><button class="btn alt" id="bNewS">＋ Départ</button><button class="btn alt" id="bNewF">＋ Arrivée</button></div>
    <div class="row" style="margin-top:10px"><button class="btn" id="bPrint">🖨 Imprimer les balises (QR)</button><button class="btn ghost" id="bFiche">📋 Fiche de pose / ramassage</button><button class="btn ghost" id="bSat">🛰 Voir sur fond satellite</button>${P.controls.some(c => String(c.code).length < 3) ? `<button class="btn ghost" id="bCode3">🔤 Passer tous les codes à 3 lettres</button>` : ""}${g && P.controls.some(c => c.lat != null && c.x == null) ? `<button class="btn ghost" id="bAuto">🧲 Placer sur la carte d'après le GPS</button>` : ""}</div>
   </div>
   <div class="list" style="margin-top:14px">${C.length ? C.map(c => `<div class="item"><div class="num ${c.type}">${esc(c.type === "C" ? c.n : c.type === "S" ? "▲" : "◎")}</div>
     <div class="body"><b>${esc(ctrlLabel(c))}</b> <span class="chip">code ${esc(c.code)}</span> ${c.desc ? `<span class="muted">· ${esc(c.desc)}</span>` : ""}<br>
     <small class="muted">${c.lat != null ? `📍 ${c.lat.toFixed(5)}, ${c.lon.toFixed(5)} (±${Math.round(c.acc || 0)} m) · <a href="${gmapsUrl(c.lat, c.lon)}" target="_blank">Google Maps</a>` : "📍 pas encore géolocalisée"} · ${c.x != null ? "🗺 placée sur la carte" : "<b style='color:var(--red)'>🗺 pas sur la carte</b>"}</small></div>
     <div class="row"><button class="btn small or" data-gps="${c.id}">📍 Géolocaliser</button><button class="btn small alt" data-ed="${c.id}">Modifier</button>${c.x == null ? `<button class="btn small ghost" data-pl="${c.id}">Placer</button>` : ""}</div></div>`).join("") : `<div class="panel muted">Aucune balise pour l'instant.</div>`}</div></div>`;
  const mk = (type, gps) => { const c = { id: uid(6), type, n: type === "C" ? nextN() : type === "S" ? "D" + (P.controls.filter(x => x.type === "S").length || "") : "A" + (P.controls.filter(x => x.type === "F").length || ""), code: randCode(3), desc: "", x: null, y: null, lat: null, lon: null, acc: null }; P.controls.push(c); saveP(); if (gps) gpsControl(c.id, true); else editControl(c.id); };
  $("#bNewGps").onclick = () => mk("C", true); $("#bNew").onclick = () => mk("C"); $("#bNewS").onclick = () => mk("S"); $("#bNewF").onclick = () => mk("F");
  $("#bPrint").onclick = printBalises; $("#bFiche").onclick = printFiche; $("#bSat").onclick = () => satView();
  $("#bCode3") && ($("#bCode3").onclick = () => { if (!confirm("Donner un nouveau code de 3 lettres aux balises qui ont un code plus court ?\n⚠ Il faudra réimprimer ces balises.")) return; pushUndo(); let n = 0; P.controls.forEach(c => { if (String(c.code).length < 3) { c.code = randCode(3); n++; } }); saveP(); toast(n + " code(s) changé(s) : pense à réimprimer", "ok"); setPTab("balises"); });
  $("#bAuto") && ($("#bAuto").onclick = () => { const g = georef(); let n = 0; P.controls.forEach(c => { if (c.lat != null && c.x == null) { const q = g.toPx(c.lat, c.lon); c.x = q.x; c.y = q.y; c.calage = false; n++; } }); saveP(); toast(n + " balise(s) placée(s) d'après le GPS", "ok"); setPTab("balises"); });
  $$("[data-gps]", v).forEach(b => b.onclick = () => gpsControl(b.dataset.gps));
  $$("[data-ed]", v).forEach(b => b.onclick = () => editControl(b.dataset.ed));
  $$("[data-pl]", v).forEach(b => b.onclick = () => { ED.place = b.dataset.pl; ED.tool = "select"; setPTab("carte"); });
}
function gpsControl(id, isNew) {
  const c = ctrlById(id);
  const m = openModal(`<h2>📍 ${esc(ctrlLabel(c))}</h2><p class="muted">Pose-toi exactement à l'endroit de la balise, téléphone/tablette à plat, et attends la fin de la mesure. Plus la mesure est longue, plus elle est précise.</p>
   <div class="row"><button class="btn or" data-s="10">Mesurer (10 s)</button><button class="btn alt" data-s="30">Mesure précise (30 s)</button></div>
   <p id="gp" class="muted"></p><div id="gres"></div>`, { onClose: () => { if (ptab === "balises") setPTab("balises"); } });
  const show = () => { $("#gres", m).innerHTML = c.lat != null ? `<div class="panel"><b>${c.lat.toFixed(6)}, ${c.lon.toFixed(6)}</b> (±${Math.round(c.acc || 0)} m)<div class="row" style="margin-top:8px"><a class="btn small alt" target="_blank" href="${gmapsUrl(c.lat, c.lon)}">Ouvrir dans Google Maps</a><button class="btn small ghost" id="cpy">Copier le lien</button>${isNew ? `<button class="btn small green" id="next">＋ Balise suivante</button>` : ""}<button class="btn small" id="det">Détails…</button></div></div>` : "";
    $("#cpy", m) && ($("#cpy", m).onclick = () => { navigator.clipboard?.writeText(gmapsUrl(c.lat, c.lon)); toast("Lien copié"); });
    $("#next", m) && ($("#next", m).onclick = () => { m.remove(); const n = { id: uid(6), type: "C", n: nextN(), code: randCode(3), desc: "", x: null, y: null, lat: null, lon: null, acc: null }; P.controls.push(n); saveP(); gpsControl(n.id, true); });
    $("#det", m) && ($("#det", m).onclick = () => { m.remove(); editControl(c.id); }); };
  $$("[data-s]", m).forEach(b => b.onclick = async () => { $$("[data-s]", m).forEach(x => x.disabled = true); try { const r = await measureGPS(+b.dataset.s, p => $("#gp", m).textContent = `${p.n} mesure(s)${p.acc ? ` · dernière ±${Math.round(p.acc)} m` : ""} · encore ${Math.ceil(p.left)} s`); Object.assign(c, { lat: r.lat, lon: r.lon, acc: r.acc, gpsT: r.t }); const g = georef(); if (c.x == null && g) { const q = g.toPx(c.lat, c.lon); c.x = q.x; c.y = q.y; c.calage = false; } saveP(); $("#gp", m).textContent = `✓ ${r.n} mesures`; show(); } catch (e) { $("#gp", m).textContent = "✕ " + e.message; } $$("[data-s]", m).forEach(x => x.disabled = false); });
  show();
}
function editControl(id) {
  const c = ctrlById(id);
  const m = openModal(`<h2>${esc(ctrlLabel(c))}</h2><div class="grid2">
   <div>${c.type === "C" ? `<div class="field"><label>Numéro de balise</label><input class="inp" id="eN" type="number" value="${esc(c.n)}"></div>` : `<div class="field"><label>Nom</label><input class="inp" id="eN" value="${esc(c.n)}"></div>`}
   <div class="field"><label>Code de contrôle (écrit sous le QR)</label><div class="row"><input class="inp grow" id="eCode" value="${esc(c.code)}" maxlength="4" style="text-transform:uppercase;width:auto"><button class="btn small ghost" id="eRnd">↻</button></div></div>
   <div class="field"><label>Définition du poste</label><input class="inp" id="eDesc" list="dlDesc" value="${esc(c.desc)}" placeholder="ex. Angle de bâtiment"><datalist id="dlDesc">${DESCRIPTIONS.map(d => `<option>${d}</option>`).join("")}</datalist></div>
   <div class="field"><label>Position GPS</label><input class="inp" id="eGps" value="${c.lat != null ? c.lat.toFixed(6) + ", " + c.lon.toFixed(6) : ""}" placeholder="lat, lon ou lien Google Maps"><small class="muted">${c.lat != null ? `±${Math.round(c.acc || 0)} m · <a target="_blank" href="${gmapsUrl(c.lat, c.lon)}">Google Maps</a>` : ""}</small></div>
   <label class="row" style="gap:6px"><input type="checkbox" id="eCal" ${c.calage !== false ? "checked" : ""}> Utiliser cette balise pour caler la carte</label>
   </div><div style="text-align:center"><div style="max-width:220px;margin:0 auto" id="eQr"></div><small class="muted" style="word-break:break-all">${esc(baliseUrl(c))}</small></div></div>
   <div class="row" style="margin-top:14px"><button class="btn green" id="eSave">Enregistrer</button><button class="btn or" id="eGeo">📍 Géolocaliser</button><button class="btn alt" id="ePlace">🗺 ${c.x == null ? "Placer" : "Déplacer"} sur la carte</button><button class="btn red" id="eDel">Supprimer</button></div>`, { onClose: () => { if (ptab === "balises") setPTab("balises"); } });
  const qr = () => $("#eQr", m).innerHTML = QR.svg(baliseUrl({ ...c, n: $("#eN", m).value, code: $("#eCode", m).value.toUpperCase() }));
  qr(); $("#eN", m).oninput = $("#eCode", m).oninput = qr;
  $("#eRnd", m).onclick = () => { $("#eCode", m).value = randCode(3); qr(); };
  const save = () => {
    const n = c.type === "C" ? parseInt($("#eN", m).value) : $("#eN", m).value.trim();
    if (c.type === "C" && (!n || P.controls.some(x => x !== c && x.type === "C" && +x.n === n))) { toast("Numéro invalide ou déjà utilisé", "ko"); return false; }
    pushUndo(); c.n = n; c.code = ($("#eCode", m).value.trim().toUpperCase() || randCode(3)); c.desc = $("#eDesc", m).value.trim(); c.calage = $("#eCal", m).checked;
    const g = parseLatLon($("#eGps", m).value); if (g && (c.lat == null || Math.abs(g.lat - c.lat) > 1e-6 || Math.abs(g.lon - c.lon) > 1e-6)) { c.lat = g.lat; c.lon = g.lon; c.acc = null; } if (!$("#eGps", m).value.trim()) { c.lat = c.lon = c.acc = null; }
    saveP(); return true;
  };
  $("#eSave", m).onclick = () => { if (save()) { m.close(); if (ptab === "carte") { renderEditor(); renderBar(); } } };
  $("#eGeo", m).onclick = () => { if (save()) { m.remove(); gpsControl(c.id); } };
  $("#ePlace", m).onclick = () => { if (save()) { closeModals(); ED.place = c.id; ED.tool = "select"; setPTab("carte"); } };
  $("#eDel", m).onclick = () => { if (confirm("Supprimer " + ctrlLabel(c) + " ?")) { pushUndo(); delControl(c.id); saveP(); m.close(); if (ptab === "carte") { ED.sel = null; renderEditor(); renderBar(); } } };
}

// ---------- impressions ----------
function printWin(title, body, css = "") {
  const w = window.open("", "_blank"); if (!w) return toast("Autorise les fenêtres surgissantes pour imprimer", "ko");
  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  @page{size:A4;margin:10mm}body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#111}h1{font-size:18pt;margin:0 0 4mm}
  .noprint{position:sticky;top:0;background:#14213d;color:#fff;padding:10px;display:flex;gap:10px;align-items:center;font-size:14px}.noprint button{font-size:16px;padding:8px 16px;border-radius:20px;border:0;background:#f47a20;color:#fff;font-weight:700}
  @media print{.noprint{display:none}} ${css}</style></head><body><div class="noprint"><button onclick="print()">🖨 Imprimer</button><span>Conseil : imprime en couleur, à 100 % (sans « ajuster »).</span></div>${body}</body></html>`);
  w.document.close();
}
function printBalises() {
  const C = P.controls.slice().sort((a, b) => String(a.type).localeCompare(b.type) || (+a.n || 0) - (+b.n || 0));
  if (!C.length) return toast("Aucune balise", "ko");
  const small = confirm("Format compact : 4 balises par page ?\n(OK = 4 par page, Annuler = 2 grandes par page)");
  const card = c => `<div class="bal"><div class="hd">COURSE D'ORIENTATION · EPS</div><div class="in"><div class="fl"><svg viewBox="0 0 100 100"><path d="M0 0H100L0 100Z" fill="#fff"/><path d="M100 0V100H0Z" fill="#f47a20"/><rect x="1" y="1" width="98" height="98" fill="none" stroke="#000" stroke-width="2"/></svg><div class="nb">${esc(c.type === "C" ? c.n : c.type === "S" ? "DÉPART" : "ARRIVÉE")}</div></div>
    <div class="qr">${QR.svg(baliseUrl(c), { ecl: "Q" })}<div class="cd">Code : <b>${esc(c.code)}</b></div></div></div>
    <div class="ft">Scanne avec l'appli <b>OrienRun</b> (ou l'appareil photo) · Ne pas déplacer, merci !${c.desc ? ` · ${esc(c.desc)}` : ""}</div></div>`;
  printWin("Balises", `<div class="pages">${C.map(card).join("")}</div>`, `
   .pages{display:grid;grid-template-columns:${small ? "1fr 1fr" : "1fr"};gap:6mm}
   .bal{border:1.5mm solid #f47a20;border-radius:4mm;padding:${small ? 4 : 7}mm;height:${small ? 132 : 132}mm;box-sizing:border-box;display:flex;flex-direction:column;page-break-inside:avoid;break-inside:avoid}
   .hd{font-weight:700;letter-spacing:.1em;font-size:${small ? 8 : 12}pt;text-align:center}
   .in{flex:1;display:flex;align-items:center;justify-content:space-around;gap:4mm;${small ? "flex-direction:column" : ""}}
   .fl{position:relative;width:${small ? 40 : 90}mm;height:${small ? 40 : 90}mm}.fl svg{width:100%;height:100%}
   .nb{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${small ? 26 : 62}pt;text-shadow:0 0 2mm #fff,0 0 2mm #fff,0 0 1mm #fff}
   .nb{font-size:${small ? 26 : 62}pt}
   .qr{text-align:center}.qr svg{width:${small ? 38 : 80}mm;height:${small ? 38 : 80}mm}.cd{font-size:${small ? 11 : 20}pt;margin-top:1mm}
   .ft{text-align:center;font-size:${small ? 7 : 10}pt;color:#444}
   ${small ? ".bal{height:132mm}" : ""}`);
}
function printFiche() {
  const C = P.controls.slice().sort((a, b) => String(a.type).localeCompare(b.type) || (+a.n || 0) - (+b.n || 0));
  printWin("Fiche de pose", `<h1>${esc(P.nom)} — fiche de pose / ramassage des balises</h1><table><thead><tr><th>Balise</th><th>Code</th><th>Définition</th><th>Coordonnées GPS</th><th>Google Maps</th><th>Posée</th><th>Ramassée</th></tr></thead><tbody>${C.map(c => `<tr><td><b>${esc(ctrlLabel(c))}</b></td><td>${esc(c.code)}</td><td>${esc(c.desc || "")}</td><td>${c.lat != null ? `${c.lat.toFixed(6)}, ${c.lon.toFixed(6)}<br><small>±${Math.round(c.acc || 0)} m</small>` : "–"}</td><td>${c.lat != null ? QR.svg(gmapsUrl(c.lat, c.lon), { ecl: "L", border: 1 }) : ""}</td><td>☐</td><td>☐</td></tr>`).join("")}</tbody></table>`,
    `table{border-collapse:collapse;width:100%;font-size:10pt}td,th{border:1px solid #999;padding:2mm;text-align:left}td svg{width:22mm;height:22mm}tr{page-break-inside:avoid}`);
}
async function satView(extra) {
  const m = openModal(`<h2>Fond satellite</h2><div id="sat" style="height:65vh;border-radius:14px;background:#ddd"></div><p class="muted" style="font-size:.8rem">Orange : balises géolocalisées · vert : points de calage.</p>`, { wide: true });
  try {
    loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"); await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
    const map = L.map($("#sat", m)); L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 20, maxNativeZoom: 19, attribution: "Esri" }).addTo(map);
    const pts = [];
    P.controls.filter(c => c.lat != null).forEach(c => { pts.push([c.lat, c.lon]); L.circleMarker([c.lat, c.lon], { radius: 9, color: "#fff", fillColor: "#f47a20", fillOpacity: 1, weight: 2 }).addTo(map).bindTooltip(String(c.n), { permanent: true, direction: "right" }); if (c.acc) L.circle([c.lat, c.lon], { radius: c.acc, color: "#f47a20", weight: 1, fillOpacity: .1 }).addTo(map); });
    P.calib.forEach(c => { pts.push([c.lat, c.lon]); L.circleMarker([c.lat, c.lon], { radius: 6, color: "#fff", fillColor: "#1a9b55", fillOpacity: 1, weight: 2 }).addTo(map); });
    extra && extra(map, pts);
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 19 }); else map.setView([46.6, 2.4], 6);
    return map;
  } catch (e) { $("#sat", m).innerHTML = `<p style="padding:20px">${esc(e.message)}</p>`; }
}

// ================= PARCOURS =================
const modeNom = { ordre: "En ordre imposé", libre: "Dans le désordre", score: "Au score (temps limité)" };
function viewParcours(v) {
  v.innerHTML = `<div class="pmain"><div class="panel" style="margin-top:0"><h2>Parcours</h2><p class="muted" style="margin-top:-6px">Un parcours = une suite de balises. Les élèves choisissent leur parcours en scannant le QR code de départ (onglet Leçon live).</p>
    <button class="btn or" id="cNew">＋ Nouveau parcours</button></div>
    <div class="list" style="margin-top:14px">${P.courses.map(k => { const st = courseStats(k); return `<div class="item"><div class="num" style="background:var(--violet);color:#fff;text-shadow:none;font-size:1.25rem">${esc(k.k)}</div><div class="body"><b>${esc(k.nom || k.k)}</b> <span class="chip vi">${modeNom[k.mode]}</span><br><small class="muted">${k.ctrl.length} balise(s)${k.choix ? ` · l'élève choisit${k.nb ? " " + k.nb : ""}` : ""}${st.dist ? ` · ≈ ${fmtDist(st.dist)} à vol d'oiseau` : ""}${k.valid === "prof" ? " · validation par l'enseignant" : ""}${k.mode === "score" && k.tm ? ` · ${k.tm} min` : ""}</small><div class="seq" style="margin-top:6px;background:none;padding:0">${k.ctrl.map((id, i) => { const c = ctrlById(id); return c ? `<span>${k.mode === "ordre" ? `<i>${i + 1}</i>` : ""}${esc(c.n)}</span>` : ""; }).join("")}</div></div>
      <div class="row"><button class="btn small alt" data-ed="${k.id}">Modifier</button><button class="btn small" data-pr="${k.id}">🖨 Carte</button><button class="btn small ghost" data-dup="${k.id}">Dupliquer</button></div></div>`; }).join("") || `<div class="panel muted">Aucun parcours. Crée d'abord tes balises, puis un parcours.</div>`}</div></div>`;
  $("#cNew").onclick = () => { const n = P.courses.length + 1; const k = { id: uid(6), k: "P" + n, nom: "Parcours " + n, mode: "ordre", ctrl: [], depart: P.controls.find(c => c.type === "S")?.id || null, arrivee: P.controls.find(c => c.type === "F")?.id || null, tm: null, pen: 5, pts: {}, valid: "auto", choix: false, nb: null, desc: true, carte: true }; P.courses.push(k); saveP(); editCourse(k.id); };
  $$("[data-ed]", v).forEach(b => b.onclick = () => editCourse(b.dataset.ed));
  $$("[data-pr]", v).forEach(b => b.onclick = () => printCourse(P.courses.find(k => k.id === b.dataset.pr)));
  $$("[data-dup]", v).forEach(b => b.onclick = () => { const k = JSON.parse(JSON.stringify(P.courses.find(x => x.id === b.dataset.dup))); k.id = uid(6); k.k = "P" + (P.courses.length + 1); k.nom += " (copie)"; P.courses.push(k); saveP(); setPTab("parcours"); });
}
function courseStats(k) {
  const seq = [k.depart, ...k.ctrl, k.arrivee].filter(Boolean).map(ctrlById).filter(c => c && c.lat != null);
  let d = 0; if (k.mode === "ordre") for (let i = 1; i < seq.length; i++) d += haversine(seq[i - 1], seq[i]);
  return { dist: k.mode === "ordre" && seq.length > 1 ? d : null };
}
function editCourse(id) {
  const k = P.courses.find(x => x.id === id); const balises = P.controls.filter(c => c.type === "C").sort((a, b) => a.n - b.n);
  const S = P.controls.filter(c => c.type === "S"), F = P.controls.filter(c => c.type === "F");
  const m = openModal(`<h2>Parcours</h2><div class="grid2">
   <div class="field"><label>Code (court, pour les élèves)</label><input class="inp" id="kK" value="${esc(k.k)}" maxlength="6"></div>
   <div class="field"><label>Nom</label><input class="inp" id="kNom" value="${esc(k.nom)}"></div>
   <div class="field"><label>Type de parcours</label><select class="inp" id="kMode">${Object.entries(modeNom).map(([a, b]) => `<option value="${a}" ${k.mode === a ? "selected" : ""}>${b}</option>`).join("")}</select></div>
   <div class="field"><label>Validation des balises</label><select class="inp" id="kVal"><option value="auto">Automatique (QR code / code juste)</option><option value="prof" ${k.valid === "prof" ? "selected" : ""}>Je confirme chaque balise sur ma tablette</option></select></div>
   <div class="field"><label>Départ</label><select class="inp" id="kDep"><option value="">— aucun (départ libre) —</option>${S.map(c => `<option value="${c.id}" ${k.depart === c.id ? "selected" : ""}>${esc(ctrlLabel(c))} ${esc(c.n)}</option>`).join("")}</select></div>
   <div class="field"><label>Arrivée</label><select class="inp" id="kArr"><option value="">— aucune (bouton « J'ai fini ») —</option>${F.map(c => `<option value="${c.id}" ${k.arrivee === c.id ? "selected" : ""}>${esc(ctrlLabel(c))} ${esc(c.n)}</option>`).join("")}</select></div>
   </div>
   <div id="kScore" class="grid2"><div class="field"><label>Temps limite (minutes)</label><input class="inp" id="kTm" type="number" min="1" value="${k.tm ?? ""}"></div><div class="field"><label>Pénalité par minute de retard (points)</label><input class="inp" id="kPen" type="number" min="0" value="${k.pen ?? 5}"></div></div>
   <div id="kLibre"><label class="row" style="gap:6px;margin-bottom:8px"><input type="checkbox" id="kChoix" ${k.choix ? "checked" : ""}> L'élève choisit lui-même la liste des balises qu'il veut trouver</label>
     <div class="field" id="kNbF"><label>Nombre de balises à choisir (vide = libre)</label><input class="inp" id="kNb" type="number" min="1" value="${k.nb ?? ""}" style="max-width:160px"></div></div>
   <h3>Balises <small class="muted" id="kHint"></small></h3>
   <div class="cchips" id="kChips">${balises.map(c => `<button class="cchip" data-c="${c.id}">${esc(c.n)}</button>`).join("") || `<span class="muted">Crée d'abord des balises.</span>`}</div>
   <div class="row" style="margin-top:8px"><button class="btn small ghost" id="kAll">Toutes</button><button class="btn small ghost" id="kNone">Aucune</button></div>
   <div class="seq" id="kSeq" style="margin-top:10px"></div>
   <div id="kPts"></div>
   <h3>Options élève</h3>
   <label class="row" style="gap:6px"><input type="checkbox" id="kDesc" ${k.desc !== false ? "checked" : ""}> Afficher les définitions de postes sur le téléphone</label>
   <label class="row" style="gap:6px;margin-top:6px"><input type="checkbox" id="kFb" ${k.fb ? "checked" : ""}> Dire tout de suite à l'élève si sa balise est juste ou fausse <small class="muted">(sinon c'est toi qui le notifies depuis la tablette)</small></label>
   <label class="row" style="gap:6px;margin-top:6px"><input type="checkbox" id="kCarte" ${k.carte !== false ? "checked" : ""}> Envoyer la carte sur le téléphone (si le serveur est configuré)</label>
   <div style="margin-top:12px;border-radius:12px;overflow:hidden;background:#ddd"><svg id="kPrev" style="width:100%;display:block" viewBox="0 0 ${P.map.w} ${P.map.h}"></svg></div>
   <div class="row" style="margin-top:14px"><button class="btn green" id="kSave">Enregistrer</button><button class="btn" id="kPrint">🖨 Imprimer la carte</button><button class="btn red" id="kDel">Supprimer</button></div>`, { wide: true, onClose: () => setPTab("parcours") });
  const ui = () => {
    const mode = $("#kMode", m).value;
    $("#kScore", m).classList.toggle("hidden", mode !== "score"); $("#kLibre", m).classList.toggle("hidden", mode === "ordre"); $("#kNbF", m).classList.toggle("hidden", !$("#kChoix", m).checked);
    $("#kHint", m).textContent = mode === "ordre" ? "(touche-les dans l'ordre du circuit)" : "(touche pour ajouter / retirer)";
    $$(".cchip", m).forEach(b => b.classList.toggle("on", k.ctrl.includes(b.dataset.c)));
    $("#kSeq", m).innerHTML = k.ctrl.map((id, i) => `<span data-rm="${i}">${mode === "ordre" ? `<i>${i + 1}</i>` : ""}${esc(ctrlById(id)?.n)} ✕</span>`).join("") || `<span style="background:none;color:var(--ink2)">Aucune balise</span>`;
    $$("[data-rm]", m).forEach(s => s.onclick = () => { k.ctrl.splice(+s.dataset.rm, 1); ui(); });
    $("#kPts", m).innerHTML = mode === "score" ? `<h3>Points par balise</h3><div class="cchips">${k.ctrl.map(id => `<label class="chip" style="padding:4px 8px">${esc(ctrlById(id)?.n)} <input type="number" data-p="${id}" value="${k.pts[id] ?? 10}" style="width:56px;border:1px solid var(--line);border-radius:6px;padding:2px 4px"></label>`).join("")}</div>` : "";
    $$("[data-p]", m).forEach(i => i.oninput = () => k.pts[i.dataset.p] = +i.value);
    const tmp = { ...k, mode, depart: $("#kDep", m).value || null, arrivee: $("#kArr", m).value || null };
    $("#kPrev", m).innerHTML = mapSVG(P, { course: tmp });
  };
  $$(".cchip", m).forEach(b => b.onclick = () => { const id = b.dataset.c, mode = $("#kMode", m).value; const i = k.ctrl.indexOf(id); if (mode === "ordre") k.ctrl.push(id); else if (i >= 0) k.ctrl.splice(i, 1); else k.ctrl.push(id); ui(); });
  $("#kAll", m).onclick = () => { k.ctrl = balises.map(c => c.id); ui(); }; $("#kNone", m).onclick = () => { k.ctrl = []; ui(); };
  ["kMode", "kChoix", "kDep", "kArr"].forEach(i => $("#" + i, m).onchange = ui);
  const save = () => {
    const code = $("#kK", m).value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!code || P.courses.some(x => x !== k && x.k === code)) { toast("Code de parcours vide ou déjà utilisé", "ko"); return false; }
    Object.assign(k, { k: code, nom: $("#kNom", m).value.trim(), mode: $("#kMode", m).value, valid: $("#kVal", m).value, depart: $("#kDep", m).value || null, arrivee: $("#kArr", m).value || null, tm: +$("#kTm", m).value || null, pen: +$("#kPen", m).value || 0, choix: $("#kChoix", m).checked, nb: +$("#kNb", m).value || null, desc: $("#kDesc", m).checked, fb: $("#kFb", m).checked, carte: $("#kCarte", m).checked });
    if (k.mode === "ordre") k.choix = false;
    saveP(); return true;
  };
  $("#kSave", m).onclick = () => { if (save()) m.close(); };
  $("#kPrint", m).onclick = () => { if (save()) printCourse(k); };
  $("#kDel", m).onclick = () => { if (confirm("Supprimer ce parcours ?")) { P.courses = P.courses.filter(x => x !== k); saveP(); m.close(); } };
  ui();
}
function printCourse(k) {
  const land = P.map.w >= P.map.h;
  const list = k.ctrl.map((id, i) => { const c = ctrlById(id); return c ? `<tr><td>${k.mode === "ordre" ? i + 1 : ""}</td><td><b>${esc(c.n)}</b></td><td>${esc(c.desc || "")}</td>${k.mode === "score" ? `<td>${k.pts[id] ?? 10} pts</td>` : ""}<td class="w"></td></tr>` : ""; }).join("");
  printWin("Carte " + k.k, `<div class="page"><div class="top"><h1>${esc(P.nom)} — ${esc(k.nom || k.k)}</h1><span>Nom : ____________________ Classe : ______</span></div>
   <div class="mapbox"><svg viewBox="0 0 ${P.map.w} ${P.map.h}" preserveAspectRatio="xMidYMid meet">${mapSVG(P, { course: k })}</svg></div>
   <div class="desc"><b>${esc(modeNom[k.mode])}${k.mode === "score" && k.tm ? ` · ${k.tm} min (−${k.pen} pts / min de retard)` : ""}</b> · Parcours <b>${esc(k.k)}</b>
   <table><thead><tr><th>${k.mode === "ordre" ? "Ordre" : ""}</th><th>Balise</th><th>Définition</th>${k.mode === "score" ? "<th>Points</th>" : ""}<th>Temps</th></tr></thead><tbody>${list}</tbody></table>
   <small>▲ départ · ○ poste · ◎ arrivée — symboles IOF</small></div></div>`,
    `@page{size:A4 ${land ? "landscape" : "portrait"};margin:7mm}.page{display:flex;flex-direction:column;height:${land ? 194 : 281}mm}.top{display:flex;justify-content:space-between;align-items:baseline}.top h1{font-size:14pt}
     .mapbox{flex:1;min-height:0;border:1px solid #000}.mapbox svg{width:100%;height:100%;display:block}
     .desc{font-size:9pt;margin-top:2mm}.desc table{border-collapse:collapse;margin-top:1mm}.desc td,.desc th{border:1px solid #888;padding:.6mm 2mm;font-size:8.5pt}.desc td.w{width:18mm}
     ${land ? ".page{flex-direction:row;flex-wrap:wrap}.top{width:100%}.mapbox{flex:1;height:180mm}.desc{width:62mm;margin:0 0 0 3mm}" : ""}`);
}
