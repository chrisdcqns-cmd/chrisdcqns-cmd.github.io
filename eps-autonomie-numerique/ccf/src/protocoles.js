/* ================== PROTOCOLES (textes officiels de l'établissement, recopiés à la lettre ; modifiables dans Réglages → Modifier le protocole) ==================
   Structure commune (Bac pro et, plus tard, Bac général) :
   {id, act, voie, apsa, ca, session, etab, ref, oe, principe:[…],
    fin:{titre, afl:[{id, code, pts, off, decl, regles:[…], ajust, degAj, auto, deg:[{t, min, max}×4]}]},
    fil:{titre, pts, reps:['4-4','6-2','2-6'], bareme:{2:[…4],4:[…4],6:[…4]}, retenus:[idX,idY], rappel, note, afl:[{id, code, off, decl, regles, deg:[t×4]}]},
    jeu:{paramètres de la forme de pratique}} */
const RAPPEL_PRO="Notée sur 8 points, l'évaluation au fil de la séquence porte sur 2 AFLP retenus par l'équipe pédagogique parmi les 4. La répartition des 8 points est au choix des élèves avec trois possibilités de répartition : AFLX = 4 pts / AFLY = 4 pts ; AFLX = 6 pts / AFLY = 2 pts ; AFLX = 2 pts / AFLY = 6 pts.\nAvant l'évaluation de fin de séquence, le candidat choisit la répartition des points qu'il souhaite attribuer pour chacun de ces 2 AFLP. Le passage du degré 2 au degré 3 permet l'attribution de la moitié des points dévolus à l'AFLP. Le choix doit être un objet d'enseignement travaillé au fil de la séquence.";
const FIL_NOTE_PRO="Seuls les deux AFLP Bac Pro retenus par l'équipe pédagogique sont évalués pour constituer cette partie de la note sur 8 points. Les points de chaque AFLP Bac Pro seront répartis sur les 4 degrés de positionnement. Les « points » dans les tableaux sont à définir par l'équipe EPS.";
const BAREME_PRO={2:[0.5,1,1.5,2],4:[0.5,1.5,2.5,4],6:[0.5,2,4,6]};
const R7=[[0,1],[1.5,3],[3.5,5],[5.5,7]],R5=[[0,0.5],[1,2],[2.5,4],[4.5,5]];
const dg=(T,R)=>T.map((t,i)=>({t,min:R[i][0],max:R[i][1]}));
const AJUST_P1="Pour l'AFLP Bac Pro 1, l'évaluateur positionne l'élève dans un degré puis ajuste la note en fonction du niveau de difficulté/complexité de la prestation réalisée par l'élève (exemples : nombre d'éléments A, B, C ou D en gymnastique ou acrosport, nombre ou variété des paramètres du mouvement ou procédés de composition en danse).";
const FIN_TITRE="Situation d'évaluation de fin de séquence",FIL_TITRE="Évaluation au fil de la séquence";
const ETAB0="LP Camille Claudel · Fourmies";

