// ===== Bibliothèque de leçons (format fiche de leçon EPS) =====
// Attendus : CA2 « Adapter son déplacement à des environnements variés et/ou incertains »
const AFLP = {
  1: "Anticiper et planifier son itinéraire pour concevoir et conduire dans sa totalité un projet de déplacement",
  2: "Mobiliser des techniques efficaces pour adapter et optimiser son déplacement aux caractéristiques du milieu",
  3: "Analyser sa prestation pour comprendre les alternatives possibles et ajuster son projet en fonction de ses ressources et de celles du milieu",
  4: "Assumer les rôles sociaux pour organiser la pratique des activités de pleine nature",
  5: "Se préparer et maintenir un engagement optimal permettant de garder sa lucidité tout au long de son parcours pour pouvoir réévaluer son itinéraire",
  6: "Respecter et faire respecter la réglementation et les procédures d'urgence pour les mettre en œuvre dans les différents environnements de pratique"
};
const AFL = {
  1: "S'engager à l'aide d'une motricité spécifique pour réaliser en sécurité et à son meilleur niveau, un itinéraire dans un contexte incertain",
  2: "S'entraîner individuellement et collectivement, pour se déplacer de manière efficiente et en toute sécurité",
  3: "Coopérer pour réaliser un projet de déplacement, en toute sécurité"
};
// o = réglages OrienRun proposés (créés en un clic dans l'onglet Parcours) ; nbB = nombre de balises conseillé
const BIBLIO = [
 { id: "L1", n: 1, cat: "cycle", titre: "Le lycée en étoile", theme: "Diagnostic : orienter sa carte et se situer", duree: "1 h 50", aflp: [1, 6], afl: [1],
   objectif: "Orienter sa carte en permanence et relier un élément de la carte à un élément du terrain proche (bâtiment, angle, banc…).",
   echauffement: "Footing autour du site avec la carte en main (10 min) : à chaque arrêt, l'enseignant demande « montre-moi où on est » et « oriente ta carte ». Mobilisation articulaire.",
   sit: { nom: "L'étoile", but: "Trouver le plus de balises possible en revenant au poste central entre chaque balise.",
     dispositif: "8 à 12 balises proches (< 150 m) autour d'un poste central où se trouve l'enseignant. Chaque élève part avec la carte de toutes les balises.",
     organisation: "Individuel ou en binôme. Départs échelonnés de 30 s. Retour obligatoire au centre entre deux balises, l'enseignant indique la suivante (ou l'élève la choisit).",
     consignes: ["Oriente ta carte AVANT de partir : le nord de la carte vers le nord du terrain.", "Pose ton pouce sur la carte à l'endroit où tu es, déplace-le en même temps que toi.", "Scanne la balise puis reviens au centre."],
     reussite: ["Trouver au moins 6 balises en 30 min.", "Moins de 2 balises refusées (code faux)."],
     realisation: ["La carte est orientée à chaque changement de direction.", "Le pouce suit le déplacement.", "L'élève nomme les éléments rencontrés (je longe le bâtiment B…)."],
     simplifier: ["Balises très proches et visibles depuis le centre.", "Carte agrandie, éléments-repères surlignés.", "Courir en binôme."],
     complexifier: ["Balises plus loin ou cachées derrière un élément.", "Interdiction de suivre un camarade.", "Temps limité à 20 min."],
     roles: "Un élève au centre note l'ordre de passage avec l'enseignant (rôle de contrôleur)." },
   bilan: "Montrer à la tablette 2 traces : une directe, une avec des allers-retours. « Qu'est-ce qui a fait perdre du temps ? » → orienter sa carte et suivre avec le pouce.",
   securite: ["Limites du site annoncées et montrées sur la carte (zone interdite en violet).", "Coup de sifflet long = retour immédiat au centre.", "Toujours avec son téléphone, bouton SOS expliqué."],
   materiel: ["Cartes A4 en couleur (1 par élève)", "Balises imprimées + QR codes", "Tablette de contrôle", "Sifflet"],
   o: { mode: "libre", nbB: 10, choix: false, prep: 0, tm: 30, fb: true, dm: "libre", carte: false, rk: "balises", conseil: "Choisis 8 à 12 balises proches du départ, qui servira de poste central." } },
 { id: "L2", n: 2, cat: "cycle", titre: "Suivre la ligne", theme: "Lire une carte en continu, suivre des lignes directrices", duree: "1 h 50", aflp: [1, 2], afl: [1],
   objectif: "Se déplacer en s'appuyant sur des lignes directrices (chemins, murs, clôtures, lisières) et anticiper le prochain point de décision.",
   echauffement: "« Le guide » par deux : l'un suit la carte et guide, l'autre court derrière sans carte ; on change de rôle à chaque intersection (12 min).",
   sit: { nom: "Le circuit sur lignes", but: "Réaliser un circuit en ordre imposé dont chaque balise est posée sur une ligne directrice.",
     dispositif: "Circuit de 6 à 8 balises en ordre imposé, chacune sur un chemin, un mur, une clôture ou une limite de végétation. Trois circuits de longueur différente.",
     organisation: "Individuel. Départ toutes les minutes. L'élève choisit son circuit (court, moyen, long).",
     consignes: ["Avant chaque balise, dis-toi : « je suis tel chemin, puis je tourne à… ».", "Repère l'élément qui t'arrête si tu vas trop loin (ligne d'arrêt).", "Si tu doutes, reviens au dernier point sûr."],
     reussite: ["Circuit complet, sans poste manquant.", "Aucun inter-poste supérieur au double du temps moyen de la classe."],
     realisation: ["Lecture de la carte en marchant ou en courant, sans s'arrêter.", "Repérage à l'avance du point de décision suivant.", "Utilisation des lignes d'arrêt."],
     simplifier: ["Balises sur des intersections.", "Circuit court avec lignes très marquées."],
     complexifier: ["Balises au milieu d'une ligne, entre deux intersections.", "Choix entre deux lignes possibles."],
     roles: "Binômes coureur / observateur sur un tronçon : l'observateur note les arrêts du coureur." },
   bilan: "Analyse d'itinéraire : repérer sur la trace les arrêts (ronds jaunes). Où le coureur a-t-il hésité ? Était-ce sur un point de décision ?",
   securite: ["Traversées de routes interdites (les signaler en violet).", "Heure limite de retour annoncée et affichée sur le téléphone."],
   materiel: ["Cartes des 3 circuits", "Balises + QR", "Tablette de contrôle"],
   o: { mode: "ordre", nbB: 7, so: true, prep: 1, tm: 35, fb: false, dm: "balise", carte: true, rk: "temps", conseil: "Choisis 6 à 8 balises posées sur des chemins, murs ou clôtures, dans l'ordre du circuit. Fais 3 parcours (court, moyen, long)." } },
 { id: "L3", n: 3, cat: "cycle", titre: "Le papillon", theme: "Enchaîner des boucles courtes et réguler son allure", duree: "1 h 50", aflp: [2, 5], afl: [1, 2],
   objectif: "Courir en lisant sa carte : adapter son allure à la difficulté (vite sur les lignes, ralentir à l'approche de la balise).",
   echauffement: "Footing progressif + gammes. « Feu tricolore » : vert = courir, orange = trottiner en lisant la carte, rouge = s'arrêter et orienter la carte (10 min).",
   sit: { nom: "Les ailes du papillon", but: "Réaliser 3 ou 4 boucles (les ailes) qui reviennent toutes au poste central, le plus vite possible.",
     dispositif: "Un poste central et 3 ou 4 boucles de 2 à 3 balises chacune, en ordre imposé. Les coureurs repassent par le centre (balise centrale scannée à chaque passage).",
     organisation: "Individuel. Départs échelonnés, sens des ailes différents d'un élève à l'autre pour éviter de suivre.",
     consignes: ["Cours sur les parties faciles, ralentis 50 m avant la balise.", "À chaque passage au centre, regarde ton chrono : quelle aile a été la plus lente ?"],
     reussite: ["Circuit complet en ordre imposé.", "Écart de vitesse entre la meilleure et la moins bonne aile inférieur à 30 %."],
     realisation: ["Alternance course rapide / lecture précise.", "Attaque de la balise à partir d'un point remarquable proche."],
     simplifier: ["2 ailes seulement.", "Balises visibles depuis le point d'attaque."],
     complexifier: ["4 ailes, ordre des ailes au choix.", "Balises en zone de végétation."],
     roles: "Un élève au centre vérifie le passage de chaque coureur (contrôleur)." },
   bilan: "Comparer les temps intermédiaires des ailes (onglet Résultats). Chacun identifie son aile la plus lente et en explique la raison.",
   securite: ["Le poste central est tenu par l'enseignant ou un élève dispensé.", "Pas de course dans les escaliers."],
   materiel: ["Cartes", "Balises + QR (dont la centrale répétée)", "Tablette de contrôle"],
   o: { mode: "ordre", nbB: 9, so: true, prep: 1, tm: 35, fb: false, dm: "balise", carte: true, rk: "temps", conseil: "Fais le circuit : aile 1 (2-3 balises), retour à une balise centrale, aile 2, etc. Ajoute plusieurs fois la même balise centrale dans l'ordre." } },
 { id: "L4", n: 4, cat: "cycle", titre: "Mémo-orientation", theme: "Mémoriser un itinéraire et planifier", duree: "1 h 50", aflp: [1, 5], afl: [1],
   objectif: "Construire une image mentale de l'itinéraire avant de partir (points de décision, lignes d'arrêt).",
   echauffement: "Jeu de Kim des symboles : 8 symboles ISOM montrés 30 s, les retrouver de mémoire sur une feuille (8 min). Footing.",
   sit: { nom: "Je regarde, je pars, je trouve", but: "Trouver chaque balise après avoir regardé la carte au poste de départ seulement.",
     dispositif: "Poste de départ avec la carte affichée. 6 balises à 80-200 m. Le coureur mémorise UNE balise, va la chercher sans carte, revient, puis mémorise la suivante.",
     organisation: "Individuel ou binôme. Temps de lecture de la carte limité à 30 s par balise.",
     consignes: ["Dis à voix haute ton itinéraire avant de partir.", "Repère 2 éléments sur ta route et 1 élément qui t'arrête après la balise.", "Pas de carte sur le téléphone pendant la course."],
     reussite: ["5 balises sur 6 trouvées.", "Moins de 2 retours au poste de départ pour relire la carte."],
     realisation: ["Verbalisation de l'itinéraire (« je longe… je tourne à… »).", "Choix de repères visibles et faciles."],
     simplifier: ["Lecture de 45 s.", "Balises plus proches."],
     complexifier: ["Mémoriser 2 balises d'un coup.", "Lecture de 20 s."],
     roles: "Le binôme écoute la verbalisation et valide qu'elle est complète." },
   bilan: "Quels repères ont été les plus utiles ? Construire avec la classe la liste « un bon repère est… » (visible, unique, sur ma route).",
   securite: ["Le téléphone reste dans la poche mais allumé (suivi GPS).", "Zone réduite et bien délimitée."],
   materiel: ["Carte affichée au départ (A3)", "Balises + QR", "Tablette"],
   o: { mode: "libre", nbB: 6, choix: false, prep: 0, tm: 40, fb: true, dm: "libre", carte: false, rk: "balises", conseil: "Choisis 6 balises entre 80 et 200 m du départ. Décoche « Envoyer la carte sur le téléphone »." } },
 { id: "L5", n: 5, cat: "cycle", titre: "Le contrat de temps", theme: "Se projeter : annoncer et tenir son contrat", duree: "1 h 50", aflp: [1, 3], afl: [1, 2],
   objectif: "Choisir un circuit adapté à ses ressources et annoncer un temps de course réaliste.",
   echauffement: "Footing de 8 min à allure « conversation » puis 3 accélérations de 30 s : l'élève estime ses vitesses (marche, trot, course).",
   sit: { nom: "Je choisis, j'annonce, je réalise", but: "Choisir ses balises, annoncer son temps, puis être le plus proche possible de son contrat.",
     dispositif: "10 balises de difficulté variée (vert, bleu, rouge). L'élève en choisit 6 pendant sa préparation (5 min) et écrit son temps prévu sur sa feuille.",
     organisation: "Individuel. Préparation sur la carte puis départ par scan de la balise DÉPART.",
     consignes: ["Pendant la préparation : trace ton itinéraire au crayon sur la carte.", "Annonce ton temps à l'enseignant avant de partir.", "Si tu es en retard, adapte ton choix (supprime une balise)."],
     reussite: ["Écart entre le temps annoncé et le temps réalisé inférieur à 10 %.", "Toutes les balises choisies trouvées."],
     realisation: ["Itinéraire tracé avant le départ.", "Contrôle du chrono à mi-parcours."],
     simplifier: ["4 balises à choisir, écart toléré de 20 %."],
     complexifier: ["8 balises, dont 2 rouges obligatoires.", "Écart toléré de 5 %."],
     roles: "Le binôme note le contrat et calcule l'écart (rôle de juge)." },
   bilan: "Fiche bilan : comparer les inter-postes prévus et réalisés. « Je me suis surestimé / sous-estimé parce que… »",
   securite: ["Heure limite de retour : 10 min avant la fin du cours.", "Rappel général pour revenir si besoin."],
   materiel: ["Cartes avec balises de couleur", "Feuilles de contrat", "Crayons", "Tablette"],
   o: { mode: "libre", nbB: 10, choix: true, nb: 6, prep: 5, tm: 40, fb: false, dm: "balise", carte: true, rk: "balises", conseil: "Mets 10 balises (environ 4 faciles, 4 moyennes, 2 difficiles). L'élève en choisit 6 pendant ses 5 min de préparation." } },
 { id: "L6", n: 6, cat: "cycle", titre: "Le relais orientation", theme: "Coopérer et se répartir les balises", duree: "1 h 50", aflp: [4, 1], afl: [3],
   objectif: "Se répartir les balises en équipe selon les forces de chacun et assurer la sécurité du groupe.",
   echauffement: "Relais navette sans carte puis avec la carte : passage du témoin = la carte (10 min).",
   sit: { nom: "Le relais à la carte", but: "En équipe de 3, trouver toutes les balises le plus vite possible ; chaque coureur part seul avec sa part.",
     dispositif: "15 balises. Chaque équipe se répartit les balises pendant la préparation. Un seul coureur dehors à la fois : il part, scanne ses balises, revient et passe le relais.",
     organisation: "Équipes de 3 hétérogènes. Le parcours choisi par chaque coureur est saisi dans l'appli (choix des balises).",
     consignes: ["Répartissez-vous les balises en tenant compte des points forts de chacun.", "Le suivant ne part que quand le précédent est revenu.", "Celui qui attend vérifie le chrono de l'équipe."],
     reussite: ["Les 15 balises trouvées par l'équipe.", "Aucun coureur au-dessus de la durée maximale."],
     realisation: ["Répartition argumentée (distances, difficultés).", "Communication au passage de relais (« la 37 est derrière le gymnase »)."],
     simplifier: ["10 balises, équipes de 2."],
     complexifier: ["Balises bonus à points.", "Une balise obligatoire pour chaque coureur."],
     roles: "Rôles tournants : coureur, stratège (suit la carte et le chrono), contrôleur de sécurité." },
   bilan: "Comparer les équipes : la répartition a-t-elle été efficace ? Quelle équipe a le mieux équilibré les temps de ses coureurs ?",
   securite: ["Toujours un équipier au poste de départ.", "Rappel général prévu en fin de jeu."],
   materiel: ["1 carte par équipe + 1 par coureur", "Balises + QR", "Tablette"],
   o: { mode: "libre", nbB: 15, choix: true, prep: 5, tm: 15, fb: true, dm: "libre", carte: true, rk: "balises", conseil: "Mets 15 balises. Chaque coureur de l'équipe s'inscrit avec son nom et choisit sa part de balises." } },
 { id: "L7", n: 7, cat: "cycle", titre: "Le score", theme: "Faire des choix tactiques sous contrainte de temps", duree: "1 h 50", aflp: [1, 5], afl: [1, 2],
   objectif: "Optimiser un rapport points / distance / temps et gérer son temps pour rentrer dans les délais.",
   echauffement: "Course « à la montre » : 4 min à allure libre, l'élève estime la distance parcourue (relation allure / temps).",
   sit: { nom: "Le score au temps limité", but: "Marquer le plus de points en 25 min. Chaque minute de retard enlève 5 points.",
     dispositif: "15 balises : les proches valent 10 points, les moyennes 20, les lointaines ou difficiles 30. 2 balises bonus.",
     organisation: "Individuel, départ en masse. Préparation de 3 min avant le départ.",
     consignes: ["Construis une boucle qui revient vers l'arrivée.", "À mi-temps, vérifie ton chrono : rentre-t-il dans les délais ?", "Une balise de plus ne vaut pas 5 minutes de retard."],
     reussite: ["Retour dans le temps (0 pénalité).", "Plus de 100 points."],
     realisation: ["Itinéraire en boucle, sans aller-retour inutile.", "Contrôle régulier du temps restant."],
     simplifier: ["30 min, balises plus proches."],
     complexifier: ["20 min, balises à 30 points plus éloignées.", "Pénalité de 10 points par minute."],
     roles: "Un juge à l'arrivée vérifie les heures de retour avec la tablette." },
   bilan: "Classement aux points. Que choisir quand il reste 5 min ? Comparer deux élèves au score proche mais aux itinéraires différents.",
   securite: ["Heure limite de retour affichée sur tous les téléphones.", "Alerte à 5 min de la fin."],
   materiel: ["Cartes avec les points indiqués", "Balises + QR", "Tablette"],
   o: { mode: "score", nbB: 15, prep: 3, tm: 25, pen: 5, ptsOn: true, fb: true, dm: "libre", carte: true, rk: "points", conseil: "Mets 15 balises et règle les points : 10 près du départ, 20 à mi-distance, 30 loin. Ajoute 2 bonus." } },
 { id: "L8", n: 8, cat: "cycle", titre: "Choix d'itinéraire", theme: "Comparer des itinéraires et choisir selon ses ressources", duree: "1 h 50", aflp: [3, 1], afl: [1, 2],
   objectif: "Comparer deux itinéraires (court mais difficile / long mais sûr) et choisir selon ses ressources.",
   echauffement: "Sur la carte, par deux : pour 3 inter-postes, tracer 2 itinéraires et estimer le temps de chacun (10 min).",
   sit: { nom: "Gauche ou droite ?", but: "Réaliser 4 longs inter-postes, chacun avec au moins deux itinéraires possibles.",
     dispositif: "Circuit en ordre imposé de 4 à 5 balises éloignées. Entre chaque balise, un obstacle (bâtiment, zone interdite, végétation) oblige à choisir.",
     organisation: "Individuel. Chaque élève annonce son choix (G ou D) pour chaque inter-poste avant de partir.",
     consignes: ["Pour chaque inter-poste, compare : distance, difficulté de lecture, nature du terrain.", "Note ton choix sur ta carte avant de partir."],
     reussite: ["Circuit complet.", "Pouvoir justifier chaque choix avec un critère (distance, sécurité, lisibilité)."],
     realisation: ["Repérage des zones lentes (végétation) et rapides (chemins).", "Choix d'un point d'attaque sûr."],
     simplifier: ["2 inter-postes seulement, itinéraires très contrastés."],
     complexifier: ["Choix à 3 itinéraires.", "Ajout d'un passage obligatoire."],
     roles: "En fin de séance, chacun explique son choix sur la trace d'un camarade." },
   bilan: "Analyse d'itinéraire : afficher 2 traces sur le même inter-poste, comparer distances GPS et temps. Quel choix était le meilleur, et pour qui ?",
   securite: ["Zones interdites matérialisées et en violet sur la carte.", "Contrôle des scans suspects sur la tablette."],
   materiel: ["Cartes", "Balises + QR", "Tablette (vidéoprojection du bilan si possible)"],
   o: { mode: "ordre", nbB: 5, so: true, prep: 3, tm: 40, fb: false, dm: "balise", carte: true, rk: "temps", conseil: "Choisis 4 à 5 balises éloignées avec un bâtiment ou une zone interdite entre elles." } },
 { id: "L9", n: 9, cat: "cycle", titre: "Épreuve blanche", theme: "Se préparer à l'évaluation : niveau, contrat, sécurité", duree: "1 h 50", aflp: [1, 2, 6], afl: [1, 2],
   objectif: "Choisir son niveau de difficulté, préparer son itinéraire et gérer sa course comme le jour de l'évaluation.",
   echauffement: "Échauffement autonome guidé par une fiche (10 min) : footing, gammes, lecture de la carte en marchant.",
   sit: { nom: "Les 3 niveaux", but: "Réaliser le circuit de son niveau (vert, bleu ou rouge) avec au minimum 7 balises sur 10, plus les bonus de son choix.",
     dispositif: "3 parcours de 10 balises (vert, bleu, rouge) et 2 bonus. 5 min de préparation. Départ par scan de la balise DÉPART, durée maximale de 40 min.",
     organisation: "Individuel. Départs échelonnés toutes les 2 min. Chaque élève choisit son niveau avant la préparation.",
     consignes: ["Choisis ton niveau selon tes résultats précédents (fiches bilan).", "Prépare ton ordre de passage pendant les 5 min.", "Respecte la durée maximale."],
     reussite: ["7 balises minimum, sans retard.", "Écart entre le niveau choisi et le résultat cohérent."],
     realisation: ["Itinéraire préparé et tenu.", "Allure adaptée : rapide sur les lignes, précis à l'approche."],
     simplifier: ["Niveau vert : balises sur des lignes, 30 min."],
     complexifier: ["Niveau rouge : balises hors lignes, en végétation."],
     roles: "Élèves dispensés : chronométreurs et contrôleurs au départ et à l'arrivée." },
   bilan: "Chaque élève lit sa fiche bilan et décide de son niveau pour l'évaluation (« je garde / je monte / je descends »).",
   securite: ["Procédure d'urgence rappelée : SOS, rester sur place, rappel général.", "Appel au départ et au retour."],
   materiel: ["Cartes des 3 niveaux", "Balises + QR", "Tablette", "Fiches bilan des leçons précédentes"],
   o: { mode: "libre", nbB: 10, choix: false, prep: 5, tm: 40, pen: 0, fb: false, dm: "balise", carte: false, rk: "balises", conseil: "Crée 3 parcours (vert, bleu, rouge) de 10 balises + 2 bonus en dupliquant celui-ci." } },
 { id: "L10", n: 10, cat: "cycle", titre: "Évaluation", theme: "Épreuve certificative de fin de séquence", duree: "1 h 50", aflp: [1, 2, 4, 6], afl: [1, 2, 3],
   objectif: "Réaliser en sécurité et à son meilleur niveau un itinéraire choisi, dans le temps imparti.",
   echauffement: "Échauffement autonome (10 min) pendant que l'enseignant rappelle les règles et vérifie les téléphones (batterie, localisation).",
   sit: { nom: "Épreuve de fin de séquence", but: "Réaliser le circuit de son niveau dans le temps imparti, selon le référentiel de l'établissement.",
     dispositif: "Mêmes conditions que l'épreuve blanche : 3 niveaux, minimum de balises imposé, bonus, préparation de 5 min, durée maximale.",
     organisation: "Individuel. Départs échelonnés. Rôles sociaux répartis à l'avance.",
     consignes: ["Annonce ton niveau et, si ton référentiel le prévoit, ta répartition des points (AFL2 / AFL3).", "Respecte la durée maximale.", "En cas de problème : SOS ou appel, ne quitte pas la zone."],
     reussite: ["Selon le barème du référentiel de l'établissement."],
     realisation: ["Lecture continue de la carte.", "Gestion de l'allure et du temps.", "Respect des règles de sécurité."],
     simplifier: ["Adaptations pour les élèves à besoins particuliers (circuit raccourci, rôle de débaliseur)."],
     complexifier: [],
     roles: "Chronométreur, contrôleur des départs, responsable sécurité, débaliseur." },
   bilan: "Résultats, fiches bilan et export Excel pour la saisie des notes. Retour à chaque élève sur sa progression (onglet Progression).",
   securite: ["Appel au départ et au retour obligatoire.", "Alerte d'immobilité activée.", "Heure limite de retour réglée."],
   materiel: ["Cartes des 3 niveaux", "Balises + QR", "Tablette chargée", "Référentiel et grille d'évaluation"],
   o: { mode: "libre", nbB: 10, choix: false, prep: 5, tm: 40, fb: false, dm: "balise", carte: false, rk: "balises", conseil: "Reprends les 3 parcours de l'épreuve blanche (en changeant les balises si besoin)." } },
 // ----- situations courtes (échauffements, remédiations) -----
 { id: "S1", cat: "situation", titre: "Puzzle de carte", theme: "Échauffement : orienter et reconstituer la carte", duree: "10 min", aflp: [1], afl: [1],
   objectif: "Reconnaître les éléments de la carte à partir du terrain.",
   sit: { nom: "Le puzzle", but: "Reconstituer la carte découpée en 6 morceaux, le plus vite possible, en se rendant sur place si besoin.", dispositif: "Carte A4 découpée en 6 rectangles, une enveloppe par binôme.", organisation: "Binômes, au départ.", consignes: ["Assemble les morceaux en regardant le terrain autour de toi."], reussite: ["Carte reconstituée en moins de 4 min."], realisation: ["Repérage des grandes lignes (bâtiments, chemins)."], simplifier: ["4 morceaux."], complexifier: ["9 morceaux, sans le nord indiqué."], roles: "" },
   securite: ["Rester dans la zone de départ."], materiel: ["Cartes découpées", "Enveloppes"], o: null },
 { id: "S2", cat: "situation", titre: "Loto des symboles", theme: "Connaître les symboles de la carte", duree: "10 min", aflp: [1], afl: [1],
   objectif: "Associer les symboles de la carte (ISOM) aux éléments du terrain.",
   sit: { nom: "Le loto", but: "Retrouver sur le terrain les éléments correspondant aux symboles tirés au sort.", dispositif: "Cartons de 6 symboles (bâtiment, clôture, arbre remarquable, zone interdite…).", organisation: "Binômes.", consignes: ["Pour chaque symbole, va toucher un élément réel correspondant."], reussite: ["6 symboles en moins de 8 min."], realisation: ["Lecture de la légende de la carte."], simplifier: ["Légende fournie."], complexifier: ["Sans légende."], roles: "" },
   securite: ["Zone réduite autour du départ."], materiel: ["Cartons symboles", "Légende de la carte"], o: null },
 { id: "S3", cat: "situation", titre: "Les cartes postales", theme: "Associer photo du terrain et carte", duree: "15 min", aflp: [1, 2], afl: [1],
   objectif: "Passer de la vue du terrain à la vue de dessus de la carte.",
   sit: { nom: "Où a été prise la photo ?", but: "Placer sur la carte 6 photos du site, puis aller vérifier sur place.", dispositif: "6 photos plastifiées d'endroits du site ; une balise est posée à chaque endroit.", organisation: "Individuel ou binôme.", consignes: ["Repère sur chaque photo un élément unique.", "Marque l'endroit sur ta carte, puis va scanner la balise pour vérifier."], reussite: ["5 photos bien placées."], realisation: ["Recherche d'éléments uniques (forme de bâtiment, arbre…)."], simplifier: ["Photos larges."], complexifier: ["Photos de détails."], roles: "" },
   securite: ["Limites du site rappelées."], materiel: ["Photos plastifiées", "Balises + QR"], o: { mode: "libre", nbB: 6, choix: false, prep: 0, tm: 15, fb: true, dm: "libre", carte: false, rk: "balises", conseil: "Pose une balise à l'endroit de chaque photo." } },
 { id: "S4", cat: "situation", titre: "Le couloir", theme: "Lecture précise sur un itinéraire imposé", duree: "15 min", aflp: [2], afl: [1],
   objectif: "Suivre précisément un itinéraire tracé sur la carte.",
   sit: { nom: "Le couloir", but: "Suivre l'itinéraire tracé au surligneur sur la carte et trouver les balises posées dessus (non dessinées).", dispositif: "Itinéraire surligné sur la carte ; 5 balises posées sur ce trajet, pas indiquées sur la carte.", organisation: "Individuel, départs échelonnés.", consignes: ["Reste sur le couloir.", "Quand tu trouves une balise, marque sa position sur ta carte."], reussite: ["5 balises trouvées et bien placées."], realisation: ["Lecture continue, carte orientée."], simplifier: ["Couloir sur chemins."], complexifier: ["Couloir hors chemins."], roles: "" },
   securite: ["Couloir sans traversée de route."], materiel: ["Cartes avec le couloir surligné", "Balises"], o: { mode: "libre", nbB: 5, choix: false, prep: 0, tm: 20, fb: false, dm: "libre", carte: false, rk: "temps", conseil: "Pose 5 balises sur l'itinéraire du couloir." } },
 { id: "S5", cat: "situation", titre: "Retour au calme : relire sa trace", theme: "Analyse réflexive en fin de leçon", duree: "10 min", aflp: [3], afl: [2],
   objectif: "Identifier une erreur sur sa trace GPS et proposer une solution.",
   sit: { nom: "Ma trace", but: "Retrouver sur sa trace l'arrêt le plus long et expliquer ce qui s'est passé.", dispositif: "Analyse d'itinéraire sur le téléphone (après l'arrivée) ou sur la tablette.", organisation: "Par deux : l'un explique, l'autre questionne.", consignes: ["Trouve ton arrêt le plus long (rond jaune).", "Explique : où étais-je ? que cherchais-je ? que ferai-je la prochaine fois ?"], reussite: ["Une explication et une solution notées sur la fiche bilan."], realisation: ["Lien entre la trace et la carte."], simplifier: ["Avec l'aide de l'enseignant."], complexifier: ["Comparer avec la trace d'un camarade."], roles: "" },
   securite: [], materiel: ["Téléphones ou tablette", "Fiches bilan"], o: null }
];

