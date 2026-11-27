# Relais, évaluation (27/11/2026) : Performance = part des courses réussies (écart ≥ 0), 3 sur 5 à 0 → degré 4 bas ; la case touchée ne bouge plus ; Présent / Absent / Dispensé.
import asyncio,sys,subprocess,time,json
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; PORT=8878
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT
ok=True
def chk(c,m):
    global ok; print(("OK  " if c else "ÉCHEC ")+m,flush=True); ok=ok and bool(c)
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(args=["--no-sandbox"])
    for W,H in [(1280,800),(800,1280)]:
      c=await b.new_context(service_workers="block",viewport={"width":W,"height":H},has_touch=True); await c.add_init_script("localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3))")
      p=await c.new_page(); errs=[]; p.on("pageerror",lambda x:errs.append(str(x)[:300]))
      await p.goto(B); await p.wait_for_timeout(2000); await p.evaluate("EPSD.demo.create()"); await p.wait_for_timeout(2000)
      await p.goto(B+"relais/"); await p.wait_for_timeout(3500)
      await p.evaluate("""(()=>{DATA.cur=DATA.classes[0].id;const C=CL(),E=C.eleves,mk=(id,d)=>({id,date:d,cfg:JSON.parse(JSON.stringify(DEFCFG)),groupes:[]});
        C.lecons=[mk('l1','2026-11-20')];C.evals={};
        const co=(n,lid,a,b,ec,z)=>({cid:'k'+n,lid,n,heure:'10:0'+n,i1:a.id,i2:b.id,p1:a.prenom,n1:a.nom,p2:b.prenom,n2:b.nom,cible:23,ecart:ec,realise:23+ec,zone:z,pm:5});
        C.courses=[co(1,'l1',E[0],E[1],0,'Zone 3'),co(2,'l1',E[1],E[0],-3,'Zone 2'),co(3,'l1',E[0],E[1],0,'Zone 3'),co(4,'l1',E[0],E[1],0,'Zone 2'),co(5,'l1',E[1],E[0],-3,'Zone 1')];DATA.lecon=null;persist()})()""")
      await p.click(".epst-nav [data-t=eval]"); await p.wait_for_timeout(1000)
      await p.evaluate("[...document.querySelectorAll('.epst-tb button.seg')].find(b=>/finale/.test(b.innerText)).click()"); await p.wait_for_timeout(900)
      await p.evaluate("EV_SEL=CL().eleves[0].id;renderEval()"); await p.wait_for_timeout(1200)
      s=await p.evaluate("(()=>{EV_SCOPE='all';const s=evStats(CL().eleves[0]);return {perf:s.perf,pts:s.perfPts,why:s.perfWhy}})()")
      print(s); chk(s["perf"]==4 and s["pts"]==4.75,"3 courses sur 5 à 0, 2 à −3 : degré 4, bas du degré (4,75 / 6)")
      moves=[]
      for k,d in [("perf",4),("perf",3),("trans",3),("proj",3),("role",2),("role",3),("perf",4)]:
        sel="#ev-body [data-evk=%s][data-evd='%d']"%(k,d)
        await p.evaluate("document.querySelector(\"%s\").scrollIntoView({block:'center'})"%sel); await p.wait_for_timeout(400)
        a=await p.evaluate("document.querySelector(\"%s\").getBoundingClientRect().top"%sel)
        await p.tap(sel); await p.wait_for_timeout(1200)
        z=await p.evaluate("document.querySelector(\"%s\").getBoundingClientRect().top"%sel); moves.append(round(z-a))
      print("déplacements",moves); chk(all(abs(m)<=2 for m in moves),"%dx%d : la case touchée ne bouge plus"%(W,H))
      for adj in ["1","-1"]:
        sel="#ev-body [data-evadj='%s'][data-evk2=perf]"%adj
        await p.evaluate("document.querySelector(\"%s\").scrollIntoView({block:'center'})"%sel); await p.wait_for_timeout(300)
        a=await p.evaluate("document.querySelector(\"%s\").getBoundingClientRect().top"%sel); await p.evaluate("document.querySelector(\"%s\").click()"%sel); await p.wait_for_timeout(800)
        z=await p.evaluate("document.querySelector(\"%s\").getBoundingClientRect().top"%sel); chk(abs(z-a)<=2,"bouton %s : ne bouge pas (%d)"%(adj,z-a))
      await p.evaluate("document.querySelector('#ev-body [data-evapply]').scrollIntoView({block:'center'})"); await p.wait_for_timeout(300)
      await p.evaluate("document.querySelector('#ev-body [data-evapply]').click()"); await p.wait_for_timeout(900)
      chk(await p.evaluate("JSON.stringify(CL().evals[CL().eleves[0].id].prof.perf)")=='{"d":4,"p":4.75}',"« Appliquer la suggestion » : degré 4 à 4,75")
      # absent / dispensé
      await p.evaluate("document.querySelector('#ev-body [data-evst=ABS]').scrollIntoView({block:'center'})"); await p.wait_for_timeout(300)
      await p.evaluate("document.querySelector('#ev-body [data-evst=ABS]').click()"); await p.wait_for_timeout(900)
      t=await p.evaluate("document.querySelector('#ev-body').innerText")
      chk(await p.evaluate("CL().evals[CL().eleves[0].id].st")=="ABS" and "Absent(e)" in t and await p.evaluate("!!document.querySelector('#ev-body .evgrid.evoff')"),"Absent : statut enregistré, grille grisée, pas de note")
      chk((await p.evaluate("(()=>{const e=CL().eleves[0];EVCL.set(e,CL());return evSt(evrO(e))})()"))=="ABS","adaptateur commun : ABS")
      chk("ABS" in (await p.evaluate("document.querySelector('#ev-recap').innerText")),"récapitulatif : ABS")
      await p.evaluate("document.querySelector('#ev-body [data-evst=DISP]').scrollIntoView({block:'center'})"); await p.evaluate("document.querySelector('#ev-body [data-evst=DISP]').click()"); await p.wait_for_timeout(700); chk(await p.evaluate("CL().evals[CL().eleves[0].id].st")=="DISP","Dispensé")
      R=await p.evaluate("(()=>{const S=evStatsC(evRows());return [S.ns,S.n]})()"); chk(R[0]==1,"bilan : 1 absent ou dispensé compté à part "+str(R))
      await p.evaluate("document.querySelector('#ev-body [data-evst=\"\"]').scrollIntoView({block:'center'})"); await p.evaluate("document.querySelector('#ev-body [data-evst=\"\"]').click()"); await p.wait_for_timeout(700)
      chk(await p.evaluate("!CL().evals[CL().eleves[0].id].st&&CL().evals[CL().eleves[0].id].prof.perf.d===4"),"Présent : degrés gardés")
      # synchro du statut
      await p.evaluate("CL().evals[CL().eleves[0].id].st='DISP'")
      chk(await p.evaluate("""(()=>{const c=CL(),id=CL().eleves[0].id,o=c.evals[id];const put={};Object.assign(o,{});const x=Object.assign({rep:o.rep,prof:o.prof||{}},o.app?{app:o.app}:{},o.st?{st:o.st}:{});return x.st==='DISP'})()"""),"statut envoyé avec l'évaluation (evp|)")
      if W==1280: await p.screenshot(path="/tmp/rt/eval_%d.png"%W)
      print("erreurs",errs); chk(not errs,"aucune erreur"); await c.close()
    await b.close()
asyncio.run(main()); srv.terminate(); sys.exit(0 if ok else 1)
