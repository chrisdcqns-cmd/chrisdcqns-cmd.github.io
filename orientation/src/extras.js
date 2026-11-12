// ===== Analyse d'itinéraire, fiche bilan, progression, immobilité, appel, listes de classe, pose des balises =====
const normName = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9& ]+/g, " ").split(/\s+/).filter(Boolean).sort().join(" ");
const posOf = R => Object.values(R.ev || {}).filter(e => e.la != null && (e.ac == null || e.ac < 60)).sort((a, b) => a.t - b.t);

// Arrêts : positions restées dans un rayon de 15 m pendant au moins 1 minute
function detectStops(pos, minMs = 60000, rad = 15) {
  const out = []; let i = 0;
  while (i < pos.length) {
    let j = i; while (j + 1 < pos.length && haversine({ lat: pos[i].la, lon: pos[i].lo }, { lat: pos[j + 1].la, lon: pos[j + 1].lo }) <= rad) j++;
    if (pos[j].t - pos[i].t >= minMs) { const P = pos.slice(i, j + 1); out.push({ t0: pos[i].t, t1: pos[j].t, d: pos[j].t - pos[i].t, la: P.reduce((s, p) => s + p.la, 0) / P.length, lo: P.reduce((s, p) => s + p.lo, 0) / P.length }); i = j + 1; } else i++;
  }
  return out;
}
function legRanges(a) { return a.legs.filter(l => l.t != null && l.split != null).map(l => ({ ...l, t0: l.t - l.split, t1: l.t })); }
function mapCourseFor(proj, R) { const k = (proj.courses || []).find(x => x.k === R.c); if (!k) return null; return { ...k, ctrl: R.sel?.length && k.mode !== "ordre" ? k.ctrl.filter(id => R.sel.includes(+proj.controls.find(c => c.id === id)?.n) || (k.bonus || []).includes(id)) : k.ctrl }; }
function traceBox(proj, g, pos, course) {
  const mm = mapMM(proj), xs = [], ys = [];
  pos.forEach(p => { const q = g.toPx(p.la, p.lo); xs.push(q.x); ys.push(q.y); });
  if (course) [course.depart, ...course.ctrl, course.arrivee].map(id => proj.controls.find(c => c.id === id)).filter(c => c && c.x != null).forEach(c => { xs.push(c.x); ys.push(c.y); });
  if (!xs.length) return { x: 0, y: 0, w: proj.map.w, h: proj.map.h };
  const pad = mm * 14, x0 = Math.max(-pad, Math.min(...xs) - pad), y0 = Math.max(-pad, Math.min(...ys) - pad), x1 = Math.min(proj.map.w + pad, Math.max(...xs) + pad), y1 = Math.min(proj.map.h + pad, Math.max(...ys) + pad);
  return { x: x0, y: y0, w: Math.max(x1 - x0, mm * 30), h: Math.max(y1 - y0, mm * 30) };
}
// Dessin : trace complète (pâle), portion choisie (vive), arrêts numérotés
function traceSVG(proj, g, R, course, range, opts = {}) {
  const mm = mapMM(proj), pos = posOf(R), col = opts.color || "#e63946";
  const px = p => g.toPx(p.la, p.lo), all = pos.map(px);
  let out = mapSVG(proj, { course });
  if (all.length > 1) out += `<path d="${polyD(all.map(p => [p.x, p.y]))}" fill="none" stroke="${col}" stroke-opacity="${range ? .25 : .85}" stroke-width="${mm * .7}" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (range) { const seg = pos.filter(p => p.t >= range.t0 - 1000 && p.t <= range.t1 + 1000).map(px); if (seg.length > 1) out += `<path d="${polyD(seg.map(p => [p.x, p.y]))}" fill="none" stroke="${col}" stroke-width="${mm * 1}" stroke-linejoin="round" stroke-linecap="round"/>`; }
  const stops = detectStops(pos).filter(s => !range || (s.t1 >= range.t0 && s.t0 <= range.t1));
  stops.forEach((s, i) => { const q = g.toPx(s.la, s.lo), r = mm * (2.6 + Math.min(4, s.d / 60000) * .6); out += `<g><circle cx="${q.x}" cy="${q.y}" r="${r}" fill="#ffb703" fill-opacity=".85" stroke="#14213d" stroke-width="${mm * .3}"/><text x="${q.x}" y="${q.y}" font-size="${mm * 3}" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-weight="700" fill="#14213d">${i + 1}</text><text x="${q.x + r + mm * .8}" y="${q.y}" font-size="${mm * 3.4}" dominant-baseline="central" font-family="Arial" font-weight="700" fill="#14213d" paint-order="stroke" stroke="#fff" stroke-width="${mm * .6}">${fmtDur(s.d)}</text></g>`; });
  if (opts.dot) { const q = g.toPx(opts.dot.la, opts.dot.lo); out += `<circle cx="${q.x}" cy="${q.y}" r="${mm * 2}" fill="${col}" stroke="#fff" stroke-width="${mm * .6}"/>`; }
  return { svg: out, stops };
}
function interpAt(pos, t) { if (!pos.length) return null; if (t <= pos[0].t) return pos[0]; for (let i = 1; i < pos.length; i++) if (pos[i].t >= t) { const a = pos[i - 1], b = pos[i], k = (t - a.t) / ((b.t - a.t) || 1); return { la: a.la + (b.la - a.la) * k, lo: a.lo + (b.lo - a.lo) * k }; } return pos[pos.length - 1]; }

// ---------- 1. analyse d'itinéraire (enseignant et élève) ----------
function openAnalysis({ proj, geo, R, course, a, lesson }) {
  const g = makeGeoref(geo || []);
  if (!g || !proj?.map) { toast("Analyse impossible : la carte n'est pas calée (il faut au moins 2 points GPS).", "ko"); return; }
  const pos = posOf(R), mcourse = mapCourseFor(proj, R), legs = legRanges(a), allStops = detectStops(pos);
  if (pos.length < 2) { toast("Pas assez de positions GPS pour analyser l'itinéraire.", "ko"); return; }
  let sel = null, play = null;
  const box = traceBox(proj, g, pos, mcourse);
  const m = openModal(`<h2>🗺 Itinéraire — ${esc(R.nom)}</h2>
   <p class="muted" style="margin-top:-6px">Choisis un inter-poste pour voir ton trajet. Les ronds jaunes sont tes <b>arrêts</b> (plus d'1 minute au même endroit) : hésitation, lecture de carte, erreur ?</p>
   <div style="display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:10px" class="anaGrid">
    <div style="background:#ddd;border-radius:14px;overflow:hidden;position:relative"><svg id="aSvg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" style="width:100%;display:block;max-height:64vh"></svg>
     <div style="position:absolute;left:8px;bottom:8px;display:flex;gap:6px;align-items:center"><button class="btn small" id="aPlay">▶ Rejouer</button><span class="chip" id="aClock" style="background:#fff"></span></div></div>
    <div style="display:flex;flex-direction:column;gap:6px;max-height:64vh;overflow:auto" id="aLegs"></div></div>
   <div id="aInfo" class="panel" style="margin-top:10px"></div>
   <div class="row" style="margin-top:10px"><button class="btn or" id="aPrint">📄 Fiche bilan (PDF)</button></div>`, { wide: true, onClose: () => clearInterval(play) });
  if (innerWidth < 760) $(".anaGrid", m).style.gridTemplateColumns = "1fr";
  const legStops = l => allStops.filter(s => s.t1 >= l.t0 && s.t0 <= l.t1);
  const draw = (dot) => { const r = traceSVG(proj, g, R, mcourse, sel, { dot }); $("#aSvg", m).innerHTML = r.svg; };
  const info = () => {
    const l = sel, st = l ? legStops(l) : allStops, stopT = st.reduce((s, x) => s + x.d, 0);
    $("#aInfo", m).innerHTML = l ? `<b>${esc(l.de)} → ${esc(l.n)}</b> · temps <b>${fmtDur(l.split)}</b> · distance GPS ${fmtDist(l.gps)}${l.vol ? ` (vol d'oiseau ${fmtDist(l.vol)}${l.gps ? `, ×${fmtNum(l.gps / l.vol)}` : ""})` : ""} · ${st.length ? `<b>${st.length} arrêt(s), ${fmtDur(stopT)}</b> (${Math.round(stopT / l.split * 100)} % du temps)` : "aucun arrêt"}`
      : `<b>Toute la course</b> · ${fmtDur(a.temps)} · ${fmtDist(a.dist)} · ${allStops.length} arrêt(s), ${fmtDur(stopT)} au total${legs.length ? ` · inter-poste le plus long : <b>${esc((() => { const x = legs.slice().sort((p, q) => q.split - p.split)[0]; return `${x.de} → ${x.n} (${fmtDur(x.split)})`; })())}</b>` : ""}`;
  };
  const list = () => { $("#aLegs", m).innerHTML = `<button class="btn ${sel ? "ghost" : ""} small" data-li="-1" style="justify-content:flex-start">Toute la course · ${fmtDur(a.temps)}</button>` + legs.map((l, i) => { const st = legStops(l); return `<button class="btn ${sel === l ? "" : "ghost"} small" data-li="${i}" style="justify-content:space-between;min-height:44px;white-space:normal;text-align:left"><span>${esc(l.de)} → <b>${esc(l.n)}</b></span><span>${fmtDur(l.split)}${st.length ? ` · ⏸${st.length}` : ""}</span></button>`; }).join("");
    $$("[data-li]", m).forEach(b => b.onclick = () => { clearInterval(play); play = null; $("#aPlay", m).textContent = "▶ Rejouer"; sel = +b.dataset.li < 0 ? null : legs[+b.dataset.li]; list(); info(); draw(); }); };
  $("#aPlay", m).onclick = () => {
    if (play) { clearInterval(play); play = null; $("#aPlay", m).textContent = "▶ Rejouer"; return; }
    const t0 = sel ? sel.t0 : pos[0].t, t1 = sel ? sel.t1 : pos[pos.length - 1].t, dur = Math.min(20000, Math.max(5000, (t1 - t0) / 30)); const s0 = Date.now();
    $("#aPlay", m).textContent = "⏸ Pause";
    play = setInterval(() => { const k = Math.min(1, (Date.now() - s0) / dur), t = t0 + (t1 - t0) * k; draw(interpAt(pos, t)); $("#aClock", m).textContent = fmtDur(t - (a.start || t0)); if (k >= 1) { clearInterval(play); play = null; $("#aPlay", m).textContent = "▶ Rejouer"; } }, 60);
  };
  $("#aPrint", m).onclick = () => printBilans([{ proj, geo, R, course, a, lesson }]);
  list(); info(); draw();
}

// ---------- 2. fiche bilan (PDF via l'impression) ----------
function bilanHTML({ proj, geo, R, course, a, lesson }) {
  const g = makeGeoref(geo || []), pos = posOf(R), mcourse = proj ? mapCourseFor(proj, R) : null;
  let map = "", stops = [];
  if (g && proj?.map && pos.length > 1) { const box = traceBox(proj, g, pos, mcourse); const r = traceSVG(proj, g, R, mcourse, null); stops = r.stops; map = `<svg viewBox="${box.x} ${box.y} ${box.w} ${box.h}" class="bmap">${r.svg}</svg>`; }
  const legs = legRanges(a), allStops = stops.length ? stops : detectStops(pos);
  const stat = (k, v) => `<div class="st"><small>${k}</small><b>${v}</b></div>`;
  return `<div class="bilan"><div class="bh"><div><h1>Fiche bilan — course d'orientation</h1><div>${esc(lesson || "")}</div></div><div class="who"><b>${esc(R.nom)}</b><br>${esc(R.cl || "")} · parcours ${esc(R.c)}${course?.nm ? " – " + esc(course.nm) : ""}<br>${a.start ? new Date(a.start).toLocaleDateString("fr-FR") + " · départ " + fmtHeure(a.start) : ""}</div></div>
   <div class="stats">${stat("Temps", fmtDur(a.temps))}${stat("Balises", `${a.found}/${a.total}${a.bonusTotal ? ` · ★${a.bonusFound}` : ""}`)}${a.hasPts ? stat("Points", a.score) : ""}${stat("Statut", a.statut)}${stat("Distance GPS", fmtDist(a.dist))}${stat("Vitesse moy.", a.vitesse ? fmtNum(a.vitesse) + " km/h" : "–")}${stat("Arrêts", `${allStops.length} · ${fmtDur(allStops.reduce((s, x) => s + x.d, 0))}`)}${stat("Erreurs", a.erreurs + (a.ordreErr ? ` · ${a.ordreErr} d'ordre` : ""))}${a.retard ? stat("Retard", fmtDur(a.retard)) : ""}</div>
   ${map ? `<div class="mapw">${map}</div><p class="lg">Trait rouge : mon trajet GPS · ronds jaunes numérotés : mes arrêts de plus d'1 minute (durée à côté).</p>` : ""}
   <table><thead><tr><th>Inter-poste</th><th>Temps</th><th>Cumul</th><th>Distance GPS</th><th>Vol d'oiseau</th><th>Arrêts</th></tr></thead><tbody>${legs.map(l => { const st = allStops.filter(s => s.t1 >= l.t0 && s.t0 <= l.t1); return `<tr><td>${esc(l.de)} → <b>${esc(l.n)}</b>${l.bonus ? " ★" : ""}${!l.ordre ? " (ordre)" : ""}</td><td><b>${fmtDur(l.split)}</b></td><td>${fmtDur(l.cumul)}</td><td>${fmtDist(l.gps)}</td><td>${fmtDist(l.vol)}</td><td>${st.length ? `${st.length} · ${fmtDur(st.reduce((s, x) => s + x.d, 0))}` : "–"}</td></tr>`; }).join("")}</tbody></table>
   ${a.manquants.length ? `<p><b>Balises manquantes :</b> ${a.manquants.join(", ")}</p>` : ""}
   <div class="refl"><b>Mon analyse</b><div>Où ai-je perdu le plus de temps ? Pourquoi ?</div><div class="l"></div><div class="l"></div><div>Ce que je ferai mieux la prochaine fois :</div><div class="l"></div><div class="l"></div></div></div>`;
}
function printBilans(list) {
  printWin("Fiche bilan", list.map(bilanHTML).join(""), `@page{size:A4 portrait;margin:9mm}.bilan{page-break-after:always}.bilan:last-child{page-break-after:auto}.bh{display:flex;justify-content:space-between;gap:6mm;border-bottom:1mm solid #f47a20;padding-bottom:2mm}.bh h1{font-size:15pt;margin:0}.who{text-align:right;font-size:10pt}
   .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:2mm;margin:3mm 0}.st{border:1px solid #ccc;border-radius:2mm;padding:1.5mm 2mm}.st small{display:block;color:#666;font-size:7pt;text-transform:uppercase}.st b{font-size:11pt}
   .mapw{border:1px solid #000;height:105mm}.bmap{width:100%;height:100%;display:block}.lg{font-size:7.5pt;color:#555;margin:1mm 0 2mm}
   table{border-collapse:collapse;width:100%;font-size:8.5pt}td,th{border:1px solid #999;padding:1mm 1.5mm;text-align:left}.refl{margin-top:3mm;font-size:9pt}.refl .l{border-bottom:1px solid #999;height:7mm}`);
}

// ---------- 3. progression sur le cycle (enseignant) ----------
async function openProgression() {
  const L = (await DB.get("sessions")) || [], sessions = [];
  for (const x of L) { const X = S?.code === x.code ? S : await DB.get("session:" + x.code); if (X) sessions.push(X); }
  sessions.sort((a, b) => a.date - b.date);
  const people = {};
  sessions.forEach(X => Object.values(X.runners || {}).forEach(R => {
    const c = X.snap?.[R.c]; if (!c) return; const a = analyseRun(R, c, P, X.dec || {}, X.ack || {}); if (!a.start) return;
    const key = normName(R.nom); const p = people[key] || (people[key] = { nom: R.nom, cl: R.cl, rows: {} });
    if (R.cl) p.cl = R.cl;
    p.rows[X.code] = { X, R, a, c, pct: a.total ? (a.found / a.total) * 100 : 0 };
  }));
  const list = Object.values(people).sort((x, y) => (x.cl || "").localeCompare(y.cl || "") || x.nom.localeCompare(y.nom));
  const cls = [...new Set(list.map(p => p.cl).filter(Boolean))];
  const m = openModal(`<h2>📈 Progression sur le cycle</h2><p class="muted" style="margin-top:-6px">${sessions.length} leçon(s) · ${list.length} élève(s). Les élèves sont reconnus par leur nom (ordre des mots, accents et majuscules sans importance). Touche un élève pour voir ses courbes.</p>
   <div class="row" style="margin-bottom:10px"><select class="inp" id="pCl" style="max-width:220px"><option value="">Toutes les classes</option>${cls.map(c => `<option>${esc(c)}</option>`).join("")}</select><button class="btn alt" id="pCsv">⬇ CSV</button></div>
   <div class="tw" id="pTab"></div>`, { wide: true });
  const cell = r => r ? `<b>${r.a.found}/${r.a.total}</b> · ${fmtDur(r.a.temps)}<br><small class="muted">${r.a.vitesse ? fmtNum(r.a.vitesse) + " km/h" : "–"} · ${r.a.erreurs} err. · ${esc(r.R.c)}</small>` : '<span class="muted">–</span>';
  const draw = () => { const f = $("#pCl", m).value, rows = list.filter(p => !f || p.cl === f);
    $("#pTab", m).innerHTML = `<table class="t"><thead><tr><th>Élève</th><th>Classe</th>${sessions.map(X => `<th>${new Date(X.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}<br><small>${esc(X.code)}</small></th>`).join("")}<th>Évolution</th></tr></thead><tbody>${rows.map((p, i) => { const pts = sessions.map(X => p.rows[X.code]).filter(Boolean); const d = pts.length > 1 ? pts[pts.length - 1].pct - pts[0].pct : null;
      return `<tr data-p="${i}" style="cursor:pointer"><td><b>${esc(p.nom)}</b></td><td>${esc(p.cl || "")}</td>${sessions.map(X => `<td>${cell(p.rows[X.code])}</td>`).join("")}<td>${d == null ? "–" : `<b style="color:${d >= 0 ? "var(--green)" : "var(--red)"}">${d >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(d))} pts %</b>`}</td></tr>`; }).join("") || `<tr><td colspan="9" class="muted">Aucune donnée.</td></tr>`}</tbody></table>`;
    $$("[data-p]", m).forEach(tr => tr.onclick = () => personChart(rows[+tr.dataset.p], sessions)); };
  $("#pCl", m).onchange = draw;
  $("#pCsv", m).onclick = () => { const head = ["Élève", "Classe", ...sessions.flatMap(X => { const d = new Date(X.date).toLocaleDateString("fr-FR"); return [`${d} parcours`, `${d} balises`, `${d} temps`, `${d} vitesse km/h`, `${d} erreurs`]; })];
    const rows = list.map(p => [p.nom, p.cl, ...sessions.flatMap(X => { const r = p.rows[X.code]; return r ? [r.R.c, `${r.a.found}/${r.a.total}`, fmtDur(r.a.temps), r.a.vitesse ? fmtNum(r.a.vitesse) : "", r.a.erreurs] : ["", "", "", "", ""]; })]);
    download("OrienRun_progression.csv", "﻿" + [head, ...rows].map(r => r.map(v => /[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(";")).join("\r\n"), "text/csv;charset=utf-8"); };
  draw();
}
function personChart(p, sessions) {
  const rows = sessions.map(X => ({ X, r: p.rows[X.code] })).filter(x => x.r);
  const W = 640, H = 230, pad = 36, n = rows.length;
  const series = [{ nom: "% balises trouvées", col: "#2a9d6f", v: rows.map(x => x.r.pct), max: 100 }, { nom: "Vitesse (km/h)", col: "#1f4fa3", v: rows.map(x => x.r.a.vitesse || 0), max: Math.max(6, ...rows.map(x => x.r.a.vitesse || 0)) }, { nom: "Erreurs", col: "#e63946", v: rows.map(x => x.r.a.erreurs), max: Math.max(3, ...rows.map(x => x.r.a.erreurs)) }];
  const X = i => pad + (n > 1 ? i * (W - pad * 2) / (n - 1) : (W - pad * 2) / 2), Y = (v, mx) => H - pad - v / mx * (H - pad * 2);
  const svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;background:#fff;border-radius:12px">${[0, .5, 1].map(k => `<line x1="${pad}" x2="${W - pad}" y1="${Y(k * 100, 100)}" y2="${Y(k * 100, 100)}" stroke="#eee"/>`).join("")}
    ${rows.map((x, i) => `<text x="${X(i)}" y="${H - 12}" font-size="11" text-anchor="middle" fill="#56607a">${new Date(x.X.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</text>`).join("")}
    ${series.map(s => `<polyline points="${s.v.map((v, i) => `${X(i)},${Y(v, s.max)}`).join(" ")}" fill="none" stroke="${s.col}" stroke-width="3"/>${s.v.map((v, i) => `<circle cx="${X(i)}" cy="${Y(v, s.max)}" r="4.5" fill="${s.col}"/><text x="${X(i) + 6}" y="${Y(v, s.max) - 7}" font-size="11" fill="${s.col}" font-weight="700">${s.nom.startsWith("%") ? Math.round(v) + "%" : fmtNum(v, s.nom.startsWith("V") ? 1 : 0)}</text>`).join("")}`).join("")}</svg>`;
  const m = openModal(`<h2>📈 ${esc(p.nom)}</h2><p class="muted" style="margin-top:-6px">${esc(p.cl || "")} · ${n} leçon(s)</p><div class="row" style="gap:14px;margin-bottom:6px">${series.map(s => `<span><b style="color:${s.col}">━</b> ${s.nom}</span>`).join("")}</div>${svg}
   <div class="tw" style="margin-top:10px"><table class="t"><thead><tr><th>Leçon</th><th>Parcours</th><th class="num">Balises</th><th class="num">Temps</th><th class="num">Distance</th><th class="num">Vitesse</th><th class="num">Arrêts</th><th class="num">Erreurs</th><th></th></tr></thead><tbody>${rows.map((x, i) => `<tr><td>${new Date(x.X.date).toLocaleDateString("fr-FR")} <small class="muted">${esc(x.X.code)}</small></td><td>${esc(x.r.R.c)}</td><td class="num">${x.r.a.found}/${x.r.a.total}</td><td class="num">${fmtDur(x.r.a.temps)}</td><td class="num">${fmtDist(x.r.a.dist)}</td><td class="num">${x.r.a.vitesse ? fmtNum(x.r.a.vitesse) : "–"}</td><td class="num">${x.r.a.stop ? fmtDur(x.r.a.stop) : "–"}</td><td class="num">${x.r.a.erreurs}</td><td><button class="btn small ghost" data-an="${i}">🗺</button></td></tr>`).join("")}</tbody></table></div>`, { wide: true });
  $$("[data-an]", m).forEach(b => b.onclick = () => { const x = rows[+b.dataset.an]; openAnalysis({ proj: P, geo: calibPoints(), R: x.r.R, course: x.r.c, a: x.r.a, lesson: x.X.nom }); });
}

// ---------- 8. alerte d'immobilité (enseignant) ----------
function immobility(R, a) {
  const lim = (+CFG.immo || 0) * 60000; if (!lim || a.statut !== "En course") return null;
  const pos = posOf(R); if (pos.length < 3) return null;
  const last = pos[pos.length - 1]; if (Date.now() - (last.rt || last.t) > (CFG.interval * 3 + 30) * 1000) return null; // signal perdu : signalé ailleurs
  const L = { lat: last.la, lon: last.lo }; let k = pos.length - 1;
  while (k > 0 && haversine({ lat: pos[k - 1].la, lon: pos[k - 1].lo }, L) <= 20 + Math.min(last.ac || 0, 20)) k--;
  const since = pos[k].t, dur = Date.now() - since; if (dur < lim || since < a.start) return null;
  const near = P.controls.filter(c => c.lat != null).some(c => haversine(c, L) <= 30); if (near) return null; // à une balise : normal
  return { since, dur, la: last.la, lo: last.lo };
}

// ---------- 9. appel : présents, partis, rentrés ----------
function runnerForEleve(e) { if (e.r && S.runners[e.r]) return S.runners[e.r]; const k = normName(e.nom); return Object.values(S.runners).find(R => normName(R.nom) === k || normName(R.nom).split(" & ").includes(k) || R.nom.split(" & ").some(x => normName(x) === k)) || null; }
function appelState(e) { const R = runnerForEleve(e), ev = R ? Object.values(R.ev) : []; const parti = ev.find(x => x.k === "start"), rentre = e.rentre || ev.find(x => x.k === "finish" || x.k === "abandon" || x.k === "here"); return { R, parti, rentre }; }
function appelSummary() { const L = S.appel?.list || []; const pres = L.filter(e => e.present !== false); const st = pres.map(e => ({ e, ...appelState(e) })); return { pres: pres.length, abs: L.length - pres.length, partis: st.filter(x => x.parti).length, rentres: st.filter(x => x.rentre).length, manquent: st.filter(x => x.parti && !x.rentre).map(x => x.e.nom), pasPartis: st.filter(x => !x.parti && !x.rentre).map(x => x.e.nom), total: L.length }; }
function openAppel() {
  if (!S.appel?.list?.length) { toast("Pas de liste de classe pour cette leçon : ajoute tes listes dans ⚙ Réglages, puis choisis la classe au lancement.", "ko"); return; }
  const m = openModal(`<h2>📋 Appel</h2><div id="apSum"></div><div class="tw" id="apTab" style="margin-top:10px"></div>`, { wide: true });
  m.id = "appelModal";
  const draw = () => {
    const s = appelSummary(), linked = new Set(S.appel.list.map(e => runnerForEleve(e)?.r).filter(Boolean)), libres = Object.values(S.runners).filter(R => !linked.has(R.r));
    $("#apSum", m).innerHTML = `<div class="row"><span class="chip">${s.pres} présent(s) / ${s.total}</span><span class="chip or">🏃 ${s.partis} parti(s)</span><span class="chip ok">✅ ${s.rentres} rentré(s)</span>${s.manquent.length ? `<span class="chip ko">⚠ pas encore rentré(s) : ${esc(s.manquent.join(", "))}</span>` : s.partis ? '<span class="chip ok">Tout le monde est rentré</span>' : ""}</div>${libres.length ? `<p class="muted">Hors liste : ${libres.map(R => esc(R.nom)).join(", ")}</p>` : ""}`;
    $("#apTab", m).innerHTML = `<table class="t"><thead><tr><th>Élève</th><th>Classe</th><th>Présent</th><th>Parti</th><th>Rentré</th><th>Dans l'appli</th></tr></thead><tbody>${S.appel.list.map((e, i) => { const { R, parti, rentre } = appelState(e);
      return `<tr style="${e.present === false ? "opacity:.45" : parti && !rentre ? "background:#fff4f4" : ""}"><td><b>${esc(e.nom)}</b></td><td>${esc(e.cl)}</td><td><button class="btn small ${e.present === false ? "ghost" : "green"}" data-pr="${i}">${e.present === false ? "Absent" : "✓ Présent"}</button></td><td>${parti ? `🏃 ${fmtHeure(parti.t)}` : "–"}</td><td>${rentre ? `✅ ${rentre.t ? fmtHeure(rentre.t) : ""}` : parti ? `<button class="btn small alt" data-rt="${i}">Marquer rentré</button>` : "–"}</td>
       <td>${R ? `<button class="btn small ghost" data-det="${R.r}">${esc(R.nom)}</button>` : libres.length ? `<select data-lk="${i}" class="inp" style="min-height:34px;padding:2px 6px"><option value="">— associer —</option>${libres.map(x => `<option value="${x.r}">${esc(x.nom)}</option>`).join("")}</select>` : '<span class="muted">pas encore inscrit</span>'}</td></tr>`; }).join("")}</tbody></table>`;
    $$("[data-pr]", m).forEach(b => b.onclick = () => { const e = S.appel.list[+b.dataset.pr]; e.present = e.present === false ? true : false; saveS(); draw(); });
    $$("[data-rt]", m).forEach(b => b.onclick = () => { S.appel.list[+b.dataset.rt].rentre = { t: Date.now(), manuel: 1 }; saveS(); draw(); renderLive(); });
    $$("[data-lk]", m).forEach(s => s.onchange = () => { S.appel.list[+s.dataset.lk].r = s.value || null; saveS(); draw(); });
    $$("[data-det]", m).forEach(b => b.onclick = () => runnerDetail(b.dataset.det));
  };
  m._draw = draw; draw();
}

// ---------- 11. listes de classe (Réglages enseignant) ----------
async function getClasses() { return (await DB.get("classes")) || {}; }
async function classesPanel(box) {
  let C = await getClasses();
  const draw = () => { const names = Object.keys(C).sort();
    box.innerHTML = `<h2>Listes de classe</h2><p class="muted">Les élèves choisiront leur nom dans la liste (pas de fautes de frappe, appel automatique). Les listes sont gardées dans cette tablette et dans ta Google Sheet, jamais sur GitHub. Astuce : copie-colle la colonne des noms depuis Pronote.</p>
     <div class="row" style="margin-bottom:8px">${names.map(n => `<button class="btn small ${n === box._cur ? "" : "ghost"}" data-cl="${esc(n)}">${esc(n)} <small>(${C[n].length})</small></button>`).join("")}<button class="btn small alt" id="clNew">＋ Classe</button></div>
     ${box._cur ? `<div class="field"><label>Élèves de ${esc(box._cur)} (un par ligne : Prénom NOM)</label><textarea class="inp" id="clTxt" style="min-height:200px">${esc(C[box._cur].join("\n"))}</textarea></div><div class="row"><button class="btn green" id="clSave">Enregistrer</button><button class="btn red" id="clDel">Supprimer la classe</button></div>` : ""}
     <div class="row" style="margin-top:10px">${apiUrl() ? `<button class="btn small ghost" id="clPull">↻ Récupérer depuis la Google Sheet</button>` : ""}</div>`;
    $$("[data-cl]", box).forEach(b => b.onclick = () => { box._cur = b.dataset.cl; draw(); });
    $("#clNew", box).onclick = () => { const n = (prompt("Nom de la classe (ex. TMELEC) :") || "").trim().toUpperCase(); if (!n) return; C[n] = C[n] || []; box._cur = n; draw(); };
    $("#clSave", box) && ($("#clSave", box).onclick = async () => { C[box._cur] = [...new Set($("#clTxt", box).value.split(/\n|;/).map(x => x.replace(/\s+/g, " ").trim()).filter(Boolean))]; await DB.set("classes", C); toast("Liste enregistrée ✓", "ok"); draw(); if (apiUrl()) apiCall(apiUrl(), "saveClasses", { teacher: tpw(), classes: C }).catch(e => toast("Google Sheet : " + e.message, "ko")); });
    $("#clDel", box) && ($("#clDel", box).onclick = async () => { if (!confirm("Supprimer la liste " + box._cur + " ?")) return; delete C[box._cur]; box._cur = null; await DB.set("classes", C); draw(); if (apiUrl()) apiCall(apiUrl(), "saveClasses", { teacher: tpw(), classes: C }).catch(() => {}); });
    $("#clPull", box) && ($("#clPull", box).onclick = async () => { try { const j = await apiCall(apiUrl(), "loadClasses", { teacher: tpw() }); C = j.classes || {}; await DB.set("classes", C); toast("Listes récupérées ✓", "ok"); draw(); } catch (e) { toast(e.message, "ko"); } });
  };
  if (!Object.keys(C).length && apiUrl()) { try { const j = await apiCall(apiUrl(), "loadClasses", { teacher: tpw() }); if (j.classes && Object.keys(j.classes).length) { C = j.classes; await DB.set("classes", C); } } catch (e) {} }
  draw();
}

// ---------- 12. pose et ramassage des balises (guidage sur le terrain) ----------
const bearing = (a, b) => { const r = Math.PI / 180, y = Math.sin((b.lon - a.lon) * r) * Math.cos(b.lat * r), x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lon - a.lon) * r); return (Math.atan2(y, x) / r + 360) % 360; };
function openPose() {
  let mode = "pose", me = null, head = null, target = null, watch = null, hasCompass = false;
  const done = c => !!(mode === "pose" ? c.pose : c.ramasse);
  const all = () => P.controls.filter(c => c.lat != null);
  const pick = () => { const L = all().filter(c => !done(c)); if (!L.length) return null; if (!me) return L[0]; return L.slice().sort((a, b) => haversine(me, a) - haversine(me, b))[0]; };
  const m = openModal(`<h2>🧭 Sur le terrain</h2><div class="row" style="margin-bottom:10px"><button class="btn small" data-md="pose">🚩 Pose des balises</button><button class="btn small ghost" data-md="ramasse">🧺 Ramassage</button><span class="grow"></span><button class="btn small ghost" id="poCompass">🧭 Activer la boussole</button></div>
   <div id="poMain"></div><div id="poList" style="margin-top:12px"></div>`, { wide: true, sticky: true, onClose: () => { navigator.geolocation.clearWatch(watch); removeEventListener("deviceorientationabsolute", ori); removeEventListener("deviceorientation", ori); } });
  const ori = e => { let h = e.webkitCompassHeading != null ? e.webkitCompassHeading : e.alpha != null && (e.absolute || e.type === "deviceorientationabsolute") ? (360 - e.alpha) % 360 : null; if (h != null) { head = h; hasCompass = true; drawMain(); } };
  addEventListener("deviceorientationabsolute", ori); addEventListener("deviceorientation", ori);
  $("#poCompass", m).onclick = async () => { try { if (window.DeviceOrientationEvent?.requestPermission) await DeviceOrientationEvent.requestPermission(); toast("Boussole activée : tiens le téléphone à plat"); } catch (e) { toast("Boussole refusée", "ko"); } };
  watch = navigator.geolocation.watchPosition(p => { me = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }; if (!hasCompass && p.coords.heading != null && !isNaN(p.coords.heading) && p.coords.speed > .5) head = p.coords.heading; if (!target || done(target)) target = pick(); drawMain(); }, e => toast(e.message, "ko"), { enableHighAccuracy: true, maximumAge: 2000 });
  let lastBuzz = 0;
  const drawMain = () => {
    const box = $("#poMain", m); if (!box) return;
    const L = all(), n = L.filter(done).length;
    if (!target || done(target)) target = pick();
    if (!target) { box.innerHTML = `<div class="panel" style="margin:0;text-align:center"><h2>✓ Toutes les balises sont ${mode === "pose" ? "posées" : "ramassées"} (${n}/${L.length})</h2></div>`; return drawList(); }
    const d = me ? haversine(me, target) : null, b = me ? bearing(me, target) : null, rot = b != null ? (head != null ? b - head : b) : 0;
    if (d != null && d < 10 && Date.now() - lastBuzz > 8000) { lastBuzz = Date.now(); navigator.vibrate?.([200, 100, 200]); }
    box.innerHTML = `<div class="runcard" style="display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center">
      <div style="width:150px;height:150px;border-radius:50%;background:#ffffff14;display:grid;place-items:center;position:relative">${head == null ? '<span style="position:absolute;top:4px;font-weight:800">N</span>' : ""}<svg viewBox="-50 -50 100 100" style="width:120px;transform:rotate(${rot}deg);transition:transform .3s"><path d="M0,-44 L22,30 L0,16 L-22,30Z" fill="${d != null && d < 15 ? "#3ddc97" : "#f47a20"}"/></svg></div>
      <div><div class="lbl" style="color:#fff">${mode === "pose" ? "Balise à poser" : "Balise à ramasser"} · ${n}/${L.length} faites</div><div style="font-family:var(--cond);font-size:3rem;font-weight:800;line-height:1">${esc(ctrlLabel(target))}</div>
      <div style="font-size:2rem;font-weight:800">${d == null ? "GPS…" : fmtDist(d)}</div><div class="sub">${target.desc ? esc(target.desc) + " · " : ""}${me ? `ta précision ±${Math.round(me.acc)} m` : ""}${head == null ? " · flèche orientée par rapport au nord (active la boussole ou marche)" : ""}</div></div></div>
     <div class="row" style="margin-top:10px"><button class="btn green" id="poDone" style="min-height:58px;flex:1">✓ ${mode === "pose" ? "Posée" : "Ramassée"}</button><button class="btn alt" id="poSkip">Passer</button><a class="btn ghost" target="_blank" href="${gmapsUrl(target.lat, target.lon)}">Google Maps</a></div>
     ${mode === "pose" ? `<label class="row" style="gap:6px;margin-top:8px"><input type="checkbox" id="poUpd"> Remplacer la position GPS de la balise par ma position actuelle (si je la pose ailleurs)</label>` : ""}`;
    $("#poDone", m).onclick = () => { if (mode === "pose" && $("#poUpd", m)?.checked && me) { target.lat = me.lat; target.lon = me.lon; target.acc = Math.round(me.acc); } target[mode === "pose" ? "pose" : "ramasse"] = Date.now(); saveP(); toast(`${ctrlLabel(target)} ${mode === "pose" ? "posée" : "ramassée"} ✓`, "ok"); target = pick(); drawMain(); };
    $("#poSkip", m).onclick = () => { const L2 = all().filter(c => !done(c) && c !== target); if (L2.length) { target = me ? L2.sort((a, b) => haversine(me, a) - haversine(me, b))[0] : L2[0]; } drawMain(); };
    drawList();
  };
  const drawList = () => { const L = all(), sans = P.controls.filter(c => c.lat == null);
    $("#poList", m).innerHTML = `<div class="cchips">${L.map(c => `<button class="cchip ${done(c) ? "found" : target === c ? "on" : ""}" data-po="${c.id}" title="${done(c) ? "fait à " + fmtHeure(c[mode === "pose" ? "pose" : "ramasse"]) : ""}">${esc(c.type === "C" ? c.n : c.type === "S" ? "▲" : "◎")}</button>`).join("")}</div>
     ${sans.length ? `<p class="muted">Sans GPS (non guidées) : ${sans.map(c => esc(ctrlLabel(c))).join(", ")}</p>` : ""}<button class="btn small ghost" id="poReset" style="margin-top:8px">Tout remettre à « ${mode === "pose" ? "à poser" : "à ramasser"} »</button>`;
    $$("[data-po]", m).forEach(b => b.onclick = () => { const c = ctrlById(b.dataset.po); if (done(c)) { if (confirm(`Annuler « ${mode === "pose" ? "posée" : "ramassée"} » pour ${ctrlLabel(c)} ?`)) { delete c[mode === "pose" ? "pose" : "ramasse"]; saveP(); } } else target = c; drawMain(); });
    $("#poReset", m).onclick = () => { if (!confirm("Tout remettre à zéro pour ce mode ?")) return; P.controls.forEach(c => delete c[mode === "pose" ? "pose" : "ramasse"]); saveP(); target = null; drawMain(); };
  };
  $$("[data-md]", m).forEach(b => b.onclick = () => { mode = b.dataset.md; $$("[data-md]", m).forEach(x => x.className = "btn small " + (x === b ? "" : "ghost")); target = null; drawMain(); });
  drawMain();
}
