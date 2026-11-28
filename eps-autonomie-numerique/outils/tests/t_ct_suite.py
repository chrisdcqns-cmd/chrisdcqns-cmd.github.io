# Cross-training, suite du 28/11/2026 : contenus de l'enseignant (Réglages → Contenus : ajouter, modifier, supprimer),
# timer « à plusieurs » (un compte par partenaire, ↶ annuler le dernier appui), résultats des WOD dans l'évaluation
# (« 📊 Ses résultats » et proposition de positionnement).
# python3 t_ct_suite.py <racine du dépôt> [dossier des captures]
import asyncio, sys, subprocess, time, json
from playwright.async_api import async_playwright
ROOT = sys.argv[1]; SHOTS = sys.argv[2] if len(sys.argv) > 2 else ""
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8862", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8862/eps-autonomie-numerique/crosstraining/"; CL = "TGT TEST"
NOMS = ["Lina MARTIN", "Noah PETIT", "Emma DURAND", "Hugo LEROY", "Ines O'BRIEN"]
LISTE = "if(!localStorage.getItem('eps.lists.v1'))localStorage.setItem('eps.lists.v1',JSON.stringify({items:{c1:{id:'c1',nom:'" + CL + "',el:" + json.dumps(NOMS) + ",u:1}},pend:{},since:0}));"
PROF = "try{" + LISTE + "localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));}catch(e){}"
ELEVE = "try{" + LISTE + "}catch(e){}"
DEB = "(function(){var d=document.documentElement;return d.scrollWidth-d.clientWidth})()"
CLIC = lambda sel: "document.querySelector(\"" + sel + "\").click()"
async def main():
    out = []; errs = []
    def ok(t, c, d=""): out.append((t, bool(c), d))
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox"])
        # ---------- 1 · enseignant : ses contenus ----------
        c = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await c.add_init_script(PROF)
        p = await c.new_page(); p.on("pageerror", lambda x: "Wake Lock" in str(x) or errs.append("enseignant " + str(x)[:300])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(3500)
        await p.evaluate("aller('contenus')"); await p.wait_for_timeout(200)
        await p.evaluate(CLIC("[data-cp='xnew:ech']")); await p.wait_for_timeout(200)
        await p.fill("#cpfNom", "Béret d'échauffement"); await p.fill("#cpfDur", "6,5"); await p.fill("#cpfMat", "1 plot par équipe")
        await p.fill("#cpfTxt", "Deux équipes face à face : à l'appel de son numéro, on court chercher le plot.")
        await p.fill("#cpfReg", "Un numéro par élève\nLe perdant fait 5 squats")
        # la page redessinée (relevé du magasin) ne doit pas effacer la saisie en cours
        await p.evaluate("rendre()"); garde = await p.evaluate("document.querySelector('#cpfNom').value")
        await p.fill("#cpfEt", "Montées de genoux ; 20 ; 10\nPas chassés ; 20"); await p.fill("#cpfTours", "2"); await p.fill("#cpfRec", "15")
        if SHOTS: await p.screenshot(path=SHOTS + "/ct_contenu_formulaire.png", full_page=True)
        await p.evaluate(CLIC("[data-cp='xsave']")); await p.wait_for_timeout(250)
        n = await p.evaluate("""(function(){var o=CTP.ECHAUF.find(function(x){return x.nom==="Béret d'échauffement"})||{};S.hub='echauf';S.cpOutil=null;rendre();var t=document.querySelector('#vue').innerText;aller('contenus');
          return {n:CTP.ECHAUF.length, perso:o.perso, d:o.duree, type:o.type, reg:(o.regles||[]).length, et:o.chrono&&o.chrono.etapes.length, tours:o.chrono&&o.chrono.tours, t0:o.chrono&&o.chrono.etapes[1].travail+'|'+o.chrono.etapes[1].repos, hub:t.indexOf("Béret d'échauffement")>=0, id:o.id,
            ligne:!!document.querySelector("[data-cp='xed:ech:"+o.id+"']")&&!!document.querySelector("[data-cp='xdel:ech:"+o.id+"']"), deb:""" + DEB + """}})()""")
        ok("Contenus : un échauffement ajouté par le formulaire (durée à virgule, règles, chrono guidé) apparaît dans la base", garde == "Béret d'échauffement" and n["n"] == 13 and n["perso"] == 1 and n["d"] == 6.5 and n["type"] == "jeu" and n["reg"] == 2 and n["et"] == 2 and n["tours"] == 2 and n["t0"] == "20|0" and n["hub"] and n["ligne"] and n["deb"] <= 1, [garde, n])
        # champ invalide refusé
        await p.evaluate(CLIC("[data-cp='xnew:def']")); await p.wait_for_timeout(150); await p.fill("#cpfNom", "Essai"); await p.fill("#cpfDur", "abc"); await p.evaluate(CLIC("[data-cp='xsave']")); await p.wait_for_timeout(150)
        refus = await p.evaluate("({form:!!document.querySelector('#cpForm'), n:CTP.DEFIS.length})")
        await p.fill("#cpfDur", "10"); await p.fill("#cpfTxt", "Relais par équipes de 4."); await p.evaluate(CLIC("[data-cp='xsave']")); await p.wait_for_timeout(200)
        ok("Contenus : une durée qui n'est pas un nombre est refusée ; corrigée, le défi est ajouté", refus == {"form": True, "n": 7} and await p.evaluate("CTP.DEFIS.length") == 8, refus)
        # modifier un contenu d'origine, puis revenir à l'origine
        await p.evaluate(CLIC("[data-cp='xed:ech:reveil']")); await p.wait_for_timeout(150)
        avant = await p.evaluate("({nom:document.querySelector('#cpfNom').value, et:document.querySelector('#cpfEt').value.split('\\n').length})")
        await p.fill("#cpfNom", "Réveil articulaire long"); await p.evaluate(CLIC("[data-cp='xsave']")); await p.wait_for_timeout(200)
        m = await p.evaluate("(function(){var o=CTP.ECHAUF.find(function(x){return x.id==='reveil'});return {nom:o.nom, mod:o.mod, et:o.chrono.etapes.length, pos:CTP.ECHAUF.indexOf(o), raz:!!document.querySelector(\"[data-cp='xraz:ech:reveil']\")}})()")
        await p.evaluate(CLIC("[data-cp='xraz:ech:reveil']")); await p.wait_for_timeout(200)
        m["apres"] = await p.evaluate("(function(){var o=CTP.ECHAUF.find(function(x){return x.id==='reveil'});return o.nom+'|'+(o.mod||0)})()")
        ok("Contenus : un échauffement de l'appli se modifie (chrono gardé), puis « ↺ Version d'origine » le rétablit", avant["nom"] == "Réveil articulaire" and avant["et"] > 5 and m["nom"] == "Réveil articulaire long" and m["mod"] == 1 and m["et"] == avant["et"] and m["pos"] == 0 and m["raz"] and m["apres"] == "Réveil articulaire|0", [avant, m])
        # règle, mot, phrase, WOD
        await p.evaluate("S.cpOpen={reg:true,lex:true,phr:true,wod:true,ech:true};rendre()"); await p.wait_for_timeout(150)
        await p.fill("#cpx-reg", "Je range mon matériel avant de partir."); await p.evaluate(CLIC("[data-cp='xadd:reg']")); await p.wait_for_timeout(150)
        await p.fill("#cpx-lex", "Burpee"); await p.fill("#cpx-lex2", "Pompe puis saut"); await p.evaluate(CLIC("[data-cp='xadd:lex']")); await p.wait_for_timeout(150)
        await p.fill("#cpx-phr", "Bravo, c'est noté !"); await p.evaluate(CLIC("[data-cp='xadd:phr']")); await p.wait_for_timeout(150)
        await p.evaluate("(function(){S.lecon=wodEnLecon(WODS.find(function(w){return w.id==='p24'}));S.lecon.titre='Mon duo du mardi';aller('contenus')})()"); await p.wait_for_timeout(150)
        ttl = await p.evaluate("document.querySelector('#cpx-wod').value")
        await p.evaluate(CLIC("[data-cp='xadd:wod']")); await p.wait_for_timeout(200)
        t = await p.evaluate("""(function(){var w=WODS.find(function(x){return x.perso});S.hub='savoir';S.cpOutil=null;aller('etir');var s=document.querySelector('#vue').innerText;aller('wods');var lw=document.querySelector('#vue').innerText;
          var l=w?wodEnLecon(w):null;return {nw:WODS.length, w:w&&[w.nom,w.format,w.duo,w.items.length,w.mat.join('+')], rep:l&&l.rep, tete:l&&texteWod(l).tete, reg:s.indexOf('Je range mon matériel')>=0, lex:s.indexOf('Pompe puis saut')>=0, wods:lw.indexOf('Mon duo du mardi')>=0, phr:CTP.phrase.length===0}})()""")
        ok("Contenus : règle d'or, mot du lexique, phrase et WOD type ajoutés (le WOD garde sa répartition à 2)", t["nw"] == 44 and t["w"] == ["Mon duo du mardi", "fortime", "moitie", 5, "MB+BANC"] and t["rep"] == "moitie" and "moitié" in t["tete"] and t["reg"] and t["lex"] and t["wods"], t)
        # suppression : corbeille commune
        await p.evaluate("aller('contenus')"); await p.wait_for_timeout(150)
        await p.evaluate(CLIC("[data-cp='xdel:ech:" + n["id"] + "']")); await p.wait_for_timeout(600)
        s = await p.evaluate("""(function(){var T=JSON.parse(localStorage.getItem('eps.trash.v1')||'{"items":{}}').items, L=Object.keys(T).map(function(k){return T[k]}).filter(function(o){return o&&!o.del});
          return {n:CTP.ECHAUF.length, la:CTP.ECHAUF.some(function(x){return x.perso}), tr:L.length, lab:L.map(function(o){return o.label}), type:(L[0]||{}).type, deb:""" + DEB + """}})()""")
        ok("Contenus : supprimer un échauffement à soi le retire et en garde une copie dans la corbeille commune", s["n"] == 12 and not s["la"] and s["tr"] == 2 and "Béret d'échauffement" in s["lab"] and "Réveil articulaire long" in s["lab"] and s["deb"] <= 1, s)
        if SHOTS:
            await p.evaluate("aller('contenus');document.querySelector('details[data-cpdet=ech]').open=true;document.querySelector('details[data-cpdet=reg]').open=true"); await p.wait_for_timeout(300); await p.screenshot(path=SHOTS + "/ct_contenus_perso.png", full_page=True)
        store = await p.evaluate("localStorage.getItem('ct.v1')")
        await c.close()
        # ---------- 2 · élèves (téléphone) : WOD à plusieurs ----------
        c = await b.new_context(service_workers="block", viewport={"width": 390, "height": 844}); await c.add_init_script(ELEVE + "try{if(!localStorage.getItem('ct.v1'))localStorage.setItem('ct.v1'," + json.dumps(store) + ");}catch(e){}")
        p = await c.new_page(); p.on("pageerror", lambda x: "Wake Lock" in str(x) or errs.append("élève " + str(x)[:300])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(3500)
        await p.evaluate("(function(){S.classe='c1';SS.set('classe','c1');S.groupe={mode:'duo',noms:['Lina MARTIN','Noah PETIT']};SS.set('groupe',JSON.stringify(S.groupe));aller('wods')})()"); await p.wait_for_timeout(300)
        vis = await p.evaluate("({wod:document.querySelector('#vue').innerText.indexOf('Mon duo du mardi')>=0, savoir:(function(){S.hub='savoir';aller('etir');return document.querySelector('#vue').innerText.indexOf('Je range mon matériel')>=0})()})")
        ok("élèves : le WOD type et la règle ajoutés par l'enseignant arrivent sur leur téléphone", vis == {"wod": True, "savoir": True}, vis)
        # moitié-moitié : 40 wall balls = 20 chacun
        r = await p.evaluate("""(function(){var R={};S.lecon=wodEnLecon(WODS.find(function(w){return w.id==='p24'}));lancerTimer();suivante();
          var x=exCourant();R.eq=TM.eq&&TM.eq.length;R.mode=TM.eqm;R.tot=cibleTot(x);R.parts=[cibleDe(x,0),cibleDe(x,1)];R.lignes=document.querySelectorAll('#tmZone .tm-eqr').length;R.noms=[].map.call(document.querySelectorAll('#tmZone .tm-eqn'),function(e){return e.firstChild.textContent});
          R.solo=document.querySelectorAll('#tmZone .tm-btns').length;R.deb=""" + DEB + """;
          for(var i=0;i<20;i++)document.querySelector('#tmZone .tm-eqr:nth-child(1) .tm-rep').click();R.fini=document.querySelector('#tmZone .tm-eqr:nth-child(1)').classList.contains('fini');R.reste=document.querySelector('#tmZone .tm-reste').innerText;
          document.querySelector('#tmZone .tm-eqr:nth-child(1) .tm-rep').click();R.plafond=TM.pf[0]+'|'+TM.fait;
          document.querySelector('#tmZone .tm-eqr:nth-child(2) .tm-no').click();document.querySelector('#tmZone .tm-eqr:nth-child(2) .tm-rep').click();R.avant=TM.pf[1]+'|'+TM.par[1].rep+'|'+TM.par[1].no;
          R.und=!!document.querySelector("[data-act='tmUndo']");document.querySelector("[data-act='tmUndo']").click();R.apres=TM.pf[1]+'|'+TM.par[1].rep+'|'+TM.par[1].no+'|'+!!document.querySelector("[data-act='tmUndo']");
          TM.liveAt=0;livePub();var live=stLd().items[LIVE_K()]||{};R.pq=live.pq;R.cib=live.cib;
          for(var j=0;j<20;j++)compter('rep',1);R.suiv=exCourant().exId;R.raz=TM.pf.join('|')+'|'+TM.fait;return R})()""")
        ok("à 2, moitié-moitié : une ligne par partenaire, 20 chacun sur 40, la part faite bloque le bouton, l'exercice avance quand les deux ont fini", r["eq"] == 2 and r["mode"] == "moitie" and r["tot"] == 40 and r["parts"] == [20, 20] and r["lignes"] == 2 and r["noms"] == ["Lina", "Noah"] and r["solo"] == 0 and r["fini"] and "20" in r["reste"] and r["plafond"] == "20|20" and r["suiv"] == "pushpress" and r["raz"] == "0|0|0" and r["deb"] <= 1, r)
        ok("à 2 : « ↶ Annuler le dernier appui » retire la répétition comptée par erreur ; l'écran de l'enseignant reçoit le compte de chacun", r["avant"] == "1|1|1" and r["und"] and r["apres"] == "0|0|1|false" and r["pq"] and r["pq"][0][0] == "Lina" and r["pq"][0][1] == 20 and r["pq"][0][2] == 20 and r["cib"] == 40, r)
        if SHOTS: await p.screenshot(path=SHOTS + "/ct_timer_a_deux.png")
        # finir le WOD : Noah fait des No rep, résultat par partenaire
        f = await p.evaluate("""(function(){var g=0;while(TM&&!TM.res&&g++<2000){var x=exCourant();if(!x)break;for(var j=0;j<2;j++){if(TM.res)break;var n=cibleDe(x,j);if(j===1&&g<4){compter('no',1);compter('no',1);compter('no',1)}for(var i=0;i<n&&!TM.res;i++)compter(x.e.mesure==='temps'?'tenu':'rep',j)}}
          var R={par:TM.res&&TM.res.par, fin:document.querySelector('#calque').innerText};document.querySelector('#comm').value="Si mes bras lâchent, alors je passe au niveau 1.";document.querySelector('#fc').value='168';sauverResultat();
          aller('carnet');R.carnet=document.querySelector('#vue').innerText;return R})()""")
        pa = f["par"] or [{}, {}]
        ok("à 2 : le résultat garde les ✓ / ✗ de chaque partenaire (écran de fin, carnet)", len(pa) == 2 and pa[0]["nom"] == "Lina MARTIN" and pa[0]["no"] == 0 and pa[1]["no"] >= 7 and pa[0]["rep"] > 50 and "chaque partenaire" in f["fin"].lower() and "Chaque partenaire : Lina" in f["carnet"], [pa, f["carnet"][:200]])
        # en même temps (chacun fait tout), à tour de rôle (total partagé), seul (rien ne change)
        r2 = await p.evaluate("""(function(){var R={};function go(id,noms){S.groupe={mode:noms.length>1?'duo':'solo',noms:noms};S.lecon=wodEnLecon(WODS.find(function(w){return w.id===id}));lancerTimer();suivante()}
          function stop(){clearInterval(TM.iv);TM=null;fermer()}
          go('p20',['Lina MARTIN','Noah PETIT']);var x=exCourant();R.meme=[TM.eqm,cible(x),cibleTot(x),cibleDe(x,0)];for(var i=0;i<10;i++)compter('rep',0);R.memeReste=cibleTot(x)-TM.fait;stop();
          go('p22',['Lina MARTIN','Noah PETIT','Emma DURAND']);x=exCourant();R.tour=[TM.eqm,TM.eq.length,cibleTot(x)];for(i=0;i<45;i++)compter('rep',0);for(i=0;i<15;i++)compter('rep',2);R.tourSuiv=exCourant().exId;R.tourPar=TM.par.map(function(p){return p.rep});stop();
          go('p24',['Lina MARTIN']);R.solo=[!!TM.eq,document.querySelectorAll('#tmZone .tm-btns').length,document.querySelectorAll('#tmZone .tm-eqr').length];compter('rep');R.soloUnd=!!document.querySelector("[data-act='tmUndo']");document.querySelector("[data-act='tmUndo']").click();R.soloFait=TM.fait;stop();
          go('p1',['Lina MARTIN','Noah PETIT']);R.sansRep=!!TM.eq;stop();
          S.groupe={mode:'duo',noms:['Lina MARTIN','Noah PETIT']};S.lecon=wodEnLecon(WODS.find(function(w){return w.id==='p24'}));S.duoNext=true;lancerTimer();S.duoNext=false;R.coach=[TM.duo,!!TM.eq];stop();return R})()""")
        ok("en même temps : chacun fait toute la quantité ; à tour de rôle : un total à se répartir, à 3 aussi", r2["meme"] == ["meme", 10, 20, 10] and r2["memeReste"] == 10 and r2["tour"] == ["tour", 3, 60] and r2["tourSuiv"] == "boxjump" and r2["tourPar"] == [45, 0, 15], r2)
        ok("seul, WOD sans répartition, mode athlète / coach : le timer habituel (un seul compte), avec « ↶ Annuler »", r2["solo"] == [False, 1, 0] and r2["soloUnd"] and r2["soloFait"] == 0 and r2["sansRep"] is False and r2["coach"] == [True, False], r2)
        # ---------- 3 · évaluation : résultats des WOD ----------
        ev = await p.evaluate("""(function(){var R={};function essai(sec){S.groupe={mode:'solo',noms:['Lina MARTIN']};S.lecon=wodEnLecon(WODS.find(function(w){return w.id==='p1'}));lancerTimer();suivante();for(var k=0;k<3;k++){var n=TM.P[TM.i].it.length;for(var i=0;i<n;i++){var c=cible(exCourant());if(k===2&&i===n-1)TM.debut=Date.now()-sec*1000;for(var j=0;j<c;j++)compter('rep')}}sauverResultat()}
          essai(300);essai(240);
          /* Noah coach de Lina */
          S.groupe={mode:'duo',noms:['Lina MARTIN','Noah PETIT']};S.lecon=wodEnLecon(WODS.find(function(w){return w.id==='w5'}));S.duoNext=true;lancerTimer();S.duoNext=false;suivante();compter('rep');compter('rep');TM.paser={'squat|2':{A:2}};finTimer();document.querySelector('#rpeC').value='6';sauverResultat();
          var L={prenom:'Lina',nom:'MARTIN'}, N={prenom:'Noah',nom:'PETIT'}, E={prenom:'Emma',nom:'DURAND'}, cl='""" + CL + """', f=function(id,e){return CTP.evResultat({id:id},e,cl)};
          R.L={eng:f('eng',L),ent:f('ent',L),coo:f('coo',L),pro:f('pro',L),p1:f('pro-p1',L)};R.N={eng:f('eng',N),ent:f('ent',N),coo:f('coo',N)};R.E={eng:f('eng',E),ent:f('ent',E)};
          R.afl=[CTP.evResultat({id:'z',afl:'AFL 2',nom:'Mon carnet'},L,cl)===R.L.ent, CTP.evResultat({id:'z',afl:'AFL3',nom:'Coacher'},N,cl)===R.N.coo, CTP.evResultat({id:'z',afl:'AFL1',nom:'Répétitions valides'},N,cl)===R.N.eng, CTP.evResultat({id:'z',afl:'AFL1',nom:'Choix du thème'},L,cl)];
          var rl=CTP.evResultats(L,cl), rn=CTP.evResultats(N,cl);R.rl={n:rl.items.length, noms:rl.noms, chips:rl.chips.map(function(c){return c.join(' ')}), jour:rl.items[0].day, t:rl.items[0].txt};R.rn={n:rn.items.length, coach:rn.items.filter(function(i){return i.ok==null}).length, chips:rn.chips.map(function(c){return c.join(' ')})};
          R.vide=CTP.evResultats(E,cl).items.length;return R})()""")
        L, N = ev["L"], ev["N"]
        ok("évaluation : part de ✓ REP → critères « engagement » et AFLP1 (Lina 100 %, Noah pénalisé par ses No rep) ; rien pour un élève sans WOD", L["eng"] == 1 and L["p1"] == 1 and N["eng"] is not None and 0 < N["eng"] < 0.95 and ev["E"] == {"eng": None, "ent": None} and ev["vide"] == 0, ev)
        ok("évaluation : carnet (FC, analyse) et progrès au WOD test → AFL2 ; rôle de coach (PASER, ressenti estimé) → AFL3 ; choix des paramètres laissé à l'enseignant", L["ent"] is not None and 0.5 < L["ent"] <= 1 and L["coo"] is None and N["coo"] is not None and N["coo"] >= 0.9 and L["pro"] is None and ev["afl"] == [True, True, True, None], ev)
        ok("évaluation : « Ses résultats » liste les WOD par leçon, avec le progrès au WOD test et le rôle de coach", ev["rl"]["n"] == 4 and ev["rl"]["noms"] == "réalisations" and any("WOD dans son carnet" in x for x in ev["rl"]["chips"]) and any("au WOD test" in x and "− 1:00" in x for x in ev["rl"]["chips"]) and len(ev["rl"]["jour"]) == 10 and "répétitions valables" in ev["rl"]["t"] and ev["rn"]["n"] == 2 and ev["rn"]["coach"] == 1 and any("fois coach" in x for x in ev["rn"]["chips"]), ev)
        store = await p.evaluate("localStorage.getItem('ct.v1')")
        await c.close()
        # ---------- 4 · enseignant : la fiche d'évaluation montre les résultats et la proposition ----------
        c = await b.new_context(service_workers="block", viewport={"width": 1180, "height": 820}); await c.add_init_script(PROF + "try{if(!localStorage.getItem('ct.v1'))localStorage.setItem('ct.v1'," + json.dumps(store) + ");}catch(e){}")
        p = await c.new_page(); p.on("pageerror", lambda x: "Wake Lock" in str(x) or errs.append("évaluation " + str(x)[:300])); p.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await p.goto(B); await p.wait_for_timeout(3500)
        fi = await p.evaluate("""(function(){var cl='""" + CL + """', E=EVCT.classes?null:null, R={};
          try{var d=document.createElement('div');d.id='t-ev';document.body.appendChild(d);EVCT.mount(d,['eval'],cl)}catch(e){R.err=String(e)}return R})()""")
        await p.wait_for_timeout(600)
        await p.evaluate("(function(){var b=[].find.call(document.querySelectorAll('#t-ev button, #t-ev [data-e], #t-ev .epse-col *'),function(x){return /Lina/.test(x.textContent)&&x.children.length<4});if(b)b.click()})()"); await p.wait_for_timeout(700)
        await p.evaluate("[].forEach.call(document.querySelectorAll('#t-ev details, #t-ev [data-pli]'),function(d){if(d.tagName==='DETAILS')d.open=true;else if(d.click&&!/ouvert|open/.test(d.className))try{d.click()}catch(e){}})"); await p.wait_for_timeout(500)
        tx = await p.evaluate("document.querySelector('#t-ev').innerText")
        ok("fiche d'évaluation de l'enseignant : bloc « Ses résultats » avec les WOD de l'élève", "Ses résultats" in tx and "WOD dans son carnet" in tx and "réalisations" in tx, [fi, tx[:700]])
        if SHOTS: await p.screenshot(path=SHOTS + "/ct_evaluation.png", full_page=True)
        await c.close(); await b.close()
    ok("aucune erreur de page", not errs, errs)
    bad = 0
    for t, c2, d in out:
        print(("✓ " if c2 else "✗ ") + t + ("" if c2 else "\n     " + json.dumps(d, ensure_ascii=False)[:1400])); bad += 0 if c2 else 1
    srv.terminate(); print("\n%d contrôles, %d échec(s)" % (len(out), bad)); sys.exit(1 if bad else 0)
asyncio.run(main())
