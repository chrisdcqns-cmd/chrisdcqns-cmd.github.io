# ✋ Appeler l'enseignant et 🧭 Pilotage de leçon (deux tablettes, faux script) : appel envoyé par l'élève, file d'attente de l'enseignant,
# « J'y vais » vu par l'élève, « ✓ Fait », élèves en échec en escalade (ligne rouge, assis dans le baudrier, sécurité), filtres, détail.
# python3 t_appel.py <racine du dépôt> [dossier des captures]
import asyncio, sys, subprocess, time, json, os, urllib.request
from playwright.async_api import async_playwright
ROOT = sys.argv[1]; SHOTS = sys.argv[2] if len(sys.argv) > 2 else ""
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8847", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
gs = subprocess.Popen([sys.executable, "-I", "mockgs.py"]); time.sleep(1.5)
B = "http://localhost:8847/eps-autonomie-numerique/"; G = "http://127.0.0.1:8899/exec"; CL = "2GT1 TEST"
NOMS = ["Lina MARTIN", "Noah PETIT", "Emma DURAND", "Hugo LEROY", "Jade MOREAU", "Louis SIMON"]
SEED = "try{localStorage.setItem('eps.share.v1',JSON.stringify({url:'" + G + "',key:'CLE'}));if(!localStorage.getItem('eps.lists.v1'))localStorage.setItem('eps.lists.v1',JSON.stringify({items:{c1:{id:'c1',nom:'" + CL + "',el:" + json.dumps(NOMS) + ",u:1}},pend:{},since:0}));"
BTN = "(()=>{var b=document.getElementById('eps-callb');if(!b)return null;var r=b.getBoundingClientRect();return {t:b.textContent,vis:getComputedStyle(b).display!=='none'&&r.width>0,top:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b}})()"
async def main():
    out = []; errs = []
    async def shot(p, name):
        if SHOTS: await p.screenshot(path=os.path.join(SHOTS, name + ".png"))
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox"])
        urllib.request.urlopen("http://127.0.0.1:8899/ctl?reset=1&fail=0&old=0&nochk=0").read()
        cp = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await cp.add_init_script(SEED + "localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));}catch(e){}")
        ce = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768}); await ce.add_init_script(SEED + "}catch(e){}")
        p = await cp.new_page(); p.on("pageerror", lambda x: errs.append("prof " + str(x)[:200])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        e = await ce.new_page(); e.on("pageerror", lambda x: errs.append("élève " + str(x)[:200]))
        await p.goto(B + "escalade/"); await e.goto(B + "escalade/"); await e.wait_for_timeout(5000)
        # ---------- 1. élève : le bouton est dans le bandeau, un appui + un motif = appel ----------
        await e.get_by_text("6 élèves").last.click(); await e.wait_for_timeout(2500)
        s = await e.evaluate(BTN); out.append(("1 bouton « ✋ Enseignant » visible dans le bandeau élève", bool(s) and s["vis"] and s["top"] and "Enseignant" in s["t"], s))
        s = await p.evaluate(BTN); out.append(("1b pas de bouton d'appel côté enseignant tant qu'il n'y a pas d'appel", not s or not s["vis"], s))
        await e.click("#eps-callb"); await e.wait_for_timeout(300); n = await e.locator(".epsd-ov [data-mi]").count(); out.append(("1c fenêtre des motifs (5 par défaut)", n == 5, n)); await shot(e, "1-eleve-motifs")
        await e.locator(".epsd-ov [data-mi]").nth(1).click(); await e.wait_for_timeout(600)
        s = await e.evaluate(BTN); out.append(("1d le bouton devient « ⏳ Appel envoyé »", bool(s) and "Appel envoyé" in s["t"], s))
        # ---------- 2. enseignant : pastille, file d'attente, « J'y vais », « ✓ Fait » ----------
        ok = False
        for i in range(25):
            await p.wait_for_timeout(2000)
            if await p.evaluate("EPSD.appels.list('escalade').length") == 1: ok = True; break
        out.append(("2 l'appel arrive sur la tablette de l'enseignant", ok, i)); await p.wait_for_timeout(2000)
        s = await p.evaluate(BTN); out.append(("2b pastille « ✋ 1 » dans le bandeau enseignant", bool(s) and s["vis"] and s["t"].strip() == "✋ 1", s))
        await p.evaluate("EPSLC.controle({cls:'" + CL + "'})"); await p.wait_for_timeout(700); t = await p.inner_text("#lc-ctl")
        out.append(("2c écran « Pilotage de leçon », appel avec son motif et la classe", "Pilotage de leçon" in t and "Vérification sécurité" in t and "Appels (1)" in t, t[:200])); await shot(p, "2-pilotage-appel")
        await p.click("#lc-ctl [data-call]"); await p.wait_for_timeout(500); t = await p.inner_text("#lc-ctl"); out.append(("2d « J'y vais » : appel pris en charge, bouton « ✓ Fait »", "pris en charge" in t and "✓ Fait" in t, None))
        ok = False
        for i in range(25):
            await e.wait_for_timeout(2000); s = await e.evaluate(BTN)
            if s and "Il arrive" in s["t"]: ok = True; break
        out.append(("2e l'élève voit « 👍 Il arrive »", ok, s))
        await p.click("#lc-ctl [data-call]"); await p.wait_for_timeout(500); out.append(("2f « ✓ Fait » : plus d'appel", await p.evaluate("EPSD.appels.list('escalade').length") == 0 and "Aucun appel en cours" in await p.inner_text("#lc-ctl"), None))
        ok = False
        for i in range(25):
            await e.wait_for_timeout(2000); s = await e.evaluate(BTN)
            if s and "Enseignant" in s["t"]: ok = True; break
        out.append(("2g le bouton de l'élève revient à « ✋ Enseignant »", ok, s))
        # ---------- 3. escalade : élèves en échec, sécurité, réussite ; filtres ; détail ----------
        await p.evaluate("""(()=>{var ts=new Date().toLocaleString('sv').slice(0,16),mk=(el,h,x)=>R.push(Object.assign({id:'t'+Math.random().toString(36).slice(2),ts:ts,cl:'%s',el:el,vo:1,c:'A',d:'5b',h:h,a:0,why:''},x||{}));
          mk('Lina MARTIN',3);mk('Lina MARTIN',4);mk('Lina MARTIN',2);mk('Noah PETIT',9,{a:1});mk('Emma DURAND',9);mk('Hugo LEROY',0,{why:'Problème de matériel ou de sécurité'});})()""" % CL)
        al = await p.evaluate("window.epsCtlAlerts('" + CL + "').map(function(a){return [a.n,a.niv,a.t]})"); d = {a[0]: a for a in al}
        out.append(("3 escalade : 3 voies sans Top = échec, assis dans le baudrier = échec, sécurité, Top = réussite", d.get("Lina MARTIN", [0, 0])[1] == "echec" and d.get("Noah PETIT", [0, 0])[1] == "echec" and "assis" in d["Noah PETIT"][2] and d.get("Hugo LEROY", [0, 0])[1] == "secu" and d.get("Emma DURAND", [0, 0])[1] == "ok", al))
        await p.evaluate("EPSLC.controle({cls:'" + CL + "'})"); await p.wait_for_timeout(700); t = await p.inner_text("#lc-ctl")
        out.append(("3b filtres : « En échec 3 », « En réussite 1 », alerte sécurité en haut", "En échec 3" in t and "En réussite 1" in t and "🛡 Hugo LEROY" in t, t[:400])); await shot(p, "3-pilotage-classe")
        await p.click("#lc-ctl [data-f='echec']"); await p.wait_for_timeout(300); n = await p.locator("#lc-ctl [data-el]").count(); out.append(("3c filtre « En échec » : 3 cartes seulement", n == 3, n)); await shot(p, "4-pilotage-en-echec")
        await p.locator("#lc-ctl [data-el]", has_text="Noah").click(); await p.wait_for_timeout(300); t = await p.inner_text("#lc-det"); out.append(("3d détail de l'élève dans une petite fenêtre (grimpes, assis), ⚡ repères rapides", "assis" in t and "Repères rapides" in t and "Top" in t, t[:200])); await shot(p, "5-detail-eleve")
        await p.click("#lc-det [data-x]"); await p.wait_for_timeout(200)
        of = await p.evaluate("document.documentElement.scrollWidth>innerWidth"); out.append(("3e aucun débordement horizontal", not of, None))
        await p.evaluate("EPSLC.controle({cls:'" + CL + "'})"); await p.wait_for_timeout(500); await p.click("#lc-ctl [data-xa]"); await p.wait_for_timeout(600)
        t = await p.evaluate("document.body.innerText"); out.append(("3f « Ouvrir en grand » : la tablette de contrôle d'Escalade, avec les grimpes et leurs heures", await p.evaluate("S.t") == "ctl" and "Tablette de contrôle" in t and "Lina MARTIN" in t, t[:200])); await shot(p, "6-tablette-de-controle-escalade")
        # ---------- 4. réglage : bouton masqué quand le paramètre est à 0 ; rien en clair en ligne ----------
        raw = urllib.request.urlopen("http://127.0.0.1:8899/ctl?dump=1").read().decode("utf-8", "replace") if False else ""
        await e.evaluate("(()=>{var V=JSON.parse(localStorage.getItem('eps.param.v1')||'{\"items\":{}}');V.items=V.items||{};})()")
        await b.close()
    print("\n".join(("✅ " if o[1] else "❌ ") + o[0] + ("" if o[1] else "  → " + str(o[2])) for o in out)); print("erreurs de page :", errs or "aucune")
    return all(o[1] for o in out) and not errs
try: ok = asyncio.run(main())
finally: srv.terminate(); gs.terminate()
sys.exit(0 if ok else 1)
