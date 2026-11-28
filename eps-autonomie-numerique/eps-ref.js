/* eps-ref.js — 🧭 Référentiel de compétences (commun à toutes les applis). Voir CLAUDE.md, section « Référentiel de compétences ».
   UNE SEULE STRUCTURE, sans double saisie :
     Objectif général (5, programme)  ←  AFL / AFLP (programme, par champ d'apprentissage et par voie)
                                      ←  Compétence générale (répertoire de l'enseignant)
     Compétence spécifique = un critère de la grille d'évaluation d'une activité (il porte déjà son AFL et l'activité son CA).
   Ce fichier ne garde QUE les liens (critère → compétences générales, éléments prioritaires) : l'AFL reste dans la grille,
   les degrés restent dans l'évaluation de l'appli. Un relevé (« sn| ») recopie les degrés pour le suivi toutes activités :
   il est refait tout seul à chaque ouverture d'une appli en mode enseignant (jamais saisi à la main).
   Magasin « eps.ref.v1 » (rf|), synchronisé par eps-home.js :
     cg|<id>                     {k:"cg", nom, d, og:[og1…], o}                  compétence générale
     ln|<appli>|<gv>|<critère>   {k:"ln", cg:[ids], ep:[numéros]}                rattachement d'un critère
     ao|<voie>|<CA>|<code>       {k:"ao", og:[…]}                                AFL / AFLP → objectifs (remplace la proposition)
     tx|<clé>                    {k:"tx", t, ok}                                 texte officiel corrigé ou vérifié par l'enseignant
     ep|<voie>|<CA>              {k:"ep", l:[textes]}                            éléments prioritaires (liste de l'enseignant)
     gr|<appli>|<gv>             {k:"gr", app, nom, ca, color, gv, crit:[{id, nom, afl, max}]}   grille connue (pour rattacher avant d'évaluer)
     sn|<année>|<appli>|<classe> {k:"sn", an, app, nom, ca, color, cls, voie, gv, d0, d, crit:[…], el:{clé élève:{n, p:{crit:[d,pos]}, a:{…}}}}
     cfg                         {k:"cfg", carnet:0|1}
   Ce qui est évalué PENDANT les leçons alimente le même suivi, lu en direct dans les magasins des applis (rien n'est recopié) :
     📊 Évaluer la leçon (eps.leceval.<dossier>.v1) : « thème du jour » → critères de grille travaillés par la leçon (cases « 📋 Critères d'évaluation
        travaillés » de ses situations) ; participation et sérieux → critères communs à toutes les activités (appli « _le »), à rattacher une fois ;
     🏁 résultats des situations notés par les élèves (eps.lecres) → côté élève des critères travaillés par la situation ;
     🧪 modalités d'évaluation (eps.evmod) : chaque critère de modalité (avec son AFL) est une compétence spécifique (gv « m »).
   Règle : l'évaluation de fin de séquence l'emporte ; tant qu'elle n'existe pas, la moyenne des leçons tient lieu de positionnement (marquée « leçons »).
   S'y ajoutent, lus en direct eux aussi : 👥 coévaluation entre élèves (eps.coeval.v1, eps-eval.js : 3e regard « camarades »),
     ⚡ repères rapides de la tablette de contrôle (eps.ico.v1, eps-lecons.js) et 📒 carnet de classe à colonnes libres :
     magasin eps.cdc.v1 (kc|) : c|<id> {k:"col", cls, nom, ty:"note"|"deg"|"ico"|"perf"|"txt", max, coef, unit, icos:[…], cg:[ids], d, o} et
     v|<id de colonne> {k:"val", col, cls, el:{clé élève: valeur}}. Une colonne note ou degré rattachée à une compétence générale entre dans le profil.
   gv = voie de la grille : « gt » / « pro » quand l'appli a une grille par voie, « x » quand la même grille sert à toutes les classes. */
