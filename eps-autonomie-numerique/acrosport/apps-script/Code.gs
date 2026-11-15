/**
 * Acrosport EPS — sauvegarde en ligne des groupes et des observations
 * À coller dans Google Apps Script (Extensions > Apps Script depuis une Google Sheet).
 *
 * 1. Remplace MOT_DE_PASSE_PROF ci-dessous par ton mot de passe enseignant.
 * 2. Déployer > Nouveau déploiement > Application Web
 *      Exécuter en tant que : Moi
 *      Qui a accès : Tout le monde
 * 3. Copie l'URL qui se termine par /exec et colle-la dans l'appli (Espace enseignant > En ligne).
 *    Après une modification de ce fichier : Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version.
 *
 * Les mots de passe ne sont jamais enregistrés en clair : seule une empreinte (SHA-256 + sel) est gardée.
 * Onglet « Groupes » : un groupe par ligne. Onglet « Observations » : qui a observé qui, quand, avec quel résultat.
 * Onglet « Eleves » : listes d'élèves importées depuis l'appli (Espace enseignant). Onglet « Classes » : code de classe facultatif.
 */
const MOT_DE_PASSE_PROF = 'change-moi';
const TAILLE_MORCEAU = 45000; // une cellule Google Sheets accepte 50 000 caractères maximum

const T_GROUPES = { nom: 'Groupes', cols: ['cle', 'classe', 'nom', 'membres', 'empreinte', 'sel', 'mise_a_jour', 'nb_seances'] };
const T_ELEVES = { nom: 'Eleves', cols: ['classe_eps', 'nom', 'prenom', 'classe'] };
const T_CLASSES = { nom: 'Classes', cols: ['classe', 'code', 'pyramides'] };
const T_OBS = { nom: 'Observations', cols: ['id', 'date', 'classe', 'groupe_observateur', 'observateurs', 'groupe_observe', 'reussis', 'criteres_notes', 'erreurs_securite', 'detail_securite'] };

function doGet() {
  return json_({ ok: true, app: 'acrosport' });
}

function doPost(e) {
  let reponse;
  try {
    const req = JSON.parse(e.postData.contents);
    reponse = traiter_(req);
  } catch (err) {
    reponse = { ok: false, error: String(err && err.message || err) };
  }
  return json_(reponse);
}

