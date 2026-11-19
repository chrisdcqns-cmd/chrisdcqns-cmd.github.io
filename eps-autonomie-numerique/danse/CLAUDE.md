# Danse EPS — notes pour Claude

Application web pour tablette (danse, CA3, lycée), hébergée sur GitHub Pages : `danse/index.html` contient tout. Les 3 premiers `<script>` sont des bibliothèques intégrées pour le hors ligne (pdf-lib, JSZip, générateur QR de Kazuhiko Arase) ; le 4e est le code de l'application (lisible) ; le 5e charge `../eps-home.js`.

- Données dans `localStorage`, clé `danse-eps-v1` : `{reglages, grilleNom, criteres:[{id:'afl1'|'afl2'|'afl3', court, titre, sous, titreEleve, d:[4 textes enseignant], e:[4 textes élève], poids}], classes:[{id,nom,eleves:[{id,nom,prenom,groupeId,ev:{afl1:{d,pos}},comm,statut,auto}],groupes:[{id,nom,theme}]}], classeId, obs:[…]}`.
- Grilles prêtes : `GRILLES.origine` (Additio 12/4/4 ; AFL1 = composer **et danser** : mémorisation, concentration, présence, `grilleV: 2` met à jour les tablettes) et `GRILLES.court` (cycle court 10/5/5).
- Points : bandeaux des degrés en % (`reglages.bandes`, D1 0-25, D2 25-50, D3 50-75, D4 75-100) ; `pos` (0-1) = position dans le bandeau ; au clic, valeur Additio exacte (`def` : 15/45/75/100 %), le curseur se cale au 0,25 pt (`nSteps`). Note /20 = somme ramenée sur 20, arrondi `reglages.arrondi`.
- Code enseignant : le même que les autres applis (`relais-vitesse-code-v1`, `eps.teach.until`, pavé `epsPin`). Vues enseignant (`TEACH`) : evaluation, bilan, classe, reglages. Vues élève sans code : observation, procedes, eleve.
- Auto-positionnement : seulement si `reglages.autoOuvert` et date ≤ `reglages.autoJusqua`. Lien nominatif `…/danse/#eleve=<base64url de [nom, prénom, classe, grille, AAAAMMJJ]>` (QR + lien cliquable sur le PDF élève). Sur un autre appareil, l'élève obtient un code `DANSE1.<base64url>` à coller dans « Classe & auto-positionnement ».
- PDF élève : `pageEleve()` (paysage, ajuste la taille du texte), récapitulatif `recapBytes()`, zip `Danse_<classe>_<jj-mm-aaaa>.zip`.
- Interface et textes en français, tutoiement des élèves. Aucun nom d'élève dans le dépôt public.
