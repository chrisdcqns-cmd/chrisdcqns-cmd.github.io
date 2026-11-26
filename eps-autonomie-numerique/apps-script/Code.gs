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
  if (data.drop) return json_(dropPush_(data.drop)); /* auto-positionnement d'un élève : sans clé (chiffré par le lien de sa fiche) */
  if (data.key !== SECRET) return json_({ ok: false, error: 'key' });
  if (data.purge) return json_(purge_());
  if (data.sync) return json_(syncPush_(data.sync));
  if (data.aiReq) return json_(aiReq_(data.aiReq));
  if (data.bil) { try { return json_(Object.assign({ ok: true }, bilansPut_(data.bil))); } catch (err) { return json_({ ok: false, error: String(err && err.message || err) }); } }
  if (data.ct) { try { return json_(ctPost_(data.ct)); } catch (err) { return json_({ ok: false, error: String(err && err.message || err) }); } }
  if (data.lc) { try { return json_(Object.assign({ ok: true }, lecon_(data.lc))); } catch (err) { return json_({ ok: false, error: String(err && err.message || err) }); } }
  return json_({ ok: false, error: 'requête' });
}

/** Test de connexion et récupération des changements (JSONP). */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.ct) return json_(ctGet_(p)); /* Cross-training : bibliothèque et vidéos (sans clé : fiches et vidéos publiques) */
  const res = { ok: true, app: 'EPS commun', keyOk: p.key === SECRET };
  if (res.keyOk) res.sync = 1;
  res.dropv = 1; /* ce script reçoit les auto-positionnements (remplace le script de Danse) */
  if (res.keyOk && p.drops !== undefined) Object.assign(res, dropPull_(p));
  if (p.dropchk !== undefined) res.drop = dropCheck_(String(p.dropchk)); /* l'élève vérifie que son dépôt est arrivé (début du texte chiffré seulement) */
  if (res.keyOk) res.chkv = 1; /* ce script sait confirmer la réception d'un envoi (chk) */
  if (res.keyOk && p.chk !== undefined) res.chk = syncChk_(p.chk);
  if (res.keyOk && p.pull !== undefined) Object.assign(res, syncPull_(p));
  if (res.keyOk && p.as) { try { Object.assign(res, appelAS_(p)); } catch (err) { res.asErr = String(err && err.message || err); } }
  if (p.bil) { try { res.bil = bilansGet_(String(p.bil)); res.bilv = 1; } catch (err) { res.bilErr = String(err && err.message || err); } }
  if (res.keyOk) { const lb = PropertiesService.getScriptProperties().getProperty('LAST_BACKUP'); res.sauv = lb ? Number(lb) : 0; }
  res.aiv = 3; /* 2 : bilan de leçon (ai=lecon) ; 3 : indicateur de performance pour une leçon (ai=indic) */
  if (res.keyOk && p.aiget) { const c = CacheService.getScriptCache().get('ai_' + String(p.aiget).slice(0, 40)); res.aiRes = c ? JSON.parse(c) : null; }
  if (res.keyOk && p.ai) { try { res.ai = p.ai === 'lecon' ? reformuler_(p) : propre_(reformuler_(p)); } catch (err) { res.aiErr = String(err && err.message || err); } }
  const body = asc_(JSON.stringify(res));
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

/** Confirmation de réception : pour une liste de clés (JSON), la version (u) que le script détient réellement.
 *  Les tablettes envoient « à l'aveugle » (la réponse d'un envoi n'est pas lisible) : elles ne retirent un envoi de leur
 *  file d'attente qu'après avoir lu ici que le script l'a bien enregistré. */
function syncChk_(txt) {
  let keys = [];
  try { keys = JSON.parse(String(txt || '[]')); } catch (err) { return {}; }
  if (!Array.isArray(keys) || !keys.length) return {};
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SYNC_SHEET), out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  const want = {}; keys.slice(0, 200).forEach(k => { want[String(k)] = 1; });
  sh.getRange(2, 2, sh.getLastRow() - 1, 2).getValues().forEach(r => { const k = String(r[0]); if (want[k]) out[k] = Math.max(out[k] || 0, Number(r[1]) || 0); });
  return out;
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

