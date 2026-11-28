# Escalade (demandes du 28/11/2026) : pendant une leçon avec des situations, « Renseigner une grimpe » devient « Renseigner ma réussite sur la situation » ;
#   chaque situation a sa ligne mur / difficulté / dégaine ; les élèves gardent leur groupe constitué (fiche de leçon commune, toutes les applis).
# python3 t_groupe_situation.py <racine du dépôt>      (vue élève, classe fictive : rien n'est envoyé en ligne)
import asyncio, sys, subprocess, time, json
from playwright.async_api import async_playwright
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8881", "--bind", "127.0.0.1", "--directory", sys.argv[1]], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:8881/eps-autonomie-numerique/"
CODE=[]
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"]); c=await b.new_context(service_workers="block",viewport={"width":1024,"height":768})
        p=await c.new_page(); errs=[]; p.on("pageerror",lambda x:errs.append(str(x)[:200])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(B+"escalade/?vue=eleve"); await p.wait_for_timeout(9000)
        OUT=[]
        def ok(t,c,d=""): OUT.append(bool(c)); print(("✅ " if c else "❌ ")+t+("" if c else "  → "+str(d)[:300]))
        f0 = (await p.evaluate("(function(){var o=document.getElementById('lc-st');return o?{xf:o.querySelectorAll('[data-xf]').length,who:[].map.call(o.querySelectorAll('.lc-who button[aria-pressed=true]'),function(b){return b.textContent})}:null})()"))
        ok("fiche de leçon : ligne mur / difficulté / dégaine dans chaque situation", f0 and f0["xf"] >= 3 and f0["xf"] % 3 == 0, f0)
        # toucher un nom : tout son groupe du jour ; puis renseigner le mur
        await p.evaluate("document.querySelector('#lc-st .lc-who button').click()"); await p.wait_for_timeout(400)
        await p.evaluate("(function(){var s=document.querySelectorAll('#lc-st [data-xf]');s[0].value='Corde 2';s[0].dispatchEvent(new Event('change'));s[2].value='Top';s[2].dispatchEvent(new Event('change'))})()"); await p.wait_for_timeout(400)
        x = (await p.evaluate("(function(){var V=JSON.parse(localStorage.getItem('eps.lecres.escalade.v1')||'{}').items||{};return Object.keys(V).filter(function(k){return V[k].x}).map(function(k){return JSON.stringify(V[k].x)}).slice(0,3)})()"))
        ok("mur et dégaine enregistrés avec le résultat de l'élève", x and "Corde 2" in x[0] and "Top" in x[0], x)
        await p.evaluate("(function(){var x=document.querySelector('#lc-st [data-x]');if(x)x.click()})()"); await p.wait_for_timeout(800)
        await p.evaluate("(function(){var n=0;[].forEach.call(document.querySelectorAll('.chip,[onclick^=\"tgG\"]'),function(c){if(n<3&&/Démo/.test(c.textContent)){c.click();n++}})})()"); await p.wait_for_timeout(500)
        await p.evaluate("okG()"); await p.wait_for_timeout(1200)
        ac = ((await p.evaluate("[].map.call(document.querySelectorAll('.tile b'),function(b){return b.textContent}).join(' | ')")))
        ok("leçon du jour avec situations : la tuile devient « Renseigner ma réussite sur la situation »", "Renseigner ma réussite sur la situation" in ac and "Renseigner une grimpe" not in ac, ac)
        await p.evaluate("sitReussite()"); await p.wait_for_timeout(1200)
        g = (await p.evaluate("(function(){var o=document.getElementById('lc-st');return o&&o.style.display!=='none'?[].map.call(o.querySelectorAll('.lc-who button[aria-pressed=true]'),function(b){return b.textContent}):'pas de fiche'})()"))
        ok("la fiche s'ouvre depuis la tuile avec le groupe constitué déjà choisi (" + str(len(g)) + " élèves)", isinstance(g, list) and len(g) == 3, g)
        ok("aucune erreur de page", not errs, errs)
        print(("✅ " if all(OUT) else "❌ ") + str(sum(OUT)) + " / " + str(len(OUT))); CODE.append(0 if all(OUT) else 1)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
sys.exit(CODE[0] if CODE else 1)