function traiter_(req) {
  const a = req.action;
  if (a === 'ping') return { ok: true };

  const estProf = String(req.teacher || '') === MOT_DE_PASSE_PROF;

  // ---- classes : noms seulement (public) ----
  if (a === 'listClasses') {
    const codes = {}, pyr = {};
    lignes_(T_CLASSES).forEach(r => { codes[norm_(r.v[0])] = String(r.v[1] || ''); pyr[norm_(r.v[0])] = Number(r.v[2]) || 0; });
    const noms = {};
    lignes_(T_CLASSES).forEach(r => noms[norm_(r.v[0])] = r.v[0]);
    lignes_(T_ELEVES).forEach(r => { if (!noms[norm_(r.v[0])]) noms[norm_(r.v[0])] = r.v[0]; });
    return { ok: true, classes: Object.keys(noms).map(k => ({ nom: noms[k], protege: !!codes[k], pyramides: pyr[k] || 0 })) };
  }

  // ---- liste des élèves d'une classe (code de classe si défini) ----
  if (a === 'listStudents') {
    if (!estProf) verifierCode_(req.classe, req.code);
    const c = norm_(req.classe);
    return { ok: true, students: lignes_(T_ELEVES).filter(r => norm_(r.v[0]) === c).map(r => ({ nom: r.v[1], prenom: r.v[2], classe: r.v[3] })) };
  }

  // ---- lecture publique : liste des groupes d'une classe (sans données) ----
  if (a === 'listGroups') {
    if (!estProf) verifierCode_(req.classe, req.code);
    const c = norm_(req.classe);
    return { ok: true, groups: lignes_(T_GROUPES).filter(r => norm_(r.v[1]) === c).map(r => ({ nom: r.v[2], membres: r.v[3], maj: r.v[6], seances: r.v[7] })) };
  }

  // ---- lecture publique : chorégraphie d'un groupe (pour l'observer) ----
  if (a === 'getRoutine') {
    if (!estProf) verifierCode_(req.classe, req.code);
    const l = trouverGroupe_(cle_(req.classe, req.nom));
    if (!l) throw new Error('Groupe introuvable');
    const d = lireDonnees_(T_GROUPES, l.row) || {};
    const cur = d.current || {};
    return { ok: true, routine: { nom: l.nom, classe: l.classe, members: d.members || [], slots: cur.slots || [], mats: (cur.mats || []).map(m => ({ text: m.text || '' })), dojo: cur.dojo || null, editedAt: d.editedAt || '' } };
  }

  if (a === 'create') {
    if (!estProf) verifierCode_(req.classe, req.code);
    return verrou_(function () {
      const cle = cle_(req.classe, req.nom);
      if (!req.password || String(req.password).length < 4) throw new Error('Mot de passe trop court (4 caractères minimum)');
      if (trouverGroupe_(cle)) throw new Error('Ce nom de groupe existe déjà dans cette classe');
      const sel = Utilities.getUuid();
      const empreinte = hash_(req.password, sel);
      const data = req.data || {};
      data.rev = 1;
      ecrireGroupe_(null, cle, req.classe, req.nom, data, empreinte, sel);
      return { ok: true, rev: 1, token: jeton_(cle, empreinte) };
    });
  }

  if (a === 'load' || a === 'save' || a === 'saveObservation' || a === 'myObservations') {
    const prof = String(req.teacher || '') === MOT_DE_PASSE_PROF;
    const cle = cle_(req.classe, req.nom);
    const ligne = trouverGroupe_(cle);
    if (!ligne) throw new Error('Groupe introuvable');
    const parJeton = req.token && req.token === jeton_(ligne.cle, ligne.empreinte);
    if (!prof && !parJeton && hash_(req.password, ligne.sel) !== ligne.empreinte) throw new Error('Mot de passe incorrect');
    if (a === 'load') return { ok: true, data: lireDonnees_(T_GROUPES, ligne.row), token: jeton_(ligne.cle, ligne.empreinte) };
    if (a === 'save') return verrou_(function () { return sauverAvecRevision_(ligne, req); });
    if (a === 'saveObservation') return verrou_(function () { ecrireObs_(req.obs, ligne); return { ok: true }; });
    if (a === 'myObservations') {
      const n = norm_(ligne.nom), c = norm_(ligne.classe);
      const liste = lignes_(T_OBS).filter(r => norm_(r.v[2]) === c && (norm_(r.v[3]) === n || norm_(r.v[5]) === n));
      return { ok: true, observations: liste.map(r => ({ resume: resumeObs_(r.v), data: lireDonnees_(T_OBS, r.row) })) };
    }
  }

  // ---- actions enseignant ----
  if (String(req.teacher || '') !== MOT_DE_PASSE_PROF) throw new Error('Mot de passe enseignant incorrect');

  if (a === 'teacherCheck') return { ok: true };
  if (a === 'teacherList') {
    return { ok: true, groups: lignes_(T_GROUPES).map(r => ({ key: r.v[0], classe: r.v[1], nom: r.v[2], membres: r.v[3], maj: r.v[6], seances: r.v[7] })) };
  }
  if (a === 'teacherSetStudents') {
    return verrou_(function () {
      const c = norm_(req.classe);
      if (!c) throw new Error('Nom de classe manquant');
      const f = feuille_(T_ELEVES);
      const garder = lignes_(T_ELEVES).filter(r => norm_(r.v[0]) !== c).map(r => r.v);
      const nouveaux = (req.students || []).map(e => [String(req.classe).trim(), String(e.nom || ''), String(e.prenom || ''), String(e.classe || '')]);
      const tout = garder.concat(nouveaux);
      const n = f.getLastRow() - 1;
      if (n > 0) f.getRange(2, 1, n, T_ELEVES.cols.length).clearContent();
      if (tout.length) f.getRange(2, 1, tout.length, T_ELEVES.cols.length).setValues(tout);
      const fc = feuille_(T_CLASSES);
      const lc = lignes_(T_CLASSES).find(r => norm_(r.v[0]) === c);
      const code = String(req.code || '').trim();
      if (lc) fc.getRange(lc.row, 1, 1, 2).setValues([[String(req.classe).trim(), code]]);
      else fc.getRange(fc.getLastRow() + 1, 1, 1, 2).setValues([[String(req.classe).trim(), code]]);
      return { ok: true, count: nouveaux.length };
    });
  }
  if (a === 'teacherSetLesson') {
    return verrou_(function () {
      const c = norm_(req.classe);
      if (!c) throw new Error('Nom de classe manquant');
      const n = Math.max(1, Math.min(12, Number(req.n) || 3));
      const fc = feuille_(T_CLASSES);
      fc.getRange(1, 3).setValue('pyramides');
      const lc = lignes_(T_CLASSES).find(r => norm_(r.v[0]) === c);
      if (lc) fc.getRange(lc.row, 3).setValue(n);
      else fc.getRange(fc.getLastRow() + 1, 1, 1, 3).setValues([[String(req.classe).trim(), '', n]]);
      return { ok: true, n: n };
    });
  }
  if (a === 'teacherObservations') {
    return { ok: true, observations: lignes_(T_OBS).map(r => resumeObs_(r.v)) };
  }
  if (a === 'teacherObservation') {
    const r = lignes_(T_OBS).find(x => x.v[0] === req.id);
    if (!r) throw new Error('Observation introuvable');
    return { ok: true, data: lireDonnees_(T_OBS, r.row) };
  }
  if (a === 'teacherDeleteObservation') {
    return verrou_(function () {
      const r = lignes_(T_OBS).find(x => x.v[0] === req.id);
      if (r) feuille_(T_OBS).deleteRow(r.row);
      return { ok: true };
    });
  }
  const ligne = trouverGroupe_(req.key);
  if (!ligne) throw new Error('Groupe introuvable');
  if (a === 'teacherLoad') return { ok: true, data: lireDonnees_(T_GROUPES, ligne.row) };
  if (a === 'teacherSave') return verrou_(function () { return sauverAvecRevision_(ligne, req); });
  if (a === 'teacherUpdateGroup') {
    return verrou_(function () {
      const classe = String(req.classe || ligne.classe).trim();
      const nom = String(req.nom || ligne.nom).trim();
      const nouvelleCle = cle_(classe, nom);
      if (nouvelleCle !== ligne.cle && trouverGroupe_(nouvelleCle)) throw new Error('Ce nom de groupe existe déjà dans cette classe');
      const d = lireDonnees_(T_GROUPES, ligne.row) || {};
      d.name = nom; d.classe = classe; d.rev = (Number(d.rev) || 0) + 1;
      if (Array.isArray(req.members) && req.members.length) d.members = req.members.map(String);
      ecrireGroupe_(ligne.row, nouvelleCle, classe, nom, d, ligne.empreinte, ligne.sel);
      return { ok: true, key: nouvelleCle };
    });
  }
  if (a === 'teacherSetPassword') {
    if (!req.password || String(req.password).length < 4) throw new Error('Mot de passe trop court (4 caractères minimum)');
    return verrou_(function () {
      const sel = Utilities.getUuid();
      feuille_(T_GROUPES).getRange(ligne.row, 5, 1, 2).setValues([[hash_(req.password, sel), sel]]);
      return { ok: true };
    });
  }
  if (a === 'teacherDelete') {
    return verrou_(function () { feuille_(T_GROUPES).deleteRow(ligne.row); return { ok: true }; });
  }
  throw new Error('Action inconnue');
}