const PROTOS={
'esc-pro':{id:'esc-pro',act:'esc',voie:'pro',apsa:'Escalade',ca:'CA2',session:'2024',etab:ETAB0,ref:'FCE_BacPro_CA2_Escalade_LP_CamilleClaudel_Fourmies_0590083V_Session_2024',
 oe:"Sur 2 voies différentes, marquer collectivement de manière sécuritaire le plus de points possibles en déterminant différents paramètres : hauteur et prises. Grimper de manière dynamique grâce à une poussée des jambes efficiente afin d'atteindre ses objectifs.",
 principe:["Équipe de 4 hétérogène : grimpeur, assureur, contre-assureur, observateur",
  "Échauffement : 45 s sur la corde de la voie tirée au sort (utilisation de toutes les couleurs de prises)",
  "20 minutes par équipe pour réaliser les 4 passages de la cordée",
  "Voie tirée au sort en fonction des niveaux des élèves. La voie est accessible au meilleur du groupe. 2 voies différentes à réaliser",
  "Mur divisé en 4 zones. La zone est validée lorsque le bassin dépasse la dégaine : Sol à D2 = 10 points ; D2 à D4 = 20 points ; D4 à D7 = 30 points ; D7 à TOP = 40 points ; TOP = 100 points supplémentaires",
  "2 prises de départ mains identifiées"],
 fin:{titre:FIN_TITRE,afl:[
  {id:'p1',code:'AFLP1',pts:7,off:"Accomplir une prestation animée d'une intention dans la perspective d'être jugé et/ou apprécié.",decl:"Planifier son trajet pour atteindre son objectif personnel en fonction de ses ressources",
   regles:["Atteindre son projet individuel","Si le grimpeur n'atteint pas ou dépasse sa zone = les points de la zone ne comptent pas","L'observateur vérifie l'utilisation des prises bonus et l'atteinte de l'objectif personnel de hauteur"],
   ajust:AJUST_P1,degAj:"Selon l'APSA support, niveau de difficulté/complexité des paramètres",auto:'esc-projet',
   deg:dg(["Projet trop/pas assez ambitieux (loin de la hauteur annoncée)","Projet proche de ± 2 dégaines","Projet proche ± 1 dégaine","Projet respecté"],R7)},
  {id:'p2',code:'AFLP2',pts:5,off:"Mobiliser des techniques de plus en plus complexes pour rendre plus fluide la prestation et pour l'enrichir de formes corporelles variées et maitrisées",decl:"Rechercher une utilisation des jambes optimales pour progresser efficacement dans la voie",
   regles:["Action des jambes"],ajust:"",degAj:"",
   deg:dg(["Poussée des jambes faible avec une grosse action des bras","Poussée des jambes aléatoire (en fonction des prises sous les pieds)","Recherche à progresser en poussant sur les jambes","Poussée efficace permettant d'atteindre des prises hors d'atteinte"],R5)}]},
 fil:{titre:FIL_TITRE,pts:8,reps:['4-4','6-2','2-6'],bareme:BAREME_PRO,retenus:['p4','p5'],rappel:RAPPEL_PRO,note:FIL_NOTE_PRO,afl:[
  {id:'p3',code:'AFLP3',off:"Composer et organiser dans le temps et l'espace le déroulement des moments forts et faibles de sa prestation pour se produire devant des spectateurs/juges",decl:'',regles:[],deg:['','','','']},
  {id:'p4',code:'AFLP4',off:"Assumer les rôles inhérents à la pratique artistique et acrobatique notamment en exprimant et en écoutant des arguments sur la base de critères partagés, pour situer une prestation",decl:"Maitriser les techniques d'assurage et contre-assurage pour faire évoluer ses partenaires en toute sécurité sur le mur",
   regles:["Passage dans les 2 rôles obligatoire","Fusibles sur la corde à ne pas faire sauter"],auto:'esc-roles',
   deg:["Assurage hésitant","Assurage maitrisé","Assurage tendu, boucle cassée pendant la grimpe","Assurage dynamique et boucle maintenue"]},
  {id:'p5',code:'AFLP5',off:"Se préparer et s'engager pour présenter une prestation optimale et sécurisée à une échéance donnée",decl:"Identifier son trajet pour réaliser des choix judicieux sur les prises à utiliser utiles à la progression",
   regles:["10 minutes : projet points d'équipe à prévoir en début de leçon : points de la hauteur de grimpe + 2 prises bonus (+ ordre de passage)","Choix de 2 prises bonus (1 si la zone 1 est la zone à atteindre) : prise en Z1 = ×1 ; prise en Z2 = ×2 ; prise en Z3 = ×3 ; prise en Z4 = ×4","Au cours de la grimpe, si la prise est utilisée, elle vaudra 10 × le coef zone ; si elle n'est pas prise/oubliée, elle vaudra −10 × coef zone","Régulation possible pendant 4 minutes après le passage du premier grimpeur"],auto:'esc-prises',
   deg:["Projet individuel aléatoire (prises et hauteur)","Projet individuel réfléchi sur la hauteur mais mauvais choix de prises","Projet individuel réfléchi mais 1 erreur de prise","Projet individuel concerté collectivement pour le valider dans sa totalité"]},
  {id:'p6',code:'AFLP6',off:"S'enrichir de la connaissance de productions de qualité issues du patrimoine culturel artistique et gymnique pour progresser dans sa propre pratique et aiguiser son regard de spectateur",decl:'',regles:[],deg:['','','','']}]},
 jeu:{nEq:4,echauf:45,dureeEq:20,projet:10,regul:4,nDeg:8,b1:2,b2:4,b3:7,z1:10,z2:20,z3:30,z4:40,top:100,bonusN:2,bonusVal:10,exact:1,cumul:0,bonusNeg:1,verrou:1}},

'bad-pro':{id:'bad-pro',act:'bad',voie:'pro',apsa:'Badminton',ca:'CA4',session:'2024',etab:ETAB0,ref:'FCE_BacPro_CA4_Badminton_LP_CamilleClaudel_Fourmies_0590083V_Session_2024',
 oe:"S'organiser collectivement pour choisir ses matchs afin d'en remporter un maximum en utilisant différentes stratégies de jeu pour cacher la sienne.",
 principe:["Équipe de 2 de niveau homogène avec un Joueur et un Coach",
  "Les joueurs se rencontrent par groupe de joueurs de niveau homogène (poule de 5 binômes)",
  "1 arbitre de l'équipe qui ne joue pas",
  "Match de 2 sets de 11 points avec arbitrage classique ; point stratégique sur la fiche score",
  "Score : 1 pt = adversaire touche/faute ; 10 pts = point direct sur la stratégie (fiche coach)",
  "Classement par équipe : points de matchs (nb de victoires + nombre de points marqués)",
  "À la fin de chaque match, tenter de deviner la stratégie adverse. Si elle est découverte = +5 points au score",
  "Création d'un panel individuel de 4 stratégies parmi lesquelles le coach piochera pour la mettre en place en match"],
 fin:{titre:FIN_TITRE,afl:[
  {id:'p1',code:'AFLP1',pts:7,off:"Réaliser des choix tactiques et stratégiques pour faire basculer le rapport de force en sa faveur et marquer le point",decl:"Utiliser plusieurs stratégies pour cacher sa stratégie gagnante parmi un panel prédéfini",
   regles:["Gagner le match avec un maximum de points stratégiques sur la fiche score","Cacher sa stratégie pour ne pas être découvert par l'équipe adverse"],
   ajust:"Après avoir déterminé son degré d'acquisition, la proportion des oppositions gagnées permet de positionner l'élève au sein même du degré d'acquisition choisi.",degAj:"Gain des matchs",auto:'bad-gain',
   deg:dg(["Stratégie inadaptée et/ou attend la faute de l'adversaire","Stratégie adaptée mais n'arrive pas à l'utiliser tout le temps","Stratégie efficace mais visible","Stratégie efficace et la cache avec d'autres stratégies"],R7)},
  {id:'p2',code:'AFLP2',pts:5,off:"Mobiliser des techniques d'attaque efficaces pour se créer et exploiter des occasions de marquer. Résister et neutraliser individuellement ou collectivement l'attaque adverse pour rééquilibrer le rapport de force",decl:"Mobiliser un panel de frappes variées afin de déplacer son adversaire pour se créer une occasion de rupture d'échange",
   regles:["Utiliser différentes frappes (amorti, dégagement, smash, lob, contre-amorti) pour rompre l'échange"],ajust:"",degAj:"",
   deg:dg(["Toujours la même frappe utilisée ou attend la faute de l'adversaire","Cherche à faire bouger son adversaire. Exploite quelques occasions de marque","Utilise des frappes variées sur l'ensemble du terrain et cherche à rompre l'échange","Construit le point en utilisant un grand panel de frappes efficaces et cherche à rompre l'échange"],R5)}]},
 fil:{titre:FIL_TITRE,pts:8,reps:['4-4','6-2','2-6'],bareme:BAREME_PRO,retenus:['p3','p4'],rappel:RAPPEL_PRO,note:FIL_NOTE_PRO,afl:[
  {id:'p3',code:'AFLP3',off:"Analyser les forces et les faiblesses en présence par l'exploitation de données objectives pour faire des choix tactiques et stratégiques adaptés à une prochaine confrontation.",decl:"Choisir une stratégie pour son joueur afin de renverser le rapport de force",
   regles:["5 minutes en début de leçon pour créer un panel de 4 stratégies de zone (terrain découpé en 6 zones)","3 minutes en début de rencontre pour que le coach choisisse la stratégie","1 stratégie à choisir parmi un panel de 4 stratégies différentes (zones atteintes)","TM de 30\" par set","3 minutes entre les deux sets","Possibilité de modifier à tout moment la stratégie (TM et entre sets) (possibilité de réchappe ou abandon)"],auto:'bad-strat',
   deg:["Stratégie choisie de manière aléatoire. Choix non adapté à son joueur","Stratégie modifiée mais peu efficace","Stratégie modifiée efficacement entre les deux sets","Stratégie modifiée à tout moment de manière efficace"]},
  {id:'p4',code:'AFLP4',off:"Respecter et faire respecter les règles partagées pour que le jeu puisse se dérouler sereinement ; assumer plusieurs rôles sociaux pour permettre le bon déroulement du jeu",decl:"S'organiser collectivement pour remporter l'ensemble des matchs en choisissant son adversaire",
   regles:["5 minutes au début pour choisir l'organisation des matchs (qui joue contre qui dans le groupe adverse)"],auto:'bad-orga',
   deg:["Choix aléatoire de l'adversaire","Choix valorisant un seul des adversaires","Choix valorisant les deux partenaires","Choix permettant de gagner l'ensemble des matchs"]},
  {id:'p5',code:'AFLP5',off:"Savoir se préparer, s'entraîner et récupérer pour faire preuve d'autonomie",decl:'',regles:[],deg:['','','','']},
  {id:'p6',code:'AFLP6',off:"Porter un regard critique sur les pratiques sportives pour comprendre le sens des pratiques scolaires",decl:'',regles:[],deg:['','','','']}]},
 jeu:{pts:11,sets:2,pFaute:1,pDirect:10,pHors:1,pDevine:5,nStrat:4,tPanel:5,tChoix:3,tTM:30,tEntre:3,tOrga:5,poule:5,c1:34,c2:67,nul:1,ecart:0,max:15,devine:0,tmN:1}},

'ct-pro':{id:'ct-pro',act:'ct',voie:'pro',apsa:'Cross training',ca:'CA5',session:'2024',etab:ETAB0,ref:'FCE_BacPro_CA5_Crosstraining_LP_CamilleClaudel_Fourmies_0590083V_Session_2024',
 oe:"Concevoir et produire une séance en binôme tout en pratiquant de manière sécuritaire afin de répondre à un objectif personnel. Maîtriser différentes connaissances musculaires pour construire une séance en lien avec son objectif avec des temps de travail, de récupération et des exercices adaptés.",
 principe:["Travail en binôme sur une forme de travail : EMOM, AMRAP ou FOR TIME : conception de séance et production de séance",
  "Déterminer l'objectif personnel de travail à atteindre pour la séance (FC cible)",
  "Construction complète de la séance : échauffement, exercices, répétitions, rotations, repos, étirements",
  "Feuille de séance : collective pour la séance et individuelle pour les ressentis/sensations",
  "Séance de 40 à 50 minutes, échauffement et concertation compris",
  "Évaluation des différentes connaissances en lien avec le corps humain et les exercices en rapport"],
 fin:{titre:FIN_TITRE,afl:[
  {id:'p1',code:'AFLP1',pts:7,off:"Concevoir et mettre en œuvre un projet d'entraînement pour répondre à un mobile personnel de développement",decl:"Produire sa séance de manière sécuritaire",
   regles:["Réalisation des exercices de manière sécuritaire : posture, trajet, respiration","3 formes de travail : EMOM, AMRAP, FOR TIME","Probablement 30 minutes de pratique","2 types de répartition du travail : les 2 travaillent en même temps ; travail alternatif (repos sur le temps de travail de son partenaire)"],
   ajust:"",degAj:"",
   deg:dg(["Motricité dangereuse\n• Trajet modifié\n• Respiration absente\n• Posture en désalignement total\n• Amplitude faible\n• Rythme irrégulier",
    "Motricité partiellement sécuritaire\n• Trajet modifié en milieu de répétition\n• Respiration inversée\n• Posture légèrement désalignée\n• Amplitude incomplète\n• Rythme en baisse sur la fin des répétitions",
    "Motricité maitrisée et sécuritaire\n• Trajet modifié en fin de séance\n• Respiration timide\n• Posture droite\n• Amplitude complète\n• Rythme régulier ou en légère baisse en fin de séance",
    "Motricité maitrisée et sécuritaire tout au long de la séance\n• Trajet ok\n• Respiration ok\n• Posture droite\n• Amplitude complète\n• Rythme maitrisé"],R7)},
  {id:'p2',code:'AFLP2',pts:5,off:"Éprouver différentes méthodes d'entraînement et en identifier des principes pour les réutiliser dans sa séance",decl:"Recueillir des données physiques et physiologiques pour réguler sa séance en partenariat",
   regles:["Feuille de séance individuelle : exercices (si différents de son partenaire), ressentis, sensations, FC"],ajust:"",degAj:"",auto:'ct-donnees',
   deg:dg(["Données relevées de manière aléatoire","Les données ne sont pas utilisées pour réguler la production malgré des critères en dehors de l'objectif","Séance régulée entre les rounds avec l'aide des données","Séance régulée tout au long de la séance et de manière sécuritaire"],R5)}]},
 fil:{titre:FIL_TITRE,pts:8,reps:['4-4','6-2','2-6'],bareme:BAREME_PRO,retenus:['p3','p6'],rappel:RAPPEL_PRO,note:FIL_NOTE_PRO,afl:[
  {id:'p3',code:'AFLP3',off:"Systématiser un retour réflexif sur sa pratique pour réguler sa charge de travail en fonction d'indicateurs de l'effort (fréquence cardiaque, ressenti musculaire et respiratoire, fatigue générale)",decl:"Réguler sa séance afin de répondre à un objectif visé",
   regles:["15 minutes de concertation : répartition des exercices, répétitions, tours","Possibilité d'avoir une réchappe en cours de séance, voire de l'anticiper pour se rapprocher le plus possible de l'objectif","Construction de la séance et détermination de l'objectif à atteindre pour les deux partenaires : déterminer la forme de travail ; choisir les exercices vis-à-vis d'un projet personnel ; déterminer le nombre de tours / répétitions / temps de repos / rotations / temps de travail max","Feuille de séance collective","Prévoir une réchappe au cours de la séance en cas de difficulté pour atteindre l'objectif final"],auto:'ct-regul',
   deg:["Activité spontanée n'ayant toutefois pas permis d'atteindre les objectifs d'une séance trop ambitieuse","Régulation en cours de séance pour atteindre l'objectif, mais cela n'est pas efficace. Séance adaptée à un pratiquant","Objectif atteint et la séance est réalisable et adaptée à chacun","Objectif atteint pour le binôme avec ou sans régulation"]},
  {id:'p4',code:'AFLP4',off:"Agir avec et pour les autres en vue de la réalisation du projet d'entraînement en assurant spontanément les rôles sociaux",decl:'',regles:[],deg:['','','','']},
  {id:'p5',code:'AFLP5',off:"Construire une motricité contrôlée pour évoluer dans des conditions sécuritaires",decl:'',regles:[],deg:['','','','']},
  {id:'p6',code:'AFLP6',off:"Intégrer des conseils d'entraînement, de diététique, d'hygiène de vie pour se construire un mode de vie sain et une pratique raisonnée",decl:"Connaître différents paramètres physiologiques et physionomiques pour pratiquer en sécurité et adapter sa séance à son choix personnel",
   regles:["Identifier les différents muscles travaillés","Connaître les différents effets recherchés en fonction des différents objectifs","Répertorier les exercices en fonction des muscles"],auto:'ct-muscles',
   deg:["Sait prendre sa fréquence cardiaque et ne connaît que quelques muscles","Connaît les muscles en fonction de l'exercice qu'il connaît","Connaît la totalité des muscles","Connaît la totalité des muscles et sait comment les travailler"]}]},
 jeu:{pratique:30,concert:15,seanceMin:40,seanceMax:50,emom:12,amrap:15,cap:20}}
};
/* paramètres de la forme de pratique, affichés dans l'éditeur du protocole */
const JEU_LAB={
 esc:[['nEq','Élèves par équipe'],['echauf','Échauffement sur la voie (s)'],['dureeEq','Temps par équipe (min)'],['projet','Projet d\'équipe (min)'],['regul','Régulation après le 1er grimpeur (min)'],['nDeg','Nombre de dégaines'],['b1','Fin de la zone 1 (dégaine n°)'],['b2','Fin de la zone 2 (dégaine n°)'],['b3','Fin de la zone 3 (dégaine n°)'],['z1','Points zone 1'],['z2','Points zone 2'],['z3','Points zone 3'],['z4','Points zone 4'],['top','Points TOP (en plus)'],['bonusN','Prises bonus (1 si zone 1)'],['bonusVal','Valeur d\'une prise bonus (× coef zone)'],
  ['exact','Points de la zone',[[1,'seulement si la zone annoncée est atteinte exactement (protocole : n\'atteint pas ou dépasse = 0)'],[2,'si la zone annoncée est atteinte ou dépassée (points de la zone annoncée)'],[0,'toujours les points de la zone réellement atteinte']]],
  ['cumul','Calcul des points de zone',[[0,'points de la seule zone (10, 20, 30 ou 40)'],[1,'cumul des zones validées (ex. Z3 = 10 + 20 + 30)']]],
  ['bonusNeg','Prise bonus oubliée',[[1,'retire 10 × coef (protocole)'],[0,'ne rapporte rien (0)']]],
  ['verrou','Après la régulation',[[1,'les projets se verrouillent'],[0,'les projets restent modifiables jusqu\'au passage']]]],
 bad:[['pts','Points par set'],['sets','Nombre de sets'],['pFaute','Point : adversaire touche/faute'],['pDirect','Point direct dans la stratégie'],['pHors','Point direct hors stratégie'],['pDevine','Stratégie adverse devinée (bonus)'],['nStrat','Stratégies dans le panel'],['tPanel','Création du panel (min)'],['tChoix','Choix du coach (min)'],['tTM','Temps mort (s)'],['tmN','Temps morts par set et par équipe'],['tEntre','Entre les deux sets (min)'],['tOrga','Organisation des matchs (min)'],['poule','Binômes par poule'],['c1','Découpe fond / milieu (% depuis le fond)'],['c2','Découpe milieu / avant (% depuis le fond)'],
  ['ecart','Fin du set',[[0,'au premier qui atteint les points du set'],[1,'2 points d\'écart (avec un maximum)']]],['max','Maximum du set avec 2 points d\'écart'],
  ['nul','1 set partout',[[1,'victoire à l\'équipe qui a marqué le plus de points'],[0,'match nul']]],
  ['devine','Stratégie adverse devinée si elle correspond à',[[0,'une des stratégies utilisées pendant le match'],[1,'la dernière stratégie utilisée'],[2,'la première stratégie choisie']]]],
 ct:[['pratique','Pratique (min)'],['concert','Concertation (min)'],['seanceMin','Séance : durée mini (min)'],['seanceMax','Séance : durée maxi (min)'],['emom','EMOM : minutes par défaut'],['amrap','AMRAP : minutes par défaut'],['cap','FOR TIME : temps limite par défaut (min)']]
};
const jeuTxt=(act,k,v)=>{const L=(JEU_LAB[act]||[]).find(x=>x[0]===k);if(L&&L[2]){const o=L[2].find(x=>+x[0]===+v);return o?o[1]:v}return v};
/* activités du CCF : code = code de l'appli d'activité (activités des classes, ressources) */
const ACTS={
 esc:{nom:'Escalade',app:'escalade',color:'#2E7D4F',eq:'Équipe de 4',icon:'<path d="M3 21l6-12 4 6 3-4 5 10z"/><path d="M14 4v6"/><circle cx="14" cy="3" r="1"/>'},
 bad:{nom:'Badminton',app:'badminton',color:'#0B7A75',eq:'Binôme joueur / coach',icon:'<circle cx="6.5" cy="17.5" r="3"/><path d="M8.6 15.4 18 3l3 3-12.4 9.4"/><path d="M12 10.5 15 13M14.5 7.5 18 10"/>'},
 ct:{nom:'Cross training',app:'',color:'#4C7A1E',eq:'Binôme',icon:'<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'}
};

