# 👁 Aperçu enseignant de l'espace EPS (mon-bilan/?apercu=1 et outil de la console) : élève fictif, puis classe + élève sans code, lecture seule.
# python3 t_apercu.py <racine du dépôt>
import asyncio,sys,subprocess,time
from playwright.async_api import async_playwright
ROOT=sys.argv[1]
srv=subprocess.Popen([sys.executable,"-I","-m","http.server","8833","--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
gs=subprocess.Popen([sys.executable,"-I","mockgs.py"]); time.sleep(1.5)
B="http://localhost:8833/eps-autonomie-numerique/"; G="http://127.0.0.1:8899/exec"
async def main():
    out=[]; errs=[]
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"])
        cp=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); await cp.add_init_script("try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.share.v1',JSON.stringify({url:'"+G+"',key:'CLE'}))}catch(e){}")
        p=await cp.new_page(); p.on("pageerror",lambda x:errs.append("prof "+str(x)[:200])); p.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        drops=[]; p.on("request",lambda r:drops.append(r.url) if ("8899" in r.url and r.method=="POST") else None)
        await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("(async()=>{var x=EPSD.demo.create();if(x&&x.then)await x})()"); await p.wait_for_timeout(1200)
        # une vraie classe (pas la classe fictive) de 3 élèves
        await p.evaluate("""(()=>{var K='eps.lists.v1',V=JSON.parse(localStorage[K]);V.items['t1']={id:'t1',nom:'2GT9',el:['Léa Martin','Hugo Petit','Zoé Durand'],st:{},rm:[],ts:Date.now()};localStorage[K]=JSON.stringify(V)})()""")
        await p.goto(B+"espace/"); await p.wait_for_timeout(2500)
        await p.click(".chip:has-text('2GT9')"); await p.click("[data-add=txt]"); await p.fill("[data-t='0']","Apporte ta tenue"); await p.keyboard.press("Tab"); await p.wait_for_timeout(300)
        await p.click("#pub"); await p.wait_for_timeout(10000)
        out.append(("0 espace publié pour 2GT9","Publié pour" in await p.evaluate("document.querySelector('#pm').textContent"),None))
        out.append(("1 bouton « Voir l'espace d'un élève » sur la page Espace élève",await p.evaluate("!!document.querySelector('#apercu')"),None))
        await p.click("#apercu"); await p.wait_for_timeout(1500)
        out.append(("2 choix : élève fictif + classe (classe fictive absente)",await p.evaluate("!!document.querySelector('#ap-demo') && [...document.querySelectorAll('#ap-c option')].some(o=>o.textContent==='2GT9') && ![...document.querySelectorAll('#ap-c option')].some(o=>/fictiv/i.test(o.textContent))"),await p.evaluate("[...document.querySelectorAll('#ap-c option')].map(o=>o.textContent)")))
        await p.click("#ap-demo"); await p.wait_for_timeout(400)
        out.append(("3 élève fictif : espace de démonstration + bandeau",await p.evaluate("document.querySelectorAll('.tk').length>=3 && document.querySelector('#st').textContent.includes('Aperçu enseignant')"),None))
        await p.screenshot(path="/home/claude/work/shots/apercu_demo.png")
        await p.click("#out"); await p.wait_for_timeout(300)
        await p.select_option("#ap-c","2GT9"); await p.wait_for_timeout(300); await p.select_option("#ap-e","Hugo Petit"); await p.click("#ap-go"); await p.wait_for_timeout(4000)
        out.append(("4 élève réel ouvert sans code",await p.evaluate("document.querySelector('#who').textContent")=="Hugo Petit · 2GT9" and "Apporte ta tenue" in await p.evaluate("document.querySelector('#res').innerText"),await p.evaluate("document.querySelector('#who').textContent")))
        await p.screenshot(path="/home/claude/work/shots/apercu_eleve.png")
        n0=len(drops); await p.click(".tk >> nth=0"); await p.wait_for_timeout(2500)
        out.append(("5 lecture seule : rien n'est envoyé ni gardé",len(drops)==n0 and not await p.evaluate("Object.keys(localStorage).some(k=>k.startsWith('eps.espace.me.'))"),len(drops)-n0))
        await p.evaluate("""()=>{let h=5381;for(const ch of 'relais:1234')h=((h<<5)+h+ch.charCodeAt(0))|0;localStorage.setItem('relais-vitesse-code-v1',JSON.stringify(String(h)))}""")
        await p.goto(B+"console/#app:mon-bilan"); await p.wait_for_timeout(2500)
        if await p.locator(".epp").count()==0 and await p.locator("#lock button").count(): await p.click("#lock button"); await p.wait_for_timeout(500)
        await p.keyboard.type("1234"); await p.wait_for_timeout(3500)
        if await p.locator("iframe").count()==0: await p.evaluate("location.hash='#app:mon-bilan'"); await p.wait_for_timeout(3000)
        fr=p.frame_locator("iframe")
        out.append(("6b la console ouvre l'aperçu (choix de l'élève)",await fr.locator("#ap-demo").count()==1,None))
        await p.screenshot(path="/home/claude/work/shots/apercu_console.png")
        out.append(("6 outil « Espace EPS des élèves » dans la console",await p.evaluate("!!document.querySelector('[data-go=\"app:mon-bilan\"]')"),None))
        # un élève (pas de mode enseignant) qui tape l'adresse : refusé
        ce=await b.new_context(service_workers="block",viewport={"width":390,"height":844}); await ce.add_init_script("try{localStorage.setItem('relais-vitesse-code-v1','\"123\"')}catch(e){}"); e=await ce.new_page(); e.on("pageerror",lambda x:errs.append("eleve "+str(x)[:200]))
        await e.goto(B+"mon-bilan/?apercu=1"); await e.wait_for_timeout(1500)
        out.append(("7 sans le mode enseignant : code demandé, aucun choix d'élève",await e.evaluate("!!document.querySelector('.epp') && !document.querySelector('#ap-c')"),None))
        out.append(("8 aucune erreur de page",not errs,errs))
        await b.close()
    bad=0
    for t,ok,x in out:
        print(("✓ " if ok else "✗ ")+t+("" if ok else "  → "+str(x))); bad+=0 if ok else 1
    print(bad,"échec(s)")
asyncio.run(main()); srv.terminate(); gs.terminate()
