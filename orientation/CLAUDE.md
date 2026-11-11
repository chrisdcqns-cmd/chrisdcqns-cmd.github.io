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
