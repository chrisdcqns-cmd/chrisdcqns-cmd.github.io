# chrisdcqns-cmd.github.io

Racine du site GitHub Pages : **EPS – Mes applications** → https://chrisdcqns-cmd.github.io/

- `index.html` : page d'accueil commune (vignettes vers les 4 applications).
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png` : installation de l'ensemble comme une seule application (APK PWABuilder, `start_url` et `scope` = `/`).
- `sw.js` : service worker de la racine. Il ne gère que l'accueil, `eps-home.js` et `relais/` (mode hors ligne) ; Acrosport, Escalade et OrienRun gardent leur propre service worker.
- `eps-home.js` : inclus dans chaque application : désactive l'actualisation par glissé vers le bas (`overscroll-behavior-y: contain`) et ajoute le bouton « Accueil » flottant (bas à gauche, déplaçable par appui long).
- `.well-known/assetlinks.json` : relie l'APK Android `io.github.chrisdcqns.acrosport` au site entier, pour que les applications s'ouvrent sans barre d'adresse.
- `.nojekyll` : indispensable pour que GitHub Pages publie le dossier `.well-known`.

Applications :
- `/acrosport/` : **Acrosport EPS** (dépôt séparé `chrisdcqns-cmd/acrosport`, à cause du poids des vidéos) → https://chrisdcqns-cmd.github.io/acrosport/
- `escalade/` : **Escalade EPS** → https://chrisdcqns-cmd.github.io/escalade/
- `orientation/` : **OrienRun EPS** → https://chrisdcqns-cmd.github.io/orientation/
- `relais/` : **Relais Vitesse EPS** → https://chrisdcqns-cmd.github.io/relais/

## Regénérer l'APK unique (PWABuilder)

1. Sur https://www.pwabuilder.com, saisir `https://chrisdcqns-cmd.github.io/` puis **Package for stores → Android**.
2. Options : **Package ID** `io.github.chrisdcqns.acrosport` (le même qu'avant), nom « EPS – Mes applications », URL de démarrage `/`.
3. **Signing key → Use mine** : charger le fichier `signing.keystore` d'origine avec ses mots de passe et l'alias (fichier `signing-key-info.txt` fourni par PWABuilder la première fois). Ainsi l'APK installé se met à jour sans désinstallation et l'empreinte de `assetlinks.json` reste valable.
4. Sans la clé d'origine : laisser PWABuilder en créer une nouvelle, désinstaller l'ancien APK, puis remplacer `sha256_cert_fingerprints` dans `.well-known/assetlinks.json` par la nouvelle empreinte (fichier `assetlinks.json` du paquet PWABuilder).

## Dispenses (communes à toutes les applications)
- Page d'accueil → carte **Dispenses** → « 🔒 Gérer les dispenses » (code enseignant de Relais Vitesse) : classe → élève → période (du / au) et motif facultatif.
- Les classes et élèves proposés viennent des listes déjà présentes sur la tablette (Relais, Escalade, OrienRun, Acrosport) ; on peut aussi taper une classe ou un nom.
- Dans chaque application, une pastille rouge « 🩹 N dispensés » apparaît en bas à gauche quand des élèves sont dispensés aujourd'hui : elle liste qui et jusqu'à quand (le motif n'y est jamais affiché). Relais Vitesse marque aussi les élèves dispensés dans les groupes et les listes de coureurs.
- Partage entre tablettes : par le même canal chiffré que Relais Vitesse (onglet « Sync », clés `disp|…`), dès que Google Sheets est configuré dans Relais Vitesse sur la tablette.
- Code partagé : `eps-home.js` (`window.EPSD` : `find(classe, nom, prenom)`, `label()`, `active()`, événement `epsd-change`).
