/* 📖 Culture de l'activité (demande de l'enseignant, 28/11/2026) : quelques repères courts par activité, à consulter pendant un temps mort ou depuis
   l'espace EPS. Toujours derrière une PETITE icône 📖 : jamais affiché dans la leçon, jamais obligatoire.
   Fichier commun sans dépendance (chargé par eps-home.js dans les applis d'activité, et par mon-bilan/ sur le téléphone de l'élève).
   Une ligne = « Titre : texte ». L'enseignant modifie ces lignes dans ⚙ Réglages → 🎛 Paramètres → « Culture de l'activité » (paramètre culture_<dossier>).
   Repères rédigés par Claude à partir des règlements et de l'histoire connus des fédérations : à relire et à adapter aux règles de la classe. */
(function () {
  var D = {
    volley: { nom: "Volley-ball", l: [
      "D'où ça vient : inventé en 1895 aux États-Unis par William G. Morgan, professeur d'éducation physique, qui cherchait un jeu sans contact. Sport olympique depuis 1964.",
      "Le principe : faire tomber le ballon dans le camp adverse, par-dessus le filet, sans qu'il touche le sol chez soi. Trois touches au maximum par équipe.",
      "Les règles à connaître : un set se gagne à 25 points avec 2 points d'écart ; on tourne d'un poste quand on récupère le service ; interdit de toucher le filet ou de frapper deux fois de suite.",
      "Les formes de pratique : 6 contre 6 en salle, 2 contre 2 sur le sable (beach-volley, olympique depuis 1996), volley assis en handisport.",
      "En dehors du lycée : clubs de la Fédération française de volley, association sportive du lycée (UNSS), terrains de plage ou de parc l'été.",
      "Le savais-tu ? Le libero, joueur spécialiste de la défense au maillot différent, n'existe que depuis 1998." ] },
    badminton: { nom: "Badminton", l: [
      "D'où ça vient : le jeu moderne naît en Angleterre vers 1870 et prend le nom du domaine de Badminton House. Sport olympique depuis 1992.",
      "Le principe : faire tomber le volant dans le terrain adverse, ou pousser l'adversaire à la faute. On gagne en le déplaçant et en créant un espace libre.",
      "Les règles à connaître : un set se joue en 21 points avec 2 points d'écart ; le match en 2 sets gagnants ; le service se frappe par en dessous, en diagonale.",
      "Les formes de pratique : simple, double, double mixte ; para-badminton debout ou en fauteuil.",
      "En dehors du lycée : clubs de la Fédération française de badminton, association sportive (UNSS), créneaux de loisir dans beaucoup de gymnases.",
      "Le savais-tu ? Le volant de compétition porte 16 plumes ; sur un smash, il peut dépasser 400 km/h au départ de la raquette." ] },
    escalade: { nom: "Escalade", l: [
      "D'où ça vient : née de l'alpinisme, l'escalade devient une pratique à part entière au XXe siècle ; les murs artificiels se répandent à partir des années 1980. Sport olympique depuis les Jeux de Tokyo 2020.",
      "Le principe : grimper une voie en lisant son itinéraire, en économisant ses bras et en poussant sur ses jambes, toujours assuré par un partenaire.",
      "Les règles à connaître : le nœud, le baudrier et le système d'assurage se vérifient à deux avant chaque départ ; l'assureur ne lâche jamais la corde sous le frein.",
      "Les formes de pratique : difficulté (aller le plus haut), bloc (passages courts sans corde, au-dessus de tapis), vitesse (voie identique partout dans le monde).",
      "En dehors du lycée : salles d'escalade, clubs de la FFME ou du Club alpin, falaises équipées avec un encadrement.",
      "Le savais-tu ? Les cotations françaises vont de 3 à 9, précisées par les lettres a, b, c : un 6a est plus difficile qu'un 5c." ] },
    acrosport: { nom: "Acrosport", l: [
      "D'où ça vient : les pyramides humaines existent depuis l'Antiquité ; la gymnastique acrobatique a ses championnats du monde depuis 1974.",
      "Le principe : construire à plusieurs des figures tenues ou dynamiques, les relier par des éléments gymniques et chorégraphiques, pour être vu et apprécié.",
      "Les règles à connaître : une figure statique se tient 3 secondes ; on monte et on démonte sans chute ; le pareur est présent sur toute figure nouvelle ou haute.",
      "Les formes de pratique : duos, trios, quatuors, groupes ; en compétition la discipline s'appelle gymnastique acrobatique.",
      "En dehors du lycée : clubs de la Fédération française de gymnastique, écoles de cirque, association sportive (UNSS).",
      "Le savais-tu ? En Catalogne, les castells sont des tours humaines de plusieurs étages, inscrites au patrimoine culturel immatériel de l'UNESCO." ] },
    relais: { nom: "Relais-vitesse", l: [
      "D'où ça vient : les courses de relais apparaissent à la fin du XIXe siècle ; le 4 × 100 m est olympique depuis 1912.",
      "Le principe : faire aller le témoin le plus vite possible. Le témoin ne doit jamais ralentir : le receveur part avant l'arrivée du donneur.",
      "Les règles à connaître : le témoin se transmet dans la zone de transmission (30 m en 4 × 100 m) ; hors de la zone, l'équipe est disqualifiée ; chacun reste dans son couloir.",
      "Les formes de pratique : 4 × 100 m, 4 × 400 m, relais mixtes, relais de cross ; au lycée, relais courts en binômes ou par équipes.",
      "En dehors du lycée : clubs de la Fédération française d'athlétisme, association sportive (UNSS), meetings et championnats.",
      "Le savais-tu ? Une équipe peut battre une équipe de meilleurs sprinteurs grâce à ses transmissions : au 4 × 100 m, le temps de l'équipe est meilleur que la somme des quatre records individuels." ] },
    danse: { nom: "Danse", l: [
      "D'où ça vient : la danse contemporaine se développe au XXe siècle en rompant avec les codes du ballet ; le hip-hop naît dans les années 1970 à New York.",
      "Le principe : créer à plusieurs une chorégraphie qui porte une intention, pour être vue. On joue sur l'espace, le temps, l'énergie et la relation entre danseurs.",
      "Les repères à connaître : un début et une fin marqués, une présence (regard, concentration), des procédés de composition : unisson, canon, répétition, accumulation.",
      "Les formes de pratique : contemporain, hip-hop, jazz, classique, danses du monde ; le breaking a été discipline olympique à Paris en 2024.",
      "En dehors du lycée : écoles de danse, conservatoires, maisons de quartier, spectacles et festivals à aller voir.",
      "Quelques noms : Pina Bausch, Merce Cunningham, Maurice Béjart, Mourad Merzouki." ] },
    crosstraining: { nom: "Cross-training", l: [
      "D'où ça vient : l'entraînement croisé mélange des exercices venus de l'haltérophilie, de la gymnastique et des sports d'endurance. Il se popularise dans les années 2000.",
      "Le principe : s'entraîner pour progresser, en choisissant ses exercices, sa charge et sa récupération selon un objectif personnel.",
      "Les règles à connaître : la technique passe avant la vitesse et la charge ; on s'échauffe, on respecte les temps de repos, on note ce qu'on fait pour suivre ses progrès.",
      "Les formes de pratique : circuits au poids du corps ou avec charges, formats AMRAP (le plus de tours possible), EMOM (chaque minute), Tabata (20 s d'effort, 10 s de repos).",
      "En dehors du lycée : salles de sport, parcours de santé en plein air, entraînement chez soi avec peu de matériel.",
      "Le savais-tu ? Le format Tabata porte le nom du chercheur japonais Izumi Tabata, qui l'a étudié en 1996." ] },
    orientation: { nom: "Course d'orientation", l: [
      "D'où ça vient : née en Scandinavie à la fin du XIXe siècle, d'abord comme exercice militaire ; première course publique en Norvège en 1897.",
      "Le principe : trouver des balises dans l'ordre, le plus vite possible, avec une carte et parfois une boussole. On choisit son itinéraire : le plus court n'est pas toujours le plus rapide.",
      "Les règles à connaître : on poinçonne chaque balise soi-même ; on respecte les limites de la zone et l'heure de retour ; on ne déplace jamais une balise.",
      "Les formes de pratique : à pied, à VTT, à ski, en ville (sprint urbain), de nuit, en relais.",
      "En dehors du lycée : clubs de la Fédération française de course d'orientation, parcours permanents dans des parcs et des forêts.",
      "Lire la carte : blanc = forêt où l'on court bien, vert = végétation dense, jaune = terrain découvert, bleu = eau, brun = relief, noir = constructions et rochers." ] },
    basket: { nom: "Basket-ball", l: [
      "D'où ça vient : inventé en 1891 aux États-Unis par James Naismith, professeur d'éducation physique, avec deux paniers de pêches. Sport olympique depuis 1936.",
      "Le principe : marquer dans le panier adverse en faisant circuler le ballon à la main, et empêcher l'adversaire de marquer, sans contact.",
      "Les règles à connaître : on dribble pour se déplacer ; ni marcher ni reprise de dribble ; un panier vaut 1, 2 ou 3 points ; le panier est à 3,05 m.",
      "Les formes de pratique : 5 contre 5 sur tout le terrain ; 3 contre 3 sur un seul panier (olympique depuis les Jeux de Tokyo 2020) ; basket fauteuil.",
      "En dehors du lycée : clubs de la Fédération française de basket-ball, association sportive (UNSS), terrains de quartier en accès libre.",
      "Le savais-tu ? En 3 contre 3, un match dure 10 minutes ou s'arrête dès qu'une équipe atteint 21 points, et l'attaque n'a que 12 secondes pour tirer." ] },
    step: { nom: "Step", l: [
      "D'où ça vient : imaginé à la fin des années 1980 aux États-Unis par Gin Miller, qui rééduquait son genou en montant et descendant une marche.",
      "Le principe : enchaîner des pas sur une marche, en musique, pour produire un effort choisi et le tenir dans la durée.",
      "Les règles à connaître : poser tout le pied sur la marche ; descendre près de la marche ; garder le dos droit ; suivre le tempo de la musique.",
      "Les formes de pratique : enchaînements par blocs de 32 temps, seul ou en groupe ; intensité réglée par la hauteur de la marche, le tempo et les mouvements de bras.",
      "En dehors du lycée : cours collectifs en salle de sport ou en association, séances chez soi avec une simple marche.",
      "Le savais-tu ? Les musiques de step sont découpées en phrases de 8 temps : un bloc de 32 temps correspond à quatre phrases." ] } };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function flat(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
  /* lignes modifiées par l'enseignant (eps.param.v1, « <dossier>|culture_<dossier> ») quand la page y a accès ; sinon le texte d'origine */
  function lignes(dir) { var d = D[dir]; if (!d) return [];
    try { var V = JSON.parse(localStorage.getItem("eps.param.v1") || "null"), o = V && V.items && V.items[dir + "|culture_" + dir]; if (o && !o.del && Array.isArray(o.v) && o.v.length) return o.v.map(String); } catch (e) {}
    return d.l.slice(); }
  /* dossier d'une activité d'après son nom (« Volley-ball », « Relais Vitesse », « Escalade EPS »…) */
  function dossier(nom) { var f = flat(nom); if (D[f]) return f; var K = Object.keys(D); for (var i = 0; i < K.length; i++) { var n = flat(D[K[i]].nom); if (f.indexOf(K[i]) >= 0 || f.indexOf(n) >= 0 || n.indexOf(f) >= 0) return K[i]; }
    if (/relais/.test(f)) return "relais"; if (/orien/.test(f)) return "orientation"; if (/cross/.test(f)) return "crosstraining"; if (/acro/.test(f)) return "acrosport"; if (/volley/.test(f)) return "volley"; if (/basket/.test(f)) return "basket"; return ""; }
  function cartes(L, cls) { return (L || []).map(function (t) { t = String(t); var i = t.indexOf(":"), m = i > 0 ? t.slice(0, i).trim() : "", d = i > 0 ? t.slice(i + 1).trim() : t; d = d.charAt(0).toUpperCase() + d.slice(1);
    return '<div class="' + (cls || "epsgs-card") + '" style="background:#fff;border:1.5px solid #E6E1D6;border-radius:14px;padding:12px 14px;margin:0 0 10px">' + (m ? '<h3 style="margin:0 0 4px;font-size:17px">' + esc(m) + "</h3>" : "") + '<p style="margin:0;line-height:1.45">' + esc(d) + "</p></div>"; }).join(""); }
  /* bloc complet d'une activité : repères de culture, puis le lexique s'il est fourni */
  function html(dir, o) { o = o || {}; var L = o.lignes || lignes(dir), lex = o.lex || [];
    return (L.length ? cartes(L) : '<p style="color:#6A6F78">Pas encore de repères pour cette activité.</p>') +
      (lex.length ? '<h2 style="margin:18px 0 8px;font-size:19px">📖 Les mots de l\'activité</h2>' + cartes(lex) : ""); }
  window.EPSCULT = { data: D, lignes: lignes, dossier: dossier, html: html, noms: function () { return Object.keys(D).map(function (k) { return { dir: k, nom: D[k].nom }; }); } };
})();