/* accents envoyés en \uXXXX : lisibles sur toutes les tablettes, quel que soit le jeu de caractères du navigateur (sinon « Ã© » au lieu de « é ») */
function asc_(s) { return String(s).replace(/[\u007f-\uffff]/g, function (c) { return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4); }); }
/* texte de Claude débarrassé de la mise en forme Markdown et des phrases d'introduction */
function propre_(t) {
  t = String(t || '').replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '');
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
  t = t.replace(/^\s*(voici|voilà|bien sûr|d'accord)[^\n]*:\s*\n+/i, '').replace(/(^|\s)\*([^*\n]+)\*/g, '$1$2').replace(/^#{1,6}\s*/gm, '').replace(/^\s*[-*•]\s+/gm, '– ');
  t = t.trim().replace(/^["«»“”]\s*|\s*["«»“”]$/g, '');
  return t.trim();
}
function json_(o) {
  return ContentService.createTextOutput(asc_(JSON.stringify(o))).setMimeType(ContentService.MimeType.JSON);
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
 *        'lecon' (bilan d'une leçon pour l'enseignant, à partir de résultats anonymes E1, E2…).
 * p.t = notes de l'enseignant (dictées ou tapées) ; p.act = activité ; p.ctx = éléments d'évaluation (degrés, note), facultatif. */
/* Modèles : valeurs par défaut ci-dessous ; pour en changer SANS toucher au code (modèle retiré, nouveau modèle),
 * ajoute une propriété du script (Paramètres du projet > Propriétés du script) :
 *   CLAUDE_MODELE_RAPIDE (reformulations courtes)  ·  CLAUDE_MODELE_PRECIS (leçons, grilles, bilans, console). */
function modele_(prop, defaut) { try { return String(PropertiesService.getScriptProperties().getProperty(prop) || '').trim() || defaut; } catch (e) { return defaut; } }
const CLAUDE_MODEL = modele_('CLAUDE_MODELE_RAPIDE', 'claude-haiku-5-5');
function reformuler_(p) {
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_KEY');
  if (!key) throw new Error('Clé ANTHROPIC_KEY absente des propriétés du script');
  if (p.ai === 'badsit') return badSituation_(key, p);
  if (p.ai === 'badcoach') return badCoach_(key, p);
  if (p.ai === 'badind') return badIndic_(key, p);
  const notes = String(p.t || '').slice(0, p.ai === 'lecon' ? 3200 : (p.ai === 'bulletin' || p.ai === 'avis') ? 2200 : 1500), act = String(p.act || 'EPS').slice(0, 60), ctx = String(p.ctx || '').slice(0, 600);
  if (!notes.trim() && !ctx.trim()) throw new Error('Texte vide');
  const bulletin = p.ai === 'bulletin';
  const COMMUN = ' Réponds uniquement par le texte final, sans guillemets ni introduction.';
  if (p.ai === 'lecon') {
    const sysL = 'Tu es enseignant d\'EPS en lycée, en France. Tu analyses les résultats d\'une leçon (activité : ' + act + ') saisis sur tablette par les élèves. ' +
      'Les élèves sont désignés par des codes (E1, E2…) : réutilise exactement ces codes, n\'invente aucun nom, aucun chiffre, aucun fait absent des données. ' +
      'Écris pour l\'enseignant, en français simple, avec ces quatre titres sur leur propre ligne : « Ce qui marche », « À aider en priorité », « Pour la prochaine leçon », « Un mot pour la classe ». ' +
      'Sous chaque titre, 2 à 4 tirets courts. « À aider en priorité » : les binômes ou élèves en difficulté avec la cause probable (départ du receveur, prise de marque, ralentissement, transmission trop tôt) et ce qu\'il faut leur dire. ' +
      '« Pour la prochaine leçon » : 2 ou 3 situations, de préférence choisies dans la liste fournie, avec la consigne clé. « Un mot pour la classe » : une phrase à dire aux élèves. ' +
      'Pas de mise en gras ni de tableau ; 1400 caractères maximum. Vocabulaire : « leçon » (jamais « séance »), « séquence » (jamais « cycle »).';
    return claude_(key, sysL + COMMUN, (ctx ? 'Situations disponibles : ' + ctx + '\n' : '') + 'Résultats de la leçon :\n' + notes);
  }
  if (p.ai === 'indic') {
    const sysI = 'Tu es enseignant d\'EPS en lycée, en France (activité : ' + act + '). On te donne UNE leçon rédigée par l\'enseignant (titre, objectif, contenus). ' +
      'Propose 1 ou 2 indicateurs de performance qui correspondent exactement à l\'objectif de cette leçon : des relevés simples, chiffrés, que des élèves observateurs peuvent faire pendant le jeu ' +
      '(ex. en volley-ball : points bonus / points marqués, points marqués depuis la zone avant ou arrière, balles reçues / renvoyées, attaques en 3 touches, réceptions jouables sur 10). ' +
      'Pour chacun, une seule ligne au format : « Indicateur · <ce qu\'on relève> : <comment le relever> ; repère de réussite : <seuil ou évolution attendue> ». ' +
      'Ne réécris pas la leçon, n\'ajoute rien d\'autre, pas de numéro, pas de mise en gras. Vocabulaire : « leçon », « séquence ».';
    return claude_(key, sysI + COMMUN, (ctx ? 'Indicateurs déjà prévus dans la séquence : ' + ctx + '\n' : '') + 'Leçon :\n' + notes);
  }
  if (p.ai === 'obs') {
    const sysO = 'Tu condenses les observations dictées par un enseignant d\'EPS sur UN élève pendant une leçon (activité : ' + act + '). ' +
      'Écris pour l\'enseignant, à la 3e personne, en style télégraphique : 1 à 3 phrases courtes, factuelles, regroupant ce qui est réussi puis ce qui reste à travailler. ' +
      'Garde le vocabulaire technique de l\'enseignant ; n\'invente rien ; pas de nom ni de prénom (les camarades sont désignés « un camarade »).';
    return claude_(key, sysO + COMMUN, notes);
  }
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
    (bulletin ? 'Écris une appréciation de bulletin trimestriel à la 3e personne, en 2 phrases (300 caractères maximum), formulée de façon POSITIVE et valorisante : les points forts, les progrès et l\'engagement constatés dans les données, puis un encouragement formulé positivement (« peut continuer à… », « gagnera à poursuivre… »). Aucune critique, aucun reproche, aucune tournure négative (pas de « manque », « insuffisant », « doit », « mais ») : l\'enseignant ajoute lui-même ses remarques. Si les données sont maigres, reste sobre et factuel.'
     : p.ai === 'avis' ? 'Écris l\'avis de bilan de la période pour cet élève, à la 3e personne, en 2 ou 3 phrases (380 caractères maximum) : ce qui est réussi (chiffres utiles), puis un axe de progrès concret formulé de façon constructive.'
              : 'Écris un commentaire adressé directement à l\'élève (tutoiement), en 2 ou 3 phrases (350 caractères maximum) : ce qui est réussi, puis ce qu\'il faut travailler.') +
    ' Réponds uniquement par le texte final, sans guillemets ni introduction.';
  return claude_(key, system, 'Activité : ' + act + '\n' + (ctx ? 'Éléments d\'évaluation : ' + ctx + '\n' : '') + 'Notes de l\'enseignant : ' + (notes || '(aucune)'));
}
/* ================= Leçons (eps-lecons.js) =================
 * POST {key, lc:{op:'transcrire', nom, mime, b64}} → {texte} : lecture d'un PDF ou d'une photo déposés par l'enseignant.
 * POST {key, lc:{op:'lecon', mode, act, docs:[{nom,txt}], lecons:[…], base, consigne}} → {lecon} : brouillon de leçon (JSON),
 *   à partir des documents de l'enseignant EN PRIORITÉ. Le brouillon reste invisible pour les élèves tant que l'enseignant ne l'a pas validé.
 * Aucun nom d'élève n'est envoyé. Modèle : CLAUDE_MODEL_LECON (plus précis pour un travail long). */
const CLAUDE_MODEL_LECON = modele_('CLAUDE_MODELE_PRECIS', 'claude-sonnet-5-5');
function lecon_(q) {
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_KEY');
  if (!key) throw new Error('Clé ANTHROPIC_KEY absente des propriétés du script');
  const act = String(q.act || 'EPS').slice(0, 60);
  if (q.op === 'transcrire') {
    const mime = String(q.mime || '');
    const block = mime === 'application/pdf' ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: String(q.b64 || '') } }
      : { type: 'image', source: { type: 'base64', media_type: /^image\/(png|gif|webp)$/.test(mime) ? mime : 'image/jpeg', data: String(q.b64 || '') } };
    const sys = 'Tu transcris fidèlement un document d\'un enseignant d\'EPS (activité : ' + act + ') : séquence, fiche de leçon, situations, grille. ' +
      'Recopie tout le texte, dans l\'ordre, sans résumer ni corriger, en gardant la structure (titres, listes ; tableaux en lignes « colonne : valeur »). ' +
      'Décris chaque schéma en une ligne entre crochets : [Schéma : …]. Réponds uniquement par la transcription.';
    return { texte: claude_(key, sys, [block, { type: 'text', text: 'Transcris ce document : ' + String(q.nom || '').slice(0, 120) }], CLAUDE_MODEL_LECON, 8000) };
  }
  /* Import d'une grille d'évaluation (export Additio en PDF, Excel/CSV, ou photo) → grille par degrés de eps-eval.js. */
  if (q.op === 'grille') {
    const mime = String(q.mime || ''), parts = [];
    if (q.b64) parts.push(mime === 'application/pdf' ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: String(q.b64) } }
      : { type: 'image', source: { type: 'base64', media_type: /^image\/(png|gif|webp)$/.test(mime) ? mime : 'image/jpeg', data: String(q.b64) } });
    parts.push({ type: 'text', text: (q.txt ? 'CONTENU DU FICHIER :\n' + String(q.txt).slice(0, 60000) + '\n\n' : '') + 'Convertis cette grille.' });
    const sys = 'Tu convertis une grille d\'évaluation d\'EPS (activité : ' + act + ', souvent exportée d\'Additio) en JSON, SANS rien inventer : recopie les intitulés, points et descripteurs tels quels. ' +
      'Chaque critère a exactement 4 degrés (si la grille en a 3 ou 5, regroupe ou répartis le plus fidèlement possible et signale-le dans "remarque"). ' +
      'Réponds UNIQUEMENT par : {"degres":["Degré 1","Degré 2","Degré 3","Degré 4"],"criteres":[{"id":"c1","afl":"AFL1","max":nombre de points,"nom":"","but":"","desc":["D1","D2","D3","D4"]}],"remarque":""}.';
    const t = claude_(key, sys, parts, CLAUDE_MODEL_LECON, 6000), a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('Réponse de Claude illisible');
    return { grille: lisJson_(t) };
  }
  /* Cross-training : WOD proposé à l'enseignant (brouillon) ou conseil sur le WOD d'un élève (si l'enseignant l'a activé). Jamais de nom d'élève. */
  if (q.op === 'ctwod' || q.op === 'ctconseil') {
    const base = 'Tu es enseignant d\'EPS en lycée, spécialiste du cross-training (CA5, sans matériel). Vocabulaire culturel (WOD, AMRAP, EMOM, For Time, Rep / No rep) avec le français. ' +
      'Thèmes : Renforcement (60-70 % FCM, 12-15 répétitions, récupération ≤ 30 s, circuit ou EMOM), Mental (70-80 % FCM, AMRAP à allure imposée ou For Time avec time cap), Cardio (80-90 % FCM, intervalles 30/30 ou 40/20, EMOM, E2MOM, FC relevée en fin de bloc). ' +
      'Exercices disponibles (id : nom) : ' + String(q.biblio || '').slice(0, 4000) + '. ';
    if (q.op === 'ctwod') {
      const sys = base + 'Propose le WOD de la leçon pour la classe, en tenant compte des précisions de l\'enseignant. Réponds UNIQUEMENT par : ' +
        '{"titre":"","theme":"R|M|C","format":"circuit|emom|e2mom|amrap|fortime|intervalles","params":{},"items":[{"exId":"","niv":1,"qte":10}],"consigne":"consigne aux élèves (tutoiement, 2 phrases)","pourquoi":"justification pour l\'enseignant"}. ' +
        'params selon le format : circuit {tours,recupEx,recupTour} ; emom/e2mom {minutes} ; amrap {minutes,cible} ; fortime {tours,cap} ; intervalles {travail,repos,tours}. 3 à 6 exercices, zones du corps équilibrées.';
      const t = claude_(key, sys, 'Classe / niveau : ' + String(q.niveau || '').slice(0, 200) + '\nPrécisions : ' + String(q.consigne || '').slice(0, 1500), CLAUDE_MODEL_LECON, 1500), a = t.indexOf('{'), b = t.lastIndexOf('}');
      if (a < 0 || b < a) throw new Error('Réponse de Claude illisible');
      return { wod: lisJson_(t) };
    }
    const sys = base + 'Un élève te montre son WOD. Donne-lui 3 conseils courts (tutoiement, 25 mots maximum chacun), concrets, sur la cohérence entre son thème, son format, ses quantités et ses exercices, et sur la sécurité. Ne le décourage pas. Réponds par les 3 conseils, un par ligne, commençant par « • ».';
    return { texte: claude_(key, sys, String(q.wod || '').slice(0, 3000), CLAUDE_MODEL, 500) };
  }
  /* Console ordinateur : l'enseignant demande un réglage en français ; Claude répond et PROPOSE des actions (jamais appliquées
     sans clic de l'enseignant). Contexte envoyé : paramètres des applis, classes (nom, voie, nombre d'élèves, activités), demandes
     en cours. Aucun nom d'élève. */
  if (q.op === 'console') {
    const ctx = JSON.stringify(q.contexte || {}).slice(0, 60000);
    const hist = (q.historique || []).slice(-8).map(function (m) { return (m.r === 'u' ? 'Enseignant : ' : 'Assistant : ') + String(m.t || '').slice(0, 1500); }).join('\n');
    const sys = 'Tu es l\'assistant de la console ordinateur des applications EPS d\'un enseignant d\'EPS de lycée (un seul utilisateur, plusieurs tablettes). ' +
      'Tu réponds en français, brièvement, en le tutoyant. Vocabulaire : « leçon » (jamais séance), « séquence » (jamais cycle). Classes TGT, 2GT, 1GT = voie générale, les autres = voie professionnelle. ' +
      'Tu ne modifies rien toi-même : tu PROPOSES des actions que l\'enseignant validera une par une. Actions possibles (JSON) : ' +
      '{"type":"param","app":"<dossier>","id":"<id du paramètre>","valeur":<valeur complète : tableau de chaînes pour une liste (respecter le nombre de lignes si fixed), nombre, ou texte>,"pourquoi":""} ; ' +
      '{"type":"activites","classe":"<nom exact>","activites":["<codes>", …],"pourquoi":""} (liste COMPLÈTE des activités de la classe après changement : codes esc, rel, vol, bad, dan, acro, ori, ct) ; ' +
      '{"type":"voie","classe":"<nom exact>","voie":"gt"|"pro"|"auto"} ; ' +
      '{"type":"demande","app":"<dossier ou vide>","texte":"<demande de modification du CODE de l\'appli, rédigée clairement pour un développeur : ce qu\'il faut ajouter ou changer, où, pour quoi faire>"} ' +
      'quand la demande dépasse les réglages (nouvel écran, nouveau bouton, comportement différent, correction d\'un défaut) : elle sera confiée à Claude Code ; ' +
      '{"type":"ouvrir","cible":"<dossier d\'appli ou accueil|classes|groupes|params|tablettes|demandes>"}. ' +
      'N\'utilise que les dossiers, identifiants de paramètres et noms de classes présents dans le contexte ; pour un paramètre de type liste, reprends la liste actuelle et modifie-la. ' +
      'Si tu ne sais pas, dis-le et propose plutôt une « demande ». Réponds UNIQUEMENT par du JSON : {"reponse":"texte pour l\'enseignant","actions":[…]}.';
    const user = 'CONTEXTE :\n' + ctx + (hist ? '\n\nÉCHANGES PRÉCÉDENTS :\n' + hist : '') + '\n\nDEMANDE (sujet : ' + act + ') :\n' + String(q.demande || '').slice(0, 4000);
    const t = claude_(key, sys, user, CLAUDE_MODEL_LECON, 3000), a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b < a) return { console: { reponse: t, actions: [] } };
    let o; try { o = JSON.parse(t.slice(a, b + 1)); } catch (e) { return { console: { reponse: t, actions: [] } }; }
    return { console: { reponse: String(o.reponse || ''), actions: Array.isArray(o.actions) ? o.actions.slice(0, 20) : [] } };
  }
  if (q.op !== 'lecon') throw new Error('opération inconnue');
  /* Inventaire : liste des leçons contenues dans un document (pour les mettre en fiches une par une). */
  if (q.mode === 'inventaire') {
    let dtx = '';
    (q.docs || []).forEach(function (d) { if (dtx.length < 160000) dtx += '\n\n=== Document : ' + String(d.nom || '').slice(0, 120) + ' ===\n' + String(d.txt || '').slice(0, 160000 - dtx.length); });
    const sysI = 'Tu repères les leçons d\'EPS (activité : ' + act + ') contenues dans le document d\'un enseignant : fiches de leçon, ou séquence décrite leçon par leçon. ' +
      'Vocabulaire : « leçon », « séquence ». Ne compte pas les simples situations, grilles ou annexes. Réponds UNIQUEMENT par : {"liste":[{"seq":"nom de la séquence s\'il figure","num":"n° de leçon s\'il figure","titre":"titre ou thème de la leçon, tel qu\'écrit"}]} (liste vide si le document ne contient aucune leçon).';
    const t = claude_(key, sysI, 'DOCUMENT :' + dtx, CLAUDE_MODEL_LECON, 2000), a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('Réponse de Claude illisible');
    return { liste: (lisJson_(t).liste || []).slice(0, 40) };
  }
  const MODES = {
    importer: 'Mets en forme dans la structure LA leçon contenue dans le document fourni (si le document en contient plusieurs, celle indiquée dans les précisions, sinon la première). Recopie les formulations de l\'enseignant ; n\'invente RIEN : laisse vide ("") toute rubrique absente du document.',
    suivante: 'Propose la leçon suivante de la séquence, dans la continuité des leçons existantes et en reprenant en priorité les situations, critères et progressions prévus dans les documents.',
    nouvelle: 'Propose une leçon, en reprenant en priorité ce que prévoient les documents.',
    completer: 'Complète UNIQUEMENT les rubriques vides de la leçon fournie (« base »), en cohérence avec ce qui est déjà écrit et avec les documents ; renvoie la leçon complète, rubriques déjà remplies inchangées.',
    simple: 'Adapte la leçon fournie (« base ») en une version PLUS SIMPLE pour des élèves en difficulté : mêmes objectifs de fond, tâches simplifiées, critères de réussite plus accessibles, aménagements (espace, temps, matériel, rôles).',
    difficile: 'Adapte la leçon fournie (« base ») en une version PLUS DIFFICILE pour des élèves avancés : mêmes objectifs de fond, contraintes et critères plus exigeants, incertitude accrue.',
    variante: 'Propose une variante de même niveau de la leçon fournie (« base ») : mêmes objectifs, autres situations d\'apprentissage.',
    situation: 'Rédige UNE seule situation (dans "sits", un seul élément) pour travailler EN AUTONOMIE, en remédiation, l\'apprentissage indiqué dans les précisions. Si les documents de l\'enseignant contiennent une situation adaptée, reprends-la avec ses mots ; sinon propose une situation simple, sûre, réalisable par 2 ou 3 élèves sans l\'enseignant, conforme aux programmes d\'EPS du lycée, avec : consigne courte adressée à l\'élève, critères de réussite (ce qu\'il y a à faire pour être en réussite : quantitatif chiffré et qualitatif), critères de réalisation (ce qu\'il y a à faire pour faire : 2 ou 3 repères), variables pour simplifier et pour complexifier, et « ap » = l\'apprentissage. Laisse vides les autres rubriques de la leçon ; « titre » = « Remédiation · » suivi de l\'apprentissage ; « sources » = ce qui vient des documents ou non.',
    reformater: 'Remets en forme la leçon fournie (« base »), dont le texte a pu être rangé au mauvais endroit ou en un seul bloc : redistribue CHAQUE élément dans la bonne rubrique de la structure (objectifs, but, dispositif, matériel, échauffement, situations avec consigne, critères de réussite, critères de réalisation, variables, remise en action, bilan) et ajoute les mots-clés d\'apprentissage (« ap ») de chaque situation. Recopie les formulations de l\'enseignant SANS rien inventer ni résumer ; si le document source est fourni, sers-t\'en pour retrouver ce qui manque à cette leçon ; une rubrique sans information reste vide. Garde les ids de schémas existants.'
  };
  const mode = MODES[q.mode] ? q.mode : 'nouvelle';
  const sys = 'Tu es un enseignant d\'EPS de lycée, en France, qui prépare les leçons d\'un collègue (activité : ' + act + '). ' +
    'RÈGLE PRINCIPALE : tu t\'appuies d\'abord sur les documents de l\'enseignant (sa séquence, ses leçons, ses situations, son vocabulaire) ; tu reprends ses formulations quand elles existent et tu ne proposes du nouveau que pour combler un manque. ' +
    'Vocabulaire : « leçon » (jamais « séance »), « séquence » (jamais « cycle »). Consignes adressées aux élèves (tutoiement), concrètes, avec les chiffres utiles (durées, distances, nombres de réussites). Pas de nom d\'élève. ' +
    'Structure de la leçon (réponds UNIQUEMENT par un objet JSON valide, sans texte autour) : ' +
    '{"seq":"séquence","num":"n° de leçon","titre":"","duree":"","objM":"objectif moteur","objMe":"objectif méthodologique","objS":"objectif social","but":"but de la leçon",' +
    '"disp":"dispositif","mat":"matériel","ech":"échauffement : consigne","echImg":"id du schéma de l\'échauffement s\'il y en a un","sits":[{"t":"titre","cons":"consigne","img":"id du schéma de la situation s\'il y en a un","crQ":"critères de réussite quantitatifs (ce qu\'il y a à faire pour être en réussite, qui se compte)","crQl":"critères de réussite qualitatifs (ce qu\'il y a à faire pour être en réussite, qui s\'observe)","crR":"critères de réalisation (ce qu\'il y a à faire pour faire : comment faire, placements, gestes, prises d\'information)","simp":"variables de simplification","comp":"variables de complexification","ap":"apprentissage travaillé : 1 à 3 mots-clés courts (ex. smash, frappe haute)"}],' +
    '"rem":"remise en action : match ou situation plus large","remCr":"critères de réussite de la remise en action","bilan":"bilan de la leçon","sources":"ce qui vient des documents et ce que tu proposes"}. ' +
    'En général deux situations. Les schémas (images) du document sont notés [SCHÉMA:id] à leur place dans le texte : reporte chaque id dans "echImg" ou dans "img" de la situation qu\'il illustre (jamais d\'id inventé).';
  let docs = '';
  (q.docs || []).forEach(function (d) { if (docs.length < 160000) docs += '\n\n=== Document : ' + String(d.nom || '').slice(0, 120) + ' ===\n' + String(d.txt || '').slice(0, 160000 - docs.length); });
  /* Mise en cache (prompt caching) : la consigne générale et les documents sont identiques d'un appel à l'autre
     (mise en fiches leçon par leçon, leçon suivante, variantes…) : relus à tarif très réduit pendant 5 minutes. */
  const tete = docs ? 'DOCUMENTS DE L\'ENSEIGNANT :' + docs + '\n\n' : 'Aucun document déposé.\n\n';
  const suite = 'TRAVAIL DEMANDÉ : ' + MODES[mode] + '\n\n' +
    ((q.lecons || []).length ? 'LEÇONS DÉJÀ ÉCRITES :\n' + JSON.stringify(q.lecons).slice(0, 40000) + '\n\n' : '') +
    (q.base ? 'LEÇON DE BASE (« base ») :\n' + JSON.stringify(q.base).slice(0, 12000) + '\n\n' : '') +
    (q.consigne ? 'PRÉCISIONS DE L\'ENSEIGNANT : ' + String(q.consigne).slice(0, 1500) + '\n\n' : '') + 'Réponds par l\'objet JSON de la leçon.';
  const user = docs.length > 4000 ? [{ type: 'text', text: tete, cache_control: { type: 'ephemeral' } }, { type: 'text', text: suite }] : tete + suite;
  const t = claude_(key, sys, user, CLAUDE_MODEL_LECON, 4000);
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('Réponse de Claude illisible');
  return { lecon: lisJson_(t) };
}
/* Appel à l'API de Claude, robuste : 3 essais si l'API est surchargée ou occupée (429, 500, 502, 503, 504, 529),
   réponse redemandée plus longue si elle a été coupée (max_tokens), messages d'erreur compréhensibles. */
