# Relais : l'onglet Évaluation s'ouvre sans leçon ouverte (et sans classe choisie) ; export Pronote présent et rempli.
import asyncio,sys,subprocess,time,json
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; PORT=8876
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
    p.on("pageerror",lambda x:errs.append("ERR "+str(x)[:400])); p.on("console",lambda m:errs.append("con "+m.text[:300]) if m.type in("error","warning") and "Failed to load" not in m.text else None)
    await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("EPSD.demo.create()"); await p.wait_for_timeout(2500)
    await p.goto(B+"relais/"); await p.wait_for_timeout(3000)
    tab="document.querySelector('.epst-nav button[data-t=eval]').click()"
    # 1. une seule classe, aucune choisie, aucune leçon
    await p.evaluate("DATA.cur=null;DATA.lecon=null;persist();go('classes')"); await p.evaluate(tab); await p.wait_for_timeout(1200)
    chk(await p.evaluate("viewNow()")=="eval","une seule classe, aucune leçon : Évaluation s'ouvre ("+await p.evaluate("viewNow()")+")")
    # 2. deux classes : on demande la classe puis on arrive sur l'évaluation
    await p.evaluate("(()=>{const c=JSON.parse(JSON.stringify(DATA.classes[0]));c.id='zz2';c.name='TEST 2';c.lecons=[];c.courses=[];DATA.classes.push(c);DATA.cur=null;DATA.lecon=null;persist();go('classes')})()")
    await p.evaluate(tab); await p.wait_for_timeout(800)
    chk(await p.evaluate("viewNow()")=="classes" and "à évaluer" in await p.evaluate("document.querySelector('#cl-hint').textContent"),"deux classes : choix de la classe à évaluer")
    await p.evaluate("document.querySelector('#clist [data-class]').click()"); await p.wait_for_timeout(1200)
    chk(await p.evaluate("viewNow()")=="eval","après le choix de la classe : Évaluation")
    await p.evaluate("go('classes')"); chk(await p.evaluate("document.querySelector('#cl-hint').textContent")=="Choisis la classe pour commencer","texte normal revenu")
    await p.evaluate("document.querySelector('#clist [data-class]').click()"); await p.wait_for_timeout(600); chk(await p.evaluate("viewNow()")=="lecons","choix normal d'une classe : Leçons")
    # 3. classe choisie, pas de leçon : évaluer un élève
    await p.evaluate(tab); await p.wait_for_timeout(1000); chk(await p.evaluate("viewNow()")=="eval","classe choisie sans leçon : Évaluation")
    await p.evaluate("document.querySelector('#ev-names [data-eve]').click()"); await p.wait_for_timeout(800)
    for k in ("perf","trans","proj","role"):
        # fiche commune (forme Escalade, 28/11/2026) : degré 3 = data-d 2
        await p.evaluate("(()=>{const b=document.querySelector('#ev-body [data-crits] [data-c=%s][data-d=\"2\"]');if(!b.classList.contains('on'))b.click()})()"%k); await p.wait_for_timeout(400)
    chk(await p.evaluate("(()=>{const o=CL().evals[EV_SEL];return evTotal(o.prof,evRepOf(o)).n})()")==4,"grille remplie sans leçon ouverte")
    pass
    btn=await p.evaluate("[...document.querySelectorAll('#v-eval button')].filter(b=>b.offsetParent).map(b=>b.innerText.trim().slice(0,50))")
    chk(any("Pronote" in x for x in btn),"bouton Pronote dans le bilan de l'évaluation")
    await p.evaluate("document.querySelector('#ev-bilan [data-x-pn]').click()"); await p.wait_for_timeout(1200)
    pass
    txt=await p.evaluate("(()=>{const m=[...document.querySelectorAll('body > div')].filter(d=>/Pronote/.test(d.innerText)&&getComputedStyle(d).position=='fixed').pop();return m?m.innerText:''})()")

    chk("Note" in txt,"fenêtre Pronote ouverte avec des colonnes")
    await p.evaluate("(()=>{const m=[...document.querySelectorAll('body > div')].filter(d=>/Notes pour Pronote/.test(d.innerText)).pop();const b=m&&[...m.querySelectorAll('button')].find(x=>/Fermer/.test(x.innerText));if(b)b.click()})()")
    # 4. bouton « 📋 Export Pronote » commun, à droite des trois modes de l'évaluation finale
    r=await p.evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.offsetParent&&/^📋\\s*(Export )?Pronote/.test(x.innerText.trim())&&!x.hasAttribute('data-x-pn'));if(!b)return 'absent';b.click();return 'ok'})()"); await p.wait_for_timeout(1000)
    chk(r=="ok" and await p.evaluate("/Notes pour Pronote/.test(document.body.innerText)"),"bouton Export Pronote à côté des modes ("+r+")")
    await p.evaluate("(()=>{const m=[...document.querySelectorAll('body > div')].filter(d=>/Notes pour Pronote/.test(d.innerText)).pop();const b=m&&[...m.querySelectorAll('button')].find(x=>/Fermer/.test(x.innerText));if(b)b.click()})()")
    # 5. Évaluer → 📤 Bilan et export : le bilan de l'évaluation seul (la grille est cachée) ; « Bilan des leçons (courses) » (goBilans) : bilan de la leçon
    await p.evaluate("EPSTR.go('bil')"); await p.wait_for_timeout(1000)
    chk(await p.evaluate("viewNow()==='eval'&&$('#ev-bilan').style.display!=='none'&&$('#ev-host').style.display==='none'&&$('#ev-namesc').style.display==='none'"),"Bilan et export : bilan de l'évaluation, sans la grille")
    await p.evaluate("EPSTR.evGo('fin')"); await p.wait_for_timeout(1000)
    chk(await p.evaluate("viewNow()==='eval'&&$('#ev-bilan').style.display==='none'&&!!document.querySelector('#ev-host .epse-col')"),"Évaluation finale : la grille avec la colonne des élèves, sans le bilan")
    await p.evaluate("(()=>{const C=CL();C.lecons.push({id:'lz1',date:todayISO(),cfg:JSON.parse(JSON.stringify(DEFCFG)),groupes:[]});persist()})()")
    await p.evaluate("goBilans()"); await p.wait_for_timeout(900); chk(await p.evaluate("viewNow()")=="bilan","Bilan des leçons avec une leçon : bilan de la leçon ("+await p.evaluate("viewNow()")+")")
    await p.evaluate("DATA.cur=null;persist();go('classes')"); await p.evaluate("goBilans()"); await p.wait_for_timeout(600)
    chk("bilans" in await p.evaluate("document.querySelector('#cl-hint').textContent"),"Bilan des leçons sans classe (2 classes) : on demande la classe")
    await p.evaluate("document.querySelector('#clist [data-class]').click()"); await p.wait_for_timeout(900); chk(await p.evaluate("viewNow()")=="bilan","puis bilan de la leçon")
    print("erreurs:",errs)
    chk(not [e for e in errs if e.startswith("ERR")],"aucune erreur de page")
    await b.close()
asyncio.run(main()); srv.terminate(); print("TOUT EST BON" if ok else "DES ÉCHECS"); sys.exit(0 if ok else 1)
