# chrisdcqns-cmd.github.io

**EPS – Autonomie et Numérique** → https://chrisdcqns-cmd.github.io/eps-autonomie-numerique/

Toutes les applications sont dans le dossier `eps-autonomie-numerique/` :
- `index.html` : page d'accueil commune (vignettes vers les 4 applications, dispenses, listes d'élèves).
- `eps-home.js` : inclus dans chaque application (`../eps-home.js`) : pas d'actualisation par glissé, bouton « Accueil » flottant (un appui = accueil de l'application, maintenir 3 s = page commune `BASE`, glisser = déplacer), pavé de code `epsPin`, dispenses, import de listes d'élèves.
- `acrosport/` : **Acrosport EPS** (regroupé ici, vidéos dans `acrosport/v/`) → https://chrisdcqns-cmd.github.io/eps-autonomie-numerique/acrosport/
- `escalade/` : **Escalade EPS** → https://chrisdcqns-cmd.github.io/eps-autonomie-numerique/escalade/
- `orientation/` : **OrienRun EPS** → https://chrisdcqns-cmd.github.io/eps-autonomie-numerique/orientation/
- `relais/` : **Relais Vitesse EPS** → https://chrisdcqns-cmd.github.io/eps-autonomie-numerique/relais/
- `volley/` : **Volley-ball – Évaluation CA4** (enseignant, code commun) : critères par degrés avec curseur intra-degré, barème modifiable (barème perso ou officiel AFL1 /12 + AFL2-AFL3 /8), import de liste au choix (classes déjà sur la tablette, fichier Excel/CSV, collage), options (désactivées par défaut) : résultats des matchs pour placer le curseur AFL1 et compteur de points bonus, bilan de classe, PDF, CSV et zip des bilans. Données dans `localStorage` `eps_volley_eval_v1`, jamais envoyées en ligne → https://chrisdcqns-cmd.github.io/eps-autonomie-numerique/volley/
- `terrain/` : **Terrain** (outil enseignant pour iPhone, tuile visible en mode enseignant) : pose des balises au GPS avec contrôle de précision et photos, tracé de chemins, exports GPX / calque 1:25 000 et import dans OrienRun → https://chrisdcqns-cmd.github.io/eps-autonomie-numerique/terrain/
- `eps-autonomie-numerique/co-eval/` : CO – préparation à l'évaluation (appli temporaire : 3 parcours, tracé sur la carte, paramètres en direct via le script Google OrienRun).

