# Relais : un seul onglet 📡 Suivi pour tout piloter (appels, démarrer, étape, minuteur, message, terminer, suivi des courses).
import asyncio,sys,subprocess,time
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; PORT=8871; SHOT=sys.argv[2] if len(sys.argv)>2 else ""
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
    p=await c.new_page(); errs=[]; p.on("pageerror",lambda x:errs.append(str(x)[:300])); p.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
    await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("EPSD.demo.create()"); await p.wait_for_timeout(2500)
    await p.goto(B+"relais/"); await p.wait_for_timeout(4000)
    V="viewNow()"; cur="(document.querySelector('.epst-nav button.on')||{}).dataset.t"; T=lambda: p.evaluate("document.querySelector('#lv-ctl').innerText")
    tabs=await p.evaluate("[...document.querySelectorAll('.epst-nav button')].filter(b=>getComputedStyle(b).display!=='none').map(b=>b.dataset.t)")
    chk(tabs[:2]==["seq","suivi"],"onglet Suivi juste après Séquence "+str(tabs))
    acts=await p.evaluate("[...document.querySelectorAll('.epst-tb button')].map(b=>b.title).join('|')")
    chk("En direct" not in acts and "Pilotage" not in acts,"Séquence : plus d'« En direct » ni de « Pilotage de leçon » en double")
    await p.click(".epst-nav [data-t=suivi]"); await p.wait_for_timeout(1500)
    chk(await p.evaluate(V)=="live" and await p.evaluate(cur)=="suivi","Suivi s'ouvre sans leçon ouverte (une seule classe prise d'office)")
    t=await T(); chk("Démarrer la leçon" in t and "Pas encore de leçon" in t,"sans leçon : bouton Démarrer ("+t[:60].replace("\n"," / ")+")")
    chk(await p.evaluate("document.querySelector('#lv-sum').offsetParent===null"),"pas de chiffres tant qu'il n'y a pas de leçon")
    await p.evaluate("syRefresh()"); await p.wait_for_timeout(400); chk(await p.evaluate(V)=="live","une synchro ne fait pas quitter le suivi")
    await p.click("#lv-ctl [data-lvc=start]"); await p.wait_for_timeout(1200)
    cls=await p.evaluate("CL().name")
    chk(await p.evaluate("!!CLE()&&CLE().date===todayISO()&&EPSLC.ctl.state(CL().name).on"),"Démarrer : leçon du jour du relais ouverte et leçon lancée sur les tablettes")
    t=await T(); chk("En cours" in t and "Étape" in t and "Minuteur" in t and "Message" in t and "Terminer" in t,"leçon lancée : étape, minuteur, message, terminer sur une ligne")
    chk(await p.evaluate("document.querySelector('#lv-sum').offsetParent!==null&&/courses/.test(document.querySelector('#lv-sum').innerText)"),"suivi des courses affiché dessous")
    await p.click("#lv-ctl [data-p=part]"); await p.wait_for_timeout(300); await p.click("#lv-ctl [data-lvc=part][data-p=ech]"); await p.wait_for_timeout(500)
    chk(await p.evaluate("EPSLC.ctl.state(CL().name).part")=="ech" and "Échauffement" in await T(),"étape envoyée et affichée sur le bouton")
    await p.click("#lv-ctl [data-p=tim]"); await p.wait_for_timeout(300); await p.click("#lv-ctl [data-lvc=tim][data-p='5']"); await p.wait_for_timeout(2400)
    tl=await p.evaluate("(document.querySelector('#lv-tleft')||{}).textContent||''")
    chk(await p.evaluate("!!EPSLC.ctl.state(CL().name).tim") and tl[:2]=="4:" and len(tl)==4,"minuteur de 5 min lancé, décompte sur le bouton ("+tl+" / "+(await T())[:80].replace("\n"," | ")+")")
    await p.click("#lv-ctl [data-p=msg]"); await p.wait_for_timeout(300); await p.fill("#lv-msg","Regroupement"); await p.evaluate("renderLive()"); 
    chk(await p.evaluate("document.querySelector('#lv-msg').value")=="Regroupement","le rafraîchissement n'efface pas le message en cours de saisie")
    await p.click("#lv-ctl [data-lvc=send]"); await p.wait_for_timeout(600)
    chk(await p.evaluate("JSON.stringify(EPSLC._test.all(EPSLC._test.KV)).includes('Regroupement')"),"message envoyé aux tablettes")
    if SHOT: await p.screenshot(path=SHOT+"suivi.png")
    # ⋯ Plus : ce que « Leçon en cours » a en plus, sans les commandes en double ; plus de « Leçon en cours » dans Séquence
    await p.click("#lv-ctl [data-lvc=plus]"); await p.wait_for_timeout(1500)
    r=await p.evaluate("(()=>{const o=document.querySelector('.lc-ov'),v=e=>!!e&&e.offsetParent!==null,t=o?o.innerText:'';return {open:!!o&&getComputedStyle(o).display!=='none',rang:/Rangement/.test(t),grp:/Groupes du jour/.test(t),msg:v(o.querySelector('[data-mt]')),tim:v(o.querySelector('[data-tl]')),stop:v(o.querySelector('[data-stop]')),part:v(o.querySelector('[data-part]')),back:v(o.querySelector('[data-minback]'))}})()")
    chk(r["open"] and r["rang"] and r["grp"] and r["back"] and not (r["msg"] or r["tim"] or r["stop"] or r["part"]),"⋯ Plus : appel, matériel, groupes, rôles, rangement, sans message / minuteur / étape / terminer "+str(r))
    if SHOT: await p.screenshot(path=SHOT+"plus.png")
    await p.evaluate("document.querySelector('.lc-ov [data-minback]').click()"); await p.wait_for_timeout(1200)
    chk(await p.evaluate(V)=="live" and await p.evaluate(cur)=="suivi" and not await p.evaluate("(()=>{const o=document.querySelector('.lc-ov');return !!o&&getComputedStyle(o).display!=='none'})()"),"← Suivi : retour au suivi")
    la=await p.evaluate("EPSLC.actions().map(a=>a.label).join('|')"); chk("Leçon en cours" not in la and "Fiches de leçon" in la,"Séquence : plus de « Leçon en cours » en double")
    await p.evaluate("EPSLC.open('live',CL().name)"); await p.wait_for_timeout(900); chk(await p.evaluate("document.querySelector('.lc-ov [data-mt]').offsetParent!==null"),"l'écran commun complet reste intact quand on l'ouvre autrement"); await p.evaluate("EPSLC.close()")
    # appel d'un élève en tête
    chk(await p.evaluate("typeof EPSD.appels.html('relais')==='string'&&!!document.querySelector('#lv-calls')"),"emplacement des appels en tête de l'écran")
    await p.click(".epst-nav [data-t=seq]"); await p.wait_for_timeout(1500); chk(await p.evaluate(cur)=="seq","retour à Séquence")
    await p.evaluate("EPSLC.controle({cls:CL().name})"); await p.wait_for_timeout(1800); chk(await p.evaluate(V)=="live" and await p.evaluate(cur)=="suivi" and not await p.evaluate("!!document.getElementById('lc-ctl')&&document.getElementById('lc-ctl').style.display!=='none'"),"pastille ✋ / contrôle : ouvre le suivi du relais, pas le pilotage commun")
    await p.click("#lv-ctl [data-lvc=stop]"); await p.wait_for_timeout(700); chk(not await p.evaluate("EPSLC.ctl.state(CL().name).on") and "Démarrer" in await T(),"Terminer : leçon arrêtée, bouton Démarrer revenu")
    # deux classes, aucune choisie : on demande la classe à suivre
    await p.evaluate("(()=>{const c=JSON.parse(JSON.stringify(DATA.classes[0]));c.id='zz2';c.name='TEST 2';c.lecons=[];c.courses=[];DATA.classes.push(c);DATA.cur=null;DATA.lecon=null;persist();go('classes')})()")
    await p.click(".epst-nav [data-t=suivi]"); await p.wait_for_timeout(900)
    chk(await p.evaluate(V)=="classes" and "à suivre" in await p.evaluate("document.querySelector('#cl-hint').textContent"),"deux classes : « Choisis la classe à suivre »")
    await p.evaluate("document.querySelector('#clist [data-class]').click()"); await p.wait_for_timeout(1000); chk(await p.evaluate(V)=="live","puis le suivi de cette classe")
    # élève : rien de tout cela
    c2=await b.new_context(service_workers="block",viewport={"width":1024,"height":768},storage_state=await c.storage_state()); await c2.add_init_script("try{localStorage.removeItem('eps.teach.until')}catch(e){}")
    q=await c2.new_page(); q.on("pageerror",lambda x:errs.append("élève "+str(x)[:300])); await q.goto(B+"relais/"); await q.wait_for_timeout(3500)
    chk(await q.evaluate("viewNow()!=='live'&&!document.documentElement.classList.contains('epst-on')"),"côté élève : pas de suivi")
    print("erreurs:",errs); chk(not errs,"aucune erreur de page"); await b.close()
asyncio.run(main()); srv.terminate(); sys.exit(0 if ok else 1)
