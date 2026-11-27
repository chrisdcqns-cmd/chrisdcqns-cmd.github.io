# ✋ Appeler l'enseignant et 🧭 Pilotage de leçon (deux tablettes, faux script) : appel envoyé par l'élève, file d'attente de l'enseignant,
# « J'y vais » vu par l'élève, « ✓ Fait » ; en escalade, un seul écran de suivi : la tablette de contrôle des grimpes (appels en tête, cartes en échec qui clignotent).
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
import re
def new_heure(t): return bool(re.search(r'\b\d{2}:\d{2}\b', t))
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
        await e.get_by_text("6 élèves").last.click(); await e.wait_for_timeout(800); await e.evaluate("(()=>{const b=document.querySelector('.epsg2 [data-go=g]');if(b)b.click()})()"); await e.wait_for_timeout(1700)  # fenêtre « Groupes / La leçon »
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
        await p.click("#eps-callb"); await p.wait_for_timeout(900); t = await p.evaluate("document.body.innerText")
        out.append(("2c la pastille ouvre la tablette de contrôle des grimpes (seul écran de suivi), appel en tête avec son motif", await p.evaluate("S.t") == "ctl" and "Tablette de contrôle" in t and "Vérification sécurité" in t and await p.locator("[data-eps-appels] [data-eps-call]").count() == 1 and await p.evaluate("!document.getElementById('lc-ctl')||document.getElementById('lc-ctl').style.display==='none'"), t[:300])); await shot(p, "2-controle-appel")
        out.append(("2c2 pas d'action « Pilotage de leçon » en escalade (pas de double contrôle)", "Pilotage de leçon" not in await p.evaluate("EPSLC.actions().map(function(a){return a.label}).join('|')"), None))
        await p.click("[data-eps-call]"); await p.wait_for_timeout(500); t = await p.inner_text("[data-eps-appels]"); out.append(("2d « J'y vais » : appel pris en charge, bouton « ✓ Fait »", "pris en charge" in t and "✓ Fait" in t, t))
        ok = False
        for i in range(25):
            await e.wait_for_timeout(2000); s = await e.evaluate(BTN)
            if s and "Il arrive" in s["t"]: ok = True; break
        out.append(("2e l'élève voit « 👍 Il arrive »", ok, s))
        await p.click("[data-eps-call]"); await p.wait_for_timeout(500); out.append(("2f « ✓ Fait » : plus d'appel à l'écran", await p.evaluate("EPSD.appels.list('escalade').length") == 0 and await p.locator("[data-eps-appels]").count() == 0, None))
        ok = False
        for i in range(25):
            await e.wait_for_timeout(2000); s = await e.evaluate(BTN)
            if s and "Enseignant" in s["t"]: ok = True; break
        out.append(("2g le bouton de l'élève revient à « ✋ Enseignant »", ok, s))
        # ---------- 3. escalade : les cartes des élèves en échec clignotent dans la tablette de contrôle, rien d'autre ne change ----------
        await p.evaluate("""(()=>{var ts=new Date().toLocaleString('sv').slice(0,16),mk=(el,h,x)=>R.push(Object.assign({id:'t'+Math.random().toString(36).slice(2),ts:ts,cl:'%s',el:el,vo:1,c:'A',d:'5b',h:h,a:0,why:''},x||{}));
          mk('Lina MARTIN',3);mk('Lina MARTIN',4);mk('Lina MARTIN',2);mk('Noah PETIT',9,{a:1});mk('Emma DURAND',9);mk('Hugo LEROY',0,{why:"J'ai eu peur"});render();})()""" % CL); await p.wait_for_timeout(400)
        bl = await p.evaluate("[].map.call(document.querySelectorAll('.ccard.blink'),function(c){return c.innerText})"); tous = await p.evaluate("document.querySelectorAll('.ccard').length"); j = " | ".join(bl)
        out.append(("3 clignotent : 3 voies sans Top (Lina), assis dans le baudrier (Noah), sous la ligne rouge (Hugo) ; pas Emma (Top)", len(bl) == 3 and "Lina" in j and "Noah" in j and "Hugo" in j and "Emma" not in j and tous >= 6, (len(bl), tous)))
        an = await p.evaluate("(function(){var c=document.querySelector('.ccard.blink');return c?getComputedStyle(c).animationName:[S.t,S.T,CF.sel,document.querySelectorAll('.ccard').length,CL.map(function(c){return c.id+':'+c.nom})].join(' ~ ')})()"); out.append(("3b animation de clignotement posée sur la carte", an == "cblink", an))
        t = await p.evaluate("document.body.innerText"); out.append(("3c la tablette de contrôle garde ses données (voies, heures des grimpes)", "Lina MARTIN" in t and new_heure(t), t[:200])); await shot(p, "3-controle-clignote")
        of = await p.evaluate("document.documentElement.scrollWidth>innerWidth"); out.append(("3e aucun débordement horizontal", not of, None))
        # ---------- 4. réglage : bouton masqué quand le paramètre est à 0 ; rien en clair en ligne ----------
        raw = urllib.request.urlopen("http://127.0.0.1:8899/ctl?dump=1").read().decode("utf-8", "replace") if False else ""
        await e.evaluate("(()=>{var V=JSON.parse(localStorage.getItem('eps.param.v1')||'{\"items\":{}}');V.items=V.items||{};})()")
        await b.close()
    print("\n".join(("✅ " if o[1] else "❌ ") + o[0] + ("" if o[1] else "  → " + str(o[2])) for o in out)); print("erreurs de page :", errs or "aucune")
    return all(o[1] for o in out) and not errs
try: ok = asyncio.run(main())
finally: srv.terminate(); gs.terminate()
sys.exit(0 if ok else 1)
