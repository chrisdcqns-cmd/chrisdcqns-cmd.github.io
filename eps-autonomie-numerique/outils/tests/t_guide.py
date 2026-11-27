import asyncio,sys,subprocess,time,json
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; PORT=9355
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT
TEACH="try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3))}catch(e){}"
async def main():
    out=[]; errs=[]
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox","--disable-dev-shm-usage"])
        for nm,(w,h) in {"tab":(1024,768),"tel":(390,844),"ord":(1440,900)}.items():
            c=await b.new_context(service_workers="block",viewport={"width":w,"height":h},has_touch=nm!="ord"); await c.add_init_script(TEACH)
            p=await c.new_page(); p.on("pageerror",lambda x:errs.append(nm+" "+str(x)[:200]))
            p.on("response",lambda r:errs.append("HTTP%d %s"%(r.status,r.url[-50:])) if r.status>=400 else None)
            if nm=="tab":
                pass
            await p.goto(B+"guide/"); await p.wait_for_timeout(2500)
            n=await p.evaluate("document.querySelectorAll('#niv button').length"); a=await p.evaluate("document.querySelectorAll('#acts button').length")
            out.append((nm+" : 3 niveaux, 12 choix d'activité",n==3 and a==12,(n,a)))
            pass
            bad=[]; vides=[]
            for nk in "abc":
                await p.click("#niv [data-n=%s]"%nk)
                for ak in await p.evaluate("[...document.querySelectorAll('#acts button')].map(b=>b.dataset.a)"):
                    await p.click("#acts [data-a=%s]"%ak); await p.wait_for_timeout(120)
                    r=await p.evaluate("""()=>({ov:document.documentElement.scrollWidth>innerWidth+1,h3:document.querySelectorAll('#cur h3').length,toc:document.querySelectorAll('#toc a').length,txt:document.querySelector('#cur').innerText.length,
                      small:[...document.querySelectorAll('#app button,#app a.hb,.hd a')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height<44&&!e.closest('#toc')).map(e=>e.innerText.trim().slice(0,20)),
                      aide:document.querySelectorAll('#cur .aide>div').length})""")
                    if r["ov"] or r["small"]: bad.append((nk,ak,r["ov"],r["small"][:3]))
                    if r["h3"]<2 or r["h3"]!=r["toc"] or r["txt"]<300 or (nk=="c" and r["aide"]<4): vides.append((nk,ak,r))
            out.append((nm+" : 36 guides sans débordement ni petit bouton",not bad,bad[:4]))
            out.append((nm+" : chaque guide a son contenu et son sommaire",not vides,vides[:3]))
            # images toutes chargées
            await p.click("#niv [data-n=b]"); await p.click("#acts [data-a=gen]"); await p.wait_for_timeout(300)
            await p.evaluate("document.querySelectorAll('#cur img').forEach(i=>i.loading='eager')"); await p.wait_for_timeout(1500)
            ko=await p.evaluate("[...document.querySelectorAll('#cur img')].filter(i=>!i.naturalWidth).map(i=>i.src.split('/').pop())")
            out.append((nm+" : images affichées",not ko,ko))
            # recherche
            await p.fill("#q","mot de passe oublié"); await p.wait_for_timeout(300); k=await p.evaluate("document.querySelectorAll('#res button').length")
            await p.click("#res button >> nth=0"); await p.wait_for_timeout(400)
            out.append((nm+" : recherche → ouvre le bon guide",k>0 and await p.evaluate("/oubli/i.test(document.querySelector('#cur').innerText)"),k))
            # impression (fenêtre remplacée) : tout = 36 guides
            await p.evaluate("window.print=function(){window.__n=document.querySelectorAll('#print .g').length;window.__m=document.body.classList.contains('multi')}")
            await p.click("#pm"); await p.click("[data-p=tout]"); await p.wait_for_timeout(5500)
            out.append((nm+" : « Tous les guides » prépare 36 guides",await p.evaluate("window.__n")==36,await p.evaluate("window.__n")))
            if nm=="tab":
                await p.fill("#q",""); await p.click("#niv [data-n=a]"); await p.click("#acts [data-a=vol]"); await p.wait_for_timeout(1200); await p.evaluate("window.scrollTo(0,0)"); pass
                await p.emulate_media(media="print"); await p.pdf(path="guide-eleve-volley.pdf",format="A4") if False else None
            await c.close()
        # sans code : fermé
        c=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); p=await c.new_page(); await p.goto(B+"guide/"); await p.wait_for_timeout(2500)
        out.append(("sans le code enseignant : guide fermé",await p.evaluate("document.querySelector('#app').hidden")==True,None))
        await b.close()
    out.append(("aucune erreur de page",not errs,errs[:5]))
    for o in out: print("✓" if o[1] else "✗",o[0],"" if o[1] else o[2])
asyncio.run(main()); srv.terminate()
