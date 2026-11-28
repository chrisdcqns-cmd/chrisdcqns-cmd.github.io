# 🏠 Accueil de l'élève en trois tuiles (ma leçon, mon activité, mon bilan), le même dans toutes les activités ; 🎭 rôles tenus et 🎯 travail en autonomie
#   rappelés sur la fiche d'évaluation.   python3 t_accueil_eleve.py <racine du dépôt>      (classe fictive, rien n'est envoyé en ligne)
import asyncio, sys, subprocess, time, json, urllib.parse
from playwright.async_api import async_playwright
ROOT = sys.argv[1]
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8893", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8893/eps-autonomie-numerique/"
APPS = ["escalade", "volley", "badminton", "danse", "crosstraining", "basket", "step"]
async def main():
    out = []; errs = []
    def ok(t, c, d=""): out.append(bool(c)); print(("✅ " if c else "❌ ") + t + ("" if c else "  → " + str(d)[:500]), flush=True)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        c = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768})
        async def route(r):
            q = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(r.request.url).query)); await r.fulfill(status=200, content_type="application/javascript", body=q.get("callback", "x") + "(" + json.dumps({"keyOk": True}) + ")")
        await c.route("https://script.google.com/**", route)
        p = await c.new_page(); p.on("pageerror", lambda x: errs.append(str(x)[:240])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept())); p.set_default_timeout(9000)
        # classe fictive créée en mode enseignant, puis tablette d'élèves en simulation (la classe fictive n'est montrée aux élèves que là)
        await p.goto(B); await p.wait_for_timeout(2000)
        await p.evaluate("(async()=>{localStorage.setItem('eps.teach.until',String(Date.now()+3600e3));location.reload()})()"); await p.wait_for_timeout(2500)
        await p.evaluate("(async()=>{var x=EPSD.demo.create();if(x&&x.then)await x})()"); await p.wait_for_timeout(1800)
        await p.evaluate("localStorage.removeItem('eps.teach.until')")
        for app in APPS:
            await p.goto(B + app + "/?vue=eleve&reel=1"); await p.wait_for_timeout(4200)
            n0 = await p.evaluate("document.querySelectorAll('.epsg [data-eps-accueil]').length")
            cid = await p.evaluate("(function(){var b=[].filter.call(document.querySelectorAll('.epsg .epsg-c[data-c]'),function(x){return /DÉMO/.test(x.textContent)})[0];if(!b)return null;b.click();return b.dataset.c})()"); await p.wait_for_timeout(1500)
            if cid is None: ok(app + " : classe fictive proposée", False, "absente"); continue
            await p.evaluate("EPSG_REFRESH()"); await p.wait_for_timeout(800)
            r = await p.evaluate("(function(){var a=document.querySelector('.epsg [data-eps-accueil]');if(!a)return null;var B=a.querySelectorAll('button');return {n:B.length,t:[].map.call(B,function(x){return x.querySelector('b').textContent}),h:Math.min.apply(null,[].map.call(B,function(x){return Math.round(x.getBoundingClientRect().height)}))}})()")
            ok(app + " : accueil élève en trois tuiles (aucune au premier passage : " + str(n0) + ")", n0 == 0 and r and r["n"] == 3 and "Ma leçon" in r["t"][0] and "Continuer" in r["t"][1] and "Mon bilan" in r["t"][2] and r["h"] >= 60, r)
            if app == "escalade": await p.screenshot(path="/tmp/t/accueil-eleve.png")
        ok("aucune erreur de page", not errs, errs)
        await b.close()
    srv.terminate(); print(str(sum(out)) + " / " + str(len(out))); sys.exit(0 if all(out) else 1)
asyncio.run(main())
