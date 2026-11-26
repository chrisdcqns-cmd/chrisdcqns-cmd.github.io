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
    "danse/index.html": ["SY.c[k] = { u: SY.p[k]", "function P01(", "P01(au.pos)", "P01(sel.pos)", "P01(x.pos)", "EPSG_Q", "UI.mode"],
    "volley/index.html": ["pd.n=(pd.n||0)+1", "function jsq(", "confirm(&quot;Changer l'équipe", "EPSG.sheet("],
    "badminton/index.html": ["pd.n=(pd.n||0)+1", "EPSG.sheet(", "Fiches techniques"],
    "acrosport/index.html": ["EPSG.sheet(", "Array.isArray(def)!==Array.isArray(p)", "const autres="],
    "crosstraining/index.html": ["function panneauClasses(", "Array.isArray(f.exercices)"],
    "ccf/index.html": ["tabs:{ccf:false,seq:"],
    "console/index.html": ["doit être un nombre", "if (sm) sm.textContent"],
    "mon-bilan/index.html": ["ton enseignant"],
    "eps-home.js": ["EPSD.plan = {", "function planCheck(", "function gateSheet(", "sheet: gateSheet", "async function confirmes(", "ESSAIS_MAX"],
    "eps-lists.js": ["typeof def === \"number\" && (typeof o.v !== \"number\""],
    "eps-shell.js": ["doit être un nombre"],
    "eps-tactique.js": ["function editor(", "function depart("],
    "tactique/index.html": ["EPSD.plan.send(", "EPSD.plan.live(", "data-all"],
    "boite/index.html": ["function chrono(", "function compteur(", "function video(", "function analyse(", "function charge("],
    "attestation/index.html": ["À faire valider par ton chef d'établissement", "pre: \"at|\"", "noindex", "sheet a5 one"],
    "quiz/index.html": ["function okQ(", "pre: \"qz|\"", "function garder("],
    "carnet/index.html": ["function courant(", "function garder(", "pre: \"cn|\"", "Ce n'est pas le bon code"],
    "guide/index.html": ["data-ver=\"eleve\"", "data-ver=\"prof\"", "data-ver=\"bilan\"", "noindex", "EPSD.askCode()"],
    "eps-lecons.js": ["if (WORK) put(KL, WORK)", "dayOf(p.at) === day"],
    "apps-script/Code.gs": ["function modele_(", "function sansCache_(", "function lisJson_(", "function syncChk_(", "res.chkv = 1"],
}
for f, L in REPERES.items():
    t = (B / f).read_text(encoding="utf-8", errors="replace")
    for x in L:
        if x not in t: pb.append("%s : correction disparue (« %s ») : fichier remplacé par une version plus ancienne ?" % (f, x[:50]))
# 6. code des boutons (attributs on…) : JavaScript valide une fois la page affichée (apostrophe non protégée, etc.)
r = subprocess.run(["node", str(B / "outils" / "boutons.js")] + [str(p) for p in list(B.glob("*.js")) + pages], capture_output=True, text=True)
if r.returncode: pb += ["bouton : " + l for l in r.stdout.strip().split("\n")[:-1] if l.strip()]
for x in av: print("⚠ ", x)
for x in pb: print("✗ ", x)
print("%d problème(s), %d avertissement(s) · %d pages, %d scripts contrôlés" % (len(pb), len(av), len(pages), len(js)))
sys.exit(1 if pb else 0)