function claudeRaw_(key, body) {
  var last = '', code = 0, out = {};
  for (var i = 0; i < 3; i++) {
    var r;
    try {
      r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, payload: JSON.stringify(body) });
    } catch (e) {
      last = String(e && e.message || e);
      if (/timeout|délai|timed out/i.test(last)) throw new Error('Claude a mis trop de temps à répondre. Réessaie, ou découpe la demande (document plus court).');
      Utilities.sleep(1500 * (i + 1)); continue;
    }
    code = r.getResponseCode(); out = {}; try { out = JSON.parse(r.getContentText() || '{}'); } catch (e) {}
    if (code === 200) {
      if (out.stop_reason === 'max_tokens' && body.max_tokens < 16000 && i < 2) { body.max_tokens = Math.min(16000, Math.round(body.max_tokens * 1.8)); continue; }
      return out;
    }
    last = (out.error && out.error.message) || ('code ' + code);
    if (code === 400 && /cache/i.test(last) && sansCache_(body)) continue; /* mise en cache refusée : même demande, sans cache */
    if ([429, 500, 502, 503, 504, 529].indexOf(code) < 0) break;
    Utilities.sleep(2000 * (i + 1) * (i + 1));
  }
  if (code === 401 || code === 403) throw new Error('Clé Claude refusée : vérifie ANTHROPIC_KEY (Propriétés du script). ' + last);
  if (code === 429) throw new Error('Trop de demandes à Claude en même temps : réessaie dans une minute.');
  if (code === 529 || code === 503 || code === 500 || code === 502 || code === 504) throw new Error('Claude est surchargé pour le moment : réessaie dans quelques minutes.');
  if ((code === 400 || code === 404) && /model/i.test(last)) throw new Error('Modèle de Claude indisponible (' + (body.model || '') + ') : indique un modèle actuel dans les propriétés du script (CLAUDE_MODELE_RAPIDE ou CLAUDE_MODELE_PRECIS). ' + last);
  if (code === 400 && /credit|billing|balance/i.test(last)) throw new Error('Crédit Claude épuisé sur le compte Anthropic : ' + last);
  throw new Error('API ' + (code || '?') + ' : ' + last);
}
/* Retire les marques de mise en cache d'une demande ; renvoie true s'il y en avait. */
function sansCache_(body) {
  var n = 0;
  (body.messages || []).forEach(function (m) { if (Array.isArray(m.content)) m.content.forEach(function (c) { if (c && c.cache_control) { delete c.cache_control; n++; } }); });
  if (body.cache_control) { delete body.cache_control; n++; }
  return n > 0;
}
/* JSON renvoyé par Claude → objet, avec un message clair si la réponse est inutilisable. */
function lisJson_(t) {
  var a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('Réponse de Claude illisible : réessaie.');
  try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { throw new Error('Réponse de Claude incomplète ou mal formée : réessaie (ou raccourcis le document).'); }
}
function claude_(key, system, user, model, maxTokens) {
  const out = claudeRaw_(key, { model: model || CLAUDE_MODEL, max_tokens: maxTokens || 700, system: system, messages: [{ role: 'user', content: user }] });
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
const CLAUDE_MODEL_BILAN = modele_('CLAUDE_MODELE_PRECIS', 'claude-sonnet-5-5');
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
const CLAUDE_MODEL_SIT = modele_('CLAUDE_MODELE_PRECIS', 'claude-sonnet-5-5');
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
  const out = claudeRaw_(key, { model: CLAUDE_MODEL_SIT, max_tokens: 1500, system: system,
      tools: [{ name: 'regler_situation', description: 'Réglage complet de la situation de badminton', input_schema: BAD_SIT_SCHEMA }],
      tool_choice: { type: 'auto' },
      messages: [{ role: 'user', content: (ctx ? 'Contexte : ' + ctx + '\n' : '') + 'Situation voulue : ' + texte + '\n\nRéponds uniquement en appelant l\'outil regler_situation.' }] });
  const t = (out.content || []).filter(function (c) { return c.type === 'tool_use'; })[0];
  if (t) return JSON.stringify(t.input);
  // Secours : le modèle a répondu en texte → on récupère le JSON s'il y en a un.
  const txt = (out.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('\n');
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Pas de réglage renvoyé : reformule la demande');
  JSON.parse(m[0]);
  return m[0];
}
function badCoach_(key, p) {
  quota_();
  const stats = String(p.t || '').slice(0, 1500), ctx = String(p.ctx || '').slice(0, 600);
  const system = 'Tu es le coach virtuel d\'un élève de lycée en badminton (EPS), en France. On te donne ses statistiques de matchs (anonymes) et l\'objectif de la leçon. ' +
    'Réponds en tutoyant l\'élève, avec des mots simples, en 3 courtes lignes commençant par : « ✅ », « 🎯 » et « 🏸 » : ce qui marche déjà (appuyé sur un chiffre), LA priorité à travailler, puis un conseil concret pour le prochain match ou exercice, en lien avec l\'objectif de la leçon. ' +
    '450 caractères au maximum. N\'invente aucun chiffre. Si les données sont trop peu nombreuses (moins de 5 points), encourage-le à jouer d\'abord un match. Pas de nom, pas de jugement sur la personne. Vocabulaire : « leçon », jamais « séance ».';
  return claude_(key, system + ' Réponds uniquement par les 3 lignes.', (ctx ? 'Leçon : ' + ctx + '\n' : '') + 'Statistiques : ' + stats);
}
/* badind : indicateurs de performance pour un temps de leçon. L'appli envoie la leçon, le temps, la situation reliée (p.t)
 * et la liste des indicateurs qu'elle sait calculer ou faire compter (p.ctx, « id=libellé ; … »). Aucune donnée d'élève. */
const BAD_IND_SCHEMA = { type: 'object', properties: {
  choix: { type: 'array', description: '2 à 4 indicateurs de la liste fournie, les plus pertinents pour cet exercice', items: { type: 'object', properties: { id: { type: 'string' }, pourquoi: { type: 'string' } }, required: ['id', 'pourquoi'] } },
  nouveaux: { type: 'array', description: '0 à 2 indicateurs nouveaux, absents de la liste', items: { type: 'object', properties: {
    nom: { type: 'string' }, type: { type: 'string', enum: ['compte', 'obs'] }, crit: { type: 'string' }, pourquoi: { type: 'string' } }, required: ['nom', 'type', 'pourquoi'] } } },
  required: ['choix'] };
function badIndic_(key, p) {
  quota_();
  const texte = String(p.t || '').slice(0, 1500), lib = String(p.ctx || '').slice(0, 900);
  if (!texte.trim()) throw new Error('Temps de leçon vide');
  const system = 'Tu aides un enseignant d\'EPS de lycée (badminton, champ d\'apprentissage 4) à choisir des indicateurs de performance pour un temps de sa leçon. ' +
    'Un indicateur sert de critère de réussite et d\'outil d\'observation pour les élèves, saisi sur une tablette par un élève observateur. ' +
    'Trois sortes : les indicateurs de la liste fournie (calculés par l\'appli à partir des points saisis, ou comptés par l\'observateur) ; ' +
    'des indicateurs nouveaux « compte » (un observateur appuie sur +1 pour un joueur à chaque fois qu\'il voit l\'action : elle doit être simple, visible et sans ambiguïté) ; ' +
    'des indicateurs nouveaux « obs » (une question d\'observation qualitative pour le coach, réponse oui / non). ' +
    'Choisis ce qui mesure le mieux l\'objectif du temps et la règle de la situation reliée, pas des généralités. Si la situation est un exercice (réussis / essais), garde l\'indicateur exo et complète par des observables. ' +
    'Sans situation reliée, ne propose aucun indicateur calculé (zones, coups, fautes) : seulement des comptages ou des observables. Ne propose pas un indicateur déjà retenu. ' +
    'crit = critère de réussite chiffré et atteignable par des lycéens, commençant par « Au moins » ou « Moins de » (vide pour « obs »). pourquoi = 15 mots au plus. ' +
    'Vocabulaire : « leçon », « séquence », critère de réussite = ce qu\'il faut atteindre pour réussir. Français, phrases courtes.';
  const out = claudeRaw_(key, { model: CLAUDE_MODEL_SIT, max_tokens: 900, system: system,
      tools: [{ name: 'proposer_indicateurs', description: 'Indicateurs de performance proposés pour ce temps de leçon', input_schema: BAD_IND_SCHEMA }],
      tool_choice: { type: 'auto' },
      messages: [{ role: 'user', content: 'Indicateurs disponibles dans l\'appli : ' + lib + '\n\n' + texte + '\n\nRéponds uniquement en appelant l\'outil proposer_indicateurs.' }] });
  const t = (out.content || []).filter(function (c) { return c.type === 'tool_use'; })[0];
  if (t) return JSON.stringify(t.input);
  const txt = (out.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('\n');
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Pas de proposition renvoyée : réessaie');
  JSON.parse(m[0]);
  return m[0];
}
/** À lancer une fois depuis l'éditeur pour vérifier les propositions d'indicateurs (Badminton). */
function testerIndicateurs() {
  Logger.log(badIndic_(PropertiesService.getScriptProperties().getProperty('ANTHROPIC_KEY'), { t: 'Leçon 4 : Travail de latéralité. Objectif : exploiter la largeur.\nTemps : Matchs 3 couloirs\nConsigne : les points marqués dans les couloirs rapportent plus.\nSituation reliée : Latéralité : 3 couloirs (match à zones)', ctx: 'lat=points sur les côtés; ris=points directs ÷ fautes directes; rev=volants dans le revers adverse (compté)' }));
}
/** À lancer une fois depuis l'éditeur pour vérifier « Décris ta situation » (Badminton). */
function testerBadminton() {
  Logger.log(badSituation_(PropertiesService.getScriptProperties().getProperty('ANTHROPIC_KEY'), { t: 'match en 11 points, le fond rapporte 3 points, le milieu est interdit' }));
}

/* ================= Bilans en ligne (page « Mon bilan ») =================
 * Chaque fiche PDF est chiffrée sur la tablette avec le code personnel de l'élève (6 caractères) : le script ne stocke que des données illisibles.
 * Feuille « Bilans » : A = identifiant (empreinte du code | appli), B = n° de morceau, C = données chiffrées, D = date.
 * POST {key, bil:{put:[{id, parts:[…]}], del:[id]}} (enseignant, clé du partage) ; GET ?bil=<empreinte> (élève, sans clé) → morceaux de ses bilans. */
const BIL_SHEET = 'Bilans';
function bilSheet_() { const ss = SpreadsheetApp.getActiveSpreadsheet(); return ss.getSheetByName(BIL_SHEET) || ss.insertSheet(BIL_SHEET); }
function bilansPut_(b) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = bilSheet_(), last = sh.getLastRow(), now = new Date();
    const ids = {}; (b.put || []).forEach(function (x) { ids[String(x.id)] = 1; }); (b.del || []).forEach(function (id) { ids[String(id)] = 1; });
    if (last) { const A = sh.getRange(1, 1, last, 1).getValues(); for (let r = last; r >= 1; r--) if (ids[String(A[r - 1][0])]) sh.deleteRow(r); }
    const rows = []; (b.put || []).forEach(function (x) { (x.parts || []).forEach(function (d, i) { rows.push([String(x.id).slice(0, 80), i, String(d), now]); }); });
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
    return { n: (b.put || []).length };
  } finally { lock.releaseLock(); }
}
function bilansGet_(h) {
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(h)) return [];
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BIL_SHEET); if (!sh || !sh.getLastRow()) return [];
  const V = sh.getRange(1, 1, sh.getLastRow(), 4).getValues(), out = {};
  V.forEach(function (r) { const id = String(r[0]); if (id.indexOf(h + '|') !== 0) return; (out[id] = out[id] || { id: id, parts: [], t: r[3] }).parts[Number(r[1])] = String(r[2]); });
  return Object.keys(out).map(function (k) { return out[k]; });
}

