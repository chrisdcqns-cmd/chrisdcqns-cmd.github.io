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
6. **Sur chaque tablette** : page d'accueil → 🔒 Enseignant → carte « Listes d'élèves » → **⚙ Partage entre tablettes** : colle l'adresse et la clé → **Enregistrer**.

Les dispenses, listes et réglages déjà présents sur la tablette sont **renvoyés automatiquement** vers le nouveau script ; les autres tablettes les récupèrent dès qu'elles sont réglées à leur tour. Une version plus récente n'est jamais écrasée par une plus ancienne.

Relais Vitesse garde son propre script : la tablette conserve son réglage Relais (s'il n'était pas saisi dans Relais, il est recopié depuis l'ancien partage au moment où tu enregistres le nouveau).

## Bon à savoir

- Si tu modifies le code : **Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version → Déployer** (l'URL ne change pas).
- L'ancienne feuille (celle de Relais) peut garder ses anciens enregistrements de partage : ils ne servent plus aux autres applications.
