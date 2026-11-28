# Lot du 28/11/2026 : évaluation de leçon à 4 degrés ajustables et moyenne sur 10, écran qui ne bouge plus, écart entre degrés,
#   listes par-dessus les fenêtres plein écran, bouton de mise à jour coloré (plus de pastille), classe fictive hors de la vue d'ensemble.
# python3 t_lot28.py <racine du dépôt>      (classe fictive, rien n'est envoyé en ligne)
import asyncio, sys, subprocess, time, json, urllib.parse
from playwright.async_api import async_playwright
ROOT = sys.argv[1]
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8877", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8877/eps-autonomie-numerique/"
INIT = "try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.console.trust','1');localStorage.setItem('eps.eval.pli','1');if(!localStorage.getItem('eps.share.v1'))localStorage.setItem('eps.share.v1',JSON.stringify({url:'https://script.google.com/macros/s/TEST/exec',key:'k'}));}catch(e){}"
INST = {"relais": "EPSTR", "acrosport": "EPSTA", "danse": "EPSTD", "basket": "EPSTBK", "volley": "EPSTV", "step": "EPSTST", "orientation": "EPSTORI", "crosstraining": "EPSTCT", "escalade": "EPSTESC", "badminton": "EPSTB"}
# position de défilement de la page et de tous les blocs qui défilent
SCR = "(function(){var o={w:Math.round(scrollY)};[].forEach.call(document.querySelectorAll('*'),function(e,i){if(e.scrollTop>0)o[(e.id||e.className||e.tagName)+'#'+i]=Math.round(e.scrollTop)});return o})()"
async def main():
    out = []; errs = []
    def ok(t, c, d=""): out.append(bool(c)); print(("✅ " if c else "❌ ") + t + ("" if c else "  → " + str(d)[:500]), flush=True)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        c = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768}); await c.add_init_script(INIT)
        async def route(r):
            q = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(r.request.url).query))
            body = {"keyOk": True, "ai": "Tu t'es engagé avec sérieux ; continue à oser des voies plus difficiles.", "aiv": 9} if "ai" in q else {"keyOk": True}
            await r.fulfill(status=200, content_type="application/javascript", body=q.get("callback", "x") + "(" + json.dumps(body) + ")")
        await c.route("https://script.google.com/**", route)
        p = await c.new_page(); p.on("dialog", lambda d: asyncio.ensure_future(d.accept())); p.on("pageerror", lambda x: errs.append(str(x)[:240])); p.set_default_timeout(9000)
        await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("(async()=>{var x=EPSD.demo.create();if(x&&x.then)await x})()"); await p.wait_for_timeout(1800)
        # ---- vue d'ensemble sans la classe fictive ; bouton de mise à jour sans pastille
        await p.evaluate("EPSD.overview()"); await p.wait_for_timeout(900)
        ov = await p.evaluate("(function(){var o=document.querySelector('.epsd-ov,.epsd-win,.lc-ov');return o?o.innerText:''})()")
        ok("vue d'ensemble : pas de classe fictive", ov and "DÉMO" not in ov, ov[:200])
        await p.goto(B + "escalade/"); await p.wait_for_timeout(4200)
        up = await p.evaluate("(function(){var b=document.getElementById('eps-upd');return b?{dot:!!b.querySelector('.eps-dot')}:null})()")
        ok("bouton de mise à jour : plus de pastille", up and not up["dot"], up)
        # ---- évaluation de leçon : 4 degrés, milieu, − / +, sur 10, écran fixe
        await p.evaluate("EPSLC.open('eval')"); await p.wait_for_timeout(1500)
        await p.set_viewport_size({"width": 1024, "height": 420})
        nb = await p.evaluate("document.querySelectorAll('.lc-ov [data-d]').length")
        ok("évaluer la leçon : 4 boutons de degré par critère (" + str(nb) + ")", nb >= 12 and nb % 12 == 0, nb)
        await p.evaluate("(function(){var L=document.querySelectorAll('.lc-ov [data-d=\"2\"]');L[L.length-1].scrollIntoView({block:'center'})})()"); await p.wait_for_timeout(300)
        s0 = await p.evaluate(SCR)
        await p.evaluate("(function(){var L=document.querySelectorAll('.lc-ov [data-d=\"2\"]');L[L.length-1].click()})()"); await p.wait_for_timeout(500)
        s1 = await p.evaluate(SCR)
        # la classe fictive a déjà des valeurs : si l'élève était déjà au degré 3, le premier appui l'a effacé ; on appuie de nouveau
        if await p.evaluate("(function(){var L=document.querySelectorAll('.lc-ov [data-adj]');return L[L.length-1].style.visibility})()") == "hidden":
            await p.evaluate("(function(){var L=document.querySelectorAll('.lc-ov [data-d=\"2\"]');L[L.length-1].click()})()"); await p.wait_for_timeout(400)
        v = await p.evaluate("(function(){var L=document.querySelectorAll('.lc-ov [data-adj]'),s=L[L.length-1];return {v:s.querySelector('[data-v]').textContent,vis:s.style.visibility}})()")
        ok("un appui sur le degré 3 = milieu du degré (6,25 / 10)", v["v"] == "6,25" and v["vis"] == "visible", v)
        ok("l'écran ne bouge pas quand on touche un degré", s0 == s1 and any(x > 0 for x in s0.values()), (s0, s1))
        await p.evaluate("(function(){var L=document.querySelectorAll('.lc-ov [data-s=\"1\"]');L[L.length-1].click()})()"); await p.wait_for_timeout(300)
        v2 = await p.evaluate("(function(){var L=document.querySelectorAll('.lc-ov [data-adj]');return L[L.length-1].querySelector('[data-v]').textContent})()")
        ok("+ ajuste la note dans le degré (" + v2 + ")", v2 in ("6,75", "7"), v2)
        st = await p.evaluate("(function(){var V=JSON.parse(localStorage.getItem('eps.leceval.escalade.v1')),m=0;Object.keys(V.items).forEach(function(k){var e=V.items[k].el||{};Object.keys(e).forEach(function(n){['p','s','t'].forEach(function(q){if(e[n][q]!=null)m=Math.max(m,e[n][q])})})});return m})()")
        ok("valeur gardée sur l'échelle 0 à 3 (lue par la note proposée, le bulletin, le référentiel)", 0 < st <= 3, st)
        m0 = await p.evaluate("(function(){var L=document.querySelectorAll('.lc-ov [data-moy]');return L[L.length-1].textContent})()")
        await p.evaluate("(function(){var L=document.querySelectorAll('.lc-ov [data-ms=\"1\"]');L[L.length-1].click()})()"); await p.wait_for_timeout(300)
        m1 = await p.evaluate("(function(){var L=document.querySelectorAll('.lc-ov [data-moy]');return L[L.length-1].textContent})()")
        ok("+ sur la moyenne : un quart de point de plus (" + m0 + " → " + m1 + ")", abs(float(m1.replace(",", ".")) - float(m0.replace(",", ".")) - 0.25) < 0.01, (m0, m1))
        moy = await p.evaluate("[].map.call(document.querySelectorAll('.lc-ov [data-moy]'),function(t){return t.textContent}).filter(function(t){return t!=='—'})")
        ok("moyenne de l'élève sur 10", moy and all(float(x.replace(",", ".")) <= 10 for x in moy), moy)
        await p.set_viewport_size({"width": 1024, "height": 768})
        # ---- écart entre degrés (évaluation commune) : haut du degré 2 < bas du degré 3
        g = await p.evaluate("""(function(){var x=(window.EPSE_INST||[]).filter(function(i){return i.A.app==='esc'})[0],A=x.A,c=A.classes().filter(function(c){return /D.MO/.test(c.nom)})[0],G=A.grid(),E=c.eleves[2],cr=G.criteres[0];
          var r=[];[[1,1],[2,0],[2,.5],[3,1],[0,0]].forEach(function(v){A.setDeg(cr,E,v[0]);var o=A.prof(cr,E);A.setDeg(cr,E,null);A.setProf(cr,E,{d:v[0],pos:v[1]});r.push(A.prof(cr,E).pts/(+cr.max||1));A.setDeg(cr,E,null)});return r})()""")
        ok("haut du degré 2 (" + str(round(g[0], 2)) + ") < bas du degré 3 (" + str(round(g[1], 2)) + ") ; degré 4 en haut = tous les points", g[0] < g[1] - 0.02 and abs(g[3] - 1) < 0.01 and g[4] == 0, g)
        # ---- la liste des dispensés passe par-dessus la fenêtre des appréciations
        await p.evaluate("EPSD.bulletin()"); await p.wait_for_timeout(900)
        await p.evaluate("EPSD.show()"); await p.wait_for_timeout(700)
        top = await p.evaluate("(function(){var o=document.querySelector('.epsd-ov');if(!o)return 'aucune liste';var bx=o.querySelector('.epsd-box'),r=bx.getBoundingClientRect(),t=document.elementFromPoint(r.left+r.width/2,r.top+20);return t&&o.contains(t)?'ok':'cachée derrière '+(t?(t.id||t.className):'?')})()")
        ok("liste des dispensés visible par-dessus la fenêtre des appréciations", top == "ok", top)
        await p.evaluate("(function(){var o=document.querySelector('.epsd-ov');if(o)o.remove();var w=document.getElementById('epsbu-w');if(w)w.remove()})()")
        # ---- l'écran ne bouge pas à l'évaluation finale (plusieurs applis)
        for app in ["escalade", "basket", "volley", "badminton", "danse", "relais"]:
            await p.goto(B + app + "/"); await p.wait_for_timeout(4200)
            if app == "badminton": await p.evaluate("setVoie('pro')"); await p.wait_for_timeout(800)
            if app == "relais": await p.evaluate("(()=>{const c=DATA.classes.find(c=>/D.MO/.test(c.name))||DATA.classes[0];DATA.cur=c.id;persist()})()")
            await p.evaluate(INST[app] + ".go('eval')"); await p.wait_for_timeout(500); await p.evaluate(INST[app] + ".evGo('fin')"); await p.wait_for_timeout(1500)
            if app == "danse": await p.evaluate("(function(){var x=[].filter.call(document.querySelectorAll('*'),function(e){return e.children.length===0&&/D.MO \\(fictive\\)/.test(e.textContent)&&e.offsetParent})[0];if(x)x.click()})()"); await p.wait_for_timeout(1200)
            await p.set_viewport_size({"width": 1024, "height": 460}); await p.wait_for_timeout(400)
            SEL = "[].filter.call(document.querySelectorAll('.epse-deg,[data-evd],.lv,.deg,[data-deg],button[onclick^=\"setDeg\"],[onclick*=\"setDeg(\"]'),function(e){return e.offsetParent})"
            n = await p.evaluate(SEL + ".length")
            if not n: ok(app + " : degrés trouvés à l'évaluation finale", False, "aucun bouton de degré repéré"); await p.set_viewport_size({"width": 1024, "height": 768}); continue
            await p.evaluate("(function(){var L=" + SEL + ";L[L.length-2].scrollIntoView({block:'center'})})()"); await p.wait_for_timeout(400)
            a0 = await p.evaluate("(function(){var L=" + SEL + ",e=L[L.length-2];return Math.round(e.getBoundingClientRect().top)})()")
            await p.evaluate("(function(){var L=" + SEL + ";L[L.length-2].click()})()"); await p.wait_for_timeout(900)
            a1 = await p.evaluate("(function(){var L=" + SEL + ",e=L[L.length-2];return e?Math.round(e.getBoundingClientRect().top):null})()")
            ok(app + " : l'écran reste en place quand on touche un degré (" + str(a0) + " → " + str(a1) + ")", a1 is not None and abs(a1 - a0) <= 60, (a0, a1, n))
            await p.set_viewport_size({"width": 1024, "height": 768})
        # ---- ✨ commentaires de bilan pour toute la classe, mis sur les fiches des élèves (Escalade : module commun ; Volley, Danse : écrans propres)
        for app, inst in (("escalade", "EPSTESC"), ("volley", "EPSTV"), ("danse", "EPSTD")):
            await p.goto(B + app + "/"); await p.wait_for_timeout(4200)
            await p.evaluate(inst + ".go('eval')"); await p.wait_for_timeout(500); await p.evaluate(inst + ".evGo('fin')"); await p.wait_for_timeout(1500)
            if app == "danse": await p.evaluate("(function(){var x=[].filter.call(document.querySelectorAll('*'),function(e){return e.children.length===0&&/D.MO \\(fictive\\)/.test(e.textContent)&&e.offsetParent})[0];if(x)x.click()})()"); await p.wait_for_timeout(1200)
            cl = await p.evaluate("(function(){var b=[].filter.call(document.querySelectorAll('button'),function(b){return b.offsetParent&&/Commentaires de bilan/.test(b.getAttribute('aria-label')||'')})[0];if(b)b.click();return !!b})()"); await p.wait_for_timeout(900)
            if not cl or not await p.evaluate("!!document.getElementById('epse-phw')"): ok(app + " : bouton « ✨ Commentaires de bilan » et sa fenêtre", False, cl); continue
            await p.evaluate("document.querySelector('#epse-phw [data-go]').click()"); await p.wait_for_timeout(3500)
            n1 = await p.evaluate("[].filter.call(document.querySelectorAll('#epse-phw textarea'),function(t){return /sérieux/.test(t.value)}).length")
            await p.evaluate("document.querySelector('#epse-phw [data-all]').click()"); await p.wait_for_timeout(300); await p.evaluate("document.querySelector('#epse-phw [data-ok]').click()"); await p.wait_for_timeout(600)
            n2 = await p.evaluate("(function(){var x=(window.EPSE_INST||[])[0],A=x.A,c=A.classes().filter(function(c){return /D.MO/.test(c.nom)})[0];return c.eleves.filter(function(E){return /sérieux/.test(A.comment(E))}).length})()")
            ok(app + " : " + str(n1) + " commentaires proposés, " + str(n2) + " mis sur les fiches des élèves", n1 > 0 and n2 == n1, (n1, n2, await p.evaluate("document.querySelector('#epse-phw [data-msg]').textContent")))
        ok("aucune erreur de page", not errs, errs)
        await b.close()
    print(("✅ " if all(out) else "❌ ") + str(sum(out)) + " / " + str(len(out)))
    sys.exit(0 if all(out) else 1)
try: asyncio.run(main())
finally: srv.terminate()
