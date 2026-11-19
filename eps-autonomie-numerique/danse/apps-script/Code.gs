/**
 * Danse EPS — boîte de dépôt des auto-positionnements des élèves.
 * Script Google réservé à Danse (indépendant du script commun des autres applications).
 *
 * Fonctionnement :
 *  - le lien personnel du bilan PDF contient un identifiant de dépôt et une clé de chiffrement propres
 *    à l'élève (calculés par la tablette à partir de la clé secrète ci-dessous, qui n'est jamais dans le lien) ;
 *  - le téléphone de l'élève dépose ici son positionnement CHIFFRÉ (aucun nom lisible dans la feuille) ;
 *  - les tablettes réglées avec la clé secrète relèvent les dépôts et les déchiffrent.
 *
 * Installation : voir README.md (même dossier).
 * ⚠️ Après avoir modifié ce code : Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer.
 */

// ⚠️ Change cette clé, puis indique exactement la même dans Danse (Réglages > Envoi automatique).
const SECRET = 'CHANGE-MOI';

const SHEET = 'Depot';
const MAX = 5000; // nombre maximal de dépôts conservés (un par élève et par classe)

/** Dépôt d'un élève (sans clé secrète) ou vidage de la boîte (avec la clé secrète). */
function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'json' }); }
  if (data.drop) return json_(dropPush_(data.drop));
  if (data.purge && data.key === SECRET) return json_(purge_());
  return json_({ ok: false, error: 'requête' });
}

/** Relevé par les tablettes (clé secrète), test de connexion, vérification de réception par l'élève (JSONP). */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const res = { ok: true, app: 'Danse EPS', keyOk: p.key === SECRET };
  if (res.keyOk && p.drops !== undefined) Object.assign(res, dropPull_(p));
  if (res.keyOk && p.ping !== undefined) res.count = count_();
  // l'élève vérifie que son dépôt est arrivé : seul le début du texte chiffré est renvoyé
  if (p.dropchk !== undefined) res.drop = dropCheck_(String(p.dropchk));
  const body = JSON.stringify(res);
  if (p.callback && /^[A-Za-z0-9_]+$/.test(p.callback)) {
    return ContentService.createTextOutput(p.callback + '(' + body + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.getRange(1, 1, 1, 4).setValues([['seq', 'clé', 'reçu', 'données (chiffrées)']]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Une ligne par élève (clé « dan|… ») : le dernier envoi remplace le précédent. */
function dropPush_(d) {
  const k = String((d && d.k) || ''), x = String((d && d.x) || '');
  if (!/^dan\|[A-Za-z0-9_-]{8,40}$/.test(k) || !/^[A-Za-z0-9_-]{20,8000}$/.test(x)) return { ok: false, error: 'dépôt' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_();
    const props = PropertiesService.getScriptProperties();
    const seq = Number(props.getProperty('seq') || 0) + 1;
    const last = sh.getLastRow();
    const keys = last > 1 ? sh.getRange(2, 2, last - 1, 1).getValues().map(r => String(r[0])) : [];
    const i = keys.indexOf(k);
    const row = [seq, k, new Date(), x];
    if (i >= 0) sh.getRange(i + 2, 1, 1, 4).setValues([row]);
    else if (keys.length >= MAX) return { ok: false, error: 'plein' };
    else sh.getRange(last + 1, 1, 1, 4).setValues([row]);
    props.setProperty('seq', String(seq));
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function dropCheck_(k) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
  if (!sh || sh.getLastRow() < 2) return '';
  const rows = sh.getRange(2, 2, sh.getLastRow() - 1, 3).getValues();
  for (let i = 0; i < rows.length; i++) if (String(rows[i][0]) === k) return String(rows[i][2]).slice(0, 16);
  return '';
}

/** Dépôts reçus depuis « since », par paquets de 300. */
function dropPull_(p) {
  const since = Number(p.since || 0);
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
  if (!sh || sh.getLastRow() < 2) return { drops: [], more: false };
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
    .filter(r => Number(r[0]) > since).sort((a, b) => Number(a[0]) - Number(b[0]));
  return { drops: rows.slice(0, 300).map(r => [Number(r[0]), String(r[1]), 0, String(r[3])]), more: rows.length > 300 };
}

function count_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
  return sh ? Math.max(0, sh.getLastRow() - 1) : 0;
}

/** Fin de cycle : supprime tous les dépôts (la numérotation continue, les tablettes ne relisent rien). */
function purge_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_();
    const n = sh.getLastRow() - 1;
    if (n > 0) sh.deleteRows(2, n);
    return { ok: true, purged: Math.max(0, n) };
  } finally {
    lock.releaseLock();
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
