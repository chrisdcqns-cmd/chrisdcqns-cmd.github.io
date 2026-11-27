# 👁 Vue élève = classe fictive (demande de l'enseignant, 27/11/2026) : dans chaque appli, l'onglet « Vue élève » arrive sur la
# classe « DÉMO (fictive) », prête à être parcourue (leçon du jour, groupes, équipes), jamais sur une vraie classe ; la classe en
# cours de la tablette n'est pas modifiée ; la classe fictive n'est pas proposée aux élèves d'une tablette où elle n'est pas installée.
# python3 t_vue_demo.py <racine du dépôt> [dossier des captures]
import asyncio, sys, subprocess, time, json, os
from playwright.async_api import async_playwright
ROOT = sys.argv[1]; SHOTS = sys.argv[2] if len(sys.argv) > 2 else ""
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8857", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8857/eps-autonomie-numerique/"; CL = "2GT1 TEST"
NOMS = ["Lina MARTIN", "Noah PETIT", "Emma DURAND", "Hugo LEROY", "Jade MOREAU", "Louis SIMON", "Tom ROUX", "Ines FAURE"]
LISTE = "if(!localStorage.getItem('eps.lists.v1'))localStorage.setItem('eps.lists.v1',JSON.stringify({items:{c1:{id:'c1',nom:'" + CL + "',el:" + json.dumps(NOMS) + ",u:1}},pend:{},since:0}));"
SEED = "try{" + LISTE + "localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));}catch(e){}"
# tablette d'élèves : la liste fictive est arrivée par le partage, mais la classe fictive n'y a jamais été installée (pas de « eps.demo.v1 »)
SEED_EL = "try{if(!localStorage.getItem('eps.lists.v1'))localStorage.setItem('eps.lists.v1',JSON.stringify({items:{c1:{id:'c1',nom:'" + CL + "',el:" + json.dumps(NOMS) + ",u:1},d1:{id:'d1',nom:'DÉMO (fictive)',el:['Léa Démo','Hugo Démo','Inès Démo','Tom Démo'],demo:1,man:1,u:2}},pend:{},since:0}));}catch(e){}"
# appli, texte attendu dans la vue élève (l'élève peut avancer : groupe, équipe, leçon…)
APPS = [("escalade", "Forme ton groupe"), ("relais", "Leçon en cours"), ("volley", "quipe"), ("badminton", "groupe"), ("danse", "Groupe 1"), ("acrosport", "DÉMO"),
        ("ccf", "Équipe 1"), ("crosstraining", "Avec qui travailles-tu"), ("basket", "Rouges"), ("step", "Qui est dans ton groupe")]
REEL = "JSON.stringify([localStorage.getItem('ccf.e'),localStorage.getItem('eps_bad_terrain'),localStorage.getItem('eps_volley_coach_v1'),((JSON.parse(localStorage.getItem('escalade.cf')||'{}').sea||{}).cl)||null,Object.keys(sessionStorage).filter(function(k){return /^(step_|ct_|acro\\.class|eps\\.lcwho)/.test(k)||k==='bk_eq'}).join(','),Object.keys(localStorage).filter(function(k){return /gate\\.last/.test(k)}).join(',')])"
async def main():
    out = []; errs = []
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox"])
        for app, txt in APPS:
            c = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await c.add_init_script(SEED)
            p = await c.new_page(); p.on("pageerror", lambda x, a=app: errs.append(a + " " + str(x)[:200])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
            await p.goto(B + app + "/"); await p.wait_for_timeout(4000)
            dz = await p.evaluate("(function(){try{return JSON.parse(localStorage.getItem('danse_eps_v1')||localStorage.getItem('danse.v1')||'null')}catch(e){return null}})()") if app == "danse" else None
            await p.click(".epst-nav [data-t='vue']")
            F = []; t = ""
            for i in range(30):
                await p.wait_for_timeout(500); F = [x for x in p.frames if x != p.main_frame]
                if F:
                    try: t = await F[0].evaluate("document.body.innerText")
                    except Exception: t = ""
                    if txt in t and not await F[0].evaluate("!!document.querySelector('.epsg')"): break
            ban = await p.evaluate("(document.querySelector('.epst-vue .h')||{}).innerText||''")
            out.append((app + " : la vue élève arrive sur la classe fictive, prête (« " + txt + " »)", bool(F) and txt in t and ("DÉMO" in t or "Démo" in t or app == "basket"), t[:160].replace("\n", " | ")))
            out.append((app + " : aucune vraie classe à l'écran, bandeau « classe fictive »", CL not in t and "classe fictive" in ban, (ban, CL in t)))
            r = json.loads(await p.evaluate(REEL))
            out.append((app + " : la classe en cours de la tablette n'est pas touchée", r == [None, None, None, None, "", ""], r))
            if SHOTS and app in ("escalade", "relais", "basket", "danse", "ccf"): await p.screenshot(path=os.path.join(SHOTS, "vue-demo-" + app + ".png"))
            if app == "danse":
                await p.wait_for_timeout(900); k = await p.evaluate("(function(){for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);try{var v=JSON.parse(localStorage.getItem(k));if(v&&Array.isArray(v.classes)&&v.classeId&&Array.isArray(v.criteres)){var c=v.classes.filter(function(x){return x.id===v.classeId})[0];return c?c.nom:''}}catch(e){}}return null})()")
                out.append(("danse : la classe en cours enregistrée reste une vraie classe", k is not None and "DÉMO" not in (k or "DÉMO"), k))
            await c.close()
        # tablette d'élèves sans classe fictive installée : « Choisis ta classe » ne la propose pas
        c = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await c.add_init_script(SEED_EL)
        for app in ("volley", "basket", "danse"):
            p = await c.new_page(); p.on("pageerror", lambda x, a=app: errs.append(a + " " + str(x)[:200])); await p.goto(B + app + "/"); await p.wait_for_timeout(4500)
            g = await p.evaluate("(function(){var g=document.querySelector('.epsg');return g?[].map.call(g.querySelectorAll('[data-c]'),function(x){return x.innerText.replace(/\\s+/g,' ')}).join(' / '):null})()")
            out.append((app + " (tablette d'élèves) : « Choisis ta classe » sans la classe fictive", g is not None and CL in g and "DÉMO" not in g, g)); await p.close()
        await c.close(); await b.close()
    print("\n".join(("✅ " if o[1] else "❌ ") + o[0] + ("" if o[1] else "  → " + str(o[2])) for o in out)); print("erreurs de page :", errs or "aucune")
    return all(o[1] for o in out) and not errs
try: ok = asyncio.run(main())
finally: srv.terminate()
sys.exit(0 if ok else 1)