/* ================= Sauvegarde hebdomadaire sur Drive =================
 * Une fois : sélectionne « installerSauvegarde » en haut puis ▶ Exécuter (et accepte l'autorisation Drive).
 * Chaque dimanche soir, une copie complète du tableur (données chiffrées de toutes les tablettes, bilans, appel AS…)
 * est rangée dans le dossier Drive « Sauvegardes EPS » ; les 10 plus récentes sont gardées. Restaurer : ouvrir la copie,
 * Fichier > Créer une copie, puis remplacer l'adresse du tableur… ou plus simple, recopier l'onglet « Sync » dans le tableur actuel. */
const BACKUP_FOLDER = 'Sauvegardes EPS', BACKUP_KEEP = 10;
function installerSauvegarde() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'sauvegardeHebdo') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sauvegardeHebdo').timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(20).create();
  sauvegardeHebdo();
  Logger.log('Sauvegarde installée : chaque dimanche vers 20 h, dossier Drive « ' + BACKUP_FOLDER + ' ». Une première copie vient d\'être faite.');
}
function sauvegardeHebdo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), it = DriveApp.getFoldersByName(BACKUP_FOLDER);
  const dir = it.hasNext() ? it.next() : DriveApp.createFolder(BACKUP_FOLDER);
  const d = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  DriveApp.getFileById(ss.getId()).makeCopy('Sauvegarde EPS ' + d, dir);
  const L = []; const f = dir.getFiles(); while (f.hasNext()) { const x = f.next(); if (/^Sauvegarde EPS /.test(x.getName())) L.push(x); }
  L.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); }).slice(BACKUP_KEEP).forEach(function (x) { x.setTrashed(true); });
  PropertiesService.getScriptProperties().setProperty('LAST_BACKUP', String(Date.now()));
}

