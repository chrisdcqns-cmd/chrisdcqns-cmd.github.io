# Acrosport EPS — notes pour Claude

Application web (PWA) d'acrosport pour tablettes, hébergée sur GitHub Pages depuis la branche `main` (racine).

- `index.html` : toute l'appli dans un seul fichier (HTML + CSS + JS). Les données des 176 figures (`const FIGS`) et les photos (`const IMGS`, images WebP en data URI) sont des lignes JSON très longues : modifier le code autour, pas ces lignes à la main.
- `v/` : vidéos d'origine du PowerPoint « AcroEPS niveau intermédiaire » (M. Avisse & Y. Tomaszower, Académie de Créteil). Ne pas recompresser.
- `sw.js` : service worker (réseau d'abord pour la page → mises à jour automatiques ; vidéos servies depuis le cache `acro-videos-v1` si téléchargées). Changer `CORE` (acro-core-vN) si on ajoute des fichiers à `CORE_FILES`.
- `apps-script/Code.gs` : serveur Google Apps Script (Google Sheet) pour la sauvegarde en ligne. L'URL /exec se règle dans `API_DEFAULT` de `index.html` ou dans l'espace enseignant.
- Interface et textes en français ; utilisateurs : lycéens (classe EPS « 1GT », élèves de 1G1-1G4 et 1STMG) et leur enseignant d’EPS. Classes et listes d’élèves : onglets « Classes » et « Eleves » de la Google Sheet (jamais de noms d’élèves dans ce dépôt public).
- Espace enseignant (⚙) : mot de passe enseignant du script, saisi avec le pavé `epsPin()` (copie de celui d'`eps-home.js` : pas de clavier du système, rien d'affiché, touche ABC), vérifié en ligne (action teacherCheck) ; empreinte locale pour l'accès hors connexion. Code `eps` seulement si aucun script n'est configuré. Pour limiter le nombre de pyramides d'une leçon : lien `#pyramides-N`.
- Modèle d'enchaînement : `G.current.slots[i] = {parts:[{fig, roles}]}` — une figure peut réunir plusieurs pyramides simultanées (comptent pour 1 figure). Toujours passer par `partsOf(slot)` (gère l'ancien format `{fig, roles}`).
- Liaisons : uniquement sur le tapis (`current.dojo.items`, `kind:"el"`, `pic` = élément gymnique de `BONUS.trans`). Les anciennes zones de texte `mats` sont converties en étiquettes.
- Synchro : jeton de groupe (`token`, jamais le mot de passe en stockage local), numéro de version `rev` + fusion en cas de conflit (`mergeGroups`), envoi auto du brouillon (`autoDirty`, 40 s). Leçon du jour par classe : `teacherSetLesson` → colonne `pyramides` de l'onglet Classes ; `lessonN(classe)`.
- Observation : critères `CRIT` (statique) / `CRIT_DYN` (dynamique), clés de notes `f{figure}p{pyramide}|rôle|critère` (anciennes clés `f{i}|…` encore lues).
- `const BONUS` (échauffement + vidéos `v/media1..17.mp4`, éléments gymniques A–D, prises de mains) est généré au build comme `FIGS`.
- Bouton « Accueil » commun : `<script src="../eps-home.js" defer>` (page d'accueil `/eps-autonomie-numerique/` qui regroupe Acrosport, Escalade, OrienRun et Relais Vitesse dans un seul APK).
- Acrosport fait partie du dépôt `chrisdcqns-cmd.github.io` (dossier `eps-autonomie-numerique/acrosport/`) ; l'ancien dépôt `chrisdcqns-cmd/acrosport` ne contient plus qu'une page de redirection. Le service worker relit aussi les vidéos téléchargées à l'ancienne adresse `/acrosport/v/`.
- Leçons enregistrées : une seule par jour (`oneADay`, `dayOf`) — `saveProgress` remplace l'enregistrement du jour, `mergeGroups` et le chargement regroupent aussi par jour. Vocabulaire : « leçon », jamais « séance ».
- Curseur de défilement `#scrollRail` (fin du script) : visible quand un tapis `.dojo` est à l'écran (hors plein écran), pour faire défiler la page sans toucher le tapis.
- Logo : `icon-192.png` / `icon-512.png` (pyramide à trois, fond bleu, voltigeur jaune), aussi utilisé par la page d'accueil commune.
- Bilans de la classe : espace enseignant → En ligne → classe + date → « 🗜️ Bilans de la classe (.zip) » (`zipBilans`, `acroPdf`, `EPDF`) : lit en ligne les groupes (`teacherList`/`teacherLoad`), la liste (`listStudents`) et les observations du jour ; un PDF par élève (groupe, enchaînement du jour et rôle de l'élève, liaisons, observations reçues).
