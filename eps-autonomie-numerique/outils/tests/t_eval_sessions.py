# Évaluation commune (modèle Escalade) : plusieurs évaluations par classe (« ＋ Nouvelle évaluation » repart de zéro, l'ancienne est gardée),
#   bloc « 📊 Ses résultats » (grimpes), auto-positionnement et proposition visibles sur chaque critère.
# python3 t_eval_sessions.py <racine du dépôt>      (classe fictive, rien n'est envoyé en ligne)
import asyncio, sys, subprocess, time, json, urllib.parse
from playwright.async_api import async_playwright
ROOT = sys.argv[1]
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8879", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8879/eps-autonomie-numerique/"
INIT = "try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.console.trust','1');if(!localStorage.getItem('eps.share.v1'))localStorage.setItem('eps.share.v1',JSON.stringify({url:'https://script.google.com/macros/s/TEST/exec',key:'k'}));}catch(e){}"
FICHE = "(function(){var f=document.querySelector('.epse-fiche');return f?f.innerText:''})()"
async def main():
    out = []; errs = []
    def ok(t, c, d=""): out.append(bool(c)); print(("✅ " if c else "❌ ") + t + ("" if c else "  → " + str(d)[:600]), flush=True)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        c = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await c.add_init_script(INIT)
        async def route(r):
            q = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(r.request.url).query))
            await r.fulfill(status=200, content_type="application/javascript", body=q.get("callback", "x") + "(" + json.dumps({"keyOk": True}) + ")")
        await c.route("https://script.google.com/**", route)
        p = await c.new_page(); p.on("dialog", lambda d: asyncio.ensure_future(d.accept())); p.on("pageerror", lambda x: errs.append(str(x)[:240])); p.set_default_timeout(9000)
        await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("(async()=>{var x=EPSD.demo.create();if(x&&x.then)await x})()"); await p.wait_for_timeout(1800)
        await p.goto(B + "escalade/"); await p.wait_for_timeout(4200)
        await p.evaluate("EPSTESC.go('eval')"); await p.wait_for_timeout(1500)
        nom = await p.evaluate("(function(){var b=document.querySelector('.epse-li.on span');return b?b.firstChild.textContent:''})()")
        cl = await p.evaluate("(function(){var s=document.querySelector('[data-cls]');return s?s.value:''})()")
        ok("fiche ouverte (" + nom + ", " + cl + ")", nom and cl, [nom, cl])
        # ---- grimpes de l'élève : bloc résultats + proposition
        pre = nom.split(" ")[0]
        await p.evaluate("""([cl,pre])=>{[['5b',9,9,8,14],['5c',9,7,10,15],['4c',9,9,9,12]].forEach(function(x,i){R.push({id:'t'+i,ts:'2026-11-2'+i+' 10:0'+i,cl:cl,el:pre,vo:i+1,c:'bleu',d:x[0],h:x[1],ann:x[2],m:x[3],p:x[4]})});EPSTESC.go('eval')}""", [cl, pre]); await p.wait_for_timeout(1200)
        t = await p.evaluate(FICHE)
        ok("bloc « Ses résultats » : grimpes, meilleure voie", "Ses résultats" in t and "3 grimpes sur 3 leçons" in t and "meilleure voie réussie" in t and "5c" in t, t[:400])
        ok("coefficient par leçon (×1, ×2, ×3) et tableau par leçon", "coefficient ×1, ×2, ×3" in t and await p.evaluate("document.querySelectorAll('.epse-fiche [data-restab] tbody tr').length") == 3, repr(t[t.find("comptent plus"):][:120]))
        await p.click(".epse-fiche [data-resall]"); await p.wait_for_timeout(500)
        w = await p.evaluate("(function(){var w=document.getElementById('epse-resw');return w?w.innerText:''})()")
        ok("fenêtre « toutes ses grimpes, une par une », par leçon", "coefficient ×3" in w and "corde 2" in w and "Top" in w and w.count("📅") == 3, w[:500])
        await p.screenshot(path="/tmp/t/eval-grimpes.png")
        await p.click("#epse-resw [data-x2]"); await p.wait_for_timeout(200)
        ok("fenêtre refermée par « ✕ Fermer »", not await p.evaluate("!!document.getElementById('epse-resw')"))
        await p.click(".epse-fiche [data-rsc='last']"); await p.wait_for_timeout(600); t2 = await p.evaluate(FICHE)
        ok("« Leçon finale seulement » : une seule leçon comptée", "1 grimpe" in t2 and await p.evaluate("document.querySelectorAll('.epse-fiche [data-restab] tbody tr').length") == 1, t2[:300])
        await p.click(".epse-fiche [data-rsc='all']"); await p.wait_for_timeout(600)
        # coefficients réglables : ×1 → ×2 sur la première leçon, puis retour aux coefficients par défaut
        await p.evaluate("(function(){var L=document.querySelectorAll('.epse-fiche [data-restab] tbody tr');L[L.length-1].querySelectorAll('[data-rck]')[1].click()})()"); await p.wait_for_timeout(600)
        t3 = await p.evaluate(FICHE)
        ok("coefficient d'une leçon réglé par l'enseignant (×2, ×2, ×3)", "Coefficients choisis par toi : coefficient ×2, ×2, ×3" in t3, t3[:500])
        await p.click(".epse-fiche [data-rcz]"); await p.wait_for_timeout(600)
        ok("↺ coefficients par défaut", "coefficient ×1, ×2, ×3" in await p.evaluate(FICHE))
        # même prénom : le prénom seul ne suffit plus, « Prénom + initiale » oui
        hm = await p.evaluate("""([cl,pre])=>{var k=CL.find(function(c){return c.nom==cl});var a={prenom:pre,nom:'Démo'},n0=evMine(cl,a).length;k.el.push(pre+' Martin');var n1=evMine(cl,a).length;R.push({id:'tz',ts:'2026-11-25 09:00',cl:cl,el:pre+' D.',vo:1,d:'4a',h:9});var n2=evMine(cl,a).length,n3=evMine(cl,{prenom:pre,nom:'Martin'}).length;k.el.pop();R.pop();return [n0,n1,n2,n3]}""", [cl, pre])
        ok("même prénom dans la classe : grimpes non mélangées " + str(hm), hm[0] == 3 and hm[1] == 0 and hm[2] == 1 and hm[3] == 0, hm)
        pr = await p.evaluate("EVESC && document.querySelectorAll('.epse-fiche [data-recap]').length")
        ok("auto-positionnement / proposition rappelés sur les critères (" + str(pr) + ")", pr and pr >= 1, pr)
        ok("bloc élève conservé : phrase, Dicter / Reformuler", "Proposer une phrase pour l'élève" in t, t[-400:])
        await p.screenshot(path="/tmp/t/eval-fiche.png", full_page=False)
        # ---- nouvelle évaluation : repart de zéro, l'ancienne est gardée
        await p.evaluate("(function(){var b=document.querySelector('.epse-fiche [data-d=\"3\"]');if(!b.classList.contains('on'))b.click()})()"); await p.wait_for_timeout(500)
        await p.evaluate("(function(){var t=document.querySelector('.epse-fiche [data-comm]');t.value='Commentaire du lundi';t.oninput()})()")
        n0 = await p.evaluate("document.querySelectorAll('.epse-fiche .epse-deg.on').length")
        ok("avant : des degrés sont posés (" + str(n0) + ")", n0 >= 1, n0)
        ok("bouton « ＋ Nouvelle évaluation » et liste « Évaluation »", await p.evaluate("!!document.querySelector('[data-sesnew]')&&!!document.querySelector('[data-ses]')"))
        await p.click("[data-sesnew]"); await p.wait_for_timeout(400)
        await p.fill("#epse-sesd [data-n]", "Évaluation de jeudi"); await p.click("#epse-sesd [data-ok]"); await p.wait_for_timeout(900)
        n1 = await p.evaluate("document.querySelectorAll('.epse-fiche .epse-deg.on').length"); cm = await p.evaluate("document.querySelector('.epse-fiche [data-comm]').value")
        ok("après : fiche remise à zéro", n1 == 0 and cm == "", [n1, cm])
        li = await p.evaluate("document.querySelectorAll('.epse-li.ok,.epse-li.st').length")
        ok("après : toute la classe est « à évaluer »", li == 0, li)
        op = await p.evaluate("[].map.call(document.querySelectorAll('[data-ses] option'),function(o){return o.textContent})")
        ok("liste : la nouvelle (en cours) et l'ancienne", len(op) == 2 and "Évaluation de jeudi" in op[0] and "en cours" in op[0], op)
        raw = await p.evaluate("(function(){var I=JSON.parse(localStorage.getItem('eps.eval.esc.v1')||localStorage.getItem('eps.eval.escalade.v1')).items,a=0,b=0;Object.keys(I).forEach(function(k){var r=I[k];if(r.arch){a++;if(r.c||r.ev)b++}});return [a,b]})()")
        ok("anciennes fiches rangées sans être comptées deux fois (" + str(raw[0]) + ")", raw[0] >= 1 and raw[1] == 0, raw)
        # ---- rouvrir l'ancienne
        await p.select_option("[data-ses]", index=1); await p.wait_for_timeout(700)
        n2 = await p.evaluate("document.querySelectorAll('.epse-fiche .epse-deg.on').length"); cm2 = await p.evaluate("document.querySelector('.epse-fiche [data-comm]').value")
        ok("ancienne évaluation rouverte : degrés et commentaire retrouvés", n2 == n0 and cm2 == "Commentaire du lundi", [n2, n0, cm2])
        ok("bandeau « Ancienne évaluation ouverte »", "Ancienne évaluation ouverte" in await p.evaluate("document.body.innerText"))
        await p.click("[data-sescur]"); await p.wait_for_timeout(600)
        n3 = await p.evaluate("document.querySelectorAll('.epse-fiche .epse-deg.on').length")
        ok("retour à l'évaluation en cours (vide)", n3 == 0, n3)
        # ---- fiche PDF : auto-positionnement déjà fait (pas d'erreur à la génération)
        await p.select_option("[data-ses]", index=1); await p.wait_for_timeout(700)   # l'ancienne évaluation porte l'auto-positionnement de la classe fictive
        await p.evaluate("(function(){var c=EVESC.classes().filter(function(x){return /DÉMO/.test(x.nom)})[0],e=c.eleves[0],G=EVESC.adapter.grid(),ev={};G.criteres.forEach(function(cr,i){ev[cr.id]={d:(i+1)%4,pos:.5}});EVESC.adapter.setAp(e,{ev:ev})})()")
        async with p.expect_download(timeout=20000) as dl:
            await p.click(".epse-fiche [data-pdf]")
        d = await dl.value; await d.save_as("/tmp/t/fiche.pdf")
        ok("fiche PDF générée", d.suggested_filename.endswith(".pdf"))
        await p.click("[data-sescur]"); await p.wait_for_timeout(500)
        # ---- évaluations déjà enregistrées : rangées une fois, on repart sur une nouvelle (forcé ici : la classe fictive en est dispensée)
        za = await p.evaluate("(function(){var c=EVESC.classes().filter(function(x){return /DÉMO/.test(x.nom)})[0],e=c.eleves[1];EVESC.adapter.setDeg(EVESC.adapter.grid().criteres[0],e,2);var nb=EVESC.sesAuto0(c,true);EPSTESC.go('eval');return nb})()"); await p.wait_for_timeout(900)
        op = await p.evaluate("[].map.call(document.querySelectorAll('[data-ses] option'),function(o){return o.textContent})")
        ok("évaluation déjà enregistrée rangée d'office (" + str(za) + " fiches)", za >= 1 and any("Évaluation déjà enregistrée" in x for x in op) and "Nouvelle évaluation" in op[0], op)
        # ---- une autre appli du modèle commun
        await p.goto(B + "basket/"); await p.wait_for_timeout(4200); await p.evaluate("EPSTBK.go('eval')"); await p.wait_for_timeout(1500)
        tb = await p.evaluate(FICHE)
        ok("Basket : même fiche (résultats, nouvelle évaluation)", "Ses résultats" in tb and await p.evaluate("!!document.querySelector('[data-sesnew]')"), tb[:300])
        # ---- Volley, Badminton, Danse, Relais : nouvelle évaluation, ancienne rouverte, bloc résultats
        # on pose un commentaire « lundi » sur le premier élève, puis on compte les fiches qui le portent
        POSE = {"volley": "(function(){C().eleves[0].comment='lundi';save()})()", "badminton": "(function(){C().eleves[0].comment='lundi';save()})()",
                "danse": "(function(){curClasse().eleves[0].comm='lundi';save()})()", "relais": "(function(){evOf(CL().eleves[0].id).comm='lundi';persist()})()"}
        NOTES = {"volley": "C().eleves.filter(function(e){return e.comment==='lundi'}).length", "badminton": "C().eleves.filter(function(e){return e.comment==='lundi'}).length",
                 "danse": "curClasse().eleves.filter(function(e){return e.comm==='lundi'}).length", "relais": "CL().eleves.filter(function(e){return (CL().evals[e.id]||{}).comm==='lundi'}).length"}
        for app, inst in (("volley", "EPSTV"), ("badminton", "EPSTB"), ("danse", "EPSTD"), ("relais", "EPSTR")):
            await p.goto(B + app + "/"); await p.wait_for_timeout(4500); await p.evaluate(inst + ".go('eval')"); await p.wait_for_timeout(1800)
            try: await p.evaluate(inst + ".evGo('fin')"); await p.wait_for_timeout(1500)
            except Exception: pass
            if not await p.evaluate("!!document.querySelector('[data-asesnew]')"):   # choisir d'abord la classe fictive
                await p.evaluate("(function(){var L=[].filter.call(document.querySelectorAll('button,.card,[onclick],b'),function(e){return e.offsetParent&&/DÉMO \\(fictive\\)/.test(e.textContent)&&e.textContent.length<200});if(L.length)L[L.length-1].click()})()"); await p.wait_for_timeout(1800)
            if not await p.evaluate("!!document.querySelector('[data-asesnew]')") and app == "badminton":
                await p.evaluate("(function(){S.cur=S.classes.findIndex(function(c){return /DÉMO/.test(c.nom)});showTab('eval');openEval(0)})()"); await p.wait_for_timeout(1200)
            has = await p.evaluate("!!document.querySelector('[data-asesnew]')&&!!document.querySelector('[data-ases]')")
            ok(app + " : liste « Évaluation » et « ＋ Nouvelle évaluation »", has)
            if not has: continue
            # même fiche que les autres applis (forme Escalade) : degré posé, curseur, résultats et proposition, phrase pour l'élève
            await p.evaluate("(function(){var b=document.querySelector('[data-crits] .epse-deg[data-d=\"2\"]');if(b&&!b.classList.contains('on'))b.click()})()"); await p.wait_for_timeout(900)
            fi = await p.evaluate("(function(){var f=document.querySelector('[data-fiche]'),r=document.querySelector('[data-crits] [data-p]');if(r){r.value=r.max;r.onchange()}return {f:!!f,on:document.querySelectorAll('[data-crits] .epse-deg.on').length,prop:/Proposition de positionnement/.test(document.body.innerText),phr:!!document.querySelector('[data-phr]'),comm:!!document.querySelector('[data-comm]'),st:document.querySelectorAll('[data-fiche] [data-st]').length}})()"); await p.wait_for_timeout(900)
            lb = await p.evaluate("(function(){var b=document.querySelector('[data-crits] .epse-intra b');return b?b.textContent:''})()")
            ok(app + " : fiche commune (degré, curseur « " + lb[:40] + " », proposition, phrase)", fi["f"] and fi["on"] >= 1 and fi["prop"] and fi["phr"] and fi["comm"] and fi["st"] == 3 and "pts" in lb, [fi, lb])
            if app == "relais": ok("relais : son bloc « toutes les courses » et la répartition sont gardés", await p.evaluate("!!document.querySelector('#ev-body .evred')&&!!document.querySelector('#ev-body .evrep')"))
            await p.evaluate(POSE[app]); n0 = await p.evaluate(NOTES[app])
            await p.evaluate("document.querySelector('[data-asesnew]').click()"); await p.wait_for_timeout(400)
            await p.fill("#epse-sesd [data-n]", "Jeudi"); await p.click("#epse-sesd [data-ok]"); await p.wait_for_timeout(1500)
            n1 = await p.evaluate(NOTES[app]); op = await p.evaluate("[].map.call(document.querySelectorAll('[data-ases] option'),function(o){return o.textContent})")
            ok(app + " : la nouvelle part de zéro (" + str(n0) + " → " + str(n1) + ")", n0 > 0 and n1 == 0 and len(op) == 2 and "Jeudi" in op[0], [n0, n1, op])
            await p.evaluate("(function(){var s=document.querySelector('[data-ases]');s.value=s.options[1].value;s.onchange()})()"); await p.wait_for_timeout(1500)
            n2 = await p.evaluate(NOTES[app])
            ok(app + " : ancienne évaluation rouverte (" + str(n2) + ")", n2 == n0 and await p.evaluate("!!document.querySelector('[data-asescur]')"), n2)
            await p.evaluate("document.querySelector('[data-asescur]').click()"); await p.wait_for_timeout(1500)
            n3 = await p.evaluate(NOTES[app])
            ok(app + " : retour à l'évaluation en cours (vide)", n3 == 0, n3)
            await p.evaluate(POSE[app])
            INS = {"volley": "evvol()", "badminton": "EVB", "danse": "evdan()", "relais": "EVRL"}[app]; LST = {"volley": "C().eleves", "badminton": "C().eleves", "danse": "curClasse().eleves", "relais": "CL().eleves"}[app]; CN = {"volley": "C().nom", "badminton": "C().nom", "danse": "curClasse().nom", "relais": "CL().name"}[app]
            nb = await p.evaluate(INS + ".sesAuto(" + CN + "," + LST + ",true)"); await p.wait_for_timeout(1200)
            op = await p.evaluate("[].map.call(document.querySelectorAll('[data-ases] option'),function(o){return o.textContent})")
            ok(app + " : évaluation déjà enregistrée rangée d'office", nb >= 1 and await p.evaluate(NOTES[app]) == 0 and any("Évaluation déjà enregistrée" in x for x in op), [nb, op])
        # ---- « Bilan et export » : la même page partout (export, bilan de l'évaluation, répartition, notes avec PDF par élève)
        for app, inst in (("volley", "EPSTV"), ("badminton", "EPSTB"), ("danse", "EPSTD"), ("relais", "EPSTR"), ("escalade", "EPSTESC"), ("basket", "EPSTBK")):
            await p.goto(B + app + "/"); await p.wait_for_timeout(4500); await p.evaluate(inst + ".go('eval')"); await p.wait_for_timeout(1200)
            if app == "badminton": await p.evaluate("(function(){S.cur=S.classes.findIndex(function(c){return /DÉMO/.test(c.nom)})})()")
            for cmd in (inst + ".evGo('bil')", inst + ".go('bil')"):
                try: await p.evaluate(cmd); await p.wait_for_timeout(1500)
                except Exception: pass
                if await p.evaluate("!!document.querySelector('.epse-bilan')"): break
            if not await p.evaluate("!!document.querySelector('.epse-bilan')"):
                await p.evaluate("(function(){var L=[].filter.call(document.querySelectorAll('button,.card,[onclick],b'),function(e){return e.offsetParent&&/DÉMO \\(fictive\\)/.test(e.textContent)&&e.textContent.length<200});if(L.length)L[L.length-1].click()})()"); await p.wait_for_timeout(1500)
                try: await p.evaluate(inst + ".evGo('bil')"); await p.wait_for_timeout(1500)
                except Exception: pass
            r = await p.evaluate("(function(){var b=[].filter.call(document.querySelectorAll('.epse-bilan'),function(x){return x.offsetParent})[0];if(!b)return null;return {exp:/Export/.test(b.innerText)&&/Pronote/.test(b.innerText),st:!!b.querySelector('[data-bstats]'),tb:b.querySelectorAll('[data-btable] tr').length,pdf:b.querySelectorAll('[data-tpdf]').length}})()")
            ok(app + " : page « Bilan et export » commune", r and r["exp"] and r["st"] and r["tb"] >= 2 and r["pdf"] >= 1, r)
        ok("aucune erreur de page", not errs, errs)
        await b.close()
    srv.terminate(); print(str(sum(out)) + " / " + str(len(out))); sys.exit(0 if all(out) else 1)
asyncio.run(main())