/* ===================== Cross-training : bibliothèque d'exercices et vidéos du Drive =====================
   Dossier Drive « Vidéo crosstraining » : un sous-dossier par exercice (Squat/N1.mp4, N2.mp4, N2-2.mp4, N3.mp4 ou Squat/N2/…).
   L'enseignant colle le lien du dossier dans l'appli (⚙ Réglages → Vidéos et fiches) : il est gardé ici (CT_DOSSIER).
   GET ?ct=biblio → fiches (bibliotheque.json du dossier) + liste des vidéos · GET ?ct=video&id=… → vidéo en base64 (hors ligne).
   POST {key, ct:{dossier}} règle le dossier et partage les vidéos par lien · POST {key, ct:{fiches}} publie les fiches. */
const CT_EXT = /\.(mp4|mov|m4v|webm|3gp)$/i;
function ctDossier_() { const id = PropertiesService.getScriptProperties().getProperty('CT_DOSSIER'); if (!id) throw new Error('Dossier des vidéos non réglé'); return DriveApp.getFolderById(id); }
function ctVideos_(dossier, prefixe) {
  const out = [], it = dossier.getFiles();
  while (it.hasNext()) { const x = it.next(); if (!CT_EXT.test(x.getName())) continue;
    let pa = 'inconnu'; try { pa = String(x.getSharingAccess()); } catch (err) {}
    out.push({ nom: prefixe + x.getName(), id: x.getId(), partage: pa }); }
  return out;
}
function ctGet_(p) {
  try {
    const racine = ctDossier_();
    if (p.ct === 'video') {
      const f = DriveApp.getFileById(String(p.id || ''));
      if (!ctDans_(f, racine.getId(), 3)) return { ok: false, erreur: 'Hors du dossier' };
      const b = f.getBlob();
      return { ok: true, type: b.getContentType() || 'video/mp4', b64: Utilities.base64Encode(b.getBytes()) };
    }
    const res = { ok: true, racine: racine.getName(), date: new Date().toISOString(), fiches: null, dossiers: [] };
    const fj = racine.getFilesByName('bibliotheque.json');
    if (fj.hasNext()) { try { res.fiches = JSON.parse(fj.next().getBlob().getDataAsString('UTF-8')); } catch (err) {} }
    const sous = racine.getFolders();
    while (sous.hasNext()) {
      const d = sous.next(); let f = ctVideos_(d, ''); const n = d.getFolders();
      while (n.hasNext()) { const x = n.next(); f = f.concat(ctVideos_(x, x.getName() + '/')); }
      res.dossiers.push({ nom: d.getName(), id: d.getId(), fichiers: f });
    }
    res.dossiers.sort(function (a, b) { return a.nom.localeCompare(b.nom); });
    return res;
  } catch (err) { return { ok: false, erreur: String(err && err.message || err) }; }
}
function ctDans_(item, rid, prof) {
  if (prof < 0) return false; const p = item.getParents();
  while (p.hasNext()) { const d = p.next(); if (d.getId() === rid || ctDans_(d, rid, prof - 1)) return true; }
  return false;
}
function ctPost_(c) {
  if (c.dossier) {
    const id = (String(c.dossier).match(/folders\/([\w-]+)/) || String(c.dossier).match(/id=([\w-]+)/) || [0, String(c.dossier).trim()])[1];
    DriveApp.getFolderById(id); PropertiesService.getScriptProperties().setProperty('CT_DOSSIER', id);
    return Object.assign({ ok: true }, ctPartager_());
  }
  if (c.partager) return Object.assign({ ok: true }, ctPartager_());
  if (c.fiches) {
    const r = ctDossier_(), t = JSON.stringify(c.fiches), f = r.getFilesByName('bibliotheque.json');
    if (f.hasNext()) f.next().setContent(t); else r.createFile('bibliotheque.json', t, MimeType.PLAIN_TEXT);
    return { ok: true };
  }
  return { ok: false, error: 'ct' };
}
/** Met toutes les vidéos du dossier en « Tous les utilisateurs disposant du lien · Lecteur » (lecture par les élèves). */
function ctPartager_() {
  let n = 0, refus = 0;
  (function tour(d) {
    const it = d.getFiles(); while (it.hasNext()) { const x = it.next(); if (!CT_EXT.test(x.getName())) continue;
      try { if (String(x.getSharingAccess()).indexOf('ANYONE') < 0) x.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); n++; } catch (err) { refus++; } }
    const s = d.getFolders(); while (s.hasNext()) tour(s.next());
  })(ctDossier_());
  return { partagees: n, refus: refus };
}

