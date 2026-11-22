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
 *  - Seances      : les leçons publiées (parcours + carte, découpés en morceaux)
 *  - Evenements   : tout ce qu'envoient les téléphones (positions, balises, départ, arrivée, alertes)
 *  - Decisions    : balises validées / refusées par l'enseignant
 *  - Messages     : messages de l'enseignant aux élèves
 *  - Lecons       : leçons en cours (les élèves les voient dans l'appli sans scanner de QR)
 *  - Classes      : tes listes d'élèves (elles ne sont jamais publiées sur GitHub)
 *  - CO_Eval      : appli « CO – préparation à l'évaluation » : paramètres, listes et carte (mis à jour en direct chez les élèves), évaluations sauvegardées (arch, carte_…)
 *  - CO_Resultats : appli « CO – préparation à l'évaluation » : résultats envoyés par les élèves
 *  - CO_Etat      : appli « CO éval » : progression de chaque élève (sauvegarde, binôme, suivi en direct)
 *  - CO_Log       : appli « CO éval » : erreurs techniques signalées par les téléphones
 * Seuls le nom saisi par l'élève, sa classe et ses positions pendant la course sont enregistrés, dans ton propre Google Drive.
 * Pour faire de la place : supprime les lignes des anciennes leçons dans l'onglet Evenements (ou utilise l'action « purge » depuis l'éditeur : fonction purgerAnciennesSeances).
 */
const MOT_DE_PASSE_PROF = 'change-moi';
const TAILLE_MORCEAU = 45000; // une cellule accepte 50 000 caractères maximum
const DUREE_CACHE = 21600;    // 6 h

const T_SEANCES = { nom: 'Seances', cols: ['seance', 'date', 'morceau', 'donnees'] };
const T_EVTS = { nom: 'Evenements', cols: ['recu', 'seance', 'coureur', 'nom', 'classe', 'parcours', 'type', 'heure', 'balise', 'latitude', 'longitude', 'precision', 'donnees'] };
const T_DEC = { nom: 'Decisions', cols: ['seance', 'coureur', 'evenement', 'valide', 'date'] };
const T_MSG = { nom: 'Messages', cols: ['seance', 'destinataire', 'id', 'texte', 'date'] };
const T_LECONS = { nom: 'Lecons', cols: ['lecon', 'nom', 'lancee', 'active'] };
const T_CLASSES = { nom: 'Classes', cols: ['classe', 'eleve'] };
const T_COE = { nom: 'CO_Eval', cols: ['cle', 'morceau', 'donnees'] };
const T_COER = { nom: 'CO_Resultats', cols: ['recu', 'eleve', 'nom', 'classe', 'enseignant', 'parcours', 'donnees'] };
const T_COES = { nom: 'CO_Etat', cols: ['eleve', 'maj', 'donnees'] };
const T_COEL = { nom: 'CO_Log', cols: ['date', 'eleve', 'message', 'appareil'] };

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
    if (!s || !r) throw new Error('Leçon ou élève manquant');
    if (!seanceExiste_(s)) throw new Error('Leçon inconnue : ' + s);
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

  // ----- élève : récupère la carte de la leçon -----
  if (a === 'getSession') {
    const s = code_(req.s), parts = lignes_(T_SEANCES).filter(x => String(x.v[0]) === s).sort((x, y) => x.v[2] - y.v[2]);
    if (!parts.length) throw new Error('Leçon inconnue');
    const data = JSON.parse(parts.map(x => x.v[3]).join(''));
    delete data.geo; // le calage n'est donné qu'après l'arrivée (sinon il révélerait la position des balises)
    return { ok: true, data: data };
  }

  // ----- élève : calage de la carte pour revoir son itinéraire, seulement une fois sa course terminée -----
  if (a === 'trace') {
    const s = code_(req.s), r = String(req.r || '').slice(0, 20), sh = feuille_(T_EVTS), last = sh.getLastRow();
    let fini = false;
    if (last > 1) { const v = sh.getRange(2, 2, last - 1, 6).getValues(); fini = v.some(x => String(x[0]) === s && String(x[1]) === r && (x[5] === 'finish' || x[5] === 'abandon')); }
    if (!fini) throw new Error("Termine d'abord ta course pour revoir ton itinéraire");
    const parts = lignes_(T_SEANCES).filter(x => String(x.v[0]) === s).sort((x, y) => x.v[2] - y.v[2]);
    if (!parts.length) throw new Error('Leçon inconnue');
    return { ok: true, geo: JSON.parse(parts.map(x => x.v[3]).join('')).geo || [] };
  }

  // ----- appli CO – préparation à l'évaluation : les élèves récupèrent les paramètres et la carte en direct -----
  if (a === 'coeGet') {
    const props = PropertiesService.getScriptProperties(), vc = props.getProperty('coe_v_conf') || '', vm = props.getProperty('coe_v_carte') || '';
    const out = { ok: true, vc: vc, vm: vm };
    if (vc && String(req.vc || '') !== vc) out.conf = coeLire_('conf');
    if (vm && req.carte && String(req.vm || '') !== vm) out.carte = coeLire_('carte');
    if (Array.isArray(req.ids) && req.ids.length) out.states = coeEtats_(req.ids.slice(0, 4).map(String));
    return out;
  }
  if (a === 'coeState') {
    const id = String(req.eleve || '').slice(0, 100), d = JSON.stringify(req.data || {});
    if (!id) throw new Error('Élève manquant'); if (d.length > 45000) throw new Error('État trop gros');
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      const sh = feuille_(T_COES), row = coeLigne_(id), t = Date.now();
      if (row) sh.getRange(row, 1, 1, 3).setValues([[id, t, d]]); else { sh.appendRow([id, t, d]); CacheService.getScriptCache().put('coes_' + id, String(sh.getLastRow()), DUREE_CACHE); }
      return { ok: true, t: t };
    } finally { lock.releaseLock(); }
  }
  if (a === 'coeLog') {
    const sh = feuille_(T_COEL); if (sh.getLastRow() > 3000) return { ok: true };
    sh.appendRow([new Date(), String(req.eleve || '').slice(0, 100), String(req.m || '').slice(0, 1500), String(req.ua || '').slice(0, 300)]);
    return { ok: true };
  }
  if (a === 'coeResult') {
    const d = JSON.stringify(req.data || {}); if (d.length > 45000) throw new Error('Résultat trop gros');
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try { feuille_(T_COER).appendRow([Date.now(), String(req.eleve || '').slice(0, 60), String(req.nom || '').slice(0, 80), String(req.classe || '').slice(0, 30), String(req.prof || '').slice(0, 60), Number(req.k) || 0, d]); }
    finally { lock.releaseLock(); }
    return { ok: true };
  }

  if (a === 'coeHors') { // élèves « hors liste » (nom écrit à la main) connectés depuis moins de 12 h : pour la recherche de binôme
    const c = CacheService.getScriptCache(), h = c.get('coe_hl'); if (h) return { ok: true, list: JSON.parse(h) };
    const sh = feuille_(T_COES), n = sh.getLastRow() - 1, lim = Date.now() - 12 * 3600000, out = [];
    if (n > 0) sh.getRange(2, 1, n, 3).getValues().forEach(v => { if (Number(v[1]) < lim) return; try { const me = (JSON.parse(v[2] || '{}').me) || {}; if (me.hl && me.prenom) out.push([String(me.prenom), String(me.nom || ''), String(me.classe || ''), String(me.prof || '')]); } catch (e) {} });
    c.put('coe_hl', JSON.stringify(out), 30); return { ok: true, list: out };
  }
  if (a === 'coeMap') { // cartes de l'évaluation (une par parcours, envoyées par OrienRun) : lues par les téléphones des élèves
    const cle = String(req.cle || ''); if (!/^carte_m[0-9]{1,2}$/.test(cle)) throw new Error('Carte inconnue');
    return { ok: true, data: coeLire_(cle), v: PropertiesService.getScriptProperties().getProperty('coe_v_' + cle) || '' };
  }

  // ----- enseignant -----
  if (!estProf) throw new Error('Mot de passe enseignant incorrect');

  if (a === 'coeSave') {
    // conf, carte, arch (liste des évaluations sauvegardées), carte_<id> (carte d'une évaluation sauvegardée)
    const c0 = String(req.cle || ''), cle = /^(conf|carte|arch|carte_[A-Za-z0-9]{1,24})$/.test(c0) ? c0 : 'conf', txt = String(req.data || '');
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      const sh = feuille_(T_COE);
      lignes_(T_COE).filter(x => String(x.v[0]) === cle).reverse().forEach(x => sh.deleteRow(x.i));
      const rows = []; for (let i = 0, k = 0; i < txt.length; i += TAILLE_MORCEAU, k++) rows.push([cle, k, txt.slice(i, i + TAILLE_MORCEAU)]);
      if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 3).setValues(rows);
      const v = String(Date.now()); PropertiesService.getScriptProperties().setProperty('coe_v_' + cle, v);
      if (cle === 'conf' && txt.length < 95000) CacheService.getScriptCache().put('coe_conf_' + v, txt, DUREE_CACHE);
      return { ok: true, v: v };
    } finally { lock.releaseLock(); }
  }
  if (a === 'coeLoad') { // évaluations sauvegardées (enseignant)
    const cle = String(req.cle || ''); if (!/^(arch|carte_[A-Za-z0-9]{1,24})$/.test(cle)) throw new Error('Clé inconnue');
    return { ok: true, data: coeLire_(cle) };
  }
  if (a === 'coeAllStates') {
    const sh = feuille_(T_COES), n = sh.getLastRow() - 1, since = Number(req.since) || 0, out = [];
    if (n > 0) { const maj = sh.getRange(2, 2, n, 1).getValues(); maj.forEach((m, i) => { if (Number(m[0]) > since) { const v = sh.getRange(i + 2, 1, 1, 3).getValues()[0]; try { out.push({ eleve: String(v[0]), t: Number(v[1]), d: JSON.parse(v[2] || '{}') }); } catch (e) {} } }); }
    return { ok: true, states: out, now: Date.now() };
  }
  if (a === 'coeResults') {
    const sh = feuille_(T_COER), last = sh.getLastRow(); let since = Math.max(1, Number(req.since) || 1); if (since > last) since = 1;
    const out = [];
    if (last > since) sh.getRange(since + 1, 1, last - since, 7).getValues().forEach(v => out.push({ t: Number(v[0]), eleve: String(v[1]), k: Number(v[5]), d: JSON.parse(v[6] || '{}') }));
    return { ok: true, rows: out, since: Math.max(since, last) };
  }

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

  if (a === 'saveClasses') {
    const C = req.classes || {}, rows = [];
    Object.keys(C).forEach(c => (C[c] || []).forEach(n => rows.push([String(c).slice(0, 30), String(n).slice(0, 80)])));
    const sh = feuille_(T_CLASSES), n = sh.getLastRow(); if (n > 1) sh.deleteRows(2, n - 1);
    if (rows.length) sh.getRange(2, 1, rows.length, 2).setValues(rows);
    return { ok: true, n: rows.length };
  }
  if (a === 'loadClasses') {
    const C = {}; lignes_(T_CLASSES).forEach(x => { const c = String(x.v[0]); if (c) (C[c] = C[c] || []).push(String(x.v[1])); });
    return { ok: true, classes: C };
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

function coeLire_(cle) {
  const v = PropertiesService.getScriptProperties().getProperty('coe_v_' + cle) || '';
  if (cle === 'conf') { const c = CacheService.getScriptCache().get('coe_conf_' + v); if (c) return c; }
  const txt = lignes_(T_COE).filter(x => String(x.v[0]) === cle).sort((x, y) => x.v[1] - y.v[1]).map(x => x.v[2]).join('');
  if (cle === 'conf' && txt.length < 95000) CacheService.getScriptCache().put('coe_conf_' + v, txt, DUREE_CACHE);
  return txt;
}
// ligne de l'élève dans CO_Etat (mémorisée dans le cache, vérifiée)
function coeLigne_(id) {
  const sh = feuille_(T_COES), c = CacheService.getScriptCache(), k = 'coes_' + id, r = Number(c.get(k)) || 0;
  if (r > 1 && r <= sh.getLastRow() && String(sh.getRange(r, 1).getValue()) === id) return r;
  const n = sh.getLastRow() - 1; if (n < 1) return 0;
  const ids = sh.getRange(2, 1, n, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) { c.put(k, String(i + 2), DUREE_CACHE); return i + 2; }
  return 0;
}
function coeEtats_(ids) {
  const sh = feuille_(T_COES), out = [];
  ids.forEach(id => { const r = coeLigne_(id); if (!r) return; const v = sh.getRange(r, 1, 1, 3).getValues()[0]; try { out.push({ eleve: id, t: Number(v[1]), d: JSON.parse(v[2] || '{}') }); } catch (e) {} });
  return out;
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
