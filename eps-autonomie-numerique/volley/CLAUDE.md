# Volley-ball — notes de l'appli

- Charte commune : `../CLAUDE.md`. `index.html` est la source (repère `eps-source-directe`).
- 27/11/2026 : le 📡 tableau de bord de la leçon (`dashHtml`, onglet Classe → Équipes, `DBV`) est le seul écran de suivi (`window.epsCtlOwn`, pas de pilotage commun) : ✋ appels en tête, puis les 3 terrains dessinés (`EPSD.courts`, équipes de `T[n]`, score de `curMatch`), `volCt(n)` descend au détail du terrain (`.dbter[data-ter]`). `epsTabInfo().lieu` = terrain choisi par l'équipe (`jour(t).terrain`).
- Terrains dessinés : sous chaque terrain, les élèves de l'équipe partagée par le plan des terrains (`AR[n]` : 🟨 arbitre, 📋 marqueur), qui peut être répartie sur plusieurs terrains.
- Les 3 terrains sont dessinés à la verticale (`dispo:'vert'`), observateurs dessous.
- Terrains espacés sur la largeur (un par colonne de détail) ; 🚫 terrains fermés : `terOffV()` (bouton « 🏟 Terrains »), retirés du choix des équipes et du plan.
- 📡 onglet Suivi commun = tableau de bord de la leçon (`epsCtlOwn.on()` : onglet `equipes`, `DBV`, pas de fiche d'équipe ouverte) ; Classe → Équipes ouvre le tableau de bord replié.
- **28/11/2026 (fiche commune)** : `renderEval0` = fiche commune `M.ficheHtml` (choix AFL2 / AFL3, matchs, bonus en `extra` ; rôles et routines par `critInfo` ; points du degré par `degInfo` ; total en `foot`). `critHtml`, `setDeg(id,d)`, `setVal` ne sont plus appelés par la fiche.
- **28/11/2026 (bilan commun)** : `renderBilan` = page commune `M.bilanHtml` (exports et fiche PDF du volley gardés : QR de son auto-positionnement ; statistiques détaillées en `extra`). Matchs datés (`e.matchsD`), `resultats` / `resultat` de l'adaptateur.
