# OrienRun EPS — mode d'emploi

Application de course d'orientation pour l'EPS. Un seul lien sert à tout :
- **Espace enseignant** (tablette) : carte, balises à QR code, parcours, suivi en direct et résultats ;
- **Espace élève** (téléphone) : départ, scan des balises, chrono, position GPS envoyée toutes les 20 s, bouton SOS.

| Fichier | Rôle |
|---|---|
| `index.html` | toute l'application |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | rendent l'appli installable et utilisable sans internet |
| `apps-script/Code.gs` | le petit serveur Google (Google Sheet) qui transmet les positions des élèves à ta tablette |

---

## 1. Mettre l'application en ligne (GitHub Pages)

Même principe que l'appli acrosport :
1. Sur GitHub, crée un dépôt **Public** nommé `orientation`, puis envoie **tout le contenu** de ce dossier (`index.html` à la racine).
2. **Settings → Pages** → *Deploy from a branch* → `main` / `(root)` → **Save**.
3. L'adresse sera : `https://TON-PSEUDO.github.io/orientation/`

> L'appli doit être ouverte depuis cette adresse **https** : c'est obligatoire pour que les téléphones autorisent le GPS et la caméra.

## 2. Activer le suivi en direct (Google Sheet)

1. Sur Google Drive, crée une **Google Sheet** vide nommée « OrienRun – suivi ».
2. **Extensions → Apps Script**, efface tout et colle le fichier `apps-script/Code.gs`.
3. Remplace `change-moi` par **ton mot de passe enseignant**. Enregistre.
4. **Déployer → Nouveau déploiement** → ⚙ **Application Web** → *Exécuter en tant que* : **Moi** ; *Qui a accès* : **Tout le monde** → **Déployer** → autorise l'accès.
5. Copie l'URL qui finit par `/exec`.
6. Dans l'appli : **Espace enseignant** (code `eps` la première fois) → **⚙ Réglages** → colle l'URL → **Tester la connexion** → **Enregistrer**. Entre aussi **ton numéro de portable** (secours SMS).
   Ensuite, l'espace enseignant demande ton mot de passe du script.

Sans script, l'appli fonctionne quand même : les élèves t'envoient leurs résultats par **SMS**, et tu les colles dans l'appli.

## 3. Préparer la séance (à faire une fois par lieu)

**🗺 Carte**
- **Charger ma carte** : photo, scan ou PDF de ta carte (plan du lycée, carte du parc…), ou feuille blanche.
- Dessine avec les **symboles officiels** (ISOM 2017-2 / ISSprOM 2019 simplifiés) : chemins, clôtures, bâtiments, végétation, eau, rochers, zone interdite… Touche des points, puis **✓ Terminer**.
- Pose **Départ ▲**, **Balises ○** et **Arrivée ◎**. Avec l'outil *Choisir / déplacer*, tu peux déplacer, renuméroter ou supprimer.
- **Point GPS (calage)** : touche un endroit de la carte, va sur place et **mesure ta position**. Fais-le pour au moins **3 points bien répartis** (coins de la carte). L'appli « déforme » la carte entre ces points : les élèves sont placés au bon endroit **même si ta carte n'est pas à l'échelle**. La précision estimée s'affiche en bas à gauche.

**🚩 Balises**
- **Nouvelle balise ici (GPS)** : sur le terrain, pose-toi à l'endroit de la balise. La position est mesurée pendant 10 ou 30 s (moyenne), avec un **lien Google Maps**. Enchaîne avec **＋ Balise suivante**.
- Une balise placée sur la carte **et** géolocalisée sert aussi de point de calage.
- **Imprimer les balises** : drapeau orange et blanc, grand numéro, **QR code** et **code de contrôle** (3 lettres) au cas où le QR ne passe pas. Plastifie-les.
- **Fiche de pose / ramassage** : liste avec coordonnées et QR Google Maps pour retrouver chaque balise.

