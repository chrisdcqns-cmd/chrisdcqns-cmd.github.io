# Refait les captures du guide (guide/img/*.jpg) avec la classe fictive uniquement.
# python3 captures_guide.py <racine du dépôt> [nom d'une capture]   (Playwright et Pillow requis ; rien n'est envoyé en ligne)
# À relancer quand un écran change. « planche-recue », « espace » et « mon-espace » demandent le faux script (mockgs.py).
import asyncio, sys, subprocess, time, json, io, os, urllib.parse
from playwright.async_api import async_playwright
from PIL import Image
ROOT = sys.argv[1]; SEUL = sys.argv[2] if len(sys.argv) > 2 else ""; PORT = 8861
IMG = ROOT + "/eps-autonomie-numerique/guide/img/"
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", str(PORT), "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
gs = subprocess.Popen([sys.executable, "-I", "mockgs.py"], cwd=os.path.dirname(os.path.abspath(__file__))); time.sleep(1.5)
B = "http://localhost:%d/eps-autonomie-numerique/" % PORT; G = "http://127.0.0.1:8899/exec"
SH = "localStorage.setItem('eps.share.v1',JSON.stringify({url:'" + G + "',key:'CLE'}));"
TEACH = "try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.console.trust','1');" + SH + "}catch(e){}"
ELEVE = "try{localStorage.removeItem('eps.teach.until');localStorage.removeItem('eps.console.trust');" + SH + "}catch(e){}"
APPS = [("acro", "acrosport"), ("esc", "escalade"), ("ori", "orientation"), ("rel", "relais"), ("vol", "volley"), ("bad", "badminton"), ("dan", "danse"), ("ct", "crosstraining"), ("bk", "basket"), ("step", "step"), ("ccf", "ccf")]
DEMO = "()=>{const b=[...document.querySelectorAll('button')].find(x=>/DÉMO/.test(x.innerText)&&x.offsetParent);if(b){b.click();return true}return false}"
faits = []
async def shot(pg, nom, w=920):
    if SEUL and SEUL != nom: return
    try:
        # la pastille « Leçon dans … » et les bandeaux de simulation ne font pas partie de l'écran à montrer
        await pg.evaluate("()=>document.querySelectorAll('#eps-simbar,.lc-chip').forEach(e=>e.style.display='none')")
        im = Image.open(io.BytesIO(await pg.screenshot())).convert("RGB")
        if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        im.save(IMG + nom + ".jpg", quality=70, optimize=True, progressive=True); faits.append(nom); print("✓", nom, flush=True)
    except Exception as ex: print("✗", nom, str(ex)[:120], flush=True)
