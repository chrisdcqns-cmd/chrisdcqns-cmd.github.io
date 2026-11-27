# CO Course (27/11/2026) : bilan modifiable par l'enseignant (balise sautée ou passée comptée bonne / fausse),
# corrections gardées dans une évaluation sauvegardée (📚), corrections fusionnées entre deux appareils (faux script)
import asyncio,sys,subprocess,time,tempfile,os,json
from playwright.async_api import async_playwright
SH=tempfile.mkdtemp(prefix="eps-coeb-")
ROOT=sys.argv[1]; PORT=8883
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT
KO=[]
def ok(c,m): print(("OK  " if c else "KO  ")+m,flush=True); c or KO.append(m)
CO="""(()=>{const x=allStudents().find(y=>y.me.prenom=='%s');return withStudent(x,()=>corrOf(x.runs[0]))})()"""
SRV={"conf":None,"vc":"","n":0,"store":{}}
async def fake(route):
    req=route.request
    try: b=json.loads(req.post_data or "{}")
    except Exception: b={}
    a=b.get("action"); out={"ok":True}
    if a=="coeGet":
        out.update(vc=SRV["vc"],vm="")
        if SRV["vc"] and str(b.get("vc",""))!=SRV["vc"]: out["conf"]=SRV["conf"]
        out["states"]=[]
    elif a=="coeSave":
        SRV["n"]+=1; v=str(1000+SRV["n"])
        if b.get("cle")=="conf": SRV["conf"]=b.get("data"); SRV["vc"]=v
        else: SRV["store"][b.get("cle")]=b.get("data")
        out["v"]=v
    elif a=="coeLoad": out["data"]=SRV["store"].get(b.get("cle"))
    elif a=="coeResults": out.update(rows=[],since=1)
    elif a=="coeAllStates": out.update(states=[],now=int(time.time()*1000))
    await route.fulfill(status=200,content_type="application/json",body=json.dumps(out))
SEED="""()=>{ C.parcours[0].max=20; C.parcours[0].nb=4; C.parcours[0].oblig=0; C.parcours[1].oblig=0; C.demo=false; C.alt={}; C.corr={}; LS.set("conf",C);
  const res={}, t0=Date.now()-3600e3;
  const mk=(prenom,steps)=>{ const me={prenom,nom:"TEST",classe:"2GT1",prof:"Enseignant 1"}; me.id=studentId(me);
    const r={k:0,plan:[31,32,33,34],prevu:600,debut:t0,saisies:[],idx:0,ress:{}};
    steps.forEach((c,i)=>{ if(c==="-"){ r.saisies.push({t:0,code:"",attendu:r.plan[r.idx||0],st:"passe",bal:null}); r.idx=(r.idx||0)+1; } else punch(r,c); r.saisies[r.saisies.length-1].t=t0+(i+1)*60000; });
    r.fin=t0+16*60000; res[me.id]={me,runs:[packRun(r),null],recu:Date.now()}; };
  mk("Fanny",["KTR","LUV","MAZ"]);      // 32 introuvable : elle a pointé la 33 (saut)
  mk("Gaston",["KTR","-","LUV","MAZ"]); // 32 passée
  LS.set("res",res); LS.set("pf",""); }"""
