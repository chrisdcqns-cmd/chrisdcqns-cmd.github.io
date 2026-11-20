# Danse EPS — script Google des auto-positionnements

Ce script reçoit les auto-positionnements envoyés par les élèves depuis le lien de leur bilan PDF.
Il est **indépendant** du script commun (Relais, dispenses, listes) : il a sa propre feuille et sa propre clé.

Les positionnements arrivent **chiffrés** : la feuille ne contient aucun nom lisible. Seules les tablettes réglées avec la clé secrète peuvent les lire.

## Installation (une seule fois, environ 5 minutes)

1. Sur Google Drive : **Nouveau → Google Sheets**. Nomme la feuille par exemple « Danse EPS – auto-positionnements ».
2. Dans la feuille : **Extensions → Apps Script**.
3. Efface le code proposé et colle tout le contenu de [`Code.gs`](Code.gs).
4. Ligne `const SECRET = 'CHANGE-MOI';` : remplace `CHANGE-MOI` par une clé secrète de ton choix (au moins 12 caractères, sans espace). **Garde-la** : elle sera demandée dans Danse.
5. Enregistre (icône disquette), puis **Déployer → Nouveau déploiement** :
   - Type : **Application Web** (roue dentée à côté de « Sélectionner le type »)
   - Exécuter en tant que : **Moi**
   - Qui peut accéder : **Tout le monde**
   - **Déployer**, puis **Autoriser l'accès** avec ton compte Google (« Paramètres avancés → Accéder à … » si Google affiche un avertissement : c'est ton propre script).
6. Copie l'**URL de l'application Web** (elle se termine par `/exec`).
7. Dans Danse, sur chaque tablette où tu génères les bilans : **Réglages → Envoi automatique** : colle l'URL et la clé secrète, puis **Tester la connexion**.

C'est tout : génère ensuite les bilans PDF (auto-positionnement autorisé), le lien de chaque élève saura où envoyer.

## Bon à savoir

- Si tu modifies le code du script : **Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version → Déployer** (l'URL ne change pas).
- Si tu changes la clé secrète ou l'URL, les liens des bilans déjà distribués ne fonctionnent plus : régénère les bilans.
- En fin de cycle : **Réglages → Envoi automatique → Vider les dépôts** (les positionnements déjà relevés restent dans Danse sur la tablette).
- Les élèves n'ont pas besoin de compte Google.
- **Volley-ball utilise le même script** : rien à installer de plus. Volley reprend l'adresse et la clé réglées dans Danse sur la même tablette (ou celles saisies dans Volley > Bilan & export > Auto-positionnement). Ses dépôts (clés `dan|vb…`) sont ignorés par Danse, et inversement.
