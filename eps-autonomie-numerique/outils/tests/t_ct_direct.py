# ⏱ Cross-training : le timer du WOD de chaque élève sous son nom dans le 🧭 pilotage de leçon, avec ce qu'il fait.
# 1 · la tablette élève pose son état (« l|<tablette> ») à chaque étape ; 2 · le pilotage l'affiche et le chrono avance à la seconde.
# python3 t_ct_direct.py <racine du dépôt> [dossier des captures]
import asyncio, sys, subprocess, time, json, os
from playwright.async_api import async_playwright
ROOT = sys.argv[1]; SHOTS = sys.argv[2] if len(sys.argv) > 2 else ""
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8853", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8853/eps-autonomie-numerique/crosstraining/"; CL = "TGT TEST"
NOMS = ["Lina MARTIN", "Noah PETIT", "Emma DURAND", "Hugo LEROY", "Jade MOREAU", "Louis SIMON", "Tom ROUX", "Ines O'BRIEN"]
LISTE = "if(!localStorage.getItem('eps.lists.v1'))localStorage.setItem('eps.lists.v1',JSON.stringify({items:{c1:{id:'c1',nom:'" + CL + "',el:" + json.dumps(NOMS) + ",u:1}},pend:{},since:0}));"
PROF = "try{" + LISTE + "localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));}catch(e){}"
ELEVE = "try{" + LISTE + "}catch(e){}"
LIVE = "(function(){var v=JSON.parse(localStorage.getItem('ct.v1')||'{}');var k=Object.keys(v.items||{}).filter(function(k){return k.indexOf('l|')===0});return k.length===1?v.items[k[0]]:{n:k.length}})()"
async def main():
    out = []; errs = []
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox"])
        # --- 1 · tablette élève
        c = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768}); await c.add_init_script(ELEVE)
        p = await c.new_page(); p.on("pageerror", lambda x: "Wake Lock" in str(x) or errs.append("élève " + str(x)[:200])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(3500)
        await p.evaluate("(function(){S.classe='c1';S.groupe={mode:'duo',noms:['Lina MARTIN',\"Ines O'BRIEN\"]};var L=S.fiches.exercices.filter(function(e){return e.mesure==='reps'});S.lecon={id:'t',titre:'',theme:'M',format:'amrap',params:{minutes:12,cible:4},items:[{exId:L[0].id,niv:2,qte:3},{exId:L[1].id,niv:1,qte:5}]};lancerTimer();})()")
        await p.wait_for_timeout(600); o = await p.evaluate(LIVE)
        out.append(("élève : l'état du timer est posé au lancement (prêt, AMRAP, noms du groupe)", o.get("st") == "run" and o.get("ph") == "pret" and o.get("c") == CL and len(o.get("noms", [])) == 2 and "AMRAP 12" in o.get("tete", "") and o.get("ens"), o))
        await p.evaluate("suivante()"); await p.wait_for_timeout(300); o = await p.evaluate(LIVE)
        out.append(("élève : passage au travail (exercice, niveau, quantité, chrono du bloc)", o.get("ph") == "bloc" and o.get("ex") and o.get("niv") == 2 and o.get("s") == 720 and o.get("cib") == 3, o))
        await p.evaluate("compter('rep');compter('rep');compter('rep')"); await p.wait_for_timeout(300); o2 = await p.evaluate(LIVE)
        out.append(("élève : l'exercice suivant est envoyé dès que l'objectif est atteint", o2.get("ex") and o2.get("ex") != o.get("ex") and o2.get("rep") == 3, o2))
        await p.evaluate("document.querySelector(\"[data-act='tmPause']\").click()"); await p.wait_for_timeout(300); o = await p.evaluate(LIVE)
        out.append(("élève : la pause est envoyée", o.get("st") == "pause", o.get("st")))
        await p.evaluate("document.querySelector(\"[data-act='tmPause']\").click()"); await p.evaluate("finTimer()"); await p.wait_for_timeout(300); o = await p.evaluate(LIVE)
        out.append(("élève : la fin du WOD est envoyée avec le score", o.get("st") == "fin" and "tour" in o.get("score", ""), o))
        await c.close()
        # --- 2 · tablette de l'enseignant
        c = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await c.add_init_script(PROF)
        p = await c.new_page(); p.on("pageerror", lambda x: errs.append("enseignant " + str(x)[:200])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(3500)
        await p.evaluate("""(function(){var n=Date.now(),d=auj(),v=stLd(),T='AMRAP 12 min · cible 4 tours';
          function L(id,o){v.items['l|'+id]=Object.assign({c:'""" + CL + """',date:d,duo:0,st:'run',titre:'Mon WOD · Mental',tete:T,tour:0,emom:0,up:0,at:n,tot:200000,fait:0,cib:0,tours:0,nt:0,cible:0,ens:'',rep:0,no:0,score:'',u:n},o);}
          L('a',{noms:['Lina MARTIN',"Ines O'BRIEN"],duo:1,ph:'bloc',lab:'AMRAP 12 min',s:720,e:185000,ex:'Air squat',niv:2,q:'10 rép.',fait:4,cib:10,tours:2,cible:4,rep:44,no:3});
          L('b',{noms:['Noah PETIT'],ph:'rest',lab:'Récupération',s:30,e:8000,ens:'Pompes · N1',tete:'Circuit · 3 tours · récup 30 s / 90 s'});
          L('c',{noms:['Emma DURAND'],ph:'work',lab:'Burpee',s:0,up:1,e:42000,ex:'Burpee',niv:1,q:'8 rép.',fait:2,cib:8,tour:2,tete:'Circuit · 3 tours'});
          L('d',{noms:['Hugo LEROY'],st:'pause',ph:'work',lab:'Gainage',s:40,e:15000,ex:'Gainage',niv:3,q:'40 s',tour:1,tete:'Intervalles 40/20 · 3 tours'});
          L('e',{noms:['Jade MOREAU'],st:'fin',ph:'bloc',score:'3 tours + 1 exercice(s) (cible 4 tours)',tot:725000});
          L('f',{noms:['Louis SIMON'],ph:'work',lab:'Squat',s:60,e:10000,ex:'Squat',niv:1,q:'12 rép.',at:n-400000,u:n-400000});
          localStorage.setItem(KST,JSON.stringify(v));})()""")
        await p.evaluate("EPSLC.pilotage({cls:'" + CL + "'})"); await p.wait_for_timeout(900)
        CARTE = "(function(n){var b=[].filter.call(document.querySelectorAll('#lc-ctl [data-el]'),function(x){return x.innerText.indexOf(n)>=0})[0];if(!b)return null;var t=b.querySelector('[data-tm]');return {txt:b.innerText,tm:t?t.textContent:''}})"
        k = {n: await p.evaluate(CARTE + "(" + json.dumps(n) + ")") for n in NOMS}
        def sec(t): a = t.split(":"); return int(a[0]) * 60 + int(a[1]) if len(a) == 2 and a[1].isdigit() else -1
        l = k["Lina MARTIN"]; out.append(("pilotage : chrono de l'AMRAP sous le nom (compte à rebours) et descriptif (exercice, niveau, tour)", l and 530 <= sec(l["tm"]) <= 535 and "Air squat · N2 · 10 rép. (4/10)" in l["txt"] and "tour 3" in l["txt"] and "Athlète" in l["txt"], l))
        i = k["Ines O'BRIEN"]; out.append(("pilotage : le partenaire a le même chrono, avec son rôle de coach", i and sec(i["tm"]) == sec(l["tm"]) and "Coach de Lina" in i["txt"], i))
        n = k["Noah PETIT"]; out.append(("pilotage : repos avec l'exercice suivant", n and 20 <= sec(n["tm"]) <= 22 and "REPOS" in n["txt"].upper() and "ensuite Pompes · N1" in n["txt"], n))
        e = k["Emma DURAND"]; out.append(("pilotage : exercice sans durée = chrono montant", e and 42 <= sec(e["tm"]) <= 44 and "Burpee · N1 · 8 rép. (2/8)" in e["txt"], e))
        h = k["Hugo LEROY"]; out.append(("pilotage : en pause, le chrono est figé", h and sec(h["tm"]) == 25 and "PAUSE" in h["txt"].upper(), h))
        j = k["Jade MOREAU"]; out.append(("pilotage : WOD terminé = score, plus de chrono", j and j["tm"] == "" and "WOD terminé · 3 tours" in j["txt"], j))
        s = k["Louis SIMON"]; out.append(("pilotage : tablette sans nouvelle = plus de chrono qui tourne tout seul", s and s["tm"] == "" and "sans nouvelle" in s["txt"], s))
        t = k["Tom ROUX"]; out.append(("pilotage : élève sans WOD lancé = carte habituelle", t and t["tm"] == "", t))
        await p.wait_for_timeout(2600); l2 = await p.evaluate(CARTE + "('Lina MARTIN')"); h2 = await p.evaluate(CARTE + "('Hugo LEROY')"); e2 = await p.evaluate(CARTE + "('Emma DURAND')")
        out.append(("pilotage : le chrono avance à la seconde sans attendre le relevé (rebours, montant, pause figée)", 2 <= sec(l["tm"]) - sec(l2["tm"]) <= 4 and 2 <= sec(e2["tm"]) - sec(e["tm"]) <= 4 and sec(h2["tm"]) == 25, (l2, e2, h2)))
        if SHOTS: await p.screenshot(path=os.path.join(SHOTS, "ct-pilotage.png"))
        await p.click("#lc-ctl [data-el] >> nth=0"); await p.wait_for_timeout(500); d = await p.evaluate("(document.getElementById('lc-det')||{}).innerText||''")
        out.append(("pilotage : le détail d'un élève donne le WOD et le temps depuis le début", "AMRAP 12 min" in d or "Circuit" in d or "Intervalles" in d, d[:200]))
        if SHOTS: await p.screenshot(path=os.path.join(SHOTS, "ct-detail.png"))
        await c.close(); await b.close()
    print("\n".join(("✅ " if o[1] else "❌ ") + o[0] + ("" if o[1] else "  → " + str(o[2])) for o in out)); print("erreurs de page :", errs or "aucune")
    return all(o[1] for o in out) and not errs
try: ok = asyncio.run(main())
finally: srv.terminate()
sys.exit(0 if ok else 1)
