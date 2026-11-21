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
  if (p.ai === 'badsit') return badSituation_(key, p);
  if (p.ai === 'badcoach') return badCoach_(key, p);
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

/* ================= 🤖 Bilan de leçon pour l'enseignant (Claude, API d'Anthropic) ==========
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

/* ================= 🏸 Badminton : « Décris ta situation » et coach virtuel (Claude) =================
 * badsit : l'enseignant décrit une situation en une phrase → Claude renvoie le réglage du terrain à zones (JSON) que l'appli affiche pour validation.
 * badcoach : statistiques ANONYMES d'un élève (aucun nom) + objectif de la leçon → un conseil court en langage élève.
 * Garde-fou : 300 demandes par heure au maximum pour l'ensemble des tablettes. */
const CLAUDE_MODEL_SIT = 'claude-sonnet-5-5';
function quota_() {
  const c = CacheService.getScriptCache(), k = 'aiq' + Math.floor(Date.now() / 3600000), n = Number(c.get(k) || 0);
  if (n >= 300) throw new Error('Trop de demandes cette heure-ci, réessaie plus tard');
  c.put(k, String(n + 1), 3700);
}
const BAD_SIT_SCHEMA = {
  type: 'object',
  properties: {
    nom: { type: 'string', description: 'Nom court de la situation (5 mots max)' },
    desc: { type: 'string', description: 'Consigne lue par les élèves : règles et but, 2 à 3 phrases, tutoiement' },
    type: { type: 'string', enum: ['match', 'exo'], description: 'match à 2 joueurs, ou exercice (compteur de réussites : réussite = volant dans une zone b)' },
    jeu: { type: 'string', enum: ['simple', 'double'] },
    np: { type: 'integer', minimum: 1, maximum: 3, description: 'Nombre de bandes en profondeur sur chaque demi-terrain' },
    prof: { type: 'array', items: { type: 'number' }, description: 'np-1 limites en mètres depuis le filet, croissantes, entre 0.4 et 6.5' },
    nl: { type: 'integer', minimum: 1, maximum: 3, description: 'Nombre de bandes en largeur' },
    lat: { type: 'array', items: { type: 'number' }, description: 'nl-1 limites en mètres depuis le bord gauche du joueur qui reçoit, croissantes, entre 0.3 et 5.8' },
    zones: { type: 'array', description: 'Règle de chaque zone qui n\'est pas normale à 1 point', items: { type: 'object', properties: {
      r: { type: 'integer', minimum: 0, maximum: 2, description: 'bande de profondeur : 0 = près du filet' },
      c: { type: 'integer', minimum: 0, maximum: 2, description: 'bande de largeur : 0 = gauche du receveur' },
      m: { type: 'string', enum: ['n', 'b', 'x', 'g', 'o'], description: 'n normale, b bonifiée (compte pour le contrat), x interdite (le volant qui y tombe donne le point à l\'adversaire), g dégressive (1000, 100, 10, 1…), o supprimée (0 point de zone)' },
      v: { type: 'integer', minimum: 0, maximum: 1000, description: 'points de zone d\'un point marqué ici (modes n et b)' } }, required: ['r', 'c', 'm'] } },
    asym: { type: 'boolean', description: 'true si les zones n\'ont pas la même taille pour les deux joueurs (handicap)' },
    profB: { type: 'array', items: { type: 'number' }, description: 'si asym : limites de profondeur des zones visées par le joueur B' },
    latB: { type: 'array', items: { type: 'number' }, description: 'si asym : limites de largeur des zones visées par le joueur B' },
    pour: { type: 'string', enum: ['ab', 'a', 'b'], description: 'les règles de zones s\'appliquent aux deux joueurs, au joueur A seul ou au joueur B seul' },
    score: { type: 'string', enum: ['classique', 'zones'], description: 'le match se gagne au score classique ou aux points de zones' },
    cible: { type: 'integer', minimum: 0, maximum: 60, description: 'points à atteindre (0 = au temps, seulement pour le mode zones)' },
    ecart: { type: 'boolean', description: '2 points d\'écart' },
    faute: { type: 'integer', minimum: 0, maximum: 10, description: 'points de zone d\'un point gagné sur faute adverse' },
    contrat: { type: 'integer', minimum: 0, maximum: 11, description: 'nombre de points à marquer en zones b pour réussir le contrat (0 = aucun)' },
    coups: { type: 'object', description: 'bonus en points de zone quand le point est gagné avec ce coup ; clés possibles : svl (service long), svc (service court), deg (dégagé), amo (amorti), cam (contre-amorti), lob, dri (drive), sma (smash), kil (kill)', additionalProperties: { type: 'integer' } },
    deg: { type: 'array', items: { type: 'integer' }, description: 'suite des valeurs des zones dégressives' },
    essais: { type: 'integer', description: 'exercice : nombre d\'essais par joueur' },
    obj: { type: 'integer', description: 'exercice : objectif de réussites' },
    explication: { type: 'string', description: 'Pour l\'enseignant : en 1 ou 2 phrases, comment la demande a été traduite et ce qu\'il peut ajuster' }
  },
  required: ['nom', 'desc', 'type', 'np', 'nl', 'score', 'explication']
};
function badSituation_(key, p) {
  quota_();
  const texte = String(p.t || '').slice(0, 1200), ctx = String(p.ctx || '').slice(0, 600);
  if (!texte.trim()) throw new Error('Décris la situation');
  const system = 'Tu aides un enseignant d\'EPS de lycée à régler une situation de badminton sur un terrain à zones interactif (tablette). ' +
    'Chaque demi-terrain mesure 6,70 m de profondeur (du filet au fond) et 6,10 m de large. Repères depuis le filet : ligne de service court 1,98 m, ligne de service long double 5,94 m, fond 6,70 m. Couloirs de simple : 0,46 m de chaque côté. ' +
    'Les zones sont les mêmes sur les deux demi-terrains (vues par le joueur qui reçoit) : np bandes en profondeur séparées par les limites prof (mètres depuis le filet), nl bandes en largeur séparées par les limites lat (mètres depuis la gauche du receveur). Zone (r, c) : r = 0 près du filet, c = 0 à gauche. ' +
    'Exemples de découpage : avant seule = np 2, prof [1.98] ; avant / milieu / fond = np 3, prof [1.98, 4.72] ; couloirs latéraux = nl 3, lat [1.7, 4.4] ; 4 coins = np 2, prof [3.35], nl 2, lat [3.05]. ' +
    'Une zone qui n\'apparaît pas dans zones est normale et vaut 1. Pour « zone à 1000 points » ou « plus une zone est atteinte, moins elle rapporte », utilise le mode g. Pour un contrat (« un point marqué dans la zone X = point de contrat »), mets la zone en b avec une valeur de 2 ou 3 et un contrat de 3 à 5 points. ' +
    'Pour réguler le niveau (« zones plus petites pour le plus fort »), utilise asym avec profB/latB (zones visées par B) ou pour = a / b. Par défaut : match en simple, 11 points, score classique, faute = 1. ' +
    'Respecte exactement la demande, ne rajoute pas de règle non demandée. Vocabulaire : « leçon », « séquence ». Rédige desc pour des lycéens (tutoiement, phrases courtes).';
  const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({ model: CLAUDE_MODEL_SIT, max_tokens: 1500, system: system,
      tools: [{ name: 'regler_situation', description: 'Réglage complet de la situation de badminton', input_schema: BAD_SIT_SCHEMA }],
      tool_choice: { type: 'tool', name: 'regler_situation' },
      messages: [{ role: 'user', content: (ctx ? 'Contexte : ' + ctx + '\n' : '') + 'Situation voulue : ' + texte }] })
  });
  const code = r.getResponseCode(), out = JSON.parse(r.getContentText() || '{}');
  if (code !== 200) throw new Error('API ' + code + ' : ' + ((out.error && out.error.message) || ''));
  const t = (out.content || []).filter(function (c) { return c.type === 'tool_use'; })[0];
  if (!t) throw new Error('Pas de réglage renvoyé');
  return JSON.stringify(t.input);
}
function badCoach_(key, p) {
  quota_();
  const stats = String(p.t || '').slice(0, 1500), ctx = String(p.ctx || '').slice(0, 600);
  const system = 'Tu es le coach virtuel d\'un élève de lycée en badminton (EPS), en France. On te donne ses statistiques de matchs (anonymes) et l\'objectif de la leçon. ' +
    'Réponds en tutoyant l\'élève, avec des mots simples, en 3 courtes lignes commençant par : « ✅ », « 🎯 » et « 🏸 » : ce qui marche déjà (appuyé sur un chiffre), LA priorité à travailler, puis un conseil concret pour le prochain match ou exercice, en lien avec l\'objectif de la leçon. ' +
    '450 caractères au maximum. N\'invente aucun chiffre. Si les données sont trop peu nombreuses (moins de 5 points), encourage-le à jouer d\'abord un match. Pas de nom, pas de jugement sur la personne. Vocabulaire : « leçon », jamais « séance ».';
  return claude_(key, system + ' Réponds uniquement par les 3 lignes.', (ctx ? 'Leçon : ' + ctx + '\n' : '') + 'Statistiques : ' + stats);
}
/** À lancer une fois depuis l'éditeur pour vérifier « Décris ta situation » (Badminton). */
function testerBadminton() {
  Logger.log(badSituation_(PropertiesService.getScriptProperties().getProperty('ANTHROPIC_KEY'), { t: 'match en 11 points, le fond rapporte 3 points, le milieu est interdit' }));
}
