# Relais Vitesse EPS

Application web pour tablette, pour le relais-vitesse au lycée : vitesse cible du binôme, enregistrement des courses, conseils de prise de marque et suivi par groupe.

👉 **Ouvrir l'application : https://chrisdcqns-cmd.github.io/relais/**

## Déroulé

1. **Classe** : importer la liste des élèves (.xls, .xlsx, .ods ou .csv, par exemple un export Pronote). Les noms et prénoms sont reconnus automatiquement.
2. **Leçon** : la leçon du jour est datée automatiquement. On peut consulter les leçons précédentes.
3. **Groupes** : sélectionner les élèves de chaque groupe.
4. **Courses** : vitesse cible (moyenne entre le départ arrêté du coureur 1 et le départ lancé du coureur 2), puis saisie de la course : écart à la cible, zone de transmission (sur l'image de la piste), type de départ, plots, questions de diagnostic et conseil.

L'enseignant a un **code à 4 chiffres** (créé à la première utilisation). Il protège l'import, les fiches élèves, les groupes, les réglages, l'export Excel et les suppressions.

## Données et confidentialité

- Ce dépôt est public : **il ne contient aucun nom d'élève**. Les classes sont importées sur la tablette.
- Les élèves, les groupes et les courses restent **dans le navigateur de la tablette** (stockage local). Ils ne passent pas d'un appareil à l'autre : pense à exporter régulièrement le fichier Excel.
- Vers Google Sheets, l'application n'envoie **jamais les noms** : seulement un **code anonyme** par élève (ex. `E-4C5U`), ou le prénom avec l'initiale du nom si tu choisis ce réglage. La correspondance code ↔ élève figure seulement dans l'export Excel (feuille « Vitesses », colonne « Code anonyme »).

## Envoyer les courses vers Google Sheets

À faire une seule fois :

1. Crée une feuille Google Sheets (par exemple « Relais Vitesse – résultats »).
2. Dans la feuille : **Extensions → Apps Script**.
3. Efface le contenu de `Code.gs` et colle celui du fichier [`apps-script/Code.gs`](apps-script/Code.gs).
4. À la ligne `const SECRET = 'CHANGE-MOI';`, remplace `CHANGE-MOI` par une clé de ton choix (par exemple `relais-2026-xyz`). Enregistre.
5. **Déployer → Nouveau déploiement** → type **Application Web** :
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
   - Clique sur **Déployer**, autorise l'accès, puis copie l'**URL de l'application Web** (elle se termine par `/exec`).
6. Dans l'application, sur la page des classes : **Google Sheets** (code enseignant), puis :
   - l'URL du script de l'enseignant est déjà pré-remplie (`SH_DEFAULT_URL` dans `index.html`) : colle seulement la **clé secrète** (elle n'est jamais publiée) ;
   - choisis « Code anonyme » ou « Prénom + initiale » ;
   - touche **Tester la connexion**, puis **Enregistrer**.

Ensuite, chaque course enregistrée est ajoutée à l'onglet « Courses » de la feuille. Une course supprimée dans l'application est aussi supprimée de la feuille. Sans réseau, les envois attendent et repartent tout seuls dès que la connexion revient. Le bouton **Envoyer toutes les courses** renvoie l'historique complet (sans créer de doublons).

> Si tu modifies le script plus tard : **Déployer → Gérer les déploiements → Modifier → Nouvelle version**, pour garder la même URL.

## Fichiers

- `index.html` : toute l'application (HTML, CSS, JavaScript, image de la piste).
- `apps-script/Code.gs` : script à coller dans Google Sheets pour recevoir les courses.
