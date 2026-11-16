// =====================================================================
//  Bibliothèque de cartes, téléchargement (élève / enseignant), envoi vers l'appli CO éval
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
async function libraryDialog() {
  const L = await libList();
  const m = openModal(`<h2>📚 Bibliothèque de cartes</h2><p class="muted">Tes cartes enregistrées sur cet appareil. Ouvre une carte pour la modifier, ou envoie-la comme parcours dans l'appli CO éval.</p>
   <div class="row" style="margin-bottom:10px"><button class="btn or small" id="lbSave">💾 Enregistrer la carte actuelle</button><button class="btn ghost small" id="lbExp">⬇ Sauvegarder la bibliothèque (fichier)</button><button class="btn ghost small" id="lbImp">📥 Importer un fichier</button></div>
   <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px">${L.map(x => `<div class="card" style="padding:10px;margin:0;${x.id === P.libId ? "outline:3px solid var(--or)" : ""}">${x.thumb ? `<img src="${x.thumb}" style="width:100%;height:140px;object-fit:contain;background:#eee;border-radius:8px">` : ""}
     <b style="display:block;margin-top:6px">${esc(x.nom)}</b><span class="muted" style="font-size:.8rem">${x.n} balise(s) · ${new Date(x.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}${x.id === P.libId ? " · ouverte" : ""}</span>
     <div class="row" style="margin-top:6px;gap:4px"><button class="btn small or" data-op="${x.id}">Ouvrir</button><button class="btn small alt" data-coe="${x.id}">📲 CO éval</button><button class="btn small ghost" data-rn="${x.id}">✏️</button><button class="btn small ghost" data-dp="${x.id}">⧉</button><button class="btn small ghost" data-rm="${x.id}" style="color:#d62839">✕</button></div></div>`).join("") || '<p class="muted">Aucune carte enregistrée pour l\'instant.</p>'}</div>`, { wide: true });
  $("#lbSave", m).onclick = () => { m.close(); saveAsDialog(); };
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

// ---------- Envoi vers l'appli CO éval (même script Google) ----------
async function coeDialog(proj = P) {
  const B = proj.controls.filter(c => c.type === "C" && c.x != null).sort((a, b) => (+a.n) - (+b.n));
  const bad = B.filter(c => !/^[A-Z]{3}$/.test(String(c.code || "").toUpperCase()));
  const m = openModal(`<h2>📲 Utiliser cette carte dans CO éval</h2>
   <p class="muted">La carte « <b>${esc(proj.nom)}</b> » et ses <b>${B.length} balises</b> remplacent la carte et la liste des balises de l'appli <b>CO – Préparation à l'évaluation</b>. Les téléphones des élèves la reçoivent en moins de 15 s. Tes réglages de parcours, tes listes d'élèves et les résultats sont gardés.</p>
   <div class="field"><label>Version de la carte envoyée aux élèves</label><select class="inp" id="coV"><option value="eleve">Numéros des balises, sans code</option><option value="vierge">Cercles seuls, sans numéro ni code</option></select></div>
   ${bad.length ? `<p class="chip ko" style="display:inline-block">${bad.length} balise(s) sans code de 3 lettres (${bad.slice(0, 8).map(c => esc(c.n)).join(", ")}${bad.length > 8 ? "…" : ""}) : l'appli élève a besoin des codes. Saisis-les d'abord (onglet Balises → ⌨ Saisir les codes).</p>` : ""}
   <div style="max-height:46vh;overflow:auto;border-radius:10px;background:#eee"><svg id="coPrev" viewBox="0 0 ${proj.map.w} ${proj.map.h}" style="width:100%;display:block"></svg></div>
   <p id="coSt" class="muted"></p>
   <div class="row"><button class="btn or" id="coGo" ${bad.length || !B.length ? "disabled" : ""}>📲 Envoyer vers CO éval</button><a class="btn ghost" href="../co-eval/" target="_blank">Ouvrir CO éval</a></div>`, { wide: true });
  const prev = () => $("#coPrev", m).innerHTML = mapSVG(proj, MAP_VERSIONS[$("#coV", m).value].o);
  prev(); $("#coV", m).onchange = prev;
  $("#coGo", m).onclick = async () => {
    const st = $("#coSt", m), btn = $("#coGo", m); btn.disabled = true;
    try {
      if (!tpw()) throw new Error("Connecte-toi d'abord à l'espace enseignant avec ton mot de passe");
      st.textContent = "⏳ Préparation de l'image…";
      let img = await mapImage(proj, $("#coV", m).value, 2600, "image/jpeg", .85), q = .75; while (img.length > 1.4e6 && q > .45) { img = await mapImage(proj, $("#coV", m).value, 2400, "image/jpeg", q); q -= .1; }
      st.textContent = "⏳ Lecture des réglages de CO éval…";
      const g = await apiCall(apiUrl(), "coeGet", { vc: "" }, 20000);
      let conf = {}; try { conf = g.conf ? JSON.parse(g.conf) : {}; } catch (e) {}
      const nums = B.map(c => +c.n);
      conf.balises = B.map(c => ({ n: +c.n, code: String(c.code).toUpperCase() }));
      conf.carteNom = proj.nom; conf.demo = false;
      if (Array.isArray(conf.parcours)) conf.parcours.forEach(p => { if (p.oblig && !nums.includes(+p.oblig)) p.oblig = null; if (p.nb > nums.length) p.nb = nums.length; });
      st.textContent = `⏳ Envoi de la carte (${Math.round(img.length / 1024)} Ko)…`;
      await apiCall(apiUrl(), "coeSave", { teacher: tpw(), cle: "carte", data: img }, 90000);
      st.textContent = "⏳ Envoi des balises…";
      await apiCall(apiUrl(), "coeSave", { teacher: tpw(), cle: "conf", data: JSON.stringify(conf) }, 30000);
      st.innerHTML = `✅ Envoyé : ${B.length} balises. Les élèves la reçoivent en moins de 15 s.${(conf.parcours || []).some(p => !p.oblig) ? " Pense à vérifier les balises obligatoires dans CO éval (⚙ Paramètres)." : ""}`;
      toast("Carte envoyée vers CO éval ✓", "ok");
    } catch (e) { st.textContent = "⚠ " + (/Action inconnue/.test(e.message) ? "Ton script Google n'est pas à jour : remplace-le par la dernière version de Code.gs puis redéploie." : e.message); btn.disabled = false; }
  };
}
