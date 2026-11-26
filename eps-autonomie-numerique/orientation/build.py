# Reconstruit index.html à partir de src/ (pour les modifications futures)
import pathlib

# --- Garde-fou (26/11/2026) : ne jamais écraser une page modifiée directement -------------------------------
# La page publiée est la référence. Si index.html a changé depuis la dernière construction (ou si src/ est en retard),
# on s'arrête : reporter d'abord ces changements dans src/, puis relancer. « --forcer » passe outre (à éviter).
import hashlib, sys
def _garde(dossier, html):
    page, marque = dossier / "index.html", dossier / ".derniere-construction"
    h = lambda t: hashlib.sha256(t.encode("utf-8")).hexdigest()
    if page.exists() and "--forcer" not in sys.argv:
        actuel = page.read_text(encoding="utf-8")
        connue = marque.read_text(encoding="utf-8").strip() if marque.exists() else ""
        if actuel != html and h(actuel) != connue:
            a, b = actuel.splitlines(), set(html.splitlines())
            perdues = [l for l in a if l not in b]
            sys.exit("ARRÊT : index.html contient %d ligne(s) absentes de src/ (modifiées directement dans la page).\n"
                     "Reconstruire les effacerait. Reporter ces lignes dans src/ puis relancer.\nPremière ligne concernée : %s"
                     % (len(perdues), (perdues[0][:160] if perdues else "(ordre ou lignes en trop dans src/)")))
    page.write_text(html, encoding="utf-8"); marque.write_text(h(html), encoding="utf-8")
root = pathlib.Path(__file__).parent; src = root / "src"
js = "\n".join((src / f).read_text(encoding="utf-8") for f in ["qr.js", "core.js", "teacher.js", "teacher2.js", "teacher3.js", "extras.js", "biblio.js", "terrainimp.js", "cartes.js", "student.js", "app.js"])
js = js.replace('if (typeof module !== "undefined") module.exports = QR;', "")
_garde(root, (src / "shell.html").read_text(encoding="utf-8").replace("/*__JS__*/", js))
print("index.html reconstruit")