// ---------- observations ----------
function ecrireObs_(obs, ligneGroupe) {
  if (!obs || !obs.id) throw new Error('Observation vide');
  const s = obs.summary || {};
  const tete = [obs.id, obs.date ? new Date(obs.date) : new Date(), ligneGroupe.classe, ligneGroupe.nom,
    (obs.observers || []).join(', '), obs.observed && obs.observed.nom || '',
    s.ok || 0, s.total || 0, (obs.safety || []).length,
    (obs.safety || []).map(e => e.type + (e.moment ? ' (' + e.moment + ')' : '')).join(' ; ')];
  const existante = lignes_(T_OBS).find(r => r.v[0] === obs.id);
  ecrireLigne_(T_OBS, existante ? existante.row : null, tete, obs);
}
function resumeObs_(v) {
  return { id: v[0], date: v[1], classe: v[2], observateur: v[3], observateurs: v[4], observe: v[5], reussis: v[6], total: v[7], securite: v[8], detailSecurite: v[9] };
}

// ---------- enregistrement sans écrasement ----------
// Chaque enregistrement porte le numéro de version (rev) sur lequel la tablette s'appuie.
// Si une autre tablette a enregistré entre-temps, on renvoie la version en ligne : l'appli fusionne puis renvoie.
function sauverAvecRevision_(ligne, req) {
  const actuel = lireDonnees_(T_GROUPES, ligne.row) || {};
  const revActuelle = Number(actuel.rev) || 0;
  if (req.baseRev !== undefined && req.baseRev !== null && Number(req.baseRev) !== revActuelle) {
    return { ok: false, conflict: true, error: 'Conflit de version', data: actuel };
  }
  const data = req.data || {};
  data.rev = revActuelle + 1;
  ecrireGroupe_(ligne.row, ligne.cle, ligne.classe, ligne.nom, data, ligne.empreinte, ligne.sel);
  return { ok: true, rev: data.rev };
}

