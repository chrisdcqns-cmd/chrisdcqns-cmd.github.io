# Tour complet (27/11/2026) : chaque page, en élève (tablette, téléphone, ordinateur) et en enseignant (tablette, ordinateur, chaque onglet),
# avec la classe fictive : erreurs de page, débordements, boutons enseignant visibles des élèves, petits boutons.
# python3 t_tour.py <racine du dépôt> [dossier]   (une ligne par écran ; rien après « :: » = rien à signaler ; 10 à 15 minutes)
import asyncio,sys,subprocess,time,json,os
from playwright.async_api import async_playwright
ROOT=sys.argv[1]; FIL=sys.argv[2] if len(sys.argv)>2 else ""
import tempfile; SH=tempfile.mkdtemp(prefix="eps-tour-"); print("captures et résultats dans",SH,flush=True)
PORT=8864
srv=subprocess.Popen([sys.executable,"-I","-m","http.server",str(PORT),"--bind","127.0.0.1","--directory",ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:%d/eps-autonomie-numerique/"%PORT
E=ROOT+"/eps-autonomie-numerique"
DIRS=[""]+sorted(d+"/" for d in os.listdir(E) if os.path.exists(E+"/"+d+"/index.html"))
VP={"tab":(1024,768),"tel":(390,844),"ord":(1440,900)}
TEACH="try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.console.trust','1')}catch(e){}"
MES="""()=>{
 const vis=e=>{const r=e.getBoundingClientRect();if(r.width<2||r.height<2)return false;const s=getComputedStyle(e);if(s.visibility=='hidden'||s.display=='none'||+s.opacity===0)return false;
   if(r.bottom<0||r.top>innerHeight*6)return false; const el=document.elementFromPoint(Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)),Math.min(innerHeight-1,Math.max(0,r.top+r.height/2)));return r.top>innerHeight||r.top<0||!el||e.contains(el)||el.contains(e)};
 const nm=e=>(e.innerText||e.getAttribute('aria-label')||e.title||e.value||'').trim().replace(/\\s+/g,' ').slice(0,30);
 const B=[...document.querySelectorAll('button,a[href],[role=button],input[type=button],input[type=submit],select,summary')].filter(vis);
 const small=B.filter(e=>{const r=e.getBoundingClientRect();return r.height<40||r.width<40}).map(e=>nm(e)+'|'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)+'|'+(e.id||e.className||'').toString().slice(0,25));
 const noname=B.filter(e=>e.tagName!='SELECT'&&!nm(e)).map(e=>(e.id||e.className||e.outerHTML).toString().slice(0,60));
 const ov=document.documentElement.scrollWidth>innerWidth+1;
 let wide=[];if(ov){wide=[...document.body.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+2&&getComputedStyle(e).position!='fixed'}).slice(0,4).map(e=>e.tagName+'.'+(e.id||e.className||'').toString().slice(0,30)+' r='+Math.round(e.getBoundingClientRect().right))}
 /* #eps-callb = « ✋ Enseignant » : le bouton d'APPEL de l'enseignant, voulu côté élève (ce n'est pas un accès enseignant) */
 const teach=B.filter(e=>e.id!='eps-callb'&&(/enseignant|🔒|Mettre à jour/i.test(nm(e))||e.id=='eps-upd')).map(nm);
 return {small:[...new Set(small)].slice(0,12),nsmall:small.length,noname:[...new Set(noname)].slice(0,6),ov,wide,teach,nb:B.length,txt:document.body.innerText.length,title:(document.querySelector('h1,h2')||{}).innerText||''}}"""
def show(r):
    pb=[]
    if r.get("errs"): pb.append("ERREURS "+" ; ".join(sorted(set(r["errs"]))[:4]))
    if r.get("ov"): pb.append("DÉBORDE "+str(r.get("wide")))
    if r["mode"]=="eleve" and r.get("teach"): pb.append("BOUTON ENSEIGNANT "+str(r["teach"]))
    if r.get("nsmall"): pb.append("PETITS %d %s"%(r["nsmall"],r["small"][:5]))
    print(r["page"],r["mode"],r["vp"],r["etape"],"::"," || ".join(pb),flush=True)
class LR(list):
    def append(self,x): list.append(self,x); show(x)
async def main():
    R=LR()
    async with async_playwright() as pw:
        b=await pw.chromium.launch(args=["--no-sandbox","--disable-dev-shm-usage"])
        # préparation : classe fictive
        c0=await b.new_context(service_workers="block",viewport={"width":1024,"height":768}); await c0.add_init_script(TEACH)
        p=await c0.new_page(); await p.goto(B); await p.wait_for_timeout(2500)
        await p.evaluate("EPSD.demo.create()"); await p.wait_for_timeout(2500)
        st=await c0.storage_state(); await c0.close()
        json.dump(st,open(SH+"/state.json","w"))
        for mode in ("eleve","prof"):
            for vk,(w,h) in VP.items():
                if (mode=="prof" and vk=="tel"): continue
                c=await b.new_context(service_workers="block",viewport={"width":w,"height":h},storage_state=st,has_touch=(vk!="ord"))
                if mode=="prof": await c.add_init_script(TEACH)
                else: await c.add_init_script("try{localStorage.removeItem('eps.teach.until');localStorage.removeItem('eps.console.trust')}catch(e){}")
                for d in DIRS:
                    if FIL and FIL not in (d or "accueil"): continue
                    errs=[]; p=await c.new_page()
                    p.on("pageerror",lambda x,errs=errs:errs.append("ERR "+str(x)[:200]))
                    p.on("console",lambda m,errs=errs:errs.append("con "+m.text[:200]) if m.type=="error" and "favicon" not in m.text and "ERR_" not in m.text and "Failed to load resource" not in m.text and "vibrate" not in m.text else None)
                    p.on("requestfailed",lambda r,errs=errs:errs.append("404? "+r.url[-70:]) if "localhost" in r.url else None)
                    p.on("response",lambda r,errs=errs:errs.append("HTTP%d %s"%(r.status,r.url[-70:])) if r.status>=400 and "localhost" in r.url else None)
                    try:
                        t0=time.time(); await p.goto(B+d,wait_until="load"); tl=time.time()-t0; await p.wait_for_timeout(2600)
                        m=await p.evaluate(MES); rec={"page":d or "accueil/","mode":mode,"vp":vk,"etape":"ouverture","load":round(tl,2),"errs":list(errs),**m}; R.append(rec)
                        await p.screenshot(path=SH+"/%s-%s-%s-0.png"%((d or "accueil/").strip("/"),mode,vk))
                        # écran de classe : choisir la classe fictive
                        gate=await p.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(x=>/DÉMO/.test(x.innerText)&&x.offsetParent);if(b){b.click();return true}return false}")
                        if gate:
                            await p.wait_for_timeout(1800); del errs[:len(rec['errs'])]
                            m=await p.evaluate(MES); R.append({"page":d,"mode":mode,"vp":vk,"etape":"classe DÉMO","errs":list(errs),**m})
                            await p.screenshot(path=SH+"/%s-%s-%s-1.png"%(d.strip("/"),mode,vk))
                        if mode=="prof":
                            n=await p.evaluate("document.querySelectorAll('.epst-nav button[data-t]').length")
                            for i in range(n):
                                k=len(errs)
                                lab=await p.evaluate("(i)=>{const b=document.querySelectorAll('.epst-nav button[data-t]')[i];b.click();return b.innerText.trim()}",i)
                                await p.wait_for_timeout(900); m=await p.evaluate(MES)
                                R.append({"page":d,"mode":mode,"vp":vk,"etape":"onglet "+lab,"errs":errs[k:],**m})
                                if vk=="tab": await p.screenshot(path=SH+"/%s-prof-tab-o%d.png"%(d.strip("/"),i))
                    except Exception as ex:
                        R.append({"page":d,"mode":mode,"vp":vk,"etape":"EXC","errs":[str(ex)[:200]]})
                    await p.close()
                await c.close()
        await b.close()
    json.dump(R,open(SH+"/tour.json","w"),ensure_ascii=False,indent=0)
asyncio.run(main()); srv.terminate()
