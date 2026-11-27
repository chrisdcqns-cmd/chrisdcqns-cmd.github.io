# 📲 Auto-positionnement sans QR (Volley, classe fictive, faux script) : action de l'onglet Évaluation, proposé dans l'espace EPS
# (tâche « 🎯 M'auto-positionner » qui ouvre la grille personnelle), signal aux tablettes de la leçon, liens personnels, retrait.
# python3 t_autopos.py <racine du dépôt> [dossier des captures]
import asyncio, sys, subprocess, time, json, os, urllib.parse
from playwright.async_api import async_playwright
ROOT = sys.argv[1]; SHOTS = sys.argv[2] if len(sys.argv) > 2 else ""
# appli testée : APP=volley (écran propre, #eleve=) par défaut ; APP=escalade (instance commune, #auto=), APP=danse
DIR = os.environ.get("APP", "volley"); CODE = {"volley": "vol", "escalade": "esc", "danse": "dan"}[DIR]; NOM = {"volley": "Volley-ball", "escalade": "Escalade", "danse": "Danse"}[DIR]; HASH = "#eleve=" if DIR in ("volley", "danse") else "#auto="
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8851", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
gs = subprocess.Popen([sys.executable, "-I", "mockgs.py"], cwd=os.path.dirname(os.path.abspath(__file__))); time.sleep(1.5)
B = "http://localhost:8851/eps-autonomie-numerique/"; G = "http://127.0.0.1:8899/exec"
SHARE = "localStorage.setItem('eps.share.v1',JSON.stringify({url:'" + G + "',key:'CLE'}));"
async def main():
    out = []; errs = []
    async def shot(p, n):
        if SHOTS: await p.screenshot(path=os.path.join(SHOTS, n + ".png"))
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox"])
        cp = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await cp.add_init_script("try{" + SHARE + "localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3))}catch(e){}")
        p = await cp.new_page(); p.on("pageerror", lambda x: errs.append("prof " + str(x)[:200])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("(async()=>{var x=EPSD.demo.create();if(x&&x.then)await x})()"); await p.wait_for_timeout(1200)
        await p.goto(B + DIR + "/"); await p.wait_for_timeout(4500)
        acts = await p.evaluate("EPSLC.evalActions().map(function(a){return a.label})")
        out.append(("1 action « Auto-positionnement » dans l'onglet Évaluation", "Auto-positionnement" in acts, acts))
        await p.evaluate("EPSLC.evalActions().filter(function(a){return a.label==='Auto-positionnement'})[0].go()"); await p.wait_for_timeout(500)
        out.append(("1b fenêtre ouverte", await p.locator("#co-ap").count() == 1, None))
        demo = p.locator("#co-ap [data-apcl]", has_text="DÉMO")
        if await demo.count(): await demo.first.click(); await p.wait_for_timeout(300)
        cls = await p.evaluate("(function(){var X=EPSE.apAdapt('" + CODE + "');return (X.classes().filter(function(c){return /D.MO/i.test(c.nom)})[0]||{}).nom})()")
        if await p.locator("#co-ap [data-apopen]").count(): await p.click("#co-ap [data-apopen]"); await p.wait_for_timeout(300)
        out.append(("1c ouvert (14 jours)", "Ouvert jusqu" in await p.inner_text("#co-ap"), None)); await shot(p, "ap-1-fenetre")
        # ---------- 2. liens personnels ----------
        await p.click("#co-ap [data-aplien]"); await p.wait_for_timeout(2500)
        L = await p.evaluate("(document.querySelector('#co-ap textarea')||{}).value||''")
        out.append(("2 liens personnels : un par élève, lien personnel de la grille", L.count(DIR + "/" + HASH) >= 3, L[:160]))
        # ---------- 3. dans l'espace EPS ----------
        await p.click("#co-ap [data-apesp]")
        for i in range(30):
            await p.wait_for_timeout(1000); st = await p.inner_text("#co-ap [role=status]")
            if "✓" in st or "impossible" in st or "pas pu" in st: break
        out.append(("3 proposé dans l'espace EPS (envoi vérifié)", "✓ Proposé" in st, st)); await shot(p, "ap-2-propose")
        cd = await p.evaluate("(function(){var I=JSON.parse(localStorage['eps.codes.v1']).items;for(var k in I){if(/D.MO/i.test(I[k].cls))return [I[k].c,I[k].n]}})()")
        ce = await b.new_context(service_workers="block", viewport={"width": 390, "height": 844}); e = await ce.new_page(); e.on("pageerror", lambda x: errs.append("eleve " + str(x)[:200]))
        await e.goto(B + "mon-bilan/#u=" + urllib.parse.quote(G, safe="")); await e.wait_for_timeout(800)
        await e.fill("#code", cd[0]); await e.click("#go"); await e.wait_for_timeout(4000)
        t = await e.inner_text("#res")
        out.append(("3b l'élève voit « M'auto-positionner en " + NOM + " » dans À faire", "auto-positionner en " + NOM + "" in t, t[:200])); await shot(e, "ap-3-espace-eleve")
        url = ""
        try:
            async with e.expect_popup() as pi: await e.click("[data-au='0']")
            pop = await pi.value; await pop.wait_for_load_state(); url = pop.url; await pop.wait_for_timeout(3500)
            g = await pop.evaluate("document.body.innerText"); await shot(pop, "ap-4-grille")
            out.append(("3c un appui ouvre SA grille, sans QR ni choix du nom", HASH in url and cd[1].split()[0] in g and "incomplet" not in g and "pas ouvert" not in g, g[:200]))
        except Exception as x: out.append(("3c ouverture de la grille", False, str(x)[:200]))
        out.append(("3d tâche marquée faite", "rouvrir ma grille" in await e.inner_text("#res"), None))
        # ---------- 4. signal aux tablettes de la leçon ----------
        ct = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768})
        await ct.add_init_script("try{" + SHARE + "localStorage.setItem('eps.gate.last." + DIR + "',JSON.stringify({id:'x',day:(function(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})(),nom:" + json.dumps(cls or "") + "}))}catch(e){}")
        tb = await ct.new_page(); tb.on("pageerror", lambda x: errs.append("tablette " + str(x)[:200]))
        await tb.goto(B + DIR + "/"); await tb.wait_for_timeout(3000)
        await p.click("#co-ap [data-apsig]"); await p.wait_for_timeout(1500)
        ok = False
        for i in range(15):
            try: await tb.evaluate("EPSD.syncOne('eps.sig.v1')")
            except Exception: pass
            await tb.wait_for_timeout(1500)
            if await tb.locator("#eps-sig [data-ap]").count(): ok = True; break
        st = await tb.evaluate("(document.querySelector('#eps-sig')||{}).innerText||''")
        out.append(("4 tablette : « vous vous auto-positionniez » + bouton", ok and "vous vous auto-positionniez" in st, st[:120])); await shot(tb, "ap-5-tablette")
        if ok:
            await tb.click("#eps-sig [data-ap]"); g2 = ""
            for i in range(8):
                await tb.wait_for_timeout(1000)
                g2 = await tb.evaluate("location.hash+' '+document.body.innerText.slice(0,300)")
                if "#eleve" in g2 or "Je me positionne" in g2: break
            out.append(("4b le bouton ouvre la grille sur la tablette", "#eleve" in g2 or "Je me positionne" in g2, g2[:200])); await shot(tb, "ap-6-grille-tablette")
        # ---------- 5. retrait ----------
        await p.click("#co-ap [data-apespx]")
        for i in range(10):
            await p.wait_for_timeout(800); st = await p.inner_text("#co-ap [role=status]")
            if "Retiré" in st: break
        out.append(("5 retiré de l'espace", "✓ Retiré" in st, st))
        await e.click("#out"); await e.fill("#code", cd[0]); await e.click("#go"); await e.wait_for_timeout(3500)
        out.append(("5b l'élève ne voit plus la tâche", "auto-positionner en " + NOM + "" not in await e.inner_text("#res"), None))
        await b.close()
    srv.terminate(); gs.terminate()
    bad = 0
    for n, okk, d in out:
        print(("✅ " if okk else "❌ ") + n + ("" if okk else "  → " + str(d)))
        bad += 0 if okk else 1
    print("Erreurs de page :", errs or "aucune"); sys.exit(1 if bad or errs else 0)
asyncio.run(main())
