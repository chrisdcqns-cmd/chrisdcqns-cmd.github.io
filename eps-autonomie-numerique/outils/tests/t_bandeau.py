# 📌 Bandeau cliquable et console sans mode élève (27/11/2026).
# 1) Dans chaque appli d'activité ouverte dans la console (?console=1, mode enseignant), chaque bouton du bandeau et du menu « Plus »
#    de chaque onglet : rien ne doit recouvrir les onglets, aucun bouton « Fermer » visible dans l'écran rangé sous le bandeau.
# 2) Console : aucun bouton « mode élève » visible ; OrienRun ouvre l'espace enseignant, CO-Évaluation l'espace enseignant (résultats).
# 3) Changer d'onglet referme l'écran rangé.
# python3 t_bandeau.py <racine du dépôt> [appli …]     (une ligne par bouton ; « PB » = problème ; 6 à 8 minutes)
import asyncio, sys, subprocess, time
from playwright.async_api import async_playwright
ROOT = sys.argv[1]; PORT = 8876
APPS = sys.argv[2:] or ["escalade", "relais", "volley", "badminton", "danse", "acrosport", "orientation", "crosstraining", "basket", "step", "ccf"]
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", str(PORT), "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:%d/eps-autonomie-numerique/" % PORT
TEACH = "try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.console.trust','1');localStorage.setItem('orienrun.tpw','eps');localStorage.setItem('coe.tpw',JSON.stringify('eps'))}catch(e){}"
# écrans fixes de grande taille qui recouvrent les onglets, ou écran rangé qui montre encore « Fermer »
BAD = """()=>{const nb=document.querySelector('.epst-nav').getBoundingClientRect().bottom,vis=e=>{const s=getComputedStyle(e);return s.display!='none'&&s.visibility!='hidden'};
 const big=[...document.body.children].filter(e=>{const s=getComputedStyle(e);if(s.position!='fixed'||!vis(e))return false;const r=e.getBoundingClientRect();return r.width*r.height>innerWidth*innerHeight*.3});
 const out=[];big.forEach(e=>{const r=e.getBoundingClientRect(),n=(e.id?'#'+e.id:'')+'.'+String(e.className).slice(0,30);
   if(r.top<nb-2)out.push('recouvre les onglets : '+n);});
 const D=[...document.body.children].filter(e=>e.classList&&e.classList.contains('epst-dock')&&vis(e));
 if(D[0]){const b=[...D[0].querySelectorAll('button[data-x],button.x')].filter(b=>/Fermer/.test(b.innerText)&&b.offsetParent);if(b.length)out.push('bouton Fermer visible : '+String(D[0].className).slice(0,30));}
 return {out,docked:D.length}}"""
LIST = "(()=>{const m=document.querySelector('.epst-acts [data-more]');if(m)m.click();const L=[...document.querySelectorAll('.epst-acts [data-a]')].map(b=>b.dataset.a+'|'+b.title).concat([...document.querySelectorAll('.epst-mn [data-g]')].map(b=>b.dataset.g+'|'+b.innerText.trim().replace(/\\s+/g,' ')));document.body.click();return L})()"
CLICK = "(i)=>{let b=document.querySelector('.epst-acts [data-a=\"'+i+'\"]');if(b){b.click();return 1}const m=document.querySelector('.epst-acts [data-more]');if(!m)return 0;m.click();b=document.querySelector('.epst-mn [data-g=\"'+i+'\"]');if(b){b.click();return 2}return 0}"
TAB = "(t)=>{const b=document.querySelector('.epst-nav button[data-t=\"'+t+'\"]');if(b)b.click()}"
ELEVE = "()=>[...document.querySelectorAll('button[onclick=\"quitT()\"],.lockbtn,button[onclick=\"lockApp()\"],#bLock,#eps-callb:not([title=\"Appels des élèves\"]),#profHome')].filter(b=>b.offsetParent&&getComputedStyle(b).display!='none').map(b=>(b.id||b.innerText||b.className).toString().trim().slice(0,24))"
async def main():
    pb = 0
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        c0 = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768}); await c0.add_init_script(TEACH)
        p = await c0.new_page(); await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("EPSD.demo.create()"); await p.wait_for_timeout(2500)
        st = await c0.storage_state(); await c0.close()
        c = await b.new_context(service_workers="block", viewport={"width": 1440, "height": 900}, storage_state=st); await c.add_init_script(TEACH)
        for app in APPS:
            p = await c.new_page(); errs = []; p.on("pageerror", lambda x, errs=errs: errs.append(str(x)[:160]))
            async def load():
                await p.goto(B + app + "/?console=1"); await p.wait_for_timeout(3200)
            await load()
            el = await p.evaluate(ELEVE)
            if el: pb += 1; print("PB", app, "bouton du mode élève visible dans la console :", el, flush=True)
            if not await p.evaluate("!!document.querySelector('html.epst-on .epst-nav')"):
                pb += 1; print("PB", app, "pas d'espace enseignant à l'ouverture dans la console", flush=True); await p.close(); continue
            tabs = await p.evaluate("[...document.querySelectorAll('.epst-nav button')].map(b=>b.dataset.t)")
            for t in tabs:
                if t in ("vue", "reg", "bib"): continue
                await p.evaluate(TAB, t); await p.wait_for_timeout(500)
                seen = set(); L = []
                for x in await p.evaluate(LIST):
                    i, lab = x.split("|", 1)
                    if i not in seen: seen.add(i); L.append((i, lab))
                for i, lab in L:
                    await load(); await p.evaluate(TAB, t); await p.wait_for_timeout(400)
                    await p.evaluate(CLICK, i); await p.wait_for_timeout(1500)
                    r = await p.evaluate(BAD)
                    if r["out"]: pb += 1; print("PB", app, t, lab[:34], "=>", " ; ".join(r["out"]), flush=True)
                    else: print("ok", app, t, lab[:34], "(rangé sous le bandeau)" if r["docked"] else "(dans la page)", flush=True)
                    if r["docked"]:
                        other = [x for x in tabs if x not in (t, "vue")][0]
                        await p.evaluate(TAB, other); await p.wait_for_timeout(500)
                        if (await p.evaluate(BAD))["docked"]: pb += 1; print("PB", app, t, lab[:34], "=> l'écran rangé reste affiché après un changement d'onglet", flush=True)
            if errs: pb += 1; print("PB", app, "erreurs de page :", sorted(set(errs))[:3], flush=True)
            await p.close()
        # CO-Évaluation dans la console : espace enseignant, pas « Qui es-tu ? »
        p = await c.new_page(); await p.goto(B + "co-eval/?console=1"); await p.wait_for_timeout(3500)
        t = await p.evaluate("document.querySelector('#app').innerText.slice(0,400)")
        if "Qui es-tu" in t or "Résultats" not in t: pb += 1; print("PB co-eval : écran élève dans la console :", t[:80].replace("\n", " "), flush=True)
        else: print("ok co-eval : espace enseignant (résultats) dans la console", flush=True)
        p = await c.new_page(); await p.goto(B + "orientation/?console=1"); await p.wait_for_timeout(3500)
        if not await p.evaluate("(()=>{var x=document.getElementById('prof');return !!x&&!x.classList.contains('hidden')})()"): pb += 1; print("PB orientation : pas dans l'espace enseignant", flush=True)
        else: print("ok orientation : espace enseignant dans la console", flush=True)
        await b.close()
    print("%d problème(s)" % pb, flush=True); return pb
try: rc = asyncio.run(main())
finally: srv.terminate()
sys.exit(1 if rc else 0)
