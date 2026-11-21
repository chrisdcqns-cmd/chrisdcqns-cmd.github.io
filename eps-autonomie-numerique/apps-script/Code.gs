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
  if (data.aiReq) return json_(aiReq_(data.aiReq));
  return json_({ ok: false, error: 'requête' });
}

/** Test de connexion et récupération des changements (JSONP). */
function doGet(e) {
  const p = (e && e.parameter) || {};
  const res = { ok: true, app: 'EPS commun', keyOk: p.key === SECRET };
  if (res.keyOk) res.sync = 1;
  if (res.keyOk && p.pull !== undefined) Object.assign(res, syncPull_(p));
  if (res.keyOk && p.as) { try { Object.assign(res, appelAS_(p)); } catch (err) { res.asErr = String(err && err.message || err); } }
  res.aiv = 1;
  if (res.keyOk && p.aiget) { const c = CacheService.getScriptCache().get('ai_' + String(p.aiget).slice(0, 40)); res.aiRes = c ? JSON.parse(c) : null; }
  if (res.keyOk && p.ai) { try { res.ai = reformuler_(p); } catch (err) { res.aiErr = String(err && err.message || err); } }
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


/* ================= ✨ Reformuler (Claude, API d'Anthropic) =================
 * La clé reste ici, côté serveur : Paramètres du projet > Propriétés du script > ANTHROPIC_KEY.
 * Les applis n'envoient que le texte du commentaire (jamais le nom de l'élève) et l'activité.
 * p.ai = 'fiche' (commentaire adressé à l'élève, tutoiement), 'bulletin' (appréciation de bulletin, 3e personne, sans prénom),
 *        'eleve' (texte d'une grille d'évaluation réécrit en langage élève), 'simple' (consigne simplifiée, lisible par un élève dys),
 *        'trad' (consigne traduite dans la langue p.lang, en restant simple).
 * p.t = notes de l'enseignant (dictées ou tapées) ; p.act = activité ; p.ctx = éléments d'évaluation (degrés, note), facultatif. */
const CLAUDE_MODEL = 'claude-haiku-5-5';
function reformuler_(p) {
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_KEY');
  if (!key) throw new Error('Clé ANTHROPIC_KEY absente des propriétés du script');
  const notes = String(p.t || '').slice(0, 1500), act = String(p.act || 'EPS').slice(0, 60), ctx = String(p.ctx || '').slice(0, 600);
  if (!notes.trim() && !ctx.trim()) throw new Error('Texte vide');
  const bulletin = p.ai === 'bulletin';
  const COMMUN = ' Réponds uniquement par le texte final, sans guillemets ni introduction.';
  if (p.ai === 'eleve' || p.ai === 'simple' || p.ai === 'trad') {
    const sys = p.ai === 'eleve'
      ? 'Tu réécris pour des lycéens un descripteur de grille d\'évaluation en EPS (activité : ' + act + '). Écris à la 1re personne (« Je… »), en une ou deux phrases courtes, avec des mots simples et concrets, sans perdre le niveau d\'exigence ni inventer de critère. Vocabulaire : « leçon », « séquence ».'
      : p.ai === 'simple'
      ? 'Tu simplifies une consigne d\'EPS (activité : ' + act + ') pour un élève dyslexique ou en difficulté de lecture : phrases très courtes, une action par ligne, verbes à l\'impératif, tutoiement, mots courants ; garde toutes les règles de sécurité et tous les chiffres.'
      : 'Tu traduis une consigne d\'EPS (activité : ' + act + ') en ' + String(p.lang || 'anglais').slice(0, 30) + ', pour un élève allophone : phrases courtes et simples, une action par ligne, tutoiement si la langue le permet ; garde toutes les règles de sécurité et tous les chiffres.';
    return claude_(key, sys + COMMUN, notes);
  }
  const system = 'Tu es un enseignant d\'EPS de lycée, en France. Tu rédiges en français correct, bienveillant, précis et concret, sans formules creuses. ' +
    'Vocabulaire : « leçon » (jamais « séance »), « séquence » (jamais « cycle »). N\'invente aucun fait absent des notes. Pas de nom ni de prénom. ' +
    (bulletin ? 'Écris une appréciation de bulletin trimestriel à la 3e personne, en 2 phrases (300 caractères maximum) : le bilan, puis le conseil pour progresser.'
              : 'Écris un commentaire adressé directement à l\'élève (tutoiement), en 2 ou 3 phrases (350 caractères maximum) : ce qui est réussi, puis ce qu\'il faut travailler.') +
    ' Réponds uniquement par le texte final, sans guillemets ni introduction.';
  return claude_(key, system, 'Activité : ' + act + '\n' + (ctx ? 'Éléments d\'évaluation : ' + ctx + '\n' : '') + 'Notes de l\'enseignant : ' + (notes || '(aucune)'));
}
function claude_(key, system, user, model, maxTokens) {
  const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({ model: model || CLAUDE_MODEL, max_tokens: maxTokens || 700, system: system, messages: [{ role: 'user', content: user }] })
  });
  const code = r.getResponseCode(), out = JSON.parse(r.getContentText() || '{}');
  if (code !== 200) throw new Error('API ' + code + ' : ' + ((out.error && out.error.message) || ''));
  return (out.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('').trim();
}

