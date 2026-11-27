# CO Course (27/11/2026) : « ✍ Ajouter des résultats » (papier + SMS au même endroit) ; élève papier + numérique, élève tout papier
import asyncio,sys,subprocess,time,tempfile,os,json
from playwright.async_api import async_playwright
SH=tempfile.mkdtemp(prefix="eps-coep-")
ROOT=sys.argv[1]; PORT=8885
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT
KO=[]
def ok(c,m): print(("OK  " if c else "KO  ")+m,flush=True); c or KO.append(m)
SRV={"rows":[],"n":0}
async def fake(route):
    try: b=json.loads(route.request.post_data or "{}")
    except Exception: b={}
    a=b.get("action"); out={"ok":True}
    if a=="coeResult": SRV["n"]+=1; SRV["rows"].append({"t":int(time.time()*1000)+SRV["n"],"k":int(b.get("k") or 0),"d":b.get("data")})
    elif a=="coeResults":
        s=int(b.get("since") or 0); R=[r for r in SRV["rows"] if r["t"]>s]; out.update(rows=R,since=max([s]+[r["t"] for r in R]))
    elif a=="coeGet": out.update(vc="",vm="",states=[])
    elif a=="coeAllStates": out.update(states=[],now=int(time.time()*1000))
    elif a=="coeLoad": out["data"]=None
    elif a=="coeSave": out["v"]="1"
    await route.fulfill(status=200,content_type="application/json",body=json.dumps(out))
SEED="""()=>{ C.parcours[0].nb=4; C.parcours[0].oblig=0; C.parcours[1].oblig=0; C.parcours[1].nb=4; C.demo=false; C.listes={"Enseignant 1":{"2GT1":[["TEST","Hugo"],["TEST","Inès"],["TEST","Jules"]]}}; LS.set("conf",C);
  const me={prenom:"Hugo",nom:"TEST",classe:"2GT1",prof:"Enseignant 1"}; me.id=studentId(me); const t0=Date.now()-3600e3, r={k:0,plan:[31,32,33,34],prevu:600,debut:t0,saisies:[],idx:0,ress:{}};
  ["KTR","BOP","LUV","MAZ"].forEach((c,i)=>{punch(r,c); r.saisies[i].t=t0+(i+1)*60000;}); r.fin=t0+18*60000; LS.set("res",{[me.id]:{me,runs:[packRun(r),null],recu:Date.now()}}); LS.set("pf",""); }"""
