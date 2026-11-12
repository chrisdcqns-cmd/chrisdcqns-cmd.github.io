# Escalade EPS

Application web pour tablette, pour l'escalade en moulinette au lycée : leçon du jour, saisie des grimpes par les élèves, cotation des voies, résultats par élève et envoi anonymisé vers Google Sheets.

👉 **Ouvrir l'application : https://chrisdcqns-cmd.github.io/escalade/**

## Déroulé

1. **Leçon du jour** (🔒 Enseignant, code) : classe, éléments travaillés (facultatifs ou obligatoires), objectif de voies par élève.
2. **Renseigner une grimpe** : l'élève choisit son prénom, le numéro de la corde, la couleur de la voie, confirme la cotation, puis renseigne les critères du jour (prises, changements de pieds, hauteur de 0 à 8 dégaines ou Top, baudrier, PME, sac à POF, commentaire).
3. **Mes résultats** : chaque élève retrouve sa dernière leçon et les leçons passées (tableau des voies, difficultés réussies, hauteur).
4. **Cotation** : cotation de chaque voie par corde, et « Je cherche une voie ! » par difficulté.
5. **Résultats et QRCODE** (mode enseignant) : export Excel, regroupement entre tablettes par QR code, Google Sheets.

Code enseignant par défaut : `1234` (à changer avec le bouton **Code** en mode enseignant).

## Données et confidentialité

- Ce dépôt est public : **il ne contient aucun nom d'élève**. Les classes sont importées sur la tablette (Excel, CSV ou saisie à la main).
- Les classes, fiches, vidéos et grimpes restent **dans le navigateur de la tablette**. Elles ne passent pas d'un appareil à l'autre.
- Vers Google Sheets, l'application n'envoie **jamais les prénoms** : seulement un **code anonyme** par élève (ex. `E-4C5U`), ou le prénom avec l'initiale du nom si tu choisis ce réglage. Le code dépend de la clé secrète, de la classe et du prénom : **un élève a le même code sur toutes les tablettes** qui utilisent la même clé. La correspondance code ↔ élève figure seulement dans l'export Excel (colonne « Code anonyme »).
- ⚠️ La colonne « Commentaire » est envoyée telle quelle : demande aux élèves de ne pas y écrire de noms.

## Envoyer les grimpes vers Google Sheets

À faire une seule fois :

1. Crée une feuille Google Sheets (par exemple « Escalade EPS – résultats »).
2. Dans la feuille : **Extensions → Apps Script**.
3. Efface le contenu de `Code.gs` et colle celui du fichier [`apps-script/Code.gs`](apps-script/Code.gs).
4. À la ligne `const SECRET = 'CHANGE-MOI';`, remplace `CHANGE-MOI` par une clé de ton choix (par exemple `escalade-2026-xyz`). Enregistre.
5. **Déployer → Nouveau déploiement** → type **Application Web** :
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
   - Clique sur **Déployer**, autorise l'accès, puis copie l'**URL de l'application Web** (elle se termine par `/exec`).
6. Dans l'application, sur chaque tablette : **🔒 Enseignant → Résultats et QRCODE → Google Sheets** :
   - colle l'URL et la **clé secrète** (la même partout) ;
   - choisis « Code anonyme » ou « Prénom + initiale du nom » ;
   - touche **Tester la connexion**, puis **Enregistrer**.

Ensuite, chaque grimpe enregistrée est ajoutée à l'onglet « Grimpes » de la feuille. Une grimpe annulée ou supprimée dans l'application est aussi supprimée de la feuille. « Tout effacer » vide seulement la tablette. Sans réseau, les envois attendent et repartent tout seuls dès que la connexion revient. Le bouton **Envoyer toutes les grimpes** renvoie l'historique complet (sans créer de doublons).

> Si tu modifies le script plus tard : **Déployer → Gérer les déploiements → Modifier → Nouvelle version**, pour garder la même URL.

## Fichiers

- `index.html` : toute l'application (HTML, CSS, JavaScript), sans bibliothèque externe.
- `sw.js` : copie locale de l'appli pour l'utiliser hors connexion après une première ouverture.
- `apps-script/Code.gs` : script à coller dans Google Sheets pour recevoir les grimpes.