const blib = () => DB.get("biblio").then(x => x || []);
const blibNiv = () => LS.get("biblioNiv", "pro");
const attendus = (L, niv) => niv === "gt" ? (L.afl || []).map(i => ({ k: "AFL" + i, t: AFL[i] })) : (L.aflp || []).map(i => ({ k: "AFLP" + i, t: AFLP[i] }));

async function viewBiblio(v) {
  const mine = await blib(), niv = blibNiv(), filt = LS.get("biblioFilt", "cycle");
  const all = [...BIBLIO, ...mine];
  const list = all.filter(L => filt === "tout" || (filt === "mes" ? L.mine : L.cat === filt && !L.mine));
  v.innerHTML = `<div class="pmain"><div class="panel" style="margin-top:0"><h2>📚 Bibliothèque de leçons</h2>
    <p class="muted" style="margin-top:-6px">Un cycle de course d'orientation au format fiche de leçon (CA2 : adapter son déplacement à des environnements variés et/ou incertains), des situations courtes, et tes propres leçons. Chaque fiche peut créer le parcours OrienRun déjà réglé.</p>
    <div class="row"><div class="cchips">${[["cycle", "Cycle (10 leçons)"], ["situation", "Situations courtes"], ["mes", `Mes leçons (${mine.length})`], ["tout", "Tout"]].map(([k, l]) => `<button class="btn small ${filt === k ? "" : "ghost"}" data-f="${k}">${l}</button>`).join("")}</div><span class="grow"></span>
     <div class="cchips"><button class="btn small ${niv === "pro" ? "vi" : "ghost"}" data-niv="pro">Bac pro (AFLP)</button><button class="btn small ${niv === "gt" ? "vi" : "ghost"}" data-niv="gt">Bac GT (AFL)</button></div></div>
    <div class="row" style="margin-top:10px"><button class="btn or" id="blNew">＋ Nouvelle leçon</button><button class="btn alt" id="blPlan">🖨 Plan de cycle</button><button class="btn ghost" id="blExp">⬇ Exporter mes leçons</button><button class="btn ghost" id="blImp">⬆ Importer</button></div></div>
    <div class="grid2" style="margin-top:14px;grid-template-columns:repeat(auto-fill,minmax(290px,1fr))">${list.map(L => `<button class="panel" data-l="${esc(L.id)}" style="margin:0;text-align:left;display:flex;flex-direction:column;gap:6px;border-left:6px solid ${L.mine ? "var(--violet)" : L.cat === "situation" ? "var(--sun)" : "var(--orange)"}">
      <div class="row" style="gap:6px"><span class="chip ${L.cat === "situation" ? "wait" : "or"}">${L.n ? "Leçon " + L.n : L.cat === "situation" ? "Situation" : "Leçon"}</span><span class="chip">${esc(L.duree || "")}</span>${L.mine ? '<span class="chip vi">Ma leçon</span>' : ""}</div>
      <b style="font-family:var(--cond);font-size:1.4rem;line-height:1.05">${esc(L.titre)}</b><span class="muted">${esc(L.theme || "")}</span>
      <div class="cchips">${attendus(L, niv).map(a => `<span class="chip vi" title="${esc(a.t)}">${a.k}</span>`).join("")}${L.o ? '<span class="chip ok">〰 parcours prêt</span>' : ""}</div></button>`).join("") || '<div class="panel muted">Aucune leçon ici pour l\'instant.</div>'}</div></div>`;
  $$("[data-f]", v).forEach(b => b.onclick = () => { LS.set("biblioFilt", b.dataset.f); setPTab("biblio"); });
  $$("[data-niv]", v).forEach(b => b.onclick = () => { LS.set("biblioNiv", b.dataset.niv); setPTab("biblio"); });
  $$("[data-l]", v).forEach(b => b.onclick = () => openFiche(all.find(L => L.id === b.dataset.l)));
  $("#blNew").onclick = () => editLecon({ id: "M" + uid(5), mine: true, cat: "cycle", titre: "", theme: "", duree: "1 h 50", aflp: [1], afl: [1], objectif: "", echauffement: "", sit: { nom: "", but: "", dispositif: "", organisation: "", consignes: [], reussite: [], realisation: [], simplifier: [], complexifier: [], roles: "" }, bilan: "", securite: [], materiel: [], o: null }, true);
  $("#blPlan").onclick = () => printPlan(all.filter(L => L.cat === "cycle" && (filt !== "mes" || L.mine)).sort((a, b) => (a.n || 99) - (b.n || 99)));
  $("#blExp").onclick = () => download("OrienRun_mes_lecons.json", JSON.stringify(mine, null, 1), "application/json");
  $("#blImp").onclick = async () => { const f = await pickFile(".json,application/json"); if (!f) return; try { const L = JSON.parse(await f.text()); if (!Array.isArray(L)) throw new Error("Fichier non reconnu"); const M = await blib(); L.forEach(x => { x.mine = true; x.id = x.id && !M.some(m => m.id === x.id) ? x.id : "M" + uid(5); M.push(x); }); await DB.set("biblio", M); toast(L.length + " leçon(s) importée(s) ✓", "ok"); setPTab("biblio"); } catch (e) { toast(e.message, "ko"); } };
}
function ficheHTML(L, niv, print) {
  const s = L.sit || {}, li = a => (a || []).length ? `<ul>${a.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : '<p class="vide">—</p>';
  const att = attendus(L, niv), autre = attendus(L, niv === "gt" ? "pro" : "gt");
  const o = L.o;
  return `<div class="fiche">
   <table class="hd"><tr><td class="tt" colspan="4"><div class="kick">EPS · CA2 · Course d'orientation${L.n ? ` · Leçon ${L.n}` : ""}</div><div class="ti">${esc(L.titre)}</div><div class="th">${esc(L.theme || "")}</div></td></tr>
    <tr><td><b>Classe :</b> ${print ? "……………" : ""}</td><td><b>Date :</b> ${print ? "……………" : ""}</td><td><b>Durée :</b> ${esc(L.duree || "")}</td><td><b>Lieu :</b> ${print ? "……………" : ""}</td></tr></table>
   <h4>Attendus visés (${niv === "gt" ? "bac général et technologique" : "bac professionnel"})</h4><ul class="att">${att.map(a => `<li><b>${a.k}</b> — ${esc(a.t)}</li>`).join("")}</ul>${autre.length ? `<p class="muted2">${niv === "gt" ? "Bac pro" : "Bac GT"} : ${autre.map(a => a.k).join(", ")}</p>` : ""}
   <h4>Objectif de la leçon</h4><p>${esc(L.objectif || "")}</p>
   <h4>Déroulement</h4>
   <table class="dr"><thead><tr><th style="width:16%">Phase</th><th>Contenu et organisation</th></tr></thead><tbody>
    ${L.echauffement ? `<tr><td><b>Échauffement</b><br><small>10 à 15 min</small></td><td>${esc(L.echauffement)}</td></tr>` : ""}
    <tr><td><b>Situation d'apprentissage</b><br><small>${esc(s.nom || "")}</small></td><td>
     <p><b>But (pour l'élève) :</b> ${esc(s.but || "")}</p><p><b>Dispositif :</b> ${esc(s.dispositif || "")}</p><p><b>Organisation :</b> ${esc(s.organisation || "")}</p>
     <div class="two"><div><b>Consignes</b>${li(s.consignes)}</div><div><b>Critères de réussite</b>${li(s.reussite)}</div></div>
     <div><b>Critères de réalisation</b>${li(s.realisation)}</div>
     <div class="two"><div><b>Pour simplifier</b>${li(s.simplifier)}</div><div><b>Pour complexifier</b>${li(s.complexifier)}</div></div>
     ${s.roles ? `<p><b>Rôles sociaux :</b> ${esc(s.roles)}</p>` : ""}</td></tr>
    ${L.bilan ? `<tr><td><b>Bilan</b><br><small>10 min</small></td><td>${esc(L.bilan)}</td></tr>` : ""}</tbody></table>
   <div class="two"><div><h4>Sécurité</h4>${li(L.securite)}</div><div><h4>Matériel</h4>${li(L.materiel)}</div></div>
   ${o ? `<h4>Réglages OrienRun</h4><p class="or">${esc(modeNom[o.mode] || o.mode)} · ${o.nbB} balises conseillées${o.choix ? ` · l'élève choisit${o.nb ? " " + o.nb : ""} balises` : ""}${o.prep ? ` · préparation ${o.prep} min` : ""}${o.tm ? ` · durée max ${o.tm} min` : ""}${o.so ? " · ordre sanctionné" : ""}${o.ptsOn || o.mode === "score" ? " · points" : ""} · départ : ${esc((DEPART_MODES[o.dm] || "").replace(/«|»/g, ""))}${o.carte ? " · carte sur le téléphone" : " · pas de carte sur le téléphone"}${o.fb ? " · réponse juste/fausse immédiate" : ""}<br><i>${esc(o.conseil || "")}</i></p>` : ""}
  </div>`;
}
const FICHE_CSS = `.fiche{font-size:10pt;line-height:1.35}.fiche h4{margin:3mm 0 1mm;font-size:10.5pt;text-transform:uppercase;letter-spacing:.04em;color:#c25200;border-bottom:.3mm solid #f47a20}
 .fiche table{border-collapse:collapse;width:100%}.fiche td,.fiche th{border:.3mm solid #999;padding:1.4mm 2mm;vertical-align:top;text-align:left}.fiche th{background:#f3efe4;font-size:9pt}
 .fiche .hd .tt{background:#14213d;color:#fff}.fiche .kick{font-size:8pt;letter-spacing:.12em;text-transform:uppercase;opacity:.85}.fiche .ti{font-size:17pt;font-weight:800}.fiche .th{font-size:10pt;opacity:.9}
 .fiche ul{margin:1mm 0 1mm 4.5mm;padding:0}.fiche li{margin:.4mm 0}.fiche p{margin:1mm 0}.fiche .two{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.fiche .muted2{color:#666;font-size:8.5pt}.fiche .vide{color:#999}.fiche .or{background:#fff4e8;border-left:1mm solid #f47a20;padding:1.5mm 2.5mm}
 .fiche .att li{list-style:none;margin-left:-4.5mm}`;
function openFiche(L) {
  const niv = blibNiv();
  const m = openModal(`<style>${FICHE_CSS.replace(/(\d+(?:\.\d+)?)mm/g, (x, n) => (n * 3.78).toFixed(1) + "px").replace(/(\d+(?:\.\d+)?)pt/g, (x, n) => (n * 1.5).toFixed(1) + "px")} .fiche{background:#fff;padding:14px;border-radius:14px}</style>${ficheHTML(L, niv, false)}
   <div class="row" style="margin-top:14px">${L.o ? `<button class="btn or" id="fCourse">〰 Créer le parcours avec ces réglages</button>` : ""}<button class="btn" id="fPrint">🖨 Imprimer la fiche</button><button class="btn alt" id="fDup">${L.mine ? "✏ Modifier" : "📝 Copier dans mes leçons"}</button>${L.mine ? `<button class="btn red" id="fDel">Supprimer</button>` : ""}</div>`, { wide: true });
  $("#fPrint", m).onclick = () => printWin("Fiche de leçon – " + L.titre, ficheHTML(L, niv, true), `@page{size:A4 portrait;margin:10mm}` + FICHE_CSS);
  $("#fCourse", m) && ($("#fCourse", m).onclick = () => { m.close(); courseFromLecon(L); });
  $("#fDup", m).onclick = () => { m.close(); if (L.mine) editLecon(L, false); else { const c = JSON.parse(JSON.stringify(L)); c.id = "M" + uid(5); c.mine = true; c.titre += " (ma version)"; editLecon(c, true); } };
  $("#fDel", m) && ($("#fDel", m).onclick = async () => { if (!confirm("Supprimer la leçon « " + L.titre + " » ?")) return; await DB.set("biblio", (await blib()).filter(x => x.id !== L.id)); m.close(); setPTab("biblio"); });
}
function courseFromLecon(L) {
  const o = L.o; const n = P.courses.length + 1; let code = "P" + n; while (P.courses.some(k => k.k === code)) code = "P" + (+code.slice(1) + 1);
  const k = { id: uid(6), k: code, nom: L.titre, mode: o.mode, ctrl: [], bonus: [], pts: {}, depart: P.controls.find(c => c.type === "S")?.id || null, arrivee: P.controls.find(c => c.type === "F")?.id || null,
    dm: o.dm || "libre", prep: o.prep || null, tm: o.tm || null, pen: o.pen ?? 5, so: !!o.so, choix: !!o.choix, nb: o.nb || null, ptsOn: !!o.ptsOn, rk: o.rk || "auto", valid: "auto", desc: true, fb: !!o.fb, carte: o.carte !== false, lecon: L.id };
  if (k.dm === "balise" && !k.depart) k.dm = "libre";
  P.courses.push(k); saveP(); setPTab("parcours"); editCourse(k.id);
  toast(`Parcours « ${L.titre} » créé : ${o.conseil || "choisis tes balises."}`, "ok");
}
function editLecon(L, isNew) {
  const s = L.sit = L.sit || {};
  const ta = (id, label, val, rows = 2) => `<div class="field"><label>${label}</label><textarea class="inp" id="${id}" style="min-height:${rows * 26 + 20}px">${esc(Array.isArray(val) ? val.join("\n") : val || "")}</textarea></div>`;
  const m = openModal(`<h2>${isNew ? "Nouvelle leçon" : "Modifier la leçon"}</h2><p class="muted" style="margin-top:-6px">Pour les listes : une ligne = un élément.</p>
   <div class="grid2"><div class="field"><label>Titre</label><input class="inp" id="eT" value="${esc(L.titre)}"></div><div class="field"><label>Thème</label><input class="inp" id="eTh" value="${esc(L.theme || "")}"></div>
    <div class="field"><label>N° dans le cycle (facultatif)</label><input class="inp" id="eN" type="number" min="1" value="${L.n || ""}"></div><div class="field"><label>Durée</label><input class="inp" id="eD" value="${esc(L.duree || "")}"></div></div>
   <div class="lbl">AFLP (bac pro)</div><div class="cchips" style="margin:6px 0 10px">${[1, 2, 3, 4, 5, 6].map(i => `<label class="chip" title="${esc(AFLP[i])}" style="padding:6px 10px"><input type="checkbox" data-aflp="${i}" ${L.aflp?.includes(i) ? "checked" : ""}> AFLP${i}</label>`).join("")}</div>
   <div class="lbl">AFL (bac GT)</div><div class="cchips" style="margin:6px 0 10px">${[1, 2, 3].map(i => `<label class="chip" title="${esc(AFL[i])}" style="padding:6px 10px"><input type="checkbox" data-afl="${i}" ${L.afl?.includes(i) ? "checked" : ""}> AFL${i}</label>`).join("")}</div>
   ${ta("eObj", "Objectif de la leçon", L.objectif)}${ta("eEch", "Échauffement", L.echauffement)}
   <h3>Situation d'apprentissage</h3><div class="field"><label>Nom de la situation</label><input class="inp" id="sNom2" value="${esc(s.nom || "")}"></div>
   ${ta("sBut", "But (pour l'élève)", s.but)}${ta("sDis", "Dispositif", s.dispositif)}${ta("sOrg", "Organisation", s.organisation)}
   <div class="grid2">${ta("sCon", "Consignes", s.consignes, 3)}${ta("sRe", "Critères de réussite", s.reussite, 3)}${ta("sRea", "Critères de réalisation", s.realisation, 3)}${ta("sRol", "Rôles sociaux", s.roles, 3)}${ta("sSim", "Pour simplifier", s.simplifier, 2)}${ta("sCom", "Pour complexifier", s.complexifier, 2)}</div>
   ${ta("eBil", "Bilan", L.bilan)}<div class="grid2">${ta("eSec", "Sécurité", L.securite, 3)}${ta("eMat", "Matériel", L.materiel, 3)}</div>
   <label class="row" style="gap:6px;margin:8px 0"><input type="checkbox" id="eO" ${L.o ? "checked" : ""}> Associer des réglages OrienRun ${L.o ? `(${esc(modeNom[L.o.mode] || "")})` : ""}</label>
   <div id="eOBox" class="${L.o ? "" : "hidden"}"><div class="grid2"><div class="field"><label>Type de parcours</label><select class="inp" id="oM">${Object.entries(modeNom).map(([a, b]) => `<option value="${a}" ${L.o?.mode === a ? "selected" : ""}>${b}</option>`).join("")}</select></div>
    <div class="field"><label>Balises conseillées</label><input class="inp" id="oNb" type="number" min="1" value="${L.o?.nbB || 8}"></div><div class="field"><label>Préparation (min)</label><input class="inp" id="oP" type="number" min="0" value="${L.o?.prep || 0}"></div><div class="field"><label>Durée max (min)</label><input class="inp" id="oT" type="number" min="0" value="${L.o?.tm || ""}"></div>
    <div class="field"><label>Départ</label><select class="inp" id="oDm">${Object.entries(DEPART_MODES).map(([a, b]) => `<option value="${a}" ${(L.o?.dm || "libre") === a ? "selected" : ""}>${b}</option>`).join("")}</select></div><div class="field"><label>Conseil pour choisir les balises</label><input class="inp" id="oC" value="${esc(L.o?.conseil || "")}"></div></div>
    <div class="cchips"><label class="chip"><input type="checkbox" id="oCh" ${L.o?.choix ? "checked" : ""}> l'élève choisit ses balises</label><label class="chip"><input type="checkbox" id="oSo" ${L.o?.so ? "checked" : ""}> ordre sanctionné</label><label class="chip"><input type="checkbox" id="oPts" ${L.o?.ptsOn ? "checked" : ""}> points</label><label class="chip"><input type="checkbox" id="oFb" ${L.o?.fb ? "checked" : ""}> réponse juste/fausse immédiate</label><label class="chip"><input type="checkbox" id="oCa" ${L.o?.carte !== false ? "checked" : ""}> carte sur le téléphone</label></div></div>
   <div class="row" style="margin-top:14px"><button class="btn green" id="eSave">Enregistrer</button></div>`, { wide: true });
  $("#eO", m).onchange = e => $("#eOBox", m).classList.toggle("hidden", !e.target.checked);
  const lines = id => $("#" + id, m).value.split("\n").map(x => x.trim()).filter(Boolean), txt = id => $("#" + id, m).value.trim();
  $("#eSave", m).onclick = async () => {
    if (!txt("eT")) return toast("Donne un titre à la leçon", "ko");
    Object.assign(L, { titre: txt("eT"), theme: txt("eTh"), n: +txt("eN") || null, duree: txt("eD"), cat: "cycle", mine: true, aflp: $$("[data-aflp]:checked", m).map(i => +i.dataset.aflp), afl: $$("[data-afl]:checked", m).map(i => +i.dataset.afl), objectif: txt("eObj"), echauffement: txt("eEch"), bilan: txt("eBil"), securite: lines("eSec"), materiel: lines("eMat"),
      sit: { nom: txt("sNom2"), but: txt("sBut"), dispositif: txt("sDis"), organisation: txt("sOrg"), consignes: lines("sCon"), reussite: lines("sRe"), realisation: lines("sRea"), roles: txt("sRol"), simplifier: lines("sSim"), complexifier: lines("sCom") },
      o: $("#eO", m).checked ? { mode: $("#oM", m).value, nbB: +txt("oNb") || 8, prep: +txt("oP") || 0, tm: +txt("oT") || null, dm: $("#oDm", m).value, conseil: txt("oC"), choix: $("#oCh", m).checked, so: $("#oSo", m).checked, ptsOn: $("#oPts", m).checked, fb: $("#oFb", m).checked, carte: $("#oCa", m).checked, rk: "auto" } : null });
    const M = await blib(); const i = M.findIndex(x => x.id === L.id); if (i >= 0) M[i] = L; else M.push(L); await DB.set("biblio", M);
    toast("Leçon enregistrée ✓", "ok"); m.close(); LS.set("biblioFilt", "mes"); setPTab("biblio");
  };
}
function printPlan(list) {
  const niv = blibNiv();
  printWin("Plan de cycle – course d'orientation", `<h1>Plan de cycle — Course d'orientation (CA2)</h1><p>Classe : ……………… · Période : ……………… · Lieu : ………………</p>
   <table><thead><tr><th>Leçon</th><th>Titre et thème</th><th>${niv === "gt" ? "AFL" : "AFLP"}</th><th>Objectif</th><th>Situation principale</th><th>OrienRun</th></tr></thead><tbody>${list.map(L => `<tr><td><b>${L.n || ""}</b></td><td><b>${esc(L.titre)}</b><br><small>${esc(L.theme || "")}</small></td><td>${attendus(L, niv).map(a => a.k).join(", ")}</td><td>${esc(L.objectif || "")}</td><td><b>${esc(L.sit?.nom || "")}</b><br><small>${esc(L.sit?.but || "")}</small></td><td><small>${L.o ? esc(modeNom[L.o.mode] || "") + (L.o.prep ? ` · prépa ${L.o.prep} min` : "") + (L.o.tm ? ` · ${L.o.tm} min` : "") : "–"}</small></td></tr>`).join("")}</tbody></table>
   <h3>${niv === "gt" ? "Attendus de fin de lycée (bac GT)" : "Attendus de fin de lycée professionnel"} — CA2</h3><ul>${Object.entries(niv === "gt" ? AFL : AFLP).map(([i, t]) => `<li><b>${niv === "gt" ? "AFL" : "AFLP"}${i}</b> — ${esc(t)}</li>`).join("")}</ul>`,
    `@page{size:A4 landscape;margin:9mm}h1{font-size:16pt}table{border-collapse:collapse;width:100%;font-size:8.5pt}td,th{border:1px solid #999;padding:1.5mm;vertical-align:top;text-align:left}th{background:#f3efe4}h3{font-size:11pt;margin-top:5mm}li{font-size:9pt}`);
}
