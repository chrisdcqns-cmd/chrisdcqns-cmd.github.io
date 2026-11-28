# Évaluation commune (modèle Escalade) : plusieurs évaluations par classe (« ＋ Nouvelle évaluation » repart de zéro, l'ancienne est gardée),
#   bloc « 📊 Ses résultats » (grimpes), auto-positionnement et proposition visibles sur chaque critère.
# python3 t_eval_sessions.py <racine du dépôt>      (classe fictive, rien n'est envoyé en ligne)
import asyncio, sys, subprocess, time, json, urllib.parse
from playwright.async_api import async_playwright
ROOT = sys.argv[1]
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8879", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8879/eps-autonomie-numerique/"
INIT = "try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.console.trust','1');if(!localStorage.getItem('eps.share.v1'))localStorage.setItem('eps.share.v1',JSON.stringify({url:'https://script.google.com/macros/s/TEST/exec',key:'k'}));}catch(e){}"
FICHE = "(function(){var f=document.querySelector('.epse-fiche');return f?f.innerText:''})()"
async def main():
    out = []; errs = []
    def ok(t, c, d=""): out.append(bool(c)); print(("✅ " if c else "❌ ") + t + ("" if c else "  → " + str(d)[:600]), flush=True)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        c = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await c.add_init_script(INIT)
        async def route(r):
            q = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(r.request.url).query))
            await r.fulfill(status=200, content_type="application/javascript", body=q.get("callback", "x") + "(" + json.dumps({"keyOk": True}) + ")")
        await c.route("https://script.google.com/**", route)
        p = await c.new_page(); p.on("dialog", lambda d: asyncio.ensure_future(d.accept())); p.on("pageerror", lambda x: errs.append(str(x)[:240])); p.set_default_timeout(9000)
        await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("(async()=>{var x=EPSD.demo.create();if(x&&x.then)await x})()"); await p.wait_for_timeout(1800)
        await p.goto(B + "escalade/"); await p.wait_for_timeout(4200)
        await p.evaluate("EPSTESC.go('eval')"); await p.wait_for_timeout(1500)
        nom = await p.evaluate("(function(){var b=document.querySelector('.epse-li.on span');return b?b.firstChild.textContent:''})()")
        cl = await p.evaluate("(function(){var s=document.querySelector('[data-cls]');return s?s.value:''})()")
        ok("fiche ouverte (" + nom + ", " + cl + ")", nom and cl, [nom, cl])
        # ---- grimpes de l'élève : bloc résultats + proposition
        pre = nom.split(" ")[0]
        await p.evaluate("""([cl,pre])=>{[['5b',9,9,8,14],['5c',9,7,10,15],['4c',9,9,9,12]].forEach(function(x,i){R.push({id:'t'+i,ts:'2026-11-2'+i+' 10:0'+i,cl:cl,el:pre,vo:i+1,c:'bleu',d:x[0],h:x[1],ann:x[2],m:x[3],p:x[4]})});EPSTESC.go('eval')}""", [cl, pre]); await p.wait_for_timeout(1200)
        t = await p.evaluate(FICHE)
        ok("bloc « Ses résultats » avec les grimpes", "Ses résultats" in t and "grimpées" in t and "meilleure voie réussie" in t and "5c" in t, t[:400])
        ok("détail des grimpes", "Voir ses grimpes (3)" in t, t[:500])
        pr = await p.evaluate("EVESC && document.querySelectorAll('.epse-fiche [data-recap]').length")
        ok("auto-positionnement / proposition rappelés sur les critères (" + str(pr) + ")", pr and pr >= 1, pr)
        ok("bloc élève conservé : phrase, Dicter / Reformuler", "Proposer une phrase pour l'élève" in t, t[-400:])
        await p.screenshot(path="/tmp/t/eval-fiche.png", full_page=False)
        # ---- nouvelle évaluation : repart de zéro, l'ancienne est gardée
        await p.evaluate("(function(){var b=document.querySelector('.epse-fiche [data-d=\"3\"]');if(!b.classList.contains('on'))b.click()})()"); await p.wait_for_timeout(500)
        await p.evaluate("(function(){var t=document.querySelector('.epse-fiche [data-comm]');t.value='Commentaire du lundi';t.oninput()})()")
        n0 = await p.evaluate("document.querySelectorAll('.epse-fiche .epse-deg.on').length")
        ok("avant : des degrés sont posés (" + str(n0) + ")", n0 >= 1, n0)
        ok("bouton « ＋ Nouvelle évaluation » et liste « Évaluation »", await p.evaluate("!!document.querySelector('[data-sesnew]')&&!!document.querySelector('[data-ses]')"))
        await p.click("[data-sesnew]"); await p.wait_for_timeout(400)
        await p.fill("#epse-sesd [data-n]", "Évaluation de jeudi"); await p.click("#epse-sesd [data-ok]"); await p.wait_for_timeout(900)
        n1 = await p.evaluate("document.querySelectorAll('.epse-fiche .epse-deg.on').length"); cm = await p.evaluate("document.querySelector('.epse-fiche [data-comm]').value")
        ok("après : fiche remise à zéro", n1 == 0 and cm == "", [n1, cm])
        li = await p.evaluate("document.querySelectorAll('.epse-li.ok,.epse-li.st').length")
        ok("après : toute la classe est « à évaluer »", li == 0, li)
        op = await p.evaluate("[].map.call(document.querySelectorAll('[data-ses] option'),function(o){return o.textContent})")
        ok("liste : la nouvelle (en cours) et l'ancienne", len(op) == 2 and "Évaluation de jeudi" in op[0] and "en cours" in op[0], op)
        raw = await p.evaluate("(function(){var I=JSON.parse(localStorage.getItem('eps.eval.esc.v1')||localStorage.getItem('eps.eval.escalade.v1')).items,a=0,b=0;Object.keys(I).forEach(function(k){var r=I[k];if(r.arch){a++;if(r.c||r.ev)b++}});return [a,b]})()")
        ok("anciennes fiches rangées sans être comptées deux fois (" + str(raw[0]) + ")", raw[0] >= 1 and raw[1] == 0, raw)
        # ---- rouvrir l'ancienne
        await p.select_option("[data-ses]", index=1); await p.wait_for_timeout(700)
        n2 = await p.evaluate("document.querySelectorAll('.epse-fiche .epse-deg.on').length"); cm2 = await p.evaluate("document.querySelector('.epse-fiche [data-comm]').value")
        ok("ancienne évaluation rouverte : degrés et commentaire retrouvés", n2 == n0 and cm2 == "Commentaire du lundi", [n2, n0, cm2])
        ok("bandeau « Ancienne évaluation ouverte »", "Ancienne évaluation ouverte" in await p.evaluate("document.body.innerText"))
        await p.click("[data-sescur]"); await p.wait_for_timeout(600)
        n3 = await p.evaluate("document.querySelectorAll('.epse-fiche .epse-deg.on').length")
        ok("retour à l'évaluation en cours (vide)", n3 == 0, n3)
        # ---- une autre appli du modèle commun
        await p.goto(B + "basket/"); await p.wait_for_timeout(4200); await p.evaluate("EPSTBK.go('eval')"); await p.wait_for_timeout(1500)
        tb = await p.evaluate(FICHE)
        ok("Basket : même fiche (résultats, nouvelle évaluation)", "Ses résultats" in tb and await p.evaluate("!!document.querySelector('[data-sesnew]')"), tb[:300])
        ok("aucune erreur de page", not errs, errs)
        await b.close()
    srv.terminate(); print(str(sum(out)) + " / " + str(len(out))); sys.exit(0 if all(out) else 1)
asyncio.run(main())
