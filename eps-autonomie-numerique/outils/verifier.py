#!/usr/bin/env python3
"""Contrôle avant publication : python3 eps-autonomie-numerique/outils/verifier.py
Vérifie sans navigateur : syntaxe des scripts, liens internes, listes du mode hors ligne, ressources sans classe,
pages construites à partir de src/. Sortie 0 = tout va bien, 1 = au moins un problème (rien n'est modifié)."""
import re, sys, os, glob, json, subprocess, tempfile, pathlib
B = pathlib.Path(__file__).resolve().parent.parent; R = B.parent; pb = []; av = []
def rel(p): return os.path.relpath(p, R)
# 1. syntaxe (node --check) des fichiers .js / .gs et des scripts des pages
tmp = pathlib.Path(tempfile.mkdtemp())
def check(code, nom, module=False):
    t = tmp / ("x.mjs" if module else "x.js"); t.write_text(code, encoding="utf-8")
    r = subprocess.run(["node", "--check", str(t)], capture_output=True, text=True)
    if r.returncode: pb.append("syntaxe : %s : %s" % (nom, r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "?"))
js = [p for p in list(B.glob("*.js")) + list(B.glob("*/*.js")) + list(B.glob("*/src/*.js")) + list(B.glob("**/apps-script/*.gs")) + [R / "sw.js"]]
pages = list(B.glob("*.html")) + list(B.glob("*/*.html")) + list(R.glob("*.html"))
for p in js: check(p.read_text(encoding="utf-8"), rel(p))
for p in pages:
    s = p.read_text(encoding="utf-8", errors="replace")
    for i, m in enumerate(re.finditer(r"<script\b([^>]*)>(.*?)</script>", s, re.S)):
        if "src=" in m.group(1) or not m.group(2).strip() or re.search(r'type="(application/(ld\+)?json|text/)', m.group(1)): continue
        check(m.group(2), "%s (script %d)" % (rel(p), i + 1), 'type="module"' in m.group(1))
    # 2. liens internes des balises
    for m in re.finditer(r'(?:src|href)="([^"#?:{}$+]+)(?:[?#][^"]*)?"', s):
        u = m.group(1)
        if u.startswith(("//", "data")): continue
        q = (R / u[1:]) if u.startswith("/") else (p.parent / u)
        if not q.exists(): pb.append("lien cassé : %s -> %s" % (rel(p), u))
# 3. hors ligne : fichiers cités présents, fichiers communs gardés partout
communs = sorted(x.name for x in B.glob("eps-*.js"))
def liste(txt, nom):
    m = re.search(r"const %s = (\[.*?\]);" % nom, txt, re.S); return re.findall(r'(B \+ )?"([^"]+)"', m.group(1)) if m else None
racine = (R / "sw.js").read_text(encoding="utf-8"); core = liste(racine, "CORE_FILES") or []
vus = set()
for pre, u in core:
    q = (B / u) if pre else (R / u.lstrip("/"))
    if u.endswith("/") or u == "/": q = q / "index.html"
    if not q.exists(): pb.append("sw.js : fichier à garder introuvable : " + u)
    if (pre, u) in vus: pb.append("sw.js : doublon : " + u)
    vus.add((pre, u))
for c in communs:
    if ("B + ", c) not in core: pb.append("sw.js : fichier commun non gardé hors ligne : " + c)
own = re.search(r"const OWN = (\[.*?\]);", racine); own = json.loads(own.group(1)) if own else []
for d in sorted(x.name for x in B.iterdir() if (x / "index.html").exists()):
    sw = B / d / "sw.js"
    if sw.exists():
        if d + "/" not in own: pb.append("sw.js : « %s/ » a son service worker mais manque dans OWN" % d)
        t = sw.read_text(encoding="utf-8"); cites = set(re.findall(r'"\.\./(eps-[a-z-]+\.js)"', t))
        charge = set(re.findall(r'src="\.\./(eps-[a-z-]+\.js)"', (B / d / "index.html").read_text(encoding="utf-8", errors="replace")))
        besoin = set(communs) if "eps-home.js" in charge else charge
        for c in sorted(besoin - cites): pb.append("%s/sw.js : fichier commun non gardé hors ligne : %s" % (d, c))
        for u in re.findall(r'"((?:\./|\.\./)?[\w./-]+\.(?:html|js|png|webmanifest|webp))"', t):
            if not (B / d / u).exists(): pb.append("%s/sw.js : fichier introuvable : %s" % (d, u))
    elif not any(u == d + "/" for pre, u in core if pre): pb.append("sw.js : l'appli « %s/ » n'est pas gardée hors ligne (CORE_FILES)" % d)
