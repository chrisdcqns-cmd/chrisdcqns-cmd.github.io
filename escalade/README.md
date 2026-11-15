# Escalade EPS

Application web pour tablette, pour l'escalade en moulinette au lycée : leçon du jour, saisie des grimpes par les élèves, cotation des voies, résultats par élève et envoi anonymisé vers Google Sheets.

👉 **Ouvrir l'application : https://chrisdcqns-cmd.github.io/escalade/**

## Côté élève

1. **Je suis élève** → l'élève touche sa classe, puis **forme son groupe** en touchant les prénoms (au moins 3 : grimpeur, assureur, contre-assureur). Le groupe reste en mémoire sur la tablette pour la journée ; « Modifier » sur l'accueil.
2. Aucun prénom ne se tape au clavier : grimpeur, assureur, contre-assureur et observateur se choisissent avec des **badges prénom** (le groupe d'abord, « Un autre élève de la classe » si besoin). Dans un groupe de 3, les deux autres élèves sont proposés d'office comme assureur et contre-assureur (bouton « Inverser »).
3. Accueil (tout tient sur un écran) : Se préparer et assurer, Cotation, Renseigner une grimpe, Mes résultats, puis Thématiques et Sécurité en bas.

## Déroulé

1. **Leçon du jour** (🔒 Enseignant, code) : classe, éléments travaillés (facultatifs ou obligatoires), objectif de voies par élève.
2. **Renseigner une grimpe** : l'élève choisit son prénom, le numéro de la corde, la couleur de la voie, confirme la cotation, indique **sa cordée** (assureur et contre-assureur obligatoires, observateur facultatif, choisis dans la liste de la classe), puis renseigne les critères du jour (prises, changements de pieds, hauteur de 0 à 8 dégaines ou Top, baudrier, PME, sac à POF : Oui / Non puis combien de fois, commentaire).
   - **Ratio pieds / mains** : dès que les prises de mains et de pieds sont comptées toutes les deux, l'élève voit le nombre de pieds par prise de main, avec un repère couleur : rouge sous 1 (plus de mains que de pieds), orange de 1 à 1,5, vert à partir de 1,5 (il grimpe avec les jambes). Ces seuils sont indicatifs : aucun référentiel officiel ne fixe de valeur chiffrée.
3. **Mes résultats** : l'élève touche son prénom ; onglet **Bilan** (toutes ses leçons : voies, Tops, taux de réussite, meilleure difficulté, voies par leçon et par difficulté, hauteur, ratio pieds/mains, rôles tenus, voies les plus grimpées et **prochain défi**), puis un onglet par leçon. chaque élève retrouve sa dernière leçon et les leçons passées (tableau des voies, difficultés réussies, hauteur).
4. **Cotation** : cotation de chaque voie par corde, et « Je cherche une voie ! » par difficulté.
5. **Résultats et QRCODE** (mode enseignant) : export Excel, regroupement entre tablettes par QR code, Google Sheets.

Code enseignant par défaut : `1234` (à changer avec le bouton **Code** en mode enseignant).

## Leçons (comme dans Relais Vitesse)

Mode enseignant → **Leçons et classes**, pour la classe choisie :
- **Aujourd'hui** : la leçon du jour (éléments travaillés, obligatoires, objectif), à modifier ou à commencer. Sans leçon préparée, « Commencer avec les réglages de la dernière leçon » ; quand un élève choisit sa classe, la leçon du jour se crée aussi toute seule avec ces réglages.
- **Leçons à venir** : « + Préparer une leçon » pour une date précise ; elle s'appliquera automatiquement ce jour-là.
- **Leçons précédentes** : une ligne par jour, « Consulter » pour le détail par élève (voies, Tops, objectif atteint, rôles), les difficultés, toutes les grimpes et l'**export Excel de la leçon**.

## Vidéos de « Se préparer et assurer »

Les vignettes (nœud de 8 rapide, nœud de 8 version plus lente, assurer en moulinette) se remplissent **sur chaque tablette** : 🔒 Enseignant → Se préparer et assurer → Modifier → « 📹 Choisir la vidéo ». Les vidéos restent dans la mémoire de la tablette : elles ne sont pas publiées dans ce dépôt public (droits des auteurs) et fonctionnent hors connexion.

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

> L'adresse du script de l'enseignant est pré-remplie dans l'application (`SH_DEFAULT_URL` dans `index.html`) : sur chaque tablette, il suffit de saisir la **clé secrète**.

## Colonnes Assureur, Contre-assureur, Observateur

Dans la feuille, l'assureur, le contre-assureur et l'observateur sont, comme le grimpeur, remplacés par leur **code anonyme** (ou prénom + initiale).

Ces trois colonnes n'apparaissent qu'avec le **script version 3** (fichier `apps-script/Code.gs` actuel) : il range chaque valeur d'après le titre de sa colonne et ajoute tout seul les colonnes manquantes, sans toucher aux lignes déjà présentes. Tant que l'ancien script est en place, l'application continue d'envoyer l'ancien format (sans la cordée) : rien ne se décale. Dès que le script est mis à jour (voir ci-dessous), l'application le détecte et renvoie automatiquement les grimpes qui ont une cordée pour compléter la feuille.

## Vérification de réception

Après chaque envoi, l'application relit la feuille Google pour vérifier que les lignes sont bien arrivées. Tant qu'une ligne n'est pas confirmée, elle reste en file d'attente sur la tablette et repart automatiquement (toutes les 20 secondes en cas de problème, à chaque retour du réseau, et toutes les minutes). L'état s'affiche dans les réglages Google Sheets (« reçues », « en attente », « clé incorrecte »…).

**Mettre à jour un script déjà installé** : dans la feuille → Extensions → Apps Script → remplacer tout le contenu de `Code.gs` par la nouvelle version de [`apps-script/Code.gs`](apps-script/Code.gs) **en remettant ta clé secrète** à la ligne `const SECRET` → Enregistrer → Déployer → Gérer les déploiements → ✏️ → Version : **Nouvelle version** → Déployer (l'adresse ne change pas). Avec l'ancien script, l'envoi fonctionne toujours, mais la réception n'est pas vérifiée.

## Fichiers

- `index.html` : toute l'application (HTML, CSS, JavaScript), sans bibliothèque externe.
- `sw.js` : copie locale de l'appli pour l'utiliser hors connexion après une première ouverture.
- `apps-script/Code.gs` : script à coller dans Google Sheets pour recevoir les grimpes.
