# EPS · Autonomie et numérique — charte commune (à lire avant toute modification)

Ces règles valent pour **toutes** les applications du dossier (Acrosport, Escalade, OrienRun, Relais Vitesse, Volley-ball, Badminton, Danse, CO-Évaluation, Appel AS, EDT, Pose des balises) **et pour toute nouvelle application**. Elles ont été fixées par l'enseignant (seul utilisateur, lycée, plusieurs tablettes). Quand une amélioration est faite dans une appli, se demander si elle doit être reportée dans les autres et dans ce fichier. Les notes propres à chaque appli sont dans `<appli>/CLAUDE.md`.

## Langue et vocabulaire
- Tout en français. Élèves tutoyés. Dire « leçon » (jamais « séance ») et « séquence » (jamais « cycle »).
- Aucun nom d'élève dans le dépôt public : les listes restent sur les tablettes (localStorage / IndexedDB) et dans les Google Sheets ; ce qui part en ligne est chiffré (AES-GCM, clé secrète du partage).

## Structure d'une appli
- Un dossier `<appli>/` avec un `index.html` autonome (bibliothèques intégrées pour le hors ligne : pdf-lib, JSZip, QR…).
- En tête, **synchrone**, avant le script de l'appli : `<script src="../eps-lists.js"></script>` (listes de classes communes).
- À la fin : `<script src="../eps-home.js" defer></script>` (réglages, code enseignant, dispenses, écran de classe, boutons communs, synchro des listes).
- Tuile sur l'accueil `index.html` (section « Activités », ou « Outils enseignant » avec `data-eps-teach`), couleur et icône de l'appli.
- Mettre à jour `/sw.js` (`CORE` +1, fichiers à mettre en cache) et le `sw.js` propre à l'appli s'il existe, pour que ⟳ sur les tablettes récupère la nouvelle version.
- Code enseignant commun (pavé `epsPin`, `eps.teach.until`, code `relais-vitesse-code-v1`) ; réglages communs `EPSR.get()` (établissement, enseignant, année…), partagés entre tablettes.

## Charte visuelle
- Fond `#F5F3EE`, lignes `#E6E1D6`, texte `#14171C`, police `system-ui`.
- Barre du haut `#14171C` avec liseré de 4 px à la couleur de l'appli (`--app`, `box-shadow:inset 0 -4px 0 var(--app)`), icône au trait blanche dans un carré de 36 px (rayon 10 px) à la couleur de l'appli, nom de l'appli en 20 px gras, sous-titre gris `#A9AEB8` (ex. « CA4 »).
- Accents (boutons principaux, onglet actif) à la couleur de l'appli. Boutons de la barre : contour `#3A3F47`, texte `#D5D8DE`, hauteur 40 px, rayon 10 px.
- Dans la barre : `<span data-eps-bar></span>` où `eps-home.js` loge ⌂ Accueil, ⟳ et la pastille 🩹 des dispensés (plusieurs emplacements possibles, un par écran : le visible est utilisé).
- Couleurs : Acrosport `#1F4FA3`, Escalade `#2E7D4F`, OrienRun `#E8701A`, Relais `#D9481F`, Volley `#6B3FA0`, Danse `#C2185B`, Badminton `#0B7A75`, CO-Éval `#14213D`, Appel AS `#475569`, EDT `#1F5F8B`, Pose des balises `#8A5A1F`. Une nouvelle appli prend une couleur bien distincte de celles-ci.
- Une seule icône par appli (pictogramme au trait, `viewBox 0 0 24 24`, `stroke-width 2`), identique sur l'accueil, dans la barre et sur l'écran « Choisis ta classe ».

## Espace enseignant (commun)
- `eps-shell.js` : `EPST.init({app, nom, color, isTeacher, anchor, main, tabs:{seq, eval, cls, bil}, biblio:[…], reglages:[…]})` ; onglets toujours dans cet ordre : 📅 Séquence · 👁 Vue élève · 📚 Bibliothèque · 📋 Évaluation · 👥 Classe · 📄 Bilans · ⚙ Réglages. On arrive sur Séquence. Pas d'appli « élève avec des cases enseignant ».
- Vue élève : l'appli dans un cadre `?vue=eleve` (mode enseignant ignoré par `eps-lists.js`), sans quitter le mode enseignant.
- Claude (API, par le script commun, clé `ANTHROPIC_KEY` côté serveur) : ✨ Reformuler / 🎤 Dicter sur tout `textarea[data-eps-comment]`, version élève d'une grille, consigne simplifiée ou traduite (Bibliothèque). Jamais de nom d'élève envoyé ; tout ce qui va aux élèves est relu et validé par l'enseignant.

