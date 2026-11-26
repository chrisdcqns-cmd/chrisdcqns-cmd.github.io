// =====================================================================
//  Bibliothèque de cartes, téléchargement (élève / enseignant), envoi vers l'appli CO Course
// =====================================================================
const MAP_VERSIONS = {
  eleve: { nom: "Élève : numéros, sans code", o: { codes: false } },
  vierge: { nom: "Élève : cercles seuls, sans numéro ni code", o: { codes: false, noNum: true } },
  prof: { nom: "Enseignant : numéros et codes", o: { codes: true } }
};
// Rendu de la carte complète (toutes les balises) en image
function mapImage(proj, ver, maxPx = 0, type = "image/png", q = .9) {
  return new Promise((res, rej) => {
    const w = proj.map?.w || 2000, h = proj.map?.h || 1414, k = maxPx ? Math.min(1, maxPx / Math.max(w, h)) : (Math.max(w, h) < 2400 ? 2400 / Math.max(w, h) : 1);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${Math.round(w * k)}" height="${Math.round(h * k)}"><rect width="${w}" height="${h}" fill="#fff"/>${mapSVG(proj, MAP_VERSIONS[ver].o)}</svg>`;
    const img = new Image();
    img.onload = () => { const c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k); const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); try { res(c.toDataURL(type, q)); } catch (e) { rej(e); } };
    img.onerror = () => rej(new Error("Rendu de la carte impossible"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}
const fileName = s => String(s || "carte").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "carte";
function downloadDialog() {
  const nC = P.controls.filter(c => c.type === "C").length;
  const m = openModal(`<h2>⬇ Télécharger la carte</h2><p class="muted">Carte complète avec toutes les balises (${nC}), sans les parcours.</p>
   <div class="list">${Object.entries(MAP_VERSIONS).map(([k, v]) => `<div class="item"><div class="body"><b>${v.nom}</b><br><span class="muted" style="font-size:.85rem">${k === "eleve" ? "À distribuer aux élèves." : k === "vierge" ? "Les élèves retrouvent eux-mêmes les numéros (travail de lecture de carte)." : "⚠ À garder pour toi : les codes permettent de valider sans trouver la balise."}</span></div><button class="btn small or" data-dl="${k}" data-f="png">Image PNG</button><button class="btn small ghost" data-dl="${k}" data-f="pdf">Imprimer / PDF</button></div>`).join("")}</div>
   <div id="dlPrev" style="margin-top:10px"></div>`, { wide: true });
  $$("[data-dl]", m).forEach(b => b.onclick = async () => {
    const ver = b.dataset.dl, v = MAP_VERSIONS[ver];
    if (b.dataset.f === "pdf") { const land = P.map.w >= P.map.h; printWin("Carte " + v.nom, `<h1 style="font:700 14pt Arial;margin:0 0 3mm">${esc(P.nom)} — ${esc(v.nom)}</h1><svg viewBox="0 0 ${P.map.w} ${P.map.h}" style="width:100%;max-height:${land ? 175 : 260}mm;display:block;border:.3mm solid #000">${mapSVG(P, v.o)}</svg>`, `@page{size:A4 ${land ? "landscape" : "portrait"};margin:10mm}body{margin:0}`); return; }
    b.disabled = true; b.textContent = "⏳";
    try { const url = await mapImage(P, ver); const a = document.createElement("a"); a.href = url; a.download = `${fileName(P.nom)}-${ver === "prof" ? "enseignant-codes" : ver === "vierge" ? "eleve-sans-numeros" : "eleve"}.png`; document.body.appendChild(a); a.click(); a.remove(); toast("Carte téléchargée ✓", "ok"); }
    catch (e) { toast(e.message, "ko"); }
    b.disabled = false; b.textContent = "Image PNG";
  });
}

// ---------- Bibliothèque de cartes (sur cet appareil) ----------
async function libList() { return (await DB.get("cartes")) || []; }
async function libSave(nom, id) {
  const L = await libList(), e = id ? L.find(x => x.id === id) : null, now = Date.now();
  let thumb = ""; try { thumb = await mapImage(P, "eleve", 320, "image/jpeg", .7); } catch (er) {}
  const meta = { id: e ? e.id : uid(8), nom, date: now, thumb, n: P.controls.filter(c => c.type === "C").length };
  await DB.set("carte:" + meta.id, JSON.parse(JSON.stringify({ ...P, nom }))); if (e) Object.assign(e, meta); else L.unshift(meta);
  await DB.set("cartes", L); P.libId = meta.id; P.nom = nom; $("#projName") && ($("#projName").textContent = nom); saveP(true);
  return meta;
}
async function saveAsDialog() {
  const L = await libList(), cur = P.libId && L.find(x => x.id === P.libId);
  const m = openModal(`<h2>💾 Enregistrer la carte</h2><p class="muted">La carte actuelle (fond, dessins, balises, codes, parcours) est rangée dans ta bibliothèque de cartes, sur cet appareil.</p>
   <div class="field"><label>Nom de la carte</label><input class="inp" id="svN" value="${esc(cur ? cur.nom : P.nom)}"></div>
   <div class="row">${cur ? `<button class="btn or" id="svUp">Mettre à jour « ${esc(cur.nom)} »</button>` : ""}<button class="btn ${cur ? "alt" : "or"}" id="svNew">${cur ? "Enregistrer comme nouvelle carte" : "Enregistrer"}</button></div>`);
  const go = async id => { const n = $("#svN", m).value.trim(); if (!n) return toast("Donne un nom à la carte", "ko"); if (!id && L.some(x => x.nom.toLowerCase() === n.toLowerCase()) && !confirm(`Une carte s'appelle déjà « ${n} ». Enregistrer quand même ?`)) return; await libSave(n, id); m.close(); toast(`Carte « ${n} » enregistrée ✓`, "ok"); };
  $("#svUp", m) && ($("#svUp", m).onclick = () => go(cur.id)); $("#svNew", m).onclick = () => go(null);
  $("#svN", m).select();
}
// ---------- Nouvelle carte : même fond de carte, sans balises ni parcours ----------
async function newMapDialog() {
  const L = await libList(), cur = P.libId && L.find(x => x.id === P.libId);
  const nC = P.controls.filter(c => c.type === "C").length, nS = P.controls.filter(c => c.type !== "C").length;
  if (!(P.map.img || P.features.length || P.map.frame)) return toast("Pas encore de fond de carte : charge une image ou dessine la carte d'abord (onglet Carte)", "ko");
  const geo = P.controls.filter(c => c.type === "C" && c.x != null && c.lat != null && c.calage !== false).length;
  const m = openModal(`<h2>🆕 Nouvelle carte</h2><p class="muted">On repart du <b>fond de carte</b> actuel (image, dessins, échelle, calage GPS), <b>sans les ${nC} balise(s) ni les ${P.courses.length} parcours</b>, pour poser de nouvelles balises.</p>
   <div class="field"><label>Nom de la nouvelle carte</label><input class="inp" id="nmN" value="${esc(P.nom)} – nouvelle"></div>
   <label class="row" style="gap:6px"><input type="checkbox" id="nmK" checked> Ranger d'abord la carte actuelle dans la bibliothèque${cur ? ` (mise à jour de « ${esc(cur.nom)} »)` : ""}</label>
   ${nS ? `<label class="row" style="gap:6px;margin-top:6px"><input type="checkbox" id="nmD" checked> Garder le départ et l'arrivée</label>` : ""}
   ${geo ? `<p class="muted" style="font-size:.85rem;margin-top:8px">📍 ${geo} balise(s) servaient au calage GPS : leurs positions sont gardées comme points de calage, la nouvelle carte reste calée.</p>` : ""}
   <div class="row" style="margin-top:12px"><button class="btn or" id="nmOk">🆕 Créer la nouvelle carte</button><button class="btn ghost" id="nmX">Annuler</button></div>`);
  $("#nmX", m).onclick = m.close; $("#nmN", m).select();
  $("#nmOk", m).onclick = async () => {
    const n = $("#nmN", m).value.trim(); if (!n) return toast("Donne un nom à la carte", "ko");
    $("#nmOk", m).disabled = true;
    try {
      if ($("#nmK", m).checked) await libSave(cur ? cur.nom : P.nom, cur ? cur.id : null);
      const keep = $("#nmD", m) ? $("#nmD", m).checked : false, Q = JSON.parse(JSON.stringify(P));
      Q.controls.forEach(c => { if (c.type === "C" && c.x != null && c.lat != null && c.calage !== false) Q.calib.push({ id: uid(6), x: c.x, y: c.y, lat: c.lat, lon: c.lon, acc: c.acc, nom: "Ancienne balise " + c.n, t: Date.now() }); });
      Q.controls = keep ? Q.controls.filter(c => c.type !== "C") : []; Q.courses = []; Q.nom = n; Q.salt = uid(6); delete Q.libId;
      P = Q; undoStack.length = 0; ED.sel = null; saveP(true); await libSave(n, null);
      m.close(); setPTab("balises"); $("#projName") && ($("#projName").textContent = n); toast(`Nouvelle carte « ${n} » : place tes balises ✓`, "ok");
    } catch (e) { toast(e.message, "ko"); $("#nmOk", m).disabled = false; }
  };
}
// Carte mère : regroupe les balises de plusieurs cartes (même fond) sur une seule carte, pour l'enseignant
function mereDialog(L) {
  if (L.length < 2) return toast("Il faut au moins 2 cartes dans la bibliothèque", "ko");
  const m = openModal(`<h2>🧩 Créer une carte mère</h2><p class="muted">Coche les cartes à regrouper (par ex. la carte du collectif et les 2 cartes individuelles). La carte mère reprend le fond de la 1re carte cochée et toutes les balises des cartes cochées. Elle n'est que pour toi : envoie-la dans CO Course en choisissant « 🗺 Carte mère ».</p>
   <div class="list">${L.map((x, i) => `<label class="item" style="cursor:pointer"><input type="checkbox" data-mc="${i}"> <div class="body"><b>${esc(x.nom)}</b> <span class="muted">${x.n} balise(s)</span></div></label>`).join("")}</div>
   <div class="field"><label>Nom</label><input class="inp" id="mcN" value="Carte mère"></div><p id="mcE" class="muted"></p>
   <div class="row"><button class="btn or" id="mcOk">🧩 Créer et ouvrir</button><button class="btn ghost" id="mcX">Annuler</button></div>`, { wide: true });
  $("#mcX", m).onclick = m.close;
  $("#mcOk", m).onclick = async () => {
    const pick = $$("[data-mc]:checked", m).map(x => L[+x.dataset.mc]); if (pick.length < 2) return toast("Coche au moins 2 cartes", "ko");
    const projs = []; for (const x of pick) { const p = await DB.get("carte:" + x.id); if (p) projs.push(p); }
    const Q = JSON.parse(JSON.stringify(projs[0])), W0 = Q.map.w, H0 = Q.map.h, seen = {}, conflit = [];
    Q.controls.forEach(c => { if (c.type === "C") seen[c.n] = String(c.code || "").toUpperCase(); });
    projs.slice(1).forEach(p => { const kx = W0 / (p.map.w || W0), ky = H0 / (p.map.h || H0);
      p.controls.filter(c => c.type === "C").forEach(c => { const code = String(c.code || "").toUpperCase(); if (seen[c.n] !== undefined) { if (seen[c.n] !== code) conflit.push(c.n); return; } seen[c.n] = code; Q.controls.push({ ...JSON.parse(JSON.stringify(c)), id: uid(6), x: c.x != null ? c.x * kx : null, y: c.y != null ? c.y * ky : null }); }); });
    Q.courses = []; Q.nom = $("#mcN", m).value.trim() || "Carte mère"; Q.salt = uid(6); delete Q.libId;
    P = Q; undoStack.length = 0; ED.sel = null; saveP(true); await libSave(Q.nom, null); m.close(); setPTab("carte"); $("#projName") && ($("#projName").textContent = Q.nom);
    toast(`Carte mère : ${Q.controls.filter(c => c.type === "C").length} balises${conflit.length ? ` · ⚠ numéros en double ignorés : ${[...new Set(conflit)].join(", ")}` : ""}`, conflit.length ? "ko" : "ok");
  };
}
async function libraryDialog() {
  const L = await libList();
  const m = openModal(`<h2>📚 Bibliothèque de cartes</h2><p class="muted">Tes cartes enregistrées sur cet appareil. Ouvre une carte pour la modifier, ou envoie-la comme parcours dans l'appli CO Course.</p>
   <div class="row" style="margin-bottom:10px"><button class="btn or small" id="lbSave">💾 Enregistrer la carte actuelle</button><button class="btn alt small" id="lbMere">🧩 Créer une carte mère</button><button class="btn ghost small" id="lbExp">⬇ Sauvegarder la bibliothèque (fichier)</button><button class="btn ghost small" id="lbImp">📥 Importer un fichier</button></div>
   <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px">${L.map(x => `<div class="card" style="padding:10px;margin:0;${x.id === P.libId ? "outline:3px solid var(--or)" : ""}">${x.thumb ? `<img src="${x.thumb}" style="width:100%;height:140px;object-fit:contain;background:#eee;border-radius:8px">` : ""}
     <b style="display:block;margin-top:6px">${esc(x.nom)}</b><span class="muted" style="font-size:.8rem">${x.n} balise(s) · ${new Date(x.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}${x.id === P.libId ? " · ouverte" : ""}</span>
     <div class="row" style="margin-top:6px;gap:4px"><button class="btn small or" data-op="${x.id}">Ouvrir</button><button class="btn small alt" data-coe="${x.id}">📲 CO Course</button><button class="btn small ghost" data-rn="${x.id}">✏️</button><button class="btn small ghost" data-dp="${x.id}">⧉</button><button class="btn small ghost" data-rm="${x.id}" style="color:#d62839">✕</button></div></div>`).join("") || '<p class="muted">Aucune carte enregistrée pour l\'instant.</p>'}</div>`, { wide: true });
  $("#lbSave", m).onclick = () => { m.close(); saveAsDialog(); };
  $("#lbMere", m).onclick = () => { m.close(); mereDialog(L); };
  $$("[data-op]", m).forEach(b => b.onclick = async () => {
    const x = L.find(y => y.id === b.dataset.op), cur = P.libId && L.find(y => y.id === P.libId);
    if (x.id !== P.libId && !confirm(`Ouvrir « ${x.nom} » ?\nLa carte actuelle${cur ? ` (« ${cur.nom} »)` : ""} sera remplacée à l'écran${cur ? " : pense à la mettre à jour si tu l'as modifiée" : " : enregistre-la d'abord si tu veux la garder"}.`)) return;
    const p = await DB.get("carte:" + x.id); if (!p) return toast("Carte introuvable", "ko");
    P = p; P.libId = x.id; undoStack.length = 0; ED.sel = null; ED.view = null; saveP(true); m.close(); setPTab("carte"); $("#projName") && ($("#projName").textContent = P.nom); toast(`« ${x.nom} » ouverte ✓`, "ok");
  });
  $$("[data-coe]", m).forEach(b => b.onclick = async () => { const p = await DB.get("carte:" + b.dataset.coe); if (p) { m.close(); coeDialog(p); } });
  $$("[data-rn]", m).forEach(b => b.onclick = async () => { const x = L.find(y => y.id === b.dataset.rn), n = (prompt("Nouveau nom :", x.nom) || "").trim(); if (!n) return; x.nom = n; const p = await DB.get("carte:" + x.id); if (p) { p.nom = n; await DB.set("carte:" + x.id, p); } if (P.libId === x.id) { P.nom = n; saveP(); $("#projName") && ($("#projName").textContent = n); } await DB.set("cartes", L); m.close(); libraryDialog(); });
  $$("[data-dp]", m).forEach(b => b.onclick = async () => { const x = L.find(y => y.id === b.dataset.dp), p = await DB.get("carte:" + x.id); if (!p) return; const id = uid(8); await DB.set("carte:" + id, { ...p, nom: x.nom + " (copie)" }); L.unshift({ ...x, id, nom: x.nom + " (copie)", date: Date.now() }); await DB.set("cartes", L); m.close(); libraryDialog(); });
  $$("[data-rm]", m).forEach(b => b.onclick = async () => { const x = L.find(y => y.id === b.dataset.rm); if (!confirm(`Supprimer « ${x.nom} » de la bibliothèque ?`)) return; await DB.del("carte:" + x.id); await DB.set("cartes", L.filter(y => y !== x)); if (P.libId === x.id) { delete P.libId; saveP(); } m.close(); libraryDialog(); });
  $("#lbExp", m).onclick = async () => { const all = []; for (const x of L) all.push({ meta: x, p: await DB.get("carte:" + x.id) }); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: "orienrun-cartes", v: 1, cartes: all })], { type: "application/json" })); a.download = "bibliotheque-cartes-orienrun.json"; a.click(); };
  $("#lbImp", m).onclick = () => { const i = document.createElement("input"); i.type = "file"; i.accept = ".json,application/json"; i.onchange = async () => { try { const j = JSON.parse(await i.files[0].text()); if (j.app !== "orienrun-cartes") throw new Error("Ce n'est pas une bibliothèque de cartes OrienRun"); const L2 = await libList(); let n = 0; for (const { meta, p } of j.cartes) { if (!p) continue; const id = L2.some(y => y.id === meta.id) ? uid(8) : meta.id; await DB.set("carte:" + id, p); L2.unshift({ ...meta, id }); n++; } await DB.set("cartes", L2); toast(`${n} carte(s) importée(s) ✓`, "ok"); m.close(); libraryDialog(); } catch (e) { toast(e.message, "ko"); } }; i.click(); };
}

