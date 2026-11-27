# CO Course : entrée enseignant (code à 4 chiffres, mot de passe du script une fois), console, téléphone d'élève. python3 t_coeval_entree.py <racine du dépôt>
import asyncio,sys,subprocess,time,tempfile,os
SH=tempfile.mkdtemp(prefix="eps-coe-")
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; PORT=8878
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT
CODE="let h=5381;for(const ch of 'relais:1234')h=((h<<5)+h+ch.charCodeAt(0))|0;localStorage.setItem('relais-vitesse-code-v1',JSON.stringify(String(h)));"
ST="({v:CUR.v,a:CUR.a,pwd:!!document.querySelector('#tp'),qui:/Qui est ton enseignant/.test(document.body.innerText),pin:!!document.querySelector('.epp')})"
KO=[]
def ok(c,m): print(("OK  " if c else "KO  ")+m); c or KO.append(m)
async def ctx(b,init,vp=(1440,900)):
    c=await b.new_context(service_workers="block",viewport={"width":vp[0],"height":vp[1]}); await c.add_init_script("try{if(!sessionStorage.getItem('x')){sessionStorage.setItem('x',1);"+CODE+init+"}}catch(e){}"); return c
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"]); errs=[]
        # 1 console, pas de mot de passe retenu
        c=await ctx(b,"localStorage.setItem('eps.console.ask','0');"); p=await c.new_page(); p.on("pageerror",lambda x:errs.append(str(x)[:200]))
        await p.goto(B+"console/#app:co-eval"); await p.wait_for_timeout(6000); f=[x for x in p.frames if x!=p.main_frame and 'co-eval' in x.url][0]
        r=await f.evaluate(ST); ok(r["v"]=="pwd" and r["pwd"] and not r["qui"] and not r["pin"],"console sans mot de passe retenu : écran enseignant (mot de passe du script une fois), pas « Qui es-tu ? » %s"%r)
        await p.screenshot(path=os.path.join(SH,"coe_pwd.png")); await c.close()
        # 2 console, mot de passe retenu
        c=await ctx(b,"localStorage.setItem('eps.console.ask','0');localStorage.setItem('coe.tpw',JSON.stringify('x'));"); p=await c.new_page(); p.on("pageerror",lambda x:errs.append(str(x)[:200]))
        await p.goto(B+"console/#app:co-eval"); await p.wait_for_timeout(6000); f=[x for x in p.frames if x!=p.main_frame and 'co-eval' in x.url][0]
        r=await f.evaluate(ST); ok(r["v"]=="prof" and r["a"]==["res"],"console avec mot de passe retenu : 📋 Résultats directement")
        st=await f.evaluate("(()=>{const s=getComputedStyle(document.getElementById('eps-upd'));return s.backgroundColor+'|'+s.borderStyle})()"); ok("239, 239, 239" not in st and "outset" not in st,"bouton 🔄 sans carré blanc (%s)"%st)
        await p.screenshot(path=os.path.join(SH,"coe_res.png")); await c.close()
        # 3 tablette, mode enseignant fermé, mot de passe retenu : écran élève, 🔒 → code 4 chiffres
        c=await ctx(b,"localStorage.setItem('coe.tpw',JSON.stringify('x'));",(1024,768)); p=await c.new_page(); p.on("pageerror",lambda x:errs.append(str(x)[:200]))
        await p.goto(B+"co-eval/"); await p.wait_for_timeout(4000); r=await p.evaluate(ST); ok(r["v"]!="prof","tablette sans mode enseignant : écran élève")
        await p.click("#hProf"); await p.wait_for_timeout(800); ok(await p.evaluate("!!document.querySelector('.epp')"),"🔒 : pavé du code à 4 chiffres")
        for ch in "9999": await p.keyboard.press(ch); await p.wait_for_timeout(100)
        await p.wait_for_timeout(800); ok((await p.evaluate(ST))["v"]!="prof","mauvais code refusé")
        for ch in "1234": await p.keyboard.press(ch); await p.wait_for_timeout(100)
        await p.wait_for_timeout(1500); r=await p.evaluate(ST); ok(r["v"]=="prof","bon code : espace enseignant (%s)"%r)
        await p.reload(); await p.wait_for_timeout(4000); r=await p.evaluate(ST); ok(r["v"]=="prof","rechargée en mode enseignant : espace enseignant directement")
        await c.close()
        # 4 téléphone d'élève : ni code ni mot de passe
        c=await b.new_context(service_workers="block",viewport={"width":390,"height":844}); p=await c.new_page(); await p.goto(B+"co-eval/"); await p.wait_for_timeout(4000)
        r=await p.evaluate(ST); ok(r["v"]!="prof","téléphone d'élève : écran élève")
        await p.click("#hProf"); await p.wait_for_timeout(1200); r=await p.evaluate(ST); ok(r["v"]=="pwd","téléphone d'élève, 🔒 : bloqué au mot de passe du script")
        ok(not errs,"aucune erreur "+str(errs[:2])); await b.close()
    print(len(KO),"problème(s)")
asyncio.run(main()); srv.terminate()