/* ===== Course d'orientation · Bac général (CA2) · AFL1 en 2 éléments, AFL2 et AFL3 au choix 4-4 / 6-2 / 2-6 ===== */
PROTOS['ori-gt']={id:'ori-gt',act:'ori',voie:'gt',apsa:'Course d\'orientation',ca:'CA2',session:'2024',etab:'LGT Camille Claudel · Fourmies',ref:'FCE_CA2_CourseD\'Orientation_LGT_CamilleClaudel_Fourmies_0590083V_Session_2024 · Circulaire du 25-03-2022',
 oe:"Planifier un trajet logique et efficient pour récupérer un maximum de postes en deux épreuves de 20 minutes à la fois de manière individuelle que collective.",
 principe:["Groupe de 2, 3 cartes différentes : 1 carte parcours collectif ; 2 cartes avec parcours individuel","18 postes minimum","Moitié de classe en individuel, l'autre en collectif et inversement","Balise poinçonnée dans l'ordre de récupération (projet = 7, 2, 9 ; carton = 1=7, 2=2, 3=9) sur la carte","Circuit de 16 balises à ramener filles ; 18 balises garçons sur l'ensemble de l'épreuve","7 minutes de planification de conception du projet commun (ordre) + 7 min de planification de répartition des parcours et nombre de balises pour la partie CO individuelle","20 minutes d'épreuve à deux (planification projet, nombre de balises) ; 20 minutes d'épreuve individuelle (coopération, se répartir les parcours et les balises)","Annoncer son projet de points (balises de N2-N3)"],
 fin:{titre:"Repères d'évaluation de l'AFL1 : « S'engager à l'aide d'une motricité spécifique pour réaliser en sécurité et à son meilleur niveau, un itinéraire dans un contexte incertain »",afl:[
  {id:'p1',code:'AFL1 (1)',pts:6,off:"S'engager à l'aide d'une motricité spécifique pour réaliser en sécurité et à son meilleur niveau, un itinéraire dans un contexte incertain.",decl:"Lire et analyser les caractéristiques des éléments du milieu pour choisir et conduire son itinéraire",
   regles:["16 balises à ramener pour les filles ; 18 pour les garçons sur l'ensemble de l'épreuve","40 minutes de course (20 à deux ; 20 seul)","Possibilité de modifier les balises annoncées dans le projet en fonction du temps","Possibilité d'abandonner un poste et combler par un autre (réchappe)","N2 = 2 pts ; N3 = 3 pts"],
   ajust:"Pour chacun des deux éléments de l'AFL1, les co-évaluateurs positionnent l'élève dans un degré puis ajustent la note en fonction du niveau de difficulté/complexité de l'itinéraire réalisé par l'élève. Chaque élément de l'AFL1 au moins noté sur 4 points. Corrélation erreurs/niveau : chaque erreur induit sur l'ajustement de la note en fonction des niveaux des balises ramenées.",degAj:"Coefficient de difficulté de l'itinéraire",auto:'co-pts',
   deg:dg(["Total inférieur au nombre de points annoncés","Total identique avec modification de postes trouvés","Total identique au projet de points annoncés","Total de points supérieur à celui annoncé"],[[0,1.5],[1.75,3],[3.25,4.5],[4.75,6]])},
  {id:'p2',code:'AFL1 (2)',pts:6,off:"S'engager à l'aide d'une motricité spécifique pour réaliser en sécurité et à son meilleur niveau, un itinéraire dans un contexte incertain.",decl:"Adapter son déplacement en fonction des caractéristiques du milieu et de son projet d'itinéraire",
   regles:["40 minutes de course (20 à deux ; 20 seul)","N2 = 2 pts ; N3 = 3 pts"],ajust:"Corrélation erreurs/niveau : chaque erreur induit sur l'ajustement de la note en fonction des niveaux des balises ramenées.",degAj:"Coefficient de difficulté de l'itinéraire",auto:'co-dep',
   deg:dg(["Hors temps\nTrop d'erreurs","Dans les temps mais projet incomplet\nMajoritairement de balises de N2","Dans les temps\nMajoritairement de balises de N3","En avance\nToutes les balises N3"],[[0,1.5],[1.75,3],[3.25,4.5],[4.75,6]])}]},
 fil:{titre:'AFL2 et AFL3',pts:8,reps:['4-4','6-2','2-6'],bareme:BAREME_PRO,retenus:['p3','p4'],
  rappel:"Les AFL2 et 3 sont notés sur 8 points. La répartition des 8 points est au choix des élèves avec trois possibilités de répartition : AFL2 = 4 pts / AFL3 = 4 pts ; AFL2 = 6 pts / AFL3 = 2 pts ; AFL2 = 2 pts / AFL3 = 6 pts. La répartition choisie doit être annoncée par l'élève avant le début de l'épreuve et ne peut plus être modifiée après le début de l'épreuve. Le choix doit être un objet d'enseignement travaillé au fil de la séquence.",note:'',afl:[
  {id:'p3',code:'AFL2',off:"S'entraîner individuellement et collectivement, pour se déplacer de manière efficiente et en toute sécurité.",decl:"S'entraîner individuellement et collectivement, pour se déplacer de manière efficiente et en toute sécurité",
   regles:["Temps de planification = 7 min (nombre de balises - l'ordre - et nombre de points)","Possibilité de chercher des points bonus (nid supplémentaire)","Durée totale 40 min (20 minutes de course collective / 20 minutes de course individuelle)","Écarts entre prévu et réalisé : possibilité de repasser par le départ pour vérifier UNE unique réponse au choix/selon leur doute","Anticipation de balises réchappe/bonus","Annoncer l'ordre fixe des balises (+ indiquer si modifications de l'itinéraire de base) et le noter sur le KIFEKOI","2 possibilités = projet à plus de 16/18 balises annoncées ; projet normal + balises réchappes"],auto:'co-plan',
   deg:["Projet annoncé mais non réalisé\nPrise de risque non maîtrisée","Projet modifié","Planification respectée (minima : 16 ou 18)","Planification respectée avec points bonus"]},
  {id:'p4',code:'AFL3',off:"Coopérer pour réaliser un projet de déplacement, en toute sécurité.",decl:"Coopérer pour réaliser un projet de déplacement, en toute sécurité",
   regles:["Temps de répartition des parcours et des balises au retour du parcours collectif = 7 minutes","Possibilité de s'échanger les cartes (donner un pt de rdv) : 1 élève récupère les balises N2 des deux parcours, l'autre les balises de N3"],auto:'co-coop',
   deg:["Répartition des cartes et des balises de manière aléatoire","Répartition adaptée à un coureur sur les deux","Répartition adaptée aux capacités de chacun","Répartition optimale permettant de récupérer l'ensemble des balises"]}]},
 jeu:{nMinF:16,nMinG:18,n2:2,n3:3,tPlan:7,tCol:20,tInd:20,tRep:7,avance:2,postes:18}};
