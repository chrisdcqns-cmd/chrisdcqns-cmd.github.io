# Volley-ball — notes de l'appli

- Charte commune : `../CLAUDE.md`. `index.html` est la source (repère `eps-source-directe`).
- 27/11/2026 : le 📡 tableau de bord de la leçon (`dashHtml`, onglet Classe → Équipes, `DBV`) est le seul écran de suivi (`window.epsCtlOwn`, pas de pilotage commun) : ✋ appels en tête, puis les 3 terrains dessinés (`EPSD.courts`, équipes de `T[n]`, score de `curMatch`), `volCt(n)` descend au détail du terrain (`.dbter[data-ter]`). `epsTabInfo().lieu` = terrain choisi par l'équipe (`jour(t).terrain`).
- Terrains dessinés : sous chaque terrain, les élèves de l'équipe partagée par le plan des terrains (`AR[n]` : 🟨 arbitre, 📋 marqueur), qui peut être répartie sur plusieurs terrains.
- Les 3 terrains sont dessinés à la verticale (`dispo:'vert'`), observateurs dessous.
- Terrains espacés sur la largeur (un par colonne de détail) ; 🚫 terrains fermés : `terOffV()` (bouton « 🏟 Terrains »), retirés du choix des équipes et du plan.
