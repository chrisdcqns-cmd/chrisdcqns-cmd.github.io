import asyncio,sys,subprocess,time,json,urllib.request
from playwright.async_api import async_playwright
ROOT=sys.argv[1]
srv=subprocess.Popen([sys.executable,"-I","-m","http.server","8831","--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
gs=subprocess.Popen([sys.executable,"-I","mockgs.py"]); time.sleep(1.5)
B="http://localhost:8831/eps-autonomie-numerique/"; G="http://127.0.0.1:8899/exec"
def ctl(q=""): return json.loads(urllib.request.urlopen("http://127.0.0.1:8899/ctl?"+q).read())
def npre(pre): return len([k for k in ctl()["keys"] if k.startswith(pre)])
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"])
        for app,pre in (("volley","v:"),("badminton","b:")):
            ctx=await b.new_context(service_workers="block")
            await ctx.add_init_script("try{localStorage.setItem('eps.gate.step2','0');localStorage.setItem('eps.demo.eleve','1');localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3))}catch(e){}")
            p=await ctx.new_page(); p.on("dialog",lambda d:asyncio.ensure_future(d.accept())); errs=[]; p.on("pageerror",lambda e:errs.append(str(e)[:150]))
            await p.goto(B); await p.wait_for_timeout(1200); await p.evaluate("async()=>{await EPSD.demo.create()}")
            ctl("reset=1&fail=1&old=0&nochk=0"); await p.evaluate("(g)=>localStorage.setItem('eps.share.v1',JSON.stringify({url:g,key:'CLE'}))",G)
            await p.goto(B+app+"/"); await p.wait_for_timeout(3000)
            prefix=await p.evaluate("()=>SYC().pre")
            await p.evaluate("async()=>{for(let i=0;i<80&&syBusy;i++)await new Promise(r=>setTimeout(r,250));await syCycle();for(let i=0;i<80&&syBusy;i++)await new Promise(r=>setTimeout(r,250))}")
            a=await p.evaluate("()=>Object.keys(SY.pend).length"); s1=npre(prefix)
            ctl("fail=0"); await p.evaluate("async()=>{for(let i=0;i<80&&syBusy;i++)await new Promise(r=>setTimeout(r,250));await syCycle();for(let i=0;i<80&&syBusy;i++)await new Promise(r=>setTimeout(r,250))}"); await p.evaluate("async()=>{for(let i=0;i<80&&syBusy;i++)await new Promise(r=>setTimeout(r,250));await syCycle();for(let i=0;i<80&&syBusy;i++)await new Promise(r=>setTimeout(r,250))}")
            c=await p.evaluate("()=>Object.keys(SY.pend).length"); s2=npre(prefix)
            ok=a>0 and s1==0 and c==0 and s2>=a
            print("✓" if ok else "✗",app,f": script en échec → {a} en attente, {s1} reçu ; script rétabli → {c} en attente, {s2} reçus",errs[:2])
            await ctx.close()
        # Danse
        ctx=await b.new_context(service_workers="block")
        await ctx.add_init_script("try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3))}catch(e){}")
        p=await ctx.new_page(); p.on("dialog",lambda d:asyncio.ensure_future(d.accept())); errs=[]; p.on("pageerror",lambda e:errs.append(str(e)[:150]))
        await p.goto(B); await p.wait_for_timeout(1200); await p.evaluate("async()=>{await EPSD.demo.create()}")
        ctl("reset=1&fail=1"); await p.evaluate("(g)=>localStorage.setItem('eps.share.v1',JSON.stringify({url:g,key:'CLE'}))",G)
        await p.goto(B+"danse/"); await p.wait_for_timeout(4500); await p.evaluate("async()=>{await synchroniser()}")
        a=await p.evaluate("()=>[Object.keys(SY.p||{}).length,Object.keys(SY.c||{}).length]"); s1=npre("danse|")
        ctl("fail=0"); await p.wait_for_timeout(16000); await p.evaluate("async()=>{await synchroniser()}"); await p.wait_for_timeout(800); await p.evaluate("async()=>{await synchroniser()}")
        c=await p.evaluate("()=>[Object.keys(SY.p||{}).length,Object.keys(SY.c||{}).length]"); s2=npre("danse|")
        ok=a[1]>0 and s1==0 and c==[0,0] and s2>=a[1]
        print("✓" if ok else "✗","danse",f": script en échec → {a[1]} à confirmer, {s1} reçu ; script rétabli → {c} en attente/à confirmer, {s2} reçus",errs[:2])
        await ctx.close(); await b.close()
asyncio.run(main()); srv.terminate(); gs.terminate()
