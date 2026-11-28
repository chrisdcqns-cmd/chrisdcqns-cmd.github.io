# 📖 Culture de l'activité : petite icône du bandeau (jamais dans la leçon), ressource de « Choisis ta classe », icône de l'espace EPS de l'élève.
# python3 t_culture.py <racine du dépôt>      (classe fictive, rien n'est envoyé en ligne)
import asyncio, sys, subprocess, time, json, urllib.parse
from playwright.async_api import async_playwright
ROOT = sys.argv[1]
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8891", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8891/eps-autonomie-numerique/"
APPS = ["escalade", "relais", "volley", "badminton", "danse", "acrosport", "orientation", "crosstraining", "basket", "step"]
async def main():
    out = []; errs = []
    def ok(t, c, d=""): out.append(bool(c)); print(("✅ " if c else "❌ ") + t + ("" if c else "  → " + str(d)[:500]), flush=True)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        c = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768})
        async def route(r):
            q = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(r.request.url).query)); await r.fulfill(status=200, content_type="application/javascript", body=q.get("callback", "x") + "(" + json.dumps({"keyOk": True}) + ")")
        await c.route("https://script.google.com/**", route)
        p = await c.new_page(); p.on("pageerror", lambda x: errs.append(str(x)[:240])); p.set_default_timeout(9000)
        for app in APPS:   # mode élève : ressource de « Choisis ta classe », et texte de l'activité
            await p.goto(B + app + "/"); await p.wait_for_timeout(3800)
            r = await p.evaluate("(function(){var d=window.EPSCULT&&EPSCULT.data[location.pathname.split('/').filter(Boolean).pop()];return {data:!!d&&d.l.length>=5,api:!!window.EPSD_CULT,html:window.EPSD_CULT?EPSD_CULT.html().length:0,res:/Culture et lexique/.test(document.body.innerText),plein:!!document.getElementById('eps-cult')}})()")
            ok(app + " : repères de culture présents, rien d'ouvert d'office", r["data"] and r["api"] and r["html"] > 600 and not r["plein"], r)
        # la fenêtre, depuis la petite icône du bandeau (mode enseignant : le bandeau commun est à l'écran)
        await c.add_init_script("try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.console.trust','1');}catch(e){}")
        await p.goto(B + "escalade/"); await p.wait_for_timeout(4500)
        ic = await p.evaluate("(function(){var b=document.querySelector('.eps-cultb');if(!b)return null;var r=b.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height),t:b.textContent}})()")
        ok("petite icône 📖 dans le bandeau (" + str(ic) + ")", ic and ic["t"] == "📖" and ic["w"] <= 60 and ic["h"] <= 60, ic)
        await p.evaluate("document.querySelector('.eps-cultb').click()"); await p.wait_for_timeout(600)
        t = await p.evaluate("(function(){var w=document.getElementById('eps-cult');return w?w.innerText:''})()")
        ok("fenêtre : culture puis lexique de l'escalade", "D'où ça vient" in t and "Les mots de l'activité" in t and "Assurer" in t, t[:300])
        await p.screenshot(path="/tmp/t/culture-fenetre.png")
        await p.evaluate("document.querySelector('#eps-cult [data-x2]').click()"); await p.wait_for_timeout(300)
        ok("fenêtre refermée", not await p.evaluate("!!document.getElementById('eps-cult')"))
        await p.screenshot(path="/tmp/t/culture-icone.png", clip={"x": 0, "y": 0, "width": 1024, "height": 110})
        # espace EPS de l'élève (simulation) : icône puis repères
        await p.goto(B + "mon-bilan/?demo=1"); await p.wait_for_timeout(2500)
        ok("espace EPS : icône 📖 dans le bandeau", await p.evaluate("(function(){var b=document.getElementById('cult');return !!b&&!b.hidden})()"))
        await p.evaluate("document.getElementById('cult').click()"); await p.wait_for_timeout(500)
        t2 = await p.evaluate("document.getElementById('res').innerText")
        ok("espace EPS : culture des activités, celles de l'élève d'abord", "Culture des activités" in t2 and "une de mes activités" in t2 and "D'où ça vient" in t2, t2[:300])
        await p.screenshot(path="/tmp/t/culture-espace.png")
        await p.evaluate("document.getElementById('cb').click()"); await p.wait_for_timeout(300)
        ok("espace EPS : retour aux onglets", await p.evaluate("!!document.querySelector('#res .tabs')"))
        ok("aucune erreur de page", not errs, errs)
        await b.close()
    srv.terminate(); print(str(sum(out)) + " / " + str(len(out))); sys.exit(0 if all(out) else 1)
asyncio.run(main())