À la racine :
- `index.html`, `escalade/index.html`, `orientation/index.html`, `relais/index.html` : **redirections** des anciennes adresses vers la nouvelle (en gardant `?…` et `#…`, pour les QR codes déjà imprimés) ; elles désinstallent aussi l'ancien service worker de l'application. L'ancienne adresse `/acrosport/` est redirigée par le dépôt `chrisdcqns-cmd/acrosport` (une seule page).
- `eps-home.js` : petit chargeur qui renvoie vers `eps-autonomie-numerique/eps-home.js` (pages encore en cache).
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png` : installation comme une seule application (APK PWABuilder, `start_url` et `scope` = `/`, redirigé vers la page d'accueil).
- `sw.js` : service worker de la racine (portée `/`) : page d'accueil, `eps-home.js`, `relais/` et `volley/` hors ligne ; Acrosport, Escalade et OrienRun gardent leur propre service worker.
- `.well-known/assetlinks.json` : relie l'APK Android `io.github.chrisdcqns.acrosport` au site entier (applications sans barre d'adresse).
- `.nojekyll` : indispensable pour que GitHub Pages publie le dossier `.well-known`.

Code enseignant : toutes les applications utilisent le même pavé maison `epsPin()` (dans `eps-home.js`, copie intégrée dans chaque application pour le hors connexion) : pas de clavier de la tablette, aucun caractère affiché, touche ABC pour les mots de passe avec lettres.

Les données des tablettes (localStorage, IndexedDB, vidéos en cache) dépendent du domaine `chrisdcqns-cmd.github.io`, qui ne change pas : rien n'est perdu avec la nouvelle adresse.

## Regénérer l'APK unique (PWABuilder)

1. Sur https://www.pwabuilder.com, saisir `https://chrisdcqns-cmd.github.io/` puis **Package for stores → Android**.
2. Options : **Package ID** `io.github.chrisdcqns.acrosport` (le même qu'avant), nom « EPS – Autonomie et Numérique », URL de démarrage `/` (redirigée vers `/eps-autonomie-numerique/`).
3. **Signing key → Use mine** : charger le fichier `signing.keystore` d'origine avec ses mots de passe et l'alias (fichier `signing-key-info.txt` fourni par PWABuilder la première fois). Ainsi l'APK installé se met à jour sans désinstallation et l'empreinte de `assetlinks.json` reste valable.
4. Sans la clé d'origine : laisser PWABuilder en créer une nouvelle, désinstaller l'ancien APK, puis remplacer `sha256_cert_fingerprints` dans `.well-known/assetlinks.json` par la nouvelle empreinte (fichier `assetlinks.json` du paquet PWABuilder).

## Dispenses (communes à toutes les applications)
- Page d'accueil → carte **Dispenses** → « 🔒 Gérer les dispenses » (code enseignant de Relais Vitesse) : classe → élève → période (du / au) et motif facultatif.
- Les classes et élèves proposés viennent des listes déjà présentes sur la tablette (Relais, Escalade, OrienRun, Acrosport) ; on peut aussi taper une classe ou un nom.
- Dans chaque application, une pastille rouge « 🩹 N dispensés » apparaît en bas à gauche quand des élèves sont dispensés aujourd'hui : elle liste qui et jusqu'à quand (le motif n'y est jamais affiché). Relais Vitesse marque aussi les élèves dispensés dans les groupes et les listes de coureurs.
- Partage entre tablettes : par le même canal chiffré que Relais Vitesse (onglet « Sync », clés `disp|…`), dès que Google Sheets est configuré dans Relais Vitesse sur la tablette.
- Code partagé : `eps-home.js` (`window.EPSD` : `find(classe, nom, prenom)`, `label()`, `active()`, événement `epsd-change`).

## Listes d'élèves (page d'accueil, mode enseignant)
- Carte **Listes d'élèves**, sous Dispenses → « 🔒 Importer une liste d'élèves » (code enseignant) : fichier Excel (.xlsx/.xls/.ods, lu avec SheetJS) ou CSV ; colonnes Nom/Prénom, « Élève » (format Pronote « NOM Prénom ») ou noms en 1re colonne ; colonne Classe facultative.
- Nom de la classe à vérifier, puis applications cochées : Escalade (`escalade.cl`), Relais Vitesse (`relais-vitesse-data-v3`), OrienRun (IndexedDB `orienrun` / `classes`) : élèves ajoutés à la classe du même nom, sans doublon. Acrosport : liste **remplacée** en ligne (`teacherSetStudents`, mot de passe enseignant d'Acrosport demandé avec le pavé).
- Code : `importList()` dans `eps-home.js` (`parseList`, `toEsc`, `toRel`, `toOri`, `toAcro`).

## Listes partagées entre tablettes
Une liste importée ou modifiée depuis la page d'accueil part vers les autres tablettes par le canal commun (« ⚙ Partage entre tablettes », même réglage que les dispenses) : enregistrements chiffrés `lst|<id>` (`shareList`), appliqués à la réception dans Escalade, Relais Vitesse et OrienRun (`applyList`, la liste reçue remplace celle de la classe du même nom ou de l'ancien nom). Identifiant de classe tiré du nom (`clsId`, même calcul dans Escalade) : pas de doublon d'une tablette à l'autre. Les applis ouvertes rechargent leurs listes (événement `eps-lists`).

## Bilans de la classe (.zip, pour Pronote)
Chaque application fabrique sur la tablette un fichier `.zip` par classe et par leçon, avec un PDF par élève (`<Appli>_<classe>_<jj-mm-aaaa>.zip`) : Escalade (Leçons et classes → Aujourd'hui ou une leçon précédente), Relais Vitesse (leçon précédente → « 🗜️ Bilans (.zip) »), OrienRun (Résultats → « 🗜️ Bilans (.zip) »), Acrosport (espace enseignant → En ligne, internet nécessaire). Générateur PDF et zip maison, copie identique `EPDF` dans Relais, OrienRun et Acrosport.

## Bouton « Mise à jour »
Bouton bleu ⟳ au-dessus du bouton Accueil (sur la page d'accueil : en bas à gauche) : il envoie et récupère les données (Relais, dispenses), vérifie s'il existe une nouvelle version de l'application, puis recharge la page — sans quitter l'appli.

## Partage entre tablettes (réglage commun, à la racine)
Page d'accueil → 🔒 Enseignant → Dispenses → « ⚙ Partage entre tablettes » : adresse du script Google (préremplie) et clé secrète, **une fois par tablette**. Ce réglage est commun à toutes les applications (stocké sous `eps.share.v1`) ; il reprend automatiquement celui de Relais Vitesse s'il existe déjà. Les dispenses sont chiffrées avec la clé et lisibles sur toutes les tablettes réglées. Script : `eps-autonomie-numerique/apps-script/Code.gs` (le même que celui de Relais : un seul déploiement suffit).
- Pastille « 🩹 N dispensés » et compteur de la page d'accueil : seulement en mode enseignant (`hubTeach()`).
