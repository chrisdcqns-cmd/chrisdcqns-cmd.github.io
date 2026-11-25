# CO – Évaluation — notes de l'appli

- 📄 « Enregistrer en PDF » (fiche bilan d'un parcours et bilan complet) : `bilanPdf` fabrique le PDF sur le téléphone (pdf-lib `../vendor`, mis en cache par `sw.js`), textes des cartes + carte avec tracé (image + SVG dessinés sur un canvas), puis partage (`navigator.share` avec fichier) ou téléchargement. « 🖨 Imprimer » reste à côté : sur téléphone / appli installée, l'impression ne s'ouvre souvent pas.
