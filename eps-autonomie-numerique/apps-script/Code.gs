/**
 * Relais Vitesse EPS — réception des courses dans Google Sheets
 * et synchronisation en direct entre les tablettes (onglet caché « Sync »).
 *
 * Les élèves n'y apparaissent que par leur code anonyme (ou prénom + initiale,
 * selon le réglage de l'application). La correspondance code ↔ élève reste
 * sur la tablette (export Excel, feuille « Vitesses »).
 *
 * Synchronisation : chaque tablette envoie ses classes, leçons, groupes, élèves,
 * courses et évaluations sous forme d'enregistrements CHIFFRÉS sur la tablette
 * (AES-GCM, clé dérivée de la clé secrète ci-dessous). La feuille « Sync » ne
 * contient donc aucun nom lisible. Les tablettes récupèrent les changements des
 * autres toutes les quelques secondes.
 *
 * Installation : voir relais/README.md
 * ⚠️ Après avoir remplacé ce code : Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer.
 */

// ⚠️ Change cette clé, puis indique exactement la même dans l'application.
const SECRET = 'CHANGE-MOI';

const SHEET_NAME = 'Courses';
const SYNC_SHEET = 'Sync';

/** Réception des courses (POST envoyé par l'application). */
function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'json' });
  }
  if (data.key !== SECRET) return json_({ ok: false, error: 'key' });
  if (data.sync) return json_(syncPush_(data.sync));

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_(data.head);
    const width = sh.getLastColumn();
    const idCol = width; // la dernière colonne contient l'identifiant de la course

    // Index des lignes existantes par identifiant
    const last = sh.getLastRow();
    const ids = last > 1 ? sh.getRange(2, idCol, last - 1, 1).getValues().map(r => String(r[0])) : [];
    const rowOf = {};
    ids.forEach((id, i) => { if (id) rowOf[id] = i + 2; });

    // Ajout ou mise à jour
    const appendRows = [];
    (data.rows || []).forEach(row => {
      const r = row.slice(0, width);
      while (r.length < width) r.push('');
      const id = String(r[width - 1]);
      if (rowOf[id]) sh.getRange(rowOf[id], 1, 1, width).setValues([r]);
      else appendRows.push(r);
    });
    if (appendRows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, appendRows.length, width).setValues(appendRows);
    }

    // Suppressions (du bas vers le haut)
    const toDelete = (data.del || []).map(id => rowOf[String(id)]).filter(Boolean).sort((a, b) => b - a);
    toDelete.forEach(r => sh.deleteRow(r));

    return json_({ ok: true, added: appendRows.length, deleted: toDelete.length });
  } finally {
    lock.releaseLock();
  }
}

/** Test de connexion et vérification de réception depuis l'application (JSONP). */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const res = { ok: true, app: 'Relais Vitesse EPS', keyOk: p.key === SECRET };
  if (res.keyOk) res.sync = 1;
  if (res.keyOk && p.pull !== undefined) Object.assign(res, syncPull_(p));
  // Vérification de réception : l'application envoie les identifiants qu'elle vient de transmettre,
  // le script répond ceux qui sont bien présents dans la feuille.
  if (res.keyOk && p.ids !== undefined) {
    const want = String(p.ids).split(',').filter(String);
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const have = {};
    if (sh && sh.getLastRow() > 1) {
      const col = sh.getLastColumn();
      sh.getRange(2, col, sh.getLastRow() - 1, 1).getValues().forEach(r => { have[String(r[0])] = 1; });
    }
    res.check = true;
    res.have = want.filter(id => have[id]);
    res.rows = sh ? Math.max(0, sh.getLastRow() - 1) : 0;
  }
  const body = JSON.stringify(res);
  if (p.callback && /^[A-Za-z0-9_]+$/.test(p.callback)) {
    return ContentService.createTextOutput(p.callback + '(' + body + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Synchronisation entre tablettes ---------- */

function syncSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SYNC_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SYNC_SHEET);
    sh.getRange(1, 1, 1, 6).setValues([['seq', 'clé', 'mise à jour', 'supprimé', 'données (chiffrées)', 'tablette']])
      .setFontWeight('bold');
    sh.setFrozenRows(1);
    try { sh.hideSheet(); } catch (e) {}
  }
  return sh;
}

/** Enregistre les éléments envoyés par une tablette (le plus récent l'emporte). */
function syncPush_(s) {
  const recs = (s && s.recs) || [];
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const sh = syncSheet_();
    const props = PropertiesService.getScriptProperties();
    let seq = Number(props.getProperty('syncSeq') || 0);
    const last = sh.getLastRow();
    const cur = last > 1 ? sh.getRange(2, 2, last - 1, 2).getValues() : [];
    const at = {};
    cur.forEach((r, i) => { at[String(r[0])] = { row: i + 2, u: Number(r[1]) || 0 }; });
    const append = [];
    let n = 0;
    recs.forEach(r => {
      const k = String(r.k || '');
      if (!k) return;
      const u = Number(r.u) || 0;
      const ex = at[k];
      if (ex && u < ex.u) return; // une version plus récente est déjà là
      seq++;
      const row = [seq, k, u, r.d ? 1 : 0, r.d ? '' : String(r.x || ''), String(s.dev || '')];
      if (ex && ex.row) { sh.getRange(ex.row, 1, 1, 6).setValues([row]); ex.u = u; }
      else if (ex) { append[ex.ai] = row; ex.u = u; }
      else { append.push(row); at[k] = { row: 0, u: u, ai: append.length - 1 }; }
      n++;
    });
    if (append.length) sh.getRange(sh.getLastRow() + 1, 1, append.length, 6).setValues(append);
    props.setProperty('syncSeq', String(seq));
    return { ok: true, sync: n, seq: seq };
  } finally {
    lock.releaseLock();
  }
}

/** Renvoie les éléments modifiés depuis « since » (par paquets de 300) ; « pre » limite à un préfixe de clé (ex. disp| pour les dispenses). */
function syncPull_(p) {
  const seq = Number(PropertiesService.getScriptProperties().getProperty('syncSeq') || 0);
  const since = Number(p.since || 0);
  if (since >= seq) return { seq: seq, recs: [], more: false };
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SYNC_SHEET);
  if (!sh || sh.getLastRow() < 2) return { seq: seq, recs: [], more: false };
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues()
    .filter(r => Number(r[0]) > since && (!p.pre || String(r[1]).indexOf(String(p.pre)) === 0))
    .sort((a, b) => Number(a[0]) - Number(b[0]));
  const out = rows.slice(0, 300).map(r => [Number(r[0]), String(r[1]), Number(r[2]), Number(r[3]) ? 1 : 0, String(r[4])]);
  return { seq: seq, recs: out, more: rows.length > 300 };
}

function sheet_(head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0 && head && head.length) {
    sh.getRange(1, 1, 1, head.length).setValues([head])
      .setFontWeight('bold').setBackground('#D9481F').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
