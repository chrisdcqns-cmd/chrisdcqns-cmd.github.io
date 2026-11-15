/**
 * Escalade EPS — réception des grimpes dans Google Sheets.
 *
 * Les élèves n'y apparaissent que par leur code anonyme (ou prénom + initiale,
 * selon le réglage de l'application). La correspondance code ↔ élève reste
 * sur la tablette (export Excel, colonne « Code anonyme »).
 *
 * + synchronisation entre tablettes (onglet caché « Sync », données chiffrées)
 * + vidéos rangées dans ton Google Drive (dossier « Escalade EPS – vidéos »).
 *
 * Installation : voir escalade/README.md
 * ⚠️ Après avoir remplacé ce code : Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer
 *    (Google demande une nouvelle autorisation, pour Google Drive : accepte-la).
 */

// ⚠️ Change cette clé, puis indique exactement la même dans l'application (sur toutes les tablettes).
const SECRET = 'CHANGE-MOI';

const SHEET_NAME = 'Grimpes';
const VERSION = 4; // 3 : colonnes rangées par titre ; 4 : synchronisation entre tablettes + vidéos dans Google Drive
const SYNC_SHEET = 'Sync';
const VID_FOLDER = 'Escalade EPS – vidéos';

/** Réception des grimpes (POST envoyé par l'application). */
function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'json' });
  }
  if (data.key !== SECRET) return json_({ ok: false, error: 'key' });
  if (data.sync) return json_(syncPush_(data.sync));
  if (data.vup) return json_(vidPut_(data.vup));

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_(data.head);
    const head = (data.head || []).map(String);
    const hdr = columns_(sh, head);           // titres de la feuille (colonnes ajoutées si besoin)
    const width = hdr.length;
    const idCol = hdr.lastIndexOf('id') + 1 || width; // colonne de l'identifiant de la grimpe

    // Index des lignes existantes par identifiant
    const last = sh.getLastRow();
    const ids = last > 1 ? sh.getRange(2, idCol, last - 1, 1).getValues().map(r => String(r[0])) : [];
    const rowOf = {};
    ids.forEach((id, i) => { if (id) rowOf[id] = i + 2; });

    // Chaque valeur va dans la colonne qui porte le même titre (l'ordre envoyé n'a pas d'importance)
    const pos = head.map(h => hdr.indexOf(h));
    const place = row => {
      const r = new Array(width).fill('');
      if (head.length && pos.every(i => i >= 0)) row.forEach((v, i) => { if (i < pos.length) r[pos[i]] = v; });
      else row.slice(0, width).forEach((v, i) => { r[i] = v; }); // ancien format sans titres
      return r;
    };

    // Ajout ou mise à jour (aucun doublon : une grimpe = un identifiant)
    const appendRows = [];
    (data.rows || []).forEach(row => {
      const r = place(row);
      const id = String(r[idCol - 1]);
      if (rowOf[id] > 1) sh.getRange(rowOf[id], 1, 1, width).setValues([r]);
      else if (!rowOf[id]) { appendRows.push(r); rowOf[id] = -1; }
    });
    if (appendRows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, appendRows.length, width).setValues(appendRows);
    }

    // Suppressions (grimpes annulées dans l'application), du bas vers le haut
    const toDelete = (data.del || []).map(id => rowOf[String(id)]).filter(r => r > 1).sort((a, b) => b - a);
    toDelete.forEach(r => sh.deleteRow(r));

    return json_({ ok: true, v: VERSION, added: appendRows.length, deleted: toDelete.length });
  } finally {
    lock.releaseLock();
  }
}

/** Ajoute les colonnes manquantes (juste avant « id ») et renvoie les titres de la feuille. */
function columns_(sh, head) {
  let hdr = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(String);
  if (!head.length || hdr.indexOf('id') < 0) return hdr;
  head.forEach((h, i) => {
    if (hdr.indexOf(h) >= 0) return;
    const before = head.slice(i + 1).map(x => hdr.indexOf(x)).find(x => x >= 0); // place selon l'ordre envoyé
    const at = (before >= 0 ? before : hdr.indexOf('id')) + 1;
    sh.insertColumnBefore(at);
    sh.getRange(1, at).setValue(h).setFontWeight('bold').setBackground('#00747A').setFontColor('#FFFFFF');
    hdr.splice(at - 1, 0, h);
  });
  return hdr;
}

