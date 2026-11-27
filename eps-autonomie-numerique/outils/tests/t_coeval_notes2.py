# CO Course, onglet 🎓 Note (27/11/2026) : corrections ✏️ et codes acceptés visibles dans les bilans, « Pour tous… » (✨ meilleure note),
# filtre enseignant, 🔍 évaluation complète en grand, 📍 noter sur 1 parcours, 📤 export PDF / Excel (tous ou un enseignant)
import asyncio,sys,subprocess,time,tempfile,os
from playwright.async_api import async_playwright
SH=tempfile.mkdtemp(prefix="eps-coe2-")
ROOT=sys.argv[1]; PORT=8881
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT
KO=[]
def ok(c,m): print(("OK  " if c else "KO  ")+m,flush=True); c or KO.append(m)
SEED="""()=>{ // 5 élèves sur 2 enseignants ; parcours individuel de 4 balises (31 32 33 34) ; Emma a aussi le parcours collectif
  C.parcours[0].max=20; C.parcours[0].nb=4; C.parcours[0].oblig=0; C.parcours[1].oblig=0; C.parcours[1].nb=4; C.demo=false; C.alt={}; C.corr={}; LS.set("conf",C);
  const res={}, t0=Date.now()-3600e3;
  const run=(k,plan,codes,dur,dt)=>{ const r={k,plan,prevu:plan.slice(),debut:t0+dt,saisies:[],idx:0,ress:{}}; codes.forEach((c,i)=>{punch(r,c); r.saisies[r.saisies.length-1].t=t0+dt+(i+1)*60000;}); r.fin=t0+dt+dur*60000; return packRun(r); };
  const mk=(prenom,prof,codes,dur,two)=>{ const me={prenom,nom:"TEST",classe:prof==="Enseignant 1"?"2GT1":"2GT2",prof}; me.id=studentId(me);
    res[me.id]={me,runs:[run(0,[31,32,33,34],codes,dur,0), two?run(1,[35,36,37,38],["FER","DIX","GOL","PRA"],15,1800e3):null],recu:Date.now()}; };
  mk("Alice","Enseignant 1",["KTX","BOP","LUV","MAZ"],18); mk("Bilal","Enseignant 1",["KTR","BOP","LUV","MAZ"],19);
  mk("Chloé","Enseignant 2",["KTX","BOP","LUX","MAZ"],15); mk("Dylan","Enseignant 2",["KTR","BOP","LUV","MAZ"],17); mk("Emma","Enseignant 2",["KTR","BOP","LUV","MAZ"],16,1);
  LS.set("res",res); LS.set("pf",""); }"""
