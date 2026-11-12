# Relais Vitesse EPS — notes pour Claude

Application web pour tablette (relais-vitesse, lycée), hébergée sur GitHub Pages : `relais/index.html` contient tout (HTML + CSS + JS + image de la piste en WebP base64).

- Parcours : classes (import .xls/.xlsx/.ods/.csv via SheetJS cdnjs) → leçon du jour datée → groupes → accueil de leçon (vitesse cible) → enregistrer les courses.
- Données dans `localStorage`, clé `relais-vitesse-data-v3` : `{classes:[{id,name,eleves,groupes,lecons,courses,curg}],cur,lecon}`. Réglages par leçon dans `lecon.cfg` (`DEFCFG`).
- Code enseignant : hash dans `relais-vitesse-code-v1`, déverrouillage 10 min ; les éléments `.teach` ne sont visibles qu'avec `body.teach-on`.
- Zones cliquables sur l'image : `IMGZONES` (pourcentages de largeur) : Hors zone, Zone 100, Zone 10, Zone 1. Diagnostic par zone : `DIAG`.
- Google Sheets : réglages `relais-vitesse-sheets-v1` (url, clé, format des noms, file d'attente). Envoi `fetch` POST `no-cors` en `text/plain` vers `apps-script/Code.gs` (`doPost` : ajout/mise à jour par identifiant `cid`, suppressions) ; test par JSONP (`doGet?callback=`). **Jamais de noms** : code anonyme `anonCode()` ou prénom + initiale.
- **Pas de noms d'élèves dans le dépôt public** : la version publiée a `const ORIG=[];`.
- Interface et textes en français, tutoiement des élèves.