async def pick(p,prenom):
    await p.click(".modal [data-pf='Enseignant 1']"); await p.wait_for_timeout(200); await p.click(".modal [data-cl='2GT1']"); await p.wait_for_timeout(200)
    await p.locator(".modal [data-el]",has_text=prenom).first.click(); await p.wait_for_timeout(400)
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"]); errs=[]
        c=await b.new_context(service_workers="block",viewport={"width":1024,"height":900})
        await c.add_init_script("try{localStorage.setItem('eps.teach.until',String(Date.now()+3600e3));localStorage.setItem('coe.tpw',JSON.stringify('x'))}catch(e){}")
        await c.route("https://script.google.com/**",fake)
        p=await c.new_page(); p.on("pageerror",lambda x:errs.append(str(x)[:200]))
        await p.goto(B+"co-eval/"); await p.wait_for_timeout(2500); await p.evaluate(SEED); await p.reload(); await p.wait_for_timeout(2500)
        await p.evaluate("go('prof','res')"); await p.wait_for_timeout(700)
        ok(await p.locator("#evSai").count()==1 and await p.locator("#rSms").count()==0,"Résultats : un seul bouton « ✍ Ajouter des résultats »")
        await p.click("#evSai"); await p.wait_for_timeout(300)
        ok(await p.locator("#arP").count()==1 and await p.locator("#arS").count()==1,"choix : parcours papier ou SMS")
        await p.click("#arP"); await p.wait_for_timeout(300); await pick(p,"Hugo")
        st=await p.evaluate("document.querySelector('#peS').innerText"); k=await p.evaluate("document.querySelector('#peK').value")
        ok("numérique" in st and k=="1","Hugo : parcours individuel numérique déjà reçu, collectif proposé (%s · %s)"%(st.replace("\n"," "),k))
        await p.fill("#peB","35 36 37 38"); await p.fill("#peC","FER DIX – PRA"); await p.fill("#peT","20:00"); await p.click("#peOk"); await p.wait_for_timeout(900)
        r=await p.evaluate("(()=>{const x=allStudents().find(y=>y.me.prenom=='Hugo');return x.runs.map(r=>r&&r.fin?(r.ress&&r.ress.papier?'papier':'num')+':'+Math.round((r.fin-r.debut)/1000):null)})()")
        ok(r==["num:1080","papier:1200"],"Hugo : un parcours numérique + un parcours papier (%s)"%r)
        ok("Tous ses parcours sont saisis" in await p.evaluate("document.querySelector('#peOkM').innerText"),"la fenêtre reste ouverte et l'annonce")
        # tout papier, avec jour et heures
        await p.click("#peO"); await p.wait_for_timeout(300); await pick(p,"Inès")
        ok(await p.evaluate("document.querySelector('#peK').value")=="0","Inès : premier parcours proposé")
        await p.fill("#peB","31 32 33 34"); await p.fill("#peC","KTR BOP LUV MAZ"); await p.fill("#peH1","08:00"); await p.fill("#peH2","08:25"); await p.click("#peOk"); await p.wait_for_timeout(900)
        ok(await p.evaluate("document.querySelector('#peK').value")=="1","parcours suivant proposé tout seul")
        await p.fill("#peB","35 36"); await p.fill("#peC","FER XXX"); await p.fill("#peT","9:30"); await p.click("#peOk"); await p.wait_for_timeout(900)
        r=await p.evaluate("(()=>{const x=allStudents().find(y=>y.me.prenom=='Inès');return x.runs.map(r=>r&&r.fin?[Math.round((r.fin-r.debut)/1000),new Date(r.debut).getHours(),r.ress.papier]:null)})()")
        ok(r[0]==[1500,8,1] and r[1][0]==570,"Inès : deux parcours papier (8 h 00 → 8 h 25, puis 9:30) (%s)"%r)
        f=await p.evaluate("(()=>{const x=allStudents().find(y=>y.me.prenom=='Inès');return withStudent(x,()=>analyse(x.runs[1]).faux)})()"); ok(f==1,"code faux du carton compté faux (corrigeable dans le bilan)")
        # jour passé sans heure → message
        await p.fill("#peD","2026-11-01"); await p.fill("#peB","31"); await p.fill("#peC","KTR"); await p.fill("#peT","5:00"); await p.click("#peOk"); await p.wait_for_timeout(400)
        ok("heure de départ" in await p.evaluate("document.querySelector('#peE').innerText"),"autre jour sans heure : l'heure de départ est demandée")
        await p.screenshot(path=os.path.join(SH,"papier.png"),full_page=True)
        await p.click("#peX"); await p.wait_for_timeout(400)
        # SMS au même endroit, envoyés au script
        n0=len(SRV["rows"]); t0=int(time.time())-1800
        line="COE1|Jules|TEST|2GT1|Enseignant 1|0||%d|900|0|31.32|60:KTR,120:BOP|"%t0
        await p.click("#evSai"); await p.wait_for_timeout(300); await p.click("#arS"); await p.wait_for_timeout(300)
        await p.fill("#smT",line); await p.click("#smOk"); await p.wait_for_timeout(1200)
        ok(len(SRV["rows"])==n0+1,"SMS importé et envoyé au script (visible des autres appareils)")
        r=await p.evaluate("(()=>{const x=allStudents().find(y=>y.me.prenom=='Jules');return x&&x.runs[0]&&x.runs[0].fin?Math.round((x.runs[0].fin-x.runs[0].debut)/1000):null})()"); ok(r==900,"Jules : résultat du SMS dans Résultats (%s)"%r)
        t=await p.evaluate("document.querySelector('#pv')?document.querySelector('#pv').innerText:document.body.innerText"); ok("Jules" in t and "Inès" in t,"tableau des résultats à jour")
        print("captures :",SH)
        ok(not errs,"aucune erreur "+str(errs[:3])); await b.close()
    print(len(KO),"problème(s)")
asyncio.run(main()); srv.terminate()
