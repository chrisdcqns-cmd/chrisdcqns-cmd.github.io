/* Cross-training · bases enrichies (28/11/2026, demande de l'enseignant à partir de la ressource « Le crosstraining au lycée »,
   FPC académie de Lyon 2019, recoupée avec des sources en ligne). Chargé AVANT le script de index.html : ne fait que déclarer
   window.CTP (données + vues) ; les fonctions utilisent les variables de index.html (S, $, h, rendre, stLd, stPut, lancerGC…)
   au moment de l'appel seulement. Tout ce qui est ajouté ici peut être supprimé / remis dans ⚙ Réglages → 🗂 Contenus
   (liste « off » du magasin partagé ct.v1 → cfg.off, suivie par toutes les tablettes).
   Choix de l'enseignant : bancs, élastiques, medicine balls, kettlebells de 6 kg au plus, cordes ; ni haltérophilie,
   ni gymnastique avancée, ni yoga ; leçons de 1 h 30 de pratique ; séquence de 8 leçons. */
(function () {
"use strict";
const X = (id, dossier, en, fr, o, p, secu, niv) => Object.assign({ id, dossier, en, fr, famille: "G", mesure: "reps", qte: 10, impact: "faible", themes: ["R"], prim: [], sec: [],
  paser: { P: p[0], A: p[1], S: p[2], E: p[3], R: p[4] }, secu, niveaux: niv.map(n => ({ nom: n[0], consigne: n[1], rep: n[2], norep: n[3] })) }, o);

/* ======================= 20 EXERCICES (échelle simple, du plus facile au plus dur) ======================= */
const EXOS = [
X("gainagelat", "Gainage lateral", "Side plank", "Gainage latéral", { mesure: "temps", qte: 20, prim: ["Obliques", "Transverse"], sec: ["Épaules", "Fessiers"] },
  ["Coude sous l'épaule, corps de profil.", "Bassin haut, corps en ligne droite.", "Même durée des deux côtés.", "Respirer régulièrement, sans bloquer.", "Immobile pendant toute la durée."],
  "Épaule au-dessus du coude ; arrêter si l'épaule fait mal.",
  [["Genou au sol", "Sur le coude et le genou du bas, bassin monté. 20 s par côté.", "Épaule, hanche et genou alignés, tenus.", "Bassin qui redescend ou qui recule."],
   ["Jambes tendues", "Sur le coude et le bord du pied, corps droit. 30 s par côté.", "Corps en ligne de la tête aux pieds, tenu.", "Bassin qui tombe, fesses en arrière."],
   ["Jambe du dessus levée", "Gainage latéral jambes tendues, jambe du dessus levée. 30 s par côté.", "Alignement tenu, jambe décollée.", "Jambe qui se repose, bassin qui tourne."]]),
X("birddog", "Bird-dog", "Bird-dog", "Planche une main un genou", { qte: 12, echauffement: true, prim: ["Lombaires", "Fessiers"], sec: ["Transverse", "Épaules"] },
  ["À quatre pattes, mains sous les épaules, genoux sous les hanches.", "Bras et jambe à l'horizontale.", "Alterner droite et gauche.", "Souffler en allongeant.", "Lent : 2 s pour monter, 2 s pour revenir."],
  "Dos plat : ne pas creuser le bas du dos en levant la jambe.",
  [["Lever un bras", "À quatre pattes, tendre un bras devant, alterner.", "Bras à l'horizontale, bassin immobile.", "Bassin qui tourne, dos qui se creuse."],
   ["Bras et jambe opposés", "Tendre un bras et la jambe opposée, tenir 2 s, alterner.", "Bras et jambe à l'horizontale 2 s, dos plat.", "Jambe trop haute, bassin qui penche."],
   ["Coude et genou sous le corps", "Bras et jambe opposés tendus, puis coude et genou se touchent sous le corps.", "Extension complète puis contact coude-genou.", "Pas de contact, perte d'équilibre."]]),
X("donkey", "Donkey kick", "Donkey kick", "Extension de jambe arrière", { qte: 16, prim: ["Fessiers"], sec: ["Ischio-jambiers", "Lombaires"] },
  ["À quatre pattes, dos plat.", "Monter le pied vers le plafond, genou plié à 90°.", "Même nombre de chaque côté.", "Souffler en montant.", "Monter en 1 s, redescendre en 2 s."],
  "Le bas du dos ne se creuse pas : c'est la fesse qui travaille.",
  [["Pied sous la hanche", "Monter le genou plié sans dépasser la hauteur du bassin.", "Cuisse qui recule nettement, dos immobile.", "Petit mouvement, dos qui bouge."],
   ["Pied à hauteur de hanche", "Monter jusqu'à avoir la cuisse dans le prolongement du buste.", "Cuisse alignée avec le buste.", "Cuisse sous l'horizontale."],
   ["Pied au-dessus de la hanche", "Monter le pied au-dessus du bassin, tenir 1 s.", "Pied plus haut que le bassin, 1 s tenue, dos plat.", "Dos creusé pour monter plus haut."]]),
X("bicyclette", "Bicyclette", "Bicycle crunch", "Bicyclette", { qte: 20, themes: ["R", "M"], prim: ["Abdominaux", "Obliques"], sec: ["Fléchisseurs de hanche"] },
  ["Sur le dos, mains aux tempes, bas du dos au sol.", "Coude vers le genou opposé.", "Alterner droite et gauche.", "Souffler à chaque rotation.", "Rythme régulier, sans à-coups."],
  "Ne pas tirer sur la nuque ; bas du dos collé au sol.",
  [["Lente, pieds qui se posent", "Un genou monte, le coude opposé va vers lui, le pied se repose.", "Épaule décollée, coude vers le genou.", "Seuls les bras bougent."],
   ["Épaules décollées", "Pédaler sans reposer les pieds, épaules décollées.", "Pieds décollés, coude vers le genou opposé.", "Pieds qui se posent, épaules au sol."],
   ["Jambes tendues", "La jambe libre se tend près du sol à chaque rotation.", "Jambe tendue décollée + coude vers le genou.", "Jambe qui retombe, bas du dos décollé."]]),
X("relevejambes", "Releves de jambes", "Leg raise", "Relevés de jambes", { qte: 12, prim: ["Abdominaux", "Fléchisseurs de hanche"], sec: ["Transverse"] },
  ["Sur le dos, mains le long du corps, bas du dos au sol.", "Jambes à la verticale puis près du sol.", "Les deux jambes ensemble.", "Souffler en montant.", "Descente lente (3 s)."],
  "Si le bas du dos se décolle, plier les genoux ou réduire l'amplitude.",
  [["Genoux pliés", "Ramener les genoux pliés au-dessus des hanches, reposer les pieds.", "Genoux au-dessus des hanches, dos au sol.", "Dos qui se décolle."],
   ["Une jambe après l'autre", "Jambes tendues à la verticale, en descendre une près du sol, alterner.", "Jambe tendue près du sol, sans la poser.", "Jambe pliée, dos décollé."],
   ["Deux jambes tendues", "Descendre les deux jambes tendues près du sol puis remonter.", "Jambes tendues à 10 cm du sol, dos au sol.", "Pieds posés, dos creusé."]]),
X("mollets", "Mollets debout", "Calf raise", "Mollets debout", { qte: 15, prim: ["Mollets"], sec: [] },
  ["Debout, pieds parallèles, mains en appui léger si besoin.", "Monter le plus haut possible sur la pointe.", "Poids réparti sur les deux pieds.", "Souffler en montant.", "Monter en 1 s, descendre en 2 s."],
  "Chevilles dans l'axe : ne pas rouler sur le bord du pied.",
  [["Deux pieds", "Monter sur la pointe des deux pieds, redescendre.", "Talons décollés au maximum.", "Petite amplitude, rebond."],
   ["Deux pieds, 2 s tenues", "Monter, tenir 2 s en haut, redescendre lentement.", "2 s tenues en haut.", "Pas de maintien."],
   ["Un pied", "Sur un seul pied, l'autre décollé.", "Montée complète sur un pied.", "Pied libre qui aide, amplitude réduite."]]),
X("hrpu", "Hand release push-up", "Hand-release push-up", "Pompe mains relâchées", { qte: 8, themes: ["R", "M"], prim: ["Pectoraux", "Triceps"], sec: ["Épaules", "Transverse", "Dorsaux"] },
  ["Mains sous les épaules, corps gainé.", "Poitrine posée au sol, bras tendus en haut.", "Pousser des deux bras en même temps.", "Souffler en poussant.", "Poser, décoller les mains, pousser."],
  "Corps en bloc : le bassin monte avec les épaules.",
  [["Sur les genoux", "Poser la poitrine, décoller les mains du sol, pousser sur les genoux.", "Mains décollées + bras tendus, corps aligné.", "Mains qui restent au sol, bassin qui traîne."],
   ["Sur les pieds", "Poser la poitrine, décoller les mains, pousser sur les pieds.", "Mains décollées + corps qui monte en bloc.", "Corps qui ondule."],
   ["Mains et pieds décollés", "Au sol, décoller mains et pieds 1 s, reposer, pousser.", "Mains et pieds décollés + poussée en bloc.", "Un seul appui décollé."]]),
X("pompedeclinee", "Pompe declinee", "Decline push-up", "Pompe pieds surélevés", { qte: 8, prim: ["Pectoraux", "Épaules"], sec: ["Triceps", "Transverse"] },
  ["Mains un peu plus larges que les épaules.", "Poitrine près du support ou du sol.", "Coudes à 45° du corps.", "Souffler en poussant.", "Descente 2 s, poussée dynamique."],
  "Banc stable et calé ; corps gainé, sans creuser le dos.",
  [["Mains surélevées", "Mains sur un banc ou contre un mur, pieds au sol.", "Poitrine près du banc puis bras tendus.", "Amplitude réduite, bassin cassé."],
   ["Pieds sur une marche", "Pieds sur une marche basse, mains au sol.", "Poitrine près du sol, corps aligné.", "Fesses en l'air."],
   ["Pieds sur un banc", "Pieds sur un banc, mains au sol.", "Poitrine près du sol, corps aligné.", "Dos creusé, amplitude réduite."]]),
X("fentemarchee", "Fente marchee", "Walking lunge", "Fente marchée", { mesure: "distance", qte: 1, themes: ["R", "M"], prim: ["Quadriceps", "Fessiers"], sec: ["Ischio-jambiers", "Adducteurs"] },
  ["Buste droit, regard devant.", "Genou arrière près du sol.", "Un pas à droite, un pas à gauche.", "Souffler en remontant.", "Avancer sans s'arrêter, sans se précipiter."],
  "Genou avant au-dessus du pied, il ne rentre pas vers l'intérieur.",
  [["Petit pas", "Avancer en fentes sur 10 m, revenir en marchant.", "Genou arrière sous le niveau du genou avant.", "Pas trop court, buste penché."],
   ["Genou près du sol", "Avancer en fentes sur 10 m, genou arrière qui frôle le sol.", "Genou arrière à 5 cm du sol.", "Genou trop haut."],
   ["Bras tendus en haut", "Fentes sur 15 m, bras tendus au-dessus de la tête.", "Genou près du sol + bras tendus.", "Bras qui redescendent, buste penché."]]),
X("talonsfesses", "Talons-fesses", "Butt kicks", "Talons-fesses", { famille: "M", qte: 30, impact: "moyen", themes: ["C"], echauffement: true, prim: ["Ischio-jambiers", "Mollets"], sec: ["Quadriceps"] },
  ["Buste droit, légèrement penché en avant.", "Le talon vient toucher la fesse.", "Alterner droite et gauche.", "Respiration régulière.", "Sur l'avant du pied."],
  "Sol non glissant ; rester sur l'avant du pied.",
  [["En marchant", "Marcher sur place en amenant le talon à la fesse.", "Talon près de la fesse.", "Talon à mi-hauteur."],
   ["En courant sur place", "Courir sur place, talons aux fesses.", "Talon qui touche ou frôle la fesse.", "Genoux qui montent devant."],
   ["Fréquence maximale", "Le plus vite possible, bras actifs.", "Hauteur gardée à fréquence maximale.", "La fréquence monte, les talons baissent."]]),
X("sautgroupe", "Saut groupe", "Tuck jump", "Saut groupé", { famille: "M", qte: 8, impact: "fort", themes: ["C", "M"], prim: ["Quadriceps", "Fessiers", "Mollets"], sec: ["Abdominaux", "Fléchisseurs de hanche"] },
  ["Pieds largeur de hanches, bras en arrière.", "Genoux à hauteur de hanches en l'air.", "Décollage et réception sur les deux pieds.", "Souffler à l'impulsion.", "Réception amortie, sans bruit."],
  "Réception genoux fléchis, sur sol souple si possible ; arrêter si la technique se dégrade.",
  [["Avec sursaut", "Un saut groupé, un petit sursaut, un saut groupé.", "Genoux qui montent, réception amortie.", "Réception jambes tendues."],
   ["Sans sursaut", "Sauts groupés enchaînés sans sursaut.", "Genoux à hauteur de hanches à chaque saut.", "Genoux bas, temps d'arrêt."],
   ["Genoux à la poitrine", "Sauts enchaînés, genoux le plus haut possible.", "Genoux au-dessus des hanches, réception silencieuse.", "Hauteur qui baisse, réception bruyante."]]),
X("fentebulgare", "Fente bulgare", "Bulgarian split squat", "Fente bulgare", { qte: 10, prim: ["Quadriceps", "Fessiers"], sec: ["Ischio-jambiers", "Adducteurs"] },
  ["Pied avant à plat, buste droit.", "Genou arrière près du sol.", "Même nombre de chaque côté.", "Souffler en remontant.", "Descente 2 s, remontée contrôlée."],
  "Banc calé ; le genou avant reste au-dessus du pied.",
  [["Pied arrière au sol", "En position de fente, pieds fixes, descendre et remonter.", "Genou arrière près du sol puis jambes tendues.", "Genou trop haut, buste penché."],
   ["Pied arrière sur une marche", "Pied arrière posé sur une marche basse.", "Cuisse avant à l'horizontale.", "Amplitude réduite."],
   ["Pied arrière sur un banc", "Pied arrière posé sur un banc.", "Cuisse avant à l'horizontale, équilibre tenu.", "Appui sur le pied arrière, déséquilibre."]]),
X("echelle", "Echelle de rythme", "Agility ladder", "Échelle de rythme", { famille: "M", mesure: "distance", qte: 2, impact: "moyen", themes: ["C"], echauffement: true, prim: ["Mollets", "Quadriceps"], sec: ["Fléchisseurs de hanche"] },
  ["Sur l'avant du pied, regard devant.", "Un appui net dans chaque case.", "Départ pied droit puis pied gauche.", "Respiration régulière.", "Appuis brefs et réguliers."],
  "Échelle à plat ou lignes tracées à la craie ; ne pas regarder ses pieds en fin de passage.",
  [["Un appui par case", "Traverser l'échelle, un pied par case.", "Un appui dans chaque case, sans toucher les barreaux.", "Case sautée, barreau touché."],
   ["Deux appuis par case", "Deux pieds dans chaque case, l'un après l'autre.", "Deux appuis par case.", "Un seul appui, barreau touché."],
   ["Latéral, entrée-sortie", "De profil : deux pieds dedans, deux pieds dehors.", "Entrée-sortie dans chaque case.", "Case sautée."],
   ["Avec montées de genoux", "Deux appuis par case, genoux à hauteur de hanches.", "Genoux hauts + deux appuis par case.", "Genoux bas."]]),
X("boxjump", "Box jump", "Box jump", "Saut sur banc", { materiel: "BANC", famille: "M", qte: 10, impact: "fort", themes: ["C", "M"], prim: ["Quadriceps", "Fessiers", "Mollets"], sec: ["Ischio-jambiers"] },
  ["Face au banc, pieds largeur de hanches.", "Debout, hanches tendues, sur le banc.", "Décollage et réception sur les deux pieds.", "Souffler à l'impulsion.", "Descendre en pas, jamais en sautant en arrière."],
  "Banc calé contre un mur ou tenu ; pieds entiers sur le banc ; descente en pas.",
  [["Montée en pas", "Monter un pied puis l'autre, se redresser, redescendre.", "Debout hanches tendues sur le banc.", "Buste penché, pas de redressement."],
   ["Saut, descente en pas", "Sauter à deux pieds sur le banc, descendre en pas.", "Deux pieds entiers sur le banc + hanches tendues.", "Talons dans le vide, pas de redressement."],
   ["Saut stabilisé", "Sauter, tenir 2 s debout sur le banc, descendre en pas.", "Réception silencieuse + 2 s tenues.", "Déséquilibre, réception bruyante."],
   ["Sauts enchaînés", "Enchaîner les sauts, descente en pas rapide.", "Chaque saut redressé, rythme régulier.", "Redressement oublié."]]),
X("dips", "Dips sur banc", "Bench dip", "Dips sur banc", { materiel: "BANC", qte: 10, prim: ["Triceps"], sec: ["Pectoraux", "Épaules"] },
  ["Mains sur le bord du banc, doigts vers l'avant, dos près du banc.", "Coudes à 90° en bas, bras tendus en haut.", "Descendre droit, coudes vers l'arrière.", "Souffler en poussant.", "Descente 2 s."],
  "Ne pas descendre plus bas que coudes à 90° : l'épaule ne doit pas faire mal.",
  [["Jambes pliées, demi-amplitude", "Pieds près du banc, descendre à mi-chemin.", "Coudes pliés à 45° puis bras tendus.", "Fesses qui s'éloignent du banc."],
   ["Jambes pliées, coudes à 90°", "Pieds près du banc, descendre jusqu'à 90°.", "Coudes à 90° puis bras tendus.", "Amplitude réduite."],
   ["Jambes tendues", "Jambes tendues, talons au sol.", "Coudes à 90° puis bras tendus.", "Jambes qui poussent."],
   ["Jambes tendues, 2 s en bas", "Jambes tendues, tenir 2 s en bas.", "2 s tenues à 90°.", "Pas de maintien."]]),
X("tirageelas", "Tirage elastique", "Band row", "Tirage à l'élastique", { materiel: "ELAS", qte: 12, prim: ["Dorsaux"], sec: ["Épaules", "Transverse"] },
  ["Élastique fixé à hauteur de poitrine (espalier, poteau) ou tenu par un partenaire.", "Mains jusqu'aux côtes, bras tendus au retour.", "Tirer des deux côtés pareil.", "Souffler en tirant.", "Tirer en 1 s, revenir en 2 s."],
  "Vérifier l'attache et l'état de l'élastique ; ne jamais le lâcher tendu.",
  [["Deux mains, peu tendu", "Debout, tirer les deux mains vers les côtes.", "Coudes derrière le buste, épaules basses.", "Épaules qui montent, buste qui recule."],
   ["Élastique tendu, 2 s tenues", "Reculer d'un pas, tenir 2 s coudes en arrière.", "2 s tenues, omoplates serrées.", "Pas de maintien."],
   ["Un bras", "Tirer d'une main, l'autre sur la hanche.", "Coude derrière le buste, bassin de face.", "Buste qui tourne."],
   ["Un bras, pieds joints", "Un bras, pieds joints : le tronc résiste à la rotation.", "Bassin et épaules de face.", "Rotation du tronc."]]),
X("ecarteelas", "Ecarte elastique", "Band pull-apart", "Écarté à l'élastique", { materiel: "ELAS", qte: 12, echauffement: true, prim: ["Épaules", "Dorsaux"], sec: [] },
  ["Debout, élastique tenu bras tendus devant, mains largeur d'épaules.", "Écarter jusqu'à toucher la poitrine.", "Les deux bras s'écartent en même temps.", "Souffler en écartant.", "Écarter en 1 s, revenir en 2 s."],
  "Bras à hauteur de poitrine ; ne pas lâcher l'élastique tendu.",
  [["Petite amplitude", "Écarter les mains de 30 cm, revenir.", "Bras tendus, épaules basses.", "Coudes pliés."],
   ["Jusqu'à la poitrine", "Écarter jusqu'à ce que l'élastique touche la poitrine.", "Contact avec la poitrine, bras tendus.", "Amplitude incomplète."],
   ["2 s tenues", "Tenir 2 s bras écartés.", "2 s tenues, omoplates serrées.", "Pas de maintien."],
   ["Prise plus serrée", "Mains plus proches : l'élastique est plus dur.", "Contact poitrine, bras tendus.", "Coudes pliés, dos cambré."]]),
X("thruster", "Thruster", "Thruster", "Squat + développé", { materiel: "MB", famille: "M", qte: 10, impact: "moyen", themes: ["M", "C"], prim: ["Quadriceps", "Fessiers", "Épaules"], sec: ["Triceps", "Transverse"] },
  ["Ballon contre la poitrine, coudes hauts.", "Squat puis bras tendus au-dessus de la tête.", "Pousser des deux bras.", "Souffler en poussant le ballon.", "L'élan des jambes lance le ballon : un seul mouvement."],
  "Dos neutre en bas, sans cambrer en haut ; medicine ball léger.",
  [["Demi-squat, 2 kg", "Demi-squat puis ballon au-dessus de la tête.", "Bras tendus en haut, talons au sol.", "Bras pliés en haut."],
   ["Squat complet, 2 kg", "Squat complet puis ballon au-dessus de la tête.", "Pli de hanche sous le genou + bras tendus.", "Squat trop haut."],
   ["Squat complet, 3 kg", "Même mouvement, ballon de 3 kg.", "Pli de hanche sous le genou + bras tendus.", "Dos arrondi, arrêt entre squat et poussée."],
   ["Squat complet, 4 kg", "Même mouvement, ballon de 4 kg.", "Profondeur + bras tendus, mouvement continu.", "Cambrure en haut."]]),
X("pushpress", "Push press", "Push press", "Développé avec élan des jambes", { materiel: "MB", qte: 10, themes: ["R", "M"], prim: ["Épaules", "Triceps"], sec: ["Quadriceps", "Transverse"] },
  ["Debout, ballon contre la poitrine, pieds largeur de hanches.", "Bras tendus, ballon au-dessus de la tête.", "Pousser des deux bras.", "Souffler en poussant.", "Petite flexion des jambes puis poussée."],
  "Ventre serré : ne pas cambrer en haut.",
  [["Sans charge", "Geste seul, mains jointes.", "Flexion des jambes puis bras tendus.", "Pas de flexion des jambes."],
   ["2 kg", "Avec un ballon de 2 kg.", "Bras tendus au-dessus de la tête.", "Bras devant la tête."],
   ["3 kg", "Avec un ballon de 3 kg.", "Bras tendus, oreilles dégagées.", "Dos cambré."],
   ["4 kg", "Avec un ballon de 4 kg.", "Bras tendus, ventre serré.", "Dos cambré, bras pliés."]]),
X("twistmb", "Twist russe ballon", "Weighted Russian twist", "Rotation russe avec ballon", { materiel: "MB", qte: 20, prim: ["Obliques", "Abdominaux"], sec: ["Fléchisseurs de hanche"] },
  ["Assis, buste incliné, dos droit, ballon devant la poitrine.", "Ballon posé au sol de chaque côté.", "Tourner autant à droite qu'à gauche.", "Souffler à chaque rotation.", "Rotation contrôlée, sans lancer."],
  "Dos droit : ce sont les épaules qui tournent, pas seulement les bras.",
  [["Pieds au sol, 2 kg", "Talons posés, ballon au sol de chaque côté.", "Ballon qui touche le sol de chaque côté.", "Seuls les bras bougent."],
   ["Pieds décollés, 2 kg", "Pieds décollés du sol.", "Pieds décollés + ballon au sol.", "Pieds qui se posent."],
   ["Pieds décollés, 3 kg", "Pieds décollés, ballon de 3 kg.", "Pieds décollés + ballon au sol.", "Dos arrondi."],
   ["À 2, dos à dos", "Assis dos à dos, se passer le ballon d'un côté puis de l'autre.", "Passe donnée de main à main, des deux côtés.", "Ballon lancé, dos qui s'arrondit."]])
];

/* ======================= 27 WOD (charges et volumes allégés pour le lycée) =======================
   items : [exercice, niveau, quantité, options] · options : g = groupe d'une même minute (EMOM), fixe = quantité qui ne suit pas l'échelle
   ech : échelle « 21-15-9 » (mêmes répétitions pour tous) ou « x1-x2-x3 » (quantité × n) · duo : répartition du travail à 2 */
const W = (id, nom, mat, theme, format, params, items, note, o) => Object.assign({ id, nom, mat, theme, format, params, items, note }, o || {});
const WODS = [
W("p1", "21-15-9 lycée", ["PC"], "M", "echelle", { cap: 10 }, [["burpee", 1, 21], ["fente", 2, 21], ["squat", 2, 21]], "WOD test : à refaire en fin de séquence pour mesurer ses progrès.", { ech: "21-15-9", test: 1, origine: "Évaluation, exemple 1" }),
W("p2", "Échelle montante", ["PC"], "M", "montante", { minutes: 10, pas: 1 }, [["pompe", 1, 2], ["squat", 2, 2], ["situp", 2, 2]], "2 répétitions de chaque, puis 3, puis 4… Score : le dernier palier terminé.", { origine: "Évaluation, exemple 2, choix 1" }),
W("p3", "15-10-5 navette", ["PC"], "C", "echelle", { cap: 10 }, [["burpee", 1, 15], ["fente", 2, 15], ["squat", 2, 15], ["navette", 1, 2, { fixe: 1 }]], "2 allers-retours de navette après chaque série.", { ech: "15-10-5", origine: "Évaluation vécue au stage" }),
W("p4", "Trois tours dehors", ["PC"], "C", "fortime", { tours: 3, cap: 12 }, [["navette", 1, 5], ["squat", 2, 20], ["pompe", 1, 10]], "Dehors : 250 m de course à la place des 5 allers-retours.", { ext: 1, origine: "WOD en extérieur" }),
W("p5", "Death by burpees", ["PC"], "M", "deathby", { minutes: 12, pas: 1 }, [["burpee", 1, 3]], "3 burpees la première minute, puis un de plus chaque minute. Score : la dernière minute réussie.", { origine: "Partie Metcon" }),
W("p6", "Échelle ×3", ["PC"], "M", "echelle", { cap: 12 }, [["jumpingjack", 2, 20], ["squat", 2, 10], ["hrpu", 1, 5]], "Trois paliers : 20-10-5, puis 40-20-10, puis 60-30-15.", { ech: "x1-x2-x3", origine: "For Time niveau 2 (4 paliers ramenés à 3)" }),
W("p7", "Défi A", ["PC"], "C", "fortime", { tours: 1, cap: 6 }, [["russiantwist", 1, 40], ["grimpeur", 2, 40], ["echelle", 1, 4]], "Défi chrono en trio : 1 juge-chronométreur, 2 pratiquants ; 3 passages (en même temps, moitié-moitié, libre).", { duo: "libre", origine: "Mini-WOD A du stage" }),
W("p8", "21-15-9 matériel", ["MB", "BANC"], "M", "echelle", { cap: 10 }, [["wallball", 2, 21], ["pompe", 1, 21], ["boxjump", 1, 21]], "Une ligne au mur par élève ; banc calé.", { ech: "21-15-9", origine: "For Time niveau 1" }),
W("p9", "Échelle montante ballon", ["MB"], "M", "montante", { minutes: 10, pas: 1 }, [["thruster", 2, 2], ["hrpu", 1, 2], ["relevejambes", 2, 2]], "Ballon de 2 à 3 kg.", { origine: "Évaluation, exemple 2, choix 2" }),
W("p10", "Échelle montante banc", ["BANC", "KB"], "M", "montante", { minutes: 10, pas: 1 }, [["boxjump", 1, 2], ["dips", 2, 2], ["swing", 2, 2]], "Kettlebell de 4 à 6 kg.", { origine: "Évaluation, exemple 2, choix 3" }),
W("p11", "EMOM swing-burpee", ["KB"], "C", "emom", { minutes: 10 }, [["burpee", 1, 6, { g: 1 }], ["swing", 2, 6, { g: 1 }], ["navette", 1, 2, { g: 2 }]], "Minutes impaires : 6 burpees + 6 swings ; minutes paires : 2 allers-retours.", { origine: "EMOM niveau 1" }),
W("p12", "1-3-5", ["KB", "MB"], "M", "amrap", { minutes: 7, cible: 8 }, [["kbdeadlift", 2, 1], ["pompe", 1, 3], ["wallball", 2, 5]], "Court et intense : garder des répétitions valides.", { origine: "AMRAP niveau 2" }),
W("p13", "Trio kettlebell", ["KB", "CORDE", "ELAS", "BANC"], "M", "fortime", { tours: 3, cap: 12 }, [["swing", 2, 15], ["squat", 2, 20], ["corde", 3, 50], ["tirageelas", 2, 10], ["boxjump", 1, 10]], "Sans élastique : 10 pompes à la place des tirages.", { origine: "« TDM »" }),
W("p14", "EMOM 6-6-6", ["MB", "BANC"], "R", "emom", { minutes: 8 }, [["pushpress", 2, 6, { g: 1 }], ["wallball", 2, 6, { g: 1 }], ["boxjump", 1, 6, { g: 1 }]], "Les trois exercices chaque minute ; le reste de la minute = repos.", { origine: "« Barbie WOD » (10 kg ramenés à 3 kg)" }),
W("p15", "EMOM trois minutes", ["MB", "BANC"], "R", "emom", { minutes: 9 }, [["burpee", 1, 5, { g: 1 }], ["dips", 2, 10, { g: 1 }], ["wallball", 2, 10, { g: 2 }], ["grimpeur", 2, 10, { g: 2 }], ["hrpu", 1, 10, { g: 3 }], ["planche", 2, 20, { g: 3 }]], "Trois minutes différentes qui tournent, 3 fois.", { origine: "« Jens »" }),
W("p16", "Death by trio", ["MB", "KB"], "M", "deathby", { minutes: 10, pas: 1 }, [["burpee", 1, 3], ["wallball", 2, 3], ["goblet", 2, 3]], "3 de chaque la première minute, puis 4, puis 5…", { origine: "« On the WOD again »" }),
W("p17", "Grand tour", ["MB", "KB"], "M", "amrap", { minutes: 10, cible: 2 }, [["ours", 2, 1], ["wallball", 2, 15], ["navette", 1, 5], ["fentemarchee", 1, 1], ["bicyclette", 2, 30], ["kbdeadlift", 2, 15]], "Dehors : 250 m de course à la place de la navette.", { ext: 1, origine: "« Takanas » (charges allégées)" }),
W("p18", "Défi B", ["MB", "BANC"], "R", "fortime", { tours: 1, cap: 6 }, [["hrpu", 1, 16], ["fentebulgare", 1, 16], ["wallball", 2, 16]], "Défi chrono en trio : 1 juge-chronométreur, 2 pratiquants ; 3 passages.", { duo: "libre", origine: "Mini-WOD B du stage" }),
W("p19", "Défi C", ["BANC", "CORDE"], "C", "fortime", { tours: 1, cap: 6 }, [["boxjump", 1, 20], ["dips", 1, 16], ["corde", 3, 80]], "Défi chrono en trio : 1 juge-chronométreur, 2 pratiquants ; 3 passages.", { duo: "libre", origine: "Mini-WOD C du stage" }),
W("p20", "Duo complice", ["MB"], "R", "emom", { minutes: 12 }, [["pompe", 1, 10], ["burpee", 1, 10], ["twistmb", 4, 10], ["wallball", 2, 10]], "À 2, face à face : on se tape dans la main à chaque pompe et à chaque burpee ; rotations dos à dos ; wall ball chacun son tour.", { duo: "meme", origine: "« Friendly »" }),
W("p21", "Duo en parallèle", ["CORDE", "BANC"], "M", "fortime", { tours: 3, cap: 15 }, [["pompe", 1, 10], ["corde", 3, 40], ["boxjump", 1, 10], ["dips", 1, 10]], "Chacun son exercice, puis on échange : pompes / corde, corde / sauts sur banc, sauts sur banc / dips, dips / pompes.", { duo: "para", origine: "« Help us »" }),
W("p22", "Relais d'équipe", ["KB", "BANC"], "M", "fortime", { tours: 1, cap: 15 }, [["swing", 2, 60], ["boxjump", 1, 60], ["hrpu", 1, 60]], "Équipe de 2 à 4 : un seul travaille à la fois, on se répartit les 60 répétitions.", { duo: "tour", origine: "« HIT the WOD jack » (100 ramenés à 60)" }),
W("p23", "Duo longue distance", ["KB", "CORDE", "ELAS"], "M", "fortime", { tours: 1, cap: 15 }, [["navette", 2, 1], ["swing", 2, 20], ["corde", 3, 100], ["tirageelas", 2, 30], ["squat", 2, 60], ["jumpingjack", 2, 100]], "À 2, on se répartit le travail comme on veut.", { duo: "libre", origine: "« The Givors WOD »" }),
W("p24", "Duo moitié-moitié", ["MB", "BANC"], "M", "fortime", { tours: 1, cap: 12 }, [["wallball", 2, 40], ["pushpress", 2, 40], ["grimpeur", 2, 60], ["hrpu", 1, 40], ["boxjump", 1, 20]], "À 2 : chacun fait la moitié de chaque exercice.", { duo: "moitie", origine: "« Mickie » (volumes divisés par 2)" }),
W("p25", "Une minute chacun", ["KB", "BANC", "MB"], "C", "emom", { minutes: 10 }, [["dips", 1, 15], ["swing", 2, 15], ["jumpingjack", 2, 40], ["fente", 3, 30], ["twistmb", 2, 40]], "À 2 : l'un travaille pendant 1 min, l'autre trottine, puis on change.", { duo: "tour", origine: "« Mickiki »" }),
W("p26", "Adapté · bas du corps seul", ["BANC", "KB"], "M", "montante", { minutes: 10, pas: 1 }, [["boxjump", 1, 2], ["goblet", 2, 2], ["navette", 1, 2]], "Pour un élève gêné au haut du corps (bras, épaule, poignet).", { adapt: "bas", origine: "Évaluation adaptée, choix 1" }),
W("p27", "Adapté · haut du corps seul", ["ELAS"], "M", "montante", { minutes: 10, pas: 1 }, [["pompe", 1, 2], ["tirageelas", 2, 2], ["russiantwist", 1, 2]], "Pour un élève gêné au bas du corps (cheville, genou).", { adapt: "haut", origine: "Évaluation adaptée, choix 2" })
];
const DUO = { meme: "à 2, en même temps", moitie: "à 2, moitié-moitié", tour: "à 2, à tour de rôle", para: "à 2, en parallèle puis on échange", libre: "à 2 ou 3, répartition libre" };

/* ======================= ÉCHAUFFEMENTS (12) · DÉFIS ET JEUX (7) · RETOUR AU CALME (6) ======================= */
const E = (ex, travail, repos) => ({ ex, travail, repos: repos || 0 });
const ECHAUF = [
 { id: "reveil", nom: "Réveil articulaire", type: "guide", eleve: 1, duree: 5, mat: "Aucun", texte: "Des chevilles à la nuque, puis trois mouvements lents de tout le corps.",
   chrono: { type: "seq", nom: "Réveil articulaire", tours: 1, recupTour: 0, ex: [], etapes: ["Chevilles : cercles", "Genoux : petites flexions", "Hanches : grands cercles", "Dos : enroulé puis déroulé", "Épaules : cercles de bras", "Nuque : oui, non, peut-être", "Chenille lente", "Squats lents", "Fentes avec rotation du buste", "Montées de genoux légères"].map(x => E(x, 26, 4)) } },
 { id: "troistours", nom: "Trois tours", type: "guide", eleve: 1, duree: 6, mat: "Aucun", texte: "3 tours : 30 jumping jacks, 5 flexions de buste dos plat, 5 squats, 5 pompes, 5 fentes par jambe.", src: ["Modèle de la ressource, sans barre"],
   chrono: { type: "seq", nom: "Trois tours", tours: 3, recupTour: 15, ex: [], etapes: [E("30 jumping jacks", 35, 5), E("5 flexions de buste, dos plat", 20, 5), E("5 squats", 15, 5), E("5 pompes", 15, 5), E("5 fentes par jambe", 20, 0)] } },
 { id: "tabata", nom: "Tabata d'échauffement", type: "guide", eleve: 1, duree: 4, mat: "Aucun", texte: "8 fois 20 s d'effort et 10 s de repos, en changeant d'exercice : jumping jacks, superman, montées de genoux, gainage creux. Intensité modérée : c'est un échauffement.",
   src: ["Routine de l'académie de Bordeaux", "https://ent2d.ac-bordeaux.fr/disciplines/eps/wp-content/uploads/sites/33/2020/03/Carnet-crossfit-home-routine-échauffement-1.pdf"],
   chrono: { type: "int", nom: "Tabata d'échauffement", travail: 20, repos: 10, stations: 1, tours: 8, recupTour: 0, ex: ["Jumping jacks", "Superman", "Montées de genoux", "Gainage creux"] } },
 { id: "elastique", nom: "Échauffement à l'élastique", type: "guide", eleve: 1, duree: 5, mat: "Élastiques", texte: "2 tours de 10 répétitions : tirages, écartés, rotations d'épaules, pas latéraux élastique au-dessus des genoux.",
   chrono: { type: "seq", nom: "Échauffement à l'élastique", tours: 2, recupTour: 20, ex: [], etapes: [E("10 tirages à l'élastique", 35, 5), E("10 écartés", 35, 5), E("10 rotations d'épaules, coudes au corps", 35, 5), E("10 pas latéraux, élastique au-dessus des genoux", 35, 0)] } },
 { id: "skill", nom: "Skill du jour décomposé", type: "spec", eleve: 1, duree: 8, mat: "Selon le skill", texte: "Le mouvement du jour, étape par étape : niveau 1, puis 2, puis 3. Par 2 : un athlète, un juge qui regarde les critères ✓ REP / ✗ NO REP de la fiche, puis on change. Exemples : burpee en 4 temps ; squat en quart, puis demi, puis complet." },
 { id: "roxanne", nom: "Roxanne", type: "musique", duree: 3, mat: "Enceinte", texte: "Sur le morceau « Roxanne » (The Police) : planche, squat tenu ou petit footing. À chaque fois que le prénom est chanté (26 fois), une pompe, un squat ou un burpee selon le niveau.",
   regles: ["Niveau 1 : squat ; niveau 2 : pompe sur les genoux ; niveau 3 : burpee.", "On peut passer au niveau du dessous en cours de route.", "On note jusqu'où on est allé pour faire mieux la prochaine fois."], src: ["Fit&Well", "https://www.fitandwell.com/exercise/strength-workouts/have-you-tried-the-roxanne-push-up-challenge-i-guarantee-itll-leave-a-smile-on-your-face-at-the-end-of-your-next-workout"] },
 { id: "sallyup", nom: "Sally up", type: "musique", duree: 3.5, mat: "Enceinte", texte: "Sur le morceau « Flower » (Moby) : on descend quand on entend « down », on remonte quand on entend « up », on tient la position entre les deux. 30 répétitions en 3 min 30.",
   regles: ["Niveau 1 : squat ; niveau 2 : pompe sur les genoux ; niveau 3 : pompe.", "Si on lâche, on reprend au signal suivant."], src: ["BarBend", "https://barbend.com/?p=24901"] },
 { id: "morpion", nom: "Morpion-relais", type: "jeu", duree: 6, mat: "9 cerceaux (ou craie), 3 chasubles par équipe", texte: "Deux équipes en relais posent leurs 3 objets dans une grille de 9 cases pour en aligner 3.",
   regles: ["2 équipes de 3 à 6, en colonne derrière une ligne, à 10 m de la grille.", "Un relayeur part poser un objet dans une case libre, revient taper dans la main du suivant.", "Quand les 3 objets sont posés, le relayeur en déplace un vers une case vide.", "La première équipe qui aligne 3 objets gagne ; l'équipe battue fait 5 squats."],
   variantes: "Déplacement imposé (pas chassés, marche de l'ours) ; grille plus loin ; 2 grilles pour 4 équipes.", src: ["USEP Lot-et-Garonne", "https://lotetgaronne.comite.usep.org/wp-content/uploads/sites/62/2022/09/relais-morpion.pdf"] },
 { id: "hippo", nom: "Hippo glouton", type: "jeu", duree: 6, mat: "Plots et balles au centre, 4 cerceaux", texte: "Quatre équipes aux coins ramènent dans leur camp le plus d'objets possible, un à la fois.",
   regles: ["Tous les objets au centre, une équipe par coin avec son cerceau.", "Un relayeur à la fois : il ramène un seul objet, le pose (sans le lancer), tape dans la main du suivant.", "Déplacement imposé à l'aller : marche de l'ours, fentes, pas chassés.", "Quand le centre est vide, l'équipe qui a le plus d'objets gagne."],
   variantes: "Manche 2 : on peut aussi aller prendre un objet chez les voisins.", src: ["Principe du jeu (Ville de Mississauga) ; relais et déplacements ajoutés", "https://www.mississauga.ca/wp-content/uploads/sites/5/2020/06/03141712/Hungry-Hungry-Humans-Game.pdf"] },
 { id: "oie", nom: "Jeu de l'oie", type: "jeu", duree: 8, mat: "Aucun : le plateau est dans l'appli", outil: "oie", texte: "Par équipes de 3 : on lance le dé, on avance, et toute l'équipe fait l'exercice de la case.",
   regles: ["Chaque équipe lance le dé à son tour.", "Toute l'équipe fait l'exercice de la case avant de relancer.", "La première équipe arrivée au bout gagne."], src: ["Collège Françoise Dolto, académie d'Amiens", "https://francoise-dolto-guise.ac-amiens.fr/spip/IMG/pdf/regles_du_jeu.pdf"] },
 { id: "ronde", nom: "La ronde", type: "jeu", duree: 5, mat: "Aucun", texte: "En cercle : chacun son tour propose un exercice de la bibliothèque, tout le monde le fait 20 s.",
   regles: ["Un meneur par exercice, on tourne dans le sens des aiguilles d'une montre.", "On ne propose pas deux fois de suite la même partie du corps.", "Intensité qui monte au fil du tour."] },
 { id: "chenille", nom: "La chenille", type: "jeu", duree: 5, mat: "Aucun", texte: "Footing en file indienne : le dernier remonte en tête en accélérant, puis annonce un exercice.",
   regles: ["Files de 5 à 6, allure de footing tranquille.", "Le dernier remonte la file en accélérant et prend la tête.", "Arrivé en tête, il annonce un exercice que toute la file fait 10 fois, puis on repart."] }
];
const DEFIS = [
 { id: "trio", nom: "Défi chrono en trio", duree: 15, mat: "Selon le mini-WOD", wods: ["p7", "p18", "p19"], texte: "1 juge-chronométreur, 2 pratiquants, 3 passages sur un mini-WOD.",
   regles: ["Passage 1 : les deux pratiquants font tout le mini-WOD en même temps.", "Passage 2 : moitié-moitié, on se partage chaque exercice.", "Passage 3 : répartition libre, chronométrée : battre le temps du passage 2.", "Le juge compte les ✓ REP et annonce les ✗ NO REP ; on tourne les rôles."], src: ["Ressource, lundi après-midi du stage"] },
 { id: "deathby", nom: "Death by du jour", duree: 12, mat: "Aucun", wods: ["p5", "p16"], texte: "Qui tient le plus de minutes ? Une répétition de plus chaque minute, jusqu'à ne plus finir dans la minute.",
   regles: ["Par 2 : un athlète, un juge, puis on change.", "Minute non terminée = fin du défi : on note la dernière minute réussie.", "Technique d'abord : une répétition non valable ne compte pas."], src: ["Ressource, partie Metcon"] },
 { id: "relais", nom: "Relais d'équipe", duree: 15, mat: "Kettlebells, bancs", wods: ["p22"], texte: "Un gros volume à se répartir : un seul travaille à la fois.",
   regles: ["Équipes de 2 à 4.", "On change quand on veut, en se tapant dans la main.", "Une répétition non valable est refaite."], src: ["Ressource, « HIT the WOD jack »"] },
 { id: "ninja", nom: "Parcours Ninja", duree: 15, mat: "Bancs, plinth, espaliers, tapis, ligne d'équilibre", texte: "Un parcours chronométré d'équilibre, d'agilité et de force.",
   regles: ["6 à 8 obstacles : passer sous un banc, marcher sur une ligne, franchir un plinth, traverser en marche de l'ours, slalom, suspension aux espaliers.", "Un passage de reconnaissance en marchant, puis deux passages chronométrés.", "Une pénalité de 5 s par obstacle raté ; on retient le meilleur temps."], variantes: "En relais par équipes de 3.", src: ["Ressource, mardi après-midi du stage"] },
 { id: "de", nom: "Dé du WOD", duree: 10, mat: "Aucun", outil: "de", texte: "L'appli tire au sort un exercice et une quantité dans la bibliothèque : on le fait, on relance.",
   regles: ["Par 2 ou 3, 6 tirages.", "On choisit son niveau ; le partenaire valide les répétitions."] },
 { id: "duel", nom: "Duel de juges", duree: 10, mat: "Aucun", texte: "Deux juges comptent le même athlète : le juge le plus juste marque le point.",
   regles: ["Par 3 : un athlète fait 15 répétitions d'un exercice, sans tout réussir exprès.", "Les deux juges comptent en silence les ✓ REP et les ✗ NO REP.", "On compare : même compte = 1 point chacun ; sinon l'athlète dit qui a raison, critères de la fiche à l'appui.", "On tourne les rôles."] },
 { id: "record", nom: "Record de classe", duree: 15, mat: "Selon le WOD", wods: ["p1"], texte: "Un WOD de référence refait dans la séquence : on affiche les progrès de chacun, pas un classement.",
   regles: ["Même WOD, mêmes niveaux qu'au premier essai.", "On compare son temps du jour à son premier temps.", "Record de classe = le plus grand nombre d'élèves qui progressent."], src: ["Ressource, notion de « benchmark »"] }
];
const CALME = [
 { id: "respiration", nom: "Respiration lente", duree: 2, texte: "Assis ou allongé, par le nez : inspiration et expiration comptées sur 4.",
   chrono: { type: "seq", calme: 1, muet: 2, nom: "Respiration lente", tours: 15, recupTour: 0, ex: [], etapes: [E("Inspire par le nez", 4), E("Expire lentement", 4)] } },
 { id: "contraction", nom: "Contraction-relâchement", duree: 2, texte: "Allongé : inspirer en contractant tous les muscles, relâcher d'un coup en soufflant. 3 fois.",
   chrono: { type: "seq", calme: 1, muet: 1, nom: "Contraction-relâchement", tours: 3, recupTour: 0, ex: [], etapes: [E("Respire calmement", 15), E("Inspire et contracte tout le corps", 6), E("Relâche d'un coup, souffle par la bouche", 15)] } },
 { id: "poupee", nom: "Poupée de chiffon", duree: 5, texte: "À 2 : l'un est allongé et complètement relâché, l'autre mobilise doucement ses articulations une à une (chevilles, genoux, hanches, épaules, poignets, nuque), puis on change.",
   chrono: { type: "seq", calme: 1, nom: "Poupée de chiffon", tours: 1, recupTour: 0, ex: [], etapes: [Object.assign(E("A est relâché, B mobilise ses articulations", 140, 15), { reposNom: "On change de rôle" }), E("B est relâché, A mobilise ses articulations", 140)] } },
 { id: "balayage", nom: "Balayage corporel", duree: 3, texte: "Allongé, yeux fermés : l'attention passe lentement des pieds à la tête, chaque zone se relâche.",
   chrono: { type: "seq", calme: 1, muet: 1, nom: "Balayage corporel", tours: 1, recupTour: 0, ex: [], etapes: ["Installe-toi, respire calmement", "Pieds et chevilles : ils deviennent lourds", "Mollets et genoux se relâchent", "Cuisses et bassin s'enfoncent dans le sol", "Ventre : il monte et descend tout seul", "Dos et épaules se posent", "Bras et mains : lourds, détendus", "Nuque, mâchoire et front se relâchent", "Tout le corps est détendu : reste immobile"].map(x => E(x, 20)) } },
 { id: "mobelas", nom: "Mobilité à l'élastique", duree: 4, texte: "Mouvements amples et lents avec l'élastique : épaules puis hanches.",
   chrono: { type: "seq", calme: 1, nom: "Mobilité à l'élastique", tours: 1, recupTour: 0, ex: [], etapes: ["Passages au-dessus de la tête, bras tendus", "Écartés lents devant la poitrine", "Écartés lents derrière la nuque", "Pas latéraux lents, élastique au-dessus des genoux", "Ouverture de hanche : genou vers l'extérieur, à droite", "Ouverture de hanche : genou vers l'extérieur, à gauche"].map(x => E(x, 35, 5)) } },
 { id: "balle", nom: "Automassage à la balle", duree: 4, texte: "Pression modérée et mouvements lents ; jamais sur une articulation ni sur une zone douloureuse. Effets modestes : c'est facultatif.",
   src: ["Wiewelhove et coll., 2019", "https://www.frontiersin.org/articles/10.3389/fphys.2019.00376/full"],
   chrono: { type: "seq", calme: 1, nom: "Automassage à la balle", tours: 1, recupTour: 0, ex: [], etapes: ["Mollet droit, balle au sol", "Mollet gauche, balle au sol", "Cuisse droite, dessus puis côté", "Cuisse gauche, dessus puis côté", "Fessiers, assis sur la balle", "Haut du dos, balle contre un mur"].map(x => E(x, 35, 5)) } }
];

/* ======================= CONNAISSANCES ======================= */
const LEXIQUE = [["WOD", "L'entraînement du jour"], ["Warm-up", "L'échauffement"], ["Skill", "L'habileté : le temps de travail technique"], ["Metcon", "La partie intense de la leçon"],
 ["AMRAP", "Le plus de tours possible dans le temps donné"], ["EMOM", "Chaque minute, au début de la minute"], ["For Time", "Le plus vite possible"], ["Tabata", "8 fois 20 s d'effort et 10 s de repos"],
 ["Death by", "Une répétition de plus chaque minute"], ["Time cap", "Le temps limite"], ["Round, set, rep", "Tour, série, répétition"], ["No rep", "Répétition non valable"],
 ["Scaler", "Adapter : choisir son niveau"], ["Benchmark", "Un WOD de référence, refait pour mesurer ses progrès"], ["PR", "Record personnel"], ["BW", "Poids du corps"], ["Team", "En équipe"], ["Box", "La salle"]];
const REGLES = ["La technique passe avant la vitesse : si mon geste se dégrade, je ralentis ou je baisse d'un niveau.", "Je choisis mon niveau ; adapter n'est pas tricher.", "Pas de mouvement difficile quand je suis très fatigué.",
 "Dos droit, genoux dans l'axe des pieds, talons au sol.", "Je descends aussi bas que je contrôle, pas plus.", "Je souffle pendant l'effort et je ne travaille jamais à charge maximale."];
const IDEES = [
 ["Le squat profond abîme les genoux", "Faux. Une revue de plus de 160 articles ne trouve pas de risque accru pour le genou ni pour le dos, si la technique est apprise sous supervision et la charge progressive.", "Hartmann et coll., 2013", "https://www.doi.org/10.1007/s40279-013-0073-6"],
 ["S'étirer évite les courbatures", "Faux. L'effet mesuré est d'environ 1 point sur 100 : on s'étire pour se détendre et entretenir sa souplesse.", "Revue Cochrane, 2011", "https://www.cochrane.org/CD004577/MUSCSK_stretching-to-prevent-or-reduce-muscle-soreness-after-exercise"],
 ["Les courbatures sont des nœuds dans le muscle", "Faux. C'est une douleur retardée après un effort inhabituel, maximale entre 24 et 72 h, qui disparaît en une semaine.", "Journal of Physiological Sciences, 2015", "https://pmc.ncbi.nlm.nih.gov/articles/PMC10716961"],
 ["Un Tabata, c'est n'importe quel 20 s / 10 s", "À nuancer. Le protocole d'origine se fait sur vélo, à une intensité qui épuise en 7 ou 8 répétitions. En EPS, on en reprend le format.", "Tabata, 2019", "https://pmc.ncbi.nlm.nih.gov/articles/pmid/31004287"],
 ["Le renforcement est dangereux à l'adolescence", "Faux s'il est encadré : charges légères d'abord, technique avant la charge, progression.", "NSCA, 2009", "https://dxpprod.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf"],
 ["Le travail intermittent intense n'est pas fait pour les lycéens", "Faux. Chez les 13-18 ans, l'effet est important sur l'endurance cardio-respiratoire.", "Costigan et coll., 2015", "https://ro.ecu.edu.au/ecuworkspost2013/6840/"]];
const SQUAT = ["Quatre profondeurs : partiel (genou à moins de 90°), demi-squat, profond (cuisses à l'horizontale), complet.", "La profondeur n'est pas dangereuse en soi sur une articulation saine : la limite est le moment où l'élève perd le contrôle du bassin ou des genoux.",
 "Repères à observer : talons au sol, genoux dans l'axe des pieds, dos neutre.", "Pour durcir sans charge : ralentir la descente (3 s) ou marquer 1 s en bas."];
const AFLMAP = [["Réaliser avec des gestes efficaces et une charge adaptée", "Part de ✓ REP validées par le juge, niveau choisi pour chaque exercice", "AFL1 · Produire"],
 ["Choisir des paramètres cohérents avec son mobile", "Mobile, forme, WOD conçu, durées et récupérations", "AFL1 · Produire"],
 ["Identifier ses ressentis et réguler", "Ressenti (0 à 10), FC, écart entre le score visé et le score réalisé, analyse « si… alors »", "AFL1 · Analyser"],
 ["S'entraîner dans la durée", "Carnet d'entraînement de la séquence, progrès entre les deux WOD tests", "AFL2"],
 ["Coopérer pour faire progresser", "Justesse du comptage (duel de juges), repères PASER du coach", "AFL3"]];
const PHRASES = ["Tu as fini ce que tu avais commencé.", "Un niveau bien fait vaut mieux qu'un niveau trop haut.", "Le progrès se voit dans ton carnet, pas dans celui du voisin.", "Chaque répétition valable compte.",
 "Aujourd'hui tu as fait mieux que si tu n'avais rien fait.", "La régularité bat l'exploit.", "Tu connais maintenant un peu mieux tes limites.", "Bien joué : note ce que tu changeras la prochaine fois."];
const QUALITES = ["force", "puissance", "vitesse", "endurance", "résistance", "agilité", "coordination", "équilibre", "précision", "souplesse"];
const Q = "squat:force,résistance;fente:force,équilibre;pompe:force,résistance;situp:résistance;planche:résistance,équilibre;hollow:force,équilibre;superman:résistance;pont:force;chaise:résistance;ours:coordination,agilité;shouldertap:équilibre,coordination;chenille:souplesse,coordination;russiantwist:résistance,coordination;jumpingjack:endurance,coordination;grimpeur:endurance,vitesse;burpee:endurance,puissance;montees:vitesse,endurance;navette:vitesse,agilité;patineur:agilité,équilibre;saut:puissance;wallball:puissance,précision;slam:puissance;mbclean:puissance,coordination;chestpass:puissance,précision;corde:coordination,endurance;cordecourse:coordination,endurance;doubleunder:coordination,vitesse;kbdeadlift:force;goblet:force;swing:puissance,endurance;kbclean:puissance,coordination;farmer:force,résistance;gainagelat:équilibre,résistance;birddog:équilibre,coordination;donkey:force;bicyclette:résistance,coordination;relevejambes:force;mollets:force;hrpu:force,résistance;pompedeclinee:force;fentemarchee:force,équilibre;talonsfesses:vitesse,endurance;sautgroupe:puissance;fentebulgare:force,équilibre;echelle:agilité,vitesse,coordination;boxjump:puissance,agilité;dips:force;tirageelas:force;ecarteelas:souplesse,résistance;thruster:puissance,endurance;pushpress:puissance;twistmb:résistance,coordination";
const QUAL = {}; Q.split(";").forEach(x => { const [k, v] = x.split(":"); QUAL[k] = v.split(","); });
const SPORTS = { "Volley-ball": ["puissance", "coordination"], "Badminton": ["agilité", "vitesse"], "Basket-ball": ["puissance", "agilité"], "Relais-vitesse": ["vitesse", "puissance"], "Escalade": ["force", "équilibre"], "Course d'orientation": ["endurance", "agilité"], "Danse": ["coordination", "équilibre"], "Acrosport": ["force", "équilibre"], "Step": ["endurance", "coordination"] };
const EXIGEANT = ["sautgroupe", "fentebulgare", "pompedeclinee", "doubleunder", "kbclean", "thruster", "boxjump", "hollow", "burpee", "hrpu"];
const DUREES = [15, 15, 35, 15, 10], TEMPS = ["Échauffement", "Skill du jour", "Mobile et WOD", "Défi ou jeu", "Retour au calme et carnet"];
const OPTS = [["charge", "Famille « H · charge »", "Filtre et pastille pour les exercices au kettlebell et au medicine ball"], ["diff", "Pastille de difficulté", "Point orange sur les exercices exigeants"],
 ["qual", "Qualités physiques et « pour mon sport »", "Étiquettes sur les fiches, filtre de la bibliothèque"], ["phrases", "Phrases de motivation", "Une phrase à la fin de chaque WOD"], ["plan", "Leçon en 5 temps", "Onglet « Leçon » de l'élève quand tu as rempli les temps de la leçon du jour"]];

/* ======================= Trame de séquence (fiches de leçon communes, en brouillon, sans situations) ======================= */
const L = (num, titre, objM, objMe, objS, but, ech, rem, bilan) => ({ num, titre, objM, objMe, objS, but, disp: "Par 2 ou 3 : un athlète, un juge (et un chronométreur). Chaque groupe a un téléphone ou une tablette avec l'appli.", mat: "Tapis, plots ; selon la leçon : bancs, élastiques, medicine balls, kettlebells, cordes.", ech, rem, bilan });
(window.EPS_TRAMES = window.EPS_TRAMES || []).push({ id: "ct-type-8", nom: "Cross-training · 8 leçons de 1 h 30 (trame sans situations)", voie: "gt", seq: "Cross-training terminale",
  sources: "ressource « Le crosstraining au lycée » (FPC académie de Lyon, 2019), adaptée ; référentiel national du CCF, champ d'apprentissage 5 (AFL1 Produire / Analyser, AFL2, AFL3) ; bases de l'appli Cross-training (échauffements, WOD, défis, retour au calme).",
  lecons: [
   L("1", "Découvrir les mouvements de base et le rôle de juge", "Réaliser 6 mouvements de base (squat, fente, pompe, gainage, burpee, jumping jack) à son niveau, avec amplitude.", "Lire une fiche d'exercice : niveaux, critères ✓ REP / ✗ NO REP.", "Tenir le rôle de juge : compter et annoncer les répétitions non valables.", "Vivre un premier WOD court (EMOM force, 8 min) en changeant de rôle.", "Réveil articulaire guidé (5 min), puis jeu de l'oie par équipes de 3.", "Défi chrono en trio sur un mini-WOD.", "Ce que j'ai appris sur mon niveau dans chaque mouvement."),
   L("2", "Se situer : WOD test n° 1", "Réaliser le WOD test « 21-15-9 lycée » avec des répétitions valables du début à la fin.", "Noter son temps et son ressenti dans le carnet.", "Juger sans complaisance le WOD de son partenaire.", "Avoir un premier repère chiffré à comparer en leçon 7.", "Trois tours guidés (6 min), puis Roxanne en musique.", "Duel de juges.", "Mon temps, mon ressenti, ce qui m'a limité : le souffle, les muscles ou la technique."),
   L("3", "Mobile Renforcement : sentir le muscle", "Enchaîner 12 à 15 répétitions avec amplitude, à un rythme contrôlé.", "Relier un exercice aux muscles qu'il sollicite.", "Coacher avec les repères PASER.", "Réaliser le circuit « Circuit complet » en ressentant le travail musculaire visé.", "Échauffement à l'élastique (5 min), puis morpion-relais.", "WOD à 2 « Duo complice ».", "Quels muscles ai-je sentis ? Combien de répétitions en réserve ?"),
   L("4", "Mobile Cardio : situer son effort avec la fréquence cardiaque", "Tenir des intervalles 30/30 puis 40/20 dans la zone visée.", "Prendre son pouls et situer sa zone d'effort.", "Chronométrer et relever la fréquence cardiaque de son partenaire.", "Rester dans la zone visée sur chaque bloc d'intervalles.", "Tabata d'échauffement (4 min), puis hippo glouton.", "Death by du jour.", "Mes fréquences cardiaques relevées et la zone où j'étais."),
   L("5", "Mobile Mental : tenir une allure fixée", "Tenir une allure régulière sur un AMRAP en échelle montante.", "Annoncer un score visé et comparer avec le score réalisé.", "Encourager et donner des repères de temps à son partenaire.", "Atteindre le palier annoncé avant de commencer.", "Réveil articulaire (5 min), puis Sally up en musique.", "Relais d'équipe.", "Écart entre le score visé et le score réalisé ; le mobile que je choisis pour la suite."),
   L("6", "Concevoir son WOD", "Réaliser le WOD que l'on a conçu, en gardant des répétitions valables.", "Choisir une forme, des exercices, des niveaux et des quantités cohérents avec son mobile.", "Conseiller son partenaire sur ses choix.", "Créer un WOD de 10 à 15 min dans la forme imposée par son mobile, le réaliser, l'ajuster.", "La ronde : chacun propose un exercice d'échauffement.", "Dé du WOD.", "Ce que je change dans mon WOD pour la prochaine fois, et pourquoi."),
   L("7", "Mesurer ses progrès et répéter l'épreuve", "Refaire le WOD test dans les mêmes conditions, puis réaliser son WOD personnel.", "Comparer ses deux tests ; utiliser son carnet pour régler son WOD.", "Tenir le rôle de coach comme le jour de l'évaluation.", "Battre son temps de la leçon 2 avec des répétitions valables, puis répéter son épreuve.", "Échauffement conçu par l'élève (10 min).", "Record de classe : combien d'élèves progressent ?", "Mon progrès entre les deux tests ; mes derniers réglages avant l'évaluation."),
   L("8", "Évaluation", "Réaliser son WOD personnel avec des gestes efficaces et une charge adaptée.", "Analyser sa séance : ressentis, fréquence cardiaque, régulations.", "Juger et conseiller son partenaire.", "Présenter et réaliser sa séance, puis coacher celle de son partenaire.", "Échauffement conçu par l'élève (10 min).", "", "Bilan de la séquence dans le carnet ; auto-positionnement.")
  ] });

/* ======================= OUTILS ======================= */
const cfg = () => { try { return stLd().items.cfg || {}; } catch (e) { return {}; } };
const offL = () => { const o = cfg().off; return Array.isArray(o) ? o : []; };
const isOff = k => offL().includes(k);
function setOff(k, v) { const c = Object.assign({}, cfg()), s = new Set(offL()); v ? s.add(k) : s.delete(k); c.off = [...s]; stPut("cfg", c); }
const opt = k => !isOff("opt:" + k);
const durees = () => { const d = cfg().durees; return Array.isArray(d) && d.length === 5 && d.every(x => +x >= 0) ? d.map(Number) : DUREES; };
const actifs = (L, pre) => L.filter(x => !isOff(pre + ":" + x.id));
const src = s => !s ? "" : `<p class="petit doux" style="margin:6px 0 0">Source : ${s[1] ? `<a href="${h(s[1])}" target="_blank" rel="noopener">${h(s[0])}</a>` : h(s[0])}</p>`;
const regles = o => (o.regles ? `<ul class="petit" style="margin:6px 0 0;padding-left:18px">${o.regles.map(r => `<li>${h(r)}</li>`).join("")}</ul>` : "") + (o.variantes ? `<p class="petit" style="margin:6px 0 0"><b>Variantes :</b> ${h(o.variantes)}</p>` : "");
const dureeTxt = c => c ? mmss(gcTot(c)) : "";
const TYPES = { guide: "Guidé au chrono", spec: "Spécifique", musique: "En musique", jeu: "Jeu" };
const familleDe = e => opt("charge") && ["KB", "MB"].includes(e.materiel) ? "H" : e.famille;
const qualOk = (e, v) => { if (!v) return true; const q = QUAL[e.id] || []; return v[0] === "s" ? (SPORTS[v.slice(2)] || []).some(x => q.includes(x)) : q.includes(v.slice(2)); };
function styles() { if (document.getElementById("ctp-css")) return; const s = document.createElement("style"); s.id = "ctp-css";
  s.textContent = ".cp-nav{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}.cp-row{display:flex;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--ligne)}.cp-row:first-of-type{border-top:0}.cp-row>div{flex:1;min-width:0}.cp-row.off>div{opacity:.45;text-decoration:line-through}.cp-row button{flex:none}" +
    ".cp-det{background:#fff;border:1px solid var(--ligne);border-radius:14px;margin:0 0 10px;padding:0 12px}.cp-det>summary{cursor:pointer;padding:12px 0;font-weight:700;list-style:none;display:flex;gap:8px;align-items:center}.cp-det>summary::-webkit-details-marker{display:none}.cp-det>summary small{font-weight:400;color:var(--doux);margin-left:auto}" +
    ".cp-oie{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.cp-oie div{border:1px solid var(--ligne);border-radius:10px;padding:6px;font-size:12px;background:#fff;min-height:54px;position:relative}.cp-oie div b{display:block;color:var(--doux);font-size:11px}.cp-oie .ici{border-color:var(--ct);box-shadow:0 0 0 2px var(--ct) inset}.cp-pion{display:inline-block;width:16px;height:16px;border-radius:50%;color:#fff;font-size:10px;text-align:center;line-height:16px;margin-right:2px}" +
    ".cp-temps{display:flex;gap:10px;align-items:flex-start}.cp-temps>i{flex:none;width:34px;height:34px;border-radius:10px;background:var(--ct);color:#fff;display:grid;place-items:center;font-style:normal;font-weight:700}.cp-dot{position:absolute;right:6px;bottom:6px;width:10px;height:10px;border-radius:50%;background:#E08A00;border:2px solid #fff}.cp-lex{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:14px}.cp-lex b{white-space:nowrap}";
  document.head.appendChild(s); }

/* ======================= HUB « Avant · après » : échauffements, défis et jeux, retour au calme, savoir ======================= */
function hubNav() { const prof = S.prof, T = [["echauf", "Échauffements"]].concat(prof ? [["defis", "Défis et jeux"]] : []).concat([["calme", "Retour au calme"], ["savoir", "Savoir"]]);
  if (!T.some(x => x[0] === S.hub)) S.hub = "calme";
  return `<div class="cp-nav">${T.map(([k, t]) => `<button class="puce ${S.hub === k ? "on" : ""}" data-cp="hub:${k}">${t}</button>`).join("")}</div>`; }
function carteBase(o, pre) { const c = o.chrono, t = pre === "ech" ? TYPES[o.type] : "";
  return `<section class="bloc"><div class="bloc-t">${h(o.nom)}<small>${t ? h(t) + " · " : ""}${c ? dureeTxt(c) : String(o.duree).replace(".5", " min 30").replace(/^(\d+)$/, "$1 min")}</small></div>
    <p class="petit" style="margin:0">${h(o.texte)}</p>${regles(o)}${o.mat && o.mat !== "Aucun" ? `<p class="petit doux" style="margin:6px 0 0">Matériel : ${h(o.mat)}</p>` : ""}${S.prof ? src(o.src) : ""}
    <div class="ligne" style="margin-top:8px;flex-wrap:wrap">${c ? `<button class="btn ct" data-cp="gc:${pre}:${o.id}">▶ Lancer · ${dureeTxt(c)}</button>` : ""}${o.outil ? `<button class="btn ct" data-cp="outil:${o.outil}">${o.outil === "oie" ? "🎲 Ouvrir le plateau" : "🎲 Lancer le dé"}</button>` : ""}
    ${(o.wods || []).filter(id => !isOff("wod:" + id) && WODS.some(w => w.id === id)).map(id => `<button class="btn clair petit" data-prendrew="${id}" style="padding:8px 10px">${h(WODS.find(w => w.id === id).nom)}</button>`).join("")}</div></section>`; }
function vueHub() { styles(); if (S.cpOutil) return vueOutil(S.cpOutil); S.hub = S.hub || "calme"; const nav = hubNav(), v = $("#vue");
  if (S.hub === "calme") { vueEtir(); const R = actifs(CALME, "cal");
    v.insertAdjacentHTML("afterbegin", nav + `<h2>🌙 Retour au calme</h2><p class="petit doux">Pour se détendre et entretenir sa souplesse. Les étirements n'évitent pas les courbatures.</p>${R.map(o => carteBase(o, "cal")).join("")}`); return; }
  if (S.hub === "echauf") { const Ls = actifs(ECHAUF, "ech").filter(o => S.prof || o.eleve);
    v.innerHTML = nav + `<h2>🔥 Échauffements</h2><p class="petit doux">${S.prof ? "15 min : une forme guidée, puis un jeu. Les jeux ne s'affichent chez les élèves que dans la leçon du jour." : "Choisis une forme guidée : l'appli donne le rythme."}</p>` + (Ls.map(o => carteBase(o, "ech")).join("") || `<p class="doux">Aucun échauffement actif.</p>`); return; }
  if (S.hub === "defis") { v.innerHTML = nav + `<h2>🎯 Défis et jeux</h2><p class="petit doux">Le quatrième temps de la leçon : 15 min.</p>` + (actifs(DEFIS, "def").map(o => carteBase(o, "def")).join("") || `<p class="doux">Aucun défi actif.</p>`); return; }
  const lex = LEXIQUE.filter((x, i) => !isOff("lex:" + i)), reg = REGLES.filter((x, i) => !isOff("reg:" + i)), ide = IDEES.filter((x, i) => !isOff("ide:" + i));
  v.innerHTML = nav + `<h2>📖 Savoir</h2>
    ${reg.length ? `<section class="bloc"><div class="bloc-t"><span>!</span>Les règles d'or</div><ol class="petit" style="margin:0;padding-left:20px">${reg.map(r => `<li style="margin:4px 0">${h(r)}</li>`).join("")}</ol></section>` : ""}
    ${lex.length ? `<section class="bloc"><div class="bloc-t">Les mots du cross-training</div><div class="cp-lex">${lex.map(([a, b]) => `<b>${h(a)}</b><span>${h(b)}</span>`).join("")}</div></section>` : ""}
    <section class="bloc"><div class="bloc-t">Mobilité ou souplesse ?</div><p class="petit" style="margin:0">La <b>mobilité</b>, c'est l'amplitude d'une articulation ; la <b>souplesse</b>, c'est la capacité d'un muscle à s'allonger. On peut être souple et manquer de mobilité de cheville : le squat complet devient alors difficile.</p></section>
    ${S.prof ? `${ide.length ? `<section class="bloc"><div class="bloc-t">Idées reçues vérifiées <small>enseignant</small></div>${ide.map(x => `<p class="petit" style="margin:8px 0"><b>« ${h(x[0])} »</b><br>${h(x[1])} <a href="${h(x[3])}" target="_blank" rel="noopener">${h(x[2])}</a></p>`).join("")}</section>` : ""}
      ${opt("squat") ? `<section class="bloc"><div class="bloc-t">Le squat <small>enseignant</small></div><ul class="petit" style="margin:0;padding-left:18px">${SQUAT.map(x => `<li>${h(x)}</li>`).join("")}</ul></section>` : ""}
      ${opt("aflmap") ? `<section class="bloc"><div class="bloc-t">Évaluation : d'où viennent les données <small>enseignant</small></div><div style="overflow:auto"><table class="rapport"><tr><th>Ce qui est évalué</th><th>Donnée de l'appli</th><th>AFL</th></tr>${AFLMAP.map(x => `<tr><td>${h(x[0])}</td><td>${h(x[1])}</td><td>${h(x[2])}</td></tr>`).join("")}</table></div>
        <p class="petit doux" style="margin:6px 0 0">Référentiel national du CCF, champ d'apprentissage 5 : l'AFL1 s'évalue sur la séance conçue et régulée par le candidat (Produire, Analyser), sans barème de temps.</p></section>` : ""}` : ""}`;
}

/* ---------- outils : dé du WOD, jeu de l'oie ---------- */
const exJeu = () => S.fiches.exercices.filter(e => visibleEleve(e) && !e.materiel && e.mesure !== "distance");
const tirage = () => { const Ls = exJeu(), e = Ls[Math.floor(Math.random() * Ls.length)]; return e ? { id: e.id, q: e.mesure === "temps" ? e.qte : Math.max(4, Math.round(e.qte * [0.5, 0.75, 1][Math.floor(Math.random() * 3)])) } : null; };
const caseTxt = c => { const e = exParId(c.id); return e ? `${c.q} ${e.mesure === "temps" ? "s" : "×"} ${e.fr || e.en}` : ""; };
function vueOutil(k) { styles(); const v = $("#vue"), retour = `<button class="btn clair petit" data-cp="retour" style="margin-bottom:10px">← Retour</button>`;
  if (k === "de") { const d = S.cpDe = S.cpDe || { n: 0, c: null }; const e = d.c && exParId(d.c.id);
    v.innerHTML = retour + `<h2>🎲 Dé du WOD</h2><section class="bloc" style="text-align:center">${e ? `<div class="petit doux">Tirage ${d.n}</div><div style="font-size:26px;font-weight:800;margin:8px 0">${h(caseTxt(d.c))}</div><button class="btn clair petit" data-fiche="${e.id}">Voir les niveaux</button>` : `<p class="doux">Par 2 ou 3 : on lance, on fait l'exercice, on relance.</p>`}
      <button class="btn ct plein" data-cp="de:lancer" style="margin-top:12px;padding:16px;font-size:18px">🎲 ${e ? "Relancer" : "Lancer le dé"}</button></section>`; return; }
  const o = S.cpOie = S.cpOie || { cases: Array.from({ length: 20 }, tirage).filter(Boolean), pos: [0, 0, 0, 0], n: 3, tour: 0, de: 0 }, col = ["#2F6FDB", "#C2185B", "#E08A00", "#0F766E"], fin = o.cases.length;
  const gagnant = o.pos.findIndex(p => p >= fin);
  v.innerHTML = retour + `<h2>🎲 Jeu de l'oie</h2><div class="ligne" style="margin-bottom:8px;flex-wrap:wrap">${[2, 3, 4].map(n => `<button class="puce ${o.n === n ? "on" : ""}" data-cp="oie:n:${n}">${n} équipes</button>`).join("")}<button class="puce" data-cp="oie:neuf">↻ Nouveau plateau</button></div>
    <section class="bloc" style="text-align:center">${gagnant >= 0 ? `<div style="font-size:22px;font-weight:800">🏁 L'équipe ${gagnant + 1} est arrivée !</div>` : `<div class="petit doux">${o.de ? `Dé : <b>${o.de}</b> · ` : ""}à l'équipe <span class="cp-pion" style="background:${col[o.tour]}">${o.tour + 1}</span> de jouer</div>
      ${o.de && o.dern ? `<div style="font-size:20px;font-weight:800;margin:6px 0">${h(o.dern)}</div>` : ""}<button class="btn ct plein" data-cp="oie:lancer" style="margin-top:8px;padding:14px">🎲 Lancer le dé</button>`}</section>
    <div class="cp-oie">${o.cases.map((c, i) => `<div class="${o.pos.slice(0, o.n).includes(i + 1) ? "ici" : ""}"><b>${i + 1} ${o.pos.slice(0, o.n).map((p, j) => p === i + 1 ? `<span class="cp-pion" style="background:${col[j]}">${j + 1}</span>` : "").join("")}</b>${h(caseTxt(c))}</div>`).join("")}</div>`;
}

/* ======================= LEÇON EN 5 TEMPS ======================= */
const parId = (L, id) => L.find(x => x.id === id);
function jourBlocsHtml(f) { if (!opt("plan")) return ""; f.blocs = f.blocs || {}; f.adapt = f.adapt || {};
  const sel = (k, t, Ls) => `<div style="flex:1;min-width:150px"><label class="champ">${t}</label><select data-cpj="${k}"><option value="">—</option>${Ls.map(([v, n]) => `<option value="${h(v)}" ${f.blocs[k] === v ? "selected" : ""}>${h(n)}</option>`).join("")}</select></div>`;
  const ech = actifs(ECHAUF, "ech"), D = durees(), it = classesCT().find(c => c.nom === f.c); let P = []; try { P = it ? EPSL.people(it).map(p => p.full) : []; } catch (e) {}
  const WA = WODS.filter(w => w.adapt && !isOff("wod:" + w.id));
  return `<details class="cp-det" ${Object.values(f.blocs).some(Boolean) || Object.keys(f.adapt).length ? "open" : ""} style="margin-top:12px"><summary>🧩 Les 5 temps de la leçon <small>facultatif · ${D.reduce((a, b) => a + b, 0)} min</small></summary>
    <p class="petit doux" style="margin:0 0 6px">L'élève voit un onglet « Leçon » avec ces temps : ${TEMPS.map((t, i) => `${t.toLowerCase()} ${D[i]} min`).join(", ")}. Le WOD se règle au-dessus.</p>
    <div class="ligne" style="flex-wrap:wrap">${sel("e1", "Échauffement · forme guidée", ech.filter(o => o.type === "guide" || o.type === "spec").map(o => [o.id, o.nom]))}${sel("e2", "Échauffement · jeu", ech.filter(o => o.type === "jeu" || o.type === "musique").map(o => [o.id, o.nom]))}</div>
    <div class="ligne" style="flex-wrap:wrap">${sel("skill", "Skill du jour", S.fiches.exercices.filter(visibleEleve).map(e => [e.id, e.en + " · " + e.fr]))}${sel("defi", "Défi ou jeu", actifs(DEFIS, "def").map(o => [o.id, o.nom]))}</div>
    <div class="ligne" style="flex-wrap:wrap">${sel("calme", "Retour au calme", [["etir", "Étirements · routine courte"]].concat(actifs(CALME, "cal").map(o => [o.id, o.nom])))}</div>
    ${WA.length ? `<label class="champ" style="margin-top:10px">♿ WOD adapté pour un élève (inaptitude partielle)</label>
      ${Object.entries(f.adapt).map(([n, id]) => `<div class="cp-row"><div class="petit"><b>${h(n)}</b> · ${h((WODS.find(w => w.id === id) || {}).nom || "")}</div><button class="btn danger petit" data-cpadel="${h(n)}" style="padding:4px 8px">✕</button></div>`).join("")}
      <div class="ligne" style="flex-wrap:wrap"><select id="cpAdN" style="flex:1;min-width:140px"><option value="">Élève…</option>${P.map(n => `<option>${h(n)}</option>`).join("")}</select><select id="cpAdW" style="flex:1;min-width:140px">${WA.map(w => `<option value="${w.id}">${h(w.nom)}</option>`).join("")}</select><button class="btn clair" data-cp="adapt:add">Ajouter</button></div>` : ""}</details>`; }
function jourPoser(o, f) { const b = {}; Object.entries(f.blocs || {}).forEach(([k, v]) => { if (v) b[k] = v; }); if (Object.keys(b).length) o.blocs = b; if (f.adapt && Object.keys(f.adapt).length) o.adapt = Object.assign({}, f.adapt); }
function jourResume(o) { const b = o.blocs || {}, n = id => (parId(ECHAUF, id) || parId(DEFIS, id) || parId(CALME, id) || {}).nom || (id === "etir" ? "Étirements" : ""), sk = b.skill && exParId(b.skill);
  const Ls = [n(b.e1), n(b.e2), sk ? "skill " + sk.en : "", n(b.defi), n(b.calme)].filter(Boolean), A = Object.keys(o.adapt || {});
  return (Ls.length ? `<div class="petit doux">🧩 ${h(Ls.join(" · "))}</div>` : "") + (A.length ? `<div class="petit doux">♿ WOD adapté : ${h(A.join(", "))}</div>` : ""); }
const aPlan = () => { if (S.prof || !opt("plan")) return false; const J = leconDuJour(); return !!(J && J.blocs && Object.values(J.blocs).some(Boolean)); };
function adaptPour(J) { if (!J || !J.adapt || !S.groupe || !S.groupe.noms) return null; const n = S.groupe.noms.find(x => J.adapt[x]); const w = n && WODS.find(x => x.id === J.adapt[n]); return w && !isOff("wod:" + w.id) ? w : null; }
function vuePlan() { styles(); const J = leconDuJour(), v = $("#vue"); if (!J || !J.blocs) { S.onglet = "lecon"; return rendre(); }
  const b = J.blocs, D = durees(), sk = b.skill && exParId(b.skill);
  const bloc = (o, pre) => !o ? "" : `<div style="margin-top:6px"><b>${h(o.nom)}</b><p class="petit" style="margin:2px 0 0">${h(o.texte)}</p>${regles(o)}<div class="ligne" style="margin-top:6px;flex-wrap:wrap">${o.chrono ? `<button class="btn ct" data-cp="gc:${pre}:${o.id}">▶ Lancer · ${dureeTxt(o.chrono)}</button>` : ""}${o.outil ? `<button class="btn ct" data-cp="outil:${o.outil}">🎲 ${o.outil === "oie" ? "Ouvrir le plateau" : "Lancer le dé"}</button>` : ""}
    ${(o.wods || []).filter(id => !isOff("wod:" + id) && WODS.some(w => w.id === id)).map(id => `<button class="btn clair petit" data-prendrew="${id}" style="padding:8px 10px">${h(WODS.find(w => w.id === id).nom)}</button>`).join("")}</div></div>`;
  const temps = (i, corps) => `<section class="bloc"><div class="cp-temps"><i>${i + 1}</i><div style="flex:1;min-width:0"><div class="bloc-t" style="margin:0">${TEMPS[i]}<small>${D[i]} min</small></div>${corps}</div></div></section>`;
  const cal = b.calme === "etir" ? `<div style="margin-top:6px"><b>Étirements · routine courte</b><div class="ligne" style="margin-top:6px"><button class="btn ct" data-act="etirCourt">▶ Lancer</button></div></div>` : bloc(parId(CALME, b.calme), "cal");
  v.innerHTML = `<h2>📌 ${h(J.titre || "Leçon du jour")}</h2>${J.consigne ? `<div class="alerte" style="margin-bottom:12px">${h(J.consigne)}</div>` : ""}
    ${temps(0, (bloc(parId(ECHAUF, b.e1), "ech") + bloc(parId(ECHAUF, b.e2), "ech")) || `<p class="petit doux">Suis ton enseignant.</p>`)}
    ${temps(1, sk ? `<div style="margin-top:6px"><b>${h(sk.en)}</b> <span class="petit doux">${h(sk.fr)}</span><p class="petit" style="margin:2px 0 0">Par 2 : un athlète, un juge avec les critères ✓ REP / ✗ NO REP, puis on change. Commence au niveau 1.</p><div class="ligne" style="margin-top:6px"><button class="btn ct" data-fiche="${sk.id}" data-n="1">Ouvrir la fiche</button></div></div>` : `<p class="petit doux">Suis ton enseignant.</p>`)}
    ${temps(2, `<p class="petit" style="margin:6px 0 0">${{ impose: "Réalise le WOD de ton enseignant : tu peux adapter le niveau.", forme: "Crée ton WOD dans la forme de travail imposée.", libre: "Crée le WOD de ton choix." }[modeJour(J)]}</p><div class="ligne" style="margin-top:6px"><button class="btn ct" data-onglet="lecon">⏱ Mon WOD</button></div>`)}
    ${temps(3, bloc(parId(DEFIS, b.defi), "def") || `<p class="petit doux">Suis ton enseignant.</p>`)}
    ${temps(4, (cal || "") + `<div class="ligne" style="margin-top:8px"><button class="btn clair" data-onglet="carnet">📒 Mon carnet</button></div>`)}`;
}

/* ======================= WOD test : progrès ======================= */
const estTest = o => o && o.wod && o.wod.test && o.res;
const scoreSec = o => +o.res.sec || (/^\d+:\d\d$/.test(o.res.score || "") ? (+o.res.score.split(":")[0]) * 60 + +o.res.score.split(":")[1] : 0);
function progres(Ls) { const T = Ls.filter(estTest).sort((a, b) => a.u - b.u); if (!T.length) return null; const a = T[0], z = T[T.length - 1], sa = scoreSec(a), sz = scoreSec(z);
  return { n: T.length, a, z, txt: T.length > 1 && sa && sz ? (sz < sa ? "− " + mmss(sa - sz) : sz > sa ? "+ " + mmss(sz - sa) : "=") : "", ok: T.length > 1 && sa && sz && sz < sa }; }
function testHtml(Wc, noms) { const par = {}; Wc.filter(estTest).forEach(o => (o.noms || []).forEach(n => (par[n] = par[n] || []).push(o))); if (!Object.keys(par).length) return "";
  return `<div class="carte" style="overflow:auto;margin-top:10px"><b>📈 WOD test</b> <span class="petit doux">premier et dernier essai</span><table class="rapport" style="margin-top:8px"><tr><th>Élève</th><th>Premier</th><th>Dernier</th><th class="c">Progrès</th></tr>
    ${noms.filter(n => par[n]).map(n => { const p = progres(par[n]); return `<tr><td>${h(n)}</td><td>${dateFR(p.a.date)} · ${h(p.a.res.score)}</td><td>${p.n > 1 ? dateFR(p.z.date) + " · " + h(p.z.res.score) : "—"}</td><td class="c ${p.ok ? "ok" : ""}">${h(p.txt || "—")}</td></tr>`; }).join("")}</table></div>`; }
function testEleve(mes) { const p = progres(mes); if (!p) return "";
  return `<div class="carte"><b>📈 Mon WOD test</b><div class="petit">Premier essai : ${dateFR(p.a.date)} · <b>${h(p.a.res.score)}</b>${p.n > 1 ? `<br>Dernier essai : ${dateFR(p.z.date)} · <b>${h(p.z.res.score)}</b>${p.txt ? ` · progrès : <b>${h(p.txt)}</b>` : ""}` : `<br><span class="doux">Refais-le en fin de séquence pour mesurer tes progrès.</span>`}</div></div>`; }
const phrase = () => { if (!opt("phrases")) return ""; const Ls = PHRASES.filter((x, i) => !isOff("phr:" + i)); return Ls.length ? `<p class="petit" style="margin:8px 0 0;font-style:italic">${h(Ls[Math.floor(Math.random() * Ls.length)])}</p>` : ""; };

/* ======================= ⚙ RÉGLAGES → 🗂 CONTENUS : tout supprimer / remettre ======================= */
function vueContenus() { styles(); S.cpOpen = S.cpOpen || {}; const v = $("#vue"), D = durees();
  const row = (k, nom, sub) => { const o = isOff(k); return `<div class="cp-row ${o ? "off" : ""}"><div><b>${h(nom)}</b>${sub ? `<div class="petit doux">${h(sub)}</div>` : ""}</div><button class="btn ${o ? "clair" : "danger"} petit" data-cp="${o ? "on" : "off"}:${h(k)}" style="padding:6px 10px">${o ? "♻ Remettre" : "🗑 Supprimer"}</button></div>`; };
  const det = (id, titre, rows, keys) => { const n = keys.filter(k => !isOff(k)).length; return `<details class="cp-det" data-cpdet="${id}" ${S.cpOpen[id] ? "open" : ""}><summary>${titre}<small>${n} sur ${keys.length}</small></summary>${rows}</details>`; };
  const exo = e => { const la = !!exParId(e.id); return `<div class="cp-row ${la ? "" : "off"}"><div><b>${h(e.en)}</b><div class="petit doux">${h(e.fr)} · ${h(MATERIELS[e.materiel || "PC"])}</div></div><button class="btn ${la ? "danger" : "clair"} petit" data-cp="${la ? "exoff" : "exon"}:${e.id}" style="padding:6px 10px">${la ? "🗑 Supprimer" : "♻ Remettre"}</button></div>`; };
  const fm = ["echelle", "montante", "deathby"];
  v.innerHTML = `<h2>🗂 Contenus du cross-training</h2><p class="petit doux">Tout ce qui a été ajouté à partir de la ressource peut être supprimé ici, puis remis. Le choix est suivi par toutes les tablettes. Les exercices supprimés sont à publier (bandeau « Publier »).</p>
    <div class="ligne" style="margin-bottom:12px;flex-wrap:wrap"><button class="btn clair" data-onglet="param">← Réglages</button><button class="btn contour" data-cp="toutremettre">♻ Tout remettre</button></div>
    ${det("exo", "🏋️ Exercices ajoutés", EXOS.map(exo).join(""), []).replace(/<small>.*?<\/small>/, `<small>${EXOS.filter(e => exParId(e.id)).length} sur ${EXOS.length}</small>`)}
    ${det("wod", "📚 WOD", WODS.map(w => row("wod:" + w.id, w.nom, FORMATS[w.format].nom + " · " + w.mat.map(m => MATERIELS[m]).join(", ") + (w.duo ? " · à 2" : "") + (w.adapt ? " · adapté" : ""))).join(""), WODS.map(w => "wod:" + w.id))}
    ${det("fmt", "⏱ Formes de travail ajoutées", fm.map(k => row("fmt:" + k, FORMATS[k].nom, FORMATS[k].fr)).join(""), fm.map(k => "fmt:" + k))}
    ${det("ech", "🔥 Échauffements", ECHAUF.map(o => row("ech:" + o.id, o.nom, TYPES[o.type])).join(""), ECHAUF.map(o => "ech:" + o.id))}
    ${det("def", "🎯 Défis et jeux", DEFIS.map(o => row("def:" + o.id, o.nom, o.texte)).join(""), DEFIS.map(o => "def:" + o.id))}
    ${det("cal", "🌙 Retour au calme", CALME.map(o => row("cal:" + o.id, o.nom, "")).join(""), CALME.map(o => "cal:" + o.id))}
    ${det("reg", "❗ Règles d'or", REGLES.map((r, i) => row("reg:" + i, r, "")).join(""), REGLES.map((r, i) => "reg:" + i))}
    ${det("lex", "📖 Lexique", LEXIQUE.map((x, i) => row("lex:" + i, x[0], x[1])).join(""), LEXIQUE.map((x, i) => "lex:" + i))}
    ${det("ide", "🔎 Idées reçues, squat, tableau des AFL (enseignant)", IDEES.map((x, i) => row("ide:" + i, x[0], x[2])).join("") + row("opt:squat", "Fiche « Le squat »", "") + row("opt:aflmap", "Tableau « d'où viennent les données »", ""), IDEES.map((x, i) => "ide:" + i).concat(["opt:squat", "opt:aflmap"]))}
    ${det("phr", "💬 Phrases de motivation", PHRASES.map((x, i) => row("phr:" + i, x, "")).join(""), PHRASES.map((x, i) => "phr:" + i))}
    ${det("opt", "🎛 Options", OPTS.map(([k, n, s]) => row("opt:" + k, n, s)).join(""), OPTS.map(x => "opt:" + x[0]))}
    <div class="carte"><b>⏲ Durée des 5 temps de la leçon</b><p class="petit doux">En minutes ; total : ${D.reduce((a, b) => a + b, 0)} min.</p><div class="params">${TEMPS.map((t, i) => `<div><label>${t}</label><input type="number" min="0" data-cpdur="${i}" value="${D[i]}"></div>`).join("")}</div></div>`;
  v.querySelectorAll("details[data-cpdet]").forEach(d => d.addEventListener("toggle", () => { S.cpOpen[d.dataset.cpdet] = d.open; }));
}
/* kettlebells de 6 kg au plus (demande de l'enseignant) : les deux niveaux d'origine qui dépassaient sont réécrits une seule fois, sauf s'ils ont été modifiés */
function migrer(F) { if (!F || F.kb6) return 0; let n = 0; const fix = (id, i, avant, apres, cons) => { const e = F.exercices.find(x => x.id === id), N = e && e.niveaux && e.niveaux[i]; if (N && N.nom === avant) { N.nom = apres; if (cons) N.consigne = cons; n++; } };
  fix("kbdeadlift", 2, "Kettlebell 8 à 12 kg", "Kettlebell 6 kg, 2 s de pause en bas", "Kettlebell de 6 kg : marquer 2 s de pause en bas, dos plat, puis se relever."); fix("farmer", 1, "Deux kettlebells 8 kg", "Deux kettlebells 6 kg");
  F.kb6 = 1; return n; }

/* ======================= ÉVÉNEMENTS ======================= */
document.addEventListener("click", ev => {
  const a = ev.target.closest("[data-cpadel]"); if (a) { delete S.formJour.adapt[a.dataset.cpadel]; return rendre(); }
  const t = ev.target.closest("[data-cp]"); if (!t) return; const p = t.dataset.cp.split(":"), k = p[0];
  if (k === "hub") { S.hub = p[1]; S.cpOutil = null; S.onglet = "etir"; rendre(); scrollTo(0, 0); return; }
  if (k === "retour") { S.cpOutil = null; S.onglet = aPlan() ? "plan" : "etir"; rendre(); scrollTo(0, 0); return; }
  if (k === "gc") { const o = parId(p[1] === "ech" ? ECHAUF : CALME, p[2]); if (o && o.chrono) lancerGC(JSON.parse(JSON.stringify(o.chrono))); return; }
  if (k === "outil") { S.cpOutil = p[1]; S.onglet = "etir"; rendre(); scrollTo(0, 0); return; }
  if (k === "de") { const d = S.cpDe; d.c = tirage(); d.n++; return vueOutil("de"); }
  if (k === "oie") { const o = S.cpOie; if (p[1] === "n") { o.n = +p[2]; o.tour = 0; } else if (p[1] === "neuf") { S.cpOie = null; } else { o.de = 1 + Math.floor(Math.random() * 6); o.pos[o.tour] = Math.min(o.cases.length, o.pos[o.tour] + o.de); o.dern = "Équipe " + (o.tour + 1) + " : " + caseTxt(o.cases[o.pos[o.tour] - 1]); o.tour = (o.tour + 1) % o.n; } return vueOutil("oie"); }
  if (k === "adapt") { const n = $("#cpAdN").value, w = $("#cpAdW").value; if (!n) return toast("Choisis un élève"); S.formJour.adapt[n] = w; return rendre(); }
  if (k === "off" || k === "on") { setOff(p.slice(1).join(":"), k === "off"); toast(k === "off" ? "Supprimé (tu peux le remettre)" : "Remis"); return vueContenus(); }
  if (k === "exoff") { if (!confirm("Supprimer cette fiche d'exercice ? Tu pourras la remettre ici.")) return; S.fiches.exercices = S.fiches.exercices.filter(x => x.id !== p[1]); S.nonPublie = true; indexerDrive(); sauver(); return rendre(); }
  if (k === "exon") { const e = EXOS.find(x => x.id === p[1]); if (e && !exParId(e.id)) { S.fiches.exercices.push(JSON.parse(JSON.stringify(e))); S.nonPublie = true; indexerDrive(); sauver(); } return rendre(); }
  if (k === "toutremettre") { if (!confirm("Remettre tous les contenus supprimés ?")) return; const c = Object.assign({}, cfg()); c.off = []; stPut("cfg", c); let n = 0; EXOS.forEach(e => { if (!exParId(e.id)) { S.fiches.exercices.push(JSON.parse(JSON.stringify(e))); n++; } }); if (n) { S.nonPublie = true; indexerDrive(); sauver(); } toast("Tout est remis"); return rendre(); }
});
document.addEventListener("change", ev => { const t = ev.target;
  if (t.dataset.cpj) { S.formJour.blocs = S.formJour.blocs || {}; S.formJour.blocs[t.dataset.cpj] = t.value; return; }
  if (t.dataset.cpdur != null) { const v = +String(t.value).replace(",", "."); if (t.value === "" || isNaN(v) || v < 0) return toast("Entre un nombre de minutes"); const d = durees().slice(); d[+t.dataset.cpdur] = Math.round(v); const c = Object.assign({}, cfg()); c.durees = d; stPut("cfg", c); toast("Enregistré"); return vueContenus(); }
  if (t.dataset.cpqual != null) { S.filtre.qual = t.value; return vueBiblio(); }
  if (t.dataset.cprep != null) { S.lecon.rep = t.value; sauver(); return rendre(); }
});
document.addEventListener("input", ev => { const t = ev.target; if (t.dataset.cpech != null) { S.lecon.ech = t.value; sauver(); const w = $("#wod"); if (w) w.innerHTML = tableauWod(S.lecon); } });

/* échelle d'un WOD : « 21-15-9 » → [{n:21},{n:15},{n:9}] ; « x1-x2-x3 » → [{m:1},{m:2},{m:3}] */
function echelle(l) { const E2 = String((l && l.ech) || "21-15-9").split(/[-\s,;/]+/).map(x => x.trim().toLowerCase()).filter(Boolean).map(x => /^x\d+([.,]\d+)?$/.test(x) ? { m: +x.slice(1).replace(",", ".") } : /^\d+$/.test(x) ? { n: +x } : null).filter(Boolean); return E2.length ? E2 : [{ n: 21 }, { n: 15 }, { n: 9 }]; }
const echTxt = l => echelle(l).map(v => v.m ? "×" + v.m : v.n).join("-");

window.CTP = { styles, EXOS, WODS, DUO, ECHAUF, DEFIS, CALME, QUAL, QUALITES, SPORTS, EXIGEANT, isOff, opt, familleDe, qualOk, vueHub, vueOutil, vuePlan, vueContenus, jourBlocsHtml, jourPoser, jourResume, aPlan, adaptPour, testHtml, testEleve, phrase, migrer, echelle, echTxt, fmtOn: k => !isOff("fmt:" + k), wodOn: w => !isOff("wod:" + w.id) };
})();
