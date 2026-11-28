/* Contenu des guides (page guide/). Trois niveaux × (général + une version par activité).
   a = élève, simple et imagé (tutoiement) · b = enseignant, l'essentiel · c = enseignant, détaillé.
   Blocs : ["flow", [[titre, texte]…]] étapes numérotées · ["img", fichier, légende] · ["two", [fichier, légende], [fichier, légende]]
           ["strip", [[gras, petit]…]] · ["cols", [[titre, [lignes…]]…]] · ["steps", [lignes…]] · ["p", texte]
           ["tab", [en-têtes], [[cellules]…]] · ["aide", clé d'eps-guides.js] (toutes les fonctions, source unique : eps-guides.js)
   Règles (CLAUDE.md) : captures avec la classe fictive uniquement ; ne jamais lister ce qui manque ; « leçon » et « séquence » ;
   critère de réussite = ce qu'il y a à faire pour être en réussite ; critère de réalisation = ce qu'il y a à faire pour faire. */
window.EPS_GUIDE = (function () {
  var ACTS = [
    { k: "gen", nom: "Général", c: "#14171C" },
    { k: "acro", nom: "Acrosport", c: "#1F4FA3" },
    { k: "esc", nom: "Escalade", c: "#2E7D4F" },
    { k: "ori", nom: "Course d'orientation", c: "#E8701A" },
    { k: "rel", nom: "Relais", c: "#D9481F" },
    { k: "vol", nom: "Volley", c: "#6B3FA0" },
    { k: "bad", nom: "Badminton", c: "#0B7A75" },
    { k: "dan", nom: "Danse", c: "#C2185B" },
    { k: "ct", nom: "Cross-training", c: "#4D7C0F" },
    { k: "bk", nom: "Basket", c: "#A4161A" },
    { k: "step", nom: "Step", c: "#A21CAF" },
    { k: "ccf", nom: "CCF", c: "#B8860B" }
  ];
  var NIV = [
    { k: "a", ico: "👩‍🎓", nom: "Élève", sub: "simple et imagé" },
    { k: "b", ico: "🧑‍🏫", nom: "Enseignant", sub: "l'essentiel" },
    { k: "c", ico: "📘", nom: "Enseignant", sub: "détaillé" }
  ];
  var G = { a: {}, b: {}, c: {} };

  /* ============================== GÉNÉRAL ============================== */
  G.a.gen = [
    { t: "Mon parcours, le même dans toutes les activités", b: [
      ["flow", [["Je choisis", "mon activité, puis ma classe"], ["Je me trouve", "mon prénom, mon groupe ou mon équipe"], ["Je fais", "je lis ou j'écoute 🔊 la consigne"], ["Je note", "✅ réussi · 🟠 en partie · ❌ pas encore"], ["Je me positionne", "un critère par écran, puis mes mots"]]],
      ["two", ["accueil-eleve.jpg", "1 · L'accueil : une tuile par activité."], ["classe.jpg", "2 · « Choisis ta classe ». Sans classe, les ressources restent ouvertes."]],
      ["strip", [["📅 Ma leçon", "la leçon en cours"], ["▶ Continuer", "mon activité, mes résultats"], ["📒 Mon bilan", "mon carnet ou mon espace EPS"], ["📖 Culture et lexique", "quand j'ai un moment : d'où vient l'activité, ses règles, ses mots"]]]
    ] },
    { t: "Pendant la leçon", b: [
      ["flow", [["La leçon s'ouvre", "toute seule quand mon enseignant la lance"], ["Qui utilise cette tablette ?", "je touche mon prénom"], ["Je lis la situation", "ou je touche 🔊 pour l'écouter"], ["Je fais", "puis je note mon résultat"]]],
      ["img", "lecon-eleve.jpg", "La fiche de la leçon sur la tablette : la consigne, puis ce que je dois réussir."],
      ["strip", [["✅ Je suis en réussite si…", "ce qu'il y a à faire pour être en réussite"], ["💡 Comment faire…", "ce qu'il y a à faire pour faire"], ["− / +", "plus simple ou plus difficile"], ["🎭 Mon rôle", "coach, arbitre, observateur…"], ["⏱ Minuteur", "le temps qu'il reste"], ["🎯 En autonomie", "une situation pour progresser"]]]
    ] },
    { t: "Quand mon enseignant m'envoie quelque chose", b: [
      ["strip", [["✋ Enseignant", "dans le bandeau : je dis où je suis et pourquoi, mon enseignant est prévenu"], ["📣 Message en grand", "je lis, puis « ✓ J'ai compris »"], ["📋 Planche", "un schéma pour mon équipe, puis « ✓ Vu »"], ["🟢 🟠 🔴", "mon résultat par rapport au seuil"]]],
      ["img", "planche-recue.jpg", "Une planche envoyée par l'enseignant s'affiche en plein écran."]
    ] },
    { t: "Je me positionne", b: [
      ["flow", [["Mon nom", "je le choisis dans la liste"], ["Un critère par écran", "je touche le niveau qui me ressemble"], ["Avec mes mots", "ce que j'ai réussi, ce que je veux améliorer"], ["Je vérifie", "le récapitulatif, puis j'envoie"]]],
      ["p", "Mon avis s'affiche à côté de celui de mon enseignant : je vois où nous sommes d'accord."]
    ] },
    { t: "Mes outils, dans toutes les activités", b: [
      ["cols", [["📋 Planche tactique", ["Je place les joueurs et le ballon", "Je trace déplacements et passes", "J'explique mon idée à mon équipe"]], ["⏱ Chrono", ["Jusqu'à 8 coureurs, un seul départ", "« Tour » à chaque passage", "Je compare les temps de passage"]], ["🔢 Compteur", ["Je choisis ce que je compte", "Un appui = +1, « ↶ Annuler » si je me trompe", "Je lis les pourcentages"]], ["🎥 Vidéo différée", ["Je fais mon geste", "Je me regarde quelques secondes après", "Rien n'est enregistré"]], ["🎞 Analyse vidéo", ["Ralenti et image par image", "Je dessine sur l'image", "Je coche ce que je dois regarder"]], ["❓ Quiz", ["Je choisis mon nom, puis un quiz", "Une question par écran, la réponse expliquée", "Je recommence pour améliorer mon score"]], ["📒 Mon carnet", ["Ma classe, mon nom, mon code personnel", "Mon année : activités, réussite", "J'écris mon objectif"]]]],
      ["two", ["outils.jpg", "La boîte à outils."], ["quiz.jpg", "Un quiz : une question par écran."]]
    ] },
    { t: "Sur mon téléphone : mon espace", b: [
      ["flow", [["J'ouvre le lien", "ou je scanne le QR code de ma fiche"], ["Je tape mon code", "6 caractères, il est personnel"], ["À faire", "un quiz, une vidéo, une mission : je le fais, mon enseignant le voit"], ["Mes activités", "ma progression, mon bilan, ma note"]]],
      ["img", "mon-espace.jpg", "Mon espace sur téléphone : deux onglets, « À faire » et « Mes activités »."]
    ] },
    { t: "Trois règles", b: [["strip", [["1", "Je prends soin de la tablette."], ["2", "Je ne touche qu'à mon nom et à mon équipe."], ["3", "Je reste dans l'activité demandée."]]]] }
  ];

  G.b.gen = [
    { t: "Entrer en mode enseignant", b: [
      ["flow", [["3 appuis rapides", "sur le logo de l'appli (ou un appui de 2 s)"], ["Code à 4 chiffres", "validé tout seul"], ["Espace enseignant", "les mêmes onglets partout"]]],
      ["img", "accueil-prof.jpg", "En mode enseignant, l'accueil montre aussi les outils enseignant."]
    ] },
    { t: "Les onglets, identiques dans chaque activité", b: [
      ["strip", [["📅 Séquence", "préparer et conduire"], ["👁 Vue élève", "classe fictive DÉMO"], ["📚 Bibliothèque", "documents, banque"], ["📋 Évaluer", "leçons, finale, bilan"], ["📜 CCF", "notes, protocole"], ["👥 Classe", "élèves, groupes"], ["📤 Bilan et export", "PDF, Pronote, en ligne"], ["⚙ Réglages", "tout est paramétrable"]]],
      ["img", "espace-prof.jpg", "Sous les onglets, la barre d'outils. « ⋯ Plus » contient le reste ; ☆ épingle une action."]
    ] },
    { t: "Les classes, une seule fois pour tout", b: [
      ["flow", [["J'importe", "Excel ou CSV, depuis l'accueil ou une appli"], ["Visible partout", "toutes les applis, toutes les tablettes"], ["Activités de la classe", "d'après l'emploi du temps, ou cochées à la main"], ["Pour essayer", "la classe « DÉMO (fictive) »"]]]
    ] },
    { t: "Une leçon : avant, pendant, après", b: [
      ["cols", [["Avant", ["📝 Fiche de leçon (ou document déposé → « Mettre en fiches »)", "✓ Valider, puis 📅 programmer", "✅ Tout est prêt ?"]], ["Pendant", ["📡 Leçon en cours : appel, ▶ Démarrer", "🧩 Groupes et 🎭 rôles du jour", "📣 Message, ⏱ minuteur, 📋 planche", "🧭 Pilotage de leçon", "🎙 Observation dictée"]], ["Après", ["📊 Évaluer la leçon", "🏁 Bilan de séquence", "🎯 Remédiation proposée", "🏫 Ma classe : vue d'ensemble"]]]],
      ["two", ["lecon-fiche.jpg", "Avant : la fiche de leçon."], ["lecon-cours.jpg", "Pendant : la leçon en cours."]]
    ] },
    { t: "Évaluer, puis rendre les bilans", b: [
      ["flow", [["📋 Grille par degrés", "un appui par critère, curseur pour affiner"], ["🙋 L'élève se positionne", "QR code ou tablette, à côté de mon avis"], ["🎯 Note proposée", "je garde la décision"], ["📤 Bilan et export", "PDF par élève, .zip, Pronote, en ligne"]]],
      ["img", "evaluation.jpg", "L'onglet Évaluer : leçons du jour, évaluation finale, bilan et export."]
    ] },
    { t: "Envoyer quelque chose aux tablettes", b: [
      ["flow", [["📣 dans le bandeau", "sur ma tablette"], ["Signal ou planche", "message en grand avec un son, ou schéma dessiné"], ["À qui ?", "tous les élèves, ou les tablettes choisies"], ["Reçu", "en plein écran ; « 🔴 En direct » suit mon dessin"]]],
      ["two", ["planche-prof.jpg", "Je dessine, je choisis les tablettes, j'envoie."], ["planche-recue.jpg", "Ce que voit l'équipe."]]
    ] },
    { t: "Espace élève et missions", b: [
      ["flow", [["🎒 Espace élève", "la liste « À faire » de la classe"], ["🌐 Publier", "un lien ou un QR code pour toute la classe"], ["L'élève", "ouvre avec son code personnel, sur son téléphone"], ["📥 Retours", "tâches faites, scores, observations"]]],
      ["p", "Un élève dispensé ou un rôle du jour : 🩹 Dispensés → « 🎯 Donner une mission » (compteur d'observation ou fiche de rôle), sur son téléphone."],
      ["img", "espace.jpg", "Le réglage de l'espace élève : la liste « À faire », la publication, les retours."]
    ] },
    { t: "Les outils", b: [
      ["cols", [["❓ Quiz", ["✏ Mes quiz : questions, réponses, explication", "Ouvert aux élèves, ou fermé", "📊 Résultats par classe et par question"]], ["📒 Carnet de l'élève", ["Ouvert aux élèves quand je le décide", "L'année en cours, lue en direct", "📦 Garder l'année : le parcours sur 3 ans"]], ["🧰 Boîte à outils", ["Chrono, compteur", "Vidéo différée, analyse vidéo", "Estimation de charge"]], ["🛡 Attestation numérique", ["Texte modifiable", "Une feuille A5 par élève, une seule face", "Suivi des retours et des autorisations"]], ["🖥 Console ordinateur", ["Ma journée, Mes classes", "Atelier des leçons, programmation annuelle", "Tous les paramètres, assistant Claude"]], ["🧭 Référentiel", ["Mes compétences générales", "Chaque critère de grille rattaché une fois", "Élève, classe, couverture"]]]],
      ["two", ["console.jpg", "La console, sur ordinateur."], ["attestation.jpg", "L'attestation, prête à imprimer."]]
    ] },
    { t: "Partage entre tablettes", b: [
      ["flow", [["Partage", "Réglages communs : script et clé"], ["Autres tablettes", "« Régler une autre tablette » : elles scannent le QR code"], ["Hors ligne", "ouvrir chaque activité une fois avec le réseau"], ["Tablette neuve", "« 📥 Tout récupérer »"]]],
      ["tab", ["Signe", "Sens", "Que faire"], [["✓", "Tout est envoyé", "Rien"], ["⏳", "Envois en attente", "Laisser l'appli ouverte avec du réseau : l'envoi repart seul et n'est retiré de l'attente qu'une fois reçu"], ["⚠", "Hors ligne, clé refusée ou script à mettre à jour", "Vérifier le réseau, puis le partage"], ["🔄 avec pastille rouge", "Nouvelle version", "Toucher le bouton (mode enseignant)"]]]
    ] }
  ];

  G.c.gen = [
    { t: "Accueil", b: [
      ["steps", ["Ouvre l'appli : l'accueil présente une tuile par activité, puis les « Outils pour tous » (planche tactique, boîte à outils, quiz, carnet quand il est ouvert).", "Passe en mode enseignant : 3 appuis rapides sur le logo (ou un appui de 2 s), puis ton code à 4 chiffres, validé tout seul.", "Les « Outils enseignant » apparaissent : emploi du temps, console, attestation, espace élève, référentiel, guide, appel AS.", "⚙ Réglages : nom de l'établissement, de l'enseignant, année scolaire. Ils figurent dans l'en-tête de tous les bilans.", "Le bandeau « ▶ Leçon en cours » ramène à la leçon lancée depuis moins de 4 h."]],
      ["cols", [["Réglages", ["Code enseignant : 4 chiffres, le même partout", "☀ Contraste fort, par tablette (plein soleil)", "Classe de démonstration « DÉMO (fictive) »", "🧪 Simulation : essayer sans rien envoyer"]], ["Cas particuliers", ["Les élèves n'ont aucun bouton enseignant ni bouton 🔄", "Côté élève, le retour arrière du navigateur est bloqué", "📊 Vue d'ensemble et 🔍 recherche d'élève : mode enseignant seulement"]]]]
    ] },
    { t: "Classes", b: [
      ["steps", ["⚙ Réglages → Listes d'élèves : importe un fichier Excel ou CSV, ou colle les noms.", "La classe apparaît aussitôt dans toutes les applis et, avec le partage, sur toutes les tablettes.", "Coche les activités de la classe ; avec l'emploi du temps renseigné, elles sont déduites toutes seules (un choix à la main reste prioritaire).", "Bouton Voie : générale ou professionnelle. TGT, 2GT, 1GT sont en voie générale, les autres en voie professionnelle ; ton choix l'emporte.", "Renommer, corriger un élève, regrouper deux classes en un groupe d'EPS : même écran."]],
      ["cols", [["Cas particuliers", ["Une classe ou un élève qui a déjà des données n'est jamais effacé", "Supprimer une liste : double confirmation", "Noms avec apostrophe, accent ou trait d'union : acceptés partout"]], ["Appel et dispensés", ["L'appel officiel reste celui de Pronote", "🙋 Appel du jour dans 📡 Leçon en cours : sert aux groupes, au matériel, à l'évaluation de leçon", "🩹 pastille des dispensés de la classe choisie, dans le bandeau"]]]]
    ] },
    { t: "Leçon · avant", b: [
      ["steps", ["📅 Séquence → 📝 Fiches de leçon → ＋ Nouvelle leçon. La fiche suit ta structure : objectifs moteur, méthodologique et social, but, dispositif, matériel, échauffement, situations, remise en action, bilan.", "Dans chaque situation : consigne, schéma, critères de réussite (ce qu'il y a à faire pour être en réussite : quantitatifs, ce qui se compte ; qualitatifs, ce qui s'observe), critères de réalisation (ce qu'il y a à faire pour faire), variables − / +.", "Tu as déjà tes leçons rédigées : 📂 Mes documents → dépose le fichier → « Mettre en fiches ». Un document Word garde ses schémas.", "✨ Proposer avec Claude : tout ce qu'il rédige arrive en brouillon, avec un aperçu ; rien n'est enregistré avant « ✓ Ajouter ».", "« ✓ Valider » la fiche : elle devient visible des élèves et programmable.", "👥 Classes concernées : attribue la leçon à une ou plusieurs classes pour construire une séquence par classe.", "📅 Programmer pour une classe (créneaux « Prochains cours »), ou « Programmer d'après l'emploi du temps » pour toute la séquence.", "✅ Tout est prêt ? : prochain cours, fiche programmée, dispensés, connexion, envois en attente."]],
      ["img", "lecon-fiche.jpg", "Une fiche de leçon. Sur grand écran, l'atelier affiche la liste, la fiche et le sommaire côte à côte."],
      ["cols", [["Réglages", ["📋 En faire mon modèle : toute nouvelle leçon part de ton modèle", "🏦 Banque : leçons et situations gardées, par apprentissage", "🖨 Fiche imprimable, ou toute la séquence", "📥 Trame de séquence proposée par certaines activités"]], ["Cas particuliers", ["Un brouillon n'est jamais montré aux élèves", "🔁 Remettre en forme : l'ancienne version reste récupérable", "🧪 Leçon simulée : la fiche de démonstration sur la classe fictive"]]]]
    ] },
    { t: "Leçon · pendant", b: [
      ["steps", ["📅 Séquence → 📡 Leçon en cours. Choisis la classe et la fiche.", "Fais l'appel du jour (touche les absents), puis ▶ Démarrer : la fiche s'ouvre sur les tablettes des élèves.", "🧩 Groupes du jour : au hasard, par niveau, par affinités ou « casser les habitudes ». Les présents non dispensés sont répartis.", "🎭 Rôles du jour : touche les rôles utiles ; « ↻ Faire tourner » pour changer.", "Avance d'étape en étape ; 📣 Message en grand avec un son, ⏱ minuteur.", "🧭 Pilotage de leçon : ✋ appels des élèves, puis la classe en cartes filtrées (🆘 en échec, ⏳ inactifs, ✅ en réussite) ; touche une carte pour le détail. Actualisé toutes les 8 s.", "🎙 dans le bandeau : dicte une observation, l'élève est reconnu par son prénom.", "Les élèves notent chaque situation : ✅ réussi, 🟠 en partie, ❌ pas encore."]],
      ["two", ["lecon-cours.jpg", "La leçon en cours, côté enseignant."], ["controle.jpg", "Le pilotage de leçon."]],
      ["cols", [["Réglages", ["Messages rapides, rôles, matériel : 🎛 Paramètres", "Seuils du pilotage de leçon", "Cadres repliables : touche leur titre"]], ["Cas particuliers", ["📣 du bandeau : signal à toutes les tablettes, même sans leçon lancée", "🎨 Indicateur coloré d'une situation : l'élève tape sa valeur, 🟢 🟠 🔴", "🎯 Remédiation en autonomie : proposée à un élève, jamais sans ton clic"]]]]
    ] },
    { t: "Leçon · après", b: [
      ["steps", ["📊 Évaluer la leçon : participation, sérieux, thème du jour, de 0 à 3, élève par élève. Critères modifiables.", "🏁 Bilan de séquence : résultats des situations, leçon par leçon.", "🏫 Ma classe : vue générale, élèves, 📝 bilans et avis, 🥋 validations, 📜 protocole pour les terminales.", "Période au choix : séquence, trimestre, année ou dates."]],
      ["img", "ma-classe.jpg", "Ma classe : la vue d'ensemble d'une séquence."]
    ] },
    { t: "Évaluation", b: [
      ["steps", ["Onglet 📋 Évaluer → 🏁 Évaluation finale : choisis la classe, puis un élève dans la colonne.", "Touche le degré de chaque critère ; le curseur affine dans le degré, la note se calcule au 0,25 point.", "🙋 Auto-positionnement : l'élève scanne le QR code de sa fiche ou utilise la tablette. Son avis s'affiche à côté du tien ; un appui sur la pastille 🙋 ouvre le détail.", "🎯 Proposition : positionnement par AFL, note proposée et sa source. Tu gardes la décision.", "Onglet Grille : textes, points, AFL ; ✨ version élève ; 📥 Importer une grille (PDF, Excel, photo), aperçu avant remplacement.", "🧪 Modalités d'évaluation : tes épreuves (degrés, points, réussi / pas encore, performance) avec leur poids.", "Onglet 📜 CCF : 📅 note de leçon, 🏁 note de séquence, 📋 protocole, 🧪 mes modalités."]],
      ["img", "evaluation.jpg", "L'évaluation par degrés."],
      ["cols", [["Réglages", ["Parts leçons / évaluations, seuils des degrés", "Débuts de phrase de l'auto-positionnement", "Grille par voie : générale ou professionnelle"]], ["Cas particuliers", ["Terminale : case CCF et répartition 4-4, 6-2 ou 2-6 par élève", "Nombres à virgule acceptés ; un champ vide est refusé", "Classe fictive : auto-positionnement de démonstration, jamais sur une vraie classe"]]]]
    ] },
    { t: "Bilans", b: [
      ["steps", ["Onglet 📋 Évaluer → 📤 Bilan et export : fiches PDF, une par élève, dans un seul PDF ou un .zip nommé avec la classe et la date, plus un récapitulatif de classe.", "📋 Pronote : ordre alphabétique de Pronote, virgule décimale, codes A (absent), D (dispensé), N (non noté) ; copie d'une colonne ou fichier .csv.", "🌐 Publier en ligne : chaque fiche est chiffrée avec le code personnel de l'élève (6 caractères).", "📝 Bilans et avis de la classe : appréciation de bulletin formulée positivement, à relire et cocher ✓ avant copie ; tu ajoutes tes remarques.", "🖨 Fiches de fin de séquence, avec le lien et le QR code du bilan."]],
      ["img", "bilans.jpg", "L'onglet Bilans."],
      ["cols", [["Cas particuliers", ["L'en-tête des bilans reprend établissement, enseignant, classe, date", "Aucun nom d'élève n'est envoyé à Claude : des codes remplacent les prénoms", "Codes des élèves à imprimer : 🌐 Bilans en ligne"]]]]
    ] },
    { t: "Espace élève et missions", b: [
      ["steps", ["Outils enseignant → 🎒 Espace élève. Choisis la classe.", "Compose la liste « À faire » : un quiz, une consigne, une vidéo à regarder.", "🌐 Publier : un lien ou un QR code unique pour la classe.", "L'élève ouvre le lien sur son téléphone et tape son code personnel : onglets « À faire » et « Mes activités ».", "📥 Retours : tâches faites, scores de quiz, observations.", "Mission individuelle : 🩹 Dispensés → « 🎯 Donner une mission », ou dans l'espace élève, pour un rôle du jour. Compteur d'observation ou fiche de rôle."]],
      ["two", ["espace.jpg", "Côté enseignant."], ["mon-espace.jpg", "Côté élève, sur téléphone."]],
      ["cols", [["Cas particuliers", ["Mauvais code : l'espace reste fermé", "Téléphone sans réseau : l'envoi repart seul, un seul envoi à la fois", "Le code personnel n'est jamais gardé sur le téléphone"]]]]
    ] },
    { t: "Quiz", b: [
      ["steps", ["Tuile ❓ Quiz → onglet « Mes quiz » (mode enseignant).", "＋ Nouveau quiz : nom, activité, puis chaque question avec ses réponses, la bonne réponse et une explication.", "« Ouvert aux élèves » le rend visible ; fermé, il reste en préparation.", "Quiz proposés : ajoutés fermés, à adapter aux règles de la classe.", "Onglet « Résultats » : par classe, par élève et par question."]],
      ["img", "quiz.jpg", "Côté élève : une question par écran, la réponse expliquée."]
    ] },
    { t: "Carnet de l'élève", b: [
      ["steps", ["Tuile 📒 Carnet. En mode enseignant, tu vois tous les élèves sans code.", "« Ouvert aux élèves » : la tuile apparaît sur leur accueil ; ils entrent avec leur code personnel.", "L'année en cours est lue en direct : activités, résultats des situations, évaluations, quiz.", "L'élève écrit son objectif.", "En fin d'année : 📦 Garder l'année, par classe. Le parcours se construit sur 3 ans.", "Un élève dont le nom a changé : « Relier » l'ancienne année au bon élève."]],
      ["img", "carnet.jpg", "Le carnet d'un élève de la classe fictive."]
    ] },
    { t: "Planche tactique", b: [
      ["steps", ["Tuile 📋 Planche tactique, 📣 du bandeau, ou bouton du 🧭 Pilotage de leçon.", "Choisis le terrain, place les joueurs et le ballon, trace déplacements et passes, ajoute un texte.", "💾 Enregistrer : la planche se retrouve sur toutes tes tablettes.", "📤 Envoyer : à tous les élèves, ou aux tablettes choisies, pour la durée voulue.", "« 🔴 En direct » : la planche envoyée suit ensuite ton dessin, sans se rouvrir.", "Les élèves touchent « ✓ Vu » ; « Retirer » l'enlève de leurs écrans."]],
      ["two", ["planche-prof.jpg", "Côté enseignant."], ["planche-recue.jpg", "Côté équipe."]]
    ] },
    { t: "Boîte à outils", b: [
      ["cols", [["⏱ Chrono", ["Plusieurs coureurs, un seul départ", "« Tour » à chaque passage", "Temps de passage comparés"]], ["🔢 Compteur", ["Intitulés choisis, ou modèles", "Un appui = +1, ↶ Annuler", "Pourcentages calculés"]], ["🎥 Vidéo différée", ["Retard réglable", "⏪ Revoir les dernières images", "Rien n'est enregistré ni envoyé"]], ["🎞 Analyse vidéo", ["Ralenti, image par image", "Tracés et angles attachés à leur moment", "2e vidéo côte à côte, repères par activité"]], ["🏋 Charge", ["Estimation à partir d'une série"]]]],
      ["img", "outils.jpg", "La boîte à outils, pour tous."]
    ] },
    { t: "Attestation numérique", b: [
      ["steps", ["Outils enseignant → 🛡 Attestation. Relis le texte de chaque rubrique et adapte-le.", "Les champs {enseignant}, {etablissement}, {annee}, {classe} se remplissent tout seuls.", "Format : A5 sur une seule face (taille du texte ajustée), A5 recto verso ou A4.", "Imprime une feuille par élève.", "Au retour, coche les attestations reçues et l'autorisation d'image."]],
      ["img", "attestation.jpg", "L'aperçu avant impression."],
      ["p", "À faire valider par ton chef d'établissement avant diffusion."]
    ] },
    { t: "Console ordinateur", b: [
      ["steps", ["Outils enseignant → 🖥 Console, sur un ordinateur. Le code est demandé une seule fois par ordinateur.", "📋 Ma journée : cours du jour, leçon programmée, matériel calculé, groupes.", "🏫 Mes classes : par classe, les activités de l'emploi du temps et la vue d'ensemble.", "📝 Leçons (atelier) et 🗓 Programmation annuelle : classes × semaines, « 📅 Placer ».", "👥 Classes et élèves, 🧩 Niveaux et groupes, 🎛 Paramètres de toutes les applis, 📱 Tablettes.", "🤖 Assistant Claude : ses propositions ne s'appliquent qu'à ton clic.", "🎨 Personnaliser : page d'ouverture, taille du texte, raccourcis, menu."]],
      ["img", "console.jpg", "La console."]
    ] },
    { t: "Partage entre tablettes", b: [
      ["steps", ["Une fois : crée le script Google commun et colle son adresse et la clé dans ⚙ Réglages → Partage.", "« Régler une autre tablette » affiche un QR code : scanne-le avec l'autre tablette, puis tape ton code enseignant.", "Chaque modification part peu après ; les autres tablettes la relèvent régulièrement. Le plus récent l'emporte, élément par élément.", "Un envoi reste « en attente » tant que le script n'a pas confirmé l'avoir reçu.", "Hors ligne : tout continue sur la tablette ; au retour du réseau, les envois repartent seuls.", "Tablette neuve : ⚙ Réglages → « 📥 Tout récupérer ».", "Mise à jour : automatique pour tous au retour de veille ; 🔄 la force (mode enseignant)."]],
      ["img", "partage.jpg", "Les réglages communs : partage, établissement, listes."],
      ["cols", [["Réglages", ["📱 Tablettes connectées : donne un nom à chaque tablette", "Sauvegarde hebdomadaire sur le Drive", "Tout ce qui part en ligne est chiffré avec la clé du partage"]], ["Hors ligne", ["Ouvre chaque activité une fois avec le réseau", "Les vidéos (acrosport, cross-training) se téléchargent par tablette"]]]]
    ] },
    { t: "Dépannage", b: [
      ["tab", ["Ce que je vois", "Cause probable", "Que faire"], [
        ["⏳ qui ne disparaît pas", "Pas de réseau, ou script qui ne confirme pas", "Laisser l'appli ouverte avec du réseau ; vérifier le partage"],
        ["⚠ sur la pastille", "Clé refusée ou script ancien", "Réglages → Partage : refaire « Régler une autre tablette » ; recoller le script si l'appli le demande"],
        ["Une classe absente dans une appli", "Activité non cochée pour cette classe", "Réglages → Listes d'élèves → activités de la classe"],
        ["Une tablette n'affiche pas la leçon", "Autre classe choisie, ou pas de réseau", "⌂ Accueil → choisir la bonne classe ; la leçon s'ouvre au retour du réseau"],
        ["Écran peu lisible au soleil", "", "☀ Contraste fort, dans le bandeau ou sur « Choisis ta classe »"],
        ["Lettres « Ã© » dans un texte", "Script commun ancien", "Recoller le script commun"],
        ["Ancienne version sur une tablette", "Restée longtemps ouverte", "🔄 en mode enseignant ; sinon elle se met à jour seule au retour de veille"]
      ]]
    ] },
    { t: "Toutes les fonctions communes", b: [["aide", "commun"]] }
  ];

  /* ============================== PAR ACTIVITÉ ============================== */
  function act(k, A, B, C) { G.a[k] = A; G.b[k] = B; G.c[k] = C; }
  var SI = "Si ça bloque";

  act("acro",
    [ { t: "Je fais quoi, dans quel ordre", b: [
        ["flow", [["Ma classe", "puis mon groupe : je le crée ou je le rejoins"], ["Je m'échauffe", "à deux, 3 niveaux"], ["Je choisis les figures", "dans la vidéothèque, en vidéo"], ["Je répète", "figure par figure, avec le minuteur de tenue"], ["J'observe", "un autre groupe, critère par critère"], ["J'enregistre", "la leçon de mon groupe"]]],
        ["img", "acro-eleve.jpg", "La barre d'étapes me dit où j'en suis."] ] },
      { t: "Mes boutons", b: [["strip", [["🎬 Vidéothèque", "les figures par position"], ["▶ Mode répétition", "vidéo, rôles, minuteur"], ["👀 Observation", "✓ réussi · ✗ à revoir"], ["🥋 Ceintures", "mes niveaux validés"], ["🔥 Échauffement", "sans choisir de classe"], ["✋ Prises de mains", "la légende des figures"]]]] },
      { t: SI, b: [["strip", [["Mot de passe oublié", "mon enseignant m'en donne un nouveau"], ["Figure 🔒", "je valide d'abord le niveau d'avant"], ["🔑 Reconnecte le groupe", "je retape le mot de passe du groupe"]]]] } ],
    [ { t: "L'essentiel", b: [
        ["cols", [["Avant", ["🚀 Démarrer une séquence : dates, figures par leçon, ceintures", "📥 Trame proposée : 8 leçons en brouillon", "Thématique du jour"]], ["Pendant", ["📊 Tableau de bord : groupes, figures, observations", "🔄 Rotation d'observation du jour", "🔑 Nouveau mot de passe d'un groupe"]], ["Après", ["🥋 Ceintures de la classe : valider, refuser", "📋 Évaluation CA3, auto-positionnement", "🗜 Bilans de la classe (.zip)"]]]],
        ["img", "acro-prof.jpg", "L'espace enseignant d'Acrosport."] ] },
      { t: "Le propre de l'activité", b: [["strip", [["176 figures", "en photo et en vidéo"], ["Ceintures", "par position, niveaux A à D"], ["Observation", "grille essentielle, puis complète"], ["Sécurité", "une erreur de sécurité bloque la validation"]]]] } ],
    [ { t: "Mise en route", b: [["steps", ["📅 Séquence → 🚀 Démarrer une séquence : pour une classe, règle les dates, le nombre de figures par leçon, la thématique du jour, les ceintures, la grille d'observation et la barre d'étapes. « Appliquer » envoie tout aux tablettes.", "Fiches de leçon → « 📥 Trame proposée » crée 8 fiches en brouillon ; ajoute tes situations puis « ✓ Valider ».", "Sur chaque tablette, en Wi-Fi : « Télécharger les vidéos » pour les lire sans réseau.", "Les élèves créent leur groupe avec un mot de passe à 4 chiffres."]]] },
      { t: "Conduire une leçon", b: [["steps", ["Les élèves suivent la barre d'étapes : s'échauffer, choisir les figures, répéter, observer, enregistrer.", "📊 Tableau de bord de la leçon : par groupe, figures choisies, leçon enregistrée, qui a observé qui. Actualisé toutes les 30 s.", "« Générer la rotation du jour » : chaque groupe trouve son groupe à observer déjà chargé.", "🥋 Ceintures de la classe : une case = valider, refuser ou laisser l'automatique."]]] },
      { t: "Toutes les fonctions", b: [["aide", "acro"]] },
      { t: "Cas particuliers et dépannage", b: [["tab", ["Situation", "Que faire"], [["Un groupe a oublié son mot de passe", "Tableau de bord → 🔑 : nouveau mot de passe à 4 chiffres"], ["Un nom d'élève ne correspond pas à la liste", "Classe → 🔗 Noms à rattacher"], ["Une vidéo ne se lit pas", "La télécharger sur la tablette, en Wi-Fi"], ["Une seule leçon enregistrée par jour", "Un nouvel enregistrement remplace celui du jour"]]]] } ]
  );

  act("esc",
    [ { t: "Je fais quoi, dans quel ordre", b: [
        ["flow", [["Ma classe", "puis mon nom"], ["Je me prépare", "échauffement, nœud de huit, assurage"], ["Je vérifie", "avec mon assureur, avant de grimper"], ["Je grimpe", "la voie choisie"], ["Je renseigne ma grimpe", "corde, voie, cordée"], ["Mes résultats", "ce que j'ai réussi"]]],
        ["img", "esc-eleve.jpg", "Avant la leçon, « Se préparer et assurer » reste ouvert."] ] },
      { t: "Mes boutons", b: [["strip", [["🧗 Se préparer et assurer", "sans choisir de classe"], ["🔎 Cotation", "chercher une voie"], ["✍ Renseigner une grimpe", "après chaque voie"], ["📊 Mes résultats", "mes grimpes"], ["🛡 Sécurité", "les règles à vérifier"]]]] },
      { t: SI, b: [["strip", [["« Pas encore de leçon »", "mon enseignant la prépare, l'écran s'ouvrira"], ["Je ne trouve pas ma voie", "je cherche par numéro de corde"]]]] } ],
    [ { t: "L'essentiel", b: [
        ["cols", [["Avant", ["Leçons et classes : préparer la leçon du jour", "Reprendre les réglages de la dernière leçon", "Thématiques de travail"]], ["Pendant", ["🖥 Tablette de contrôle : toutes les grimpes en direct", "Absents reliés à l'appel du jour", "🎙 Observation dictée"]], ["Après", ["📋 Évaluation CA2, auto-positionnement", "Résultats des grimpes, QR codes", "📄 Fiches PDF, .zip, Pronote"]]]],
        ["img", "esc-prof.jpg", "L'espace enseignant d'Escalade."] ] },
      { t: "Le propre de l'activité", b: [["strip", [["Cordes et voies", "cotations, par corde"], ["Cordée", "grimpeur, assureur, contre-assureur"], ["Indicateur coloré", "🟢 🟠 🔴 selon tes seuils"], ["Sécurité", "rien en hauteur en autonomie"]]]] } ],
    [ { t: "Mise en route", b: [["steps", ["👥 Classe : importe la liste, ou regroupe deux classes en un groupe d'EPS.", "📅 Séquence → Leçons et classes : prépare la leçon du jour, ou reprends les réglages de la dernière.", "Un seul bouton lance la leçon : 📡 Leçon en cours crée aussi la leçon du jour d'Escalade."]]] },
      { t: "Conduire une leçon", b: [["steps", ["Les élèves choisissent leur classe et leur nom, puis renseignent chaque grimpe : corde, voie, cordée.", "🖥 Tablette de contrôle : tous les élèves en direct.", "Les absents de l'appel du jour sont repris dans l'appli."]]] },
      { t: "Toutes les fonctions", b: [["aide", "esc"]] },
      { t: "Cas particuliers et dépannage", b: [["tab", ["Situation", "Que faire"], [["Classe de terminale professionnelle", "La grille reprend le protocole CCF Bac pro"], ["Écran « Pas encore de leçon » côté élève", "Lancer la leçon ; il s'ouvre tout seul"], ["Remédiation en autonomie", "Jamais de situation en hauteur ; vérification de l'enseignant rappelée"]]]] } ]
  );

  act("ori",
    [ { t: "Je fais quoi, dans quel ordre", b: [
        ["flow", [["Je scanne", "le QR code de départ donné par mon enseignant"], ["Mon nom", "je le choisis"], ["Je pars", "je suis mon parcours sur la carte"], ["À chaque balise", "je scanne son QR code"], ["J'arrive", "je vois mon résultat"]]],
        ["img", "ori-eleve.jpg", "OrienRun : « Je suis élève », puis le QR code de départ."] ] },
      { t: "Mes boutons", b: [["strip", [["🗺 Ma carte", "mon parcours et mes balises"], ["📍 Ma position", "envoyée à mon enseignant pendant la course"], ["📣 Message", "mon enseignant peut m'écrire"]]]] },
      { t: SI, b: [["strip", [["Balise « fausse »", "ce n'est pas la bonne : je relis ma carte"], ["Je suis perdu", "je reviens au dernier point sûr, puis au départ"], ["Téléphone", "je garde l'écran allumé pendant la course"]]]] } ],
    [ { t: "L'essentiel", b: [
        ["cols", [["Avant", ["🗺 Carte, 🚩 Balises, 〰 Parcours", "Pose des balises au GPS (outil enseignant)", "QR codes de départ et de balises à imprimer"]], ["Pendant", ["🛰 Leçon live : suivi GPS en direct", "Messages aux coureurs", "Appel de la leçon pré-coché"]], ["Après", ["🏁 Résultats des courses", "📋 Évaluation CA2, auto-positionnement", "📄 PDF, Pronote, en ligne"]]]],
        ["img", "ori-prof.jpg", "L'espace enseignant d'OrienRun."] ] },
      { t: "Le propre de l'activité", b: [["strip", [["OrienRun", "cartes, parcours, suivi en direct"], ["CO Évaluation", "l'épreuve, points annoncés et réalisés"], ["Pose des balises", "sur le terrain, au GPS"], ["Sécurité", "zone, horaire de retour, consignes"]]]] } ],
    [ { t: "Mise en route", b: [["steps", ["Tuile Course d'orientation : OrienRun (cartes et suivi), CO Évaluation (épreuve), Pose des balises.", "📅 Séquence → 🗺 Carte : crée ta carte et cale-la au GPS ; 🚩 Balises ; 〰 Parcours.", "Imprime les QR codes de départ et de balises.", "🆕 Nouvelle carte garde le fond de carte et le calage ; l'ancienne est rangée dans la bibliothèque."]]] },
      { t: "Conduire une leçon", b: [["steps", ["Les élèves scannent le QR code de départ : la classe et la course sont choisies.", "🛰 Leçon live : les coureurs sur la carte, leurs balises, leurs temps ; messages.", "Bilans → 🏁 Résultats des courses."]]] },
      { t: "Toutes les fonctions", b: [["aide", "ori"]] },
      { t: "Cas particuliers et dépannage", b: [["tab", ["Situation", "Que faire"], [["Pas de réseau sur le terrain", "La trace est gardée sur l'appareil et part au retour du réseau"], ["GPS imprécis sous les arbres", "Attendre quelques secondes à découvert avant le départ"], ["Épreuve de fin de séquence", "CO Évaluation, puis 📥 dans l'appli CCF pour le baccalauréat général"]]]] } ]
  );

  act("rel",
    [ { t: "Je fais quoi, dans quel ordre", b: [
        ["flow", [["Ma classe", "la leçon s'ouvre quand elle est lancée"], ["Qui va courir ?", "je touche le nom de mon groupe"], ["Au tour de…", "« On y va », ou je choisis les coureurs"], ["Notre marque", "le plot conseillé est entouré"], ["On court", "puis on enregistre la course"], ["Et maintenant ?", "la bulle me dit quoi faire"]]],
        ["img", "rel-eleve.jpg", "Sans leçon lancée, le dispositif du relais reste ouvert."] ] },
      { t: "Mes boutons", b: [["strip", [["📐 Dispositif", "zones, plots, témoin"], ["🎯 Vitesse cible", "ce que notre binôme doit atteindre"], ["🎥 Revoir cette course", "la transmission au ralenti"], ["↩ Annuler la course", "pendant 1 minute"]]]] },
      { t: SI, b: [["strip", [["« Aucune leçon en cours »", "mon enseignant va la lancer"], ["Mauvais coureurs", "« Choisir nous-mêmes »"], ["Tablette en veille", "elle redemande mon groupe"]]]] } ],
    [ { t: "L'essentiel", b: [
        ["cols", [["Avant", ["🧭 Créer toute la séquence", "Vitesses des élèves, groupes", "🔳 QR codes de la classe et des groupes"]], ["Pendant", ["📡 En direct : courses, zones, « À aller voir »", "💡 Remédiations proposées", "Pastille Synchro"]], ["Après", ["✨ Bilan de la leçon", "📋 Évaluation, 🙋 auto-évaluations", "📄 PDF, .zip, Excel"]]]],
        ["img", "rel-prof.jpg", "L'espace enseignant de Relais Vitesse."] ] },
      { t: "Le propre de l'activité", b: [["strip", [["Vitesse cible", "calculée pour chaque binôme"], ["Marque du binôme", "garder, reculer, avancer"], ["Ordre de passage", "ceux qui ont le moins couru d'abord"], ["Vidéo", "rien n'est enregistré ni envoyé"]]]] } ],
    [ { t: "Mise en route", b: [["steps", ["👥 Classe : élèves, vitesses, groupes (ou 👥 Groupes du jour, 🧩 Niveaux / affinités).", "Leçons → 🧭 Créer toute la séquence : nombre de leçons, dates d'après l'emploi du temps, objectif de courses, situations.", "Groupes → 🔳 QR codes : un QR « toute la classe » suffit avec une tablette partagée.", "✅ Tout est prêt ? vérifie vitesses, groupes, leçon du jour, synchro."]]] },
      { t: "Conduire une leçon", b: [["steps", ["Chaque leçon s'ouvre toute seule le jour venu.", "Les élèves touchent leur groupe, suivent « Au tour de… », enregistrent la course.", "📡 En direct : « À aller voir » signale le binôme qui répète la même erreur, le groupe sans course depuis 10 minutes.", "💡 Remédiations proposées : juge chaque proposition (✓ / ✗) ; rien n'est montré aux élèves sans ton accord."]]] },
      { t: "Toutes les fonctions", b: [["aide", "rel"]] },
      { t: "Cas particuliers et dépannage", b: [["tab", ["Situation", "Que faire"], [["Course enregistrée par erreur", "« ↩ Annuler la course », pendant 1 minute"], ["Élève d'un autre groupe", "« + Élève d'un autre groupe »"], ["Pastille Synchro orange", "La tablette attend le réseau ; les courses sont gardées"], ["Temps saisis avec une virgule", "Acceptés : 6,42 ou 6.42"]]]] } ]
  );

  act("vol",
    [ { t: "Je fais quoi, dans quel ordre", b: [
        ["flow", [["Ma classe", "puis mon équipe"], ["Le coach", "« C'est moi » : appel, rôles, chasuble, terrain"], ["La leçon", "consigne et situation du jour"], ["Le match", "je marque les points sur la tablette"], ["Fin de leçon", "bilan de l'équipe, rangement"]]],
        ["img", "vol-eleve.jpg", "La tablette du coach : d'abord l'équipe."] ] },
      { t: "Mes boutons", b: [["strip", [["🏐 Match", "score, service, rotation"], ["📺 Grand écran", "le score lisible de loin"], ["👀 Voir", "le placement de chaque rôle"], ["⭐ Bonus", "quand mon enseignant l'active"], ["↩ Annuler", "le dernier point"], ["☰ Plus", "tournoi, remédiation"]]]] },
      { t: SI, b: [["strip", [["Pas d'équipe", "je la crée : nom et joueurs"], ["Mauvais terrain", "le coach confirme le bon terrain"], ["Un absent", "le coach le note à l'appel"]]]] } ],
    [ { t: "L'essentiel", b: [
        ["cols", [["Avant", ["🚀 Démarrer la séquence : 6 étapes", "Équipes : au hasard, groupes du jour, niveaux", "📅 Préparer la leçon à l'avance"]], ["Pendant", ["📍 Envoyer les équipes sur les terrains", "📡 Tableau de bord : les terrains en direct", "🏐 Évaluer en direct"]], ["Après", ["📜 Fil de la leçon", "📋 Évaluation, curseur dans le degré", "📄 Fiches PDF, .zip"]]]],
        ["img", "vol-prof.jpg", "L'espace enseignant de Volley-ball."] ] },
      { t: "Le propre de l'activité", b: [["strip", [["Une tablette par équipe", "tenue par le coach"], ["Arbitrage", "les équipes au repos arbitrent"], ["Indicateurs", "proposés en rouge, à garder ou retirer"], ["Bonus d'équipe", "en option"]]]] } ],
    [ { t: "Mise en route", b: [["steps", ["Séquence → Leçons → 🚀 Démarrer la séquence : élèves, barème relu, équipes, partage, tablettes des équipes, première leçon.", "Classe → Équipes : au hasard, d'après les groupes du jour, ou 🧩 par niveau / affinités.", "📱 Tablettes connectées : donne un nom à chaque tablette, puis attribue une tablette à chaque équipe.", "Séquence → Leçons : relis ce qui est en rouge (✓ Garder / ✕)."]]] },
      { t: "Conduire une leçon", b: [["steps", ["Classe → 📡 Tableau de bord → « Envoyer les équipes » : terrains, équipes face à face, arbitrage, consigne et situation du jour.", "Le coach touche « C'est moi », fait l'appel, répartit les rôles.", "🏐 Évaluer en direct : les élèves qui jouent, le critère, puis le degré observé.", "En fin de leçon, la tablette résume ce que l'équipe a fait : 📜 Fil de la leçon."]]] },
      { t: "Toutes les fonctions", b: [["aide", "vol"]] },
      { t: "Cas particuliers et dépannage", b: [["tab", ["Situation", "Que faire"], [["Nom d'équipe avec apostrophe", "Accepté"], ["Une tablette manque", "Deux équipes peuvent partager une tablette : ⌂ Accueil, puis l'autre équipe"], ["Point marqué par erreur", "↩ Annuler"], ["Tablette en ancienne version", "📱 Tablettes connectées la signale : 🔄 sur cette tablette"]]]] } ]
  );

  act("bad",
    [ { t: "Je fais quoi, dans quel ordre", b: [
        ["flow", [["Ma classe", "puis mon groupe : je le rejoins avec son code, ou je le crée"], ["Jouer", "la grosse action du moment"], ["Le match", "je touche l'endroit où tombe le volant"], ["Fin du match", "mes statistiques"], ["🏁 Bilan", "mon objectif pour la prochaine fois"]]],
        ["img", "bad-eleve.jpg", "La tablette de terrain : d'abord mon groupe."] ] },
      { t: "Mes boutons", b: [["strip", [["🏸 Jouer", "les situations de la leçon"], ["📋 Ma leçon", "leçon, échauffement, technique"], ["🙋 Moi", "mes stats, ma fiche, mon bilan"], ["↩ Annuler", "le dernier point"], ["ℹ️ Plus d'infos", "toutes les statistiques"]]]] },
      { t: SI, b: [["strip", [["Code du groupe oublié", "mon enseignant peut recréer le groupe"], ["Zone en pointillés", "c'est la zone qui rapporte"], ["Mon rôle", "joueur, coach, arbitre : la tablette l'indique"]]]] } ],
    [ { t: "L'essentiel", b: [
        ["cols", [["Avant", ["🧭 Assistant de démarrage", "⚡ Préparer la leçon", "Créer une situation : assistant, description, ou de zéro"]], ["Pendant", ["🟢 Leçon en direct : groupes, matchs, alertes", "👁 Voir le match en direct", "Format des rencontres"]], ["Après", ["⚡ Évaluer la leçon question par question", "📋 Évaluer, profil de joueur", "📤 Bilan et export, .zip"]]]],
        ["img", "bad-prof.jpg", "L'espace enseignant de Badminton."] ] },
      { t: "Le propre de l'activité", b: [["strip", [["Lycée général / pro", "une grille et une séquence par voie"], ["Terrain à zones", "bonifiées, interdites, dégressives"], ["Contrats", "gagner avec la manière"], ["🏅 Défis", "classement de la classe"]]]] } ],
    [ { t: "Mise en route", b: [["steps", ["Choisis la voie dans l'en-tête : Lycée général ou Lycée pro.", "Classe → 🧭 Assistant de démarrage : classe, dates d'après l'emploi du temps, groupes.", "Onglet Terrain et scoring : 🧭 assistant en 3 questions, 💬 « Décris ta situation », ou ⚙️ partir de zéro.", "Mode Essentiel ou Expert : dans Barème."]]] },
      { t: "Conduire une leçon", b: [["steps", ["⚡ Préparer la leçon : date, situations visibles des élèves.", "Les élèves créent ou rejoignent leur groupe (code secret à 4 chiffres).", "🟢 Leçon en direct : une carte par groupe (étape, match en cours, prochains rôles), alertes, élèves sans saisie.", "Saisie complète ou simple, terrains, poule et défis visibles ou non : réglés dans Leçon en direct."]]] },
      { t: "Toutes les fonctions", b: [["aide", "bad"]] },
      { t: "Cas particuliers et dépannage", b: [["tab", ["Situation", "Que faire"], [["Match joué sans tablette", "Onglet « Ma fiche » : ajouter un match joué"], ["Il manque des tablettes", "Fiches papier vierges à imprimer"], ["Élèves absents", "Barrés dans les matchs, poules et groupes d'après l'appel du jour"], ["Indicateurs de performance", "Option du barème ; éteinte, rien n'est affiché"]]]] } ]
  );

  act("dan",
    [ { t: "Je fais quoi, dans quel ordre", b: [
        ["flow", [["Ma classe", "puis mon groupe de création"], ["On s'échauffe", "un jeu tiré au sort"], ["On crée", "procédés et défis, carnet de chorégraphie"], ["J'observe", "un autre groupe, à gros boutons"], ["Je me positionne", "une question par écran"]]],
        ["img", "dan-eleve.jpg", "Les onglets de l'élève en Danse."] ] },
      { t: "Mes boutons", b: [["strip", [["👀 Observation", "retour immédiat au groupe observé"], ["📓 Carnet de chorégraphie", "titre, intention, début, milieu, fin"], ["🧩 Procédés et défis", "pour transformer un mouvement"], ["🔥 Jeux et battles", "échauffement, défis"], ["🙋 Je me positionne", "mon avis sur mon travail"]]]] },
      { t: SI, b: [["strip", [["« Pas encore de groupes »", "je demande à mon enseignant de les créer"], ["Déjà positionné", "la tablette me le dit : c'est moi, ou ce n'est pas moi"]]]] } ],
    [ { t: "L'essentiel", b: [
        ["cols", [["Avant", ["Groupes de création", "🙋 Ouvrir l'auto-positionnement : pour la leçon ou 2 semaines", "✅ Liste de vérification des réglages"]], ["Pendant", ["Fiche d'observation par groupes", "🔥 Composer un échauffement", "⚔️ Battle"]], ["Après", ["Évaluer : par élève, par critère, par groupe", "Phrases toutes prêtes", "📄 Fiches PDF, .zip, récapitulatif"]]]],
        ["img", "dan-prof.jpg", "L'espace enseignant de Danse."] ] },
      { t: "Le propre de l'activité", b: [["strip", [["27 jeux", "par thème"], ["Carnet de chorégraphie", "par groupe"], ["3 façons d'évaluer", "élève, critère, groupe"], ["Observateur", "les absents ne sont pas proposés"]]]] } ],
    [ { t: "Mise en route", b: [["steps", ["⚙ Réglages : la liste de vérification en tête indique ce qui est prêt, avec un bouton par point.", "👥 Classe : élèves, groupes de création.", "Évaluation : choisis la classe (touche son nom pour en changer)."]]] },
      { t: "Conduire une leçon", b: [["steps", ["Bibliothèque → 🔥 Jeux : 🎲 Tirer un jeu, ou 🔥 Composer un échauffement (3 jeux), minuteur et plein écran.", "Les groupes remplissent leur carnet de chorégraphie.", "Observation : chaque observateur renvoie un retour immédiat au groupe observé.", "🙋 Ouvrir l'auto-positionnement « pour la leçon »."]]] },
      { t: "Toutes les fonctions", b: [["aide", "dan"]] },
      { t: "Cas particuliers et dépannage", b: [["tab", ["Situation", "Que faire"], [["Renommer la classe", "✎ dans l'Évaluation : la liste commune et les dispenses suivent"], ["Lien d'auto-positionnement sur les fiches PDF", "Ouvrir « 2 semaines »"], ["Un élève s'est positionné deux fois", "Le dernier envoi remplace le précédent"]]]] } ]
  );

  act("ct",
    [ { t: "Je fais quoi, dans quel ordre", b: [
        ["flow", [["Ma classe", "seul, ou avec un partenaire"], ["Exercices", "je regarde la vidéo, je choisis mon niveau N1, N2 ou N3"], ["Mon WOD", "thème, format, exercices"], ["▶ Timer", "travail, repos, bips"], ["❤️ Mon pouls", "je compte 30 s"], ["Mon bilan", "ressenti, ce que je retiens"]]],
        ["img", "ct-eleve.jpg", "« Avec qui travailles-tu ? », puis les quatre onglets du bas."] ] },
      { t: "Mes boutons", b: [["strip", [["🏋 Exercices", "fiches et vidéos, 3 niveaux"], ["📚 WOD types", "des WOD prêts"], ["⏱ Mon WOD", "je construis, je lance"], ["🧘 Étirements", "de la tête aux pieds"], ["❤️", "mes zones de fréquence cardiaque"], ["✓ REP / ✗ NO REP", "le coach compte"]]]] },
      { t: SI, b: [["strip", [["WOD imposé 🔒", "je choisis seulement mon niveau"], ["Vidéo qui ne démarre pas", "elle se télécharge en Wi-Fi"], ["Douleur", "j'arrête et je préviens mon enseignant"]]]] } ],
    [ { t: "L'essentiel", b: [
        ["cols", [["Avant", ["🎬 Vidéos et fiches : dossier du Drive", "📌 Leçon du jour : WOD imposé, forme imposée, ou libre", "👥 Groupes autorisés"]], ["Pendant", ["⏱ Grand chrono", "👥 Athlète / coach", "📲 Tablette partagée ou tablette ressource"]], ["Après", ["Carnets de la classe : WOD, ressenti, analyse", "📋 Évaluation CA5", "📄 PDF, .zip, Pronote"]]]],
        ["img", "ct-prof.jpg", "L'espace enseignant de Cross-training."] ] },
      { t: "Le propre de l'activité", b: [["strip", [["20 fiches d'exercice", "3 niveaux, sécurité, muscles"], ["16 WOD types", "par matériel et par thème"], ["Formats", "Circuit, EMOM, AMRAP, For Time, intervalles"], ["Fréquence cardiaque", "zones par thème"]]]] } ],
    [ { t: "Mise en route", b: [["steps", ["Sur le Drive : un dossier « Vidéo crosstraining », un sous-dossier par exercice, N1.mp4, N2.mp4, N3.mp4.", "Bibliothèque → 🎬 Vidéos et fiches : colle le lien du dossier, « Enregistrer le dossier », puis « Lire le Drive ».", "Relis les fiches, puis « Publier pour les élèves ».", "Sur chaque tablette, en Wi-Fi : Bibliothèque → « Télécharger »."]]] },
      { t: "Conduire une leçon", b: [["steps", ["📅 Séquence → 📌 Leçon du jour : classe, date, consigne, puis 🔒 WOD choisi, 🧩 forme de travail imposée ou ✏️ WOD de son choix.", "Les élèves construisent ou reçoivent leur WOD, puis ▶ Lancer le timer.", "En binôme : « 👥 Lancer en athlète / coach », écran coupé en deux.", "❤️ : mesure du pouls, zone visée affichée."]]] },
      { t: "Toutes les fonctions", b: [["aide", "ct"]] },
      { t: "Cas particuliers et dépannage", b: [["tab", ["Situation", "Que faire"], [["Vidéo absente du rapport", "Vérifier le nom du fichier : N1.mp4, N2.mp4, N3.mp4"], ["Une seule tablette pour deux groupes", "Réglages → 📲 Tablette partagée : deux boxes"], ["Élève sur téléphone", "Bouton 📱 Téléphone dans la barre du haut"], ["Classe de terminale professionnelle", "La grille reprend le protocole CCF Bac pro"]]]] } ]
  );

  act("bk",
    [ { t: "Je fais quoi, dans quel ordre", b: [
        ["flow", [["Ma classe", "puis mon équipe"], ["La leçon du jour", "3 contre 3 ou 4 contre 4"], ["Le match", "je tiens la table de marque"], ["J'observe", "notre attaque, un joueur, la carte des tirs"], ["Notre bilan", "un contrat chiffré pour la prochaine fois"]]],
        ["img", "bk-eleve.jpg", "« Quelle est ton équipe ? » ; les règles et l'échauffement restent ouverts."] ] },
      { t: "Mes boutons", b: [["strip", [["3 c 3 | 4 c 4", "la forme de jeu du jour"], ["📋 Planche", "notre schéma d'équipe"], ["⭐ Bonus", "le point bonus du jour"], ["↩ Annuler", "le dernier point"], ["🟢 🟠 🔴", "nos indicateurs"], ["📏 Les règles", "sans choisir de classe"]]]] },
      { t: SI, b: [["strip", [["« Les équipes ne sont pas encore faites »", "mon enseignant les prépare"], ["Le score ne bouge pas", "une seule tablette tient la marque, les autres le voient"], ["Équipe au repos", "j'arbitre ou j'observe un terrain"]]]] } ],
    [ { t: "L'essentiel", b: [
        ["cols", [["Avant", ["3 c 3 | 4 c 4 dans la barre", "👥 Équipes, chasubles", "🗓 Créer les rencontres"]], ["Pendant", ["Séquence : scores et classement du jour", "📤 Envoyer un système de jeu", "👁 Fiches d'observation"]], ["Après", ["Classement de la séquence", "Bilans écrits des équipes", "📋 Évaluation, fiches"]]]],
        ["img", "bk-prof.jpg", "L'espace enseignant de Basket-ball."] ] },
      { t: "Le propre de l'activité", b: [["strip", [["Deux formes de jeu", "demi-terrain ou tout terrain"], ["17 situations", "avec schéma et source"], ["Systèmes de jeu", "planches prêtes"], ["Conseil", "une situation selon l'indicateur le plus faible"]]]] } ],
    [ { t: "Mise en route", b: [["steps", ["Choisis la forme de jeu du jour avec « 3 c 3 | 4 c 4 » dans la barre du haut.", "👥 Classe : équipes au hasard, d'après les groupes du jour, ou par niveaux / affinités.", "Séquence : nombre de terrains, points bonus du jour, puis « Créer les rencontres ».", "Bibliothèque → Situations : « 👁 Montrer aux élèves »."]]] },
      { t: "Conduire une leçon", b: [["steps", ["Une tablette par équipe : la table de marque, la feuille de match.", "À chaque rotation, les équipes au repos arbitrent et observent.", "Séquence se met à jour toute seule : scores, classement, observations, schémas.", "Bibliothèque → Systèmes de jeu → « 📤 Envoyer aux tablettes »."]]] },
      { t: "Toutes les fonctions", b: [["aide", "bk"]] },
      { t: "Cas particuliers et dépannage", b: [["tab", ["Situation", "Que faire"], [["Il manque des tablettes", "« 🖨 Imprimer les fiches » d'observation"], ["Changer un élève d'équipe", "Toucher l'élève, puis « Placer ici »"], ["Les équipes veulent changer de forme", "Cocher « Les équipes peuvent changer de forme »"], ["Fiches trop longues pour la classe", "« Fiches d'observation simplifiées »"]]]] } ]
  );

  act("step",
    [ { t: "Je fais quoi, dans quel ordre", b: [
        ["flow", [["Ma classe", "puis « Qui est dans ton groupe ? »"], ["Les pas", "je touche un pas : un schéma par temps"], ["🧱 Mon bloc", "j'ajoute les pas, je règle l'ordre"], ["▶ Lancer", "le métronome compte, les pieds bougent"], ["❤️", "je compte mon pouls"], ["👀 Observer", "un autre groupe, puis un conseil"]]],
        ["img", "step-eleve.jpg", "D'abord mon groupe, puis « C'est parti »."] ] },
      { t: "Mes boutons", b: [["strip", [["👣 Les pas", "pied gauche rouge, pied droit vert"], ["⇄", "le pas de l'autre côté"], ["▲ ▼", "l'ordre des pas"], ["▶ Suivre toute la chorégraphie", "tous mes blocs"], ["⬇ Exporter", "en PDF ou en vidéo"]]]] },
      { t: SI, b: [["strip", [["La jauge déborde", "mon bloc a trop de temps : j'enlève un pas"], ["Trop vite", "je baisse le tempo, s'il n'est pas imposé"], ["Je me trompe de groupe", "⌂ Accueil, puis je recommence"]]]] } ],
    [ { t: "L'essentiel", b: [
        ["cols", [["Avant", ["👣 Les pas : 11 pas fournis, ＋ Créer un pas", "📌 Leçon du jour : consigne, tempo, pouls", "Pas proposés à la classe"]], ["Pendant", ["🖥 Groupes en direct", "▶ Voir le bloc d'un groupe", "Observations entre groupes"]], ["Après", ["⬇ Exporter la chorégraphie", "🌐 Publier dans l'espace élève", "📋 Évaluation, bilans"]]]],
        ["img", "step-prof.jpg", "L'espace enseignant de Step."] ] },
      { t: "Le propre de l'activité", b: [["strip", [["Métronome", "tempo libre ou imposé"], ["Bloc", "32 temps par défaut"], ["Lecteur", "plein écran, pas suivant annoncé"], ["Fréquence cardiaque", "zone visée"]]]] } ],
    [ { t: "Mise en route", b: [["steps", ["Bibliothèque → 👣 Les pas : relis les pas fournis ; ＋ Créer un pas pour les tiens (temps, pied, appui, orientation).", "« Recopier la 1re moitié sur la 2e », ou « de l'autre côté », pour gagner du temps ; ▶ Essayer.", "📅 Séquence → 📌 Leçon du jour : consigne, tempo, mesure de la fréquence cardiaque, zone visée, pas proposés.", "⚙ Réglages → 🎛 Paramètres : tempos, nombre de temps d'un bloc, taille des groupes."]]] },
      { t: "Conduire une leçon", b: [["steps", ["Les élèves forment leur groupe, construisent leur bloc, ▶ Lancer.", "📅 Séquence → 🖥 Groupes en direct : ce que fait chaque groupe, ses blocs, la dernière fréquence cardiaque. Actualisé toutes les 8 s.", "La mesure du pouls s'ouvre à la fermeture du lecteur, ou par ❤️ en fin de travail.", "👀 Observer : critères, puis un conseil lu par le groupe observé."]]] },
      { t: "Toutes les fonctions", b: [["aide", "step"]] },
      { t: "Cas particuliers et dépannage", b: [["tab", ["Situation", "Que faire"], [["Pas de profil, tournant ou sauté", "Le créer avec l'éditeur ; « ⤴ Temps sauté »"], ["Garder la chorégraphie d'un groupe", "⬇ Exporter : PDF ou vidéo, à joindre dans Pronote"], ["Élèves pas encore dans un groupe", "Listés en haut de Groupes en direct"], ["L'écran s'éteint", "Le lecteur le garde allumé ; rouvrir le lecteur"]]]] } ]
  );

  act("ccf",
    [ { t: "Je fais quoi, dans quel ordre", b: [
        ["flow", [["Ma classe", "puis mon équipe"], ["Pratique", "ma feuille : projet, matchs ou production"], ["Observer", "un camarade, avec la grille"], ["Mon choix", "je me positionne, puis 4-4, 6-2 ou 2-6"], ["Ressources", "sécurité, échauffement, fiches"]]],
        ["img", "ccf-eleve.jpg", "CCF : ma classe, ou les ressources de chaque activité."] ] },
      { t: "Mes boutons", b: [["strip", [["🎯 Mon choix", "la répartition de mes 8 points"], ["⭐", "la répartition la plus intéressante pour moi"], ["👁 Observer", "compteurs, ✓ réussi, ✗ à améliorer"], ["📚 Ressources", "sans choisir de classe"]]]] },
      { t: SI, b: [["strip", [["« Aucune classe »", "mon enseignant ouvre l'épreuve sur les tablettes"], ["Je veux changer de répartition", "possible tant que mon enseignant n'a pas clos"], ["Je ne comprends pas un critère", "je lis la version élève, ou je demande"]]]] } ],
    [ { t: "L'essentiel", b: [
        ["cols", [["Avant", ["Choisir l'activité, 🔀 pour en changer", "👥 Former les équipes", "🖨 Documents à imprimer"]], ["Pendant", ["« Ouvert sur les tablettes élèves »", "👁 Observer, 📊 supports interactifs", "🎙 Observations dictées"]], ["Après", ["💡 Positionnement proposé", "🎯 Répartition proposée", "📄 Tableau, Pronote, PDF, en ligne"]]]],
        ["img", "ccf-prof.jpg", "L'espace enseignant du CCF."] ] },
      { t: "Le propre de l'activité", b: [["strip", [["Protocole", "recopié à la lettre, modifiable"], ["Fin de séquence", "12 points"], ["Fil de la séquence", "8 points, répartition choisie par l'élève"], ["Tu valides", "toute proposition reste une aide"]]]] } ],
    [ { t: "Mise en route", b: [["steps", ["Tuile CCF, puis l'activité (🔀 Activité dans la barre pour en changer).", "Évaluation : classe, voie (Bac pro ou Bac général, proposée d'après le nom de la classe), date.", "👥 Classe : équipes au hasard ou à la main ; poules en badminton.", "Bibliothèque → Documents à imprimer : leçon du CCF, protocole, fiche de choix, grille."]]] },
      { t: "Conduire l'épreuve", b: [["steps", ["Coche « Ouvert sur les tablettes élèves ».", "Les élèves renseignent leur pratique, observent, puis choisissent leur répartition dans « Mon choix ».", "Touche un élève : fin de séquence (degré, puis curseur dans la fourchette), fil de la séquence (2 AFLP, points selon la répartition).", "« 💡 Positionner d'après les données » remplit les AFLP pas encore notés ; tu valides et ajustes."]]] },
      { t: "Toutes les fonctions", b: [["aide", "ccf"]] },
      { t: "Cas particuliers et dépannage", b: [["tab", ["Situation", "Que faire"], [["Un élève n'a pas choisi sa répartition", "Bilans → « Répartitions choisies » ; la proposée s'affiche à côté"], ["Adapter le barème", "Réglages → Modifier le protocole ; « Revenir au texte d'origine » le remet"], ["Course d'orientation, Bac général", "Évaluation → « 📥 Résultats de CO Éval »"], ["Note à reporter", "📋 Pronote : note /20 et une colonne par AFLP"]]]] } ]
  );

  return { ACTS: ACTS, NIV: NIV, G: G };
})();
