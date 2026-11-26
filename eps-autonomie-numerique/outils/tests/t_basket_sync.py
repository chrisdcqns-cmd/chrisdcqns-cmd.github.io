# Basket-ball : deux tablettes et le faux script (équipes, rencontres, score en direct). python3 t_basket_sync.py <racine du dépôt>
import asyncio,sys,subprocess,time,json,urllib.request
from playwright.async_api import async_playwright
ROOT=sys.argv[1]
srv=subprocess.Popen([sys.executable,"-I","-m","http.server","8842","--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
gs=subprocess.Popen([sys.executable,"-I","mockgs.py"]); time.sleep(1.5)
B="http://localhost:8842/eps-autonomie-numerique/"; G="http://127.0.0.1:8899/exec"
NOMS=["Lina MARTIN","Noah PETIT","Emma DURAND","Hugo LEROY","Jade MOREAU","Louis SIMON","Chloé LAURENT","Adam MICHEL"]
SEED="try{localStorage.setItem('eps.share.v1',JSON.stringify({url:'"+G+"',key:'CLE'}));if(!localStorage.getItem('eps.lists.v1'))localStorage.setItem('eps.lists.v1',JSON.stringify({items:{c1:{id:'c1',nom:'2GT1 TEST',el:"+json.dumps(NOMS)+",ts:1}},pend:{},app:{}}));"
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"])
        urllib.request.urlopen("http://127.0.0.1:8899/ctl?reset=1&fail=0&old=0&nochk=0").read()
        cp=await b.new_context(service_workers="block"); await cp.add_init_script(SEED+"localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));}catch(e){}")
        ce=await b.new_context(service_workers="block"); await ce.add_init_script(SEED+"}catch(e){}")
        errs=[]
        p=await cp.new_page(); p.on("pageerror",lambda x:errs.append(str(x)[:200])); await p.goto(B+"basket/"); await p.wait_for_timeout(3000)
        e=await ce.new_page(); e.on("pageerror",lambda x:errs.append(str(x)[:200])); await e.goto(B+"basket/"); await e.wait_for_timeout(3000)
        await p.click(".epst-nav button[data-t=cls]"); await p.fill("#eqN","2"); await p.click("[data-act=eqHasard]"); await p.wait_for_timeout(500)
        await p.click(".epst-nav button[data-t=seq]"); await p.click("#modeBar [data-m='4']"); await p.click("[data-act=renc]")
        ok=False
        for i in range(30):
            await e.wait_for_timeout(2000)
            try: await e.evaluate("EPSD.syncSoon&&EPSD.syncSoon()")
            except Exception: pass
            if await e.evaluate("(()=>{try{const I=JSON.parse(localStorage['bk.v1']||'{}').items||{};return !!I['e|2gt1test']&&Object.keys(I).some(k=>k.startsWith('j|')&&I[k].r)}catch(x){return false}})()"): ok=True; break
        print(await e.evaluate("(()=>{const v=JSON.parse(localStorage['bk.v1']||'{}');return JSON.stringify([Object.keys(v.items||{}),v.since,Object.keys(v.pend||{})])})()"))
        print(("✓" if ok else "✗"),"équipes et rencontres de l'enseignant arrivées sur la tablette élève, après",(i+1)*2,"s")
        await e.get_by_text("2GT1 TEST").first.click(); await e.wait_for_timeout(600); await e.click("[data-act=eq] >> nth=0"); await e.wait_for_timeout(400)
        md=await e.evaluate("document.querySelector('.pastille').textContent"); print(("✓" if md=="4 contre 4" else "✗"),"forme du jour reçue :",md)
        await e.click("[data-act=matchRot] >> nth=0"); await e.wait_for_timeout(300); await e.click("[data-act=pt][data-e='0'][data-i='1']"); await e.wait_for_timeout(200); await e.click("[data-act=qui] >> nth=0")
        ok=False
        for i in range(30):
            await p.wait_for_timeout(2000)
            try: await p.evaluate("EPSD.syncSoon&&EPSD.syncSoon()")
            except Exception: pass
            if "3 – 0" in await p.evaluate("document.querySelector('#vue').innerText"): ok=True; break
        print(await p.evaluate("(()=>{const v=JSON.parse(localStorage['bk.v1']||'{}');return JSON.stringify([Object.keys(v.items||{}).map(k=>k+':'+(v.items[k].sa||'')),Object.keys(v.pend||{})])})()"), await e.evaluate("JSON.stringify(Object.keys(JSON.parse(localStorage['bk.v1']).pend))"))
        print(("✓" if ok else "✗"),"score de la tablette élève visible chez l'enseignant sans recharger, après",(i+1)*2,"s")
        tabs=await p.evaluate("EPSD.plan.tabs().map(t=>t.nom)"); print("tablettes vues par l'enseignant :",tabs)
        print(("✓" if not errs else "✗"),"aucune erreur de page",errs)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate(); gs.terminate()