# 4. écran « Choisis ta classe » : au moins une ressource sans classe par appli
for p in B.glob("*/index.html"):
    s = p.read_text(encoding="utf-8", errors="replace")
    if "EPSG_Q" in s and re.search(r"resources:\s*\[\s*\]", s): pb.append("%s : aucune ressource sans classe (resources:[])" % rel(p))
# 5. pages construites à partir de src/ : la page publiée doit être identique à la construction
for d, ordre, marque, f in [("ccf", r"ORDER = (\[.*?\])", "/*APP*/", None), ("orientation", r'for f in (\[.*?\])\)', "/*__JS__*/", 'if (typeof module !== "undefined") module.exports = QR;')]:
    D = B / d; ordre = json.loads(re.search(ordre, (D / "build.py").read_text(encoding="utf-8"), re.S).group(1))
    j = "\n".join((D / "src" / x).read_text(encoding="utf-8") for x in ordre)
    if f: j = j.replace(f, "")
    if (D / "src" / "shell.html").read_text(encoding="utf-8").replace(marque, j) != (D / "index.html").read_text(encoding="utf-8"):
        av.append("%s : src/ en retard sur index.html (index.html est la référence ; build.py refusera d'écraser)" % d)
# 7. repères : une page remplacée par une ancienne version ou par une page fabriquée ailleurs les perd
#    (a) toute appli sans src/ porte le repère « eps-source-directe » ; (b) corrections qui ne doivent jamais disparaître.
for p in list(B.glob("*/index.html")) + [B / "index.html"]:
    if not (p.parent / "src").is_dir() and "eps-source-directe" not in p.read_text(encoding="utf-8", errors="replace")[:600]:
        pb.append("%s : repère « eps-source-directe » absent : la page a été remplacée par une version fabriquée ailleurs ? Repartir de la page publiée (git log)." % rel(p))