**〰 Parcours**
- **En ordre imposé** (circuit), **dans le désordre**, ou **au score** (points par balise, temps limite, pénalité par minute de retard).
- Option : **l'élève choisit lui-même ses balises** (avec un nombre imposé ou non).
- Option : **je confirme chaque balise sur ma tablette** (validation par l'enseignant).
- Option : **dire tout de suite à l'élève si sa balise est juste ou fausse**. Par défaut, elle est désactivée : l'élève voit seulement « balise enregistrée », et c'est toi qui lui envoies la notification « juste » ou « fausse ».
- **🖨 Carte** : carte A4 du parcours avec la surimpression violette et la liste des postes.

## 4. Pendant la séance

1. **📡 Séance live → Lancer la séance**, puis **🔳 QR de départ** : affiche ou imprime le QR de chaque parcours.
2. Les élèves scannent ce QR avec l'**appareil photo** du téléphone : l'appli s'ouvre sur le parcours. Ils entrent leur nom et leur classe, autorisent la localisation, puis **DÉPART**.
3. À chaque balise, ils touchent **📷 Scanner** (ou tapent le numéro et le code). Le chrono, la prochaine balise et les temps intermédiaires s'affichent.
4. Sur ta tablette, en direct :
   - la **position de chaque élève** (toutes les 20 s) avec sa trace, sur **ta carte** ou sur fond **🛰 satellite** ;
   - pour chaque élève : balises trouvées, **temps intermédiaires**, cumul, distance à vol d'oiseau et distance réellement parcourue (GPS), vitesse, allure, temps arrêté, erreurs d'ordre ou de code ;
   - les **alertes SOS** (sonnerie, bandeau rouge, lien vers la position) ;
   - en touchant un élève : sa **fiche** (temps, balises, distance, vitesse, allure, temps arrêté, dernier signal, précision GPS, batterie), **sa trace sur la carte**, et l'envoi d'un **message** (messages rapides, accusé « lu ») ;
   - **✓ Juste / ✕ Fausse** sur chaque balise scannée : l'élève reçoit la notification sur son téléphone ;
   - **✏ Corriger les balises** (à l'arrivée, avec l'élève) : touche une balise pour l'ajouter ou l'enlever ;
   - **📢 Rappel général** : tous les téléphones affichent « Retour au point ! » (vibration + son). Les élèves répondent « J'arrive » puis **« J'y suis »**, et tu vois qui est revenu ;
   - **💬 Message à tous**.
5. **Pas de réseau ?** Le téléphone garde tout et renvoie dès que la connexion revient. L'élève peut aussi toucher **📩 Envoyer par SMS** : il t'envoie un message qui commence par `OR1;`. Copie-le dans **✉ Importer SMS**. Le SOS propose aussi l'envoi par SMS et l'appel.

**Conseils aux élèves** : garder l'appli ouverte et l'écran allumé (le GPS s'arrête quand le téléphone se verrouille) ; utiliser de préférence le bouton **Scanner** de l'appli plutôt que l'appareil photo.

## 5. Après la séance

**🏁 Résultats** : classement par parcours, temps intermédiaires de chaque balise. Exports **Excel**, **CSV** et **positions GPS** (avec liens Google Maps), impression.
**⚙ Réglages → Exporter le projet** : sauvegarde de la carte, des balises et des parcours dans un fichier, pour une autre tablette ou un collègue.

## Données personnelles
Seuls le nom tapé par l'élève, sa classe et ses positions **pendant la course** sont enregistrés, dans **ta** Google Sheet. Ta carte, tes balises et tes parcours restent dans ta tablette. Pour faire de la place, supprime les anciennes lignes de l'onglet *Evenements* (ou lance la fonction `purgerAnciennesSeances` dans Apps Script).

## Mise à jour du script
Si tu avais déjà installé une version précédente de `Code.gs`, recolle le nouveau fichier dans Apps Script, puis **Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version** (l'URL ne change pas).
