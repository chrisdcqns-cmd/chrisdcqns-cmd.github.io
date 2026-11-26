# Planche tactique : l'enseignant envoie, une tablette élève la reçoit (faux script). python3 t_planche.py <racine du dépôt>
import asyncio,sys,subprocess,time,json,urllib.request
from playwright.async_api import async_playwright
ROOT=sys.argv[1]
srv=subprocess.Popen([sys.executable,"-I","-m","http.server","8831","--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
gs=subprocess.Popen([sys.executable,"-I","mockgs.py"]); time.sleep(1.5)
B="http://localhost:8831/eps-autonomie-numerique/"; G="http://127.0.0.1:8899/exec"
SH="localStorage.setItem('eps.share.v1',JSON.stringify({url:'"+G+"',key:'CLE'}));"
async def main():
    out=[]
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"])
        urllib.request.urlopen("http://127.0.0.1:8899/ctl?reset=1&fail=0&old=0&nochk=0").read()
        cp=await b.new_context(service_workers="block"); await cp.add_init_script("try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));"+SH+"}catch(e){}")
        ce=await b.new_context(service_workers="block"); await ce.add_init_script("try{"+SH+"}catch(e){}")
        c3=await b.new_context(service_workers="block"); await c3.add_init_script("try{"+SH+"}catch(e){}")
        e=await ce.new_page(); await e.goto(B+"volley/"); e3=await c3.new_page(); await e3.goto(B+"badminton/")
        p=await cp.new_page(); errs=[]; p.on("pageerror",lambda x:errs.append(str(x)[:200])); e.on("pageerror",lambda x:errs.append(str(x)[:200]))
        await p.goto(B+"tactique/?sport=volley"); await p.wait_for_timeout(3000)
        ide=await e.evaluate("JSON.parse(localStorage.getItem('eps.dev.v1')||'{}').id||''")
        # 1. à tous
        await p.fill("#nom","Test l'envoi"); await p.click("#go"); await p.wait_for_timeout(16000)
        out.append(("1 envoi à tous : reçu par les deux tablettes",await e.evaluate("!!document.querySelector('#eps-plan svg')") and await e3.evaluate("!!document.querySelector('#eps-plan svg')"),await p.evaluate("document.querySelector('#gst').textContent")))
        # 1b. en direct : l'enseignant ajoute un joueur, la tablette élève suit sans nouvel envoi
        n0=await e.evaluate("document.querySelectorAll('#eps-plan svg circle').length")
        bb=await p.locator("#board svg").bounding_box(); await p.evaluate("window.scrollTo(0,0)"); await p.click("[data-t=pa]"); bb=await p.locator("#board svg").bounding_box(); await p.mouse.click(bb["x"]+bb["width"]*.5,bb["y"]+bb["height"]*.2); await p.wait_for_timeout(11000)
        n1=await e.evaluate("document.querySelectorAll('#eps-plan svg circle').length")
        dbg=await p.evaluate("(()=>{var c=EPSD.plan.cur()||{};return [c.live,c.rv,c.d&&c.d.items.length,document.querySelectorAll('#board svg circle').length]})()")
        dbe=await e.evaluate("(()=>{var c=(JSON.parse(localStorage['eps.sig.v1']).items.plan)||{};return [c.live,c.rv,c.d&&c.d.items.length]})()")
        out.append(("1b en direct : le dessin ajouté arrive tout seul",n1==n0+1,(n0,n1,dbg,dbe)))
        # 2. retirer
        await p.click("#stop"); await p.wait_for_timeout(15000)
        out.append(("2 retirée des tablettes",not await e.evaluate("!!document.querySelector('#eps-plan')"),None))
        # 3. à une seule tablette
        r=await p.evaluate("(id)=>EPSD.plan.send({nom:'Une équipe',d:EPSTAC.depart('volley')},[id],5).then(()=>true)",ide); await p.wait_for_timeout(16000)
        out.append(("3 envoi à une tablette : elle seule la reçoit",bool(ide) and await e.evaluate("!!document.querySelector('#eps-plan svg')") and not await e3.evaluate("!!document.querySelector('#eps-plan')"),ide))
        out.append(("4 l'enseignant ne voit pas la planche par-dessus son écran",not await p.evaluate("!!document.querySelector('#eps-plan')"),None))
        out.append(("5 aucune erreur de page",not errs,errs))
        await b.close()
    bad=0
    for t,ok,x in out:
        print(("✓ " if ok else "✗ ")+t+("" if ok else "  → "+str(x))); bad+=0 if ok else 1
    print(bad,"échec(s)")
asyncio.run(main()); srv.terminate(); gs.terminate()
