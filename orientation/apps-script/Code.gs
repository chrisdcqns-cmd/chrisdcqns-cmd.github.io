/**
 * OrienRun EPS — serveur du suivi en direct (positions, balises, alertes, validations)
 * À coller dans Google Apps Script (Extensions > Apps Script depuis une Google Sheet vide).
 *
 * 1. Remplace MOT_DE_PASSE_PROF ci-dessous par ton mot de passe enseignant.
 * 2. Déployer > Nouveau déploiement > Application Web
 *      Exécuter en tant que : Moi
 *      Qui a accès : Tout le monde
 * 3. Copie l'URL qui se termine par /exec et colle-la dans l'appli (Espace enseignant > Réglages).
 *    Après une modification de ce fichier : Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version.
 *
 * Onglets créés automatiquement :
 *  - Seances      : les séances publiées (parcours + carte, découpés en morceaux)
 *  - Evenements   : tout ce qu'envoient les téléphones (positions, balises, départ, arrivée, alertes)
 *  - Decisions    : balises validées / refusées par l'enseignant
 *  - Messages     : messages de l'enseignant aux élèves
 *  - Lecons       : leçons en cours (les élèves les voient dans l'appli sans scanner de QR)
 * Seuls le nom saisi par l'élève, sa classe et ses positions pendant la course sont enregistrés, dans ton propre Google Drive.
 * Pour faire de la place : supprime les lignes des anciennes séances dans l'onglet Evenements (ou utilise l'action « purge » depuis l'éditeur : fonction purgerAnciennesSeances).
 */
const MOT_DE_PASSE_PROF = 'change-moi';
const TAILLE_MORCEAU = 45000; // une cellule accepte 50 000 caractères maximum
const DUREE_CACHE = 21600;    // 6 h

const T_SEANCES = { nom: 'Seances', cols: ['seance', 'date', 'morceau', 'donnees'] };
const T_EVTS = { nom: 'Evenements', cols: ['recu', 'seance', 'coureur', 'nom', 'classe', 'parcours', 'type', 'heure', 'balise', 'latitude', 'longitude', 'precision', 'donnees'] };
const T_DEC = { nom: 'Decisions', cols: ['seance', 'coureur', 'evenement', 'valide', 'date'] };
const T_MSG = { nom: 'Messages', cols: ['seance', 'destinataire', 'id', 'texte', 'date'] };
const T_LECONS = { nom: 'Lecons', cols: ['lecon', 'nom', 'lancee', 'active'] };

function doGet() { return json_({ ok: true, app: 'orienrun' }); }

function doPost(e) {
  let reponse;
  try { reponse = traiter_(JSON.parse(e.postData.contents)); }
  catch (err) { reponse = { ok: false, error: String(err && err.message || err) }; }
  return json_(reponse);
}

