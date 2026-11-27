# Step : l'enseignant crée un pas et la leçon du jour, deux tablettes élèves composent, lancent et observent (faux script).
# python3 t_step.py <racine du dépôt> [dossier des captures]
import asyncio,sys,subprocess,time,urllib.request
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; SHOTS=sys.argv[2] if len(sys.argv)>2 else None
srv=subprocess.Popen([sys.executable,"-I","-m","http.server","8832","--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
gs=subprocess.Popen([sys.executable,"-I","mockgs.py"]); time.sleep(1.5)
B="http://localhost:8832/eps-autonomie-numerique/"; G="http://127.0.0.1:8899/exec"
SH="localStorage.setItem('eps.share.v1',JSON.stringify({url:'"+G+"',key:'CLE'}));"
NOMS=["Lea Durand","Hugo Martin","Ines Petit","Tom Leroy","Sarah Moreau","Noah Simon"]
LST="(n)=>EPSD.listSave('2GT1',n,[])"
async def large(pg): return await pg.evaluate("document.documentElement.scrollWidth-innerWidth")
async def main():
    out=[]; errs=[]
    def ok(t,c,x=None): out.append((t,bool(c),x))
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox","--autoplay-policy=no-user-gesture-required"])
        urllib.request.urlopen("http://127.0.0.1:8899/ctl?reset=1&fail=0&old=0&nochk=0").read()
        cp=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); await cp.add_init_script("try{localStorage.setItem('eps.gate.step2','0');localStorage.setItem('eps.demo.eleve','1');localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));"+SH+"}catch(e){}")
        ca=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); await ca.add_init_script("try{"+SH+"}catch(e){}")
        cb=await b.new_context(service_workers="block",viewport={"width":390,"height":844}); await cb.add_init_script("try{"+SH+"}catch(e){}")
        p=await cp.new_page(); a=await ca.new_page(); e=await cb.new_page()
        for n,x in (("prof",p),("A",a),("B",e)): x.on("pageerror",lambda er,n=n:errs.append(n+": "+str(er)[:240]))
        p.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        # ---- enseignant
        await p.goto(B+"step/"); await p.wait_for_timeout(2500); await p.evaluate(LST,NOMS); await p.wait_for_timeout(500); await p.reload(); await p.wait_for_timeout(3000)
        tabs=await p.evaluate("[...document.querySelectorAll('.epst-nav button')].map(b=>b.textContent.trim())")
        ok("1 espace enseignant : onglets communs",len(tabs)>=7,tabs)
        ok("1b l'espace enseignant s'ouvre sur 📍 Leçon",await p.evaluate("(document.querySelector('.epst-nav button.on')||{}).dataset.t")=="lec")
        await p.click(".epst-nav [data-t=seq]"); await p.wait_for_timeout(400)  # 27/11/2026 : on arrive sur « Leçon » ; les écrans de l'appli sont dans Séquence
        await p.click("[data-onglet=pas]"); n0=await p.locator("#vue .pas").count(); ok("2 pas vérifiés présents",n0==11,n0)
        await p.click("[data-act=edNouveau]"); await p.fill("#edNom","Pas de l'essai"); 
        async def pose(fx,fy):
            bb=await p.locator("#edSvg").bounding_box(); await p.mouse.click(bb["x"]+bb["width"]*fx,bb["y"]+bb["height"]*fy); await p.wait_for_timeout(120)
        await pose(.70,.33); await p.click("[data-act=edRot][data-d='45']"); await p.click("[data-act=edSuiv]")
        await p.click("[data-act=edCote][data-c=L]"); await pose(.30,.33); await p.click("[data-act=edRot][data-d='-45']"); await p.click("[data-act=edRot][data-d='-45']"); await p.click("[data-act=edSuiv]")
        await p.click("[data-act=edCote][data-c=R]"); await pose(.58,.75); await p.click("[data-act=edSuiv]")
        await p.click("[data-act=edCote][data-c=L]"); await pose(.42,.75); await p.click("[data-act=edEtat][data-v='4']"); await p.click("[data-act=edEtat][data-v='1']"); await p.click("[data-act=edSaut]")
        await p.fill("#edMot","Pointe"); await p.click("[data-act=edCopie][data-m='1']")
        if SHOTS: await p.screenshot(path=SHOTS+"/editeur.png",full_page=False)
        st=await p.evaluate("JSON.stringify(S.ed.p.c)")
        ok("3 éditeur : 8 temps remplis, miroir sur la 2e moitié",await p.evaluate("S.ed.p.c.filter(t=>t.L||t.R).length")==8 and await p.evaluate("S.ed.p.c[4].L&&S.ed.p.c[4].L.x===30&&S.ed.p.c[1].L.a===270&&S.ed.p.c[0].R.a===45&&S.ed.p.c[3].L.s===1&&S.ed.p.c[3].t==='Pointe'&&S.ed.p.c[3].j===1&&S.ed.p.c[7].j===1"),st)
        await p.click("[data-act=edEssai]"); await p.wait_for_timeout(3500); nom=await p.text_content("#plNom"); await p.click("[data-act=fermer]")
        ok("4 essai d'un pas non enregistré, retour à l'éditeur",nom in("Pas de l'essai","Prêt ?") and await p.locator("#edSvg").count()==1,nom)
        await p.click("[data-act=edOk]"); await p.wait_for_timeout(400); ok("5 pas enregistré",await p.locator("#vue .pas").count()==12)
        await p.click("[data-onglet=jour]"); await p.fill("#jCons","Compose un bloc de 4 pas."); await p.fill("#jBpm","abc"); await p.click("[data-act=jOk]"); await p.wait_for_timeout(200)
        ok("6 tempo non numérique refusé",await p.evaluate("!JSON.parse(localStorage['step.v1']).items['j|2GT1|'+auj()]"))
        await p.fill("#jBpm","132"); await p.select_option("#jFc","bloc"); await p.fill("#jFcMin","160"); await p.fill("#jFcMax","120"); await p.click("[data-act=jOk]"); await p.wait_for_timeout(200)
        ok("7a zone de fréquence cardiaque incohérente refusée",await p.evaluate("!JSON.parse(localStorage['step.v1']).items['j|2GT1|'+auj()]"))
        await p.fill("#jBpm","132"); await p.select_option("#jFc","bloc"); await p.fill("#jFcMin","120"); await p.fill("#jFcMax","160"); await p.click("[data-act=jOk]"); await p.wait_for_timeout(300)
        ok("7 leçon du jour enregistrée",await p.evaluate("(JSON.parse(localStorage['step.v1']).items['j|2GT1|'+auj()]||{}).bpm")==132)
        # tous les onglets communs sans erreur ni débordement
        deb=[]
        for i in range(len(tabs)):
            await p.locator(".epst-nav button").nth(i).click(); await p.wait_for_timeout(700)
            if "Vue" in tabs[i]:
                await p.keyboard.press("Escape"); await p.wait_for_timeout(200)
                fr=await p.evaluate("(()=>{var f=document.querySelector('iframe');return f?f.src:''})()"); 
                await p.evaluate("(()=>{var b=[...document.querySelectorAll('button')].find(x=>/Fermer|Quitter|✕/.test(x.textContent)&&x.offsetParent&&x.closest('[class*=vue],[id*=vue]'));if(b)b.click()})()")
            w=await large(p)
            if w>2: deb.append((tabs[i],w))
        ok("8 onglets enseignant sans débordement",not deb,deb)
        if SHOTS: await p.screenshot(path=SHOTS+"/prof.png")
        await p.wait_for_timeout(9000)
        # ---- tablette A
        await a.goto(B+"step/"); await a.wait_for_timeout(2500); await a.evaluate(LST,NOMS); await a.reload(); await a.wait_for_timeout(14000)
        g=await a.evaluate("[...document.querySelectorAll('.epsg button')].map(b=>b.textContent.trim().slice(0,30))")
        ok("9 élève : écran « Choisis ta classe » avec ressources",any("2GT1" in x for x in g) and any("pas" in x.lower() for x in g) and not await a.evaluate("document.documentElement.classList.contains('eps-teach')"),g)
        await a.locator(".epsg button",has_text="2GT1").first.click(); await a.wait_for_timeout(400); await a.evaluate("(()=>{const b=document.querySelector('.epsg2 [data-go=g]');if(b)b.click()})()"); await a.wait_for_timeout(300);
        await a.click("[data-act=grpNom][data-i='0']"); await a.click("[data-act=grpNom][data-i='1']"); await a.click("[data-act=grpOk]"); await a.wait_for_timeout(300)
        ok("10 leçon du jour reçue par la tablette (consigne, tempo verrouillé)","Compose un bloc" in await a.text_content("#vue") and await a.evaluate("document.querySelector('#bpmR').disabled") and "132" in await a.text_content("#bpmO"),await a.text_content("#bpmO"))
        for nomp in ("Basic","V step","Pas de l'essai","Genou","Dégagé bas","A step"):
            await a.click("[data-act=blAjout]"); await a.locator("#calque .pas",has_text=nomp).first.click(); await a.wait_for_timeout(150)
        await a.click("[data-act=blMir][data-i='1']")
        ok("11 bloc de 6 pas = 32 temps, bloc complet","32 temps sur 32" in await a.text_content("#vue") and "Bloc complet" in await a.text_content("#vue"))
        if SHOTS: await a.screenshot(path=SHOTS+"/bloc.png",full_page=True)
        await a.click("[data-act=blFiche]"); n=await a.locator("#calque .temps figure").count(); 
        if SHOTS: await a.screenshot(path=SHOTS+"/fiche.png",full_page=True)
        await a.click("[data-act=fermer]"); ok("12 fiche du bloc : un schéma par temps",n==32,n)
        await a.click("[data-act=blJouer]"); await a.wait_for_timeout(2600)
        await a.evaluate("window.__n=document.querySelector('#plSvg [data-pied=R] .pm'); window.__tr=new Set(); window.__iv=setInterval(()=>{var n=document.querySelector('#plSvg [data-pied=R] .pm'); if(n) __tr.add(n.getAttribute('transform'))},16)")
        await a.wait_for_timeout(1500); an=await a.evaluate("(()=>{clearInterval(__iv); return [document.querySelector('#plSvg [data-pied=R] .pm')===__n, __tr.size]})()")
        ok("12a lecteur : les pieds glissent d'une position à l'autre (positions intermédiaires)",an[0] and an[1]>=8,an)
        await a.click("[data-act=plDebut]"); vus=[]; t0=time.time()
        while time.time()-t0<9.5:
            vus.append(tuple(await a.evaluate("[document.querySelector('#plNom').textContent,document.querySelector('#plK').firstChild.textContent]")))  # lus ensemble (sinon un battement peut passer entre les deux)
            if SHOTS and len(vus)==40: await a.screenshot(path=SHOTS+"/lecteur.png")
            await a.wait_for_timeout(100)
        while vus and vus[0][0]!="Prêt ?": vus.pop(0)  # le temps que « ⏮ Début » relance le décompte
        noms=[]; 
        for x,_ in vus:
            if not noms or noms[-1]!=x: noms.append(x)
        ks=[]
        for x,k in vus:
            if x=="Basic" and (not ks or ks[-1]!=k): ks.append(k)
        ok("13 lecteur : décompte, compte des temps du pas, puis pas suivant tout seul",noms[:4]==["Prêt ?","Basic","V step","Pas de l'essai"] and ks==[str(i) for i in range(1,5)],(noms,ks))
        await a.click("[data-act=plPause]"); k1=await a.evaluate("document.querySelector('#plK').firstChild.textContent"); await a.wait_for_timeout(900); k2=await a.evaluate("document.querySelector('#plK').firstChild.textContent")
        ok("15 pause",k1==k2,(k1,k2)); await a.click("[data-act=fermer]"); await a.wait_for_timeout(200)
        ok("15a la mesure de fréquence cardiaque s'ouvre après le bloc","Fréquence cardiaque" in await a.text_content("#calque"))
        await a.click("[data-act=fcGo]"); await a.wait_for_timeout(16200)
        await a.locator(".fcN").nth(0).fill("abc"); await a.click("[data-act=fcOk]"); await a.wait_for_timeout(150)
        ok("15b nombre de battements impossible refusé",await a.locator(".fcN").count()==2)
        await a.locator(".fcN").nth(0).fill("35"); await a.locator(".fcN").nth(1).fill("44")
        if SHOTS: await a.screenshot(path=SHOTS+"/fc.png")
        await a.click("[data-act=fcOk]"); await a.wait_for_timeout(300); t=await a.text_content("#vue")
        ok("15c mesures enregistrées (35 × 4 = 140 dans la zone, 44 × 4 = 176 au-dessus)","140 ✓" in t and "176 ↑" in t,t[-300:])
        await a.click("[data-act=blNouveau]"); await a.click("[data-act=blAjout]"); await a.locator("#calque .pas",has_text="Mambo").first.click(); await a.wait_for_timeout(150)
        await a.click("[data-act=blChore]"); await a.wait_for_timeout(4200); pos=await a.text_content("#plPos"); pr=await a.evaluate("parseFloat(document.querySelector('#plProg').style.width)||0"); ms=await a.locator("#plSuiv svg").count()
        plein=await a.evaluate("(()=>{var r=document.querySelector('.pl').getBoundingClientRect();return r.width>=innerWidth-1&&r.height>=innerHeight-1&&document.documentElement.scrollWidth<=innerWidth+2})()")
        if SHOTS: await a.screenshot(path=SHOTS+"/choregraphie.png")
        ok("15d chorégraphie : tous les blocs, plein écran, progression, aperçu du pas suivant","Bloc 1" in pos and "sur 7" in pos and pr>0 and ms==1 and plein,(pos,pr,ms,plein))
        await a.click("[data-act=fermer]"); await a.wait_for_timeout(200); await a.click("[data-act=fcPasser]"); await a.evaluate("document.querySelector('[data-act=blChoix][data-i=\"0\"]').click()"); await a.wait_for_timeout(200)
        ok("16 tablette 1024 sans débordement",await large(a)<=2,await large(a))
        await a.wait_for_timeout(9000)
        # ---- tablette B (téléphone)
        await e.goto(B+"step/"); await e.wait_for_timeout(2500); await e.evaluate(LST,NOMS); await e.reload(); await e.wait_for_timeout(14000)
        await e.locator(".epsg button",has_text="2GT1").first.click(); await e.wait_for_timeout(400); await e.evaluate("(()=>{const b=document.querySelector('.epsg2 [data-go=g]');if(b)b.click()})()"); await e.wait_for_timeout(300);
        await e.click("[data-act=grpNom][data-i='2']"); await e.click("[data-act=grpOk]"); await e.wait_for_timeout(300)
        w1=await large(e); await e.click("[data-onglet=obs]"); await e.wait_for_timeout(300)
        txt=await e.text_content("#vue"); ok("17 le bloc de la tablette A arrive sur la tablette B","Lea" in txt and "Hugo" in txt,txt[:120])
        await e.click("[data-act=obsChoix]"); await e.click("[data-act=obsR][data-i='0'][data-v='0']"); await e.click("[data-act=obsR][data-i='1'][data-v='1']"); await e.fill("#obsCom","Regardez devant vous."); w2=await large(e)
        if SHOTS: await e.screenshot(path=SHOTS+"/observer.png",full_page=True)
        await e.click("[data-act=obsOk]"); await e.wait_for_timeout(300)
        await e.click("[data-onglet=pas]"); await e.locator("#vue .pas").first.click(); w3=await large(e)
        if SHOTS: await e.screenshot(path=SHOTS+"/fichepas.png",full_page=True)
        await e.click("[data-act=jouerPas]"); await e.wait_for_timeout(1500); w4=await large(e)
        if SHOTS: await e.screenshot(path=SHOTS+"/lecteur-tel.png")
        await e.click("[data-act=fermer]")
        ok("18 téléphone 390 sans débordement",max(w1,w2,w3,w4)<=2,(w1,w2,w3,w4))
        await e.wait_for_timeout(9000); await a.wait_for_timeout(9000)
        await a.evaluate("EPSD.syncSoon&&EPSD.syncSoon()"); await a.wait_for_timeout(6000); await a.click("[data-onglet=bloc]")
        ok("19 l'observation revient au groupe observé","Regardez devant vous." in await a.text_content("#vue"))
        await p.evaluate("EPSD.syncSoon&&EPSD.syncSoon()"); await p.wait_for_timeout(6000); await p.evaluate("aller('suivi')"); await p.wait_for_timeout(300); t=await p.text_content("#vue")
        ok("20 enseignant : groupes en direct (état, bloc, fréquence cardiaque, observation, élèves sans groupe)","Hugo, Lea" in t and "32 / 32" in t and "observation" in t and "140" in t and "compose" in t and "Pas encore dans un groupe" in t,t[:400])
        await p.evaluate("aller('jour')"); await p.wait_for_timeout(200); await p.evaluate("EPSLC.controle()"); await p.wait_for_timeout(600)
        ok("20a un seul écran de suivi : le pilotage commun n'est pas proposé, il ouvre « Groupes en direct »",await p.evaluate("S.onglet")=="suivi" and await p.evaluate("!document.getElementById('lc-ctl')||document.getElementById('lc-ctl').style.display==='none'") and "Pilotage de leçon" not in await p.evaluate("EPSLC.actions().map(function(a){return a.label}).join('|')"))
        if SHOTS: await p.screenshot(path=SHOTS+"/suivi.png",full_page=True)
        tb=await p.evaluate("EPSD.tabList('step').map(x=>[x.cls,x.eq])"); ok("21 tablettes connectées vues par l'enseignant",len(tb)>=2,tb)
        ok("22 aucune erreur de page",not errs,errs)
        await b.close()
    bad=0
    for t,c,x in out:
        print(("✓ " if c else "✗ ")+t+("" if c else "  → "+str(x))); bad+=0 if c else 1
    print(bad,"échec(s)")
try: asyncio.run(main())
finally: srv.terminate(); gs.terminate()
