# Délais du direct (signal, planche, planche en direct), tablette neuve, retour arrière élève, et rien en clair en ligne (faux script).
# python3 t_direct.py <racine du dépôt>   Les délais sont mesurés avec le faux script local : ajouter la latence de Google en vrai.
import asyncio,sys,subprocess,time,json,urllib.request,urllib.parse,os
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; PORT=8863
T=ROOT+"/eps-autonomie-numerique/outils/tests"
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
gs=subprocess.Popen([sys.executable,"-I","mockgs.py"],cwd=T); time.sleep(1.5)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT; G="http://127.0.0.1:8899/exec"
SH="localStorage.setItem('eps.share.v1',JSON.stringify({url:'"+G+"',key:'CLE'}));"
async def until(pg,js,maxs=40):
    t0=time.time()
    while time.time()-t0<maxs:
        if await pg.evaluate(js): return round(time.time()-t0,1)
        await pg.wait_for_timeout(200)
    return None
async def main():
    sent=[]
    class O(list):
        def append(self,o): list.append(self,o); print('✓' if o[1] else '✗',o[0],'' if o[1] else o[2],flush=True)
    out=O()
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox","--disable-dev-shm-usage"])
        urllib.request.urlopen("http://127.0.0.1:8899/ctl?reset=1&fail=0&old=0&nochk=0").read()
        cp=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); await cp.add_init_script("try{localStorage.setItem('eps.gate.step2','0');localStorage.setItem('eps.sec','0');localStorage.setItem('eps.demo.eleve','1');localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));"+SH+"}catch(e){}")
        cp.on("request",lambda r:sent.append((r.url,r.post_data or "")) if "8899" in r.url else None)
        p=await cp.new_page(); p.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("()=>{EPSD.demo.create()}"); await p.wait_for_timeout(4000); print("démo créée",flush=True)
        # la classe fictive ne part pas en ligne (demo) : on ajoute une vraie liste d'essai pour vérifier le chiffrement
        await p.evaluate("""()=>{const k='eps.lists.v1';const V=JSON.parse(localStorage.getItem(k));const u=Date.now();V.items.zz={id:'zz',nom:'2GT ESSAI',el:['Zorglub XANTIPPE','Maël D\\'ANGELO'],ts:u,u:u};V.pend=V.pend||{};V.pend.zz=u;localStorage.setItem(k,JSON.stringify(V))}""")
        for d in ("volley/","escalade/","basket/",""):
            await p.goto(B+d); await p.wait_for_timeout(5000)
        await p.evaluate("()=>document.getElementById('eps-sync')&&document.getElementById('eps-sync').click()"); await p.wait_for_timeout(6000)
        blob=" ".join(u+" "+d for u,d in sent)

        blob2=urllib.parse.unquote(blob)
        fuites=[n for n in ("Zorglub","XANTIPPE","ANGELO","Maël","2GT ESSAI") if n in blob2]
        out.append(("aucun nom ni classe en clair dans %d envois (%d ko)"%(len(sent),len(blob)//1000),not fuites,fuites))
        keys=json.loads(urllib.request.urlopen("http://127.0.0.1:8899/ctl").read())["keys"]
        out.append(("la liste d'essai est bien partie (chiffrée)",any(k.startswith("li") or "zz" in k for k in keys),keys[:12]))
        # tablette élève
        ce=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); await ce.add_init_script("try{"+SH+"}catch(e){}")
        e=await ce.new_page(); await e.goto(B+"volley/"); await e.wait_for_timeout(9000)
        await p.goto(B+"volley/"); await p.wait_for_timeout(4000)
        # signal
        await p.evaluate("()=>{EPSD.signal('Rassemblement',2,true)}"); d=await until(e,"!!document.getElementById('eps-sig')")
        out.append(("signal général reçu sur la tablette élève : %s s"%d,d is not None and d<=25,d))
        await e.evaluate("()=>{var b=document.querySelector('#eps-sig button');if(b)b.click()}")
        # planche
        await p.goto(B+"tactique/?sport=volley"); await p.wait_for_timeout(3000)
        await p.fill("#nom","Essai"); await p.click("#go"); d=await until(e,"!!document.querySelector('#eps-plan svg')")
        out.append(("planche tactique reçue : %s s"%d,d is not None and d<=25,d))
        n0=await e.evaluate("document.querySelectorAll('#eps-plan svg circle').length")
        await p.evaluate("window.scrollTo(0,0)"); await p.click("[data-t=pa]"); bb=await p.locator("#board svg").bounding_box(); await p.mouse.click(bb["x"]+bb["width"]*.5,bb["y"]+bb["height"]*.2)
        d=await until(e,"document.querySelectorAll('#eps-plan svg circle').length>%d"%n0)
        out.append(("planche en direct : le trait ajouté arrive en %s s"%d,d is not None and d<=12,d))
        # tablette neuve : récupère la liste d'essai
        cn=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); await cn.add_init_script("try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));"+SH+"}catch(e){}")
        n=await cn.new_page(); await n.goto(B); d=await until(n,"/2GT ESSAI/.test(localStorage.getItem('eps.lists.v1')||'')",40)
        out.append(("tablette neuve : la liste arrive toute seule en %s s"%d,d is not None,d))
        # hors ligne côté élève : la page reste utilisable, retour arrière bloqué
        await e.evaluate("history.back()"); await e.wait_for_timeout(600)
        out.append(("élève : le retour arrière ne quitte pas l'appli","/volley/" in e.url,e.url))
        await b.close()
asyncio.run(main()); srv.terminate(); gs.terminate()