/** Test de connexion et vérification de réception depuis l'application (JSONP). */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const res = { ok: true, app: 'Escalade EPS', v: VERSION, keyOk: p.key === SECRET };
  if (res.keyOk) { res.sync = 1; res.vid = 1; }
  if (res.keyOk && p.pull !== undefined) Object.assign(res, syncPull_(p));
  if (res.keyOk && p.vlist !== undefined) res.vids = vidList_();
  if (res.keyOk && p.vget !== undefined) res.part = vidGet_(p.vget, p.i);
  // Vérification de réception : l'application envoie les identifiants qu'elle vient de transmettre,
  // le script répond ceux qui sont bien présents dans la feuille.
  if (res.keyOk && p.ids !== undefined) {
    const want = String(p.ids).split(',').filter(String);
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const have = {};
    if (sh && sh.getLastRow() > 1) {
      const hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
      const col = hdr.lastIndexOf('id') + 1 || sh.getLastColumn();
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

function sheet_(head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0 && head && head.length) {
    sh.getRange(1, 1, 1, head.length).setValues([head])
      .setFontWeight('bold').setBackground('#00747A').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Synchronisation entre tablettes (onglet caché « Sync ») ----------
   Chaque tablette envoie ses classes, leçons, grimpes, cotations et contenus sous forme
   d'enregistrements CHIFFRÉS sur la tablette (AES-GCM, clé dérivée de la clé secrète).
   La feuille « Sync » ne contient donc aucun prénom lisible. */
function syncSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SYNC_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SYNC_SHEET);
    sh.getRange(1, 1, 1, 6).setValues([['seq', 'clé', 'mise à jour', 'supprimé', 'données (chiffrées)', 'tablette']]).setFontWeight('bold');
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

/** Renvoie les éléments modifiés depuis « since » (par paquets de 300). */
function syncPull_(p) {
  const seq = Number(PropertiesService.getScriptProperties().getProperty('syncSeq') || 0);
  const since = Number(p.since || 0);
  if (since >= seq) return { seq: seq, recs: [], more: false };
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SYNC_SHEET);
  if (!sh || sh.getLastRow() < 2) return { seq: seq, recs: [], more: false };
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues()
    .filter(r => Number(r[0]) > since)
    .sort((a, b) => Number(a[0]) - Number(b[0]));
  const out = rows.slice(0, 300).map(r => [Number(r[0]), String(r[1]), Number(r[2]), Number(r[3]) ? 1 : 0, String(r[4])]);
  return { seq: seq, recs: out, more: rows.length > 300 };
}

/* ---------- À lancer UNE FOIS depuis l'éditeur Apps Script ----------
   Choisis « autoriserDrive » dans la liste des fonctions (en haut), puis clique sur « Exécuter » :
   Google demande l'autorisation d'accéder à Google Drive, puis le dossier « Escalade EPS – vidéos » est créé.
   Ensuite : Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer. */
function autoriserDrive() {
  const f = vidFolder_();
  Logger.log('✓ Dossier prêt : « ' + f.getName() + ' » → ' + f.getUrl());
  Logger.log('Version du script : ' + VERSION + '. Pense à redéployer : Déployer > Gérer les déploiements > ✏️ > Nouvelle version.');
}

/* ---------- Vidéos : rangées dans TON Google Drive (dossier « Escalade EPS – vidéos »), jamais publiées ----------
   L'application envoie chaque vidéo en morceaux (texte base64) ; les tablettes les téléchargent
   morceau par morceau avec la clé secrète. */
function vidFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('vidFolder');
  if (id) { try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  const f = DriveApp.createFolder(VID_FOLDER);
  props.setProperty('vidFolder', f.getId());
  return f;
}
function vidName_(v) { v = String(v || ''); if (!/^[A-Za-z0-9_-]{1,40}$/.test(v)) throw new Error('nom'); return v; }
function vidPut_(u) {
  const name = vidName_(u.name), i = Number(u.i), n = Number(u.n);
  if (!(i >= 0 && i < n && n <= 200)) return { ok: false, error: 'part' };
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const f = vidFolder_();
    const put = (fn, txt) => { const it = f.getFilesByName(fn); while (it.hasNext()) it.next().setTrashed(true); f.createFile(fn, txt, MimeType.PLAIN_TEXT); };
    put(name + '.' + i + '.part', String(u.b64 || ''));
    if (i === 0) put(name + '.meta', JSON.stringify({ n: n, size: Number(u.size) || 0, type: String(u.type || 'video/mp4'), title: String(u.title || '').slice(0, 120) }));
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}
function vidList_() {
  const out = {}, it = vidFolder_().getFiles();
  while (it.hasNext()) {
    const fi = it.next(), nm = fi.getName();
    let m = nm.match(/^([A-Za-z0-9_-]+)\.meta$/);
    if (m) { try { Object.assign(out[m[1]] = out[m[1]] || { have: 0 }, JSON.parse(fi.getBlob().getDataAsString())); } catch (e) {} continue; }
    m = nm.match(/^([A-Za-z0-9_-]+)\.(\d+)\.part$/);
    if (m) (out[m[1]] = out[m[1]] || { have: 0 }).have++;
  }
  return out;
}
function vidGet_(v, i) {
  const it = vidFolder_().getFilesByName(vidName_(v) + '.' + Number(i) + '.part');
  return it.hasNext() ? it.next().getBlob().getDataAsString() : '';
}