REPERES = {
    "co-eval/index.html": ["function profCorr(", "function addResults(", "id=\"evSai\">✍ Ajouter des résultats", "await api(\"coeResult\", { eleve: me.id", "id=\"peH1\"", "function corrOf(", "function archChanged(", "function mergeMaps(", "const tfixOf = ", "_t: t, _id: me.id", "s.sk.some(", "function bindBilanEdit(", "function noteBig(", "corrige: 2 }", "cr.plus || cr.moins", "function analyse0(", "id=\"nRpAll\"", "data-un=", "function notesPdf(", "async function xlsxBlob(", "data-pf=\"\">Tous (", "cr.temps === \"in\"", "REPL = {", "function code4(", "function vPwd(", "header .epsb{", "openProf(inConsole", "retb\" data-nolive", "const pnClasses = ", "data-pn=", "function gridEdit(", "function nivPair(", "async function fichesPdf(", "fullCalcOnLoad", "calcul répartition", "const ptsCfg = ", "const ptsBand = ", "AFLD_PTS = {", "const a2Of = "],
    "console/index.html": ["window.epsConsoleOk", "function codeAsk(", "function pTransfert(", "function xUnpack(", "data-live", "doit être un nombre", "if (sm) sm.textContent", "Séquences terminées", 'id="seqan"', "function merge(fr)", "epsc-x"],
    "eps-lists.js": ["function eleveSeul(", "var ISO = /^(ccf", "set: function (id, val)", "EPS_NOLIVE", "eps-nolive-css", "typeof def === \"number\" && (typeof o.v !== \"number\"", "eps-console-css", "window.EPS_CONSOLE = true", "#eps-callb:not("],
    "eps-eval.js": ["M.classBtnsHtml = function", "M.quickInto = function", "M.layout = function", "function rapide(", "function srcCfg(", "M.csv = function", "epse-col", "data-g-exp", 'jx.kind === "evaluation"', "function pnOpen(", "pronote: pnOpen", ".epse-ged textarea", "function gridFor(", "function coAdd(", "function coEdit(", "function coEleve(", "n !== P.moi", "J'observe un camarade"],
    "orientation/index.html": ["console ordinateur (cadre"],
    "eps-shell.js": ["classe fictive « DÉMO »", "function evGo(", "function resArrange(", "EVON0", "[\"eval\", \"📋\", \"Évaluer\"]", "function evActs(", "function suiviOn(", "[\"suivi\", \"📡\", \"Suivi\"]", "doit être un nombre", ">✕ Fermer</button></div><iframe", ".epst-dock.lc-ov:not([id])>.lc-top{display:none!important}", "function dockSync(", "function run(x)", ".epst-dock [data-epst-x]{display:none!important}", "undock(true);"],
    "eps-home.js": ["var BUL_GEN = ", "act: bul ? \"EPS\"", "function vueDemoFiche(", "function vueDemo(", "function callHost(", "EPSD.appels = {", "appel_motifs", "function callHtml(", "function courtsHtml(", "function callT(", "function trKeep(", "function trRestore(", "bilans(want, true)", "html.eps-tous:not(.eps-teach) #eps-upd{display:none!important}", "data-eps-a11y-h", "function fortApply(", "var LEX = {", "eps.gate.last.", "async function espPublier(", "async function espRelever(", "EPSD.plan = {", "function planCheck(", "function gateSheet(", "sheet: gateSheet", "async function confirmes(", "ESSAIS_MAX"],
    "eps-lecons.js": ["function evalJour(", "function ejEdit(", "evalBilActions", "window.epsCtlAlerts", "function ctlDet(", "function ctlTmTick(", "typeof e.x.open === \"function\"", "ctl_inactif_min", "Pilotage de leçon", "function icoPop(", "function gNom(", "EPSD.trash.keep(", "if (WORK) put(KL, WORK)", "dayOf(p.at) === day"],
    "escalade/index.html": ["window.epsCtlOwn=", "window.epsTabInfo=", ".ccard.blink", "EPSD.appels.html('escalade')"],
    "danse/index.html": ["setProf: (cr, e, v)", "id=\"evBul\"", "Demande à ton enseignant de créer les groupes.", "SY.c[k] = { u: SY.p[k]", "function P01(", "P01(au.pos)", "P01(sel.pos)", "P01(x.pos)", "EPSG_Q", "UI.mode"],
    "volley/index.html": ["setProf:(cr,e,v)", "setDeg:(cr,e,d)", "VOL_LAST", "pd.n=(pd.n||0)+1", "function jsq(", "confirm(&quot;Changer l'équipe", "EPSG.sheet(", "window.epsCtlOwn=", "EPSD.courts({dispo:'vert',sport:'volley'"],
    "badminton/index.html": ["setDeg:(cr,e,d)", "BAD_LAST", "pd.n=(pd.n||0)+1", "EPSG.sheet(", "Fiches techniques", "window.epsCtlOwn=", "dispo:tn===5?'bad5':'ligne'"],
    "acrosport/index.html": ["GDEMO=\"gdemo\"", "EPSG.sheet(", "Array.isArray(def)!==Array.isArray(p)", "const autres="],
    "crosstraining/index.html": ["function livePub(", "function liveVoir(", "disabled tabindex=\"-1\"", "window.epsCtlAlerts = function(cls)", "const LIVE_K", "function panneauClasses(", "Array.isArray(f.exercices)"],
    "step/index.html": ["function okPas(", "function mtTic(", "EPSG_Q", "function edBrancher(", "function ctlHtml(", "function fcOk(", "function plDessin(", "const VUE=!!window.EPS_VUE_ELEVE", "function donneesExport("],
    "basket/index.html": ["EPSD.syncOne(KST)", "function rencontres(", "EPSG_Q", "m.by!==devId()", "id=\"modeBar\"", "function conseilSit(", "sitsVus().includes", "function terrainsBK(", "window.epsCtlOwn="],
    "ccf/index.html": ["tabs:{ccf:false,seq:"],
    "mon-bilan/index.html": ["ton enseignant", "kind === \"espace\"", "dropchk", "function mission(", "un seul envoi à la fois", "essais automatiques seulement", "../step/export.js"],
    "espace/index.html": ["E.publier(", "E.relever()", "noindex", "function mget(", "E.dispenses(", "get(DIRS.step).step"],
    "eps-tactique.js": ["function editor(", "function depart("],
    "eps-ref.js": ["function snapInst(", "function profil(", "function link(", "if (!nb) return;", "function lecTr(", "function gridsPlus(", "c.raw === raw", "function coVals(", "function colPut(", "EPSD.trash.keep("],
    "referentiel/index.html": ["function relever(", "function lnEdit(", "✕ Ne rien ajouter", "function vCdc(", "function saisie(", "function nbr("],
    "relais/index.html": ["function zK(z)", "zs=L.map(c=>zK(c.zone))", "DIAG[zK(ST.zone)]", "function fePop(", "fePop(+g.dataset.fego)", "var RL_BIL=0", "setDeg:(cr,e,d)", "function goBilans(", "let GO_AFTER=null", "lid=CLE()?CLE().id:null,prof", "function seqOpen(", "function evCourses(", "let EV_SCOPE=", "go:()=>go('seq')", "cls:{go:()=>go('classes')", "function renderLvCtl(", "function renderFiche(", "function goJour(", "window.epsCtlOwn={ctl:1", "label:'Écran des élèves'"],
    "eps-groupes.js": ["data-sc style=", "position:sticky;bottom:0", "function terrain(", "v.grp.nm = noms", "function imgSet(", "TZC = 24000"],
    "tactique/index.html": ["EPSD.plan.send(", "EPSD.plan.live(", "data-all"],
    "boite/index.html": ["function chrono(", "function compteur(", "function video(", "function analyse(", "function aCfg(", "function marks(", "function rpSet(", "function charge("],
    "attestation/index.html": ["À faire valider par ton chef d'établissement", "pre: \"at|\"", "noindex", "sheet a5 one"],
    "quiz/index.html": ["function okQ(", "var PROPS = ", "pre: \"qz|\"", "function garder("],
    "carnet/index.html": ["function courant(", "function garder(", "function orphelins(", "function ouvert(", "pre: \"cn|\"", "Ce n'est pas le bon code"],
    "guide/index.html": ["data-niv=\"a\"", "data-niv=\"b\"", "data-niv=\"c\"", "function rendre(", "function chercher(", "function imprimer(", "noindex", "EPSD.askCode()", "contenu.js"],
    "guide/contenu.js": ["G.a.gen = [", "G.b.gen = [", "G.c.gen = [", "act(\"ccf\"", "[\"aide\", \"commun\"]", "ce qu'il y a à faire pour être en réussite", "ce qu'il y a à faire pour faire"],
    "eps-guides.js": ["← Accueil · ← Retour · ✕ Fermer", "📖 Guides"],
    "apps-script/Code.gs": ["Reste GÉNÉRAL : l\\'appréciation vaut pour l\\'EPS", "res.aiv = 4", "function modele_(", "function sansCache_(", "function lisJson_(", "function syncChk_(", "res.chkv = 1"],
}
for f, L in REPERES.items():
    t = (B / f).read_text(encoding="utf-8", errors="replace")
    for x in L:
        if x not in t: pb.append("%s : correction disparue (« %s ») : fichier remplacé par une version plus ancienne ?" % (f, x[:50]))
