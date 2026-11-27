# Relais : Séquence = fiches de leçon ; Classe = vue générale puis préparation ; Bilan et export = bilan de l'évaluation ; résultats sur toutes les leçons (par nom).
import asyncio,sys,subprocess,time
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; PORT=8877; SHOT=sys.argv[2] if len(sys.argv)>2 else ""
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT
TEACH="try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.console.trust','1');localStorage.setItem('eps.console.ask','0')}catch(e){}"
ok=True
def chk(c,m):
    global ok; print(("OK  " if c else "ÉCHEC ")+m,flush=True); ok=ok and bool(c)
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(args=["--no-sandbox","--disable-dev-shm-usage"])
    c=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); await c.add_init_script(TEACH)
    p=await c.new_page(); errs=[]
    p.on("pageerror",lambda x:errs.append("ERR "+str(x)[:400]))
    await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("EPSD.demo.create()"); await p.wait_for_timeout(2500)
    await p.goto(B+"relais/"); await p.wait_for_timeout(4000)
    V="viewNow()"; cur="(document.querySelector('.epst-nav button.on')||{}).dataset.t"
    lc="(()=>{const o=document.querySelector('.lc-ov');return !!o&&getComputedStyle(o).display!=='none'&&o.classList.contains('epst-dock')})()"
    tab=lambda t:"document.querySelector('.epst-nav button[data-t=%s]').click()"%t
    # 1. ouverture : Séquence = fiches de leçon, pas une classe
    chk(await p.evaluate(V)=="seq" and await p.evaluate(cur)=="seq","ouverture enseignant : onglet Séquence ("+str(await p.evaluate(V))+")")
    chk(await p.evaluate(lc),"fiches de leçon ouvertes sous le bandeau")
    t=await p.evaluate("document.querySelector('.lc-ov').innerText"); chk("leçon" in t.lower() and len(t)>40,"contenu : fiches de leçon ("+t[:70].replace("\n"," / ")+")"); await p.screenshot(path=SHOT+"seq.png") if SHOT else None
    await p.evaluate("DATA.cur=DATA.classes[0].id;persist()"); await p.evaluate(tab("cls")); await p.wait_for_timeout(700); await p.evaluate(tab("seq")); await p.wait_for_timeout(900)
    chk(await p.evaluate(V)=="seq" and await p.evaluate(lc),"classe choisie : Séquence reste sur les fiches de leçon")
    await p.evaluate("syRefresh()"); await p.wait_for_timeout(500); chk(await p.evaluate(V)=="seq","une synchro ne fait pas quitter Séquence")
    # 2. Classe : vue générale, puis préparation de la classe
    await p.evaluate(tab("cls")); await p.wait_for_timeout(900)
    await p.screenshot(path=SHOT+"cls.png") if SHOT else None
    chk(await p.evaluate(V)=="classes" and await p.evaluate(cur)=="cls","Classe (classe déjà choisie) : vue générale de toutes les classes")
    chk(not await p.evaluate("(()=>{const o=document.querySelector('.lc-ov');return !!o&&getComputedStyle(o).display!=='none'})()"),"fiches refermées en quittant Séquence")
    chk("évalué" in await p.evaluate("document.querySelector('#clist').innerText"),"tuiles : courses et élèves évalués")
    await p.evaluate("document.querySelector('#clist [data-class]').click()"); await p.wait_for_timeout(1300)
    chk(await p.evaluate(V)=="lecons" and await p.evaluate(cur)=="cls","classe touchée : préparation de la classe, onglet Classe")
    # 3. Bilan et export : bilan de l'évaluation, même avec une leçon qui a des courses
    await p.evaluate("""(()=>{const C=CL(),E=C.eleves,mk=(id,d)=>({id,date:d,cfg:JSON.parse(JSON.stringify(DEFCFG)),groupes:[]});
      C.lecons=[mk('l1','2026-11-06'),mk('l2','2026-11-13'),mk('l3','2026-11-20')];
      const co=(n,lid,a,b,ec,z)=>({cid:'k'+n,lid,n,date:'x',i1:a.id,i2:b.id,p1:a.prenom,n1:a.nom,p2:b.prenom,n2:b.nom,ecart:ec,zone:z});
      C.courses=[co(1,'l1',E[0],E[1],1,'Zone 100'),co(2,'l2',E[0],E[1],1,'Zone 100'),co(3,'l3',E[2],E[3],-1,'Zone 10'),
        {cid:'k4',lid:'l2',n:4,i1:99991,i2:99992,p1:E[0].prenom,n1:E[0].nom,p2:E[1].prenom,n2:E[1].nom,ecart:1,zone:'Zone 100'}];
      const d=JSON.parse(JSON.stringify(C));d.id='dup1';d.lecons=[mk('m1','2026-11-27')];d.evals={};
      d.courses=[{cid:'k9',lid:'m1',n:1,i1:d.eleves[0].id,i2:d.eleves[1].id,p1:E[0].prenom,n1:E[0].nom,p2:E[1].prenom,n2:E[1].nom,ecart:-3,zone:'Zone 1'}];DATA.classes.push(d);persist()})()""")
    await p.evaluate(tab("eval")); await p.wait_for_timeout(900)
    await p.evaluate("[...document.querySelectorAll('.epst-tb button.seg')].find(b=>/Bilan et export/.test(b.innerText)).click()"); await p.wait_for_timeout(1500)
    await p.screenshot(path=SHOT+"bil.png") if SHOT else None
    chk(await p.evaluate(V)=="eval" and await p.evaluate("!!RL_BIL"),"Bilan et export : bilan de l'évaluation, pas une leçon ("+str(await p.evaluate(V))+")")
    chk(await p.evaluate("document.querySelector('#ev-bilan').offsetParent!==null&&document.querySelector('#ev-host').offsetParent===null"),"bilan affiché, grille d'évaluation masquée")
    chk("Bilan" in await p.evaluate("(document.querySelector('.epst-tb button.seg.on')||{}).innerText||''"),"entrée « Bilan et export » allumée")
    await p.wait_for_timeout(1500); chk(await p.evaluate("!!RL_BIL") and "Bilan" in await p.evaluate("(document.querySelector('.epst-tb button.seg.on')||{}).innerText||''"),"elle le reste")
    btn=await p.evaluate("[...document.querySelectorAll('#v-eval button')].filter(b=>b.offsetParent).map(b=>b.innerText.trim().slice(0,50))")
    chk(any("Pronote" in x for x in btn) and any("Excel" in x for x in btn),"exports présents (Pronote, Excel)")
    await p.evaluate("[...document.querySelectorAll('.epst-tb button.seg')].find(b=>/Évaluation finale/.test(b.innerText)).click()"); await p.wait_for_timeout(1200)
    chk(await p.evaluate("!RL_BIL&&document.querySelector('#ev-host').offsetParent!==null&&document.querySelector('#ev-bilan').offsetParent===null"),"Évaluation finale : grille seule")
    await p.evaluate("[...document.querySelectorAll('.epst-tb button')].find(b=>/Bilan des leçons/.test(b.innerText))||0"); 
    await p.evaluate("[...document.querySelectorAll('.epst-tb button.seg')].find(b=>/Bilan et export/.test(b.innerText)).click()"); await p.wait_for_timeout(900)
    await p.evaluate("[...document.querySelectorAll('.epst-tb button')].find(b=>/Bilan des leçons/.test(b.innerText)).click()"); await p.wait_for_timeout(1600)
    chk(await p.evaluate(V)=="bilan" and await p.evaluate(cur)=="eval","« Bilan des leçons (courses) » : résultats d'une leçon seulement si je le demande, onglet Évaluer")
    await p.evaluate(tab("cls")); await p.wait_for_timeout(600); await p.evaluate("document.querySelector('#clist [data-class]').click()"); await p.wait_for_timeout(600)
    await p.evaluate("BILAN='l1';go('bilan')"); await p.wait_for_timeout(1500); chk(await p.evaluate(V)=="bilan" and await p.evaluate(cur)=="cls","leçon précédente ouverte depuis la préparation : onglet Classe")
    await p.evaluate(tab("eval")); await p.wait_for_timeout(600); await p.evaluate("[...document.querySelectorAll('.epst-tb button.seg')].find(b=>/Évaluation finale/.test(b.innerText)).click()"); await p.wait_for_timeout(1200)
    # 4. résultats : toutes les leçons où le nom apparaît (identifiant perdu, classe en double), dernière seulement si choisi
    s=await p.evaluate("(()=>{const s=evStats(CL().eleves[0]);return {n:s.n,les:s.les.map(l=>l.date+'x'+l.n+'k'+l.k),scope:s.scope}})()")
    chk(s["scope"]=="all" and s["n"]==4 and s["les"]==["2026-11-06x1k1","2026-11-13x2k2","2026-11-27x1k4"],"toutes les leçons de l'élève : "+str(s))
    await p.evaluate("CL().evScope='last'"); chk(await p.evaluate("evStats(CL().eleves[0]).scope")=="all","ancien réglage « dernière leçon » gardé par la classe : ignoré")
    await p.evaluate("EV_SEL=CL().eleves[0].id;renderEval()"); await p.wait_for_timeout(900)
    chk("Toutes ses leçons" in await p.evaluate("document.querySelector('#v-eval').innerText"),"fiche élève : choix des leçons affiché")
    await p.evaluate("document.querySelector('#v-eval [data-evscope=last]').click()"); await p.wait_for_timeout(500)
    s=await p.evaluate("(()=>{const s=evStats(CL().eleves[0]);return {n:s.n,scope:s.scope,last:s.last}})()")
    chk(s=={"n":1,"scope":"last","last":"2026-11-27"},"« Leçon finale seulement » si je le choisis : "+str(s))
    await p.evaluate("document.querySelector('#v-eval [data-evscope=all]').click()"); await p.wait_for_timeout(400)
    await p.evaluate("syRefresh()"); await p.wait_for_timeout(500); chk(await p.evaluate(V)=="eval","une synchro ne fait pas quitter l'évaluation (sans leçon ouverte)")
    # 5. homonymes : pas de mélange
    r=await p.evaluate("(()=>{const C=CL(),E=C.eleves;const o=JSON.parse(JSON.stringify(E[0]));o.id=777;C.eleves.push(o);const a=evStats(E[0]).n,b=evStats(o).n;C.eleves.pop();return [a,b]})()")
    chk(r[1]<=2 and r[0]>=2,"homonyme : ses courses par identifiant ne passent pas à l'autre "+str(r))
    # 6. vue élève inchangée
    await p.evaluate("localStorage.removeItem('eps.teach.until')"); 
    print("erreurs:",errs); chk(not errs,"aucune erreur de page")
    await b.close()
asyncio.run(main()); srv.terminate(); sys.exit(0 if ok else 1)