/* ===================== Auto-positionnements des élèves (boîte de dépôt) =====================
 * Reprend le script de Danse : le lien personnel de la fiche d'un élève contient un identifiant de dépôt et une clé
 * de chiffrement calculés à partir de SECRET (jamais dans le lien). Le téléphone dépose son positionnement CHIFFRÉ
 * dans l'onglet « Depot » ; les tablettes réglées avec la clé le relèvent (?drops=1&since=…). */
const DROP_SHEET = 'Depot';
const DROP_MAX = 5000;
function dropSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(DROP_SHEET);
  if (!sh) {
    sh = ss.insertSheet(DROP_SHEET);
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
    const sh = dropSheet_();
    const props = PropertiesService.getScriptProperties();
    const seq = Number(props.getProperty('drop_seq') || 0) + 1;
    const last = sh.getLastRow();
    const keys = last > 1 ? sh.getRange(2, 2, last - 1, 1).getValues().map(r => String(r[0])) : [];
    const i = keys.indexOf(k);
    const row = [seq, k, new Date(), x];
    if (i >= 0) sh.getRange(i + 2, 1, 1, 4).setValues([row]);
    else if (keys.length >= DROP_MAX) return { ok: false, error: 'plein' };
    else sh.getRange(last + 1, 1, 1, 4).setValues([row]);
    props.setProperty('drop_seq', String(seq));
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function dropCheck_(k) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DROP_SHEET);
  if (!sh || sh.getLastRow() < 2) return '';
  const rows = sh.getRange(2, 2, sh.getLastRow() - 1, 3).getValues();
  for (let i = 0; i < rows.length; i++) if (String(rows[i][0]) === k) return String(rows[i][2]).slice(0, 16);
  return '';
}

/** Dépôts reçus depuis « since », par paquets de 300. */
function dropPull_(p) {
  const since = Number(p.since || 0);
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(DROP_SHEET);
  if (!sh || sh.getLastRow() < 2) return { drops: [], more: false };
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
    .filter(r => Number(r[0]) > since).sort((a, b) => Number(a[0]) - Number(b[0]));
  return { drops: rows.slice(0, 300).map(r => [Number(r[0]), String(r[1]), 0, String(r[3])]), more: rows.length > 300 };
}

/** Fin de cycle : supprime tous les dépôts (la numérotation continue, les tablettes ne relisent rien). */
function purge_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = dropSheet_();
    const n = sh.getLastRow() - 1;
    if (n > 0) sh.deleteRows(2, n);
    return { ok: true, purged: Math.max(0, n) };
  } finally {
    lock.releaseLock();
  }
}

