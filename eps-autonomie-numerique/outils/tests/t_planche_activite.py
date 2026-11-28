# 📋 Planche tactique : chaque activité retrouve ses caractéristiques (formes de jeu, mots, mise en place) quand on change d'activité.
# python3 t_planche_activite.py <racine du dépôt>
import asyncio, sys, subprocess, time
from playwright.async_api import async_playwright
ROOT = sys.argv[1]
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8903", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
U = "http://localhost:8903/eps-autonomie-numerique/tactique/"
async def main():
    out = []; errs = []; dial = []
    def ok(t, c, d=""): out.append(bool(c)); print(("✅ " if c else "❌ ") + t + ("" if c else "  → " + str(d)[:500]), flush=True)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        c = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768})
        p = await c.new_page(); p.on("pageerror", lambda x: errs.append(str(x)[:240]))
        async def dlg(d): dial.append(d.message[:60]); await d.accept()
        p.on("dialog", lambda d: asyncio.ensure_future(dlg(d)))
        ETAT = "(function(){var P=document.querySelectorAll('#board svg circle[fill=\"#1F4FA3\"]').length,Q=document.querySelectorAll('#board svg circle[fill=\"#D9481F\"]').length;return {a:P,b:Q,formes:[].map.call(document.querySelectorAll('#car [data-fo]'),function(x){return x.textContent}),mots:[].map.call(document.querySelectorAll('#car [data-mo]'),function(x){return x.textContent}),outils:[].map.call(document.querySelectorAll('#tools .tl'),function(x){return x.textContent.trim()}),txt:[].map.call(document.querySelectorAll('#board svg text'),function(x){return x.textContent})}})()"
        await p.goto(U + "?sport=volley"); await p.wait_for_timeout(2500)
        e = await p.evaluate(ETAT)
        ok("volley : 4 contre 4 proposé, jamais 6 contre 6 " + str([e["a"], e["b"]]), e["a"] == 4 and e["b"] == 4 and e["formes"] == ["4 contre 4", "3 contre 3", "2 contre 2"], e)
        ok("volley : ses mots (service, réception, passe, attaque…)", "Service" in e["mots"] and "Contre" in e["mots"], e["mots"])
        await p.evaluate("document.querySelectorAll('#car [data-fo]')[1].click()"); await p.wait_for_timeout(400); e = await p.evaluate(ETAT)
        ok("volley : 3 contre 3 d'un appui, sans question (dessin non modifié)", e["a"] == 3 and e["b"] == 3 and not dial, [e["a"], e["b"], dial])
        await p.select_option("#sport", "badminton"); await p.wait_for_timeout(500); e = await p.evaluate(ETAT)
        ok("badminton : 1 contre 1 (plus les joueurs du volley), simple ou double", e["a"] == 1 and e["b"] == 1 and e["formes"] == ["Simple", "Double"] and not dial, [e["a"], e["b"], e["formes"], dial])
        ok("badminton : volant, frappe, noms des frappes", any("Volant" in x for x in e["outils"]) and any("Frappe" in x for x in e["outils"]) and "Amorti" in e["mots"] and "Dégagé" in e["mots"] and "Smash" in e["mots"], [e["outils"], e["mots"]])
        await p.evaluate("[].filter.call(document.querySelectorAll('#car [data-mo]'),function(x){return x.textContent==='Amorti'})[0].click()"); await p.wait_for_timeout(300)
        bx = await p.evaluate("(function(){var r=document.querySelector('#board svg').getBoundingClientRect();return [r.left+r.width*.6,r.top+r.height*.3]})()")
        await p.mouse.click(bx[0], bx[1]); await p.wait_for_timeout(500); e = await p.evaluate(ETAT)
        ok("badminton : un mot touché puis posé sur la planche", "Amorti" in e["txt"], e["txt"])
        await p.screenshot(path="/tmp/t/planche-badminton.png")
        await p.select_option("#sport", "basket"); await p.wait_for_timeout(600); e = await p.evaluate(ETAT)
        ok("basket : dessin modifié → accord demandé, puis 4 contre 4 ou 3 contre 3", len(dial) == 1 and e["a"] == 4 and e["formes"] == ["4 contre 4", "3 contre 3"] and "Dribble" in e["mots"] and "Écran" in e["mots"], [dial, e["a"], e["formes"], e["mots"]])
        await p.select_option("#sport", "foot"); await p.wait_for_timeout(500); e = await p.evaluate(ETAT)
        ok("football : course, passe, tir, centre", all(m in e["mots"] for m in ["Course", "Passe", "Tir", "Centre"]) and e["a"] == 5, e)
        await p.screenshot(path="/tmp/t/planche-foot.png")
        await p.select_option("#sport", "ultimate"); await p.wait_for_timeout(500); e = await p.evaluate(ETAT)
        ok("ultimate : disque", any("Disque" in x for x in e["outils"]), e["outils"])
        ok("aucune erreur de page", not errs, errs)
        await b.close()
    srv.terminate(); print(str(sum(out)) + " / " + str(len(out))); sys.exit(0 if all(out) else 1)
asyncio.run(main())
