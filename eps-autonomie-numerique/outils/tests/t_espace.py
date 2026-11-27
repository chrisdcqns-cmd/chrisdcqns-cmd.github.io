# Espace élève : l'enseignant publie, l'élève ouvre avec son code, fait le quiz, l'enseignant relève. python3 t_espace.py <racine du dépôt>
import asyncio,sys,subprocess,time,json,urllib.parse
from playwright.async_api import async_playwright
ROOT=sys.argv[1]
srv=subprocess.Popen([sys.executable,"-I","-m","http.server","8832","--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
gs=subprocess.Popen([sys.executable,"-I","mockgs.py"]); time.sleep(1.5)
B="http://localhost:8832/eps-autonomie-numerique/"; G="http://127.0.0.1:8899/exec"
async def main():
    out=[]; errs=[]
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox"])
        cp=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); await cp.add_init_script("try{localStorage.setItem('eps.gate.step2','0');localStorage.setItem('eps.sec','0');localStorage.setItem('eps.demo.eleve','1');localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.share.v1',JSON.stringify({url:'"+G+"',key:'CLE'}))}catch(e){}")
        p=await cp.new_page(); p.on("pageerror",lambda x:errs.append("prof "+str(x)[:200])); p.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("(async()=>{var x=EPSD.demo.create();if(x&&x.then)await x})()"); await p.wait_for_timeout(1200)
        await p.goto(B+"volley/"); await p.wait_for_timeout(3500)
        await p.goto(B+"quiz/"); await p.wait_for_timeout(1500); await p.click("[data-t=mes]"); await p.click("#ex"); await p.wait_for_timeout(300)
        await p.goto(B+"espace/"); await p.wait_for_timeout(2500)
        out_vue=await p.evaluate("!!document.querySelector('#vfr')||!!document.querySelector('[data-mode=vue].p')")  # 27/11/2026 : la page s'ouvre sur 👁 Vue élève
        await p.click("[data-mode=prep]"); await p.wait_for_timeout(300); await p.click("[data-c]")
        await p.click("[data-add=quiz]"); await p.click("[data-add=txt]"); await p.fill("[data-t='1']","Auto-positionne-toi avec le QR code de ta fiche"); await p.keyboard.press("Tab"); await p.wait_for_timeout(200)
        await p.click("#pub"); await p.wait_for_timeout(12000)
        out.append(("1 publication vérifiée","Publié pour" in await p.evaluate("document.querySelector('#pm').textContent"),await p.evaluate("document.querySelector('#pm').textContent")))
        out.append(("1b QR code du lien affiché",await p.evaluate("!!document.querySelector('#qr canvas')"),None))
        await p.screenshot(path="/home/claude/work/shots/n_esp_prof.png",full_page=True)
        nm=await p.evaluate("(()=>{var I=JSON.parse(localStorage['eps.codes.v1']).items,k=Object.keys(I)[0];return I[k].n})()")
        await p.click("#missions .chip:has-text('"+nm+"')"); await p.click("#madd"); await p.select_option("#mmod","4"); await p.click("#madd"); await p.fill("[data-mt='0']","Observe l'équipe 2"); await p.keyboard.press("Tab"); await p.wait_for_timeout(200)
        await p.click("#mpub"); await p.wait_for_timeout(7000)
        out.append(("1c mission publiée pour un élève","Publié pour" in await p.evaluate("document.querySelector('#mm').textContent"),await p.evaluate("document.querySelector('#mm').textContent")))
        cd=await p.evaluate("(()=>{var I=JSON.parse(localStorage['eps.codes.v1']).items,k=Object.keys(I)[0];return [I[k].c,I[k].n]})()")
        ce=await b.new_context(service_workers="block",viewport={"width":390,"height":844}); e=await ce.new_page(); e.on("pageerror",lambda x:errs.append("eleve "+str(x)[:200]))
        await e.goto(B+"mon-bilan/#u="+urllib.parse.quote(G,safe="")); await e.wait_for_timeout(800)
        await e.fill("#code","ZZZZZZ"); await e.click("#go"); await e.wait_for_timeout(2500)
        out.append(("2 mauvais code refusé",await e.evaluate("!document.querySelector('#login').hidden"),None))
        await e.fill("#code",cd[0].lower()); await e.click("#go"); await e.wait_for_timeout(3500)
        out.append(("3 l'élève ouvre son espace, onglet À faire",await e.evaluate("document.querySelectorAll('.tk').length")==4 and cd[1] in await e.evaluate("document.querySelector('#who').textContent"),await e.evaluate("document.querySelector('#res').innerText.slice(0,200)")))
        await e.screenshot(path="/home/claude/work/shots/n_esp_todo.png")
        await e.click("[data-mi='0']"); await e.fill("#mw","Équipe 2"); await e.click("[data-p='0']"); await e.click("[data-p='0']"); await e.click("[data-p='2']"); await e.screenshot(path="/home/claude/work/shots/n_esp_mis.png"); await e.click("#ms"); await e.wait_for_timeout(300)
        await e.click("[data-mi='1']"); await e.click("[data-v='0']"); await e.click("[data-r='p']"); await e.click("#ms"); await e.wait_for_timeout(300)
        out.append(("3b deux missions faites sur le téléphone",await e.evaluate("document.querySelectorAll('.tk.done').length")==2,None))
        await e.click(".tk >> nth=2")
        for i in range(4):
            await e.click(".ch >> nth=0"); await e.wait_for_timeout(100); await e.click("#qn")
        sc=await e.evaluate("document.querySelector('.score').textContent"); await e.click("#qb"); await e.click(".tk >> nth=3"); stt=""
        for _ in range(30):
            await e.wait_for_timeout(500); stt=await e.evaluate("document.querySelector('#st').textContent")
            if "✓" in stt: break
        out.append(("4 quiz fait, tâche cochée, envoi confirmé",await e.evaluate("document.querySelectorAll('.tk.done').length")==4 and "Envoy" in stt,(sc,stt)))
        await e.click("[data-tab=acts]"); n=await e.evaluate("document.querySelectorAll('.act').length")
        if n: await e.click(".act"); await e.wait_for_timeout(200); await e.screenshot(path="/home/claude/work/shots/n_esp_act.png")
        out.append(("5 mes activités : progression visible",n>0 and "progression" in (await e.evaluate("document.querySelector('#res').innerText")).lower(),n))
        out.append(("6 pas de débordement sur téléphone",not await e.evaluate("document.documentElement.scrollWidth>document.documentElement.clientWidth+2"),None))
        await p.click("#rel"); await p.wait_for_timeout(5000)
        t=await p.evaluate("document.querySelector('table')?document.querySelector('table').innerText:''")
        out.append(("7 l'enseignant relève : score et tâche de l'élève",sc.replace(" ","") in t.replace(" ","") and "✓" in t,t[:160]))
        rt=await p.evaluate("[...document.querySelectorAll('#missions .msg')].map(x=>x.textContent).join(' | ')")
        out.append(("7b retours des missions : compteur et rôle","Service réussi 2" in rt and "Équipe 2" in rt and "en partie" in rt,rt))
        await p.screenshot(path="/home/claude/work/shots/n_esp_prof.png",full_page=True)
        await p.goto(B+"quiz/"); await p.wait_for_timeout(1500); await p.click("[data-t=res]"); await p.wait_for_timeout(300)
        out.append(("8 le score arrive dans les résultats du quiz",cd[1] in await p.evaluate("document.querySelector('#pg').innerText"),None))
        out.append(("9 aucune erreur de page",not errs,errs))
        await b.close()
    bad=0
    for t,ok,x in out:
        print(("✓ " if ok else "✗ ")+t+("" if ok else "  → "+str(x))); bad+=0 if ok else 1
    print(bad,"échec(s)")
asyncio.run(main()); srv.terminate(); gs.terminate()
