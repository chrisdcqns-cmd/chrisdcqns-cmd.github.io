# Référentiel de compétences : relevé des évaluations dans les applis, rattachements, suivi élève / classe, carnet. python3 t_ref.py <racine du dépôt>
import asyncio, sys, subprocess, time, json
from playwright.async_api import async_playwright
ROOT = sys.argv[1]
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8833", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8833/eps-autonomie-numerique/"
REF = "JSON.parse(localStorage.getItem('eps.ref.v1')||'{\"items\":{}}').items"
async def main():
    out = []; errs = []
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox"])
        c = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768})
        await c.add_init_script("try{localStorage.setItem('eps.gate.step2','0');localStorage.setItem('eps.sec','0');localStorage.setItem('eps.demo.eleve','1');localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));}catch(e){}")
        p = await c.new_page(); p.on("pageerror", lambda x: errs.append(str(x)[:300])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(2500)
        await p.evaluate("(localStorage.setItem('eps.demo.eleve','1'),EPSD.demo.create())"); await p.wait_for_timeout(1500)
        # 1. relevé automatique dans les applis (classe fictive évaluée par la démonstration)
        for a in ["escalade", "acrosport", "volley", "danse", "badminton", "relais", "orientation", "crosstraining"]:
            await p.goto(B + a + "/"); await p.wait_for_timeout(7000); await p.evaluate("window.EPSREF&&EPSREF.snap()")
        I = await p.evaluate(REF)
        sn = [k for k in I if k.startswith("sn|") and not I[k].get("del")]; gr = [k for k in I if k.startswith("gr|") and not I[k].get("del")]
        out.append(("1 relevés créés dans les applis (évaluations et grilles)", len(sn) >= 2 and len(gr) >= 4, (sn, gr)))
        one = I[sn[0]] if sn else {}
        el = list((one.get("el") or {}).values())
        out.append(("1b un relevé porte classe, critères, degrés [d,pos]", bool(one.get("cls")) and bool(one.get("crit")) and bool(el) and all(isinstance(v, list) and len(v) == 2 for e in el for v in e["p"].values()), None))
        n0 = len(json.dumps(I)); await p.evaluate("EPSREF.snap()"); I2 = await p.evaluate(REF)
        out.append(("1c relevé inchangé = aucune réécriture", all(I2[k]["u"] == I[k]["u"] for k in I if k in I2), None))
        # 2. page Référentiel
        await p.goto(B + "referentiel/"); await p.wait_for_timeout(2500)
        out.append(("2 page ouverte, 7 onglets", await p.locator("#nav button").count() == 7, None))
        await p.click("#cgd"); await p.wait_for_timeout(300)
        out.append(("2b proposition : rien d'ajouté avant confirmation", await p.evaluate("EPSREF.cgs().length") == 0, None))
        await p.click("#dpok"); await p.wait_for_timeout(400)
        ncg = await p.evaluate("EPSREF.cgs().length"); out.append(("2c répertoire ajouté après confirmation", ncg == 10, ncg))
        # 3. rattacher un critère
        await p.click("[data-t=act]"); await p.wait_for_timeout(400)
        ng = await p.locator("[data-g]").count(); out.append(("3 activités listées", ng >= 4, ng))
        await p.locator("[data-ln]").first.click(); await p.wait_for_timeout(300)
        await p.locator("#ov [data-cg]").nth(0).check(); await p.locator("#ov [data-cg]").nth(5).check()
        if await p.locator("#ov [data-ep]").count(): await p.locator("#ov [data-ep]").nth(1).check()
        await p.click("#lnok"); await p.wait_for_timeout(400)
        ln = await p.evaluate("EPSREF.all('ln')"); out.append(("3b rattachement enregistré (2 compétences générales)", len(ln) == 1 and len(ln[0]["cg"]) == 2, ln))
        # rattacher tous les critères de toutes les grilles (par le module) pour le suivi
        await p.evaluate("(()=>{var C=EPSREF.cgs();EPSREF.gridsAll().forEach(function(g){g.crit.forEach(function(cr,i){EPSREF.linkSet(g.app,g.gv,cr.id,{cg:[C[i%C.length].id],ep:[1]})})})})()"); await p.wait_for_timeout(400)
        # 3c. ce qui est évalué pendant les leçons : évaluation de leçon, situations, modalité
        r = await p.evaluate("""(()=>{var st=function(k,items){var V={items:items,pend:{},since:0};localStorage.setItem(k,JSON.stringify(V))};
          var g=EPSREF.grids().filter(function(x){return x.app==='vol'})[0],c0=g.crit[0].id,c1=g.crit[1].id,cls=EPSREF.classes().filter(function(c){return /fictive/.test(c)})[0],E=EPSREF.eleves(cls),k=E[0].k.toLowerCase();
          st('eps.lecons.volley.v1',{L1:{id:'L1',titre:'Leçon test',sits:[{t:'S1',crit:[c0]},{t:'S2',crit:[]}]}});
          st('eps.leceval.volley.v1',{a:{id:'a',cls:cls,day:'2026-11-20',lec:'L1',el:(function(){var o={};o[k]={p:3,s:2,t:1};return o})()},b:{id:'b',cls:cls,day:'2026-11-23',lec:'',el:(function(){var o={};o[k]={p:3,s:3,t:3};return o})()},
            z:{id:'z',cls:'2GT9',day:'2026-11-24',lec:'',el:{'test zoe':{p:2,s:2,t:2}}}});
          var rr={};rr['L1:s0']=2;rr['L1:s1']=0;rr['L1:s0@auto']=0; var lr={};lr[cls+'|2026-11-20|'+k]={id:cls+'|2026-11-20|'+k,r:rr};st('eps.lecres.volley.v1',lr);
          var el={};el[k]={c1:3,c2:1}; st('eps.evmod.volley.v1',{m1:{id:'m1',k:'mod',nom:'Service',cls:[],total:20,crit:[{id:'c1',t:'Régularité',afl:'AFL1',ty:'deg',w:2},{id:'c2',t:'Réussi',afl:'AFL3',ty:'ok',w:1}]},'r|m1|x':{id:'r|m1|x',k:'res',mod:'m1',cls:cls,u:Date.now(),el:el}});
          var P=EPSREF.profil(E[0].k,{}),a=P.acts.filter(function(x){return x.sn.app==='vol'})[0],row=function(f){return a.rows.filter(f)[0]||null};
          var r0=row(function(x){return x.kind==='crit'&&x.cr.id===c0}),r1=row(function(x){return x.kind==='crit'&&x.cr.id===c1});
          return {r0:r0&&[r0.p,r0.fp,r0.tl.length,r0.tl[0].t,r0.tl[0].e],r1p:r1?r1.fp:null,le:a.rows.filter(function(x){return x.kind==='le'}).map(function(x){return [x.cr.id,x.p,x.tl.length]}),
            mod:a.rows.filter(function(x){return x.kind==='mod'}).map(function(x){return [x.afl,x.p]}),days:a.days,zc:EPSREF.classes().indexOf('2GT9')>=0,ze:EPSREF.eleves('2GT9').map(function(x){return x.k}),zp:EPSREF.profil('TEST ZOE',{}).acts.length,plus:EPSREF.gridsAll().filter(function(x){return x.plus}).map(function(x){return x.key})}})()""")
        out.append(("3c thème du jour → critère coché dans la leçon (leçons, pas l'évaluation finale)", r["r0"] is not None and r["r0"][1] is False and r["r0"][2] == 1 and abs(r["r0"][3] - 1.5) < .01 and abs(r["r0"][4] - 3.99) < .01, r["r0"]))
        out.append(("3d évaluation de leçon : participation, sérieux, et thème d'une leçon sans critère", sorted(x[0] for x in r["le"]) == ["p", "s", "t"] and [x for x in r["le"] if x[0] == "p"][0][2] == 2 and abs([x for x in r["le"] if x[0] == "t"][0][1] - 3.5) < .01, r["le"]))
        out.append(("3e modalité : critères avec leur AFL, degré 3 → 2,5 ; réussi → haut", len(r["mod"]) == 2 and abs(r["mod"][0][1] - 2.5) < .01 and r["mod"][1][1] > 3.9, r["mod"]))
        out.append(("3f élève et classe connus par les seules leçons", r["zc"] and r["ze"] == ["TEST ZOE"] and r["zp"] == 1, (r["zc"], r["ze"], r["zp"])))
        out.append(("3g grilles en plus à rattacher : évaluation de leçon et modalité", "_le|x" in r["plus"] and "vol|m|m1" in r["plus"], r["plus"]))
        await p.reload(); await p.wait_for_timeout(2000); await p.click("[data-t=act]"); await p.wait_for_timeout(300)
        await p.locator("[data-g='vol|m|m1']").click(); await p.wait_for_timeout(300); await p.locator("[data-ln]").first.click(); await p.wait_for_timeout(200); await p.locator("#ov [data-cg]").nth(2).check(); await p.click("#lnok"); await p.wait_for_timeout(300)
        out.append(("3h critère de modalité rattaché", await p.evaluate("!!EPSREF.one('ln|vol|m|m1:c1')"), None))
        await p.locator("[data-g='_le|x']").click(); await p.wait_for_timeout(300); out.append(("3i évaluation de leçon : 3 critères à rattacher", await p.locator("[data-ln]").count() == 3, None))
        # 4. suivi élève
        await p.click("[data-t=el]"); await p.wait_for_timeout(300); await p.locator("[data-c]", has_text="MO (fictive)").first.click(); await p.wait_for_timeout(300)
        ne = await p.locator("[data-e]").count(); await p.locator("[data-e]").first.click(); await p.wait_for_timeout(400)
        rows = await p.locator(".rf-row").count(); tabs = await p.locator("#pg table").count()
        out.append(("4 élève : profil (objectifs, compétences) et détail par activité", ne > 0 and rows >= 2 and tabs >= 1, (ne, rows, tabs)))
        out.append(("4b élève : tableau « Au fil des leçons »", "Au fil des leçons" in await p.inner_text("#pg"), None))
        # 5. classe
        await p.click("[data-t=cl]"); await p.wait_for_timeout(400)
        for m in ["og", "cg", "afl"]:
            await p.click("[data-m=%s]" % m); await p.wait_for_timeout(250)
            out.append(("5 classe : tableau « %s »" % m, await p.locator("#pg table tr").count() >= 3, None))
        # 6. couverture
        await p.click("[data-t=cov]"); await p.wait_for_timeout(300); n = await p.locator("[data-c]").count()
        if n: await p.locator("[data-c]").first.click(); await p.wait_for_timeout(300)
        out.append(("6 couverture : classes listées, tableau", n > 0 and await p.locator("#pg table").count() >= 1, n))
        # 7. textes officiels : modification et retour au texte d'origine
        await p.click("[data-t=txt]"); await p.wait_for_timeout(300)
        nav = await p.locator("[data-afl]").count(); out.append(("7 textes : 15 AFL en voie générale", nav == 15, nav))
        await p.locator("[data-afl]").first.click(); await p.fill("#txv", "Texte corrigé d'essai"); await p.click("#txok"); await p.wait_for_timeout(300)
        out.append(("7b AFL corrigé affiché", "Texte corrigé d'essai" in await p.inner_text("#pg"), None))
        await p.locator("[data-afl]").first.click(); await p.click("#txdef"); await p.wait_for_timeout(300)
        out.append(("7c texte d'origine remis", "Texte corrigé d'essai" not in await p.inner_text("#pg"), None))
        await p.click("[data-voie=pro]"); await p.wait_for_timeout(300); nav = await p.locator("[data-afl]").count(); out.append(("7d 30 AFLP en voie professionnelle", nav == 30, nav))
        await p.locator("[data-ep]").first.click(); await p.fill("#epv", "EP01 : premier\nEP02 - second\n\ntroisième"); await p.click("#epok"); await p.wait_for_timeout(300)
        ep = await p.evaluate("EPSREF.epList('pro','CA1')"); out.append(("7e éléments prioritaires : liste collée, numéros retirés", ep == ["premier", "second", "troisième"], ep))
        # 8. aucun débordement horizontal, tablette et téléphone
        for w, h in [(1024, 768), (390, 844)]:
            await p.set_viewport_size({"width": w, "height": h})
            for t in ["str", "act", "cdc", "el", "cl", "cov", "txt"]:
                await p.click("[data-t=%s]" % t); await p.wait_for_timeout(250)
                ov = await p.evaluate("document.documentElement.scrollWidth - window.innerWidth")
                if ov > 1: out.append(("8 pas de débordement %s à %d px" % (t, w), False, ov))
        out.append(("8 mise en page vérifiée (1024 et 390 px)", True, None))
        await p.set_viewport_size({"width": 1024, "height": 768})
        # 9. carnet : enseignant voit le profil ; élève seulement si rendu visible
        await p.goto(B + "carnet/"); await p.wait_for_timeout(2000)
        cl = await p.evaluate("EPSREF.classes().filter(function(c){return /fictive/.test(c)})[0]"); nomE = await p.evaluate("(c)=>EPSREF.eleves(c)[0].full", cl)
        await p.locator("[data-c]", has_text=cl).first.click(); await p.wait_for_timeout(300); await p.locator("[data-e]", has_text=nomE).first.click(); await p.wait_for_timeout(500)
        out.append(("9 carnet (enseignant) : bloc compétences", await p.locator(".rfc .rf-row").count() >= 1, None))
        # 10. en mode élève : aucun relevé écrit
        ce = await b.new_context(service_workers="block"); e = await ce.new_page(); e.on("pageerror", lambda x: errs.append("élève " + str(x)[:300]))
        await e.goto(B + "escalade/"); await e.wait_for_timeout(6000)
        out.append(("10 mode élève : module chargé mais aucun relevé", await e.evaluate("!!window.EPSREF && EPSREF.snap()===0 && !localStorage.getItem('eps.ref.v1')"), None))
        await e.goto(B + "referentiel/"); await e.wait_for_timeout(2500)
        out.append(("10b page fermée sans le code enseignant", await e.locator("#nav button").count() == 0, None))
        # 11. retrait de la classe fictive : ses relevés partent
        await p.goto(B); await p.wait_for_timeout(2000); await p.evaluate("EPSD.demo.remove ? EPSD.demo.remove() : null"); await p.wait_for_timeout(1500)
        left = await p.evaluate("Object.values(" + REF + ").filter(function(o){return o&&!o.del&&o.k==='sn'&&/^D.MO/.test(o.cls||'')}).length")
        out.append(("11 classe fictive retirée : relevés retirés", left == 0, left))
        out.append(("12 aucune erreur de page", not errs, errs))
        await b.close()
    bad = 0
    for t, ok, d in out:
        print(("✓ " if ok else "✗ ") + t + ("" if ok or d is None else "  → " + json.dumps(d, ensure_ascii=False)[:600])); bad += 0 if ok else 1
    print("%d échec(s) sur %d" % (bad, len(out))); return bad
try: r = asyncio.run(main())
finally: srv.terminate()
sys.exit(1 if r else 0)