# 8. guides : images citées présentes et gardées hors ligne, trois niveaux pour « Général » et chaque activité, vocabulaire
gc = (B / "guide" / "contenu.js").read_text(encoding="utf-8")
for im in sorted(set(re.findall(r'"([a-z0-9-]+\.jpg)"', gc))):
    if not (B / "guide" / "img" / im).exists(): pb.append("guide : image citée introuvable : " + im)
    elif ("B + ", "guide/img/" + im) not in core: pb.append("guide : image non gardée hors ligne (CORE_FILES) : " + im)
for im in sorted(x.name for x in (B / "guide" / "img").glob("*.jpg")):
    if '"%s"' % im not in gc: pb.append("guide : image inutilisée dans guide/img : " + im)
ga = re.findall(r'\{ k: "([a-z]+)", nom:', gc.split("var NIV")[0])
for k in ga[1:]:
    if 'act("%s"' % k not in gc: pb.append("guide : pas de guide pour l'activité « %s »" % k)
    elif '["aide", "%s"]' % k not in gc: pb.append("guide : le niveau détaillé de « %s » ne reprend pas eps-guides.js" % k)
for mot in ("séance", "Séance", " cycle ", "ce qui manque", "pas encore disponible", "à venir"):
    if mot in gc.split("window.EPS_GUIDE")[1]: pb.append("guide : mot à éviter « %s » (leçon / séquence ; ne jamais lister ce qui manque)" % mot.strip())
# 6. code des boutons (attributs on…) : JavaScript valide une fois la page affichée (apostrophe non protégée, etc.)
r = subprocess.run(["node", str(B / "outils" / "boutons.js")] + [str(p) for p in list(B.glob("*.js")) + pages], capture_output=True, text=True)
if r.returncode: pb += ["bouton : " + l for l in r.stdout.strip().split("\n")[:-1] if l.strip()]
for x in av: print("⚠ ", x)
for x in pb: print("✗ ", x)
print("%d problème(s), %d avertissement(s) · %d pages, %d scripts contrôlés" % (len(pb), len(av), len(pages), len(js)))
sys.exit(1 if pb else 0)
