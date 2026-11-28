# 🎬 Planche tactique : animation par temps (＋ Temps, frise, ▶ Lecture), lecteur côté élève, partage à toutes les tablettes d'un seul appui.
# python3 t_planche_anim.py <racine du dépôt>      (faux script, rien n'est envoyé en ligne)
import asyncio, sys, subprocess, time, json, urllib.parse
from playwright.async_api import async_playwright
ROOT = sys.argv[1]
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8905", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
U = "http://localhost:8905/eps-autonomie-numerique/"
async def main():
    out = []; errs = []
    def ok(t, c, d=""): out.append(bool(c)); print(("✅ " if c else "❌ ") + t + ("" if c else "  → " + str(d)[:500]), flush=True)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        c = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768})
        await c.add_init_script("try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));if(!localStorage.getItem('eps.share.v1'))localStorage.setItem('eps.share.v1',JSON.stringify({url:'https://script.google.com/macros/s/TEST/exec',key:'k'}));}catch(e){}")
        async def route(r):
            q = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(r.request.url).query)); await r.fulfill(status=200, content_type="application/javascript", body=q.get("callback", "x") + "(" + json.dumps({"keyOk": True}) + ")")
        await c.route("https://script.google.com/**", route)
        p = await c.new_page(); p.on("pageerror", lambda x: errs.append(str(x)[:240])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(U + "tactique/?sport=volley"); await p.wait_for_timeout(3500)
        T = "[].map.call(document.querySelectorAll('#tps [data-tg]'),function(x){return x.textContent+(x.getAttribute('aria-pressed')==='true'?'*':'')})"
        ok("frise : un seul temps au départ, bouton « ＋ Temps »", await p.evaluate(T) == ["Temps 1*"] and await p.evaluate("!!document.querySelector('#tps [data-tp=add]')&&!document.querySelector('#tps [data-tp=play]')"))
        await p.click("#tps [data-tp=add]"); await p.wait_for_timeout(300)
        ok("＋ Temps : temps 2 créé et affiché", await p.evaluate(T) == ["Temps 1", "Temps 2*"], await p.evaluate(T))
        # déplacer le joueur bleu n° 1 dans le temps 2
        pos = await p.evaluate("(function(){var c=document.querySelector('#board svg circle[fill=\"#1F4FA3\"]').getBoundingClientRect();return [c.left+c.width/2,c.top+c.height/2]})()")
        await p.mouse.move(pos[0], pos[1]); await p.mouse.down(); await p.mouse.move(pos[0] + 60, pos[1] + 80, steps=6); await p.mouse.up(); await p.wait_for_timeout(300)
        d = await p.evaluate("(function(){var K=Object.keys(localStorage).filter(function(k){try{var v=JSON.parse(localStorage.getItem(k));return v&&v.d&&v.d.sport==='volley'&&Array.isArray(v.d.items)}catch(e){return false}})[0];var d=JSON.parse(localStorage.getItem(K)).d;return {n:d.fr?d.fr.length:1,a:d.fr?[d.fr[0][0].x,d.fr[0][0].y]:null,b:d.fr?[d.fr[1][0].x,d.fr[1][0].y]:null,id:d.fr?d.fr[0][0].id===d.fr[1][0].id:false,fl:d.fr?d.fr[1].filter(function(i){return i.t==='a'}).length:9}})()")
        ok("le joueur a bougé dans le temps 2 seulement (même identifiant)", d["n"] == 2 and d["id"] and (abs(d["a"][0] - d["b"][0]) > 3 or abs(d["a"][1] - d["b"][1]) > 3), d)
        ok("temps précédent en filigrane", await p.evaluate("document.querySelectorAll('#board svg line[stroke=\"#6A6F78\"]').length") >= 1)
        await p.click("#tps [data-tp=add]"); await p.wait_for_timeout(300)
        ok("troisième temps", await p.evaluate(T) == ["Temps 1", "Temps 2", "Temps 3*"], await p.evaluate(T))
        await p.screenshot(path="/tmp/t/planche-temps.png")
        await p.click("#tps [data-tp=play]"); await p.wait_for_timeout(500)
        l0 = await p.evaluate("(function(){var l=document.querySelector('#lect');return {vis:!l.hidden,txt:l.innerText,svg:!!l.querySelector('svg')}})()")
        ok("▶ Lecture : lecteur affiché avec ses commandes", l0["vis"] and l0["svg"] and "Temps" in l0["txt"] and ("Pause" in l0["txt"] or "Lecture" in l0["txt"]), l0)
        await p.wait_for_timeout(5500)
        l1 = await p.evaluate("document.querySelector('#lect').innerText")
        ok("l'animation va jusqu'au dernier temps", "Temps 3 / 3" in l1 and "Revoir" in l1, l1)
        await p.evaluate("document.querySelector('#lect [data-a=prev]').click()"); await p.wait_for_timeout(400)
        ok("◀ temps précédent", "Temps 2 / 3" in await p.evaluate("document.querySelector('#lect').innerText"))
        await p.screenshot(path="/tmp/t/planche-lecture.png")
        await p.click("#tps [data-tp=stop]"); await p.wait_for_timeout(300)
        ok("retour au dessin", await p.evaluate("!document.querySelector('#board').hidden&&document.querySelector('#lect').hidden"))
        # partage à toutes les tablettes, sans leçon
        await p.wait_for_timeout(1200)
        has = await p.evaluate("!!document.querySelector('#tps [data-tp=share]')")
        ok("mode enseignant : bouton « 📡 Partager à toutes les tablettes »", has)
        if has:
            await p.click("#tps [data-tp=share]"); await p.wait_for_timeout(1500)
            sg = await p.evaluate("(function(){var V=JSON.parse(localStorage.getItem('eps.sig.v1')||'null'),c=V&&V.items&&V.items.plan;return c?{to:c.to,live:c.live,n:c.d&&c.d.fr?c.d.fr.length:1,ok:c.until>Date.now()}:null})()")
            ok("planche partie pour toutes les tablettes, en direct, avec ses 3 temps", sg and sg["to"] == "*" and sg["live"] == 1 and sg["n"] == 3 and sg["ok"], sg)
            ok("message de confirmation", "Envoyée à toutes les tablettes" in await p.evaluate("(document.getElementById('shst')||{}).textContent||''"), await p.evaluate("(document.getElementById('shst')||{}).textContent||''"))
        # côté élève : le lecteur se pose tout seul sur la planche reçue
        r = await p.evaluate("(function(){var d=EPSTAC.depart('basket3'),F=EPSTAC.frames(d),f2=JSON.parse(JSON.stringify(F[0]));f2[0].x+=20;var el=document.createElement('div');document.body.appendChild(el);var P=EPSTAC.player(el,{sport:'basket3',items:F[0],fr:[F[0],f2]},{});var r={n:P.count(),cmd:el.querySelectorAll('[data-a]').length};P.stop();el.remove();var el2=document.createElement('div');var P2=EPSTAC.player(el2,d,{});r.seul=el2.querySelectorAll('[data-a]').length;return r})()")
        ok("lecteur : commandes pour une planche animée, aucune pour une image seule", r["n"] == 2 and r["cmd"] == 4 and r["seul"] == 0, r)
        ok("aucune erreur de page", not errs, errs)
        await b.close()
    srv.terminate(); print(str(sum(out)) + " / " + str(len(out))); sys.exit(0 if all(out) else 1)
asyncio.run(main())