function traiter_(req) {
  const a = req.action;
  if (a === 'ping') return { ok: true };
  const estProf = String(req.teacher || '') === MOT_DE_PASSE_PROF && MOT_DE_PASSE_PROF !== 'change-moi';

  if (a === 'teacherCheck') {
    if (MOT_DE_PASSE_PROF === 'change-moi') throw new Error('Change le mot de passe (ligne MOT_DE_PASSE_PROF) dans le script, puis redéploie une nouvelle version.');
    if (!estProf) throw new Error('Mot de passe enseignant incorrect');
    return { ok: true };
  }

  // ----- élève : envoi des positions / balises / alertes -----
  if (a === 'push') {
    const s = code_(req.s), r = String(req.r || '').slice(0, 20);
    if (!s || !r) throw new Error('Séance ou élève manquant');
    if (!seanceExiste_(s)) throw new Error('Séance inconnue : ' + s);
    const ev = (req.ev || []).slice(0, 200);
    if (ev.length) {
      const now = Date.now(), nom = String(req.nom || '').slice(0, 80), cl = String(req.cl || '').slice(0, 30), c = String(req.c || '').slice(0, 10);
      const rows = ev.map(x => {
        const d = { id: String(x.id || '').slice(0, 40) };
        ['ok', 'via', 'txt', 'ac', 'mid', 'bat'].forEach(k => { if (x[k] !== undefined) d[k] = x[k]; });
        if (x.sel) d.sel = x.sel;
        return [now, s, r, nom, cl, c, String(x.k || '').slice(0, 10), Number(x.t) || now, x.n == null ? '' : x.n, x.la == null ? '' : x.la, x.lo == null ? '' : x.lo, x.ac == null ? '' : x.ac, JSON.stringify(d)];
      });
      const lock = LockService.getScriptLock(); lock.waitLock(20000);
      try { const sh = feuille_(T_EVTS); sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows); }
      finally { lock.releaseLock(); }
    }
    const cache = CacheService.getScriptCache();
    const dec = JSON.parse(cache.get('d_' + s + '_' + r) || '{}');
    const msgs = JSON.parse(cache.get('m_' + s) || '[]').filter(m => m.to === '*' || m.to === r);
    return { ok: true, dec: dec, msgs: msgs };
  }

  // ----- élève : liste des leçons en cours (pour rejoindre sans QR code) -----
  if (a === 'lessons') {
    const limite = Date.now() - 12 * 3600 * 1000;
    const L = lignes_(T_LECONS).filter(x => x.v[3] === true || x.v[3] === 'TRUE').map(x => ({ s: String(x.v[0]), nom: String(x.v[1]), t: Number(x.v[2]) })).filter(x => x.t > limite).sort((x, y) => y.t - x.t);
    return { ok: true, lessons: L };
  }

  // ----- élève : récupère la carte de la séance -----
  if (a === 'getSession') {
    const s = code_(req.s), parts = lignes_(T_SEANCES).filter(x => String(x.v[0]) === s).sort((x, y) => x.v[2] - y.v[2]);
    if (!parts.length) throw new Error('Séance inconnue');
    return { ok: true, data: JSON.parse(parts.map(x => x.v[3]).join('')) };
  }

  // ----- enseignant -----
  if (!estProf) throw new Error('Mot de passe enseignant incorrect');

  if (a === 'publish') {
    const s = code_(req.s), txt = JSON.stringify(req.data || {});
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      const sh = feuille_(T_SEANCES);
      lignes_(T_SEANCES).filter(x => String(x.v[0]) === s).reverse().forEach(x => sh.deleteRow(x.i));
      const rows = []; for (let i = 0, k = 0; i < txt.length; i += TAILLE_MORCEAU, k++) rows.push([s, new Date(), k, txt.slice(i, i + TAILLE_MORCEAU)]);
      if (!rows.length) rows.push([s, new Date(), 0, '{}']);
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
    } finally { lock.releaseLock(); }
    CacheService.getScriptCache().put('s_' + s, '1', DUREE_CACHE);
    const nom = String((req.data && req.data.nom) || s).slice(0, 80), sl = feuille_(T_LECONS), ex = lignes_(T_LECONS).find(x => String(x.v[0]) === s);
    if (ex) sl.getRange(ex.i, 1, 1, 4).setValues([[s, nom, Number(ex.v[2]) || Date.now(), true]]); else sl.appendRow([s, nom, Date.now(), true]);
    return { ok: true };
  }

  if (a === 'close') {
    const s = code_(req.s), ex = lignes_(T_LECONS).find(x => String(x.v[0]) === s);
    if (ex) feuille_(T_LECONS).getRange(ex.i, 4).setValue(false);
    return { ok: true };
  }

  if (a === 'poll') {
    const s = code_(req.s), sh = feuille_(T_EVTS), last = sh.getLastRow();
    let since = Math.max(1, Number(req.since) || 1); // numéro de la dernière ligne déjà lue
    if (since > last) since = 1; // la feuille a été vidée : on relit tout
    const out = [];
    if (last > since) {
      const n = Math.min(last - since, 5000);
      const vals = sh.getRange(since + 1, 1, n, T_EVTS.cols.length).getValues();
      vals.forEach(v => {
        if (String(v[1]) !== s) return;
        const d = JSON.parse(v[12] || '{}');
        if (v[8] !== '') d.n = Number(v[8]); if (v[9] !== '') d.la = Number(v[9]); if (v[10] !== '') d.lo = Number(v[10]); if (v[11] !== '') d.ac = Number(v[11]);
        out.push({ rt: Number(v[0]), r: String(v[2]), nom: String(v[3]), cl: String(v[4]), c: String(v[5]), k: String(v[6]), t: Number(v[7]), sel: d.sel || null, d: d });
      });
      since += n;
    }
    return { ok: true, rows: out, since: since };
  }

  if (a === 'decide') {
    const s = code_(req.s), r = String(req.r || ''), id = String(req.id || '');
    feuille_(T_DEC).appendRow([s, r, id, !!req.ok, new Date()]);
    const cache = CacheService.getScriptCache(), key = 'd_' + s + '_' + r;
    const dec = JSON.parse(cache.get(key) || '{}');
    if (!Object.keys(dec).length) lignes_(T_DEC).forEach(x => { if (String(x.v[0]) === s && String(x.v[1]) === r) dec[String(x.v[2])] = x.v[3] === true || x.v[3] === 'TRUE'; });
    dec[id] = !!req.ok; cache.put(key, JSON.stringify(dec), DUREE_CACHE);
    return { ok: true };
  }

  if (a === 'msg') {
    const s = code_(req.s), m = { id: String(req.id || Utilities.getUuid()).slice(0, 20), to: String(req.to || '*'), txt: String(req.txt || '').slice(0, 300), t: Date.now(), type: req.type === 'recall' ? 'recall' : 'msg' };
    feuille_(T_MSG).appendRow([s, m.to, m.id, m.txt, new Date()]);
    const cache = CacheService.getScriptCache(), list = JSON.parse(cache.get('m_' + s) || '[]');
    list.push(m); cache.put('m_' + s, JSON.stringify(list.slice(-30)), DUREE_CACHE);
    return { ok: true };
  }

  throw new Error('Action inconnue : ' + a);
}

function seanceExiste_(s) {
  const cache = CacheService.getScriptCache();
  if (cache.get('s_' + s)) return true;
  const ok = lignes_(T_SEANCES).some(x => String(x.v[0]) === s);
  if (ok) cache.put('s_' + s, '1', DUREE_CACHE);
  return ok;
}
function code_(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); }
function feuille_(t) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(t.nom);
  if (!sh) { sh = ss.insertSheet(t.nom); sh.getRange(1, 1, 1, t.cols.length).setValues([t.cols]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function lignes_(t) {
  const sh = feuille_(t), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, t.cols.length).getValues().map((v, i) => ({ i: i + 2, v: v }));
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** À lancer à la main depuis l'éditeur pour supprimer les événements de plus de 30 jours. */
function purgerAnciennesSeances() {
  const sh = feuille_(T_EVTS), last = sh.getLastRow(); if (last < 2) return;
  const limite = Date.now() - 30 * 24 * 3600 * 1000, vals = sh.getRange(2, 1, last - 1, 1).getValues();
  let n = 0; while (n < vals.length && Number(vals[n][0]) < limite) n++;
  if (n) sh.deleteRows(2, n);
}
