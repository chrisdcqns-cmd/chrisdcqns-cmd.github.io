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
    const width = sh.getLastColumn();
    const idCol = width; // la dernière colonne contient l'identifiant de la grimpe

    // Index des lignes existantes par identifiant
    const last = sh.getLastRow();
    const ids = last > 1 ? sh.getRange(2, idCol, last - 1, 1).getValues().map(r => String(r[0])) : [];
    const rowOf = {};
    ids.forEach((id, i) => { if (id) rowOf[id] = i + 2; });

    // Ajout ou mise à jour (aucun doublon : une grimpe = un identifiant)
    const appendRows = [];
    (data.rows || []).forEach(row => {
      const r = row.slice(0, width);
      while (r.length < width) r.push('');
      const id = String(r[width - 1]);
      if (rowOf[id]) sh.getRange(rowOf[id], 1, 1, width).setValues([r]);
      else { appendRows.push(r); rowOf[id] = -1; }
    });
    if (appendRows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, appendRows.length, width).setValues(appendRows);
    }

    // Suppressions (grimpes annulées dans l'application), du bas vers le haut
    const toDelete = (data.del || []).map(id => rowOf[String(id)]).filter(r => r > 1).sort((a, b) => b - a);
    toDelete.forEach(r => sh.deleteRow(r));

    return json_({ ok: true, added: appendRows.length, deleted: toDelete.length });
  } finally {
    lock.releaseLock();
  }
}

/** Test de connexion depuis l'application (JSONP). */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const res = { ok: true, app: 'Escalade EPS', keyOk: p.key === SECRET };
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
