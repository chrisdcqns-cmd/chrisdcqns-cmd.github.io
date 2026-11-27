# CO Course, onglet 🎓 Note (27/11/2026) : 📝 grille modifiable (niveaux 1 et 2 seulement, textes des degrés),
# 🧾 fiche de chaque élève (PDF, zip par classe) et 📊 Excel aux degrés modifiables (formules recalculées par LibreOffice)
import asyncio,sys,subprocess,time,tempfile,os,zipfile,shutil
from playwright.async_api import async_playwright
SH=tempfile.mkdtemp(prefix="eps-coeg-")
ROOT=sys.argv[1]; PORT=8883
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT
KO=[]
def ok(c,m): print(("OK  " if c else "KO  ")+m,flush=True); c or KO.append(m)
SEED="""()=>{ C.parcours[0].max=20; C.parcours[0].nb=4; C.parcours[0].oblig=0; C.parcours[1].oblig=0; C.demo=false; C.alt={}; C.corr={}; C.niv=true; C.ncfg={attF:4,attG:4,avance:0};
  C.balises.forEach(b=>{ b.niv=[31,32].includes(+b.n)?1:[33,34].includes(+b.n)?2:1; }); LS.set("conf",C);
  const res={}, t0=Date.now()-3600e3, cd=n=>balise(n).code;
  const run=(plan,found,dur)=>{ const r={k:0,plan,prevu:plan.slice(),debut:t0,saisies:[],idx:0,ress:{}}; plan.forEach((n,i)=>{punch(r,found.includes(n)?cd(n):"ZZZ"); r.saisies[r.saisies.length-1].t=t0+(i+1)*60000;}); r.fin=t0+dur*60000; return packRun(r); };
  const mk=(prenom,classe,plan,found)=>{ const me={prenom,nom:"TEST",classe,prof:"Enseignant 1"}; me.id=studentId(me); res[me.id]={me,runs:[run(plan,found,15),null],recu:Date.now()}; C.sexe=C.sexe||{}; C.sexe[me.id]="F"; };
  mk("Alice","2GT1",[31,32,33,34],[31,32,33,34]); mk("Bilal","2GT1",[31,33,34,32],[31,33,34,32]); mk("Chloé","2GT2",[33,34,31,32],[33,34,31]);
  LS.set("conf",C); LS.set("res",res); LS.set("pf",""); }"""