// ---------- Envoi vers l'appli CO Course (même script Google) ----------
async function coeDialog(proj = P) {
  const B = proj.controls.filter(c => c.type === "C" && c.x != null).sort((a, b) => (+a.n) - (+b.n));
  const bad = B.filter(c => !/^[A-Z]{3}$/.test(String(c.code || "").toUpperCase()));
  const m = openModal(`<h2>📲 Utiliser cette carte dans CO Course</h2>
   <p class="muted">La carte « <b>${esc(proj.nom)}</b> » et ses <b>${B.length} balises</b> remplacent la carte et la liste des balises de l'appli <b>CO Course – l'outil des élèves pendant la course</b>. Les téléphones des élèves la reçoivent en moins de 15 s. Tes réglages de parcours, tes listes d'élèves et les résultats sont gardés.</p>
   <div class="field"><label>Version de la carte envoyée aux élèves</label><select class="inp" id="coV"><option value="eleve">Numéros des balises, sans code</option><option value="vierge">Cercles seuls, sans numéro ni code</option></select></div>
   ${bad.length ? `<p class="chip ko" style="display:inline-block">${bad.length} balise(s) sans code de 3 lettres (${bad.slice(0, 8).map(c => esc(c.n)).join(", ")}${bad.length > 8 ? "…" : ""}) : l'appli élève a besoin des codes. Saisis-les d'abord (onglet Balises → ⌨ Saisir les codes).</p>` : ""}
   <div class="field" style="background:#fff4ea;border:2px solid var(--or);border-radius:12px;padding:10px"><label><b>Utiliser cette carte comme…</b></label><select class="inp" id="coR"><option value="">Carte unique (remplace la carte, les balises et les 3 cartes)</option><option value="0">👥 Carte du parcours collectif</option><option value="1">👤 Carte individuelle 1</option><option value="2">👤 Carte individuelle 2</option><option value="m">🗺 Carte mère (pour l'enseignant : toutes les balises, les 3 cartes sont gardées)</option></select>
    <small class="muted">Avec 3 cartes différentes (bibliothèque de cartes) : envoie chacune à son tour en choisissant son rôle. Les autres cartes déjà envoyées sont gardées, et la liste des balises de CO Course regroupe celles des 3 cartes. Les 2 cartes individuelles se partagent dans le binôme.</small></div>
   <div class="field" id="coKs"><label>… ou, dans cette carte, un parcours d'OrienRun = une carte avec seulement ses balises (facultatif)</label>
    ${proj.courses.length ? `<div class="row" style="gap:6px;flex-wrap:wrap">${[["coK0", "👥 Carte du collectif"], ["coK1", "👤 Carte individuelle 1"], ["coK2", "👤 Carte individuelle 2"]].map(([id, l]) => `<label style="flex:1;min-width:180px"><small>${l}</small><select class="inp" id="${id}"><option value="">— aucune —</option>${proj.courses.map(k => `<option value="${k.id}">${esc(k.nom)} (${k.ctrl.length} balises)</option>`).join("")}</select></label>`).join("")}</div><small class="muted">Les 2 cartes individuelles se partagent dans le binôme : si un élève prend la carte 1, son binôme a la carte 2. Sans choix : tous les élèves ont la carte complète.</small>` : `<small class="muted">Crée d'abord des parcours (onglet Parcours) pour proposer plusieurs cartes (1 collective, 2 individuelles).</small>`}</div>
   <div style="max-height:46vh;overflow:auto;border-radius:10px;background:#eee"><svg id="coPrev" viewBox="0 0 ${proj.map.w} ${proj.map.h}" style="width:100%;display:block"></svg></div>
   <p id="coSt" class="muted"></p>
   <p class="muted" style="font-size:.75rem;margin:0 0 6px">envoi v2</p><div class="row"><button class="btn or" id="coGo" ${bad.length || !B.length ? "disabled" : ""}>📲 Envoyer vers CO Course</button><a class="btn ghost" href="../co-eval/" target="_blank">Ouvrir CO Course</a></div>`, { wide: true });
  const prev = () => $("#coPrev", m).innerHTML = mapSVG(proj, MAP_VERSIONS[$("#coV", m).value].o);
  prev(); $("#coV", m).onchange = prev; $("#coR", m).onchange = () => { $("#coKs", m).style.display = $("#coR", m).value ? "none" : ""; };
  $("#coGo", m).onclick = async () => {
    const st = $("#coSt", m), btn = $("#coGo", m); btn.disabled = true;
    try {
      if (!tpw()) throw new Error("Connecte-toi d'abord à l'espace enseignant avec ton mot de passe");
      st.textContent = "⏳ Préparation de l'image…";
      let img = await mapImage(proj, $("#coV", m).value, 2600, "image/jpeg", .85), q = .75; while (img.length > 1.4e6 && q > .45) { img = await mapImage(proj, $("#coV", m).value, 2400, "image/jpeg", q); q -= .1; }
      st.textContent = "⏳ Lecture des réglages de CO Course…";
      const g = await apiCall(apiUrl(), "coeGet", { vc: "" }, 20000);
      let conf = {}; try { conf = g.conf ? JSON.parse(g.conf) : {}; } catch (e) {}
      if ($("#coR", m).value !== "" || ["coK0", "coK1", "coK2"].some(id => $("#" + id, m) && $("#" + id, m).value)) { // plusieurs cartes : il faut le script Google à jour (action coeMap)
        try { await apiCall(apiUrl(), "coeMap", { cle: "carte_m0", teacher: tpw() }, 20000); } catch (e) { if (/inconnue/i.test(e.message)) throw new Error("Ton script Google n'est pas à jour : remplace-le par la dernière version de Code.gs puis redéploie (Nouvelle version). Sans cela, les 3 cartes ne peuvent pas être envoyées."); } }
      const nums = B.map(c => +c.n);
      const W = proj.map.w, H = proj.map.h, dep = proj.controls.find(c => c.type === "S" && c.x != null);
      const balx = B.map(c => ({ n: +c.n, code: String(c.code).toUpperCase(), x: +(c.x / W).toFixed(4), y: +(c.y / H).toFixed(4), ...(c.niv ? { niv: +c.niv } : {}) })), role = $("#coR", m).value;
      if (role === "m") { // carte mère : carte générale (suivi de l'enseignant), les cartes des parcours sont gardées
        st.textContent = `⏳ Envoi de la carte mère (${Math.round(img.length / 1024)} Ko)…`;
        await apiCall(apiUrl(), "coeSave", { teacher: tpw(), cle: "carte", data: img }, 90000);
        const have = new Set(balx.map(b => b.n + b.code)), extra = []; (conf.cartes || []).forEach(c => (c.balx || []).forEach(b => { if (!have.has(b.n + b.code)) { have.add(b.n + b.code); extra.push(b); } }));
        conf.balises = [...balx, ...extra].sort((a, b) => a.n - b.n); if (conf.balises.some(b => b.niv)) conf.niv = true;
        conf.depart = dep ? { x: +(dep.x / W).toFixed(4), y: +(dep.y / H).toFixed(4) } : conf.depart || null; conf.mereNom = proj.nom; conf.demo = false; conf.orT = Date.now();
        await apiCall(apiUrl(), "coeSave", { teacher: tpw(), cle: "conf", data: JSON.stringify(conf) }, 30000);
        st.innerHTML = `✅ Carte mère envoyée (${balx.length} balises)${extra.length ? ` · ⚠ ${extra.length} balise(s) des cartes des parcours absentes de la carte mère : ${extra.map(b => b.n).join(", ")}` : ""}. Les cartes des parcours sont gardées.`; btn.disabled = false; return;
      }
      if (role !== "") { // une des 3 cartes de l'évaluation (collectif, individuelle 1 ou 2)
        const i = +role; st.textContent = `⏳ Envoi de la carte (${Math.round(img.length / 1024)} Ko)…`;
        const r = await apiCall(apiUrl(), "coeSave", { teacher: tpw(), cle: "carte_m" + i, data: img }, 90000);
        const L = (Array.isArray(conf.cartes) ? conf.cartes : []).filter(c => c.role !== i && c.id !== "m" + i);
        L.push({ id: "m" + i, role: i, nom: proj.nom, bal: balx.map(b => b.n), balx, dep: dep ? { x: +(dep.x / W).toFixed(4), y: +(dep.y / H).toFixed(4) } : null, v: (r && r.v) || String(Date.now()) }); L.sort((a, b) => a.role - b.role);
        const all = {}; (conf.mereNom && Array.isArray(conf.balises) ? conf.balises : []).forEach(b => { all[b.n + b.code] = b; }); L.forEach(c => (c.balx || []).forEach(b => { all[b.n + b.code] = all[b.n + b.code] || b; }));
        conf.cartes = L; conf.balises = Object.values(all).sort((a, b) => a.n - b.n); if (conf.balises.some(b => b.niv)) conf.niv = true;
        conf.carteNom = (conf.mereNom ? conf.mereNom + " · " : "") + L.map(c => c.nom).join(" + "); conf.demo = false; conf.orT = Date.now();
        if (Array.isArray(conf.parcours)) { const ix = ro => L.findIndex(c => c.role === ro), duo = conf.parcours.find(p => p.type === "duo"), ind = conf.parcours.find(p => p.type !== "duo");
          if (duo) duo.cartes = ix(0) >= 0 ? [ix(0)] : []; if (ind) ind.cartes = [ix(1), ix(2)].filter(x => x >= 0); }
        st.textContent = "⏳ Envoi des balises…";
        await apiCall(apiUrl(), "coeSave", { teacher: tpw(), cle: "conf", data: JSON.stringify(conf) }, 30000);
        const dup = conf.balises.filter((b, j, A) => A.findIndex(x => x.n === b.n) !== j).map(b => b.n);
        st.innerHTML = `✅ Envoyé : « ${esc(proj.nom)} » = ${["carte du collectif", "carte individuelle 1", "carte individuelle 2"][i]}. Cartes de l'évaluation : ${L.map(c => esc(c.nom)).join(", ")}.${dup.length ? ` <b style="color:#d62839">⚠ Numéros présents sur plusieurs cartes avec des codes différents : ${[...new Set(dup)].join(", ")}.</b>` : ""}`;
        btn.disabled = false; return;
      }
      conf.balises = balx; if (conf.balises.some(b => b.niv)) conf.niv = true;
      conf.depart = dep ? { x: +(dep.x / W).toFixed(4), y: +(dep.y / H).toFixed(4) } : null;
      conf.carteNom = proj.nom; delete conf.mereNom; conf.demo = false; conf.orT = Date.now();
      // cartes de l'évaluation : une image par parcours d'OrienRun (seulement ses balises)
      const roles = ["coK0", "coK1", "coK2"].map(id => $("#" + id, m) && $("#" + id, m).value).map(v => v ? proj.courses.find(k => k.id === v) : null), cartes = [];
      for (let i = 0; i < 3; i++) { const k = roles[i]; if (!k) continue;
        const keep = new Set(k.ctrl), pc = { ...proj, controls: proj.controls.filter(c => c.type !== "C" || keep.has(c.id)) };
        st.textContent = `⏳ Carte « ${k.nom} »…`; let im = await mapImage(pc, $("#coV", m).value, 2600, "image/jpeg", .85), q2 = .75; while (im.length > 1.4e6 && q2 > .45) { im = await mapImage(pc, $("#coV", m).value, 2400, "image/jpeg", q2); q2 -= .1; }
        const r = await apiCall(apiUrl(), "coeSave", { teacher: tpw(), cle: "carte_m" + i, data: im }, 90000);
        cartes.push({ id: "m" + i, role: i, nom: k.nom, bal: k.ctrl.map(id => proj.controls.find(c => c.id === id)).filter(c => c && c.type === "C").map(c => +c.n), v: (r && r.v) || String(Date.now()) }); }
      conf.cartes = cartes;
      if (Array.isArray(conf.parcours)) { const ix = role => cartes.findIndex(c => c.role === role), duo = conf.parcours.find(p => p.type === "duo"), ind = conf.parcours.find(p => p.type !== "duo");
        conf.parcours.forEach(p => p.cartes = []);
        if (duo && ix(0) >= 0) duo.cartes = [ix(0)];
        if (ind) ind.cartes = [ix(1), ix(2)].filter(i => i >= 0);
        conf.parcours.forEach(p => { const c = p.cartes.length === 1 ? cartes[p.cartes[0]] : null; if (c && p.oblig && !c.bal.includes(+p.oblig)) p.oblig = null; if (c && p.nb > c.bal.length) p.nb = c.bal.length; }); }
      if (Array.isArray(conf.parcours)) conf.parcours.forEach(p => { if (p.oblig && !nums.includes(+p.oblig)) p.oblig = null; if (p.nb > nums.length) p.nb = nums.length; });
      st.textContent = `⏳ Envoi de la carte (${Math.round(img.length / 1024)} Ko)…`;
      await apiCall(apiUrl(), "coeSave", { teacher: tpw(), cle: "carte", data: img }, 90000);
      st.textContent = "⏳ Envoi des balises…";
      await apiCall(apiUrl(), "coeSave", { teacher: tpw(), cle: "conf", data: JSON.stringify(conf) }, 30000);
      st.innerHTML = `✅ Envoyé : ${B.length} balises. Les élèves la reçoivent en moins de 15 s.${(conf.parcours || []).some(p => !p.oblig) ? " Pense à vérifier les balises obligatoires dans CO Course (⚙ Paramètres)." : ""}`;
      toast("Carte envoyée vers CO Course ✓", "ok");
    } catch (e) { st.textContent = "⚠ " + (/Action inconnue/.test(e.message) ? "Ton script Google n'est pas à jour : remplace-le par la dernière version de Code.gs puis redéploie." : e.message); btn.disabled = false; }
  };
}
