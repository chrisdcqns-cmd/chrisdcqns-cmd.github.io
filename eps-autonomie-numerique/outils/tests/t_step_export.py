# Step : export de la chorégraphie (PDF, vidéo) sur la tablette, et chorégraphie publiée dans l'espace élève (téléphone, faux script).
# python3 t_step_export.py <racine du dépôt> [dossier des fichiers produits]
import asyncio,sys,subprocess,time,base64,urllib.parse
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; OUT=sys.argv[2] if len(sys.argv)>2 else None
srv=subprocess.Popen([sys.executable,"-I","-m","http.server","8834","--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
gs=subprocess.Popen([sys.executable,"-I","mockgs.py"]); time.sleep(1.5)
B="http://localhost:8834/eps-autonomie-numerique/"; G="http://127.0.0.1:8899/exec"
LIRE="fetch(document.querySelector('#epsstep a.dl').href).then(r=>r.arrayBuffer()).then(a=>{var u=new Uint8Array(a),s='';for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s)})"
async def main():
    out=[]; errs=[]
    def ok(t,c,x=None): out.append((t,bool(c),x))
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox","--autoplay-policy=no-user-gesture-required"])
        # ---- tablette élève : composer, exporter
        ca=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); a=await ca.new_page(); a.on("pageerror",lambda x:errs.append("tablette "+str(x)[:200]))
        await a.goto(B+"step/"); await a.wait_for_timeout(2500); await a.evaluate("EPSD.listSave('2GT1',['Lea Durand','Hugo Martin','Ines Petit'],[])"); await a.reload(); await a.wait_for_timeout(2500)
        await a.locator(".epsg button",has_text="2GT1").first.click(); await a.wait_for_timeout(450); await a.evaluate("(()=>{const b=document.querySelector('.epsg2 [data-go=g]');if(b)b.click()})()"); await a.wait_for_timeout(300)
        await a.click("[data-act=grpNom][data-i='0']"); await a.click("[data-act=grpNom][data-i='1']"); await a.click("[data-act=grpOk]"); await a.wait_for_timeout(200)
        for n in ("Basic","V step","Mambo"):
            await a.click("[data-act=blAjout]"); await a.locator("#calque .pas",has_text=n).first.click(); await a.wait_for_timeout(120)
        await a.click("[data-act=blSym]"); await a.click("[data-act=blNouveau]")
        for n in ("Dégagé bas","Genou"):
            await a.click("[data-act=blAjout]"); await a.locator("#calque .pas",has_text=n).first.click(); await a.wait_for_timeout(120)
        await a.click("[data-act=blJouer]"); await a.wait_for_timeout(600); fs=await a.evaluate("parseFloat(getComputedStyle(document.querySelector('#plNom')).fontSize)"); await a.click("[data-act=fermer]")
        ok("1 lecteur : nom du pas en grand (au moins 34 px)",fs>=34,fs)
        await a.click("[data-act=blExport]"); await a.wait_for_selector("#epsstep #es-pdf",timeout=8000)
        sel=await a.evaluate("[...document.querySelectorAll('#epsstep [data-sel]')].map(b=>b.textContent)")
        ok("2 export : toute la chorégraphie ou bloc par bloc",sel==["Toute la chorégraphie","Bloc 1","Bloc 2"],sel)
        await a.click("#es-pdf"); await a.wait_for_selector("#epsstep a.dl",timeout=30000); pdf=base64.b64decode(await a.evaluate(LIRE)); nom=await a.get_attribute("#epsstep a.dl","download")
        ok("3 PDF de toute la chorégraphie",pdf[:5]==b"%PDF-" and len(pdf)>20000 and nom.endswith(".pdf"),(len(pdf),nom))
        if OUT: open(OUT+"/choregraphie.pdf","wb").write(pdf)
        await a.click("#epsstep [data-sel='1']"); await a.click("#es-pdf"); await a.wait_for_selector("#epsstep a.dl",timeout=30000); pdf2=base64.b64decode(await a.evaluate(LIRE))
        ok("4 PDF d'un seul bloc (plus petit)",pdf2[:5]==b"%PDF-" and len(pdf2)<len(pdf),(len(pdf2),len(pdf)))
        await a.click("#es-vid"); await a.wait_for_selector("#epsstep a.dl",timeout=90000); vid=base64.b64decode(await a.evaluate(LIRE)); nomv=await a.get_attribute("#epsstep a.dl","download")
        ok("5 vidéo d'un bloc",len(vid)>50000 and nomv.split(".")[-1] in("mp4","webm") and await a.locator("#epsstep video").count()==1,(len(vid),nomv))
        if OUT: open(OUT+"/bloc."+nomv.split(".")[-1],"wb").write(vid)
        ok("6 aucun débordement",await a.evaluate("document.querySelector('#epsstep').scrollWidth-innerWidth")<=2)
        don=await a.evaluate("donneesExport('2GT1',S.groupe.k)"); await a.click("#es-x"); ok("7 fermeture",await a.locator("#epsstep").count()==0)
        # ---- enseignant : la chorégraphie part dans l'espace de l'élève
        cp=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); await cp.add_init_script("try{localStorage.setItem('eps.gate.step2','0');localStorage.setItem('eps.sec','0');localStorage.setItem('eps.demo.eleve','1');localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.share.v1',JSON.stringify({url:'"+G+"',key:'CLE'}))}catch(e){}")
        p=await cp.new_page(); p.on("pageerror",lambda x:errs.append("prof "+str(x)[:200])); p.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("(async()=>{var x=EPSD.demo.create();if(x&&x.then)await x})()"); await p.wait_for_timeout(1200)
        await p.goto(B+"step/"); await p.wait_for_timeout(3000)
        await p.evaluate("""()=>{var cls=EPSD.demo.nom||'DÉMO (fictive)'; if(typeof cls==='function') cls=cls(); var L=EPSL.items().filter(i=>i.nom===cls)[0], n=EPSL.people(L).map(x=>x.full).slice(0,2);
          var b={id:'t1',c:cls,gk:'g1',noms:n,nom:'Bloc 1',items:[{p:'v-basic',m:0},{p:'v-mambo',m:1}],sym:1,bpm:126,d:auj()}; stPut('b|'+cls+'|g1|t1',b); return n}""")
        await p.goto(B+"espace/"); await p.wait_for_timeout(2500); await p.click("[data-mode=prep]"); await p.wait_for_timeout(300); await p.click("[data-c]"); await p.click("[data-add=txt]"); await p.fill("[data-t='0']","Revois ta chorégraphie"); await p.keyboard.press("Tab"); await p.wait_for_timeout(200)
        await p.click("#pub"); await p.wait_for_timeout(12000); ok("8 espace élève publié","Publié pour" in await p.evaluate("document.querySelector('#pm').textContent"),await p.evaluate("document.querySelector('#pm').textContent"))
        cd=await p.evaluate("""()=>{var I=JSON.parse(localStorage['eps.codes.v1']).items,b=JSON.parse(localStorage['step.v1']).items,k=Object.keys(b).filter(x=>x.indexOf('b|')===0&&b[x].id==='t1')[0],n=b[k].noms[0],f=s=>String(s).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean).sort().join(' ');
          var o=Object.keys(I).map(x=>I[x]).filter(x=>x&&x.c&&f(x.n)===f(n))[0]; return o?[o.c,o.n]:null}""")
        ce=await b.new_context(service_workers="block",viewport={"width":390,"height":844}); e=await ce.new_page(); e.on("pageerror",lambda x:errs.append("eleve "+str(x)[:200]))
        await e.goto(B+"mon-bilan/#u="+urllib.parse.quote(G,safe="")); await e.wait_for_timeout(800); await e.fill("#code",(cd or ["?"])[0].lower()); await e.click("#go"); await e.wait_for_timeout(3500)
        await e.click("[data-tab=acts]"); await e.wait_for_timeout(200); acts=await e.evaluate("[...document.querySelectorAll('.act b')].map(x=>x.textContent)")
        ok("9 téléphone : l'activité Step apparaît","Step" in acts,(cd,acts))
        if "Step" in acts:
            await e.locator(".act",has_text="Step").first.click(); await e.wait_for_timeout(200); await e.click("#stepgo"); await e.wait_for_selector("#epsstep #es-cv",timeout=8000)
            ok("10 téléphone : la chorégraphie s'ouvre",await e.locator("#epsstep canvas").count()==1)
            await e.click("#es-play"); await e.wait_for_timeout(2500)
            if OUT: await e.screenshot(path=OUT+"/telephone.png")
            await e.click("#es-play"); await e.click("#es-pdf"); await e.wait_for_selector("#epsstep a.dl",timeout=30000); pdf3=base64.b64decode(await e.evaluate(LIRE))
            ok("11 téléphone : PDF fabriqué sur l'appareil",pdf3[:5]==b"%PDF-",len(pdf3)); ok("12 téléphone : aucun débordement",await e.evaluate("document.querySelector('#epsstep').scrollWidth-innerWidth")<=2)
        ok("13 aucune erreur de page",not errs,errs)
        await b.close()
    bad=0
    for t,c,x in out:
        print(("✓ " if c else "✗ ")+t+("" if c else "  → "+str(x))); bad+=0 if c else 1
    print(bad,"échec(s)")
try: asyncio.run(main())
finally: srv.terminate(); gs.terminate()