ID="(p)=>allStudents().find(x=>x.me.prenom==p).me.id"
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"]); c=await b.new_context(service_workers="block",viewport={"width":1440,"height":900},accept_downloads=True)
        await c.add_init_script("try{localStorage.setItem('eps.teach.until',String(Date.now()+3600e3));localStorage.setItem('coe.tpw',JSON.stringify('x'))}catch(e){}")
        p=await c.new_page(); errs=[]; p.on("pageerror",lambda x:errs.append(str(x)[:200]))
        await p.goto(B+"co-eval/"); await p.wait_for_timeout(3000); await p.evaluate(SEED); await p.reload(); await p.wait_for_timeout(3000)
        ali=await p.evaluate(ID,"Alice")
        np=await p.evaluate("JSON.stringify(nivPair(ncfg()))"); ok('"hi":2' in np and '"lo":1' in np,"balises N1 et N2 : N2 comparé à N1 (%s)"%np)
        v=await p.evaluate("(id)=>{const v=noteData(allStudents().find(y=>y.me.id==id));return [v.nl,v.nh]}",ali); ok(v==[2,2],"Alice : 2 balises N1, 2 balises N2 (%s)"%v)
        await p.evaluate("go('prof','note')"); await p.wait_for_timeout(700); await p.click("#nGen"); await p.wait_for_timeout(700)
        t=await p.evaluate("(id)=>LS.get(NK(),{})[id].why[1]",ali); ok("N1 2 / N2 2" in t and "N3" not in t,"constat : « N1 2 / N2 2 » (%s)"%t)
        # --- 🎯 élément 1 : points rapportés (défaut) ---
        pc=await p.evaluate("JSON.stringify(ptsCfg())"); ok('"full":30' in pc and '"sFull":[8,15,23]' in pc,"points possibles 15 × 2 parcours = 30, seuils 8 / 15 / 23 (%s)"%pc)
        o=await p.evaluate("(id)=>{const x=allStudents().find(y=>y.me.id==id),q=noteProp(x);return [q.v.pts,q.d[0],q.a[0],q.why[0]]}",ali)
        ok(o[:3]==[6,0,1.25] and "6 point(s) rapporté(s) sur 30" in o[3],"Alice : 6 points rapportés → degré 1, 1,25 pt (6 sur 8 du degré) (%s)"%o)
        await p.evaluate("C.ncfg={...C.ncfg,ppp:3};confChanged()")
        o=await p.evaluate("(id)=>{const x=allStudents().find(y=>y.me.id==id),q=noteProp(x);return [q.d[0],q.a[0]]}",ali); ok(o==[3,6],"3 points par parcours (seuils 2 / 3 / 5 sur 6) : 6 points → degré 4, 6 pts (%s)"%o)
        await p.evaluate("C.ncfg={...C.ncfg,e1:'projet'};confChanged()")
        o=await p.evaluate("(id)=>{const x=allStudents().find(y=>y.me.id==id),q=noteProp(x);return [q.d[0],q.why[0]]}",ali); ok(o[0]==2 and "annoncés" in o[1],"règle « projet » toujours possible (%s)"%o)
        await p.evaluate("const c={...C.ncfg};delete c.ppp;delete c.e1;C.ncfg=c;confChanged()")
        # --- 📝 grille ---
        await p.click("#nGe"); await p.wait_for_timeout(500)
        tx=await p.evaluate("document.querySelector('.modal.big').innerText"); ok("N1, N2" in tx and "{haut} = N2" in tx.replace("\n"," "),"📝 grille : niveaux posés N1, N2, {haut} = N2")
        sm=await p.evaluate("[...document.querySelectorAll('[data-gk=\"1\"] .geg small')].map(x=>x.textContent)"); ok("plus de balises N2 que N1, sans oubli" in sm[2],"degré 3 de l'élément 2 : « plus de balises N2 que N1 » (%s)"%sm[2])
        await p.fill("[data-gk='2'] [data-ge='d3']","Toutes les balises attendues et des bonus"); await p.dispatch_event("[data-gk='2'] [data-ge='d3']","input")
        await p.select_option("#geH","1"); await p.wait_for_timeout(300)
        lo=await p.evaluate("document.querySelector('#geL').value"); ok(lo=="","niveau bas remis en automatique quand il dépasse le haut")
        await p.select_option("#geH","0"); await p.wait_for_timeout(300)
        tx=await p.evaluate("document.querySelector('.modal.big').innerText"); d0=await p.evaluate("document.querySelector('[data-gk=\"0\"] [data-ge=\"d0\"]').value"); ok("Points possibles par parcours" in tx and d0=="moins de {p2} points" and "→ moins de 8 points" in tx,"📝 élément 1 en points rapportés, seuils réglables")
        await p.fill("[data-ps='2']","20"); await p.dispatch_event("[data-ps='2']","change"); await p.wait_for_timeout(300)
        await p.fill("[data-ps='1']","25"); await p.dispatch_event("[data-ps='1']","change"); await p.wait_for_timeout(300)
        sv=await p.evaluate("[...document.querySelectorAll('[data-ps]')].map(x=>+x.value)"); ok(sv==[8,15,20],"seuils : 20 accepté, 25 (> degré 4) refusé (%s)"%sv)
        await p.screenshot(path=os.path.join(SH,"grille.png"),full_page=False)
        await p.click("#geOk"); await p.wait_for_timeout(600)
        ok(await p.evaluate("JSON.stringify(C.ncfg.ps)")=="[8,15,20]","seuils enregistrés")
        await p.evaluate("const c={...C.ncfg};delete c.ps;C.ncfg=c;confChanged()")
        g=await p.evaluate("JSON.stringify(C.ncfg.gt)"); ok('"2":{"d":["","","","Toutes les balises attendues et des bonus"]}' in g,"seul le texte modifié est enregistré (%s)"%g)
        await p.click("button[data-det='%s']"%ali); await p.wait_for_timeout(600)
        tx=await p.evaluate("document.querySelector('.modal.big').innerText"); ok("Toutes les balises attendues et des bonus" in tx and "N3" not in tx,"🔍 évaluation en grand : nouveau texte, plus de N3")
        await p.screenshot(path=os.path.join(SH,"grand.png"),full_page=True)
        async with p.expect_download() as dl: await p.click("#bgPdf")
        d=await dl.value; fp=os.path.join(SH,d.suggested_filename); await d.save_as(fp)
        import pypdf; pr=pypdf.PdfReader(fp); t1=" ".join(pr.pages[0].extract_text().split())
        ok(len(pr.pages)==1 and "Alice" in t1 and "POSITIONNÉ ICI" in t1 and t1.count("POSITIONNÉ ICI")==4 and "Toutes les balises attendues et des bonus" in t1,"📄 fiche PDF de l'élève : 1 page, 4 degrés positionnés, texte de la grille (%s)"%d.suggested_filename)
        await p.click("#bgX"); await p.wait_for_timeout(300)
        # niveaux réglés à la main : N2 comparé à « sans niveau » → recalcul
        await p.evaluate("C.ncfg={...C.ncfg,nh:2,nl:0};confChanged()"); v=await p.evaluate("(id)=>{const v=noteData(allStudents().find(y=>y.me.id==id));return [v.lo,v.nl,v.nh]}",ali); ok(v==[0,0,2],"niveaux choisis : N2 contre sans niveau (%s)"%v)
        await p.evaluate("const c={...C.ncfg};delete c.nh;delete c.nl;C.ncfg=c;confChanged()")
        # --- 🧾 fiches + zip ---
        await p.click("#nExp"); await p.wait_for_timeout(400)
        async with p.expect_download() as dl: await p.click("#exFi")
        d=await dl.value; fp=os.path.join(SH,d.suggested_filename); await d.save_as(fp); pr=pypdf.PdfReader(fp)
        ok(len(pr.pages)==3 and "Chloé" in pr.pages[2].extract_text(),"🧾 PDF : une page par élève (%d)"%len(pr.pages))
        async with p.expect_download() as dl: await p.click("#exFz")
        d=await dl.value; fz=os.path.join(SH,d.suggested_filename); await d.save_as(fz); nm=sorted(n for n in zipfile.ZipFile(fz).namelist() if not n.endswith("/"))
        ok(nm==["2GT1/CO_TEST_Alice.pdf","2GT1/CO_TEST_Bilal.pdf","2GT2/CO_TEST_Chloe.pdf"],"🗜 zip : un dossier par classe, un PDF par élève (%s)"%nm)
        # --- 📊 Excel ---
        async with p.expect_download() as dl: await p.click("#exXl")
        d=await dl.value; fx=os.path.join(SH,"notes.xlsx"); await d.save_as(fx)
        import openpyxl; wb=openpyxl.load_workbook(fx); ws=wb["Tous"]; hd=[x.value for x in ws[1]]; H={h:i for i,h in enumerate(hd)}
        ok(wb.sheetnames==["Tous","Grille"],"Excel : feuille Tous + Grille (%s)"%wb.sheetnames)
        r2=[x.value for x in ws[2]]; ok(str(r2[H["AFL1 (1) /6"]]).startswith("=ROUND(") and str(r2[H["Note proposée /20"]]).startswith("=ROUND(") and isinstance(r2[H["Degré AFL2"]],int),"Excel : degrés en nombres, points et note en formules")
        ok(len(ws.data_validations.dataValidation)==2,"Excel : choix imposés (degrés 1 à 4, répartition)")
        wd=openpyxl.load_workbook(fx,data_only=True)["Tous"]; js=await p.evaluate("()=>noteRows('').map(r=>[r.nom+r.prenom,r.prop])")
        cache=[[x[H["Nom"]]+x[H["Prénom"]],x[H["Note proposée /20"]]] for x in wd.iter_rows(min_row=2,values_only=True)]; ok(cache==js,"Excel : valeurs affichées = notes de l'appli (%s)"%cache)
        # recalcul réel : LibreOffice, sans changement puis avec des degrés et une répartition modifiés
        def recalc(src):
            out=os.path.join(SH,"lo"); shutil.rmtree(out,ignore_errors=True); os.makedirs(out)
            subprocess.run(["soffice","--headless","--calc","--convert-to","xlsx","--outdir",out,src],capture_output=True,timeout=120)
            return openpyxl.load_workbook(os.path.join(out,os.path.basename(src)),data_only=True)["Tous"]
        w0=recalc(fx); rc=[[x[H["Nom"]]+x[H["Prénom"]],x[H["Note proposée /20"]]] for x in w0.iter_rows(min_row=2,values_only=True)]
        ok(rc==js,"formules recalculées : mêmes notes que l'appli (%s)"%rc)
        wb=openpyxl.load_workbook(fx); ws=wb["Tous"]; row=[x for x in ws.iter_rows(min_row=2) if x[H["Prénom"]].value=="Chloé"][0]
        row[H["Degré AFL1 (1)"]].value=4; row[H["Degré AFL2"]].value=2; row[H["Degré AFL3"]].value=3; row[H["Répartition AFL2 / AFL3"]].value="2 et 6"; fm=os.path.join(SH,"modif.xlsx"); wb.save(fm)
        w1=recalc(fm); r=[x for x in w1.iter_rows(min_row=2,values_only=True) if x[H["Prénom"]]=="Chloé"][0]
        exp=await p.evaluate("()=>{const x=allStudents().find(y=>y.me.prenom=='Chloé'),o=LS.get(NK(),{})[x.me.id];return noteProp(x,[3,o.d[1],1,2],'2-6')}")
        ok(r[H["Note proposée /20"]]==exp["tot"] and r[H["Note retenue /20"]]==exp["tot"] and [r[H["AFL1 (1) /6"]],r[H["AFL2 (pts)"]],r[H["AFL3 (pts)"]]]==[exp["a"][0],exp["a"][2],exp["a"][3]],"degrés changés dans Excel : note recalculée comme dans l'appli (%s / %s)"%(r[H["Note proposée /20"]],exp["tot"]))
        row[H["Répartition AFL2 / AFL3"]].value="meilleure"; wb.save(fm); w2=recalc(fm); r=[x for x in w2.iter_rows(min_row=2,values_only=True) if x[H["Prénom"]]=="Chloé"][0]
        exp=await p.evaluate("()=>{const x=allStudents().find(y=>y.me.prenom=='Chloé'),o=LS.get(NK(),{})[x.me.id];return noteProp(x,[3,o.d[1],1,2],'max').tot}")
        ok(r[H["Note proposée /20"]]==exp,"répartition « meilleure » recalculée (%s / %s)"%(r[H["Note proposée /20"]],exp))
        print("captures et fichiers :",SH)
        ok(not errs,"aucune erreur "+str(errs[:3])); await b.close()
    print(len(KO),"problème(s)")
asyncio.run(main()); srv.terminate()