async def essai(nom, f):
    if SEUL and SEUL != nom and not nom.startswith("*"): return
    try: await f()
    except Exception as ex: print("✗", nom, str(ex)[:160], flush=True)
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        cp = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768}); await cp.add_init_script(TEACH)
        p = await cp.new_page(); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("(async()=>{var x=EPSD.demo.create();if(x&&x.then)await x})()"); await p.wait_for_timeout(1800); t0 = time.time()
        st = await cp.storage_state()
        ce = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768}, storage_state=st); await ce.add_init_script(ELEVE)
        e = await ce.new_page()
        # --- accueil, classe
        await p.reload(); await p.wait_for_timeout(2000); await shot(p, "accueil-prof")
        await e.goto(B); await e.wait_for_timeout(2000); await shot(e, "accueil-eleve")
        await e.goto(B + "acrosport/"); await e.wait_for_timeout(2500); await shot(e, "classe")
        # --- une capture élève et une capture enseignant par activité
        for k, d in APPS:
            async def el(k=k, d=d):
                await e.goto(B + d + "/"); await e.wait_for_timeout(2600)
                if k not in ("acro",): await e.evaluate(DEMO); await e.wait_for_timeout(1500)
                await shot(e, k + "-eleve")
            async def pr(k=k, d=d):
                await p.goto(B + d + "/"); await p.wait_for_timeout(3000)
                if k == "ccf":  # le CCF s'ouvre sur le choix de l'activité : on montre l'évaluation d'une activité
                    await p.evaluate("()=>{const b=[...document.querySelectorAll('button,.card,[onclick]')].find(x=>x.offsetParent&&/^\\s*Escalade/.test(x.innerText||''));if(b)b.click()}"); await p.wait_for_timeout(1500)
                await shot(p, k + "-prof")
            await essai(k + "-eleve", el); await essai(k + "-prof", pr)
        # --- espace enseignant commun (escalade) : onglets, fiches, leçon en cours, contrôle, ma classe, évaluation, bilans
        async def ens():
            await p.goto(B + "escalade/"); await p.wait_for_timeout(3000); await shot(p, "espace-prof")
            await p.evaluate("EPSLC.open('lec')"); await p.wait_for_timeout(1200)
            await p.evaluate("()=>{const b=[...document.querySelectorAll('[data-id],[data-open],.lc-item,.lc-card')].find(x=>x.offsetParent&&/Leçon|leçon/.test(x.innerText));if(b)b.click()}"); await p.wait_for_timeout(1200); await shot(p, "lecon-fiche")
            await p.goto(B + "escalade/"); await p.wait_for_timeout(2500); await p.evaluate("EPSLC.open('live')"); await p.wait_for_timeout(1500); await shot(p, "lecon-cours")
            await p.goto(B + "escalade/"); await p.wait_for_timeout(2500); await p.evaluate("EPSLC.controle({cls:EPSD.demo.nom})"); await p.wait_for_timeout(1800); await shot(p, "controle")
            await p.goto(B + "escalade/"); await p.wait_for_timeout(2500); await p.evaluate("EPSLC.classe({cls:EPSD.demo.nom})"); await p.wait_for_timeout(1800); await shot(p, "ma-classe")
            await p.goto(B + "escalade/"); await p.wait_for_timeout(2500); await p.click(".epst-nav button[data-t=eval]"); await p.wait_for_timeout(1500); await shot(p, "evaluation")
            await p.click(".epst-nav button[data-t=bil]"); await p.wait_for_timeout(1500); await shot(p, "bilans")
        await essai("*ens", ens)
        # --- outils
        async def outils():
            await p.goto(B + "tactique/?sport=volley"); await p.wait_for_timeout(2500); await shot(p, "planche-prof")
            await e.goto(B + "boite/"); await e.wait_for_timeout(2000); await shot(e, "outils")
            await p.goto(B + "attestation/"); await p.wait_for_timeout(2500); await shot(p, "attestation")
            await p.goto(B + "carnet/"); await p.wait_for_timeout(2500); await p.evaluate(DEMO); await p.wait_for_timeout(900)
            await p.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(x=>/Démo/.test(x.innerText)&&x.offsetParent);if(b)b.click()}"); await p.wait_for_timeout(1500); await shot(p, "carnet")
            await p.goto(B); await p.wait_for_timeout(2000)
            await p.evaluate("()=>{const b=document.querySelector('#eps-reglb,[data-eps-regl]')||[...document.querySelectorAll('button,a')].find(x=>/Réglages/.test(x.innerText)&&x.offsetParent);if(b)b.click()}"); await p.wait_for_timeout(1500); await shot(p, "partage")
        await essai("*outils", outils)
        # --- quiz : l'enseignant ouvre un quiz proposé, l'élève répond
        async def quiz():
            await p.goto(B + "quiz/"); await p.wait_for_timeout(1800); await p.click("[data-t=mes]"); await p.click("#ex"); await p.wait_for_timeout(500)
            await p.evaluate("()=>{const k='eps.quiz.v1',V=JSON.parse(localStorage.getItem(k)),u=Date.now();Object.values(V.items).forEach(q=>{if(q.k==='quiz'){q.on=1;q.u=u}});localStorage.setItem(k,JSON.stringify(V))}")
            st2 = await cp.storage_state(); cq = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768}, storage_state=st2); await cq.add_init_script(ELEVE)
            q = await cq.new_page(); await q.goto(B + "quiz/"); await q.wait_for_timeout(2000); await q.evaluate(DEMO); await q.wait_for_timeout(900)
            await q.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(x=>/Démo/.test(x.innerText)&&x.offsetParent);if(b)b.click()}"); await q.wait_for_timeout(900)
            await q.evaluate("()=>{const b=[...document.querySelectorAll('#pg button')].find(x=>x.offsetParent&&!/Accueil|Retour|Changer/.test(x.innerText));if(b)b.click()}"); await q.wait_for_timeout(900)
            await shot(q, "quiz"); await cq.close()
        await essai("quiz", quiz)
        # --- console (ordinateur)
        async def console():
            co = await b.new_context(service_workers="block", viewport={"width": 1440, "height": 900}, storage_state=await cp.storage_state()); await co.add_init_script(TEACH)
            c = await co.new_page(); await c.goto(B + "console/"); await c.wait_for_timeout(3500); await shot(c, "console", 1200); await co.close()
        await essai("console", console)
        # --- espace élève : publication (faux script), puis téléphone de l'élève
        async def espace():
            await p.goto(B + "espace/"); await p.wait_for_timeout(2500); await p.click("[data-c]")
            await p.click("[data-add=quiz]"); await p.click("[data-add=txt]"); await p.fill("[data-t='1']", "Regarde la vidéo de l'échauffement"); await p.keyboard.press("Tab"); await p.wait_for_timeout(200)
            await p.click("#pub"); await p.wait_for_timeout(12000); await p.evaluate("window.scrollTo(0,0)"); await shot(p, "espace")
            cd = await p.evaluate("(()=>{var I=JSON.parse(localStorage['eps.codes.v1']).items,k=Object.keys(I)[0];return I[k].c})()")
            ct = await b.new_context(service_workers="block", viewport={"width": 390, "height": 844}); t = await ct.new_page()
            await t.goto(B + "mon-bilan/#u=" + urllib.parse.quote(G, safe="")); await t.wait_for_timeout(800); await t.fill("#code", cd.lower()); await t.click("#go"); await t.wait_for_timeout(3500); await shot(t, "mon-espace", 390); await ct.close()
        await essai("*espace", espace)
        # --- planche reçue par une tablette d'équipe
        async def recue():
            cr = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768}); await cr.add_init_script("try{" + SH + "}catch(e){}")
            r = await cr.new_page(); await r.goto(B + "volley/"); await r.wait_for_timeout(6000)
            await p.goto(B + "tactique/?sport=volley"); await p.wait_for_timeout(3000); await p.fill("#nom", "Défense en W"); await p.click("#go")
            for _ in range(60):
                await r.wait_for_timeout(500)
                if await r.evaluate("!!document.querySelector('#eps-plan svg')"): break
            await shot(r, "planche-recue"); await cr.close()
        await essai("planche-recue", recue)
        # --- fiche de leçon côté élève : la leçon de démonstration s'ouvre toute seule 2 minutes après la création de la classe fictive
        async def lecon_eleve():
            await e.goto(B + "volley/"); await e.wait_for_timeout(2500); await e.evaluate(DEMO)
            reste = 150 - (time.time() - t0)
            if reste > 0: await e.wait_for_timeout(int(reste * 1000))
            await e.wait_for_timeout(4000); await shot(e, "lecon-eleve")
        await essai("lecon-eleve", lecon_eleve)
        await b.close()
    print(len(faits), "capture(s)")
asyncio.run(main()); srv.terminate(); gs.terminate()