// ---------- jeton de groupe (évite de garder le mot de passe sur la tablette) ----------
function secret_() {
  const p = PropertiesService.getScriptProperties();
  let s = p.getProperty('SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('SECRET', s); }
  return s;
}
function jeton_(cle, empreinte) {
  return hash_(cle + '|' + empreinte, secret_());
}

// ---------- code de classe ----------
function verifierCode_(classe, code) {
  const l = lignes_(T_CLASSES).find(r => norm_(r.v[0]) === norm_(classe));
  const attendu = l ? String(l.v[1] || '').trim() : '';
  if (attendu && norm_(code) !== norm_(attendu)) throw new Error('Code de classe incorrect');
}

// ---------- groupes ----------
function trouverGroupe_(cle) {
  const r = lignes_(T_GROUPES).find(x => x.v[0] === cle);
  return r ? { row: r.row, cle: r.v[0], classe: r.v[1], nom: r.v[2], empreinte: r.v[4], sel: r.v[5] } : null;
}
function ecrireGroupe_(row, cle, classe, nom, data, empreinte, sel) {
  const membres = (data && data.members || []).join(', ');
  const nb = (data && data.sessions || []).length;
  ecrireLigne_(T_GROUPES, row, [cle, classe, nom, membres, empreinte, sel, new Date(), nb], data);
}

// ---------- outils feuille ----------
function feuille_(t) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let f = ss.getSheetByName(t.nom);
  if (!f) {
    f = ss.insertSheet(t.nom);
    f.getRange(1, 1, 1, t.cols.length + 1).setValues([t.cols.concat(['donnees (suite à droite)'])]);
    f.setFrozenRows(1);
  }
  return f;
}
function lignes_(t) {
  const f = feuille_(t);
  const n = f.getLastRow() - 1;
  if (n < 1) return [];
  return f.getRange(2, 1, n, t.cols.length).getValues().map((v, i) => ({ row: i + 2, v: v })).filter(r => r.v[0]);
}
function lireDonnees_(t, row) {
  const f = feuille_(t);
  const debut = t.cols.length + 1;
  const largeur = Math.max(1, f.getLastColumn() - t.cols.length);
  const morceaux = f.getRange(row, debut, 1, largeur).getValues()[0];
  const txt = morceaux.filter(x => x !== '').join('');
  return txt ? JSON.parse(txt) : null;
}
function ecrireLigne_(t, row, tete, data) {
  const f = feuille_(t);
  const txt = JSON.stringify(data || {});
  const morceaux = [];
  for (let i = 0; i < txt.length; i += TAILLE_MORCEAU) morceaux.push(txt.slice(i, i + TAILLE_MORCEAU));
  if (!row) row = f.getLastRow() + 1;
  const ancienne = f.getLastColumn() - t.cols.length;
  if (ancienne > 0) f.getRange(row, t.cols.length + 1, 1, ancienne).clearContent();
  f.getRange(row, 1, 1, tete.length).setValues([tete]);
  f.getRange(row, t.cols.length + 1, 1, morceaux.length).setValues([morceaux]);
}
function norm_(s) {
  return String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
}
function cle_(classe, nom) {
  if (!norm_(nom)) throw new Error('Nom de groupe manquant');
  return norm_(classe) + '|' + norm_(nom);
}
function hash_(mdp, sel) {
  const octets = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, sel + '|' + String(mdp || ''), Utilities.Charset.UTF_8);
  return Utilities.base64Encode(octets);
}
function verrou_(fn) {
  const l = LockService.getScriptLock();
  l.waitLock(20000);
  try { return fn(); } finally { l.releaseLock(); }
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
