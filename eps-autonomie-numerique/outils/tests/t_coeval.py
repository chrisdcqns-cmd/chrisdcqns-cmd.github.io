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
        out.append(("2b' prénoms en tuiles, pas de liste déroulante", await e.locator(".epsgs-in select").count() == 0 and await e.locator("[data-pick=moi]").count() == len(NOMS), None)); await shot(e, "2b-qui-es-tu")
        await e.click("[data-pick=moi][data-v='Lina MARTIN']"); await e.wait_for_timeout(200)
        opts = await e.locator("[data-pick=cible]").evaluate_all("function(L){return L.map(function(x){return x.dataset.v})}"); out.append(("2c on ne peut pas s'observer soi-même", "Lina MARTIN" not in opts and "Noah PETIT" in opts, opts))
        await e.click("[data-pick=cible][data-v='Noah PETIT']"); await e.wait_for_timeout(200); await e.click("[data-go]"); await e.wait_for_timeout(200)
        t1 = await e.inner_text(".epsgs-in"); out.append(("2d un critère par écran, avec les niveaux de l'enseignant puis ceux par défaut", "se replace" in t1 and "Reste sur place" in t1 and "Toujours" in t1 and "annonce" not in t1, t1[:200])); await shot(e, "3-un-critere-par-ecran")
        out.append(("2e « Suivant » bloqué tant qu'aucun niveau n'est choisi", await e.locator("[data-next]").is_disabled(), None))
        for d in [3, 1, 2]:
            await e.locator("[data-d='%d']" % d).click(); await e.wait_for_timeout(120); await e.click("[data-next]"); await e.wait_for_timeout(150)
        await e.click("[data-ok]"); await e.wait_for_timeout(400)
        out.append(("2f merci, observation enregistrée", "Ton observation de" in await e.inner_text(".epsgs-in"), None))
        await e.click("[data-new]"); await e.wait_for_timeout(200); await e.click("[data-pick=moi][data-v='Emma DURAND']"); await e.click("[data-pick=cible][data-v='Noah PETIT']"); await e.click("[data-go]")
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
            n = await p.evaluate("Object.values(" + CO + ").filter(function(x){return x.k==='co'&&!x.del}).length")
            if n == 2: ok = True; break
        out.append(("3 les deux observations reviennent chez l'enseignant", ok, None))
        m = await p.evaluate("EPSE.coeval.moy('vol','2GT1 TEST','Noah PETIT')")
        out.append(("3b moyenne des camarades par critère (3 et 1 → niveau 3 sur 4 ; 1 et 1 → 2 sur 4)", m is not None and m["n"] == 2 and m["ev"][gid[0]]["d"] == 2 and m["ev"][gid[1]]["d"] == 1, m))
        await p.click("#co-ov [data-tab=r]"); await p.select_option("#co-ov [data-cls]", label="2GT1 TEST"); await p.wait_for_timeout(300); await shot(p, "4-resultats-de-la-coevaluation")
        out.append(("3c tableau des résultats : élève observé, 2 camarades", "Noah PETIT" in await p.inner_text("#co-ov") and await p.locator("#co-ov table tr").count() == len(NOMS) + 1, None))
        # ---------- 3bis. personnalisation : familles en couleur, niveaux, observables, auto-évaluation, divergence ----------
        await p.click("#co-ov [data-tab=g]"); await p.wait_for_timeout(200)
        await p.click("#co-ov [data-fdef]"); await p.wait_for_timeout(300)
        out.append(("5 familles proposées ajoutées après confirmation (3, nom et couleur modifiables)", await p.locator("#co-ov [data-fnom]").count() == 3 and await p.locator("#co-ov [data-fcol]").count() == 3, None))
        await p.locator("#co-ov [data-fcol]").nth(0).evaluate("function(f){f.value='#aa0044';f.dispatchEvent(new Event('change'))}"); await p.wait_for_timeout(200)
        await p.select_option("#co-ov [data-cfam='0']", label="Moteur"); await p.wait_for_timeout(200); await p.select_option("#co-ov [data-cfam='2']", label="Social"); await p.wait_for_timeout(200)
        await p.click("#co-ov [data-nv='3']"); await p.wait_for_timeout(200)
        out.append(("5b 3 niveaux : 3 cases par critère, noms modifiables", await p.locator("#co-ov [data-desc^='1|']").count() == 3 and await p.locator("#co-ov [data-nn]").count() == 3, None))
        await p.locator("#co-ov [data-nn='2']").fill("Très souvent"); await p.locator("#co-ov [data-nn='2']").dispatch_event("change"); await p.wait_for_timeout(200)
        for j, t in enumerate(["Regarde le ballon", "Revient à sa place"]):
            await p.click("#co-ov [data-oadd='0']"); await p.wait_for_timeout(150); await p.locator("#co-ov [data-obs='0|%d']" % j).fill(t); await p.locator("#co-ov [data-obs='0|%d']" % j).dispatch_event("change")
        await p.click("#co-ov [data-opt=com]"); await p.wait_for_timeout(200); await p.click("#co-ov [data-opt=mot]"); await p.wait_for_timeout(200)
        g = await p.evaluate(CO + "['g|vol']")
        out.append(("5c grille : couleur choisie, famille par critère, 3 niveaux, 2 observables, commentaire → auto-évaluation activée", g["fam"][0]["col"] == "#aa0044" and g["crit"][0]["fam"] == g["fam"][0]["id"] and g["nv"] == 3 and g["crit"][0]["obs"] == ["Regarde le ballon", "Revient à sa place"] and g["auto"] == 1 and g["com"] == 1 and g["mot"] == 1 and g["nn"]["3"][2] == "Très souvent", g))
        await shot(p, "6-grille-personnalisee"); await p.click("#co-ov [data-x]")
        await p.evaluate("EPSE.coeval.eleve({app:'vol',cls:'2GT1 TEST'})"); await p.wait_for_timeout(400)
        await p.click("[data-pick=moi][data-v='Lina MARTIN']"); await p.click("[data-pick=cible][data-v='Emma DURAND']"); await p.click("[data-go]"); await p.wait_for_timeout(200)
        t1 = await p.inner_text(".epsgs-in"); out.append(("6 écran élève : famille en couleur, observables à cocher, 3 niveaux", "Moteur" in t1 and "Regarde le ballon" in t1 and await p.locator(".epsgs-in [data-d]").count() == 3 and "170, 0, 68" in await p.locator(".epsgs-in .co-fam").evaluate("function(x){return getComputedStyle(x).backgroundColor}"), t1[:200]))
        await p.click("[data-ob='1']"); await p.wait_for_timeout(150); await shot(p, "7-observables-et-famille")
        for d in [2, 1, 0]:
            await p.locator("[data-d='%d']" % d).click(); await p.wait_for_timeout(120); await p.click("[data-next]"); await p.wait_for_timeout(150)
        await p.fill("[data-mot]", "Regarde plus tes partenaires"); await shot(p, "7b-mes-reponses"); await p.click("[data-pass]"); await p.wait_for_timeout(200)
        t2 = await p.inner_text(".epsgs-in"); out.append(("6b « Passe la tablette à… » : les réponses du camarade sont cachées", "Passe la tablette à Emma DURAND" in t2 and "Très souvent" not in t2, t2[:160]))
        await p.click("[data-self]"); await p.wait_for_timeout(200)
        out.append(("6c l'élève observé s'évalue sur les mêmes critères", "tu t'évalues toi-même" in await p.inner_text(".epsgs-in") and await p.locator(".epsgs-in [data-ob]").count() == 0, None))
        for d in [0, 1, 0]:
            await p.locator("[data-d='%d']" % d).click(); await p.wait_for_timeout(120); await p.click("[data-next]"); await p.wait_for_timeout(150)
        t3 = await p.inner_text(".epsgs-in"); out.append(("6d comparaison : 1 regard différent sur 3, un commentaire de chaque côté sur ce critère seulement", "1 regard différent sur 3" in t3 and await p.locator(".epsgs-in .co-cmp.div").count() == 1 and await p.locator(".epsgs-in [data-com]").count() == 2, t3[:200]))
        await p.locator("[data-com$='|o']").fill("Tu reviens vite au centre"); await p.locator("[data-com$='|s']").fill("Je me trouve trop lente"); await shot(p, "8-comparaison-et-commentaires")
        await p.click("[data-ok]"); await p.wait_for_timeout(400)
        it = await p.evaluate("Object.values(" + CO + ").filter(function(x){return x.k==='co'&&x.n==='Emma DURAND'})[0]"); ob1 = list(it["by"].values())[0] if it else {}
        out.append(("6e enregistré : niveaux sur 3, observable coché, auto-évaluation, deux commentaires, conseil", bool(it) and ob1["ev"][gid[0]]["i"] == 2 and ob1["ev"][gid[0]]["nv"] == 3 and ob1["ev"][gid[0]]["d"] == 3 and ob1["ev"][gid[0]]["ob"] == [1] and ob1["self"][gid[0]]["i"] == 0 and ob1["com"][gid[0]] == {"o": "Tu reviens vite au centre", "s": "Je me trouve trop lente"} and list(ob1["com"].keys()) == [gid[0]] and ob1["mot"] == "Regarde plus tes partenaires", ob1))
        await p.keyboard.press("Escape"); await p.evaluate("document.querySelectorAll('.epsgs').forEach(function(x){x.remove()})")
        # tablette de contrôle : 👥 Coévaluation → résultats de la classe
        await p.evaluate("EPSLC.controle({cls:'2GT1 TEST'})"); await p.wait_for_timeout(600)
        await p.click("#lc-ctl [data-coev]"); await p.wait_for_timeout(400); tr = await p.inner_text("#co-ov")
        out.append(("7 tablette de contrôle : 👥 Coévaluation ouvre les résultats de la classe (👥 et 🙋, divergences)", "Emma DURAND" in tr and "🙋" in tr and "⚠" in tr and await p.locator("#co-ov [data-cls]").input_value() == "2GT1 TEST", tr[:200])); await shot(p, "9-resultats-depuis-la-tablette-de-controle")
        await p.locator("#co-ov [data-det='Emma DURAND']").click(); await p.wait_for_timeout(300); td = await p.inner_text("#co-ov")
        out.append(("7b détail d'un élève : observateur, les deux regards, commentaires, conseil, observables", "Observé par Lina MARTIN" in td and "Je me trouve trop lente" in td and "Tu reviens vite au centre" in td and "Regarde plus tes partenaires" in td and "1 / 2 observable" in td, td[:300])); await shot(p, "10-detail-d-un-eleve")
        m2 = await p.evaluate("EPSE.coeval.moy('vol','2GT1 TEST','Noah PETIT')"); out.append(("7c les observations d'avant (4 niveaux) restent lisibles", m2 is not None and m2["n"] == 2, None))
        await p.click("#co-ov [data-x]"); await p.evaluate("var c=document.getElementById('lc-ctl');if(c)c.remove()")
        await p.evaluate("EPSE.coeval.edit({app:'vol',nom:'Volley-ball'})"); await p.wait_for_timeout(300)
        # ---------- 3ter. thématiques : idées proposées par activité, plusieurs coévaluations ----------
        await p.click("#co-ov [data-tab=i]"); await p.wait_for_timeout(300); ti = await p.inner_text("#co-ov")
        out.append(("8 💡 idées de thématiques pour le volley, critères de réalisation et de réussite", "La réception en manchette" in ti and "L'attaque" in ti and "critères de réussite" in ti and await p.locator("#co-ov [data-idee]").count() == 4, ti[:200])); await shot(p, "11-idees-de-thematiques")
        await p.click("#co-ov [data-idee='2']"); await p.wait_for_timeout(400)
        gs = await p.evaluate("EPSE.coeval.grids('vol').map(function(g){return {t:g.titre,on:g.on,prop:g.prop,n:g.crit.length,f:g.fam.map(function(f){return f.nom}),gid:g.gid}})")
        out.append(("8b thématique ajoutée après confirmation : fermée, à relire, 2 familles, 4 critères ; la grille principale est intacte", len(gs) == 2 and gs[0]["n"] == 3 and gs[1]["t"] == "L'attaque" and not gs[1]["on"] and gs[1]["prop"] == 1 and gs[1]["n"] == 4 and gs[1]["f"] == ["Critères de réalisation", "Critères de réussite"], gs))
        out.append(("8c bandeau rouge « Proposition à relire », nom modifiable", "Proposition à relire" in await p.inner_text("#co-ov") and await p.locator("#co-ov [data-titre]").input_value() == "L'attaque", None)); await shot(p, "12-thematique-a-relire")
        await p.click("#co-ov [data-vu]"); await p.wait_for_timeout(200); await p.click("#co-ov [data-on]"); await p.wait_for_timeout(200); await p.click("#co-ov [data-x]")
        await p.evaluate("EPSE.coeval.eleve({app:'vol',cls:'2GT1 TEST'})"); await p.wait_for_timeout(400); tt = await p.inner_text(".epsgs-in")
        out.append(("8d deux coévaluations ouvertes : l'élève choisit ce qu'il observe", await p.locator(".epsgs-in [data-th]").count() == 2 and "L'attaque" in tt, tt[:160])); await shot(p, "13-l-eleve-choisit-la-thematique")
        await p.click("[data-th='1']"); await p.click("[data-pick=moi][data-v='Hugo LEROY']"); await p.click("[data-pick=cible][data-v='Emma DURAND']"); await p.click("[data-go]"); await p.wait_for_timeout(200)
        for d in [3, 3, 2, 0]:
            await p.locator("[data-d='%d']" % d).click(); await p.wait_for_timeout(120); await p.click("[data-next]"); await p.wait_for_timeout(150)
        await p.click("[data-ok]"); await p.wait_for_timeout(300); await p.evaluate("document.querySelectorAll('.epsgs').forEach(function(x){x.remove()})")
        gid2 = gs[1]["gid"]; ma = await p.evaluate("EPSE.coeval.moy('vol','2GT1 TEST','Emma DURAND','%s')" % gid2); mp = await p.evaluate("EPSE.coeval.moy('vol','2GT1 TEST','Emma DURAND','')")
        out.append(("8e résultats séparés par thématique (Emma : 1 observation sur l'attaque, 1 sur la grille principale)", ma is not None and ma["n"] == 1 and len(ma["ev"]) == 4 and mp is not None and mp["n"] == 1 and len(mp["ev"]) == 3, (ma, mp)))
        await p.evaluate("EPSE.coeval.edit({app:'vol',nom:'Volley-ball',tab:'r',cls:'2GT1 TEST'})"); await p.wait_for_timeout(300); await p.click("#co-ov [data-gid='%s']" % gid2); await p.wait_for_timeout(300); tr2 = await p.inner_text("#co-ov")
        out.append(("8f onglet Résultats : on passe d'une thématique à l'autre", "prend de l" in tr2 and "se replace" not in tr2, tr2[:200]))
        await p.click("#co-ov [data-gid='']"); await p.wait_for_timeout(200)
        idn = await p.evaluate("Object.keys(EPSE.coeval.IDEES).sort().join(',')"); out.append(("8g des idées pour les dix activités", idn == "acro,bad,bk,ct,dan,esc,ori,rel,step,vol", idn))
        await p.click("#co-ov [data-tab=g]"); await p.click("#co-ov [data-on]"); await p.wait_for_timeout(200); await p.click("#co-ov [data-x]")
        # ---------- 4. Danse et Escalade : même écran ; « reprendre ma grille d'évaluation » ----------
        await p.goto(B + "danse/"); await p.wait_for_timeout(5000)
        acts = await p.evaluate("EPSLC.evalActions().map(function(a){return a.label})"); out.append(("4 action « Coévaluation » en Danse", "Coévaluation" in acts, acts))
        await p.evaluate("EPSE.coeval.edit({app:'dan',nom:'Danse'})"); await p.wait_for_timeout(300); await p.click("#co-ov [data-src=eval]"); await p.wait_for_timeout(300)
        nli = await p.locator("#co-ov li").count(); await p.click("#co-ov [data-on]"); await p.wait_for_timeout(200); await p.click("#co-ov [data-x]"); await p.wait_for_timeout(200)
        out.append(("4b Danse : reprise de la grille d'évaluation (critères listés)", nli >= 2, nli))
        await p.evaluate("(function(){var c=(window.epsCurrentClass&&epsCurrentClass())||{};EPSE.coeval.eleve({app:'dan',cls:'2GT1 TEST'})})()"); await p.wait_for_timeout(400)
        await p.click("[data-pick=moi][data-v='Hugo LEROY']"); await p.click("[data-pick=cible][data-v='Jade MOREAU']"); await p.click("[data-go]"); await p.wait_for_timeout(200)
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
        out.append(("5 référentiel : grille « Volley · 👥 Coévaluation » (grille principale + thématique) et regard des camarades (2,5 · 1,5 · 2,5)", r[0] == 7 and r[1] == 2 and r[2] == [2.5, 1.5, 2.5], r))
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