/** À lancer une fois depuis l'éditeur (▶ Exécuter) : autorise l'appel à Claude et vérifie la clé. */
function testerClaude() {
  Logger.log(reformuler_({ ai: 'fiche', act: 'Escalade', t: 'pieds précis, lit bien la voie, mais assurage encore hésitant' }));
}

/* ================= 🤖 Bilan de leçon pour l'enseignant (Claude, API d'Anthropic) =================
 * L'appli envoie par POST { key, aiReq:{ id, mode:'bilan', act, t } } : t = résumé chiffré de la leçon, élèves désignés
 * par des codes E1, E2… (jamais de prénom : la correspondance reste sur la tablette). Le résultat (JSON) est rangé
 * 6 heures dans le cache du script ; l'appli le lit en JSONP avec ?aiget=<id>. */
const CLAUDE_MODEL_BILAN = 'claude-sonnet-5-5';
function aiReq_(r) {
  const id = String((r && r.id) || '').slice(0, 40), cache = CacheService.getScriptCache();
  if (!id) return { ok: false, error: 'id' };
  let out;
  try {
    const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_KEY');
    if (!key) throw new Error('Clé ANTHROPIC_KEY absente des propriétés du script');
    if (r.mode !== 'bilan') throw new Error('mode inconnu');
    out = { ok: true, t: bilan_(key, r) };
  } catch (err) { out = { ok: false, err: String(err && err.message || err) }; }
  cache.put('ai_' + id, JSON.stringify(out), 21600);
  return { ok: out.ok };
}
function bilan_(key, r) {
  const act = String(r.act || 'EPS').slice(0, 60), data = String(r.t || '').slice(0, 12000);
  if (!data.trim()) throw new Error('Leçon vide');
  const system = 'Tu es un enseignant d\'EPS expérimenté de lycée, en France, et tu aides un collègue à analyser la leçon qu\'il vient de faire (activité : ' + act + '). ' +
    'Vocabulaire : « leçon » (jamais « séance »), « séquence » (jamais « cycle »). Les élèves sont désignés par des codes (E1, E2…) : réutilise exactement ces codes, n\'invente aucun prénom. ' +
    'Appuie-toi uniquement sur les données fournies, cite des chiffres précis, ne déduis rien qui n\'y figure pas ; si les données sont trop minces pour conclure, dis-le. ' +
    'Sois concret et bref : des phrases courtes, directement utilisables en classe. La sécurité (assurage, ligne rouge, permis d\'assurer) passe avant tout. ' +
    'Pour la prochaine leçon, choisis de préférence parmi les situations d\'apprentissage listées (cite leur identifiant). ' +
    'Réponds uniquement par un objet JSON valide, sans texte autour, de la forme : ' +
    '{"synthese":"2 ou 3 phrases","reussites":["…"],"points":[{"titre":"…","constat":"chiffres à l\'appui","piste":"ce que l\'enseignant peut faire"}],' +
    '"eleves":[{"code":"E3","pourquoi":"…","conseil":"phrase adressée à l\'élève, tutoiement"}],' +
    '"prochaine":{"objectif":"une phrase","situations":["s1"],"organisation":"…"}} ' +
    '— au plus 3 réussites, 3 points à retravailler et 6 élèves à suivre.';
  const t = claude_(key, system, data, CLAUDE_MODEL_BILAN, 2000);
  const m = t.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Réponse illisible');
  JSON.parse(m[0]);
  return m[0];
}

/** À lancer une fois depuis l'éditeur (▶ Exécuter) pour vérifier le bilan de leçon. */
function testerBilan() {
  Logger.log(bilan_(PropertiesService.getScriptProperties().getProperty('ANTHROPIC_KEY'), { act: 'Escalade', t: 'Leçon de test : 2 élèves.\nE1 : 3 voies (4b Top ; 5a Top ; 5b 5 dég.)\nE2 : 1 voie (4a sous la ligne rouge, pourquoi : J\'ai eu peur)' }));
}
