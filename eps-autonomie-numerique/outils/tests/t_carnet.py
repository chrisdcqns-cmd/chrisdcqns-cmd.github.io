# Carnet de classe, repères rapides (tablette de contrôle), plan de terrain, corbeille (coévaluation et schéma partagé : t_coeval.py). python3 t_carnet.py <racine du dépôt> [dossier des captures]
import asyncio, sys, subprocess, time, json, os
from playwright.async_api import async_playwright
ROOT = sys.argv[1]; SHOTS = sys.argv[2] if len(sys.argv) > 2 else ""
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8837", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8837/eps-autonomie-numerique/"
IT = lambda k: "(JSON.parse(localStorage.getItem('" + k + "')||'{\"items\":{}}').items)"
async def main():
    out = []; errs = []
    async def shot(p, name, full=True):
        if SHOTS: await p.screenshot(path=os.path.join(SHOTS, name + ".png"), full_page=full)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox"])
        c = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820})
        await c.add_init_script("try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));}catch(e){}")
        p = await c.new_page(); p.on("pageerror", lambda x: errs.append(str(x)[:300])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("EPSD.demo.create()"); await p.wait_for_timeout(1500)
        CL = "DÉMO (fictive)"
        # ---------- 1. carnet de classe ----------
        await p.goto(B + "referentiel/"); await p.wait_for_timeout(2500)
        await p.evaluate("EPSREF.DEPART.forEach(function(d,n){EPSREF.cgPut({nom:d[0],og:d[1],o:n})})"); await p.click("[data-t=cdc]"); await p.wait_for_timeout(300)
        await p.locator("[data-c]", has_text="fictive").first.click(); await p.wait_for_timeout(300)
        await p.click("#cadd"); await p.fill("#cn", "Service"); await p.fill("#cmax", "abc"); await p.click("#cok"); await p.wait_for_timeout(150)
        out.append(("1 colonne : « notée sur » non numérique refusé", await p.locator("#ov").count() == 1 and "nombre" in await p.inner_text("#cm"), None))
        await p.fill("#cmax", "10"); await p.fill("#ccoef", "2"); await p.locator("#ov [data-cg]").nth(0).check(); await p.click("#cok"); await p.wait_for_timeout(300)
        await p.click("#cadd"); await p.fill("#cn", "Règles"); await p.click("[data-ty=deg]"); await p.locator("#ov [data-cg]").nth(7).check(); await p.click("#cok"); await p.wait_for_timeout(300)
        await p.click("#cadd"); await p.fill("#cn", "Tenue"); await p.click("[data-ty=ico]"); await p.click("#cok"); await p.wait_for_timeout(300)
        await p.click("#cadd"); await p.fill("#cn", "VMA"); await p.click("[data-ty=perf]"); await p.fill("#cunit", "km/h"); await p.click("#cok"); await p.wait_for_timeout(300)
        nc = await p.locator("[data-col]").count(); out.append(("1b quatre colonnes créées (note, degré, icône, performance)", nc == 4, nc))
        # saisie en série : note avec virgule, refus hors barème
        await p.locator("[data-v='0|0']").click(); await p.fill("#sv", "12"); await p.click("#sok"); await p.wait_for_timeout(150)
        out.append(("1c note au-dessus du barème refusée", "entre 0 et 10" in await p.inner_text("#sm"), None))
        for v in ["7,5", "9", "4", "10", "6,5", "8", "3", "5"]:
            await p.fill("#sv", v); await p.click("#sok"); await p.wait_for_timeout(120)
        await p.wait_for_timeout(200)
        vals = await p.evaluate("(()=>{var c=EPSREF.cdc.cols('" + CL + "')[0];return Object.values(EPSREF.cdc.vals(c.id))})()")
        out.append(("1d huit notes saisies à la suite (virgule acceptée)", sorted(vals) == sorted([7.5, 9, 4, 10, 6.5, 8, 3, 5]), vals))
        await p.locator("[data-v='0|1']").click()
        for d in [3, 2, 4, 1, 3, 3, 2, 4]:
            await p.locator("#ov [data-set='%d']" % d).click(); await p.wait_for_timeout(100)
        await p.locator("[data-v='0|2']").click(); await p.locator("#ov [data-set]").nth(2).click(); await p.wait_for_timeout(100); await p.click("#sx"); await p.wait_for_timeout(200)
        await p.locator("[data-v='1|3']").click(); await p.fill("#sv", "13,5"); await p.click("#sok"); await p.wait_for_timeout(100); await p.click("#sx"); await p.wait_for_timeout(300)
        k0 = await p.evaluate("EPSREF.eleves('" + CL + "')[0].k")
        moy = await p.evaluate("(k)=>EPSREF.cdc.moy('" + CL + "',k)", k0); out.append(("1e moyenne /20 calculée (7,5 sur 10 → 15)", moy == 15, moy))
        pr = await p.evaluate("(k)=>{var P=EPSREF.profil(k,{}),a=P.acts.filter(function(x){return x.sn.app==='_cb'})[0];return a?a.rows.map(function(r){return [r.cr.nom,Math.round(r.p*100)/100,r.cg.length,r.og.length]}):null}", k0)
        out.append(("1f colonnes rattachées dans le profil de l'élève (note → 3/4, degré 3 → 2,5)", pr is not None and len(pr) == 2 and pr[0][1] == 3 and pr[1][1] == 2.5 and pr[0][2] == 1 and pr[0][3] >= 1, pr))
        await shot(p, "1-carnet-de-classe")
        await p.locator("[data-v='2|0']").click(); await p.wait_for_timeout(200); await shot(p, "2-saisie-d-une-case", False); await p.click("#sx"); await p.wait_for_timeout(200)
        # ---------- 5a. corbeille : colonne supprimée puis restaurée ----------
        await p.locator("[data-col]").nth(3).click(); await p.click("#cdel"); await p.wait_for_timeout(400)
        out.append(("5 colonne supprimée", await p.locator("[data-col]").count() == 3, None))
        await p.click("#ctr"); await p.wait_for_timeout(400); nt = await p.locator("[data-tr]").count(); await shot(p, "7-corbeille", False)
        await p.locator("[data-tr]").first.click(); await p.wait_for_timeout(600)
        back = await p.evaluate("(()=>{var C=EPSREF.cdc.cols('" + CL + "').filter(function(c){return c.nom==='VMA'});return C.length===1?Object.values(EPSREF.cdc.vals(C[0].id)):null})()")
        out.append(("5b corbeille : colonne et ses valeurs restaurées", nt >= 1 and back == [13.5], (nt, back)))
        await p.locator(".epsd-ov [data-x]").first.click(); await p.wait_for_timeout(200)
        await p.evaluate("(()=>{var c=EPSREF.cgs()[9];EPSREF.cgDel(c.id)})()"); n9 = await p.evaluate("EPSREF.cgs().length")
        await p.evaluate("EPSD.trash.restore(EPSD.trash.list().filter(function(x){return x.type==='Compétence générale'})[0].id)"); await p.wait_for_timeout(300)
        out.append(("5c compétence générale supprimée puis restaurée", n9 == 9 and await p.evaluate("EPSREF.cgs().length") == 10, n9))
        # ---------- 2. repères rapides depuis la tablette de contrôle ----------
        await p.goto(B + "volley/"); await p.wait_for_timeout(6000)
        await p.evaluate("EPSLC.pilotage({cls:'" + CL + "'})"); await p.wait_for_timeout(700)
        nb = await p.locator("#lc-ctl [data-el]").count(); out.append(("2 pilotage de leçon : une carte par élève", nb >= 6, nb))
        await p.locator("#lc-ctl [data-el]").first.click(); await p.wait_for_timeout(300); await p.locator("#lc-det [data-ico]").click(); await p.wait_for_timeout(300); await p.locator("#lc-ico [data-i='0']").click(); await p.locator("#lc-ico [data-i='2']").click(); await p.locator("#lc-ico [data-i='2']").click(); await p.wait_for_timeout(200)
        await shot(p, "3-reperes-rapides", False)
        await p.locator("#lc-ico [data-undo]").click(); await p.wait_for_timeout(200); await p.locator("#lc-ico [data-x]").click(); await p.wait_for_timeout(400)
        ic = await p.evaluate("Object.values(" + IT("eps.ico.v1") + ").map(function(r){return [r.cls,r.app,Object.values(r.el)[0].map(function(x){return x.i})]})")
        out.append(("2b deux repères gardés (le dernier annulé), datés, avec la classe", len(ic) == 1 and ic[0][0] == CL and len(ic[0][2]) == 2 and ic[0][2][0].startswith("👕"), ic))
        out.append(("2c repères affichés sur la carte de l'élève", await p.evaluate("document.querySelector('#lc-ctl').innerText.indexOf('👕')>=0"), None))
        await shot(p, "4-tablette-de-controle", False)
        # ---------- 4. plan de terrain ----------
        await p.locator("#lc-ctl [data-terr]").click(); await p.wait_for_timeout(600)
        nz = await p.locator(".tz-z").count(); nbanc = await p.locator(".tz-banc [data-n]").count(); out.append(("4 plan de terrain : 4 zones, élèves sur le banc", nz == 4 and nbanc >= 6, (nz, nbanc)))
        bv = await p.evaluate("(function(){var b=document.querySelector('.tz-banc [data-n]').getBoundingClientRect(),s=document.querySelector('.tz-banc select');return [b.top>=0&&b.bottom<=innerHeight,getComputedStyle(document.querySelector('[data-cls]')).color]})()")
        out.append(("4a le banc est à l'écran sans faire défiler, la classe se lit dans le bandeau", bv[0] and bv[1] == "rgb(20, 23, 28)", bv))
        await p.locator(".tz-banc [data-n]").first.click(); await p.locator(".tz-z").nth(1).click(); await p.wait_for_timeout(200)
        out.append(("4b toucher l'élève puis la zone", await p.locator(".tz-z").nth(1).locator("[data-n]").count() == 1, None))
        src = p.locator(".tz-banc [data-n]").first; nm = await src.inner_text(); sb = await src.bounding_box(); zb = await p.locator(".tz-z").nth(2).bounding_box()
        await p.mouse.move(sb["x"] + 10, sb["y"] + 10); await p.mouse.down(); await p.mouse.move(sb["x"] + 60, sb["y"] - 40, steps=4); await p.mouse.move(zb["x"] + 40, zb["y"] + 50, steps=6); await p.mouse.up(); await p.wait_for_timeout(300)
        out.append(("4c glisser un élève vers une zone", nm.strip() in await p.locator(".tz-z").nth(2).inner_text(), nm))
        await p.click("[data-mk]"); await p.wait_for_timeout(300); out.append(("4d 🎲 répartir : plus personne sur le banc", await p.locator(".tz-banc [data-n]").count() == 0, None))
        await p.click("[data-arr]"); await p.wait_for_timeout(200); await p.locator("[data-ren]").first.click(); await p.wait_for_timeout(200)   # prompt accepté (valeur d'origine)
        hb = await p.locator(".tz-h").nth(3).bounding_box(); await p.mouse.move(hb["x"] + 20, hb["y"] + 12); await p.mouse.down(); await p.mouse.move(hb["x"] + 160, hb["y"] + 40, steps=5); await p.mouse.up(); await p.wait_for_timeout(300)
        lay = await p.evaluate(IT("eps.terrain.v1") + "['lay|volley']"); out.append(("4e zone déplacée : disposition enregistrée", bool(lay) and len(lay["zones"]) == 4 and lay["zones"][3]["x"] > 55, lay and lay["zones"][3]))
        await p.click("[data-arr]"); await p.wait_for_timeout(200); await shot(p, "5-plan-de-terrain", False)
        await p.click("[data-send]"); await p.wait_for_timeout(400)
        g = await p.evaluate("(()=>{var I=" + IT("eps.live.volley.v1") + ",v=Object.values(I).filter(function(x){return x&&x.grp})[0];return v?[v.grp.g.length,v.grp.nm,v.grp.src]:null})()")
        out.append(("4f envoyé : groupes du jour avec le nom des zones", g is not None and g[0] == 4 and g[1][0] == "Terrain 1" and g[2] == "plan", g))
        await p.locator(".gr-w [data-x]").click(); await p.wait_for_timeout(300)
        # (coévaluation : voir t_coeval.py)
        await p.goto(B + "referentiel/"); await p.wait_for_timeout(2500)
        await p.click("[data-t=el]"); await p.wait_for_timeout(300); await p.locator("[data-c]", has_text="fictive").first.click(); await p.wait_for_timeout(300)
        kico = await p.evaluate("EPSREF.nk(Object.keys(Object.values(JSON.parse(localStorage.getItem('eps.ico.v1')).items)[0].el)[0])")
        await p.evaluate("(k)=>{document.querySelectorAll('[data-e]').forEach(function(b,i){if(EPSREF.eleves('" + CL + "')[i].k===k)b.click()})}", kico); await p.wait_for_timeout(500)
        txt = await p.inner_text("#pg"); dbg = await p.evaluate("(k)=>[k,EPSREF.reperes(k,'').counts,EPSREF.profil(k,{}).acts.map(function(a){return a.sn.app}),Object.values(JSON.parse(localStorage.getItem('eps.ico.v1')||'{\"items\":{}}').items).map(function(r){return Object.keys(r.el)})]", k0)
        out.append(("2d fiche élève : repères rapides et carnet de classe", "Repères rapides" in txt and "Carnet de classe" in txt, [dbg, txt[:300]])); await shot(p, "8-fiche-eleve")
        # ---------- 5d. corbeille : élève retiré, classe supprimée, fiche de leçon ----------
        await p.goto(B); await p.wait_for_timeout(2500)
        await p.evaluate("EPSD.listSave('1TEST',['Alice Un','Bob Deux','Chloé Trois'])"); await p.wait_for_timeout(800)
        await p.evaluate("EPSD.listSave('1TEST',['Alice Un','Chloé Trois'])"); await p.wait_for_timeout(800)
        t = await p.evaluate("EPSD.trash.list().map(function(x){return [x.type,x.label,x.sub]})"); out.append(("5d élève retiré d'une liste : dans la corbeille", ["Élève", "Bob Deux", "1TEST"] in t, t))
        await p.evaluate("EPSD.trash.restore(EPSD.trash.list().filter(function(x){return x.label==='Bob Deux'})[0].id)"); await p.wait_for_timeout(800)
        ppl = await p.evaluate("EPSL.items().filter(function(o){return o.nom==='1TEST'}).map(function(o){return EPSL.people(o).map(function(p){return p.full}).sort()})[0]")
        out.append(("5e élève restauré dans sa classe", ppl is not None and len(ppl) == 3 and any("Bob" in x for x in ppl), ppl))
        await p.evaluate("EPSD.listDelete('1TEST')"); await p.wait_for_timeout(1000)
        gone = await p.evaluate("EPSL.items().filter(function(o){return o.nom==='1TEST'}).length")
        await p.evaluate("EPSD.trash.restore(EPSD.trash.list().filter(function(x){return x.type==='Classe'})[0].id)"); await p.wait_for_timeout(1000)
        again = await p.evaluate("EPSL.items().filter(function(o){return o.nom==='1TEST'}).map(function(o){return EPSL.people(o).length})")
        out.append(("5f classe supprimée puis restaurée avec ses élèves", gone == 0 and again == [3], (gone, again)))
        out.append(("5g la classe fictive ne va pas dans la corbeille", not any("fictive" in (x[1] or "") for x in await p.evaluate("EPSD.trash.list().map(function(x){return [x.type,x.label]})")), None))
        out.append(("6 aucune erreur de page", not errs, errs))
        await b.close()
    bad = 0
    for t, ok, d in out:
        print(("✓ " if ok else "✗ ") + t + ("" if ok or d is None else "  → " + json.dumps(d, ensure_ascii=False)[:500])); bad += 0 if ok else 1
    print("%d échec(s) sur %d" % (bad, len(out))); return bad
try: r = asyncio.run(main())
finally: srv.terminate()
sys.exit(1 if r else 0)
