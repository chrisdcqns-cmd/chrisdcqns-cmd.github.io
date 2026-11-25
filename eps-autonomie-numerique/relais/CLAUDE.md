# Relais Vitesse EPS — notes pour Claude

> Lire d'abord la charte commune : `../CLAUDE.md` (barre, couleurs, écran « Choisis ta classe », accès enseignant caché, listes communes, PDF et auto-positionnement au format Danse/Volley).

Application web pour tablette (relais-vitesse, lycée), hébergée sur GitHub Pages : `relais/index.html` contient tout (HTML + CSS + JS + image de la piste en WebP base64).

- Parcours : classes (import .xls/.xlsx/.ods/.csv via SheetJS cdnjs) → leçon du jour datée → groupes → accueil de leçon (vitesse cible) → enregistrer les courses.
- Données dans `localStorage`, clé `relais-vitesse-data-v3` : `{classes:[{id,name,eleves,groupes,lecons,courses,curg}],cur,lecon}`. Réglages par leçon dans `lecon.cfg` (`DEFCFG`).
- Code enseignant : hash dans `relais-vitesse-code-v1`, déverrouillage 10 min, saisi avec le pavé commun `epsPin()` (`pinPrompt`, `requireCode`) ; les éléments `.teach` ne sont visibles qu'avec `body.teach-on`.
- Zones cliquables sur l'image : `IMGZONES` (pourcentages de largeur) : Hors zone, Zone 100, Zone 10, Zone 1. Diagnostic par zone : `DIAG`.
- Google Sheets : réglages `relais-vitesse-sheets-v1` (url, clé, format des noms, file d'attente). Envoi `fetch` POST `no-cors` en `text/plain` vers `apps-script/Code.gs` (`doPost` : ajout/mise à jour par identifiant `cid`, suppressions) ; test et **vérification de réception** par JSONP (`doGet?ids=…&callback=` → `have`) : une course ne quitte la file `SH.queue` qu'une fois lue dans la feuille (`c.rx=1`). **Jamais de noms** : code anonyme `anonCode()` ou prénom + initiale.
- **Pas de noms d'élèves dans le dépôt public** : la version publiée a `const ORIG=[];`.
- Interface et textes en français, tutoiement des élèves.
- Groupes par leçon : `lecon.groupes` (copie des groupes habituels `classe.groupes` à l'ouverture, `ensureLeconGroups`). `GR()` renvoie les groupes de la leçon en cours, ou de la leçon consultée (`ctxLecon()`, vue « bilan »). Fiche groupe : case « Appliquer aussi aux prochaines leçons » → `applyGroups(op)` modifie la leçon en cours, et si coché les groupes habituels + les leçons déjà préparées (`futureLecons`). Roue crantée de la classe : élèves et groupes habituels (`DATA.lecon=null`). Leçon passée : « ✏️ Groupes de cette leçon » puis « 👥 Reformer les groupes ».
- Ouverture côté élève : `startStudent()` ouvre la leçon du jour (vue élève) ou l'écran d'attente `v-wait` (bouton « Espace enseignant »). `TEACH_VIEWS` (classes, import, lecons, bilan) demandent le code dans `go()`. « 👟 Mode élève » sur la page des classes reverrouille. Liste des vitesses : options de modification en `.teach`.

## Synchronisation entre tablettes
- Enregistrements `clé → JSON chiffré` (AES-GCM, clé PBKDF2 dérivée de `SH.key`) dans l'onglet caché « Sync » via `Code.gs` (`doPost` avec `sync`, `doGet` avec `pull&since`).
- Clés : `cls|C`, `el|C|id`, `lec|C|lid` (sans `coach`), `lco|C|lid|gid`, `co|C|cid` (sans `rx`), `evp|C|id`, `eva|C|id|lid`, `dispo`, `meta` (sel des codes anonymes).
- `persist()` → `syncSoon()` → `syScan()` détecte les changements par empreinte (`SY.h`), envoie `SY.pend` (horodatage de Lamport `syStamp`), puis `syPull()` ; le plus récent l'emporte.
- Garde-fou : une disparition massive (> 40 éléments et > 40 %) n'est pas propagée et les données sont récupérées.
- Jamais de nom d'élève en clair dans la feuille.
- Compilation : `compileAll()` → `mergeClass(T,D)` / `mergeLessons(c,keep,dup)` ; alias synchronisés `alias|D` {to,el,lec} et `lalias|C|lid` {to} ; `syApply` redirige les éléments d'une classe/leçon fusionnée. Le code enseignant (`code`) est aussi synchronisé.
- Bilans de la classe : bouton « 🗜️ Bilans (.zip) » de la vue bilan d'une leçon → `relaisPdf(e,l,list)` par élève, `EPDF` (PDF + zip maison, copie commune aux applis).
- Accueil élève (`v-wait`) : « Je choisis ma classe » → `renderWait()` propose la leçon du jour de la classe, la prise de performances (si ouverte) et le dispositif. Plus de saut automatique vers la leçon.
- Bibliothèque de situations : `SITS` / `SIT_CATS` (contenu), vue `v-sits` (`renderSits`), boutons `[data-sits]` ; l'enseignant ajoute des situations à la leçon (`lecon.sits`, synchronisé avec la leçon) → carte « 📚 Situations de la leçon » sur l'accueil (`renderSitDay`).
- Situations : la bibliothèque (`data-sits`) est réservée à l'enseignant (`.teach`) ; les élèves ne voient que les situations cochées pour la leçon du jour (`renderSits` filtré, `data-sitgo`).
- Mode enseignant partagé : `eps.teach.until` (`hubSync`, `hubOn`) ; au démarrage, si actif → vue classes ; « Mode élève » / verrou le coupe partout.
- Clé de synchro : si aucune clé n'est saisie dans Relais, celle du « Partage entre tablettes » de la page d'accueil (`eps.share.v1`, même script). Les enregistrements `disp|`, `lst|` (page d'accueil) et `e:` (Escalade) sont ignorés.
- Synchro, diagnostic : chaque tablette publie une fiche chiffrée `dev|<id>` (nom, heure, nb de courses et d'auto-évaluations, attente, erreur) → liste « Tablettes vues » (🔒 Google Sheets ou bouton 📡 Tablettes dans Évaluation) ; `syResend()` renvoie tout, `syRefetch()` récupère tout.
- Auto-évaluations reliées entre classes du même nom (élève retrouvé par prénom+nom) : `lastAutoE(e)` / `autoSources(e)`.
- Bilan de l'évaluation (`#ev-bilan`, `renderEvBilan`) : statistiques, `evClassPdf()`, `evStudentPdf(e)`, .zip, partage `shareOrSave()` (navigator.share sinon téléchargement). Onglet Évaluation toujours visible pour l'enseignant.
- Bulle de conseil → `sitFor(conseil)` → bouton « Situation conseillée » (`data-sitadv`, visible aussi des élèves).
- Choix des coureurs : tuiles `.rpick` construites à partir des `<select>` `#c-r1/#c-r2/#r-r1/#r-r2` (cachés, `.rpicksel`, ils gardent la valeur : ne pas les supprimer) ; `renderPicks(p)` appelé par `pair(p)` ; élèves des autres groupes derrière `[data-rpmore]`.
- Marque du binôme : `markFor(i1,i2)` d'après la dernière course du binôme (`lastPairCourse`, toutes leçons) : Recule → pm + recul (≥ 1), Avance → pm − 1 ; affichée dans `#c-mark` / `#r-mark`, plot conseillé `.sug` dans `#r-pm`. Rien de stocké en plus.
- Vidéo (`vOpen`, `[data-vid]`) : 2 MediaRecorder décalés de 8 s (`vRoll`) ; « Revoir cette course » (`vReplay`) arrête le plus ancien (clip autonome de 8 à 16 s, durée mesurée au chrono car le webm n'a pas de durée) et relance aussitôt un enregistreur : le film ne s'arrête jamais. Clips en mémoire seulement (`VR.clips`, Blob URL), 10 min et 6 au plus, rejouables même après fermeture de la fenêtre ; jamais écrits ni envoyés. Arrière-plan : caméra coupée, clips gardés ; écran maintenu allumé (Wake Lock).
- Tableau de bord `v-live` (enseignant, `TEACH_VIEWS`) : `liveData()` / `renderLive()` (rafraîchi par `syRefresh` et toutes les 15 s) ; pastille `#sydot` : `stale` si pas de synchro depuis 2 min 30, « Pas de synchro » visible par l'enseignant si non réglée.
- Claude (script commun, `EPSD.reformuler`) : bilan de leçon `mode:"lecon"` (`lvPrompt` anonymise en E1, E2…, `lvDecode` remet les prénoms) → `lecon.ia {t,at,n}` ; appréciations `mode:"bulletin"` → `evals[id].app` (synchronisé dans `evp|`, colonne Excel, commentaire des fiches PDF si `comm` vide). Le script doit renvoyer `aiv ≥ 2`.
- **Une seule tablette partagée par toute la classe** (pas une par groupe) : tout ce qui concerne le déroulé de la leçon doit le supposer.
- Ordre de passage : `turnCands()` / `renderTurn()` (`#r-turn`) : en « Toute la classe », parmi tous les groupes (groupe qui attend depuis le plus longtemps d'abord, deux coureurs du même groupe ; sans groupe : toute la classe) ; groupe choisi : seulement lui ; moins de courses dans le rôle d'abord, pénalité au dernier binôme. Après « Enregistrer », coureurs toujours vidés.
- « Et maintenant ? » : `nowStep()` / `renderNow()` (`#r-now`, bulle fixe en bas, appelée par `onCourse`) ; « Enregistrez la course » déclenche `#r-save`. Annulation 60 s, retirée dès que des coureurs sont choisis : `UNDO {cid, st, r1, r2, until, n, who}` (course retirée + `shQueue(cid,"del")`, saisie remise).
- QR codes (`#btnQRG`, QR « toute la classe » `#g=<idClasse>.all.<nom>` + un par groupe, `#qmodal`, `../eps-qr.js`) : `#g=<idClasse>.<idGroupe>.<nom>` → `qrGroupOpen()` dans `startStudent` (classe retrouvée aussi par le nom), ouvre la leçon du jour du groupe.
- Assistant de séquence (`#l-seq`, `#smodal2`, `SQ`) : dates d'après `EPSD.edtSlots(classe,"rel")`, sinon hebdomadaires ; progression `SQ_PROG` (8 paliers de situations) ; ne modifie pas une leçon qui a déjà des courses (sauf situations vides).
- `window.epsCheck` (contrôle « Tout est prêt ? » commun).
- Identification du groupe (tablette partagée) : `needG()` = élève + groupes + `curg==='all'` → `#v-course.needg` ne montre que « Ton groupe » (bouton « Toute la classe » réservé à l'enseignant) ; `GID_AT` (dernier toucher), `gidExpire()` remet `curg='all'` après 5 min sans action. `curg` n'est pas synchronisé (`SYNC_EXCL`).