JEU_LAB.ori=[['nMinF','Balises à ramener (filles)'],['nMinG','Balises à ramener (garçons)'],['n2','Points d\'une balise N2'],['n3','Points d\'une balise N3'],['tPlan','Planification du projet commun (min)'],['tCol','Course collective (min)'],['tInd','Course individuelle (min)'],['tRep','Répartition des parcours (min)'],['avance','« En avance » : minutes d\'avance au moins'],['postes','Postes au minimum']];
ACTS.ori={nom:'Course d\'orientation',app:'co-eval',color:'#14213D',eq:'Binôme',icon:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'};
const VOIES={pro:'Bac pro',gt:'Bac général'};
/* bibliothèque d'exercices sans matériel (cross training) : muscles principaux */
const EXOS=[
 ['Squat','Quadriceps, fessiers, ischio-jambiers'],['Squat sauté','Quadriceps, fessiers, mollets (+ cardio)'],['Fente avant alternée','Quadriceps, fessiers'],['Fente sautée','Quadriceps, fessiers, mollets (+ cardio)'],
 ['Chaise (contre le mur)','Quadriceps'],['Pont fessier','Fessiers, ischio-jambiers'],['Mollets debout','Mollets (triceps sural)'],
 ['Pompes','Pectoraux, triceps, deltoïdes antérieurs'],['Pompes sur les genoux','Pectoraux, triceps, deltoïdes antérieurs'],['Dips sur banc','Triceps, deltoïdes antérieurs'],['Pompes déclinées','Pectoraux (haut), deltoïdes, triceps'],
 ['Gainage planche','Transverse, grand droit de l\'abdomen'],['Gainage latéral','Obliques, moyen fessier'],['Crunch','Grand droit de l\'abdomen'],['Relevés de jambes','Grand droit (bas), fléchisseurs de hanche'],['Superman','Lombaires (érecteurs du rachis), fessiers'],
 ['Mountain climbers','Abdominaux, fléchisseurs de hanche, épaules (+ cardio)'],['Burpees','Corps entier : pectoraux, triceps, quadriceps, fessiers (+ cardio)'],['Jumping jacks','Mollets, deltoïdes (+ cardio)'],['Montées de genoux','Fléchisseurs de hanche, mollets (+ cardio)'],['Talons-fesses','Ischio-jambiers, mollets (+ cardio)'],['Corde à sauter (sans corde)','Mollets (+ cardio)'],['Skater (sauts latéraux)','Fessiers, quadriceps (+ cardio)']
];
const FORMES={EMOM:"Every Minute On the Minute : chaque minute, je fais le travail prévu, je récupère le temps qui reste.",AMRAP:"As Many Rounds As Possible : le plus de tours possible dans le temps donné.",'FOR TIME':"Pour le temps : je réalise tout le travail prévu le plus vite possible (temps limite)."};