FULL="(p)=>{const x=allStudents().find(y=>y.me.prenom==p);SW=SW||{ME,RUNS};ME=x.me;RUNS=x.runs;go('full',true)}"
async def page(b,errs):
    c=await b.new_context(service_workers="block",viewport={"width":1280,"height":900})
    await c.add_init_script("try{localStorage.setItem('eps.teach.until',String(Date.now()+3600e3));localStorage.setItem('coe.tpw',JSON.stringify('x'))}catch(e){}")
    await c.route("https://script.google.com/**",fake)
    p=await c.new_page(); p.on("pageerror",lambda x:errs.append(str(x)[:200])); return p
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"]); errs=[]
        p=await page(b,errs)
        await p.goto(B+"co-eval/"); await p.wait_for_timeout(2500); await p.evaluate(SEED); await p.reload(); await p.wait_for_timeout(2500)
        # --- 1. balise sautée ---
        await p.evaluate(FULL,"Fanny"); await p.wait_for_timeout(600)
        t=await p.evaluate("document.querySelector('#app').innerText"); ok("sautée" in t,"Fanny : tronçon « balise(s) sautée(s) avant » avant correction")
        tg=await p.evaluate("[...document.querySelectorAll('[data-tg]')].map(e=>e.dataset.tg)"); ok("0|32" in tg,"contrôle touchable pour la 32 (%s)"%tg)
        await p.click("[data-tg='0|32']"); await p.wait_for_timeout(700)
        t=await p.evaluate("document.querySelector('#app').innerText")
        ok("balise 32 validée par l'enseignant" in t and "sautée" not in t and "Parcours réalisé sans erreur" in t,"32 comptée bonne : tronçon juste, parcours sans erreur")
        ok("31 → 33" in t.replace("\t"," ") or "31 → 33" in t,"tronçon affiché 31 → 33")
        cr=await p.evaluate("JSON.stringify("+CO%"Fanny"+")"); ok('"plus":[32]' in cr,"correction enregistrée (%s)"%cr)
        g=await p.evaluate(CO%"Gaston"); ok(g is None,"Gaston, parti dans la même seconde : pas touché par la correction de Fanny")
        await p.screenshot(path=os.path.join(SH,"saut.png"),full_page=True)
        await p.click("[data-tg='0|32']"); await p.wait_for_timeout(600)
        t=await p.evaluate("document.querySelector('#app').innerText"); cr=await p.evaluate(CO%"Fanny")
        ok("sautée" in t and cr is None,"nouvel appui : 32 de nouveau fausse, correction retirée")
        # --- 2. balise passée ---
        await p.evaluate(FULL,"Gaston"); await p.wait_for_timeout(600)
        await p.click("[data-tg='0|32']"); await p.wait_for_timeout(600)
        t=await p.evaluate("document.querySelector('#app').innerText"); ok("validée par l'enseignant" in t and "passée" not in t.split("Temps entre")[1],"Gaston : 32 passée puis comptée bonne")
        ok(await p.locator("[data-bcr='0']").count()==1,"bouton « ✏️ Corriger ce parcours »")
        await p.click("[data-bcr='0']"); await p.wait_for_timeout(400); ok(await p.locator("#crOk").count()==1,"✏️ ouvre la correction du parcours"); await p.click("#crX")
        ok(await p.evaluate(CO%"Fanny") is None and "32" in json.dumps(await p.evaluate(CO%"Gaston")),"Gaston corrigé, Fanny (même seconde de départ) intacte")
        # ancienne correction (clé sans l'élève) : seulement pour l'élève dont c'est le projet
        r=await p.evaluate("""()=>{const F=allStudents().find(y=>y.me.prenom=='Fanny'), rk=runKey(F.runs[0]), keep=C.corr; C.corr={[rk]:{plan:[31,32,33,35],ok:[31,32]}}; const a=withStudent(F,()=>analyse(F.runs[0]).corrige); C.corr={[rk]:{plan:[31,32,33,34],ok:[31,32,33,34]}}; const b=withStudent(F,()=>analyse(F.runs[0]).found.length); C.corr=keep; return [a,b]}""")
        ok(r==[False,4],"ancienne clé : ignorée si le projet n'est pas celui de l'élève, reprise sinon (%s)"%r)
        # temps corrigé : seulement l'élève choisi
        await p.evaluate("go('prof','res')"); await p.wait_for_timeout(700)
        fa=await p.evaluate("allStudents().find(y=>y.me.prenom=='Fanny').me.id")
        await p.click("[data-sm='%s']"%fa); await p.wait_for_timeout(400); await p.click("[data-tfx='0']"); await p.wait_for_timeout(300)
        await p.fill("#tfV","12:00"); await p.click("#tfOk"); await p.wait_for_timeout(500)
        r=await p.evaluate("['Fanny','Gaston'].map(n=>{const x=allStudents().find(y=>y.me.prenom==n);return Math.round((x.runs[0].fin-x.runs[0].debut)/1000)})")
        ok(r==[720,960],"⏱ temps corrigé pour Fanny seulement (%s)"%r)
        # vue élève : rien de modifiable
        n=await p.evaluate("(()=>{const x=allStudents().find(y=>y.me.prenom=='Gaston');ME=x.me;RUNS=x.runs;document.querySelector('#app').innerHTML=bilanHTML(0,false);return [document.querySelectorAll('[data-tg],[data-bcr]').length, document.querySelector('#app').innerText.includes('validée par l')]})()")
        ok(n==[0,False] or n[0]==0,"bilan côté élève : rien de modifiable (%s)"%n)
        # --- 3. évaluation sauvegardée (📚) ---
        await p.evaluate("""()=>{ const a={id:"a1",nom:"Éval test",from:Date.now()-7200e3,to:Date.now(),cls:[],n:2,conf:archSnap(),up:true}; LS.set("arch",[a]); C.corr={}; LS.set("conf",C); archOn(a); }"""); await p.wait_for_timeout(500)
        await p.evaluate(FULL,"Fanny"); await p.wait_for_timeout(600)
        ok(await p.evaluate("!!VIEW"),"évaluation sauvegardée consultée")
        await p.click("[data-tg='0|32']"); await p.wait_for_timeout(2500)
        r=await p.evaluate("[!!VIEW, JSON.stringify((LS.get('arch',[])[0].conf||{}).corr||{}), JSON.stringify(Object.values(C_LIVE.corr||{}).filter(v=>(v.plus||[]).length))]")
        ok(r[0] and '"plus":[32]' in r[1] and r[2]=="[]","correction gardée dans la sauvegarde, évaluation en cours intacte (%s)"%r)
        ok("plus" in (json.loads(SRV["store"].get("arch","[]") or "[]")[0]["conf"].get("corr",{}) and json.dumps(json.loads(SRV["store"]["arch"])[0]["conf"]["corr"]) or ""),"sauvegarde renvoyée au script")
        await p.evaluate("archOff()")
        # --- 4. deux appareils ---
        SRV.update(conf=await p.evaluate("JSON.stringify(C)"),vc="1")
        await p.evaluate("()=>{VC='1';LS.set('vc','1');MBASE=mSnap(C)}")
        q=await page(b,errs); await q.goto(B+"co-eval/"); await q.wait_for_timeout(2500); await q.evaluate(SEED)
        await q.evaluate("(c)=>{LS.set('conf',JSON.parse(c));LS.set('vc','1')}",SRV["conf"]); await q.reload(); await q.wait_for_timeout(2500)
        await q.evaluate("syncing=true")   # appareil B resté sur l'ancienne version
        await p.evaluate("()=>{const x=allStudents().find(y=>y.me.prenom=='Fanny');withStudent(x,()=>corrToggle(x.runs[0],[32]))}"); await p.wait_for_timeout(2500)
        ok('"plus":[32]' in (SRV["conf"] or ""),"A : correction publiée")
        await q.evaluate("()=>{const x=allStudents().find(y=>y.me.prenom=='Gaston');C.sexe={...(C.sexe||{}),[x.me.id]:'F'};confChanged()}"); await q.wait_for_timeout(2500)
        s=json.loads(SRV["conf"]); ok(any(v.get("plus")==[32] for v in s.get("corr",{}).values()) and "F" in s.get("sexe",{}).values(),"B (ancienne version) publie sans effacer la correction de A")
        await p.evaluate("sync()"); await p.wait_for_timeout(1200)
        r=await p.evaluate("[Object.values(C.corr||{}).some(v=>(v.plus||[]).includes(32)), Object.values(C.sexe||{}).includes('F')]"); ok(r==[True,True],"A reçoit le changement de B et garde sa correction (%s)"%r)
        await p.evaluate("()=>{const x=allStudents().find(y=>y.me.prenom=='Fanny');withStudent(x,()=>corrToggle(x.runs[0],[32]))}"); await p.wait_for_timeout(2500)
        await q.evaluate("syncing=false"); await q.evaluate("sync()"); await q.wait_for_timeout(1200)
        r=await q.evaluate("[Object.values(C.corr||{}).some(v=>(v.plus||[]).includes(32)), Object.values(C.sexe||{}).includes('F')]"); ok(r==[False,True],"correction retirée par A : retirée aussi chez B (%s)"%r)
        print("captures :",SH)
        ok(not errs,"aucune erreur "+str(errs[:3])); await b.close()
    print(len(KO),"problème(s)")
asyncio.run(main()); srv.terminate()