ID="(p)=>allStudents().find(x=>x.me.prenom==p).me.id"
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"]); c=await b.new_context(service_workers="block",viewport={"width":1440,"height":900},accept_downloads=True)
        await c.add_init_script("try{localStorage.setItem('eps.teach.until',String(Date.now()+3600e3));localStorage.setItem('coe.tpw',JSON.stringify('x'))}catch(e){}")
        p=await c.new_page(); errs=[]; p.on("pageerror",lambda x:errs.append(str(x)[:200]))
        await p.goto(B+"co-eval/"); await p.wait_for_timeout(3000); await p.evaluate(SEED); await p.reload(); await p.wait_for_timeout(3000)
        ali=await p.evaluate(ID,"Alice"); chl=await p.evaluate(ID,"Chloé"); bil=await p.evaluate(ID,"Bilal"); emm=await p.evaluate(ID,"Emma")
        # --- 1. bug : correction ✏️ reportée dans le bilan ---
        await p.evaluate("go('prof','note')"); await p.wait_for_timeout(700)
        await p.click("button[data-cr='%s']:not([title])"%ali); await p.wait_for_timeout(400)
        await p.check("[data-cl='0'] [data-cf='31']"); await p.click("#crOk"); await p.wait_for_timeout(600)
        cr=await p.evaluate("(id)=>{const x=allStudents().find(y=>y.me.id==id);return JSON.stringify(withStudent(x,()=>corrOf(x.runs[0])))}",ali)
        ok('"plus":[31]' in cr,"correction enregistrée en écart (%s)"%cr)
        await p.evaluate("(id)=>{const x=allStudents().find(y=>y.me.id==id);ME=x.me;RUNS=x.runs;go('full',true)}",ali); await p.wait_for_timeout(700)
        t=await p.evaluate("document.querySelector('#app').innerText")
        ok("validée par l'enseignant" in t and "code faux" not in t,"bilan d'Alice : la balise 31 corrigée n'est plus « code faux »")
        ok("Parcours réalisé sans erreur" in t or "0 balise(s) non validée" not in t,"bilan d'Alice : plus d'erreur annoncée")
        await p.screenshot(path=os.path.join(SH,"bilan.png"),full_page=True)
        # --- correction ✏️ puis code accepté : les deux comptent ---
        await p.evaluate("go('prof','note')"); await p.wait_for_timeout(700)
        await p.click("button[data-cr='%s']:not([title])"%chl); await p.wait_for_timeout(400)
        await p.check("[data-cl='0'] [data-cf='33']"); await p.click("#crOk"); await p.wait_for_timeout(600)
        await p.evaluate("go('prof','corr')"); await p.wait_for_timeout(700)
        await p.click("[data-acc='31|KTX']"); await p.wait_for_timeout(600)
        f=await p.evaluate("(id)=>{const x=allStudents().find(y=>y.me.id==id);return analyse(x.runs[0]).found.map(Number).sort()}",chl)
        ok(f==[31,32,33,34],"Chloé : 33 corrigée ✏️ + KTX accepté ensuite → 4 balises (%s)"%f)
        await p.evaluate("(id)=>{const x=allStudents().find(y=>y.me.id==id);ME=x.me;RUNS=x.runs;go('full',true)}",chl); await p.wait_for_timeout(700)
        t=await p.evaluate("document.querySelector('#app').innerText")
        ok("code KTX accepté" in t and "validée par l'enseignant" in t and "code faux" not in t,"bilan de Chloé : code accepté et balise corrigée affichés")
        old=await p.evaluate("""(id)=>{const x=allStudents().find(y=>y.me.id==id), k=runKey(x.runs[0]); const keep=C.corr[k]; C.corr[k]={plan:[31,32,33,34],ok:[32,33,34]}; const f=analyse(x.runs[0]).found.map(Number).sort(); C.corr[k]=keep; return f}""",chl)
        ok(old==[31,32,33,34],"ancienne correction (liste complète) + code accepté depuis : repris (%s)"%old)
        # --- 2. filtre enseignant dans Note ---
        await p.evaluate("go('prof','note')"); await p.wait_for_timeout(700)
        await p.click("#pv [data-pf='Enseignant 2']"); await p.wait_for_timeout(500)
        n=await p.evaluate("[...document.querySelectorAll('#pv [data-rp]')].length"); ok(n==3,"filtre « Enseignant 2 » : 3 élèves (%d)"%n)
        await p.click("#pv [data-pf='']"); await p.wait_for_timeout(500)
        await p.evaluate("C.sexe={};allStudents().forEach(x=>C.sexe[x.me.id]='F');C.ncfg={attF:4,attG:4,avance:0};LS.set('conf',C);go('prof','note')"); await p.wait_for_timeout(500)
        await p.click("#nGen"); await p.wait_for_timeout(800)
        # --- 3. « Pour tous… » : ✨ meilleure note ---
        await p.select_option("#nRpAll","max"); await p.wait_for_timeout(700)
        r=await p.evaluate("""()=>{const N=LS.get(NK(),{});return allStudents().filter(x=>x.runs.some(r=>r&&r.fin)).map(x=>[C.repart[x.me.id],N[x.me.id].max,N[x.me.id].prop===noteProp(x,null,'max').tot])}""")
        ok(all(x[0]=="max" and x[1]==1 and x[2] for x in r),"« Pour tous… ✨ Meilleure note » : 5 élèves, notes recalculées (%s)"%r)
        # --- 4. 📍 noter sur 1 parcours ---
        att0=await p.evaluate("(id)=>noteData(allStudents().find(y=>y.me.id==id)).att",bil)
        ok(await p.locator("[data-un='%s']"%emm).count()==0,"Emma (2 parcours) : pas de bouton « 1 parcours »")
        await p.click("[data-un='%s']"%bil); await p.wait_for_timeout(600)
        att1=await p.evaluate("(id)=>{const x=allStudents().find(y=>y.me.id==id);return [noteData(x).att,noteData(x).un,LS.get(NK(),{})[id].un]}",bil)
        ok(att0==4 and att1==[2,True,1],"Bilal noté sur 1 parcours : 4 → 2 balises attendues (%s → %s)"%(att0,att1))
        await p.fill("#nF1","3"); await p.dispatch_event("#nF1","change"); await p.wait_for_timeout(500)
        ok(await p.evaluate("(id)=>noteData(allStudents().find(y=>y.me.id==id)).att",bil)==3,"balises attendues pour 1 parcours réglables (3)")
        # --- 5. 🔍 évaluation complète en grand ---
        await p.click("button[data-det='%s']"%ali); await p.wait_for_timeout(700)
        ok(await p.locator(".modal.big .evgt").count()==1,"🔍 : grille en grand")
        n=await p.evaluate("[document.querySelectorAll('.modal.big .evc').length,document.querySelectorAll('.modal.big .evc.on').length]"); ok(n==[16,4],"grille : 4 AFL × 4 degrés, 4 degrés proposés (%s)"%n)
        t=await p.evaluate("document.querySelector('.modal.big').innerText")
        ok("Degré 4" in t and "📌 proposé" in t and "AFL1 · élément 1" in t and "Répartition AFL2 / AFL3" in t,"grille : degrés, positionnement proposé, répartition")
        await p.screenshot(path=os.path.join(SH,"grand.png"),full_page=True)
        d0=await p.evaluate("(id)=>LS.get(NK(),{})[id].d[0]",ali); nd=(d0+3)%4 if d0!=0 else 1
        await p.click(".modal.big .evc[data-gi='0'][data-gd='%d']"%nd); await p.wait_for_timeout(500)
        o=await p.evaluate("(id)=>{const o=LS.get(NK(),{})[id],x=allStudents().find(y=>y.me.id==id);return [o.d[0],o.dm[0],o.prop===noteProp(x,[o.d[0],null,null,null]).tot]}",ali)
        ok(o==[nd,True,True],"appui sur un degré : choisi par l'enseignant, note recalculée (%s)"%o)
        ok(await p.locator(".modal.big .evc.pp").count()==1,"degré proposé gardé en pointillés")
        nom=await p.evaluate("document.querySelector('.modal.big h2').innerText"); await p.click("#bgN"); await p.wait_for_timeout(400)
        nom2=await p.evaluate("document.querySelector('.modal.big h2').innerText"); ok(nom!=nom2,"› élève suivant (%s → %s)"%(nom,nom2))
        await p.keyboard.press("ArrowLeft"); await p.wait_for_timeout(300); ok(await p.evaluate("document.querySelector('.modal.big h2').innerText")==nom,"‹ flèche du clavier : élève précédent")
        await p.click("#bgRz"); await p.wait_for_timeout(300); ok(await p.evaluate("(id)=>LS.get(NK(),{})[id].d[0]",ali)==d0,"↺ Degrés proposés")
        await p.click("#bgX"); await p.wait_for_timeout(400); ok(await p.locator(".modal.big").count()==0,"✕ Fermer")
        p2=await c.new_page(); await p2.set_viewport_size({"width":390,"height":844}); await p2.goto(B+"co-eval/"); await p2.wait_for_timeout(2500); await p2.evaluate("go('prof','note')"); await p2.wait_for_timeout(600)
        await p2.click("button[data-det='%s']"%ali); await p2.wait_for_timeout(600)
        ow=await p2.evaluate("document.documentElement.scrollWidth<=innerWidth+1"); ok(ow,"téléphone : la grille défile dans son cadre, pas la page"); await p2.screenshot(path=os.path.join(SH,"grand-tel.png")); await p2.close()
        # --- 6. 📤 export ---
        await p.click("#nExp"); await p.wait_for_timeout(400)
        async with p.expect_download() as dl: await p.click("#exXl")
        d=await dl.value; fx=os.path.join(SH,d.suggested_filename); await d.save_as(fx)
        import openpyxl; wb=openpyxl.load_workbook(fx)
        ok(wb.sheetnames==["Tous","Enseignant 1","Enseignant 2"],"Excel : feuille Tous + une par enseignant (%s)"%wb.sheetnames)
        ws=wb["Tous"]; hd=[x.value for x in ws[1]]; rows=list(ws.iter_rows(min_row=2,values_only=True))
        ok(len(rows)==5 and hd[22]=="Note retenue /20" and all(isinstance(r[22],(int,float)) for r in rows),"Excel : 5 élèves, notes en nombres")
        ok(len(list(wb["Enseignant 1"].iter_rows(min_row=2)))==2,"Excel : 2 élèves pour l'Enseignant 1")
        async with p.expect_download() as dl: await p.click("#exPdf")
        d=await dl.value; fp=os.path.join(SH,d.suggested_filename); await d.save_as(fp)
        import pypdf; pr=pypdf.PdfReader(fp); tx="\n".join(pg.extract_text() for pg in pr.pages)
        ok(len(pr.pages)==2 and "Enseignant 2" in tx and "Alice" in tx and "Emma" in tx,"PDF : une page par enseignant, tous les élèves (%d pages)"%len(pr.pages))
        await p.click("#exW [data-w='1']"); await p.wait_for_timeout(300)
        async with p.expect_download() as dl: await p.click("#exPdf")
        d=await dl.value; fp=os.path.join(SH,d.suggested_filename); await d.save_as(fp)
        tx="\n".join(pg.extract_text() for pg in pypdf.PdfReader(fp).pages)
        ok("Alice" in tx and "Emma" not in tx and "Enseignant_1" in d.suggested_filename,"PDF d'un seul enseignant (%s)"%d.suggested_filename)
        async with p.expect_download() as dl: await p.click("#exXl")
        d=await dl.value; fx=os.path.join(SH,d.suggested_filename); await d.save_as(fx); wb=openpyxl.load_workbook(fx)
        ok(wb.sheetnames==["Enseignant 1"] and len(list(wb.active.iter_rows(min_row=2)))==2,"Excel d'un seul enseignant")
        print("captures et fichiers :",SH)
        ok(not errs,"aucune erreur "+str(errs[:3])); await b.close()
    print(len(KO),"problème(s)")
asyncio.run(main()); srv.terminate()
