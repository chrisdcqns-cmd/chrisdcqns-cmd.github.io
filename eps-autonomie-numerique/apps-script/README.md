# EPS – Autonomie et Numérique : script commun

Ce script Google transporte entre les tablettes ce qui est **commun à toutes les applications** :
réglages communs (établissement, enseignant, année, équipe…), dispenses, listes d'élèves, et les données d'Escalade quand elle passe par le partage commun.

Il est indépendant des scripts propres à une application :
- `relais/apps-script/Code.gs` : Relais Vitesse (courses, synchro de Relais) — **rien à changer** ;
- `danse/apps-script/Code.gs` : Danse (auto-positionnements des élèves).

Tout est **chiffré sur la tablette** avec la clé secrète : la feuille ne contient aucun nom lisible.

## Installation (une seule fois, environ 5 minutes)

1. Sur Google Drive : **Nouveau → Google Sheets**, nommée par exemple « EPS – partage commun ».
2. Dans la feuille : **Extensions → Apps Script**, efface le code proposé et colle tout le contenu de [`Code.gs`](Code.gs).
3. Ligne `const SECRET = 'CHANGE-MOI';` : mets une clé secrète de ton choix (au moins 12 caractères au hasard, sans espace) et garde-la.
4. Enregistre, puis **Déployer → Nouveau déploiement** : type **Application Web**, exécuter en tant que **Moi**, accès **Tout le monde** → **Déployer** → autorise l'accès avec ton compte.
5. Copie l'**URL de l'application Web** (elle se termine par `/exec`).
6. Indique l'adresse dans `eps-home.js` (`DEF_URL`) : elle est alors **préremplie sur toutes les tablettes** (c'est fait pour le script actuel).
7. **Première tablette** : page d'accueil → 🔒 Enseignant → carte « Listes d'élèves » → **⚙ Partage entre tablettes** : tape la clé → **Enregistrer**.
8. **Autres tablettes** : sur la première, rouvre ⚙ Partage entre tablettes → **📲 Régler une autre tablette** : un QR code s'affiche. Scanne-le avec l'appareil photo de l'autre tablette (ou envoie-toi le lien), puis tape ton code enseignant : c'est réglé. Ce QR code contient la clé secrète : ne le montre pas aux élèves.

Les dispenses, listes et réglages déjà présents sur la tablette sont **renvoyés automatiquement** vers le nouveau script ; les autres tablettes les récupèrent dès qu'elles sont réglées à leur tour. Une version plus récente n'est jamais écrasée par une plus ancienne.

Relais Vitesse garde son propre script : la tablette conserve son réglage Relais (s'il n'était pas saisi dans Relais, il est recopié depuis l'ancien partage au moment où tu enregistres le nouveau).

## Bon à savoir

- Si tu modifies le code : **Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version → Déployer** (l'URL ne change pas).
- L'ancienne feuille (celle de Relais) peut garder ses anciens enregistrements de partage : ils ne servent plus aux autres applications.

## Appel AS (mise à jour du script, une seule fois)

L'application **Appel AS** lit et coche le fichier d'appel de l'association sportive (un autre Google Sheets, que ton compte peut modifier). Seules des **cases à cocher déjà présentes** peuvent être modifiées : le script n'écrit rien d'autre dans ce fichier.

1. Ouvre la feuille « EPS – partage commun » → **Extensions → Apps Script**.
2. Remplace tout le code par le nouveau contenu de [`Code.gs`](Code.gs) — **garde ta ligne `const SECRET = '…';`** telle quelle.
3. Enregistre (💾), choisis la fonction **`autoriserAppelAS`** dans la liste en haut, clique **▶ Exécuter** et accepte l'autorisation (« Afficher, modifier, créer et supprimer toutes vos feuilles de calcul Google Sheets » : c'est ce qui permet d'ouvrir le fichier d'appel).
4. **Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version → Déployer** (l'adresse ne change pas).
5. Dans l'application : ⚙️ Réglages → « Lien du fichier d'appel de l'association sportive » (ou directement dans Appel AS au premier lancement).

Structure reconnue automatiquement : un onglet par mois (l'onglet du mois en cours s'ouvre seul), une ligne d'en-tête juste au-dessus des cases (Prénom, Nom, Classe, puis une colonne par date) ; la colonne du jour (« ven. 20/11 ») est choisie automatiquement.

## ✨ Reformuler (Claude)
1. Propriétés du script (roue dentée « Paramètres du projet ») : `ANTHROPIC_KEY` = la clé créée sur platform.claude.com (jamais dans les applis ni dans le dépôt).
2. Colle ce `Code.gs`, enregistre, puis ▶ Exécuter `testerClaude` une fois : Google demande l'autorisation « se connecter à un service externe » ; le journal affiche un commentaire reformulé.
3. Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer (même adresse /exec).
Les applis envoient seulement les notes de l'enseignant, l'activité et les degrés (jamais le nom de l'élève). Modèle : `CLAUDE_MODEL` (Claude Haiku 5.5).

## 🏸 Badminton : « Décris ta situation » et coach virtuel (Claude)
Même clé `ANTHROPIC_KEY`. Après avoir collé ce `Code.gs` et redéployé (nouvelle version), ▶ Exécuter `testerBadminton` une fois : le journal affiche le réglage d'une situation (JSON).
- « Décris ta situation » (Terrain & scoring, mode enseignant) : modèle `CLAUDE_MODEL_SIT` (Claude Sonnet 5.5), réponse structurée (outil `regler_situation`), validée par l'enseignant dans l'appli.
- Coach virtuel (tablette de terrain, élèves choisis par l'enseignant) : `CLAUDE_MODEL` (Haiku), statistiques anonymes seulement.
- Garde-fou : 300 demandes par heure au plus (`quota_`).

## 📝 Fiches de leçon (Claude)

Les fiches de leçon (toutes les applis d'activité) utilisent aussi la clé `ANTHROPIC_KEY` : rien de plus à créer.
- Après avoir collé le nouveau `Code.gs` : **Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer** (la même adresse reste valable).
- Les PDF et les photos déposés dans « 📂 Mes documents » sont lus par Claude (9 Mo au plus par fichier ; coupe un gros PDF en plusieurs).
- Les brouillons de leçon utilisent le modèle `CLAUDE_MODEL_LECON` (en haut de la partie « Leçons » du script), plus précis pour un travail long ; les reformulations courtes gardent `CLAUDE_MODEL`.
- Aucun nom d'élève n'est envoyé à Claude : seulement tes documents et tes fiches de leçon.
