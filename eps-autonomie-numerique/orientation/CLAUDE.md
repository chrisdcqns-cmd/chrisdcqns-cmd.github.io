# OrienRun EPS — notes pour Claude

Application web (PWA) de course d'orientation pour l'EPS, hébergée sur GitHub Pages (`index.html` à la racine).

- `index.html` : toute l'appli (HTML + CSS + JS), générée à partir des sources (`src/*.js`, `src/shell.html` + `build.py`) si elles sont présentes. Sinon, modifier directement le `<script>`.
- Rôles : accueil → **Élève** (téléphone) ou **Espace enseignant** (tablette, code `eps` sans script, sinon mot de passe du script vérifié par `teacherCheck`).
- Projet enseignant (carte en dataURL, dessins, balises, parcours, calage GPS) : IndexedDB `orienrun` / clé `projet`. Séances : clés `session:CODE` et `sessions`.
- QR de balise : `URL#b=<numéro>.<code>`. QR de départ : `URL#go=<base64url JSON>` (séance, URL du script, tél. du prof, intervalle GPS, sel, parcours compact avec empreintes des codes : jamais les codes en clair).
- Carte non à l'échelle : `makeGeoref()` = transformation affine + correction locale (pondération inverse à la distance) à partir des points de calage et des balises géolocalisées et placées.
- Symboles : tableau `SYM` (codes ISOM 2017-2 / ISSprOM 2019), surimpression violette `VIOLET`.
- `apps-script/Code.gs` : actions `push` (élève), `getSession` (carte), `publish`, `poll`, `decide`, `msg`, `teacherCheck` (prof). Onglets : Seances, Evenements, Decisions, Messages.
- SMS de secours : format `OR1;S=…;C=…;R=…;N=…;K=…;D=<départ s>;P=<n>+<s>,…;F=<s>;G=lat,lon` (`parseSMS` / `smsResultat`).
- Interface et textes en français ; utilisateurs : lycéens (classes TMELEC, TTBMA, 1GT…) et leur enseignant d'EPS. Pas de noms d'élèves dans le dépôt public.
- `sw.js` : changer `CORE` (orienrun-core-vN) si on ajoute des fichiers à `CORE_FILES`.
- Accès enseignant (`profLogin`, src/teacher.js) et changement de code (src/teacher3.js) : pavé `epsPin()` (copie de celui d'`eps-home.js`, touche ABC pour les lettres), jamais de champ texte. `index.html` est généré : modifier `src/` puis `python3 build.py`.
- Bilans de la leçon : bouton « 🗜️ Bilans (.zip) » des résultats → `zipBilans(X)` / `orienPdf` (src/teacher3.js, avec `EPDF`, PDF + zip maison) ; un sous-dossier par classe si la leçon en mélange plusieurs.
- Bibliothèque de leçons : onglet « 📚 Bibliothèque » (src/biblio.js) : `BIBLIO` (cycle de 10 leçons + situations courtes, format fiche de leçon EPS, AFLP bac pro / AFL bac GT du CA2), leçons perso dans IndexedDB clé `biblio`, `courseFromLecon()` crée un parcours préréglé (`o`).
- Mode enseignant partagé (`eps.teach.until`) : `profLogin` sans code si actif ; mot de passe du script retenu sur la tablette (`localStorage['orienrun.tpw']`) après la 1re saisie.
- Appli Terrain (iPhone) : dossier `../terrain/` (page unique, sans build) : pose de balises à position GPS contrôlée (mesure moyennée, refus si imprécis), photos, tracé de chemins avec pause automatique, exports (JSON `orienrun-terrain`, GPX, calque 1:25 000/1:50 000 avec quadrillage UTM). Import dans OrienRun : src/terrainimp.js (`importTerrain`, chemins en attente dans `P.gpsTraces` tant que la carte n'est pas calée, `convertTraces`).
- Terrain v2 : un point tous les `CFG.pas` m (3 par défaut), repères (`REP`, mesurés comme les balises), calage de la trace sur photo aérienne (`CAL` = paires src→dst, `makeCorr` : 1 point décalage, 2 similitude, 3+ affine + IDW ; `cp()` applique la correction aux exports et à l'affichage), export CSV point par point avec UTM. OrienRun : les repères importés deviennent des points de calage sans position sur la carte (`P.calib` avec `x == null`) à placer (`placeReperes`, `ED.placeCal`) ; les chemins importés gardent leurs points GPS (`f.gps`) et sont redessinés par `recalTraces()` après chaque nouveau calage.
