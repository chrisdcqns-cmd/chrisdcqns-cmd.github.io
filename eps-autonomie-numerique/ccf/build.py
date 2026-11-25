#!/usr/bin/env python3
"""Assemble ccf/index.html à partir de src/ (shell.html + scripts, dans l'ordre)."""
import pathlib
D = pathlib.Path(__file__).parent
ORDER = ["protocoles.js", "core.js", "eval.js", "teacher.js", "proto.js", "pratique.js", "eleve.js", "pdf.js", "imprime.js", "observe.js", "supports.js", "position.js", "co.js", "init.js"]
js = "\n".join((D / "src" / f).read_text(encoding="utf-8") for f in ORDER)
html = (D / "src" / "shell.html").read_text(encoding="utf-8").replace("/*APP*/", js)
(D / "index.html").write_text(html, encoding="utf-8")
print("index.html :", len(html), "caractères")
