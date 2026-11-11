# Reconstruit index.html à partir de src/ (pour les modifications futures)
import pathlib
root = pathlib.Path(__file__).parent; src = root / "src"
js = "\n".join((src / f).read_text(encoding="utf-8") for f in ["qr.js", "core.js", "teacher.js", "teacher2.js", "teacher3.js", "student.js", "app.js"])
js = js.replace('if (typeof module !== "undefined") module.exports = QR;', "")
(root / "index.html").write_text((src / "shell.html").read_text(encoding="utf-8").replace("/*__JS__*/", js), encoding="utf-8")
print("index.html reconstruit")
