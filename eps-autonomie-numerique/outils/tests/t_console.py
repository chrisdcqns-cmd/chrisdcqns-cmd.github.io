# Console : code à l'ouverture, mode enseignant dans les applis (veille comprise), outils de leçon en direct masqués, import / export
import asyncio,sys,subprocess,time,json,os,tempfile
# python3 t_console.py <racine du dépôt> [applis…]   (2 à 3 minutes ; « 0 problème(s) » attendu)
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; PORT=8873
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT
DL=tempfile.mkdtemp(prefix="eps-x-"); KO=[]
def ok(c,m):
    print(("OK  " if c else "KO  ")+m,flush=True)
    if not c: KO.append(m)
VIS="""(s)=>[...document.querySelectorAll(s)].filter(e=>{const r=e.getBoundingClientRect();return r.width>2&&r.height>2&&getComputedStyle(e).visibility!='hidden'}).length"""
async def frame(p,d):
    await p.evaluate("location.hash='app:%s'"%d); await p.wait_for_timeout(4500)
    return [x for x in p.frames if x!=p.main_frame and ('console=' in x.url or x.url.endswith('/'+d+'/'))][0]
async def pin(p,code):
    for ch in code: await p.keyboard.press(ch); await p.wait_for_timeout(120)
    await p.wait_for_timeout(900)
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox","--disable-dev-shm-usage"])
        c=await b.new_context(service_workers="block",viewport={"width":1440,"height":900},accept_downloads=True)
        p=await c.new_page(); errs=[]; p.on("pageerror",lambda x:errs.append(str(x)[:200]))
        # préparation : code 1234, classe fictive, puis mode enseignant fermé
        await p.goto(B); await p.wait_for_timeout(2000)
        await p.evaluate("""()=>{let h=5381;for(const ch of 'relais:1234')h=((h<<5)+h+ch.charCodeAt(0))|0;localStorage.setItem('relais-vitesse-code-v1',JSON.stringify(String(h)));localStorage.setItem('eps.teach.until',String(Date.now()+3600e3))}""")
        await p.reload(); await p.wait_for_timeout(2000); await p.evaluate("EPSD.demo.create()"); await p.wait_for_timeout(2500)
        # ancien ordinateur « reconnu » + mode enseignant encore ouvert : le code doit quand même être demandé
        await p.evaluate("localStorage.setItem('eps.console.trust','1');localStorage.setItem('orienrun.tpw','motdepasse')")  # OrienRun : mot de passe de son script déjà connu de l'ordinateur
        await p.goto(B+"console/"); await p.wait_for_timeout(2500)
        ok(await p.evaluate(VIS,".epp")>0,"le pavé du code s'ouvre à l'ouverture de la console")
        ok(await p.evaluate("document.querySelector('#lock').style.display")!="none","console verrouillée tant que le code n'est pas donné")
        await pin(p,"9999"); ok(await p.evaluate("document.querySelector('#lock').style.display")!="none","mauvais code refusé")
        await pin(p,"1234"); await p.wait_for_timeout(1500)
        if await p.evaluate(VIS,".epp")>0: print("pavé encore là :",await p.evaluate("document.querySelector('.epp').innerText.slice(0,120)"))
        ok(await p.evaluate("document.querySelector('#lock').style.display")=="none","bon code : console ouverte")
        await p.reload(); await p.wait_for_timeout(2500)
        ok(await p.evaluate(VIS,".epp")==0 and await p.evaluate("document.querySelector('#lock').style.display")=="none","page rechargée : pas de nouveau code")
        # outils en direct masqués dans la console
        ok(await p.evaluate(VIS,"#eps-sigb,[data-sig]")==0,"accueil de la console : ni 📣 ni Signal général")
        for d in sys.argv[2:] or "escalade relais volley badminton danse acrosport orientation crosstraining basket step ccf".split():
            await p.evaluate("localStorage.setItem('eps.teach.until','0')")  # veille de l'ordinateur
            f=await frame(p,d); r=await f.evaluate("""()=>({t:typeof epsIsTeacher=='function'?!!epsIsTeacher():(Date.now()<+(localStorage.getItem('eps.teach.until')||0)),pin:!!document.querySelector('.epp'),nl:document.documentElement.classList.contains('eps-nolive'),txt:document.body.innerText.replace(/\\s+/g,' ').slice(0,60)})""")
            sig=await f.evaluate(VIS,"#eps-sigb,[data-sig],[data-plan],[data-act=planBar],button[onclick='EPSD.signal()']")
            pl=await f.evaluate("[...document.querySelectorAll('.epst-acts button')].filter(b=>/Planche tactique/.test(b.innerText)).length")
            ok(r["t"] and not r["pin"],"%s : mode enseignant sans code (après veille)%s"%(d,"" if r["t"] else " — "+r["txt"]))
            ok(r["nl"] and sig==0 and pl==0,"%s : signal et planche masqués (%d, %d)"%(d,sig,pl))
        # pilotage de leçon : Message à tous / Planche masqués
        f=await frame(p,"volley"); await f.evaluate("EPSLC.pilotage({})"); await p.wait_for_timeout(1200)
        ok(await f.evaluate(VIS,"[data-live]")>0 and await f.evaluate(VIS,"[data-sig],[data-plan]")==0,"pilotage de leçon : « Message à tous » et « Planche » masqués, le reste visible")
        # réglage : les retrouver
        await p.evaluate("location.hash='perso'"); await p.wait_for_timeout(1200); await p.locator("[data-live]").check(); await p.wait_for_timeout(3000)
        ok(await p.evaluate("!document.documentElement.classList.contains('eps-nolive')") ,"réglage « Outils de leçon en direct » coché : outils revenus")
        await p.evaluate("location.hash='perso'"); await p.wait_for_timeout(1200); await p.locator("[data-live]").uncheck(); await p.wait_for_timeout(3000)
        # ---------- import / export ----------
        await p.evaluate("""()=>{const K='eps.lecons.badminton.v1',KI='eps.lcimg.badminton.v1',V={items:{},pend:{},since:0},I={items:{},pend:{},since:0};
          I.items.im1={id:'im1',d:'data:image/png;base64,AAAA',u:5};
          V.items.L1={id:'L1',seq:'Séquence test',num:'1',titre:"Jeu long d'attaque",statut:'ok',ai:{},prog:[{c:'DÉMO (fictive)',at:Date.now()}],cls:['DÉMO (fictive)'],echImg:'im1',sits:[{t:'Dégagé fond de court',cons:'Par 2',ap:'dégagé',img:'im1'},{t:'Montée de volant',cons:'1 contre 1',ap:'jeu long'}],u:5};
          V.items.L2={id:'L2',seq:'Séquence test',num:'2',titre:'Jeu au filet',statut:'brouillon',ai:{},prog:[],sits:[{t:'Amorti',cons:'x',ap:'amorti'}],u:5};
          localStorage.setItem(K,JSON.stringify(V));localStorage.setItem(KI,JSON.stringify(I));localStorage.setItem('eps.console.ldir','badminton');
          localStorage.setItem('eps.eval.esc.v1',JSON.stringify({items:{cfg:{id:'cfg',u:5,autre:7,grid:{degres:['D1','D2','D3','D4'],criteres:[{id:'c1',afl:'AFL1',nom:'Grimper en tête',max:12,desc:['a','b','c','d']},{id:'c2',afl:'AFL2',nom:"S'entraîner",max:8,desc:['a','b','c','d']}]}}},pend:{},since:0}));}""")
        await p.evaluate("location.hash='transfert'"); await p.wait_for_timeout(1500)
        n0=await p.evaluate("document.querySelectorAll('[data-xi]').length"); ok(n0>=2,"Import / export : %d leçons de badminton listées"%n0)
        async with p.expect_download() as di: await p.locator("[data-xexp]").click()
        fl=os.path.join(DL,"lecons.json"); await (await di.value).save_as(fl); J=json.load(open(fl,encoding="utf-8"))
        L1=[l for l in J["lecons"] if l["id"]=="L1"][0]
        ok(J["type"]=="eps-export" and J["kind"]=="lecons" and J["app"]=="badminton","fichier de leçons au bon format")
        ok("prog" not in L1 and "cls" not in L1 and "DÉMO" not in json.dumps(J),"ni programmation ni classe dans le fichier")
        ok(J["imgs"].get("im1","").startswith("data:image"),"schéma joint au fichier")
        # import vers le volley
        await p.locator("[data-xf]").set_input_files(fl); await p.wait_for_timeout(800)
        dup=await p.evaluate("[...document.querySelectorAll('[data-li]')].filter(c=>!c.checked).length"); ok(dup==n0,"réimport dans la même activité : doublons repérés et décochés (%d)"%dup)
        await p.locator("[role=dialog] [data-xact]").select_option("volley"); await p.wait_for_timeout(400)
        nv0=await p.evaluate("Object.values(JSON.parse(localStorage.getItem('eps.lecons.volley.v1')||'{\"items\":{}}').items).filter(o=>!o.del).length")
        await p.locator("[role=dialog] [data-ok]").click(); await p.wait_for_timeout(1000)
        r=await p.evaluate("""()=>{const V=JSON.parse(localStorage.getItem('eps.lecons.volley.v1')),I=JSON.parse(localStorage.getItem('eps.lcimg.volley.v1')||'{"items":{}}');const L=Object.values(V.items).filter(o=>!o.del),a=L.find(l=>l.titre=="Jeu long d'attaque");
          return {n:L.length,id:a&&a.id,img:a&&a.echImg,imgok:!!(a&&I.items[a.echImg]&&I.items[a.echImg].d),same:a&&a.sits[0].img===a.echImg,pend:!!(a&&V.pend[a.id]),st:a&&a.statut,prog:a&&a.prog.length}}""")
        ok(r["n"]==nv0+n0 and r["id"]!="L1","leçons ajoutées au volley avec de nouveaux identifiants (%d → %d)"%(nv0,r["n"]))
        ok(r["imgok"] and r["img"]!="im1" and r["same"],"schéma recopié et renvois corrigés")
        ok(r["pend"] and r["st"]=="ok" and r["prog"]==0,"leçon en attente d'envoi aux tablettes, état gardé, sans programmation")
        # situations
        await p.locator("[data-xt=sits]").click(); await p.wait_for_timeout(600); await p.locator("[data-xact]").select_option("badminton"); await p.wait_for_timeout(600)
        ns=await p.evaluate("document.querySelectorAll('[data-xi]').length"); await p.locator("[data-xall]").check()
        async with p.expect_download() as di: await p.locator("[data-xexp]").click()
        fs=os.path.join(DL,"sits.json"); await (await di.value).save_as(fs); JS=json.load(open(fs,encoding="utf-8"))
        ok(JS["kind"]=="situations" and len(JS["sits"])==ns and ns>=3,"%d situations exportées"%ns)
        await p.locator("[data-xf]").set_input_files(fs); await p.wait_for_timeout(800); await p.locator("[role=dialog] [data-xact]").select_option("basket"); await p.wait_for_timeout(300)
        await p.locator("[role=dialog] [data-ok]").click(); await p.wait_for_timeout(1000)
        r=await p.evaluate("""()=>{const L=Object.values(JSON.parse(localStorage.getItem('eps.lecons.basket.v1')).items).filter(o=>!o.del&&/Situations importées/.test(o.titre||''));return {n:L.length,s:L[0]&&L[0].sits.length,st:L[0]&&L[0].statut,seq:L[0]&&L[0].seq}}""")
        ok(r["n"]==1 and r["s"]==ns and r["st"]=="brouillon","situations importées dans une nouvelle fiche du basket (%s)"%json.dumps(r,ensure_ascii=False))
        # évaluation
        await p.locator("[data-xt=eval]").click(); await p.wait_for_timeout(600)
        async with p.expect_download() as di: await p.locator("[data-xg='esc|grid']").click()
        fg=os.path.join(DL,"grille.json"); await (await di.value).save_as(fg); JG=json.load(open(fg,encoding="utf-8"))
        ok(JG["kind"]=="evaluation" and len(JG["grille"]["criteres"])==2,"grille d'escalade exportée")
        await p.locator("[data-xgi=step]").click(); await p.locator("[data-xf]").set_input_files(fg); await p.wait_for_timeout(800)
        ok(await p.evaluate("document.querySelector('[role=dialog] [data-xact]').value")=="step","import de grille : activité choisie proposée")
        await p.locator("[role=dialog] [data-vo]").select_option("gridPro"); await p.locator("[role=dialog] [data-ok]").click(); await p.wait_for_timeout(800)
        r=await p.evaluate("""()=>{const V=JSON.parse(localStorage.getItem('eps.eval.step.v1')),c=V.items.cfg;return {n:c.gridPro.criteres.length,g:!!c.grid,pend:!!V.pend.cfg}}""")
        ok(r["n"]==2 and r["pend"],"grille importée en step (voie pro), en attente d'envoi")
        ok(await p.evaluate("JSON.parse(localStorage.getItem('eps.eval.esc.v1')).items.cfg.autre")==7,"grille d'origine intacte")
        # mauvais fichier
        await p.locator("[data-xt=lecons]").click(); await p.wait_for_timeout(500); await p.locator("[data-xf]").set_input_files(fg); await p.wait_for_timeout(600)
        ok("pas des leçons" in await p.evaluate("document.querySelector('[data-xm]').textContent"),"mauvais type de fichier refusé avec un message clair")
        # paramètres
        await p.evaluate("""()=>{const V={items:{'badminton|x':{id:'badminton|x',v:5,u:5}},pend:{},since:0};localStorage.setItem('eps.param.v1',JSON.stringify(V))}""")
        await p.locator("[data-xt=tout]").click(); await p.wait_for_timeout(500)
        async with p.expect_download() as di: await p.locator("[data-xpe]").click()
        fp=os.path.join(DL,"p.json"); await (await di.value).save_as(fp); ok(json.load(open(fp))["params"]==[{"id":"badminton|x","v":5}],"paramètres exportés")
        await p.screenshot(path=os.path.join(DL,"import-export.png"))
        # la fiche importée s'ouvre dans l'atelier du volley, grille importée lisible dans l'appli
        f=await frame(p,"step"); 
        ok(len(errs)==0,"aucune erreur de page "+" | ".join(errs[:3]))
        # 2e onglet (nouvelle ouverture) : le code est redemandé ; ordinateur reconnu : non
        p2=await c.new_page(); await p2.goto(B+"console/"); await p2.wait_for_timeout(2500)
        ok(await p2.evaluate(VIS,".epp")>0,"nouvel onglet : code redemandé")
        await p2.evaluate("localStorage.setItem('eps.console.ask','0')"); await p2.reload(); await p2.wait_for_timeout(2500)
        ok(await p2.evaluate(VIS,".epp")==0 and await p2.evaluate("document.querySelector('#lock').style.display")=="none","« ordinateur reconnu » : ouverture sans code")
        await b.close()
    print("\n%d problème(s)"%len(KO))
asyncio.run(main()); srv.terminate()
