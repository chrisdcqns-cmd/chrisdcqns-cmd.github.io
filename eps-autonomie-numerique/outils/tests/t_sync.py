import asyncio,sys,subprocess,time,json,urllib.request
from playwright.async_api import async_playwright
ROOT=sys.argv[1]
srv=subprocess.Popen([sys.executable,"-I","-m","http.server","8830","--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
gs=subprocess.Popen([sys.executable,"-I","mockgs.py"]); time.sleep(1.5)
B="http://localhost:8830/eps-autonomie-numerique/"; G="http://127.0.0.1:8899/exec"
def ctl(q=""): return json.loads(urllib.request.urlopen("http://127.0.0.1:8899/ctl?"+q).read())
PUT="""(id)=>{const k='eps.obs.v1';let V=JSON.parse(localStorage.getItem(k)||'null');if(!V||!V.items)V={items:{},pend:{},since:0};const u=Date.now();V.items[id]={id:id,t:'note '+id,u:u};V.pend=V.pend||{};V.pend[id]=u;localStorage.setItem(k,JSON.stringify(V));return u}"""
PEND="()=>{const V=JSON.parse(localStorage.getItem('eps.obs.v1')||'{}');return {pend:Object.keys(V.pend||{}),essais:V.essais||{}}}"
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"])
        ctx=await b.new_context(service_workers="block")
        await ctx.add_init_script("try{localStorage.setItem('eps.gate.step2','0');localStorage.setItem('eps.sec','0');localStorage.setItem('eps.demo.eleve','1');localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));if(!localStorage.getItem('eps.share.v1'))localStorage.setItem('eps.share.v1',JSON.stringify({url:'"+G+"',key:'CLE'}))}catch(e){}")
        p=await ctx.new_page(); await p.goto(B); await p.wait_for_timeout(2500)
        async def cycle(n=1):
            for _ in range(n):
                await p.evaluate("()=>document.getElementById('eps-sync')&&document.getElementById('eps-sync').click()"); await p.wait_for_timeout(5500)
        out=[]
        # 1. normal
        ctl("reset=1&fail=0&old=0&nochk=0"); await p.evaluate(PUT,"a1"); await cycle()
        st=await p.evaluate(PEND); out.append(("1 envoi normal",st["pend"]==[] and "ob|a1" in ctl()["keys"],st,ctl()["keys"]))
        # 2. le script échoue à l'enregistrement
        ctl("fail=1"); await p.evaluate(PUT,"b2"); await cycle()
        st=await p.evaluate(PEND); out.append(("2 échec du script : l'envoi reste en attente",st["pend"]==["b2"] and "ob|b2" not in ctl()["keys"],st,ctl()["keys"]))
        ctl("fail=0"); await cycle()
        st=await p.evaluate(PEND); out.append(("2b script rétabli : renvoyé et confirmé",st["pend"]==[] and "ob|b2" in ctl()["keys"],st,ctl()["keys"]))
        # 3. la confirmation ne répond pas
        ctl("nochk=1"); await p.evaluate(PUT,"c3"); await cycle()
        st=await p.evaluate(PEND); out.append(("3 confirmation sans réponse : reste en attente",st["pend"]==["c3"],st,None))
        ctl("nochk=0"); await cycle()
        st=await p.evaluate(PEND); out.append(("3b puis confirmé",st["pend"]==[] and "ob|c3" in ctl()["keys"],st,None))
        # 4. ancien script (sans confirmation) : comportement d'avant
        ctl("old=1"); await p.evaluate(PUT,"d4"); await cycle()
        st=await p.evaluate(PEND); out.append(("4 ancien script : comme avant",st["pend"]==[] and "ob|d4" in ctl()["keys"],st,None))
        # 5. hors ligne puis retour
        ctl("old=0"); await ctx.set_offline(True); await p.evaluate(PUT,"e5"); await p.wait_for_timeout(1500)
        st=await p.evaluate(PEND); a=st["pend"]==["e5"]; await ctx.set_offline(False); await p.wait_for_timeout(9000)
        st=await p.evaluate(PEND); out.append(("5 hors ligne puis retour du réseau, sans rien toucher",a and st["pend"]==[] and "ob|e5" in ctl()["keys"],st,None))
        # 6. échec durable : abandon après 8 essais (pas de boucle sans fin)
        ctl("fail=1"); await p.evaluate(PUT,"f6"); 
        for i in range(9): await cycle()
        st=await p.evaluate(PEND); out.append(("6 échec durable : 8 essais puis arrêt",st["pend"]==[],st,ctl()["posts"]))
        for o in out: print("✓" if o[1] else "✗",o[0],"" if o[1] else o[2:])
        await b.close()
asyncio.run(main()); srv.terminate(); gs.terminate()
