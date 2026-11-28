# Cross-training : bases enrichies du 28/11/2026 (ct-plus.js) : 52 exercices, 43 WOD, formes Échelle / Échelle montante / Death by,
# EMOM à plusieurs exercices par minute, échauffements, défis et jeux, retour au calme, savoir, leçon en 5 temps, WOD adapté,
# WOD test, ⚙ Réglages → 🗂 Contenus (supprimer / remettre).
# python3 t_ct_plus.py <racine du dépôt> [dossier des captures]
import asyncio, sys, subprocess, time, json
from playwright.async_api import async_playwright
ROOT = sys.argv[1]; SHOTS = sys.argv[2] if len(sys.argv) > 2 else ""
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8861", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8861/eps-autonomie-numerique/crosstraining/"; CL = "TGT TEST"
NOMS = ["Lina MARTIN", "Noah PETIT", "Emma DURAND", "Hugo LEROY", "Ines O'BRIEN"]
LISTE = "if(!localStorage.getItem('eps.lists.v1'))localStorage.setItem('eps.lists.v1',JSON.stringify({items:{c1:{id:'c1',nom:'" + CL + "',el:" + json.dumps(NOMS) + ",u:1}},pend:{},since:0}));"
PROF = "try{" + LISTE + "localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));}catch(e){}"
ELEVE = "try{" + LISTE + "}catch(e){}"
DEB = "(function(){var d=document.documentElement;return d.scrollWidth-d.clientWidth})()"
async def main():
    out = []; errs = []
    def ok(t, c, d=""): out.append((t, bool(c), d))
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox"])
        # ---------- 1 · enseignant ----------
        c = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await c.add_init_script(PROF)
        p = await c.new_page(); p.on("pageerror", lambda x: "Wake Lock" in str(x) or errs.append("enseignant " + str(x)[:300])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(3500)
        n = await p.evaluate("({ex:S.fiches.exercices.length, w:WODS.length, f:Object.keys(FORMATS).length, m:Object.keys(MATERIELS).length, ids:new Set(S.fiches.exercices.map(e=>e.id)).size, wid:new Set(WODS.map(w=>w.id)).size})")
        ok("52 exercices, 43 WOD, 9 formes de travail, 6 matériels, identifiants uniques", n == {"ex": 52, "w": 43, "f": 9, "m": 6, "ids": 52, "wid": 43}, n)
        bad = await p.evaluate("""(function(){var B=[];CTP.EXOS.forEach(function(e){if(!e.prim.concat(e.sec).every(function(m){return MUSCLES.includes(m)}))B.push('muscle '+e.id);if(!e.niveaux.length||e.niveaux.some(function(n){return !n.nom||!n.consigne||!n.rep||!n.norep}))B.push('niveau '+e.id);if(!CTP.QUAL[e.id])B.push('qual '+e.id);if(!MATERIELS[e.materiel||'PC'])B.push('mat '+e.id)});
          S.fiches.exercices.forEach(function(e){if(!CTP.QUAL[e.id])B.push('qual '+e.id)});
          WODS.forEach(function(w){w.items.forEach(function(i){var e=exParId(i[0]);if(!e)B.push(w.id+' : exercice inconnu '+i[0]);else if(i[1]>e.niveaux.length)B.push(w.id+' : niveau '+i[0])});w.mat.forEach(function(m){if(!MATERIELS[m])B.push(w.id+' mat '+m)});
            var need=new Set(w.items.map(function(i){return (exParId(i[0])||{}).materiel||'PC'}));need.forEach(function(m){if(m!=='PC'&&!w.mat.includes(m))B.push(w.id+' : matériel non annoncé '+m)});
            try{var l=wodEnLecon(w),P=phases(l),t=texteWod(l);if(P.length<2||!t.tete||t.lignes.some(function(x){return !x||/undefined|NaN/.test(x)})||/undefined|NaN/.test(t.tete))B.push(w.id+' : texte '+t.tete);var d=dureeEstimee(l);if(!(d>0))B.push(w.id+' : durée');chronoDeWod(w)}catch(e){B.push(w.id+' : '+e.message)}});
          JSON.stringify(S.fiches).match(/kettlebells? (de )?(8|10|12|16)/gi)&&B.push('kettlebell de plus de 6 kg');return B})()""")
        ok("fiches et WOD cohérents (muscles, niveaux, matériel annoncé, textes, chronos), kettlebells de 6 kg au plus", not bad, bad)
        # chaque onglet, sans erreur ni débordement
        deb = {}
        for o in ["biblio", "wods", "lecon", "jour", "etir", "gerer", "param", "contenus"]:
            await p.evaluate("aller('" + o + "')"); await p.wait_for_timeout(250); deb[o] = await p.evaluate(DEB)
        for hk in ["echauf", "defis", "calme", "savoir"]:
            await p.evaluate("S.hub='" + hk + "';aller('etir')"); await p.wait_for_timeout(200); deb["hub " + hk] = await p.evaluate(DEB)
        ok("enseignant : aucun débordement horizontal sur les onglets et les 4 bases", all(v <= 1 for v in deb.values()), deb)
        hub = await p.evaluate("(function(){var r={};['echauf','defis','calme','savoir'].forEach(function(k){S.hub=k;S.cpOutil=null;rendre();r[k]=document.querySelectorAll('#vue section.bloc').length});r.txt=document.querySelector('#vue').innerText;return r})()")
        ok("enseignant : 12 échauffements, 7 défis, 6 routines + étirements, savoir avec idées reçues et tableau des AFL", hub["echauf"] == 12 and hub["defis"] == 7 and hub["calme"] >= 8 and "Idées reçues" in hub["txt"] and "AFL1 · Analyser" in hub["txt"], {k: v for k, v in hub.items() if k != "txt"})
        # formes de travail : timer
        r = await p.evaluate("""(function(){var R={};function go(id){S.lecon=wodEnLecon(WODS.find(function(w){return w.id===id}));lancerTimer();suivante()}
          function tour(){var n=TM.P[TM.i].it.length;for(var i=0;i<n;i++){var c=cible(exCourant());for(var j=0;j<c;j++)compter('rep')}}
          go('p1');R.e1=cible(exCourant());tour();R.e2=cible(exCourant());tour();R.e3=cible(exCourant());tour();R.eScore=TM.res&&TM.res.score;R.eSec=TM.res&&TM.res.sec;clearInterval(TM.iv);TM=null;fermer();
          go('p6');R.x=[cible(TM.P[TM.i].it[0]),cible(TM.P[TM.i].it[2])];tour();R.x2=[cible(TM.P[TM.i].it[0]),cible(TM.P[TM.i].it[2])];clearInterval(TM.iv);TM=null;fermer();
          go('p3');R.fixe=[cible(TM.P[TM.i].it[0]),cible(TM.P[TM.i].it[3])];clearInterval(TM.iv);TM=null;fermer();
          go('p2');R.m1=cible(exCourant());tour();R.m2=cible(exCourant());finTimer();R.mScore=TM.res.score;clearInterval(TM.iv);TM=null;fermer();
          go('p5');R.d1=cible(exCourant());tour();R.dOk=TM.mnOk;R.dZone=document.querySelector('#tmZone').innerText;compter('rep');R.dIgn=TM.mnOk&&exCourant()===null;
          TM.debut=Date.now()-61000;tick();R.d2=cible(exCourant());R.dPh=TM.P[TM.i].db;TM.debut=Date.now()-61000;tick();R.dScore=TM.res&&TM.res.score;clearInterval(TM.iv);TM=null;fermer();
          go('p15');R.g=[TM.P[TM.i].it.map(function(x){return x.exId}),TM.P[TM.i+1].it.map(function(x){return x.exId}),TM.P[TM.i+3].it.map(function(x){return x.exId})];tour();R.gOk=TM.mnOk;TM.debut=Date.now()-61000;tick();R.gNext=exCourant()&&exCourant().exId;clearInterval(TM.iv);TM=null;fermer();
          go('w5');R.old=TM.P[TM.i].t+'|'+TM.P[TM.i].ex.exId;clearInterval(TM.iv);TM=null;fermer();return R})()""")
        ok("Échelle 21-15-9 : 21, puis 15, puis 9, score au temps", r["e1"] == 21 and r["e2"] == 15 and r["e3"] == 9 and r["eScore"] and ":" in r["eScore"] and isinstance(r["eSec"], int), r)
        ok("Échelle ×n : quantités multipliées ; exercice « fixe » hors échelle", r["x"] == [20, 5] and r["x2"] == [40, 10] and r["fixe"] == [15, 2], r)
        ok("Échelle montante : 2, puis 3 ; score en paliers", r["m1"] == 2 and r["m2"] == 3 and "palier" in r["mScore"], r)
        ok("Death by : 3, minute réussie = repos, puis 4 ; minute non terminée = fin avec le score", r["d1"] == 3 and r["dOk"] == 1 and "Minute réussie" in r["dZone"] and r["dIgn"] and r["d2"] == 4 and r["dPh"] == 1 and r["dScore"] == "1 minute(s) réussie(s)", r)
        ok("EMOM à plusieurs exercices par minute : groupes qui tournent ; ancien EMOM inchangé", r["g"] == [["burpee", "dips"], ["wallball", "grimpeur"], ["burpee", "dips"]] and r["gOk"] == 1 and r["gNext"] == "wallball" and r["old"] == "work|squat", r)
        # réglages → contenus
        await p.evaluate("aller('contenus')"); await p.wait_for_timeout(200)
        await p.evaluate("document.querySelector(\"[data-cp='off:wod:p5']\").click()"); await p.evaluate("document.querySelector(\"[data-cp='off:ech:roxanne']\").click()"); await p.evaluate("document.querySelector(\"[data-cp='off:fmt:deathby']\").click()"); await p.evaluate("document.querySelector(\"[data-cp='exoff:hrpu']\").click()"); await p.wait_for_timeout(300)
        s = await p.evaluate("""(function(){var R={off:(stLd().items.cfg||{}).off,ex:!!exParId('hrpu'),np:S.nonPublie};aller('wods');R.w=document.querySelector('#vue').innerText;S.hub='echauf';aller('etir');R.e=document.querySelector('#vue').innerText;S.lecon=nouvelleLecon();aller('lecon');R.f=[].map.call(document.querySelectorAll('[data-format]'),function(b){return b.dataset.format});return R})()""")
        ok("Contenus : WOD, échauffement, forme et exercice supprimés disparaissent partout", "Death by burpees" not in s["w"] and "Death by trio" not in s["w"] and "21-15-9 lycée" in s["w"] and "Roxanne" not in s["e"] and "Sally up" in s["e"] and "deathby" not in s["f"] and "echelle" in s["f"] and not s["ex"] and s["np"], {k: v for k, v in s.items() if k not in ("w", "e")})
        await p.evaluate("aller('contenus')"); await p.evaluate("document.querySelector(\"[data-cp='toutremettre']\").click()"); await p.wait_for_timeout(300)
        s = await p.evaluate("({off:(stLd().items.cfg||{}).off, ex:!!exParId('hrpu'), n:S.fiches.exercices.length, g:cfgCT().groupes})")
        ok("Contenus : « Tout remettre » rétablit tout, sans toucher aux autres réglages", s["off"] == [] and s["ex"] and s["n"] == 52 and s["g"]["solo"], s)
        # leçon du jour en 5 temps + WOD adapté
        await p.evaluate("aller('jour')"); await p.wait_for_timeout(200)
        await p.evaluate("""(function(){var f=S.formJour;f.c='""" + CL + """';f.titre='Leçon 4';f.mode='libre';f.blocs={e1:'reveil',e2:'oie',skill:'burpee',defi:'de',calme:'respiration'};f.adapt={"Ines O'BRIEN":'p27'};programmer()})()"""); await p.wait_for_timeout(300)
        j = await p.evaluate("(function(){var o=stLd().items['j|" + CL + "|'+auj()];return {b:o&&o.blocs,a:o&&o.adapt,t:document.querySelector('#vue').innerText}})()")
        ok("leçon du jour : les 5 temps et le WOD adapté sont enregistrés et résumés", j["b"] and j["b"]["skill"] == "burpee" and j["a"] == {"Ines O'BRIEN": "p27"} and "Réveil articulaire" in j["t"] and "WOD adapté : Ines O'BRIEN" in j["t"], {k: v for k, v in j.items() if k != "t"})
        if SHOTS:
            for nom, js in [("ct_contenus", "aller('contenus');document.querySelector('details[data-cpdet=wod]').open=true"), ("ct_echauffements", "S.hub='echauf';aller('etir')"), ("ct_lecon_jour", "aller('jour')")]:
                await p.evaluate(js); await p.wait_for_timeout(300); await p.screenshot(path=SHOTS + "/" + nom + ".png")
        store = await p.evaluate("localStorage.getItem('ct.v1')")
        await c.close()
        # ---------- 2 · élève (téléphone) ----------
        c = await b.new_context(service_workers="block", viewport={"width": 390, "height": 844}); await c.add_init_script(ELEVE + "try{if(!localStorage.getItem('ct.v1'))localStorage.setItem('ct.v1'," + json.dumps(store) + ");}catch(e){}")
        p = await c.new_page(); p.on("pageerror", lambda x: "Wake Lock" in str(x) or errs.append("élève " + str(x)[:300])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(3500)
        await p.evaluate("(function(){S.classe='c1';SS.set('classe','c1');S.choixGroupe={mode:'solo',noms:['Lina MARTIN']};S.groupe=null;rendre();document.querySelector(\"[data-act='groupeOk']\").click()})()"); await p.wait_for_timeout(300)
        e = await p.evaluate("({o:S.onglet, tabs:[].map.call(document.querySelectorAll('#onglets button'),function(b){return b.dataset.onglet}), n:document.querySelectorAll('#vue .cp-temps').length, t:document.querySelector('#vue').innerText, d:" + DEB + "})")
        ok("élève : après le groupe, onglet « Leçon » avec les 5 temps, sans débordement sur téléphone", e["o"] == "plan" and e["tabs"][0] == "plan" and e["n"] == 5 and "Réveil articulaire" in e["t"] and "Burpee" in e["t"] and "Respiration lente" in e["t"] and e["d"] <= 1, {k: v for k, v in e.items() if k != "t"})
        if SHOTS: await p.screenshot(path=SHOTS + "/ct_eleve_lecon.png", full_page=True)
        await p.evaluate("document.querySelector(\"[data-cp='gc:ech:reveil']\").click()"); await p.wait_for_timeout(300)
        g = await p.evaluate("({gc:!!GC, n:GC&&GC.P.length, nom:GC&&GC.c.nom})"); await p.evaluate("clearInterval(GC.iv);GC=null;fermer()")
        ok("élève : l'échauffement guidé se lance au grand chrono", g["gc"] and g["n"] > 10 and g["nom"] == "Réveil articulaire", g)
        await p.evaluate("document.querySelector(\"[data-cp='outil:oie']\").click()"); await p.wait_for_timeout(200); await p.evaluate("document.querySelector(\"[data-cp='oie:lancer']\").click()"); await p.wait_for_timeout(200)
        o = await p.evaluate("({pos:S.cpOie.pos[0], de:S.cpOie.de, cases:document.querySelectorAll('.cp-oie div').length, d:" + DEB + "})")
        await p.evaluate("rendre()"); o["reste"] = await p.evaluate("!!document.querySelector('.cp-oie')")
        await p.evaluate("document.querySelector(\"[data-cp='retour']\").click()"); o["retour"] = await p.evaluate("S.onglet")
        ok("élève : jeu de l'oie (20 cases, dé, pion) ; il reste affiché quand la page se redessine ; ← Retour ramène à la leçon", o["cases"] == 20 and 1 <= o["de"] <= 6 and o["pos"] == o["de"] and o["d"] <= 1 and o["reste"] and o["retour"] == "plan", o)
        h = await p.evaluate("(function(){S.hub='echauf';S.cpOutil=null;aller('etir');var R={nav:[].map.call(document.querySelectorAll('.cp-nav button'),function(b){return b.textContent}),n:document.querySelectorAll('#vue section.bloc').length,t:document.querySelector('#vue').innerText};S.hub='savoir';rendre();R.s=document.querySelector('#vue').innerText;R.d=" + DEB + ";return R})()")
        ok("élève : formes guidées seulement (pas les jeux ni les défis), savoir sans les pages enseignant", h["nav"] == ["Échauffements", "Retour au calme", "Savoir"] and h["n"] == 5 and "Roxanne" not in h["t"] and "règles d'or" in h["s"] and "Idées reçues" not in h["s"] and h["d"] <= 1, {k: v for k, v in h.items() if k not in ("t", "s")})
        # WOD test : deux essais → progrès dans le carnet
        t = await p.evaluate("""(function(){function essai(sec){S.lecon=wodEnLecon(WODS.find(function(w){return w.id==='p1'}));lancerTimer();suivante();for(var k=0;k<3;k++){var n=TM.P[TM.i].it.length;for(var i=0;i<n;i++){var c=cible(exCourant());if(k===2&&i===n-1)TM.debut=Date.now()-sec*1000;for(var j=0;j<c;j++)compter('rep')}}
            var ph=document.querySelector('#calque').innerText;sauverResultat();return ph}
          var a=essai(300);var b=essai(240);aller('carnet');return {a:a.length>0, t:document.querySelector('#vue').innerText}})()""")
        ok("WOD test : deux essais, progrès affiché dans le carnet de l'élève", "Mon WOD test" in t["t"] and "progrès : − 1:00" in t["t"], t["t"][:260])
        # WOD adapté : Ines
        a = await p.evaluate("""(function(){S.groupe={mode:'solo',noms:["Ines O'BRIEN"]};SS.set('groupe',JSON.stringify(S.groupe));S.lecon=nouvelleLecon();aller('lecon');return {titre:S.lecon.titre, v:verrou().wod, f:S.lecon.format, n:S.lecon.items.length}})()""")
        ok("WOD adapté : l'élève concerné reçoit son WOD, verrouillé", a["titre"] == "Adapté · haut du corps seul" and a["v"] and a["f"] == "montante" and a["n"] == 3, a)
        await c.close()
        # ---------- 3 · élève sans classe : ressource ----------
        c = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768}); await c.add_init_script(ELEVE)
        p = await c.new_page(); p.on("pageerror", lambda x: errs.append("sans classe " + str(x)[:300]))
        await p.goto(B); await p.wait_for_timeout(3500)
        z = await p.evaluate("(function(){S.classe='-';S.hub='echauf';aller('etir');return {tabs:[].map.call(document.querySelectorAll('#onglets button'),function(b){return b.textContent.trim()}), n:document.querySelectorAll('#vue section.bloc').length, plan:CTP.aPlan()}})()")
        ok("sans classe : onglet « Avant · après » avec les formes guidées", any("Avant" in x for x in z["tabs"]) and z["n"] == 5 and not z["plan"], z)
        await c.close(); await b.close()
    ok("aucune erreur de page", not errs, errs)
    bad = 0
    for t, c2, d in out:
        print(("✓ " if c2 else "✗ ") + t + ("" if c2 else "\n     " + json.dumps(d, ensure_ascii=False)[:900])); bad += 0 if c2 else 1
    srv.terminate(); print("\n%d contrôles, %d échec(s)" % (len(out), bad)); sys.exit(1 if bad else 0)
asyncio.run(main())
