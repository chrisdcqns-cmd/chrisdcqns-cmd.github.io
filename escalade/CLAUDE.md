# Escalade EPS — notes pour Claude

Application web pour tablette (escalade en moulinette, lycée), hébergée sur GitHub Pages : `escalade/index.html` contient tout (HTML + CSS + JS, aucune bibliothèque externe : lecture/écriture .xlsx et QR codes faits main).

- Parcours : 🔒 Leçon du jour (classe, critères `CRIT` cochés/obligatoires, objectif) → accueil → Renseigner une grimpe (prénom → corde → couleur → confirmation → critères) → Mes résultats / Cotation / Thématiques.
- Vocabulaire : le numéro est celui de la **corde** ; chaque corde porte plusieurs **voies** de couleur (`WDEF` : cotations par corde).
- Hauteur : 0 = 1re dégaine non dépassée, 1–8 = dernière dégaine dépassée, 9 = Top (`TOP`). Voie réussie = Top. Valeur non choisie = `''`.
- Stockage `localStorage` avec le préfixe `escalade.` (clés `c` contenu, `w` cotations, `r` grimpes, `cf` réglages/leçon `cf.sea`, `cl` classes, `sh` Google Sheets). Vidéos dans IndexedDB `esc`.
- Code enseignant : `cf.pin` (défaut 1234) ; mode prof `S.T`.
- Google Sheets : POST `no-cors` en `text/plain` vers `apps-script/Code.gs` (`doPost` : ajout/mise à jour par `id` en dernière colonne, suppressions `del`) ; test par JSONP. **Jamais de prénoms** : `anon()` = hash(clé | classe | prénom), stable entre tablettes ; ou prénom + initiale.
- **Pas de noms d'élèves dans le dépôt public** : la version publiée a `const CL0=null;`. La version privée de l'enseignant (fichier local) peut intégrer sa classe dans `CL0`.
- Interface et textes en français, tutoiement des élèves.
