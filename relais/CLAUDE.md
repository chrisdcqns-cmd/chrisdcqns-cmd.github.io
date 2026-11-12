# Relais Vitesse EPS — notes pour Claude

Application web pour tablette (relais-vitesse, lycée), hébergée sur GitHub Pages : `relais/index.html` contient tout (HTML + CSS + JS + image de la piste en WebP base64).

- Parcours : classes (import .xls/.xlsx/.ods/.csv via SheetJS cdnjs) → leçon du jour datée → groupes → accueil de leçon (vitesse cible) → enregistrer les courses.
- Données dans `localStorage`, clé `relais-vitesse-data-v3` : `{classes:[{id,name,eleves,groupes,lecons,courses,curg}],cur,lecon}`. Réglages par leçon dans `lecon.cfg` (`DEFCFG`).
- Code enseignant : hash dans `relais-vitesse-code-v1`, déverrouillage 10 min ; les éléments `.teach` ne sont visibles qu'avec `body.teach-on`.
- Zones cliquables sur l'image : `IMGZONES` (pourcentages de largeur) : Hors zone, Zone 100, Zone 10, Zone 1. Diagnostic par zone : `DIAG`.
- Google Sheets : réglages `relais-vitesse-sheets-v1` (url, clé, format des noms, file d'attente). Envoi `fetch` POST `no-cors` en `text/plain` vers `apps-script/Code.gs` (`doPost` : ajout/mise à jour par identifiant `cid`, suppressions) ; test et **vérification de réception** par JSONP (`doGet?ids=…&callback=` → `have`) : une course ne quitte la file `SH.queue` qu'une fois lue dans la feuille (`c.rx=1`). **Jamais de noms** : code anonyme `anonCode()` ou prénom + initiale.
- **Pas de noms d'élèves dans le dépôt public** : la version publiée a `const ORIG=[];`.
- Interface et textes en français, tutoiement des élèves.
- Groupes par leçon : `lecon.groupes` (copie des groupes habituels `classe.groupes` à l'ouverture, `ensureLeconGroups`). `GR()` renvoie les groupes de la leçon en cours, ou de la leçon consultée (`ctxLecon()`, vue « bilan »). Fiche groupe : case « Appliquer aussi aux prochaines leçons » → `applyGroups(op)` modifie la leçon en cours, et si coché les groupes habituels + les leçons déjà préparées (`futureLecons`). Roue crantée de la classe : élèves et groupes habituels (`DATA.lecon=null`). Leçon passée : « ✏️ Groupes de cette leçon » puis « 👥 Reformer les groupes ».
- Ouverture côté élève : `startStudent()` ouvre la leçon du jour (vue élève) ou l'écran d'attente `v-wait` (bouton « Espace enseignant »). `TEACH_VIEWS` (classes, import, lecons, bilan) demandent le code dans `go()`. « 👟 Mode élève » sur la page des classes reverrouille. Liste des vitesses : options de modification en `.teach`.
