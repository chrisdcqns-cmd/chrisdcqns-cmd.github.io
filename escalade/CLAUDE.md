# Escalade EPS — notes pour Claude

Application web pour tablette (escalade en moulinette, lycée), hébergée sur GitHub Pages : `escalade/index.html` contient tout (HTML + CSS + JS, aucune bibliothèque externe : lecture/écriture .xlsx et QR codes faits main).

- Écran de démarrage `S.t='role'` (`roleScr()`) : « Je suis élève » / « Je suis enseignant » (code `CF.pin`). Après « Je suis élève » : choix de la classe (`S.t='pickcl'`, `clsScr()`, `pickCl(id)` → `CF.sea.cl`), « Changer de classe » sur l'accueil élève. Accueil enseignant : tuiles « Leçon du jour et classes » et « Résultats, QR codes et Google Sheets » (`res`).
- Parcours : 🔒 Leçon du jour (classe, critères `CRIT` cochés/obligatoires, objectif) → accueil → Renseigner une grimpe (prénom → corde → couleur → confirmation → critères) → Mes résultats / Cotation / Thématiques.
- Vocabulaire : le numéro est celui de la **corde** ; chaque corde porte plusieurs **voies** de couleur (`WDEF` : cotations par corde).
- Hauteur : 0 = 1re dégaine non dépassée, 1–8 = dernière dégaine dépassée, 9 = Top (`TOP`). Voie réussie = Top. Valeur non choisie = `''`.
- Cordée (étape 5, `roles()`, `ROLES`) : `r.asr` assureur et `r.cas` contre-assureur obligatoires, `r.obs` observateur facultatif ; liste de la classe ou « Autre » ; refus si grimpeur = rôle ou assureur = contre-assureur ; gardée par « Autre voie ». Mes résultats compte aussi les rôles tenus.
- Ratio pieds/mains : `RP(p,m)` = pieds ÷ mains si les deux > 0 ; repères `rpLvl` (< 1 rouge, < 1,5 orange, sinon vert), affiché en direct sous « Prises de pieds » (`#rpm`, `upR()`), à l'écran « Grimpe enregistrée », dans Mes résultats (total pieds ÷ total mains) et en colonne Excel / Sheets v3 (pas dans l'ancien format 16 colonnes).
- Stockage `localStorage` avec le préfixe `escalade.` (clés `c` contenu, `w` cotations, `r` grimpes, `cf` réglages/leçon `cf.sea`, `cl` classes, `sh` Google Sheets). Vidéos dans IndexedDB `esc`.
- Code enseignant : `cf.pin` (défaut 1234) ; mode prof `S.T`.
- Google Sheets : POST `no-cors` en `text/plain` vers `apps-script/Code.gs` (`doPost` : ajout/mise à jour par `id` en dernière colonne, suppressions `del`) ; test et vérification de réception par JSONP (`doGet?ids=…` → `have`) : une grimpe ne quitte `SH.q` qu'une fois lue dans la feuille (`r.rx=1`). Script v3 (`VERSION`, `v` dans les réponses) : colonnes rangées par titre, colonnes manquantes ajoutées avant `id` ; l'appli n'envoie `SH_HEAD3`/`shRow3` (avec la cordée) que si `SH.v>=3`, sinon l'ancien format `SH_HEAD` (16 colonnes). **Jamais de prénoms** : `anon()` = hash(clé | classe | prénom), stable entre tablettes ; ou prénom + initiale.
- **Pas de noms d'élèves dans le dépôt public** : la version publiée a `const CL0=null;`. La version privée de l'enseignant (fichier local) peut intégrer sa classe dans `CL0`.
- Interface et textes en français, tutoiement des élèves.