(function () {
  "use strict";
  if (window.EPSREF) return;
  var K = "eps.ref.v1", PRE = "rf|";
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function flat(s) { return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase(); }
  function nk(s) { return flat(s).split(/[^A-Z0-9]+/).filter(Boolean).sort().join(" "); }   /* « Léa MARTIN » = « MARTIN Léa » */
  function ck(s) { return flat(s).replace(/[^A-Z0-9]+/g, ""); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function obj(x) { return x && typeof x === "object" && !Array.isArray(x) ? x : {}; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }   /* date locale (jamais toISOString) */
  function annee() { var r = jget("eps.reglages.v1", {}) || {}, m = /(20\d\d)\D+(20\d\d)/.exec(String(r.annee || "")); if (m) return m[1] + "-" + m[2]; var d = new Date(), y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return y + "-" + (y + 1); }
  function voieOf(cls) { try { return window.epsVoie ? (epsVoie(cls) === "pro" ? "pro" : "gt") : "gt"; } catch (e) { return "gt"; } }

  /* ---------- magasin ---------- */
  function ld() { var v = jget(K, null); if (!v || typeof v !== "object" || !v.items || Array.isArray(v.items)) v = { items: {}, pend: {}, since: 0 }; v.pend = obj(v.pend); return v; }
  function put(it) { var V = ld(), old = V.items[it.id]; it.u = Math.max(Date.now(), ((old && old.u) || 0) + 1); V.items[it.id] = it; V.pend[it.id] = it.u;
    try { localStorage.setItem(K, JSON.stringify(V)); } catch (e) { return false; }
    try { if (window.EPSD && EPSD.syncSoon) EPSD.syncSoon(); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent("eps-ref")); } catch (e) {} return true; }
  function del(id) { return put({ id: id, del: 1 }); }
  function all(k) { var I = ld().items, L = []; Object.keys(I).forEach(function (id) { var o = I[id]; if (o && !o.del && o.k === k) L.push(o); }); return L; }
  function one(id) { var o = ld().items[id]; return o && !o.del ? o : null; }

  /* ---------- cadre officiel ----------
     Objectifs généraux et champs d'apprentissage : intitulés des programmes (LGT : arrêté du 17-1-2019 ; voie pro : arrêté du 3-4-2019).
     AFL / AFLP : src « ccf » = repris à la lettre des protocoles CCF de l'établissement (ccf/src/protocoles.js) ; src « prog » = recopié du
     programme sans avoir pu le relire sur le texte officiel : affiché « à vérifier » tant que l'enseignant ne l'a pas validé ou corrigé.
     Éléments prioritaires : intitulés ABRÉGÉS proposés (le programme ne les numérote pas) ; l'enseignant y met sa propre liste. */
  var OG = [
    { id: "og1", n: 1, gt: "Développer sa motricité", pro: "Développer sa motricité" },
    { id: "og2", n: 2, gt: "Savoir se préparer et s'entraîner", pro: "S'organiser pour apprendre et savoir s'entraîner" },
    { id: "og3", n: 3, gt: "Exercer sa responsabilité individuelle et au sein d'un collectif", pro: "Exercer sa responsabilité dans un engagement personnel et solidaire" },
    { id: "og4", n: 4, gt: "Construire durablement sa santé", pro: "Construire durablement sa santé" },
    { id: "og5", n: 5, gt: "Accéder au patrimoine culturel", pro: "Accéder lucidement au patrimoine culturel" }];
  var OGC = { og1: "#1D4ED8", og2: "#B45309", og3: "#7E22CE", og4: "#15803D", og5: "#BE123C" };
  var CAS = ["CA1", "CA2", "CA3", "CA4", "CA5"];
  var CA = {
    CA1: "Réaliser une performance motrice maximale mesurable à une échéance donnée",
    CA2: "Adapter son déplacement à des environnements variés ou incertains",
    CA3: "Réaliser une prestation corporelle destinée à être vue et appréciée",
    CA4: "Conduire et maîtriser un affrontement collectif ou interindividuel pour gagner",
    CA5: "Réaliser et orienter son activité physique pour développer ses ressources et s'entretenir" };
  /* "bo" (28/11/2026) = relu mot pour mot sur le programme officiel publié par le ministère (voie professionnelle, arrêté du 3-4-2019, AFLP du baccalauréat
     professionnel des champs 1 et 2, education.gouv.fr) : plus de pastille « à vérifier ». Les AFL de la voie générale restent "prog" : le texte officiel n'a pas
     pu être relu mot pour mot, l'enseignant les valide. */
  var AFL = {
    gt: {
      CA1: [["prog", "S'engager pour produire une performance maximale à l'aide de techniques efficaces, en gérant les efforts musculaires et respiratoires nécessaires et en faisant le meilleur compromis entre l'accroissement de vitesse d'exécution et de précision."],
        ["prog", "S'entraîner, individuellement et collectivement, pour réaliser une performance."],
        ["prog", "Choisir et assumer les rôles qui permettent un fonctionnement collectif solidaire."]],
      CA2: [["ccf", "S'engager à l'aide d'une motricité spécifique pour réaliser en sécurité et à son meilleur niveau, un itinéraire dans un contexte incertain."],
        ["ccf", "S'entraîner individuellement et collectivement, pour se déplacer de manière efficiente et en toute sécurité."],
        ["ccf", "Coopérer pour réaliser un projet de déplacement, en toute sécurité."]],
      CA3: [["prog", "S'engager pour composer et réaliser un enchaînement à visée esthétique ou acrobatique destiné à être jugé, en combinant des formes corporelles codifiées. — ou — S'engager pour composer et interpréter une chorégraphie collective, selon un projet artistique en mobilisant une motricité expressive et des procédés de composition."],
        ["prog", "Se préparer et s'engager, individuellement et collectivement, pour s'exprimer devant un public et susciter des émotions."],
        ["prog", "Choisir et assumer des rôles au service de la prestation collective."]],
      CA4: [["prog", "S'engager pour gagner une rencontre en faisant des choix techniques et tactiques pertinents au regard de l'analyse du rapport de force."],
        ["prog", "Se préparer et s'entraîner, individuellement ou collectivement, pour conduire et maîtriser un affrontement collectif ou interindividuel."],
        ["prog", "Choisir et assumer les rôles qui permettent un fonctionnement collectif solidaire."]],
      CA5: [["prog", "S'engager pour obtenir les effets recherchés selon son projet personnel, en faisant des choix de paramètres d'entraînement cohérents avec le thème retenu."],
        ["prog", "S'entraîner, individuellement ou collectivement, pour développer ses ressources et s'entretenir en fonction des effets recherchés."],
        ["prog", "Coopérer pour faire progresser."]] },
    pro: {
      CA1: [["bo", "Produire et répartir lucidement ses efforts en mobilisant de façon optimale ses ressources pour gagner ou pour battre un record."],
        ["bo", "Connaître et mobiliser les techniques efficaces pour produire la meilleure performance possible."],
        ["bo", "Analyser sa performance pour adapter son projet et progresser."],
        ["bo", "Assumer des rôles sociaux pour organiser une épreuve de production de performance, un concours."],
        ["bo", "Assurer la prise en charge de sa préparation et de celle d'un groupe, de façon autonome pour produire la meilleure performance possible."],
        ["bo", "Connaître son niveau pour établir un projet de performance située culturellement."]],
      CA2: [["bo", "Anticiper et planifier son itinéraire pour concevoir et conduire dans sa totalité un projet de déplacement."],
        ["bo", "Mobiliser des techniques efficaces pour adapter et optimiser son déplacement aux caractéristiques du milieu."],
        ["bo", "Analyser sa prestation pour comprendre les alternatives possibles et ajuster son projet en fonction de ses ressources et de celles du milieu."],
        ["bo", "Assumer les rôles sociaux pour organiser la pratique des activités de pleine nature."],
        ["bo", "Se préparer et maintenir un engagement optimal permettant de garder sa lucidité tout au long de son parcours pour pouvoir réévaluer son itinéraire ou renoncer le cas échéant."],
        ["bo", "Respecter et faire respecter la réglementation et les procédures d'urgence pour les mettre en œuvre dans les différents environnements de pratique."]],
      CA3: [["ccf", "Accomplir une prestation animée d'une intention dans la perspective d'être jugé et/ou apprécié."],
        ["ccf", "Mobiliser des techniques de plus en plus complexes pour rendre plus fluide la prestation et pour l'enrichir de formes corporelles variées et maitrisées."],
        ["ccf", "Composer et organiser dans le temps et l'espace le déroulement des moments forts et faibles de sa prestation pour se produire devant des spectateurs/juges."],
        ["ccf", "Assumer les rôles inhérents à la pratique artistique et acrobatique notamment en exprimant et en écoutant des arguments sur la base de critères partagés, pour situer une prestation."],
        ["ccf", "Se préparer et s'engager pour présenter une prestation optimale et sécurisée à une échéance donnée."],
        ["ccf", "S'enrichir de la connaissance de productions de qualité issues du patrimoine culturel artistique et gymnique pour progresser dans sa propre pratique et aiguiser son regard de spectateur."]],
      CA4: [["ccf", "Réaliser des choix tactiques et stratégiques pour faire basculer le rapport de force en sa faveur et marquer le point."],
        ["ccf", "Mobiliser des techniques d'attaque efficaces pour se créer et exploiter des occasions de marquer. Résister et neutraliser individuellement ou collectivement l'attaque adverse pour rééquilibrer le rapport de force."],
        ["ccf", "Analyser les forces et les faiblesses en présence par l'exploitation de données objectives pour faire des choix tactiques et stratégiques adaptés à une prochaine confrontation."],
        ["ccf", "Respecter et faire respecter les règles partagées pour que le jeu puisse se dérouler sereinement ; assumer plusieurs rôles sociaux pour permettre le bon déroulement du jeu."],
        ["ccf", "Savoir se préparer, s'entraîner et récupérer pour faire preuve d'autonomie."],
        ["ccf", "Porter un regard critique sur les pratiques sportives pour comprendre le sens des pratiques scolaires."]],
      CA5: [["ccf", "Concevoir et mettre en œuvre un projet d'entraînement pour répondre à un mobile personnel de développement."],
        ["ccf", "Éprouver différentes méthodes d'entraînement et en identifier des principes pour les réutiliser dans sa séance."],
        ["ccf", "Systématiser un retour réflexif sur sa pratique pour réguler sa charge de travail en fonction d'indicateurs de l'effort (fréquence cardiaque, ressenti musculaire et respiratoire, fatigue générale)."],
        ["ccf", "Agir avec et pour les autres en vue de la réalisation du projet d'entraînement en assurant spontanément les rôles sociaux."],
        ["ccf", "Construire une motricité contrôlée pour évoluer dans des conditions sécuritaires."],
        ["ccf", "Intégrer des conseils d'entraînement, de diététique, d'hygiène de vie pour se construire un mode de vie sain et une pratique raisonnée."]] } };
  /* proposition (modifiable) : objectif général principal de chaque AFL / AFLP */
  var AO = { gt: { "*": ["og1", "og2", "og3"] },
    pro: { "*": ["og1", "og1", "og2", "og3", "og2", "og5"], CA2: ["og1", "og1", "og2", "og3", "og2", "og4"], CA5: ["og2", "og2", "og2", "og3", "og1", "og4"] } };
  var EP = {
    CA1: ["Efficience motrice : techniques efficaces", "Principes mécaniques et sensations", "Réguler son effort", "Se préparer et récupérer", "Persévérer", "Évaluer les prestations", "Piloter un projet de performance"],
    CA2: ["Appliquer les règles de sécurité", "Adapter ses appuis au milieu", "Gérer ses efforts selon le milieu", "Rester lucide dans ses choix", "Choisir et réguler son itinéraire", "S'entraider", "Sélectionner les informations utiles"],
    CA3: ["Motricité expressive", "Procédés de composition", "Tenir différents rôles", "Gérer la prise de risque", "Analyser les prestations", "Maîtriser sa part de la production collective"],
    CA4: ["Actions techniques d'attaque et de défense", "Analyser forces et faiblesses", "Adapter son engagement", "Accepter la défaite ou la victoire", "Être solidaire", "Respecter et faire respecter les règles"],
    CA5: ["Motricité spécifique, intégrité physique", "Moduler les paramètres d'entraînement", "Personnaliser selon ses ressentis", "Se mettre en condition et récupérer", "Tenir un carnet d'entraînement"] };
  /* répertoire de départ proposé par Claude : ajouté seulement après confirmation de l'enseignant (charte : ✋ confirmation) */
  var DEPART = [
    ["Réaliser des actions efficaces", ["og1"]], ["Faire des choix adaptés à la situation", ["og1"]],
    ["Se préparer et s'échauffer en autonomie", ["og2", "og4"]], ["S'entraîner et persévérer pour progresser", ["og2"]], ["Analyser sa pratique et se donner un projet", ["og2"]],
    ["Tenir un rôle au service du groupe", ["og3"]], ["Coopérer et aider un partenaire", ["og3"]], ["Respecter les règles, les autres et la sécurité", ["og3", "og4"]],
    ["Gérer son effort et préserver sa santé", ["og4"]], ["Connaître la culture de l'activité", ["og5"]]];

  function tx(key, def) { var o = one("tx|" + key); return o && typeof o.t === "string" && o.t.trim() ? o.t : def; }
  function txOk(key) { var o = one("tx|" + key); return !!(o && (o.ok || (typeof o.t === "string" && o.t.trim()))); }
  function ogs(voie) { return OG.map(function (o) { return { id: o.id, n: o.n, t: tx("og|" + voie + "|" + o.id, o[voie === "pro" ? "pro" : "gt"]), def: o[voie === "pro" ? "pro" : "gt"], color: OGC[o.id] }; }); }
  function caT(ca) { return tx("ca|" + ca, CA[ca] || ""); }
  function caOf(s) { var m = /CA\s*([1-5])/i.exec(String(s || "")); return m ? "CA" + m[1] : ""; }
  function aflList(voie, ca) { voie = voie === "pro" ? "pro" : "gt"; var L = (AFL[voie] && AFL[voie][ca]) || [], P = voie === "pro" ? "AFLP" : "AFL";
    return L.map(function (x, i) { var code = P + (i + 1), key = "afl|" + voie + "|" + ca + "|" + code; return { code: code, key: key, t: tx(key, x[1]), def: x[1], src: x[0], sur: x[0] === "ccf" || x[0] === "bo" || txOk(key), og: aflOg(voie, ca, code) }; }); }
  function aflOg(voie, ca, code) { voie = voie === "pro" ? "pro" : "gt"; var o = one("ao|" + voie + "|" + ca + "|" + code); if (o && Array.isArray(o.og)) return o.og.slice();
    var m = /(\d)/.exec(code), i = m ? +m[1] - 1 : -1, T = AO[voie] || {}, L = T[ca] || T["*"] || []; return L[i] ? [L[i]] : []; }
  function epList(voie, ca) { voie = voie === "pro" ? "pro" : "gt"; var o = one("ep|" + voie + "|" + ca); if (o && Array.isArray(o.l)) return o.l.map(String); return voie === "gt" ? (EP[ca] || []).slice() : []; }
  function epMine(voie, ca) { var o = one("ep|" + (voie === "pro" ? "pro" : "gt") + "|" + ca); return !!(o && Array.isArray(o.l)); }
  function epCode(n) { return "EP" + ("0" + n).slice(-2); }

  /* ---------- compétences générales et rattachements ---------- */
  function cgs() { return all("cg").sort(function (a, b) { return (a.o || 0) - (b.o || 0) || String(a.nom).localeCompare(String(b.nom), "fr"); }); }
  function cgPut(o) { var id = o.id || "cg|" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); var L = cgs();
    return put({ id: id, k: "cg", nom: String(o.nom || "").trim().slice(0, 90), d: String(o.d || "").trim().slice(0, 300), og: arr(o.og).filter(function (x) { return OGC[x]; }), o: o.o != null ? o.o : (one(id) ? one(id).o : L.length) }) ? id : ""; }
  function cgDel(id) { try { var c0 = one(id); if (c0 && window.EPSD && EPSD.trash) EPSD.trash.keep({ type: "Compétence générale", label: c0.nom, items: [{ key: K, id: id }].concat(all("ln").filter(function (l) { return arr(l.cg).indexOf(id) >= 0; }).map(function (l) { return { key: K, id: l.id }; })) }); } catch (e) {}
    all("ln").forEach(function (l) { if (arr(l.cg).indexOf(id) >= 0) put({ id: l.id, k: "ln", cg: arr(l.cg).filter(function (x) { return x !== id; }), ep: arr(l.ep) }); }); return del(id); }
  /* code AFL d'un critère : « AFL1 », « AFL 2 », « AFLP3 », « AFL1 (2) », « AFL1 EP02 »… → numéro ; le préfixe suit la voie de la classe */
  function aflNum(cr) { var m = /AFL\s*P?\s*([1-6])/i.exec(String((cr && cr.afl) || "")); return m ? +m[1] : 0; }
  function aflCode(cr, voie) { var n = aflNum(cr); return n ? (voie === "pro" ? "AFLP" : "AFL") + n : ""; }
  function epAuto(cr) { var s = String((cr && cr.afl) || "") + " " + String((cr && cr.nom) || ""), re = /\bEP\s*0?(\d{1,2})\b/gi, m, L = []; while ((m = re.exec(s))) { if (+m[1] > 0 && L.indexOf(+m[1]) < 0) L.push(+m[1]); } return L; }
  function lnId(app, gv, crit) { return "ln|" + app + "|" + gv + "|" + crit; }
  /* rattachement d'un critère : celui de sa grille, sinon celui de la même appli et du même critère dans l'autre voie (grille pro = copie de la générale) */
  function link(app, gv, cr) { var o = one(lnId(app, gv, cr.id)), auto = false;
    if (!o) { var I = ld().items, pre = "ln|" + app + "|", suf = "|" + cr.id; Object.keys(I).some(function (id) { if (id.indexOf(pre) === 0 && id.slice(-suf.length) === suf && I[id] && !I[id].del) { o = I[id]; return true; } return false; }); }
    var ids = {}; cgs().forEach(function (c) { ids[c.id] = 1; });
    var ep = o && Array.isArray(o.ep) ? o.ep.slice() : null; if (!ep) { ep = epAuto(cr); auto = ep.length > 0; }
    return { cg: o ? arr(o.cg).filter(function (x) { return ids[x]; }) : [], ep: ep, epAuto: auto }; }
  function linkSet(app, gv, crit, v) { return put({ id: lnId(app, gv, crit), k: "ln", cg: arr(v.cg), ep: arr(v.ep).map(Number).filter(function (n) { return n > 0; }).sort(function (a, b) { return a - b; }) }); }
  /* objectifs généraux d'un critère = ceux de son AFL + ceux de ses compétences générales (sans doublon) */
  function ogOf(g, cr, voie) { var ca = caOf(g.ca), out = [], add = function (x) { if (OGC[x] && out.indexOf(x) < 0) out.push(x); };
    var code = aflCode(cr, voie); if (code && ca) aflOg(voie, ca, code).forEach(add);
    var L = link(g.app, g.gv, cr), C = {}; cgs().forEach(function (c) { C[c.id] = c; }); L.cg.forEach(function (id) { arr(C[id] && C[id].og).forEach(add); });
    return out.sort(); }

  /* ---------- relevé des évaluations (fait dans les applis, en mode enseignant) ---------- */
  function isTeach() { try { if (typeof window.epsIsTeacher === "function" && window.epsIsTeacher()) return true; return Date.now() < +(localStorage.getItem("eps.teach.until") || 0); } catch (e) { return false; } }
  function r2(x) { return Math.round(x * 100) / 100; }
  function pair(v) { if (!v || v.d == null || isNaN(+v.d)) return null; var d = Math.max(0, Math.min(3, Math.round(+v.d))), p = v.pos == null || isNaN(+v.pos) ? .5 : Math.max(0, Math.min(1, +v.pos)); return [d, r2(p)]; }
  function critsOf(G) { return arr(G && G.criteres).filter(function (cr) { return cr && cr.id != null; }).map(function (cr) { return { id: String(cr.id), nom: String(cr.nom || "").slice(0, 160), afl: String(cr.afl || "").slice(0, 30), max: +cr.max > 0 ? r2(+cr.max) : 1 }; }); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function snapInst(x) { var A = x && x.A, n = 0; if (!A || !A.app || typeof A.classes !== "function" || typeof A.grid !== "function") return 0;
    var byV = typeof A.gridFor === "function", vA = typeof A.voie === "function" ? A.voie() : "", an = annee(), seenG = {};
    arr(A.classes()).forEach(function (c) { if (!c || !c.nom || !Array.isArray(c.eleves)) return;
      if (vA && c.voie && c.voie !== vA) return;                       /* Badminton : la grille affichée est celle de la voie ouverte */
      var voie = voieOf(c.nom), gv = byV ? voie : vA ? (vA === "pro" ? "pro" : "gt") : "x", G; try { G = byV ? A.gridFor(c.nom) : A.grid(); } catch (e) { return; }
      var crit = critsOf(G); if (!crit.length) return;
      if (!seenG[gv]) { seenG[gv] = 1; var gid = "gr|" + A.app + "|" + gv, og = one(gid), ng = { app: A.app, nom: String(A.nom || A.app), ca: caOf(A.ca), color: String(A.color || ""), gv: gv, crit: crit };
        if (!og || !same({ app: og.app, nom: og.nom, ca: og.ca, color: og.color, gv: og.gv, crit: og.crit }, ng)) { ng.id = gid; ng.k = "gr"; put(ng); n++; } }
      var el = {}, nb = 0;
      c.eleves.forEach(function (E) { var nm, full; try { nm = A.name(E) || {}; } catch (e) { return; } full = ((nm.prenom || "") + " " + (nm.nom || "")).trim(); if (!full) return;
        var p = {}, a = {}, any = false, ap = null; try { ap = A.getAp ? A.getAp(E) : null; } catch (e) {}
        (G.criteres || []).forEach(function (cr) { if (!cr || cr.id == null) return; var v = null; try { v = pair(A.prof(cr, E)); } catch (e) {} if (v) { p[cr.id] = v; any = true; }
          var z = ap && ap.ev ? pair(ap.ev[cr.id]) : null; if (z) { a[cr.id] = z; any = true; } });
        /* note de l'enseignant (M.prop : barème, répartition CCF) et niveau par AFL, pour l'appréciation de bulletin (27/11/2026) */
        if (any) { var o = { n: full, p: p, a: a }; if (Object.keys(p).length && x.M && typeof x.M.prop === "function") { try { var pr = x.M.prop(E, c.nom);
            if (pr && pr.note != null && isFinite(+pr.note) && (pr.src === "eval" || pr.src === "mixte")) { o.nt = r2(+pr.note); o.af = arr(pr.afl).filter(function (z) { return z && z.deg != null && isFinite(+z.m); }).map(function (z) { return [String(z.code), r2(+z.m)]; }); } } catch (e) {} }
          el[nk(full)] = o; nb++; } });
      if (!nb) return;                                                   /* rien d'évalué : on garde l'ancien relevé tel quel */
      var id = "sn|" + an + "|" + A.app + "|" + ck(c.nom), old = one(id);
      if (old && same(old.crit, crit) && same(old.el, el)) return;
      var it = { id: id, k: "sn", an: an, app: A.app, nom: String(A.nom || A.app), ca: caOf(A.ca), color: String(A.color || ""), cls: c.nom, voie: voie, gv: gv, d0: (old && old.d0) || today(), d: today(), crit: crit, el: el };
      if (/^D[ÉE]MO/i.test(c.nom)) it.demo = 1;
      if (put(it)) n++; });
    return n; }
  function snapAll() { if (!isTeach() || window.EPS_REF_PAGE) return 0; var n = 0;
    ["evvol", "evdan"].forEach(function (f) { try { if (typeof window[f] === "function") window[f](); } catch (e) {} });   /* Volley, Danse : évaluation créée à la demande */
    arr(window.EPSE_INST).forEach(function (x) { try { n += snapInst(x); } catch (e) { try { console.warn("eps-ref", e); } catch (z) {} } }); return n; }

  /* ---------- ce qui est évalué pendant les leçons (lu en direct, jamais recopié) ---------- */
  var DIRS = { esc: "escalade", rel: "relais", vol: "volley", bad: "badminton", dan: "danse", acro: "acrosport", ori: "orientation", ct: "crosstraining", bk: "basket", step: "step" };
  var DNOM = { esc: "Escalade", rel: "Relais Vitesse", vol: "Volley-ball", bad: "Badminton", dan: "Danse", acro: "Acrosport", ori: "OrienRun", ct: "Cross-training", bk: "Basket-ball" };
  var SC = {};   /* mémoire de lecture : le texte du magasin est comparé à chaque fois, l'analyse n'est refaite que s'il a changé (un tableau de classe relit les mêmes magasins pour chaque élève) */
  function sItems(k) { var raw = null; try { raw = localStorage.getItem(k); } catch (e) {} var c = SC[k]; if (c && c.raw === raw) return c.it; var v = null; try { v = JSON.parse(raw || "null"); } catch (e) {}
    var it = v && v.items && typeof v.items === "object" && !Array.isArray(v.items) ? v.items : {}; SC[k] = { raw: raw, it: it }; return it; }
  function isDay(d) { return /^\d{4}-\d{2}-\d{2}$/.test(String(d || "")); }
  function anOf(day) { var m = /^(\d{4})-(\d{2})/.exec(String(day || "")); if (!m) return annee(); var y = +m[2] >= 8 ? +m[1] : +m[1] - 1; return y + "-" + (y + 1); }   /* 1er août → 31 juillet */
  function dayOfU(u) { var d = new Date(+u > 1e11 ? +u : Date.now()); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function num(x) { return x != null && x !== "" && isFinite(+x); }
  function people() { var M = { n: {}, c: {} }; try { arr(window.EPSL && EPSL.items()).forEach(function (o) { if (!o || !o.nom) return; M.c[ck(o.nom)] = o.nom; arr(EPSL.people(o)).forEach(function (p) { var f = p.full || ((p.prenom || "") + " " + (p.nom || "")).trim(); if (f) M.n[nk(f)] = f; }); }); } catch (e) {} return M; }
  function leNoms() { var d = ["Participation", "Sérieux", "Thème du jour"], I = sItems("eps.param.v1"), r = null; Object.keys(DIRS).some(function (a) { var o = I[DIRS[a] + "|leceval"]; if (o && !o.del && Array.isArray(o.v) && o.v.length === 3) { r = o.v.map(String); return true; } return false; }); return r || d; }
  /* fiches de leçon d'une activité : critères de grille travaillés par chaque leçon et par chaque situation */
  function lecMap(dir) { var I = sItems("eps.lecons." + dir + ".v1"), L = {}, S = {}; Object.keys(I).forEach(function (id) { var l = I[id]; if (!l || l.del || !Array.isArray(l.sits)) return; var lid = l.id || id, u = [];
      l.sits.forEach(function (x, i) { var c = arr(x && x.crit).map(String); S[lid + ":s" + i] = c; c.forEach(function (z) { if (u.indexOf(z) < 0) u.push(z); }); }); L[lid] = u; }); return { lec: L, sit: S }; }
  /* même calcul que modPart d'eps-lecons.js (part de 0 à 1 d'un critère de modalité) */
  function modPart(c, v) { if (!num(v)) return null; v = +v; if (c.ty === "deg") return Math.max(0, Math.min(1, (v - .5) / 4)); if (c.ty === "pts") return +c.max > 0 ? Math.max(0, Math.min(1, v / +c.max)) : null; if (c.ty === "ok") return v ? 1 : 0;
    if (c.ty === "perf") { var b = +c.best, w = +c.worst; if (!isFinite(b) || !isFinite(w) || b === w || c.best === "" || c.worst === "") return null; return Math.max(0, Math.min(1, (v - w) / (b - w))); } return null; }
  function elOf(E, key) { var r = null; Object.keys(obj(E)).some(function (k) { if (nk(k) === key) { r = E[k]; return true; } return false; }); return r && typeof r === "object" ? r : null; }
  function accu(T, id, v) { var o = T[id] || (T[id] = { s: 0, n: 0 }); o.s += v; o.n++; }
  /* leçons d'un élève dans une activité → {année: {cls, first, days:{jour:{T:{critère:{s,n}}, E:{…}, le:{p,s,t}}}, mods:[{id, nom, d, rows:[{cr, v}]}]}} (valeurs de 0 à 4) */
  function lecTr(app, key) { var dir = DIRS[app], out = {}, P = null; if (!dir) return out; var LC = lecMap(dir);
    var year = function (day, cls) { var an = anOf(day), o = out[an] || (out[an] = { cls: "", first: day, days: {}, mods: [] }); if (day < o.first) o.first = day; if (cls && !o.cls) o.cls = cls; return o; };
    var slot = function (day, cls) { var o = year(day, cls); return o.days[day] || (o.days[day] = { T: {}, E: {}, le: {} }); };
    var IE = sItems("eps.leceval." + dir + ".v1"); Object.keys(IE).forEach(function (id) { var r = IE[id]; if (!r || r.del || !isDay(r.day)) return; var x = elOf(r.el, key); if (!x) return; var D = null;
      ["p", "s"].forEach(function (q) { if (num(x[q])) { D = D || slot(r.day, r.cls); D.le[q] = Math.max(0, Math.min(3, +x[q])) + .5; } });
      if (num(x.t)) { D = D || slot(r.day, r.cls); var v = Math.max(0, Math.min(3, +x.t)) + .5, cr = LC.lec[r.lec] || []; if (cr.length) cr.forEach(function (c) { accu(D.T, c, v); }); else D.le.t = v; } });
    var IR = sItems("eps.lecres." + dir + ".v1"); Object.keys(IR).forEach(function (id) { var r = IR[id], p = String(id).split("|"); if (!r || r.del || p.length < 3 || !isDay(p[1]) || !r.r || typeof r.r !== "object" || nk(p.slice(2).join(" ")) !== key) return;
      var D = null; Object.keys(r.r).forEach(function (k) { if (/@auto$/.test(k)) return; var v = +r.r[k]; if (!(v >= 0 && v <= 2)) return; var cr = LC.sit[k] || []; if (!cr.length) return; if (!D) { P = P || people(); D = slot(p[1], P.c[ck(p[0])] || p[0]); } cr.forEach(function (c) { accu(D.E, c, Math.min(3.99, v * 2)); }); }); });
    var IM = sItems("eps.evmod." + dir + ".v1"); Object.keys(IM).forEach(function (id) { var r = IM[id]; if (!r || r.del || r.k !== "res") return; var m = IM[r.mod]; if (!m || m.del || !Array.isArray(m.crit)) return; var x = elOf(r.el, key); if (!x) return;
      var day = dayOfU(r.u), rows = []; m.crit.forEach(function (c) { if (!c || c.id == null) return; var pt = modPart(c, x[c.id]); if (pt == null) return; rows.push({ cr: { id: m.id + ":" + c.id, nom: String(c.t || "Critère"), afl: String(c.afl || ""), max: +c.w > 0 ? +c.w : 1 }, v: Math.min(3.99, pt * 4) }); });
      if (rows.length) year(day, r.cls).mods.push({ id: m.id, nom: String(m.nom || "Modalité"), d: day, rows: rows }); });
    return out; }
  /* 👥 coévaluation : moyenne des camarades par critère (0 → 4) */
  function coVals(app, cls, key) { var I = sItems("eps.coeval.v1"), T = {}, n = 0; Object.keys(I).forEach(function (id) { var o = I[id]; if (!o || o.del || o.k !== "co" || o.app !== app || ck(o.cls) !== ck(cls) || nk(o.n) !== key || !o.by || typeof o.by !== "object") return;
      Object.keys(o.by).forEach(function (b) { var x = o.by[b]; if (!x || !x.ev || typeof x.ev !== "object") return; n++; Object.keys(x.ev).forEach(function (c) { var z = x.ev[c]; if (!z || !num(z.d)) return; var t = T[c] || (T[c] = { s: 0, n: 0 }); t.s += Math.max(0, Math.min(3, +z.d)) + (num(z.pos) ? Math.max(0, Math.min(1, +z.pos)) : .5); t.n++; }); }); });
    var ev = {}; Object.keys(T).forEach(function (c) { ev[c] = T[c].s / T[c].n; }); return { n: n, ev: ev }; }
  /* grille de coévaluation créée par l'enseignant pour une activité (eps-eval.js : g|<appli>, src « own ») */
  function coCrit(app) { var g = sItems("eps.coeval.v1")["g|" + app]; if (!g || g.del || g.k !== "g" || g.src === "eval" || !Array.isArray(g.crit)) return []; return g.crit.filter(function (c) { return c && c.id && String(c.nom || "").trim(); }).map(function (c) { return { id: String(c.id), nom: String(c.nom), afl: "", max: 1 }; }); }
  /* ⚡ repères rapides d'un élève : [{i, d, app}] et décompte par intitulé */
  function reperes(key, an) { var I = sItems("eps.ico.v1"), L = [], C = {}; Object.keys(I).forEach(function (id) { var r = I[id]; if (!r || r.del || !isDay(r.day) || (an && anOf(r.day) !== an)) return; var A = null; Object.keys(obj(r.el)).some(function (k) { if (nk(k) === key) { A = r.el[k]; return true; } return false; }); arr(A).forEach(function (z) { if (z && z.i) { L.push({ i: String(z.i), d: r.day, app: r.app || "" }); C[z.i] = (C[z.i] || 0) + 1; } }); });
    return { list: L.sort(function (a, b) { return a.d.localeCompare(b.d); }), counts: Object.keys(C).map(function (i) { return { i: i, n: C[i] }; }).sort(function (a, b) { return b.n - a.n; }) }; }
  /* 📒 carnet de classe à colonnes libres */
  var KC = "eps.cdc.v1", CTY = { note: "Note", deg: "Degré 1 à 4", ico: "Icône", perf: "Performance", txt: "Texte" };
  function cLd() { var v = jget(KC, null); if (!v || typeof v !== "object" || !v.items || Array.isArray(v.items)) v = { items: {}, pend: {}, since: 0 }; v.pend = obj(v.pend); return v; }
  function cPut(it) { var V = cLd(), old = V.items[it.id]; it.u = Math.max(Date.now(), ((old && old.u) || 0) + 1); V.items[it.id] = it; V.pend[it.id] = it.u; try { localStorage.setItem(KC, JSON.stringify(V)); } catch (e) { return false; }
    try { if (window.EPSD && EPSD.syncSoon) EPSD.syncSoon(); } catch (e) {} try { document.dispatchEvent(new CustomEvent("eps-ref")); } catch (e) {} return true; }
  function cols(cls) { var I = sItems(KC), L = []; Object.keys(I).forEach(function (id) { var c = I[id]; if (c && !c.del && c.k === "col" && (!cls || ck(c.cls) === ck(cls))) L.push(c); }); return L.sort(function (a, b) { return (a.o || 0) - (b.o || 0) || String(a.d).localeCompare(String(b.d)); }); }
  function colPut(c) { var id = c.id || "c|" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), old = cLd().items[id], ty = CTY[c.ty] ? c.ty : "note";
    return cPut({ id: id, k: "col", cls: String(c.cls || ""), nom: String(c.nom || "Colonne").trim().slice(0, 40), ty: ty, max: +c.max > 0 ? +c.max : 20, coef: +c.coef > 0 ? +c.coef : 1, unit: String(c.unit || "").slice(0, 12), icos: arr(c.icos).map(String).filter(Boolean).slice(0, 8), cg: arr(c.cg), d: isDay(c.d) ? c.d : today(), app: DIRS[c.app] ? c.app : "", o: c.o != null ? c.o : old && old.o != null ? old.o : Date.now() }) ? id : ""; }
  function colDel(c) { try { if (window.EPSD && EPSD.trash) EPSD.trash.keep({ type: "Colonne du carnet", label: c.nom, sub: c.cls, items: [{ key: KC, id: c.id }, { key: KC, id: "v|" + c.id }] }); } catch (e) {} cPut({ id: "v|" + c.id, del: 1 }); return cPut({ id: c.id, del: 1 }); }
  function colVals(id) { var o = sItems(KC)["v|" + id]; return o && !o.del && o.el && typeof o.el === "object" ? o.el : {}; }
  function valSet(c, key, v) { var o = cLd().items["v|" + c.id]; if (!o || o.del || !o.el || typeof o.el !== "object") o = { id: "v|" + c.id, k: "val", col: c.id, cls: c.cls, el: {} }; if (v == null || v === "") delete o.el[key]; else o.el[key] = v; o.cls = c.cls; return cPut(o); }
  function colPart(c, v) { if (v == null || v === "") return null; if (c.ty === "note") return num(v) && +c.max > 0 ? Math.max(0, Math.min(1, +v / +c.max)) : null; if (c.ty === "deg") return num(v) ? Math.max(0, Math.min(1, (+v - .5) / 4)) : null; return null; }
  function colMoy(cls, key) { var s = 0, w = 0; cols(cls).forEach(function (c) { if (c.ty !== "note") return; var p = colPart(c, colVals(c.id)[key]); if (p == null) return; s += p * c.coef; w += c.coef; }); return w ? Math.round(s / w * 20 * 100) / 100 : null; }
  function ogOfCg(ids) { var C = {}, out = []; cgs().forEach(function (c) { C[c.id] = c; }); arr(ids).forEach(function (id) { arr(C[id] && C[id].og).forEach(function (x) { if (OGC[x] && out.indexOf(x) < 0) out.push(x); }); }); return out.sort(); }

  /* grilles « en plus » à rattacher : évaluation de leçon (toutes activités) et critères des modalités d'évaluation */
  function gridOf(app, voie) { var G = grids().filter(function (g) { return g.app === app; }); return G.filter(function (g) { return g.gv === voie; })[0] || G.filter(function (g) { return g.gv === "x"; })[0] || G[0] || null; }
  function gridsPlus() { var N = leNoms(), L = [{ key: "_le|x", app: "_le", gv: "x", plus: "le", nom: "Évaluer la leçon (toutes activités)", ca: "", color: "", crit: [{ id: "p", nom: N[0], afl: "", max: 1 }, { id: "s", nom: N[1], afl: "", max: 1 }, { id: "t", nom: N[2] + " (leçon sans critère coché)", afl: "", max: 1 }] }];
    Object.keys(DIRS).forEach(function (app) { var I = sItems("eps.evmod." + DIRS[app] + ".v1"), g0 = gridOf(app, "gt"); Object.keys(I).forEach(function (id) { var m = I[id]; if (!m || m.del || m.k !== "mod" || !Array.isArray(m.crit) || !m.crit.length) return;
      L.push({ key: app + "|m|" + m.id, app: app, gv: "m", plus: "mod", nom: DNOM[app] + " · 🧪 " + String(m.nom || "Modalité"), ca: (g0 && g0.ca) || "", color: (g0 && g0.color) || "", crit: m.crit.filter(function (c) { return c && c.id != null; }).map(function (c) { return { id: m.id + ":" + c.id, nom: String(c.t || "Critère"), afl: String(c.afl || ""), max: +c.w > 0 ? +c.w : 1 }; }) }); }); });
    Object.keys(DIRS).forEach(function (app) { var C = coCrit(app), g0 = gridOf(app, "gt"); if (C.length) L.push({ key: app + "|co", app: app, gv: "co", plus: "co", nom: DNOM[app] + " · 👥 Coévaluation", ca: (g0 && g0.ca) || "", color: (g0 && g0.color) || "", crit: C }); });
    return L; }
  function gridsAll() { return grids().map(function (g) { g.key = g.app + "|" + g.gv; return g; }).concat(gridsPlus()); }
  /* élèves et classes qui n'ont encore que des évaluations de leçon (pas d'évaluation de fin de séquence relevée) */
  function lecIndex(an) { var M = {}, P = people(), add = function (cls, k, day) { if (!cls || (an && anOf(day) !== an)) return; var c = M[ck(cls)] || (M[ck(cls)] = { cls: P.c[ck(cls)] || cls, el: {} }); k = nk(k); if (k) c.el[k] = P.n[k] || k; };
    Object.keys(DIRS).forEach(function (a) { var d = DIRS[a], IE = sItems("eps.leceval." + d + ".v1"); Object.keys(IE).forEach(function (id) { var r = IE[id]; if (r && !r.del && isDay(r.day) && r.cls) Object.keys(obj(r.el)).forEach(function (k) { add(r.cls, k, r.day); }); });
      var IM = sItems("eps.evmod." + d + ".v1"); Object.keys(IM).forEach(function (id) { var r = IM[id]; if (r && !r.del && r.k === "res" && r.cls) Object.keys(obj(r.el)).forEach(function (k) { add(r.cls, k, dayOfU(r.u)); }); }); });
    return M; }

  /* ---------- lecture pour le suivi ---------- */
  function grids() { return all("gr").filter(function (g) { return g.app && Array.isArray(g.crit); }).sort(function (a, b) { return String(a.nom).localeCompare(String(b.nom), "fr") || String(a.gv).localeCompare(String(b.gv)); }); }
  function snaps(f) { f = f || {}; return all("sn").filter(function (s) { return s && s.app && Array.isArray(s.crit) && s.el && typeof s.el === "object" && (!f.an || s.an === f.an) && (!f.cls || ck(s.cls) === ck(f.cls)) && (!f.key || s.el[f.key]); })
    .sort(function (a, b) { return String(a.d0).localeCompare(String(b.d0)) || String(a.nom).localeCompare(String(b.nom), "fr"); }); }
  function annees() { var L = [annee()]; all("sn").forEach(function (s) { if (s.an && L.indexOf(s.an) < 0) L.push(s.an); }); return L.sort().reverse(); }
  function val(pr) { return Array.isArray(pr) && pr.length === 2 && !isNaN(+pr[0]) && !isNaN(+pr[1]) ? +pr[0] + +pr[1] : null; }   /* 0 → 4 */
  function deg(v) { return v == null ? "" : Math.min(4, Math.floor(v + 1e-9) + 1); }
  function mk() { return { ps: 0, pw: 0, as: 0, aw: 0, n: 0, hist: [] }; }
  function add(b, w, p, a) { if (p != null) { b.ps += p * w; b.pw += w; } if (a != null) { b.as += a * w; b.aw += w; } if (p != null || a != null) b.n++; }
  function fin(b) { b.p = b.pw ? b.ps / b.pw : null; b.a = b.aw ? b.as / b.aw : null; return b; }
  /* profil d'un élève. Une « unité » par année et par activité = évaluation de fin de séquence relevée (sn) et / ou leçons (tr).
     Par critère : enseignant = évaluation finale, sinon moyenne des leçons (fp = false) ; élève = auto-positionnement, sinon ses résultats aux situations.
     Puis moyennes pondérées par les points du critère, par compétence générale, objectif général et AFL. hist = une valeur par activité, dans l'ordre des dates. */
  function moy(L) { var s = 0, n = 0; L.forEach(function (v) { if (v != null) { s += v; n++; } }); return n ? s / n : null; }
  function profil(key, f) { f = f || {}; var R = { nom: "", acts: [], cg: {}, og: {}, afl: {}, n: 0 }, U = {};
    var slot = function (T, id) { return T[id] || (T[id] = mk()); }, CGI = {}; cgs().forEach(function (c) { CGI[c.id] = 1; });
    snaps({ key: key, an: f.an }).forEach(function (s) { U[s.an + "|" + s.app] = { an: s.an, app: s.app, snap: s, gv: s.gv, crit: s.crit, cls: s.cls, voie: s.voie, d0: s.d0, nom: s.nom, ca: s.ca, color: s.color, tr: null }; R.nom = R.nom || s.el[key].n || ""; });
    Object.keys(DIRS).forEach(function (app) { var T = lecTr(app, key); Object.keys(T).forEach(function (an) { if (f.an && an !== f.an) return; var t = T[an], u = U[an + "|" + app];
      if (!u) { var voie = voieOf(t.cls), g = gridOf(app, voie); u = U[an + "|" + app] = { an: an, app: app, snap: null, gv: g ? g.gv : "x", crit: g ? g.crit : [], cls: t.cls, voie: voie, d0: t.first, nom: (g && g.nom) || DNOM[app], ca: (g && g.ca) || "", color: (g && g.color) || "", tr: null }; }
      u.tr = t; }); });
    /* 👥 élève seulement observé par des camarades : l'activité apparaît quand même */
    (function () { var I = sItems("eps.coeval.v1"); Object.keys(I).forEach(function (id) { var o = I[id]; if (!o || o.del || o.k !== "co" || !DIRS[o.app] || nk(o.n) !== key || !o.by || typeof o.by !== "object") return; var ts = Object.keys(o.by).map(function (b) { return +(o.by[b] && o.by[b].t) || 0; }).filter(Boolean); if (!ts.length) return;
      var d = dayOfU(Math.min.apply(null, ts)), an = anOf(d); if (f.an && an !== f.an) return; if (U[an + "|" + o.app]) return; var voie = voieOf(o.cls), g = gridOf(o.app, voie);
      U[an + "|" + o.app] = { an: an, app: o.app, snap: null, gv: g ? g.gv : "x", crit: g ? g.crit : [], cls: o.cls, voie: voie, d0: d, nom: (g && g.nom) || DNOM[o.app], ca: (g && g.ca) || "", color: (g && g.color) || "", tr: null }; }); })();
    /* 📒 carnet de classe : une unité par année, pour les colonnes notées qui portent une compétence générale */
    cols().forEach(function (c) { if ((c.ty !== "note" && c.ty !== "deg") || !arr(c.cg).length || colVals(c.id)[key] == null) return; var an = anOf(c.d); if (f.an && an !== f.an) return;
      var u = U[an + "|_cb"] || (U[an + "|_cb"] = { an: an, app: "_cb", snap: null, gv: "x", crit: [], cls: c.cls, voie: voieOf(c.cls), d0: c.d, nom: "Carnet de classe", ca: "", color: "#86198F", tr: null, cols: [] }); if (c.d < u.d0) u.d0 = c.d; u.cols.push(c); });
    Object.keys(U).map(function (k) { return U[k]; }).sort(function (a, b) { return String(a.d0).localeCompare(String(b.d0)) || String(a.nom).localeCompare(String(b.nom), "fr"); }).forEach(function (u) {
      var e = u.snap ? u.snap.el[key] : null, P = obj(e && e.p), Ap = obj(e && e.a), CO = u.app.charAt(0) === "_" ? { n: 0, ev: {} } : coVals(u.app, u.cls, key), act = { sn: u, rows: [], days: [], p: null, a: null }, loc = { cg: {}, og: {}, afl: {} }, tot = mk();
      var days = u.tr && u.tr.days ? Object.keys(u.tr.days).sort() : []; act.days = days;
      var push = function (g, cr, p, a, o) { if (p == null && a == null && !(o && o.c != null)) return; var w = +cr.max > 0 ? +cr.max : 1, L = o && o.cg0 ? { cg: o.cg0.filter(function (x) { return CGI[x]; }), ep: [] } : link(g.app, g.gv, cr), og = o && o.cg0 ? ogOfCg(L.cg) : ogOf(g, cr, u.voie), code = aflCode(cr, u.voie), r = { cr: cr, afl: code || cr.afl || "", cg: L.cg, ep: L.ep, og: og, p: p, a: a, fp: true, fa: true, kind: "crit", tl: [] };
        Object.keys(o || {}).forEach(function (k) { if (k !== "cg0") r[k] = o[k]; }); act.rows.push(r); add(tot, w, p, a); R.n++;
        L.cg.forEach(function (id) { add(slot(loc.cg, id), w, p, a); }); og.forEach(function (id) { add(slot(loc.og, id), w, p, a); }); if (code) add(slot(loc.afl, code), w, p, a); };
      /* critères de la grille : évaluation finale, sinon leçons */
      arr(u.crit).forEach(function (cr) { var p = val(P[cr.id]), a = val(Ap[cr.id]), tl = [];
        days.forEach(function (d) { var D = u.tr.days[d], t = D.T[cr.id], x = D.E[cr.id]; if (t || x) tl.push({ d: d, t: t ? t.s / t.n : null, e: x ? x.s / x.n : null }); });
        var lt = moy(tl.map(function (z) { return z.t; })), le = moy(tl.map(function (z) { return z.e; }));
        push(u, cr, p != null ? p : lt, a != null ? a : le, { fp: p != null, fa: a != null, tl: tl, c: CO.ev[cr.id] != null ? CO.ev[cr.id] : null }); });
      act.co = CO.n;
      /* 👥 critères de la grille de coévaluation de l'enseignant (regard des camarades seul) */
      if (CO.n) coCrit(u.app).forEach(function (cr) { if (CO.ev[cr.id] != null) push({ app: u.app, gv: "co", ca: u.ca }, cr, null, null, { kind: "co", c: CO.ev[cr.id] }); });
      /* 📒 colonnes du carnet de classe rattachées à une compétence générale */
      arr(u.cols).forEach(function (c) { var pt = colPart(c, colVals(c.id)[key]); if (pt != null) push({ app: "_cb", gv: "x", ca: "" }, { id: c.id, nom: c.nom, afl: "", max: c.coef }, Math.min(3.99, pt * 4), null, { kind: "col", cg0: arr(c.cg), tl: [{ d: c.d, t: Math.min(3.99, pt * 4), e: null }] }); });
      /* évaluation de leçon : critères communs à toutes les activités */
      if (days.length) { var N = leNoms(); ["p", "s", "t"].forEach(function (q, i) { var tl = []; days.forEach(function (d) { var v = u.tr.days[d].le[q]; if (v != null) tl.push({ d: d, t: v, e: null }); }); if (!tl.length) return;
        push({ app: "_le", gv: "x", ca: "" }, { id: q, nom: N[i], afl: "", max: 1 }, moy(tl.map(function (z) { return z.t; })), null, { fp: false, kind: "le", tl: tl }); }); }
      /* modalités d'évaluation */
      if (u.tr) u.tr.mods.forEach(function (m) { m.rows.forEach(function (x) { push({ app: u.app, gv: "m", ca: u.ca }, x.cr, x.v, null, { kind: "mod", mod: m.nom, tl: [{ d: m.d, t: x.v, e: null }] }); }); });
      if (!act.rows.length) return; fin(tot); act.p = tot.p; act.a = tot.a; R.acts.push(act);
      ["cg", "og", "afl"].forEach(function (t) { Object.keys(loc[t]).forEach(function (id) { var b = fin(loc[t][id]), g = slot(R[t], id);
        if (b.p != null) { g.ps += b.p * b.pw; g.pw += b.pw; } if (b.a != null) { g.as += b.a * b.aw; g.aw += b.aw; } g.n += b.n; g.hist.push({ app: u.app, nom: u.nom, an: u.an, d: u.d0, p: b.p, a: b.a }); }); }); });
    ["cg", "og", "afl"].forEach(function (t) { Object.keys(R[t]).forEach(function (id) { fin(R[t][id]); }); });
    if (!R.nom) R.nom = people().n[key] || "";
    return R; }
  function eleves(cls, an) { var M = {}; snaps({ cls: cls, an: an }).forEach(function (s) { Object.keys(s.el).forEach(function (k) { if (!M[k]) M[k] = { k: k, full: s.el[k].n || k }; }); });
    var X = lecIndex(an)[ck(cls)]; if (X) Object.keys(X.el).forEach(function (k) { if (!M[k]) M[k] = { k: k, full: X.el[k] }; });
    var PP = null; cols(cls).forEach(function (c) { if (an && anOf(c.d) !== an) return; Object.keys(colVals(c.id)).forEach(function (k) { if (!M[k]) { PP = PP || people(); M[k] = { k: k, full: PP.n[k] || k }; } }); });
    return Object.keys(M).map(function (k) { return M[k]; }).sort(function (a, b) { return a.full.localeCompare(b.full, "fr"); }); }
  function classes(an) { var M = {}; snaps({ an: an }).forEach(function (s) { M[ck(s.cls)] = s.cls; }); var X = lecIndex(an); Object.keys(X).forEach(function (k) { if (!M[k]) M[k] = X[k].cls; }); cols().forEach(function (c) { if (c.cls && (!an || anOf(c.d) === an) && !M[ck(c.cls)]) M[ck(c.cls)] = c.cls; }); return Object.keys(M).map(function (k) { return M[k]; }).sort(function (a, b) { return a.localeCompare(b, "fr", { numeric: true }); }); }

  /* ---------- affichage commun (page Référentiel et carnet de l'élève) ---------- */
  var DCOL = ["#B3261E", "#C2410C", "#1D4ED8", "#1E6B3A"], DBG = ["#FDECEA", "#FFF1E6", "#E8EEFC", "#E6F4EA"];
  function pill(v, el) { if (v == null) return '<span class="rf-d rf-d0">–</span>'; var d = deg(v); return '<span class="rf-d" style="background:' + DBG[d - 1] + ";color:" + DCOL[d - 1] + '" title="' + (el ? "Auto-positionnement" : "Enseignant") + " : degré " + d + ' sur 4">D' + d + "</span>"; }
  function bar(b) { var h = '<div class="rf-bar" role="img" aria-label="' + (b.p != null ? "Enseignant : degré " + deg(b.p) + " sur 4" : "") + (b.a != null ? " · Élève : degré " + deg(b.a) + " sur 4" : "") + '">';
    if (b.p != null) h += '<i class="rf-bp" style="width:' + Math.max(4, Math.min(100, b.p / 4 * 100)) + "%;background:" + DCOL[deg(b.p) - 1] + '"></i>';
    if (b.a != null) h += '<i class="rf-ba" style="left:' + Math.max(1, Math.min(99, b.a / 4 * 100)) + '%"></i>';
    return h + "</div>"; }
  function trend(h) { var L = h.filter(function (x) { return x.p != null; }); if (L.length < 2) return ""; var d = L[L.length - 1].p - L[0].p; return d > .5 ? ' <span class="rf-up" title="En progrès">▲</span>' : d < -.5 ? ' <span class="rf-dn" title="En baisse">▼</span>' : ' <span class="rf-eq" title="Stable">＝</span>'; }
  function css() { if (document.getElementById("rf-css")) return; var s = document.createElement("style"); s.id = "rf-css";
    s.textContent = ".rf-d{display:inline-block;min-width:34px;text-align:center;font-weight:900;font-size:13px;border-radius:8px;padding:3px 6px}.rf-d0{background:#F1EEE7;color:#6A6F78}" +
      ".rf-bar{position:relative;height:14px;background:#EFEBE3;border-radius:7px;min-width:120px;flex:1}.rf-bp{position:absolute;left:0;top:0;bottom:0;border-radius:7px}.rf-ba{position:absolute;top:-4px;bottom:-4px;width:4px;margin-left:-2px;background:#14171C;border-radius:2px}" +
      ".rf-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid #E6E1D6}.rf-row:first-of-type{border-top:0}.rf-row>b{flex:0 0 42%;font-size:15px;font-weight:700;min-width:0}.rf-row small{color:#6A6F78;font-weight:600}" +
      ".rf-up{color:#1E6B3A}.rf-dn{color:#B3261E}.rf-eq{color:#6A6F78}.rf-leg{font-size:13px;color:#6A6F78;margin:6px 0 0}.rf-leg i{display:inline-block;width:4px;height:14px;background:#14171C;border-radius:2px;vertical-align:-2px;margin:0 4px 0 10px}" +
      ".rf-og{display:inline-block;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800;color:#fff;margin:1px 3px 1px 0;white-space:nowrap}" +
      "@media(max-width:560px){.rf-row{flex-wrap:wrap}.rf-row>b{flex:1 1 100%}}";
    document.head.appendChild(s); }
  function ogChip(id, voie, court) { var o = ogs(voie).filter(function (x) { return x.id === id; })[0]; if (!o) return ""; return '<span class="rf-og" style="background:' + o.color + '" title="' + esc(o.t) + '">' + (court ? "OG" + o.n : esc(o.t)) + "</span>"; }
  /* bloc « Mes compétences » : objectifs généraux puis compétences générales. o.eleve = formulation pour l'élève. */
  function htmlProfil(key, o) { o = o || {}; css(); var R = profil(key, { an: o.an }), voie = R.acts.length ? R.acts[R.acts.length - 1].sn.voie : "gt", h = "";
    if (!R.acts.length) return "";
    var rows = function (T, L, lab) { var x = ""; L.forEach(function (it) { var b = T[it.id]; if (!b || (b.p == null && b.a == null)) return;
      x += '<div class="rf-row"><b>' + lab(it) + " <small>" + b.hist.length + " activité" + (b.hist.length > 1 ? "s" : "") + "</small>" + trend(b.hist) + "</b>" + bar(b) + pill(b.p) + (b.a != null ? pill(b.a, 1) : "") + "</div>"; }); return x; };
    var a = rows(R.og, ogs(voie), function (it) { return '<span class="rf-og" style="background:' + it.color + '">' + it.n + "</span> " + esc(it.t); });
    var c = rows(R.cg, cgs(), function (it) { return esc(it.nom); });
    if (a) h += "<h3>" + (o.eleve ? "Les grands objectifs de l'EPS" : "Objectifs généraux") + "</h3>" + a;
    if (c) h += '<h3 style="margin-top:14px">' + (o.eleve ? "Mes compétences" : "Compétences générales") + "</h3>" + c;
    if (!h) return "";
    return h + '<p class="rf-leg">Barre et 1re pastille : ' + (o.eleve ? "mon enseignant" : "enseignant") + ' <i></i>trait noir et 2e pastille : ' + (o.eleve ? "mon auto-positionnement" : "auto-positionnement de l'élève") + " · degrés 1 à 4, toutes activités réunies, leçons comprises.</p>"; }

  function cfg() { return obj(one("cfg")); }
  function clean() { /* relevés de la classe de démonstration : retirés quand la classe fictive n'existe plus */
    try { if (!window.EPSL) return; var demo = arr(EPSL.items()).some(function (o) { return o && /^D[ÉE]MO/i.test(String(o.nom || "")); }); if (demo) return; all("sn").forEach(function (s) { if (s.demo) del(s.id); }); } catch (e) {} }

  window.EPSREF = { KEY: K, PRE: PRE, OG: OG, CAS: CAS, DEPART: DEPART, DCOL: DCOL, DBG: DBG,
    ld: ld, put: put, del: del, one: one, all: all, annee: annee, annees: annees, nk: nk, ck: ck, esc: esc, voieOf: voieOf,
    ogs: ogs, caT: caT, caOf: caOf, aflList: aflList, aflOg: aflOg, epList: epList, epMine: epMine, epCode: epCode, tx: tx, txOk: txOk,
    cgs: cgs, cgPut: cgPut, cgDel: cgDel, link: link, linkSet: linkSet, aflCode: aflCode, ogOf: ogOf,
    reperes: reperes, cdc: { KEY: KC, TY: CTY, cols: cols, put: colPut, del: colDel, vals: colVals, set: valSet, part: colPart, moy: colMoy }, people: people, anOf: anOf, today: today,
    grids: grids, gridsAll: gridsAll, gridOf: gridOf, DIRS: DIRS, DNOM: DNOM, snaps: snaps, classes: classes, eleves: eleves, profil: profil, val: val, deg: deg,
    pill: pill, bar: bar, trend: trend, ogChip: ogChip, htmlProfil: htmlProfil, css: css, cfg: cfg, snap: snapAll, clean: clean };

  /* synchronisation (eps-home.js) et relevé automatique dans les applis d'activité */
  (function reg(n) { if (window.EPSD && EPSD.store) { try { EPSD.store({ key: K, pre: PRE, onChange: function () { try { document.dispatchEvent(new CustomEvent("eps-ref")); } catch (e) {} } }); } catch (e) {} return; } if ((n || 0) < 80) setTimeout(function () { reg((n || 0) + 1); }, 250); })(0);
  /* page Suivi et compétences seulement : relevé (et pas seulement envoi) du carnet de classe, des repères rapides, de la coévaluation, et (carnet de notes, 28/11/2026) des évaluations de leçon et des modalités de toutes les activités */
  if (window.EPS_REF_PAGE) (function reg2(n) { if (window.EPSD && EPSD.store) { [[KC, "kc|"], ["eps.ico.v1", "iq|"], ["eps.coeval.v1", "cv|"]].concat(Object.keys(DIRS).reduce(function (L, a) { var d = DIRS[a]; return L.concat([["eps.leceval." + d + ".v1", "le." + d + "|"], ["eps.evmod." + d + ".v1", "em." + d + "|"]]); }, [])).forEach(function (x) { try { EPSD.store({ key: x[0], pre: x[1], onChange: function () { try { document.dispatchEvent(new CustomEvent("eps-ref")); } catch (e) {} } }); } catch (e) {} }); return; } if ((n || 0) < 80) setTimeout(function () { reg2((n || 0) + 1); }, 250); })(0);
  function tick() { try { if (!document.hidden) snapAll(); } catch (e) {} }
  setTimeout(function () { try { clean(); } catch (e) {} tick(); }, 4000); setInterval(tick, 20000);
  document.addEventListener("visibilitychange", function () { if (document.hidden) { try { snapAll(); } catch (e) {} } });
})();
