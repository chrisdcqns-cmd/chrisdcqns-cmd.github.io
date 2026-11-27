# CO Course : onglet 🔤 Correction (récap par balise, accepter un code), Note (temps corrigé, meilleure répartition, détail AFL)
import asyncio,sys,subprocess,time,tempfile,os,json
SH=tempfile.mkdtemp(prefix="eps-coe-")
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; PORT=8879
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT
KO=[]
def ok(c,m): print(("OK  " if c else "KO  ")+m,flush=True); c or KO.append(m)
SEED="""()=>{ // 4 élèves, parcours individuel de 4 balises (31 32 33 34), temps max 20 min ; « KTX » tapé à la place de KTR (31) par 3 élèves
  C.parcours[0].max=20; C.parcours[0].nb=4; C.parcours[0].oblig=0; C.demo=false; LS.set("conf",C);
  const res={}, t0=Date.now()-3600e3;
  const mk=(prenom,codes,dur)=>{ const me={prenom,nom:"TEST",classe:"2GT1",prof:"Enseignant 1"}; me.id=studentId(me);
    const r={k:0,plan:[31,32,33,34],prevu:[31,32,33,34],debut:t0,saisies:[],idx:0,ress:{}}; codes.forEach((c,i)=>{punch(r,c); r.saisies[r.saisies.length-1].t=t0+(i+1)*60000;}); r.fin=t0+dur*60000;
    res[me.id]={me,runs:[packRun(r),null],recu:Date.now()}; };
  mk("Alice",["KTX","BOP","LUV","MAZ"],18); mk("Bilal",["KTX","BOP","LUV","MAZ"],25); mk("Chloé",["KTX","BOP","LUX","MAZ"],15); mk("Dylan",["KTR","BOP","LUV","MAZ"],19);
  LS.set("res",res); }"""
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"]); c=await b.new_context(service_workers="block",viewport={"width":1440,"height":900})
        await c.add_init_script("try{localStorage.setItem('eps.teach.until',String(Date.now()+3600e3));localStorage.setItem('coe.tpw',JSON.stringify('x'))}catch(e){}")
        p=await c.new_page(); errs=[]; p.on("pageerror",lambda x:errs.append(str(x)[:200]))
        await p.goto(B+"co-eval/"); await p.wait_for_timeout(3000); await p.evaluate(SEED); await p.reload(); await p.wait_for_timeout(3000)
        await p.evaluate("go('prof','corr')"); await p.wait_for_timeout(800)
        txt=await p.evaluate("document.querySelector('#pv').innerText")
        ok("KTX × 3" in txt,"récap : « KTX × 3 » sur la balise 31")
        ok("tapé 3 fois" in txt,"récap : code suspect signalé")
        ok("LUX × 1" in txt,"récap : « LUX » sur la 33")
        ok("tout le monde a le bon code" in txt,"récap : balises sans erreur signalées")
        await p.screenshot(path=os.path.join(SH,"corr1.png"),full_page=True)
        await p.click("[data-acc='31|KTX']"); await p.wait_for_timeout(800)
        ok(await p.evaluate("JSON.stringify(C.alt[31])")=='["KTX"]',"« Accepter KTX » : ajouté aux codes acceptés")
        txt=await p.evaluate("document.querySelector('#pv').innerText")
        ok("KTX × 3" not in txt,"récap recalculé : KTX compté juste")
        # note
        await p.evaluate("go('prof','note')"); await p.wait_for_timeout(800)
        await p.evaluate("C.sexe={};allStudents().forEach(x=>C.sexe[x.me.id]='F');C.ncfg={attF:4,attG:4,avance:0};LS.set('conf',C);go('prof','note')"); await p.wait_for_timeout(600)
        await p.click("#nGen"); await p.wait_for_timeout(900)
        bil=await p.evaluate("allStudents().find(x=>x.me.prenom=='Bilal').me.id")
        st=await p.evaluate("(id)=>{const x=allStudents().find(y=>y.me.id==id);return noteData(x).over}",bil); ok(st==1,"Bilal : hors temps (25 min / 20)")
        # corriger le temps
        await p.click("button[data-cr='%s'][title]"%bil); await p.wait_for_timeout(500)
        await p.select_option("[data-ct='0']","in"); await p.click("#crOk"); await p.wait_for_timeout(700)
        st=await p.evaluate("(id)=>{const x=allStudents().find(y=>y.me.id==id);return [noteData(x).over,noteData(x).tfix,noteData(x).nb]}",bil); ok(st==[0,1,4],"Bilal compté dans les temps, balises intactes (%s)"%st)
        # meilleure répartition
        await p.select_option("[data-rp='%s']"%bil,"max"); await p.wait_for_timeout(500)
        r=await p.evaluate("""(id)=>{const x=allStudents().find(y=>y.me.id==id);const a=["4-4","6-2","2-6"].map(r=>noteProp(x,null,r).tot), m=noteProp(x,null,"max");return [a,m.tot,m.rep,m.max]}""",bil)
        ok(r[1]==max(r[0]) and r[3]==1,"meilleure répartition = la meilleure des trois %s → %s (%s)"%(r[0],r[1],r[2]))
        await p.click("[data-rpz='%s']"%bil) if await p.locator("[data-rpz='%s']"%bil).count() else None
        await p.click("#nGen"); await p.wait_for_timeout(600)
        await p.click("button[data-det='%s']"%bil); await p.wait_for_timeout(600)
        d=await p.evaluate("document.querySelector('.modal')?document.querySelector('.modal').innerText:document.body.innerText.slice(-1500)")
        ok("AFL1 · élément 1" in d and "AFL3" in d and "Note selon la répartition" in d and "✨" in d,"détail des AFL : 4 AFL et comparaison des répartitions")
        await p.screenshot(path=os.path.join(SH,"det.png"))
        ok(not errs,"aucune erreur "+str(errs[:3])); await b.close()
    print(len(KO),"problème(s)")
asyncio.run(main()); srv.terminate()
