# Relais : ▶ Leçon du jour n'amène plus vers Classe ; 👤 Fiche élève (toutes ses courses et ses performances), aussi depuis l'évaluation.
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
    await p.evaluate("document.querySelector('#v-eval [data-fego]').click()"); await p.wait_for_timeout(1700)
    chk(await p.evaluate(V)=="eleve" and await p.evaluate("FE_SEL===CL().eleves[1].id") and await p.evaluate(cur)=="eval","« Toutes ses courses » depuis l'évaluation : sa fiche, onglet Évaluer")
    await p.click("#fe-back"); await p.wait_for_timeout(900); chk(await p.evaluate(V)=="eval" and await p.evaluate("EV_SEL===CL().eleves[1].id"),"retour à l'évaluation du même élève")
    print("erreurs:",errs); chk(not errs,"aucune erreur de page"); await b.close()
asyncio.run(main()); srv.terminate(); sys.exit(0 if ok else 1)
