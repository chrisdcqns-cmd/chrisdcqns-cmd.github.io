/**
 * Escalade EPS — réception des grimpes dans Google Sheets.
 *
 * Les élèves n'y apparaissent que par leur code anonyme (ou prénom + initiale,
 * selon le réglage de l'application). La correspondance code ↔ élève reste
 * sur la tablette (export Excel, colonne « Code anonyme »).
 *
 * Installation : voir escalade/README.md
 */

// ⚠️ Change cette clé, puis indique exactement la même dans l'application (sur toutes les tablettes).
const SECRET = 'CHANGE-MOI';

const SHEET_NAME = 'Grimpes';
const VERSION = 3; // 3 : colonnes rangées par titre (Assureur, Contre-assureur, Observateur…)

/** Réception des grimpes (POST envoyé par l'application). */
function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'json' });
  }
  if (data.key !== SECRET) return json_({ ok: false, error: 'key' });

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
