# 📡 Onglet commun « Suivi » (eps-shell.js) : juste après Séquence dans les applis qui ont leur écran de suivi (pas dans les autres),
# il ouvre cet écran, reste actif tant que cet écran est affiché, et Séquence redevient actif quand on y retourne.
# python3 t_suivi.py <racine du dépôt> [dossier des captures]
import asyncio, sys, subprocess, time, json, os
from playwright.async_api import async_playwright
ROOT = sys.argv[1]; SHOTS = sys.argv[2] if len(sys.argv) > 2 else ""
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8849", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8849/eps-autonomie-numerique/"; CL = "2GT1 TEST"
NOMS = ["Lina MARTIN", "Noah PETIT", "Emma DURAND", "Hugo LEROY", "Jade MOREAU", "Louis SIMON", "Tom ROUX", "Ines FAURE"]
SEED = "try{if(!localStorage.getItem('eps.lists.v1'))localStorage.setItem('eps.lists.v1',JSON.stringify({items:{c1:{id:'c1',nom:'" + CL + "',el:" + json.dumps(NOMS) + ",u:1}},pend:{},since:0}));localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));}catch(e){}"
# appli, texte attendu dans l'écran de suivi, écran propre (True) ou pilotage commun (False)
APPS = [("volley", "Tableau de bord de la leçon", True), ("badminton", "Leçon en direct", True), ("basket", "Terrain 1", True), ("escalade", "Tablette de contrôle", True), ("step", "Groupes en direct", True),
        ("danse", "Pilotage de leçon", False), ("relais", "Démarrer la leçon", True), ("crosstraining", "Pilotage de leçon", False)]
ETAT = "(function(){var n=document.querySelector('.epst-nav'),T=n?[].map.call(n.querySelectorAll('button'),function(b){return b.dataset.t}):[],on=n&&n.querySelector('button.on');var p=document.getElementById('lc-ctl');return {tabs:T,on:on?on.dataset.t:'',pil:!!(p&&p.style.display!=='none'),txt:document.body.innerText,acts:[].map.call(document.querySelectorAll('.epst-acts button, .epst-tb button'),function(b){return b.innerText.replace(/\\s+/g,' ').trim()}).join('|')}})()"
async def main():
    out = []; errs = []
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox"])
        c = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await c.add_init_script(SEED)
        for app, txt, own in APPS:
            p = await c.new_page(); p.on("pageerror", lambda x, a=app: errs.append(a + " " + str(x)[:200])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
            await p.goto(B + app + "/"); await p.wait_for_timeout(5000); e = await p.evaluate(ETAT)
            vis = await p.evaluate("(function(){var b=document.querySelector('.epst-nav [data-t=suivi]');return !!b&&getComputedStyle(b).display!=='none'})()"); on0 = e["on"]
            if not own:
                out.append((app + " : pas d'onglet « Suivi » (pas d'écran de suivi propre), le pilotage reste une action de Séquence", not vis and "Pilotage de leçon" in await p.evaluate("EPSLC.actions().map(function(a){return a.label}).join('|')"), vis)); await p.close(); continue
            out.append((app + " : onglet « Suivi » juste après Séquence", vis and e["tabs"][:2] == ["seq", "suivi"], e["tabs"]))
            await p.click(".epst-nav [data-t='suivi']"); await p.wait_for_timeout(2600); e = await p.evaluate(ETAT)
            out.append((app + " : il ouvre " + ("l'écran de suivi de l'appli" if own else "le pilotage commun") + " et reste l'onglet actif", e["on"] == "suivi" and txt in e["txt"] and e["pil"] == (not own), (e["on"], e["pil"], e["txt"][:120])))
            if SHOTS and app in ("volley", "basket", "danse"): await p.screenshot(path=os.path.join(SHOTS, "suivi-" + app + ".png"))
            await p.click(".epst-nav [data-t='seq']"); await p.wait_for_timeout(2600); e = await p.evaluate(ETAT)
            out.append((app + " : retour à Séquence (onglet actif, plus d'action de suivi en double)", e["on"] in ("seq", on0) and e["on"] != "suivi" and not any(k in e["acts"] for k in ("Pilotage de leçon", "Leçon en direct", "Groupes en direct", "Suivi des grimpes", "Tableau de bord")), (e["on"], e["acts"][:200])))
            await p.close()
        await b.close()
    print("\n".join(("✅ " if o[1] else "❌ ") + o[0] + ("" if o[1] else "  → " + str(o[2])) for o in out)); print("erreurs de page :", errs or "aucune")
    return all(o[1] for o in out) and not errs
try: ok = asyncio.run(main())
finally: srv.terminate()
sys.exit(0 if ok else 1)
