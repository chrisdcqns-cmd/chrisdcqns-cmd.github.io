# Coévaluation commune (grille créée par l'enseignant ; Volley, Danse, Escalade) et schéma du plan de terrain partagé entre deux tablettes (faux script).
# python3 t_coeval.py <racine du dépôt> [dossier des captures]
import asyncio, sys, subprocess, time, json, os, urllib.request, base64
from playwright.async_api import async_playwright
ROOT = sys.argv[1]; SHOTS = sys.argv[2] if len(sys.argv) > 2 else ""
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8846", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
gs = subprocess.Popen([sys.executable, "-I", "mockgs.py"]); time.sleep(1.5)
B = "http://localhost:8846/eps-autonomie-numerique/"; G = "http://127.0.0.1:8899/exec"
NOMS = ["Lina MARTIN", "Noah PETIT", "Emma DURAND", "Hugo LEROY", "Jade MOREAU", "Louis SIMON"]
SEED = "try{localStorage.setItem('eps.share.v1',JSON.stringify({url:'" + G + "',key:'CLE'}));if(!localStorage.getItem('eps.lists.v1'))localStorage.setItem('eps.lists.v1',JSON.stringify({items:{c1:{id:'c1',nom:'2GT1 TEST',el:" + json.dumps(NOMS) + ",ts:1}},pend:{},app:{}}));"
CO = "(JSON.parse(localStorage.getItem('eps.coeval.v1')||'{\"items\":{}}').items)"
async def main():
    out = []; errs = []
    async def shot(p, name, full=False):
        if SHOTS: await p.screenshot(path=os.path.join(SHOTS, name + ".png"), full_page=full)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox"])
        urllib.request.urlopen("http://127.0.0.1:8899/ctl?reset=1&fail=0&old=0&nochk=0").read()
        cp = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await cp.add_init_script(SEED + "localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));}catch(e){}")
        ce = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768}); await ce.add_init_script(SEED + "}catch(e){}")
        c2 = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await c2.add_init_script(SEED + "localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));}catch(e){}")
        p = await cp.new_page(); p.on("pageerror", lambda x: errs.append("prof " + str(x)[:200])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        e = await ce.new_page(); e.on("pageerror", lambda x: errs.append("élève " + str(x)[:200]))
        # ---------- 1. Volley : l'enseignant crée SA grille de coévaluation ----------
        await p.goto(B + "volley/"); await p.wait_for_timeout(5000)
        acts = await p.evaluate("EPSLC.evalActions().map(function(a){return a.label})"); out.append(("1 action « Coévaluation » dans l'onglet Évaluation (Volley)", "Coévaluation" in acts, acts))
        await p.evaluate("EPSLC.evalActions().filter(function(a){return a.label==='Coévaluation'})[0].go()"); await p.wait_for_timeout(400)
        out.append(("1b fermée par défaut, grille vide", "Fermée aux élèves" in await p.inner_text("#co-ov") and await p.locator("#co-ov [data-nom]").count() == 0, None))
        for i, (nom, d0) in enumerate([("Il / elle se replace après son action", "Reste sur place"), ("Il / elle annonce « j'ai »", ""), ("Il / elle encourage ses partenaires", "")]):
            await p.click("#co-ov [data-add]"); await p.wait_for_timeout(150); await p.locator("#co-ov [data-nom]").nth(i).fill(nom); await p.locator("#co-ov [data-nom]").nth(i).dispatch_event("change")
            if d0: await p.locator("#co-ov [data-desc='%d|0']" % i).fill(d0); await p.locator("#co-ov [data-desc='%d|0']" % i).dispatch_event("change")
        await p.click("#co-ov [data-on]"); await p.wait_for_timeout(300); await shot(p, "1-ma-grille-de-coevaluation")
        g = await p.evaluate(CO + "['g|vol']"); out.append(("1c grille enregistrée : 3 critères à moi, ouverte, indépendante de l'évaluation", bool(g) and g["on"] == 1 and g["src"] == "own" and len(g["crit"]) == 3 and g["crit"][0]["desc"][0] == "Reste sur place", g and [g["on"], g["src"], len(g["crit"])]))
        gid = [c["id"] for c in g["crit"]]; evids = await p.evaluate("(function(){try{evvol()}catch(x){};var I=(EPSE_INST||[]).filter(function(x){return x.A.app==='vol'})[0];return I?I.A.grid().criteres.map(function(c){return String(c.id)}):[]})()")
        out.append(("1d ses critères ne sont pas ceux de la grille d'évaluation", len(evids) > 0 and not set(gid) & set(evids), (gid, evids)))
        await p.wait_for_timeout(6000)
        # ---------- 2. tablette élève (autre appareil) : la ressource apparaît après la synchro ----------
        await e.goto(B + "volley/"); ok = False
        for i in range(25):
            await e.wait_for_timeout(2000)
            try: await e.evaluate("EPSD.syncOne('eps.coeval.v1')")
            except Exception: pass
            if await e.evaluate("!!(" + CO + "['g|vol']||{}).on"): ok = True; break
        out.append(("2 grille arrivée sur la tablette élève (synchro)", ok, None))
        await e.reload(); await e.wait_for_timeout(3500)
        out.append(("2b « Choisis ta classe » : 👥 J'observe un camarade (Volley)", await e.get_by_text("J'observe un camarade").count() >= 1, None)); await shot(e, "2-choisis-ta-classe")
        await e.get_by_text("J'observe un camarade").first.click(); await e.wait_for_timeout(400)
        await e.select_option("[data-f=moi]", label="Lina MARTIN"); await e.wait_for_timeout(200)
        opts = await e.locator("[data-f=cible] option").all_inner_texts(); out.append(("2c on ne peut pas s'observer soi-même", "Lina MARTIN" not in opts and "Noah PETIT" in opts, opts))
        await e.select_option("[data-f=cible]", label="Noah PETIT"); await e.wait_for_timeout(200); await e.click("[data-go]"); await e.wait_for_timeout(200)
        t1 = await e.inner_text(".epsgs-in"); out.append(("2d un critère par écran, avec les niveaux de l'enseignant puis ceux par défaut", "se replace" in t1 and "Reste sur place" in t1 and "Toujours" in t1 and "annonce" not in t1, t1[:200])); await shot(e, "3-un-critere-par-ecran")
        out.append(("2e « Suivant » bloqué tant qu'aucun niveau n'est choisi", await e.locator("[data-next]").is_disabled(), None))
        for d in [3, 1, 2]:
            await e.locator("[data-d='%d']" % d).click(); await e.wait_for_timeout(120); await e.click("[data-next]"); await e.wait_for_timeout(150)
        await e.click("[data-ok]"); await e.wait_for_timeout(400)
        out.append(("2f merci, observation enregistrée", "Ton observation de" in await e.inner_text(".epsgs-in"), None))
        await e.click("[data-new]"); await e.wait_for_timeout(200); await e.select_option("[data-f=moi]", label="Emma DURAND"); await e.select_option("[data-f=cible]", label="Noah PETIT"); await e.click("[data-go]")
        for d in [1, 1, 2]:
            await e.locator("[data-d='%d']" % d).click(); await e.wait_for_timeout(120); await e.click("[data-next]"); await e.wait_for_timeout(150)
        await e.click("[data-ok]"); await e.wait_for_timeout(400)
        await e.wait_for_timeout(6000)
        # ---------- 3. retour chez l'enseignant : résultats ----------
        ok = False
        for i in range(25):
            await p.wait_for_timeout(2000)
            try: await p.evaluate("EPSD.syncOne('eps.coeval.v1')")
            except Exception: pass
            n = await p.evaluate("(function(){var o=Object.values(" + CO + ").filter(function(x){return x.k==='co'})[0];return o?Object.keys(o.by).length:0})()")
            if n == 2: ok = True; break
        out.append(("3 les deux observations reviennent chez l'enseignant", ok, None))
        m = await p.evaluate("EPSE.coeval.moy('vol','2GT1 TEST','Noah PETIT')")
        out.append(("3b moyenne des camarades par critère (3 et 1 → niveau 3 sur 4 ; 1 et 1 → 2 sur 4)", m is not None and m["n"] == 2 and m["ev"][gid[0]]["d"] == 2 and m["ev"][gid[1]]["d"] == 1, m))
        await p.click("#co-ov [data-tab=r]"); await p.select_option("#co-ov [data-cls]", label="2GT1 TEST"); await p.wait_for_timeout(300); await shot(p, "4-resultats-de-la-coevaluation")
        out.append(("3c tableau des résultats : élève observé, 2 camarades", "Noah PETIT" in await p.inner_text("#co-ov") and await p.locator("#co-ov table tr").count() == len(NOMS) + 1, None))
        await p.click("#co-ov [data-tab=g]"); await p.click("#co-ov [data-on]"); await p.wait_for_timeout(200); await p.click("#co-ov [data-x]")
        # ---------- 4. Danse et Escalade : même écran ; « reprendre ma grille d'évaluation » ----------
        await p.goto(B + "danse/"); await p.wait_for_timeout(5000)
        acts = await p.evaluate("EPSLC.evalActions().map(function(a){return a.label})"); out.append(("4 action « Coévaluation » en Danse", "Coévaluation" in acts, acts))
        await p.evaluate("EPSE.coeval.edit({app:'dan',nom:'Danse'})"); await p.wait_for_timeout(300); await p.click("#co-ov [data-src=eval]"); await p.wait_for_timeout(300)
        nli = await p.locator("#co-ov li").count(); await p.click("#co-ov [data-on]"); await p.wait_for_timeout(200); await p.click("#co-ov [data-x]"); await p.wait_for_timeout(200)
        out.append(("4b Danse : reprise de la grille d'évaluation (critères listés)", nli >= 2, nli))
        await p.evaluate("(function(){var c=(window.epsCurrentClass&&epsCurrentClass())||{};EPSE.coeval.eleve({app:'dan',cls:'2GT1 TEST'})})()"); await p.wait_for_timeout(400)
        await p.select_option("[data-f=moi]", label="Hugo LEROY"); await p.select_option("[data-f=cible]", label="Jade MOREAU"); await p.click("[data-go]"); await p.wait_for_timeout(200)
        for i in range(nli):
            await p.locator("[data-d='2']").click(); await p.wait_for_timeout(100); await p.click("[data-next]"); await p.wait_for_timeout(120)
        await p.click("[data-ok]"); await p.wait_for_timeout(300)
        o = await p.evaluate("Object.values(" + CO + ").filter(function(x){return x.k==='co'&&x.app==='dan'}).map(function(x){var b=Object.values(x.by)[0];return [x.n,b.n,b.g,Object.keys(b.ev).length]})")
        out.append(("4c Danse : observation enregistrée sur la grille d'évaluation", len(o) == 1 and o[0][0] == "Jade MOREAU" and o[0][2] == "eval" and o[0][3] == nli, o))
        await p.goto(B + "escalade/"); await p.wait_for_timeout(5000)
        out.append(("4d Escalade : la carte 🙋 n'a plus de case, la coévaluation ne s'ajoute plus à l'auto-positionnement", await p.evaluate("typeof EPSE.coeval.edit==='function' && !('coOn' in (EPSE_INST[0].A.settings()||{}))"), None))
        # ---------- 5. référentiel : critères de ma grille à rattacher, regard des camarades sur la fiche ----------
        await p.goto(B + "referentiel/"); await p.wait_for_timeout(2500)
        r = await p.evaluate("(function(){var g=EPSREF.gridsAll().filter(function(x){return x.key==='vol|co'})[0],P=EPSREF.profil('NOAH PETIT',{}),a=P.acts.filter(function(x){return x.sn.app==='vol'})[0];return [g?g.crit.length:0,a?a.co:null,a?a.rows.filter(function(x){return x.kind==='co'}).map(function(x){return Math.round(x.c*10)/10}):null]})()")
        out.append(("5 référentiel : grille « Volley · 👥 Coévaluation » et regard des camarades (2,5 · 1,5 · 2,5)", r[0] == 3 and r[1] == 2 and r[2] == [2.5, 1.5, 2.5], r))
        # ---------- 6. plan de terrain : le schéma du lieu arrive sur une autre tablette ----------
        await p.goto(B + "volley/"); await p.wait_for_timeout(5000); await p.evaluate("EPSGR.terrain({dir:'volley',cls:'2GT1 TEST'})"); await p.wait_for_timeout(500)
        await p.click(".gr-w [data-arr]"); await p.wait_for_timeout(200)
        png = await p.evaluate("(function(){var c=document.createElement('canvas');c.width=1600;c.height=1000;var x=c.getContext('2d');for(var i=0;i<400;i++){x.fillStyle='hsl('+(i*37%360)+',70%,'+(30+i%50)+'%)';x.fillRect((i*83)%1600,(i*131)%1000,180,120)}x.fillStyle='#000';x.font='60px sans-serif';x.fillText('GYMNASE',600,500);return c.toDataURL('image/png').split(',')[1]})()")
        open("/tmp/gymnase.png", "wb").write(base64.b64decode(png))
        await p.set_input_files(".gr-w [data-img]", "/tmp/gymnase.png"); await p.wait_for_timeout(1500)
        meta = await p.evaluate("(function(){var I=JSON.parse(localStorage.getItem('eps.terrain.v1')).items,m=I['img|volley'];return m?[m.n,Object.keys(I).filter(function(k){return /^img\\|volley\\|\\d+$/.test(k)&&!I[k].del}).length,Math.max.apply(null,Object.keys(I).filter(function(k){return /^img\\|volley\\|\\d+$/.test(k)}).map(function(k){return I[k].d.length}))]:null})()")
        out.append(("6 schéma découpé en morceaux de 24 000 caractères au plus", meta is not None and meta[0] >= 2 and meta[0] == meta[1] and meta[2] <= 24000, meta))
        out.append(("6b schéma affiché sur le plan de la tablette qui l'a déposé", "data:image/jpeg" in await p.evaluate("document.querySelector('.gr-w [data-map]').style.background"), None))
        await p.click(".gr-w [data-arr]"); await p.wait_for_timeout(300); await shot(p, "5-plan-avec-schema")
        await p.wait_for_timeout(7000)
        q = await c2.new_page(); q.on("pageerror", lambda x: errs.append("tablette 2 " + str(x)[:200])); q.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await q.goto(B + "volley/"); await q.wait_for_timeout(5000); await q.evaluate("EPSGR.terrain({dir:'volley',cls:'2GT1 TEST'})"); ok = False
        for i in range(30):
            await q.wait_for_timeout(2000)
            try: await q.evaluate("EPSD.syncOne('eps.terrain.v1')")
            except Exception: pass
            if "data:image/jpeg" in await q.evaluate("(document.querySelector('.gr-w [data-map]')||{style:{background:''}}).style.background"): ok = True; break
        out.append(("6c le schéma s'affiche sur la 2e tablette sans rien y déposer (après %d s)" % ((i + 1) * 2), ok, None))
        same = await q.evaluate("localStorage.getItem('eps.terrain.img.volley')") == await p.evaluate("localStorage.getItem('eps.terrain.img.volley')")
        out.append(("6d image identique sur les deux tablettes", same, None))
        await p.click(".gr-w [data-arr]"); await p.wait_for_timeout(200); await p.click(".gr-w [data-noimg]"); await p.wait_for_timeout(7000); ok = False
        for i in range(30):
            await q.wait_for_timeout(2000)
            try: await q.evaluate("EPSD.syncOne('eps.terrain.v1')")
            except Exception: pass
            if "data:image" not in await q.evaluate("document.querySelector('.gr-w [data-map]').style.background"): ok = True; break
        out.append(("6e schéma retiré : il disparaît aussi de la 2e tablette", ok, None))
        out.append(("7 aucune erreur de page", not errs, errs))
        await b.close()
    bad = 0
    for t, ok, d in out:
        print(("✓ " if ok else "✗ ") + t + ("" if ok or d is None else "  → " + json.dumps(d, ensure_ascii=False)[:500])); bad += 0 if ok else 1
    print("%d échec(s) sur %d" % (bad, len(out))); return bad
try: r = asyncio.run(main())
finally: srv.terminate(); gs.terminate()
sys.exit(1 if r else 0)
