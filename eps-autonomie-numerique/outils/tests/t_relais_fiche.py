# Relais : ▶ Leçon du jour n'amène plus vers Classe ; 👤 Fiche élève (toutes ses courses et ses performances), en fenêtre depuis l'évaluation ; Zone 3 = Zone 100.
import asyncio,sys,subprocess,time
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; PORT=8872; SHOT=sys.argv[2] if len(sys.argv)>2 else ""
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT
TEACH="try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3))}catch(e){}"
ok=True
def chk(c,m):
    global ok; print(("OK  " if c else "ÉCHEC ")+m,flush=True); ok=ok and bool(c)
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(args=["--no-sandbox","--disable-dev-shm-usage"])
    c=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); await c.add_init_script(TEACH)
    p=await c.new_page(); errs=[]; p.on("pageerror",lambda x:errs.append(str(x)[:300]))
    await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("EPSD.demo.create()"); await p.wait_for_timeout(2500)
    await p.goto(B+"relais/"); await p.wait_for_timeout(4000)
    V="viewNow()"; cur="(document.querySelector('.epst-nav button.on')||{}).dataset.t"
    act=lambda t:"[...document.querySelectorAll('.epst-tb button')].find(b=>b.title==='%s').click()"%t
    # 1. Leçon du jour
    await p.evaluate("DATA.cur=DATA.classes[0].id;DATA.lecon=null;CL().lecons=[];persist()"); await p.evaluate(act("Écran des élèves")); await p.wait_for_timeout(1500)
    chk(await p.evaluate(V)=="live" and await p.evaluate(cur)=="suivi" and "Démarrer" in await p.evaluate("document.querySelector('#lv-ctl').innerText"),"Leçon du jour sans leçon aujourd'hui : Suivi avec « Démarrer la leçon », pas Classe ("+str(await p.evaluate(V))+")")
    await p.evaluate("(()=>{CL().lecons.push({id:'lj',date:todayISO(),cfg:JSON.parse(JSON.stringify(DEFCFG))});DATA.lecon=null;persist()})()")
    await p.click(".epst-nav [data-t=seq]"); await p.wait_for_timeout(900); await p.evaluate(act("Écran des élèves")); await p.wait_for_timeout(1500)
    chk(await p.evaluate(V)=="home" and await p.evaluate(cur)=="seq" and await p.evaluate("CLE().id")=="lj","Leçon du jour avec une leçon aujourd'hui : elle s'ouvre toute seule")
    await p.evaluate("DATA.lecon=null;persist()"); await p.click(".epst-nav [data-t=seq]"); await p.wait_for_timeout(900); await p.evaluate("goJour('course')"); await p.wait_for_timeout(1500)
    chk(await p.evaluate(V)=="course","Courses : écran des courses de la leçon du jour")
    # 2. fiche élève
    await p.evaluate("""(()=>{const C=CL(),E=C.eleves,mk=(id,d)=>({id,date:d,cfg:JSON.parse(JSON.stringify(DEFCFG)),groupes:[]});E[0].ea=[20,21,22];E[0].el=[24,25,26];E[0].ma=21;E[0].ml=25;
      C.lecons=[mk('l1','2026-11-06'),mk('l2','2026-11-13'),mk('l3','2026-11-20')];
      const co=(n,lid,a,b,ec,z)=>({cid:'k'+n,lid,n,heure:'10:0'+n,i1:a.id,i2:b.id,p1:a.prenom,n1:a.nom,p2:b.prenom,n2:b.nom,cible:23,ecart:ec,realise:23+ec,zone:z,pm:5});
      C.courses=[co(1,'l1',E[0],E[1],1,'Zone 100'),co(2,'l2',E[1],E[0],-1.5,'Hors zone'),co(3,'l3',E[0],E[2],0,'Zone 10'),co(4,'l3',E[2],E[3],2,'Zone 100')];DATA.lecon=null;persist()})()""")
    await p.click(".epst-nav [data-t=cls]"); await p.wait_for_timeout(700); await p.evaluate("document.querySelector('#clist [data-class]').click()"); await p.wait_for_timeout(900)
    await p.evaluate(act("Fiche élève")); await p.wait_for_timeout(1200)
    chk(await p.evaluate(V)=="eleve" and await p.evaluate(cur)=="cls","Classe → Fiche élève")
    n=await p.evaluate("document.querySelectorAll('#fe-names [data-fe]').length"); chk(n==8,"tous les élèves de la classe proposés ("+str(n)+")")
    await p.evaluate("document.querySelector('#fe-names [data-fe=\"'+CL().eleves[0].id+'\"]').click()"); await p.wait_for_timeout(900)
    t=await p.evaluate("document.querySelector('#fe-body').innerText")
    chk("21 km/h" in t and "25 km/h" in t and "20 · 21 · 22" in t,"vitesses et essais affichés")
    chk("3 courses sur 3 leçons" in t and "2 · 1" in t,"ses 3 courses, 2 comme donneur et 1 comme receveur")
    chk("1 / 3" in t and "2 / 3" in t and "Hors zone" in t and "Receveur" in t and "Donneur" in t,"comptes bruts et détail course par course (cible, écart, zone, rôle)")
    chk(await p.evaluate("document.querySelectorAll('#fe-body table tbody tr').length")==3 and "k4" not in t,"une ligne par course, sans les courses des autres")
    chk("Ce que l'évaluation en déduit" in t and "coefficient ×1, ×2, ×3" in t,"calcul de l'évaluation expliqué (degrés, coefficients)")
    chk(await p.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),"pas de débordement horizontal")
    if SHOT: await p.evaluate("document.querySelector('#fe-body').scrollIntoView()"); await p.wait_for_timeout(500); await p.screenshot(path=SHOT+"fiche.png")
    await p.evaluate("syRefresh()"); await p.wait_for_timeout(400); chk(await p.evaluate(V)=="eleve","une synchro ne fait pas quitter la fiche")
    # 3. depuis l'évaluation
    await p.click(".epst-nav [data-t=eval]"); await p.wait_for_timeout(800); await p.evaluate("[...document.querySelectorAll('.epst-tb button.seg')].find(b=>/finale/.test(b.innerText)).click()"); await p.wait_for_timeout(900)
    await p.evaluate("EV_SEL=CL().eleves[1].id;renderEval()"); await p.wait_for_timeout(800)
    await p.evaluate("document.querySelector('#v-eval [data-fego]').click()"); await p.wait_for_timeout(1200)
    chk(await p.evaluate(V)=="eval" and await p.evaluate("document.querySelector('#femodal').classList.contains('on')") and await p.evaluate(cur)=="eval","« Toutes ses courses » depuis l'évaluation : fenêtre par-dessus, on reste sur Évaluer")
    t=await p.evaluate("document.querySelector('#fe-pop').innerText"); chk((await p.evaluate("CL().eleves[1].prenom")).upper() in t.upper() and "Ce que l'évaluation en déduit" in t,"la fenêtre montre la fiche de l'élève de l'évaluation")
    if SHOT: await p.screenshot(path=SHOT+"fiche_pop.png")
    await p.click("#fe-close"); await p.wait_for_timeout(500); chk(await p.evaluate("!document.querySelector('#femodal').classList.contains('on')") and await p.evaluate(V)=="eval" and await p.evaluate("EV_SEL===CL().eleves[1].id"),"✕ Fermer : retour à l'évaluation du même élève")
    # 4. zones saisies en liste : Zone 3 = Zone 100, Zone 2 = Zone 10 (bug du 27/11/2026)
    await p.evaluate("""(()=>{const C=CL(),E=C.eleves,co=(n,lid,a,b,z)=>({cid:'z'+n,lid,n,heure:'11:0'+n,i1:a.id,i2:b.id,p1:a.prenom,n1:a.nom,p2:b.prenom,n2:b.nom,cible:23,ecart:0,realise:23,zone:z,pm:5});
      C.courses=[co(1,'l1',E[4],E[5],'Zone 3'),co(2,'l2',E[4],E[5],'Zone 3'),co(3,'l3',E[5],E[4],'Zone 2'),co(4,'l3',E[4],E[5],'Zone 1')];persist()})()""")
    r=await p.evaluate("(()=>{EV_SCOPE='all';const s=evStats(CL().eleves[4]);return [s.les.reduce((a,l)=>a+l.z100,0),s.les.reduce((a,l)=>a+l.inz,0),s.les.reduce((a,l)=>a+l.nz,0)]})()")
    chk(r==[2,4,4],"Zone 3 comptée en Zone 100 dans l'évaluation (2 / 4 attendu : "+str(r)+")")
    await p.evaluate("EV_SEL=CL().eleves[4].id;renderEval()"); await p.wait_for_timeout(600); await p.evaluate("document.querySelector('#v-eval [data-fego]').click()"); await p.wait_for_timeout(900)
    t=await p.evaluate("document.querySelector('#fe-pop').innerText"); chk("2 / 4" in t and "Zone 3 · 100" in t,"la fiche compte aussi 2 / 4 en Zone 100 et montre « Zone 3 · 100 »")
    chk(await p.evaluate("zK('Zone 2')==='Zone 10'&&zK('Zone 1')==='Zone 1'&&zK('zone 100')==='Zone 100'&&zK('Hors zone')===HZ&&zK('Autre')==='Autre'"),"correspondance des noms de zones")
    chk(await p.evaluate("(()=>{ST.zone='Zone 3';return !!diagResult().active})()"),"diagnostic de la transmission actif aussi avec « Zone 3 »")
    await p.keyboard.press("Escape"); await p.wait_for_timeout(300); chk(await p.evaluate("!document.querySelector('#femodal').classList.contains('on')"),"Échap referme la fenêtre")
    print("erreurs:",errs); chk(not errs,"aucune erreur de page"); await b.close()
asyncio.run(main()); srv.terminate(); sys.exit(0 if ok else 1)