## Mode élève
- En mode élève, l'appli s'ouvre sur l'écran commun « Choisis ta classe » : `(window.EPSG_Q=window.EPSG_Q||[]).push({app, sub, color, icon, classes(), current(), select(id), resources:[{ico,label,sub,open}], teacher(), isTeacher(), when()})`. Les ressources utiles sans classe (dispositif, sécurité, échauffement…) y figurent. Le bouton Accueil de l'appli, côté élève, ramène à cet écran.
- **Aucun bouton « enseignant » visible par les élèves.** Accès enseignant : appui long de 3 s sur le logo (barre, écran de classe, titre des écrans tablette coach / terrain), géré par `eps-home.js` ; l'appli peut fournir `window.epsTeacherEntry()`.

## Classes et élèves (communs à toutes les applis et tablettes)
- Une classe importée n'importe où (accueil ou appli) apparaît partout. Toute appli qui gère des classes s'inscrit dans `APPS` de `eps-lists.js` (`key, list, nom, names, make, add, del, data`) et fournit `window.epsListsHook = {save, reload}` pour la mise à jour en direct.
- Activités par classe (Réglages → Listes d'élèves) : champ `off` de la liste commune ; une classe non attribuée à l'activité n'y apparaît pas. Suppression (double confirmation) et fusion de listes : dans Réglages.
- Ne jamais effacer une classe ou un élève qui a déjà des données (évaluations, grimpes, courses).
- `window.epsCurrentClass()` → `{nom, eleves}` : la pastille des dispensés ne compte alors que la classe choisie (sinon tous).

## Évaluation, bilans et PDF (modèle : Danse et Volley-ball)
- **Module commun `eps-eval.js`** (`<script src="../eps-eval.js"></script>`) : à utiliser pour toute appli (actuelle ou nouvelle) au lieu de recopier le code de Danse / Volley.
  - Appli qui a déjà sa propre évaluation : `EPSE.create(adaptateur)` (Badminton, Relais Vitesse) ; afficher `exportsHtml()` + `card(classe)` dans le bilan puis `bindExports` / `bindCard`.
  - Appli sans évaluation : `EPSE.store({app, nom, ca, color, icon, pfx, code, url, grid, isTeacher, unlock})` (Escalade, Acrosport, OrienRun) : écran complet Évaluer / Bilan & export / Grille ouvert par `.open(classe)` depuis un bouton enseignant ; classes = listes communes attribuées à l'activité ; données `eps.eval.<app>.v1` synchronisées par `EPSD.store` (eps-home.js).
  - Lien élève `…/<appli>/#auto=<jeton>`, préfixe de dépôt de 2 lettres propre à l'appli (`pfx`), code de repli `<CODE>.…`. Bibliothèques partagées dans `vendor/` (pdf-lib, JSZip, QR), chargées au premier export.
- En-tête commun des bilans : `EPSR.pdfHead(doc, {act, titre, ca, ac, nom, classe, lecon…})` / `EPSR.htmlHead(...)` : bandeau `#14171C`, filet à la couleur de l'appli, établissement, enseignant, classe, date.
- Fiches élèves au format Danse/Volley : pdf-lib, une fiche par élève (paysage, texte ajusté), un PDF ou un .zip `<Appli>_<classe>_<jj-mm-aaaa>.zip` avec récapitulatif de classe.
- Auto-positionnement de l'élève (si l'activité a une grille par degrés) : QR code + lien nominatif sur la fiche (`…/<appli>/#eleve=<jeton>`), envoi chiffré au dépôt (script de Danse), code de repli à coller, mode lien qui masque tout le reste, sur tablette seulement après le choix de la classe et du nom dans la liste ; positionnement de l'élève affiché à côté de celui de l'enseignant, et suivi dans Bilan & export. Voir `danse/CLAUDE.md` et `volley/index.html`.
- Curseur intra-degré (position dans le degré, note au 0,25 pt), comme Danse et Volley.

## Synchronisation entre tablettes
- Script Google commun (`apps-script/Code.gs`, `eps.share.v1`) : enregistrements chiffrés `<appli>|…`, envoi peu après chaque modification, relevé régulier ; le plus récent l'emporte, élément par élément. Sauvegarde / restauration dans Réglages.

## Avant de publier
- Tester dans un navigateur (élève et enseignant), sans erreur de page ; vérifier l'écran « Choisis ta classe » et la barre.
- `git pull --rebase` avant de pousser (d'autres sessions travaillent en parallèle) ; en cas de conflit sur `/sw.js`, garder le `CORE` le plus haut + 1.
- Mettre à jour `README.md` et ce fichier si une règle commune change.
