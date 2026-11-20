/**
 * EPS – Autonomie et Numérique : script commun (partage entre tablettes).
 *
 * Il transporte les données communes à toutes les applications (et sert aussi l'appli « Appel AS », voir plus bas) : réglages communs (établissement,
 * enseignant, année…), dispenses, listes d'élèves, et les données d'Escalade quand elle utilise
 * le partage commun. Il est indépendant :
 *  - du script de Relais Vitesse (relais/apps-script/Code.gs : courses et synchro de Relais) ;
 *  - du script de Danse (danse/apps-script/Code.gs : auto-positionnements des élèves).
 *
 * Tout est CHIFFRÉ sur la tablette (AES-GCM, clé dérivée de la clé secrète ci-dessous) :
 * la feuille ne contient aucun nom lisible.
 *
 * Installation : voir README.md (même dossier).
 * ⚠️ Après avoir modifié ce code : Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer.
 */

// ⚠️ Change cette clé, puis indique exactement la même sur chaque tablette (page d'accueil > ⚙ Partage entre tablettes).
const SECRET = 'CHANGE-MOI';

const SYNC_SHEET = 'Sync';

/** Envoi d'enregistrements par une tablette. */
function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'json' }); }
  if (data.key !== SECRET) return json_({ ok: false, error: 'key' });
  if (data.sync) return json_(syncPush_(data.sync));
  return json_({ ok: false, error: 'requête' });
}

/** Test de connexion et récupération des changements (JSONP). */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const res = { ok: true, app: 'EPS commun', keyOk: p.key === SECRET };
  if (res.keyOk) res.sync = 1;
  if (res.keyOk && p.pull !== undefined) Object.assign(res, syncPull_(p));
  if (res.keyOk && p.as) { try { Object.assign(res, appelAS_(p)); } catch (err) { res.asErr = String(err && err.message || err); } }
  const body = JSON.stringify(res);
  if (p.callback && /^[A-Za-z0-9_]+$/.test(p.callback)) {
    return ContentService.createTextOutput(p.callback + '(' + body + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function syncSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SYNC_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SYNC_SHEET);
    sh.getRange(1, 1, 1, 6).setValues([['seq', 'clé', 'mise à jour', 'supprimé', 'données (chiffrées)', 'tablette']])
      .setFontWeight('bold');
    sh.setFrozenRows(1);
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

/** Éléments modifiés depuis « since » (par paquets de 300) ; « pre » limite à un préfixe de clé (ex. disp|). */
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

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ================= Appel AS =================
 * Lit et coche le fichier d'appel de l'association sportive (un autre Google Sheets, partagé avec toi en modification).
 * Le fichier n'est pas chiffré : c'est le tien (ou celui de l'AS), le script ne fait que lire ses cellules et cocher ses cases.
 * Sécurité : seules des cases à cocher existantes peuvent être modifiées (rien d'autre n'est écrit).
 *   ?as=get&id=<fichier>[&tab=<onglet>]        → onglets, valeurs affichées, cases à cocher (état)
 *   ?as=set&id=<fichier>&tab=<onglet>&ligne=&colonne=&coche=1|0 → coche / décoche une case (lignes et colonnes comptées à partir de 1)
 *   (paramètres aux noms longs : « r », « c », « v » courts sont interceptés par Google avant d'arriver au script)
 */
const AS_MAX_ROWS = 600, AS_MAX_COLS = 120;

function appelAS_(p) {
  let ss;
  try { ss = SpreadsheetApp.openById(String(p.id || '')); }
  catch (err) { return { asErr: 'acces' }; }
  const sheets = ss.getSheets();
  const tabs = sheets.map(sh => sh.getName());
  const sh = (p.tab && ss.getSheetByName(String(p.tab))) || sheets[0];
  if (p.as === 'set') {
    const r = Number(p.ligne || p.r), c = Number(p.colonne || p.c), v = String(p.coche !== undefined ? p.coche : p.v);
    if (!(r >= 1 && c >= 1)) return { asErr: 'case' };
    const cell = sh.getRange(r, c);
    const dv = cell.getDataValidation();
    if (!dv || dv.getCriteriaType() !== SpreadsheetApp.DataValidationCriteria.CHECKBOX) return { asErr: 'pas une case à cocher' };
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try { cell.setValue(v === '1'); SpreadsheetApp.flush(); }
    finally { lock.releaseLock(); }
    return { asOk: 1, r: r, c: c, v: cell.getValue() === true ? 1 : 0 };
  }
  const nr = Math.min(sh.getLastRow(), AS_MAX_ROWS), nc = Math.min(sh.getLastColumn(), AS_MAX_COLS);
  if (nr < 1 || nc < 1) return { asOk: 1, title: ss.getName(), tabs: tabs, tab: sh.getName(), disp: [], cb: [] };
  const rg = sh.getRange(1, 1, nr, nc);
  const disp = rg.getDisplayValues(), val = rg.getValues(), dvs = rg.getDataValidations();
  const CB = SpreadsheetApp.DataValidationCriteria.CHECKBOX;
  /* cases à cocher : [ligne, colonne, état] */
  const cb = [];
  for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) {
    const d = dvs[i][j];
    if (d && d.getCriteriaType() === CB) cb.push([i + 1, j + 1, val[i][j] === true ? 1 : 0]);
  }
  return { asOk: 1, title: ss.getName(), tabs: tabs, tab: sh.getName(), disp: disp, cb: cb };
}

/** À lancer une fois depuis l'éditeur (▶ Exécuter) après avoir collé ce code : Google demande l'autorisation
 *  d'ouvrir d'autres fichiers Google Sheets (nécessaire pour l'Appel AS). */
function autoriserAppelAS() {
  SpreadsheetApp.openById(SpreadsheetApp.getActiveSpreadsheet().getId());
  Logger.log('Autorisation OK : l\'Appel AS peut ouvrir ton fichier d\'appel.');
}
