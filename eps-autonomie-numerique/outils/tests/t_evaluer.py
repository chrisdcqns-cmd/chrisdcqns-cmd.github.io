# 📋 Onglet commun « Évaluer » (eps-shell.js, eps-lecons.js, eps-eval.js), demande du 27/11/2026 :
#   trois entrées dans toutes les applis d'activité : 📅 Leçons du jour · 🏁 Évaluation finale · 📤 Bilan et export ;
#   leçons du jour en consultation, double appui sur la date pour modifier ; évaluation finale avec la colonne d'élèves et les 3 modes ;
#   proposition de degré d'après les sources cochées, poids des dernières leçons ; bilan et export dans l'ordre de Volley, tableur.
# python3 t_evaluer.py <racine du dépôt> [dossier des captures]      (classe fictive uniquement, rien n'est envoyé en ligne)
import asyncio, sys, subprocess, time, json, os
from playwright.async_api import async_playwright
ROOT = sys.argv[1]; SHOTS = sys.argv[2] if len(sys.argv) > 2 else ""
srv = subprocess.Popen([sys.executable, "-I", "-m", "http.server", "8853", "--bind", "127.0.0.1", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.2)
B = "http://localhost:8853/eps-autonomie-numerique/"
TEACH = "try{localStorage.setItem('eps.teach.until',String(Date.now()+12*3600e3));localStorage.setItem('eps.console.trust','1');}catch(e){}"
APPS = ["escalade", "acrosport", "orientation", "crosstraining", "basket", "step", "danse", "volley", "badminton", "relais"]
INST = {"relais": "EPSTR", "acrosport": "EPSTA", "danse": "EPSTD", "basket": "EPSTBK", "volley": "EPSTV", "step": "EPSTST", "orientation": "EPSTORI", "crosstraining": "EPSTCT", "escalade": "EPSTESC", "badminton": "EPSTB"}
TB = "[].map.call(document.querySelectorAll('.epst-tb button'),function(b){return (b.classList.contains('on')?'*':'')+b.title})"
ON = "(function(){var b=document.querySelector('.epst-nav button.on');return b?b.dataset.t+':'+b.innerText.replace(/[^A-Za-zÀ-ÿ ]/g,'').trim():''})()"
M = "(window.EPSE_INST||[]).filter(function(x){return x.A.app==='esc'})[0].M"
async def main():
    out = []; errs = []
    def ok(t, c, d=""): out.append((t, bool(c), d)); print(("✅ " if c else "❌ ") + t + ("" if c else "  → " + str(d)[:500]), flush=True)
    async with async_playwright() as pw:
        b = await pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
        c = await b.new_context(service_workers="block", viewport={"width": 1024, "height": 768}, accept_downloads=True); await c.add_init_script(TEACH)
        p = await c.new_page(); p.on("dialog", lambda d: asyncio.ensure_future(d.accept())); p.on("pageerror", lambda x: errs.append(str(x)[:240])); p.set_default_timeout(9000)
        await p.goto(B); await p.wait_for_timeout(2500); await p.evaluate("(async()=>{var x=EPSD.demo.create();if(x&&x.then)await x})()"); await p.wait_for_timeout(1800)
        # ---------- 1. les trois entrées, dans toutes les applis
        for app in APPS:
            await p.goto(B + app + "/"); await p.wait_for_timeout(4200)
            if app == "orientation": await p.evaluate("(function(){try{sessionStorage.setItem('tpw','eps');openProf()}catch(e){}})()")   # espace enseignant d'OrienRun, sans le pavé du mot de passe du script; await p.wait_for_timeout(1500)
            if app == "relais": await p.evaluate(INST[app] + ".evGo('fin')")   # sans classe ni leçon du jour, Relais renvoie à ses classes : on teste les entrées communes
            else: await p.evaluate(INST[app] + ".go('eval')")
            await p.wait_for_timeout(1500); tb = await p.evaluate(TB); on = await p.evaluate(ON)
            if app != "relais": ok(app + " : onglet « Évaluer », 3 entrées dans l'ordre, « Évaluation finale » ouverte", on == "eval:Évaluer" and tb[:3] == ["Leçons du jour", "*Évaluation finale", "Bilan et export"] and "Évaluer" not in tb and "Bilan & export" not in tb, (on, tb))
            await p.evaluate(INST[app] + ".evGo('jour')"); await p.wait_for_timeout(1300)
            # l'appli peut être sur une autre classe que la classe fictive (Badminton : « Ma classe ») : on la choisit dans la liste de l'écran
            await p.evaluate("(function(){var s=document.querySelector('.epst-panel [data-ejc]');if(!s)return;var o=[].filter.call(s.options,function(x){return /D.MO/.test(x.value)})[0];if(o&&s.value!==o.value){s.value=o.value;s.onchange()}})()"); await p.wait_for_timeout(500)
            j = await p.evaluate("(function(){var e=document.querySelector('.epst-panel');return {h:(e.querySelector('h2')||{}).innerText||'',d:e.querySelectorAll('[data-ejd]').length,b:e.querySelectorAll('.lc-tab button,.lc-tab input,.lc-tab select').length,r:e.querySelectorAll('.lc-tab tr').length}})()")
            ok(app + " : 📅 Leçons du jour en consultation (une date, un tableau, rien à modifier d'un appui)", "Leçons du jour" in j["h"] and j["d"] >= 1 and j["b"] == 0 and j["r"] >= 5 and (await p.evaluate(TB))[0] == "*Leçons du jour", j)
            if app == "danse":   # Danse demande d'abord la classe (« Quelle classe ? »)
                await p.evaluate(INST[app] + ".evGo('fin')"); await p.wait_for_timeout(700); await p.evaluate("(function(){var x=[].filter.call(document.querySelectorAll('*'),function(e){return e.children.length===0&&/D.MO \\(fictive\\)/.test(e.textContent)&&e.offsetParent})[0];if(x)x.click()})()"); await p.wait_for_timeout(900)
            await p.evaluate(INST[app] + ".evGo('bil')"); await p.wait_for_timeout(2600); tb = await p.evaluate(TB); on = await p.evaluate(ON)
            if app != "relais": ok(app + " : 📤 Bilan et export reste dans l'onglet Évaluer, avec « Bilan et appréciation » à côté", on.startswith("eval") and tb[2] == "*Bilan et export" and "Bilan et appréciation" in tb and "Export" in await p.evaluate("document.body.innerText"), (on, tb, (await p.evaluate("document.body.innerText"))[-300:]))
            if SHOTS and app in ("escalade", "danse", "volley"): await p.screenshot(path=os.path.join(SHOTS, "evaluer-bilan-" + app + ".png"))
        # ---------- 2. Escalade : leçons du jour (appui simple, double appui)
        await p.goto(B + "escalade/"); await p.wait_for_timeout(4200); await p.evaluate("EPSTESC.evGo('jour')"); await p.wait_for_timeout(1200)
        if SHOTS: await p.screenshot(path=os.path.join(SHOTS, "evaluer-jour.png"))
        day = await p.evaluate("document.querySelector('[data-ejd]').dataset.ejd")
        await p.click("[data-ejd]"); await p.wait_for_timeout(900)
        ok("un appui sur la date : rappel « Double appui pour modifier », la leçon ne s'ouvre pas", await p.evaluate("!!document.getElementById('lc-ejh')&&!(document.querySelector('.lc-ov')&&document.querySelector('.lc-ov').style.display!=='none')"))
        await p.wait_for_timeout(1300); await p.dblclick("[data-ejd]"); await p.wait_for_timeout(1200)
        e = await p.evaluate("(function(){var o=document.querySelector('.lc-ov'),s=o&&o.querySelector('[data-day]');return {v:!!o&&o.style.display!=='none',t:o?o.innerText.slice(0,400):'',d:s?s.value:''}})()")
        ok("double appui sur la date : « Évaluer la leçon » s'ouvre sur ce jour, pour toute la leçon", e["v"] and "Tous au degré 3" in e["t"] and e["d"] == day, e)
        if SHOTS: await p.screenshot(path=os.path.join(SHOTS, "evaluer-jour-modifier.png"))
        AV = "(function(){var r=document.querySelector('.lc-ov [data-moy]');return r?r.textContent:''})()"; av = await p.evaluate(AV)
        await p.evaluate("(function(){var b=document.querySelector('.lc-ov [data-k][data-q=p][data-d]:not([aria-pressed=true])');b.click()})()"); await p.wait_for_timeout(500); ap = await p.evaluate(AV)
        # l'écran de saisie est rangé sous le bandeau (pas de « ✕ Fermer ») : on revient en touchant « Leçons du jour »
        await p.click(".epst-tb button.seg[title='Leçons du jour']"); await p.wait_for_timeout(1100)
        ok("après la modification, la consultation est à jour (" + av + " → " + ap + ")", av != ap and await p.evaluate("!!document.querySelector('.epst-panel [data-ejd]')&&document.querySelector('.lc-ov').style.display==='none'"))
        # ---------- 3. Escalade : évaluation finale (colonne, modes, proposition)
        await p.evaluate("EPSTESC.evGo('fin')"); await p.wait_for_timeout(1300)
        f = await p.evaluate("(function(){var R=document.querySelector('.epst-panel');return {col:R.querySelectorAll('.epse-col .epse-li').length,modes:[].map.call(R.querySelectorAll('[data-mode]'),function(b){return b.innerText.replace(/[^A-Za-zÀ-ÿ ]/g,'').trim()}),fiche:(R.querySelector('.epse-fiche b')||{}).innerText||'',un:(R.querySelector('.epse-li.on span')||{}).innerText||''}})()")
        ok("évaluation finale : colonne des 8 élèves à gauche, fiche du premier à droite, 3 modes", f["col"] == 8 and f["modes"] == ["Élève par élève", "Par critère", "Par groupe"] and f["fiche"] and f["fiche"] in f["un"].replace("\n", " "), f)
        await p.click(".epse-col .epse-li:nth-child(3)"); await p.wait_for_timeout(500)
        ok("toucher un élève de la colonne ouvre sa fiche", await p.evaluate("(function(){var a=document.querySelector('.epse-li.on span').innerText.split('\\n')[0].trim();return a===document.querySelector('.epse-fiche b').innerText.trim()&&document.querySelectorAll('.epse-li.on').length===1})()"))
        if SHOTS: await p.screenshot(path=os.path.join(SHOTS, "evaluer-finale.png"))
        # proposition : sources et poids des dernières leçons (une leçon ancienne faible, la leçon du jour forte)
        await p.evaluate("(function(){var V=JSON.parse(localStorage.getItem('eps.leceval.escalade.v1')),I=V.items,k=Object.keys(I)[0],o=I[k],el={};Object.keys(o.el).forEach(function(e){el[e]={p:0,s:0,t:0}});Object.keys(o.el).forEach(function(e){o.el[e]={p:3,s:3,t:3}});var id=k.replace(/\\d{4}-\\d{2}-\\d{2}$/,'2026-09-10');I[id]={id:id,cls:o.cls,day:'2026-09-10',el:el,u:1};localStorage.setItem('eps.leceval.escalade.v1',JSON.stringify(V))})()")
        P = "(function(){var m=" + M + ",c=m.classes()[0],E=c.eleves.filter(function(e){return !m.adapter.prof(m.adapter.grid().criteres[0],e)})[1],p=m.prop(E,c.nom);return {on:p.cfg.on,rec:p.cfg.rec,used:p.used,m:p.afl[0].m,deg:p.afl[0].deg,est:Object.keys(p.est).length,src:p.src}})()"
        await p.evaluate("EPSP.set('prop_sources',[]);EPSP.set('prop_recent',null)"); r0 = await p.evaluate(P)
        ok("aucune source cochée : rien n'est proposé", r0["on"] == [] and r0["src"] == "none" and r0["deg"] is None, r0)
        await p.evaluate("EPSP.set('prop_sources',['lecons'])"); r1 = await p.evaluate(P)
        ok("« Évaluations du jour » cochée : degré proposé d'après les leçons (moyenne simple de 0 et 1 → milieu)", r1["used"] == ["lecons"] and r1["src"] == "auto" and abs(r1["m"] - 2.0) < 0.01 and r1["est"] >= 1, r1)
        await p.evaluate("EPSP.set('prop_recent',100)"); r2 = await p.evaluate(P)
        ok("poids des dernières leçons à 100 : la dernière compte 5 fois plus (5/6 des 4 degrés)", abs(r2["m"] - 4 * 5 / 6) < 0.01 and r2["deg"] == 3 and abs(await p.evaluate(M + "._moyPond([{v:0},{v:1}],100)") - 5 / 6) < 1e-9, r2)
        await p.evaluate("EPSP.set('prop_recent',null);EPSP.set('prop_sources',null)"); await p.evaluate("EPSTESC.evGo('fin')"); await p.wait_for_timeout(900)
        await p.evaluate("document.querySelector('.epse-src summary').click()"); await p.wait_for_timeout(200); await p.click("[data-ps=lecons]"); await p.wait_for_timeout(700)
        ok("les cases de la fiche règlent le paramètre de l'activité", await p.evaluate("JSON.stringify(EPSP.get('prop_sources',['auto']))") in ('["auto","lecons","situations"]', '["auto","situations","lecons"]') and await p.evaluate("document.querySelector('[data-ps=lecons]').checked&&document.querySelector('.epse-src').open"))
        n0 = await p.evaluate("(function(){var m=" + M + ",c=m.classes()[0];return c.eleves.filter(function(e){return m.adapter.note(e)!=null}).length})()")
        ok("la proposition n'enregistre rien toute seule", n0 == 0, n0)
        await p.click("[data-take]"); await p.wait_for_timeout(900)
        ok("« ✓ Reprendre ces degrés » (après confirmation) écrit l'évaluation de l'élève affiché, lui seul", await p.evaluate("(function(){var m=" + M + ",c=m.classes()[0];return c.eleves.filter(function(e){return m.adapter.note(e)!=null}).length})()") == 1)
        # par critère
        await p.click("[data-mode=crit]"); await p.wait_for_timeout(600)
        Q = "(function(){var m=" + M + ",c=m.classes()[0],G=m.adapter.grid(),v=m.adapter.prof(G.criteres[0],c.eleves[4]);return v?v.d:null})()"
        await p.evaluate("document.querySelectorAll('[data-qe=\"4\"]')[1].click()"); await p.wait_for_timeout(500); q1 = await p.evaluate(Q)
        await p.evaluate("document.querySelectorAll('[data-qe=\"4\"]')[1].click()"); await p.wait_for_timeout(500); q2 = await p.evaluate(Q)
        ok("par critère : un appui pose le degré, un second l'enlève", q1 == 1 and q2 is None, (q1, q2))
        if SHOTS: await p.screenshot(path=os.path.join(SHOTS, "evaluer-critere.png"))
        # par groupe : groupes du jour de 📡 Leçon en cours
        await p.click("[data-mode=groupe]"); await p.wait_for_timeout(500)
        ok("par groupe, sans groupes : message clair", "Pas encore de groupes" in await p.evaluate("document.querySelector('.epst-panel').innerText"))
        await p.evaluate("(function(){var m=" + M + ",c=m.classes()[0],N=c.eleves.map(function(e){return e.prenom+' '+e.nom});localStorage.setItem('eps.live.escalade.v1',JSON.stringify({items:{x1:{id:'x1',cls:c.nom,st:Date.now(),grp:{g:[N.slice(0,4),N.slice(4)],at:Date.now()}}},pend:{},since:0}))})()")
        await p.click("[data-mode=groupe]"); await p.wait_for_timeout(600)
        g = await p.evaluate("(function(){var R=document.querySelector('.epst-panel');return {g:R.querySelectorAll('[data-gr]').length,r:R.querySelectorAll('.epse-ql [data-qe]').length/4,abs:(R.innerText.match(/absent aujourd/g)||[]).length}})()")
        await p.evaluate("document.querySelectorAll('[data-gall]')[3].click()"); await p.wait_for_timeout(700)
        g2 = await p.evaluate("(function(){var m=" + M + ",c=m.classes()[0],cr=m.adapter.grid().criteres[0],R=document.querySelector('.epst-panel');var ids=[].map.call(R.querySelectorAll('.epse-ql [data-qe][data-qd=\"3\"]'),function(b){return +b.dataset.qe});return ids.map(function(i){var e=c.eleves[i],v=m.adapter.prof(cr,e),ab=!!window.epsAbsJour(e.prenom+' '+e.nom,c.nom);return (ab?'A':'P')+(v?v.d:'-')})})()")
        ok("par groupe : 2 groupes du jour, 4 élèves affichés ; « même degré pour tout le groupe » sans toucher l'absent", g["g"] == 2 and g["r"] == 4 and all(x == "P3" or x[0] == "A" and x != "A3" for x in g2) and "P3" in g2, (g, g2))
        if SHOTS: await p.screenshot(path=os.path.join(SHOTS, "evaluer-groupe.png"))
        # grille : bouton à droite, retour
        await p.click("[data-mode=eleve]"); await p.wait_for_timeout(400); await p.click(".epse-sub [data-tab=grille]"); await p.wait_for_timeout(600)
        gr = await p.evaluate("!!document.querySelector('.epse-ged')"); await p.click(".epse-sub [data-tab=eval]"); await p.wait_for_timeout(500)
        ok("🧩 Grille s'ouvre depuis l'évaluation finale et « ← Retour » y ramène", gr and await p.evaluate("!!document.querySelector('.epse-col')"))
        # bilan et export : ordre de Volley, tableur
        await p.evaluate("EPSTESC.evGo('bil')"); await p.wait_for_timeout(1300)
        h2 = await p.evaluate("[].map.call(document.querySelectorAll('.epst-panel .epse-card>h2'),function(h){return h.innerText})")
        ok("bilan et export : Export en tête, puis auto-positionnement, puis le tableau", len(h2) >= 3 and h2[0].startswith("📤 Export") and "Auto-positionnement" in h2[1], h2)
        r = await p.evaluate("(function(){var P=document.querySelector('.epst-panel'),h=P.querySelector('[data-epst-res]');return {bil:!!document.querySelector('.epst-nav [data-t=bil]'),res:!!h,first:P.firstElementChild.classList.contains('epse-host'),grimpes:/Résultats des grimpes/.test(P.innerText)}})()")
        ok("plus d'onglet « Bilans » : ce qui lui était propre (résultats des grimpes) est sous « 🏅 Résultats de l'activité », après l'export", not r["bil"] and r["res"] and r["first"] and r["grimpes"], r)
        await p.evaluate("EPSTESC.go('bil')"); await p.wait_for_timeout(900)
        ok("un ancien lien vers l'onglet Bilans arrive dans Évaluer → Bilan et export", await p.evaluate(ON) == "eval:Évaluer" and (await p.evaluate(TB))[2] == "*Bilan et export")
        async with p.expect_download() as di: await p.click("[data-x-csv]")
        d = await di.value; path = await d.path(); txt = open(path, encoding="utf-8-sig", newline="").read().split("\r\n")
        ok("⬇ Tableur (.csv) : une ligne par élève, en-têtes, point-virgule", d.suggested_filename.endswith(".csv") and len(txt) == 9 and txt[0].startswith("NOM;Prénom;Statut;") and "Note /20" in txt[0], (d.suggested_filename, txt[:2]))
        ok("pas de débordement horizontal (1024 px)", not await p.evaluate("document.documentElement.scrollWidth>innerWidth+1"))
        await p.set_viewport_size({"width": 390, "height": 844}); await p.evaluate("EPSTESC.evGo('fin')"); await p.wait_for_timeout(900)
        ok("téléphone (390 px) : l'écran d'évaluation tient dans la largeur, les 3 entrées restent accessibles", await p.evaluate("(function(){var P=document.querySelector('.epst-panel'),W=innerWidth;return [].every.call(P.querySelectorAll('.epse-two,.epse-col,.epse-fiche,.epse-card,.epse-sub'),function(e){var r=e.getBoundingClientRect();return r.right<=W+1&&r.left>=-1})})()") and await p.evaluate("document.querySelectorAll('.epst-tb button.seg').length") == 3)
        await p.set_viewport_size({"width": 1024, "height": 768})
        # ---------- 4. Danse et Volley : « ✓ Reprendre ces degrés » écrit dans l'évaluation de l'appli, sans écraser
        # ---------- 4 bis. Volley, Badminton, Relais : colonne des élèves et trois modes (saisie rapide commune)
        for app, I, code in (("volley", "EPSTV", "vol"), ("badminton", "EPSTB", "bad"), ("relais", "EPSTR", "rel")):
            await p.goto(B + app + "/"); await p.wait_for_timeout(4200)
            if app == "badminton": await p.evaluate("setVoie('pro')"); await p.wait_for_timeout(800)
            if app == "relais": await p.evaluate("(()=>{const c=DATA.classes.find(c=>/D.MO/.test(c.name))||DATA.classes[0];DATA.cur=c.id;persist()})()")
            await p.evaluate(I + ".evGo('fin')"); await p.wait_for_timeout(1500)   # .go('eval') rouvre la dernière entrée de la session
            f = await p.evaluate("(function(){var on=document.querySelector('.epse-li.on'),f=document.querySelector('.epse-fiche');return {col:document.querySelectorAll('.epse-col .epse-li').length,modes:document.querySelectorAll('[data-mode]').length,on:on?on.innerText.split('\\n')[0]:'',fiche:!!f&&f.innerText.length>50,cl:(window.C&&C().nom)||(window.CL&&CL()&&CL().name)||'',vue:(document.querySelector('#evPanel')||{style:{}}).style.display,txt:document.body.innerText.slice(0,300)}})()")
            ok(app + " : évaluation finale, colonne des 8 élèves et 3 modes, la fiche à droite", f["col"] == 8 and f["modes"] == 3 and f["fiche"], f)
            await p.evaluate("document.querySelectorAll('.epse-col .epse-li')[3].click()"); await p.wait_for_timeout(800)
            ok(app + " : toucher un élève de la colonne ouvre sa fiche", await p.evaluate("document.querySelectorAll('.epse-li.on').length===1&&document.querySelectorAll('.epse-col .epse-li')[3].classList.contains('on')"))
            await p.evaluate("document.querySelector('[data-mode=crit]').click()"); await p.wait_for_timeout(900)
            n0 = await p.evaluate("document.querySelectorAll('.epse-ql').length")
            await p.evaluate("document.querySelectorAll('.epse-ql')[0].querySelectorAll('[data-qe]')[2].click()"); await p.wait_for_timeout(700)
            on1 = await p.evaluate("!!document.querySelectorAll('.epse-ql')[0].querySelector('[data-qd=\"2\"].on')")
            await p.evaluate("document.querySelectorAll('.epse-ql')[0].querySelectorAll('[data-qe]')[2].click()"); await p.wait_for_timeout(700)
            on2 = await p.evaluate("!!document.querySelectorAll('.epse-ql')[0].querySelector('[data-qe].on')")
            ok(app + " : par critère, 8 élèves ; un appui pose le degré dans l'évaluation de l'appli, un second l'enlève", n0 == 8 and on1 and not on2, (n0, on1, on2))
            await p.evaluate("document.querySelector('[data-mode=groupe]').click()"); await p.wait_for_timeout(800)
            ok(app + " : par groupe : les groupes de l'appli, ou un message clair s'il n'y en a pas", await p.evaluate("!!document.querySelector('[data-gr]')&&document.querySelectorAll('.epse-ql').length>1||/Pas encore de groupes/.test(document.body.innerText)"), await p.evaluate("document.querySelector('.epse-host')?document.querySelector('.epse-host').innerText.slice(0,300):document.body.innerText.slice(-300)"))
            await p.evaluate("document.querySelector('[data-mode=eleve]').click()"); await p.wait_for_timeout(900)
            ok(app + " : retour à « élève par élève » sur le même élève", await p.evaluate("document.querySelectorAll('.epse-col .epse-li')[3].classList.contains('on')"))
        # ---------- 4 ter. 📝 Appréciations de bulletin et 📋 Export Pronote : à droite des trois modes, dans les 10 applis, plus dans la fiche de l'élève
        CHK = "(function(){var all=[].filter.call(document.querySelectorAll('button'),function(b){return b.offsetParent&&/Appréciations de bulletin|Export Pronote|Pronote : toutes/.test(b.innerText)});var seg=document.querySelector('[data-mode=groupe],[data-m=groupe]');var bar=all.filter(function(b){return b.closest('.epse-sub,.ev-bar')});return {n:all.length,bar:bar.length,droite:!!seg&&bar.every(function(b){var r=b.getBoundingClientRect(),q=seg.getBoundingClientRect();return r.left>q.right&&Math.abs(r.top-q.top)<40}),tb:[].some.call(document.querySelectorAll('.epst-tb button'),function(b){return b.title==='Pronote'})}})()"
        for app in APPS:
            await p.goto(B + app + "/"); await p.wait_for_timeout(4000)
            if app == "orientation": await p.evaluate("(function(){try{sessionStorage.setItem('tpw','eps');openProf()}catch(e){}})()"); await p.wait_for_timeout(1200)
            if app == "badminton": await p.evaluate("setVoie('pro')"); await p.wait_for_timeout(800)
            if app == "relais": await p.evaluate("(()=>{const c=DATA.classes.find(c=>/D.MO/.test(c.name))||DATA.classes[0];DATA.cur=c.id;persist()})()")
            await p.evaluate(INST[app] + ".go('eval')"); await p.wait_for_timeout(500); await p.evaluate(INST[app] + ".evGo('fin')"); await p.wait_for_timeout(1500)
            if app == "danse": await p.evaluate("(function(){var x=[].filter.call(document.querySelectorAll('*'),function(e){return e.children.length===0&&/D.MO \\(fictive\\)/.test(e.textContent)&&e.offsetParent})[0];if(x)x.click()})()"); await p.wait_for_timeout(1200)
            await p.evaluate("var b=document.querySelector('[data-mode=eleve],[data-m=eleve]');b&&b.click()"); await p.wait_for_timeout(900)
            r1 = await p.evaluate(CHK)
            await p.evaluate("var b=document.querySelector('[data-mode=crit],[data-m=crit]');b&&b.click()"); await p.wait_for_timeout(900)
            r2 = await p.evaluate(CHK)
            await p.evaluate("var b=document.querySelector('[data-mode=eleve],[data-m=eleve]');b&&b.click()"); await p.wait_for_timeout(700)
            ok(app + " : « Appréciations de bulletin » et « Export Pronote » à droite des trois modes (fiche et par critère), une seule fois, pas dans la fiche", r1 == r2 == {"n": 2, "bar": 2, "droite": True, "tb": False} or (r1["n"] == 2 and r1["bar"] == 2 and r1["droite"] and not r1["tb"] and r2["n"] == 2 and r2["bar"] == 2 and r2["droite"]), (r1, r2))
        for app, code in (("badminton", "bad"), ("relais", "rel")):
            await p.goto(B + app + "/"); await p.wait_for_timeout(4200)
            r = await p.evaluate("(function(){var I=(window.EPSE_INST||[]).filter(function(x){return x.A.app==='" + code + "'})[0];if(!I)return 'pas d instance';var A=I.A,c=A.classes().filter(function(x){return /D.MO/.test(x.nom)})[0],E=c.eleves[1],G=A.grid(),a=G.criteres[0],b=G.criteres[1];A.setProf(a,E,{d:2,pos:.5});var v1=A.prof(a,E);A.setProf(a,E,{d:0,pos:.5});var v2=A.prof(a,E);A.setDeg(a,E,null);return {t:typeof A.setProf,v1:v1&&v1.d,v2:v2&&v2.d,autre:!!A.prof(b,E),efface:!A.prof(a,E)}})()")
            ok(app + " : « ✓ Reprendre ces degrés » possible (setProf), sans jamais remplacer un degré déjà donné", isinstance(r, dict) and r["t"] == "function" and r["v1"] == 2 and r["v2"] == 2 and not r["autre"] and r["efface"], r)
        for app, code in (("danse", "dan"), ("volley", "vol")):
            await p.goto(B + app + "/"); await p.wait_for_timeout(4200)
            r = await p.evaluate("(function(){try{window.evdan&&evdan();window.evvol&&evvol()}catch(e){}var I=(window.EPSE_INST||[]).filter(function(x){return x.A.app==='" + code + "'})[0];if(!I)return 'pas d instance';var A=I.A,c=A.classes().filter(function(x){return /D.MO/.test(x.nom)})[0],E=c.eleves[0],G=A.grid(),a=G.criteres[0],b=G.criteres[1];A.setProf(a,E,{d:2,pos:.5});var v1=A.prof(a,E);A.setProf(a,E,{d:0,pos:.5});var v2=A.prof(a,E);return {t:typeof A.setProf,v1:v1&&v1.d,v2:v2&&v2.d,autre:!!A.prof(b,E)}})()")
            ok(app + " : setProf pose le degré proposé et ne remplace jamais un degré déjà donné", isinstance(r, dict) and r["t"] == "function" and r["v1"] == 2 and r["v2"] == 2 and not r["autre"], r)
        await b.close()
    print("%d / %d" % (sum(1 for o in out if o[1]), len(out))); print("erreurs de page :", errs or "aucune")
    return all(o[1] for o in out) and not errs
try: good = asyncio.run(main())
finally: srv.terminate()
sys.exit(0 if good else 1)
