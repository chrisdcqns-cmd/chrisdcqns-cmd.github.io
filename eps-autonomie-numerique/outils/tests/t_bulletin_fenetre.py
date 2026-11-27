# 📝 Appréciations de bulletin dans une FENÊTRE, pas un pop-up (demande de l'enseignant, 27/11/2026 :
#   « je risque de cliquer à côté et ça ne va pas se sauvegarder »).
#   Vérifie dans plusieurs applis : fenêtre plein écran rangée sous le bandeau, appuis « à côté » sans effet, saisie enregistrée
#   à chaque frappe, génération qui continue et s'enregistre même fenêtre fermée, même fenêtre retrouvée à la réouverture ;
#   et dans 🏫 Ma classe → 📝 Bilans & avis : génération enregistrée même si l'on change d'onglet pendant qu'elle tourne.
#   Appréciation générale avec le prénom et les accords (demande du 27/11/2026) : prénom jamais envoyé ([Prénom] remplacé sur la tablette),
#   « fille » / « garçon » deviné d'après le prénom et corrigé d'un appui (👧 / 👦, gardé), aucune activité ni nombre de critères envoyés.
# python3 t_bulletin_fenetre.py <racine du dépôt>      (classe fictive, Claude simulé : rien n'est envoyé en ligne)
import asyncio, sys, subprocess, time, json, urllib.parse
from playwright.async_api import async_playwright
ROOT = sys.argv[1]
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8874", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8874/eps-autonomie-numerique/"
URL = "https://script.google.com/macros/s/TEST/exec"
INIT = "try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.console.trust','1');if(!localStorage.getItem('eps.share.v1'))localStorage.setItem('eps.share.v1',JSON.stringify({url:%s,key:'k'}));}catch(e){}" % json.dumps(URL)
INST = {"volley": "EPSTV", "danse": "EPSTD", "escalade": "EPSTESC", "basket": "EPSTBK"}
WIN = "(function(){var w=document.getElementById('epsbu-w');if(!w)return null;var r=w.getBoundingClientRect(),cs=getComputedStyle(w);return {shown:cs.display!=='none'&&r.height>40,dock:w.classList.contains('epst-dock'),top:Math.round(r.top),full:r.width>=innerWidth*0.9,pop:!!document.querySelector('.epsd-ov #epsbu'),mark:w.dataset.t||''}})()"
BU = "JSON.parse(localStorage.getItem('eps.bulletin.v1')||'{}')"
CAP = []
async def main():
    out = []; errs = []
    def ok(t, c, d=""): out.append(bool(c)); print(("✅ " if c else "❌ ") + t + ("" if c else "  → " + str(d)[:400]), flush=True)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        c = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768}); await c.add_init_script(INIT)
        async def route(r):
            q = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(r.request.url).query))
            if "ai" in q: CAP.append(q); await asyncio.sleep(0.7)
            body = {"keyOk": True, "ai": "Très bon trimestre, [Prénom] a su s'investir pour réaliser des progrès. Les résultats et l'attitude sont remarquables.", "aiv": 5} if "ai" in q else {"keyOk": True}
            await r.fulfill(status=200, content_type="application/javascript", body=q.get("callback", "x") + "(" + json.dumps(body) + ")")
        await c.route("https://script.google.com/**", route)
        p = await c.new_page(); p.on("dialog", lambda d: asyncio.ensure_future(d.accept())); p.on("pageerror", lambda x: errs.append(str(x)[:240])); p.set_default_timeout(9000)
        await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("(async()=>{var x=EPSD.demo.create();if(x&&x.then)await x})()"); await p.wait_for_timeout(1800)
        for app in ["volley", "danse", "escalade", "basket"]:
            await p.goto(B + app + "/"); await p.wait_for_timeout(4200)
            await p.evaluate(INST[app] + ".go('eval')"); await p.wait_for_timeout(500); await p.evaluate(INST[app] + ".evGo('fin')"); await p.wait_for_timeout(1500)
            if app == "danse": await p.evaluate("(function(){var x=[].filter.call(document.querySelectorAll('*'),function(e){return e.children.length===0&&/D.MO \\(fictive\\)/.test(e.textContent)&&e.offsetParent})[0];if(x)x.click()})()"); await p.wait_for_timeout(1200)
            clicked = await p.evaluate("(function(){var b=[].filter.call(document.querySelectorAll('button'),function(b){return b.offsetParent&&/Appréciations de bulletin/.test(b.innerText)})[0];if(b)b.click();return !!b})()")
            await p.wait_for_timeout(1200); w = await p.evaluate(WIN)
            ok(app + " : fenêtre plein écran rangée sous le bandeau, pas de pop-up", clicked and w and w["shown"] and w["full"] and w["dock"] and w["top"] > 20 and not w["pop"], (clicked, w))
            for xy in [(6, 760), (1018, 400), (512, 740), (6, w["top"] + 30 if w else 300)]:
                await p.mouse.click(xy[0], xy[1]); await p.wait_for_timeout(150)
            ok(app + " : appuis à côté sans effet", (await p.evaluate(WIN) or {}).get("shown"), await p.evaluate(WIN))
            await p.evaluate("document.getElementById('epsbu-w').dataset.t='meme'")
            n = await p.evaluate("document.querySelectorAll('#epsbu-w [data-t]').length")
            if n:
                await p.locator("#epsbu-w textarea[data-t]").first.fill("Texte tapé " + app)
                bu = await p.evaluate(BU); ok(app + " : saisie enregistrée à chaque frappe", ("Texte tapé " + app) in json.dumps(bu, ensure_ascii=False), list(bu.keys()))
                await p.evaluate("(function(){var x=document.querySelector('#epsbu-w [data-t]');x.value='';x.dispatchEvent(new Event('input'))})()")
            await p.evaluate("document.getElementById('bu-go').click()"); await p.wait_for_timeout(300)
            await p.evaluate(INST[app] + ".go('eval')"); await p.wait_for_timeout(600)   # appui sur un onglet du bandeau pendant que Claude rédige
            ok(app + " : un onglet du bandeau range la fenêtre", not (await p.evaluate(WIN) or {}).get("shown"), await p.evaluate(WIN))
            await p.wait_for_timeout(int(0.75 * 1000 * max(n, 1)) + 1500)
            bu = await p.evaluate(BU); nb = json.dumps(bu, ensure_ascii=False).count("remarquables")
            ok(app + " : génération poursuivie et enregistrée fenêtre fermée (" + str(nb) + ")", nb > 0 or n == 0, bu)
            await p.evaluate("(function(){var b=[].filter.call(document.querySelectorAll('button'),function(b){return b.offsetParent&&/Appréciations de bulletin/.test(b.innerText)})[0];if(b)b.click()})()"); await p.wait_for_timeout(1000)
            w = await p.evaluate(WIN); ok(app + " : même fenêtre retrouvée à la réouverture", w and w["shown"] and w["mark"] == "meme" and await p.evaluate("document.querySelectorAll('#epsbu-w').length") == 1, w)
            await p.evaluate("localStorage.removeItem('eps.bulletin.v1')")
        # 🏫 Ma classe → 📝 Bilans & avis : changer d'onglet pendant la génération ne perd rien
        await p.goto(B + "volley/"); await p.wait_for_timeout(4200)
        await p.evaluate("localStorage.removeItem('eps.avis.v1');EPSLC.classe({tab:'bil',cls:(EPSL.items().filter(function(i){return /D.MO/.test(i.nom)})[0]||{}).nom})"); await p.wait_for_timeout(1500)
        nb0 = await p.evaluate("document.querySelectorAll('#lc-cl [data-av]').length")
        await p.evaluate("document.querySelector('#lc-cl [data-gen]').click()"); await p.wait_for_timeout(300)
        await p.evaluate("document.querySelector('#lc-cl [data-t=gen]').click()"); await p.wait_for_timeout(int(0.75 * 1000 * nb0) + 1800)
        av = await p.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('eps.avis.v1')||'{}'))")
        ok("Ma classe : avis enregistrés malgré le changement d'onglet (" + str(av.count("remarquables")) + " / " + str(nb0) + ")", nb0 > 0 and av.count("remarquables") == nb0, av[:300])
        await p.evaluate("document.querySelector('#lc-cl [data-t=bil]').click()"); await p.wait_for_timeout(900)
        shown = await p.evaluate("[].filter.call(document.querySelectorAll('#lc-cl [data-tx]'),function(t){return /remarquables/.test(t.value)}).length")
        ok("Ma classe : avis retrouvés en revenant sur l'onglet", shown == nb0, (shown, nb0))
        # prénom, accords, rien de trop envoyé
        B1 = [q for q in CAP if q.get("ai") == "bulletin"]
        ok("bulletin : ni prénom ni nom de famille ni activité envoyés", B1 and all(("Démo" not in q["t"] + q["ctx"]) and ("Léa" not in q["t"] + q["ctx"]) and q["act"] == "EPS" for q in B1), [(q["act"], q["t"][:80]) for q in B1[:2]])
        ok("bulletin : consigne avec [Prénom] et accords", all("[Prénom]" in q["ctx"] and ("fille" in q["ctx"] or "garçon" in q["ctx"]) for q in B1), B1[0]["ctx"] if B1 else "")
        ok("bulletin : plus de nombre de critères dans les données", not any("critère(s) évalué(s)" in q["t"] for q in B1), [q["t"][:200] for q in B1[:1]])
        await p.goto(B + "volley/"); await p.wait_for_timeout(4000)
        await p.evaluate("localStorage.removeItem('eps.bulletin.v1');localStorage.removeItem('eps.genre.v1');EPSD.bulletin((EPSL.items().filter(function(i){return /D.MO/.test(i.nom)})[0]||{}).nom)"); await p.wait_for_timeout(1000)
        G = await p.evaluate("[].map.call(document.querySelectorAll('#epsbu-w [data-eps-genre]'),function(b){return b.getAttribute('data-eps-genre')+'='+b.textContent})")
        ok("genre deviné d'après le prénom (Léa fille, Hugo garçon, Inès fille)", any(x.startswith("Léa") and "Fille" in x for x in G) and any(x.startswith("Hugo") and "Garçon" in x for x in G) and any(x.startswith("Inès") and "Fille" in x for x in G), G)
        CAP.clear()
        await p.evaluate("[].filter.call(document.querySelectorAll('#epsbu-w [data-eps-genre]'),function(b){return /^Hugo/.test(b.getAttribute('data-eps-genre'))})[0].click()"); await p.wait_for_timeout(300)
        gs = await p.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('eps.genre.v1')||'{}').items||{})")
        ok("correction 👧 / 👦 gardée (eps.genre.v1)", '"g":"f"' in gs, gs)
        await p.evaluate("(function(){var r=[].filter.call(document.querySelectorAll('#epsbu-w [data-one]'),function(b){return /Hugo/.test(b.closest('div[style]').innerText)})[0];r.click()})()"); await p.wait_for_timeout(2200)
        tx = await p.evaluate("(function(){var b=[].filter.call(document.querySelectorAll('#epsbu-w [data-eps-genre]'),function(b){return /^Hugo/.test(b.getAttribute('data-eps-genre'))})[0];return b.closest('div[style]').parentNode.querySelector('textarea').value})()")
        ok("✨ d'un seul élève : prénom remis sur la tablette, accords d'après la correction", tx.startswith("Très bon trimestre, Hugo a su") and CAP and "est une fille" in CAP[-1]["ctx"] and "Hugo" not in CAP[-1]["t"] + CAP[-1]["ctx"], (tx, CAP[-1]["ctx"][-200:] if CAP else ""))
        cn = await p.evaluate("[].map.call(document.querySelectorAll('#epsbu-w .epsd-cnt'),function(d){return d.textContent}).filter(Boolean)")
        ok("compteur de caractères (/ 255)", any("/ 255" in x for x in cn), cn)
        ok("aucune erreur de page", not errs, errs)
        await b.close()
    print(("✅ " if all(out) else "❌ ") + str(sum(out)) + " / " + str(len(out)))
    sys.exit(0 if all(out) else 1)
try: asyncio.run(main())
finally: srv.terminate()
